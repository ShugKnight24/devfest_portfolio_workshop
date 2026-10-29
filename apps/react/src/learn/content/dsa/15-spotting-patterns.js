// DSA course · lesson 15. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'spotting-patterns',
  builds: [
    'dsa/hash-maps-and-sets',
    'dsa/arrays-two-pointers',
    'dsa/sliding-window',
    'dsa/stacks-and-queues',
    'dsa/graphs',
    'dsa/topological-sort',
    'dsa/heaps',
    'dsa/binary-search',
    'dsa/dynamic-programming',
  ],
  title: 'Spotting the pattern',
  goal: 'Read a problem statement, pick out the words that point to a pattern, and say the brute force, the pattern and the Big-O before writing code.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Problems come with clues',
      md: `
This lesson ties the whole track together. Interview problems look endless, but most are one of about ten patterns in disguise, and the statement usually gives the pattern away with a few words.

The plan for every problem:

1. **Brute force first.** Say the obvious solution and its Big-O, even if it's slow. It proves you understand the problem, and it's the thing you'll improve.
2. **Find the clue.** Which words in the statement match a row of the cheat sheet in the next step?
3. **Name the pattern and its Big-O.** "That's a sliding window, so O(n)."
4. **Then code.**

An interviewer who hears "the brute force is O(n²) because of the nested loop; the input says *pair* and *sum*, so a hash set gets it to O(n)" already knows you can solve it, before you've typed anything.
`,
    },
    {
      type: 'read',
      title: 'The cheat sheet',
      md: `
| Clue in the problem | Pattern | Typical Big-O |
|---|---|---|
| "have I seen this before?", duplicates, counts, pairs that sum to X | **hash map / set** (lesson 3) | O(n) |
| **sorted** array, pairs, reverse in place, palindrome | **two pointers** (lesson 2) | O(n) |
| **contiguous** subarray or substring, "longest / shortest window", "at most k" | **sliding window** (lesson 4) | O(n) |
| matching brackets, undo, "most recent", next greater element | **stack** (lesson 5) | O(n) |
| tree, "each level", "depth" | **DFS / BFS on a tree** (lesson 8) | O(n) |
| grid, network, friends, "connected", islands | **graph DFS / BFS** (lesson 9) | O(V + E) |
| "fewest steps", "shortest path" (all moves cost the same) | **BFS** (lesson 9) | O(V + E) |
| "depends on", prerequisites, build / install order | **topological sort** (lesson 10) | O(V + E) |
| "k largest", "k closest", "next smallest", merge k sorted | **heap** (lesson 11) | O(n log k) |
| sorted + "find", or "minimum X such that it works" | **binary search** (lesson 12) | O(log n) |
| "how many ways", "minimum cost", overlapping choices | **dynamic programming** (lesson 14) | states × choices |

Two meta-clues:

- **Input size** hints at the target. n up to 10⁵ or more means O(n) or O(n log n); a nested loop won't pass. n around 20 means exponential search is allowed.
- **"Sorted"** is never decoration. If the input is sorted, the answer almost always uses that: two pointers or binary search.
`,
    },
    {
      type: 'check',
      title: 'Arrays and strings',
      md: 'For each problem, name the pattern before you open it.',
      items: [
        {
          q: '"Given an array of numbers and a target, return true if any two numbers add up to the target." The array is **not** sorted.',
          choices: ['Hash set: for each number, check if `target - n` was seen', 'Sliding window', 'Binary search'],
          answer: 0,
          explain: 'The clue is "two numbers that sum to". Brute force tries every pair, O(n²). Remembering what you\'ve seen makes it O(n).',
          why: { 1: 'The two numbers don\'t have to be next to each other, so there\'s no contiguous window.', 2: 'Binary search needs sorted input, and sorting first costs O(n log n).' },
        },
        {
          q: '"Find the length of the longest substring with no repeating characters."',
          choices: ['Sliding window with a Set of characters in the window', 'Two pointers from both ends', 'Dynamic programming over every substring'],
          answer: 0,
          explain: '"Longest" + "substring" (contiguous) = sliding window. Grow the right edge; when a repeat appears, shrink from the left. O(n).',
          why: { 1: 'Pointers at both ends suit sorted pairs or palindromes. Here both pointers move left to right.', 2: 'Checking every substring is the O(n²) or worse brute force.' },
        },
        {
          q: '"Given a **sorted** array, return two numbers that add up to the target."',
          choices: ['Two pointers from both ends', 'A heap', 'BFS'],
          answer: 0,
          explain: 'Sorted + pair. If the sum is too small move the left pointer right; too big, move the right pointer left. O(n), no extra memory.',
          why: { 1: 'Nothing here asks for the k smallest or the next smallest.', 2: 'There\'s no graph.' },
        },
        {
          q: '"Is this string of brackets like `([]{})` correctly balanced?"',
          choices: ['A stack', 'A queue', 'A hash map of counts'],
          answer: 0,
          explain: 'Every closing bracket must match the **most recent** unmatched opener: last in, first out.',
          why: { 1: 'A queue gives you the **oldest** opener, which is the wrong one to match.', 2: 'Counts pass `([)]`, which is not balanced. Order matters.' },
        },
      ],
    },
    {
      type: 'read',
      title: 'Worked example: brute force, then pattern',
      md: `
"Return true if any two numbers in the array add up to \`target\`."

**Brute force:** try every pair. Two nested loops, **O(n²)**.

~~~js
function hasPairBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return true;
    }
  }
  return false;
}
console.log(hasPairBrute([3, 8, 1, 5], 9));
~~~

**The clue:** "two numbers that add up to". For each number \`n\`, the question is really "have I already seen \`target - n\`?". "Have I seen" is a **Set** lookup, which is O(1).

**Pattern:** one pass, checking then adding. **O(n)** time, O(n) memory for the Set.

~~~
nums = [3, 8, 1, 5], target 9
n = 3: need 6, seen {}          → add 3
n = 8: need 1, seen {3}         → add 8
n = 1: need 8, seen {3, 8}      → yes!
~~~

Check **before** you add. Adding first would let a single 4 "pair with itself" for target 8.
`,
    },
    {
      type: 'task',
      title: 'hasPairWithSum',
      md: `
Write the O(n) version. \`hasPairWithSum(nums, target)\` returns \`true\` if two **different** items add up to \`target\`.

~~~
hasPairWithSum([3, 8, 1, 5], 9)   → true    (8 + 1)
hasPairWithSum([4], 8)            → false   (only one 4)
hasPairWithSum([4, 4], 8)         → true
~~~

Use a \`Set\` called \`seen\`. For each \`n\`: if \`seen\` has \`target - n\`, return true; then add \`n\`.
`,
      starter: `function hasPairWithSum(nums, target) {
  const seen = new Set();
  // your code here
}
`,
      tests: [
        { name: '[3, 8, 1, 5] has a pair summing to 9', code: `eq(hasPairWithSum([3, 8, 1, 5], 9), true);` },
        { name: '[3, 8, 1, 5] has no pair summing to 100', code: `eq(hasPairWithSum([3, 8, 1, 5], 100), false);` },
        { name: 'one 4 cannot pair with itself', code: `eq(hasPairWithSum([4], 8), false);` },
        { name: 'two 4s make 8', code: `eq(hasPairWithSum([4, 4], 8), true);` },
      ],
      hint: '`for (const n of nums) { if (seen.has(target - n)) return true; seen.add(n); }` and `return false` after the loop.',
      solution: `function hasPairWithSum(nums, target) {
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(target - n)) return true; // the partner came earlier
    seen.add(n);
  }
  return false;
}
`,
    },
    {
      type: 'read',
      title: 'Clues for trees and graphs',
      md: `
Graph problems rarely say "graph". Listen for **things connected to other things**:

- **A grid** of land and water: each cell is a node, its up/down/left/right neighbors are edges. "Count the islands" is counting connected components.
- **People and friendships**, cities and roads, web pages and links.
- **Words that differ by one letter**, states of a puzzle: each state is a node, each legal move is an edge.

Then pick the walk by what's asked:

| Asked for | Walk |
|---|---|
| "is there a path", "count the groups", "visit everything" | DFS (shortest to write) |
| "fewest steps", "shortest path", "nearest", "level by level" | BFS with a queue |
| "order these so each comes after what it needs", "can all courses be finished" | topological sort (Kahn: leaves first) |
| "cheapest path" with different costs per edge | Dijkstra: BFS with a heap |

Always: **a visited Set** for graphs, never needed for trees. And the cost is **O(V + E)** for every walk in this table except Dijkstra, which adds a log factor for the heap.
`,
    },
    {
      type: 'check',
      title: 'Trees and graphs',
      md: 'Name the pattern before you open each one.',
      items: [
        {
          q: '"Given a 2D grid of `1` (land) and `0` (water), count the islands."',
          choices: ['Graph DFS from each unvisited land cell, counting starts', 'Binary search on each row', 'A heap of land cells'],
          answer: 0,
          explain: 'Cells are nodes and touching land cells are edges. Each DFS start is a new island: connected components. O(rows × cols).',
          why: { 1: 'Rows aren\'t sorted, and islands span rows.', 2: 'There\'s no "smallest next" to pull out.' },
        },
        {
          q: '"There are `n` courses. Some have prerequisites. Return an order to take them all, or `[]` if impossible."',
          choices: ['Topological sort: count prerequisites, start with courses that have none', 'BFS shortest path', 'Sort the courses by number'],
          answer: 0,
          explain: '"Prerequisites" + "order" is the package installer question in different clothes. "Impossible" means a cycle: fewer courses out than in.',
          why: { 1: 'There\'s no start and goal to measure a distance between.', 2: 'Course numbers say nothing about dependencies.' },
        },
        {
          q: '"In a maze grid, what is the minimum number of moves from S to E?"',
          choices: ['BFS from S', 'DFS from S', 'Dynamic programming over the grid, moving right and down only'],
          answer: 0,
          explain: '"Minimum number of moves" with equal-cost moves is BFS. The first time it reaches E is by the fewest moves.',
          why: { 1: 'DFS finds **a** path, not the shortest.', 2: 'A maze lets you move in all four directions, so the right/down table doesn\'t apply.' },
        },
        {
          q: '"Return the largest value in each row of a binary tree."',
          choices: ['BFS level by level, tracking the max per level', 'Binary search tree lookup', 'Topological sort'],
          answer: 0,
          explain: '"Each row" means levels: the queue with a `size` per round from lesson 8. O(n).',
          why: { 1: 'The tree isn\'t said to be a BST, and you need every row anyway.', 2: 'Trees have no dependency question to answer here.' },
        },
      ],
    },
    {
      type: 'read',
      title: 'Clues for heaps, binary search and DP',
      md: `
These three are the ones people miss most, because the clue is a single word.

**Heap:** the letter **k**, or "next". "The k most frequent words", "the k closest points", "keep a running median", "merge k sorted lists". If you'd sort everything just to take a few from one end, a heap of size k does it in O(n log k). JavaScript has no built-in heap, so ask whether you can assume one or write the small one from lesson 11.

**Binary search:** **sorted**, or **"the minimum X such that ..."**. If the input is sorted and you're searching, it's O(log n). If the question asks for the smallest speed, capacity or time that still works, and bigger is always at least as good, binary search the answer itself.

**Dynamic programming:** **"how many ways"**, **"minimum / maximum"** over a sequence of choices, or **"is it possible"** when one choice leaves a smaller version of the same problem. Write the recursion on the **last choice**, notice repeated arguments, add a memo, and say the table size as the Big-O.

**Greedy** (always take the best-looking option now) sometimes works and is faster than DP, but you need a reason it's safe. If you can find a counterexample like coins \`[1, 3, 4]\` for 6, it's DP.
`,
    },
    {
      type: 'check',
      title: 'Heaps, binary search and DP',
      md: 'Name the pattern before you open each one.',
      items: [
        {
          q: '"Return the k most frequent words in a list of a million words."',
          choices: ['Count with a Map, then keep a min-heap of size k by count', 'Binary search on the words', 'DP over the list'],
          answer: 0,
          explain: 'Two patterns stacked: a hash map for counts (O(n)), then a size-k heap for the top k (O(m log k) for m distinct words).',
          why: { 1: 'There\'s nothing sorted to search.', 2: 'No choice leads to a smaller version of the same problem.' },
        },
        {
          q: '"You must ship packages in order within D days. Find the minimum ship capacity."',
          choices: ['Binary search on the capacity, checking "fits in D days?"', 'A heap of package weights', 'Sort the packages'],
          answer: 0,
          explain: '"Minimum X such that it works", and a bigger capacity never needs more days. Same shape as the banana-eating speed in lesson 12.',
          why: { 1: 'Order is fixed, so you can\'t pull the heaviest out first.', 2: 'The packages must ship in the given order.' },
        },
        {
          q: '"A string of digits encodes letters (1 = A ... 26 = Z). How many ways can it be decoded?"',
          choices: ['Dynamic programming: ways(i) from ways(i - 1) and ways(i - 2)', 'Sliding window', 'Hash set of seen digits'],
          answer: 0,
          explain: '"How many ways" + each choice (take 1 digit or 2) leaves a shorter string. It\'s climbing stairs with rules.',
          why: { 1: 'You\'re counting decodings, not finding a best window.', 2: 'Whether a digit was seen before doesn\'t affect the count.' },
        },
        {
          q: '"Find the first bad version among versions 1 to n, given an `isBad(v)` function." Every version after a bad one is also bad.',
          choices: ['Binary search for the first `isBad` that is true', 'Check each version from 1 upward', 'BFS over versions'],
          answer: 0,
          explain: 'good, good, bad, bad: the yes/no flips once. That\'s lower bound over the answer range, O(log n) calls.',
          why: { 1: 'That\'s the O(n) brute force. Say it first, then improve it.', 2: 'Versions form a line, not a graph to explore.' },
        },
      ],
    },
    {
      type: 'task',
      title: 'isBalanced',
      md: `
One more pattern by hand: the stack from lesson 5. The clue was "the most recent unmatched opener".

\`isBalanced(s)\` returns \`true\` if every bracket in \`s\` is closed by the matching kind, in the right order. \`s\` contains only \`()[]{}\`.

~~~
isBalanced("([]{})")   → true
isBalanced("([)]")     → false
isBalanced("((")       → false
isBalanced("")         → true
~~~

The starter has a \`pairs\` object mapping each closer to its opener. For each character: push openers; for a closer, pop and compare with \`pairs[ch]\`. At the end the stack must be empty.
`,
      starter: `function isBalanced(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  // your code here
}
`,
      tests: [
        { name: '"([]{})" is balanced', code: `eq(isBalanced("([]{})"), true);` },
        { name: '"([)]" closes in the wrong order', code: `eq(isBalanced("([)]"), false);` },
        { name: '"((" is never closed', code: `eq(isBalanced("(("), false);` },
        { name: 'a closer with nothing open is unbalanced', code: `eq(isBalanced(")("), false);` },
        { name: 'an empty string is balanced', code: `eq(isBalanced(""), true);` },
      ],
      hint: '`for (const ch of s) { if (ch in pairs) { if (stack.pop() !== pairs[ch]) return false; } else stack.push(ch); }` then `return stack.length === 0;`',
      solution: `function isBalanced(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of s) {
    if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false; // wrong opener, or none at all
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0; // anything left was never closed
}
`,
      explain: 'O(n) time and O(n) memory. `stack.pop()` on an empty array returns `undefined`, which never equals an opener, so `")("` fails on its first character.',
    },
    {
      type: 'read',
      title: 'What to say, every time',
      md: `
Under pressure the pattern names fly out of your head. A fixed script brings them back:

1. **Repeat the problem** in your own words and ask one or two questions: empty input? duplicates? sorted? what to return if there's no answer?
2. **Brute force out loud:** "The obvious way is two loops over every pair, which is O(n²)."
3. **Point at the clue:** "But it says *sorted* / *contiguous* / *depends on* / *k largest* / *how many ways*..."
4. **Name the pattern and the new Big-O:** "...so two pointers gets it to O(n) with no extra memory."
5. **Code it**, then trace one small example by hand, including an edge case.

If no clue matches, that's fine. Code the brute force, then ask "what work am I repeating?". Repeated lookups suggest a hash map, repeated subproblems suggest DP, and repeated "find the smallest" suggests a heap. That question finds most patterns even when the wording hides them.
`,
    },
    {
      type: 'check',
      title: 'Mixed review',
      md: 'One from each part of the track. Name the pattern and the Big-O.',
      items: [
        {
          q: '"Find the maximum sum of any 3 **consecutive** numbers in the array."',
          choices: ['Sliding window of size 3: add the new item, subtract the one leaving. O(n)', 'Sort and take the 3 largest', 'Topological sort'],
          answer: 0,
          explain: '"Consecutive" is the contiguous clue. Recomputing each window from scratch is the brute force.',
          why: { 1: 'The 3 largest numbers usually aren\'t next to each other.', 2: 'Nothing depends on anything else.' },
        },
        {
          q: '"Given an unsorted list, return the first number that appears twice."',
          choices: ['A Set of seen numbers, one pass. O(n)', 'Binary search. O(log n)', 'BFS. O(V + E)'],
          answer: 0,
          explain: '"Appears twice" = "have I seen this before?" = a Set.',
          why: { 1: 'It\'s unsorted, and sorting would lose which duplicate came **first**.', 2: 'There\'s no graph.' },
        },
        {
          q: '"Tasks have dependencies. Group them into rounds that can run in parallel."',
          choices: ['Kahn\'s algorithm in waves: all current leaves form a round', 'DFS from each task', 'A max-heap of tasks'],
          answer: 0,
          explain: 'It\'s the install stages question from lesson 10: same lookups, processed a wave at a time. O(V + E).',
          why: { 1: 'DFS gives a valid order, but not the rounds.', 2: 'A heap orders by priority, not by dependencies.' },
        },
        {
          q: 'The input size is n ≤ 100,000. Which approach is too slow?',
          choices: ['Comparing every pair, O(n²)', 'Sorting first, O(n log n)', 'A single pass with a Map, O(n)'],
          answer: 0,
          explain: '100,000² is 10 billion steps, far too many. O(n log n) is about 1.7 million.',
          why: { 1: 'n log n is fine at this size.', 2: 'O(n) is the best you can usually do.' },
        },
      ],
    },
  ],
};
