// JS course · lesson 11. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'reduce-and-sort',
  builds: ['js/filter-and-find'],
  title: 'reduce and sort: many in, one out',
  goal: 'Boil a whole list down to one answer with reduce, and sort lists by any rule without breaking the original.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The problem reduce solves',
      md: `
\`map\` and \`filter\` both give you back **a list**. But lots of questions want **one answer** from a list: the total, the biggest, a count of each word.

In lesson 8 you wrote that as a loop with a running total:

~~~js
const nums = [5, 10, 20];

let total = 0;              // 1. a starting value
for (const n of nums) {     // 2. go through each item
  total = total + n;        // 3. combine the total so far with this item
}
console.log(total);
~~~

Again, only step 3 really changes (add, multiply, keep the bigger one...). \`reduce\` packages up the rest:

~~~js
const nums = [5, 10, 20];
console.log(nums.reduce((total, n) => total + n, 0));
~~~

Run both, and **Edit** the second one to multiply instead (don't forget to change the start value; you'll see why soon).
`,
    },
    {
      type: 'read',
      title: 'The mental model: a running total you carry along',
      md: `
Picture walking down the list carrying a box. At each item you look at **what's in the box** and **the current item**, and decide what goes in the box next. At the end, whatever is in the box is the answer.

That box is called the **accumulator**.

~~~
nums.reduce((total, n) => total + n, 0)
//           │      │     │           └─ what's in the box before the first item
//           │      │     └─ what goes in the box next (you MUST return it)
//           │      └─ the current item
//           └─ the accumulator: what's in the box so far
~~~

Two differences from \`map\` and \`filter\`:

1. The callback takes **two** things: the box so far, and the current item.
2. There's a **second argument** after the callback: the starting value of the box.
`,
    },
    {
      type: 'predict',
      title: 'Starting somewhere else',
      md: 'Watch the start value.',
      code: `console.log([1, 2, 3].reduce((acc, n) => acc + n, 100));`,
      output: `106`,
      explain: 'The box starts at **100**, not 0. Then 100 + 1 = 101, 101 + 2 = 103, and 103 + 3 = **106**. The start value is a real part of the answer, not a formality.',
    },
    {
      type: 'task',
      title: 'Build reduce yourself',
      md: `
You've built \`myMap\` and \`myFilter\`. \`myReduce\` is the same loop again, carrying one value instead of building an array.

\`myReduce(array, fn, start)\`:

- starts the accumulator at \`start\`;
- for each item, replaces the accumulator with \`fn(accumulator, item)\`;
- returns the accumulator at the end.

~~~
myReduce([1, 2, 3], (total, n) => total + n, 0)   → 6
myReduce([2, 3, 4], (total, n) => total * n, 1)   → 24
~~~
`,
      starter: `function myReduce(array, fn, start) {
  // your code here
}
`,
      tests: [
        { name: 'adds up [1, 2, 3] from 0 to get 6', code: `eq(myReduce([1, 2, 3], (total, n) => total + n, 0), 6);` },
        { name: 'multiplies [2, 3, 4] from 1 to get 24', code: `eq(myReduce([2, 3, 4], (total, n) => total * n, 1), 24);` },
        { name: 'an empty array gives back the start value', code: `eq(myReduce([], (total, n) => total + n, 0), 0);` },
        { name: 'uses the start value', code: `eq(myReduce([1], (total, n) => total + n, 100), 101);` },
        { name: 'works with strings', code: `eq(myReduce(["a", "b"], (s, x) => s + x, ""), "ab");` },
      ],
      hint: `
Use \`let acc = start;\` (it's \`let\` because it changes). Loop \`for (const item of array)\` and inside it \`acc = fn(acc, item);\`. After the loop, \`return acc;\`.
`,
      solution: `function myReduce(array, fn, start) {
  let acc = start;            // the box starts with the start value
  for (const item of array) {
    acc = fn(acc, item);      // whatever fn returns becomes the new box
  }
  return acc;
}
`,
      explain: 'That\'s the whole idea. The callback\'s return value **is** the next accumulator, which is why forgetting to return it breaks everything (you\'ll see that soon).',
    },
    {
      type: 'read',
      title: 'Trace it',
      md: `
Here's \`[5, 10, 20].reduce((total, n) => total + n, 0)\`, one row per item:

| Step | \`total\` coming in | \`n\` | callback returns (the new \`total\`) |
|---|---|---|---|
| start | \`0\` | | |
| 1 | \`0\` | \`5\` | \`5\` |
| 2 | \`5\` | \`10\` | \`15\` |
| 3 | \`15\` | \`20\` | \`35\` |
| end | | | returns \`35\` |

Read it as: **each row's output is the next row's input.** That handoff is all \`reduce\` does.
`,
    },
    {
      type: 'task',
      title: 'total',
      md: `
**Example** (already solved): the total starts at 0, and each step adds \`n * n\`.

~~~
function sumOfSquares(nums) {
  return nums.reduce((total, n) => total + n * n, 0);
}
~~~

**Your turn:** \`total([1, 2, 3])\` returns \`6\`. Use \`reduce\`. An empty list should give \`0\`.
`,
      starter: `function total(nums) {
  // your code here
}
`,
      tests: [
        { name: 'total([1, 2, 3]) is 6', code: `eq(total([1, 2, 3]), 6);` },
        { name: 'total([]) is 0', code: `eq(total([]), 0);` },
      ],
      hint: 'Same as `sumOfSquares`, but each step adds just `n`. Keep the `, 0` start value: it makes `total([])` work.',
      solution: `function total(nums) {
  return nums.reduce((total, n) => total + n, 0);
}
`,
    },
    {
      type: 'task',
      title: 'product',
      md: `\`product([2, 3, 4])\` returns \`24\`. Think about what a product should **start** at. (Not 0: what's 0 times anything?)`,
      starter: `function product(nums) {
  // your code here
}
`,
      tests: [
        { name: 'product([2, 3, 4]) is 24', code: `eq(product([2, 3, 4]), 24);` },
        { name: 'product([5]) is 5', code: `eq(product([5]), 5);` },
      ],
      hint: 'Start at `1`, because multiplying by 1 changes nothing. Each step is `total * n`.',
      solution: `function product(nums) {
  return nums.reduce((total, n) => total * n, 1);
}
`,
      explain: 'Rule of thumb: the start value is the one that "does nothing". For `+` that\'s `0`, for `*` it\'s `1`, for joining strings it\'s `""`.',
    },
    {
      type: 'predict', throws: true,
      title: 'Leaving out the start value',
      md: 'Three calls. The last one has no start value **and** an empty array.',
      code: `console.log([1, 2, 3].reduce((a, n) => a + n));
console.log([].reduce((a, n) => a + n, 0));
console.log([].reduce((a, n) => a + n));`,
      output: `6
0
! Reduce of empty array with no initial value`,
      explain: `
- **No start value:** \`reduce\` uses the **first item** as the starting box and begins at the second item. For a sum, that still works.
- **Empty array, with a start value:** there's nothing to loop over, so you just get the start value back.
- **Empty array, no start value:** there's no first item to start with, so JS **throws an error**.

So: **always give a start value**, unless you specifically want "start from the first item" (like finding the biggest number) **and** you know the list isn't empty.
`,
    },
    {
      type: 'read',
      title: 'Picking a start value',
      md: `
| You want | Start value | Each step |
|---|---|---|
| a sum | \`0\` | \`total + n\` |
| a product | \`1\` | \`total * n\` |
| a joined string | \`""\` | \`s + word\` |
| counts by key | \`{}\` | add 1 to \`counts[key]\`, then return \`counts\` |
| the biggest / smallest | *(none)* | keep whichever is bigger / smaller |

For "best so far", leaving out the start value is handy: the first item becomes the best so far, and you compare from there.

~~~js
const nums = [4, 1, 7];
console.log(nums.reduce((best, n) => (n < best ? n : best)));
~~~
`,
    },
    {
      type: 'task',
      title: 'maxOf',
      md: `
**Example:** keep the smaller of (best so far, current). With no start value, the first item is the first "best".

~~~
function minOf(nums) {
  return nums.reduce((best, n) => (n < best ? n : best));
}
~~~

**Your turn:** \`maxOf([3, 9, 2])\` returns \`9\`. Use \`reduce\`, not \`Math.max\`.
`,
      starter: `function maxOf(nums) {
  // your code here
}
`,
      tests: [
        { name: 'maxOf([3, 9, 2]) is 9', code: `eq(maxOf([3, 9, 2]), 9);` },
        { name: 'works with negatives', code: `eq(maxOf([-5, -2, -9]), -2, "don't start at 0: with all negatives, 0 would wrongly win");` },
      ],
      hint: 'Flip the comparison in `minOf`: `(best, n) => (n > best ? n : best)`.',
      solution: `function maxOf(nums) {
  return nums.reduce((best, n) => (n > best ? n : best));
}
`,
      explain: 'Notice why there\'s no start value here: if you started at `0`, a list of only negative numbers would wrongly return `0`.',
    },
    {
      type: 'task',
      title: 'totalAge',
      md: `
\`totalAge(users)\` returns everyone's ages added up. Users look like \`{ id: 1, name: "Ada", age: 36, active: true }\`.

Start at \`0\` and add \`user.age\` at each step.
`,
      starter: `function totalAge(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'totalAge(users) is 138',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
eq(totalAge(users), 138);`,
        },
        { name: 'no users gives 0', code: `eq(totalAge([]), 0);` },
      ],
      hint: '`users.reduce((total, user) => total + user.age, 0)`. Here the start value matters: without it, the first "total" would be a whole user object.',
      solution: `function totalAge(users) {
  return users.reduce((total, user) => total + user.age, 0);
}
`,
    },
    {
      type: 'read',
      title: 'Reducing into an object: counting',
      md: `
The box doesn't have to be a number. It can be an **object** you fill in as you go. This is how you count things:

~~~js
const words = ["a", "b", "a"];

const counts = words.reduce((acc, w) => {
  acc[w] = (acc[w] || 0) + 1;   // seen it before? add 1. First time? start from 0
  return acc;                   // hand the same object to the next step
}, {});                         // the box starts as an empty object

console.log(counts);
~~~

Trace it:

| Step | \`w\` | \`acc[w]\` before | \`acc\` after |
|---|---|---|---|
| start | | | \`{}\` |
| 1 | \`"a"\` | \`undefined\`, so \`0 + 1\` | \`{ a: 1 }\` |
| 2 | \`"b"\` | \`undefined\`, so \`0 + 1\` | \`{ a: 1, b: 1 }\` |
| 3 | \`"a"\` | \`1\`, so \`1 + 1\` | \`{ a: 2, b: 1 }\` |

Three things from earlier lessons meet here:

- \`acc[w]\` uses **brackets** because the key is in a variable (lesson 7).
- \`acc[w] || 0\` gives \`0\` when the key doesn't exist yet (\`undefined\` is falsy).
- The callback has **braces**, so it needs an explicit \`return acc\`.
`,
    },
    {
      type: 'task',
      title: 'countWords',
      md: `
**Example:** the accumulator is an object. Each step adds to it and returns it.

~~~
function lettersSeen(words) {
  return words.reduce((seen, w) => {
    seen[w[0]] = true;
    return seen;
  }, {});
}
~~~

**Your turn:** \`countWords(["a", "b", "a"])\` returns \`{ a: 2, b: 1 }\`, and \`countWords([])\` returns \`{}\`.
`,
      starter: `function countWords(words) {
  // your code here
}
`,
      tests: [
        { name: 'countWords(["a", "b", "a"]) is { a: 2, b: 1 }', code: `eq(countWords(["a", "b", "a"]), { a: 2, b: 1 });` },
        { name: 'countWords([]) is {}', code: `eq(countWords([]), {});` },
      ],
      hint: `
Copy the shape of \`lettersSeen\`. The middle line becomes \`counts[w] = (counts[w] || 0) + 1;\`. Keep \`return counts;\` and the \`{}\` start value.
`,
      solution: `function countWords(words) {
  return words.reduce((counts, w) => {
    counts[w] = (counts[w] || 0) + 1;
    return counts; // forget this and the next step gets undefined
  }, {});
}
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Forgetting to return the box',
      md: 'Spot the missing line first, then predict.',
      code: `const counts = ["a", "b", "a"].reduce((acc, w) => {
  acc[w] = (acc[w] || 0) + 1;
}, {});

console.log(counts);`,
      output: `! Cannot read properties of undefined (reading 'b')`,
      explain: `
The first step works: \`acc\` is \`{}\`, and it sets \`acc.a = 1\`. But the callback returns nothing, so **the next accumulator is \`undefined\`**. On step 2, reading \`acc[w]\` means reading \`undefined["b"]\`, which throws.

When \`reduce\` blows up with "of undefined", the first thing to check is the missing \`return acc\`.
`,
    },
    {
      type: 'predict',
      title: 'Sorting numbers the default way',
      md: 'Now sorting. `sort()` with no callback. Predict carefully.',
      code: `console.log([10, 9, 1, 100].sort());`,
      output: `[ 1, 10, 100, 9 ]`,
      explain: `
With no callback, \`sort\` compares items **as strings**, like words in a dictionary. As text, \`"10"\` comes before \`"9"\` because \`"1"\` comes before \`"9"\`.

That's almost never what you want for numbers, so **always pass a comparator** when sorting numbers.
`,
    },
    {
      type: 'read',
      title: 'The comparator: (a, b) => a - b',
      md: `
A comparator is a callback that gets **two items** and returns a number that says which goes first:

| It returns | Meaning |
|---|---|
| a **negative** number | \`a\` goes before \`b\` |
| a **positive** number | \`b\` goes before \`a\` |
| \`0\` | keep them as they are |

\`a - b\` gets this right for numbers automatically. If \`a\` is smaller, \`a - b\` is negative, so \`a\` goes first: **smallest first**. Flip it to \`b - a\` for **biggest first**.

~~~js
console.log([10, 9, 1, 100].sort((a, b) => a - b));
console.log([10, 9, 1, 100].sort((a, b) => b - a));
~~~

For **strings**, use \`localeCompare\`, which returns the right negative/positive number for alphabetical order:

~~~js
console.log(["Linus", "Ada", "Grace"].sort((a, b) => a.localeCompare(b)));
~~~
`,
    },
    {
      type: 'predict',
      title: 'sort changes the original',
      md: 'Unlike `map` and `filter`. What happens to `nums`?',
      code: `const nums = [3, 1, 2];
const sorted = nums.sort((a, b) => a - b);

console.log(sorted);
console.log(nums);
console.log(sorted === nums);`,
      output: `[ 1, 2, 3 ]
[ 1, 2, 3 ]
true`,
      explain: `
\`sort\` **rearranges the array in place** and returns that same array. There is no new array: \`sorted\` and \`nums\` are the same thing.

In React state, that's a bug, because you changed state directly. Copy first:

~~~js
const nums = [3, 1, 2];
const sorted = [...nums].sort((a, b) => a - b);
console.log(nums, sorted);
~~~

Modern JS also has \`nums.toSorted((a, b) => a - b)\`, which returns a sorted **copy**.
`,
    },
    {
      type: 'task',
      title: 'sortByAge',
      md: `
**Example:** copy with \`[...arr]\`, then sort. The original stays in its order.

~~~
function sortByName(users) {
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
}
~~~

**Your turn:** \`sortByAge(users)\` returns a **new** array, **youngest first**, without changing \`users\`.
`,
      starter: `function sortByAge(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'youngest first',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
eq(sortByAge(users).map((u) => u.name), ["Linus", "Ada", "Grace"]);`,
        },
        {
          name: 'does not change the original order',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
sortByAge(users);
eq(users.map((u) => u.name), ["Ada", "Linus", "Grace"], "the original was sorted in place: copy it with [...users] first");`,
        },
      ],
      hint: 'Same as `sortByName`, but the comparator is numeric: `(a, b) => a.age - b.age`.',
      solution: `function sortByAge(users) {
  return [...users].sort((a, b) => a.age - b.age);
}
`,
    },
    {
      type: 'task',
      title: 'cheapestName',
      md: `
\`cheapestName(products)\` returns the **name** of the cheapest product:

~~~
cheapestName([{ name: "pen", price: 2 }, { name: "cup", price: 1 }])  → "cup"
~~~

Find the cheapest product first (like \`minOf\`, comparing \`.price\`), then return its \`.name\`.
`,
      starter: `function cheapestName(products) {
  // your code here
}
`,
      tests: [
        {
          name: 'cheapestName(products) is "cup"',
          code: `const products = [{ name: "pen", price: 2 }, { name: "cup", price: 1 }, { name: "mug", price: 5 }];
eq(cheapestName(products), "cup");`,
        },
      ],
      hint: `
Two steps: \`const cheapest = products.reduce((best, p) => (p.price < best.price ? p : best));\`, then \`return cheapest.name;\`.
`,
      solution: `function cheapestName(products) {
  const cheapest = products.reduce((best, p) => (p.price < best.price ? p : best));
  return cheapest.name; // reduce kept the whole object, so .name is still there
}
`,
      explain: 'Keeping the **whole object** as "best so far" (not just its price) is the trick: at the end you can read any field you like from it.',
    },
    {
      type: 'read',
      title: "Where you'll see this, and when not to use reduce",
      md: `
- **Cart totals:** \`cart.reduce((sum, line) => sum + line.price * line.qty, 0)\`.
- **Grouping and counting:** building \`{ category: [...items] }\` or \`{ word: count }\` from a list.
- **Sorted tables:** \`[...rows].sort((a, b) => a.date - b.date)\` before rendering.

**When a plain loop is clearer:** \`reduce\` is great for one simple combine step. If your callback grows to many lines, a \`for...of\` loop with a variable often reads better, and interviewers are happy with either. Here are the same counts both ways:

~~~js
const words = ["a", "b", "a"];

const counts = {};
for (const w of words) {
  counts[w] = (counts[w] || 0) + 1;
}
console.log(counts);
~~~

Use whichever you can write **correctly and calmly** under pressure.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What does this print?\n\n~~~\nconsole.log([1, 2, 3].reduce((acc, n) => acc + n, 10));\n~~~",
          choices: ["`6`", "`16`", "`10`"],
          answer: 1,
          explain: "`acc` starts at the start value, 10, then carries along: 10 + 1 + 2 + 3 = 16.",
          why: ["That ignores the start value of 10.", "", "That's only the start value, before any items were added."],
        },
        {
          q: "What happens with `[].reduce((a, b) => a + b)`, with no start value?",
          choices: ["It returns `0`", "It returns `undefined`", "It throws a TypeError"],
          answer: 2,
          explain: "With no items and no start value, there's nothing to begin with, so it throws \"Reduce of empty array with no initial value\". Always pass a start value.",
          why: ["It would return `0` only if you passed `0` as the start value.", "It throws instead of returning anything.", ""],
        },
        {
          q: "What does `[10, 9, 1].sort()` return?",
          choices: ["`[ 1, 9, 10 ]`", "`[ 1, 10, 9 ]`", "`[ 10, 9, 1 ]`"],
          answer: 1,
          explain: "With no comparator, `sort` compares items as **strings**, and \"10\" comes before \"9\". Pass `(a, b) => a - b` for numbers.",
          why: ["That needs a comparator: `(a, b) => a - b`.", "", "`sort` does rearrange. It just compares as strings."],
        },
        {
          q: "What does this print?\n\n~~~\nconst nums = [3, 1, 2];\nconst sorted = nums.sort((a, b) => a - b);\nconsole.log(nums);\n~~~",
          choices: ["`[ 3, 1, 2 ]`", "`[ 1, 2, 3 ]`", "`[ 3, 2, 1 ]`"],
          answer: 1,
          explain: "`sort` rearranges the **original** array in place. Sort a copy: `[...nums].sort(...)` or `nums.toSorted(...)`.",
          why: ["`sort` changes `nums` itself, not just `sorted`.", "", "`a - b` sorts smallest first."],
        },
        {
          q: "What happens here?\n\n~~~\nconst counts = [\"a\", \"b\", \"a\"].reduce((acc, w) => {\n  acc[w] = (acc[w] || 0) + 1;\n}, {});\n~~~",
          choices: ["`counts` is `{ a: 2, b: 1 }`", "A TypeError on the second item", "`counts` is `undefined`"],
          answer: 1,
          explain: "The callback never returns the box, so after the first item `acc` is `undefined`, and `acc[\"b\"]` throws. End the callback with `return acc;`.",
          why: ["It would be, if the callback ended with `return acc;`.", "", "It throws before it can finish."],
        },
        {
          q: "Which sorts users youngest first **without** changing `users`?",
          choices: ["`users.sort((a, b) => a.age - b.age)`", "`[...users].sort((a, b) => a.age - b.age)`", "`[...users].sort((a, b) => b.age - a.age)`"],
          answer: 1,
          explain: "Copy first, then sort the copy. `a.age - b.age` puts smaller ages first.",
          why: ["That sorts `users` itself in place.", "", "`b.age - a.age` puts the oldest first."],
        },
      ],
    },
  ],
};
