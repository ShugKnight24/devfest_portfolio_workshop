// DSA course · lesson 4. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'sliding-window',
  builds: ['dsa/arrays-two-pointers', 'dsa/hash-maps-and-sets'],
  title: 'Sliding window',
  goal: 'Answer "best run of consecutive items" questions in one pass by sliding a window instead of recomputing every range.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The problem: consecutive runs',
      md: `
This lesson reuses two things: the **two index variables** from lesson 2, and the **Set** from lesson 3.

A window is a run of **consecutive** items, from index \`left\` to index \`right\`. Many questions ask for the best window: "the biggest sum of 3 days in a row", "the longest stretch with no repeated letter".

**Brute force for "max sum of k in a row":** try every starting point, add up \`k\` items each time.

~~~js
function maxSumBrute(nums, k) {
  let best = -Infinity;
  for (let start = 0; start + k <= nums.length; start++) {
    let sum = 0;
    for (let i = start; i < start + k; i++) sum += nums[i];
    best = Math.max(best, sum);
  }
  return best;
}
console.log(maxSumBrute([2, 1, 5, 1, 3, 2], 3));
~~~

That's a loop inside a loop: O(n·k). When \`k\` is close to \`n\`, it's O(n²).
`,
    },
    {
      type: 'predict',
      title: 'Spot the repeated work',
      md: 'This prints each window and its sum. Look at which numbers get added more than once.',
      code: `const nums = [2, 1, 5, 1, 3, 2];
const k = 3;
for (let start = 0; start + k <= nums.length; start++) {
  const window = nums.slice(start, start + k);
  const sum = window.reduce((a, b) => a + b, 0);
  console.log(window, sum);
}`,
      output: `[ 2, 1, 5 ] 8
[ 1, 5, 1 ] 7
[ 5, 1, 3 ] 9
[ 1, 3, 2 ] 6`,
      explain: `
Going from \`[2, 1, 5]\` to \`[1, 5, 1]\`, the \`1\` and \`5\` stayed. Only the \`2\` left and a \`1\` arrived. The brute force adds \`1 + 5\` again anyway.

The fix: **keep the sum, subtract what leaves, add what arrives.** \`8 - 2 + 1 = 7\`. Two operations per slide, no matter how big \`k\` is.
`,
    },
    {
      type: 'read',
      title: 'The fixed-size window',
      md: `
~~~js
function maxSumK(nums, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i]; // 1. the first window
  let best = sum;

  for (let right = k; right < nums.length; right++) {
    sum += nums[right];      // 2. a new item enters on the right
    sum -= nums[right - k];  // 3. the oldest item leaves on the left
    best = Math.max(best, sum);
  }
  return best;
}
console.log(maxSumK([2, 1, 5, 1, 3, 2], 3));
~~~

| \`right\` | enters | leaves (\`right - k\`) | \`sum\` | \`best\` |
|---|---|---|---|---|
| first window | | | 8 | 8 |
| 3 | 1 | 2 | 7 | 8 |
| 4 | 3 | 1 | 9 | 9 |
| 5 | 2 | 5 | 6 | 9 |

Every item enters once and leaves once: **O(n) time, O(1) space.**

The off-by-one to watch: the item leaving is at \`right - k\`, not \`right - k + 1\`. Check with the table: when \`right\` is 3 and \`k\` is 3, index 0 (the \`2\`) leaves.
`,
    },
    {
      type: 'task',
      title: 'windowSums',
      md: `
Warm-up: instead of the best sum, return **every** window's sum, in order.

~~~
windowSums([2, 1, 5, 1, 3, 2], 3)  → [8, 7, 9, 6]
windowSums([1, 2, 3], 1)           → [1, 2, 3]
~~~

Use the sliding version: build the first sum, push it, then slide and push after each slide. Assume \`k <= nums.length\`.
`,
      starter: `function windowSums(nums, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  const sums = [sum];

  // slide here: add nums[right], subtract nums[right - k], push sum

  return sums;
}
`,
      tests: [
        { name: 'windowSums([2, 1, 5, 1, 3, 2], 3) is [8, 7, 9, 6]', code: `eq(windowSums([2, 1, 5, 1, 3, 2], 3), [8, 7, 9, 6]);` },
        { name: 'a window of 1 gives each item', code: `eq(windowSums([1, 2, 3], 1), [1, 2, 3]);` },
        { name: 'a window as long as the array gives one sum', code: `eq(windowSums([4, 5], 2), [9]);` },
      ],
      hint: '`for (let right = k; right < nums.length; right++) { sum += nums[right]; sum -= nums[right - k]; sums.push(sum); }`',
      solution: `function windowSums(nums, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  const sums = [sum];

  for (let right = k; right < nums.length; right++) {
    sum += nums[right];
    sum -= nums[right - k];
    sums.push(sum);
  }

  return sums;
}
`,
    },
    {
      type: 'task',
      title: 'maxAverage',
      md: `
\`maxAverage(nums, k)\` returns the biggest **average** of any \`k\` consecutive numbers.

~~~
maxAverage([1, 12, -5, -6, 50, 3], 4)  → 12.75   ((12 - 5 - 6 + 50) / 4)
~~~

The biggest average comes from the biggest sum, so find the max sum with a sliding window (like \`maxSumK\`) and divide once at the end.
`,
      starter: `function maxAverage(nums, k) {
  // your code here
}
`,
      tests: [
        { name: 'maxAverage([1, 12, -5, -6, 50, 3], 4) is 12.75', code: `eq(maxAverage([1, 12, -5, -6, 50, 3], 4), 12.75);` },
        { name: 'works when every number is negative', code: `eq(maxAverage([-3, -1, -2], 2), -1.5);` },
        { name: 'a window of 1 gives the biggest number', code: `eq(maxAverage([3, 9, 4], 1), 9);` },
      ],
      hint: 'Start `best` at the first window\'s sum, not at `0`: with all-negative numbers, 0 would be wrong. Return `best / k`.',
      solution: `function maxAverage(nums, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let best = sum;
  for (let right = k; right < nums.length; right++) {
    sum += nums[right] - nums[right - k];
    best = Math.max(best, sum);
  }
  return best / k;
}
`,
    },
    {
      type: 'read',
      title: 'The variable-size window',
      md: `
Sometimes the window size isn't given. **"Longest substring without repeating characters"**: in \`"abcabcbb"\` the answer is 3 (\`"abc"\`).

**Brute force:** check every substring for repeats. There are about n² substrings and checking each is up to n more: O(n³), or O(n²) if you're careful.

**Window version:** keep a window that is **always valid** (no repeats), and a Set of the letters inside it.

1. Move \`right\` forward one letter at a time (the window **grows**).
2. If the new letter is already in the Set, the window is invalid: move \`left\` forward, removing letters from the Set, until it's valid again (the window **shrinks**).
3. Add the new letter, and record the window size \`right - left + 1\`.

~~~js
function longestUnique(s) {
  const inWindow = new Set();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    while (inWindow.has(s[right])) {  // shrink until s[right] is gone
      inWindow.delete(s[left]);
      left++;
    }
    inWindow.add(s[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
console.log(longestUnique("abcabcbb"));
~~~

There's a \`while\` inside a \`for\`, but it's still **O(n)**: \`left\` only ever moves forward, so across the whole run it moves at most \`n\` times in total. Each letter is added once and removed at most once.
`,
    },
    {
      type: 'predict',
      title: 'Watch it grow and shrink',
      md: 'This prints the window after each step. Predict the lines for `"abca"`.',
      code: `const s = "abca";
const inWindow = new Set();
let left = 0;
for (let right = 0; right < s.length; right++) {
  while (inWindow.has(s[right])) {
    inWindow.delete(s[left]);
    left++;
  }
  inWindow.add(s[right]);
  console.log(s.slice(left, right + 1));
}`,
      output: `a
ab
abc
bca`,
      explain: `
The first three steps only grow. At the second \`"a"\`, the Set already has \`"a"\`, so \`left\` moves past the first \`"a"\`, and the window becomes \`"bca"\`. The size stayed 3.

The common wrong guess is \`"a"\` on the last line, as if the window restarts from scratch. It doesn't: it only drops letters from the left until the repeat is gone.
`,
    },
    {
      type: 'task',
      title: 'longestUnique',
      md: `
Write \`longestUnique(s)\`: the length of the longest substring with no repeated characters.

~~~
longestUnique("abcabcbb")  → 3   ("abc")
longestUnique("bbbb")      → 1
longestUnique("pwwkew")    → 3   ("wke")
~~~

Try to write it from the three rules (grow, shrink while invalid, record) before looking back.
`,
      starter: `function longestUnique(s) {
  const inWindow = new Set();
  let left = 0;
  let best = 0;
  // your loop here

  return best;
}
`,
      tests: [
        { name: 'longestUnique("abcabcbb") is 3', code: `eq(longestUnique("abcabcbb"), 3);` },
        { name: 'longestUnique("bbbb") is 1', code: `eq(longestUnique("bbbb"), 1);` },
        { name: 'longestUnique("pwwkew") is 3', code: `eq(longestUnique("pwwkew"), 3);` },
        { name: 'an empty string gives 0', code: `eq(longestUnique(""), 0);` },
      ],
      hint: '`for (let right = 0; ...)`, then `while (inWindow.has(s[right])) { inWindow.delete(s[left]); left++; }`, then add `s[right]` and update `best` with `right - left + 1`.',
      solution: `function longestUnique(s) {
  const inWindow = new Set();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    while (inWindow.has(s[right])) {
      inWindow.delete(s[left]);
      left++;
    }
    inWindow.add(s[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
`,
      explain: 'O(n) time. Space is O(k), where k is the number of different characters that can appear (at most the alphabet size).',
    },
    {
      type: 'task',
      title: 'shortestWithSum',
      md: `
The same grow/shrink shape, flipped: here you shrink **while the window is valid**, to make it as short as possible.

\`shortestWithSum(nums, target)\`: all numbers are positive. Return the length of the **shortest** run of consecutive numbers whose sum is **at least** \`target\`, or \`0\` if there is none.

~~~
shortestWithSum([2, 3, 1, 2, 4, 3], 7)  → 2   ([4, 3])
shortestWithSum([1, 1, 1], 10)          → 0
~~~

The template is in the starter. Fill in the two lines inside the \`while\`, then delete the \`break\` line. (The \`break\` is there so the unfinished starter can't loop forever: a \`while\` whose condition never changes freezes the page.)
`,
      starter: `function shortestWithSum(nums, target) {
  let left = 0;
  let sum = 0;
  let best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];             // grow
    while (sum >= target) {         // valid: record it, then try a shorter one
      best = Math.min(best, right - left + 1);
      // shrink: take nums[left] out of sum, and move left

      break; // delete this line once the two lines above are written
    }
  }
  return best === Infinity ? 0 : best;
}
`,
      tests: [
        { name: 'shortestWithSum([2, 3, 1, 2, 4, 3], 7) is 2', code: `eq(shortestWithSum([2, 3, 1, 2, 4, 3], 7), 2);` },
        { name: 'one big number is enough on its own', code: `eq(shortestWithSum([1, 4, 4], 4), 1);` },
        { name: 'no window big enough gives 0', code: `eq(shortestWithSum([1, 1, 1], 10), 0);` },
      ],
      hint: '`sum -= nums[left];` then `left++;`. Then delete the `break;` line. Without the shrink lines, `sum` never changes inside the `while`, so it would never end.',
      solution: `function shortestWithSum(nums, target) {
  let left = 0;
  let sum = 0;
  let best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];             // grow
    while (sum >= target) {         // valid: record it, then try a shorter one
      best = Math.min(best, right - left + 1);
      sum -= nums[left];
      left++;
    }
  }
  return best === Infinity ? 0 : best;
}
`,
      explain: 'This only works because all numbers are positive: adding always grows the sum and removing always shrinks it. With negative numbers, the window trick breaks and you need prefix sums instead.',
    },
    {
      type: 'read',
      title: 'How to spot a sliding window in an interview question',
      md: `
The signal words: **"consecutive"**, "contiguous", "subarray", "substring", "in a row", "window of size k", "longest / shortest stretch".

Two templates:

| | Fixed size \`k\` | Variable size |
|---|---|---|
| when | the question gives the length | "longest" or "shortest" with a rule |
| move | add \`nums[right]\`, remove \`nums[right - k]\` | grow \`right\` every step; move \`left\` in a \`while\` |
| track | a running sum or count | a sum, a Set, or a Map of counts |

Check these before you commit to it:

- The items must be **consecutive**. "Any two numbers" or "a subset" is not a window problem; that's hash maps or something else.
- For sum-based variable windows, numbers should be **non-negative**.

How to say it: "The brute force recomputes every window: O(n·k). Since neighboring windows overlap, I'll slide: add the new item, remove the old one. Each item enters and leaves once, so it's O(n) time."
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "In a fixed window of size `k`, `right` has just moved to a new index. Which index leaves the window?",
          choices: ["`right - k`", "`right - k + 1`", "`left + k`"],
          answer: 0,
          explain: "The window is now `right - k + 1` to `right`, so the one just before it, `right - k`, is the one that left.",
          why: { 1: "That's the new first item, which is still inside.", 2: "In the fixed version you don't keep `left`; and `left + k` would be past the window." },
        },
        {
          q: "`longestUnique` has a `while` inside a `for`. Why isn't it O(n²)?",
          choices: ["`left` only moves forward, so the `while` runs at most n times in total", "Sets make loops free", "The `while` runs at most once per step"],
          answer: 0,
          explain: "Count the total work across the whole run: `right` moves n times, `left` moves at most n times. 2n is O(n).",
          why: { 1: "Set lookups are O(1), but loops still cost one step per trip.", 2: "It can run several times in one step, e.g. `\"abcc\"`. It's the total that's bounded." },
        },
        {
          q: "Which question is **not** a sliding window problem?",
          choices: ["Find any two numbers in the array that add up to 10", "Max sum of 5 consecutive days", "Longest substring with at most 2 different letters"],
          answer: 0,
          explain: "\"Any two numbers\" don't have to be next to each other. That's two-sum (lesson 3).",
          why: { 1: "\"Consecutive\" with a fixed size is the fixed window.", 2: "\"Longest substring\" with a rule is the variable window, with a Map of counts." },
        },
        {
          q: "In `maxAverage`, why start `best` at the first window's sum instead of `0`?",
          choices: ["If every number is negative, no window reaches 0, and you'd wrongly return 0", "Because 0 is falsy", "It doesn't matter"],
          answer: 0,
          explain: "Start from a real answer (or `-Infinity`), never from a guess that might beat every real answer.",
          why: { 1: "The problem is the value, not truthiness: `Math.max` treats 0 as a normal number.", 2: "Try `[-3, -1, -2]` with `k = 2`: starting at 0 gives 0, but the answer is -1.5." },
        },
      ],
    },
  ],
};
