// DSA course · lesson 14. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'dynamic-programming',
  builds: ['dsa/recursion', 'dsa/hash-maps-and-sets', 'dsa/big-o'],
  title: 'Dynamic programming: remember, then build up',
  goal: 'Turn a slow recursive answer into a fast one in two moves, memoization and a bottom-up table, on climbing stairs, coin change and grid paths.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Climbing stairs, the recursive way',
      md: `
**The problem:** a staircase has \`n\` steps. Each move climbs 1 or 2 steps. How many different ways are there to reach the top?

Think about the **last** move. You arrived at step \`n\` either from step \`n - 1\` (a 1-step) or from step \`n - 2\` (a 2-step). So:

~~~
ways(n) = ways(n - 1) + ways(n - 2)
ways(0) = 1   (already at the top: one way, do nothing)
ways(1) = 1   (one 1-step)
~~~

That's recursion straight from lesson 7, and it's correct:

~~~js
function ways(n) {
  if (n <= 1) return 1;
  return ways(n - 1) + ways(n - 2);
}

console.log(ways(3));   // 1+1+1, 1+2, 2+1
console.log(ways(10));
~~~

It's also the **brute force**, and a very slow one, for a reason the next step shows.
`,
    },
    {
      type: 'predict',
      title: 'How many calls?',
      md: 'Same function, counting every call. Guess the order of magnitude.',
      code: `let calls = 0;
function ways(n) {
  calls++;
  if (n <= 1) return 1;
  return ways(n - 1) + ways(n - 2);
}

console.log(ways(25));
console.log(calls);`,
      output: `121393
242785`,
      explain: `
Almost a quarter of a million calls to answer a question about 25 stairs.

\`ways(25)\` calls \`ways(24)\` and \`ways(23)\`. But \`ways(24)\` **also** calls \`ways(23)\`. Each of those calls \`ways(22)\` again, and so on. The same small questions get answered over and over, and the call tree roughly doubles with each extra stair: about **O(2ⁿ)**. At n = 50 it would run for minutes.

Yet there are only 26 different questions: \`ways(0)\` to \`ways(25)\`. That gap is what dynamic programming closes.
`,
    },
    {
      type: 'read',
      title: 'Move 1: memoization (remember answers)',
      md: `
**Dynamic programming** is a name for one idea: when a recursive solution keeps asking the **same smaller questions**, answer each one once and reuse it.

The first way is **memoization**: keep a Map (lesson 3) from question to answer. Before computing, check the Map. After computing, save to it.

~~~js
const memo = new Map();
let calls = 0;

function ways(n) {
  calls++;
  if (n <= 1) return 1;
  if (memo.has(n)) return memo.get(n);        // asked before: reuse
  const result = ways(n - 1) + ways(n - 2);
  memo.set(n, result);                        // first time: remember
  return result;
}

console.log(ways(25), calls);
console.log(ways(70));
~~~

Each \`n\` is computed once, so it's **O(n)** time and O(n) memory for the Map. Same recursion, two extra lines, from 242,785 calls to 49.

That's the whole trick: **recursion + a cache**. The recursion is the hard part to think of; the cache is mechanical.
`,
    },
    {
      type: 'task',
      title: 'climbStairs with a memo',
      md: `
Add the memo to the recursive version. \`climbStairs(n)\` returns the number of ways to climb \`n\` stairs taking 1 or 2 at a time.

~~~
climbStairs(3)    → 3
climbStairs(10)   → 89
climbStairs(70)   → 308061521170129   (too slow without the memo)
~~~

The starter has the slow version and an empty \`memo\`. Add a check before the work and a save after it.
`,
      starter: `function climbStairs(n, memo = new Map()) {
  if (n <= 1) return 1;
  // your code here
  return climbStairs(n - 1, memo) + climbStairs(n - 2, memo);
}
`,
      tests: [
        { name: 'climbStairs(3) is 3', code: `eq(climbStairs(3), 3);` },
        { name: 'climbStairs(10) is 89', code: `eq(climbStairs(10), 89);` },
        { name: 'climbStairs(70) finishes quickly', code: `let calls = 0;\nconst real = climbStairs;\nclimbStairs = (n, memo) => { calls++; if (calls > 10000) throw new Error("over 10,000 calls: the memo isn't being used"); return real(n, memo); };\neq(climbStairs(70), 308061521170129);` },
      ],
      hint: 'Before the return: `if (memo.has(n)) return memo.get(n);`. Then store the sum in `const result`, `memo.set(n, result)` and `return result`.',
      solution: `function climbStairs(n, memo = new Map()) {
  if (n <= 1) return 1;
  if (memo.has(n)) return memo.get(n);
  const result = climbStairs(n - 1, memo) + climbStairs(n - 2, memo);
  memo.set(n, result);
  return result;
}
`,
      explain: 'The memo is passed down as a parameter so every call shares the same Map. Creating a new Map inside the function body would give each call an empty one, and nothing would ever be reused.',
    },
    {
      type: 'read',
      title: 'Move 2: bottom-up (fill a table)',
      md: `
Memoization works **top-down**: start at \`n\` and recurse toward the base cases. You can also go **bottom-up**: start at the base cases and fill a table upward, so every answer you need is already there.

~~~js
function ways(n) {
  const dp = [1, 1];                  // dp[i] = ways to reach step i
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];    // the same recurrence, read from the table
  }
  return dp[n];
}

console.log(ways(10), ways(70));
~~~

No recursion, so no call stack to overflow on big \`n\`. Still **O(n)** time.

And since each entry only looks two back, you don't need the whole table, just the last two numbers: **O(1)** memory.

~~~js
function ways(n) {
  let prev = 1, curr = 1;             // ways(0), ways(1)
  for (let i = 2; i <= n; i++) [prev, curr] = [curr, prev + curr];
  return curr;
}
console.log(ways(10));
~~~

**Which to use?** Memoization is easier to get right first: write the recursion, add a cache. Bottom-up is what interviewers often ask for as the follow-up.
`,
    },
    {
      type: 'task',
      title: 'climbStairs3, bottom-up',
      md: `
A change to the rules: each move climbs **1, 2 or 3** steps.

\`climbStairs3(n)\` returns the number of ways, using a bottom-up \`dp\` array. The recurrence gains one term: \`dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3]\`.

~~~
climbStairs3(0)   → 1
climbStairs3(3)   → 4    (1+1+1, 1+2, 2+1, 3)
climbStairs3(4)   → 7
~~~

The base cases are in the starter: \`dp[0] = 1\`, \`dp[1] = 1\`, \`dp[2] = 2\`.
`,
      starter: `function climbStairs3(n) {
  const dp = [1, 1, 2];
  // your code here
}
`,
      tests: [
        { name: 'climbStairs3(3) is 4', code: `eq(climbStairs3(3), 4);` },
        { name: 'climbStairs3(4) is 7', code: `eq(climbStairs3(4), 7);` },
        { name: 'the base cases work: 0 → 1, 1 → 1, 2 → 2', code: `eq([climbStairs3(0), climbStairs3(1), climbStairs3(2)], [1, 1, 2]);` },
        { name: 'climbStairs3(30) is 53798080', code: `eq(climbStairs3(30), 53798080);` },
      ],
      hint: '`for (let i = 3; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3];` then `return dp[n];`',
      solution: `function climbStairs3(n) {
  const dp = [1, 1, 2];
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3];
  }
  return dp[n];
}
`,
    },
    {
      type: 'read',
      title: 'Coin change: when greedy fails',
      md: `
**The problem:** given coin values and an amount, return the **fewest coins** that add up to it, or \`-1\` if it can't be done.

The tempting shortcut is **greedy**: always take the biggest coin that fits. For real-world coins like 1, 5, 10, 25 that happens to work. For other sets it doesn't:

~~~
coins [1, 3, 4], amount 6
greedy: 4 + 1 + 1   = 3 coins
best:   3 + 3       = 2 coins
~~~

So you have to consider every choice. Think about the **last coin** again, like the last move on the stairs. If the last coin is \`c\`, the rest is the best way to make \`amount - c\`:

~~~
best(a) = 1 + the smallest best(a - c), over every coin c that fits
best(0) = 0
~~~

Bottom-up, fill \`dp[0]\` to \`dp[amount]\`. Start everything at \`Infinity\`, which means "impossible so far":

~~~js
const coins = [1, 3, 4];
const amount = 6;
const dp = new Array(amount + 1).fill(Infinity);
dp[0] = 0;
for (let a = 1; a <= amount; a++) {
  for (const c of coins) {
    if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
  }
}
console.log(dp);
~~~

Cost: amount × number of coins, **O(amount × coins)**. The recursive brute force tries every combination and is exponential.
`,
    },
    {
      type: 'predict',
      title: 'The greedy answer',
      md: 'Greedy: keep taking the biggest coin that still fits.',
      code: `function greedyCoins(coins, amount) {
  const sorted = [...coins].sort((a, b) => b - a);
  let count = 0;
  for (const c of sorted) {
    while (amount >= c) {
      amount -= c;
      count++;
    }
  }
  return amount === 0 ? count : -1;
}

console.log(greedyCoins([1, 5, 10, 25], 30));
console.log(greedyCoins([1, 3, 4], 6));`,
      output: `2
3`,
      explain: `
With US-style coins, greedy finds 25 + 5: 2 coins, which is the best. With \`[1, 3, 4]\` it grabs 4 first and is then stuck with 1 + 1: 3 coins, when 3 + 3 is 2.

Greedy works only when the coin set has a special structure. In an interview, if someone asks "can't you just take the biggest coin?", this counterexample is the answer.
`,
    },
    {
      type: 'task',
      title: 'minCoins',
      md: `
\`minCoins(coins, amount)\` returns the fewest coins that make \`amount\`, or \`-1\` if no combination works.

~~~
minCoins([1, 3, 4], 6)    → 2
minCoins([2], 3)          → -1
minCoins([1, 2, 5], 0)    → 0
~~~

Write the table from the read step, then turn \`Infinity\` into \`-1\` at the end.
`,
      starter: `function minCoins(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  // your code here
}
`,
      tests: [
        { name: 'coins [1, 3, 4] make 6 with 2 coins', code: `eq(minCoins([1, 3, 4], 6), 2);` },
        { name: 'an impossible amount gives -1', code: `eq(minCoins([2], 3), -1);` },
        { name: 'amount 0 needs 0 coins', code: `eq(minCoins([1, 2, 5], 0), 0);` },
        { name: 'coins [1, 2, 5] make 11 with 3 coins', code: `eq(minCoins([1, 2, 5], 11), 3);` },
      ],
      hint: 'Two loops: `for (let a = 1; a <= amount; a++)` and inside `for (const c of coins)`. Then `return dp[amount] === Infinity ? -1 : dp[amount];`',
      solution: `function minCoins(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
`,
      explain: '`Infinity + 1` is still `Infinity`, so an impossible sub-amount never looks like a good option. That\'s why it beats starting the table at 0 or -1.',
    },
    {
      type: 'read',
      title: 'Grid paths: a table with two dimensions',
      md: `
**The problem:** a robot starts at the top-left of a \`rows × cols\` grid and may only move **right** or **down**. How many paths reach the bottom-right?

Last move again: you reached a cell either from the cell **above** or the cell to the **left**.

~~~
paths(r, c) = paths(r - 1, c) + paths(r, c - 1)
the whole top row and left column: 1 path each (straight line)
~~~

The table is now a grid of numbers. For 3 × 4:

~~~
1   1   1   1
1   2   3   4
1   3   6   10      ← the answer is 10
~~~

Each cell is the one above plus the one to the left. Fill it row by row and every cell you read is already done.

~~~js
const rows = 3, cols = 4;
const dp = Array.from({ length: rows }, () => new Array(cols).fill(1));
for (let r = 1; r < rows; r++) {
  for (let c = 1; c < cols; c++) {
    dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
  }
}
console.log(dp);
~~~

\`Array.from({ length: rows }, () => ...)\` makes a **separate** array for each row. \`new Array(rows).fill(new Array(cols))\` would put the **same** row array in every slot (JavaScript lesson 7: objects are shared by reference).

Cost: one cell each, **O(rows × cols)**.
`,
    },
    {
      type: 'task',
      title: 'gridPaths',
      md: `
\`gridPaths(rows, cols)\` returns the number of right/down paths from the top-left to the bottom-right.

~~~
gridPaths(3, 3)   → 6
gridPaths(3, 7)   → 28
gridPaths(1, 5)   → 1    (one row: straight across)
~~~

Build the table from the read step and return the bottom-right cell, \`dp[rows - 1][cols - 1]\`.
`,
      starter: `function gridPaths(rows, cols) {
  // your code here
}
`,
      tests: [
        { name: 'a 3 × 3 grid has 6 paths', code: `eq(gridPaths(3, 3), 6);` },
        { name: 'a 3 × 7 grid has 28 paths', code: `eq(gridPaths(3, 7), 28);` },
        { name: 'a single row has 1 path', code: `eq(gridPaths(1, 5), 1);` },
      ],
      hint: 'Make `dp` with `Array.from({ length: rows }, () => new Array(cols).fill(1))`, fill from `r = 1` and `c = 1`, then return `dp[rows - 1][cols - 1]`.',
      solution: `function gridPaths(rows, cols) {
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(1));
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      dp[r][c] = dp[r - 1][c] + dp[r][c - 1]; // from above + from the left
    }
  }
  return dp[rows - 1][cols - 1];
}
`,
    },
    {
      type: 'read',
      title: 'The DP recipe',
      md: `
Every problem in this lesson followed the same four steps. Say them out loud in an interview:

1. **State:** what does one number in the table mean? "\`dp[a]\` is the fewest coins that make \`a\`."
2. **Recurrence:** how does one answer come from smaller ones? Look at the **last choice**: the last step, the last coin, the last move.
3. **Base cases:** the smallest answers you know without thinking. \`dp[0] = 0\`.
4. **Order:** fill the table so everything a cell reads is already filled.

**Big-O:** number of states × work per state. Stairs: n states × O(1). Coins: amount states × coins choices. Grid: rows × cols states × O(1).

**How to spot DP:** the question asks for a **count of ways**, a **minimum or maximum**, or "is it possible", and making one choice leaves you with a smaller version of the same problem. If you write the recursion and see the same arguments coming up again and again, add a memo.

If no choice ever repeats a subproblem (like merge sort's halves), it's plain recursion, not DP.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'Why is the plain recursive `ways(n)` so slow?',
          choices: ['It answers the same subproblems again and again, about O(2ⁿ) calls', 'Recursion is always slower than loops', 'Adding numbers is slow'],
          answer: 0,
          explain: '`ways(n - 1)` and `ways(n - 2)` both ask for `ways(n - 3)`, and the overlap compounds at every level.',
          why: { 1: 'The memoized version is still recursive and runs in O(n).', 2: 'The additions are cheap. The number of calls is the problem.' },
        },
        {
          q: 'What does memoization add to a recursive function?',
          choices: ['A cache checked before computing and filled after', 'A loop that replaces the recursion', 'A sort of the inputs'],
          answer: 0,
          explain: 'Same recursion, plus a Map: each distinct question is computed once.',
          why: { 1: 'That\'s bottom-up, the other technique.', 2: 'Nothing gets sorted.' },
        },
        {
          q: 'Coins `[1, 3, 4]`, amount 6. What does always taking the biggest coin give?',
          choices: ['3 coins (4 + 1 + 1), though 2 is possible', '2 coins (3 + 3)', '-1'],
          answer: 0,
          explain: 'Greedy commits to the 4 and can\'t undo it. DP tries every last coin and finds 3 + 3.',
          why: { 1: 'That\'s the best answer, but greedy never considers skipping the 4.', 2: 'Greedy does reach 6, just not optimally.' },
        },
        {
          q: 'What is the Big-O of the bottom-up coin change table?',
          choices: ['O(amount × number of coins)', 'O(2^amount)', 'O(amount)'],
          answer: 0,
          explain: 'One cell per amount, and each cell tries every coin.',
          why: { 1: 'That\'s the brute-force recursion without a table.', 2: 'Each cell does more than O(1) work: it loops over the coins.' },
        },
        {
          q: 'Which question is most likely a DP problem?',
          choices: ['"How many ways can you decode this string of digits?"', '"Is this value in the sorted array?"', '"Return the values of each level of this tree."'],
          answer: 0,
          explain: 'A count of ways, where choosing the first 1 or 2 digits leaves a smaller version of the same question.',
          why: { 1: 'That\'s binary search.', 2: 'That\'s BFS with a queue.' },
        },
      ],
    },
  ],
};
