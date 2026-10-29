// JS course · lesson 7. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'objects',
  builds: ['js/loops'],
  title: 'Objects',
  goal: 'Store and read labeled data, understand why two names can share one object, and copy objects the way React state needs.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'The problem objects solve',
      md: `
Say you want to describe one person. With plain variables, it's a mess of loose pieces:

~~~
const userName = "Ada";
const userAge = 36;
const userEmail = "ada@example.com";
~~~

Nothing ties those three together. You can't hand "the user" to a function in one go.

An **object** bundles them into one value, and gives each piece a **label**:

~~~js
const user = { name: "Ada", age: 36, email: "ada@example.com" };
console.log(user);
~~~

**Mental model: an object is a set of labeled boxes.** Each box has a **key** (the label, like \`name\`) and a **value** (what's in it, like \`"Ada"\`). Together they're called **key-value pairs**.

| key | value |
|---|---|
| \`name\` | \`"Ada"\` |
| \`age\` | \`36\` |
| \`email\` | \`"ada@example.com"\` |

Arrays (lesson 5) find things by **position**. Objects find things by **name**.
`,
    },
    {
      type: 'predict',
      title: 'Reading a box',
      md: 'The dot reads the box with that label. One of these labels doesn\'t exist.',
      code: `const user = { name: "Ada", age: 36 };
console.log(user.name);
console.log(user.age + 1);
console.log(user.email);`,
      output: `Ada
37
undefined`,
      explain: `
- \`user.name\` opens the box labeled \`name\`.
- \`user.age + 1\` reads 36, then adds 1. The object itself doesn't change.
- \`user.email\`: there is no box with that label, so you get \`undefined\`. No error, just like reading a missing array index.
`,
    },
    {
      type: 'task',
      title: 'getName',
      md: `
**Example** (already solved):

~~~
function getAge(user) {
  return user.age;
}
~~~

**Your turn:** \`getName({ name: "Ada", age: 36 })\` returns \`"Ada"\`.
`,
      starter: `function getName(user) {
  // your code here
}
`,
      tests: [
        { name: 'getName({ name: "Ada", age: 36 }) is "Ada"', code: `eq(getName({ name: "Ada", age: 36 }), "Ada");` },
        { name: 'works for a different user', code: `eq(getName({ name: "Grace", age: 85 }), "Grace");` },
      ],
      hint: 'Same as `getAge`, with `user.name`.',
      solution: `function getName(user) {
  return user.name;
}
`,
    },
    {
      type: 'read',
      title: 'Building objects',
      md: `
You write an object with curly braces, \`key: value\` pairs and commas between them:

~~~js
const x = 3;
const y = 4;

const point = { x: x, y: y };
console.log(point);

const same = { x, y };          // shorthand: when the key and the variable have the same name
console.log(same);
~~~

\`{ x, y }\` is short for \`{ x: x, y: y }\`. You'll see the shorthand everywhere in real code, so get used to reading it.

You can also add or change a box after the object exists:

~~~js
const user = { name: "Ada" };
user.age = 36;          // adds a new box
user.name = "Ada L.";   // changes an existing one
console.log(user);
~~~
`,
    },
    {
      type: 'task',
      title: 'makeUser',
      md: `
**Example:** build and return an object.

~~~
function makePoint(x, y) {
  return { x: x, y: y };
}
~~~

**Your turn:** \`makeUser("Ada", 36)\` returns \`{ name: "Ada", age: 36 }\`. Try the shorthand \`{ name, age }\` once it works.
`,
      starter: `function makeUser(name, age) {
  // your code here
}
`,
      tests: [
        { name: 'makeUser("Ada", 36) is { name: "Ada", age: 36 }', code: `eq(makeUser("Ada", 36), { name: "Ada", age: 36 });` },
      ],
      hint: '`return { name: name, age: age };` (or the shorthand `return { name, age };`).',
      solution: `function makeUser(name, age) {
  return { name, age }; // shorthand for { name: name, age: age }
}
`,
    },
    {
      type: 'read',
      title: 'Dot vs brackets',
      md: `
There are two ways to read a box:

~~~js
const user = { name: "Ada", age: 36 };
console.log(user.name);       // dot: the label is typed right there
console.log(user["name"]);    // brackets: the label is a string
~~~

They do the same thing **when you type the label yourself**. The difference shows up when the label is **stored in a variable**:

~~~js
const user = { name: "Ada", age: 36 };
const field = "age";
console.log(user[field]);     // brackets read the VALUE of field, which is "age"
~~~

The rule:
- **Dot** \`user.field\` means "the box literally labeled \`field\`".
- **Brackets** \`user[field]\` mean "work out what \`field\` holds, then use that as the label".

So whenever the key comes from a variable or a function parameter, you need brackets.
`,
    },
    {
      type: 'predict',
      title: 'The bracket trap',
      md: 'This object has a box literally labeled `key`. Read each line carefully.',
      code: `const user = { name: "Ada", key: "oops" };
const key = "name";
console.log(user.key);
console.log(user[key]);
console.log(user["key"]);`,
      output: `oops
Ada
oops`,
      explain: `
- \`user.key\`: the dot means the label is literally \`key\`, so you get \`"oops"\`. The variable \`key\` is ignored.
- \`user[key]\`: brackets look inside the variable \`key\`, find \`"name"\`, and read \`user.name\`.
- \`user["key"]\`: brackets with a string in quotes, so the label is literally \`"key"\` again.

This exact mix-up is behind a lot of "why is it undefined?" bugs.
`,
    },
    {
      type: 'task',
      title: 'getField',
      md: `\`getField({ a: 1, b: 2 }, "b")\` returns \`2\`. The key arrives in a variable, so use brackets.`,
      starter: `function getField(obj, key) {
  // your code here
}
`,
      tests: [
        { name: 'getField({ a: 1, b: 2 }, "b") is 2', code: `eq(getField({ a: 1, b: 2 }, "b"), 2);` },
        { name: 'getField({ a: 1, b: 2 }, "a") is 1', code: `eq(getField({ a: 1, b: 2 }, "a"), 1);` },
      ],
      hint: '`return obj[key];` (with `obj.key` you\'d be reading a box literally labeled "key").',
      solution: `function getField(obj, key) {
  return obj[key]; // brackets: use what key HOLDS as the label
}
`,
    },
    {
      type: 'read',
      title: 'The big one: references, not copies',
      md: `
This is the most important idea in the lesson. Take it slowly.

When you make an object, JS puts it somewhere in memory. Your variable doesn't hold the object itself. It holds **directions to it**, like a house address written on a piece of paper.

~~~
const a = { name: "Ada", age: 36 };
// a holds: "the object at address #1"
~~~

Now copy the variable:

~~~
const b = a;
// b holds: "the object at address #1"   (the same address!)
~~~

\`b = a\` copied the **address**, not the house. There is still only **one** object. \`a\` and \`b\` are two pieces of paper with the same address on them.

| line | \`a\` points to | \`b\` points to | how many objects exist |
|---|---|---|---|
| \`const a = { ... }\` | #1 | | 1 |
| \`const b = a\` | #1 | #1 | still 1 |

So if you walk to the house through \`b\` and repaint it, someone who walks there through \`a\` sees the new paint. Predict what that means in the next step.

(Numbers and strings don't work like this. \`let y = x\` really does copy a number. It's objects and arrays that are shared.)
`,
    },
    {
      type: 'predict',
      title: 'Two names, one object',
      code: `const a = { name: "Ada", age: 36 };
const b = a;
b.age = 99;
console.log(a.age);
console.log(a === b);`,
      output: `99
true`,
      explain: `
\`b.age = 99\` changed **the** object, and \`a\` points at the same object, so \`a.age\` is 99 too.

\`a === b\` is \`true\` because for objects, \`===\` asks "is this the **same object**?", not "do they look alike?":

~~~js
console.log({ x: 1 } === { x: 1 });
~~~

Run that: two separate objects with identical contents are **not** \`===\`.
`,
    },
    {
      type: 'predict', throws: true,
      title: "const doesn't freeze an object",
      md: 'The object is `const`. Can you change it? Can you replace it?',
      code: `const user = { name: "Ada" };
user.name = "Grace";
console.log(user.name);
user = { name: "Linus" };`,
      output: `Grace
! Assignment to constant variable.`,
      explain: `
\`const\` locks the **piece of paper**, not the house.

- \`user.name = "Grace"\` repaints the house. Allowed. The paper still has the same address.
- \`user = { ... }\` tries to write a **new address** on the paper. That's what \`const\` forbids, so it throws.

So \`const\` means "this name always points to the same object", **not** "this object never changes".
`,
    },
    {
      type: 'read',
      title: 'Making a real copy: spread',
      md: `
To get a **second, separate** object, build a new one and pour the old one's boxes into it with spread \`...\`:

~~~js
const a = { name: "Ada", age: 36 };
const copy = { ...a };
copy.age = 99;
console.log(a.age, copy.age);
console.log(a === copy);
~~~

Even better, change a box **while** you copy. Later keys win, so this copies everything, then overwrites \`age\`:

~~~js
const a = { name: "Ada", age: 36 };
const older = { ...a, age: a.age + 1 };
console.log(a);
console.log(older);
~~~

| line | objects that exist |
|---|---|
| \`const a = { ... }\` | #1 (Ada, 36) |
| \`const older = { ...a, age: 37 }\` | #1 (Ada, 36) **and** #2 (Ada, 37) |

This "copy with one change" is the move you'll make a hundred times in React.
`,
    },
    {
      type: 'task',
      title: 'withEmail',
      md: `
**Example:** a new object with one field changed. The original stays the same.

~~~
function birthday(user) {
  return { ...user, age: user.age + 1 };
}
~~~

**Your turn:** \`withEmail({ name: "Ada" }, "a@b.com")\` returns \`{ name: "Ada", email: "a@b.com" }\` as a **new** object, without changing the original.
`,
      starter: `function withEmail(user, email) {
  // your code here
}
`,
      tests: [
        { name: 'adds the email', code: `eq(withEmail({ name: "Ada" }, "a@b.com"), { name: "Ada", email: "a@b.com" });` },
        { name: 'does not change the original', code: `const user = { name: "Ada" }; withEmail(user, "a@b.com"); eq(user, { name: "Ada" }, "the original changed: copy with { ...user, email } instead of setting user.email");` },
        { name: 'returns a new object', code: `const user = { name: "Ada" }; assert(withEmail(user, "a@b.com") !== user, "you returned the same object");` },
      ],
      hint: 'Same shape as `birthday`: `return { ...user, email: email };` (or `{ ...user, email }`).',
      solution: `function withEmail(user, email) {
  return { ...user, email }; // new object: all of user's boxes, plus email
}
`,
    },
    {
      type: 'predict',
      title: 'Spread is a shallow copy',
      md: 'Spread copies the top-level boxes. But `tags` holds an array, and arrays are objects too.',
      code: `const a = { name: "Ada", tags: ["math"] };
const b = { ...a };
b.tags.push("code");
console.log(a.tags);
console.log(a.tags === b.tags);`,
      output: `[ "math", "code" ]
true`,
      explain: `
\`{ ...a }\` made a new outer object, but it copied the \`tags\` box's **contents**, and that content is an **address** to an array. So \`a.tags\` and \`b.tags\` point at the same array.

This is called a **shallow** copy: one level deep. To change something nested, copy each level you touch:

~~~js
const a = { name: "Ada", tags: ["math"] };
const b = { ...a, tags: [...a.tags, "code"] };
console.log(a.tags, b.tags);
~~~
`,
    },
    {
      type: 'read',
      title: 'Why this is THE React state rule',
      md: `
React decides whether to re-render by checking whether your new state is a **different object** from the old one (the \`===\` you just saw). It does **not** look inside.

So if you change the object in place, React sees the same address and thinks nothing happened:

~~~
// BUG: same object, React skips the re-render
user.name = "Grace";
setUser(user);

// OK: a new object, React re-renders
setUser({ ...user, name: "Grace" });
~~~

That's why every React tutorial says "don't mutate state". Now you know the reason: **a mutated object is still the same object**.

The rule for state:
1. Never change it in place.
2. Make a copy with the change: \`{ ...old, field: newValue }\`.
3. For nested data, copy each level you change (the \`tags\` example).
`,
    },
    {
      type: 'task',
      title: 'hasKey',
      md: `
To ask "does this object have a box with this label?", use \`in\`:

~~~
"name" in { name: "Ada" }   // true
"email" in { name: "Ada" }  // false
~~~

**Your turn:** \`hasKey({ a: 1 }, "a")\` returns \`true\`. \`hasKey({ a: 1 }, "z")\` returns \`false\`. Use \`in\`.
`,
      starter: `function hasKey(obj, key) {
  // your code here
}
`,
      tests: [
        { name: 'hasKey({ a: 1 }, "a") is true', code: `eq(hasKey({ a: 1 }, "a"), true);` },
        { name: 'hasKey({ a: 1 }, "z") is false', code: `eq(hasKey({ a: 1 }, "z"), false);` },
        { name: 'a key holding 0 still counts', code: `eq(hasKey({ count: 0 }, "count"), true);` },
      ],
      hint: '`return key in obj;` (the key goes on the left, the object on the right).',
      solution: `function hasKey(obj, key) {
  return key in obj; // checks the label exists, even if its value is 0 or ""
}
`,
      explain: 'Why not `if (obj[key])`? Because a box holding `0`, `""` or `false` exists but is falsy. `in` only asks whether the label is there.',
    },
    {
      type: 'read',
      title: 'Looking at all the keys: keys, values, entries',
      md: `
Sometimes you need every box at once. Three built-ins turn an object into arrays you can loop over:

~~~js
const scores = { ada: 9, linus: 7 };
console.log(Object.keys(scores));     // the labels
console.log(Object.values(scores));   // the contents
console.log(Object.entries(scores));  // [label, content] pairs
~~~

\`Object.entries\` pairs nicely with \`for...of\` (lesson 6):

~~~js
const scores = { ada: 9, linus: 7 };
for (const [name, score] of Object.entries(scores)) {
  console.log(name, "scored", score);
}
~~~

(\`const [name, score]\` unpacks each pair. Lesson 12 explains that syntax.)
`,
    },
    {
      type: 'task',
      title: 'keysOf',
      md: `\`keysOf({ a: 1, b: 2 })\` returns \`["a", "b"]\`.`,
      starter: `function keysOf(obj) {
  // your code here
}
`,
      tests: [
        { name: 'keysOf({ a: 1, b: 2 }) is ["a", "b"]', code: `eq(keysOf({ a: 1, b: 2 }), ["a", "b"]);` },
        { name: 'keysOf({}) is []', code: `eq(keysOf({}), []);` },
      ],
      hint: '`return Object.keys(obj);`',
      solution: `function keysOf(obj) {
  return Object.keys(obj);
}
`,
    },
    {
      type: 'predict',
      title: '?? vs ||: the 0 and "" trap',
      md: `
Both give a fallback value. \`a || b\` uses \`b\` when \`a\` is **falsy** (\`0\`, \`""\`, \`false\`, \`null\`, \`undefined\`). \`a ?? b\` uses \`b\` only when \`a\` is **missing** (\`null\` or \`undefined\`).

The volume here is really set to 0. Which line respects that?
`,
      code: `const settings = { volume: 0, name: "" };
console.log(settings.volume || 50);
console.log(settings.volume ?? 50);
console.log(settings.name || "anon");
console.log(settings.missing ?? "default");`,
      output: `50
0
anon
default`,
      explain: `
- \`volume || 50\`: \`0\` is falsy, so \`||\` throws it away and gives 50. **Bug**: the user picked 0.
- \`volume ?? 50\`: \`0\` is not missing, so \`??\` keeps it. Correct.
- \`name || "anon"\`: \`""\` is falsy, so you get \`"anon"\`. Sometimes that's what you want, sometimes not.
- \`missing ?? "default"\`: the box doesn't exist (\`undefined\`), so you get the fallback.

Rule of thumb: for "use this unless it's missing", reach for \`??\`.
`,
    },
    {
      type: 'task',
      title: 'getOr',
      md: `
**Example:** \`??\` gives a fallback when the left side is \`undefined\` or \`null\`.

~~~
function nickname(user) {
  return user.nickname ?? "no nickname";
}
~~~

**Your turn:** \`getOr(obj, key, fallback)\` returns the value at \`key\`, or \`fallback\` if it's missing. \`getOr({ a: 1 }, "a", 0)\` is \`1\`, and \`getOr({ a: 1 }, "z", 0)\` is \`0\`. A real \`0\` must be kept: \`getOr({ a: 0 }, "a", 5)\` is \`0\`.
`,
      starter: `function getOr(obj, key, fallback) {
  // your code here
}
`,
      tests: [
        { name: 'getOr({ a: 1 }, "a", 0) is 1', code: `eq(getOr({ a: 1 }, "a", 0), 1);` },
        { name: 'getOr({ a: 1 }, "z", 0) is 0', code: `eq(getOr({ a: 1 }, "z", 0), 0);` },
        { name: 'keeps a real 0', code: `eq(getOr({ a: 0 }, "a", 5), 0, "a real 0 was replaced: use ?? instead of ||");` },
      ],
      hint: 'Two things from this lesson together: brackets (the key is a variable) and `??`. `return obj[key] ?? fallback;`',
      solution: `function getOr(obj, key, fallback) {
  return obj[key] ?? fallback; // brackets for the variable key, ?? so 0 and "" survive
}
`,
    },
    {
      type: 'read',
      title: 'Aside: objects and JSON',
      md: `
When a server sends data, it sends **text** in a format called **JSON**, which looks almost exactly like a JS object (keys in double quotes, no functions). Two built-ins convert back and forth:

~~~js
const user = { name: "Ada", age: 36 };

const text = JSON.stringify(user);   // object -> text, to send it
console.log(text);

const back = JSON.parse(text);       // text -> object, when it arrives
console.log(back.name);
~~~

\`fetch(...).then((res) => res.json())\` does the \`JSON.parse\` for you. So everything in this lesson applies straight to API data. The next lesson is about the shape almost every API sends back: an array of these objects.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What does this print?\n\n~~~\nconst user = { name: \"Ada\" };\nconst key = \"name\";\nconsole.log(user.key, user[key]);\n~~~",
          choices: ["`Ada Ada`", "`undefined Ada`", "`Ada undefined`"],
          answer: 1,
          explain: "`user.key` looks for a box literally labeled \"key\", which doesn't exist. `user[key]` uses the **value** of the variable, `\"name\"`.",
          why: ["Dot notation never reads a variable. `.key` means the label \"key\".", "", "It's the other way round: brackets read the variable."],
        },
        {
          q: "What does this print?\n\n~~~\nconst a = { x: 0 };\nconst b = a;\nb.x = 1;\nconsole.log(a.x);\n~~~",
          choices: ["`0`", "`1`", "An error"],
          answer: 1,
          explain: "`b = a` copies the **reference** (the address), not the object. Both names point at one object.",
          why: ["`b` isn't a copy. It's the same object under another name.", "", "Changing a property of a `const` object is allowed."],
        },
        {
          q: "With `const user = { age: 30 };`, which line throws?",
          choices: ["`user.age = 31;`", "`user = { age: 31 };`", "`user.name = \"Ada\";`"],
          answer: 1,
          explain: "`const` only stops you pointing the name at a **different** object. Changing what's inside is allowed.",
          why: ["Changing a box inside the object is allowed.", "", "Adding a new box is allowed too."],
        },
        {
          q: "Which makes a copy of `user` with `age` set to 40, leaving `user` unchanged?",
          choices: ["`user.age = 40; const copy = user;`", "`const copy = { ...user, age: 40 };`", "`const copy = { age: 40, ...user };`"],
          answer: 1,
          explain: "Spread copies the boxes into a new object, and a later key overwrites an earlier one. So put the spread first and your change after it.",
          why: ["That changes the original, and `copy` is the same object.", "", "Later keys win, so `user`'s old age overwrites your 40."],
        },
        {
          q: "What does this print?\n\n~~~\nconst a = { tags: [\"x\"] };\nconst b = { ...a };\nb.tags.push(\"y\");\nconsole.log(a.tags);\n~~~",
          choices: ["`[ \"x\" ]`", "`[ \"x\", \"y\" ]`", "An error"],
          answer: 1,
          explain: "Spread is a **shallow** copy. `b` is a new object, but `b.tags` is the same array as `a.tags`. Copy each level you change.",
          why: ["The outer object was copied, but the inner array is shared.", "", "Pushing into an array is allowed."],
        },
        {
          q: "What does this print?\n\n~~~\nconst count = 0;\nconsole.log(count || 10, count ?? 10);\n~~~",
          choices: ["`0 0`", "`10 0`", "`10 10`"],
          answer: 1,
          explain: "`||` replaces any falsy value, including a real `0`. `??` only replaces `null` and `undefined`. Use `??` for defaults.",
          why: ["`||` treats 0 as missing, so the first one is 10.", "", "`??` keeps 0, because 0 isn't `null` or `undefined`."],
        },
      ],
    },
  ],
};
