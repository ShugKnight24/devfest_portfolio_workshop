// Challenges · lesson 5. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'retry-with-backoff',
  builds: ['challenges/debounce-and-throttle', 'js/loops', 'js/functions', 'js/promises-and-async'],
  title: 'Retry with backoff: async in a loop',
  goal: 'Use async/await with try/catch inside a loop to retry a flaky call, wait longer each time, and give up on errors that will never succeed.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The question',
      md: `
> "Our payment provider's API fails now and then with a timeout. Write \`retry(fn, attempts)\`. \`fn\` is an async function. Call it; if it fails, try again, up to \`attempts\` tries in total. Return the first success. If every try fails, throw the last error."

~~~
let calls = 0;
const flaky = async () => {
  calls++;
  if (calls < 3) throw new Error("timeout");
  return "paid";
};

await retry(flaky, 5)   → "paid"   (failed twice, worked on try 3)
await retry(flaky, 2)   → throws "timeout"
~~~

Then the usual follow-ups: **wait** between tries, wait **longer** each time (backoff), and **don't** retry errors that can't succeed. This reuses the timer from the last lesson, wrapped in a promise so you can \`await\` it.
`,
    },
    {
      type: 'check',
      title: 'Before you code: ask and spot',
      items: [
        {
          q: '`retry(fn, 3)`: does 3 mean three tries in total, or the first try plus three retries?',
          choices: [
            'Ask: it\'s a classic off-by-one, and both readings exist in real libraries',
            'Always three retries',
            'It doesn\'t matter',
          ],
          answer: 0,
          explain: 'In this lesson, `attempts` means tries in total. Saying the ambiguity out loud is exactly what interviewers want to hear.',
          why: {
            1: 'Some libraries count retries, some count attempts. Don\'t assume.',
            2: 'It changes how many times a payment is attempted, so it matters.',
          },
        },
        {
          q: 'Every try failed. What should `retry` do?',
          choices: [
            'Throw the last error, so the caller sees why',
            'Return `undefined`',
            'Return the string "failed"',
          ],
          answer: 0,
          explain: 'A failure should stay a failure. Swallowing it makes the caller think it worked.',
          why: {
            1: 'The caller can\'t tell "failed" from "succeeded with nothing".',
            2: 'Mixing error strings with real results forces every caller to check for a magic value.',
          },
        },
        {
          q: 'Which question shows you\'re thinking about what\'s safe to retry?',
          choices: [
            '"Is the operation safe to repeat? If the first payment actually went through, a retry could charge twice."',
            '"Should I name the variable attempt or tries?"',
            '"Can I retry forever?"',
          ],
          answer: 0,
          explain: 'Repeatable-without-harm is called **idempotent**. It\'s the first thing a senior engineer asks about retries.',
          why: {
            1: 'Naming is yours to decide.',
            2: 'Retrying forever can hang a request and hammer a struggling server.',
          },
        },
      ],
    },
    {
      type: 'read',
      title: 'async, await and try/catch',
      md: `
An \`async\` function always returns a **promise**. \`await\` pauses until that promise settles, then gives you the value, or **throws** the error. Because it throws, a normal \`try/catch\` catches it:

~~~js
async function flaky() {
  throw new Error("timeout");
}

try {
  await flaky();
  console.log("never printed");
} catch (err) {
  console.log("caught:", err.message);
}
console.log("carries on");
~~~

To **wait** inside async code, wrap \`setTimeout\` in a promise. This one-liner is in nearly every codebase:

~~~js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const start = Date.now();
await wait(50);
console.log("waited about", Math.round((Date.now() - start) / 10) * 10, "ms");
~~~

\`new Promise\` hands you a \`resolve\` function. Calling it (here, when the timer fires) is what lets \`await\` continue.
`,
    },
    {
      type: 'predict',
      title: 'return inside try inside a loop',
      md: 'Read it like a loop from JavaScript lesson 6, with a try/catch inside.',
      code: `let calls = 0;
const flaky = async () => {
  calls++;
  if (calls < 3) throw new Error("fail " + calls);
  return "ok";
};

for (let i = 0; i < 5; i++) {
  try {
    const value = await flaky();
    console.log("got", value, "on try", i + 1);
    break;
  } catch (err) {
    console.log("caught", err.message);
  }
}`,
      output: `caught fail 1
caught fail 2
got ok on try 3`,
      explain: `
Tries 1 and 2 throw, so the \`catch\` runs and the loop moves on. Try 3 succeeds and \`break\` leaves the loop.

That's the whole shape of \`retry\`: a loop, a \`try\` that returns on success, a \`catch\` that remembers the error and lets the loop continue.
`,
    },
    {
      type: 'read',
      title: 'The plan',
      md: `
**Brute force** is copy-paste: \`try { return await fn() } catch { try { return await fn() } catch { ... } }\`. It doesn't scale past two tries, and the count is baked into the code. Say that, then go to the loop.

The plan:

1. Keep \`let lastError;\`.
2. Loop \`attempts\` times.
3. Inside, \`try { return await fn(); }\`. A successful \`return\` leaves both the loop and the function.
4. \`catch (err) { lastError = err; }\` and let the loop continue.
5. After the loop, every try failed: \`throw lastError;\`.

~~~
attempt 1  fn() throws "timeout"   lastError = timeout
attempt 2  fn() throws "timeout"   lastError = timeout
attempt 3  fn() returns "paid"     return "paid"
~~~
`,
    },
    {
      type: 'task',
      title: 'Part 1: retry',
      md: `
Write \`async function retry(fn, attempts)\`. Call \`await fn()\` up to \`attempts\` times. Return the first successful value. If every try fails, throw the **last** error.

~~~
await retry(async () => 42, 3)               → 42  (one call)
await retry(failsTwiceThenReturns("ok"), 3)  → "ok"
await retry(alwaysFails, 3)                  → throws the third error
~~~
`,
      starter: `async function retry(fn, attempts) {
  // your code here
}
`,
      tests: [
        {
          name: 'returns right away when the first try works',
          code: `let calls = 0;
const value = await retry(async () => { calls++; return 42; }, 3);
eq(value, 42); eq(calls, 1);`,
        },
        {
          name: 'keeps trying until it works',
          code: `let calls = 0;
const flaky = async () => { calls++; if (calls < 3) throw new Error("timeout"); return "paid"; };
eq(await retry(flaky, 5), "paid"); eq(calls, 3);`,
        },
        {
          name: 'stops after attempts tries and throws the last error',
          code: `let calls = 0;
const broken = async () => { calls++; throw new Error("fail " + calls); };
let msg = "did not throw";
try { await retry(broken, 3); } catch (e) { msg = e.message; }
eq(msg, "fail 3"); eq(calls, 3);`,
        },
      ],
      hint: 'Use `for (let i = 0; i < attempts; i++)`. Inside: `try { return await fn(); } catch (err) { lastError = err; }`. After the loop: `throw lastError;`.',
      solution: `async function retry(fn, attempts) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();       // success leaves the loop and the function
    } catch (err) {
      lastError = err;         // remember it, then try again
    }
  }
  throw lastError;             // every try failed
}
`,
      explain: 'The `await` in `return await fn()` matters here. Without it, the function returns the promise before it settles, so its rejection never reaches this `catch`.',
    },
    {
      type: 'read',
      title: 'Backoff: wait longer each time',
      md: `
Retrying instantly often fails again: a server that's overloaded right now is still overloaded 1ms later. And if a thousand clients all retry instantly, they make it worse.

**Exponential backoff** doubles the wait after each failure:

| failed try | wait before the next try (base 100ms) |
|---|---|
| 1 | 100ms |
| 2 | 200ms |
| 3 | 400ms |
| 4 (last) | no wait: throw |

The formula is \`baseMs * 2 ** i\`, where \`i\` is 0 for the first failure. \`2 ** i\` means "2 to the power of i".

~~~js
const baseMs = 100;
for (let i = 0; i < 4; i++) console.log("after failure", i + 1, "wait", baseMs * 2 ** i);
~~~

One detail: **don't wait after the last failure.** Nobody is going to try again, so waiting only makes the caller slower to hear the bad news.
`,
    },
    {
      type: 'task',
      title: 'Part 2: retryWithBackoff',
      md: `
Write \`retryWithBackoff(fn, attempts, baseMs)\`. It's \`retry\`, plus: after a failed try that **isn't the last**, \`await wait(baseMs * 2 ** i)\`.

~~~
attempts 3, baseMs 10, always failing:
  try 1 fails → wait 10ms → try 2 fails → wait 20ms → try 3 fails → throw
~~~

\`wait\` is already in the editor.
`,
      starter: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryWithBackoff(fn, attempts, baseMs) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // your code here: wait, unless this was the last try
    }
  }
  throw lastError;
}
`,
      tests: [
        {
          name: 'still returns the first success',
          code: `let calls = 0;
