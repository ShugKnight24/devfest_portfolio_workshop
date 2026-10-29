// JS course · lesson 2. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'functions',
  builds: ['js/values-and-return'],
  title: 'Functions',
  goal: 'Write functions confidently: parameters, return vs console.log, arrow functions, defaults, and passing a function into another function.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Parameters and arguments',
      md: `
Two words people mix up all the time:

~~~
function greet(name) {      // name is a PARAMETER: a placeholder in the definition
  return \`Hi, \${name}!\`;
}

greet("Ada");               // "Ada" is an ARGUMENT: the real value you pass in the call
~~~

- **Defining** a function (\`function greet(name) {...}\`) writes the recipe. Nothing runs yet.
- **Calling** it (\`greet("Ada")\`) runs the recipe, with \`name\` set to \`"Ada"\` for that one run.

Arguments match parameters **by position**: the first argument goes into the first parameter, and so on.

~~~js
function describe(name, age) {
  return \`\${name} is \${age}\`;
}

console.log(describe("Ada", 36));
console.log(describe(36, "Ada"));   // wrong order: JS doesn't care about the names
~~~
`,
    },
    {
      type: 'predict',
      title: 'Printing is not returning',
      md: 'Both functions "show" 10 somehow. Only one of them gives it back. Watch what `a` and `b` end up holding.',
      code: `function logDouble(n) {
  console.log(n * 2);
}

function returnDouble(n) {
  return n * 2;
}

const a = logDouble(5);
const b = returnDouble(5);
console.log(a, b);`,
      output: `10
undefined 10`,
      explain: `
- \`logDouble(5)\` **prints** 10 (that's the first line), but it has no \`return\`, so it hands back \`undefined\`. \`a\` is \`undefined\`.
- \`returnDouble(5)\` prints nothing, but **returns** 10. \`b\` is 10.

This is the most important idea in this lesson. Think of a vending machine: \`console.log\` is a light flashing on the front so a human can see it. \`return\` is the snack dropping into the tray, which is the thing the caller actually gets.

Tests (and the rest of your code) only see what you \`return\`.
`,
    },
    {
      type: 'read',
      title: 'Arrow functions',
      md: `
There's a shorter way to write functions, used everywhere in React and modern JS:

~~~
function triple(n) {           // classic function
  return n * 3;
}

const triple = (n) => n * 3;   // arrow function: same thing
//    │        │      └─ the expression after => is returned automatically
//    │        └─ the parameters, in ()
//    └─ the function is stored in a const
~~~

**The braces rule** (memorize this one):

~~~
(n) => n * 3                // no braces: returns n * 3 automatically
(n) => { return n * 3; }    // braces: it's a normal body, you need return
(n) => { n * 3 }            // braces but no return: gives undefined
~~~

Use braces when you need more than one line. Then you also need \`return\`.

~~~js
const triple = (n) => n * 3;
const describe = (n) => {
  const tripled = n * 3;
  return \`\${n} tripled is \${tripled}\`;
};
console.log(triple(4));
console.log(describe(4));
~~~
`,
    },
    {
      type: 'predict',
      title: 'Braces without return',
      code: `const a = (n) => { n * 3 };
const b = (n) => n * 3;

console.log(a(2));
console.log(b(2));`,
      output: `undefined
6`,
      explain: '`a` has curly braces, which makes it a normal function body, and a body with no `return` gives `undefined`. `b` has no braces, so `n * 3` is returned automatically.',
    },
    {
      type: 'task',
      title: 'double, as an arrow function',
      md: `
**Example:**

~~~
const triple = (n) => n * 3;
~~~

**Your turn:** \`double(4)\` returns \`8\`. The starter has braces, so either add a \`return\` inside them, or rewrite it without braces like the example.
`,
      starter: `const double = (n) => {
  // your code here
};
`,
      tests: [
        { name: 'double(4) returns 8', code: `eq(double(4), 8);` },
        { name: 'double(0) returns 0', code: `eq(double(0), 0);` },
      ],
      hint: 'Simplest: replace the whole thing with `const double = (n) => n * 2;`',
      solution: `const double = (n) => n * 2; // no braces, so n * 2 is returned automatically
`,
    },
    {
      type: 'read',
      title: 'Default parameters',
      md: `
A parameter can have a **default**: the value it gets when the caller leaves it out.

~~~js
function welcome(place = "home") {
  return \`Welcome \${place}\`;
}

console.log(welcome("Paris"));  // place is "Paris"
console.log(welcome());         // nothing passed, so place is "home"
~~~

Without the default, \`welcome()\` would print \`Welcome undefined\`, because a parameter you don't pass is \`undefined\`.
`,
    },
    {
      type: 'task',
      title: 'greet with a default',
      md: `\`greet("Ada")\` returns \`"Hi, Ada!"\`, and \`greet()\` returns \`"Hi, friend!"\`. Add the default to the parameter.`,
      starter: `function greet(name) {
  // your code here
}
`,
      tests: [
        { name: 'greet("Ada") is "Hi, Ada!"', code: `eq(greet("Ada"), "Hi, Ada!");` },
        { name: 'greet() is "Hi, friend!"', code: `eq(greet(), "Hi, friend!", "add a default: function greet(name = \\"friend\\")");` },
      ],
      hint: 'Change the first line to `function greet(name = "friend") {`, then `` return `Hi, ${name}!`; ``',
      solution: `function greet(name = "friend") {
  return \`Hi, \${name}!\`;
}
`,
    },
    {
      type: 'task',
      title: 'isEven',
      md: `
A function can return \`true\` or \`false\`. A comparison like \`===\` already **is** true or false, so you can return it directly.

**Example:** \`%\` gives the remainder after dividing (\`7 % 2\` is \`1\`).

~~~
function isOdd(n) {
  return n % 2 === 1;
}
~~~

**Your turn:** \`isEven(4)\` returns \`true\`, \`isEven(3)\` returns \`false\`.
`,
      starter: `function isEven(n) {
  // your code here
}
`,
      tests: [
        { name: 'isEven(4) is true', code: `eq(isEven(4), true);` },
        { name: 'isEven(3) is false', code: `eq(isEven(3), false);` },
      ],
      hint: 'Even numbers have no remainder: `return n % 2 === 0;`',
      solution: `function isEven(n) {
  return n % 2 === 0; // the comparison is already true/false, no if needed
}
`,
    },
    {
      type: 'predict',
      title: 'Order of operations',
      md: 'Like in math class, `*` and `/` happen before `+` and `-`.',
      code: `console.log(2 + 4 / 2);
console.log((2 + 4) / 2);`,
      output: `4
3`,
      explain: 'Without brackets, `4 / 2` happens first, so it\'s `2 + 2`. With brackets, the sum happens first: `6 / 2`. When in doubt, add brackets.',
    },
    {
      type: 'task',
      title: 'average',
      md: `\`average(2, 4)\` returns \`3\`, and \`average(1, 2)\` returns \`1.5\`.`,
      starter: `function average(a, b) {
  // your code here
}
`,
      tests: [
        { name: 'average(2, 4) is 3', code: `eq(average(2, 4), 3, "check your brackets: (a + b) / 2");` },
        { name: 'average(1, 2) is 1.5', code: `eq(average(1, 2), 1.5);` },
      ],
      hint: '`return (a + b) / 2;` The brackets make the addition happen first.',
      solution: `function average(a, b) {
  return (a + b) / 2; // without (), b / 2 would happen first
}
`,
    },
    {
      type: 'task',
      title: 'circleArea',
      md: `
**Example:** rounding to 1 decimal place. Multiply by 10, round to a whole number, divide by 10.

~~~
function roundTo1(x) {
  return Math.round(x * 10) / 10;
}
~~~

**Your turn:** \`circleArea(2)\` returns \`12.57\`. The area is \`Math.PI * r * r\`, rounded to **2** decimals.
`,
      starter: `function circleArea(r) {
  // your code here
}
`,
      tests: [
        { name: 'circleArea(2) is 12.57', code: `eq(circleArea(2), 12.57);` },
        { name: 'circleArea(1) is 3.14', code: `eq(circleArea(1), 3.14);` },
      ],
      hint: 'Two decimals means 100 instead of 10: `Math.round(Math.PI * r * r * 100) / 100`. You can store the area in a `const` first.',
      solution: `function circleArea(r) {
  const area = Math.PI * r * r;
  return Math.round(area * 100) / 100;
}
`,
    },
    {
      type: 'read',
      title: 'Functions calling functions',
      md: `
A function can call another function and use what it returns. Read it inside out:

~~~js
const double = (n) => n * 2;
const addOne = (n) => n + 1;

console.log(addOne(double(5)));
~~~

| Step | What runs | Result |
|---|---|---|
| 1 | \`double(5)\` (the inner one first) | \`10\` |
| 2 | \`addOne(10)\` | \`11\` |

This is only possible because \`double\` **returns** its result. If it only logged it, \`addOne\` would get \`undefined\`.
`,
    },
    {
      type: 'task',
      title: 'shout and greetLoudly',
      md: `
\`greet\` is already written for you. Write two small functions under it:

- \`shout("hi")\` returns \`"hi!"\`
- \`greetLoudly("Ada")\` returns \`"Hi, Ada!!"\` by **calling** \`greet\`, then \`shout\` on the result.
`,
      starter: `// already done:
function greet(name = "friend") {
  return \`Hi, \${name}!\`;
}

function shout(s) {
  // your code here
}

function greetLoudly(name) {
  // your code here
}
`,
      tests: [
        { name: 'shout("hi") is "hi!"', code: `eq(shout("hi"), "hi!");` },
        { name: 'greetLoudly("Ada") is "Hi, Ada!!"', code: `eq(greetLoudly("Ada"), "Hi, Ada!!");` },
      ],
      hint: '`shout` returns `s + "!"`. `greetLoudly` is one line: `return shout(greet(name));`',
      solution: `function greet(name = "friend") {
  return \`Hi, \${name}!\`;
}

function shout(s) {
  return s + "!";
}

function greetLoudly(name) {
  return shout(greet(name)); // inner first: greet gives "Hi, Ada!", shout adds one more !
}
`,
    },
    {
      type: 'read',
      title: 'A function is a value',
      md: `
Here is the idea that unlocks \`map\`, \`filter\` and \`reduce\` later (lessons 9 to 11).

A variable can hold a function, just like it holds a number. **With \`()\` you call it; without \`()\` you're just talking about the function itself:**

~~~js
const double = (n) => n * 2;

console.log(double(4));   // called: 8
console.log(double);      // not called: the function itself
~~~

And because a function is a value, you can **pass it into another function**:

~~~js
function applyOnce(fn, x) {
  return fn(x);           // call whatever function was passed in
}

console.log(applyOnce((n) => n * 2, 5));
console.log(applyOnce((s) => s + "!", "hey"));
~~~

A function you pass in like this is called a **callback**. \`applyOnce\` doesn't know or care what \`fn\` does. It just calls it.
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Passing something that is not a function',
      code: `function applyOnce(fn, x) {
  return fn(x);
}

console.log(applyOnce((n) => n + 1, 1));
console.log(applyOnce(5, 1));`,
      output: `2
! fn is not a function`,
      explain: `
The first call passes a function, so \`fn(1)\` works and returns 2.

The second call passes the number 5 as \`fn\`. Then \`fn(1)\` tries to call 5, which isn't a function, so JS throws **"fn is not a function"**.

You'll see this exact error when you forget to pass a callback, or pass the result of a function instead of the function: \`applyOnce(double(5), 1)\` instead of \`applyOnce(double, 1)\`.
`,
    },
    {
      type: 'task',
      title: 'applyTwice',
      md: `
**Example:**

~~~
function applyOnce(fn, x) {
  return fn(x);
}
~~~

**Your turn:** \`applyTwice(fn, x)\` calls \`fn\` on \`x\`, then calls \`fn\` again on that result.

~~~
applyTwice((n) => n * 3, 2)       → 18      (2 → 6 → 18)
applyTwice((s) => s + "!", "hey") → "hey!!"
~~~
`,
      starter: `function applyTwice(fn, x) {
  // your code here
}
`,
      tests: [
        { name: 'applyTwice(triple, 2) is 18', code: `const triple = (n) => n * 3;\neq(applyTwice(triple, 2), 18);` },
        { name: 'works with strings too', code: `eq(applyTwice((s) => s + "!", "hey"), "hey!!");` },
      ],
      hint: 'Call it inside a call, like `addOne(double(5))`: `return fn(fn(x));`',
      solution: `function applyTwice(fn, x) {
  return fn(fn(x)); // inner first: fn(x), then fn of that
}
`,
      explain: '`applyTwice` takes a function as an argument, which makes it a **higher-order function**. `map` (lesson 9) is the same idea: a function that calls your callback once per item.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "In this code, which is the **argument**?\n\n~~~\nfunction greet(name) {\n  return \"Hi \" + name;\n}\ngreet(\"Ada\");\n~~~",
          choices: ["`name`", "`\"Ada\"`", "`greet`"],
          answer: 1,
          explain: "The argument is the real value passed in the call (`\"Ada\"`). The parameter is the placeholder in the definition (`name`).",
          why: ["`name` is the parameter: the placeholder in the definition.", "", "`greet` is the function itself."],
        },
        {
          q: "What does this print?\n\n~~~\nfunction add(a, b) {\n  console.log(a + b);\n}\nconst total = add(2, 3);\nconsole.log(total);\n~~~",
          choices: ["`5` then `5`", "`5` then `undefined`", "`undefined` then `5`", "Just `5`"],
          answer: 1,
          explain: "`console.log` shows a value to you but doesn't hand it back. `add` has no `return`, so `total` is `undefined`.",
          why: ["Printing isn't returning, so `total` never gets the 5.", "", "The log inside `add` runs first, so 5 comes first.", "Both `console.log` lines run, so two lines print."],
        },
        {
          q: "Which arrow function returns `n` times 2?",
          choices: ["`(n) => { n * 2 }`", "`(n) => n * 2`", "`(n) => { return; n * 2 }`"],
          answer: 1,
          explain: "Without braces, an arrow function returns its expression automatically. With braces you need `return n * 2;`.",
          why: ["Braces make a function body, and a body needs an explicit `return`. This returns `undefined`.", "", "`return;` exits right away with `undefined`, before `n * 2` is reached."],
        },
        {
          q: "What is the difference between `double` and `double(4)`?",
          choices: ["`double` is the function itself; `double(4)` calls it and gives its result", "They are the same thing", "`double` calls the function with no arguments"],
          answer: 0,
          explain: "Without `()`, nothing is called: you have the function as a value you can pass around. `()` runs it.",
          why: ["", "Without `()` nothing runs, so you get the function, not its result.", "Calling needs `()`. `double` alone just refers to the function."],
        },
        {
          q: "What does this print?\n\n~~~\nfunction greet(name = \"friend\") {\n  return `Hi, ${name}!`;\n}\nconsole.log(greet());\n~~~",
          choices: ["`Hi, undefined!`", "`Hi, friend!`", "An error, because `name` is missing"],
          answer: 1,
          explain: "A default parameter is used when the caller leaves the argument out.",
          why: ["Without the default you'd get `undefined`, but `= \"friend\"` fills the gap.", "", "Leaving out an argument is never an error in JS."],
        },
        {
          q: "What does this print?\n\n~~~\nconst addOne = (n) => n + 1;\n\nfunction applyTwice(fn, x) {\n  return fn(fn(x));\n}\n\nconsole.log(applyTwice(addOne, 5));\n~~~",
          choices: ["`6`", "`7`", "`10`"],
          answer: 1,
          explain: "`addOne` is passed in as `fn` (a callback). `fn(fn(5))` is `addOne(addOne(5))`, which is `addOne(6)`, which is 7.",
          why: ["That's one call. `applyTwice` calls `fn` twice.", "", "`fn` adds 1 each time. Nothing doubles here."],
        },
      ],
    },
  ],
};
