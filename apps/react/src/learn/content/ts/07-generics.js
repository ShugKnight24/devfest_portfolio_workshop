// TS course · lesson 7. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
export default {
  id: 'generics',
  builds: ['ts/functions', 'ts/arrays-and-records', 'js/map', 'js/reduce-and-sort'],
  title: 'Generics: one function, any type',
  goal: 'Write functions that work for any item type and keep that type: first, map, pluck and a typed groupBy, with constraints using extends and keyof.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'The problem generics solve',
      md: `
In lesson 5 you wrote \`mapNumbers\`. It only works on numbers. For strings you'd need \`mapStrings\`, for users \`mapUsers\`, and so on, all with the same body.

Here's a smaller example. "Give me the first item" for two types:

~~~
function firstNumber(items: number[]): number | undefined { return items[0]; }
function firstString(items: string[]): string | undefined { return items[0]; }
~~~

You could use \`any[]\`, but then the result is \`any\` and you lose all checking on whatever comes out.

A **generic** function takes a **type parameter**, written in angle brackets:

~~~ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}

console.log(first([10, 20]), first(["a", "b"]));
~~~

Read \`first<T>\` as "first, for some type T". \`T\` is a placeholder, like a parameter, but for a type. You don't pass it yourself: \`tsc\` **infers** it from the argument. \`first([10, 20])\` sets \`T = number\`, so the result is \`number | undefined\`.

\`T\` is just a name. Single capitals are the habit (\`T\` for type, \`K\` for key, \`U\` for a second type), but \`first<Item>\` works too.
`,
    },
    {
      type: 'predict',
      title: 'Generics run as plain JavaScript',
      code: `function first<T>(items: T[]): T | undefined {
  return items[0];
}

console.log(first([10, 20]));
console.log(first(["a", "b"]));
console.log(first([]));`,
      output: `10
a
undefined`,
      explain: `
After erasing, \`first\` is just \`function first(items) { return items[0]; }\`. Generics exist only for \`tsc\`.

The difference is what \`tsc\` knows about the result. For \`first([10, 20])\` it's \`number | undefined\`, so this is caught:

~~~
const n: number = first(["a"]);
~~~

~~~text
error TS2322: Type 'string | undefined' is not assignable to type 'number'.
  Type 'undefined' is not assignable to type 'number'.
~~~

With \`any[]\`, that line would have passed silently.
`,
    },
    {
      type: 'task',
      title: 'last',
      md: `
**Example:** \`first<T>\` from the previous step.

**Your turn:** write \`last<T>(items: T[]): T | undefined\` that returns the last item, or \`undefined\` for an empty array.

~~~
last([1, 2, 3])  → 3
last(["a"])      → "a"
last([])         → undefined
~~~
`,
      starter: `function last<T>(items: T[]): T | undefined {
  // your code here
}
`,
      tests: [
        { name: 'last([1, 2, 3]) is 3', code: `eq(last([1, 2, 3]), 3);` },
        { name: 'works with strings', code: `eq(last(["a"]), "a");` },
        { name: 'an empty array gives undefined', code: `eq(last([]), undefined);` },
      ],
      hint: 'The last index is `items.length - 1`. (Or `items.at(-1)`.)',
      solution: `function last<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}
`,
    },
    {
      type: 'task',
      title: 'A generic map',
      md: `
Now \`mapNumbers\` from lesson 5, for any types. It needs **two** type parameters, because the items going in and coming out can differ:

\`myMap<T, U>(items: T[], fn: (item: T) => U): U[]\`

~~~
myMap([1, 2, 3], (n) => n * 2)       → [2, 4, 6]       (T = number, U = number)
myMap(["hi", "hey"], (s) => s.length) → [2, 3]          (T = string, U = number)
~~~

The signature is in the starter. The body is the loop you already wrote.
`,
      starter: `function myMap<T, U>(items: T[], fn: (item: T) => U): U[] {
  // your code here
}
`,
      tests: [
        { name: 'doubles numbers', code: `eq(myMap([1, 2, 3], (n) => n * 2), [2, 4, 6]);` },
        { name: 'turns strings into their lengths', code: `eq(myMap(["hi", "hey"], (s) => s.length), [2, 3]);` },
        { name: 'an empty array gives []', code: `eq(myMap([], (x) => x), []);` },
      ],
      hint: '`const result: U[] = [];`, then `for (const item of items) result.push(fn(item));`, then `return result;`',
      solution: `function myMap<T, U>(items: T[], fn: (item: T) => U): U[] {
  const result: U[] = [];
  for (const item of items) {
    result.push(fn(item));
  }
  return result;
}
`,
      explain: 'This is almost exactly how `Array.prototype.map` is typed in TypeScript\'s own library. `tsc` infers `T` from the array and `U` from what your callback returns.',
    },
    {
      type: 'read',
      title: 'Constraints: extends',
      md: `
Inside a generic function, \`tsc\` knows nothing about \`T\`. It could be anything, so you can't use \`.length\` on it. A **constraint** says "T can be any type, as long as it has this":

~~~ts
function longer<T extends { length: number }>(a: T, b: T): T {
  return b.length > a.length ? b : a;
}

console.log(longer("hi", "hello"));
console.log(longer([1, 2, 3], [4]));
~~~

\`T extends { length: number }\` reads "T must have a numeric \`length\`". Strings and arrays both qualify. A number doesn't:

~~~
longer(5, 10);
~~~

~~~text
error TS2345: Argument of type 'number' is not assignable to parameter of type '{ length: number; }'.
~~~

Here \`extends\` means "fits this shape", not class inheritance. And the return type is still \`T\`: \`longer("hi", "hello")\` returns a \`string\`, not a vague \`{ length: number }\`. That's what a constraint gives you over a plain parameter type.
`,
    },
    {
      type: 'read',
      title: 'keyof: the names of the keys',
      md: `
\`keyof T\` is the union of a type's key names:

~~~
type User = { id: number; name: string };
type UserKey = keyof User;   // "id" | "name"
~~~

Combine it with a constraint to accept only real keys of an object:

~~~ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "Ada" };
console.log(getProp(user, "name"), getProp(user, "id"));
~~~

- \`K extends keyof T\`: the key must be one of T's keys.
- \`T[K]\` is an **indexed access type**: "the type of property K on T". So \`getProp(user, "id")\` returns \`number\` and \`getProp(user, "name")\` returns \`string\`.

A typo is caught at the call:

~~~
getProp(user, "nmae");
~~~

~~~text
error TS2345: Argument of type '"nmae"' is not assignable to parameter of type '"name" | "id"'.
~~~
`,
    },
    {
      type: 'task',
      title: 'pluck',
      md: `
Write \`pluck<T, K extends keyof T>(items: T[], key: K): T[K][]\` that pulls one field out of every object. It's \`map\` plus \`getProp\`.

~~~
pluck([{ id: 1, name: "Ada" }, { id: 2, name: "Linus" }], "name")  → ["Ada", "Linus"]
pluck([{ id: 1, name: "Ada" }, { id: 2, name: "Linus" }], "id")    → [1, 2]
~~~

\`T[K][]\` means "an array of whatever type that field has".
`,
      starter: `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  // your code here
}
`,
      tests: [
        { name: 'plucks the names', code: `eq(pluck([{ id: 1, name: "Ada" }, { id: 2, name: "Linus" }], "name"), ["Ada", "Linus"]);` },
        { name: 'plucks the ids', code: `eq(pluck([{ id: 1, name: "Ada" }, { id: 2, name: "Linus" }], "id"), [1, 2]);` },
      ],
      hint: 'One line with `map`: each `item` becomes `item[key]`.',
      solution: `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}
`,
    },
    {
      type: 'predict',
      title: 'Grouping with a Record accumulator',
      md: 'This is `reduce` from JavaScript lesson 11 with a `Record` (lesson 6) as the accumulator. It groups words by their first letter.',
      code: `const words = ["apple", "avocado", "banana", "blueberry", "cherry"];

const groups = words.reduce((acc, word) => {
  const key = word[0];
  (acc[key] ??= []).push(word);
  return acc;
}, {} as Record<string, string[]>);

console.log(groups.a);
console.log(Object.keys(groups));`,
      output: `[ "apple", "avocado" ]
[ "a", "b", "c" ]`,
      explain: `
\`{} as Record<string, string[]>\` tells \`tsc\` what the empty starting object will become. Without it, \`acc\` would be typed as \`{}\` and \`acc[key]\` would be rejected.

\`acc[key] ??= []\` means "if there's no array for this key yet, make one". It returns the array, so \`.push(word)\` adds to it.

This only works for strings. The next task makes it work for anything.
`,
    },
    {
      type: 'task',
      title: 'A typed groupBy',
      md: `
Write \`groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]>\`. It calls \`keyFn\` on each item and groups the items under the key it returns.

~~~
groupBy(["apple", "avocado", "banana"], (w) => w[0])
  → { a: ["apple", "avocado"], b: ["banana"] }

groupBy([{ name: "Ada", team: "core" }, { name: "Linus", team: "kernel" }], (u) => u.team)
  → { core: [{ name: "Ada", team: "core" }], kernel: [{ name: "Linus", team: "kernel" }] }
~~~

A loop is fine. You don't have to use \`reduce\`.
`,
      starter: `function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  // your code here
}
`,
      tests: [
        { name: 'groups words by first letter', code: `eq(groupBy(["apple", "avocado", "banana"], (w) => w[0]), { a: ["apple", "avocado"], b: ["banana"] });` },
        {
          name: 'groups objects by a field',
          code: `const ada = { name: "Ada", team: "core" };
const linus = { name: "Linus", team: "kernel" };
const grace = { name: "Grace", team: "core" };
eq(groupBy([ada, linus, grace], (u) => u.team), { core: [ada, grace], kernel: [linus] });`,
        },
        { name: 'an empty list gives {}', code: `eq(groupBy([], (x) => "k"), {});` },
      ],
      hint: '`const groups: Record<string, T[]> = {};` Then for each item: `const key = keyFn(item);` and `(groups[key] ??= []).push(item);`',
      solution: `function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    (groups[key] ??= []).push(item);
  }
  return groups;
}
`,
      explain: 'Because `T` is inferred from `items`, the callback `(u) => u.team` knows `u` is a user, and the result is `Record<string, User[]>`. Recent JavaScript also ships `Object.groupBy(items, keyFn)`, typed in much the same way.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'In `first([10, 20])` with `function first<T>(items: T[]): T | undefined`, how does tsc decide what `T` is?',
          choices: ['It infers `T = number` from the argument', 'You must write `first<number>(...)`', '`T` is always `any`'],
          answer: 0,
          explain: 'Type parameters are usually inferred from the arguments. Writing `first<number>(...)` is allowed but rarely needed.',
          why: { 1: 'Explicit type arguments are optional when `tsc` can infer them.', 2: 'If it were `any`, generics would add nothing over `any[]`.' },
        },
        {
          q: 'Which call does `tsc` reject?\n\n~~~\nfunction size<T extends { length: number }>(x: T) {\n  return x.length;\n}\nsize("abc");    // A\nsize([1, 2]);   // B\nsize(42);       // C\n~~~',
          choices: ['A', 'B', 'C'],
          answer: 2,
          explain: 'Numbers have no `length`: "Argument of type \'number\' is not assignable to parameter of type \'{ length: number; }\'."',
          why: { 0: 'Strings have a numeric `length`.', 1: 'Arrays have a numeric `length`.' },
        },
        {
          q: 'With `type User = { id: number; name: string }`, what is `keyof User`?',
          choices: ['`"id" | "name"`', '`number | string`', '`string[]`'],
          answer: 0,
          explain: '`keyof` gives the key names as a union of string literals. `User["id"]` would give the value type `number`.',
          why: { 1: 'Those are the value types, which you get with `User[keyof User]`.', 2: '`keyof` is a union of literal names, not an array.' },
        },
        {
          q: 'Why use `function first<T>(items: T[]): T | undefined` instead of `function first(items: any[]): any`?',
          choices: ['The result keeps the item type, so later mistakes are caught', 'It runs faster', 'It checks the items at runtime'],
          answer: 0,
          explain: 'With `any`, everything after the call is unchecked. With `T`, `tsc` knows the result is, say, a `string | undefined` and checks how you use it.',
          why: { 1: 'Both erase to the same JavaScript.', 2: 'Generics are erased. There is no runtime check.' },
        },
      ],
    },
  ],
};
