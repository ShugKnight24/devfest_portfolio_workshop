// JS course · lesson 1. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'values-and-return',
  title: 'Values, variables and return',
  goal: 'Store values in variables, build strings from them, and write functions that hand a value back with return.',
  minutes: 20,
  steps: [
    {
      type: 'read',
      title: 'Values and variables',
      md: `
Everything a program works with is a **value**: a number like \`30\`, a string like \`"Ada"\`, \`true\` or \`false\`.

A **variable** is a name you stick on a value so you can use it later:

~~~js
const name = "Ada";   // const: this name always points at the same value
let count = 0;        // let: you're allowed to change it later
count = count + 1;

console.log(name);
console.log(count);
~~~

Press **▶ Run** to see what it prints.

- Use \`const\` by default. Switch to \`let\` only when you really need to reassign.
- Strings have quotes. Numbers don't: \`"30"\` is text, \`30\` is a number.
- \`console.log(...)\` prints a value so **you** can see it. It's for looking, not for handing values around (more on that below).
`,
    },
    {
      type: 'predict', throws: true,
      title: 'const vs let',
      md: 'One of these lines breaks the rules. What prints, and where does it stop?',
      code: `let score = 10;
score = score + 5;
console.log(score);

const limit = 3;
limit = 4;
console.log(limit);`,
      output: `15
! Assignment to constant variable.`,
      explain: `
- \`score\` is a \`let\`, so \`score = score + 5\` is fine: it prints **15**.
- \`limit\` is a \`const\`. Trying to reassign it throws **"Assignment to constant variable."** and the program stops, so the last \`console.log\` never runs.

When you see that error, either you meant \`let\`, or you should make a new variable instead.
`,
    },
    {
      type: 'read',
      title: 'Functions hand back a value with return',
      md: `
A function is a small machine: values go **in** (parameters), one value comes **out** (the return value).

~~~js
function addOne(n) {   // n is the parameter: the input
  return n + 1;        // return hands the result back to whoever called it
}

const result = addOne(4);  // calling it: 4 goes in as n
console.log(result);
~~~

Read \`addOne(4)\` as "run addOne with n set to 4, and give me what it returns."

**If you forget \`return\`, the function hands back \`undefined\`.** That's the single most common beginner bug, and the tests will say something like \`expected 30, got undefined\`.
`,
    },
    {
      type: 'predict',
      title: 'The forgotten return',
      md: 'Both functions do the same math. Only one of them returns it.',
      code: `function withReturn(n) {
  return n * 2;
}

function withoutReturn(n) {
  n * 2;
}

console.log(withReturn(5));
console.log(withoutReturn(5));`,
      output: `10
undefined`,
      explain: `
\`withoutReturn\` calculates \`n * 2\` and then throws the answer away. With no \`return\`, a function gives back \`undefined\`.

Whenever you see \`undefined\` where you expected a value, look for a missing \`return\`.
`,
    },
    {
      type: 'task',
      title: 'getAge',
      md: `
**Example** (already solved):

~~~
function getName() {
  return "Ada";
}
~~~

**Your turn:** \`getAge()\` returns the **number** \`30\`.
`,
      starter: `function getAge() {
  // your code here
}
`,
      tests: [
        { name: 'getAge() returns 30', code: `eq(getAge(), 30);` },
        { name: 'it is a number, not the string "30"', code: `eq(typeof getAge(), "number", "numbers have no quotes");` },
      ],
      hint: 'Same shape as `getName`, but `return 30;`. Numbers have no quotes.',
      solution: `function getAge() {
  return 30; // a number, so no quotes: "30" would be a string
}
`,
    },
    {
      type: 'task',
      title: 'getGreeting',
      md: `\`getGreeting()\` returns the string \`"hello"\`.`,
      starter: `function getGreeting() {
  // your code here
}
`,
      tests: [{ name: 'getGreeting() returns "hello"', code: `eq(getGreeting(), "hello");` }],
      hint: 'Same as `getName`, with a different string: `return "hello";`',
      solution: `function getGreeting() {
  return "hello";
}
`,
    },
    {
      type: 'task',
      title: 'addTen',
      md: `
**Example:** using the parameter.

~~~
function addOne(n) {
  return n + 1;
}
~~~

**Your turn:** \`addTen(5)\` returns \`15\`.
`,
      starter: `function addTen(n) {
  // your code here
}
`,
      tests: [
        { name: 'addTen(5) returns 15', code: `eq(addTen(5), 15);` },
        { name: 'addTen(-10) returns 0', code: `eq(addTen(-10), 0);` },
      ],
      hint: 'Copy the shape of `addOne`. Only the number changes.',
      solution: `function addTen(n) {
  return n + 10;
}
`,
    },
    {
      type: 'task',
      title: 'square',
      md: `\`square(3)\` returns \`9\`: the number multiplied by itself. In JS, \`*\` means multiply.`,
      starter: `function square(n) {
  // your code here
}
`,
      tests: [
        { name: 'square(3) returns 9', code: `eq(square(3), 9);` },
        { name: 'square(0) returns 0', code: `eq(square(0), 0);` },
      ],
      hint: '`return n * n;`',
      solution: `function square(n) {
  return n * n;
}
`,
    },
    {
      type: 'read',
      title: 'Building strings: template literals',
      md: `
To put values inside a string, use **backticks** (the key under Esc) and \`\${...}\`:

~~~js
const name = "Ada";
const age = 36;

console.log(\`Hello \${name}\`);
console.log(\`\${name} is \${age}\`);
console.log("Hello " + name);   // the old way: + glues strings together
~~~

Anything inside \`\${ }\` gets worked out and dropped into the string, even math: \`\${age + 1}\`.

Watch the quotes: with normal quotes, \`"Hello \${name}"\` prints the \`\${name}\` part literally. Only backticks fill it in.
`,
    },
    {
      type: 'predict',
      title: 'Backticks vs quotes',
      code: `const city = "Paris";
console.log(\`I live in \${city}\`);
console.log("I live in \${city}");`,
      output: `I live in Paris
I live in \${city}`,
      explain: 'Only backticks fill in `${...}`. In normal quotes, `${city}` is just a few characters of text. If your output literally shows `${...}`, check your quotes.',
    },
    {
      type: 'task',
      title: 'fullName',
      md: `
**Example:**

~~~
function hello(name) {
  return \`Hello \${name}\`;
}
~~~

**Your turn:** \`fullName("Ada", "Lovelace")\` returns \`"Ada Lovelace"\`.
`,
      starter: `function fullName(first, last) {
  // your code here
}
`,
      tests: [{ name: 'fullName("Ada", "Lovelace") is "Ada Lovelace"', code: `eq(fullName("Ada", "Lovelace"), "Ada Lovelace");` }],
      hint: 'Two `${}` with a space between them: `` return `${first} ${last}`; ``',
      solution: `function fullName(first, last) {
  return \`\${first} \${last}\`; // backticks, not quotes, or \${} prints literally
}
`,
    },
    {
      type: 'task',
      title: 'describe',
      md: `\`describe("Ada", 36)\` returns \`"Ada is 36 years old"\`.`,
      starter: `function describe(name, age) {
  // your code here
}
`,
      tests: [
        { name: 'describe("Ada", 36) builds the sentence', code: `eq(describe("Ada", 36), "Ada is 36 years old");` },
        { name: 'works for other people too', code: `eq(describe("Linus", 17), "Linus is 17 years old");` },
      ],
      hint: 'Same as `fullName`, with more words around the placeholders: `` `${name} is ${age} years old` ``',
      solution: `function describe(name, age) {
  return \`\${name} is \${age} years old\`;
}
`,
    },
    {
      type: 'task',
      title: 'hoursToSeconds',
      md: `
**Example:** a named \`const\` inside a function makes the math readable.

~~~
function minutesToSeconds(minutes) {
  const secondsPerMinute = 60;
  return minutes * secondsPerMinute;
}
~~~

**Your turn:** \`hoursToSeconds(2)\` returns \`7200\`. Store \`3600\` in a \`const\` first, like the example.
`,
      starter: `function hoursToSeconds(hours) {
  // your code here
}
`,
      tests: [
        { name: 'hoursToSeconds(2) returns 7200', code: `eq(hoursToSeconds(2), 7200);` },
        { name: 'hoursToSeconds(0) returns 0', code: `eq(hoursToSeconds(0), 0);` },
      ],
      hint: '`const secondsPerHour = 3600;` on one line, then `return hours * secondsPerHour;` on the next.',
      solution: `function hoursToSeconds(hours) {
  const secondsPerHour = 3600; // a named const reads better than a "magic number"
  return hours * secondsPerHour;
}
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What does this print?\n\n~~~\nfunction getAge() {\n  30;\n}\nconsole.log(getAge());\n~~~",
          choices: ["`30`", "`undefined`", "`null`", "An error"],
          answer: 1,
          explain: "Without `return`, a function hands back `undefined`. That's what a test message like `expected 30, got undefined` means.",
          why: ["The `30` is computed, but nothing hands it back: there's no `return`.", "", "A missing return gives `undefined`, not `null`.", "Nothing is wrong with the syntax. It just returns nothing."],
        },
        {
          q: "Which kind of quotes fills in `${name}` with the variable's value?",
          choices: ["Double quotes `\"...\"`", "Single quotes `'...'`", "Backticks (the key left of 1)", "Any of them"],
          answer: 2,
          explain: "Only backtick strings (template literals) fill in `${...}`. In any other quotes it's printed literally.",
          why: ["Double quotes print `${name}` literally.", "Single quotes print `${name}` literally.", "", "Only backticks fill in `${...}`."],
        },
        {
          q: "Which line fits a counter you add 1 to inside a loop?",
          choices: ["`const count = 0;`", "`let count = 0;`", "`count = 0;` with no keyword"],
          answer: 1,
          explain: "Use `let` only when you need to reassign the variable, like a counter. Use `const` for everything else.",
          why: ["`const` can't be reassigned, so `count = count + 1` throws.", "", "Always declare variables. Leaving out the keyword is a bug waiting to happen."],
        },
        {
          q: "What does `30 === \"30\"` give?",
          choices: ["`true`", "`false`", "An error"],
          answer: 1,
          explain: "`30` is a number and `\"30\"` is a string. `===` compares the type too, so they're never equal.",
          why: ["`===` checks the type as well as the value: number vs string.", "", "Comparing different types is allowed. It's just `false`."],
        },
      ],
    },
  ],
};
