// Challenges · lesson 3. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'valid-parentheses',
  builds: ['challenges/two-sum', 'js/strings', 'js/arrays', 'dsa/stacks-and-queues'],
  title: 'Valid parentheses: last in, first out',
  goal: 'Recognise a stack problem, check brackets with an array as a stack, and report where the first mistake is.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The question',
      md: `
> "Given a string made of \`()[]{}\`, return \`true\` if every bracket is closed by the right kind, in the right order."

~~~
isValid("([]{})")  → true
isValid("(]")      → false     wrong kind
isValid("([)]")    → false     right kinds, wrong order
isValid("((")      → false     never closed
~~~

Code editors, JSON parsers and linters all do this check. The tool is a **stack**: an array where you only add to and take from the end. You'll also reuse the lookup object from the last two lessons, to know which opener each closer needs.
`,
    },
    {
      type: 'check',
      title: 'Before you code: ask and spot',
      items: [
        {
          q: 'What should `isValid("")` return?',
          choices: ['`true`: nothing is left unclosed', '`false`: there are no brackets', 'Throw an error'],
          answer: 0,
          explain: 'An empty string has no mistakes. Confirm it with the interviewer, but `true` is the usual answer.',
          why: {
            1: '"No brackets" is not the same as "broken brackets".',
            2: 'Empty input is valid input. Throwing makes callers handle a special case.',
          },
        },
        {
          q: 'Which question is worth asking about the input?',
          choices: [
            '"Can the string contain other characters, like letters?"',
            '"Can I use a stack?"',
            '"Is the string sorted?"',
          ],
          answer: 0,
          explain: 'If letters can appear, you need to skip them. Part 3 of this lesson handles a real code snippet.',
          why: {
            1: 'Don\'t ask permission for your approach. Explain it.',
            2: 'Sorting a string of brackets would destroy the order you\'re checking.',
          },
        },
        {
          q: 'Which phrase is the hint that a stack fits?',
          choices: [
            '"closed in the right order": the most recent opener must close first',
            '"return true or false": booleans need a stack',
            '"string": strings are stacks',
          ],
          answer: 0,
          explain: 'Most recent first is exactly "last in, first out". Nesting, undo history and "go back" are the same shape.',
          why: {
            1: 'Lots of problems return booleans without a stack.',
            2: 'A string is just the input. The order rule is the hint.',
          },
        },
      ],
    },
    {
      type: 'read',
      title: 'The plan, and the slow way first',
      md: `
**Brute force:** a valid string always has a matching pair side by side somewhere, like \`()\`. Delete those pairs again and again. If you end up with an empty string, it was valid.

~~~js
function isValidSlow(s) {
  let prev = null;
  while (s !== prev) {
    prev = s;
    s = s.replace("()", "").replace("[]", "").replace("{}", "");
  }
  return s === "";
}

console.log(isValidSlow("([]{})"), isValidSlow("([)]"));
~~~

It works, but each round rescans the string, so it's **O(n²)**.

**Better: a stack.** Walk left to right once:

- An **opener**: push it. It's waiting to be closed.
- A **closer**: the opener on top of the stack must be its partner. Pop it and compare.
- At the end, the stack must be **empty**. Anything left was never closed.

In JavaScript, an array is a stack: \`push\` adds to the end and \`pop\` removes from the end.
`,
    },
    {
      type: 'predict',
      title: 'Push and pop',
      code: `const stack = [];
stack.push("(");
stack.push("[");
console.log(stack.pop());
console.log(stack);
console.log([].pop());`,
      output: `[
[ "(" ]
undefined`,
      explain: `
\`pop\` takes the **last** thing pushed: \`"["\` came in last, so it comes out first. That's "last in, first out".

Popping an empty array doesn't throw. It returns \`undefined\`, which will matter in a moment: a closer with nothing open pops \`undefined\`, and \`undefined\` never matches an opener.
`,
    },
    {
      type: 'task',
      title: 'Part 1: only round brackets',
      md: `
Start with one kind of bracket. With only \`(\` and \`)\`, you don't need a stack yet: a **counter** of how many are open is enough.

Write \`isBalanced(s)\` for strings of \`(\` and \`)\` only:

- \`(\` adds 1, \`)\` subtracts 1.
- If the count ever goes **below 0**, a \`)\` came with nothing open: return \`false\` right away.
- At the end, the count must be exactly 0.

~~~
isBalanced("(())")  → true
isBalanced(")(")    → false     dips below 0 at the first character
isBalanced("(()")   → false     ends at 1
~~~
`,
      starter: `function isBalanced(s) {
  // your code here
}
`,
      tests: [
        { name: '"(())" is balanced', code: `eq(isBalanced("(())"), true);` },
        { name: '")(" is not, even though the counts match', code: `eq(isBalanced(")("), false, "return false as soon as the count goes below 0");` },
        { name: '"(()" is not: one is never closed', code: `eq(isBalanced("(()"), false);` },
        { name: 'an empty string is balanced', code: `eq(isBalanced(""), true);` },
      ],
      hint: '`let open = 0;` Loop over the characters. `(` does `open++`, `)` does `open--`, and right after that, `if (open < 0) return false;`. Finally `return open === 0;`.',
      solution: `function isBalanced(s) {
  let open = 0;
  for (const ch of s) {
    if (ch === "(") open++;
    else open--;
    if (open < 0) return false; // a ")" with nothing open
  }
  return open === 0;
}
`,
    },
    {
      type: 'predict',
      title: 'Why one counter isn\'t enough',
      md: 'Here\'s the counter idea stretched to three kinds of bracket: one counter each.',
      code: `function threeCounters(s) {
  const open = { "(": 0, "[": 0 };
  const opener = { ")": "(", "]": "[" };
  for (const ch of s) {
    if (ch in open) open[ch]++;
    else if (--open[opener[ch]] < 0) return false;
  }
  return open["("] === 0 && open["["] === 0;
}

console.log(threeCounters("([])"));
console.log(threeCounters("([)]"));`,
      output: `true
true`,
      explain: `
\`"([)]"\` passes, but it's wrong: the \`)\` tries to close the \`(\` while the \`[\` inside it is still open.

Counters know **how many** are open, but not **which one was opened last**. That order is exactly what a stack remembers.
`,
    },
    {
      type: 'task',
      title: 'Part 2: isValid with a stack',
      md: `
Write \`isValid(s)\` for strings of \`()[]{}\`.

Use a lookup object from each closer to its opener (the same lookup idea as the tally sheet):

~~~
const pairs = { ")": "(", "]": "[", "}": "{" };
~~~

- If \`ch\` is an opener, push it.
- Otherwise it's a closer: \`stack.pop()\` must equal \`pairs[ch]\`, or return \`false\`.
- At the end, return whether the stack is empty.

~~~
isValid("([]{})")  → true
isValid("([)]")    → false
isValid("]")       → false
~~~
`,
      starter: `function isValid(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  // your code here
}
`,
      tests: [
        { name: '"([]{})" is valid', code: `eq(isValid("([]{})"), true);` },
        { name: '"([)]" is not: wrong order', code: `eq(isValid("([)]"), false);` },
        { name: '"(]" is not: wrong kind', code: `eq(isValid("(]"), false);` },
        { name: '"]" is not: nothing to close', code: `eq(isValid("]"), false);` },
        { name: '"((" is not: left open', code: `eq(isValid("(("), false, "the stack must be empty at the end");` },
      ],
      hint: 'An opener is `ch === "(" || ch === "[" || ch === "{"`. For a closer, write `if (stack.pop() !== pairs[ch]) return false;`. End with `return stack.length === 0;`.',
      solution: `function isValid(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);                              // wait to be closed
    } else if (stack.pop() !== pairs[ch]) {
      return false;                                // wrong kind, or nothing open
    }
  }
  return stack.length === 0;                       // anything left was never closed
}
`,
      explain: 'A closer with an empty stack pops `undefined`, which never equals an opener. So the "nothing to close" case needs no extra `if`.',
    },
    {
      type: 'task',
      title: 'Part 3: where is the first mistake?',
      md: `
> "\`true\` or \`false\` isn't helpful in an editor. Tell me **where** the problem is, and ignore anything that isn't a bracket."

Write \`firstError(s)\`. It returns the **index** of the first problem, or \`-1\` if the brackets are fine.

- A closer that doesn't match (or has nothing open): its own index.
- Openers never closed: the index of the **earliest** one still open.
- Skip every other character.

The trick: push the opener's **index** onto the stack instead of the character. Then \`s[index]\` tells you which bracket it was, and the index is ready to report.

~~~
firstError("f(a[0])")  → -1
firstError("(a]")      → 2     the ] at index 2 doesn't match
firstError("x((y)")    → 1     the ( at index 1 is never closed
~~~
`,
      starter: `function firstError(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = []; // indexes of openers that are still open
  // your code here
}
`,
      tests: [
        { name: 'valid code gives -1', code: `eq(firstError("f(a[0])"), -1);` },
        { name: 'a wrong closer gives its index', code: `eq(firstError("(a]"), 2);` },
        { name: 'a closer with nothing open gives its index', code: `eq(firstError("ab)"), 2);` },
        { name: 'an unclosed opener gives the earliest one still open', code: `eq(firstError("x((y)"), 1, "use stack[0], the oldest opener left");` },
        { name: 'letters only gives -1', code: `eq(firstError("hello"), -1);` },
      ],
      hint: 'Loop with `for (let i = 0; i < s.length; i++)`. Openers: `stack.push(i)`. Closers (`ch in pairs`): `const top = stack.pop();` and if `top === undefined || s[top] !== pairs[ch]`, return `i`. At the end: `stack.length ? stack[0] : -1`.',
      solution: `function firstError(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = []; // indexes of openers that are still open
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(i);
    } else if (ch in pairs) {
      const top = stack.pop();
      if (top === undefined || s[top] !== pairs[ch]) return i;
    }
    // any other character: skip it
  }
  return stack.length ? stack[0] : -1; // the oldest opener never closed
}
`,
      explain: 'Storing indexes instead of characters is a common stack upgrade: you keep "what" (look it up with `s[top]`) and gain "where".',
    },
    {
      type: 'read',
      title: 'Walkthrough: the full solution',
      md: `
Trace \`isValid("([]{})")\`:

| ch | action | stack after |
|---|---|---|
| \`(\` | push | \`[ "(" ]\` |
| \`[\` | push | \`[ "(", "[" ]\` |
| \`]\` | pop \`[\`, matches | \`[ "(" ]\` |
| \`{\` | push | \`[ "(", "{" ]\` |
| \`}\` | pop \`{\`, matches | \`[ "(" ]\` |
| \`)\` | pop \`(\`, matches | \`[]\` |
| end | stack empty | returns \`true\` |

And \`"([)]"\`: after \`(\` and \`[\`, the \`)\` pops \`[\`, which isn't \`(\`, so it returns \`false\` at index 2.

**Big-O:**

| version | time | memory |
|---|---|---|
| delete pairs until nothing changes | O(n²) | O(n) for the new strings |
| stack | O(n) | O(n): \`"(((("\` pushes everything |

**Say it:** "The most recent opener must close first, which is last in, first out, so I use a stack. One pass, O(n) time and space. A closer pops and compares; at the end the stack must be empty."
`,
    },
    {
      type: 'check',
      title: 'Follow-up questions',
      items: [
        {
          q: 'Why `return stack.length === 0` at the end, instead of `return true`?',
          choices: [
            'Openers that were never closed are still on the stack, like in "(("',
            'The loop might not run',
            'To free the memory',
          ],
          answer: 0,
          explain: 'Every closer matched, but that says nothing about openers left over.',
          why: {
            1: 'For empty input the stack is empty, so either return gives `true`. The difference is "((".',
            2: 'The array is garbage-collected either way.',
          },
        },
        {
          q: 'Quick exit: when can you return `false` before even looping?',
          choices: ['When `s.length` is odd', 'When `s` starts with `(`', 'When `s` contains `{`'],
          answer: 0,
          explain: 'Brackets come in pairs, so a valid string of only brackets has even length. (Not true for Part 3, where letters are allowed.)',
          why: {
            1: 'Starting with an opener is normal.',
            2: 'Curly brackets are allowed.',
          },
        },
        {
          q: 'What else in software is "last in, first out"?',
          choices: [
            'The undo history in an editor, and the function call stack',
            'A queue at a shop',
            'A sorted list',
          ],
          answer: 0,
          explain: 'Undo reverses the most recent action first. The call stack returns from the most recent call first.',
          why: {
            1: 'A queue is first in, first out: the opposite.',
            2: 'Sorting is about value, not arrival order.',
          },
        },
        {
          q: 'The interviewer adds HTML tags: `<b><i></i></b>`. What changes?',
          choices: [
            'Only how you read tokens: push tag names on open tags, pop and compare on close tags',
            'You need a completely different algorithm',
            'You can use the three-counter version',
          ],
          answer: 0,
          explain: 'The stack logic is identical. The new work is splitting the string into tags instead of single characters.',
          why: {
            1: 'Nesting is still last in, first out.',
            2: 'Counters fail on `<b><i></b></i>` for the same reason as "([)]".',
          },
        },
      ],
    },
  ],
};