const flaky = async () => { calls++; if (calls < 2) throw new Error("x"); return "ok"; };
eq(await retryWithBackoff(flaky, 3, 5), "ok");`,
        },
        {
          name: 'waits about 10ms, then about 20ms, between tries',
          code: `const times = [];
const broken = async () => { times.push(Date.now()); throw new Error("x"); };
try { await retryWithBackoff(broken, 3, 10); } catch (e) {}
const gap1 = times[1] - times[0];
const gap2 = times[2] - times[1];
assert(gap1 >= 8, "first wait was " + gap1 + "ms, expected about 10");
assert(gap2 >= 18, "second wait was " + gap2 + "ms, expected about 20 (double the first)");`,
        },
        {
          name: 'does not wait after the last failure',
          code: `const start = Date.now();
try { await retryWithBackoff(async () => { throw new Error("x"); }, 2, 40); } catch (e) {}
const total = Date.now() - start;
assert(total < 70, "took " + total + "ms: expected one 40ms wait, not two");`,
        },
      ],
      hint: 'In the `catch`, after `lastError = err;`, add `if (i < attempts - 1) await wait(baseMs * 2 ** i);`.',
      solution: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryWithBackoff(fn, attempts, baseMs) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await wait(baseMs * 2 ** i); // 1x, 2x, 4x... but not after the last try
    }
  }
  throw lastError;
}
`,
    },
    {
      type: 'task',
      title: 'Part 3: only retry what can succeed',
      md: `
> "A 404 Not Found will never succeed on retry. Only retry errors that might be temporary."

Add a fourth parameter, \`shouldRetry\`, a function that gets the error and returns \`true\` or \`false\`. It defaults to "always retry". When it returns \`false\`, **throw that error right away**: no more tries, no wait.

~~~
const isTemporary = (err) => err.status >= 500;

404 error  → thrown after 1 try
503 error  → retried as before
~~~
`,
      starter: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryWithBackoff(fn, attempts, baseMs, shouldRetry = () => true) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // your code here: give up right away if shouldRetry(err) is false
      if (i < attempts - 1) await wait(baseMs * 2 ** i);
    }
  }
  throw lastError;
}
`,
      tests: [
        {
          name: 'a 404 is thrown after one try',
          code: `let calls = 0;
