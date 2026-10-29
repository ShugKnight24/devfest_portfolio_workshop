// JS course · lesson 14. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'classes-and-this',
  builds: ['js/objects', 'js/closures-and-scope'],
  title: 'Classes and this',
  goal: 'Write classes with a constructor, methods, getters and private #fields, understand what `this` points to, and know when a plain object is enough.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'A blueprint for objects',
      md: `
In lesson 13, \`makeWallet\` built an object with some data and the functions that work on it. A **class** is JavaScript's built-in way to do the same thing: a blueprint you can stamp out many objects from.

~~~js
class Counter {
  constructor() {
    this.count = 0;            // runs once per new Counter: set up the fields
  }

  increment() {                // a method: a function every Counter gets
    this.count = this.count + 1;
    return this.count;
  }
}

const c = new Counter();       // new: make an object from the blueprint
c.increment();
c.increment();
console.log(c.count);
~~~

Three new words:

- **\`constructor\`** runs automatically when you write \`new Counter()\`. Its job is to set up the starting fields.
- **\`this\`** means "the object being built" inside the constructor, and "the object the method was called on" inside a method.
- An object made with \`new\` is called an **instance** of the class.
`,
    },
    {
      type: 'read',
      title: 'Passing values in',
      md: `
Whatever you pass to \`new\` goes to the constructor's parameters:

~~~js
class Point {
  constructor(x, y) {
    this.x = x;                // copy the parameter onto the object
    this.y = y;
  }

  sum() {
    return this.x + this.y;
  }
}

const p = new Point(3, 4);
console.log(p.x, p.y, p.sum());
~~~

\`this.x = x\` reads as: "on this new object, make a key \`x\`, holding the parameter \`x\`". The two names don't have to match, but they usually do.

Two rules people trip on:

- Inside a method, you **must** write \`this.x\`. A bare \`x\` looks for a variable called \`x\` (lesson 13's scope rules), not the field.
- Methods have no \`function\` keyword and no commas between them, unlike an object literal.
`,
    },
    {
      type: 'predict',
      title: 'Two instances',
      md: 'Each `new` makes a separate object.',
      code: `class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  sum() {
    return this.x + this.y;
  }
}

const a = new Point(1, 2);
const b = new Point(3, 4);
a.x = 10;

console.log(a.x, b.x);
console.log(a.sum(), b.sum());`,
      output: `10 3
12 7`,
      explain: `
\`a\` and \`b\` are two different objects, so changing \`a.x\` doesn't touch \`b\`. Each \`sum()\` uses \`this\`, which is whichever object is before the dot: \`a.sum()\` gives 10 + 2, \`b.sum()\` gives 3 + 4.

The methods themselves are shared: there is one \`sum\` function, and \`this\` tells it which object to work on.
`,
    },
    {
      type: 'task',
      title: 'Rectangle',
      md: `
**Example** (already solved):

~~~
class Circle {
  constructor(radius) {
    this.radius = radius;
  }
  area() {
    return Math.PI * this.radius * this.radius;
  }
}
~~~

**Your turn:** write a class \`Rectangle\`. Its constructor takes \`width\` and \`height\` and stores them on \`this\`. Its method \`area()\` returns width times height.

~~~
const r = new Rectangle(3, 4);
r.width    → 3
r.area()   → 12
~~~
`,
      starter: `class Rectangle {
  // your code here
}
`,
      tests: [
        { name: 'new Rectangle(3, 4) stores width and height', code: `const r = new Rectangle(3, 4); eq([r.width, r.height], [3, 4]);` },
        { name: 'area() of 3 by 4 is 12', code: `eq(new Rectangle(3, 4).area(), 12);` },
        { name: 'area() of 5 by 5 is 25', code: `eq(new Rectangle(5, 5).area(), 25);` },
      ],
      hint: 'Copy the shape of `Circle`: a `constructor(width, height)` with two `this.` lines, then `area()` returning `this.width * this.height`.',
      solution: `class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  area() {
    return this.width * this.height;
  }
}
`,
    },
    {
      type: 'task',
      title: 'Add one method',
      md: `
Here's your \`Rectangle\` again. Add one method, \`isSquare()\`, that returns \`true\` when width and height are equal.

~~~
new Rectangle(5, 5).isSquare()   → true
new Rectangle(3, 4).isSquare()   → false
~~~
`,
      starter: `class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  area() {
    return this.width * this.height;
  }
}
`,
      tests: [
        { name: 'a 5 by 5 rectangle is a square', code: `eq(new Rectangle(5, 5).isSquare(), true);` },
        { name: 'a 3 by 4 rectangle is not', code: `eq(new Rectangle(3, 4).isSquare(), false);` },
      ],
      hint: 'A new method below `area()`. It returns the comparison `this.width === this.height` directly; no `if` needed.',
      solution: `class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  area() {
    return this.width * this.height;
  }
  isSquare() {
    return this.width === this.height;
  }
}
`,
    },
    {
      type: 'read',
      title: 'Getters and private #fields',
      md: `
Two more pieces of class syntax.

**A getter** is a method you read like a field, with no \`()\`. Put \`get\` in front of it:

~~~js
class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  get area() {                    // read it as r.area, not r.area()
    return this.width * this.height;
  }
}

const r = new Rectangle(3, 4);
console.log(r.area);
r.width = 10;
console.log(r.area);              // always up to date: it runs every time you read it
~~~

**A private field** starts with \`#\`. Only code **inside** the class can read or write it. It's the class version of \`makeWallet\`'s private \`balance\` variable:

~~~js
class Wallet {
  #balance = 0;                   // private: declared at the top of the class

  add(amount) {
    this.#balance = this.#balance + amount;
  }
  get balance() {                 // a getter lets people read it, but not set it
    return this.#balance;
  }
}

const w = new Wallet();
w.add(5);
console.log(w.balance);
~~~

Writing \`w.#balance\` **outside** the class isn't even allowed to run: it's a syntax error before any code starts.
`,
    },
    {
      type: 'predict',
      title: 'What can you see from outside?',
      md: '`Object.keys` lists an object\'s own public keys.',
      code: `class Temperature {
  #celsius;
  constructor(celsius) {
    this.#celsius = celsius;
  }
  get fahrenheit() {
    return this.#celsius * 9 / 5 + 32;
  }
}

const t = new Temperature(100);
console.log(t.fahrenheit);
console.log(t.celsius);
console.log(Object.keys(t));`,
      output: `212
undefined
[]`,
      explain: `
- \`t.fahrenheit\` runs the getter: 100 × 9 / 5 + 32 = **212**.
- \`t.celsius\` (no \`#\`) is a different, non-existent key, so \`undefined\`. \`#celsius\` and \`celsius\` are not the same name.
- \`Object.keys(t)\` is empty. Private fields don't show up as keys, and getters live on the class, not on each object.
`,
    },
    {
      type: 'task',
      title: 'BankAccount with a private balance',
      md: `
Write a class \`BankAccount\`:

- a private field \`#balance\`, set from the constructor's \`start\` parameter
- \`deposit(amount)\` adds to it
- a getter \`balance\` that returns it

~~~
const acct = new BankAccount(10);
acct.deposit(5);
acct.balance          → 15
Object.keys(acct)     → []   (nothing public)
~~~

The \`Wallet\` in the last read step is almost the whole answer. The difference: the starting value comes from the constructor.
`,
      starter: `class BankAccount {
  // your code here
}
`,
      tests: [
        { name: 'balance starts at the constructor value', code: `eq(new BankAccount(10).balance, 10);` },
        { name: 'deposit adds to the balance', code: `const a = new BankAccount(10); a.deposit(5); a.deposit(1); eq(a.balance, 16);` },
        { name: 'the balance is private (no public keys)', code: `eq(Object.keys(new BankAccount(10)), [], "found a public key: use #balance, not this.balance =");` },
      ],
      hint: 'Declare `#balance;` at the top, then `constructor(start) { this.#balance = start; }`. The getter is `get balance() { return this.#balance; }`.',
      solution: `class BankAccount {
  #balance;
  constructor(start) {
    this.#balance = start;
  }
  deposit(amount) {
    this.#balance = this.#balance + amount;
  }
  get balance() {
    return this.#balance;
  }
}
`,
    },
    {
      type: 'read',
      title: 'extends and super, briefly',
      md: `
\`extends\` makes a class that starts as a copy of another and then adds or changes things. \`super\` reaches the parent's version.

~~~js
class User {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return \`Hi, I'm \${this.name}\`;
  }
}

class Admin extends User {
  constructor(name, level) {
    super(name);               // run User's constructor first: sets this.name
    this.level = level;        // then add what's new
  }
  greet() {                    // same name: replaces User's greet for admins
    return super.greet() + " (admin)";
  }
}

const a = new Admin("Ada", 2);
console.log(a.greet(), a.level);
console.log(a instanceof Admin, a instanceof User);
~~~

- If a child class has a constructor, it **must** call \`super(...)\` before it uses \`this\`.
- \`instanceof\` asks "was this made from that class, or a child of it?"

You'll use \`extends\` most for one thing in lesson 16: making your own error types with \`class NotFoundError extends Error\`. Deep inheritance chains are rare in modern JavaScript.
`,
    },
    {
      type: 'task',
      title: 'Guest extends User',
      md: `
The starter has \`User\`. Add a class \`Guest\` that **extends** \`User\` and changes only \`greet()\` to return \`"Hi, I'm <name> (guest)"\`.

~~~
new Guest("Linus").greet()   → "Hi, I'm Linus (guest)"
new Guest("Linus").name      → "Linus"
~~~

\`Guest\` adds no new fields, so it doesn't need a constructor at all: it uses \`User\`'s.
`,
      starter: `class User {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return \`Hi, I'm \${this.name}\`;
  }
}

// your Guest class here
`,
      tests: [
        { name: 'a Guest has a name', code: `eq(new Guest("Linus").name, "Linus");` },
        { name: 'greet() adds (guest)', code: `eq(new Guest("Linus").greet(), "Hi, I'm Linus (guest)");` },
        { name: 'a Guest is also a User', code: `eq(new Guest("Linus") instanceof User, true);` },
      ],
      hint: '`class Guest extends User { greet() { ... } }`. Inside, `super.greet() + " (guest)"` reuses the parent\'s text.',
      solution: `class User {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return \`Hi, I'm \${this.name}\`;
  }
}

class Guest extends User {
  greet() {
    return super.greet() + " (guest)";
  }
}
`,
    },
    {
      type: 'read',
      title: 'this depends on how you call it',
      md: `
\`this\` is **not** fixed when you write a method. It's decided each time the method is **called**, by what's before the dot:

~~~
counter.increment()     // this is counter
const inc = counter.increment;
inc()                   // nothing before the dot: this is undefined
~~~

Pulling a method off its object and calling it bare loses \`this\`. The same happens when you hand a method to something else to call later, such as \`setTimeout(counter.increment, 100)\` or a click handler.

**Arrow functions are different:** they don't get their own \`this\`. An arrow uses the \`this\` of the code around it, the same way it uses any outer variable (lesson 13). That's why arrows are the safe choice for callbacks **inside** a method.
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Losing this',
      code: `class Counter {
  constructor() {
    this.count = 0;
  }
  increment() {
    this.count = this.count + 1;
    return this.count;
  }
}

const c = new Counter();
console.log(c.increment());

const inc = c.increment;
console.log(inc());`,
      output: `1
! Cannot read properties of undefined (reading 'count')`,
      explain: `
\`c.increment()\` has \`c\` before the dot, so \`this\` is \`c\` and it returns 1.

\`inc()\` is the **same function**, but called with nothing before the dot. Class code always runs in strict mode, where that makes \`this\` \`undefined\`, and \`undefined.count\` throws.

The fixes, in the order you'll reach for them:

- Call it through the object: \`() => c.increment()\`.
- Bind it once: \`const inc = c.increment.bind(c)\`.
`,
    },
    {
      type: 'read',
      title: 'Arrow callbacks keep this',
      md: `
The most common place this bites: a callback inside a method.

~~~js
class Cart {
  constructor(prices, taxRate) {
    this.prices = prices;
    this.taxRate = taxRate;
  }
  withTax() {
    // the arrow has no this of its own, so this is still the cart
    return this.prices.map((p) => p + p * this.taxRate);
  }
}

console.log(new Cart([10, 20], 0.5).withTax());
~~~

If you wrote that callback as \`function (p) { return p + p * this.taxRate; }\`, \`map\` would call it with nothing before the dot, \`this\` would be \`undefined\`, and it would throw. Inside methods, write callbacks as arrows.
`,
    },
    {
      type: 'task',
      title: 'Fix the callback',
      md: `
\`Scaler\` multiplies every number by its \`factor\`:

~~~
new Scaler(3).scaleAll([1, 2])   → [3, 6]
~~~

Right now \`scaleAll\` throws because its callback loses \`this\`. Change **only the callback**.
`,
      starter: `class Scaler {
  constructor(factor) {
    this.factor = factor;
  }
  scaleAll(nums) {
    return nums.map(function (n) {
      return n * this.factor;
    });
  }
}
`,
      tests: [
        { name: 'new Scaler(3).scaleAll([1, 2]) is [3, 6]', code: `eq(new Scaler(3).scaleAll([1, 2]), [3, 6]);` },
        { name: 'an empty list gives []', code: `eq(new Scaler(3).scaleAll([]), []);` },
      ],
      hint: 'Turn `function (n) { ... }` into an arrow function. An arrow uses the `this` of `scaleAll`, which is the scaler.',
      solution: `class Scaler {
  constructor(factor) {
    this.factor = factor;
  }
  scaleAll(nums) {
    return nums.map((n) => n * this.factor);
  }
}
`,
      explain: 'The empty-list test passes even with the bug, because `map` never calls the callback. A bug in a callback only shows up when there is something to loop over, so always test with real data too.',
    },
    {
      type: 'read',
      title: 'When a plain object is enough',
      md: `
Classes are one tool, not the default. Modern JavaScript, and React in particular, mostly uses **plain objects and functions**:

| Use | When |
|---|---|
| A plain object \`{ name: "Ada" }\` | It's **data**: API responses, React state, config. It goes through \`JSON.stringify\` cleanly and spreads cleanly (lesson 12). |
| Functions that take data | The behavior is simple: \`total(cart)\` instead of \`cart.total()\`. |
| A closure (\`makeWallet\`) | One thing with a little private state. |
| A class | Many instances that share methods **and** keep private state, or a library expects one (\`extends Error\`). |

A useful test: if you'd never call a method on it, it should be a plain object. In React, components are functions; you'll meet classes there mostly in older code.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "When does a class's `constructor` run?",
          choices: ["Each time you write `new ClassName(...)`", "Once, when the class is defined", "Each time a method is called"],
          answer: 0,
          explain: "Every `new` builds a fresh object and runs the constructor to set it up.",
          why: { 1: "Defining the class runs nothing. Each instance runs it.", 2: "Methods run on their own. The constructor only runs on `new`." },
        },
        {
          q: "Inside a method, how do you read the object's `width` field?",
          choices: ["`this.width`", "`width`", "`self.width`"],
          answer: 0,
          explain: "Fields live on the object, and `this` is the object the method was called on.",
          why: { 1: "A bare `width` looks for a variable in scope, not a field.", 2: "That's Python. JavaScript uses `this`." },
        },
        {
          q: "`const f = obj.method; f();` throws. Why?",
          choices: ["Called with nothing before the dot, so `this` is `undefined`", "Copying a method deletes it from the object", "Methods can only be called once"],
          answer: 0,
          explain: "`this` is decided by how a function is called. Calling it bare loses the object.",
          why: { 1: "`obj.method` is still there. `f` is the same function, just called differently.", 2: "You can call a method as often as you like." },
        },
        {
          q: "Why use an arrow function for a `map` callback inside a method?",
          choices: ["An arrow uses the method's `this`, so `this.field` still works", "Arrow functions run faster", "`map` only accepts arrow functions"],
          answer: 0,
          explain: "Arrows don't have their own `this`; they take it from the surrounding code, like any outer variable.",
          why: { 1: "Speed isn't the reason. It's about which `this` the callback sees.", 2: "`map` takes any function. A `function` callback just loses `this`." },
        },
        {
          q: "You fetch a list of products from an API to show on a page. What should each product be?",
          choices: ["A plain object", "An instance of a `Product` class", "A closure"],
          answer: 0,
          explain: "It's data. Plain objects come straight out of `JSON.parse`, spread cleanly, and are what React state expects.",
          why: { 1: "Nothing here needs methods or private state, and you'd have to convert every item.", 2: "There's no private state to protect. It's just data." },
        },
      ],
    },
  ],
};
