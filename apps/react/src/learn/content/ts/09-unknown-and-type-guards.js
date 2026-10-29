// TS course · lesson 9. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
export default {
  id: 'unknown-and-type-guards',
  builds: ['ts/unions-and-narrowing', 'ts/utility-types', 'js/filter-and-find'],
  title: 'unknown vs any, and parsing untrusted data',
  goal: 'Treat data from outside your program as unknown, check it with type guards you write yourself, and only then trust its type.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The hole in the types',
      md: `
Every lesson so far has said "types are erased". That's fine for values your own code creates, because \`tsc\` checked every place they came from. But some values come from **outside**: \`JSON.parse\`, a \`fetch\` response, \`localStorage\`, a form. \`tsc\` has never seen them.

\`JSON.parse\` is typed to return **\`any\`**. As lesson 1 said, \`any\` switches checking off, and it spreads: anything you read from an \`any\` is also \`any\`.

~~~
type User = { name: string; address: { city: string } };

const user: User = JSON.parse(text);   // tsc: fine, any fits everything
console.log(user.address.city);        // tsc: fine
~~~

\`tsc\` is happy. Whether this crashes depends entirely on what \`text\` contains.
`,
    },
    {
      type: 'predict',
      title: 'any lets a crash through',
      md: 'The JSON has no `address`. `tsc` would accept every line here.',
      code: `type User = { name: string; address: { city: string } };

const user: User = JSON.parse('{ "name": "Ada" }');
console.log(user.name);
console.log(user.address.city);`,
      throws: true,
      output: `Ada
TypeError: Cannot read properties of undefined (reading 'city')`,
      explain: `
The first line prints \`Ada\`. Then \`user.address\` is \`undefined\` at runtime, and reading \`.city\` from \`undefined\` throws a \`TypeError\`.

The annotation \`: User\` was a claim nobody checked. This is the most common way TypeScript apps crash: a type annotation on data that came from outside.
`,
    },
    {
      type: 'read',
      title: 'unknown: the safe version of any',
      md: `
**\`unknown\`** also accepts any value, but it lets you do **nothing** with it until you check what it is:

~~~
const data: unknown = JSON.parse(text);
console.log(data.name);
~~~

~~~text
error TS18046: 'data' is of type 'unknown'.
~~~

| | assign anything to it | use it without checking |
|---|---|---|
| \`any\` | yes | yes (unsafe) |
| \`unknown\` | yes | no |

To use an \`unknown\`, you narrow it with the checks from lesson 3, plus a couple of new ones:

- \`typeof x === "string"\` (or \`"number"\`, \`"boolean"\`)
- \`Array.isArray(x)\`
- \`typeof x === "object" && x !== null\` for "is a real object". You need both: \`typeof null\` is \`"object"\`, a famous JavaScript quirk.
- \`"key" in x\` once you know it's an object

~~~ts
function describe(x: unknown): string {
  if (typeof x === "string") return "string of length " + x.length;
  if (Array.isArray(x)) return "array of " + x.length;
  if (typeof x === "object" && x !== null) return "object";
  return "something else";
}

console.log(describe("hi"), "|", describe([1, 2]), "|", describe({}), "|", describe(null));
~~~
`,
    },
    {
      type: 'task',
      title: 'toCount',
      md: `
Write \`toCount(x: unknown): number\` that returns \`x\` if it's a number, and \`0\` for anything else.

~~~
toCount(5)       → 5
toCount("5")     → 0
toCount(null)    → 0
~~~
`,
      starter: `function toCount(x: unknown): number {
  // your code here
}
`,
      tests: [
        { name: 'a number is returned as is', code: `eq(toCount(5), 5);` },
        { name: 'a numeric string gives 0', code: `eq(toCount("5"), 0);` },
        { name: 'null and undefined give 0', code: `eq(toCount(null), 0); eq(toCount(undefined), 0);` },
      ],
      hint: '`if (typeof x === "number") return x;` and then `return 0;`',
      solution: `function toCount(x: unknown): number {
  if (typeof x === "number") {
    return x;
  }
  return 0;
}
`,
    },
    {
      type: 'read',
      title: 'Type guards: x is T',
      md: `
Checking a whole object inline gets long. Wrap the checks in a function with a special return type, **\`x is T\`**:

~~~ts
type Point = { x: number; y: number };

function isPoint(value: unknown): value is Point {
  return (
    typeof value === "object" &&
    value !== null &&
    "x" in value && typeof value.x === "number" &&
    "y" in value && typeof value.y === "number"
  );
}

const data: unknown = JSON.parse('{ "x": 3, "y": 4 }');
if (isPoint(data)) {
  console.log(Math.hypot(data.x, data.y));   // data is Point here
}
~~~

This is a **user-defined type guard**:

- At runtime it's an ordinary function returning \`true\` or \`false\`.
- \`value is Point\` tells \`tsc\`: "when this returns \`true\`, treat \`value\` as a \`Point\`". So inside \`if (isPoint(data))\`, \`data\` is narrowed exactly like a \`typeof\` check would narrow it.

The catch: \`tsc\` **trusts** your guard. If the body checks the wrong things, the narrowing is a lie. Make the checks match the type.
`,
    },
    {
      type: 'task',
      title: 'isUser',
      md: `
Write \`isUser(value: unknown): value is User\` for \`type User = { id: number; name: string }\`. Return \`true\` only when \`value\` is a non-null object with a numeric \`id\` and a string \`name\`.

~~~
isUser({ id: 1, name: "Ada" })   → true
isUser({ id: "1", name: "Ada" }) → false
isUser(null)                     → false
~~~

Follow \`isPoint\` from the previous step.
`,
      starter: `type User = { id: number; name: string };

function isUser(value: unknown): value is User {
  // your code here
}
`,
      tests: [
        { name: 'a valid user is accepted', code: `eq(isUser({ id: 1, name: "Ada" }), true);` },
        { name: 'a string id is rejected', code: `eq(isUser({ id: "1", name: "Ada" }), false);` },
        { name: 'a missing name is rejected', code: `eq(isUser({ id: 1 }), false);` },
        { name: 'null and non-objects are rejected', code: `eq(isUser(null), false); eq(isUser("Ada"), false);` },
      ],
      hint: 'Copy `isPoint` and change the two property checks: `"id" in value && typeof value.id === "number"` and `"name" in value && typeof value.name === "string"`.',
      solution: `type User = { id: number; name: string };

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value && typeof value.id === "number" &&
    "name" in value && typeof value.name === "string"
  );
}
`,
    },
    {
      type: 'predict',
      title: 'A type guard as a filter callback',
      md: 'A type guard is a predicate (JavaScript lesson 10), so it can go straight into `filter`.',
      code: `type User = { id: number; name: string };

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "number" &&
    "name" in value && typeof value.name === "string"
  );
}

const raw: unknown[] = [{ id: 1, name: "Ada" }, "oops", { id: 2 }, { id: 3, name: "Grace" }];
const users = raw.filter(isUser);

console.log(users.length);
console.log(users.map((u) => u.name));`,
      output: `2
[ "Ada", "Grace" ]`,
      explain: `
\`filter\` keeps the two items that pass \`isUser\`. Because the callback is a type guard, \`tsc\` also changes the result type from \`unknown[]\` to \`User[]\`, which is why \`u.name\` is allowed in the \`map\`.

With an ordinary \`(x) => boolean\` callback, \`users\` would still be \`unknown[]\`.
`,
    },
    {
      type: 'read',
      title: 'as is a claim, not a check',
      md: `
You'll see code like this:

~~~
const user = JSON.parse(text) as User;
~~~

\`as User\` is a **type assertion**. It tells \`tsc\` "trust me, this is a User". It checks nothing and erases to nothing: at runtime it's just \`JSON.parse(text)\`. It's the same hole as \`const user: User = JSON.parse(text)\` from the start of this lesson, spelled differently.

\`as\` is fine when you genuinely know more than \`tsc\` (like the \`{} as Record<...>\` starting value in lesson 7). For data from outside, check instead of asserting.

Hand-written guards get long for big types. Real projects often use a validation library, such as Zod or Valibot, where you describe the shape once and get both the runtime check and the TypeScript type from it. The idea is exactly what you're doing here.
`,
    },
    {
      type: 'task',
      title: 'parseUsers',
      md: `
Put it together. Write \`parseUsers(json: string): User[]\`:

1. \`JSON.parse\` the text into an \`unknown\`.
2. If it's not an array, return \`[]\`.
3. Otherwise return only the items that pass \`isUser\` (already in the starter).

~~~
parseUsers('[{ "id": 1, "name": "Ada" }, { "id": "x" }]')  → [{ id: 1, name: "Ada" }]
parseUsers('{ "id": 1, "name": "Ada" }')                    → []
~~~

You can assume the text is valid JSON.
`,
      starter: `type User = { id: number; name: string };

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "number" &&
    "name" in value && typeof value.name === "string"
  );
}

function parseUsers(json: string): User[] {
  const data: unknown = JSON.parse(json);
  // your code here
}
`,
      tests: [
        { name: 'keeps only the valid users', code: `eq(parseUsers('[{ "id": 1, "name": "Ada" }, { "id": "x" }]'), [{ id: 1, name: "Ada" }]);` },
        { name: 'a JSON object that is not an array gives []', code: `eq(parseUsers('{ "id": 1, "name": "Ada" }'), []);` },
        { name: 'an empty array gives []', code: `eq(parseUsers('[]'), []);` },
      ],
      hint: '`if (!Array.isArray(data)) return [];` then `return data.filter(isUser);`',
      solution: `type User = { id: number; name: string };

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "number" &&
    "name" in value && typeof value.name === "string"
  );
}

function parseUsers(json: string): User[] {
  const data: unknown = JSON.parse(json);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(isUser);
}
`,
      explain: 'Every value that leaves `parseUsers` has been checked, so from here on the `User` type is telling the truth. That boundary, "check once at the edge, trust inside", is the pattern for API responses in the next lesson.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nconst a: any = JSON.parse(text);\nconst b: unknown = JSON.parse(text);\nconsole.log(a.name);   // line A\nconsole.log(b.name);   // line B\n~~~',
          choices: ['Line A', 'Line B', 'Neither'],
          answer: 1,
          explain: '`unknown` must be narrowed before use: "\'b\' is of type \'unknown\'." `any` allows line A, which might crash at runtime.',
          why: { 0: '`any` switches checking off, so `tsc` allows it, safe or not.', 2: 'That is the whole difference between `any` and `unknown`.' },
        },
        {
          q: 'What does `JSON.parse(text) as User` check at runtime?',
          choices: ['Nothing', 'That every User field is present', 'That the text is a JSON object'],
          answer: 0,
          explain: 'An assertion is erased. It only changes what `tsc` believes. `JSON.parse` itself only checks that the text is valid JSON.',
          why: { 1: 'Only code you write (a guard or a validation library) checks fields.', 2: '`JSON.parse` accepts any valid JSON, including arrays and numbers. `as` adds nothing.' },
        },
        {
          q: 'Why check `value !== null` as well as `typeof value === "object"`?',
          choices: ['Because `typeof null` is `"object"`', 'Because `null` is not allowed in JSON', 'Because `typeof` throws on null'],
          answer: 0,
          explain: 'A long-standing JavaScript quirk. Without the null check, `"id" in value` would throw for `null`.',
          why: { 1: '`null` is valid JSON.', 2: '`typeof null` works fine. It just gives the wrong-looking answer.' },
        },
        {
          q: 'What does `value is User` in a function\'s return type do?',
          choices: ['Tells tsc to narrow `value` to `User` when the function returns true', 'Checks at runtime that `value` is a User', 'Converts `value` into a User'],
          answer: 0,
          explain: 'At runtime the function just returns a boolean. The `value is User` part is how `tsc` learns what that boolean means. Your body does the real checking.',
          why: { 1: 'The type is erased. Your function body does the runtime checks.', 2: 'Types never convert values.' },
        },
      ],
    },
  ],
};
