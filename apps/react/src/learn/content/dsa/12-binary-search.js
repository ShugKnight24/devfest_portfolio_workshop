// DSA course · lesson 12. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
const LOWER = `function lowerBound(nums, target) {
  let lo = 0;
  let hi = nums.length;            // half-open: the answer is somewhere in [lo, hi]
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] < target) lo = mid + 1;   // mid is too small: answer is to the right
    else hi = mid;                          // mid could be the answer: keep it
  }
  return lo;
}`;

const HOURS = `// hours needed to eat every pile at this speed (a pile of 7 at speed 3 takes 3 hours)
function hoursAt(piles, speed) {
  let hours = 0;
  for (const p of piles) hours += Math.ceil(p / speed);
  return hours;
}`;

export default {
  id: 'binary-search',
  builds: ['dsa/big-o', 'dsa/arrays-two-pointers'],
  title: 'Binary search: halve it every time',
  goal: 'Find things in a sorted array in O(log n) without off-by-one bugs, find the first position with lower bound, and binary search over an answer instead of an array.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Guess the number',
      md: `
"I'm thinking of a number from 1 to 100." The brute force guesses 1, 2, 3...: up to **100 guesses**, O(n). That's a linear search, the first loop anyone writes:

~~~js
function linearSearch(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) return i;
  }
  return -1;
}
console.log(linearSearch([2, 5, 8, 12, 16], 12));
~~~

The smart way guesses 50. "Lower." Now 25. Each answer **throws away half** of what's left, so 100 numbers take at most 7 guesses, and a million take about 20. That's **O(log n)**.

It needs one thing: the data must be **sorted**, so that one comparison tells you which half to drop. This is the same "use the sorted order" idea as two pointers in lesson 2, pushed further.

If the array isn't sorted, sorting it first costs O(n log n), which is worse than one linear search. Binary search pays off when you search the same sorted data many times.
`,
    },
    {
      type: 'read',
      title: 'The classic version',
      md: `
Keep two indexes, \`lo\` and \`hi\`, around the part of the array that could still hold the target. Look at the middle. Then drop the half that can't contain it.

~~~js
function binarySearch(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;          // both ends are real indexes: [lo, hi]
  while (lo <= hi) {                 // <= : a range of one item still needs checking
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;   // target is to the right of mid
    else hi = mid - 1;                      // target is to the left of mid
  }
  return -1;                         // lo passed hi: the range is empty
}

const nums = [2, 5, 8, 12, 16, 23, 38];
console.log(binarySearch(nums, 23));
console.log(binarySearch(nums, 7));
~~~

Three details carry the whole thing:

- \`Math.floor\` because \`(lo + hi) / 2\` can be 2.5, and array indexes are whole numbers.
- \`mid + 1\` and \`mid - 1\`, never just \`mid\`: you already checked \`mid\`, so leave it out. Otherwise the range can stop shrinking and loop forever.
- \`lo <= hi\`: when \`lo === hi\` there's still one item left to look at.
`,
    },
    {
      type: 'predict',
      title: 'Trace the range',
      md: 'The loop prints `lo`, `hi` and `mid` on each turn.',
      code: `const nums = [1, 3, 5, 7, 9, 11, 13];
const target = 11;

let lo = 0;
let hi = nums.length - 1;
while (lo <= hi) {
  const mid = Math.floor((lo + hi) / 2);
  console.log(lo, hi, mid);
  if (nums[mid] === target) { console.log("found at", mid); break; }
  if (nums[mid] < target) lo = mid + 1;
  else hi = mid - 1;
}`,
      output: `0 6 3
4 6 5
found at 5`,
      explain: `
Turn 1: the middle of 0..6 is 3, and \`nums[3]\` is 7. That's less than 11, so everything up to index 3 is out: \`lo = 4\`.

Turn 2: the middle of 4..6 is 5, and \`nums[5]\` is 11. Found in two looks, out of seven items.
`,
    },
    {
      type: 'task',
      title: 'binarySearch',
      md: `
Write it yourself. \`binarySearch(nums, target)\` returns the index of \`target\` in the sorted array \`nums\`, or \`-1\` if it's not there.

~~~
binarySearch([2, 5, 8, 12, 16], 12)   → 3
binarySearch([2, 5, 8, 12, 16], 7)    → -1
binarySearch([], 1)                   → -1
~~~

Use \`lo = 0\`, \`hi = nums.length - 1\` and \`while (lo <= hi)\`.
`,
      starter: `function binarySearch(nums, target) {
  // your code here
}
`,
      tests: [
        { name: 'finds 12 at index 3', code: `eq(binarySearch([2, 5, 8, 12, 16], 12), 3);` },
        { name: 'a missing value gives -1', code: `eq(binarySearch([2, 5, 8, 12, 16], 7), -1);` },
        { name: 'finds the first and last items', code: `eq(binarySearch([2, 5, 8, 12, 16], 2), 0);\neq(binarySearch([2, 5, 8, 12, 16], 16), 4);` },
        { name: 'an empty array gives -1', code: `eq(binarySearch([], 1), -1);` },
      ],
      hint: 'Inside the loop: `const mid = Math.floor((lo + hi) / 2);`, return `mid` on a match, otherwise move `lo` to `mid + 1` or `hi` to `mid - 1`.',
      solution: `function binarySearch(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
`,
      explain: 'The "first and last items" test is there because those are exactly where off-by-one bugs show up.',
    },
    {
      type: 'predict',
      title: 'One character off',
      md: 'Same function, but the loop says `lo < hi`.',
      code: `function search(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

console.log(search([4], 4), search([1, 3, 5], 5));`,
      output: `-1 -1`,
      explain: `
With \`[4]\`, \`lo\` and \`hi\` are both 0, so \`lo < hi\` is false and the loop never runs. With \`[1, 3, 5]\`, the range shrinks to just index 2, and again the loop stops before checking it.

This bug passes most tests, which is why it's so common. The rule that prevents it: **decide what \`lo\` and \`hi\` mean, and make every line agree.**

| Style | \`hi\` starts at | loop | moves |
|---|---|---|---|
| closed \`[lo, hi]\` | \`length - 1\` | \`lo <= hi\` | \`lo = mid + 1\`, \`hi = mid - 1\` |
| half-open \`[lo, hi)\` | \`length\` | \`lo < hi\` | \`lo = mid + 1\`, \`hi = mid\` |

Mixing a row's \`hi\` with the other row's loop is the bug above. Pick one style per function.
`,
    },
    {
      type: 'read',
      title: 'Lower bound: the first position that fits',
      md: `
Plain binary search answers "is it here?". Very often the real question is **"where does it start?"**:

- the first index of 5 in \`[1, 3, 5, 5, 5, 8]\` (there are three 5s; plain search returns any of them)
- where to insert 6 to keep the array sorted
- the first timestamp at or after 9:00

All three are **lower bound**: the first index \`i\` where \`nums[i] >= target\`. If every item is smaller, the answer is \`nums.length\` (insert at the end).

It uses the half-open style. When \`nums[mid]\` is big enough, it **might** be the answer, so keep it with \`hi = mid\` instead of skipping it:

~~~js
${LOWER}

const nums = [1, 3, 5, 5, 5, 8];
console.log(lowerBound(nums, 5));    // first 5
console.log(lowerBound(nums, 6));    // where 6 would go
console.log(lowerBound(nums, 99));   // past the end
~~~

The loop stops when \`lo === hi\`, and that shared value is the answer. No \`=== target\` check inside: lower bound never stops early. Still **O(log n)**.
`,
    },
    {
      type: 'task',
      title: 'lowerBound',
      md: `
Type \`lowerBound\` yourself. \`lowerBound(nums, target)\` returns the first index where \`nums[i] >= target\`, or \`nums.length\` if there isn't one.

~~~
lowerBound([1, 3, 5, 5, 5, 8], 5)   → 2
lowerBound([1, 3, 5, 5, 5, 8], 6)   → 5
lowerBound([1, 3], 99)              → 2
~~~

Half-open: \`hi = nums.length\`, \`while (lo < hi)\`, and \`hi = mid\` (not \`mid - 1\`).
`,
      starter: `function lowerBound(nums, target) {
  // your code here
}
`,
      tests: [
        { name: 'finds the first of several 5s', code: `eq(lowerBound([1, 3, 5, 5, 5, 8], 5), 2);` },
        { name: 'a missing value gives its insert position', code: `eq(lowerBound([1, 3, 5, 5, 5, 8], 6), 5);` },
        { name: 'bigger than everything gives the length', code: `eq(lowerBound([1, 3], 99), 2);` },
        { name: 'smaller than everything gives 0', code: `eq(lowerBound([4, 6], 1), 0);` },
      ],
      hint: 'If `nums[mid] < target`, the answer is to the right: `lo = mid + 1`. Otherwise `hi = mid`. Return `lo` after the loop.',
      solution: `${LOWER}
`,
    },
    {
      type: 'task',
      title: 'countOf',
      md: `
Combine: \`countOf(nums, target)\` returns how many times \`target\` appears in the sorted array, in O(log n).

Where does the run of 5s **start**? \`lowerBound(nums, 5)\`. Where does it **end**? Where a 6 would go: \`lowerBound(nums, 5 + 1)\`. The count is the difference.

~~~
countOf([1, 3, 5, 5, 5, 8], 5)   → 3
countOf([1, 3, 5, 5, 5, 8], 4)   → 0
~~~

\`lowerBound\` is in the starter. The arrays hold whole numbers.
`,
      starter: `${LOWER}

function countOf(nums, target) {
  // your code here
}
`,
      tests: [
        { name: 'three 5s gives 3', code: `eq(countOf([1, 3, 5, 5, 5, 8], 5), 3);` },
        { name: 'a missing value gives 0', code: `eq(countOf([1, 3, 5, 5, 5, 8], 4), 0);` },
        { name: 'every item matching gives the length', code: `eq(countOf([2, 2, 2, 2], 2), 4);` },
      ],
      hint: '`return lowerBound(nums, target + 1) - lowerBound(nums, target);`',
      solution: `${LOWER}

function countOf(nums, target) {
  return lowerBound(nums, target + 1) - lowerBound(nums, target);
}
`,
      explain: 'The brute force counts with a loop in O(n). Two binary searches make it O(log n), which matters when you ask many times over the same big sorted array.',
    },
    {
      type: 'read',
      title: 'Binary search over answers, not arrays',
      md: `
Here's the jump that makes binary search show up in "hard" problems. You don't need an array at all. You need:

1. a range of possible answers, \`lo\` to \`hi\`, and
2. a yes/no question \`ok(x)\` that flips **once**: no, no, no, yes, yes, yes.

Then lower bound finds the first yes. It's the same loop with \`ok(mid)\` in place of \`nums[mid] >= target\`.

Example: the smallest whole number \`x\` with \`x * x >= 50\`. The brute force tries 1, 2, 3... Binary search tries the middle of the range:

~~~js
function firstTrue(lo, hi, ok) {
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (ok(mid)) hi = mid;      // mid works: maybe something smaller does too
    else lo = mid + 1;          // mid fails: everything at or below it fails
  }
  return lo;
}

console.log(firstTrue(1, 50, (x) => x * x >= 50));
~~~

**How to spot it:** the question asks for the **minimum** (or maximum) value such that something is possible: "the smallest capacity that ships everything in 5 days", "the slowest speed that still finishes on time". If a bigger answer is always at least as good, the yes/no flips once, and you can binary search it.

Cost: O(log(range)) checks, times whatever one \`ok\` costs.
`,
    },
    {
      type: 'task',
      title: 'minEatingSpeed',
      md: `
A classic. There are piles of bananas, and you have \`h\` hours. At speed \`k\` you eat up to \`k\` bananas from **one** pile per hour. Find the **smallest** whole speed that finishes every pile within \`h\` hours.

The starter has \`hoursAt(piles, speed)\`. Your \`ok(speed)\` is \`hoursAt(piles, speed) <= h\`. The answer is somewhere from \`1\` to the biggest pile (at that speed every pile takes 1 hour).

~~~
minEatingSpeed([3, 6, 7, 11], 8)   → 4
minEatingSpeed([30, 11, 23, 4, 20], 5)   → 30
~~~

Write the \`firstTrue\` loop with \`lo = 1\`, \`hi = Math.max(...piles)\`.
`,
      starter: `${HOURS}

function minEatingSpeed(piles, h) {
  // your code here
}
`,
      tests: [
        { name: 'piles [3, 6, 7, 11] in 8 hours needs speed 4', code: `eq(minEatingSpeed([3, 6, 7, 11], 8), 4);` },
        { name: 'one hour per pile needs the biggest pile', code: `eq(minEatingSpeed([30, 11, 23, 4, 20], 5), 30);` },
        { name: 'one more hour lets you slow down to 23', code: `eq(minEatingSpeed([30, 11, 23, 4, 20], 6), 23);` },
      ],
      hint: 'Inside `while (lo < hi)`: if `hoursAt(piles, mid) <= h`, set `hi = mid`, else `lo = mid + 1`. Return `lo`.',
      solution: `${HOURS}

function minEatingSpeed(piles, h) {
  let lo = 1;
  let hi = Math.max(...piles);
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (hoursAt(piles, mid) <= h) hi = mid;   // fast enough: try slower
    else lo = mid + 1;                         // too slow: must go faster
  }
  return lo;
}
`,
      explain: 'Trying every speed from 1 up is O(max × n). Binary search over speeds is O(n log max). Faster speeds never take more hours, so the yes/no flips exactly once.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'About how many steps does binary search take on 1,000,000 sorted items?',
          choices: ['About 20', 'About 1,000', 'About 500,000'],
          answer: 0,
          explain: 'Halving a million down to 1 takes about log₂(1,000,000) ≈ 20 steps.',
          why: { 1: 'That\'s the square root, which isn\'t how halving works.', 2: 'That\'s the average for a linear search.' },
        },
        {
          q: 'You use `hi = nums.length - 1`. Which loop condition goes with it?',
          choices: ['`while (lo <= hi)`', '`while (lo < hi)`', '`while (lo !== hi)`'],
          answer: 0,
          explain: 'In the closed style `hi` is a real index, so a range where `lo === hi` still has one item to check.',
          why: { 1: 'That skips the last remaining item: the `[4]` bug.', 2: 'Same problem, and it can also step past each other and never stop.' },
        },
        {
          q: 'What does `lowerBound([1, 3, 5, 5, 8], 4)` return?',
          choices: ['`2`', '`-1`', '`1`'],
          answer: 0,
          explain: 'The first item that is >= 4 is the 5 at index 2. Lower bound always returns a position, never -1.',
          why: { 1: 'Lower bound returns where it would go, not "not found".', 2: 'Index 1 holds 3, which is smaller than 4.' },
        },
        {
          q: '"Find the smallest truck capacity that ships every box within 5 days." Why can you binary search the capacity?',
          choices: ['A bigger capacity never takes more days, so "is it enough?" flips once', 'The boxes are sorted', 'Capacities are whole numbers'],
          answer: 0,
          explain: 'That one flip from "no" to "yes" is all binary search needs. The boxes don\'t have to be sorted at all.',
          why: { 1: 'You search the answer range, not the box array.', 2: 'Whole numbers help, but without the single flip there\'s no half to throw away.' },
        },
      ],
    },
  ],
};
