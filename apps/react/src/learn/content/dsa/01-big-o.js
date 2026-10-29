// DSA course · lesson 1. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'big-o',
  builds: ['js/loops', 'js/arrays'],
  title: 'Big-O: counting the work',
  goal: 'Count how much work a function does as its input grows, name it with Big-O, and say it out loud in an interview.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Same answer, different amount of work',
      md: `
In JavaScript lesson 6 you wrote loops that add things up. Here are two functions that both give the sum of \`1 + 2 + ... + n\`:

~~~js
function sumLoop(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) total += i;
  return total;
}

function sumFormula(n) {
  return (n * (n + 1)) / 2;
}

console.log(sumLoop(100), sumFormula(100));
~~~

Both print 5050. But \`sumLoop(1000000)\` goes around the loop a million times, and \`sumFormula(1000000)\` still does one multiply and one divide.

That is the whole question this track keeps asking: **when the input gets bigger, how much more work does the code do?** Big-O is the short name for the answer.

You don't measure it with a stopwatch. Timings change with the laptop, the browser, and what else is running. You count **steps**: roughly, how many times the innermost line runs.
`,
    },
    {
      type: 'predict',
      title: 'Count the steps',
      md: 'The `steps` counter goes up once per trip around the loop. What do the two lines print?',
      code: `function sumLoop(n) {
  let total = 0;
  let steps = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
    steps++;
  }
  return steps;
}

console.log(sumLoop(5));
console.log(sumLoop(10));`,
      output: `5
10`,
      explain: `
One trip per number, so \`n\` steps. Double \`n\` and the steps double.

Work that grows in a straight line with the input is called **O(n)**, said "O of n" or "linear".
`,
    },
    {
      type: 'read',
      title: 'O(n): drop the details, keep the shape',
      md: `
Big-O describes the **shape of the growth**, not the exact count. Two rules:

1. **Drop constants.** A loop that does 3 things per item is \`3n\` steps. Still O(n). Two separate loops one after the other is \`2n\`. Still O(n).
2. **Keep only the biggest term.** \`n + 10\` is O(n). When \`n\` is a million, the 10 doesn't matter.

| \`n\` | O(1) | O(n) |
|---|---|---|
| 10 | 1 | 10 |
| 1,000 | 1 | 1,000 |
| 1,000,000 | 1 | 1,000,000 |

**O(1)** ("constant") means the work doesn't grow at all. \`sumFormula\` is O(1). So are these, no matter how long the array is:

~~~js
const nums = [4, 8, 15, 16, 23, 42];
console.log(nums[3]);              // read by index: O(1)
console.log(nums.length);          // length is stored, not counted: O(1)
nums.push(99);                     // add to the end: O(1)
console.log(nums[nums.length - 1]);
~~~

The common wrong answer: "O(1) means fast" or "one line". It means **the same amount of work for any size**. A function with 50 lines and no loops is O(1). A single line like \`nums.includes(7)\` is O(n), because \`includes\` loops for you.
`,
    },
    {
      type: 'predict',
      title: 'A loop inside a loop',
      md: 'Every `i` pairs with every `j`. What gets printed?',
      code: `function countPairs(n) {
  let steps = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      steps++;
    }
  }
  return steps;
}

console.log(countPairs(3));
console.log(countPairs(6));`,
      output: `9
36`,
      explain: `
The inner loop runs \`n\` times for **each** of the \`n\` outer trips: \`n * n\` steps. That's **O(n²)**, "quadratic".

Notice: doubling \`n\` from 3 to 6 made the work **four times** bigger. At \`n = 100,000\` that's 10 billion steps, which is why interviewers push you away from nested loops.
`,
    },
    {
      type: 'read',
      title: 'Hidden loops',
      md: `
Nested loops are easy to spot. The tricky ones are **methods that loop for you**, used inside your own loop:

~~~js
function hasDuplicate(arr) {
  for (let i = 0; i < arr.length; i++) {
    // indexOf scans the array from the start: a loop you can't see
    if (arr.indexOf(arr[i]) !== i) return true;
  }
  return false;
}
console.log(hasDuplicate([3, 1, 4, 1]));
~~~

That looks like one loop, but it's O(n²). Methods worth knowing the cost of:

| Method | Cost | Why |
|---|---|---|
| \`arr[i]\`, \`arr.length\`, \`push\`, \`pop\` | O(1) | touch one spot at the end |
| \`includes\`, \`indexOf\`, \`find\` | O(n) | scan until found |
| \`map\`, \`filter\`, \`reduce\`, \`slice\`, \`[...arr]\` | O(n) | visit or copy every item |
| \`shift\`, \`unshift\` | O(n) | every other item moves over one index |
| \`sort\` | O(n log n) | see below |

When you read code, ask of each line: "is there a loop hiding in here?"
`,
    },
    {
      type: 'task',
      title: 'hasDuplicate, the brute-force way',
      md: `
Write the obvious version first. That's what you say first in an interview too.

\`hasDuplicate(arr)\` returns \`true\` if any value appears twice, otherwise \`false\`. Compare every pair with two loops. Start \`j\` at \`i + 1\` so you never compare an item with itself.

~~~
hasDuplicate([3, 1, 4, 1])  → true
hasDuplicate([1, 2, 3])     → false
~~~

You'll write an O(n) version in lesson 3 with a \`Set\`.
`,
      starter: `function hasDuplicate(arr) {
  // your code here
}
`,
      tests: [
        { name: 'hasDuplicate([3, 1, 4, 1]) is true', code: `eq(hasDuplicate([3, 1, 4, 1]), true);` },
        { name: 'hasDuplicate([1, 2, 3]) is false', code: `eq(hasDuplicate([1, 2, 3]), false);` },
        { name: 'an empty array gives false', code: `eq(hasDuplicate([]), false);` },
      ],
      hint: 'Outer loop `for (let i = 0; i < arr.length; i++)`, inner loop `for (let j = i + 1; j < arr.length; j++)`, and inside: `if (arr[i] === arr[j]) return true;`. Return `false` after both loops.',
      solution: `function hasDuplicate(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}
`,
      explain: 'Starting `j` at `i + 1` halves the work, but `n²/2` is still O(n²): constants get dropped. Space is O(1): you made no new arrays.',
    },
    {
      type: 'read',
      title: 'O(log n): halving',
      md: `
Some code doesn't walk through the input; it **throws half of it away** each step. Guessing a number from 1 to 100 with "higher / lower" takes at most 7 guesses, because 100 → 50 → 25 → 13 → 7 → 4 → 2 → 1.

~~~js
function halvings(n) {
  let steps = 0;
  while (n > 1) {
    n = Math.floor(n / 2);
    steps++;
  }
  return steps;
}
console.log(halvings(100));
~~~

"How many times can I halve \`n\` before I reach 1?" is the definition of **log₂ n**. So this is **O(log n)**, "logarithmic". It barely grows: a thousand items take about 10 steps, a million about 20.

You'll meet it in binary search and balanced trees later in the track. The tell: **the problem size is cut in half (or by any fixed fraction) every step.**
`,
    },
    {
      type: 'predict',
      title: 'How slowly log n grows',
      code: `function halvings(n) {
  let steps = 0;
  while (n > 1) {
    n = Math.floor(n / 2);
    steps++;
  }
  return steps;
}

console.log(halvings(8));
console.log(halvings(1024));
console.log(halvings(1000000));`,
      output: `3
10
19`,
      explain: `
- 8 → 4 → 2 → 1: three halvings.
- 1024 is 2¹⁰, so ten.
- A million is between 2¹⁹ and 2²⁰, so about twenty.

The input grew a thousand-fold from 1024 to a million; the work went from 10 to 19.
`,
    },
    {
      type: 'read',
      title: 'O(n log n) and the full ladder',
      md: `
**O(n log n)** is "do a log n amount of work for each of the n items". Good general-purpose sorting (including JavaScript's \`sort\`) is O(n log n). In practice: if your answer starts with \`arr.sort(...)\`, it's at least O(n log n).

Here's the ladder you'll use for the rest of the track, from best to worst, with roughly how many steps each takes:

| Name | n = 10 | n = 1,000 | n = 1,000,000 |
|---|---|---|---|
| O(1) | 1 | 1 | 1 |
| O(log n) | 3 | 10 | 20 |
| O(n) | 10 | 1,000 | 1,000,000 |
| O(n log n) | 33 | 10,000 | 20,000,000 |
| O(n²) | 100 | 1,000,000 | 1,000,000,000,000 |

A computer does very roughly 10⁸ simple steps a second. So at a million items, O(n log n) is instant and O(n²) takes hours. That gap is why "can you do better than O(n²)?" is the most common interview follow-up.

When a function has several parts, **add them and keep the biggest**: a sort (n log n) then one loop (n) is O(n log n).
`,
    },
    {
      type: 'read',
      title: 'Space: the memory side',
      md: `
Big-O also measures **extra memory** the function creates, called **space complexity**. The input itself doesn't count; only what you add.

~~~js
// O(1) extra space: a couple of number variables, whatever the size
function total(arr) {
  let sum = 0;
  for (const x of arr) sum += x;
  return sum;
}

// O(n) extra space: a new array as long as the input
function doubled(arr) {
  return arr.map((x) => x * 2);
}

console.log(total([1, 2, 3]), doubled([1, 2, 3]));
~~~

Time and space often trade against each other. In lesson 3 you'll make \`hasDuplicate\` O(n) time by spending O(n) space on a \`Set\` that remembers what you've seen. That's usually a good deal, and saying the trade out loud ("O(n) time, O(n) extra space") is what interviewers listen for.
`,
    },
    {
      type: 'task',
      title: 'sumTo: from O(n) to O(1)',
      md: `
Brute force first, then better. The loop version is already written below as \`sumToLoop\`.

**Your turn:** write \`sumTo(n)\` with **no loop**, using the formula \`n * (n + 1) / 2\`.

~~~
sumTo(4)    → 10   (1 + 2 + 3 + 4)
sumTo(100)  → 5050
~~~
`,
      starter: `// O(n) time: one trip per number
function sumToLoop(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) total += i;
  return total;
}

// O(1) time: write it with the formula, no loop
function sumTo(n) {
  // your code here
}
`,
      tests: [
        { name: 'sumTo(4) is 10', code: `eq(sumTo(4), 10);` },
        { name: 'sumTo(100) is 5050', code: `eq(sumTo(100), 5050);` },
        { name: 'sumTo(0) is 0', code: `eq(sumTo(0), 0);` },
        { name: 'it matches the loop version for 1 to 50', code: `for (let n = 1; n <= 50; n++) eq(sumTo(n), sumToLoop(n), "n = " + n);` },
      ],
      hint: '`return (n * (n + 1)) / 2;` The parentheses make the order obvious to a reader.',
      solution: `// O(n) time: one trip per number
function sumToLoop(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) total += i;
  return total;
}

// O(1) time: write it with the formula, no loop
function sumTo(n) {
  return (n * (n + 1)) / 2;
}
`,
      explain: 'Same answer, but the work no longer depends on `n`. Most interview problems aren\'t solved by a formula, but the move is the same: find the repeated work and stop doing it.',
    },
    {
      type: 'read',
      title: 'How to say it in an interview',
      md: `
Interviewers want to hear Big-O **without being asked**. A calm script:

1. **Brute force first, with its cost.** "The simple way is to compare every pair. That's O(n²) time, O(1) space."
2. **Name the repeated work.** "For every item I'm scanning the whole array again to check if I've seen it."
3. **Offer the trade.** "If I remember what I've seen in a Set, each check is O(1), so the whole thing is O(n) time, but O(n) extra space."
4. **Say what n is** when it isn't obvious: "n is the number of users, m is the length of the longest name."

How to work out the Big-O of code you wrote:

- One loop over the input → O(n).
- A loop inside a loop over the same input → O(n²). Check for **hidden** loops (\`includes\`, \`indexOf\`, \`slice\`, \`shift\`).
- The input is halved each step → O(log n).
- A sort anywhere → at least O(n log n).
- Separate steps add up; keep the biggest.

**How to spot a Big-O question:** it rarely says "Big-O". It sounds like "can you do better?", "what if the list had a million items?", or "what's the cost of that?". All three are asking you to count steps.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What is the time complexity?\n\n~~~\nfunction f(arr) {\n  for (const x of arr) console.log(x);\n  for (const x of arr) console.log(x * 2);\n}\n~~~",
          choices: ["O(n)", "O(n²)", "O(2n), which is different from O(n)"],
          answer: 0,
          explain: "Two loops one **after** the other is `2n` steps. Drop the constant: O(n).",
          why: { 1: "O(n²) needs one loop **inside** the other. These run one after the other.", 2: "Big-O drops constants, so O(2n) is written O(n)." },
        },
        {
          q: "What is the time complexity?\n\n~~~\nfunction f(arr, targets) {\n  return targets.filter((t) => arr.includes(t));\n}\n~~~\n\n(Assume both arrays have about n items.)",
          choices: ["O(n)", "O(n²)", "O(1)"],
          answer: 1,
          explain: "`filter` visits every target, and `includes` scans `arr` for each one: a hidden nested loop.",
          why: { 0: "`includes` is a loop too, and it runs once per target.", 2: "Both `filter` and `includes` walk through arrays." },
        },
        {
          q: "What does O(1) mean?",
          choices: ["The same amount of work for any input size", "The function is one line long", "The function runs in under one millisecond"],
          answer: 0,
          explain: "Constant time: the work doesn't grow with the input.",
          why: { 1: "`arr.includes(x)` is one line and O(n).", 2: "Big-O is about growth, not wall-clock time." },
        },
        {
          q: "A loop that halves `n` until it reaches 1 is...",
          choices: ["O(log n)", "O(n / 2), so O(n)", "O(n²)"],
          answer: 0,
          explain: "The number of halvings from n down to 1 is log₂ n.",
          why: { 1: "Halving **once** leaves n/2 items, but here you halve again and again, so you only need about log₂ n steps.", 2: "There's no nested loop, and the work shrinks every step." },
        },
        {
          q: "You sort the array, then loop over it once. What's the total?",
          choices: ["O(n log n)", "O(n)", "O(n² log n)"],
          answer: 0,
          explain: "Add the parts: n log n + n. Keep the biggest: O(n log n).",
          why: { 1: "The sort alone is already O(n log n).", 2: "The steps happen one after another, so you add them, not multiply." },
        },
      ],
    },
  ],
};
