// JS course · lesson 6. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'loops',
  builds: ['js/arrays'],
  title: 'Loops',
  goal: 'Repeat work with for and for...of, carry a running total, keep the best so far, and build new arrays and strings.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The counting loop',
      md: `
A loop runs the same code again and again. The classic \`for\` loop counts:

~~~js
for (let i = 1; i <= 3; i++) {
  console.log("lap", i);
}
~~~

The line in the brackets has **three parts**, separated by semicolons:

~~~
for (let i = 1;   i <= 3;   i++) { ... }
//   └─ start     └─ keep    └─ after each lap
//                   going
//                   while
~~~

1. **Start:** make a counter, \`let i = 1\`. It's \`let\`, not \`const\`, because it changes.
2. **Keep going while** \`i <= 3\` is true. The moment it's false, the loop stops.
3. **After each lap**, run \`i++\` (add 1 to \`i\`).

Press **▶ Run**, then **Edit** and make it count to 5.
`,
    },
    {
      type: 'predict',
      title: 'Where does it start and stop?',
      md: 'This one starts at 0 and uses `<`, not `<=`.',
      code: `for (let i = 0; i < 3; i++) {
  console.log(i);
}`,
      output: `0
1
2`,
      explain: `
| lap | \`i\` | \`i < 3\`? | prints |
|---|---|---|---|
| 1 | 0 | yes | 0 |
| 2 | 1 | yes | 1 |
| 3 | 2 | yes | 2 |
| | 3 | **no**, stop | |

\`i\` does reach 3, but the check fails, so the body never runs with 3. "Start at 0, keep going while \`i < length\`" is exactly how you walk through array indexes (lesson 5).
`,
    },
    {
      type: 'read',
      title: 'for...of: loop over the items themselves',
      md: `
Most of the time you don't care about the counter. You want each **item**. \`for...of\` hands you the items one by one:

~~~js
const words = ["hi", "hey", "hello"];

for (const word of words) {
  console.log(word);
}
~~~

Compare it to the counting version, which does the same thing with more moving parts:

~~~
for (let i = 0; i < words.length; i++) {
  console.log(words[i]);
}
~~~

**Use \`for...of\` when you want the items. Use a counting \`for\` when you need the number itself**, like "add up 1 to n" or "count down from 10".

\`const word\` is fine in \`for...of\`: each lap gets a fresh \`word\`, and you never change it.
`,
    },
    {
      type: 'predict',
      title: 'for...of in action',
      code: `const words = ["hi", "yo"];
for (const w of words) {
  console.log(w.toUpperCase() + "!");
}`,
      output: `HI!
YO!`,
      explain: 'The body runs once per item. On the first lap `w` is `"hi"`, on the second `"yo"`.',
    },
    {
      type: 'read',
      title: 'The accumulator: a running total',
      md: `
Here is the most important loop pattern there is. Make a variable **before** the loop, update it **inside** the loop, and use it **after** the loop.

~~~js
const nums = [3, 4, 5];

let total = 0;                // 1. start the running total
for (const n of nums) {
  total = total + n;          // 2. add each item to it
}
console.log(total);           // 3. use the result after the loop
~~~

Trace it, one row per lap:

| lap | \`n\` | \`total + n\` | \`total\` after |
|---|---|---|---|
| start | | | 0 |
| 1 | 3 | 0 + 3 | 3 |
| 2 | 4 | 3 + 4 | 7 |
| 3 | 5 | 7 + 5 | 12 |

Two rules:
- The total is \`let\`, because it changes.
- It's declared **outside** the loop. If you wrote \`let total = 0\` inside, it would reset to 0 on every lap.

You'll see this "running something" idea again as \`reduce\` in lesson 11.
`,
    },
    {
      type: 'task',
      title: 'sum',
      md: `
**Example** (already solved): the accumulator with \`for...of\`.

~~~
function sumOfSquares(nums) {
  let total = 0;
  for (const n of nums) {
    total = total + n * n;
  }
  return total;
}
~~~

**Your turn:** \`sum([1, 2, 3])\` returns \`6\`. \`sum([])\` returns \`0\`. Use a loop.
`,
      starter: `function sum(nums) {
  // your code here
}
`,
      tests: [
        { name: 'sum([1, 2, 3]) is 6', code: `eq(sum([1, 2, 3]), 6);` },
        { name: 'sum([]) is 0', code: `eq(sum([]), 0);` },
      ],
      hint: 'Same as `sumOfSquares`, but add `n` instead of `n * n`. Remember `return total;` after the loop.',
      solution: `function sum(nums) {
  let total = 0; // outside the loop, or it resets every lap
  for (const n of nums) {
    total = total + n;
  }
  return total;
}
`,
    },
    {
      type: 'task',
      title: 'sumTo',
      md: `
**Example:** a counting loop that multiplies 1 × 2 × ... × n.

~~~
function factorial(n) {
  let result = 1;
  for (let i = 1; i <= n; i++) {
    result = result * i;
  }
  return result;
}
~~~

**Your turn:** \`sumTo(4)\` returns \`10\`, because 1 + 2 + 3 + 4. There's no array here: you need the numbers themselves, so use a counting \`for\`.
`,
      starter: `function sumTo(n) {
  // your code here
}
`,
      tests: [
        { name: 'sumTo(4) is 10', code: `eq(sumTo(4), 10);` },
        { name: 'sumTo(1) is 1', code: `eq(sumTo(1), 1);` },
        { name: 'sumTo(100) is 5050', code: `eq(sumTo(100), 5050);` },
      ],
      hint: 'Same shape as `factorial`, but start the total at `0` and use `+` instead of `*`. Keep `i <= n` so `n` itself is included.',
      solution: `function sumTo(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) { // <= so n itself is included
    total = total + i;
  }
  return total;
}
`,
    },
    {
      type: 'predict',
      title: 'Off by one',
      md: 'Someone tried to add up 1 + 2 + 3 + 4. Look at the condition.',
      code: `let total = 0;
for (let i = 1; i < 4; i++) {
  total = total + i;
}
console.log(total);`,
      output: `6`,
      explain: `
\`i < 4\` stops **before** 4, so this adds 1 + 2 + 3 = 6, not 10.

| you want | write |
|---|---|
| 1 up to and **including** n | \`let i = 1; i <= n\` |
| array indexes 0 up to length - 1 | \`let i = 0; i < arr.length\` |

Being one lap short (or one lap over) is called an **off-by-one** error. When a total is close but wrong, check \`<\` vs \`<=\` first.
`,
    },
    {
      type: 'task',
      title: 'countEvens',
      md: `
A **counter** is an accumulator that adds 1 instead of adding the item. Combine it with an \`if\` (lesson 3).

\`countEvens([1, 2, 3, 4])\` returns \`2\`. Add 1 to a counter only when the number is even (\`n % 2 === 0\`).
`,
      starter: `function countEvens(nums) {
  // your code here
}
`,
      tests: [
        { name: 'countEvens([1, 2, 3, 4]) is 2', code: `eq(countEvens([1, 2, 3, 4]), 2);` },
        { name: 'countEvens([1, 3]) is 0', code: `eq(countEvens([1, 3]), 0);` },
      ],
      hint: '`let count = 0;` before the loop. Inside the loop: `if (n % 2 === 0) { count = count + 1; }`. Return `count` after the loop.',
      solution: `function countEvens(nums) {
  let count = 0;
  for (const n of nums) {
    if (n % 2 === 0) {
      count = count + 1; // only some laps add to the counter
    }
  }
  return count;
}
`,
    },
    {
      type: 'task',
      title: 'doubleAll',
      md: `
The accumulator doesn't have to be a number. It can be an **array** you fill up with \`push\`.

**Example:**

~~~
function halveAll(nums) {
  const out = [];
  for (const n of nums) {
    out.push(n / 2);
  }
  return out;
}
~~~

\`out\` is \`const\` because the name never points at a different array. \`push\` changes what's inside, which \`const\` allows.

**Your turn:** \`doubleAll([1, 2, 3])\` returns \`[2, 4, 6]\`.
`,
      starter: `function doubleAll(nums) {
  // your code here
}
`,
      tests: [
        { name: 'doubleAll([1, 2, 3]) is [2, 4, 6]', code: `eq(doubleAll([1, 2, 3]), [2, 4, 6]);` },
        { name: 'doubleAll([]) is []', code: `eq(doubleAll([]), []);` },
      ],
      hint: 'Same as `halveAll`, with `n * 2`.',
      solution: `function doubleAll(nums) {
  const out = [];
  for (const n of nums) {
    out.push(n * 2);
  }
  return out;
}
`,
      explain: 'Remember this shape. In lesson 9 you\'ll learn that `map` is exactly this loop, packaged up.',
    },
    {
      type: 'read',
      title: 'Keep the best so far',
      md: `
To find the biggest (or longest, or oldest) item, walk through the list and **remember the best one you've seen so far**. Start with the first item as the best.

~~~js
const nums = [4, 9, 2, 7];

let best = nums[0];
for (const n of nums) {
  if (n > best) {
    best = n;
  }
}
console.log(best);
~~~

| \`n\` | \`n > best\`? | \`best\` after |
|---|---|---|
| (start) | | 4 |
| 4 | no | 4 |
| 9 | **yes** | 9 |
| 2 | no | 9 |
| 7 | no | 9 |

Why start with \`nums[0]\` and not \`0\`? If every number were negative, \`0\` would "win" even though it isn't in the list.
`,
    },
    {
      type: 'task',
      title: 'longestWord',
      md: `
**Example:**

~~~
function biggest(nums) {
  let best = nums[0];
  for (const n of nums) {
    if (n > best) {
      best = n;
    }
  }
  return best;
}
~~~

**Your turn:** \`longestWord(["hi", "hello", "hey"])\` returns \`"hello"\`. This time you compare **lengths**, but you keep the **word**.
`,
      starter: `function longestWord(words) {
  // your code here
}
`,
      tests: [
        { name: 'longestWord(["hi", "hello", "hey"]) is "hello"', code: `eq(longestWord(["hi", "hello", "hey"]), "hello");` },
        { name: 'works when the longest is first', code: `eq(longestWord(["banana", "fig"]), "banana");` },
      ],
      hint: 'Same as `biggest`, but the check is `if (word.length > best.length)`. Start with `let best = words[0];`.',
      solution: `function longestWord(words) {
  let best = words[0];
  for (const word of words) {
    if (word.length > best.length) { // compare lengths, keep the word
      best = word;
    }
  }
  return best;
}
`,
    },
    {
      type: 'predict',
      title: 'Building a string in a loop',
      md: 'A string can be the accumulator too. `+` joins strings.',
      code: `let s = "";
for (let i = 0; i < 3; i++) {
  s = s + "x-";
}
console.log(s);
console.log(s.length);`,
      output: `x-x-x-
6`,
      explain: 'Start with an empty string `""` (the "zero" for strings), then add to it on every lap. Three laps of `"x-"` gives six characters.',
    },
    {
      type: 'task',
      title: 'repeat',
      md: `\`repeat("ab", 3)\` returns \`"ababab"\`. \`repeat("x", 0)\` returns \`""\`. Start with \`""\` and add \`s\` to it in a counting loop that runs \`times\` laps.`,
      starter: `function repeat(s, times) {
  // your code here
}
`,
      tests: [
        { name: 'repeat("ab", 3) is "ababab"', code: `eq(repeat("ab", 3), "ababab");` },
        { name: 'repeat("x", 0) is ""', code: `eq(repeat("x", 0), "");` },
      ],
      hint: '`let out = "";` then `for (let i = 0; i < times; i++) { out = out + s; }` and `return out;`.',
      solution: `function repeat(s, times) {
  let out = ""; // "" is the starting point for building strings
  for (let i = 0; i < times; i++) {
    out = out + s;
  }
  return out;
}
`,
    },
    {
      type: 'read',
      title: 'Counting down',
      md: `
All three parts of a \`for\` loop are yours to change. To count down, start high, keep going while you're above the bottom, and use \`i--\` (subtract 1):

~~~js
for (let i = 3; i >= 1; i--) {
  console.log(i);
}
console.log("liftoff");
~~~
`,
    },
    {
      type: 'task',
      title: 'countdown',
      md: `\`countdown(3)\` returns \`[3, 2, 1]\`. Build an array with \`push\` inside a loop that counts down.`,
      starter: `function countdown(n) {
  // your code here
}
`,
      tests: [
        { name: 'countdown(3) is [3, 2, 1]', code: `eq(countdown(3), [3, 2, 1]);` },
        { name: 'countdown(1) is [1]', code: `eq(countdown(1), [1]);` },
      ],
      hint: '`const out = [];` then `for (let i = n; i >= 1; i--) { out.push(i); }` and `return out;`.',
      solution: `function countdown(n) {
  const out = [];
  for (let i = n; i >= 1; i--) { // start at n, stop after 1
    out.push(i);
  }
  return out;
}
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Why the counter is let',
      md: 'What if the counter is `const`?',
      code: `for (const i = 0; i < 3; i++) {
  console.log(i);
}`,
      output: `0
! Assignment to constant variable.`,
      explain: `
The first lap runs fine and prints \`0\`. Then the loop tries \`i++\`, which changes \`i\`, and \`const\` forbids that, so it throws.

- Counting \`for\` loop: \`let i\`, because the counter changes.
- \`for...of\`: \`const item\` is fine, because each lap gets a brand-new variable.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What does this print?\n\n~~~\nlet total = 0;\nfor (let i = 1; i < 4; i++) {\n  total = total + i;\n}\nconsole.log(total);\n~~~",
          choices: ["`10`", "`6`", "`4`"],
          answer: 1,
          explain: "`i < 4` stops before 4, so it adds 1 + 2 + 3 = 6. To include 4, write `i <= 4`.",
          why: ["That needs `i <= 4`. `<` stops before 4.", "", "That's where `i` stops, not the total."],
        },
        {
          q: "What does this print?\n\n~~~\nconst nums = [5, 10, 15];\nlet total;\nfor (const n of nums) {\n  total = 0;\n  total = total + n;\n}\nconsole.log(total);\n~~~",
          choices: ["`30`", "`15`", "`0`"],
          answer: 1,
          explain: "`total = 0` is inside the loop, so it resets on every lap and only the last item survives. Start the accumulator **before** the loop.",
          why: ["It would be 30 only if `total = 0` were before the loop.", "", "The last lap resets to 0 and then adds 15."],
        },
        {
          q: "What does this print?\n\n~~~\nfor (const x of [\"a\", \"b\"]) {\n  console.log(x);\n}\n~~~",
          choices: ["`0` then `1`", "`a` then `b`", "`[ \"a\", \"b\" ]` once"],
          answer: 1,
          explain: "`for...of` hands you each **item**. Use a counting `for` when you need the index.",
          why: ["Those are the indexes. `for...of` gives the items.", "", "The body runs once per item."],
        },
        {
          q: "Finding the biggest number in `[-5, -2, -9]`, why start `best` at `nums[0]` instead of `0`?",
          choices: ["Starting at `0` would return `0`, which isn't even in the list", "It's faster", "It doesn't matter"],
          answer: 0,
          explain: "Every number here is below 0, so a start of 0 would never be beaten. Starting with a real item guarantees the answer comes from the list.",
          why: ["", "Speed has nothing to do with it. It's about getting the right answer.", "It matters whenever every item is negative."],
        },
        {
          q: "Why is the counter `let i` and not `const i`?",
          choices: ["`i++` reassigns it, and `const` can't be reassigned", "`const` is slower in loops", "Either works"],
          answer: 0,
          explain: "The counter changes every lap, so it must be `let`.",
          why: ["", "Speed isn't the reason.", "`const i` with `i++` throws `Assignment to constant variable.`"],
        },
      ],
    },
  ],
};
