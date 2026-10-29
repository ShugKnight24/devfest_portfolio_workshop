// JS course · lesson 9. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (```js-style blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'map',
  builds: ['js/arrays-of-objects'],
  title: 'map: transform every item',
  goal: 'Turn a list into a new list, one item at a time, and understand callbacks well enough to write map yourself.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The problem map solves',
      md: `
In lesson 8 you built new arrays with a loop:

~~~js
const nums = [1, 2, 3];

const doubled = [];          // 1. make an empty array
for (const n of nums) {      // 2. go through each item
  doubled.push(n * 2);       // 3. change it, put the result in the new array
}
console.log(doubled);
~~~

Press **▶ Run** under the code to see what it prints. Then press **Edit**, change \`n * 2\` to \`n * 10\`, and run it again.

Now notice which part you just changed: **only \`n * 2\`**. Steps 1, 2 and 3 are the same every time, whether you want doubles, names or uppercase strings.

\`map\` is those three steps packaged up. You hand it only the part that changes:

~~~js
const nums = [1, 2, 3];
console.log(nums.map((n) => n * 2));
~~~
`,
    },
    {
      type: 'read',
      title: 'The key idea: a function is a value',
      md: `
This is the idea that makes "higher-order functions" click, so go slowly.

A variable can hold a number or a string. It can also hold a **function**:

~~~js
const double = (n) => n * 2;  // double holds a function, like x = 5 holds a number

console.log(double(4));       // the () CALLS it
console.log(double);          // no () : the function itself, not called
~~~

Because a function is a value, you can **pass it into another function**, exactly like passing a number:

~~~js
const double = (n) => n * 2;

function doTwice(fn, x) {
  return fn(fn(x));           // doTwice calls whatever function it was given
}

console.log(doTwice(double, 3)); // double(double(3)) = double(6)
~~~

Two words to learn:

- A function that **takes a function** (like \`doTwice\`) is a **higher-order function**.
- The function you pass in (like \`double\`) is a **callback**: the other function "calls it back" when it needs it.

\`map\`, \`filter\`, \`find\`, \`some\`, \`every\`, \`reduce\` and \`sort\` are all higher-order functions. Each is a loop that calls your callback for a different reason.
`,
    },
    {
      type: 'predict',
      title: 'Passing a function in',
      md: 'Read it slowly. `addOne` is passed in as `fn`.',
      code: `const addOne = (n) => n + 1;

function doTwice(fn, x) {
  return fn(fn(x));
}

console.log(doTwice(addOne, 5));
console.log(addOne);`,
      output: `7
[Function: addOne]`,
      explain: `
- \`doTwice(addOne, 5)\` runs \`addOne(addOne(5))\`, which is \`addOne(6)\`, which is **7**.
- \`console.log(addOne)\` has no \`()\`, so nothing is called. You're printing the function itself, and JS shows it as \`[Function: addOne]\`.

If you ever see \`[Function: something]\` where you expected a value, you forgot the \`()\`.
`,
    },
    {
      type: 'task',
      title: 'Build map yourself',
      md: `
The best way to stop \`map\` feeling like magic is to write it. Use only things you already know: an empty array, a \`for...of\` loop and \`push\`.

\`myMap(array, fn)\` returns a **new** array where each item is \`fn(item)\`:

~~~
myMap([1, 2, 3], (n) => n * 2)      → [2, 4, 6]
myMap(["a", "b"], (s) => s + "!")   → ["a!", "b!"]
~~~

It's the loop from step 1, with \`n * 2\` replaced by a call to \`fn\`.
`,
      starter: `function myMap(array, fn) {
  // your code here
}
`,
      tests: [
        { name: 'myMap([1, 2, 3], n => n * 2) is [2, 4, 6]', code: `eq(myMap([1, 2, 3], (n) => n * 2), [2, 4, 6]);` },
        { name: 'works with strings', code: `eq(myMap(["a", "b"], (s) => s + "!"), ["a!", "b!"]);` },
        { name: 'an empty array gives []', code: `eq(myMap([], (n) => n * 2), []);` },
        { name: 'the original array is unchanged', code: `const nums = [1, 2, 3]; myMap(nums, (n) => n * 2); eq(nums, [1, 2, 3]);` },
      ],
      hint: `
Three lines inside the function: make \`const result = []\`, loop \`for (const item of array)\` and inside it \`result.push(fn(item))\`. Then \`return result\` after the loop.
`,
      solution: `function myMap(array, fn) {
  const result = [];
  for (const item of array) {
    result.push(fn(item)); // the only new idea: call the callback on each item
  }
  return result;
}
`,
      explain: `That's all the real \`.map\` does. The only difference is you write \`array.map(fn)\` instead of \`myMap(array, fn)\`.`,
    },
    {
      type: 'read',
      title: 'Trace it',
      md: `
Here's \`myMap([1, 2, 3], (n) => n * 2)\`, one row per trip around the loop:

| Step | \`item\` | \`fn(item)\` | \`result\` after the push |
|---|---|---|---|
| start | | | \`[]\` |
| 1 | \`1\` | \`2\` | \`[2]\` |
| 2 | \`2\` | \`4\` | \`[2, 4]\` |
| 3 | \`3\` | \`6\` | \`[2, 4, 6]\` |
| end | | | returns \`[2, 4, 6]\` |

Two rules fall straight out of the code you wrote:

1. **The new array is always the same length as the old one.** One push per item. (Want fewer items? That's \`filter\`, next lesson.)
2. **The original array is never touched.** \`result\` is a brand-new array.
`,
    },
    {
      type: 'read',
      title: 'Anatomy of a map call',
      md: `
~~~
users.map((user) => user.name)
//  │    │  │          └─ what each item becomes (the return value)
//  │    │  └─ a name YOU pick for "the current item"
//  │    └─ the callback: an arrow function
//  └─ the array you're going through
~~~

- **The parameter name is your choice.** \`(user) => user.name\` and \`(u) => u.name\` do the same thing. Pick a name that says what one item is.
- **No curly braces means automatic return.** \`(n) => n * 2\` returns \`n * 2\`.
- **Returning an object needs parentheses:** \`(u) => ({ name: u.name })\`. Without them, JS reads \`{\` as the start of a function body.

~~~js
const users = [{ name: "Ada", age: 36 }, { name: "Linus", age: 17 }];

console.log(users.map((user) => user.name));
console.log(users.map((u) => u.age + 1));
console.log(users.map((u) => ({ name: u.name })));
~~~
`,
    },
    {
      type: 'predict',
      title: 'Warm-up prediction',
      code: `console.log([1, 2, 3].map((n) => n + 10));`,
      output: `[ 11, 12, 13 ]`,
      explain: 'Each item plus 10. Three items in, three items out.',
    },
    {
      type: 'task',
      title: 'doubled',
      md: `
**Example** (already solved):

~~~
function tripled(nums) {
  return nums.map((n) => n * 3);
}
~~~

**Your turn:** \`doubled([1, 2, 3])\` returns \`[2, 4, 6]\`. Use \`.map\`.
`,
      starter: `function doubled(nums) {
  // your code here
}
`,
      tests: [
        { name: 'doubled([1, 2, 3]) is [2, 4, 6]', code: `eq(doubled([1, 2, 3]), [2, 4, 6]);` },
        { name: 'doubled([]) is []', code: `eq(doubled([]), []);` },
      ],
      hint: 'Same as `tripled` in the example, with `* 2`. Don\'t forget the `return` in front of `nums.map`.',
      solution: `function doubled(nums) {
  return nums.map((n) => n * 2);
}
`,
    },
    {
      type: 'task',
      title: 'upperAll',
      md: `
**Example:** calling a method on each item.

~~~
function lowerAll(words) {
  return words.map((w) => w.toLowerCase());
}
~~~

**Your turn:** \`upperAll(["a", "b"])\` returns \`["A", "B"]\`.
`,
      starter: `function upperAll(words) {
  // your code here
}
`,
      tests: [{ name: 'upperAll(["a", "b"]) is ["A", "B"]', code: `eq(upperAll(["a", "b"]), ["A", "B"]);` }],
      hint: 'Same as `lowerAll`, with `.toUpperCase()`.',
      solution: `function upperAll(words) {
  return words.map((w) => w.toUpperCase());
}
`,
    },
    {
      type: 'task',
      title: 'lengths',
      md: `No example this time. \`lengths(["hi", "hello"])\` returns \`[2, 5]\`. (A string's length is \`.length\`, with no \`()\`.)`,
      starter: `function lengths(words) {
  // your code here
}
`,
      tests: [{ name: 'lengths(["hi", "hello"]) is [2, 5]', code: `eq(lengths(["hi", "hello"]), [2, 5]);` }],
      hint: 'Each word `w` becomes `w.length`.',
      solution: `function lengths(words) {
  return words.map((w) => w.length);
}
`,
    },
    {
      type: 'predict',
      title: 'The most common map bug',
      md: 'Look closely at the curly braces.',
      code: `console.log([1, 2, 3].map((n) => { n * 2 }));`,
      output: `[ undefined, undefined, undefined ]`,
      explain: `
With curly braces, an arrow function becomes a normal function body, and normal bodies need an explicit \`return\`. Without one, every call returns \`undefined\`.

~~~
(n) => n * 2              // no braces: returns n * 2
(n) => { return n * 2; }  // braces: needs return
(n) => { n * 2 }          // braces, no return: undefined
~~~

If a test says something like \`got [ undefined, undefined ]\`, check this first.
`,
    },
    {
      type: 'predict',
      title: 'Changing the item instead of returning a new one',
      md: 'This callback changes `u` and returns it. What happens to the **original** array?',
      code: `const users = [{ name: "Ada", active: true }];

const off = users.map((u) => {
  u.active = false;
  return u;
});

console.log(users[0].active);
console.log(off[0] === users[0]);`,
      output: `false
true`,
      explain: `
\`map\` made a new **array**, but the items inside it are the **same objects** as before (lesson 7: objects are shared by reference). Setting \`u.active = false\` changed the original user.

The fix is to return a **new object** for each item:

~~~js
const users = [{ name: "Ada", active: true }];
const off = users.map((u) => ({ ...u, active: false }));
console.log(users[0].active, off[0].active);
~~~

In React this is the bug where the screen doesn't update: you changed state in place instead of replacing it.
`,
    },
    {
      type: 'task',
      title: 'namesOf',
      md: `
**Example:** pull one field out of each object.

~~~
function agesOf(users) {
  return users.map((user) => user.age);
}
~~~

**Your turn:** \`namesOf(users)\` returns \`["Ada", "Linus"]\` for users like \`{ id: 1, name: "Ada", age: 36, active: true }\`.
`,
      starter: `function namesOf(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'namesOf(users) is ["Ada", "Linus"]',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }];
eq(namesOf(users), ["Ada", "Linus"]);`,
        },
      ],
      hint: 'Same as `agesOf`, with `user.name`.',
      solution: `function namesOf(users) {
  return users.map((user) => user.name);
}
`,
    },
    {
      type: 'task',
      title: 'labels',
      md: `\`labels(users)\` returns \`["Ada (36)", "Linus (17)"]\`. Use a template literal (backticks with \`\${...}\`, lesson 1).`,
      starter: `function labels(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'labels(users) is ["Ada (36)", "Linus (17)"]',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }];
eq(labels(users), ["Ada (36)", "Linus (17)"]);`,
        },
      ],
      hint: 'The callback returns `` `${user.name} (${user.age})` ``. Watch for the space before the `(`.',
      solution: `function labels(users) {
  return users.map((user) => \`\${user.name} (\${user.age})\`);
}
`,
    },
    {
      type: 'task',
      title: 'toggleAll',
      md: `
**Example:** return a **new** object per item. The \`()\` around \`{}\` tells JS "this is an object", not a function body.

~~~
function birthdays(users) {
  return users.map((user) => ({ ...user, age: user.age + 1 }));
}
~~~

**Your turn:** \`toggleAll(users)\` returns new user objects with \`active\` flipped (\`true\` becomes \`false\`, \`false\` becomes \`true\`). The original users must not change.
`,
      starter: `function toggleAll(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'flips active on every user',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }];
eq(toggleAll(users).map((u) => u.active), [false, true]);`,
        },
        {
          name: 'keeps the other fields',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }];
