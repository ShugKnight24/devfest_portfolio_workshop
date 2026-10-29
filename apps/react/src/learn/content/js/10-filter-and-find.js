// JS course · lesson 10. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'filter-and-find',
  builds: ['js/map'],
  title: 'filter and find: keep some, find one',
  goal: 'Keep only the items that pass a test, find the first one that does, and ask yes/no questions about a whole list.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The problem filter solves',
      md: `
In lesson 8 you wrote "keep-if" loops:

~~~js
const nums = [1, 2, 3, 4, 5, 6];

const evens = [];             // 1. make an empty array
for (const n of nums) {       // 2. go through each item
  if (n % 2 === 0) {          // 3. ask a yes/no question
    evens.push(n);            // 4. keep it only if the answer is yes
  }
}
console.log(evens);
~~~

Press **▶ Run**. Then **Edit** it to keep the odd numbers instead, and run again.

Same story as \`map\`: only the **question** changes (\`n % 2 === 0\`). The rest is boilerplate. \`filter\` packages up the boilerplate, and you hand it just the question:

~~~js
const nums = [1, 2, 3, 4, 5, 6];
console.log(nums.filter((n) => n % 2 === 0));
~~~
`,
    },
    {
      type: 'read',
      title: 'Predicates and truthiness',
      md: `
The callback you give \`filter\` is a **predicate**: a function that answers yes or no about one item.

~~~
(n) => n % 2 === 0        // "is n even?"
(user) => user.active     // "is this user active?"
(w) => w.length >= 3      // "is this word long enough?"
~~~

\`filter\` keeps the item when the predicate returns **true**, and drops it when it returns **false**.

Strictly, \`filter\` doesn't need \`true\` or \`false\`. It checks whether the return value is **truthy**. JS treats exactly these values as **falsy** (they count as "no"):

~~~
false   0   ""   null   undefined   NaN
~~~

**Everything else is truthy**, including \`"0"\`, \`[]\` and \`{}\`. That's why \`(user) => user.active\` works: it returns \`true\` or \`false\` straight from the object.
`,
    },
    {
      type: 'predict',
      title: 'Truthy or falsy?',
      md: 'The predicate returns the item itself. Which items does `filter` keep?',
      code: `console.log([0, 1, "", "hi", null, 5].filter((x) => x));`,
      output: `[ 1, "hi", 5 ]`,
      explain: `
\`0\`, \`""\` and \`null\` are falsy, so they're dropped. \`1\`, \`"hi"\` and \`5\` are truthy, so they're kept.

You'll see \`.filter((x) => x)\` or \`.filter(Boolean)\` in real code. It means "remove the empty values".
`,
    },
    {
      type: 'task',
      title: 'Build filter yourself',
      md: `
You built \`myMap\` last lesson. \`myFilter\` is almost the same loop, plus an \`if\`.

\`myFilter(array, test)\` returns a **new** array with only the items where \`test(item)\` is truthy:

~~~
myFilter([1, 2, 3, 4], (n) => n % 2 === 0)   → [2, 4]
myFilter(["hi", "hello"], (w) => w.length > 2) → ["hello"]
~~~

Notice the difference from \`myMap\`: you push the **item itself**, not \`test(item)\`.
`,
      starter: `function myFilter(array, test) {
  // your code here
}
`,
      tests: [
        { name: 'myFilter([1, 2, 3, 4], n => n % 2 === 0) is [2, 4]', code: `eq(myFilter([1, 2, 3, 4], (n) => n % 2 === 0), [2, 4]);` },
        { name: 'works with strings', code: `eq(myFilter(["hi", "hello"], (w) => w.length > 2), ["hello"]);` },
        { name: 'nothing matches gives []', code: `eq(myFilter([1, 3], (n) => n > 10), []);` },
        { name: 'keeps the items, not true/false', code: `eq(myFilter([5, 6], (n) => n > 5), [6], "push the item, not the result of test(item)");` },
        { name: 'the original array is unchanged', code: `const nums = [1, 2, 3]; myFilter(nums, (n) => n > 1); eq(nums, [1, 2, 3]);` },
      ],
      hint: `
Start with \`const result = []\` and loop \`for (const item of array)\`. Inside the loop, add \`if (test(item))\` and then \`result.push(item)\`. After the loop, \`return result\`.
`,
      solution: `function myFilter(array, test) {
  const result = [];
  for (const item of array) {
    if (test(item)) {
      result.push(item); // keep the item itself; test only decides yes or no
    }
  }
  return result;
}
`,
      explain: 'Compared with `myMap`, the only change is the `if`, and pushing `item` instead of `fn(item)`.',
    },
    {
      type: 'read',
      title: 'Trace it',
      md: `
Here's \`myFilter([1, 2, 3, 4], (n) => n % 2 === 0)\`, one row per trip around the loop:

| Step | \`item\` | \`test(item)\` | \`result\` after this step |
|---|---|---|---|
| start | | | \`[]\` |
| 1 | \`1\` | \`false\` | \`[]\` (skipped) |
| 2 | \`2\` | \`true\` | \`[2]\` |
| 3 | \`3\` | \`false\` | \`[2]\` (skipped) |
| 4 | \`4\` | \`true\` | \`[2, 4]\` |
| end | | | returns \`[2, 4]\` |

Compare these rules with \`map\`'s:

1. **The new array can be shorter**, anywhere from all the items down to none.
2. **The items come out unchanged.** \`filter\` never transforms them. (Want both? Use \`filter\` then \`map\`; you'll see that soon.)
3. **The original array is never touched.**
`,
    },
    {
      type: 'task',
      title: 'evens',
      md: `
**Example** (already solved):

~~~
function odds(nums) {
  return nums.filter((n) => n % 2 === 1);
}
~~~

**Your turn:** \`evens([1, 2, 3, 4])\` returns \`[2, 4]\`. Use \`.filter\`.
`,
      starter: `function evens(nums) {
  // your code here
}
`,
      tests: [
        { name: 'evens([1, 2, 3, 4]) is [2, 4]', code: `eq(evens([1, 2, 3, 4]), [2, 4]);` },
        { name: 'evens([1, 3]) is []', code: `eq(evens([1, 3]), []);` },
      ],
      hint: 'Same as `odds`, but the remainder you want is `0`: `n % 2 === 0`.',
      solution: `function evens(nums) {
  return nums.filter((n) => n % 2 === 0);
}
`,
    },
    {
      type: 'task',
      title: 'longWords',
      md: `\`longWords(["hi", "hello", "hey"], 3)\` returns \`["hello", "hey"]\`: the words whose length is **at least** \`min\`.`,
      starter: `function longWords(words, min) {
  // your code here
}
`,
      tests: [
        { name: 'longWords(["hi", "hello", "hey"], 3) is ["hello", "hey"]', code: `eq(longWords(["hi", "hello", "hey"], 3), ["hello", "hey"]);` },
        { name: '"at least" includes equal lengths', code: `eq(longWords(["abc", "ab"], 3), ["abc"], "use >= so a word of exactly min letters is kept");` },
      ],
      hint: 'The predicate is `(w) => w.length >= min`. The callback can use `min` because it sits inside `longWords`.',
      solution: `function longWords(words, min) {
  return words.filter((w) => w.length >= min);
}
`,
      explain: 'The callback can read `min` from the function around it. That\'s a closure, and it\'s why callbacks are so handy: they can "see" the variables where they were written.',
    },
    {
      type: 'predict',
      title: 'When nothing matches',
      code: `const nums = [1, 3, 5];
const found = nums.filter((n) => n % 2 === 0);
console.log(found);
console.log(found.length);`,
      output: `[]
0`,
      explain: `
\`filter\` **always** returns an array. When nothing matches, that's an empty array, never \`undefined\` or \`null\`.

So code like \`found.length\` or \`found.map(...)\` is always safe after a \`filter\`. To ask "did anything match?", check \`found.length > 0\` (or use \`some\`, coming up).
`,
    },
    {
      type: 'task',
      title: 'activeUsers',
      md: `
\`activeUsers(users)\` returns the users with \`active: true\`. Users look like:

~~~
{ id: 1, name: "Ada", age: 36, active: true }
~~~
`,
      starter: `function activeUsers(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'keeps Ada and Grace',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
eq(activeUsers(users), [users[0], users[2]]);`,
        },
      ],
      hint: '`user.active` is already true or false, so the predicate can be just `(user) => user.active`.',
      solution: `function activeUsers(users) {
  return users.filter((user) => user.active);
}
`,
    },
    {
      type: 'read',
      title: 'find: just the first one',
      md: `
Often you don't want a list of matches. You want **the one** item, like "the user with id 2". That's \`find\`.

~~~js
const users = [
  { id: 1, name: "Ada" },
  { id: 2, name: "Linus" },
  { id: 3, name: "Grace" },
];

console.log(users.find((u) => u.id === 2));
console.log(users.find((u) => u.id === 99));
~~~

\`find\` takes a predicate, just like \`filter\`, but:

- it returns **the first item** where the predicate is truthy, as the item itself and **not** inside an array;
- it **stops looking** as soon as it finds one;
- if nothing matches, it returns **\`undefined\`**.

| | \`filter\` | \`find\` |
|---|---|---|
| returns | an array | one item |
| no match | \`[]\` | \`undefined\` |
| stops early | no, checks every item | yes, at the first match |
`,
    },
    {
      type: 'task',
      title: 'Build find yourself',
      md: `
\`myFind(array, test)\` returns the **first** item where \`test(item)\` is truthy, or \`undefined\` if there is none.

~~~
myFind([5, 12, 8], (n) => n > 10)  → 12
myFind([1, 2], (n) => n > 10)      → undefined
~~~

Use a loop, and **return from inside the loop** as soon as you find a match. If the loop finishes without returning, nothing matched.
`,
      starter: `function myFind(array, test) {
  // your code here
}
`,
      tests: [
        { name: 'myFind([5, 12, 8], n => n > 10) is 12', code: `eq(myFind([5, 12, 8], (n) => n > 10), 12);` },
        { name: 'returns the FIRST match', code: `eq(myFind([5, 12, 18], (n) => n > 10), 12, "return as soon as you find one");` },
        { name: 'no match gives undefined', code: `eq(myFind([1, 2], (n) => n > 10), undefined);` },
        {
          name: 'returns the item itself, not a copy',
          code: `const users = [{ id: 1 }, { id: 2 }];
assert(myFind(users, (u) => u.id === 2) === users[1], "return the object from the array");`,
        },
      ],
      hint: `
Loop \`for (const item of array)\`. Inside it, \`if (test(item)) return item;\`. After the loop, \`return undefined;\` (or nothing at all, since a function with no \`return\` gives \`undefined\`).
`,
      solution: `function myFind(array, test) {
  for (const item of array) {
    if (test(item)) {
      return item; // return exits the whole function, so the loop stops here
    }
  }
  return undefined; // the loop finished: nothing matched
}
`,
      explain: '`return` inside a loop ends the whole function at once. That\'s how `find` stops early.',
    },
    {
      type: 'predict',
      title: 'filter vs find, side by side',
      code: `const users = [{ name: "Ada", age: 36 }, { name: "Grace", age: 85 }];

console.log(users.filter((u) => u.age > 30));
console.log(users.find((u) => u.age > 30));
console.log(users.find((u) => u.age > 100));`,
      output: `[ { name: "Ada", age: 36 }, { name: "Grace", age: 85 } ]
{ name: "Ada", age: 36 }
undefined`,
      explain: `
- \`filter\` gives **every** match, wrapped in an array.
- \`find\` gives the **first** match, on its own with no array around it.
- \`find\` with no match gives \`undefined\`.

A classic bug: calling \`users.find(...).name\` when nothing matched throws "Cannot read properties of undefined". Check the result before you use it, or reach for \`?.\` (\`found?.name\`).
`,
    },
    {
      type: 'task',
      title: 'findByName',
      md: `
**Example:** \`find\` returns the first match, or \`undefined\`.

~~~
function findById(users, id) {
  return users.find((user) => user.id === id);
}
~~~

**Your turn:** \`findByName(users, "Ada")\` returns Ada's whole object, or \`undefined\` if no one matches.
`,
      starter: `function findByName(users, name) {
  // your code here
}
`,
      tests: [
        {
          name: 'finds Ada',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }];
assert(findByName(users, "Ada") === users[0], "expected Ada's object, got " + JSON.stringify(findByName(users, "Ada")));`,
        },
        {
          name: 'no match gives undefined',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }];
eq(findByName(users, "Nobody"), undefined);`,
        },
      ],
      hint: 'Same as `findById`, but compare `user.name === name`.',
      solution: `function findByName(users, name) {
  return users.find((user) => user.name === name);
}
`,
    },
    {
      type: 'read',
      title: 'some and every: yes/no about the whole list',
      md: `
Sometimes you don't want items back at all, just an answer: **true** or **false**.

- \`some\`: is the predicate true for **at least one** item?
- \`every\`: is the predicate true for **all** of the items?

~~~js
const nums = [3, 8, -2, 5];

console.log(nums.some((n) => n < 0));
console.log(nums.every((n) => n < 0));
console.log(nums.every((n) => n < 10));
~~~

Both **stop early**, just like \`find\`:

- \`some\` stops at the first \`true\`, because one yes is enough.
- \`every\` stops at the first \`false\`, because one no is enough.

That early stop is called **short-circuiting**. It's the same idea as \`||\` and \`&&\` from lesson 3.
`,
    },
    {
      type: 'predict',
      title: 'How many items does some check?',
      md: 'The callback counts how many times it runs.',
      code: `let checked = 0;

const result = [5, -1, 7, 9].some((n) => {
  checked = checked + 1;
  return n < 0;
});

console.log(result, checked);`,
      output: `true 2`,
      explain: `
\`some\` checked \`5\` (no), then \`-1\` (yes!) and stopped. \`7\` and \`9\` were never looked at, so the callback ran only **2** times.

Also notice this callback has curly braces, so it needs \`return\`.
`,
    },
    {
      type: 'task',
      title: 'anyNegative',
      md: `
**Example:** \`some\` means "at least one".

~~~
function anyZero(nums) {
  return nums.some((n) => n === 0);
}
~~~

**Your turn:** \`anyNegative([1, -2, 3])\` returns \`true\`, and \`anyNegative([1, 2])\` returns \`false\`.
`,
      starter: `function anyNegative(nums) {
  // your code here
}
`,
      tests: [
        { name: 'anyNegative([1, -2, 3]) is true', code: `eq(anyNegative([1, -2, 3]), true);` },
        { name: 'anyNegative([1, 2]) is false', code: `eq(anyNegative([1, 2]), false);` },
      ],
      hint: 'Same as `anyZero`, but the question is `n < 0`.',
      solution: `function anyNegative(nums) {
  return nums.some((n) => n < 0);
}
`,
    },
    {
      type: 'task',
      title: 'allPositive',
      md: `\`allPositive([1, 2])\` returns \`true\`, and \`allPositive([1, -2])\` returns \`false\`. Use \`every\`.`,
      starter: `function allPositive(nums) {
  // your code here
}
`,
      tests: [
        { name: 'allPositive([1, 2]) is true', code: `eq(allPositive([1, 2]), true);` },
        { name: 'allPositive([1, -2]) is false', code: `eq(allPositive([1, -2]), false);` },
      ],
      hint: '`return nums.every((n) => ...);` and the question is "is n greater than 0?"',
      solution: `function allPositive(nums) {
  return nums.every((n) => n > 0);
}
`,
    },
    {
      type: 'predict',
      title: 'The braces bug, filter edition',
      md: 'Same bug as last lesson, in a new place.',
      code: `console.log([1, 2, 3, 4].filter((n) => { n % 2 === 0 }));`,
      output: `[]`,
      explain: `
The braces make a function body with no \`return\`, so the predicate returns \`undefined\` every time. \`undefined\` is falsy, so **every** item is dropped.

With \`map\`, this bug gives you \`[ undefined, ... ]\`. With \`filter\`, it gives you \`[]\`. Either way, the fix is the same: remove the braces, or add \`return\`.
`,
    },
    {
      type: 'read',
      title: 'Chaining: filter, then map',
      md: `
\`filter\` returns an array, and arrays have \`.map\`. So you can put one right after the other:

~~~js
const users = [
  { name: "Ada", age: 36 },
  { name: "Linus", age: 17 },
  { name: "Grace", age: 85 },
];

const adultNames = users
  .filter((user) => user.age >= 18)   // keep the adults
  .map((user) => user.name);          // turn each one into a name

console.log(adultNames);
~~~

Read it top to bottom as a **pipeline**: the data flows down, and each line does one job.

| After | Value |
|---|---|
| \`users\` | 3 user objects |
| \`.filter(...)\` | 2 user objects (Ada, Grace) |
| \`.map(...)\` | \`["Ada", "Grace"]\` |

Order matters: **filter first, then map.** Once you've mapped to names, the \`age\` is gone and you can't filter on it anymore.
`,
    },
    {
      type: 'task',
      title: 'activeNames',
      md: `
**Example:** chain \`filter\` then \`map\`.

~~~
function adultNames(users) {
  return users.filter((user) => user.age >= 18).map((user) => user.name);
}
~~~

**Your turn:** \`activeNames(users)\` returns the **names** of the **active** users, like \`["Ada", "Grace"]\`.
`,
      starter: `function activeNames(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'activeNames(users) is ["Ada", "Grace"]',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
eq(activeNames(users), ["Ada", "Grace"]);`,
        },
      ],
      hint: 'Same shape as `adultNames`. Filter with `(user) => user.active`, then map with `(user) => user.name`.',
      solution: `function activeNames(users) {
  return users.filter((user) => user.active).map((user) => user.name);
}
`,
    },
    {
      type: 'read',
      title: "Where you'll see this",
      md: `
- **Search boxes:** \`items.filter((item) => item.title.toLowerCase().includes(query))\`, run on every keystroke.
- **Deleting from React state:** \`setTodos(todos.filter((t) => t.id !== id))\` means "keep every todo except this one". It's the standard way to remove an item without mutating.
- **Detail pages:** \`products.find((p) => p.id === selectedId)\`.
- **Form validation:** \`fields.every((f) => f.value !== "")\` asks "is the form complete?"

~~~js
const todos = [{ id: 1, title: "Shop" }, { id: 2, title: "Code" }];
const id = 1;
console.log(todos.filter((t) => t.id !== id));
~~~
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What does this print?\n\n~~~\nconsole.log([1, 3].filter((n) => n > 5), [1, 3].find((n) => n > 5));\n~~~",
          choices: ["`[] undefined`", "`undefined undefined`", "`[] []`"],
          answer: 0,
          explain: "`filter` always returns an array, even an empty one. `find` returns one item, or `undefined` when nothing matches.",
          why: ["", "`filter` never returns `undefined`. No matches gives `[]`.", "`find` returns an item, not an array."],
        },
        {
          q: "You need the one user with `id` 7. Which do you use?",
          choices: ["`users.filter((u) => u.id === 7)`", "`users.find((u) => u.id === 7)`", "`users.map((u) => u.id === 7)`"],
          answer: 1,
          explain: "`find` returns the first matching item itself and stops looking.",
          why: ["`filter` returns an array even for one match: `[user]`.", "", "`map` gives one boolean per user."],
        },
        {
          q: "What does this print?\n\n~~~\nconst users = [{ name: \"Ada\", active: true }, { name: \"Linus\", active: false }];\nconsole.log(users.map((u) => u.name).filter((u) => u.active));\n~~~",
          choices: ["`[ \"Ada\" ]`", "`[]`", "An error"],
          answer: 1,
          explain: "After the `map`, the items are strings, which have no `.active`. Filter first, then map.",
          why: ["The order is wrong: by the time `filter` runs, the users are gone.", "", "Reading a missing property gives `undefined`, not an error."],
        },
        {
          q: "What does `[2, 4, 5].every((n) => n % 2 === 0)` give?",
          choices: ["`true`", "`false`", "`[ 2, 4 ]`"],
          answer: 1,
          explain: "`every` needs every item to pass. 5 fails, so it stops there and returns `false`.",
          why: ["5 is odd, so not every item passes.", "", "`every` returns a boolean, not the passing items."],
        },
        {
          q: "What does this print?\n\n~~~\nconsole.log([\"a\", \"\", \"b\"].filter((s) => s));\n~~~",
          choices: ["`[ \"a\", \"\", \"b\" ]`", "`[ \"a\", \"b\" ]`", "`[]`"],
          answer: 1,
          explain: "`filter` keeps items whose callback result is **truthy**. The empty string is falsy, so it's dropped.",
          why: ["`\"\"` is falsy, so filter drops it.", "", "Non-empty strings are truthy, so they stay."],
        },
      ],
    },
  ],
};
