// DSA course · lesson 2. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'arrays-two-pointers',
  builds: ['dsa/big-o', 'js/arrays', 'js/loops'],
  title: 'Arrays and two pointers',
  goal: 'Know what array operations cost, change an array in place instead of copying it, and use two index variables to turn O(n²) scans into O(n).',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'An array is a row of numbered boxes',
      md: `
In JavaScript lesson 5 you read items by index. Under the hood, an array keeps its items in a row, so jumping to box \`i\` is one step, whatever \`i\` is:

~~~js
const letters = ["a", "b", "c", "d", "e"];
console.log(letters[0]);                  // first: O(1)
console.log(letters[letters.length - 1]); // last: O(1)
console.log(letters[2]);                  // middle: still O(1)
~~~

The cost comes from **moving** items. Adding or removing at the **end** touches one box. Adding or removing at the **front** means every other item has to shift over one index:

| Operation | Cost |
|---|---|
| read or write \`arr[i]\` | O(1) |
| \`push\` / \`pop\` (end) | O(1) |
| \`unshift\` / \`shift\` (front) | O(n) |
| \`splice\` in the middle | O(n) |
| copy: \`[...arr]\`, \`slice\`, \`map\` | O(n) time and O(n) space |

This lesson uses only the cheap row: reading and writing by index.
`,
    },
    {
      type: 'read',
      title: 'In place vs a copy',
      md: `
Some methods **change the array you call them on** (in place). Others **return a new array** and leave the original alone. You met this in lesson 5 with \`push\` vs spread.

~~~js
const a = [1, 2, 3];
const copy = a.toReversed(); // new array, a is untouched (newer method, 2023)
console.log(a, copy);

a.reverse();                 // changes a itself
console.log(a);
~~~

Why it matters for DSA:

- **In place** uses O(1) extra space. Interviewers sometimes ask for it directly: "do it without making a new array".
- **A copy** costs O(n) extra space, but it's safer: nobody else holding the array gets surprised. In React state you always copy.

When a question says "modify the array in place", it means: only read and write \`arr[i]\`, don't build a second array.
`,
    },
    {
      type: 'predict',
      title: 'reverse changes the original',
      md: '`b` is the return value of `reverse()`. Is it a new array?',
      code: `const a = [1, 2, 3];
const b = a.reverse();

console.log(a);
console.log(b === a);`,
      output: `[ 3, 2, 1 ]
true`,
      explain: `
\`reverse()\` flips \`a\` in place and then returns **the same array** for convenience. So \`a\` is now \`[3, 2, 1]\`, and \`b\` is just another name for it (lesson 7: references, not copies).

The common wrong answer is that \`a\` stays \`[1, 2, 3]\`, because "it returned something, so it must be a copy". \`sort\` behaves the same way.
`,
    },
    {
      type: 'read',
      title: 'Two pointers: one at each end',
      md: `
A **pointer** here is just a variable holding an index. The two-pointer pattern keeps **two** of them and moves them toward each other.

To reverse in place: swap the first and last items, then the second and second-to-last, and stop when the pointers meet.

~~~js
const arr = ["a", "b", "c", "d", "e"];
let left = 0;
let right = arr.length - 1;

while (left < right) {
  [arr[left], arr[right]] = [arr[right], arr[left]]; // swap (destructuring, lesson 12)
  left++;
  right--;
}
console.log(arr);
~~~

| Step | \`left\` | \`right\` | \`arr\` after the swap |
|---|---|---|---|
| 1 | 0 | 4 | \`e b c d a\` |
| 2 | 1 | 3 | \`e d c b a\` |
| stop | 2 | 2 | pointers met: the middle stays put |

Each item is touched once: **O(n) time, O(1) extra space**. That's the deal two pointers usually gives you.
`,
    },
    {
      type: 'task',
      title: 'reverseInPlace',
      md: `
Write \`reverseInPlace(arr)\`. It swaps items in \`arr\` itself (no new array, no \`.reverse()\`) and returns \`arr\`.

~~~
reverseInPlace([1, 2, 3, 4])  → [4, 3, 2, 1]  (and it's the same array you passed in)
~~~

The loop from the previous step is the whole answer, inside a function.
`,
      starter: `function reverseInPlace(arr) {
  // your code here
}
`,
      tests: [
        { name: 'reverseInPlace([1, 2, 3, 4]) is [4, 3, 2, 1]', code: `eq(reverseInPlace([1, 2, 3, 4]), [4, 3, 2, 1]);` },
        { name: 'an odd length keeps the middle item', code: `eq(reverseInPlace(["a", "b", "c"]), ["c", "b", "a"]);` },
        { name: 'it returns the same array, not a copy', code: `const a = [1, 2]; assert(reverseInPlace(a) === a, "return arr itself"); eq(a, [2, 1]);` },
        { name: 'an empty array stays empty', code: `eq(reverseInPlace([]), []);` },
      ],
      hint: 'Set `let left = 0` and `let right = arr.length - 1`. Loop `while (left < right)`, swap, then move both pointers. `return arr` after the loop.',
      solution: `function reverseInPlace(arr) {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }
  return arr;
}
`,
    },
    {
      type: 'task',
      title: 'isPalindrome',
      md: `
Same two pointers, but instead of swapping you **compare**. A palindrome reads the same both ways.

\`isPalindrome(str)\` returns \`true\` or \`false\`. Strings can be indexed like arrays: \`str[0]\`, \`str.length\`.

~~~
isPalindrome("racecar")  → true
isPalindrome("abca")     → false
~~~

The moment \`str[left] !== str[right]\`, you already know the answer.
`,
      starter: `function isPalindrome(str) {
  // your code here
}
`,
      tests: [
        { name: 'isPalindrome("racecar") is true', code: `eq(isPalindrome("racecar"), true);` },
        { name: 'isPalindrome("abba") is true', code: `eq(isPalindrome("abba"), true);` },
        { name: 'isPalindrome("abca") is false', code: `eq(isPalindrome("abca"), false);` },
        { name: 'an empty string is a palindrome', code: `eq(isPalindrome(""), true);` },
      ],
      hint: 'Inside `while (left < right)`: `if (str[left] !== str[right]) return false;` then move both pointers. If the loop finishes, `return true`.',
      solution: `function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;
  while (left < right) {
    if (str[left] !== str[right]) return false;
    left++;
    right--;
  }
  return true;
}
`,
      explain: 'The one-liner `str === str.split("").reverse().join("")` also works, and is fine to mention. It\'s O(n) time too, but builds two extra arrays/strings, so O(n) space instead of O(1).',
    },
    {
      type: 'read',
      title: 'Pair sum on a sorted array: brute force first',
      md: `
A classic: **given a sorted array and a target, find two numbers that add up to the target.** Return their indexes.

The brute force tries every pair, exactly like \`hasDuplicate\` in lesson 1:

~~~js
function pairSumBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return null;
}
console.log(pairSumBrute([1, 3, 4, 6, 9], 10));
~~~

O(n²) time. It ignores the best clue in the question: the word **sorted**.

**The better way.** Put \`left\` on the smallest number and \`right\` on the biggest, and look at their sum:

- **Too small?** The only way to grow it is a bigger left number: \`left++\`.
- **Too big?** The only way to shrink it is a smaller right number: \`right--\`.
- **Equal?** Done.

Each step rules out one number for good, so it's at most \`n\` steps: **O(n) time, O(1) space**.
`,
    },
    {
      type: 'predict',
      title: 'Watch the pointers move',
      md: 'Target is 10. Follow the rule: too small moves left, too big moves right.',
      code: `const nums = [1, 3, 4, 6, 9];
const target = 10;
let left = 0;
let right = nums.length - 1;

while (left < right) {
  const sum = nums[left] + nums[right];
  console.log(left, right, sum);
  if (sum === target) break;
  if (sum < target) left++;
  else right--;
}`,
      output: `0 4 10`,
      explain: `
\`1 + 9\` is already 10 on the first try, so it stops at once. Now **Edit** the target to \`13\` and run it: you'll see \`0 4 10\` (too small, left moves), \`1 4 12\` (too small), \`2 4 13\` (found). Three steps instead of checking all ten pairs.
`,
    },
    {
      type: 'task',
      title: 'pairSum',
      md: `
Write \`pairSum(nums, target)\` for a **sorted** array. Return \`[left, right]\` (the two indexes) when \`nums[left] + nums[right] === target\`, or \`null\` if no pair works.

~~~
pairSum([1, 3, 4, 6, 9], 13)  → [2, 4]   (4 + 9)
pairSum([1, 2, 3], 100)       → null
~~~

Use the two-pointer loop from the previous step; replace the \`console.log\` and \`break\` with \`return\`s.
`,
      starter: `function pairSum(nums, target) {
  // your code here
}
`,
      tests: [
        { name: 'pairSum([1, 3, 4, 6, 9], 13) is [2, 4]', code: `eq(pairSum([1, 3, 4, 6, 9], 13), [2, 4]);` },
        { name: 'pairSum([1, 3, 4, 6, 9], 10) is [0, 4]', code: `eq(pairSum([1, 3, 4, 6, 9], 10), [0, 4]);` },
        { name: 'no pair gives null', code: `eq(pairSum([1, 2, 3], 100), null);` },
        { name: 'an item is not paired with itself', code: `eq(pairSum([5], 10), null);` },
      ],
      hint: 'Inside `while (left < right)`: compute `sum`, then `if (sum === target) return [left, right];`, `else if (sum < target) left++;`, `else right--;`. After the loop, `return null`.',
      solution: `function pairSum(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null;
}
`,
      explain: 'If the array is **not** sorted, this trick breaks. You could sort first (O(n log n)), or use a Map for O(n). That\'s two-sum in lesson 3.',
    },
    {
      type: 'read',
      title: 'Same direction: a read pointer and a write pointer',
      md: `
Pointers don't have to start at opposite ends. In the second shape, **both move left to right**: a fast \`read\` pointer looks at every item, and a slow \`write\` pointer marks where the next item you want to keep goes.

**Problem:** remove duplicates from a **sorted** array, in place. Return how many unique items there are; they should sit at the front.

The brute force builds a new array and checks it each time: \`if (!result.includes(x)) result.push(x)\`. That's a hidden loop, so O(n²) time, plus O(n) space.

Because the array is sorted, duplicates sit **next to each other**. An item is new exactly when it differs from the last one you kept:

~~~js
const arr = [1, 1, 2, 3, 3, 3, 4];
let write = 1;                       // arr[0] is always kept
for (let read = 1; read < arr.length; read++) {
  if (arr[read] !== arr[write - 1]) { // different from the last kept item?
    arr[write] = arr[read];          // keep it
    write++;
  }
}
console.log(write, arr.slice(0, write));
~~~

\`write\` ends up being the count of unique items. The tail of the array after \`write\` is leftover junk, which the question allows. **O(n) time, O(1) space.**
`,
    },
    {
      type: 'task',
      title: 'dedupeSorted',
      md: `
Write \`dedupeSorted(arr)\` for a sorted array. Move the unique values to the front **in place** and return how many there are.

~~~
const arr = [1, 1, 2, 3, 3];
dedupeSorted(arr)  → 3
arr.slice(0, 3)    → [1, 2, 3]
~~~

Handle the empty array first: \`if (arr.length === 0) return 0;\`, then use the read/write loop from the previous step.
`,
      starter: `function dedupeSorted(arr) {
  // your code here
}
`,
      tests: [
        { name: '[1, 1, 2, 3, 3] has 3 unique values', code: `eq(dedupeSorted([1, 1, 2, 3, 3]), 3);` },
        { name: 'the unique values end up at the front', code: `const a = [1, 1, 2, 3, 3]; const k = dedupeSorted(a); eq(a.slice(0, k), [1, 2, 3]);` },
        { name: 'all the same gives 1', code: `const a = [7, 7, 7]; eq(dedupeSorted(a), 1); eq(a[0], 7);` },
        { name: 'an empty array gives 0', code: `eq(dedupeSorted([]), 0);` },
      ],
      hint: 'Start `let write = 1`, loop `read` from 1, and copy `arr[read]` into `arr[write]` only when it differs from `arr[write - 1]`. Return `write`.',
      solution: `function dedupeSorted(arr) {
  if (arr.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < arr.length; read++) {
    if (arr[read] !== arr[write - 1]) {
      arr[write] = arr[read];
      write++;
    }
  }
  return write;
}
`,
    },
    {
      type: 'read',
      title: 'How to spot two pointers in an interview question',
      md: `
Reach for two pointers when you hear:

- **"sorted array"** plus "pair", "two numbers", "sum to target" → opposite ends, move the side that fixes the sum.
- **"in place"**, "without extra space", "O(1) memory" → swap with two indexes, or read/write pointers.
- **"palindrome"**, "reverse", "compare from both ends" → opposite ends, move inward.
- **"remove"**, "move zeros to the end", "keep only..." on an array → read/write pointers in the same direction.

How to say it: "The brute force checks every pair, O(n²). Since the array is sorted, I can use two pointers: each step discards one element, so it's O(n) time and O(1) extra space."

If the array is **not** sorted and you need a pair, two pointers is usually the wrong tool. That's a hash map job, next lesson.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "Why is `arr.shift()` O(n) but `arr.pop()` O(1)?",
          choices: ["Removing the first item makes every other item move down one index", "shift copies the whole array into a new one", "pop doesn't actually remove anything"],
          answer: 0,
          explain: "Indexes must stay 0, 1, 2... so after removing index 0, every remaining item shifts over.",
          why: { 1: "No new array is made. Items move within the same array.", 2: "pop removes the last item; nothing else needs to move." },
        },
        {
          q: "In pair sum on a sorted array, the current sum is **too big**. What do you do?",
          choices: ["Move `right` one step left", "Move `left` one step right", "Start over from the beginning"],
          answer: 0,
          explain: "The right side holds the bigger numbers. Moving it left is the only move that can make the sum smaller.",
          why: { 1: "Moving left rightward picks a bigger number, so the sum grows.", 2: "Each step rules out one number for good, which is why it's O(n). Restarting would throw that away." },
        },
        {
          q: "What does this print?\n\n~~~\nconst a = [3, 1, 2];\nconst b = a.sort();\nconsole.log(a === b);\n~~~",
          choices: ["`true`", "`false`"],
          answer: 0,
          explain: "`sort`, like `reverse`, changes the array in place and returns that same array.",
          why: { 1: "Returning something doesn't mean it's a copy. Use `toSorted()` or `[...a].sort()` for a copy." },
        },
        {
          q: "What's the cost of the two-pointer `dedupeSorted`?",
          choices: ["O(n) time, O(1) extra space", "O(n²) time, O(1) extra space", "O(n) time, O(n) extra space"],
          answer: 0,
          explain: "One pass with `read`, and only two number variables. Writing into the same array costs no extra memory.",
          why: { 1: "There's one loop and no hidden scan inside it.", 2: "It writes into `arr` itself; no second array is made." },
        },
      ],
    },
  ],
};
