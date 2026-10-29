// DSA course · lesson 5. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'stacks-and-queues',
  builds: ['dsa/big-o', 'dsa/hash-maps-and-sets', 'js/arrays'],
  title: 'Stacks and queues',
  goal: 'Use an array as a stack, solve matching-brackets problems with it, and build a queue that stays O(1) by moving an index instead of calling shift.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'A stack: last in, first out',
      md: `
A **stack** is a pile of plates. You put new plates on top, and you take plates off the top. The last one in is the first one out (**LIFO**).

A JavaScript array is already a stack, as long as you only touch **the end**. That end is the cheap end from lesson 2:

~~~js
const stack = [];
stack.push("a");   // put on top: O(1)
stack.push("b");
stack.push("c");
console.log(stack[stack.length - 1]); // peek at the top: O(1)
console.log(stack.pop());             // take off the top: O(1)
console.log(stack);
~~~

| Stack word | Array code |
|---|---|
| push | \`stack.push(x)\` |
| pop | \`stack.pop()\` (returns the item, \`undefined\` if empty) |
| peek | \`stack[stack.length - 1]\` |
| is empty? | \`stack.length === 0\` |

You use stacks every day: the browser back button, undo in an editor, and the **call stack** that tracks which function called which (lesson 7 is all about that one).
`,
    },
    {
      type: 'predict',
      title: 'Push, push, pop',
      code: `const stack = [];
stack.push(1);
stack.push(2);
console.log(stack.pop());
stack.push(3);
console.log(stack.pop());
console.log(stack.pop());
console.log(stack.pop());`,
      output: `2
3
1
undefined`,
      explain: `
- Push 1, push 2: the stack is \`[1, 2]\`, top is 2. Pop gives **2**.
- Push 3: \`[1, 3]\`. Pop gives **3**, then **1**.
- Popping an empty array gives \`undefined\`, not an error. When the problem cares, check \`stack.length === 0\` first.
`,
    },
    {
      type: 'task',
      title: 'reverseWithStack',
      md: `
Push every character onto a stack, then pop them all off. Because the last one in comes out first, they come out reversed.

\`reverseWithStack(str)\` returns the string backwards.

~~~
reverseWithStack("abc")  → "cba"
~~~

Two loops: a \`for...of\` that pushes, then \`while (stack.length > 0)\` that pops onto a result string.
`,
      starter: `function reverseWithStack(str) {
  const stack = [];
  let result = "";
  // your code here

  return result;
}
`,
      tests: [
        { name: 'reverseWithStack("abc") is "cba"', code: `eq(reverseWithStack("abc"), "cba");` },
        { name: 'an empty string stays empty', code: `eq(reverseWithStack(""), "");` },
        { name: 'one letter stays the same', code: `eq(reverseWithStack("x"), "x");` },
      ],
      hint: '`for (const ch of str) stack.push(ch);` then `while (stack.length > 0) result += stack.pop();`',
      solution: `function reverseWithStack(str) {
  const stack = [];
  let result = "";
  for (const ch of str) stack.push(ch);
  while (stack.length > 0) result += stack.pop();
  return result;
}
`,
    },
    {
      type: 'read',
      title: 'Valid parentheses: brute force first',
      md: `
**Is a string of brackets balanced?** \`"(())()"\` is; \`"(()"\` and \`")("\` are not.

A brute-force idea: an innermost pair \`()\` is always next to each other, so keep deleting \`"()"\` until nothing changes. If the string ends up empty, it was balanced.

~~~js
function isBalancedBrute(s) {
  let prev = null;
  while (s !== prev) {
    prev = s;
    s = s.replace("()", ""); // removes the first "()" it finds
  }
  return s === "";
}
console.log(isBalancedBrute("(())()"), isBalancedBrute("(()"));
~~~

It works, but each \`replace\` scans and rebuilds the string (O(n)), and you may need up to n/2 of them: **O(n²)**.

**The stack version.** Read left to right:

- an opener \`(\` goes **on** the stack: it's waiting for its partner;
- a closer \`)\` must match the **most recent** unmatched opener, which is the top of the stack. If the stack is empty, there's nothing to close: invalid. Otherwise pop it.
- at the end, anything still on the stack never got closed: invalid.

"Most recent first" is exactly LIFO. One pass: **O(n) time, O(n) space.**
`,
    },
    {
      type: 'task',
      title: 'isBalanced: one kind of bracket',
      md: `
\`isBalanced(s)\` gets a string of only \`(\` and \`)\`. Return \`true\` if it's balanced.

~~~
isBalanced("(())()")  → true
isBalanced("(()")     → false   (one left open)
isBalanced("())")     → false   (closes nothing)
~~~

Follow the three rules from the previous step.
`,
      starter: `function isBalanced(s) {
  const stack = [];
  for (const ch of s) {
    // your code here
  }
  return true;
}
`,
      tests: [
        { name: 'isBalanced("(())()") is true', code: `eq(isBalanced("(())()"), true);` },
        { name: 'an unclosed opener gives false', code: `eq(isBalanced("(()"), false);` },
        { name: 'a closer with nothing open gives false', code: `eq(isBalanced("())"), false);` },
        { name: 'an empty string is balanced', code: `eq(isBalanced(""), true);` },
      ],
      hint: 'Inside the loop: `if (ch === "(") stack.push(ch); else if (stack.length === 0) return false; else stack.pop();`. After the loop, return `stack.length === 0` instead of `true`.',
      solution: `function isBalanced(s) {
  const stack = [];
  for (const ch of s) {
    if (ch === "(") stack.push(ch);
    else if (stack.length === 0) return false;
    else stack.pop();
  }
  return stack.length === 0;
}
`,
      explain: 'For one bracket type you could get away with a counter instead of a stack. The stack earns its place in the next task, when the type of bracket matters.',
    },
    {
      type: 'task',
      title: 'isValid: three kinds of bracket',
      md: `
Now \`()\`, \`[]\` and \`{}\`. A closer must match the **type** of the opener on top. \`"([)]"\` is invalid, because \`)\` arrives while \`[\` is on top.

A Map (lesson 3) from each closer to its opener keeps it short:

~~~
const pairs = new Map([[")", "("], ["]", "["], ["}", "{"]]);
pairs.get("]")  → "["
pairs.has("(")  → false   (an opener isn't a key)
~~~

\`isValid(s)\` returns \`true\` or \`false\`.

~~~
isValid("{[()]}")  → true
isValid("([)]")    → false
~~~
`,
      starter: `function isValid(s) {
  const pairs = new Map([[")", "("], ["]", "["], ["}", "{"]]);
  const stack = [];
  for (const ch of s) {
    // your code here
  }
  return true;
}
`,
      tests: [
        { name: 'isValid("{[()]}") is true', code: `eq(isValid("{[()]}"), true);` },
        { name: 'isValid("()[]{}") is true', code: `eq(isValid("()[]{}"), true);` },
        { name: 'crossed brackets give false', code: `eq(isValid("([)]"), false);` },
        { name: 'a leftover opener gives false', code: `eq(isValid("(["), false);` },
        { name: 'a closer on an empty stack gives false', code: `eq(isValid("]"), false);` },
      ],
      hint: 'If `pairs.has(ch)`, it\'s a closer: `if (stack.pop() !== pairs.get(ch)) return false;`. Otherwise push it. Return `stack.length === 0` at the end.',
      solution: `function isValid(s) {
  const pairs = new Map([[")", "("], ["]", "["], ["}", "{"]]);
  const stack = [];
  for (const ch of s) {
    if (pairs.has(ch)) {
      if (stack.pop() !== pairs.get(ch)) return false; // empty pop gives undefined, which never matches
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}
`,
    },
    {
      type: 'read',
      title: 'A queue: first in, first out',
      md: `
A **queue** is a line at a shop: people join at the back and leave from the front. First in, first out (**FIFO**). You'll need one for breadth-first search later in the track, and for any "process jobs in order" problem.

The obvious array version uses \`push\` to join and \`shift\` to leave:

~~~js
const queue = [];
queue.push("a");
queue.push("b");
queue.push("c");
console.log(queue.shift()); // "a" leaves first
console.log(queue);
~~~

**Why \`shift\` is O(n).** An array's indexes must stay 0, 1, 2, ... After removing index 0, the engine moves \`"b"\` to index 0, \`"c"\` to index 1, and so on: one move per remaining item. On a queue of a million jobs, every single \`shift\` moves a million items, so draining it is O(n²).

For small queues nobody notices. In an interview, using \`shift\` in a BFS on a big graph is a common thing to be asked about, so know the fix.
`,
    },
    {
      type: 'read',
      title: 'The fix: move an index, not the items',
      md: `
Don't remove anything from the front. Keep a number \`head\` that points at the current front, and move it forward:

~~~js
const items = [];
let head = 0;

items.push("a");             // enqueue: O(1)
items.push("b");
items.push("c");

console.log(items[head]);    // dequeue "a"...
head++;                      // ...by moving the pointer: O(1)
console.log(items[head]);    // dequeue "b"
head++;

console.log(items.length - head); // how many are still waiting
~~~

The items before \`head\` are still in the array, just ignored. That's the trade: **O(1) per operation** for some leftover memory. (Real implementations clear them out now and then, or use a ring buffer. You don't need that in an interview; mentioning it is a bonus.)

You can wrap it in a class so the rest of your code just says \`queue.enqueue(x)\` and \`queue.dequeue()\`. That's the next task.
`,
    },
    {
      type: 'task',
      title: 'Queue.dequeue',
      md: `
\`enqueue\` and \`size\` are written. Write \`dequeue()\`: if the queue is empty return \`undefined\`; otherwise return the item at \`this.head\` and move \`this.head\` forward by one.

~~~
const q = new Queue();
q.enqueue("a");
q.enqueue("b");
q.dequeue()  → "a"
q.size()     → 1
~~~

\`this.items\` and \`this.head\` are the \`items\` and \`head\` from the previous step, living inside the object.
`,
      starter: `class Queue {
  constructor() {
    this.items = [];
    this.head = 0;
  }
  enqueue(x) {
    this.items.push(x);
  }
  size() {
    return this.items.length - this.head;
  }
  dequeue() {
    // your code here
  }
}
`,
      tests: [
        { name: 'items come out in the order they went in', code: `const q = new Queue(); q.enqueue("a"); q.enqueue("b"); q.enqueue("c"); eq([q.dequeue(), q.dequeue(), q.dequeue()], ["a", "b", "c"]);` },
        { name: 'size goes down after a dequeue', code: `const q = new Queue(); q.enqueue(1); q.enqueue(2); q.dequeue(); eq(q.size(), 1);` },
        { name: 'dequeue on an empty queue gives undefined', code: `const q = new Queue(); eq(q.dequeue(), undefined); eq(q.size(), 0);` },
        { name: 'it does not use shift', code: `const q = new Queue(); q.enqueue(1); q.enqueue(2); q.dequeue(); eq(q.items.length, 2, "the array should keep its items; only head moves");` },
      ],
      hint: '`if (this.size() === 0) return undefined;` then `const x = this.items[this.head]; this.head++; return x;`',
      solution: `class Queue {
  constructor() {
    this.items = [];
    this.head = 0;
  }
  enqueue(x) {
    this.items.push(x);
  }
  size() {
    return this.items.length - this.head;
  }
  dequeue() {
    if (this.size() === 0) return undefined;
    const x = this.items[this.head];
    this.head++;
    return x;
  }
}
`,
      explain: 'Checking `size()` first matters: without it, an empty dequeue would move `head` past the end, and `size()` would go negative.',
    },
    {
      type: 'task',
      title: 'typed: a stack in disguise',
      md: `
A combining task. In \`typed(s)\`, the character \`#\` is a backspace: it deletes the character typed just before it (if there is one). Return what's left on screen.

~~~
typed("ab#c")   → "ac"
typed("a##b")   → "b"
typed("abc##")  → "a"
~~~

"Undo the most recent one" is the stack signal. Push normal characters; on \`#\`, pop. At the end, \`stack.join("")\` turns the array back into a string.
`,
      starter: `function typed(s) {
  // your code here
}
`,
      tests: [
        { name: 'typed("ab#c") is "ac"', code: `eq(typed("ab#c"), "ac");` },
        { name: 'typed("abc##") is "a"', code: `eq(typed("abc##"), "a");` },
        { name: 'a backspace on nothing does nothing', code: `eq(typed("a##b"), "b");` },
      ],
      hint: 'Make `const stack = []`, loop `for (const ch of s)`, then `if (ch === "#") stack.pop(); else stack.push(ch);`. Return `stack.join("")`.',
      solution: `function typed(s) {
  const stack = [];
  for (const ch of s) {
    if (ch === "#") stack.pop(); // pop on an empty array just returns undefined
    else stack.push(ch);
  }
  return stack.join("");
}
`,
      explain: 'O(n) time, O(n) space. The brute force rebuilds the string with `slice` on every `#`, which is O(n²).',
    },
    {
      type: 'read',
      title: 'How to spot a stack or a queue in an interview question',
      md: `
**Stack** (LIFO): the most recent unfinished thing is the one that matters.

- brackets, tags, "valid", "balanced", "nested" → push openers, pop on closers;
- "undo", "backspace", "go back" → push actions, pop to undo;
- "next greater element", "daily temperatures" → a stack of items still waiting for an answer;
- anything recursive can be rewritten with an explicit stack (lesson 7).

**Queue** (FIFO): handle things in the order they arrived.

- "process in order", "first come first served", "task scheduler";
- "level by level", "shortest number of steps" in a grid or graph → breadth-first search, coming later in the track.

How to say it: "I'll use an array as a stack, push and pop at the end, both O(1), so the whole scan is O(n)." For a queue: "I'll keep a head index instead of calling \`shift\`, since \`shift\` is O(n) and would make this O(n²)."
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "Why does a stack solve bracket matching?",
          choices: ["Each closer must match the most recent unmatched opener, and the top of a stack is the most recent item", "Stacks sort the brackets", "A stack counts how many of each bracket there are"],
          answer: 0,
          explain: "Most recent first is exactly last in, first out.",
          why: { 1: "Stacks keep insertion order; they don't sort.", 2: "Counting alone can't tell `\"([)]\"` from `\"([])\"`; the order matters." },
        },
        {
          q: "Why is `queue.shift()` O(n)?",
          choices: ["Every remaining item moves down one index", "It searches for the first item", "It copies the array"],
          answer: 0,
          explain: "Indexes must stay 0, 1, 2..., so removing index 0 shifts everything after it.",
          why: { 1: "The first item is at index 0; finding it is O(1). Moving the rest is the cost.", 2: "It changes the same array; no copy is made." },
        },
        {
          q: "What does this print?\n\n~~~\nconst s = [];\ns.push(\"x\");\ns.push(\"y\");\ns.pop();\ns.push(\"z\");\nconsole.log(s);\n~~~",
          choices: ["`[ \"x\", \"z\" ]`", "`[ \"y\", \"z\" ]`", "`[ \"x\", \"y\", \"z\" ]`"],
          answer: 0,
          explain: "`pop` removed `\"y\"`, the last one pushed. Then `\"z\"` went on top.",
          why: { 1: "`pop` takes from the end, not the front: `\"x\"` stays.", 2: "`pop` really removes `\"y\"`." },
        },
        {
          q: "In `isValid`, what happens with `\"]\"` (a closer and nothing on the stack)?",
          choices: ["`stack.pop()` returns `undefined`, which doesn't equal `\"[\"`, so it returns false", "It throws an error", "It returns true because the stack is empty at the end"],
          answer: 0,
          explain: "Popping an empty array is safe in JavaScript; the mismatch catches it.",
          why: { 1: "`pop` on an empty array returns `undefined`; no error.", 2: "The function returns `false` inside the loop before it gets to the end." },
        },
      ],
    },
  ],
};
