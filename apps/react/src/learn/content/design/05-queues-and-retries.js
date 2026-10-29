// System design · lesson 5. This lesson sets lang: 'js' so it can include small runnable tasks.
export default {
  id: 'queues-and-retries',
  lang: 'js',
  builds: ['js/loops', 'js/functions', 'node/async-await', 'dsa/stacks-and-queues'],
  title: 'Queues, workers, retries and idempotency',
  goal: 'Move slow or flaky work out of the request, retry it safely with backoff, and make sure a retry never does the work twice.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'The slow thing inside the request',
      md: `
A contact form saves the message and emails the team. The obvious version does both inside the request:

~~~
[ Browser ] --> [ API ] --save--> [ DB ]
                   |
                   +--send email--> [ Email provider ]
                                    (slow, can fail)
[ Browser ] <-- "Thanks!" only after the email is sent
~~~

Two problems:

- The visitor waits for the email provider, which can take seconds.
- If the provider is down, the request fails, even though the message was saved.

The fix: the API does the **quick, essential** part (validate and save), writes a note saying "send this email" onto a **queue**, and answers straight away. A separate **worker** program takes notes off the queue and does the slow part.

~~~
[ API ] --save--> [ DB ]
   |
   +--add job--> [ Queue ] - - -> [ Worker ] --> [ Email provider ]
[ Browser ] <-- 202 "Thanks!" (right away)
~~~
`,
    },
    {
      type: 'read',
      title: 'Producers, queue, consumers',
      md: `
- The **producer** puts jobs on the queue (here, the API).
- The **queue** holds them safely until someone takes them (Amazon SQS, RabbitMQ, or a Redis-backed job library).
- The **consumer**, or worker, takes jobs off and does them.

A queue is the array from JavaScript lesson 5, used in one particular way: add at the back with \`push\`, take from the front with \`shift\`. First in, first out (**FIFO**).

~~~js
const queue = [];

// producer: the API handles three form submissions
queue.push({ type: "email", to: "team@example.com", id: 1 });
queue.push({ type: "email", to: "team@example.com", id: 2 });
queue.push({ type: "email", to: "team@example.com", id: 3 });

// consumer: the worker drains the queue
while (queue.length > 0) {
  const job = queue.shift();
  console.log("worker sends email for message", job.id);
}
~~~

Because producer and consumer only share the queue, you can run **more workers** when the queue gets long, and a traffic spike just makes the queue longer for a while instead of overloading the email provider. That's called **load leveling**.
`,
    },
    {
      type: 'predict',
      title: 'Two producers, one worker',
      code: `const queue = [];
queue.push("a1");
queue.push("b1");
const first = queue.shift();
queue.push("a2");
console.log(first);
console.log(queue);`,
      output: `a1
[ "b1", "a2" ]`,
      explain: `
\`shift\` takes from the **front**, so the worker gets \`"a1"\`, the oldest job. New jobs join at the back.

Real queues are only roughly FIFO. Amazon SQS standard queues, for example, don't promise strict order; SQS FIFO queues do, at a lower throughput. If order matters, say so in the design and pick accordingly.
`,
    },
    {
      type: 'read',
      title: 'Jobs fail, so jobs get retried',
      md: `
What if the worker crashes halfway through a job? Real queues don't delete a job when a worker takes it. They hide it for a while (SQS calls this the **visibility timeout**), and the worker deletes it only when it has **finished**. If the worker dies first, the job reappears and another worker tries again.

That gives you **at-least-once delivery**: every job is done at least once, and occasionally **more than once**. Keep that in mind, because it comes back at the end of this lesson.

When the email provider is down, retrying immediately just hammers a service that's already struggling. Instead you wait, and wait longer each time: **exponential backoff**.

~~~
attempt 0: wait base           100 ms
attempt 1: wait base * 2       200 ms
attempt 2: wait base * 4       400 ms
attempt 3: wait base * 8       800 ms
... up to a cap, say 30 s
~~~

The formula is \`Math.min(cap, base * 2 ** attempt)\`.
`,
    },
    {
      type: 'task',
      title: 'backoffDelay',
      md: `
Write \`backoffDelay(attempt, base, cap)\` that returns \`base * 2 ** attempt\`, but never more than \`cap\`.

~~~
backoffDelay(0, 100, 2000)  → 100
backoffDelay(3, 100, 2000)  → 800
backoffDelay(10, 100, 2000) → 2000   (102,400 is over the cap)
~~~
`,
      starter: `function backoffDelay(attempt, base, cap) {
  return base * 2 ** attempt;
}
`,
      tests: [
        { name: 'attempt 0 waits the base delay', code: `eq(backoffDelay(0, 100, 2000), 100);` },
        { name: 'attempt 3 waits 8 times the base', code: `eq(backoffDelay(3, 100, 2000), 800);` },
        { name: 'a big attempt is capped', code: `eq(backoffDelay(10, 100, 2000), 2000);` },
      ],
      hint: 'Wrap the existing expression: `Math.min(cap, ...)`.',
      solution: `function backoffDelay(attempt, base, cap) {
  return Math.min(cap, base * 2 ** attempt);
}
`,
    },
    {
      type: 'predict',
      title: 'Why add jitter?',
      md: 'A server restarts, and 1,000 clients all lost their connection at the same moment. Each retries with plain backoff.',
      code: `const delays = [];
for (let attempt = 0; attempt < 4; attempt++) {
  delays.push(Math.min(30000, 1000 * 2 ** attempt));
}
console.log(delays);
console.log("clients retrying at each of those moments:", 1000);`,
      output: `[ 1000, 2000, 4000, 8000 ]
clients retrying at each of those moments: 1000`,
      explain: `
Every client computes the **same** delays, so all 1,000 retry at exactly 1 s, then 2 s, then 4 s. Each retry is a spike that can knock the server over again.

The fix is **jitter**: pick a random delay between 0 and the backoff value, \`Math.random() * backoffDelay(...)\`. The retries spread out across the window instead of landing together. Say "exponential backoff **with jitter**" in interviews; the jitter is the part people forget.
`,
    },
    {
      type: 'task',
      title: 'retry',
      md: `
Write an \`async\` function \`retry(fn, maxAttempts)\`:

- Call \`await fn()\`. If it succeeds, return its result.
- If it throws, try again, up to \`maxAttempts\` calls in total.
- If every attempt throws, throw the **last** error.

To keep the tests fast, don't wait between attempts here.

~~~
// fn fails twice, then returns "ok"
await retry(fn, 5)  → "ok"     (fn was called 3 times)
await retry(fn, 2)  → throws   (fn was called 2 times)
~~~
`,
      starter: `async function retry(fn, maxAttempts) {
  return await fn();
}
`,
      tests: [
        {
          name: 'fails twice, then succeeds on the third call',
          code: `let calls = 0;
const fn = async () => { calls++; if (calls < 3) throw new Error("down"); return "ok"; };
eq(await retry(fn, 5), "ok");
eq(calls, 3);`,
        },
        {
          name: 'gives up after maxAttempts and throws',
          code: `let calls = 0;
const fn = async () => { calls++; throw new Error("down " + calls); };
await rejects(retry(fn, 2));
eq(calls, 2);`,
        },
        {
          name: 'a first-time success calls fn once',
          code: `let calls = 0;
eq(await retry(async () => { calls++; return 7; }, 3), 7);
eq(calls, 1);`,
        },
      ],
      hint: 'Loop `for (let attempt = 1; attempt <= maxAttempts; attempt++)`. Inside, `try { return await fn(); } catch (err) { lastError = err; }`. After the loop, `throw lastError;`.',
      solution: `async function retry(fn, maxAttempts) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(); // success ends the loop and the function
    } catch (err) {
      lastError = err; // remember it and try again
    }
  }
  throw lastError;
}
`,
      explain: 'In real code you\'d `await sleep(backoffDelay(...))` inside the `catch` before trying again, with jitter.',
    },
    {
      type: 'read',
      title: 'Dead-letter queues',
      md: `
Some jobs will **never** succeed: a malformed email address, a bug in the worker. Retrying forever wastes effort and can block other jobs.

So after a set number of attempts, the job moves to a **dead-letter queue** (DLQ): a separate queue nobody processes automatically.

~~~
[ Queue ] --> [ Worker ] --fails 5 times--> [ Dead-letter queue ]
                                                  |
                                       alert, then a person looks
~~~

- Nothing is lost: the job and its error are kept.
- Healthy jobs keep flowing.
- You **alert** when the DLQ isn't empty, fix the cause, then replay the jobs.

SQS supports this directly with a "redrive policy" that sets the maximum receive count.
`,
    },
    {
      type: 'read',
      title: 'Idempotency: safe to do twice',
      md: `
Back to **at-least-once**. Picture this:

1. The worker calls the email provider. The email **is sent**.
2. The worker crashes before it can mark the job done.
3. The job reappears. Another worker sends the email **again**.

Retries are safe only when doing the job twice has the same effect as doing it once. That property is called **idempotent**.

- "Set the status to paid" is idempotent: twice is the same as once.
- "Send an email" or "charge the card" is not.

The standard fix is an **idempotency key**: a unique id for the job (or the request). Before doing the work, check whether that key has already been done. If it has, skip the work.

~~~
job { idempotencyKey: "welcome-email:user-42", ... }

worker: seen "welcome-email:user-42" before?
  yes -> skip
  no  -> send, then record the key
~~~

Payment APIs like Stripe accept an \`Idempotency-Key\` header for exactly this reason: a client that retries after a timeout won't charge twice.
`,
    },
    {
      type: 'predict',
      title: 'The duplicate email',
      code: `let emailsSent = 0;
function sendWelcome(job) { emailsSent++; }

const job = { userId: 42 };
sendWelcome(job);   // first delivery
sendWelcome(job);   // the queue redelivers after a crash
console.log("emails sent:", emailsSent);`,
      output: `emails sent: 2`,
      explain: `
Nothing stops the second delivery from doing the work again. With an at-least-once queue, this **will** happen eventually, so the worker has to defend against it. Your next task adds that defense.
`,
    },
    {
      type: 'task',
      title: 'Process each key once',
      md: `
Write \`processOnce(key, done, work)\`:

- \`done\` is a \`Set\` of keys already processed.
- If \`done\` has \`key\`, return \`false\` and **don't** call \`work\`.
- Otherwise call \`work()\`, add \`key\` to \`done\`, and return \`true\`.

~~~
const done = new Set();
processOnce("email:42", done, send)  → true   (send called)
processOnce("email:42", done, send)  → false  (send not called again)
~~~
`,
      starter: `function processOnce(key, done, work) {
  work();
  return true;
}
`,
      tests: [
        { name: 'the first time, work runs and it returns true', code: `let n = 0; const done = new Set(); eq(processOnce("k", done, () => n++), true); eq(n, 1);` },
        { name: 'the same key twice runs the work once', code: `let n = 0; const done = new Set(); processOnce("k", done, () => n++); eq(processOnce("k", done, () => n++), false); eq(n, 1);` },
        { name: 'different keys both run', code: `let n = 0; const done = new Set(); processOnce("a", done, () => n++); processOnce("b", done, () => n++); eq(n, 2);` },
      ],
      hint: 'Start with `if (done.has(key)) return false;`. Then do the work and `done.add(key)`.',
      solution: `function processOnce(key, done, work) {
  if (done.has(key)) return false; // already handled: skip
  work();
  done.add(key);
  return true;
}
`,
      explain: `
In production, \`done\` is a database table with a **unique** constraint on the key, not a Set in memory. Then two workers racing on the same key can't both record it.

There's still a small gap: a crash after \`work()\` and before \`done.add\` means the work can run twice. You make that gap as small as you can (or pass the key to the provider, as Stripe allows), but you can't close it completely.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'Why put sending an email on a queue instead of doing it in the request?',
          choices: ['The user doesn\'t wait on a slow, flaky provider, and failures can be retried later', 'Queues make emails arrive faster', 'Email providers only accept requests from queues'],
          answer: 0,
          explain: 'The request does the quick essential part and returns; the worker handles the slow, failure-prone part.',
          why: { 1: 'The email usually arrives a little later, not sooner.', 2: 'Providers accept normal API calls; the queue is for your reliability.' },
        },
        {
          q: 'What does at-least-once delivery mean for your worker?',
          choices: ['A job can occasionally be processed more than once, so it must be idempotent', 'Every job is processed exactly once', 'Some jobs may be skipped'],
          answer: 0,
          explain: 'A crash before the job is marked done makes it reappear, so workers must tolerate duplicates.',
          why: { 1: 'Exactly-once is not what at-least-once queues promise.', 2: 'At-least-once means none are skipped; some may repeat.' },
        },
        {
          q: 'Which retry policy is safest when calling a struggling service?',
          choices: ['Exponential backoff with jitter and a maximum number of attempts', 'Retry immediately until it works', 'Retry every 1 second forever'],
          answer: 0,
          explain: 'Growing, randomized waits give the service room to recover, and the cap stops endless retries.',
          why: { 1: 'Immediate retries pile more load on a service that\'s already failing.', 2: 'A fixed interval synchronizes clients and never gives up.' },
        },
        {
          q: 'A job has failed 5 times because its data is malformed. Where should it go?',
          choices: ['A dead-letter queue, with an alert', 'Back on the main queue forever', 'Deleted silently'],
          answer: 0,
          explain: 'The DLQ keeps the job for a person to inspect without blocking healthy jobs.',
          why: { 1: 'It will never succeed and wastes worker time.', 2: 'Silently deleting loses data and hides the bug.' },
        },
        {
          q: 'Which operation is naturally idempotent?',
          choices: ['Set order 7\'s status to "shipped"', 'Charge the customer\'s card', 'Add 1 to a page-view counter'],
          answer: 0,
          explain: 'Setting a value to the same thing twice leaves the same result.',
          why: { 1: 'Running it twice charges twice.', 2: 'Running it twice counts twice.' },
        },
      ],
    },
  ],
};
