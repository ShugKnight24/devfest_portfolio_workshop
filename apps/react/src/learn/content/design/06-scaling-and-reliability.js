// System design · lesson 6. This lesson sets lang: 'js' so it can include small runnable tasks.
export default {
  id: 'scaling-and-reliability',
  lang: 'js',
  builds: ['js/objects', 'js/conditionals', 'design/databases', 'design/caching'],
  title: 'Scaling and reliability: rate limits, CAP and quick estimates',
  goal: 'Scale out with stateless servers, protect an API with a rate limiter, explain CAP in plain words, and do back-of-envelope math.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Scale out, keep state out',
      md: `
Lesson 2 put several servers behind a load balancer and found the catch: a server that keeps data in its own memory breaks when the next request lands on a different server.

The rule for scaling out is: **servers hold no state that matters between requests.** Anything that must be shared lives somewhere every server can reach:

| State | Where it goes |
|---|---|
| Records | the database (lesson 3) |
| Sessions, counters, hot data | a shared cache like Redis (lesson 4) |
| Slow work waiting to happen | a queue (lesson 5) |
| Uploaded files | object storage like S3 |

Then servers are interchangeable. Add more when busy, remove some when quiet (**autoscaling**), and lose one without losing data.

This lesson applies the same rule to a new problem, rate limiting, and then covers two thinking tools every design uses: CAP and quick estimates.
`,
    },
    {
      type: 'predict',
      title: 'Two servers, two counters',
      md: 'Each server counts a user\'s requests in its own memory. The limit is 3 per minute.',
      code: `const serverA = new Map();
const serverB = new Map();
const hits = [serverA, serverB, serverA, serverB, serverA, serverB];

// the load balancer alternates: A, B, A, B...
for (const server of hits) {
  const n = server.get("user42") || 0;
  server.set("user42", n + 1);
}
console.log("A counted", serverA.get("user42"));
console.log("B counted", serverB.get("user42"));
console.log("real total", hits.length);`,
      output: `A counted 3
B counted 3
real total 6`,
      explain: `
Each server sees only its half, so each thinks the user is within the limit of 3, while the user actually made 6 requests. With 10 servers, a user could make 10 times the limit.

The counter is **state**, so it moves to a shared store. Redis is the usual choice, because its \`INCR\` command increments a key atomically: two servers incrementing at once can't lose a count.
`,
    },
    {
      type: 'read',
      title: 'Rate limiting: the fixed window',
      md: `
A **rate limiter** caps how many requests a client can make, to protect the service from abuse, runaway scripts, and one customer starving the others. Over the limit, the API answers **429 Too Many Requests**, ideally with a \`Retry-After\` header saying how many seconds to wait.

The simplest algorithm is the **fixed window**: count requests per user per minute, and start a fresh count each minute.

The trick is the key. Put the minute number **in** the key, and each minute automatically gets a new counter:

~~~js
const nowMs = 125000;                     // 125 s after time 0
const minute = Math.floor(nowMs / 60000); // which 60 s window
console.log("user42:" + minute);
~~~

In Redis: \`INCR user42:2\`. If the result is 1, this is the first request in that window, so also set \`EXPIRE\` on the key so old windows clean themselves up. (Send the two together in one transaction or script, so a crash between them can't leave a key that never expires.)
`,
    },
    {
      type: 'task',
      title: 'A fixed-window limiter',
      md: `
Write \`allow(counts, userId, nowMs, limit)\`. The key is already built for you.

1. Read the current count for \`key\` from the \`counts\` Map (missing means 0) and add 1.
2. Store the new count.
3. Return \`true\` if the new count is **at most** \`limit\`, else \`false\`.

~~~
const counts = new Map();
allow(counts, "u1", 0, 2)      → true
allow(counts, "u1", 1000, 2)   → true
allow(counts, "u1", 2000, 2)   → false   (third in the same minute)
allow(counts, "u1", 61000, 2)  → true    (a new minute)
~~~
`,
      starter: `function allow(counts, userId, nowMs, limit) {
  const key = userId + ":" + Math.floor(nowMs / 60000);
  // count this request, then decide
  return true;
}
`,
      tests: [
        { name: 'requests up to the limit are allowed', code: `const c = new Map(); eq(allow(c, "u1", 0, 2), true); eq(allow(c, "u1", 1000, 2), true);` },
        { name: 'the request over the limit is refused', code: `const c = new Map(); allow(c, "u1", 0, 2); allow(c, "u1", 1000, 2); eq(allow(c, "u1", 2000, 2), false);` },
        { name: 'a new minute starts a new count', code: `const c = new Map(); allow(c, "u1", 0, 1); eq(allow(c, "u1", 1000, 1), false); eq(allow(c, "u1", 61000, 1), true);` },
        { name: 'each user has their own count', code: `const c = new Map(); allow(c, "u1", 0, 1); eq(allow(c, "u2", 0, 1), true);` },
      ],
      hint: '`const count = (counts.get(key) || 0) + 1;` then `counts.set(key, count);` then `return count <= limit;`',
      solution: `function allow(counts, userId, nowMs, limit) {
  const key = userId + ":" + Math.floor(nowMs / 60000);
  const count = (counts.get(key) || 0) + 1;
  counts.set(key, count);
  return count <= limit;
}
`,
    },
    {
      type: 'predict',
      title: 'The edge of the window',
      md: 'Limit 5 per minute. A client sends 5 requests just before a minute ends and 5 just after.',
      code: `function allow(counts, userId, nowMs, limit) {
  const key = userId + ":" + Math.floor(nowMs / 60000);
  const count = (counts.get(key) || 0) + 1;
  counts.set(key, count);
  return count <= limit;
}

const counts = new Map();
let allowed = 0;
for (let i = 0; i < 5; i++) {
  if (allow(counts, "u1", 59900, 5)) allowed++; // at 59.9 s
}
for (let i = 0; i < 5; i++) {
  if (allow(counts, "u1", 60100, 5)) allowed++; // at 60.1 s
}
console.log("allowed in 0.2 seconds:", allowed);`,
      output: `allowed in 0.2 seconds: 10`,
      explain: `
59.9 s falls in window 0 and 60.1 s in window 1, so each burst gets a fresh count of 5. The client got **twice** the limit in a fifth of a second.

That's the fixed window's known weakness. It's often acceptable. When it isn't, a **sliding window** (count the last 60 seconds from now) or a **token bucket** smooths it out.
`,
    },
    {
      type: 'read',
      title: 'The token bucket',
      md: `
A **token bucket** pictures each client as having a bucket of tokens:

- The bucket holds at most \`capacity\` tokens and starts full.
- Tokens drip back in at \`refillPerSec\`.
- Each request spends one token. No token, no request.

So a client can **burst** up to \`capacity\` requests, and after that is held to the refill rate. AWS API Gateway documents its throttling as a token bucket with a rate and a burst limit.

You don't need a timer to drip tokens in. When a request arrives, work out how much time has passed since the last one and add that many tokens at once:

~~~js
const capacity = 5, refillPerSec = 1;
let tokens = 0, lastMs = 0;

const nowMs = 2500;                                  // 2.5 s later
const seconds = (nowMs - lastMs) / 1000;
tokens = Math.min(capacity, tokens + seconds * refillPerSec);
console.log("tokens after 2.5 s:", tokens);
~~~
`,
    },
    {
      type: 'task',
      title: 'A token bucket',
      md: `
\`refill(nowMs)\` is written for you: it tops up \`this.tokens\` for the time passed. Write \`take(nowMs)\`:

1. Call \`this.refill(nowMs)\`.
2. If \`this.tokens\` is at least 1, subtract 1 and return \`true\`.
3. Otherwise return \`false\`.

~~~
// capacity 2, 1 token a second, created at time 0
const b = new TokenBucket(2, 1, 0);
b.take(0)     → true
b.take(0)     → true
b.take(0)     → false   (empty)
b.take(1000)  → true    (one token dripped back in)
~~~
`,
      starter: `class TokenBucket {
  constructor(capacity, refillPerSec, nowMs) {
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;
    this.tokens = capacity; // start full
    this.lastMs = nowMs;
  }

  refill(nowMs) {
    const seconds = (nowMs - this.lastMs) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + seconds * this.refillPerSec);
    this.lastMs = nowMs;
  }

  take(nowMs) {
    // your code here
  }
}
`,
      tests: [
        { name: 'a full bucket allows a burst up to capacity', code: `const b = new TokenBucket(2, 1, 0); eq(b.take(0), true); eq(b.take(0), true);` },
        { name: 'an empty bucket refuses', code: `const b = new TokenBucket(2, 1, 0); b.take(0); b.take(0); eq(b.take(0), false);` },
        { name: 'tokens come back over time', code: `const b = new TokenBucket(2, 1, 0); b.take(0); b.take(0); eq(b.take(1000), true); eq(b.take(1000), false);` },
        { name: 'the bucket never fills past capacity', code: `const b = new TokenBucket(2, 1, 0); eq(b.take(100000), true); eq(b.take(100000), true); eq(b.take(100000), false);` },
      ],
      hint: 'First line: `this.refill(nowMs);`. Then `if (this.tokens >= 1) { this.tokens -= 1; return true; }` and `return false;` after it.',
      solution: `class TokenBucket {
  constructor(capacity, refillPerSec, nowMs) {
    this.capacity = capacity;
    this.refillPerSec = refillPerSec;
    this.tokens = capacity; // start full
    this.lastMs = nowMs;
  }

  refill(nowMs) {
    const seconds = (nowMs - this.lastMs) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + seconds * this.refillPerSec);
    this.lastMs = nowMs;
  }

  take(nowMs) {
    this.refill(nowMs);
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}
`,
    },
    {
      type: 'read',
      title: 'When the limiter\'s store is down',
      md: `
Your limiter now lives in Redis. What should the API do if Redis stops answering?

- **Fail open:** allow every request. A cache outage doesn't become a full outage, but for a while there's no limit.
- **Fail closed:** refuse every request. Nothing gets past the limit, but every user is locked out.

For most public APIs the usual answer is **fail open, with an alert**, because the limiter protects the service and shouldn't be the thing that takes it down. For something like a login endpoint under attack, failing closed can be the right call. Either way, **say which you chose and why**; that's a trade-off sentence from lesson 1.

The same question applies to every dependency: "if this box is down, what does the rest do?" Asking it is how you show you thought about failure.
`,
    },
    {
      type: 'read',
      title: 'CAP in plain words',
      md: `
Once data is copied across machines (lesson 3's replicas), the network between them can fail. That's a **partition**: some machines can't talk to the others.

During a partition, a machine that gets a request has two choices:

- **Answer anyway**, with data that may be out of date. That's choosing **availability** (A).
- **Refuse** until it can confirm it has the latest data. That's choosing **consistency** (C).

That's the CAP theorem: when a **P**artition happens, you pick **C** or **A**. You can't drop P, because networks do fail.

~~~
seat booking:  refuse rather than sell one seat twice   -> C
social likes:  show a slightly old count, keep working  -> A
~~~

In an interview, don't recite the theorem. Apply it: "For payments I'd rather fail a request than double-charge, so I'd choose consistency there. For the feed, a few seconds of staleness is fine."
`,
    },
    {
      type: 'predict',
      title: 'Nines in a row',
      md: 'A request passes through three services, one after another. Each is up 99.9% of the time.',
      code: `const each = 0.999;
const all = each * each * each;
console.log((all * 100).toFixed(2) + "%");`,
      output: `99.70%`,
      explain: `
A request succeeds only if **all three** are up, so you multiply. Three 99.9% services in a row give about 99.7%. That's roughly three times the downtime of any one of them.

So every box you add in a chain lowers availability. That's one more reason to justify each box, and a reason to use queues: a service behind a queue can be down for a minute without failing the user's request.
`,
    },
    {
      type: 'read',
      title: 'Back-of-envelope numbers',
      md: `
Interviewers like a quick estimate, not for precision, but to see which resource matters most. One fact does most of the work: **a day has 86,400 seconds**, about 100,000 if you round.

~~~js
const requestsPerDay = 100_000_000; // assumption: 100M a day
const avg = requestsPerDay / 86400;
console.log("average per second:", Math.round(avg));
console.log("peak, assuming 3x average:", Math.round(avg * 3));
~~~

The method:

1. Users per day × actions each = actions per day.
2. Divide by 86,400 for the **average per second**. Multiply by a peak factor; 2 to 5 times is a common assumption, so say which one you used.
3. Size per action × actions per day = storage per day. Multiply by 365, then by the number of copies you keep.

Then **say what the number means**: "About 3,500 requests a second at peak. A handful of API servers handles that, so the database is what I'd watch."

Always label these as estimates and state the assumptions.
`,
    },
    {
      type: 'task',
      title: 'peakPerSecond',
      md: `
Write \`peakPerSecond(perDay, peakFactor)\`: divide \`perDay\` by 86,400 seconds, multiply by \`peakFactor\`, and round with \`Math.round\`.

~~~
peakPerSecond(86400, 1)         → 1
peakPerSecond(1_000_000, 3)     → 35
peakPerSecond(100_000_000, 3)   → 3472
~~~
`,
      starter: `function peakPerSecond(perDay, peakFactor) {
  return perDay / 86400;
}
`,
      tests: [
        { name: '86,400 a day is 1 a second', code: `eq(peakPerSecond(86400, 1), 1);` },
        { name: 'one million a day at 3x peak is about 35 a second', code: `eq(peakPerSecond(1_000_000, 3), 35);` },
        { name: '100 million a day at 3x peak is about 3,472 a second', code: `eq(peakPerSecond(100_000_000, 3), 3472);` },
      ],
      hint: '`Math.round(perDay / 86400 * peakFactor)`',
      solution: `function peakPerSecond(perDay, peakFactor) {
  return Math.round((perDay / 86400) * peakFactor);
}
`,
      explain: 'Handy to remember: one million a day is about 12 a second on average. Scale from there in your head.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'Why does a rate limiter need a shared store like Redis when there are several API servers?',
          choices: ['Each server only sees its own share of a user\'s requests', 'Redis is the only database that can count', 'Load balancers block repeat requests'],
          answer: 0,
          explain: 'One shared counter gives one true count across all servers.',
          why: { 1: 'Any shared store with atomic increments would work; Redis is just fast and common.', 2: 'Load balancers spread requests; they don\'t count them per user.' },
        },
        {
          q: 'What status code should a rate-limited request get?',
          choices: ['429 Too Many Requests', '403 Forbidden', '500 Internal Server Error'],
          answer: 0,
          explain: '429, ideally with a Retry-After header, tells the client to slow down and when to try again.',
          why: { 1: '403 means not allowed at all, not "too many".', 2: 'Nothing broke on the server.' },
        },
        {
          q: 'What is the known weakness of a fixed-window limiter?',
          choices: ['A burst at the edge of two windows can allow up to twice the limit', 'It can\'t tell users apart', 'It needs a timer per user'],
          answer: 0,
          explain: 'The count resets at the window boundary, so bursts on either side both pass.',
          why: { 1: 'The user id is part of the key.', 2: 'The window number in the key does the work; no timers needed.' },
        },
        {
          q: 'During a network partition, a booking system refuses to sell seats on the side that can\'t reach the primary. Which did it choose?',
          choices: ['Consistency', 'Availability', 'Partition tolerance instead of both'],
          answer: 0,
          explain: 'It refuses rather than risk selling the same seat twice.',
          why: { 1: 'Choosing availability would keep selling, risking double bookings.', 2: 'Partitions happen regardless; the choice is between C and A.' },
        },
        {
          q: 'Roughly how many requests per second, on average, is 1 million requests per day?',
          choices: ['About 12', 'About 1,200', 'About 120'],
          answer: 0,
          explain: '1,000,000 / 86,400 is about 11.6.',
          why: { 1: 'That would be about 100 million a day.', 2: 'That would be about 10 million a day.' },
        },
      ],
    },
  ],
};
