// Challenges · lesson 2. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'two-sum',
  builds: ['challenges/group-and-count', 'js/loops', 'js/arrays', 'dsa/hash-maps-and-sets'],
  title: 'Two sum: "have I seen it?"',
  goal: 'Replace a loop inside a loop with one pass and a Set or Map, then solve the sorted version with two pointers.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The question',
      md: `
The most famous interview question there is:

> "Given an array of numbers and a target, return the **indexes** of the two numbers that add up to the target."

~~~
twoSum([2, 7, 11, 15], 9)  → [0, 1]      because 2 + 7 = 9
twoSum([3, 2, 4], 6)       → [1, 2]      because 2 + 4 = 6
~~~

It reuses the tally sheet from the last lesson, with one twist: instead of counting, you remember **what you've already seen** so you can look it up later.
`,
    },
    {
      type: 'check',
      title: 'Before you code: ask and spot',
      items: [
        {
          q: 'In `twoSum([4, 1], 8)`, can you use the 4 twice?',
          choices: ['No: the two numbers must be at different indexes', 'Yes: 4 + 4 = 8', 'Only if the array is sorted'],
          answer: 0,
          explain: 'The usual rule is "two different elements". It\'s still worth asking, because it decides whether `[4, 1]` with target 8 has an answer.',
          why: {
            1: 'That would count one element twice. The standard problem forbids it.',
            2: 'Sorting has nothing to do with reusing an element.',
          },
        },
        {
          q: 'Which clarifying question changes the best solution the most?',
          choices: ['"Is the array sorted?"', '"Are the numbers integers?"', '"Should I name it twoSum?"'],
          answer: 0,
          explain: 'A sorted array allows a two-pointer solution with no extra memory. That\'s Part 3 of this lesson.',
          why: {
            1: 'The algorithm is the same for decimals.',
            2: 'Naming is yours to choose.',
          },
        },
        {
          q: 'Which phrase is the strongest hint that a Set or Map will help?',
          choices: [
            '"find two that add up to", because for each number you can ask "have I seen its partner?"',
            '"return the indexes", because indexes need an array',
            '"numbers", because numbers need math',
          ],
          answer: 0,
          explain: 'Each number knows exactly which partner it needs: `target - n`. A lookup table answers "seen it?" instantly.',
          why: {
            1: 'You do return an array, but that is the output, not the trick.',
            2: 'Every problem has numbers. Look for the "have I seen it" shape.',
          },
        },
      ],
    },
    {
      type: 'read',
      title: 'The plan, and the slow way first',
      md: `
**Brute force:** try every pair. A loop inside a loop.

~~~js
function twoSumSlow(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {  // j starts after i: never the same element
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}

console.log(twoSumSlow([2, 7, 11, 15], 9));
~~~

That's **O(n²)**: 10,000 numbers means about 50 million pairs. Always say this version first, then improve it.

**The key insight:** when you're standing on a number \`n\`, you know exactly what partner you need: \`target - n\`. So you don't need to search for it. You only need to ask **"have I already seen it?"**

A **Set** is the tool for "have I seen it?":

~~~js
const seen = new Set();
seen.add(7);
seen.add(7);              // duplicates are ignored
console.log(seen.has(7), seen.has(2), seen.size);
~~~

\`has\` and \`add\` are instant (O(1)) no matter how big the Set gets.
`,
    },
    {
      type: 'task',
      title: 'Part 1: hasPairWithSum',
      md: `
Start with the yes/no version. Write \`hasPairWithSum(nums, target)\`: \`true\` if two **different** elements add up to \`target\`, otherwise \`false\`.

~~~
hasPairWithSum([1, 2, 4, 4], 8)  → true     (4 + 4, two different elements)
hasPairWithSum([1, 2, 3, 9], 8)  → false
hasPairWithSum([4], 8)           → false    (only one 4)
~~~

The plan: loop once. For each \`n\`, if \`seen.has(target - n)\`, return \`true\`. Otherwise \`seen.add(n)\`. **Check first, then add.**
`,
      starter: `function hasPairWithSum(nums, target) {
  // your code here
}
`,
      tests: [
        { name: '[1, 2, 4, 4] with target 8 is true', code: `eq(hasPairWithSum([1, 2, 4, 4], 8), true);` },
        { name: '[1, 2, 3, 9] with target 8 is false', code: `eq(hasPairWithSum([1, 2, 3, 9], 8), false);` },
        { name: 'one element cannot pair with itself', code: `eq(hasPairWithSum([4], 8), false, "check before you add, so n never finds itself");` },
        { name: 'an empty array is false', code: `eq(hasPairWithSum([], 0), false);` },
      ],
      hint: 'Make `const seen = new Set();`. In the loop: `if (seen.has(target - n)) return true;` then `seen.add(n);`. After the loop, `return false;`.',
      solution: `function hasPairWithSum(nums, target) {
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(target - n)) return true;  // its partner came earlier
    seen.add(n);                            // add AFTER checking
  }
  return false;
}
`,
    },
    {
      type: 'predict',
      title: 'Add first, then check?',
      md: 'Same code, but the two lines inside the loop are swapped.',
      code: `function hasPairBuggy(nums, target) {
  const seen = new Set();
  for (const n of nums) {
    seen.add(n);
    if (seen.has(target - n)) return true;
  }
  return false;
}

console.log(hasPairBuggy([4], 8));
console.log(hasPairBuggy([1, 5], 2));`,
      output: `true
true`,
      explain: `
Adding first means \`n\` is already in the Set when you look for its partner. When \`n\` is exactly half the target (4 for 8, 1 for 2), it finds **itself**.

Checking first means the Set only holds numbers from **earlier** positions, so a match is always a different element.
`,
    },
    {
      type: 'read',
      title: 'From Set to Map: remembering where',
      md: `
The real question wants **indexes**, not \`true\`. A Set can only say "yes, I've seen 2". To also say **where**, use a **Map**: a lookup table from a key to a value.

~~~js
const seen = new Map();   // number -> index where we saw it
seen.set(2, 0);
seen.set(7, 1);
console.log(seen.get(7), seen.has(11), seen.get(11));
~~~

| | Set | Map |
|---|---|---|
| stores | values | key → value pairs |
| add | \`set.add(x)\` | \`map.set(key, value)\` |
| ask | \`set.has(x)\` | \`map.has(key)\`, \`map.get(key)\` |
| missing | \`has\` gives \`false\` | \`get\` gives \`undefined\` |

You'll use Maps a lot from here on. Unlike a plain object, any value can be a key (numbers stay numbers), and there are no inherited keys like \`constructor\`.
`,
    },
    {
      type: 'task',
      title: 'Part 2: twoSum',
      md: `
Write \`twoSum(nums, target)\`. Return \`[i, j]\`, the indexes of the two numbers, earlier index first. Return \`[]\` if there's no pair.

~~~
twoSum([2, 7, 11, 15], 9)  → [0, 1]
twoSum([3, 2, 4], 6)       → [1, 2]
twoSum([1, 2], 10)         → []
~~~

It's Part 1 with a Map (number → index), and a \`for\` loop with \`i\` so you know each index.
`,
      starter: `function twoSum(nums, target) {
  // your code here
}
`,
      tests: [
        { name: 'twoSum([2, 7, 11, 15], 9) is [0, 1]', code: `eq(twoSum([2, 7, 11, 15], 9), [0, 1]);` },
        { name: 'twoSum([3, 2, 4], 6) is [1, 2]', code: `eq(twoSum([3, 2, 4], 6), [1, 2], "3 + 3 would reuse one element");` },
        { name: 'two equal numbers work: twoSum([3, 3], 6) is [0, 1]', code: `eq(twoSum([3, 3], 6), [0, 1]);` },
        { name: 'no pair gives []', code: `eq(twoSum([1, 2], 10), []);` },
      ],
      hint: '`const seen = new Map();` Loop `for (let i = 0; i < nums.length; i++)`. Compute `const need = target - nums[i];`. If `seen.has(need)`, return `[seen.get(need), i]`. Otherwise `seen.set(nums[i], i)`.',
      solution: `function twoSum(nums, target) {
  const seen = new Map(); // number -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}
`,
      explain: 'Why `seen.has(need)` and not `if (seen.get(need))`? Because the partner might be at index **0**, and 0 is falsy. `has` asks the right question.',
    },
    {
      type: 'read',
      title: 'Part 3: the array is sorted',
      md: `
> "Now the array is **sorted**, and I don't want you to use extra memory."

Sorted input unlocks **two pointers**: one at each end.

- Add the two numbers under the pointers.
- **Too small?** Move the left pointer right, to a bigger number.
- **Too big?** Move the right pointer left, to a smaller number.
- **Equal?** Done.

~~~
[1, 3, 4, 6, 9], target 10
 L           R     1 + 9 = 10   found: [0, 4]

[1, 3, 4, 6, 9], target 7
 L           R     1 + 9 = 10   too big   → R left
 L        R        1 + 6 = 7    found: [0, 3]
~~~

Each step throws away one number for good, so it's one pass: **O(n) time, O(1) memory** (just two numbers, no Map).
`,
    },
    {
      type: 'task',
      title: 'Part 3: twoSumSorted',
      md: `
Write \`twoSumSorted(nums, target)\` for a **sorted** array, using two pointers and no Set or Map. Return \`[left, right]\`, or \`[]\` if there's no pair.

~~~
twoSumSorted([1, 3, 4, 6, 9], 7)   → [0, 3]
twoSumSorted([1, 2, 3], 100)      → []
~~~

Start with \`let left = 0\` and \`let right = nums.length - 1\`. Loop \`while (left < right)\`.
`,
      starter: `function twoSumSorted(nums, target) {
  // your code here
}
`,
      tests: [
        { name: 'twoSumSorted([1, 3, 4, 6, 9], 7) is [0, 3]', code: `eq(twoSumSorted([1, 3, 4, 6, 9], 7), [0, 3]);` },
        { name: 'twoSumSorted([1, 3, 4, 6, 9], 13) is [2, 4]', code: `eq(twoSumSorted([1, 3, 4, 6, 9], 13), [2, 4]);` },
        { name: 'no pair gives []', code: `eq(twoSumSorted([1, 2, 3], 100), []);` },
        { name: 'one element is never paired with itself', code: `eq(twoSumSorted([5], 10), []);` },
      ],
      hint: 'Inside the loop: `const sum = nums[left] + nums[right];`. If equal, return. If `sum < target`, `left++`. Otherwise `right--`. After the loop, `return [];`.',
      solution: `function twoSumSorted(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {                 // < not <=: never the same element
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;            // need bigger: move left up
    else right--;                        // need smaller: move right down
  }
  return [];
}
`,
    },
    {
      type: 'read',
      title: 'Walkthrough: the Map solution',
      md: `
Trace \`twoSum([3, 2, 4], 6)\`:

| i | \`nums[i]\` | need | \`seen\` before | found? | \`seen\` after |
|---|---|---|---|---|---|
| 0 | 3 | 3 | \`{}\` | no | \`{3 → 0}\` |
| 1 | 2 | 4 | \`{3 → 0}\` | no | \`{3 → 0, 2 → 1}\` |
| 2 | 4 | 2 | \`{3 → 0, 2 → 1}\` | yes, at 1 | returns \`[1, 2]\` |

At i = 0, the 3 needs a 3, but the Set doesn't hold it yet, so it can't pair with itself.

**Big-O:**

| version | time | extra memory |
|---|---|---|
| nested loops | O(n²) | O(1) |
| Map, one pass | O(n) | O(n) |
| sorted, two pointers | O(n) | O(1) |
| unsorted, sort first then two pointers | O(n log n) | indexes get lost when you sort |

**Say it:** "The brute force tries every pair, O(n²). For each number I know the partner I need, so I keep a Map of what I've seen: one pass, O(n) time, O(n) space. If the input is sorted, two pointers do it in O(1) space."
`,
    },
    {
      type: 'check',
      title: 'Follow-up questions',
      items: [
        {
          q: '"Could you sort the unsorted array and use two pointers?" What\'s the catch?',
          choices: [
            'Sorting moves the numbers, so the original indexes are lost unless you sort pairs of [value, index]',
            'Two pointers only work on strings',
            'There is no catch, it\'s strictly better',
          ],
          answer: 0,
          explain: 'It works if you keep the original index with each value, but it costs O(n log n), which is slower than the Map.',
          why: {
            1: 'Two pointers work on any sorted list.',
            2: 'It\'s O(n log n) instead of O(n), and needs extra bookkeeping for indexes.',
          },
        },
        {
          q: 'Why `if (seen.has(need))` instead of `if (seen.get(need))`?',
          choices: [
            'The partner\'s index could be 0, which is falsy',
            '`get` is slower than `has`',
            '`get` throws for missing keys',
          ],
          answer: 0,
          explain: '`get` returns the index, and index 0 would look like "not found". `has` returns a true boolean.',
          why: {
            1: 'Both are O(1).',
            2: '`get` returns `undefined` for a missing key. It never throws.',
          },
        },
        {
          q: '"Return all pairs, not just one." What changes in the Map version?',
          choices: [
            'Don\'t return early: push each match into a results array and keep going',
            'Use two Maps',
            'It can\'t be done in one pass',
          ],
          answer: 0,
          explain: 'Same loop, collect instead of return. (Ask whether duplicates like two separate 3s should give one pair or two.)',
          why: {
            1: 'One Map is enough. The change is in what you do on a match.',
            2: 'One pass still works. You just don\'t stop at the first match.',
          },
        },
        {
          q: 'What is the space complexity of the Map solution?',
          choices: ['O(n)', 'O(1)', 'O(n²)'],
          answer: 0,
          explain: 'In the worst case, every number goes into the Map before a match is found.',
          why: {
            1: 'That\'s the two-pointer version.',
            2: 'The Map holds at most one entry per element.',
          },
        },
      ],
    },
  ],
};
