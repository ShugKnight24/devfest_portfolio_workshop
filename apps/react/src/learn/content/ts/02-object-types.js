// TS course · lesson 2. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
export default {
  id: 'object-types',
  builds: ['ts/why-types', 'js/objects', 'js/spread-and-destructuring', 'js/classes-and-this'],
  title: 'Object types: type aliases, interfaces, optional and readonly',
  goal: 'Describe the shape of an object once, give it a name, and use it everywhere: required, optional and readonly properties.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'Naming a shape',
      md: `
In JavaScript lesson 7 you built objects like \`{ id: 1, name: "Ada" }\`. In TypeScript you describe that shape once with a **type alias**, then use the name:

~~~ts
type User = {
  id: number;
  name: string;
};

function label(user: User): string {
  return \`#\${user.id} \${user.name}\`;
}

const ada: User = { id: 1, name: "Ada" };
console.log(label(ada));
~~~

- \`type User = { ... }\` creates a name for a shape. It produces no JavaScript at all.
- Inside the braces, each line is \`key: type\`. Semicolons or commas both work; semicolons are the usual style.
- \`user: User\` means "user must have at least an \`id\` that is a number and a \`name\` that is a string".

Inside \`label\`, your editor now knows exactly what \`user.\` can be followed by. That autocomplete is half the reason people use TypeScript.
`,
    },
    {
      type: 'read',
      title: 'Missing and misspelled properties',
      md: `
Two mistakes \`tsc\` catches with object types.

**A missing property:**

~~~
const u: User = { id: 1 };
~~~

~~~text
error TS2741: Property 'name' is missing in type '{ id: number; }' but required in type 'User'.
~~~

**A typo in an object literal:**

~~~
const u: User = { id: 1, name: "Ada", nmae: "Ada" };
~~~

~~~text
error TS2353: Object literal may only specify known properties, and 'nmae' does not exist in type 'User'.
~~~

And reading a property that isn't in the type:

~~~
console.log(ada.email);
~~~

~~~text
error TS2339: Property 'email' does not exist on type 'User'.
~~~

In plain JavaScript, all three would run and quietly give you \`undefined\` somewhere later. Here they fail at the line that's wrong.
`,
    },
    {
      type: 'check',
      title: 'Which line is rejected?',
      md: 'Assume `type User = { id: number; name: string };` for every question.',
      items: [
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nconst a: User = { id: 1, name: "Ada" };  // line A\nconst b: User = { name: "Linus" };       // line B\n~~~',
          choices: ['Line A', 'Line B', 'Neither'],
          answer: 1,
          explain: 'Line B has no `id`: "Property \'id\' is missing in type \'{ name: string; }\' but required in type \'User\'."',
          why: { 0: 'Both required properties are there with the right types.', 2: 'Every property without a `?` is required.' },
        },
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nconst a: User = { id: "1", name: "Ada" };  // line A\nconst b: User = { id: 1, name: "Ada" };    // line B\n~~~',
          choices: ['Line A', 'Line B', 'Neither'],
          answer: 0,
          explain: '`"1"` is a string, but `id` was promised as a number: "Type \'string\' is not assignable to type \'number\'."',
          why: { 1: 'Both values match their property types.', 2: 'TypeScript checks each property\'s type, not just that the key exists.' },
        },
        {
          q: 'Which line does `tsc` reject?\n\n~~~\nfunction show(u: User) {\n  console.log(u.name);   // line A\n  console.log(u.age);    // line B\n}\n~~~',
          choices: ['Line A', 'Line B', 'Neither'],
          answer: 1,
          explain: '`User` has no `age`, so `u.age` gives "Property \'age\' does not exist on type \'User\'."',
          why: { 0: '`name` is part of `User`.', 2: 'Reading a property that is not in the type is an error, even though JavaScript would just give `undefined`.' },
        },
      ],
    },
    {
      type: 'read',
      title: 'Optional properties',
      md: `
Some properties are only sometimes there. Mark them with **\`?\`**:

~~~ts
type User = {
  id: number;
  name: string;
  email?: string;   // may be missing
};

const a: User = { id: 1, name: "Ada", email: "ada@example.com" };
const b: User = { id: 2, name: "Linus" };   // fine: email is optional

console.log(a.email, b.email);
~~~

The type of \`email\` is now \`string | undefined\` ("a string or undefined", lesson 3 covers \`|\`). \`tsc\` won't let you treat it as a plain string:

~~~
const e: string = b.email;
~~~

~~~text
error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
~~~

The second line of the message tells you which part didn't fit: the \`undefined\` part. You have to handle that case, for example with \`??\`:

~~~ts
type User = { id: number; name: string; email?: string };
const b: User = { id: 2, name: "Linus" };

const e: string = b.email ?? "no email";
console.log(e);
~~~
`,
    },
    {
      type: 'predict',
      title: 'Reading an optional property',
      code: `type User = { id: number; name: string; email?: string };

const users: User[] = [
  { id: 1, name: "Ada", email: "ada@example.com" },
  { id: 2, name: "Linus" },
];

for (const u of users) {
  console.log(u.name, u.email ?? "-");
}`,
      output: `Ada ada@example.com
Linus -`,
      explain: `
\`??\` (JavaScript lesson 3) uses the right side only when the left is \`null\` or \`undefined\`. Linus has no \`email\` key, so \`u.email\` is \`undefined\` and you get \`"-"\`.

\`User[]\` means "an array of User". Lesson 6 covers array types properly.
`,
    },
    {
      type: 'task',
      title: 'contactLine',
      md: `
The \`User\` type is in the starter. Write \`contactLine(user: User): string\`:

- with an email: \`"Ada <ada@example.com>"\`
- without one: \`"Linus (no email)"\`

~~~
contactLine({ id: 1, name: "Ada", email: "ada@example.com" })  → "Ada <ada@example.com>"
contactLine({ id: 2, name: "Linus" })                         → "Linus (no email)"
~~~
`,
      starter: `type User = { id: number; name: string; email?: string };

function contactLine(user: User): string {
  // your code here
}
`,
      tests: [
        { name: 'a user with an email shows it in angle brackets', code: `eq(contactLine({ id: 1, name: "Ada", email: "ada@example.com" }), "Ada <ada@example.com>");` },
        { name: 'a user without an email shows (no email)', code: `eq(contactLine({ id: 2, name: "Linus" }), "Linus (no email)");` },
      ],
      hint: 'Check `if (user.email)` first and return the angle-bracket version. After the `if`, return the `(no email)` version.',
      solution: `type User = { id: number; name: string; email?: string };

function contactLine(user: User): string {
  if (user.email) {
    return \`\${user.name} <\${user.email}>\`;
  }
  return \`\${user.name} (no email)\`;
}
`,
      explain: 'Inside `if (user.email)`, `tsc` knows `user.email` is a string, not `undefined`. That is called narrowing, and it is the whole of lesson 3.',
    },
    {
      type: 'read',
      title: 'readonly properties',
      md: `
Some fields should never change after an object is created, like an \`id\`. Mark them **\`readonly\`**:

~~~
type User = {
  readonly id: number;
  name: string;
};

const u: User = { id: 1, name: "Ada" };
u.name = "Ada Lovelace";  // fine
u.id = 2;                 // rejected
~~~

~~~text
error TS2540: Cannot assign to 'id' because it is a read-only property.
~~~

Two things to know:

- \`readonly\` is a **compile-time** rule, like every type. After erasing, \`u.id = 2\` is ordinary JavaScript and would run. It protects you while writing code, not at runtime.
- It's **shallow**. \`readonly tags: string[]\` stops you replacing \`tags\` with a new array, but \`u.tags.push("x")\` is still allowed. Lesson 6 shows readonly arrays.
`,
    },
    {
      type: 'read',
      title: 'interface: the other way to name a shape',
      md: `
You will see object shapes written with **\`interface\`** just as often:

~~~ts
interface Product {
  id: number;
  name: string;
  price: number;
}

const p: Product = { id: 1, name: "Pen", price: 2 };
console.log(p.name, p.price);
~~~

For describing an object, \`type X = { ... }\` and \`interface X { ... }\` do the same job. Note there is no \`=\` after \`interface\`. The differences that matter day to day:

| | \`type\` | \`interface\` |
|---|---|---|
| object shapes | yes | yes |
| unions (lesson 3) | yes | no |
| extending | \`type B = A & { x: number }\` | \`interface B extends A { x: number }\` |

Because unions (next lesson) need \`type\`, many teams use \`type\` everywhere and \`interface\` only where a library expects it. Others prefer \`interface\` for objects. Both are fine. Match the codebase you are in.
`,
    },
    {
      type: 'task',
      title: 'Write the type yourself',
      md: `
This time you write the shape too.

1. Declare \`interface Product\` with \`id\` (number), \`name\` (string) and \`price\` (number).
2. Write \`isCheap(product: Product): boolean\` that returns \`true\` when the price is under 10.

~~~
isCheap({ id: 1, name: "Pen", price: 2 })     → true
isCheap({ id: 2, name: "Lamp", price: 40 })   → false
~~~
`,
      starter: `// 1. interface Product here

// 2. isCheap here
`,
      tests: [
        { name: 'a price of 2 is cheap', code: `eq(isCheap({ id: 1, name: "Pen", price: 2 }), true);` },
        { name: 'a price of 40 is not cheap', code: `eq(isCheap({ id: 2, name: "Lamp", price: 40 }), false);` },
        { name: 'exactly 10 is not cheap', code: `eq(isCheap({ id: 3, name: "Mug", price: 10 }), false);` },
      ],
      hint: 'Copy the `interface Product` from the previous step. The function body is one line: `return product.price < 10;`',
      solution: `interface Product {
  id: number;
  name: string;
  price: number;
}

function isCheap(product: Product): boolean {
  return product.price < 10;
}
`,
    },
    {
      type: 'task',
      title: 'rename without changing the original',
      md: `
Back to spread from JavaScript lesson 12. Write \`rename(user: User, name: string): User\` that returns a **new** user with the new name. The original must not change.

~~~
rename({ id: 1, name: "Ada" }, "Ada L.")  → { id: 1, name: "Ada L." }
~~~

The return type \`User\` means \`tsc\` would check that your new object still has every required field.
`,
      starter: `type User = { readonly id: number; name: string };

function rename(user: User, name: string): User {
  // your code here
}
`,
      tests: [
        { name: 'returns the user with the new name', code: `eq(rename({ id: 1, name: "Ada" }, "Ada L."), { id: 1, name: "Ada L." });` },
        { name: 'does not change the original user', code: `const original = { id: 1, name: "Ada" }; rename(original, "Ada L."); eq(original.name, "Ada", "the original changed: return { ...user, name } instead of setting user.name");` },
      ],
      hint: 'One line: `return { ...user, name };` copies every field, then overwrites `name`.',
      solution: `type User = { readonly id: number; name: string };

function rename(user: User, name: string): User {
  return { ...user, name };
}
`,
      explain: '`{ ...user, name }` is shorthand for `{ ...user, name: name }`. Spreading a `readonly id` into a new object is fine: you are creating the field, not reassigning it.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'With `type User = { id: number; email?: string }`, what is the type of `user.email`?',
          choices: ['`string | undefined`', '`string`', '`undefined`'],
          answer: 0,
          explain: 'The `?` means the key may be missing, and a missing key reads as `undefined`. So the type is "a string or undefined", and you must handle both.',
          why: { 1: 'That would let you call `.toUpperCase()` on something that might be `undefined`.', 2: 'It can be a string when the key is present.' },
        },
        {
          q: 'Which line does `tsc` reject?\n\n~~~\ntype Point = { readonly x: number; y: number };\nconst p: Point = { x: 1, y: 2 };\np.y = 5;  // line A\np.x = 5;  // line B\n~~~',
          choices: ['Line A', 'Line B', 'Both'],
          answer: 1,
          explain: '"Cannot assign to \'x\' because it is a read-only property." `y` is not readonly, so line A is fine.',
          why: { 0: '`y` has no `readonly`, so it can be reassigned.', 2: 'Only `x` is marked `readonly`.' },
        },
        {
          q: 'Is `readonly` enforced when the code runs?',
          choices: ['No, it is checked by tsc and then erased', 'Yes, the object is frozen', 'Yes, assigning throws a TypeError'],
          answer: 0,
          explain: 'Like every type, `readonly` exists only for `tsc`. If you want a runtime guarantee, `Object.freeze` is the JavaScript tool for that.',
          why: { 1: 'Nothing calls `Object.freeze` for you.', 2: 'The erased JavaScript is a plain assignment, which just works.' },
        },
        {
          q: 'You need a type for `"light" | "dark"`. Which keyword can express it?',
          choices: ['`type`', '`interface`', 'Either one'],
          answer: 0,
          explain: '`type Theme = "light" | "dark"` works. An `interface` can only describe an object shape, so it cannot be a union.',
          why: { 1: 'Interfaces describe objects, not unions of values.', 2: 'Only `type` can name a union.' },
        },
      ],
    },
  ],
};
