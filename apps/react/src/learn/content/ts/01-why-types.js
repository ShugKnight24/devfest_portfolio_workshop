// TS course · lesson 1. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
// Code here is transpiled (types stripped), never type-checked, so type errors are taught with read/check steps.
export default {
  id: 'why-types',
  builds: ['js/functions', 'js/values-and-return'],
  title: 'Why types: annotations, inference, and what actually runs',
  goal: 'Write your first type annotations, read a tsc error message, and understand that types are checked before the code runs and then erased.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The same JavaScript, plus a promise',
      md: `
TypeScript is JavaScript with one addition: you can say what **type** of value a variable, parameter or return holds. Here is the \`add\` function from JavaScript lesson 2, with types:

~~~ts
function add(a: number, b: number): number {
  return a + b;
}

console.log(add(2, 3));
~~~

Press **Run**. It prints \`5\`, exactly like the JavaScript version.

The new parts are the **annotations** after each colon:

- \`a: number\` reads "a is a number".
- \`b: number\` reads "b is a number".
- \`): number\` after the parentheses reads "this function returns a number".

Everything else is the JavaScript you already know. An annotation is a promise about the value. Something has to check that promise, and that something is \`tsc\`, the TypeScript compiler.
`,
    },
    {
      type: 'read',
      title: 'Two separate jobs: check, then erase',
      md: `
\`tsc\` does two things with your file, and it helps to keep them apart:

1. **Check.** It reads every annotation and every use, and reports anything that breaks a promise. Nothing runs during this step.
2. **Erase.** It deletes the annotations and writes plain JavaScript. That JavaScript is what the browser or Node runs.

So this TypeScript:

~~~
function add(a: number, b: number): number {
  return a + b;
}
~~~

becomes this JavaScript:

~~~
function add(a, b) {
  return a + b;
}
~~~

The types are **gone** at runtime. There is no hidden check when \`add\` is called. If a wrong value sneaks in while the program runs (from an API, from \`JSON.parse\`), nothing stops it.

**On this page:** the Run button only does step 2. It strips the types and runs the JavaScript. It never type-checks. So when a lesson asks "which line does \`tsc\` reject?", you answer it by reading, and the lesson shows the real error message.
`,
    },
    {
      type: 'predict',
      title: 'An annotation is not a conversion',
      md: '`JSON.parse(\'"5"\')` returns the **string** `"5"`. The annotation says `number`. What does the code print?',
      code: `const n: number = JSON.parse('"5"');

console.log(typeof n);
console.log(n + 1);`,
      output: `string
51`,
      explain: `
The annotation \`: number\` was erased before the code ran, so it changed nothing. \`n\` is still the string \`"5"\`, and \`"5" + 1\` joins strings to give \`"51"\` (JavaScript lesson 1).

\`tsc\` didn't complain either, because \`JSON.parse\` returns \`any\`, a type that switches checking off. Lesson 9 is about doing this safely. For now remember: **types describe values, they never change them.**
`,
    },
    {
      type: 'read',
      title: 'Reading a tsc error',
      md: `
Here is a file with one broken promise:

~~~
let count: number = 5;
count = "five";
~~~

\`tsc\` reports:

~~~text
app.ts(2,1): error TS2322: Type 'string' is not assignable to type 'number'.
~~~

Read it in three parts:

| Part | Meaning |
|---|---|
| \`app.ts(2,1)\` | file, line 2, column 1 |
| \`TS2322\` | the error code (handy for searching) |
| \`Type 'string' is not assignable to type 'number'.\` | the actual problem |

"**X is not assignable to Y**" is the error you will see most. It means: you gave an X where a Y was promised. Find the Y (here, \`count: number\` on line 1) and the X (the string \`"five"\`), and decide which one is wrong.

Calling a function with the wrong argument gives a close cousin:

~~~
add(1, "2");
~~~

~~~text
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
~~~
`,
    },
    {
      type: 'check',
      title: 'Spot the rejected line',
      md: 'Nothing runs here. Read each snippet the way `tsc` would.',
      items: [
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nfunction add(a: number, b: number): number {\n  return a + b;\n}\nconst x = add(1, 2);   // line A\nconst y = add("1", 2); // line B\n~~~',
          choices: ['Line A', 'Line B', 'Neither'],
          answer: 1,
          explain: 'Line B passes the string `"1"` where `a: number` was promised: "Argument of type \'string\' is not assignable to parameter of type \'number\'."',
          why: { 0: 'Both arguments are numbers, so the promise holds.', 2: 'TypeScript does not convert `"1"` to a number. It reports the mismatch.' },
        },
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nfunction add(a: number, b: number): number {\n  return a + b;\n}\nadd(1);     // line A\nadd(1, 2);  // line B\n~~~',
          choices: ['Line A', 'Line B', 'Neither'],
          answer: 0,
          explain: 'Line A gives one argument to a function that promised two: "Expected 2 arguments, but got 1." Plain JavaScript would just run it with `b` as `undefined`.',
          why: { 1: 'Two numbers for two number parameters is exactly right.', 2: 'In TypeScript, a missing argument is an error unless the parameter is marked optional (lesson 5).' },
        },
        {
          q: 'You run a TypeScript file that has a type error, using the Run button on this page. What happens?',
          choices: ['The code runs, because types were stripped, not checked', 'It refuses to run and shows the tsc error', 'It runs and converts the values to the right types'],
          answer: 0,
          explain: 'Stripping types and checking types are two separate jobs. The Run button only strips. Real projects run `tsc` (or an editor) to do the checking.',
          why: { 1: 'That would need the check step, which this page does not do.', 2: 'Types are erased before running. Nothing is converted.' },
        },
      ],
    },
    {
      type: 'read',
      title: 'Inference: you write fewer types than you think',
      md: `
You don't have to annotate everything. \`tsc\` **infers** a type from the value you give it:

~~~ts
let count = 5;            // inferred: number
const name = "Ada";       // inferred: "Ada" (a const can never change, so its type is that exact string)
const nums = [1, 2, 3];   // inferred: number[]

function double(n: number) {
  return n * 2;           // return type inferred: number
}

console.log(count, name, nums, double(4));
~~~

After \`let count = 5\`, writing \`count = "five"\` still fails with "Type 'string' is not assignable to type 'number'." You never wrote \`number\`, but \`tsc\` worked it out.

A good rule for where to write types:

- **Parameters: always.** \`tsc\` can't guess what callers will pass in.
- **Return types: optional.** Write them on exported or important functions, so a wrong \`return\` is caught inside the function instead of at every caller.
- **Variables: rarely.** Let inference do it, unless the starting value doesn't tell the whole story (like an empty array).
`,
    },
    {
      type: 'predict',
      title: 'Inferred types still run as plain JavaScript',
      code: `const id = 7;
let label = "user-" + id;
label = label.toUpperCase();

console.log(label, typeof label);`,
      output: `USER-7 string`,
      explain: `
\`tsc\` infers \`label\` as \`string\` from \`"user-" + id\` (string plus number gives a string). So \`label.toUpperCase()\` is allowed, and assigning its result back to \`label\` is fine because it's also a string.

At runtime it's the JavaScript you know: \`"user-7"\` uppercased.
`,
    },
    {
      type: 'task',
      title: 'Annotate a function',
      md: `
**Example** (already solved):

~~~
function greet(name: string): string {
  return "Hello, " + name;
}
~~~

**Your turn:** write \`fullName(first, last)\`. Both parameters are strings, and it returns a string: the two names with a space between them. Write the annotations as well as the body.

~~~
fullName("Ada", "Lovelace")  → "Ada Lovelace"
~~~
`,
      starter: `function fullName(first, last) {
  // your code here
}
`,
      tests: [
        { name: 'fullName("Ada", "Lovelace") is "Ada Lovelace"', code: `eq(fullName("Ada", "Lovelace"), "Ada Lovelace");` },
        { name: 'fullName("Linus", "Torvalds") is "Linus Torvalds"', code: `eq(fullName("Linus", "Torvalds"), "Linus Torvalds");` },
      ],
      hint: 'Annotate like `greet`: `first: string, last: string` and `): string`. The body is `return first + " " + last;` or a template literal.',
      solution: `function fullName(first: string, last: string): string {
  return \`\${first} \${last}\`;
}
`,
      explain: 'The tests can only check what the function returns at runtime. The annotations are checked by `tsc` in a real project. Both matter: tests catch wrong behavior, types catch wrong usage.',
    },
    {
      type: 'task',
      title: 'Two numbers in, one number out',
      md: `
Write \`lineTotal(price, qty)\`: both are numbers, and it returns \`price * qty\` as a number. Annotate both parameters and the return.

~~~
lineTotal(4, 3)  → 12
lineTotal(10, 0) → 0
~~~
`,
      starter: `function lineTotal(price, qty) {
  // your code here
}
`,
      tests: [
        { name: 'lineTotal(4, 3) is 12', code: `eq(lineTotal(4, 3), 12);` },
        { name: 'a quantity of 0 gives 0', code: `eq(lineTotal(10, 0), 0);` },
      ],
      hint: 'Same shape as `fullName`, with `number` instead of `string`, and `*` instead of joining strings.',
      solution: `function lineTotal(price: number, qty: number): number {
  return price * qty;
}
`,
    },
    {
      type: 'read',
      title: 'any, and why strict mode matters',
      md: `
What if you leave a parameter unannotated, like \`function shout(text) {...}\`? \`tsc\` can't infer it, so it falls back to **\`any\`**: a type that allows everything and checks nothing. \`any\` quietly turns TypeScript back into JavaScript.

That's why real projects turn on \`"strict": true\` in \`tsconfig.json\` (it's on by default in \`tsc --init\` projects). With strict mode, an unannotated parameter is an error instead of a silent \`any\`:

~~~
function shout(text) {
  return text.toUpperCase() + "!";
}
~~~

~~~text
error TS7006: Parameter 'text' implicitly has an 'any' type.
~~~

The fix is the habit from this lesson: annotate parameters. Every lesson in this track assumes strict mode.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'What happens to `: number` in `function double(n: number)` when the code runs?',
          choices: ['It is erased before the code runs', 'It converts `n` to a number', 'It throws if `n` is not a number'],
          answer: 0,
          explain: '`tsc` checks the annotation, then deletes it. The JavaScript that runs has no types in it at all.',
          why: { 1: 'Types never change values. `JSON.parse(\'"5"\')` stays a string even with `: number`.', 2: 'There is no runtime check. Lesson 9 shows how to write one yourself.' },
        },
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nlet total = 0;      // line A\ntotal = total + 5;  // line B\ntotal = "done";     // line C\n~~~',
          choices: ['Line A', 'Line B', 'Line C'],
          answer: 2,
          explain: '`total` was inferred as `number` on line A, so line C gives "Type \'string\' is not assignable to type \'number\'." You never wrote `number`, and it was still enforced.',
          why: { 0: 'That line is where the type `number` is inferred.', 1: 'A number plus a number is still a number.' },
        },
        {
          q: 'Where should you almost always write a type annotation?',
          choices: ['On function parameters', 'On every variable', 'Nowhere: inference handles everything'],
          answer: 0,
          explain: '`tsc` can infer a variable from its value and a return from its `return`, but it cannot guess what callers will pass in. Without a parameter annotation you get `any` (or an error in strict mode).',
          why: { 1: 'Inference already knows `let count = 5` is a number. Repeating it is noise.', 2: 'Parameters cannot be inferred from inside the function.' },
        },
        {
          q: 'What does "Type \'string\' is not assignable to type \'number\'" mean?',
          choices: ['A string was given where a number was promised', 'A number was given where a string was promised', 'The string could not be converted to a number'],
          answer: 0,
          explain: 'Read it as "you gave X where Y was promised". The first type is what you gave, the second is what the annotation asked for.',
          why: { 1: 'That is the reverse. The type you gave comes first in the message.', 2: 'TypeScript never converts. It only compares.' },
        },
      ],
    },
  ],
};
