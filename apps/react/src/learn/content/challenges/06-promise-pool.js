// Challenges · lesson 6. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'promise-pool',
  builds: ['challenges/retry-with-backoff', 'js/loops', 'node/async-await'],
  title: 'Promise pool: N at a time',
  goal: 'Run async tasks one at a time, all at once, and finally at most N at a time, keeping results in the original order.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The question',
      md: `
> "We need to fetch 500 product pages. Firing all 500 requests at once gets us rate-limited. Write \`runWithLimit(tasks, limit)\`: run the tasks with at most \`limit\` in flight at a time, and return the results **in the same order as the tasks**."

~~~
const tasks = [
  () => fetchPage(1),    // each task is a function that returns a promise
  () => fetchPage(2),
  () => fetchPage(3),
];

await runWithLimit(tasks, 2)   → [page1, page2, page3]
~~~

This lesson builds on the last one: \`await\` inside a loop. And it's Part 3 of the finale (the package installer) in miniature, so it's worth getting comfortable here.
`,
    },
    {
      type: 'check',
      title: 'Before you code: ask and spot',
      items: [
        {
          q: 'Why is each task a **function** that returns a promise, instead of a promise?',
          choices: [
            'A promise has already started its work. A function lets you choose when it starts.',
            'Functions are faster than promises',
            'Promises can\'t be stored in arrays',
          ],
          answer: 0,
          explain: 'Calling `fetchPage(1)` starts the request on the spot. If you were handed 500 promises, all 500 requests would already be running and the limit would be pointless.',
          why: {
            1: 'Speed isn\'t the point. Control over the start time is.',
            2: 'They can. But by then they\'re already running.',
          },
        },
        {
          q: 'Task 2 finishes before task 1. Where does its result go?',
          choices: ['At index 1, matching its task', 'At index 0, because it finished first', 'At the end'],
          answer: 0,
          explain: 'Results match the input order, like `Promise.all`. Confirm it, though: some callers want completion order.',
          why: {
            1: 'That\'s completion order. The question asked for task order.',
            2: 'Positions are fixed by the task list, not by finishing time.',
          },
        },
        {
          q: 'Which clarifying question matters most for real use?',
          choices: [
            '"If one task fails, should the whole thing fail, or should I collect the error and keep going?"',
            '"Should limit be called concurrency?"',
            '"Can limit be a string?"',
          ],
          answer: 0,
          explain: 'Fail fast (like `Promise.all`) and collect everything (like `Promise.allSettled`) are both reasonable. Part 3 does the second.',
          why: {
            1: 'Naming is yours.',
            2: 'Validating types is fine to mention, but it doesn\'t change the design.',
          },
        },
      ],
    },
    {
      type: 'predict',
      title: 'Calling a task starts it',
      code: `const started = [];
const makeTask = (name) => () => {
  started.push(name);
  return Promise.resolve(name);
};

const tasks = [makeTask("a"), makeTask("b"), makeTask("c")];
console.log(started);

const first = tasks[0]();
console.log(started);`,
      output: `[]
[ "a" ]`,
      explain: `
Building the array starts nothing: it holds three functions. Only \`tasks[0]()\`, with the \`()\`, runs task a.

That's the lever a pool uses: it decides **when** to put the \`()\` on each task.
`,
    },
    {
      type: 'read',
      title: 'Two easy extremes',
      md: `
**One at a time:** \`await\` inside a \`for\` loop. Safe, but slow: total time is the **sum** of all tasks.

**All at once:** call every task, then \`Promise.all\`. Fast, but no limit: 500 tasks means 500 requests at the same moment.

~~~js
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const slow = async () => { await wait(30); return "slow"; };
const fast = async () => { await wait(5); return "fast"; };

const results = await Promise.all([slow(), fast()]);
console.log(results);   // input order, even though fast finished first
~~~

\`Promise.all\` returns results **in input order** no matter who finishes first, and **rejects** as soon as any one rejects.

A pool sits in between: as fast as \`limit\` allows, never more. Start with the slow, safe extreme.
`,
    },
    {
      type: 'task',
      title: 'Part 1: runInSeries',
      md: `
Write \`async function runInSeries(tasks)\`. Run the tasks **one after another**: start the next only when the previous has finished. Return an array of their results, in order.

~~~
await runInSeries([async () => 1, async () => 2])   → [1, 2]
~~~
`,
      starter: `async function runInSeries(tasks) {
  // your code here
}
`,
      tests: [
        { name: 'returns the results in order', code: `eq(await runInSeries([async () => 1, async () => 2, async () => 3]), [1, 2, 3]);` },
        {
          name: 'never runs two tasks at once',
          code: `let running = 0, most = 0;
const job = (v) => async () => { running++; most = Math.max(most, running); await sleep(5); running--; return v; };
await runInSeries([job("a"), job("b"), job("c")]);
eq(most, 1, "most tasks running at the same time");`,
        },
        { name: 'no tasks gives []', code: `eq(await runInSeries([]), []);` },
      ],
      hint: '`const results = [];` then `for (const task of tasks) results.push(await task());` and `return results;`.',
      solution: `async function runInSeries(tasks) {
  const results = [];
  for (const task of tasks) {
    results.push(await task()); // the loop pauses here until this task is done
  }
  return results;
}
`,
    },
    {
      type: 'read',
      title: 'The plan: workers',
      md: `
Picture \`limit\` workers at a counter, and a shared pile of numbered tickets (task indexes).

- Each **worker** is a loop: take the next ticket, run that task, write the result in slot \`i\`, repeat until the pile is empty.
- Start \`limit\` workers, then \`await Promise.all(workers)\`: you're done when every worker has run out of tickets.

~~~
async function worker() {
  while (next < tasks.length) {
    const i = next++;               // take a ticket
    results[i] = await tasks[i]();  // write into ITS slot, so order is kept
  }
}
~~~

Two details carry the whole solution:

- \`results[i] = ...\` instead of \`push\`, so results land in task order even when they finish out of order.
- \`const i = next++\` is safe with no lock. JavaScript runs one piece of code at a time, and \`next++\` has no \`await\` in the middle, so two workers can never take the same ticket.
`,
    },
    {
      type: 'task',
      title: 'Part 2: runWithLimit',
      md: `
Write \`runWithLimit(tasks, limit)\` using the worker plan. The starter has the shared state and the start-up code. You write the inside of \`worker\`.

~~~
tasks take 30ms, 10ms, 10ms, 10ms; limit 2
→ never more than 2 running, results in task order
~~~
`,
      starter: `async function runWithLimit(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0; // the next task index nobody has taken yet

  async function worker() {
    // your code here: take the next index, run it, store the result; repeat
  }

  const workers = [];
  for (let w = 0; w < Math.min(limit, tasks.length); w++) workers.push(worker());
  await Promise.all(workers);
  return results;
}
`,
      tests: [
        {
          name: 'returns results in task order, not finish order',
          code: `const job = (v, ms) => async () => { await sleep(ms); return v; };
eq(await runWithLimit([job("a", 30), job("b", 5), job("c", 5)], 2), ["a", "b", "c"]);`,
        },
        {
          name: 'never runs more than limit at once',
          code: `let running = 0, most = 0;
const job = (v) => async () => { running++; most = Math.max(most, running); await sleep(10); running--; return v; };
await runWithLimit([1, 2, 3, 4, 5, 6].map(job), 3);
eq(most, 3, "most tasks running at the same time");`,
        },
        {
          name: 'starts the next task as soon as a slot frees up',
          code: `const log = [];
const job = (v, ms) => async () => { log.push("start " + v); await sleep(ms); log.push("done " + v); return v; };
await runWithLimit([job("slow", 40), job("b", 5), job("c", 5)], 2);
assert(log.indexOf("start c") < log.indexOf("done slow"), "c should start when b finishes: " + log.join(", "));`,
        },
        { name: 'no tasks gives []', code: `eq(await runWithLimit([], 3), []);` },
      ],
      hint: 'Inside `worker`: `while (next < tasks.length) { const i = next++; results[i] = await tasks[i](); }`.',
      solution: `async function runWithLimit(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0; // the next task index nobody has taken yet

  async function worker() {
    while (next < tasks.length) {
      const i = next++;                 // take a ticket (no await here, so no race)
      results[i] = await tasks[i]();    // its own slot keeps the order
    }
  }

  const workers = [];
  for (let w = 0; w < Math.min(limit, tasks.length); w++) workers.push(worker());
  await Promise.all(workers);
  return results;
}
`,
      explain: '`Math.min(limit, tasks.length)` avoids starting workers that would find the pile already empty. They\'d be harmless, just pointless.',
    },
    {
      type: 'task',
      title: 'Part 3: collect failures instead of stopping',
      md: `
> "One bad page shouldn't throw away the other 499 results. Never reject: report each task's outcome."

Change the worker so each slot holds an object shaped like \`Promise.allSettled\`'s:

~~~
{ status: "fulfilled", value: ... }    the task worked
{ status: "rejected", reason: err }    the task threw
~~~

Wrap the \`await\` in a \`try/catch\` (lesson 5). The function is now called \`runSettled\`.
`,
      starter: `async function runSettled(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i](); // your code here: store an outcome object instead
    }
  }

  const workers = [];
  for (let w = 0; w < Math.min(limit, tasks.length); w++) workers.push(worker());
  await Promise.all(workers);
  return results;
}
`,
      tests: [
        {
          name: 'a working task gives { status: "fulfilled", value }',
          code: `eq(await runSettled([async () => 1], 2), [{ status: "fulfilled", value: 1 }]);`,
        },
        {
          name: 'a failing task gives { status: "rejected", reason }',
          code: `const err = new Error("404");
const out = await runSettled([async () => { throw err; }], 2);
eq(out[0].status, "rejected"); assert(out[0].reason === err, "reason should be the thrown error");`,
        },
        {
          name: 'one failure does not stop the others',
          code: `const out = await runSettled([async () => "a", async () => { throw new Error("x"); }, async () => "c"], 1);
eq(out.map((r) => r.status), ["fulfilled", "rejected", "fulfilled"]);
eq(out[2].value, "c");`,
        },
      ],
      hint: '`try { results[i] = { status: "fulfilled", value: await tasks[i]() }; } catch (reason) { results[i] = { status: "rejected", reason }; }`',
      solution: `async function runSettled(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await tasks[i]() };
      } catch (reason) {
        results[i] = { status: "rejected", reason };   // record it and keep working
      }
    }
  }

  const workers = [];
  for (let w = 0; w < Math.min(limit, tasks.length); w++) workers.push(worker());
  await Promise.all(workers);
  return results;
}
`,
      explain: 'The catch keeps the worker\'s loop alive. Without it, one throw would end that worker and reject the whole pool through `Promise.all`.',
    },
    {
      type: 'read',
      title: 'Walkthrough: the full solution',
      md: `
Trace \`runWithLimit\` with limit 2 and tasks A (30ms), B (10ms), C (10ms), D (10ms):

| time | worker 1 | worker 2 | \`next\` after |
|---|---|---|---|
| 0 | takes 0, starts A | takes 1, starts B | 2 |
| 10 | (A running) | B done → results[1]; takes 2, starts C | 3 |
| 20 | (A running) | C done → results[2]; takes 3, starts D | 4 |
| 30 | A done → results[0]; pile empty, stops | D done → results[3]; stops | 4 |

Done at 30ms with \`[A, B, C, D]\`, in task order.

**Compare the three:**

| approach | total time here | most in flight |
|---|---|---|
| series | 60ms | 1 |
| \`Promise.all\` on everything | 30ms | 4 (all of them) |
| pool, limit 2 | 30ms | 2 |

**Cost:** each task starts once, so O(n) work beyond the tasks themselves, plus O(n) memory for results.

**Say it:** "I start \`limit\` workers that share an index counter. Each one takes the next index, awaits that task and stores the result in its slot, so order is kept. \`next++\` needs no lock, because JavaScript runs one piece of code at a time."
`,
    },
    {
      type: 'check',
      title: 'Follow-up questions',
      items: [
        {
          q: 'In Part 2, task 2 rejects. What does `runWithLimit` do?',
          choices: [
            'Rejects with that error, but the other worker keeps running its current and later tasks in the background',
            'Cancels every running task',
            'Retries task 2',
          ],
          answer: 0,
          explain: '`Promise.all(workers)` rejects as soon as one worker throws, but promises can\'t be cancelled, so other work carries on. A `failed` flag checked in the `while` stops new starts (the finale does this).',
          why: {
            1: 'Promises have no built-in cancel. You\'d need an `AbortController` passed to each task.',
            2: 'Nothing retries unless you wrap the task, for example with lesson 5\'s `retry`.',
          },
        },
        {
          q: 'How would you add retries to each task without changing the pool?',
          choices: [
            'Wrap each task: `tasks.map((t) => () => retry(t, 3))`',
            'Run the whole pool three times',
            'Increase the limit',
          ],
          answer: 0,
          explain: 'Small pieces compose: the pool limits, `retry` retries. The wrapper is still a function, so the pool still controls when it starts.',
          why: {
            1: 'That redoes the tasks that already worked.',
            2: 'Concurrency has nothing to do with retrying failures.',
          },
        },
        {
          q: 'Why is `const i = next++` safe with two workers and no lock?',
          choices: [
            'JavaScript runs one piece of code at a time, and there\'s no `await` between reading and incrementing `next`',
            'Because `next` is a `let`',
            'It isn\'t safe; two workers can take the same index',
          ],
          answer: 0,
          explain: 'Workers only switch at an `await`. Reading and bumping `next` happens in one uninterrupted step.',
          why: {
            1: '`let` vs `const` is about reassignment, not concurrency.',
            2: 'In threaded languages it would be a race. In JavaScript\'s single thread, it isn\'t.',
          },
        },
        {
          q: 'What does `runWithLimit(tasks, Infinity)` behave like?',
          choices: ['`Promise.all` on every task', '`runInSeries`', 'It never finishes'],
          answer: 0,
          explain: '`Math.min(Infinity, n)` is n workers, each taking one task: everything starts at once.',
          why: {
            1: 'Series is a limit of 1.',
            2: 'Each worker finishes when the pile is empty, so it ends normally.',
          },
        },
      ],
    },
  ],
};