const notFound = async () => { calls++; const e = new Error("not found"); e.status = 404; throw e; };
let msg = "did not throw";
try { await retryWithBackoff(notFound, 3, 5, (e) => e.status >= 500); } catch (e) { msg = e.message; }
eq(msg, "not found"); eq(calls, 1, "number of tries");`,
        },
        {
          name: 'a 503 is still retried',
          code: `let calls = 0;
const busy = async () => { calls++; if (calls < 3) { const e = new Error("busy"); e.status = 503; throw e; } return "ok"; };
eq(await retryWithBackoff(busy, 3, 5, (e) => e.status >= 500), "ok"); eq(calls, 3);`,
        },
        {
          name: 'without shouldRetry, every error is retried',
          code: `let calls = 0;
const broken = async () => { calls++; throw new Error("x"); };
try { await retryWithBackoff(broken, 3, 1); } catch (e) {}
eq(calls, 3);`,
        },
      ],
      hint: 'Right after `lastError = err;`, add `if (!shouldRetry(err)) throw err;`.',
      solution: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryWithBackoff(fn, attempts, baseMs, shouldRetry = () => true) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!shouldRetry(err)) throw err;                    // permanent: give up now
      if (i < attempts - 1) await wait(baseMs * 2 ** i);
    }
  }
  throw lastError;
}
`,
      explain: 'Throwing inside a `catch` is fine: it leaves the loop and rejects the async function\'s promise, which is what the caller wants.',
    },
    {
      type: 'read',
      title: 'Walkthrough: the full solution',
      md: `
Trace \`retryWithBackoff(fn, 4, 100, isTemporary)\` where \`fn\` fails with 503, 503, then returns \`"paid"\`:

| i | time | \`fn()\` | shouldRetry? | then |
|---|---|---|---|---|
| 0 | 0ms | throws 503 | yes | wait 100 |
| 1 | 100ms | throws 503 | yes | wait 200 |
| 2 | 300ms | returns "paid" | | return "paid" |

If it had thrown a 404 at i = 0 instead, \`shouldRetry\` says no and the error is thrown at 0ms.

**Cost:**

| | worst case |
|---|---|
| calls to \`fn\` | \`attempts\` |
| total waiting | base × (2^(attempts−1) − 1), e.g. 100 × 7 = 700ms for 4 tries |
| memory | O(1): one error and a counter |

**Say it:** "A loop with try/catch. Success returns immediately, failure stores the error, checks whether it's worth retrying, and waits base times two to the i before the next try, but not after the last. If every try fails, I throw the last error."
`,
    },
    {
      type: 'check',
      title: 'Follow-up questions',
      items: [
        {
          q: '"A thousand clients all failed at the same moment. With your backoff they all retry at the same moments too." What\'s the fix?',
          choices: [
            'Add random jitter to each wait, e.g. `wait(Math.random() * baseMs * 2 ** i)`',
            'Use a shorter base delay',
            'Retry more times',
          ],
          answer: 0,
          explain: 'Randomness spreads the retries out so they don\'t arrive as one spike (the "thundering herd").',
          why: {
            1: 'Shorter waits keep the spike, just sooner.',
            2: 'More retries means more spikes.',
          },
        },
        {
          q: 'With 10 attempts and base 100ms, the last wait is 100 × 2⁸ = 25.6 seconds. What do real libraries add?',
          choices: [
            'A cap: `Math.min(maxMs, baseMs * 2 ** i)`',
            'Nothing, long waits are fine',
            'They wait less on later tries',
          ],
          answer: 0,
          explain: 'A maximum delay keeps the doubling from growing without limit.',
          why: {
            1: 'A request hanging for minutes is usually worse than a fast failure.',
            2: 'Shrinking waits would hit a struggling server harder.',
          },
        },
        {
          q: 'Which of these is safe to retry without extra care?',
          choices: [
            'GET /products (reading data)',
            'POST /payments with no idempotency key',
            'POST /emails/send',
          ],
          answer: 0,
          explain: 'Reads don\'t change anything, so repeating them is harmless. Payments use an **idempotency key** so the server can spot a repeat and skip it.',
          why: {
            1: 'If the first request went through but the response was lost, a retry charges twice.',
            2: 'A retry could send the same email twice.',
          },
        },
        {
          q: 'What happens if you write `return fn();` instead of `return await fn();` inside the `try`?',
          choices: [
            'A rejection skips this `catch`, so failures are never retried',
            'Nothing changes',
            'It retries forever',
          ],
          answer: 0,
          explain: 'Without `await`, the function returns the promise immediately, and the rejection happens later, outside the `try`.',
          why: {
            1: 'Inside a `try`, `return await` and `return` behave differently. This is the case where it matters.',
            2: 'It tries once and passes the rejection straight to the caller.',
          },
        },
      ],
    },
  ],
};
