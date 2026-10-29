// JS course · lesson 13. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'closures-and-scope',
  builds: ['js/functions', 'js/loops', 'js/map'],
  title: 'Closures and scope',
  goal: 'Know where a variable can be seen, and use functions that remember variables to build counters, adders and once().',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Where a variable lives',
      md: `
Every pair of curly braces \`{ }\` makes a **block**: a function body, an \`if\`, a loop. A variable made with \`let\` or \`const\` lives **inside the block where you wrote it**. That area is its **scope**.

The rule has two halves:

- **Inside can see out.** Code in a block can read variables from the blocks around it.
- **Outside can't see in.** Once the block ends, its variables are gone.

~~~js
const greeting = "Hello";        // outer: visible everywhere below

function greet(name) {
  const message = greeting + ", " + name;  // inside can see out: greeting works
  return message;
}

console.log(greet("Ada"));

if (true) {
  const secret = 42;             // only lives inside this if block
  console.log(secret);
}
~~~

Press **Edit** and add \`console.log(secret);\` as the very last line. Run it and read the error. That's "outside can't see in".
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Reaching into a block',
      md: 'The second `console.log` is outside the `if`.',
      code: `if (true) {
  const msg = "hi";
  console.log(msg);
}
console.log(msg);`,
      output: `hi
! msg is not defined`,
      explain: `
