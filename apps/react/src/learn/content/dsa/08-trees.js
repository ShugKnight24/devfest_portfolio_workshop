// DSA course · lesson 8. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
const TREE = `const n = (value, left = null, right = null) => ({ value, left, right });
//        1
//       / \\
//      2   3
//     / \\
//    4   5
const root = n(1, n(2, n(4), n(5)), n(3));`;

export default {
  id: 'trees',
  builds: ['dsa/recursion', 'dsa/stacks-and-queues'],
  title: 'Trees: depth first and breadth first',
  goal: 'Walk a tree recursively in pre, in and post order, walk it level by level with a queue, and search a binary search tree in O(log n).',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'A tree is objects pointing at objects',
      md: `
This lesson reuses two earlier ideas: **recursion** (lesson 7) and the **queue** (lesson 5).

A **binary tree** is a set of **nodes**. Each node holds a value and points at up to two children, \`left\` and \`right\`. A missing child is \`null\`.

~~~js
const n = (value, left = null, right = null) => ({ value, left, right });

//        1          <- the root (the top)
//       / \\
//      2   3        <- 3 has no children: a leaf
//     / \\
//    4   5          <- leaves
const root = n(1, n(2, n(4), n(5)), n(3));

console.log(root.value);
console.log(root.left.value);
console.log(root.left.right.value);
console.log(root.right.left);
~~~

Words you will hear:

| Word | Meaning |
|---|---|
| **root** | the top node, where every walk starts |
| **leaf** | a node with no children |
| **depth** | how many nodes from the root down to the deepest leaf. This tree has depth 3 |
| **subtree** | any node plus everything under it. \`root.left\` is a whole tree of its own |

That last row is the key. **Every child is itself a tree**, so almost every tree function is recursive.
`,
    },
    {
      type: 'read',
      title: 'The recursive shape',
      md: `
Nearly every tree function has the same three lines:

1. **Base case:** an empty tree (\`null\`) has an easy answer.
2. **Ask both children** the same question (recursion).
3. **Combine** their answers with this node.

Here is "add up every value":

~~~js
${TREE}

function sumTree(node) {
  if (node === null) return 0;                  // 1. empty tree
  const leftSum = sumTree(node.left);           // 2. ask the children
  const rightSum = sumTree(node.right);
  return node.value + leftSum + rightSum;       // 3. combine
}

console.log(sumTree(root));
~~~

Each node is visited once, so this is **O(n)** for n nodes. The recursion uses call-stack space equal to the depth of the tree.
`,
    },
    {
      type: 'task',
      title: 'countNodes',
      md: `
Same shape as \`sumTree\`, but each node counts as **1** instead of its value.

\`countNodes(root)\` returns how many nodes are in the tree. For the tree above it returns \`5\`. An empty tree (\`null\`) has \`0\`.

Nodes look like \`{ value, left, right }\`, with \`null\` for a missing child.
`,
      starter: `function countNodes(node) {
  // your code here
}
`,
      tests: [
        { name: 'the 5-node tree gives 5', code: `${TREE}\neq(countNodes(root), 5);` },
        { name: 'an empty tree gives 0', code: `eq(countNodes(null), 0);` },
        { name: 'a single node gives 1', code: `eq(countNodes({ value: 7, left: null, right: null }), 1);` },
      ],
      hint: 'Copy `sumTree` and change `node.value` in the last line to `1`.',
      solution: `function countNodes(node) {
  if (node === null) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}
`,
    },
    {
      type: 'task',
      title: 'maxDepth',
      md: `
Now combine the children's answers differently. The depth of a tree is **1** (this node) plus the depth of its **deeper** child.

\`maxDepth(root)\` returns \`3\` for the tree above (1 → 2 → 4). \`maxDepth(null)\` is \`0\`.

\`Math.max(a, b)\` gives the bigger of two numbers.
`,
      starter: `function maxDepth(node) {
  // your code here
}
`,
      tests: [
        { name: 'the example tree has depth 3', code: `${TREE}\neq(maxDepth(root), 3);` },
        { name: 'an empty tree has depth 0', code: `eq(maxDepth(null), 0);` },
        { name: 'a single node has depth 1', code: `eq(maxDepth({ value: 1, left: null, right: null }), 1);` },
        { name: 'a lopsided chain of 4 has depth 4', code: `const n = (value, left = null, right = null) => ({ value, left, right });\neq(maxDepth(n(1, null, n(2, null, n(3, null, n(4))))), 4);` },
      ],
      hint: 'Base case first. Then `return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));`',
      solution: `function maxDepth(node) {
  if (node === null) return 0;
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}
`,
      explain: 'O(n): every node is visited once. A common slip is returning 1 for `null`, which makes every depth one too big.',
    },
    {
      type: 'read',
      title: 'Depth-first search: three orders',
      md: `
Walking a tree by going all the way down one branch before backing up is **depth-first search (DFS)**. The recursion does the backing up for you.

There are three classic orders. They differ only in **when you record the node**: before, between or after the two recursive calls.

~~~js
${TREE}

function walk(node, out, when) {
  if (node === null) return;
  if (when === "pre") out.push(node.value);   // me first, then children
  walk(node.left, out, when);
  if (when === "in") out.push(node.value);    // left, me, right
  walk(node.right, out, when);
  if (when === "post") out.push(node.value);  // children first, then me
}

for (const when of ["pre", "in", "post"]) {
  const out = [];
  walk(root, out, when);
  console.log(when, out);
}
~~~

When each one is useful:

- **Pre-order:** copying a tree, or printing it as an outline (parent above children).
- **In-order:** on a binary search tree it gives the values **sorted** (you'll see why below).
- **Post-order:** anything where children must be finished first, like deleting a folder (delete its files, then the folder) or computing sizes.
`,
    },
    {
      type: 'predict',
      title: 'In-order on a different tree',
      md: 'Left subtree, then the node, then the right subtree.',
      code: `const n = (value, left = null, right = null) => ({ value, left, right });
//      "B"
//     /   \\
//   "A"   "D"
//         /
//       "C"
const root = n("B", n("A"), n("D", n("C")));

function inOrder(node, out) {
  if (node === null) return out;
  inOrder(node.left, out);
  out.push(node.value);
  inOrder(node.right, out);
  return out;
}

console.log(inOrder(root, []));`,
      output: `[ "A", "B", "C", "D" ]`,
      explain: `
From \`B\`, go left first: \`A\` has no children, so record \`A\`. Back at \`B\`, record \`B\`. Then go right to \`D\`, which goes left first to \`C\`. Record \`C\`, then \`D\`.

The usual wrong answer is \`B, A, D, C\`. That's **pre-order**: it records the node before its left child.
`,
    },
    {
      type: 'task',
      title: 'preOrder',
      md: `
\`preOrder(root)\` returns an array of values, recording each node **before** its children.

For the 5-node tree it returns \`[1, 2, 4, 5, 3]\`. An empty tree gives \`[]\`.

Use a helper with an \`out\` array like \`inOrder\` in the last step, with the \`push\` moved.
`,
      starter: `function preOrder(root) {
  const out = [];
  function visit(node) {
    // your code here
  }
  visit(root);
  return out;
}
`,
      tests: [
        { name: 'the 5-node tree gives [1, 2, 4, 5, 3]', code: `${TREE}\neq(preOrder(root), [1, 2, 4, 5, 3]);` },
        { name: 'an empty tree gives []', code: `eq(preOrder(null), []);` },
      ],
      hint: 'Inside `visit`: return if `node` is `null`, then `out.push(node.value)`, then `visit(node.left)` and `visit(node.right)`.',
      solution: `function preOrder(root) {
  const out = [];
  function visit(node) {
    if (node === null) return;
    out.push(node.value);
    visit(node.left);
    visit(node.right);
  }
  visit(root);
  return out;
}
`,
    },
    {
      type: 'read',
      title: 'Breadth-first search: level by level with a queue',
      md: `
Sometimes you want the tree **row by row**: the root, then its children, then their children. That's **breadth-first search (BFS)**, and it uses the **queue** from lesson 5 instead of recursion.

The idea: put the root in a queue. Take the front node, record it, and put its children at the **back**. Children wait behind everything already in line, so a whole level finishes before the next starts.

To group by level, measure the queue's length at the start of each round. That many nodes is exactly one level.

~~~js
${TREE}

function levels(root) {
  if (root === null) return [];
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const size = queue.length;        // how many nodes are on this level
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift();     // take from the front
      level.push(node.value);
      if (node.left) queue.push(node.left);   // children go to the back
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}

console.log(levels(root));
~~~

Still **O(n)**: each node enters and leaves the queue once. (\`shift\` on a big array is itself O(n). For interview-sized trees nobody minds. For real scale, read with an index pointer instead.)

**DFS or BFS?** Use BFS when the question says "level", "row", "closest" or "fewest steps". Use DFS for everything else; it's shorter.
`,
    },
    {
      type: 'task',
      title: 'levelSums',
      md: `
Change one line of \`levels\`: instead of collecting each level's values, add them up.

\`levelSums(root)\` returns \`[1, 5, 9]\` for the 5-node tree (1, then 2 + 3, then 4 + 5). An empty tree gives \`[]\`.

The starter is \`levels\` from the last step, renamed.
`,
      starter: `function levelSums(root) {
  if (root === null) return [];
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const size = queue.length;
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.value);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
`,
      tests: [
        { name: 'the 5-node tree gives [1, 5, 9]', code: `${TREE}\neq(levelSums(root), [1, 5, 9]);` },
        { name: 'an empty tree gives []', code: `eq(levelSums(null), []);` },
      ],
      hint: 'Replace `const level = []` with `let sum = 0`, `level.push(node.value)` with `sum += node.value`, and push `sum` at the end of the round.',
      solution: `function levelSums(root) {
  if (root === null) return [];
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const size = queue.length;
    let sum = 0;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      sum += node.value;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(sum);
  }
  return result;
}
`,
    },
    {
      type: 'read',
      title: 'Binary search trees: a tree with a rule',
      md: `
To find a value in an ordinary tree you have to look everywhere: **O(n)**. That's the brute force.

A **binary search tree (BST)** adds one rule: for every node, everything in the **left** subtree is **smaller**, and everything in the **right** subtree is **bigger**.

~~~
        8
       / \\
      3   10
     / \\    \\
    1   6    14
~~~

Now a search can throw half the tree away at each step, like guessing a number with "higher" or "lower":

~~~js
const n = (value, left = null, right = null) => ({ value, left, right });
const bst = n(8, n(3, n(1), n(6)), n(10, null, n(14)));

function contains(node, target) {
  while (node !== null) {
    if (target === node.value) return true;
    node = target < node.value ? node.left : node.right;  // go one way only
  }
  return false;
}

console.log(contains(bst, 6), contains(bst, 7));
~~~

The cost is the height of the tree: **O(log n)** when it's balanced. If you insert already-sorted values (1, 2, 3, 4...) every node goes right and the "tree" is a chain, so it degrades to **O(n)**. Real libraries use self-balancing trees to prevent that.
`,
    },
    {
      type: 'predict',
      title: 'Why in-order matters on a BST',
      code: `const n = (value, left = null, right = null) => ({ value, left, right });
const bst = n(8, n(3, n(1), n(6)), n(10, null, n(14)));

const out = [];
function inOrder(node) {
  if (node === null) return;
  inOrder(node.left);
  out.push(node.value);
  inOrder(node.right);
}
inOrder(bst);
console.log(out);`,
      output: `[ 1, 3, 6, 8, 10, 14 ]`,
      explain: `
In-order visits everything smaller (left) before the node, and everything bigger (right) after it. On a BST that's sorted order, for free.

That's also a quick test of whether a tree **is** a valid BST: walk it in order and check that every value is bigger than the one before.
`,
    },
    {
      type: 'task',
      title: 'insert into a BST',
      md: `
\`insert(root, value)\` adds a new node in the right place and returns the root.

Walk down like \`contains\`: smaller goes left, bigger goes right. When the side you want is \`null\`, put the new node there. If the tree is empty (\`root\` is \`null\`), the new node **is** the root.

~~~
insert(null, 5)              → { value: 5, left: null, right: null }
insert(tree with 8, 3)       → 3 becomes 8's left child
~~~

Recursion makes this short: inserting into a subtree returns that subtree's (possibly new) root, so you can write \`node.left = insert(node.left, value)\`. Ignore duplicates (send them right; the tests don't use any).
`,
      starter: `function insert(node, value) {
  // your code here
}
`,
      tests: [
        { name: 'inserting into an empty tree makes a single node', code: `eq(insert(null, 5), { value: 5, left: null, right: null });` },
        {
          name: 'smaller values go left, bigger go right',
          code: `let root = null;
for (const v of [8, 3, 10]) root = insert(root, v);
eq(root.value, 8);
eq(root.left.value, 3);
eq(root.right.value, 10);`,
        },
        {
          name: 'in-order after inserting 8, 3, 10, 1, 6, 14 is sorted',
          code: `let root = null;
for (const v of [8, 3, 10, 1, 6, 14]) root = insert(root, v);
const out = [];
(function walk(n) { if (!n) return; walk(n.left); out.push(n.value); walk(n.right); })(root);
eq(out, [1, 3, 6, 8, 10, 14]);`,
        },
      ],
      hint: 'If `node` is `null`, return a new `{ value, left: null, right: null }`. Otherwise set `node.left = insert(node.left, value)` or `node.right = ...` depending on the comparison, then `return node`.',
      solution: `function insert(node, value) {
  if (node === null) return { value, left: null, right: null };
  if (value < node.value) node.left = insert(node.left, value);
  else node.right = insert(node.right, value);
  return node;
}
`,
      explain: 'The `return node` at the end matters: each call hands its subtree root back up, so the parent re-attaches the same child (or the brand-new one). O(height), like search.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'What should `maxDepth(null)` return?',
          choices: ['`0`', '`1`', '`null`'],
          answer: 0,
          explain: 'An empty tree has no nodes, so its depth is 0. A single node is then 1 + max(0, 0) = 1.',
          why: { 1: 'Then every depth comes out one too big.', 2: 'The parent does `1 + Math.max(...)`, which needs numbers.' },
        },
        {
          q: 'The question says "return the values of each **row** of the tree". Which walk?',
          choices: ['BFS with a queue', 'In-order DFS', 'Post-order DFS'],
          answer: 0,
          explain: 'Rows are levels, and a queue finishes one level before starting the next.',
          why: { 1: 'In-order goes deep into the left side first, mixing levels.', 2: 'Post-order also goes deep first and finishes the root last.' },
        },
        {
          q: 'Which order gives a BST\'s values sorted?',
          choices: ['In-order', 'Pre-order', 'Level order (BFS)'],
          answer: 0,
          explain: 'Left (smaller), node, right (bigger), at every node.',
          why: { 1: 'Pre-order records the root first, before the smaller values on its left.', 2: 'Levels mix small and big values on the same row.' },
        },
        {
          q: 'You insert 1, 2, 3, 4, 5 into an empty BST in that order. How long does searching for 5 take?',
          choices: ['O(n): the tree is a chain', 'O(log n): it\'s a BST', 'O(1)'],
          answer: 0,
          explain: 'Sorted inserts all go right, so the tree has height n. BST search is O(height), which is only O(log n) when balanced.',
          why: { 1: 'O(log n) needs a balanced tree. This one is a straight line.', 2: 'You still have to walk down from the root.' },
        },
      ],
    },
  ],
};
