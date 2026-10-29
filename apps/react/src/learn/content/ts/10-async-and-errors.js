// TS course · lesson 10. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
// There is no network here: "fetch" is simulated with async functions that resolve after a short delay.
export default {
  id: 'async-and-errors',
  builds: ['ts/unknown-and-type-guards', 'ts/discriminated-unions', 'ts/generics', 'js/promises-and-async', 'js/errors-and-maps-sets'],
  title: 'Typing async code and errors',
  goal: 'Type async functions with Promise<T>, handle caught errors as unknown, and return a Result<T> instead of throwing, ending with a typed, validated fetch-like function.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Promise<T>',
      md: `
An \`async\` function always returns a Promise. Its return type is **\`Promise<T>\`**, where \`T\` is what you get after \`await\`. It's a generic type, like the ones in lesson 7.

There is no network on this page, so here is a pretend API call: an async function that waits a little, then returns data.

~~~ts
type User = { id: number; name: string };

async function fetchUser(id: number): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 50));  // pretend network delay
  return { id, name: id === 1 ? "Ada" : "Linus" };
}

const user = await fetchUser(1);
console.log(user.name);
~~~

- Inside the function you \`return\` a \`User\`. The \`async\` keyword wraps it, so the function's type is \`Promise<User>\`.
- \`await fetchUser(1)\` unwraps it: \`user\` is a \`User\`. This is \`Awaited\` from lesson 8, done by the language.

Returning the wrong thing is caught inside the function:

~~~
async function count(): Promise<number> {
  return "3";
}
~~~

~~~text
error TS2322: Type 'string' is not assignable to type 'number'.
~~~
`,
    },
    {
      type: 'predict',
      title: 'Forgetting await',
      code: `type User = { id: number; name: string };

async function fetchUser(id: number): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { id, name: "Ada" };
}

const pending = fetchUser(1);
console.log(pending);

const user = await pending;
console.log(user.name);`,
      output: `Promise { <pending> }
Ada`,
      explain: `
Without \`await\`, you have the Promise, not the user. Printing it shows \`Promise { <pending> }\`.

This is a bug \`tsc\` catches well. If you wrote \`pending.name\`, you'd get:

~~~text
error TS2339: Property 'name' does not exist on type 'Promise<User>'.
~~~

When you see \`Promise<...>\` in an error where you expected data, look for a missing \`await\`.
`,
    },
    {
      type: 'task',
      title: 'getUserName',
      md: `
\`fetchUser\` is in the starter. Write \`async function getUserName(id: number): Promise<string>\` that fetches the user and returns their name in uppercase.

~~~
await getUserName(1)  → "ADA"
await getUserName(2)  → "LINUS"
~~~
`,
      starter: `type User = { id: number; name: string };

async function fetchUser(id: number): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 20));
  return { id, name: id === 1 ? "Ada" : "Linus" };
}

async function getUserName(id: number): Promise<string> {
  // your code here
}
`,
      tests: [
        { name: 'user 1 gives "ADA"', code: `eq(await getUserName(1), "ADA");` },
        { name: 'user 2 gives "LINUS"', code: `eq(await getUserName(2), "LINUS");` },
      ],
      hint: '`const user = await fetchUser(id);` then `return user.name.toUpperCase();`',
      solution: `type User = { id: number; name: string };

async function fetchUser(id: number): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 20));
  return { id, name: id === 1 ? "Ada" : "Linus" };
}

async function getUserName(id: number): Promise<string> {
  const user = await fetchUser(id);
  return user.name.toUpperCase();
}
`,
    },
    {
      type: 'read',
      title: 'Caught errors are unknown',
      md: `
What type is \`err\` in a \`catch\`? Anything can be thrown in JavaScript: an \`Error\`, a string, a number, even \`undefined\`. So with strict mode on, \`tsc\` types it as **\`unknown\`** (lesson 9):

~~~
try {
  await fetchUser(1);
} catch (err) {
  console.log(err.message);
}
~~~

~~~text
error TS18046: 'err' is of type 'unknown'.
~~~

Narrow it first. \`instanceof Error\` is the usual check, and it narrows just like \`typeof\` does:

~~~ts
try {
  throw new Error("Network down");
} catch (err) {
  if (err instanceof Error) {
    console.log("Failed:", err.message);   // err is Error here
  } else {
    console.log("Failed:", String(err));
  }
}
~~~
`,
    },
    {
      type: 'task',
      title: 'errorMessage',
      md: `
Write \`errorMessage(err: unknown): string\`:

- an \`Error\` gives its \`message\`
- a string is returned as is
- anything else gives \`"Unknown error"\`

~~~
errorMessage(new Error("timeout"))  → "timeout"
errorMessage("offline")             → "offline"
errorMessage(42)                    → "Unknown error"
~~~
`,
      starter: `function errorMessage(err: unknown): string {
  // your code here
}
`,
      tests: [
        { name: 'an Error gives its message', code: `eq(errorMessage(new Error("timeout")), "timeout");` },
        { name: 'a string is returned as is', code: `eq(errorMessage("offline"), "offline");` },
        { name: 'anything else gives "Unknown error"', code: `eq(errorMessage(42), "Unknown error"); eq(errorMessage(undefined), "Unknown error");` },
      ],
      hint: 'Two checks in order: `if (err instanceof Error) return err.message;` then `if (typeof err === "string") return err;`, then the fallback.',
      solution: `function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  return "Unknown error";
}
`,
    },
    {
      type: 'read',
      title: 'A Result type: errors you can see in the signature',
      md: `
\`Promise<User>\` says nothing about failure. Callers can forget the \`try/catch\`, and \`tsc\` won't remind them.

A common alternative is to **return** failures instead of throwing them, using a discriminated union (lesson 4) that is also generic (lesson 7):

~~~ts
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number> {
  if (b === 0) return { ok: false, error: "Cannot divide by zero" };
  return { ok: true, value: a / b };
}

const r = divide(10, 0);
if (r.ok) {
  console.log("Answer:", r.value);
} else {
  console.log("Error:", r.error);
}
~~~

- \`ok\` is the discriminant, with literal types \`true\` and \`false\`.
- \`E = string\` is a **default type parameter**: \`Result<number>\` means \`Result<number, string>\`.
- The caller can't reach \`r.value\` without checking \`r.ok\` first. Trying gives "Property 'value' does not exist on type '{ ok: false; error: string; }'." The failure case is now part of the type.

Throwing is still right for bugs and truly unexpected failures. \`Result\` suits failures that are normal, like bad input or a 404.
`,
    },
    {
      type: 'task',
      title: 'parseAge returns a Result',
      md: `
The \`Result\` type is in the starter. Write \`parseAge(text: string): Result<number>\`:

- if \`Number(text)\` is a whole number from 0 to 150, return \`{ ok: true, value }\`
- otherwise return \`{ ok: false, error: "Invalid age" }\`

~~~
parseAge("36")   → { ok: true, value: 36 }
parseAge("abc")  → { ok: false, error: "Invalid age" }
parseAge("-1")   → { ok: false, error: "Invalid age" }
~~~

\`Number.isInteger(n)\` is \`false\` for \`NaN\` and for \`3.5\`.
`,
      starter: `type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parseAge(text: string): Result<number> {
  // your code here
}
`,
      tests: [
        { name: '"36" is ok with value 36', code: `eq(parseAge("36"), { ok: true, value: 36 });` },
        { name: '"abc" is an error', code: `eq(parseAge("abc"), { ok: false, error: "Invalid age" });` },
        { name: 'negative and fractional ages are errors', code: `eq(parseAge("-1").ok, false); eq(parseAge("3.5").ok, false);` },
      ],
      hint: '`const n = Number(text);` then `if (Number.isInteger(n) && n >= 0 && n <= 150) return { ok: true, value: n };`, and the error object after.',
      solution: `type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parseAge(text: string): Result<number> {
  const n = Number(text);
  if (Number.isInteger(n) && n >= 0 && n <= 150) {
    return { ok: true, value: n };
  }
  return { ok: false, error: "Invalid age" };
}
`,
    },
    {
      type: 'task',
      title: 'attempt: from throwing to Result',
      md: `
Write a generic helper that runs any async function and turns a thrown error into a \`Result\`:

\`async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>>\`

- if \`await fn()\` succeeds, return \`{ ok: true, value }\`
- if it throws, return \`{ ok: false, error: errorMessage(err) }\`

~~~
await attempt(async () => 42)                          → { ok: true, value: 42 }
await attempt(async () => { throw new Error("down"); })  → { ok: false, error: "down" }
~~~

\`Result\` and \`errorMessage\` are in the starter.
`,
      starter: `type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>> {
  // your code here
}
`,
      tests: [
        { name: 'a success is wrapped in ok: true', code: `eq(await attempt(async () => 42), { ok: true, value: 42 });` },
        { name: 'a thrown Error becomes ok: false with its message', code: `eq(await attempt(async () => { throw new Error("down"); }), { ok: false, error: "down" });` },
        { name: 'a thrown string becomes ok: false too', code: `eq(await attempt(async () => { throw "offline"; }), { ok: false, error: "offline" });` },
      ],
      hint: 'Put `const value = await fn(); return { ok: true, value };` inside `try`, and return the error object inside `catch (err)`.',
      solution: `type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
`,
      explain: 'The `await` inside `try` matters. `return fn()` without `await` would hand back the Promise before it rejects, so the `catch` would never run.',
    },
    {
      type: 'read',
      title: 'A pretend fetch',
      md: `
The last task looks like real API code. Since there's no network, \`fakeFetch\` stands in for \`fetch\`. It resolves with a status code and a text body, roughly what \`await fetch(url)\` followed by \`await res.text()\` would give you:

~~~ts
type FakeResponse = { status: number; body: string };

async function fakeFetch(url: string): Promise<FakeResponse> {
  await new Promise((resolve) => setTimeout(resolve, 20));
  if (url === "/todos") return { status: 200, body: '[{ "id": 1, "title": "Read", "done": false }]' };
  return { status: 404, body: "Not found" };
}

const res = await fakeFetch("/todos");
console.log(res.status, res.body.length > 0);
~~~

A careful API function does three things, and each one is from this track:

1. Check the status. A 404 does **not** throw with \`fetch\`, so you have to look.
2. Parse the body as \`unknown\` (lesson 9). Never annotate it straight to the type you hope for.
3. Validate it with a type guard, and return a \`Result\` (this lesson) so the caller must handle failure.
`,
    },
    {
      type: 'task',
      title: 'getTodos: typed, validated, no surprises',
      md: `
Write \`async function getTodos(url: string): Promise<Result<Todo[]>>\`. Everything else is in the starter.

1. \`const res = await fakeFetch(url);\`
2. If \`res.status !== 200\`, return \`{ ok: false, error: "HTTP " + res.status }\`.
3. Parse: \`const data: unknown = JSON.parse(res.body);\`
4. If \`data\` is not an array, or not every item passes \`isTodo\`, return \`{ ok: false, error: "Bad data" }\`.
5. Otherwise return \`{ ok: true, value: data }\`.

~~~
await getTodos("/todos")    → { ok: true, value: [{ id: 1, title: "Read", done: false }] }
await getTodos("/missing")  → { ok: false, error: "HTTP 404" }
await getTodos("/broken")   → { ok: false, error: "Bad data" }
~~~
`,
      starter: `type Todo = { id: number; title: string; done: boolean };
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
type FakeResponse = { status: number; body: string };

async function fakeFetch(url: string): Promise<FakeResponse> {
  await new Promise((resolve) => setTimeout(resolve, 20));
  if (url === "/todos") return { status: 200, body: '[{ "id": 1, "title": "Read", "done": false }]' };
  if (url === "/broken") return { status: 200, body: '[{ "id": "one" }]' };
  return { status: 404, body: "Not found" };
}

function isTodo(value: unknown): value is Todo {
  return (
    typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "number" &&
    "title" in value && typeof value.title === "string" &&
    "done" in value && typeof value.done === "boolean"
  );
}

async function getTodos(url: string): Promise<Result<Todo[]>> {
  // your code here
}
`,
      tests: [
        { name: '/todos gives ok with the parsed todos', code: `eq(await getTodos("/todos"), { ok: true, value: [{ id: 1, title: "Read", done: false }] });` },
        { name: 'a 404 gives the error "HTTP 404"', code: `eq(await getTodos("/missing"), { ok: false, error: "HTTP 404" });` },
        { name: 'items with the wrong shape give "Bad data"', code: `eq(await getTodos("/broken"), { ok: false, error: "Bad data" });` },
      ],
      hint: 'Step 4 is `if (!Array.isArray(data) || !data.every(isTodo)) return { ok: false, error: "Bad data" };`. After that check, `tsc` knows `data` is `Todo[]`.',
      solution: `type Todo = { id: number; title: string; done: boolean };
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
type FakeResponse = { status: number; body: string };

async function fakeFetch(url: string): Promise<FakeResponse> {
  await new Promise((resolve) => setTimeout(resolve, 20));
  if (url === "/todos") return { status: 200, body: '[{ "id": 1, "title": "Read", "done": false }]' };
  if (url === "/broken") return { status: 200, body: '[{ "id": "one" }]' };
  return { status: 404, body: "Not found" };
}

function isTodo(value: unknown): value is Todo {
  return (
    typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "number" &&
    "title" in value && typeof value.title === "string" &&
    "done" in value && typeof value.done === "boolean"
  );
}

async function getTodos(url: string): Promise<Result<Todo[]>> {
  const res = await fakeFetch(url);
  if (res.status !== 200) {
    return { ok: false, error: "HTTP " + res.status };
  }
  const data: unknown = JSON.parse(res.body);
  if (!Array.isArray(data) || !data.every(isTodo)) {
    return { ok: false, error: "Bad data" };
  }
  return { ok: true, value: data };
}
`,
      explain: `
\`data.every(isTodo)\` works like \`filter(isUser)\` in lesson 9: \`every\` with a type guard narrows the whole array to \`Todo[]\` when it returns \`true\`.

Look at what the caller gets: a \`Promise<Result<Todo[]>>\`. The signature alone says "this is async, it can fail, and when it succeeds you get checked todos". That's the goal of typing async code.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'What is the return type of `async function load() { return 42; }`?',
          choices: ['`Promise<number>`', '`number`', '`Promise<void>`'],
          answer: 0,
          explain: 'An async function always returns a Promise. `await load()` gives the `number`.',
          why: { 1: 'That is what you get after `await`, not what the function returns.', 2: 'It returns `42`, so the Promise holds a number.' },
        },
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nasync function f(): Promise<{ name: string }> {\n  return { name: "Ada" };\n}\nconst a = await f();\nconsole.log(a.name);     // line A\nconsole.log(f().name);   // line B\n~~~',
          choices: ['Line A', 'Line B', 'Neither'],
          answer: 1,
          explain: '`f()` without `await` is a Promise: "Property \'name\' does not exist on type \'Promise<{ name: string; }>\'."',
          why: { 0: '`a` was awaited, so it is the object.', 2: 'The missing `await` on line B is exactly what `tsc` catches.' },
        },
        {
          q: 'In `catch (err)`, with strict mode on, what is the type of `err`?',
          choices: ['`unknown`', '`Error`', '`string`'],
          answer: 0,
          explain: 'JavaScript can throw any value, so `tsc` cannot promise it is an `Error`. Narrow with `instanceof Error` first.',
          why: { 1: '`throw "oops"` is legal, and that is not an Error.', 2: 'Most thrown values are Error objects, not strings.' },
        },
        {
          q: 'With `const r: Result<number>`, why can you not read `r.value` straight away?',
          choices: ['`value` only exists on the `ok: true` member, so you must check `r.ok` first', '`value` is private', 'Result values are only available after `await`'],
          answer: 0,
          explain: '`Result` is a discriminated union on `ok`. Checking `r.ok` narrows it to the member that has `value`, which forces callers to think about the error case.',
          why: { 1: 'There is nothing private here. It is narrowing.', 2: '`Result` is a plain object, not a Promise.' },
        },
      ],
    },
  ],
};
