// TS course · lesson 3. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
export default {
  id: 'unions-and-narrowing',
  builds: ['ts/object-types', 'js/conditionals'],
  title: 'Union types and narrowing',
  goal: 'Say "this OR that" with a union type, then use typeof, ===, truthiness and `in` so tsc knows which one you have.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'One value, more than one type',
      md: `
In lesson 2, \`email?: string\` had the type \`string | undefined\`. That \`|\` builds a **union type**: "one of these". You can write your own:

~~~ts
let id: string | number;

id = 42;        // fine
id = "a-42";    // also fine
console.log(id);
~~~

Unions of exact values are even more common. They list every allowed value:

~~~ts
type Theme = "light" | "dark";

let theme: Theme = "light";
theme = "dark";
console.log(theme);
~~~

Assigning anything else is rejected, which catches typos:

~~~
theme = "blue";
~~~

~~~text
error TS2322: Type '"blue"' is not assignable to type '"light" | "dark"'.
~~~

A type like \`"light"\` is called a **literal type**: a type with exactly one value.
`,
    },
    {
      type: 'read',
      title: 'You can only use what every member has',
      md: `
Here is the catch. With a union, \`tsc\` only lets you do what is safe for **every** member:

~~~
function len(x: string | number) {
  return x.length;
}
~~~

~~~text
error TS2339: Property 'length' does not exist on type 'string | number'.
  Property 'length' does not exist on type 'number'.
~~~

Strings have \`.length\`, numbers don't, and \`x\` might be a number. The second line of the message names the member that broke it.

The fix is to **check first**. Inside an \`if\` that tests the type, \`tsc\` shrinks the union to what's left. This is called **narrowing**:

~~~ts
function len(x: string | number): number {
  if (typeof x === "string") {
    return x.length;          // here x is: string
  }
  return String(x).length;    // here x is: number
}

console.log(len("hello"), len(12345));
~~~

You already wrote these checks in JavaScript lesson 3. The new part is that \`tsc\` reads them too, and changes the type inside each branch.
`,
    },
    {
      type: 'predict',
      title: 'typeof narrowing',
      code: `function describe(x: string | number): string {
  if (typeof x === "string") {
    return x.toUpperCase();
  }
  return x.toFixed(1);
}

console.log(describe("hi"));
console.log(describe(3));`,
      output: `HI
3.0`,
      explain: `
- \`"hi"\` is a string, so the first branch runs and uppercases it.
- \`3\` skips the \`if\`. After an \`if\` that returns, \`tsc\` knows the only thing left is \`number\`, so \`x.toFixed(1)\` is allowed. It formats with one decimal: \`"3.0"\`.

Notice there's no \`else\`. The early \`return\` is enough for \`tsc\` to narrow the rest of the function.
`,
    },
    {
      type: 'task',
      title: 'formatId',
      md: `
**Example** (already solved):

~~~
function size(x: string | number): number {
  if (typeof x === "string") {
    return x.length;
  }
  return x;
}
~~~

**Your turn:** write \`formatId(id: string | number): string\`.

- a number becomes \`"#"\` followed by the number
- a string is returned uppercased

~~~
formatId(7)     → "#7"
formatId("ab")  → "AB"
~~~
`,
      starter: `function formatId(id: string | number): string {
  // your code here
}
`,
      tests: [
        { name: 'formatId(7) is "#7"', code: `eq(formatId(7), "#7");` },
        { name: 'formatId("ab") is "AB"', code: `eq(formatId("ab"), "AB");` },
      ],
      hint: 'Start with `if (typeof id === "string") { return id.toUpperCase(); }`. After it, `id` is a number: return `"#" + id`.',
      solution: `function formatId(id: string | number): string {
  if (typeof id === "string") {
    return id.toUpperCase();
  }
  return \`#\${id}\`;
}
`,
    },
    {
      type: 'read',
      title: 'Narrowing with === and with truthiness',
      md: `
\`typeof\` isn't the only check \`tsc\` understands.

**Comparing with \`===\`** narrows a literal union:

~~~ts
type Status = "idle" | "loading" | "done";

function message(s: Status): string {
  if (s === "done") {
    return "Finished";        // s is "done"
  }
  return "Working: " + s;     // s is "idle" | "loading"
}

console.log(message("done"), "/", message("loading"));
~~~

**Truthiness** (JavaScript lesson 3) removes \`undefined\` and \`null\`:

~~~ts
function greet(name?: string): string {
  if (name) {
    return "Hello, " + name;  // name is string
  }
  return "Hello, stranger";
}

console.log(greet("Ada"), "/", greet());
~~~

\`name?: string\` on a parameter means the argument may be left out, so \`name\` is \`string | undefined\`. Lesson 5 covers optional parameters.

Truthiness has one trap, the same one it had in JavaScript: it also throws away \`0\` and \`""\`. Next step.
`,
    },
    {
      type: 'predict',
      title: 'The truthiness trap',
      md: '`count` is `number | undefined`. The check is `if (count)`.',
      code: `function show(count?: number): string {
  if (count) {
    return "count: " + count;
  }
  return "no count";
}

console.log(show(3));
console.log(show(0));`,
      output: `count: 3
no count`,
      explain: `
\`0\` is falsy, so \`show(0)\` falls through to \`"no count"\`, even though 0 is a real count. \`tsc\` doesn't warn you: \`if (count)\` is a legal narrowing check. It just isn't the check you meant.

When \`0\` or \`""\` are valid values, check for \`undefined\` directly:

~~~ts
function show(count?: number): string {
  if (count !== undefined) {
    return "count: " + count;   // count is number, including 0
  }
  return "no count";
}

console.log(show(0));
~~~
`,
    },
    {
      type: 'task',
      title: 'itemsLabel',
      md: `
Write \`itemsLabel(count?: number): string\`:

~~~
itemsLabel(3)          → "3 items"
itemsLabel(0)          → "0 items"
itemsLabel(undefined)  → "no data"
~~~

Zero is a real count here, so don't use plain truthiness.
`,
      starter: `function itemsLabel(count?: number): string {
  // your code here
}
`,
      tests: [
        { name: 'itemsLabel(3) is "3 items"', code: `eq(itemsLabel(3), "3 items");` },
        { name: 'itemsLabel(0) is "0 items", not "no data"', code: `eq(itemsLabel(0), "0 items");` },
        { name: 'no count gives "no data"', code: `eq(itemsLabel(undefined), "no data"); eq(itemsLabel(), "no data");` },
      ],
      hint: 'Check `if (count === undefined)` first and return `"no data"`. After that, `count` is a number.',
      solution: `function itemsLabel(count?: number): string {
  if (count === undefined) {
    return "no data";
  }
  return \`\${count} items\`;
}
`,
    },
    {
      type: 'read',
      title: 'Narrowing objects with in',
      md: `
\`typeof\` says \`"object"\` for every object, so it can't tell two object types apart. When the types have different keys, use the **\`in\`** operator: \`"key" in obj\` is \`true\` when the object has that key.

~~~ts
type EmailContact = { email: string };
type PhoneContact = { phone: string };

function reach(c: EmailContact | PhoneContact): string {
  if ("email" in c) {
    return "Mail " + c.email;    // c is EmailContact
  }
  return "Call " + c.phone;      // c is PhoneContact
}

console.log(reach({ email: "ada@example.com" }));
console.log(reach({ phone: "555-0100" }));
~~~

Without the check, \`c.email\` would be rejected, because \`c\` might be a phone contact:

~~~text
error TS2339: Property 'email' does not exist on type 'EmailContact | PhoneContact'.
  Property 'email' does not exist on type 'PhoneContact'.
~~~

\`in\` works, but a cleaner pattern is to give each object type a shared \`kind\` field with a different literal value. That's lesson 4.
`,
    },
    {
      type: 'task',
      title: 'contactValue',
      md: `
Write \`contactValue(c: EmailContact | PhoneContact): string\` that returns the email or the phone number, whichever the contact has. The types are in the starter.

~~~
contactValue({ email: "ada@example.com" })  → "ada@example.com"
contactValue({ phone: "555-0100" })         → "555-0100"
~~~
`,
      starter: `type EmailContact = { email: string };
type PhoneContact = { phone: string };

function contactValue(c: EmailContact | PhoneContact): string {
  // your code here
}
`,
      tests: [
        { name: 'an email contact gives the email', code: `eq(contactValue({ email: "ada@example.com" }), "ada@example.com");` },
        { name: 'a phone contact gives the phone number', code: `eq(contactValue({ phone: "555-0100" }), "555-0100");` },
      ],
      hint: 'Same shape as `reach`: `if ("email" in c) return c.email;`, then return `c.phone`.',
      solution: `type EmailContact = { email: string };
type PhoneContact = { phone: string };

function contactValue(c: EmailContact | PhoneContact): string {
  if ("email" in c) {
    return c.email;
  }
  return c.phone;
}
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nfunction f(x: string | number) {\n  console.log(x.toString());     // line A\n  console.log(x.toUpperCase());  // line B\n}\n~~~',
          choices: ['Line A', 'Line B', 'Neither'],
          answer: 1,
          explain: 'Both strings and numbers have `.toString()`, so line A is safe. Only strings have `.toUpperCase()`, and `x` might be a number: "Property \'toUpperCase\' does not exist on type \'string | number\'."',
          why: { 0: 'Every member of the union has `.toString()`, so it is allowed.', 2: 'Without narrowing, you can only use what every member has.' },
        },
        {
          q: 'Inside `if (typeof x === "string") { ... }`, where `x: string | number`, what is the type of `x`?',
          choices: ['`string`', '`string | number`', '`number`'],
          answer: 0,
          explain: '`tsc` reads the `typeof` check and narrows `x` to `string` inside that branch.',
          why: { 1: 'That is its type before the check. The check is what narrows it.', 2: '`number` is what is left after the branch, not inside it.' },
        },
        {
          q: '`count` is `number | undefined`. Which check keeps `0` as a real value?',
          choices: ['`if (count !== undefined)`', '`if (count)`', '`if (!count)`'],
          answer: 0,
          explain: 'Truthiness treats `0` as false, so `if (count)` would lump 0 together with "missing". Compare with `undefined` directly.',
          why: { 1: '`0` is falsy, so it would be treated like `undefined`.', 2: 'Same problem, reversed: `!0` is `true`.' },
        },
        {
          q: 'With `type A = { email: string }` and `type B = { phone: string }`, which check narrows `A | B` to `A`?',
          choices: ['`"email" in c`', '`typeof c === "object"`', '`c.email !== undefined`'],
          answer: 0,
          explain: '`in` checks for a key, and `tsc` uses it to pick the member that has that key.',
          why: { 1: 'Both are objects, so `typeof` gives `"object"` for either.', 2: '`tsc` rejects reading `c.email` before narrowing, because `B` has no `email` property.' },
        },
      ],
    },
  ],
};
