// DSA course · lesson 11. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
const PUSH = `  push(value) {
    const a = this.data;
    a.push(value);                         // 1. add at the end
    let i = a.length - 1;
    while (i > 0) {                        // 2. sift up
      const parent = Math.floor((i - 1) / 2);
      if (a[parent] <= a[i]) break;        // parent is smaller: the rule holds, stop
      [a[parent], a[i]] = [a[i], a[parent]];
      i = parent;
    }
  }`;

const SIFT_DOWN = `  siftDown(i) {
    const a = this.data;
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < a.length && a[left] < a[smallest]) smallest = left;
      if (right < a.length && a[right] < a[smallest]) smallest = right;
      if (smallest === i) return;          // both children are bigger: done
      [a[smallest], a[i]] = [a[i], a[smallest]];
      i = smallest;
    }
  }`;

const POP = `  pop() {
    const a = this.data;
    const top = a[0];
    const last = a.pop();                  // take the last item off
    if (a.length > 0) {
      a[0] = last;                         // move it to the top...
      this.siftDown(0);                    // ...and let it sink
    }
    return top;
  }`;

const HEAP = `class MinHeap {
  constructor() { this.data = []; }
  size() { return this.data.length; }
  peek() { return this.data[0]; }
${PUSH}
${POP}
${SIFT_DOWN}
}`;

// checks the heap rule: every parent <= its children
const VALID = `function isHeap(a) {
  for (let i = 1; i < a.length; i++) if (a[Math.floor((i - 1) / 2)] > a[i]) return false;
  return true;
}`;

