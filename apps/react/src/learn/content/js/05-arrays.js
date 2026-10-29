// JS course · lesson 5. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'arrays',
  builds: ['js/strings'],
  title: 'Arrays',
  goal: 'Read items by position, find the last one, add items without changing the original, and copy pieces with slice.',
  minutes: 20,
  steps: [
    {
      type: 'read',
      title: 'An array is a numbered list',
      md: `
An array holds several values in order, inside square brackets:

~~~js
const letters = ["a", "b", "c"];
console.log(letters);
~~~

Each item has a **position number**, called its **index**. The part that trips everyone up: **counting starts at 0**, not 1.

| index | 0 | 1 | 2 |
|---|---|---|---|
| item | \`"a"\` | \`"b"\` | \`"c"\` |

You read an item with the array name, then the index in square brackets:

~~~
letters[0]   // "a"  (the first item)
letters[1]   // "b"  (the second item)
~~~
`,
    },
    {
      type: 'predict',
      title: 'Reading by index',
      md: 'Three reads. Watch the last one closely: there are only three items.',
      code: `const letters = ["a", "b", "c"];
console.log(letters[0]);
console.log(letters[2]);
console.log(letters[3]);`,
      output: `a
c
undefined`,
      explain: `
- \`letters[0]\` is the first item, \`"a"\`.
- \`letters[2]\` is the third item, \`"c"\`.
- \`letters[3]\` would be a fourth item, and there isn't one. JS doesn't crash. It quietly gives you \`undefined\`.

That quiet \`undefined\` is why index bugs are sneaky: nothing breaks until later.
`,
    },
    {
      type: 'task',
      title: 'first',
      md: `
**Example** (already solved):

~~~
function second(arr) {
  return arr[1];
}
~~~

**Your turn:** \`first(["a", "b", "c"])\` returns \`"a"\`.
`,
      starter: `function first(arr) {
  // your code here
}
`,
      tests: [
        { name: 'first(["a", "b", "c"]) is "a"', code: `eq(first(["a", "b", "c"]), "a");` },
        { name: 'first([10, 20]) is 10', code: `eq(first([10, 20]), 10);` },
      ],
      hint: 'Same as `second`, but the first item is at index `0`.',
      solution: `function first(arr) {
  return arr[0]; // counting starts at 0
}
`,
    },
    {
      type: 'read',
      title: 'length, and finding the last item',
      md: `
Every array knows how many items it has: \`.length\` (no \`()\`, it's a value, not a function).

~~~js
const letters = ["a", "b", "c"];
console.log(letters.length);
console.log(letters[letters.length - 1]);
~~~

Why \`length - 1\` for the last item? There are 3 items, but they're numbered 0, 1, 2. The last index is always **one less than the length**.

| length | indexes | last index |
|---|---|---|
| 3 | 0, 1, 2 | 2 |
| 5 | 0, 1, 2, 3, 4 | 4 |
| 1 | 0 | 0 |

This works for any size of array, which is the point: you don't need to know how long it is.
`,
    },
    {
      type: 'task',
      title: 'last',
      md: `\`last(["a", "b", "c"])\` returns \`"c"\`. It must work for any length, so don't write \`arr[2]\`.`,
      starter: `function last(arr) {
  // your code here
}
`,
      tests: [
        { name: 'last(["a", "b", "c"]) is "c"', code: `eq(last(["a", "b", "c"]), "c");` },
        { name: 'works for a longer array', code: `eq(last([1, 2, 3, 4, 5]), 5);` },
        { name: 'works for a one-item array', code: `eq(last(["only"]), "only");` },
      ],
      hint: 'The last index is `arr.length - 1`. Put that inside the square brackets: `arr[...]`.',
      solution: `function last(arr) {
  return arr[arr.length - 1]; // indexes stop one before the length
}
`,
    },
    {
      type: 'task',
      title: 'count',
      md: `\`count(["a", "b", "c"])\` returns \`3\`, and \`count([])\` returns \`0\`.`,
      starter: `function count(arr) {
  // your code here
}
`,
      tests: [
        { name: 'count(["a", "b", "c"]) is 3', code: `eq(count(["a", "b", "c"]), 3);` },
        { name: 'count([]) is 0', code: `eq(count([]), 0);` },
      ],
      hint: 'Return `arr.length`.',
      solution: `function count(arr) {
  return arr.length; // a value, not a function: no ()
}
`,
    },
    {
      type: 'predict',
      title: 'The off-by-one trap',
      md: 'The first line uses `length` without the `- 1`. The second uses `.at()`, a newer way to read from the end.',
      code: `const letters = ["a", "b", "c"];
console.log(letters[letters.length]);
console.log(letters.at(-1));`,
      output: `undefined
c`,
      explain: `
- \`letters[letters.length]\` is \`letters[3]\`, one past the end, so \`undefined\`. This is the classic **off-by-one** mistake.
- \`letters.at(-1)\` counts from the end: \`-1\` is the last item, \`-2\` the one before it. It's handy, but \`arr[arr.length - 1]\` is what you'll see in most code and interviews, so know both.
`,
    },
    {
      type: 'read',
      title: 'Is it in there? includes',
      md: `
\`includes\` answers a yes/no question: is this value somewhere in the array? It returns \`true\` or \`false\`.

~~~js
const nums = [1, 2, 3];
console.log(nums.includes(2));
console.log(nums.includes(9));
~~~

It compares with \`===\` (lesson 3), so \`"2"\` (a string) is not found in \`[1, 2, 3]\` (numbers).
`,
    },
    {
      type: 'task',
      title: 'contains',
      md: `\`contains([1, 2, 3], 2)\` returns \`true\`. \`contains([1, 2, 3], 9)\` returns \`false\`.`,
      starter: `function contains(arr, x) {
  // your code here
}
`,
      tests: [
        { name: 'contains([1, 2, 3], 2) is true', code: `eq(contains([1, 2, 3], 2), true);` },
        { name: 'contains([1, 2, 3], 9) is false', code: `eq(contains([1, 2, 3], 9), false);` },
      ],
      hint: 'Return `arr.includes(x)`. It already gives `true` or `false`, so you don\'t need an `if`.',
      solution: `function contains(arr, x) {
  return arr.includes(x); // already a boolean, no if needed
}
`,
    },
    {
      type: 'read',
      title: 'Adding items: change it, or copy it?',
      md: `
There are two ways to add an item, and the difference matters a lot later (React state, lesson 7).

**1. \`push\` changes the array you already have.** This is called **mutating** it.

~~~js
const nums = [1, 2];
nums.push(3);
console.log(nums);
~~~

**2. Spread \`...\` builds a brand-new array.** The original stays exactly as it was.

~~~js
const nums = [1, 2];
const more = [...nums, 3];
console.log(nums);
console.log(more);
~~~

Read \`[...nums, 3]\` as: "a new array containing everything in \`nums\`, then \`3\`." The three dots spill the items out into the new brackets. (Lesson 12 covers spread properly. For now, just this one move.)
`,
    },
    {
      type: 'predict',
      title: 'push on a "copy"',
      md: '`b = a` looks like it makes a copy. Does it?',
      code: `const a = [1, 2];
const b = a;
b.push(3);
console.log(a);`,
      output: `[ 1, 2, 3 ]`,
      explain: `
\`const b = a\` does **not** copy the array. \`a\` and \`b\` are two names for the **same** array, so pushing through \`b\` changes what you see through \`a\`.

Also notice \`const\` didn't stop \`push\`. \`const\` only stops you from pointing the name at a *different* array. It doesn't freeze what's inside. Lesson 7 goes deep on this, because it's the root of most React state bugs.
`,
    },
    {
      type: 'predict',
      title: 'Spread makes a real copy',
      code: `const a = [1, 2];
const b = [...a, 3];
console.log(a, b);`,
      output: `[ 1, 2 ] [ 1, 2, 3 ]`,
      explain: 'This time `b` is a new array, so `a` is untouched. When a task says "return a NEW array", this is the move.',
    },
    {
      type: 'task',
      title: 'addToEnd',
      md: `
**Example:** a new array with \`x\` at the **front**. \`arr\` itself is not changed.

~~~
function addToStart(arr, x) {
  return [x, ...arr];
}
~~~

**Your turn:** \`addToEnd([1, 2], 3)\` returns \`[1, 2, 3]\` as a **new** array. Don't use \`push\`: the original must not change.
`,
      starter: `function addToEnd(arr, x) {
  // your code here
}
`,
      tests: [
        { name: 'addToEnd([1, 2], 3) is [1, 2, 3]', code: `eq(addToEnd([1, 2], 3), [1, 2, 3]);` },
        { name: 'the original array is unchanged', code: `const original = [1, 2]; addToEnd(original, 3); eq(original, [1, 2], "the original changed: build a new array with [...arr, x] instead of push");` },
        { name: 'returns a different array, not the original', code: `const original = [1, 2]; assert(addToEnd(original, 3) !== original, "you returned the same array");` },
      ],
      hint: 'Flip the example around: the spread goes first, then `x`. `return [...arr, x];`',
      solution: `function addToEnd(arr, x) {
  return [...arr, x]; // a new array: everything from arr, then x
}
`,
    },
    {
      type: 'read',
      title: 'Copying a piece: slice',
      md: `
\`slice(start, end)\` copies part of an array into a **new** array. The rule to remember: **\`start\` is included, \`end\` is not**.

~~~js
const nums = [10, 20, 30, 40, 50];
console.log(nums.slice(0, 2));
console.log(nums.slice(1, 4));
console.log(nums);
~~~

| call | indexes copied | result |
|---|---|---|
| \`slice(0, 2)\` | 0, 1 | \`[10, 20]\` |
| \`slice(1, 4)\` | 1, 2, 3 | \`[20, 30, 40]\` |

A handy way to think of it: \`slice(0, n)\` gives you the **first n items**. And like spread, \`slice\` never changes the original.
`,
    },
    {
      type: 'task',
      title: 'firstThree',
      md: `
**Example:** \`slice(start, end)\` copies a piece. The end is not included.

~~~
function firstTwo(arr) {
  return arr.slice(0, 2);
}
~~~

**Your turn:** \`firstThree([1, 2, 3, 4, 5])\` returns \`[1, 2, 3]\`.
`,
      starter: `function firstThree(arr) {
  // your code here
}
`,
      tests: [
        { name: 'firstThree([1, 2, 3, 4, 5]) is [1, 2, 3]', code: `eq(firstThree([1, 2, 3, 4, 5]), [1, 2, 3]);` },
        { name: 'does not change the original', code: `const nums = [1, 2, 3, 4]; firstThree(nums); eq(nums, [1, 2, 3, 4]);` },
      ],
      hint: 'Same as `firstTwo`, with `3` as the end. The end is not included, so `slice(0, 3)` copies indexes 0, 1 and 2.',
      solution: `function firstThree(arr) {
  return arr.slice(0, 3); // indexes 0, 1, 2: the end (3) is not included
}
`,
    },
    {
      type: 'predict',
      title: 'slice with a negative number',
      md: 'Like `.at(-1)`, a negative number in `slice` counts from the end.',
      code: `const nums = [10, 20, 30, 40];
console.log(nums.slice(1, 3));
console.log(nums.slice(-2));
console.log(nums);`,
      output: `[ 20, 30 ]
[ 30, 40 ]
[ 10, 20, 30, 40 ]`,
      explain: `
- \`slice(1, 3)\`: indexes 1 and 2 (3 is not included).
- \`slice(-2)\`: with no end, it goes to the end of the array, so you get the last two items.
- \`nums\` is unchanged. \`slice\` always copies.
`,
    },
    {
      type: 'task',
      title: 'isEmpty',
      md: `\`isEmpty([])\` returns \`true\`. \`isEmpty([1])\` returns \`false\`. (A comparison like \`a === b\` already gives \`true\` or \`false\`.)`,
      starter: `function isEmpty(arr) {
  // your code here
}
`,
      tests: [
        { name: 'isEmpty([]) is true', code: `eq(isEmpty([]), true);` },
        { name: 'isEmpty([1]) is false', code: `eq(isEmpty([1]), false);` },
      ],
      hint: 'An empty array has a length of 0: `return arr.length === 0;`',
      solution: `function isEmpty(arr) {
  return arr.length === 0; // the comparison is already true or false
}
`,
      explain: 'Careful: `if (arr)` does **not** check for empty. An empty array `[]` is still truthy in JS. Always check `.length`.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "`const a = [10, 20, 30];` What is `a[a.length - 1]`?",
          choices: ["`30`", "`undefined`", "`20`"],
          answer: 0,
          explain: "`a.length` is 3, and the last index is 3 - 1 = 2, which holds 30.",
          why: ["", "That would be `a[a.length]`, one past the end.", "That's `a[1]`, the middle item."],
        },
        {
          q: "What does `[1, 2][5]` give?",
          choices: ["An error", "`undefined`", "`null`"],
          answer: 1,
          explain: "Reading an index that doesn't exist gives `undefined` with no error. That's why index bugs hide.",
          why: ["JS doesn't throw for a missing index.", "", "Missing things in JS are `undefined`, not `null`."],
        },
        {
          q: "What does this print?\n\n~~~\nconst a = [1, 2];\nconst b = [...a, 3];\nconsole.log(a.length, b.length);\n~~~",
          choices: ["`3 3`", "`2 3`", "`2 2`"],
          answer: 1,
          explain: "`[...a, 3]` builds a **new** array. The original `a` is untouched. (`a.push(3)` would have changed `a`.)",
          why: ["Spread doesn't change `a`. That's what `push` would do.", "", "`b` has the extra item, so its length is 3."],
        },
        {
          q: "What does `[10, 20, 30].slice(0, 2)` return?",
          choices: ["`[ 10, 20 ]`", "`[ 10, 20, 30 ]`", "`[ 20, 30 ]`"],
          answer: 0,
          explain: "`slice(start, end)` includes the start index and stops **before** the end index.",
          why: ["", "The end index (2) is not included.", "The start index 0 is included, so 10 is in."],
        },
        {
          q: "What does this print?\n\n~~~\nconst a = [1, 2];\nconst b = a;\nb.push(3);\nconsole.log(a);\n~~~",
          choices: ["`[ 1, 2 ]`", "`[ 1, 2, 3 ]`", "An error, because `a` is `const`"],
          answer: 1,
          explain: "`const b = a` doesn't copy. Both names point at the **same** array, so pushing through `b` changes what `a` sees. Copy with `[...a]`.",
          why: ["`b = a` shares the array; it doesn't copy it.", "", "`const` stops you reassigning `a`, not changing its contents."],
        },
      ],
    },
  ],
};
