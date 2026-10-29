// DSA course · lesson 6. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
// Tests build lists with a local helper: listOf([1, 2]) → { value: 1, next: { value: 2, next: null } }
const LIST = 'const listOf = (arr) => arr.reduceRight((next, value) => ({ value, next }), null);\n';

export default {
  id: 'linked-lists',
  builds: ['dsa/big-o', 'dsa/arrays-two-pointers', 'js/objects'],
  title: 'Linked lists',
  goal: 'Build a list out of objects that point at each other, walk it, insert into it, reverse it, and use fast and slow pointers.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Nodes and pointers',
      md: `
An array keeps items in a numbered row (lesson 2). A **linked list** keeps each item in its own small object, a **node**, and each node holds a reference to the next one:

~~~js
const c = { value: "c", next: null }; // null means "the end"
const b = { value: "b", next: c };
const a = { value: "a", next: b };    // a is the "head": where the list starts

console.log(a.value);
console.log(a.next.value);
console.log(a.next.next.value);
~~~

\`next\` doesn't hold a copy of the next node; it **points at** it. That's the "objects are references" idea from JavaScript lesson 7, used on purpose.

Why bother, when arrays exist?

| | Array | Linked list |
|---|---|---|
| read item \`i\` | O(1): jump to the index | O(n): follow \`next\` i times |
| add at the front | O(n): everything shifts | O(1): one new node points at the old head |
| remove at the front | O(n) | O(1): \`head = head.next\` |

In JavaScript you rarely build one for real work. Interviewers ask about them because they test whether you can keep track of references without losing any.
`,
    },
    {
      type: 'predict',
      title: 'Following the pointers',
      code: `const list = { value: 1, next: { value: 2, next: { value: 3, next: null } } };

console.log(list.next.value);
console.log(list.next.next.next);
console.log(list.next.next.next.value);`,
      throws: true,
      output: `2
null
TypeError: Cannot read properties of null (reading 'value')`,
      explain: `
- \`list.next\` is the node holding 2.
- Three \`next\`s from the head walks off the end: \`null\`.
- Asking \`null\` for \`.value\` throws a **TypeError**. This is the number-one linked list bug: reading \`.next\` or \`.value\` on a node that turned out to be \`null\`.

Every loop you write in this lesson checks "is this node \`null\`?" before using it.
`,
    },
    {
      type: 'read',
      title: 'Walking the list',
      md: `
You can't use \`for...of\` or an index. Instead, keep a variable pointing at the **current** node, and move it along until it falls off the end:

~~~js
const list = { value: 1, next: { value: 2, next: { value: 3, next: null } } };

let cur = list;           // start at the head
while (cur !== null) {    // stop after the last node
  console.log(cur.value); // do something with this node
  cur = cur.next;         // step forward
}
~~~

Memorise this shape; every task below is a version of it. The step \`cur = cur.next\` is the one people forget, and then the loop never ends.

Building lists by hand gets tiring, so here's a helper that turns an array into a list. It's \`reduceRight\` (like \`reduce\` from JavaScript lesson 11, but starting from the end), building the list back to front:

~~~js
const fromArray = (arr) => arr.reduceRight((next, value) => ({ value, next }), null);
console.log(fromArray([1, 2]));
~~~

The tests in this lesson use the same helper to make lists for your functions.
`,
    },
    {
      type: 'task',
      title: 'toArray',
      md: `
\`toArray(head)\` walks the list and returns its values in an array.

~~~
toArray({ value: 1, next: { value: 2, next: null } })  → [1, 2]
toArray(null)                                          → []
~~~

Use the walking loop from the previous step, pushing \`cur.value\` instead of logging it.
`,
      starter: `function toArray(head) {
  const values = [];
  // walk the list here

  return values;
}
`,
      tests: [
        { name: 'a three-node list gives [1, 2, 3]', code: LIST + `eq(toArray(listOf([1, 2, 3])), [1, 2, 3]);` },
        { name: 'an empty list (null) gives []', code: `eq(toArray(null), []);` },
        { name: 'one node gives one value', code: LIST + `eq(toArray(listOf(["x"])), ["x"]);` },
      ],
      hint: '`let cur = head; while (cur !== null) { values.push(cur.value); cur = cur.next; }`',
      solution: `function toArray(head) {
  const values = [];
  let cur = head;
  while (cur !== null) {
    values.push(cur.value);
    cur = cur.next;
  }
  return values;
}
`,
    },
    {
      type: 'task',
      title: 'listLength',
      md: `
\`listLength(head)\` counts the nodes. A list doesn't store its length, so this is O(n) (an array's \`.length\` is O(1)).

~~~
listLength(listOf([4, 5, 6]))  → 3
listLength(null)               → 0
~~~
`,
      starter: `function listLength(head) {
  // your code here
}
`,
      tests: [
        { name: 'three nodes give 3', code: LIST + `eq(listLength(listOf([4, 5, 6])), 3);` },
        { name: 'null gives 0', code: `eq(listLength(null), 0);` },
      ],
      hint: 'Same loop, with `let count = 0` and `count++` instead of push. Return `count`.',
      solution: `function listLength(head) {
  let count = 0;
  let cur = head;
  while (cur !== null) {
    count++;
    cur = cur.next;
  }
  return count;
}
`,
    },
    {
      type: 'read',
      title: 'Inserting: the front is cheap, the end is not',
      md: `
**At the front:** make a new node whose \`next\` is the old head. It becomes the new head. Nothing else moves: **O(1)**.

~~~js
let head = { value: 2, next: null };
head = { value: 1, next: head };  // the new node points at the old head
console.log(head);
~~~

**At the end:** you have to walk to the last node (the one whose \`next\` is \`null\`) and hang the new node there: **O(n)**. Note the loop condition is different: you stop **on** the last node, not after it.

~~~js
const head = { value: 1, next: { value: 2, next: null } };
let cur = head;
while (cur.next !== null) cur = cur.next;  // stop ON the last node
cur.next = { value: 3, next: null };
console.log(head.next.next.value);
~~~

The edge case to always say out loud: **an empty list**. If \`head\` is \`null\`, \`cur.next\` throws. Check for it first.
`,
    },
    {
      type: 'task',
      title: 'prepend',
      md: `
\`prepend(head, value)\` adds a node at the front and returns the **new head**.

~~~
prepend(listOf([2, 3]), 1)  → the list 1 → 2 → 3
prepend(null, 1)            → the list 1
~~~

One line.
`,
      starter: `function prepend(head, value) {
  // your code here
}
`,
      tests: [
        { name: 'prepend(2 → 3, 1) gives 1 → 2 → 3', code: LIST + `const h = prepend(listOf([2, 3]), 1); eq(h.value, 1); eq(h.next.value, 2); eq(h.next.next.value, 3);` },
        { name: 'prepend on an empty list gives one node', code: `eq(prepend(null, 1), { value: 1, next: null });` },
        { name: 'the old head is reused, not copied', code: LIST + `const old = listOf([2]); assert(prepend(old, 1).next === old, "the new node's next should be the old head itself");` },
      ],
      hint: '`return { value, next: head };`',
      solution: `function prepend(head, value) {
  return { value, next: head };
}
`,
    },
    {
      type: 'task',
      title: 'append',
      md: `
\`append(head, value)\` adds a node at the end and returns the head.

~~~
append(listOf([1, 2]), 3)  → the list 1 → 2 → 3
append(null, 1)            → the list 1
~~~

Handle the empty list first, then walk to the last node.
`,
      starter: `function append(head, value) {
  const node = { value, next: null };
  // 1. if the list is empty, the new node is the whole list

  // 2. otherwise walk to the last node and attach it

  return head;
}
`,
      tests: [
        { name: 'append(1 → 2, 3) gives 1 → 2 → 3', code: LIST + `const h = append(listOf([1, 2]), 3); eq(h.next.next, { value: 3, next: null });` },
        { name: 'it returns the same head', code: LIST + `const h = listOf([1]); assert(append(h, 2) === h, "return the original head");` },
        { name: 'append on an empty list gives one node', code: `eq(append(null, 1), { value: 1, next: null });` },
      ],
      hint: '`if (head === null) return node;` then `let cur = head; while (cur.next !== null) cur = cur.next; cur.next = node;`',
      solution: `function append(head, value) {
  const node = { value, next: null };
  if (head === null) return node;

  let cur = head;
  while (cur.next !== null) cur = cur.next;
  cur.next = node;

  return head;
}
`,
    },
    {
      type: 'read',
      title: 'Reversing: three pointers',
      md: `
**Brute force:** copy the values into an array, reverse it, build a new list. O(n) time, but O(n) extra space.

**In place:** walk once and flip each arrow to point backwards. The trick is not losing the rest of the list when you flip. You need three variables:

- \`prev\`: the part already reversed (starts as \`null\`),
- \`cur\`: the node you're flipping,
- \`next\`: saved **before** you flip, so you can keep going.

~~~js
let cur = { value: 1, next: { value: 2, next: { value: 3, next: null } } };
let prev = null;

while (cur !== null) {
  const next = cur.next; // 1. remember the rest
  cur.next = prev;       // 2. flip the arrow
  prev = cur;            // 3. prev moves up
  cur = next;            // 4. cur moves up
}
console.log(prev);       // prev is the new head
~~~

| Round | \`cur\` | after the flip | \`prev\` (reversed part) |
|---|---|---|---|
| 1 | 1 | 1 → null | 1 |
| 2 | 2 | 2 → 1 | 2 → 1 |
| 3 | 3 | 3 → 2 | 3 → 2 → 1 |
| end | null | | return \`prev\` |

**O(n) time, O(1) space.** The common mistake is flipping before saving \`next\`: then \`cur.next\` already points backwards and you lose the rest of the list.
`,
    },
    {
      type: 'task',
      title: 'reverseList',
      md: `
\`reverseList(head)\` reverses the list in place and returns the new head.

~~~
reverseList(listOf([1, 2, 3]))  → the list 3 → 2 → 1
reverseList(null)               → null
~~~

Write the four lines inside the loop in order: save, flip, move \`prev\`, move \`cur\`.
`,
      starter: `function reverseList(head) {
  let prev = null;
  let cur = head;
  // your loop here

  return prev;
}
`,
      tests: [
        { name: '1 → 2 → 3 becomes 3 → 2 → 1', code: LIST + `eq(reverseList(listOf([1, 2, 3])), listOf([3, 2, 1]));` },
        { name: 'one node stays the same', code: LIST + `eq(reverseList(listOf([7])), listOf([7]));` },
        { name: 'an empty list gives null', code: `eq(reverseList(null), null);` },
        { name: 'it reuses the same nodes (in place)', code: LIST + `const h = listOf([1, 2]); const second = h.next; assert(reverseList(h) === second, "the old last node should be the new head");` },
      ],
      hint: '`while (cur !== null) { const next = cur.next; cur.next = prev; prev = cur; cur = next; }`',
      solution: `function reverseList(head) {
  let prev = null;
  let cur = head;
  while (cur !== null) {
    const next = cur.next;
    cur.next = prev;
    prev = cur;
    cur = next;
  }
  return prev;
}
`,
    },
    {
      type: 'read',
      title: 'Fast and slow pointers',
      md: `
Two pointers again (lesson 2), but on a list: **slow** moves one node per step, **fast** moves two.

**Finding the middle.** When fast reaches the end, slow has gone half as far: it's in the middle. One pass, no need to count the length first.

~~~js
const head = { value: 1, next: { value: 2, next: { value: 3, next: { value: 4, next: { value: 5, next: null } } } } };
let slow = head;
let fast = head;
while (fast !== null && fast.next !== null) {
  slow = slow.next;
  fast = fast.next.next;
}
console.log(slow.value);
~~~

The loop condition checks **both** \`fast\` and \`fast.next\`, because \`fast.next.next\` would throw if \`fast.next\` were \`null\`.

**Detecting a cycle.** In a broken list, the last node points back to an earlier one, so walking it never ends. The brute force keeps a \`Set\` of visited nodes (lesson 3) and stops when it sees one twice: O(n) time, O(n) space.

The fast/slow version needs no Set. If there's a loop, fast laps around and eventually lands **on** slow, like a faster runner on a circular track. If there isn't, fast reaches \`null\`. **O(n) time, O(1) space.**
`,
    },
    {
      type: 'task',
      title: 'middleValue',
      md: `
\`middleValue(head)\` returns the value of the middle node. For an even length, return the **second** of the two middle nodes (that's what the loop naturally gives you).

~~~
middleValue(listOf([1, 2, 3, 4, 5]))  → 3
middleValue(listOf([1, 2, 3, 4]))     → 3
~~~
`,
      starter: `function middleValue(head) {
  let slow = head;
  let fast = head;
  // your loop here

  return slow.value;
}
`,
      tests: [
        { name: 'odd length: 1..5 gives 3', code: LIST + `eq(middleValue(listOf([1, 2, 3, 4, 5])), 3);` },
        { name: 'even length: 1..4 gives the second middle, 3', code: LIST + `eq(middleValue(listOf([1, 2, 3, 4])), 3);` },
        { name: 'one node gives its own value', code: LIST + `eq(middleValue(listOf([9])), 9);` },
      ],
      hint: '`while (fast !== null && fast.next !== null) { slow = slow.next; fast = fast.next.next; }`',
      solution: `function middleValue(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow.value;
}
`,
    },
    {
      type: 'task',
      title: 'hasCycle',
      md: `
\`hasCycle(head)\` returns \`true\` if following \`next\` ever loops back, and \`false\` if it reaches \`null\`.

Use fast and slow. Same loop as \`middleValue\`, plus one check after both pointers move: \`if (slow === fast) return true;\`. If the loop ends, there was an end, so no cycle.

~~~
a → b → c → null        → false
a → b → c → (back to b) → true
~~~

Compare nodes with \`===\` (same object), not by value: two different nodes can hold the same value.
`,
      starter: `function hasCycle(head) {
  let slow = head;
  let fast = head;
  // your loop here

}
`,
      tests: [
        { name: 'a normal list has no cycle', code: LIST + `eq(hasCycle(listOf([1, 2, 3])), false);` },
        { name: 'last node pointing back to the second is a cycle', code: LIST + `const h = listOf([1, 2, 3]); h.next.next.next = h.next; eq(hasCycle(h), true);` },
        { name: 'a node pointing at itself is a cycle', code: `const n = { value: 1, next: null }; n.next = n; eq(hasCycle(n), true);` },
        { name: 'an empty list has no cycle', code: `eq(hasCycle(null), false);` },
      ],
      hint: 'Inside `while (fast !== null && fast.next !== null)`: move slow one, fast two, then `if (slow === fast) return true;`. After the loop, `return false;`.',
      solution: `function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
`,
      explain: 'The check comes **after** moving: both start at `head`, so checking first would report a cycle on every list.',
    },
    {
      type: 'read',
      title: 'How to spot a linked list technique in an interview question',
      md: `
The question usually says "linked list" outright, and gives you a \`ListNode\` with \`val\` and \`next\` (LeetCode uses \`val\`; this lesson used \`value\`). The skill is picking the move:

- **"reverse"** (the whole list or part of it) → prev / cur / next.
- **"middle"**, "is it a palindrome", "split in half" → fast and slow.
- **"cycle"**, "loop", "where does the cycle start" → fast and slow (or a Set, if O(n) space is fine).
- **"remove the nth from the end"** → two pointers with a gap of n between them.
- **"merge two sorted lists"** → walk both, always attach the smaller node.

Habits that prevent most bugs:

1. Ask "what if \`head\` is \`null\`?" before writing anything.
2. Before \`x.next\`, be sure \`x\` isn't \`null\`.
3. Save \`cur.next\` before you change it.
4. Draw three boxes and arrows on paper and trace one loop round.

How to say it: "Reading by position is O(n) here, so I'll do it in one pass with two pointers: O(n) time, O(1) extra space."
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "Which is O(1) on a linked list but O(n) on an array?",
          choices: ["Adding an item at the front", "Reading the item at index i", "Finding out how many items there are"],
          answer: 0,
          explain: "A new node just points at the old head; no other node moves.",
          why: { 1: "That's the reverse: O(1) for arrays, O(n) for lists, because you have to follow `next` i times.", 2: "An array stores `.length`; a list has to be counted." },
        },
        {
          q: "In `reverseList`, why save `const next = cur.next` first?",
          choices: ["Flipping `cur.next` to `prev` would lose the rest of the list", "To make a copy of the node", "Because `next` is a reserved word"],
          answer: 0,
          explain: "After `cur.next = prev`, the only reference to the rest of the list is the one you saved.",
          why: { 1: "No copy is made; `next` points at the same node.", 2: "`next` is an ordinary variable name." },
        },
        {
          q: "Why does the fast/slow loop check `fast !== null && fast.next !== null`?",
          choices: ["`fast.next.next` throws if `fast.next` is `null`", "To make the loop run twice as fast", "It only needs the first check; the second is style"],
          answer: 0,
          explain: "Fast jumps two nodes, so both the node it's on and the next one must exist.",
          why: { 1: "The checks are about safety, not speed.", 2: "On an even-length list, `fast.next` is `null` at the end, and reading `.next` on it throws." },
        },
        {
          q: "What does this print?\n\n~~~\nlet head = { value: 2, next: null };\nhead = { value: 1, next: head };\nconsole.log(head.next.value);\n~~~",
          choices: ["`2`", "`1`", "It throws, because `head` refers to itself"],
          answer: 0,
          explain: "The right-hand side is evaluated first, using the **old** head. Then `head` is pointed at the new node.",
          why: { 1: "`head.value` is 1; `head.next` is the old node holding 2.", 2: "The new node points at the old head object, not at itself." },
        },
      ],
    },
  ],
};
