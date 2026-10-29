// DSA course · lesson 13. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
const MERGE = `function merge(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) out.push(a[i++]);   // <= keeps equal items in their original order
    else out.push(b[j++]);
  }
  while (i < a.length) out.push(a[i++]);  // one side ran out: copy the rest of the other
  while (j < b.length) out.push(b[j++]);
  return out;
}`;

export default {
  id: 'sorting',
  builds: ['js/reduce-and-sort', 'dsa/recursion', 'dsa/arrays-two-pointers'],
  title: 'Sorting: comparators, merge sort and O(n log n)',
  goal: 'Use the built-in sort without its traps, write merge sort from a two-pointer merge, and know what stability and O(n log n) mean.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The built-in sort, and its two traps',
      md: `
You met \`sort\` in JavaScript lesson 11. In interviews you'll use it constantly, so the two traps are worth repeating:

1. **With no comparator, it compares as strings.** \`"10"\` comes before \`"9"\` because \`"1"\` comes before \`"9"\`.
2. **It sorts in place.** The original array changes, and the return value is that same array.

~~~js
const nums = [10, 9, 1, 100];

console.log([...nums].sort());                  // trap 1: dictionary order
console.log([...nums].sort((a, b) => a - b));   // numbers, smallest first
console.log(nums.toSorted((a, b) => b - a));    // a sorted copy, biggest first
console.log(nums);                              // untouched
~~~

The comparator \`(a, b) => ...\` returns:

- a **negative** number: \`a\` goes first
- a **positive** number: \`b\` goes first
- \`0\`: keep them as they are

\`a - b\` does exactly that for numbers. For strings, use \`a.localeCompare(b)\`. Don't return \`true\`/\`false\` (like \`a > b\`): \`false\` becomes 0, "equal", and the results are wrong in ways that depend on the engine.
`,
    },
    {
      type: 'predict',
      title: 'No comparator',
      code: `console.log([10, 1, 5, 100].sort());`,
      output: `[ 1, 10, 100, 5 ]`,
      explain: `
Each number is turned into a string and compared letter by letter. \`"1"\`, \`"10"\` and \`"100"\` all start with \`1\`, so they come before \`"5"\`.

If you said \`[1, 5, 10, 100]\`, that's what you'd **want**, and it's why every number sort needs \`(a, b) => a - b\`.
`,
    },
    {
      type: 'task',
      title: 'sortUsers',
      md: `
Sort by one field, then break ties with another. In the comparator, if the first fields differ, return their difference; otherwise compare the second field.

\`sortUsers(users)\` returns a **new** array sorted by \`age\` (youngest first), and users with the same age by \`name\` (A to Z). Don't change \`users\`.

~~~
[{ name: "Cy", age: 30 }, { name: "Al", age: 25 }, { name: "Bo", age: 30 }]
→ Al (25), Bo (30), Cy (30)
~~~
`,
      starter: `function sortUsers(users) {
  // your code here
}
`,
      tests: [
        { name: 'youngest first, ties by name', code: `const users = [{ name: "Cy", age: 30 }, { name: "Al", age: 25 }, { name: "Bo", age: 30 }];\neq(sortUsers(users).map((u) => u.name), ["Al", "Bo", "Cy"]);` },
        { name: 'the original array is unchanged', code: `const users = [{ name: "Cy", age: 30 }, { name: "Al", age: 25 }];\nsortUsers(users);\neq(users.map((u) => u.name), ["Cy", "Al"], "the original was sorted in place: copy it first");` },
      ],
      hint: '`return [...users].sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));`. `||` moves on to the name only when the age difference is 0.',
      solution: `function sortUsers(users) {
  return [...users].sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));
}
`,
      explain: '`a.age - b.age || ...` works because 0 is falsy: equal ages fall through to the name comparison.',
    },
    {
      type: 'read',
      title: 'Stability',
      md: `
A sort is **stable** if items that compare as equal keep their original order.

Why care? Because it lets you sort in two passes. If a list is already sorted by name, a stable sort by age keeps names in order within each age:

~~~js
const people = [
  { name: "Al", age: 30 },
  { name: "Bo", age: 25 },
  { name: "Cy", age: 30 },
  { name: "Di", age: 25 },
];
// already in name order; now sort by age only
console.log(people.toSorted((a, b) => a.age - b.age).map((p) => p.name));
~~~

Bo stays before Di, and Al before Cy. Since ES2019 the JavaScript spec **requires** \`Array.prototype.sort\` to be stable, so every modern engine does this. Python's \`sorted\` is stable too.

In a table UI, this is why "click the name column, then the age column" gives you ages with names in order inside each.
`,
    },
    {
      type: 'read',
      title: 'The brute force: O(n²) sorting',
      md: `
Before the fast way, the obvious way. **Selection sort:** find the smallest item, put it first. Find the next smallest, put it second. Repeat.

~~~js
function selectionSort(input) {
  const a = [...input];
  for (let i = 0; i < a.length; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) {   // scan the rest for the smallest
      if (a[j] < a[min]) min = j;
    }
    [a[i], a[min]] = [a[min], a[i]];            // swap it into place
  }
  return a;
}
console.log(selectionSort([5, 2, 9, 1, 7]));
~~~

A loop inside a loop: about n²/2 comparisons, **O(n²)**. For 10 items that's nothing. For a million it's about 500 billion comparisons. Bubble sort and insertion sort are in the same family.

Insertion sort still earns its place: on **nearly sorted** data it's close to O(n), which is why real sort implementations use it for small chunks.
`,
    },
    {
      type: 'read',
      title: 'Merge sort, part 1: merging two sorted lists',
      md: `
Merge sort rests on one easy job: **merging two lists that are already sorted.**

It's the two-pointer walk from lesson 2. Point at the front of each list. Take the smaller of the two fronts, move that pointer forward, repeat. When one list runs out, copy the rest of the other.

~~~js
${MERGE}

console.log(merge([1, 4, 9], [2, 3, 10, 12]));
~~~

Each item is pushed once, so merging is **O(n)** for n total items.

\`a[i++]\` reads \`a[i]\` and **then** adds 1 to \`i\`. If that's unfamiliar, it's the same as \`out.push(a[i]); i++;\`.
`,
    },
    {
      type: 'task',
      title: 'merge',
      md: `
Write \`merge(a, b)\`: both arrays are sorted, and it returns one sorted array with every item from both.

~~~
merge([1, 4, 9], [2, 3, 10])   → [1, 2, 3, 4, 9, 10]
merge([], [5, 6])              → [5, 6]
~~~

Two indexes \`i\` and \`j\`, a main \`while\` loop, then two small loops to copy what's left.
`,
      starter: `function merge(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  // your code here
  return out;
}
`,
      tests: [
        { name: 'interleaves two sorted lists', code: `eq(merge([1, 4, 9], [2, 3, 10]), [1, 2, 3, 4, 9, 10]);` },
        { name: 'an empty first list gives the second', code: `eq(merge([], [5, 6]), [5, 6]);` },
        { name: 'copies the leftovers when one list is longer', code: `eq(merge([1], [2, 3, 4]), [1, 2, 3, 4]);` },
      ],
      hint: '`while (i < a.length && j < b.length)` push the smaller front. Then `while (i < a.length) out.push(a[i++]);` and the same for `b`.',
      solution: `${MERGE}
`,
      explain: 'Forgetting the leftover loops is the classic bug: the main loop stops as soon as **one** list is empty.',
    },
    {
      type: 'read',
      title: 'Merge sort, part 2: split, sort, merge',
      md: `
Now the recursion (lesson 7). To sort an array:

1. **Base case:** 0 or 1 items is already sorted.
2. Split it in half and **sort each half** (recursion).
3. **Merge** the two sorted halves.

~~~js
${MERGE}

function mergeSort(nums) {
  if (nums.length <= 1) return nums;
  const mid = Math.floor(nums.length / 2);
  const left = mergeSort(nums.slice(0, mid));
  const right = mergeSort(nums.slice(mid));
  return merge(left, right);
}

console.log(mergeSort([38, 27, 43, 3, 9, 82, 10]));
~~~

**Why O(n log n):** you can halve n items about log₂ n times before reaching single items. That's log n **levels**. At each level, all the merges together touch every item once: O(n) per level. So: **n × log n**.

For a million items that's about 20 million steps, against 500 billion for selection sort.

Merge sort is **stable** (thanks to \`<=\` in \`merge\`) and always O(n log n), but it uses O(n) extra memory for the copies.
`,
    },
    {
      type: 'predict',
      title: 'Watch the merges',
      md: 'This `merge` logs every call. In what order do the merges happen?',
      code: `function merge(a, b) {
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
  const result = [...out, ...a.slice(i), ...b.slice(j)];
  console.log("merge", a, b, "->", result);
  return result;
}

function mergeSort(nums) {
  if (nums.length <= 1) return nums;
  const mid = Math.floor(nums.length / 2);
  return merge(mergeSort(nums.slice(0, mid)), mergeSort(nums.slice(mid)));
}

mergeSort([5, 2, 4, 1]);`,
      output: `merge [ 5 ] [ 2 ] -> [ 2, 5 ]
merge [ 4 ] [ 1 ] -> [ 1, 4 ]
merge [ 2, 5 ] [ 1, 4 ] -> [ 1, 2, 4, 5 ]`,
      explain: `
The left half \`[5, 2]\` is sorted completely before the right half starts, because \`mergeSort(left)\` has to return before \`mergeSort(right)\` is called. Then the top-level merge runs last.

It's a **post-order** walk (trees lesson): both children finish before the parent does its work.
`,
    },
    {
      type: 'task',
      title: 'mergeSort',
      md: `
\`merge\` is in the starter. Write \`mergeSort(nums)\`: base case, split at \`mid\`, sort both halves, merge them.

~~~
mergeSort([38, 27, 43, 3, 9])   → [3, 9, 27, 38, 43]
mergeSort([])                   → []
~~~

\`nums.slice(0, mid)\` is the left half and \`nums.slice(mid)\` is the right half.
`,
      starter: `${MERGE}

function mergeSort(nums) {
  // your code here
}
`,
      tests: [
        { name: 'sorts five numbers', code: `eq(mergeSort([38, 27, 43, 3, 9]), [3, 9, 27, 38, 43]);` },
        { name: 'an empty array gives []', code: `eq(mergeSort([]), []);` },
        { name: 'keeps duplicates', code: `eq(mergeSort([3, 1, 3, 2, 1]), [1, 1, 2, 3, 3]);` },
        { name: 'agrees with the built-in sort on 200 random numbers', code: `const nums = Array.from({ length: 200 }, () => Math.floor(Math.random() * 1000));\neq(mergeSort(nums), [...nums].sort((a, b) => a - b));` },
      ],
      hint: '`if (nums.length <= 1) return nums;` then `const mid = Math.floor(nums.length / 2);` and `return merge(mergeSort(nums.slice(0, mid)), mergeSort(nums.slice(mid)));`',
      solution: `${MERGE}

function mergeSort(nums) {
  if (nums.length <= 1) return nums;
  const mid = Math.floor(nums.length / 2);
  return merge(mergeSort(nums.slice(0, mid)), mergeSort(nums.slice(mid)));
}
`,
    },
    {
      type: 'read',
      title: 'Quick sort, the idea',
      md: `
Quick sort flips merge sort around. Merge sort splits blindly and does the work when **merging**. Quick sort does the work when **splitting**:

1. Pick a **pivot** item.
2. **Partition:** everything smaller goes left, everything bigger goes right.
3. Sort both sides (recursion). No merge needed: left, pivot, right is already in order.

~~~js
function quickSort(nums) {
  if (nums.length <= 1) return nums;
  const [pivot, ...rest] = nums;
  const left = rest.filter((n) => n < pivot);
  const right = rest.filter((n) => n >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}
console.log(quickSort([38, 27, 43, 3, 9, 82, 10]));
~~~

This short version copies arrays for clarity. Real quick sort partitions **in place**, using no extra arrays, which is its big practical advantage.

The catch is the pivot. If it lands near the middle, each split halves the work: **O(n log n)** on average. If it's always the smallest item (pick the first item of an already sorted array), one side is empty every time and it degrades to **O(n²)**. Picking a random pivot makes that worst case very unlikely. In-place quick sort is also **not stable**.
`,
    },
    {
      type: 'read',
      title: 'The sorting cheat sheet',
      md: `
| Sort | Time | Extra memory | Stable |
|---|---|---|---|
| selection / bubble | O(n²) | O(1) | selection: no, bubble: yes |
| insertion | O(n²), near O(n) if nearly sorted | O(1) | yes |
| merge sort | O(n log n) always | O(n) | yes |
| quick sort | O(n log n) average, O(n²) worst | O(log n) stack | no (in place) |
| JavaScript's \`sort\` | O(n log n) | O(n) | yes (required since ES2019) |

V8 (Chrome, Node) implements \`sort\` with **TimSort**, a merge sort and insertion sort hybrid that's fast on partly sorted data. Python uses a TimSort-family algorithm too.

**O(n log n) is the floor** for any sort that works by comparing items. Faster sorts (counting sort, radix sort) only exist for special cases like small integer ranges.

**In an interview:** just call \`sort\` with a comparator and say "that's O(n log n)". Write merge sort only when asked to implement a sort. And when you see "sorted" in a problem, think binary search or two pointers; when you sort first, add O(n log n) to your Big-O.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'What does `[2, 10, 1].sort()` return?',
          choices: ['`[1, 10, 2]`', '`[1, 2, 10]`', '`[10, 2, 1]`'],
          answer: 0,
          explain: 'With no comparator, items are compared as strings, and `"10"` comes before `"2"`.',
          why: { 1: 'That needs `(a, b) => a - b`.', 2: 'That\'s descending, which needs `(a, b) => b - a`.' },
        },
        {
          q: 'Why is merge sort O(n log n)?',
          choices: ['log n levels of halving, and O(n) merging work per level', 'It compares every pair once', 'It sorts each half in O(log n)'],
          answer: 0,
          explain: 'Halving gives log n levels; at each level every item is merged once.',
          why: { 1: 'Comparing every pair is the O(n²) brute force.', 2: 'Nothing sorts n/2 items in O(log n). The log comes from the number of levels.' },
        },
        {
          q: 'What does "stable" mean for a sort?',
          choices: ['Items that compare equal keep their original order', 'It never takes more than O(n log n)', 'It doesn\'t change the original array'],
          answer: 0,
          explain: 'Stability is about ties. It\'s what makes sorting by name, then by age, keep names in order within each age.',
          why: { 1: 'That\'s a time guarantee, not stability.', 2: 'That\'s about copying. `sort` is stable **and** in place.' },
        },
        {
          q: 'When does quick sort hit its O(n²) worst case?',
          choices: ['When the pivot is always the smallest or largest item', 'When the array has duplicates', 'When the array is small'],
          answer: 0,
          explain: 'Then one side of every split is empty, so you peel off one item per level: n levels of O(n).',
          why: { 1: 'Duplicates are fine with a sensible partition.', 2: 'Small arrays are fast whatever the Big-O.' },
        },
      ],
    },
  ],
};
