// JS course · lesson 12. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'spread-and-destructuring',
  builds: ['js/reduce-and-sort'],
  title: 'Spread and destructuring',
  goal: 'Unpack values out of objects and arrays in one line, and copy-with-changes safely, including nested data. This is the syntax React is built on.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The problem destructuring solves',
      md: `
You've written a lot of this:

~~~js
const user = { name: "Ada", age: 36, city: "London" };

const name = user.name;
const age = user.age;
console.log(name, age);
~~~

Every line repeats \`user.\` and repeats the name twice. **Destructuring** does it in one line:

~~~js
const user = { name: "Ada", age: 36, city: "London" };

const { name, age } = user;   // "pull name and age out of user"
console.log(name, age);
~~~

Read \`const { name, age } = user\` as: **make variables called \`name\` and \`age\`, filled from the keys with those same names in \`user\`.** The curly braces on the **left** of \`=\` mean "unpack", not "build an object".
`,
    },
    {
      type: 'predict',
      title: 'Unpacking a key that is not there',
      code: `const user = { name: "Ada", age: 36 };
const { name, email } = user;
console.log(name, email);`,
      output: `Ada undefined`,
      explain: `
Destructuring matches by **key name**. There's no \`email\` key, so \`email\` is \`undefined\`, exactly like \`user.email\` would be. No error is thrown.

Spell the names exactly as the keys: \`const { Name } = user\` would also give \`undefined\`.
`,
    },
    {
      type: 'read',
      title: 'Arrays unpack by position',
      md: `
Objects unpack by **key name**. Arrays unpack by **position**, using square brackets:

~~~js
const point = [10, 20];
const [x, y] = point;          // x is item 0, y is item 1
console.log(x, y);

const [first, , third] = ["a", "b", "c"]; // a gap skips an item
console.log(first, third);
~~~

Because it's by position, you can name them anything. That makes **swapping** neat:

~~~js
const [a, b] = [1, 2];
const swapped = [b, a];        // build a new array in the other order
console.log(swapped);
~~~

The bracket on the **left** of \`=\` unpacks. The bracket on the **right** builds.
`,
    },
    {
      type: 'task',
      title: 'swap',
      md: `
Destructuring works **right in the parameter list**, too.

**Example** (already solved): unpack an array parameter by position.

~~~
function sumPair([a, b]) {
  return a + b;
}
sumPair([2, 3])   → 5
~~~

**Your turn:** \`swap([1, 2])\` returns \`[2, 1]\`.
`,
      starter: `function swap([a, b]) {
  // your code here
}
`,
      tests: [
        { name: 'swap([1, 2]) is [2, 1]', code: `eq(swap([1, 2]), [2, 1]);` },
        { name: 'works with strings', code: `eq(swap(["x", "y"]), ["y", "x"]);` },
      ],
      hint: '`a` and `b` are already unpacked for you. Return a new array with them in the other order: `[b, a]`.',
      solution: `function swap([a, b]) {
  return [b, a];
}
`,
    },
    {
      type: 'predict',
      title: 'Renaming and defaults',
      md: 'Two new tricks in one line: `key: newName` renames, and `= value` gives a default.',
      code: `const settings = { theme: "dark" };
const { theme: mode, size = "medium" } = settings;
console.log(mode, size);`,
      output: `dark medium`,
      explain: `
- \`theme: mode\` means "take the \`theme\` key, but call the variable \`mode\`". There is **no** \`theme\` variable afterwards.
- \`size = "medium"\` means "use \`"medium\"\` if \`size\` is missing (\`undefined\`)".

The colon inside destructuring means **rename**, not "set to". This trips everyone up the first time.
`,
    },
    {
      type: 'task',
      title: 'getCity (nested destructuring)',
      md: `
**Example:** destructure an object by key name.

~~~
function getAgeOf(user) {
  const { age } = user;
  return age;
}
~~~

You can also reach **inside** a nested object. \`const { address: { city } } = user\` means "go into \`address\`, then pull out \`city\`". (Here \`address:\` means "go inside", not rename.)

**Your turn:** \`getCity({ name: "Ada", address: { city: "London" } })\` returns \`"London"\`. Use nested destructuring.
`,
      starter: `function getCity(user) {
  // your code here
}
`,
      tests: [
        { name: 'getCity(...) is "London"', code: `eq(getCity({ name: "Ada", address: { city: "London" } }), "London");` },
        { name: 'works for another user', code: `eq(getCity({ name: "Grace", address: { city: "New York", zip: "10001" } }), "New York");` },
      ],
      hint: 'Two lines: `const { address: { city } } = user;` then `return city;`. (`return user.address.city` passes too, but practice the destructuring.)',
      solution: `function getCity(user) {
  const { address: { city } } = user; // into address, then out comes city
  return city;
}
`,
    },
    {
      type: 'read',
      title: 'Where React uses this: props and useState',
      md: `
You've already seen destructuring in every React component, maybe without noticing.

**Props.** A component receives **one object** of props. Destructuring in the parameter list unpacks it:

~~~
function Card({ title, done = false }) {    // instead of function Card(props) + props.title
  return <li>{title} {done ? "✓" : ""}</li>;
}
<Card title="Shop" />                        // props is { title: "Shop" }, done defaults to false
~~~

**useState.** \`useState\` returns an **array of two things**: the value and a function to change it. Array destructuring names them:

~~~
const [count, setCount] = useState(0);
~~~

Here's the same pattern in plain JS you can run:

~~~js
function Card({ title, done = false }) {
  return title + (done ? " ✓" : "");
}
console.log(Card({ title: "Shop" }));
console.log(Card({ title: "Code", done: true }));

function fakeUseState(start) {
  return [start, (next) => console.log("would set to", next)];
}
const [count, setCount] = fakeUseState(0);
console.log(count);
setCount(1);
~~~
`,
    },
    {
      type: 'read',
      title: 'Rest and spread: the same dots, opposite jobs',
      md: `
\`...\` has two jobs, depending on which side of the \`=\` it's on.

**Rest** (on the left, while unpacking) **gathers** "everything else" into one variable:

~~~js
const [first, ...rest] = [1, 2, 3, 4];
console.log(first, rest);

const { name, ...others } = { name: "Ada", age: 36, city: "London" };
console.log(name, others);
~~~

**Spread** (on the right, while building) **scatters** the items out into a new array or object:

~~~js
const a = [1, 2];
const b = [3, 4];
console.log([...a, ...b]);           // a new array with all of them

const user = { name: "Ada", age: 36 };
console.log({ ...user, age: 37 });   // a new object: copy, then change age
~~~

Same three dots: **gather** when unpacking, **scatter** when building.
`,
    },
    {
      type: 'task',
      title: 'firstAndRest',
      md: `
\`firstAndRest([1, 2, 3])\` returns \`{ first: 1, rest: [2, 3] }\`.

Use \`const [first, ...rest] = arr;\`. Then return an object. Shortcut: \`{ first, rest }\` is short for \`{ first: first, rest: rest }\`.
`,
      starter: `function firstAndRest(arr) {
  // your code here
}
`,
      tests: [
        { name: 'firstAndRest([1, 2, 3]) is { first: 1, rest: [2, 3] }', code: `eq(firstAndRest([1, 2, 3]), { first: 1, rest: [2, 3] });` },
        { name: 'one item leaves rest empty', code: `eq(firstAndRest(["only"]), { first: "only", rest: [] });` },
      ],
      hint: 'Line 1: `const [first, ...rest] = arr;`. Line 2: `return { first, rest };`.',
      solution: `function firstAndRest(arr) {
  const [first, ...rest] = arr; // rest gathers everything after the first item
  return { first, rest };       // shorthand for { first: first, rest: rest }
}
`,
    },
    {
      type: 'predict',
      title: 'Which key wins?',
      md: 'Both objects have a `y`. The order of the spreads changes the answer.',
      code: `const a = { x: 1, y: 2 };
const b = { y: 20, z: 30 };

console.log({ ...a, ...b });
console.log({ ...b, ...a });`,
      output: `{ x: 1, y: 20, z: 30 }
{ y: 2, z: 30, x: 1 }`,
      explain: `
Spread copies keys in order, left to right, so a **later** key overwrites an earlier one with the same name. **The last one wins.**

That's why \`{ ...user, age: 37 }\` works: the copy of \`user\` comes first, then your \`age\` overwrites it. Written \`{ age: 37, ...user }\`, the old age would win and nothing would change.
`,
    },
    {
      type: 'task',
      title: 'merge',
      md: `
**Example:** spread two arrays into one.

~~~
function joinLists(a, b) {
  return [...a, ...b];
}
~~~

**Your turn:** \`merge({ a: 1, b: 2 }, { b: 3 })\` returns \`{ a: 1, b: 3 }\`. The **second** object's keys win.
`,
      starter: `function merge(a, b) {
  // your code here
}
`,
      tests: [
        { name: 'merge({ a: 1, b: 2 }, { b: 3 }) is { a: 1, b: 3 }', code: `eq(merge({ a: 1, b: 2 }, { b: 3 }), { a: 1, b: 3 });` },
        { name: 'does not change the inputs', code: `const x = { a: 1 }; merge(x, { b: 2 }); eq(x, { a: 1 });` },
      ],
      hint: 'Same as `joinLists`, with curly braces instead of square brackets, and `b` last so its keys win.',
      solution: `function merge(a, b) {
  return { ...a, ...b };
}
`,
    },
    {
      type: 'task',
      title: 'updateAge',
      md: `\`updateAge({ name: "Ada", age: 36 }, 37)\` returns \`{ name: "Ada", age: 37 }\` as a **new** object. The original user must keep age 36.`,
      starter: `function updateAge(user, age) {
  // your code here
}
`,
      tests: [
        { name: 'returns the updated user', code: `eq(updateAge({ name: "Ada", age: 36 }, 37), { name: "Ada", age: 37 });` },
        {
          name: 'does not change the original',
          code: `const user = { name: "Ada", age: 36 };
updateAge(user, 37);
eq(user.age, 36, "the original changed: return { ...user, age } instead of setting user.age");`,
        },
      ],
      hint: 'Copy, then override: `return { ...user, age: age };`. Since the key and the variable share a name, `{ ...user, age }` works too.',
      solution: `function updateAge(user, age) {
  return { ...user, age }; // copy every key, then the new age wins
}
`,
    },
    {
      type: 'read',
      title: 'Spread copies only one level deep',
      md: `
\`{ ...post }\` makes a new **outer** object. But if a key holds an array or an object, the copy gets **the same inner array**, not a copy of it (references, lesson 7).

~~~
post  ──► { title: "Hi", tags: ─┐ }
                                ├──► ["a"]     one array, shared by both
copy  ──► { title: "Hi", tags: ─┘ }
~~~

This is called a **shallow copy**. Changing \`copy.title\` is safe, because \`title\` is a plain string stored right in the copy. But \`copy.tags.push(...)\` changes the shared array, so the original changes too.

**The fix:** copy **every level you change**. To change \`tags\`, copy the post **and** make a new tags array:

~~~js
const post = { title: "Hi", tags: ["a"] };
const updated = { ...post, tags: [...post.tags, "b"] };
console.log(post.tags, updated.tags);
~~~
`,
    },
    {
      type: 'predict',
      title: 'The shallow copy trap',
      md: 'One change is to the copy\'s own field. The other goes through a shared array.',
      code: `const post = { title: "Hi", tags: ["a"] };
const copy = { ...post };

copy.title = "Hello";
copy.tags.push("b");

console.log(post);`,
      output: `{ title: "Hi", tags: [ "a", "b" ] }`,
      explain: `
- \`copy.title = "Hello"\` replaced a value **in the copy only**, so \`post.title\` is still \`"Hi"\`.
- \`copy.tags.push("b")\` changed **the one shared array**, so \`post.tags\` changed too.

In React this is the classic "I copied the state but the bug is still there" moment. Copy each level you change.
`,
    },
    {
      type: 'task',
      title: 'addTag',
      md: `
**Example:** a nested copy. Copy the outer object **and** the inner array you change.

~~~
function removeFirstTag(post) {
  return { ...post, tags: post.tags.slice(1) };
}
~~~

**Your turn:** \`addTag({ title: "Hi", tags: ["a"] }, "b")\` returns \`{ title: "Hi", tags: ["a", "b"] }\`, without changing the original post **or its tags array**.
`,
      starter: `function addTag(post, tag) {
  // your code here
}
`,
      tests: [
        { name: 'returns the post with the new tag', code: `eq(addTag({ title: "Hi", tags: ["a"] }, "b"), { title: "Hi", tags: ["a", "b"] });` },
        {
          name: 'the original tags array is unchanged',
          code: `const post = { title: "Hi", tags: ["a"] };
addTag(post, "b");
eq(post.tags, ["a"], "the original tags changed: build a new array with [...post.tags, tag] instead of push");`,
        },
        {
          name: 'returns new objects, not the originals',
          code: `const post = { title: "Hi", tags: ["a"] };
const result = addTag(post, "b");
assert(result !== post, "return a new post object");
assert(result.tags !== post.tags, "return a new tags array");`,
        },
      ],
      hint: 'Same shape as `removeFirstTag`, but the new tags are `[...post.tags, tag]`.',
      solution: `function addTag(post, tag) {
  return { ...post, tags: [...post.tags, tag] }; // new post, new tags array
}
`,
      explain: 'This is exactly how you update nested React state: a new object at every level on the path down to the thing you change.',
    },
    {
      type: 'read',
      title: 'Objects to pairs and back',
      md: `
Two built-ins turn an object into a list of \`[key, value]\` pairs and back again:

~~~js
const prices = { pen: 2, cup: 1 };

const pairs = Object.entries(prices);
console.log(pairs);                    // object → list of [key, value] pairs

console.log(Object.fromEntries(pairs)); // list of pairs → object
~~~

Why bother? Lists have \`map\`, \`filter\` and \`sort\`, and objects don't. So: **entries → do list things → fromEntries**. And the \`[key, value]\` pairs are perfect for array destructuring in the callback: \`([item, price]) => ...\`.
`,
    },
    {
      type: 'task',
      title: 'fromPairs',
      md: `\`fromPairs([["a", 1], ["b", 2]])\` returns \`{ a: 1, b: 2 }\`. Use \`Object.fromEntries\`.`,
      starter: `function fromPairs(pairs) {
  // your code here
}
`,
      tests: [
        { name: 'fromPairs([["a", 1], ["b", 2]]) is { a: 1, b: 2 }', code: `eq(fromPairs([["a", 1], ["b", 2]]), { a: 1, b: 2 });` },
        { name: 'no pairs gives {}', code: `eq(fromPairs([]), {});` },
      ],
      hint: 'It\'s one line: `return Object.fromEntries(pairs);`.',
      solution: `function fromPairs(pairs) {
  return Object.fromEntries(pairs);
}
`,
    },
    {
      type: 'predict',
      title: 'Everything at once',
      md: 'entries, map with array destructuring, then fromEntries. Go step by step.',
      code: `const prices = { pen: 2, cup: 1 };

const doubled = Object.fromEntries(
  Object.entries(prices).map(([item, price]) => [item, price * 2])
);

console.log(doubled);`,
      output: `{ pen: 4, cup: 2 }`,
      explain: `
1. \`Object.entries(prices)\` gives \`[ ["pen", 2], ["cup", 1] ]\`.
2. \`map\` unpacks each pair as \`[item, price]\` and returns a new pair \`[item, price * 2]\`.
3. \`Object.fromEntries\` turns the pairs back into an object.

That's \`map\`, destructuring and building objects working together, which is most of what "transform this API response" interview tasks are.
`,
    },
    {
      type: 'read',
      title: 'You now have the whole toolkit',
      md: `
Look at what you can write by hand now:

| Tool | Lesson |
|---|---|
| \`return\`, template literals | 1 |
| functions and callbacks | 2, 9 |
| \`if\`, ternaries, truthiness | 3, 10 |
| strings and arrays | 4, 5 |
| loops and the five loop patterns | 6, 8 |
| objects, references, copies | 7, 12 |
| \`map\`, \`filter\`, \`find\`, \`some\`, \`every\` | 9, 10 |
| \`reduce\`, \`sort\` | 11 |
| destructuring, rest, spread | 12 |

Almost every interview warm-up is two or three of these combined, for example "toggle the todo with this id" (\`map\` + ternary + spread) or "count words, then return the top 3" (\`reduce\` + \`Object.entries\` + \`sort\` + \`slice\`).

**Next:** the [Live coding gym](/learn/challenges) warm-ups. Do them in order, and when you freeze, ask yourself "which lesson's tool is this?" and go back to that lesson's *build it yourself* step.

Tomorrow, come back and **Redo from blank** on lessons 9–12. That second pass is what makes it stick.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "After `const { theme: mode } = settings;`, which variable exists?",
          choices: ["`theme`", "`mode`", "Both"],
          answer: 1,
          explain: "The colon renames: read `settings.theme` and call it `mode`.",
          why: ["`theme` is only the key being read. No `theme` variable is created.", "", "Only the new name, `mode`, is created."],
        },
        {
          q: "What does this print?\n\n~~~\nconst [first, ...rest] = [1, 2, 3];\nconsole.log(first, rest);\n~~~",
          choices: ["`1 [ 2, 3 ]`", "`[ 1 ] [ 2, 3 ]`", "`1 2`"],
          answer: 0,
          explain: "On the left of `=`, `...` is **rest**: it gathers everything left over into a new array.",
          why: ["", "`first` takes one item, not an array.", "`...rest` gathers all the remaining items, not one."],
        },
        {
          q: "What does this print?\n\n~~~\nconst user = { name: \"Ada\", age: 36 };\nconsole.log({ age: 37, ...user }.age);\n~~~",
          choices: ["`37`", "`36`", "`undefined`"],
          answer: 1,
          explain: "Later keys win. The spread comes after `age: 37`, so `user`'s age overwrites it. Put the spread first, then your change.",
          why: ["The spread comes later, so it overwrites 37.", "", "Both sides have an `age`, so it's defined."],
        },
        {
          q: "Which adds a tag **without** changing the original post?",
          choices: ["`{ ...post, tags: post.tags.push(tag) }`", "`{ ...post, tags: [...post.tags, tag] }`", "`const copy = { ...post }; copy.tags.push(tag);`"],
          answer: 1,
          explain: "Copy every level you change: a new post object **and** a new tags array.",
          why: ["`push` changes the original array, and it returns the new length, not an array.", "", "The copy shares the same `tags` array, so the original changes too."],
        },
        {
          q: "In `const [count, setCount] = useState(0)`, what decides which name gets which value?",
          choices: ["The names: `count` and `setCount` are special", "Their position in the returned array", "Alphabetical order"],
          answer: 1,
          explain: "`useState` returns a two-item array, and array destructuring names items by position. You could call them anything.",
          why: ["The names are your choice. `[n, setN]` works the same.", "", "Array destructuring always goes by position."],
        },
        {
          q: "What does this print?\n\n~~~\nconst { role = \"viewer\" } = { name: \"Ada\" };\nconsole.log(role);\n~~~",
          choices: ["`undefined`", "`viewer`", "An error"],
          answer: 1,
          explain: "A default in destructuring kicks in when the key is missing (or `undefined`).",
          why: ["The default fills the missing key.", "", "Destructuring a missing key is fine. You just get the default."],
        },
      ],
    },
  ],
};