eq(toggleAll(users)[0], { id: 1, name: "Ada", age: 36, active: false });`,
        },
        {
          name: 'does not change the original users',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }];
toggleAll(users);
eq(users[0].active, true, "the original user changed: return a new object with { ...user } instead of setting user.active");`,
        },
      ],
      hint: 'Same shape as `birthdays`, but the change is `active: !user.active`. The `!` flips a boolean.',
      solution: `function toggleAll(users) {
  return users.map((user) => ({ ...user, active: !user.active }));
}
`,
      explain: 'This "map to a copy with one field changed" is the most common React state update there is. You\'ll use it to toggle a todo by id in challenge 02.',
    },
    {
      type: 'predict',
      title: 'map gives you the index too',
      code: `console.log(["a", "b", "c"].map((letter, i) => letter + i));`,
      output: `[ "a0", "b1", "c2" ]`,
      explain: '`map` calls your callback with `(item, index)`. You rarely need the index. In React lists, prefer a real `id` for `key` over the index.',
    },
    {
      type: 'read',
      title: "Where you'll see this",
      md: `
- **React lists:** \`items.map((item) => <li key={item.id}>{item.title}</li>)\` turns data into elements. It's the same \`map\`, and the callback returns JSX.
- **API responses:** "the API gives us users, the page needs names" is one \`map\`.
- **Immutable updates:** \`todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))\` changes one item and keeps the rest. That's \`map\`, a ternary (lesson 3) and spread together.

~~~js
const todos = [{ id: 1, done: false }, { id: 2, done: false }];
const id = 2;
console.log(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
~~~
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What does `map` always give back?",
          choices: ["A new array, the same length as the original", "The same array, changed in place", "A new array, possibly shorter"],
          answer: 0,
          explain: "One push per item into a brand-new array: same length, original untouched.",
          why: ["", "`map` builds a new array and never changes the original.", "Shorter is `filter`'s job. `map` keeps every item."],
        },
        {
          q: "What does `[1, 2, 3].map((n) => { n * 2 })` return?",
          choices: ["`[ 2, 4, 6 ]`", "`[ undefined, undefined, undefined ]`", "`undefined`"],
          answer: 1,
          explain: "With braces the callback needs an explicit `return`, so every call returns `undefined`, and `map` collects three of them.",
          why: ["The braces swallow the automatic return.", "", "`map` still returns an array, one item per call."],
        },
        {
          q: "What does this print?\n\n~~~\nconst users = [{ active: true }];\nconst off = users.map((u) => {\n  u.active = false;\n  return u;\n});\nconsole.log(users[0].active);\n~~~",
          choices: ["`true`", "`false`", "`undefined`"],
          answer: 1,
          explain: "`map` made a new array, but the items are the same objects. Setting `u.active` changed the original. Return `{ ...u, active: false }` instead.",
          why: ["`u` is the original object, not a copy.", "", "The property exists. It's just been changed."],
        },
        {
          q: "Which callback returns a **new object** for each user?",
          choices: ["`(u) => { name: u.name }`", "`(u) => ({ name: u.name })`", "`(u) => [name: u.name]`"],
          answer: 1,
          explain: "The parentheses tell JS the braces are an object, not a function body.",
          why: ["Without parentheses the braces are a function body, so it returns `undefined`.", "", "That's not valid syntax."],
        },
        {
          q: "In `nums.map(double)`, what is `double`?",
          choices: ["A callback: `map` calls it once per item", "The result of calling `double`", "A new array"],
          answer: 0,
          explain: "No `()`, so you pass the function itself. `map` calls it for you, once per item.",
          why: ["", "There's no `()`, so `double` isn't called here.", "`map` returns the new array. `double` is what builds each item."],
        },
      ],
    },
  ],
};