export default {
  id: 'heaps',
  builds: ['dsa/trees', 'dsa/big-o'],
  title: 'Heaps and priority queues',
  goal: 'Build a min-heap with push and pop in O(log n), then use it for top-k and for merging sorted lists.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The problem: always give me the smallest',
      md: `
A **priority queue** is a queue where the next item out isn't the oldest, it's the **most important**: the cheapest flight, the earliest deadline, the closest node.

It needs two operations: **push** an item, and **pop** the smallest one. Brute-force options:

| Approach | push | pop smallest |
|---|---|---|
| unsorted array, scan for the min | O(1) | **O(n)** |
| sorted array, re-sort on every push | **O(n log n)** | O(1) |
| **heap** | **O(log n)** | **O(log n)** |

With a million items, log n is about 20. So a heap turns "a million steps per pop" into "about twenty".

JavaScript has **no built-in heap**. Python has \`heapq\`, Java has \`PriorityQueue\`, but in a JS interview you either write a small one or say "assume a min-heap with push and pop" and ask whether that's acceptable. Writing one is about 30 lines, and this lesson builds it.
`,
    },
    {
      type: 'read',
      title: 'A tree stored in an array',
      md: `
A **min-heap** is a binary tree (lesson 8) with one rule: **every parent is smaller than or equal to its children**. So the smallest item is always at the root.

It is *not* a binary search tree. Left and right aren't ordered against each other; only parent versus child matters.

The tree is kept **complete** (every row full except the last, which fills left to right), which lets you store it in a plain array with no node objects at all:

~~~
          1              index:  0  1  2  3  4  5
        /   \\            value: [1, 3, 2, 7, 4, 9]
       3     2
      / \\   /
     7   4 9
~~~

The parent and children of index \`i\` are found by arithmetic:

~~~js
const parent = (i) => Math.floor((i - 1) / 2);
const left = (i) => 2 * i + 1;
const right = (i) => 2 * i + 2;

const heap = [1, 3, 2, 7, 4, 9];
console.log("children of 3:", heap[left(1)], heap[right(1)]);
console.log("parent of 9:", heap[parent(5)]);
~~~

Because the tree is complete, its height is about log₂ n. Every heap operation walks one path from top to bottom (or back), which is where O(log n) comes from.
`,
    },
    {
      type: 'read',
      title: 'push: add at the end, sift up',
      md: `
To push, put the new value in the next free spot: the end of the array. That might break the rule (a small value under a big parent), so **sift up**: while the new value is smaller than its parent, swap them.

~~~js
class MinHeap {
  constructor() { this.data = []; }
${PUSH}
}

const h = new MinHeap();
for (const v of [5, 3, 8]) h.push(v);
console.log(h.data);
~~~

Pushing 3 after 5: 3 lands at index 1, its parent (index 0) is 5, so they swap. Pushing 8: its parent is 3, which is smaller, so it stays.

At most one swap per row, so push is **O(log n)**.
`,
    },
    {
      type: 'predict',
      title: 'A heap is not a sorted array',
      md: 'Push 5, 3, 8, then 1. Trace each sift up.',
      code: `class MinHeap {
  constructor() { this.data = []; }
${PUSH}
}

const h = new MinHeap();
for (const v of [5, 3, 8, 1]) h.push(v);
console.log(h.data);`,
      output: `[ 1, 3, 8, 5 ]`,
      explain: `
After 5, 3, 8 the array is \`[3, 5, 8]\`. Then 1 goes to index 3. Its parent is index 1 (\`5\`): swap, giving \`[3, 1, 8, 5]\`. Its new parent is index 0 (\`3\`): swap again, giving \`[1, 3, 8, 5]\`.

The common wrong answer is \`[1, 3, 5, 8]\`. A heap only promises **the root is the smallest**. The rest is "roughly sorted" and that's exactly why it's cheaper than keeping a sorted array.
`,
    },
    {
      type: 'read',
      title: 'pop: move the last item to the top, sift down',
      md: `
To pop, you want to return the root. But you can't leave a hole at index 0.

1. Save the root (the answer).
2. Take the **last** item off the array and put it at the root. The tree is still complete.
3. It's probably too big for the top, so **sift down**: swap it with its **smaller** child until both children are bigger.

~~~
pop from [1, 3, 8, 5]:
  answer = 1, move 5 to the top    → [5, 3, 8]
  children of 5 are 3 and 8; 3 is smaller, swap → [3, 5, 8]
  5 has no children now: stop
~~~

Why the **smaller** child? It's about to become the parent of the other one, so it must be the smaller of the two.

~~~
${POP}
~~~

Also **O(log n)**: one swap per row on the way down.
`,
    },
    {
      type: 'task',
      title: 'siftDown',
      md: `
The starter has a full \`MinHeap\` except \`siftDown(i)\`. Write it:

1. Work out \`left = 2 * i + 1\` and \`right = 2 * i + 2\`.
2. Let \`smallest = i\`. If \`left\` exists (\`left < a.length\`) and is smaller, set \`smallest = left\`. Same for \`right\`.
3. If \`smallest === i\`, stop. Otherwise swap \`a[i]\` and \`a[smallest]\`, set \`i = smallest\` and repeat.

~~~
push 5, 3, 8, 1, then pop four times   → 1, 3, 5, 8
~~~
`,
      starter: `class MinHeap {
  constructor() { this.data = []; }
  size() { return this.data.length; }
  peek() { return this.data[0]; }
${PUSH}
${POP}
  siftDown(i) {
    const a = this.data;
    // your code here
  }
}
`,
      tests: [
        { name: 'pops come out smallest first', code: `const h = new MinHeap();\nfor (const v of [5, 3, 8, 1]) h.push(v);\neq([h.pop(), h.pop(), h.pop(), h.pop()], [1, 3, 5, 8]);` },
        { name: 'the heap rule holds after a pop', code: `${VALID}\nconst h = new MinHeap();\nfor (const v of [9, 4, 7, 1, 8, 2, 6]) h.push(v);\nh.pop();\nassert(isHeap(h.data), "a parent is bigger than its child: " + h.data.join(", "));` },
        { name: 'popping the last item empties the heap', code: `const h = new MinHeap();\nh.push(4);\neq(h.pop(), 4);\neq(h.size(), 0);` },
      ],
      hint: 'Wrap steps 1–3 in `while (true) { ... }`. The swap is `[a[i], a[smallest]] = [a[smallest], a[i]];`.',
      solution: HEAP + '\n',
      explain: 'The usual bug is comparing only with the left child, or swapping with whichever child is checked last instead of the smaller one. Either can leave a parent bigger than its child.',
    },
    {
      type: 'read',
      title: 'Top k: keep a small heap',
      md: `
**"Find the k largest numbers."** The brute force sorts everything and takes the end: **O(n log n)**.

The heap trick: keep a **min-heap of size k**. Push each number; if the heap grows past k, pop the smallest. The heap always holds the k largest seen so far, and its root is the **weakest** of them, the one to kick out next.

~~~
k = 3, nums = [4, 1, 9, 7, 3, 8]
push 4         heap {4}
push 1         heap {1, 4}
push 9         heap {1, 4, 9}
push 7  → 4 items, pop 1   heap {4, 7, 9}
push 3  → pop 3            heap {4, 7, 9}
push 8  → pop 4            heap {7, 8, 9}
~~~

Each push and pop costs O(log k), so the total is **O(n log k)**. When k is small (top 10 of a million), that's far less work than sorting, and it only ever holds k items in memory.

Counter-intuitive but key: for the k **largest** you use a **min**-heap. It's the smallest of your keepers that you need quick access to.
`,
    },
    {
      type: 'task',
      title: 'topK',
      md: `
\`topK(nums, k)\` returns the \`k\` largest numbers, **biggest first**. The full \`MinHeap\` is in the starter.

~~~
topK([4, 1, 9, 7, 3, 8], 3)   → [9, 8, 7]
topK([5, 5, 2], 2)            → [5, 5]
~~~

1. Push each number; if \`heap.size() > k\`, \`heap.pop()\`.
2. Pop everything left into an array. It comes out smallest first.
3. Reverse it.
`,
      starter: `${HEAP}

function topK(nums, k) {
  const heap = new MinHeap();
  // your code here
}
`,
      tests: [
        { name: 'topK([4, 1, 9, 7, 3, 8], 3) is [9, 8, 7]', code: `eq(topK([4, 1, 9, 7, 3, 8], 3), [9, 8, 7]);` },
        { name: 'duplicates are kept', code: `eq(topK([5, 5, 2], 2), [5, 5]);` },
        { name: 'k equal to the length returns everything, biggest first', code: `eq(topK([2, 3, 1], 3), [3, 2, 1]);` },
      ],
      hint: 'After the push loop: `const out = []; while (heap.size() > 0) out.push(heap.pop()); return out.reverse();`',
      solution: `${HEAP}

function topK(nums, k) {
  const heap = new MinHeap();
  for (const n of nums) {
    heap.push(n);
    if (heap.size() > k) heap.pop(); // drop the weakest keeper
  }
  const out = [];
  while (heap.size() > 0) out.push(heap.pop());
  return out.reverse();
}
`,
    },
    {
      type: 'read',
      title: 'Merging sorted lists',
      md: `
**"Merge k sorted lists into one sorted list."** The brute force concatenates everything and sorts: O(N log N) for N total items, ignoring that each list is already sorted.

The heap idea: the next smallest item overall must be the **head** of one of the lists. Put each list's head in a min-heap. Pop the smallest, add it to the output, and push the **next** item from the same list.

The heap holds at most k items, so each step is O(log k), and the whole merge is **O(N log k)**.

The heap now stores \`[value, listIndex, itemIndex]\`, so it needs to compare by \`value\`. That's one change to \`MinHeap\`: take a compare function, like \`sort\` does, and use \`compare(x, y) < 0\` wherever it used \`x < y\`.

~~~js
class Heap {
  constructor(compare) { this.data = []; this.compare = compare; }
  size() { return this.data.length; }
  push(v) {
    const a = this.data; a.push(v);
    let i = a.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.compare(a[p], a[i]) <= 0) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop() {
    const a = this.data, top = a[0], last = a.pop();
    if (a.length === 0) return top;
    a[0] = last;
    let i = 0;
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let s = i;
      if (l < a.length && this.compare(a[l], a[s]) < 0) s = l;
      if (r < a.length && this.compare(a[r], a[s]) < 0) s = r;
      if (s === i) return top;
      [a[s], a[i]] = [a[i], a[s]]; i = s;
    }
  }
}

function mergeSorted(lists) {
  const heap = new Heap((x, y) => x[0] - y[0]);   // compare by value
  lists.forEach((list, li) => { if (list.length) heap.push([list[0], li, 0]); });
  const out = [];
  while (heap.size() > 0) {
    const [value, li, ii] = heap.pop();
    out.push(value);
    if (ii + 1 < lists[li].length) heap.push([lists[li][ii + 1], li, ii + 1]);
  }
  return out;
}

console.log(mergeSorted([[1, 4, 7], [2, 5], [0, 3, 6, 9]]));
~~~

The same "heap of frontier items" shape runs Dijkstra's shortest path, task schedulers and "the next k events" in a calendar.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'What does a min-heap guarantee about its array?',
          choices: ['The smallest item is at index 0, and every parent is <= its children', 'The array is sorted', 'Left children are smaller than right children'],
          answer: 0,
          explain: 'Only parent versus child is ordered. That weaker promise is what makes push and pop O(log n).',
          why: { 1: '`[1, 3, 8, 5]` is a valid heap and not sorted.', 2: 'That\'s closer to a binary search tree. Siblings in a heap can be in any order.' },
        },
        {
          q: 'In the array layout, where are the children of index `i`?',
          choices: ['`2 * i + 1` and `2 * i + 2`', '`i + 1` and `i + 2`', '`2 * i` and `2 * i + 1`'],
          answer: 0,
          explain: 'Index 0\'s children are 1 and 2, index 1\'s are 3 and 4, and so on.',
          why: { 1: 'That\'s just the next two items in the array, not the next row.', 2: 'That\'s the formula for arrays that start at index 1.' },
        },
        {
          q: 'To find the 10 **largest** of a million numbers with a heap, you keep:',
          choices: ['A min-heap of size 10', 'A max-heap of all million numbers', 'A min-heap of all million numbers'],
          answer: 0,
          explain: 'The root of the small min-heap is the weakest of your 10 keepers, so it\'s the one to evict. O(n log 10).',
          why: { 1: 'That works but costs O(n log n) and holds every number in memory.', 2: 'Its root is the smallest overall, which you don\'t want.' },
        },
        {
          q: 'When sifting down, which child do you swap with?',
          choices: ['The smaller child', 'The left child', 'The bigger child'],
          answer: 0,
          explain: 'The child you swap up becomes the parent of the other one, so it has to be the smaller.',
          why: { 1: 'If the right child is smaller, the left one would end up above a smaller value.', 2: 'Then the new parent would be bigger than its other child, breaking the rule.' },
        },
      ],
    },
  ],
};
