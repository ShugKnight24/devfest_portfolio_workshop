// DSA course · lesson 7. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'recursion',
  builds: ['dsa/stacks-and-queues', 'dsa/hash-maps-and-sets', 'js/functions', 'js/arrays'],
  title: 'Recursion',
  goal: 'Write functions that call themselves with a base case and a smaller recursive case, trace them on the call stack, and know when a loop is the better choice.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'A function that calls itself',
      md: `
A **recursive** function solves a problem by calling itself on a **smaller** version of the same problem. Every one has exactly two parts:

1. **Base case:** the input is so small the answer is obvious. Return it directly, no more calls.
2. **Recursive case:** shrink the problem a little, call yourself on the smaller one, and use the result.

~~~js
function countdown(n) {
  if (n === 0) {              // base case: nothing left to count
    console.log("done");
    return;
  }
  console.log(n);             // do this step's work
  countdown(n - 1);           // recursive case: the same job, one smaller
}
countdown(3);
~~~

The question to ask every time: **"does each call get closer to the base case?"** Here \`n\` goes down by 1 and the base case is 0, so yes.

Trees and graphs, later in this track, are recursive shapes (a tree is a node plus smaller trees), which is why this lesson comes first.
`,
    },
    {
      type: 'predict',
      title: 'Forgetting the base case',
      md: 'A countdown with the base case removed. (The `console.log` is gone too, so it doesn\'t print thousands of lines.)',
      throws: true,
      code: `function countdown(n) {
  return countdown(n - 1);
}
console.log(countdown(2));`,
      output: `RangeError: Maximum call stack size exceeded`,
      explain: `
Nothing ever stops it: \`countdown(2)\` calls \`countdown(1)\`, then 0, -1, -2, ... and the \`console.log\` never gets a value. Each call is waiting for the next one to finish, so they pile up until the engine runs out of room and throws **RangeError: Maximum call stack size exceeded**.

That message almost always means one of two things: no base case, or a recursive case that doesn't actually move toward it (like calling \`f(n)\` instead of \`f(n - 1)\`).
`,
    },
    {
      type: 'read',
      title: 'The call stack, traced',
      md: `
How does a function "wait" for itself? The **call stack** from lesson 5. Each call pushes a frame (its own \`n\`, its own place in the code); each \`return\` pops it.

~~~js
function factorial(n) {
  if (n <= 1) return 1;          // base case
  return n * factorial(n - 1);   // recursive case
}
console.log(factorial(4));
~~~

Going **down** (pushing), every call is stuck on \`n * ???\`:

| Stack (top last) | Waiting on |
|---|---|
| \`factorial(4)\` | \`4 * factorial(3)\` |
| \`factorial(4)\`, \`factorial(3)\` | \`3 * factorial(2)\` |
| ..., \`factorial(2)\` | \`2 * factorial(1)\` |
| ..., \`factorial(1)\` | base case: returns **1** |

Coming back **up** (popping), each waiting call finishes its multiplication:

| Call | Gets back | Returns |
|---|---|---|
| \`factorial(1)\` | | 1 |
| \`factorial(2)\` | 1 | 2 * 1 = 2 |
| \`factorial(3)\` | 2 | 3 * 2 = 6 |
| \`factorial(4)\` | 6 | 4 * 6 = **24** |

Big-O: \`n\` calls, O(1) work each: **O(n) time**. And because up to \`n\` frames sit on the stack at once: **O(n) space**. Recursion's space cost is easy to forget; say it out loud.
`,
    },
    {
      type: 'task',
      title: 'factorial',
      md: `
Write \`factorial(n)\` recursively, from the trace above. \`factorial(0)\` and \`factorial(1)\` are both 1.

~~~
factorial(4)  → 24   (4 * 3 * 2 * 1)
factorial(0)  → 1
~~~
`,
      starter: `function factorial(n) {
  // base case

  // recursive case
}
`,
      tests: [
        { name: 'factorial(4) is 24', code: `eq(factorial(4), 24);` },
        { name: 'factorial(1) is 1', code: `eq(factorial(1), 1);` },
        { name: 'factorial(0) is 1', code: `eq(factorial(0), 1);` },
        { name: 'factorial(10) is 3628800', code: `eq(factorial(10), 3628800);` },
      ],
      hint: '`if (n <= 1) return 1;` then `return n * factorial(n - 1);`. Using `<=` covers both 0 and 1.',
      solution: `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
`,
    },
    {
      type: 'task',
      title: 'sumTo, recursively',
      md: `
You wrote \`sumTo\` with a loop and with a formula in lesson 1. Now the recursive version: the sum up to \`n\` is \`n\` plus the sum up to \`n - 1\`.

~~~
sumTo(4)  → 10   (4 + sumTo(3))
sumTo(0)  → 0
~~~
`,
      starter: `function sumTo(n) {
  // your code here
}
`,
      tests: [
        { name: 'sumTo(4) is 10', code: `eq(sumTo(4), 10);` },
        { name: 'sumTo(0) is 0', code: `eq(sumTo(0), 0);` },
        { name: 'sumTo(100) is 5050', code: `eq(sumTo(100), 5050);` },
      ],
      hint: 'Base case: `if (n === 0) return 0;`. Recursive case: `return n + sumTo(n - 1);`',
      solution: `function sumTo(n) {
  if (n === 0) return 0;
  return n + sumTo(n - 1);
}
`,
      explain: 'Three versions, three costs: the loop is O(n) time and O(1) space, this one is O(n) time and O(n) stack space, the formula is O(1). Recursion isn\'t automatically better; here it\'s the worst of the three.',
    },
    {
      type: 'task',
      title: 'sumArray',
      md: `
Recursion on an array: the sum is **the first item plus the sum of the rest**. The base case is the empty array, whose sum is 0.

\`arr.slice(1)\` gives everything except the first item (JavaScript lesson 5).

~~~
sumArray([5, 3, 2])  → 10   (5 + sumArray([3, 2]))
sumArray([])         → 0
~~~
`,
      starter: `function sumArray(arr) {
  // your code here
}
`,
      tests: [
        { name: 'sumArray([5, 3, 2]) is 10', code: `eq(sumArray([5, 3, 2]), 10);` },
        { name: 'an empty array gives 0', code: `eq(sumArray([]), 0);` },
        { name: 'one item gives that item', code: `eq(sumArray([7]), 7);` },
      ],
      hint: '`if (arr.length === 0) return 0;` then `return arr[0] + sumArray(arr.slice(1));`',
      solution: `function sumArray(arr) {
  if (arr.length === 0) return 0;
  return arr[0] + sumArray(arr.slice(1));
}
`,
      explain: 'Watch the hidden cost (lesson 1): `slice` copies the rest of the array, O(n) each call, so this is O(n²) overall. Passing an index instead, `sumFrom(arr, i)` with `arr[i] + sumFrom(arr, i + 1)`, makes it O(n). Interviewers like it when you notice.',
    },
    {
      type: 'predict',
      title: 'Work before the call, or after?',
      md: 'One line prints on the way **down**, the other on the way back **up**.',
      code: `function show(n) {
  if (n === 0) return;
  console.log("down", n);
  show(n - 1);
  console.log("up", n);
}
show(3);`,
      output: `down 3
down 2
down 1
up 1
up 2
up 3`,
      explain: `
Code **before** the recursive call runs as the stack grows, in order 3, 2, 1. Code **after** it waits until the deeper call returns, so it runs as the stack unwinds: 1, 2, 3.

The common wrong answer interleaves them (\`down 3, up 3, down 2...\`). But \`show(3)\` can't reach its \`up\` line until \`show(2)\` has completely finished, including all of \`show(2)\`'s own calls.

This is why recursion can reverse things for free, and why tree traversals in the next lessons print in different orders depending on where the line sits.
`,
    },
    {
      type: 'read',
      title: 'When recursion really earns its place: nesting',
      md: `
Factorial and sums are easier with a loop. Recursion becomes the natural choice when the data is **nested to an unknown depth**: arrays inside arrays, folders inside folders, comments with replies with replies.

A loop handles one level. For the levels inside, you'd need a loop inside a loop inside a loop, and you don't know how many. Recursion says: "handle this level, and for anything nested, **call myself** to handle it."

~~~js
function countNumbers(arr) {
  let count = 0;
  for (const item of arr) {
    if (Array.isArray(item)) count += countNumbers(item); // nested: let a recursive call handle it
    else count += 1;                                    // a plain number: count it here
  }
  return count;
}
console.log(countNumbers([1, [2, 3], [[4]], 5]));
~~~

Here the base case is hidden: an array with **no nested arrays** makes no recursive calls. The loop runs out and returns.

Every item is visited once, so it's **O(n)** time, where n is the total number of items at all levels. Space is **O(d)** for the stack, where d is the deepest nesting.
`,
    },
    {
      type: 'task',
      title: 'flatten',
      md: `
\`flatten(arr)\` returns a new flat array with every number, at any depth, in order. Don't use the built-in \`arr.flat(Infinity)\`; write the recursion.

~~~
flatten([1, [2, 3], [[4]], 5])  → [1, 2, 3, 4, 5]
flatten([])                     → []
~~~

Same shape as \`countNumbers\`: loop over the items; a nested array gets flattened by a recursive call and its items pushed (\`result.push(...flatten(item))\`); a plain value gets pushed directly.
`,
      starter: `function flatten(arr) {
  const result = [];
  for (const item of arr) {
    // your code here
  }
  return result;
}
`,
      tests: [
        { name: 'flatten([1, [2, 3], [[4]], 5]) is [1, 2, 3, 4, 5]', code: `eq(flatten([1, [2, 3], [[4]], 5]), [1, 2, 3, 4, 5]);` },
        { name: 'deep nesting works', code: `eq(flatten([[[[1]]], 2]), [1, 2]);` },
        { name: 'an empty array gives []', code: `eq(flatten([]), []);` },
        { name: 'an already-flat array is unchanged', code: `eq(flatten([1, 2]), [1, 2]);` },
      ],
      hint: '`if (Array.isArray(item)) result.push(...flatten(item)); else result.push(item);`',
      solution: `function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) result.push(...flatten(item));
    else result.push(item);
  }
  return result;
}
`,
    },
    {
      type: 'read',
      title: 'Recursion vs a loop, and the repeated-work trap',
      md: `
**Any recursion can be written as a loop**, usually with your own stack array (lesson 5) standing in for the call stack. When to pick which:

| Pick recursion when... | Pick a loop when... |
|---|---|
| the data is nested or branching (trees, nested arrays, folders) | you're walking a flat list or counting |
| the problem says "do the same thing on each part" | depth could be huge (tens of thousands of levels can overflow the stack) |

**The repeated-work trap.** Fibonacci (\`fib(n) = fib(n - 1) + fib(n - 2)\`) written the obvious way branches twice per call and recomputes the same values over and over: about O(2ⁿ). \`fib(40)\` makes hundreds of millions of calls.

The fix is a Map (lesson 3) that remembers answers you've already worked out, called **memoization**:

~~~js
let calls = 0;
function fib(n, memo = new Map()) {
  calls++;
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);   // already worked out: reuse it
  const result = fib(n - 1, memo) + fib(n - 2, memo);
  memo.set(n, result);
  return result;
}
console.log(fib(40), "in", calls, "calls");
~~~

Now each \`n\` is computed once: **O(n)**. That idea grows into dynamic programming later in the track.
`,
    },
    {
      type: 'task',
      title: 'sumNested',
      md: `
Combine it all. \`sumNested(arr)\` adds up every number in an array nested to any depth.

~~~
sumNested([1, [2, 3], [[4]]])  → 10
sumNested([])                  → 0
~~~

Base case and recursive case live in the loop, like \`flatten\`. But instead of pushing, keep a running \`total\`: a nested array adds \`sumNested(item)\`, a number adds itself.
`,
      starter: `function sumNested(arr) {
  // your code here
}
`,
      tests: [
        { name: 'sumNested([1, [2, 3], [[4]]]) is 10', code: `eq(sumNested([1, [2, 3], [[4]]]), 10);` },
        { name: 'an empty array gives 0', code: `eq(sumNested([]), 0);` },
        { name: 'empty nested arrays add nothing', code: `eq(sumNested([[], [[]], 5]), 5);` },
        { name: 'a flat array is just its sum', code: `eq(sumNested([1, 2, 3]), 6);` },
      ],
      hint: '`let total = 0;` then in `for (const item of arr)`: `total += Array.isArray(item) ? sumNested(item) : item;`. Return `total`.',
      solution: `function sumNested(arr) {
  let total = 0;
  for (const item of arr) {
    total += Array.isArray(item) ? sumNested(item) : item;
  }
  return total;
}
`,
    },
    {
      type: 'read',
      title: 'How to spot recursion in an interview question',
      md: `
Signals:

- The data is **nested**: "nested list", "JSON object", "file system", "comments and replies".
- The data **branches**: any **tree** question (almost always recursive), "all paths", "all combinations", "all subsets", "permutations".
- The problem is **defined in terms of itself**: "the answer for n uses the answer for n - 1".

A script for writing it:

1. **Say the base case first.** "An empty array sums to 0." "A null node has depth 0."
2. **Trust the recursive call.** Assume \`f(smaller)\` already works, and just write how to use its answer. Don't trace every level in your head.
3. **Check progress.** Does every call get closer to the base case?
4. **Give both costs.** "O(n) time, and O(depth) space for the call stack."
5. If you see the **same arguments computed again and again**, add a Map and say "memoize".

If the interviewer asks "can you do it without recursion?", the answer is a loop with an explicit stack.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What does \"Maximum call stack size exceeded\" usually mean?",
          choices: ["The recursion never reaches a base case", "The array is too big for memory", "A loop ran too many times"],
          answer: 0,
          explain: "Each call pushes a frame. Without a reachable base case, frames pile up until the stack is full.",
          why: { 1: "That would be an out-of-memory error, not a call stack one.", 2: "A plain loop doesn't add stack frames; it would just run forever." },
        },
        {
          q: "What does this return?\n\n~~~\nfunction f(n) {\n  if (n === 0) return 0;\n  return 2 + f(n - 1);\n}\nf(3);\n~~~",
          choices: ["`6`", "`3`", "`2`"],
          answer: 0,
          explain: "f(3) = 2 + f(2) = 2 + 2 + f(1) = 2 + 2 + 2 + f(0) = 6.",
          why: { 1: "Each call adds 2, not 1.", 2: "The 2 is added at every level on the way back up, not just once." },
        },
        {
          q: "What's the space complexity of recursive `factorial(n)`?",
          choices: ["O(n), for the call stack", "O(1), because it makes no arrays", "O(n²)"],
          answer: 0,
          explain: "Up to n frames are waiting on the stack at the deepest point.",
          why: { 1: "Stack frames are memory too, even without arrays.", 2: "Only one chain of n calls exists at a time." },
        },
        {
          q: "When is a loop clearly the better choice than recursion?",
          choices: ["Walking a flat list where the depth could be very large", "Walking a tree", "Flattening arrays nested to an unknown depth"],
          answer: 0,
          explain: "A flat walk has no nesting to exploit, and deep recursion risks a stack overflow.",
          why: { 1: "Trees branch; recursion matches their shape.", 2: "Unknown nesting is exactly where recursion shines." },
        },
        {
          q: "Why is plain recursive Fibonacci so slow?",
          choices: ["It recomputes the same values many times, about O(2ⁿ)", "Recursion is always slower than loops", "Adding big numbers is slow"],
          answer: 0,
          explain: "fib(5) computes fib(3) twice, fib(2) three times... A Map of saved answers makes it O(n).",
          why: { 1: "Recursion itself isn't the problem; the repeated work is. Memoized recursion is O(n).", 2: "The numbers are small; the number of calls is what explodes." },
        },
      ],
    },
  ],
};
