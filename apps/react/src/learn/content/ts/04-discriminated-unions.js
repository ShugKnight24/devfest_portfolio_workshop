// TS course · lesson 4. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
export default {
  id: 'discriminated-unions',
  builds: ['ts/unions-and-narrowing', 'js/reduce-and-sort'],
  title: 'Discriminated unions and exhaustive switch',
  goal: 'Model "one of several shapes" with a shared kind field, switch on it safely, and let tsc tell you when you forgot a case.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The problem: impossible states',
      md: `
A common first attempt at typing a data request looks like this:

~~~
type RequestState = {
  status: string;
  data?: string[];
  error?: string;
};
~~~

It compiles, but it allows nonsense: \`{ status: "loading", data: [...], error: "oops" }\`, or \`{ status: "sucess" }\` with a typo. Every reader has to guess which fields go with which status.

Instead, describe each state as its **own** object type, and join them with \`|\`:

~~~ts
type RequestState =
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; error: string };

const a: RequestState = { status: "loading" };
const b: RequestState = { status: "success", data: ["Ada"] };
console.log(a.status, b.status);
~~~

Each member has a \`status\` field with a different **literal type** (lesson 3). That shared field is called the **discriminant**, and the whole thing is a **discriminated union**. Now \`data\` only exists on success and \`error\` only on error. The impossible states can't be written.
`,
    },
    {
      type: 'predict',
      title: 'Switching on the discriminant',
      code: `type RequestState =
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; error: string };

function render(s: RequestState): string {
  switch (s.status) {
    case "loading":
      return "Loading...";
    case "success":
      return "Got " + s.data.length + " items";
    case "error":
      return "Failed: " + s.error;
  }
}

console.log(render({ status: "loading" }));
console.log(render({ status: "success", data: ["a", "b"] }));
console.log(render({ status: "error", error: "timeout" }));`,
      output: `Loading...
Got 2 items
Failed: timeout`,
      explain: `
Each \`case\` is an \`===\` check on \`s.status\`, so \`tsc\` narrows \`s\` to one member per case:

- in \`case "success"\`, \`s\` is \`{ status: "success"; data: string[] }\`, so \`s.data\` is allowed
- in \`case "error"\`, \`s\` is the error member, so \`s.error\` is allowed

Notice \`tsc\` didn't complain that the function might not return. It knows the three cases cover every possible \`status\`.
`,
    },
    {
      type: 'read',
      title: 'Using a field from the wrong case',
      md: `
Reach for \`data\` inside the error case and \`tsc\` stops you:

~~~
case "error":
  return "Failed: " + s.data;
~~~

~~~text
error TS2339: Property 'data' does not exist on type '{ status: "error"; error: string; }'.
~~~

Look at the type in the message: it's the error member alone, not the whole union. That's narrowing at work, and it's the main payoff. With the old "optional fields" version, \`s.data\` would have type-checked fine and been \`undefined\` at runtime.
`,
    },
    {
      type: 'task',
      title: 'area of a shape',
      md: `
The \`Shape\` type is in the starter, with \`kind\` as the discriminant. Write \`area(shape: Shape): number\` using a \`switch\` on \`shape.kind\`:

- circle: \`Math.PI * r * r\`
- square: \`side * side\`
- rect: \`width * height\`

~~~
area({ kind: "square", side: 3 })            → 9
area({ kind: "rect", width: 2, height: 5 })  → 10
area({ kind: "circle", r: 1 })               → 3.141592653589793
~~~
`,
      starter: `type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; side: number }
  | { kind: "rect"; width: number; height: number };

function area(shape: Shape): number {
  // your code here
}
`,
      tests: [
        { name: 'a square with side 3 has area 9', code: `eq(area({ kind: "square", side: 3 }), 9);` },
        { name: 'a 2 by 5 rect has area 10', code: `eq(area({ kind: "rect", width: 2, height: 5 }), 10);` },
        { name: 'a circle with r 1 has area Math.PI', code: `eq(area({ kind: "circle", r: 1 }), Math.PI);` },
      ],
      hint: 'Copy the `switch` from `render`, switching on `shape.kind`. Inside `case "circle":` you can use `shape.r`.',
      solution: `type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; side: number }
  | { kind: "rect"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.r * shape.r;
    case "square":
      return shape.side * shape.side;
    case "rect":
      return shape.width * shape.height;
  }
}
`,
    },
    {
      type: 'read',
      title: 'Forgetting a case, and never',
      md: `
Six months later someone adds \`{ kind: "triangle"; base: number; height: number }\` to \`Shape\`. Every \`switch\` on \`kind\` now has a missing case. How do you find them all?

TypeScript has a type called **\`never\`**: the type with **no values at all**. After a \`switch\` has handled every member, the leftover type of \`shape\` is \`never\`. So you can add a \`default\` that says "this should be impossible":

~~~
function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.r * shape.r;
    case "square": return shape.side * shape.side;
    case "rect":   return shape.width * shape.height;
    default: {
      const unreachable: never = shape;
      throw new Error("Unknown shape");
    }
  }
}
~~~

While every case is handled, \`shape\` in \`default\` is \`never\`, and the assignment is fine. Add \`triangle\` to \`Shape\` without a case, and the leftover is the triangle type:

~~~text
error TS2322: Type '{ kind: "triangle"; base: number; height: number; }' is not assignable to type 'never'.
~~~

The error points at every switch you forgot to update, and even names the case that's missing. This is called an **exhaustive check**.
`,
    },
    {
      type: 'task',
      title: 'assertNever',
      md: `
Writing \`const unreachable: never = shape\` in every switch gets repetitive. Most codebases have a tiny helper instead. Write \`assertNever(value: never): never\` that throws an \`Error\` whose message is \`"Unexpected value: "\` followed by \`JSON.stringify(value)\`.

~~~
assertNever({ kind: "triangle" })
  → throws an Error with the message: Unexpected value: {"kind":"triangle"}
~~~

The return type \`never\` means "this function never returns normally": it always throws.
`,
      starter: `function assertNever(value: never): never {
  // your code here
}
`,
      tests: [
        { name: 'it throws', code: `throws(() => assertNever("x"));` },
        {
          name: 'the message includes the value as JSON',
          code: `let message = "";
try { assertNever({ kind: "triangle" }); } catch (e) { message = e.message; }
eq(message, 'Unexpected value: {"kind":"triangle"}');`,
        },
      ],
      hint: 'One line: `throw new Error("Unexpected value: " + JSON.stringify(value));`',
      solution: `function assertNever(value: never): never {
  throw new Error("Unexpected value: " + JSON.stringify(value));
}
`,
      explain: `
Now each switch ends with \`default: return assertNever(shape);\`. You get both safety nets:

- **at compile time**, \`tsc\` rejects the call when a case is missing, because \`shape\` isn't \`never\`
- **at runtime**, bad data that slipped past the types (say, from an API) throws a clear error instead of returning \`undefined\`
`,
    },
    {
      type: 'predict',
      title: 'Why the runtime half matters',
      md: 'Types are erased, so nothing stops bad data at runtime. This `kind` came from `JSON.parse`, which is typed as `any`.',
      code: `function assertNever(value: never): never {
  throw new Error("Unexpected value: " + JSON.stringify(value));
}

type Shape = { kind: "square"; side: number } | { kind: "rect"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "square": return shape.side * shape.side;
    case "rect": return shape.width * shape.height;
    default: return assertNever(shape);
  }
}

const fromApi = JSON.parse('{ "kind": "hexagon" }');
console.log(area(fromApi));`,
      throws: true,
      output: `Error: Unexpected value: {"kind":"hexagon"}`,
      explain: `
\`tsc\` accepted \`area(fromApi)\` because \`fromApi\` is \`any\`. At runtime, \`"hexagon"\` matches no case, lands in \`default\`, and \`assertNever\` throws with a message that shows the bad value.

Without the \`default\`, \`area\` would have returned \`undefined\`, and the bug would surface far away as \`NaN\` on a screen. Lesson 9 shows how to check JSON before trusting it.
`,
    },
    {
      type: 'task',
      title: 'A typed reducer',
      md: `
Discriminated unions are how actions are typed for \`reduce\` (JavaScript lesson 11) and for React's \`useReducer\`. Each action has a \`type\` field as its discriminant.

Write \`apply(total: number, action: Action): number\`:

- \`{ type: "add", amount }\` returns \`total + amount\`
- \`{ type: "subtract", amount }\` returns \`total - amount\`
- \`{ type: "reset" }\` returns \`0\`

~~~
apply(10, { type: "add", amount: 5 })  → 15
apply(10, { type: "reset" })           → 0
[{ type: "add", amount: 5 }, { type: "subtract", amount: 2 }].reduce(apply, 0)  → 3
~~~

\`assertNever\` is already in the starter. End your switch with \`default: return assertNever(action);\`.
`,
      starter: `type Action =
  | { type: "add"; amount: number }
  | { type: "subtract"; amount: number }
  | { type: "reset" };

function assertNever(value: never): never {
  throw new Error("Unexpected value: " + JSON.stringify(value));
}

function apply(total: number, action: Action): number {
  // your code here
}
`,
      tests: [
        { name: 'add 5 to 10 gives 15', code: `eq(apply(10, { type: "add", amount: 5 }), 15);` },
        { name: 'subtract 4 from 10 gives 6', code: `eq(apply(10, { type: "subtract", amount: 4 }), 6);` },
        { name: 'reset gives 0', code: `eq(apply(10, { type: "reset" }), 0);` },
        { name: 'works as a reduce callback', code: `eq([{ type: "add", amount: 5 }, { type: "subtract", amount: 2 }].reduce(apply, 0), 3);` },
      ],
      hint: '`switch (action.type)` with three cases. Only the add and subtract cases can read `action.amount`.',
      solution: `type Action =
  | { type: "add"; amount: number }
  | { type: "subtract"; amount: number }
  | { type: "reset" };

function assertNever(value: never): never {
  throw new Error("Unexpected value: " + JSON.stringify(value));
}

function apply(total: number, action: Action): number {
  switch (action.type) {
    case "add":
      return total + action.amount;
    case "subtract":
      return total - action.amount;
    case "reset":
      return 0;
    default:
      return assertNever(action);
  }
}
`,
      explain: 'A React `useReducer` reducer is this exact function with `state` instead of `total`. You will see the same shape again in lesson 10, where a `Result` type is a two-member discriminated union.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'What makes a union "discriminated"?',
          choices: ['Every member has the same field with a different literal type', 'Every member is an object', 'The members share no fields'],
          answer: 0,
          explain: 'The shared field (like `status` or `kind`) with a different literal value in each member is what `tsc` switches on to narrow.',
          why: { 1: 'Objects alone are not enough. `{ email } | { phone }` needs `in` to narrow.', 2: 'It is the opposite: they must share the discriminant field.' },
        },
        {
          q: 'Which line does `tsc` reject?\n\n~~~\ntype S = { status: "ok"; data: string } | { status: "fail"; error: string };\nfunction f(s: S) {\n  if (s.status === "fail") {\n    console.log(s.error);  // line A\n    console.log(s.data);   // line B\n  }\n}\n~~~',
          choices: ['Line A', 'Line B', 'Neither'],
          answer: 1,
          explain: 'Inside the `"fail"` branch, `s` is only the fail member, which has no `data`: "Property \'data\' does not exist on type \'{ status: "fail"; error: string; }\'."',
          why: { 0: '`error` exists on the fail member.', 2: 'Narrowing removes the ok member, and its `data` with it.' },
        },
        {
          q: 'What is the type `never`?',
          choices: ['A type with no possible values', 'Another name for `undefined`', 'A type that allows any value'],
          answer: 0,
          explain: 'Nothing can be assigned to `never`. That is why assigning a leftover case to it fails, and why a function that always throws returns `never`.',
          why: { 1: '`undefined` is a real value. `never` has none.', 2: 'That is `any`, the opposite.' },
        },
        {
          q: 'You add a new member to a union, and a switch with `default: return assertNever(x)` does not handle it. What happens?',
          choices: ['tsc reports an error on the assertNever line', 'tsc says nothing, and it throws at runtime', 'The new member is ignored'],
          answer: 0,
          explain: 'The leftover type is the new member, which is not assignable to `never`, so `tsc` points straight at the switch you need to update.',
          why: { 1: 'The point of the `never` parameter is that `tsc` catches it before runtime.', 2: 'It is caught, not ignored.' },
        },
      ],
    },
  ],
};
