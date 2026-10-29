// TS course · lesson 8. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
export default {
  id: 'utility-types',
  builds: ['ts/generics', 'ts/object-types', 'js/spread-and-destructuring', 'js/map'],
  title: 'Utility types: Partial, Pick, Omit, ReturnType, Awaited',
  goal: 'Derive new types from one source type instead of copying it: update payloads, previews, create inputs, and the types of things functions return.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'One type, many shapes',
      md: `
A real app has one \`User\` but needs several shapes of it:

- the full user from the database
- an **update** payload, where every field is optional (you only send what changed)
- a **create** payload, without the \`id\` (the server assigns it)
- a **preview** with just the id and name for a list

You could write four types by hand, but then adding a field to \`User\` means editing four places, and forgetting one compiles fine. TypeScript ships **utility types**: generic types (lesson 7) that build a new type from an existing one.

The first is **\`Partial<T>\`**, which makes every property optional:

~~~
type User = { id: number; name: string; email: string };

type UserUpdate = Partial<User>;
// same as { id?: number; name?: string; email?: string }
~~~

Utility types are types only. Like everything in this track, they disappear when the code runs.
`,
    },
    {
      type: 'predict',
      title: 'Applying a Partial update',
      code: `type User = { id: number; name: string; email: string };

function update(user: User, changes: Partial<User>): User {
  return { ...user, ...changes };
}

const ada: User = { id: 1, name: "Ada", email: "ada@old.com" };
const next = update(ada, { email: "ada@new.com" });

console.log(next);
console.log(ada.email);`,
      output: `{ id: 1, name: "Ada", email: "ada@new.com" }
ada@old.com`,
      explain: `
Spread (JavaScript lesson 12) copies \`user\`, then \`changes\` overwrites only the keys it has. The original \`ada\` is untouched.

\`Partial<User>\` lets the caller pass \`{ email: ... }\` alone, but still checks every key it does pass: \`{ emial: "x" }\` or \`{ email: 5 }\` would be rejected.
`,
    },
    {
      type: 'task',
      title: 'updateTodo',
      md: `
The React state update from JavaScript lesson 9, now typed. Write:

\`updateTodo(todos: Todo[], id: number, changes: Partial<Todo>): Todo[]\`

It returns a **new** array where the todo with that \`id\` has \`changes\` applied, and every other todo is unchanged.

~~~
updateTodo([{ id: 1, title: "Read", done: false }, { id: 2, title: "Write", done: false }], 2, { done: true })
  → [{ id: 1, title: "Read", done: false }, { id: 2, title: "Write", done: true }]
~~~
`,
      starter: `type Todo = { id: number; title: string; done: boolean };

function updateTodo(todos: Todo[], id: number, changes: Partial<Todo>): Todo[] {
  // your code here
}
`,
      tests: [
        {
          name: 'updates only the todo with that id',
          code: `const todos = [{ id: 1, title: "Read", done: false }, { id: 2, title: "Write", done: false }];
eq(updateTodo(todos, 2, { done: true }), [{ id: 1, title: "Read", done: false }, { id: 2, title: "Write", done: true }]);`,
        },
        {
          name: 'does not change the original todos',
          code: `const todos = [{ id: 1, title: "Read", done: false }];
updateTodo(todos, 1, { title: "Reread" });
eq(todos[0].title, "Read", "the original changed: return { ...todo, ...changes } instead of editing todo");`,
        },
      ],
      hint: '`return todos.map((t) => (t.id === id ? { ...t, ...changes } : t));`',
      solution: `type Todo = { id: number; title: string; done: boolean };

function updateTodo(todos: Todo[], id: number, changes: Partial<Todo>): Todo[] {
  return todos.map((t) => (t.id === id ? { ...t, ...changes } : t));
}
`,
    },
    {
      type: 'read',
      title: 'Pick and Omit',
      md: `
**\`Pick<T, Keys>\`** keeps only the listed keys. **\`Omit<T, Keys>\`** keeps everything except them. The keys are a union of key names, like \`keyof\` from lesson 7:

~~~
type User = { id: number; name: string; email: string; passwordHash: string };

type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string }

type NewUser = Omit<User, "id">;
// { name: string; email: string; passwordHash: string }

type PublicUser = Omit<User, "passwordHash">;
// { id: number; name: string; email: string }
~~~

Pick when you want a few fields. Omit when you want most of them. Either way, they follow \`User\`: add a field to \`User\` and \`NewUser\` gets it automatically.

Extra keys are rejected like with any object type:

~~~
const draft: NewUser = { id: 3, name: "Grace", email: "g@example.com", passwordHash: "x" };
~~~

~~~text
error TS2353: Object literal may only specify known properties, and 'id' does not exist in type 'NewUser'.
~~~
`,
    },
    {
      type: 'task',
      title: 'toPreview',
      md: `
Write \`toPreview(user: User): UserPreview\` that returns just the \`id\` and \`name\`. The types are in the starter.

~~~
toPreview({ id: 1, name: "Ada", email: "ada@example.com" })  → { id: 1, name: "Ada" }
~~~

Be careful: returning \`user\` itself would pass \`tsc\` (it has all the fields a preview needs), but the email would still be in the object at runtime. Build a new object.
`,
      starter: `type User = { id: number; name: string; email: string };
type UserPreview = Pick<User, "id" | "name">;

function toPreview(user: User): UserPreview {
  // your code here
}
`,
      tests: [
        { name: 'returns only id and name', code: `eq(toPreview({ id: 1, name: "Ada", email: "ada@example.com" }), { id: 1, name: "Ada" });` },
      ],
      hint: 'Destructure or build it directly: `return { id: user.id, name: user.name };`',
      solution: `type User = { id: number; name: string; email: string };
type UserPreview = Pick<User, "id" | "name">;

function toPreview(user: User): UserPreview {
  return { id: user.id, name: user.name };
}
`,
      explain: 'This is the gap between types and runtime again. A type describes the **least** an object must have, not everything it might carry. If extra fields must not leak (like a password hash in an API response), you have to remove them in code.',
    },
    {
      type: 'task',
      title: 'createUser',
      md: `
Write \`createUser(input: NewUser, id: number): User\` that returns a full user: the \`id\` plus everything in \`input\`.

~~~
createUser({ name: "Grace", email: "grace@example.com" }, 3)
  → { id: 3, name: "Grace", email: "grace@example.com" }
~~~
`,
      starter: `type User = { id: number; name: string; email: string };
type NewUser = Omit<User, "id">;

function createUser(input: NewUser, id: number): User {
  // your code here
}
`,
      tests: [
        { name: 'adds the id to the input', code: `eq(createUser({ name: "Grace", email: "grace@example.com" }, 3), { id: 3, name: "Grace", email: "grace@example.com" });` },
        { name: 'does not change the input', code: `const input = { name: "Grace", email: "g@example.com" }; createUser(input, 3); eq(input, { name: "Grace", email: "g@example.com" });` },
      ],
      hint: '`return { id, ...input };`',
      solution: `type User = { id: number; name: string; email: string };
type NewUser = Omit<User, "id">;

function createUser(input: NewUser, id: number): User {
  return { id, ...input };
}
`,
    },
    {
      type: 'read',
      title: 'Types from values: typeof, ReturnType, Awaited',
      md: `
Sometimes the thing you want to describe already exists as a value. \`typeof\` in a **type position** turns a value into its type:

~~~
const defaults = { theme: "light", pageSize: 20 };
type Settings = typeof defaults;   // { theme: string; pageSize: number }
~~~

**\`ReturnType<F>\`** gives the return type of a function type:

~~~
function makeUser(name: string) {
  return { id: Date.now(), name, createdAt: new Date() };
}
type MadeUser = ReturnType<typeof makeUser>;
// { id: number; name: string; createdAt: Date }
~~~

**\`Awaited<T>\`** unwraps a Promise (lesson 10 goes deeper):

~~~
async function loadUser() {
  return { id: 1, name: "Ada" };
}
type Loaded = Awaited<ReturnType<typeof loadUser>>;
// ReturnType gives Promise<{ id: number; name: string }>
// Awaited unwraps it to { id: number; name: string }
~~~

Utility types also nest. A patch that can change anything **except** the id:

~~~
type UserPatch = Partial<Omit<User, "id">>;
~~~
`,
    },
    {
      type: 'predict',
      title: 'Two different typeofs',
      md: '`typeof` in a type is TypeScript. `typeof` in an expression is the JavaScript operator from lesson 3.',
      code: `const defaults = { theme: "light", pageSize: 20 };
type Settings = typeof defaults;

const mine: Settings = { theme: "dark", pageSize: 50 };

console.log(typeof mine);
console.log(typeof mine.pageSize);`,
      output: `object
number`,
      explain: `
\`type Settings = typeof defaults\` is erased completely. The two \`console.log\` lines use the runtime \`typeof\` operator, which only knows JavaScript's basic categories: \`"object"\`, \`"number"\`, \`"string"\` and so on. It can never tell you "Settings".

Rule of thumb: after \`type X =\` or a \`:\`, you're in type land. Everywhere else, you're in JavaScript.
`,
    },
    {
      type: 'task',
      title: 'patchUser keeps the id',
      md: `
Write \`patchUser(user: User, patch: UserPatch): User\` where \`UserPatch = Partial<Omit<User, "id">>\`. It applies the patch, but the result must **always** keep the original \`id\`.

~~~
patchUser({ id: 1, name: "Ada", email: "a@x.com" }, { name: "Ada L." })
  → { id: 1, name: "Ada L.", email: "a@x.com" }
~~~

The type already forbids \`id\` in a patch. But patches often come from a request body, which isn't checked at runtime. One test sends \`{ id: 99 }\` from plain JavaScript; your function must still keep \`id: 1\`.
`,
      starter: `type User = { id: number; name: string; email: string };
type UserPatch = Partial<Omit<User, "id">>;

function patchUser(user: User, patch: UserPatch): User {
  return { ...user, ...patch };
}
`,
      tests: [
        { name: 'applies the changed fields', code: `eq(patchUser({ id: 1, name: "Ada", email: "a@x.com" }, { name: "Ada L." }), { id: 1, name: "Ada L.", email: "a@x.com" });` },
        { name: 'an id in the patch is ignored', code: `eq(patchUser({ id: 1, name: "Ada", email: "a@x.com" }, { id: 99 }).id, 1, "the id changed: put id: user.id after the spreads");` },
      ],
      hint: 'Spreads are applied left to right, so whatever comes last wins. Add `id: user.id` after `...patch`.',
      solution: `type User = { id: number; name: string; email: string };
type UserPatch = Partial<Omit<User, "id">>;

function patchUser(user: User, patch: UserPatch): User {
  return { ...user, ...patch, id: user.id };
}
`,
      explain: 'The type protects every caller you write. The `id: user.id` protects you from callers you don\'t control. Lesson 9 is about that second kind of data.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Assume `type User = { id: number; name: string; email: string }` throughout.',
      items: [
        {
          q: 'Which type is `{ name: string; email: string }`?',
          choices: ['`Omit<User, "id">`', '`Pick<User, "id">`', '`Partial<User>`'],
          answer: 0,
          explain: '`Omit` removes the listed keys and keeps the rest.',
          why: { 1: '`Pick<User, "id">` keeps only `id`.', 2: '`Partial` keeps every key, including `id`, and makes them all optional.' },
        },
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nconst a: Partial<User> = {};                // A\nconst b: Partial<User> = { name: 5 };       // B\nconst c: Partial<User> = { email: "x" };    // C\n~~~',
          choices: ['A', 'B', 'C'],
          answer: 1,
          explain: '`Partial` makes keys optional, but their types stay the same: `name` must still be a string.',
          why: { 0: 'Every key is optional, so an empty object fits.', 2: 'A single correctly-typed key is exactly what `Partial` allows.' },
        },
        {
          q: 'Given `async function load() { return 42; }`, what is `Awaited<ReturnType<typeof load>>`?',
          choices: ['`number`', '`Promise<number>`', '`() => Promise<number>`'],
          answer: 0,
          explain: '`typeof load` is the function type, `ReturnType` gives `Promise<number>`, and `Awaited` unwraps it to `number`.',
          why: { 1: 'That is `ReturnType<typeof load>` before `Awaited` unwraps it.', 2: 'That is `typeof load` alone.' },
        },
        {
          q: 'A function returns `UserPreview` (`Pick<User, "id" | "name">`) and you return the full `user`. What happens?',
          choices: ['tsc accepts it, and the email is still in the object at runtime', 'tsc rejects it because of the extra field', 'The email is removed automatically'],
          answer: 0,
          explain: 'A variable with extra fields still fits a smaller type. Only fresh object literals get the "known properties" check. Types never remove fields, so build the smaller object yourself.',
          why: { 1: 'The extra-property error only applies to object literals written in place, not to existing variables.', 2: 'Types are erased. Nothing at runtime knows about `Pick`.' },
        },
      ],
    },
  ],
};
