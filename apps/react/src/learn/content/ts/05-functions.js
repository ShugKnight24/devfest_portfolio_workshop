// TS course · lesson 5. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
export default {
  id: 'functions',
  builds: ['ts/why-types', 'js/functions', 'js/map', 'js/filter-and-find'],
  title: 'Typing functions and callbacks',
  goal: 'Type parameters and returns, optional and default parameters, and functions passed as values, including the callbacks you hand to map and filter.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Arrow functions and return types',
      md: `
Lesson 1 typed a \`function\` declaration. Arrow functions (JavaScript lesson 2) take annotations in the same places:

~~~ts
function double(n: number): number {
  return n * 2;
}

const triple = (n: number): number => n * 3;

console.log(double(4), triple(4));
~~~

The return type goes after the parameter list, before \`=>\`.

Why write a return type if \`tsc\` can infer it? Because it moves the error to the right place. Here the function forgets one path:

~~~
function sign(n: number): number {
  if (n > 0) return 1;
  if (n < 0) return -1;
}
~~~

~~~text
error TS2366: Function lacks ending return statement and return type does not include 'undefined'.
~~~

Without \`: number\`, \`tsc\` would infer \`number | undefined\`, and the complaint would appear at every caller instead of here, where the bug is.
`,
    },
    {
      type: 'read',
      title: 'Optional and default parameters',
      md: `
In JavaScript you can leave out any argument. In TypeScript a missing argument is an error ("Expected 2 arguments, but got 1."), unless you say it's allowed. Two ways:

~~~ts
// 1. optional: name?: type. Inside, it's string | undefined.
function greet(name?: string): string {
  return "Hello, " + (name ?? "stranger");
}

// 2. default: name = value. The type is inferred from the default.
function repeatWord(word: string, times = 2): string {
  return word.repeat(times);
}

console.log(greet(), "/", greet("Ada"));
console.log(repeatWord("ha"), "/", repeatWord("ha", 3));
~~~

- \`times = 2\` is enough: \`tsc\` infers \`times: number\` from the \`2\`, and callers may leave it out.
- Prefer a default when there's a sensible value. Inside the function, \`times\` is always a number, so there's no \`undefined\` to handle.

Optional and default parameters must come **after** the required ones:

~~~
function f(a?: string, b: string) {}
~~~

~~~text
error TS1016: A required parameter cannot follow an optional parameter.
~~~
`,
    },
    {
      type: 'predict',
      title: 'A default parameter',
      code: `function price(amount: number, currency = "EUR"): string {
  return amount.toFixed(2) + " " + currency;
}

console.log(price(5));
console.log(price(5, "USD"));
console.log(price(5, undefined));`,
      output: `5.00 EUR
5.00 USD
5.00 EUR`,
      explain: `
A default is used whenever the argument is \`undefined\`, whether you left it out or passed \`undefined\` on purpose. So the first and third calls both get \`"EUR"\`.

\`toFixed(2)\` turns \`5\` into the string \`"5.00"\`.
`,
    },
    {
      type: 'task',
      title: 'shout with a default',
      md: `
Write \`shout(text: string, marks = 1): string\` that uppercases \`text\` and adds \`marks\` exclamation marks.

~~~
shout("hi")     → "HI!"
shout("hi", 3)  → "HI!!!"
~~~

\`"!".repeat(3)\` gives \`"!!!"\`.
`,
      starter: `function shout(text: string, marks = 1): string {
  // your code here
}
`,
      tests: [
        { name: 'shout("hi") is "HI!"', code: `eq(shout("hi"), "HI!");` },
        { name: 'shout("hi", 3) is "HI!!!"', code: `eq(shout("hi", 3), "HI!!!");` },
      ],
      hint: '`return text.toUpperCase() + "!".repeat(marks);`',
      solution: `function shout(text: string, marks = 1): string {
  return text.toUpperCase() + "!".repeat(marks);
}
`,
    },
    {
      type: 'read',
      title: 'A function type',
      md: `
In JavaScript lesson 9 you learned that a function is a value you can pass around. Values have types, so functions do too. A **function type** looks like an arrow function with types instead of code:

~~~
(n: number) => number
~~~

Read it as "a function that takes a number and returns a number". Use it to type a callback parameter:

~~~ts
function applyTwice(fn: (n: number) => number, x: number): number {
  return fn(fn(x));
}

console.log(applyTwice((n) => n + 1, 5));
~~~

Notice the callback \`(n) => n + 1\` has **no** annotation. \`tsc\` already knows \`fn\` takes a number, so it infers \`n: number\` from where the callback is used. This is called **contextual typing**, and it's why you rarely annotate callbacks to \`map\` or \`filter\`:

~~~
const nums = [1, 2, 3];
nums.map((n) => n.toUpperCase());
~~~

~~~text
error TS2339: Property 'toUpperCase' does not exist on type 'number'.
~~~

\`tsc\` knows \`nums\` is \`number[]\`, so \`n\` is a number, so the mistake is caught inside the callback.

A long function type can get its own name: \`type Transform = (n: number) => number;\`.
`,
    },
    {
      type: 'predict',
      title: 'A named function type',
      code: `type Transform = (n: number) => number;

const steps: Transform[] = [
  (n) => n + 1,
  (n) => n * 10,
  (n) => n - 3,
];

let value = 2;
for (const step of steps) {
  value = step(value);
}
console.log(value);`,
      output: `27`,
      explain: `
\`Transform[]\` is an array of functions. Each callback gets \`n: number\` from the \`Transform\` type.

The loop feeds the result of each step into the next: 2 + 1 = 3, then 3 * 10 = 30, then 30 - 3 = 27.
`,
    },
    {
      type: 'task',
      title: 'mapNumbers',
      md: `
In JavaScript lesson 9 you wrote \`myMap\`. Now write a typed version for numbers only:

\`mapNumbers(nums: number[], fn: (n: number) => number): number[]\`

~~~
mapNumbers([1, 2, 3], (n) => n * 2)  → [2, 4, 6]
~~~

(Lesson 7 makes this work for any type, not just numbers.)
`,
      starter: `function mapNumbers(nums: number[], fn: (n: number) => number): number[] {
  // your code here
}
`,
      tests: [
        { name: 'doubles [1, 2, 3] to [2, 4, 6]', code: `eq(mapNumbers([1, 2, 3], (n) => n * 2), [2, 4, 6]);` },
        { name: 'an empty array gives []', code: `eq(mapNumbers([], (n) => n * 2), []);` },
      ],
      hint: 'Same loop as `myMap`: `const result: number[] = [];`, push `fn(n)` for each `n`, return `result`.',
      solution: `function mapNumbers(nums: number[], fn: (n: number) => number): number[] {
  const result: number[] = [];
  for (const n of nums) {
    result.push(fn(n));
  }
  return result;
}
`,
      explain: '`const result: number[] = []` is a case where you do annotate a variable: an empty array tells `tsc` nothing about what will go in it.',
    },
    {
      type: 'task',
      title: 'countWhere',
      md: `
A predicate (JavaScript lesson 10) is a callback that returns a boolean. Write:

\`countWhere(words: string[], test: (word: string) => boolean): number\`

It returns how many words pass the test.

~~~
countWhere(["hi", "hello", "hey"], (w) => w.length > 2)  → 2
~~~
`,
      starter: `function countWhere(words: string[], test: (word: string) => boolean): number {
  // your code here
}
`,
      tests: [
        { name: 'counts the words longer than 2 letters', code: `eq(countWhere(["hi", "hello", "hey"], (w) => w.length > 2), 2);` },
        { name: 'no matches gives 0', code: `eq(countWhere(["a", "b"], (w) => w === "z"), 0);` },
      ],
      hint: '`words.filter(test)` keeps the words that pass. Its `.length` is the count.',
      solution: `function countWhere(words: string[], test: (word: string) => boolean): number {
  return words.filter(test).length;
}
`,
    },
    {
      type: 'read',
      title: 'void: callbacks whose result you ignore',
      md: `
Some callbacks are called for what they **do**, not what they return: \`forEach\`, event handlers, \`onChange\` props in React. Their return type is **\`void\`**, meaning "the caller ignores the result":

~~~ts
function each(items: string[], fn: (item: string, index: number) => void): void {
  for (let i = 0; i < items.length; i++) {
    fn(items[i], i);
  }
}

each(["a", "b"], (item, i) => console.log(i, item));
~~~

Two details:

- The callback type lists \`(item, index)\`, but a callback that only takes \`(item)\` is fine. Using fewer parameters is always allowed, which is why \`nums.map((n) => ...)\` works when \`map\` actually passes three arguments.
- A typed callback that returns the wrong thing is caught. Passing \`(s) => s.length\` where \`(s: string) => boolean\` is expected gives "Type 'number' is not assignable to type 'boolean'."
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'Which declaration does `tsc` reject?\n\n~~~\nfunction a(x: string, y?: number) {}  // A\nfunction b(x?: string, y: number) {}  // B\nfunction c(x: string, y = 1) {}       // C\n~~~',
          choices: ['A', 'B', 'C'],
          answer: 1,
          explain: 'In B, the required `y` comes after the optional `x`: "A required parameter cannot follow an optional parameter."',
          why: { 0: 'The optional parameter is last, which is allowed.', 2: 'A default parameter after a required one is fine, and `y` is inferred as `number`.' },
        },
        {
          q: 'In `nums.map((n) => n * 2)` where `nums: number[]`, why does `n` not need an annotation?',
          choices: ['tsc infers it from map\'s callback type (contextual typing)', 'Callback parameters are always `any`', 'Arrow functions cannot have annotations'],
          answer: 0,
          explain: '`map` on a `number[]` expects a callback that takes a number, so `tsc` gives `n` that type.',
          why: { 1: 'Here `n` is `number`, which is why `n.toUpperCase()` is caught.', 2: 'They can: `(n: number) => n * 2` is valid.' },
        },
        {
          q: 'What does `(word: string) => boolean` describe?',
          choices: ['A function that takes a string and returns a boolean', 'A function that takes a boolean and returns a string', 'An object with a word property'],
          answer: 0,
          explain: 'Parameters on the left of `=>`, the return type on the right. It is the type of a predicate for `filter`.',
          why: { 1: 'The return type is the one after the arrow.', 2: 'Object types use braces, not `=>`.' },
        },
        {
          q: 'What does `price(5, undefined)` use for `currency` in `function price(amount: number, currency = "EUR")`?',
          choices: ['`"EUR"`', '`undefined`', 'It is an error at runtime'],
          answer: 0,
          explain: 'A default applies whenever the argument is `undefined`, including when you pass `undefined` explicitly.',
          why: { 1: 'Passing `undefined` triggers the default.', 2: 'Nothing throws. The default is used.' },
        },
      ],
    },
  ],
};
