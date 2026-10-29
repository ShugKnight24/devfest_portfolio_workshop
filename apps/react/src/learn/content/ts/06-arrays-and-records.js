// TS course · lesson 6. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
export default {
  id: 'arrays-and-records',
  builds: ['ts/object-types', 'ts/functions', 'js/arrays-of-objects', 'js/reduce-and-sort'],
  title: 'Arrays, tuples, Record and readonly arrays',
  goal: 'Type lists of objects, fixed-length tuples, and lookup dictionaries, and stop functions from changing arrays they were only meant to read.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Array types',
      md: `
An array type is the item type followed by \`[]\`:

~~~ts
const scores: number[] = [90, 72, 85];
const names: string[] = ["Ada", "Linus"];

type User = { id: number; name: string; active: boolean };
const users: User[] = [
  { id: 1, name: "Ada", active: true },
  { id: 2, name: "Linus", active: false },
];

console.log(scores.length, names[0], users[1].name);
~~~

\`User[]\` is the "array of objects" from JavaScript lesson 8, now with a type. You'll also see \`Array<User>\`, which means exactly the same thing.

Every item has to fit:

~~~
users.push({ id: 3 });
~~~

~~~text
error TS2345: Argument of type '{ id: number; }' is not assignable to parameter of type 'User'.
  Property 'name' is missing in type '{ id: number; }' but required in type 'User'.
~~~

And because \`users\` is \`User[]\`, every \`map\`, \`filter\` and \`find\` callback knows its item is a \`User\`.
`,
    },
    {
      type: 'task',
      title: 'cartTotal',
      md: `
The \`Item\` type is in the starter. Write \`cartTotal(items: Item[]): number\` that adds up \`price * qty\` for every item.

~~~
cartTotal([{ name: "Pen", price: 2, qty: 3 }, { name: "Mug", price: 8, qty: 1 }])  → 14
cartTotal([])  → 0
~~~

A \`for...of\` loop or \`reduce\` (JavaScript lesson 11) both work.
`,
      starter: `type Item = { name: string; price: number; qty: number };

function cartTotal(items: Item[]): number {
  // your code here
}
`,
      tests: [
        { name: 'two items add up to 14', code: `eq(cartTotal([{ name: "Pen", price: 2, qty: 3 }, { name: "Mug", price: 8, qty: 1 }]), 14);` },
        { name: 'an empty cart is 0', code: `eq(cartTotal([]), 0);` },
      ],
      hint: '`return items.reduce((sum, item) => sum + item.price * item.qty, 0);` Or start `let total = 0` and add in a loop.',
      solution: `type Item = { name: string; price: number; qty: number };

function cartTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}
`,
    },
    {
      type: 'read',
      title: 'Tuples: arrays with a fixed shape',
      md: `
Sometimes an array has a fixed length and each position means something different. That's a **tuple**:

~~~ts
const point: [number, number] = [10, 20];
const entry: [string, number] = ["Ada", 36];

const [name, age] = entry;   // destructuring, JavaScript lesson 12
console.log(point[0], name, age);
~~~

\`[string, number]\` means "exactly two items: a string, then a number". \`tsc\` checks the length and each position:

~~~
const bad: [string, number] = ["Ada", 36, 99];
~~~

~~~text
error TS2322: Type '[string, number, number]' is not assignable to type '[string, number]'.
  Source has 3 element(s) but target allows only 2.
~~~

You already use tuples without knowing it:

- React's \`useState\` returns a tuple: \`[value, setValue]\`.
- \`Object.entries(obj)\` returns an array of \`[key, value]\` tuples.
`,
    },
    {
      type: 'predict',
      title: 'Looping over tuples',
      code: `const pairs: [string, number][] = [["apples", 3], ["pears", 5]];

for (const [fruit, count] of pairs) {
  console.log(fruit, count * 10);
}`,
      output: `apples 30
pears 50`,
      explain: `
\`[string, number][]\` is an **array of tuples**. Read the type from the inside out: each item is \`[string, number]\`, and the final \`[]\` makes a list of them.

Destructuring each tuple gives \`fruit: string\` and \`count: number\`, so \`count * 10\` is allowed.
`,
    },
    {
      type: 'task',
      title: 'minMax returns a tuple',
      md: `
Write \`minMax(nums: number[]): [number, number]\` that returns the smallest and the largest number, in that order. You can assume the array is not empty.

~~~
minMax([3, 1, 4, 1, 5])  → [1, 5]
minMax([7])              → [7, 7]
~~~
`,
      starter: `function minMax(nums: number[]): [number, number] {
  // your code here
}
`,
      tests: [
        { name: 'minMax([3, 1, 4, 1, 5]) is [1, 5]', code: `eq(minMax([3, 1, 4, 1, 5]), [1, 5]);` },
        { name: 'a single number is both min and max', code: `eq(minMax([7]), [7, 7]);` },
      ],
      hint: '`Math.min(...nums)` spreads the array into arguments. Return `[Math.min(...nums), Math.max(...nums)]`.',
      solution: `function minMax(nums: number[]): [number, number] {
  return [Math.min(...nums), Math.max(...nums)];
}
`,
      explain: 'A caller can now write `const [lo, hi] = minMax(scores);` and both are typed as `number`.',
    },
    {
      type: 'read',
      title: 'Record: typing a dictionary',
      md: `
In JavaScript you used plain objects as lookup tables, like word counts. Their keys aren't known ahead of time, so you can't list them in a type. Use **\`Record<Keys, Value>\`**:

~~~ts
const counts: Record<string, number> = {};
counts["apple"] = 1;
counts["pear"] = 4;

console.log(counts);
~~~

\`Record<string, number>\` reads "an object whose keys are strings and whose values are numbers".

When the keys **are** known, put a literal union in the key slot, and \`tsc\` requires every one of them:

~~~
type Theme = "light" | "dark";
const background: Record<Theme, string> = { light: "#fff" };
~~~

~~~text
error TS2741: Property 'dark' is missing in type '{ light: string; }' but required in type 'Record<Theme, string>'.
~~~

One honest warning: with \`Record<string, number>\`, \`counts["banana"]\` is typed as \`number\` even though at runtime it's \`undefined\`. \`tsc\` assumes every string key exists. Check with \`?? 0\` or \`in\` before trusting a lookup.
`,
    },
    {
      type: 'task',
      title: 'countWords',
      md: `
Write \`countWords(words: string[]): Record<string, number>\` that counts how many times each word appears.

~~~
countWords(["a", "b", "a"])  → { a: 2, b: 1 }
countWords([])               → {}
~~~
`,
      starter: `function countWords(words: string[]): Record<string, number> {
  // your code here
}
`,
      tests: [
        { name: 'counts repeated words', code: `eq(countWords(["a", "b", "a"]), { a: 2, b: 1 });` },
        { name: 'an empty list gives {}', code: `eq(countWords([]), {});` },
      ],
      hint: 'Start with `const counts: Record<string, number> = {};`. For each word: `counts[word] = (counts[word] ?? 0) + 1;`',
      solution: `function countWords(words: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const word of words) {
    counts[word] = (counts[word] ?? 0) + 1;
  }
  return counts;
}
`,
      explain: 'The `?? 0` is the warning from the last step in action: the first time you see a word, `counts[word]` is `undefined` at runtime, whatever the type says.',
    },
    {
      type: 'read',
      title: 'readonly arrays',
      md: `
\`sort\`, \`push\` and \`splice\` change an array in place. When a function should only **read** an array, say so with \`readonly\`:

~~~
function highest(scores: readonly number[]): number {
  scores.sort((a: number, b: number) => b - a);   // rejected: sort changes the array
  return scores[0];
}
~~~

~~~text
error TS2339: Property 'sort' does not exist on type 'readonly number[]'.
~~~

A \`readonly number[]\` simply has no mutating methods. Reading methods like \`map\`, \`filter\` and \`slice\` are all still there. To sort, copy first: \`[...scores].sort(...)\`.

You can pass a normal \`number[]\` to a \`readonly number[]\` parameter. It's a promise the function makes ("I won't change your array"), not a requirement on the caller.

**\`as const\`** goes one step further. It makes a literal array readonly and keeps the exact values as literal types:

~~~ts
const ROLES = ["admin", "editor", "viewer"] as const;
// type: readonly ["admin", "editor", "viewer"]

type Role = (typeof ROLES)[number];   // "admin" | "editor" | "viewer"

const r: Role = "editor";
console.log(ROLES.includes(r), ROLES.length);
~~~

\`(typeof ROLES)[number]\` means "the type of any item in ROLES". It lets one list be both your runtime data and your union type.
`,
    },
    {
      type: 'predict',
      title: 'Copy before you sort',
      code: `function sortedCopy(nums: readonly number[]): number[] {
  return [...nums].sort((a, b) => a - b);
}

const scores = [30, 10, 20];
console.log(sortedCopy(scores));
console.log(scores);`,
      output: `[ 10, 20, 30 ]
[ 30, 10, 20 ]`,
      explain: `
\`[...nums]\` makes a new array, and \`sort\` changes only that copy. The caller's \`scores\` keep their order.

If you wrote \`nums.sort(...)\` directly, \`tsc\` would reject it because of \`readonly\`, and in plain JavaScript it would have reordered \`scores\` behind your back (JavaScript lesson 11).
`,
    },
    {
      type: 'task',
      title: 'indexById',
      md: `
Combine the pieces. Write \`indexById(users: readonly User[]): Record<number, User>\` that builds a lookup table from id to user.

~~~
indexById([{ id: 1, name: "Ada" }, { id: 2, name: "Linus" }])
  → { 1: { id: 1, name: "Ada" }, 2: { id: 2, name: "Linus" } }
~~~

Then \`lookup[2].name\` is \`"Linus"\` without a \`find\`.
`,
      starter: `type User = { id: number; name: string };

function indexById(users: readonly User[]): Record<number, User> {
  // your code here
}
`,
      tests: [
        {
          name: 'each user is stored under its id',
          code: `const table = indexById([{ id: 1, name: "Ada" }, { id: 2, name: "Linus" }]);
eq(table[1], { id: 1, name: "Ada" });
eq(table[2].name, "Linus");`,
        },
        { name: 'an empty list gives {}', code: `eq(indexById([]), {});` },
        { name: 'the input array is not changed', code: `const list = [{ id: 1, name: "Ada" }]; indexById(list); eq(list, [{ id: 1, name: "Ada" }]);` },
      ],
      hint: 'Start with `const table: Record<number, User> = {};`, loop over `users`, and set `table[user.id] = user;`.',
      solution: `type User = { id: number; name: string };

function indexById(users: readonly User[]): Record<number, User> {
  const table: Record<number, User> = {};
  for (const user of users) {
    table[user.id] = user;
  }
  return table;
}
`,
      explain: 'Object keys are always strings at runtime, so `table[1]` and `table["1"]` are the same slot. `Record<number, User>` just lets you index with a number without a complaint.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'What is `[string, number][]`?',
          choices: ['An array of two-item tuples', 'A tuple of a string and a number array', 'A string or a number array'],
          answer: 0,
          explain: 'Read inside-out: `[string, number]` is one tuple, and the trailing `[]` makes an array of them, like the result of `Object.entries`.',
          why: { 1: 'That would be `[string, number[]]`.', 2: 'That would be `string | number[]`.' },
        },
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nfunction f(xs: readonly number[]) {\n  const ys = xs.map((x) => x * 2);  // line A\n  xs.push(4);                       // line B\n}\n~~~',
          choices: ['Line A', 'Line B', 'Both'],
          answer: 1,
          explain: '`map` reads and returns a new array, so it is allowed. `push` changes the array: "Property \'push\' does not exist on type \'readonly number[]\'."',
          why: { 0: 'Reading methods are still available on readonly arrays.', 2: 'Only the mutating method is removed.' },
        },
        {
          q: 'With `const counts: Record<string, number> = {}`, what is `counts["nope"]` at runtime?',
          choices: ['`undefined`', '`0`', 'It throws'],
          answer: 0,
          explain: 'The type says `number`, but the key was never set, so JavaScript gives `undefined`. That gap is why you write `?? 0`.',
          why: { 1: 'Nothing fills in a default for you.', 2: 'Reading a missing key never throws in JavaScript.' },
        },
        {
          q: 'Given `const ROLES = ["admin", "viewer"] as const`, what is `(typeof ROLES)[number]`?',
          choices: ['`"admin" | "viewer"`', '`string`', '`number`'],
          answer: 0,
          explain: '`as const` keeps the exact strings as literal types, and indexing with `[number]` gives the type of any item: the union of those literals.',
          why: { 1: 'Without `as const` it would be `string`. With it, the literals are kept.', 2: '`[number]` is the index type used to read items, not the result.' },
        },
      ],
    },
  ],
};
