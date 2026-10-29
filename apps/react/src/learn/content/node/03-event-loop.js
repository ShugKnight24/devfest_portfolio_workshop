// Node course · lesson 3. Step types: read, predict, task, check (see ../index.js).
// Runnable snippets that use timers end with a short wait, so the runner sees every log before it stops.
export default {
  id: 'event-loop',
  builds: ['node/what-node-is', 'js/functions', 'js/promises-and-async'],
  title: 'The event loop: what runs when',
  goal: 'Predict the order of synchronous code, promise callbacks and timers, and understand why blocking the thread stalls a whole server.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'One thread, three kinds of work',
      md: `
Lesson 1 said Node runs your JavaScript on **one thread** and lets libuv do the waiting. This lesson is how those two fit together.

Your code runs **to completion**: once a function starts, nothing else runs until the call stack is empty again. Work that should happen *later* goes into a queue. There are two queues you need to know:

- **Microtasks**: promise callbacks (\`.then\`, the code after an \`await\`) and \`queueMicrotask(fn)\`.
- **Tasks** (also called macrotasks): timers (\`setTimeout\`, \`setInterval\`), finished I/O such as "the file has been read" or "a request arrived".

The loop follows one rule:

1. Run the current piece of synchronous code until the stack is empty.
2. Run **every** microtask, including ones added while doing this.
3. Take **one** task from the task queue, run it, and go back to step 2.

So the priority is: **sync first, then all microtasks, then the next task.**

A note on running these examples: the runner on this page stops once your code finishes, so snippets with timers end with \`await new Promise((r) => setTimeout(r, 20))\`. That line just waits 20 ms so the other callbacks get to print. You'll understand exactly why it works by the end of the lesson.
`,
    },
    {
      type: 'predict',
      title: 'setTimeout with 0',
      code: `console.log('A');
setTimeout(() => console.log('B'), 0);
console.log('C');

await new Promise((r) => setTimeout(r, 20)); // let the timer fire before the runner stops`,
      output: `A
C
B`,
      explain: `
\`setTimeout(fn, 0)\` doesn't mean "now". It means "put \`fn\` in the task queue, no earlier than 0 ms from now". The synchronous code (\`A\`, then \`C\`) must finish first, because the loop only takes a task when the stack is empty.

The common wrong answer is \`A B C\`, from reading \`0\` as "immediately".
`,
    },
    {
      type: 'predict',
      title: 'Promise vs timer',
      md: 'Both callbacks are scheduled for "as soon as possible". Which goes first?',
      code: `setTimeout(() => console.log('timer'), 0);
Promise.resolve().then(() => console.log('promise'));
console.log('sync');

await new Promise((r) => setTimeout(r, 20));`,
      output: `sync
promise
timer`,
      explain: `
- \`sync\` runs right away, as part of the current code.
- The \`.then\` callback is a **microtask**, and all microtasks run as soon as the stack empties.
- The timer is a **task**, so it waits until the microtask queue is empty.

Order of scheduling doesn't matter here: the timer was scheduled first and still runs last.
`,
    },
    {
      type: 'read',
      title: 'await is a microtask too',
      md: `
\`await\` pauses the **async function**, not the program. The rest of the function becomes a microtask that runs once the awaited promise settles. Meanwhile, the code that called the function carries on:

~~~js
async function work() {
  console.log('1. work starts');
  await null;                           // pause here; the rest is queued as a microtask
  console.log('3. work resumes');
}

work();
console.log('2. caller carries on');
~~~

Run it. The caller's line prints in between, because \`work()\` returned a promise at the \`await\` and handed control back.

\`queueMicrotask(fn)\` puts a function straight into the microtask queue, without making a promise. You'll rarely need it in app code, but it's the clearest way to see the queue:

~~~js
queueMicrotask(() => console.log('micro'));
console.log('sync');
~~~
`,
    },
    {
      type: 'predict',
      title: 'Inside and outside an async function',
      code: `async function load() {
  console.log('B');
  await null;
  console.log('D');
}

console.log('A');
load();
console.log('C');`,
      output: `A
B
C
D`,
      explain: `
An async function runs **synchronously up to its first \`await\`**, so \`B\` prints immediately after \`A\`. Then \`load\` pauses, the caller prints \`C\`, the stack empties, and the queued rest of \`load\` prints \`D\`.

The usual wrong answer puts \`B\` after \`C\`, assuming the whole async function runs "later". Only the part after an \`await\` does.
`,
    },
    {
      type: 'predict',
      title: 'Put it all together',
      md: 'Take it one queue at a time: sync, then all microtasks, then tasks.',
      code: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => {
  console.log('3');
  queueMicrotask(() => console.log('4'));
});
setTimeout(() => console.log('5'), 0);
console.log('6');