The first log runs inside the block, so \`msg\` exists. After the closing \`}\`, \`msg\` is gone, so JS throws \`ReferenceError: msg is not defined\`.

The fix is to declare the variable in the **outer** block (\`let msg;\` before the \`if\`) and assign it inside. Declare a variable at the level where you need to read it.
`,
    },
    {
      type: 'read',
      title: 'Functions remember where they were born',
      md: `
In lesson 9 you saw that a function is a value, so a function can **return** another function. Here's the surprising part:

~~~js
function makeGreeter(greeting) {
  return (name) => greeting + ", " + name;   // uses greeting from the outer function
}

const hello = makeGreeter("Hello");
const hey = makeGreeter("Hey");

console.log(hello("Ada"));
console.log(hey("Linus"));
~~~

By the time you call \`hello("Ada")\`, \`makeGreeter\` has already finished. Yet the inner function still knows \`greeting\` is \`"Hello"\`.

That's a **closure**: a function plus the variables it could see when it was created. The inner function keeps those variables alive for as long as the function itself exists.

And each call to \`makeGreeter\` makes a **fresh** \`greeting\`. \`hello\` and \`hey\` each remember their own.
`,
    },
    {
      type: 'predict',
      title: 'Two counters',
      md: 'Each call to `makeCounter` creates its own `count`.',
      code: `function makeCounter() {
  let count = 0;
  return () => {
    count = count + 1;
    return count;
  };
}

const a = makeCounter();
const b = makeCounter();

console.log(a());
console.log(a());
console.log(b());
console.log(a());`,
      output: `1
2
1
3`,
      explain: `
\`a\` and \`b\` each closed over a **different** \`count\` variable, because \`let count = 0\` ran once per \`makeCounter()\` call.

- \`a()\` twice: its count goes 1, 2.
- \`b()\` starts from its own 0, so 1.
- \`a()\` again carries on from 2, so 3.

The common wrong answer is \`1 2 3 4\`, from imagining one shared \`count\`. A closure remembers the variable from **its own** call.
`,
    },
    {
      type: 'task',
      title: 'makeAdder',
      md: `
**Example** (already solved):

~~~
function makeMultiplier(factor) {
  return (x) => x * factor;
}
const triple = makeMultiplier(3);
triple(5)   → 15
~~~

**Your turn:** write \`makeAdder(n)\`. It returns a function that takes \`x\` and returns \`x + n\`.

~~~
const addTen = makeAdder(10);
addTen(5)   → 15
~~~
`,
      starter: `function makeAdder(n) {
  // your code here
}
`,
      tests: [
        { name: 'makeAdder(10)(5) is 15', code: `eq(makeAdder(10)(5), 15);` },
        { name: 'makeAdder(1)(1) is 2', code: `eq(makeAdder(1)(1), 2);` },
        { name: 'two adders remember their own n', code: `const add2 = makeAdder(2); const add100 = makeAdder(100); eq([add2(1), add100(1)], [3, 101]);` },
      ],
      hint: 'Same shape as `makeMultiplier`: return an arrow function, with `+ n` instead of `* factor`.',
      solution: `function makeAdder(n) {
  return (x) => x + n;
}
`,
    },
    {
      type: 'task',
      title: 'makeCounter from blank',
      md: `
Write \`makeCounter()\` yourself, without looking back if you can. It returns a function. Each call of that function returns the next number, starting at 1.

~~~
const next = makeCounter();
next()   → 1
next()   → 2
next()   → 3
~~~
`,
      starter: `function makeCounter() {
  // your code here
}
`,
      tests: [
        { name: 'counts 1, 2, 3', code: `const next = makeCounter(); eq([next(), next(), next()], [1, 2, 3]);` },
        { name: 'two counters do not share a count', code: `const a = makeCounter(); const b = makeCounter(); a(); a(); eq(b(), 1);` },
      ],
      hint: 'You need a `let count = 0` inside `makeCounter` (not inside the returned function), and the returned function adds 1 and returns it.',
      solution: `function makeCounter() {
  let count = 0;
  return () => {
    count = count + 1;
    return count;
  };
}
`,
      explain: 'If `let count = 0` goes **inside** the returned function, it resets on every call and you always get 1. The variable has to live one level out, where it survives between calls.',
    },
    {
      type: 'read',
      title: 'Private state',
      md: `
Look at \`count\` in \`makeCounter\` again. No code outside can read or change it directly. The only way in is through the function you returned. That makes closures a way to keep **private state**.

You can return several functions that share the same variable by returning an object of them (an object of functions, lesson 7):

~~~js
function makeScore() {
  let points = 0;                      // private: only the functions below can touch it
  return {
    add: (n) => { points = points + n; },
    get: () => points,
  };
}

const score = makeScore();
score.add(5);
score.add(3);
console.log(score.get());
console.log(score.points);             // there is no points key on the object
~~~

\`score.points\` is \`undefined\` because \`points\` is a variable, not a key. Nobody can set it to \`-1000\` by accident. The next lesson shows classes, which give you the same "private" idea with \`#fields\`.
`,
    },
    {
      type: 'task',
      title: 'once',
      md: `
\`once(fn)\` returns a new function. The **first** time you call it, it calls \`fn\` and returns its result. Every later call **does not** call \`fn\` again; it returns the same first result.

~~~
let calls = 0;
const init = once(() => { calls = calls + 1; return "ready"; });

init()   → "ready"
init()   → "ready"
calls    → 1
~~~

You need two remembered variables: whether it ran yet, and the result.
`,
      starter: `function once(fn) {
  // your code here
}
`,
      tests: [
        { name: 'the first call returns fn\'s result', code: `const f = once(() => 42); eq(f(), 42);` },
        { name: 'later calls return the same result', code: `const f = once(() => 42); f(); eq(f(), 42);` },
        { name: 'fn runs only once', code: `let calls = 0; const f = once(() => { calls = calls + 1; return "ready"; }); f(); f(); f(); eq(calls, 1);` },
      ],
      hint: 'Inside `once`: `let done = false;` and `let result;`. The returned function checks `if (!done)`, and only then calls `fn()`, stores it in `result` and sets `done = true`. It always returns `result`.',
      solution: `function once(fn) {
  let done = false;
  let result;
  return () => {
    if (!done) {
      result = fn();
      done = true;
    }
    return result;
  };
}
`,
      explain: 'This is a real utility: "set up the database connection once", "show the welcome message once". In the challenges track, `debounce` uses the same trick to remember a timer between calls.',
    },
    {
      type: 'read',
      title: 'Old code: var',
      md: `
Before 2015, JavaScript only had \`var\`. You'll still see it in old tutorials and Stack Overflow answers. It has one big difference: **\`var\` ignores blocks.** It belongs to the whole function (or the whole file), not to the \`{ }\` it's written in.

~~~js
if (true) {
  var leaky = "I escaped the block";
}
console.log(leaky);   // works with var. With let, this would be an error.
~~~

That sounds harmless, until you mix it with closures in a loop. With \`for (let i = ...)\`, every trip around the loop gets a **fresh** \`i\`. With \`for (var i = ...)\`, there is only **one** \`i\` for the whole loop, and every closure remembers that same one.

Rule: use \`const\` by default, \`let\` when you reassign, and never \`var\` in new code.
`,
    },
    {
      type: 'predict',
      title: 'The loop trap',
      md: 'Each loop saves three functions that return `i`. They are called **after** the loop ends.',
      code: `const withVar = [];
for (var i = 0; i < 3; i++) {
  withVar.push(() => i);
}

const withLet = [];
for (let j = 0; j < 3; j++) {
  withLet.push(() => j);
}

console.log(withVar.map((f) => f()));
console.log(withLet.map((f) => f()));`,
      output: `[ 3, 3, 3 ]
[ 0, 1, 2 ]`,
      explain: `
- **\`var\`:** one shared \`i\`. All three functions remember the same variable, and by the time they run, the loop has pushed it to \`3\` (that's the value that made \`i < 3\` false).
- **\`let\`:** each trip gets its own \`j\`, so each function remembers 0, 1 and 2.

The classic interview version uses timers:

~~~
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);   // prints 3, 3, 3
}
~~~

Same cause, same fix: change \`var\` to \`let\`.
`,
    },
    {
      type: 'task',
      title: 'Fix the loop',
      md: `
\`makeGetters(n)\` should return an array of \`n\` functions, where function number \`k\` returns \`k\`:

~~~
const getters = makeGetters(3);
getters[0]()   → 0
getters[2]()   → 2
~~~

The starter has the loop-trap bug. Make **one** change.
`,
      starter: `function makeGetters(n) {
  const getters = [];
  for (var k = 0; k < n; k++) {
    getters.push(() => k);
  }
  return getters;
}
`,
      tests: [
        { name: 'makeGetters(3) gives functions returning 0, 1, 2', code: `eq(makeGetters(3).map((f) => f()), [0, 1, 2]);` },
        { name: 'makeGetters(0) gives an empty array', code: `eq(makeGetters(0), []);` },
      ],
      hint: 'Which keyword gives each trip around the loop its own variable?',
      solution: `function makeGetters(n) {
  const getters = [];
  for (let k = 0; k < n; k++) {
    getters.push(() => k);
  }
  return getters;
}
`,
    },
    {
      type: 'read',
      title: "Where you'll see this",
      md: `
You've been using closures since lesson 9 without the name. Any callback that uses a variable from outside itself is one:

~~~js
function olderThan(users, minAge) {
  return users.filter((u) => u.age > minAge);   // the callback closes over minAge
}
console.log(olderThan([{ age: 36 }, { age: 17 }], 18));
~~~

- **React:** an \`onClick={() => setCount(count + 1)}\` handler closes over the \`count\` from the render it was made in. "Stale state" bugs are closures remembering an old value.
- **debounce and throttle** (challenges track): a closure remembers the timer between calls.
- **Factories:** \`makeAdder\`, \`makeCounter\`, \`once\`: configure once, use many times.
`,
    },
    {
      type: 'task',
      title: 'Put it together: makeWallet',
      md: `
Write \`makeWallet(start)\`. It returns an object with three functions that share one private \`balance\`, which starts at \`start\`:

- \`add(amount)\` adds to the balance.
- \`spend(amount)\` takes it away and returns \`true\`, **unless** the amount is more than the balance. Then it changes nothing and returns \`false\`.
- \`balance()\` returns the current balance.

~~~
const w = makeWallet(10);
w.add(5);
w.spend(3)    → true
w.spend(100)  → false
w.balance()   → 12
~~~

This is \`makeScore\` from earlier with one more function.
`,
      starter: `function makeWallet(start) {
  // your code here
}
`,
      tests: [
        { name: 'balance starts at start', code: `eq(makeWallet(10).balance(), 10);` },
        { name: 'add and spend change the balance', code: `const w = makeWallet(10); w.add(5); eq(w.spend(3), true); eq(w.balance(), 12);` },
        { name: 'spending too much returns false and changes nothing', code: `const w = makeWallet(10); eq(w.spend(100), false); eq(w.balance(), 10);` },
        { name: 'two wallets keep separate balances', code: `const a = makeWallet(1); const b = makeWallet(50); a.add(1); eq([a.balance(), b.balance()], [2, 50]);` },
      ],
      hint: 'Start with `let balance = start;` and return `{ add: ..., spend: ..., balance: () => balance }`. In `spend`, check `if (amount > balance) return false;` first.',
      solution: `function makeWallet(start) {
  let balance = start;
  return {
    add: (amount) => {
      balance = balance + amount;
    },
    spend: (amount) => {
      if (amount > balance) return false;
      balance = balance - amount;
      return true;
    },
    balance: () => balance,
  };
}
`,
      explain: 'A key called `balance` holding a function and a variable called `balance` holding a number can live side by side: one is a property of the returned object, the other is a variable only the closures can see.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What is a closure?",
          choices: ["A function plus the variables it could see where it was created", "A function that has finished running", "A block of code inside curly braces"],
          answer: 0,
          explain: "The function keeps those outer variables alive, even after the outer function has returned.",
          why: { 1: "Closures matter precisely because the outer function has finished and its variables still live on.", 2: "That's a block, which gives `let` and `const` their scope." },
        },
        {
          q: "What does this print?\n\n~~~\nconst a = makeCounter();\nconst b = makeCounter();\na(); a();\nconsole.log(b());\n~~~",
          choices: ["`1`", "`3`", "`2`"],
          answer: 0,
          explain: "Each `makeCounter()` call creates its own `count`. `b` has never been called, so it starts at 1.",
          why: { 1: "That assumes one shared `count`. Each counter has its own.", 2: "`b`'s count is separate from `a`'s." },
        },
        {
          q: "Why does `for (var i = 0; i < 3; i++) fns.push(() => i)` give functions that all return `3`?",
          choices: ["`var` makes one `i` for the whole loop, and all functions share it", "Arrow functions can't read loop variables", "`push` copies the last value three times"],
          answer: 0,
          explain: "With `let`, each trip gets a fresh `i`. With `var`, there's one, and it's 3 by the time the functions run.",
          why: { 1: "They can; with `let` the same arrow functions return 0, 1, 2.", 2: "`push` adds three different functions. They just share one variable." },
        },
        {
          q: "In `makeScore`, why is `score.points` `undefined`?",
          choices: ["`points` is a variable inside the closure, not a key on the returned object", "`points` was reset to undefined after the function returned", "Objects can't hold numbers"],
          answer: 0,
          explain: "Only `add` and `get` can reach `points`. That's what makes it private.",
          why: { 1: "`points` is alive: `score.get()` still returns it.", 2: "They can; there's just no `points` key on this one." },
        },
      ],
    },
  ],
};
