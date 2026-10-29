// Node course · lesson 4. Step types: read, predict, task, check (see ../index.js).
// Timing tests use short delays; the fake "database" calls are delay() plus a value.
export default {
  id: 'async-await',
  builds: ['node/event-loop', 'js/map', 'ts/async-and-errors', 'js/promises-and-async'],
  title: 'async/await in depth',
  goal: 'Run async work one after another or all at once on purpose, handle failures with try/catch, and put a time limit on slow work.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'A promise is a value that arrives later',
      md: `
In the last lesson you wrote \`delay(ms)\`. It returned a **promise**: an object standing in for a result that isn't ready yet. A promise is in one of three states:

- **pending**: still waiting
- **fulfilled**: finished with a value
- **rejected**: failed with an error

\`await\` unwraps it. Inside an \`async\` function, \`await p\` pauses that function until \`p\` settles, then gives you the value (or **throws** the error).

~~~js
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function getUser(id) {
  await delay(50);                 // pretend this is a database call
  return { id, name: 'Ada' };      // an async function always returns a promise
}

const p = getUser(1);
console.log(p);                    // the promise itself
console.log(await p);              // the value inside it
~~~

Almost every Node API that touches the outside world (files, \`fetch\`, databases) returns a promise. This lesson is about combining them well.
`,
    },
    {
      type: 'predict',
      title: 'The forgotten await',
      md: 'The most common async bug. Predict both lines.',
      code: `async function getUser(id) {
  return { id, name: 'Ada' };
}

const user = getUser(1);
console.log(user.name);
console.log(user);`,
      output: `undefined
Promise { <pending> }`,
      explain: `
Without \`await\`, \`user\` is the **promise**, not the user. A promise has no \`name\` property, so you get \`undefined\` rather than an error, and the bug travels further before anyone notices.

(Real Node prints \`Promise { { id: 1, name: 'Ada' } }\` for an already-fulfilled promise; this page's console prints every promise as pending.)

When a value is mysteriously \`undefined\` or shows up as \`[object Promise]\` in a string, look for a missing \`await\`.
`,
    },
    {
      type: 'predict',
      title: 'Two awaits in a row',
      md: 'Each call takes about 100ms. Roughly how long does `both` take?',
      code: `const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const getUser = async () => { await delay(100); return 'user'; };
const getPosts = async () => { await delay(100); return 'posts'; };

const start = Date.now();
const user = await getUser();
const posts = await getPosts();
const ms = Date.now() - start;
console.log(user, posts);
console.log('took about', Math.round(ms / 100) * 100, 'ms');`,
      output: `user posts
took about 200 ms`,
      explain: `
\`getPosts()\` isn't even **called** until \`getUser()\` has finished, because the \`await\` on the line above pauses the function. That's **sequential**: 100 + 100.

Sequential is correct when the second call needs the first one's result (load the user, then load posts for \`user.id\`). When the two don't depend on each other, you're just waiting twice for no reason.
`,
    },
    {
      type: 'read',
      title: 'Start both, then wait: Promise.all',
      md: `
Calling an async function **starts** the work. \`await\` only decides when you **wait** for it. So start everything first, then wait once:

~~~js
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const getUser = async () => { await delay(100); return 'user'; };
const getPosts = async () => { await delay(100); return 'posts'; };

const start = Date.now();
const [user, posts] = await Promise.all([getUser(), getPosts()]);
console.log(user, posts, 'took about', Math.round((Date.now() - start) / 100) * 100, 'ms');
~~~

\`Promise.all([...])\` takes an array of promises and gives back **one** promise that fulfills with an array of results, **in the same order as the input**, no matter which finished first. The destructuring \`[user, posts]\` is from JavaScript lesson 12.

The total is the **slowest** call, not the sum. On a server that loads five things per request, that's the difference between 50 ms and 250 ms.
`,
    },
    {
      type: 'task',
      title: 'loadProfile in parallel',
      md: `
\`loadProfile(id)\` works, but it waits for the user before even starting the posts. Change it to load both **at the same time** with \`Promise.all\`. It should still return:

~~~
await loadProfile(1)  → { user: { id: 1, name: 'Ada' }, posts: ['Hello', 'Node'] }
~~~

\`getUser\` and \`getPosts\` each take 100ms, so the parallel version takes about 100ms instead of 200ms.
`,
      starter: `const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const getUser = async (id) => { await delay(100); return { id, name: 'Ada' }; };
const getPosts = async (id) => { await delay(100); return ['Hello', 'Node']; };

async function loadProfile(id) {
  const user = await getUser(id);
  const posts = await getPosts(id);
  return { user, posts };
}
`,
      tests: [
        { name: 'returns the user and posts', code: `eq(await loadProfile(1), { user: { id: 1, name: 'Ada' }, posts: ['Hello', 'Node'] });` },
        { name: 'takes about 100ms, not 200ms', code: `const t = Date.now(); await loadProfile(1); const ms = Date.now() - t; assert(ms < 170, 'took ' + ms + 'ms: are the two calls still one after the other?');` },
      ],
      hint: 'Replace the two `await` lines with one: `const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);`',
      solution: `const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const getUser = async (id) => { await delay(100); return { id, name: 'Ada' }; };
const getPosts = async (id) => { await delay(100); return ['Hello', 'Node']; };

async function loadProfile(id) {
  const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);
  return { user, posts };
}
`,
    },
    {
      type: 'read',
      title: 'When a promise rejects',
      md: `
A rejected promise is an error that arrives later. \`await\` turns it back into a normal \`throw\`, so plain \`try\`/\`catch\` handles it:

~~~js
async function getUser(id) {
  if (id !== 1) throw new Error('User ' + id + ' not found');  // inside async, throw = reject
  return { id, name: 'Ada' };
}

try {
  const user = await getUser(2);
  console.log(user.name);           // skipped
} catch (err) {
  console.log('caught:', err.message);
}
~~~

Two rules to remember:

- **\`try\`/\`catch\` only catches what you \`await\` inside it.** \`try { getUser(2) } catch {}\` without \`await\` catches nothing; the rejection escapes later.
- **\`Promise.all\` fails fast.** If any input rejects, the combined promise rejects with that first error, and you lose the other results (the other calls keep running, you just don't get their values).

An unhandled rejection is serious in Node: by default the process prints the error and **exits** with a failure code. On a server, that means one forgotten \`catch\` can take the whole thing down.
`,
    },
    {
      type: 'task',
      title: 'loadOrDefault',
      md: `
Write \`loadOrDefault(load, fallback)\`. It calls the async function \`load()\` and returns its result. If it rejects, return \`fallback\` instead.

~~~
await loadOrDefault(async () => 'fresh', 'cached')                        → 'fresh'
await loadOrDefault(async () => { throw new Error('down'); }, 'cached')  → 'cached'
~~~
`,
      starter: `async function loadOrDefault(load, fallback) {
  return load();
}
`,
      tests: [
        { name: 'returns the loaded value when it works', code: `eq(await loadOrDefault(async () => 'fresh', 'cached'), 'fresh');` },
        { name: 'returns the fallback when load rejects', code: `eq(await loadOrDefault(async () => { throw new Error('down'); }, 'cached'), 'cached');` },
      ],
      hint: 'Wrap it: `try { return await load(); } catch { return fallback; }`. The `await` matters: without it, the rejection happens after the `try` has already finished.',
      solution: `async function loadOrDefault(load, fallback) {
  try {
    return await load();
  } catch {
    return fallback;
  }
}
`,
      explain: '`return await` inside a `try` is the one place where the `await` before `return` changes behaviour: it makes the rejection happen inside the `try`, where `catch` can see it.',
    },
    {
      type: 'read',
      title: 'Promise.allSettled: keep every result',
      md: `
Sometimes one failure shouldn't throw away the rest: sending ten emails, checking five services. \`Promise.allSettled\` waits for **all** of them and never rejects. Each result says what happened:

~~~js
const results = await Promise.allSettled([
  Promise.resolve('ok'),
  Promise.reject(new Error('boom')),
]);
console.log(results[0]);
console.log(results[1].status, results[1].reason.message);
~~~

Each item is either \`{ status: 'fulfilled', value }\` or \`{ status: 'rejected', reason }\`. You then \`filter\` and \`map\` that array like any other (JavaScript lessons 9 and 10).
`,
    },
    {
      type: 'task',
      title: 'summarize',
      md: `
Write \`summarize(promises)\`. Use \`Promise.allSettled\`, then return:

- \`ok\`: the values of the fulfilled ones, in order
- \`failed\`: how many rejected

~~~
await summarize([Promise.resolve(1), Promise.reject(new Error('x')), Promise.resolve(3)])
  → { ok: [1, 3], failed: 1 }
~~~
`,
      starter: `async function summarize(promises) {
  const results = await Promise.allSettled(promises);
  // your code here
}
`,
      tests: [
        { name: 'one failure among three', code: `eq(await summarize([Promise.resolve(1), Promise.reject(new Error('x')), Promise.resolve(3)]), { ok: [1, 3], failed: 1 });` },
        { name: 'all fulfilled', code: `eq(await summarize([Promise.resolve('a')]), { ok: ['a'], failed: 0 });` },
        { name: 'an empty list', code: `eq(await summarize([]), { ok: [], failed: 0 });` },
      ],
      hint: '`ok` is `results.filter((r) => r.status === "fulfilled").map((r) => r.value)`. `failed` is a filter on `"rejected"` and its `.length`.',
      solution: `async function summarize(promises) {
  const results = await Promise.allSettled(promises);
  const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failed = results.filter((r) => r.status === 'rejected').length;
  return { ok, failed };
}
`,
    },
    {
      type: 'read',
      title: 'Promise.race and timeouts',
      md: `
\`Promise.race([...])\` settles as soon as the **first** input settles, with that input's value or error. Its main use is a time limit: race the real work against a timer that rejects.

~~~js
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const slowQuery = delay(300).then(() => 'rows');
const limit = delay(50).then(() => { throw new Error('Timed out'); });

try {
  console.log(await Promise.race([slowQuery, limit]));
} catch (err) {
  console.log(err.message);
}
~~~

The race doesn't cancel the slow work; it just stops waiting for it. For \`fetch\`, Node supports real cancellation with an abort signal:

~~~node
const res = await fetch('https://api.example.com/users', { signal: AbortSignal.timeout(5000) });
~~~

A related helper, \`Promise.any\`, fulfills with the first **success** (ignoring failures unless all fail), which suits "try three mirrors, take whichever answers".
`,
    },
    {
      type: 'task',
      title: 'withTimeout',
      md: `
Write \`withTimeout(promise, ms)\`. It resolves like \`promise\` if that settles within \`ms\` milliseconds. Otherwise it rejects with \`new Error('Timed out after ' + ms + 'ms')\`.

~~~
await withTimeout(delay(10).then(() => 'fast'), 100)   → 'fast'
await withTimeout(delay(200), 50)                       → rejects: 'Timed out after 50ms'
~~~

\`delay\` is already in the starter.
`,
      starter: `const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function withTimeout(promise, ms) {
  // your code here
}
`,
      tests: [
        { name: 'a fast promise resolves with its value', code: `eq(await withTimeout(delay(10).then(() => 'fast'), 100), 'fast');` },
        { name: 'a slow promise rejects', code: `await rejects(withTimeout(delay(200), 50));` },
        {
          name: 'the error message says how long it waited',
          code: `try { await withTimeout(delay(200), 50); assert(false, 'did not reject'); } catch (e) { eq(e.message, 'Timed out after 50ms'); }`,
        },
      ],
      hint: 'Make a second promise: `new Promise((_, reject) => setTimeout(() => reject(new Error(...)), ms))`. Then `return Promise.race([promise, thatTimer])`.',
      solution: `const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function withTimeout(promise, ms) {
  const timer = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timed out after ' + ms + 'ms')), ms);
  });
  return Promise.race([promise, timer]);
}
`,
      explain: 'A production version also clears the timer when the work wins (`clearTimeout`), so a long-running server doesn\'t keep thousands of pointless timers alive.',
    },
    {
      type: 'read',
      title: 'Async and loops',
      md: `
Three ways to process a list with an async function, and they behave differently:

~~~js
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const save = async (id) => { await delay(30); return id; };
const ids = [1, 2, 3];

// 1. for...of with await: one at a time, in order (~90ms)
for (const id of ids) await save(id);

// 2. map + Promise.all: all at once (~30ms), results in order
const saved = await Promise.all(ids.map((id) => save(id)));
console.log(saved);

// 3. forEach with an async callback: does NOT wait at all
ids.forEach(async (id) => { await save(id); });
console.log('forEach returned before any save finished');
~~~

\`forEach\` calls your async callback, gets a promise back, and throws it away. Nothing waits for it, and nothing catches its errors. Use \`for...of\` when order or rate matters, and \`Promise.all(items.map(...))\` when it doesn't.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'Three independent database calls take 50ms each. With `await` on each line, one after another, how long does it take?',
          choices: ['About 150ms', 'About 50ms', 'About 0ms'],
          answer: 0,
          explain: 'Each call starts only after the previous `await` finishes. Use `Promise.all` to get about 50ms.',
          why: { 1: 'That is the `Promise.all` timing.', 2: 'Each `await` really waits.' },
        },
        {
          q: 'One of five promises passed to `Promise.all` rejects. What do you get?',
          choices: ['A rejection with that error; the other results are lost', 'An array with four values and one error', 'Four values, silently skipping the failure'],
          answer: 0,
          explain: '`Promise.all` fails fast. Use `Promise.allSettled` to keep every result.',
          why: { 1: 'That is roughly what `allSettled` gives you.', 2: 'Nothing is silent: the whole thing rejects.' },
        },
        {
          q: 'Why does `try { getUser(2); } catch (e) {}` not catch a rejection from `getUser`?',
          choices: ['Without `await`, the rejection happens after the `try` block has finished', '`try`/`catch` never works with async code', 'Rejections cannot be caught at all'],
          answer: 0,
          explain: '`await` is what brings the rejection back into the `try` as a throw.',
          why: { 1: 'It works fine with `await`.', 2: 'They can, with `await` + `catch` or `.catch()`.' },
        },
        {
          q: 'What does `ids.forEach(async (id) => await save(id))` wait for?',
          choices: ['Nothing: forEach ignores the promises your callback returns', 'Each save, one at a time', 'All saves, in parallel'],
          answer: 0,
          explain: 'Use `for...of` with `await`, or `Promise.all(ids.map(...))`.',
          why: { 1: 'That is `for...of` with `await`.', 2: 'That is `Promise.all` with `map`.' },
        },
        {
          q: 'You race a slow query against a 1-second timer and the timer wins. What happens to the query?',
          choices: ['It keeps running; you just stopped waiting for it', 'It is cancelled automatically', 'It throws inside the query'],
          answer: 0,
          explain: '`Promise.race` cannot cancel work. Real cancellation needs an `AbortSignal` the work understands.',
          why: { 1: 'Promises have no built-in cancel.', 2: 'The query is not affected at all.' },
        },
      ],
    },
  ],
};
