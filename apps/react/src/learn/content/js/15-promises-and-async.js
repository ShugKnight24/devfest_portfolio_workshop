// JS course · lesson 15. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'promises-and-async',
  builds: ['js/map', 'js/closures-and-scope'],
  title: 'Promises and async/await',
  goal: 'Write code that waits: build delay(ms), use async/await, run work one after another or all at once with Promise.all, catch failures, and predict what prints first.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Code that finishes later',
      md: `
So far every line ran, finished, and then the next line ran. Some work **takes time**: a network request, reading a file, a timer. JavaScript doesn't stop and wait for it. It starts the work, carries on with the next line, and **calls you back** when the work is done.

The simplest example is \`setTimeout(callback, ms)\`: "call this function in \`ms\` milliseconds".

~~~
console.log("A");
setTimeout(() => console.log("C"), 1000);   // schedule it, don't wait
console.log("B");

// prints A, B, then a second later C
~~~

The callback is the same idea as lesson 9: a function you hand over for someone else to call. Here "someone else" is the timer.

The catch: if step 2 needs step 1's result, step 2 has to go **inside** step 1's callback, and step 3 inside that. Real code ended up nested five levels deep. That shape was called "callback hell", and it's why promises were added.
`,
    },
    {
      type: 'read',
      title: 'A promise is a value that arrives later',
      md: `
A **promise** is an object that stands for a result you don't have yet. It's in one of three states:

| State | Meaning |
|---|---|
| pending | still working |
| fulfilled | finished, with a value |
| rejected | failed, with an error |

You make one with \`new Promise((resolve) => ...)\`. You call \`resolve(value)\` when the work is done. Here's the most useful promise there is, a pause:

~~~js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const p = delay(100);
console.log(p);                    // still pending

await p;                           // wait here until it's fulfilled
console.log("100ms later");
~~~

\`await\` means "pause **this function** until the promise settles, then give me its value". The rest of the program keeps running meanwhile.

One note: \`await\` only works inside an \`async\` function (next step). The code boxes on this site already run inside one, which is why the \`await\` above works at the top.
`,
    },
    {
      type: 'predict',
      title: 'Who prints first?',
      md: 'The timer is set to 0 milliseconds. The last line just waits long enough for the timer to finish.',
      code: `const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log("A");
setTimeout(() => console.log("C"), 0);
console.log("B");

await delay(10);`,
      output: `A
B
C`,
      explain: `
Even with \`0\`, a timer callback never runs in the middle of your code. \`setTimeout\` only **schedules** it, and it runs once the current code is done. So \`A\` and \`B\` print first.

The common wrong answer is \`A C B\`, from reading 0ms as "right now". It means "as soon as you're free".
`,
    },
    {
      type: 'task',
      title: 'Write delay yourself',
      md: `
**Example** (already solved): a promise that fulfills straight away with a value.

~~~
function resolvedWith(value) {
  return new Promise((resolve) => resolve(value));
}
~~~

**Your turn:** write \`delay(ms)\`. It returns a promise that fulfills after \`ms\` milliseconds. Use \`setTimeout\` and pass \`resolve\` as its callback.

~~~
await delay(100);   // continues about 100ms later
~~~
`,
      starter: `function delay(ms) {
  // your code here
}
`,
      tests: [
        { name: 'delay returns a promise', code: `assert(delay(1) instanceof Promise, "delay should return new Promise(...)");` },
        { name: 'it waits about ms milliseconds', code: `const start = Date.now(); await delay(50); assert(Date.now() - start >= 45, "it finished too early");` },
      ],
      hint: 'Return `new Promise((resolve) => ...)`, and inside it call `setTimeout(resolve, ms)`. When the timer fires, it calls `resolve`, which fulfills the promise.',
      solution: `function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
`,
      explain: 'This one line is the bridge between old callback APIs and promises: wrap the callback API in `new Promise`, and call `resolve` where the callback would have run.',
    },
    {
      type: 'read',
      title: 'async functions',
      md: `
Put \`async\` before a function and two things change:

1. You can use \`await\` inside it.
2. It **always returns a promise**. \`return x\` fulfills that promise with \`x\`.

~~~js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getUser(id) {
  await delay(50);                      // pretend this is a network request
  return { id, name: "Ada" };
}

const user = await getUser(1);          // await unwraps the promise
console.log(user.name);
~~~

Read it top to bottom like normal code. That's the whole point of \`async\`/\`await\`: code that waits, written in the same shape as code that doesn't. No nesting.

(You may also see \`.then\`: \`getUser(1).then((user) => console.log(user.name))\`. It does the same thing as \`await\`, with a callback instead.)
`,
    },
    {
      type: 'predict',
      title: 'Forgetting await',
      md: 'Same `getUser`, but the caller left out one word.',
      code: `const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getUser(id) {
  await delay(50);
  return { id, name: "Ada" };
}

const user = getUser(1);
console.log(user);
console.log(user.name);`,
      output: `Promise { <pending> }
undefined`,
      explain: `
Without \`await\`, \`user\` is the **promise**, not the user. A promise has no \`name\` key, so \`user.name\` is \`undefined\`.

This is the most common async bug. If you see \`Promise { <pending> }\` or a mysterious \`undefined\` right after calling an \`async\` function, look for a missing \`await\`.
`,
    },
    {
      type: 'task',
      title: 'An async function',
      md: `
**Example** (already solved):

~~~
async function greetLater(name) {
  await delay(10);
  return "Hi " + name;
}
~~~

**Your turn:** write \`async function doubleLater(n)\`. It waits 20ms with \`delay\`, then returns \`n * 2\`. \`delay\` is already in the starter.

~~~
await doubleLater(4)   → 8
~~~
`,
      starter: `const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function doubleLater(n) {
  // your code here
}
`,
      tests: [
        { name: 'doubleLater(4) gives 8', code: `eq(await doubleLater(4), 8);` },
        { name: 'it waits before answering', code: `const start = Date.now(); await doubleLater(1); assert(Date.now() - start >= 15, "await delay(20) first");` },
      ],
      hint: 'Two lines, same as `greetLater`: `await delay(20);` then `return n * 2;`.',
      solution: `const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function doubleLater(n) {
  await delay(20);
  return n * 2;
}
`,
    },
    {
      type: 'read',
      title: 'One after another, or all at once',
      md: `
Two \`await\`s in a row run **one after another**. The second doesn't start until the first is done:

~~~js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const slowDouble = async (n) => { await delay(100); return n * 2; };

let start = Date.now();
const a = await slowDouble(1);
const b = await slowDouble(2);
console.log("one after another:", a, b, Math.round((Date.now() - start) / 100) * 100, "ms");

start = Date.now();
const [c, d] = await Promise.all([slowDouble(1), slowDouble(2)]);
console.log("all at once:", c, d, Math.round((Date.now() - start) / 100) * 100, "ms");
~~~

\`Promise.all([...])\` takes an array of promises that are **already running** and waits for all of them. Total time is the slowest one, not the sum. It gives back an array of results, which you can destructure (lesson 12).

Pick by asking: **does the second call need the first one's result?** If yes, await one after another. If no, start them all and \`Promise.all\` them.
`,
    },
    {
      type: 'predict',
      title: 'Which order do the results come back in?',
      md: '`slow` takes 100ms, `fast` takes 10ms.',
      code: `const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const slow = async () => { await delay(100); return "slow"; };
const fast = async () => { await delay(10); return "fast"; };

const results = await Promise.all([slow(), fast()]);
console.log(results);`,
      output: `[ "slow", "fast" ]`,
      explain: `
\`fast\` **finishes** first, but \`Promise.all\` puts each result in the **same position as its promise** in the array you passed. So the order matches your input, not the finish line.

That's what makes \`const [user, posts] = await Promise.all([getUser(), getPosts()])\` safe.
`,
    },
    {
      type: 'task',
      title: 'Make it parallel',
      md: `
\`getNames(ids)\` returns the names of the users with those ids. It works, but it fetches one user at a time, so 5 ids take 5 × 60ms.

~~~
await getNames([1, 2])   → ["User 1", "User 2"]
~~~

Rewrite \`getNames\` so all the requests run **at once**. Use \`ids.map(getUser)\` to start them all, \`Promise.all\` to wait, then \`map\` to pull out the names.
`,
      starter: `const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getUser(id) {
  await delay(60);
  return { id, name: \`User \${id}\` };
}

async function getNames(ids) {
  const names = [];
  for (const id of ids) {
    const user = await getUser(id);
    names.push(user.name);
  }
  return names;
}
`,
      tests: [
        { name: 'getNames([1, 2]) is ["User 1", "User 2"]', code: `eq(await getNames([1, 2]), ["User 1", "User 2"]);` },
        { name: 'an empty list gives []', code: `eq(await getNames([]), []);` },
        { name: '5 ids take about as long as 1', code: `const start = Date.now(); await getNames([1, 2, 3, 4, 5]); const ms = Date.now() - start; assert(ms < 200, "took " + ms + "ms: the requests are still running one at a time");` },
      ],
      hint: '`const users = await Promise.all(ids.map(getUser));` gives you an array of user objects. Then `return users.map((u) => u.name);`.',
      solution: `const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getUser(id) {
  await delay(60);
  return { id, name: \`User \${id}\` };
}

async function getNames(ids) {
  const users = await Promise.all(ids.map(getUser));
  return users.map((u) => u.name);
}
`,
      explain: '`ids.map(getUser)` calls `getUser` for every id straight away, so all five timers start together. That gives an array of five pending promises, and `Promise.all` turns it into one promise for an array of five users.',
    },
    {
      type: 'read',
      title: 'When a promise fails',
      md: `
A rejected promise is the async version of an error. Inside an \`async\` function, \`throw\` rejects its promise, and \`await\` on a rejected promise **throws** right there. So you catch it with the ordinary \`try\`/\`catch\`:

~~~js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadUser(id) {
  await delay(20);
  if (id < 0) throw new Error("Bad id: " + id);
  return { id, name: "Ada" };
}

try {
  const user = await loadUser(-1);
  console.log(user.name);            // skipped: the line above threw
} catch (err) {
  console.log("Caught:", err.message);
}
~~~

Two things to know:

- **\`Promise.all\` fails fast.** If any one promise rejects, the whole \`Promise.all\` rejects with that error.
- If nothing catches a rejection, you get an "unhandled rejection" error in the console. Every \`await\` that can fail needs a \`try\`/\`catch\` somewhere above it.

Lesson 16 covers \`throw\`, \`try\`, \`catch\` and \`finally\` in full.
`,
    },
    {
      type: 'task',
      title: 'safeLoad',
      md: `
\`loadUser(id)\` (in the starter) rejects for negative ids. Write \`async function safeLoad(id)\` that returns the user, or \`null\` if \`loadUser\` fails.

~~~
await safeLoad(1)    → { id: 1, name: "Ada" }
await safeLoad(-1)   → null
~~~
`,
      starter: `const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadUser(id) {
  await delay(20);
  if (id < 0) throw new Error("Bad id: " + id);
  return { id, name: "Ada" };
}

async function safeLoad(id) {
  // your code here
}
`,
      tests: [
        { name: 'a good id gives the user', code: `eq(await safeLoad(1), { id: 1, name: "Ada" });` },
        { name: 'a bad id gives null instead of throwing', code: `eq(await safeLoad(-1), null);` },
      ],
      hint: 'Inside `try { ... }`, `return await loadUser(id);`. In `catch (err) { ... }`, `return null;`.',
      solution: `const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadUser(id) {
  await delay(20);
  if (id < 0) throw new Error("Bad id: " + id);
  return { id, name: "Ada" };
}

async function safeLoad(id) {
  try {
    return await loadUser(id);
  } catch (err) {
    return null;
  }
}
`,
      explain: 'The `await` matters here. `return loadUser(id)` without it hands back the promise before it fails, so the `catch` never sees the error and the caller gets the rejection instead.',
    },
    {
      type: 'read',
      title: 'The order rule',
      md: `
When everything is mixed together, JavaScript follows one rule about what runs when:

| Order | What | Examples |
|---|---|---|
| 1 | All the plain code that's running now | every normal line, top to bottom |
| 2 | Promise callbacks (**microtasks**) | \`.then\` callbacks, the code after an \`await\` |
| 3 | Timer callbacks (**tasks**) | \`setTimeout\`, even with 0ms |

So: **plain code first, then promises, then timers.** After each timer callback, any new promise callbacks run before the next timer.

You don't need more detail than that to predict almost every interview question on this. The Node track goes deeper into the event loop.
`,
    },
    {
      type: 'predict',
      title: 'Plain, promise, timer',
      md: 'Use the table from the last step. The last line only waits for the timer to finish.',
      code: `const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log("plain 1");
setTimeout(() => console.log("timer"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("plain 2");

await delay(10);`,
      output: `plain 1
plain 2
promise
timer`,
      explain: `
- The two plain \`console.log\`s run first, in order.
- \`Promise.resolve().then(...)\` is a promise callback: it runs as soon as the plain code is done.
- The timer was scheduled **before** the promise, but timers always wait until the promise callbacks are finished.

The common wrong answer puts \`timer\` before \`promise\` because it was written first. Order of writing doesn't decide it; the kind of callback does.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What does an `async` function always return?",
          choices: ["A promise", "Whatever value is after `return`", "`undefined`"],
          answer: 0,
          explain: "`return x` inside an `async` function fulfills its promise with `x`. You get `x` out with `await`.",
          why: { 1: "The value is wrapped in a promise. You need `await` to get it out.", 2: "It returns a promise even if there's no `return`." },
        },
        {
          q: "`const user = getUser(1);` (no `await`) then `console.log(user.name)` prints what?",
          choices: ["`undefined`", "The user's name", "An error"],
          answer: 0,
          explain: "`user` is the promise, and promises don't have a `name` key.",
          why: { 1: "The name only exists once you `await` the promise.", 2: "Reading a missing key gives `undefined`, not an error." },
        },
        {
          q: "You need a user and their settings, and neither depends on the other. What's fastest?",
          choices: ["`await Promise.all([getUser(), getSettings()])`", "`await getUser()` then `await getSettings()`", "Two `setTimeout`s"],
          answer: 0,
          explain: "Both requests start together, so the wait is the slower of the two, not the sum.",
          why: { 1: "That waits for the user before even starting the settings request.", 2: "Timers don't fetch anything. They just wait." },
        },
        {
          q: "In what order do these print?\n\n~~~\nsetTimeout(() => console.log(\"T\"), 0);\nPromise.resolve().then(() => console.log(\"P\"));\nconsole.log(\"S\");\n~~~",
          choices: ["S P T", "T P S", "S T P"],
          answer: 0,
          explain: "Plain code first, then promise callbacks, then timers.",
          why: { 1: "That's the order they're written in, but nothing scheduled runs before the plain code finishes.", 2: "Promise callbacks always run before timers." },
        },
        {
          q: "How do you catch a rejected promise inside an `async` function?",
          choices: ["Wrap the `await` in `try` / `catch`", "Check if the result is `null`", "You can't; rejections always crash"],
          answer: 0,
          explain: "`await` on a rejected promise throws, and `try`/`catch` catches it like any other error.",
          why: { 1: "A rejection doesn't give you `null`; it throws.", 2: "`try`/`catch` around the `await` handles it." },
        },
      ],
    },
  ],
};