await new Promise((r) => setTimeout(r, 20));`,
      output: `1
6
3
4
2
5`,
      explain: `
- **Sync:** \`1\`, \`6\`.
- **Microtasks:** \`3\`. It queues another microtask, and the queue is drained completely before any task, so \`4\` comes next.
- **Tasks, in the order they were scheduled:** \`2\`, \`5\`.

If you guessed \`2\` before \`4\`, remember step 2 of the loop: microtasks added *while running microtasks* still run before the next task.
`,
    },
    {
      type: 'task',
      title: 'Schedule three pushes',
      md: `
\`schedule(log)\` pushes three letters into the \`log\` array. Change **how** each push is scheduled, not the letters:

- \`'A'\` inside a \`setTimeout(..., 0)\`
- \`'B'\` inside \`queueMicrotask(...)\`
- \`'C'\` directly (synchronous)

Once everything has run, \`log\` should be \`['C', 'B', 'A']\`. Right after \`schedule(log)\` returns, only \`'C'\` should be in it.

**Example** of wrapping a push in a timer:

~~~
setTimeout(() => log.push('X'), 0);
~~~
`,
      starter: `function schedule(log) {
  log.push('A');
  log.push('B');
  log.push('C');
}
`,
      tests: [
        { name: "right after the call, the log is ['C']", code: `const log = []; schedule(log); eq(log, ['C']);` },
        { name: "after the loop runs, the log is ['C', 'B', 'A']", code: `const log = []; schedule(log); await sleep(20); eq(log, ['C', 'B', 'A']);` },
        { name: "after microtasks but before timers, the log is ['C', 'B']", code: `const log = []; schedule(log); await null; eq(log, ['C', 'B']);` },
      ],
      hint: "Wrap the first push: `setTimeout(() => log.push('A'), 0);`. Do the same with `queueMicrotask` for B, and leave C alone.",
      solution: `function schedule(log) {
  setTimeout(() => log.push('A'), 0);
  queueMicrotask(() => log.push('B'));
  log.push('C');
}
`,
    },
    {
      type: 'read',
      title: 'Blocking the loop',
      md: `
"Run to completion" has a cost. While a function is busy, **nothing else on that thread runs**: no timers, no promise callbacks, no incoming requests.

~~~js
const start = Date.now();
setTimeout(() => {
  console.log('timer asked for 10ms, ran after', Date.now() - start, 'ms');
}, 10);

// a busy loop: 200ms of pure CPU work
while (Date.now() - start < 200) {}
console.log('busy loop done');

await new Promise((r) => setTimeout(r, 20));
~~~

Run it. The timer asked for 10 ms but waits about 200, because the loop couldn't get back to the queue.

On a server this is the most important rule in Node: **if one request does 200 ms of CPU work, every other request waits 200 ms.** Things that block: huge \`JSON.parse\` calls, synchronous file APIs like \`fs.readFileSync\` inside a request, tight loops over big arrays, slow regular expressions.

Waiting on I/O doesn't block, because libuv does the waiting off the main thread and queues a task when the result arrives. For heavy CPU work, Node has \`worker_threads\` (a separate thread with its own event loop), which is the same idea as the worker this page runs your code in.
`,
    },
    {
      type: 'task',
      title: 'delay(ms)',
      md: `
Write \`delay(ms)\`: it returns a promise that resolves after \`ms\` milliseconds. You'll use it all through the next lesson.

~~~
await delay(100);   // pauses this async function for about 100ms
~~~

**Example** of making a promise by hand:

~~~
function resolveSoon(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), 0);
  });
}
~~~
`,
      starter: `function delay(ms) {
  // your code here
}
`,
      tests: [
        { name: 'returns a promise', code: `assert(delay(1) instanceof Promise, 'delay should return a Promise');` },
        { name: 'waits at least ms milliseconds', code: `const t = Date.now(); await delay(50); assert(Date.now() - t >= 45, 'resolved too early');` },
        { name: 'does not resolve before the timer', code: `let done = false; delay(30).then(() => { done = true; }); await sleep(5); eq(done, false);` },
      ],
      hint: 'Same shape as `resolveSoon`, but call `resolve()` with nothing, and pass `ms` as the timer delay.',
      solution: `function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
`,
      explain: 'Node also ships this ready-made: `import { setTimeout as delay } from "node:timers/promises"`, then `await delay(100)`.',
    },
    {
      type: 'read',
      title: 'Node extras: nextTick and setImmediate',
      md: `
Node has two scheduling functions the browser doesn't:

~~~node
process.nextTick(() => console.log('nextTick'));   // before promise microtasks, in most cases
setImmediate(() => console.log('immediate'));       // a task that runs after I/O callbacks
~~~

- **\`process.nextTick\`** has its own queue that Node drains alongside the microtasks. Its exact order relative to promises differs between CommonJS and ES modules, so don't write code that depends on it. Prefer \`queueMicrotask\`, which is standard.
- **\`setImmediate\`** runs in the "check" phase of Node's loop, right after waiting for I/O. Inside an I/O callback it always runs before a \`setTimeout(fn, 0)\`. From the main script, the order between the two isn't guaranteed.

Node's loop has several **phases** (timers, I/O callbacks, waiting for I/O, \`setImmediate\`, close callbacks), but for everyday code the three-step rule from the start of this lesson predicts what you'll see.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'What does this print?\n\n~~~\nsetTimeout(() => console.log("t"), 0);\nPromise.resolve().then(() => console.log("p"));\nconsole.log("s");\n~~~',
          choices: ['`s p t`', '`t p s`', '`s t p`'],
          answer: 0,
          explain: 'Sync first, then every microtask (the promise), then the next task (the timer).',
          why: { 1: 'Nothing scheduled runs before the synchronous code finishes.', 2: 'Promise callbacks are microtasks and beat timers.' },
        },
        {
          q: 'An async function has `console.log("x")` **before** its first `await`. When does it print?',
          choices: ['Immediately, when the function is called', 'After the caller finishes', 'After all timers'],
          answer: 0,
          explain: 'An async function runs synchronously up to its first `await`. Only the rest is deferred.',
          why: { 1: 'Only the code after an `await` waits for the caller.', 2: 'Timers have nothing to do with it.' },
        },
        {
          q: 'A request handler does 300ms of CPU work. What happens to other requests during that time?',
          choices: ['They wait, because the single JavaScript thread is busy', 'They run in parallel on other threads automatically', 'They are rejected with an error'],
          answer: 0,
          explain: 'Your JavaScript runs on one thread. Busy CPU work blocks the loop until it finishes.',
          why: { 1: 'Node does not spread your JavaScript across threads unless you use `worker_threads`.', 2: 'They queue up; they are just late.' },
        },
        {
          q: 'A microtask queues another microtask. When does the second one run?',
          choices: ['Before any timer, in the same microtask drain', 'After the next timer', 'Never'],
          answer: 0,
          explain: 'The loop drains the microtask queue completely, including newly added microtasks, before taking the next task.',
          why: { 1: 'Timers wait for the whole microtask queue to empty.', 2: 'It runs; the queue keeps draining until empty.' },
        },
        {
          q: 'Why does reading a file with `fs/promises` not block the loop?',
          choices: ['libuv does the waiting off the main thread and queues a callback when it is done', 'Node reads the file in JavaScript very quickly', 'The file is read only after the program exits'],
          answer: 0,
          explain: 'The JavaScript thread only gets involved again when the data is ready.',
          why: { 1: 'The waiting happens in libuv, not in your JavaScript.', 2: 'It happens while the program runs, just not on your thread.' },
        },
      ],
    },
  ],
};
