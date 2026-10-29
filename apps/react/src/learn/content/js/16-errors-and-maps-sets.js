// JS course · lesson 16. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'errors-and-maps-sets',
  builds: ['js/promises-and-async', 'js/classes-and-this', 'js/reduce-and-sort'],
  title: 'Errors, Map and Set',
  goal: 'Throw and catch errors on purpose, make your own error class, and use Map and Set for "any key" lookups and "no duplicates" lists.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'throw stops everything',
      md: `
Lesson 15 caught a failed \`await\` with \`try\`/\`catch\`. Now you'll throw errors yourself.

\`throw\` stops the current function **immediately**. The lines after it don't run, the function returns nothing, and the error travels up to whoever called it, then whoever called *them*, until something catches it. If nothing does, the program stops with the error message.

~~~js
function divide(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
}

try {
  console.log(divide(10, 2));
  console.log(divide(1, 0));     // throws: jump straight to catch
  console.log("never printed");
} catch (err) {
  console.log("Caught:", err.message);
}
~~~

Why throw instead of returning something like \`null\`? Because a thrown error **can't be ignored by accident**. A \`null\` slides through your code until something breaks far away from the real cause.
`,
    },
    {
      type: 'predict',
      title: 'try, catch, finally',
      md: '`finally` is new. Watch which lines run.',
      code: `try {
  console.log("a");
  throw new Error("boom");
  console.log("b");
} catch (err) {
  console.log("caught", err.message);
} finally {
  console.log("finally");
}
console.log("after");`,
      output: `a
caught boom
finally
after`,
      explain: `
- \`"b"\` never prints: \`throw\` jumps straight out of the \`try\`.
- \`catch\` gets the error object, here called \`err\`.
- \`finally\` runs **whether or not** anything was thrown. It's for cleanup that must always happen, such as turning off a loading spinner.
- Because the error was caught, the program carries on to \`"after"\`.
`,
    },
    {
      type: 'read',
      title: 'Error objects',
      md: `
\`new Error("message")\` makes an error **object**. The two keys you'll use:

- \`err.message\`: the text you passed in.
- \`err.name\`: what kind of error it is, \`"Error"\` by default.

JavaScript throws its own built-in kinds too:

~~~js
try {
  const user = null;
  user.name;                       // reading a key from null
} catch (err) {
  console.log(err.name);
  console.log(err instanceof TypeError);
}

try {
  missingVariable;
} catch (err) {
  console.log(err.name);
}
~~~

Always throw an \`Error\` object, never a plain string (\`throw "oops"\`). An \`Error\` records a **stack trace**, the list of function calls that led to it, which is what you read when debugging. A string has no \`.message\` and no stack.
`,
    },
    {
      type: 'task',
      title: 'parseAge',
      md: `
**Example** (already solved):

~~~
function requirePositive(n) {
  if (n <= 0) throw new Error("Not positive: " + n);
  return n;
}
~~~

**Your turn:** write \`parseAge(text)\`. Turn \`text\` into a number with \`Number(text)\`. If the result is \`NaN\` or below 0, throw an \`Error\` with the message \`"Invalid age: "\` followed by the text. Otherwise return the number.

~~~
parseAge("36")    → 36
parseAge("abc")   → throws Error("Invalid age: abc")
parseAge("-1")    → throws Error("Invalid age: -1")
~~~

\`Number.isNaN(x)\` tells you if \`x\` is \`NaN\`.
`,
      starter: `function parseAge(text) {
  // your code here
}
`,
      tests: [
        { name: 'parseAge("36") is 36', code: `eq(parseAge("36"), 36);` },
        { name: 'parseAge("abc") throws', code: `throws(() => parseAge("abc"), "expected parseAge(\\"abc\\") to throw");` },
        { name: 'the message is "Invalid age: abc"', code: `let message; try { parseAge("abc"); } catch (err) { message = err.message; } eq(message, "Invalid age: abc");` },
        { name: 'a negative age throws', code: `throws(() => parseAge("-1"), "expected parseAge(\\"-1\\") to throw");` },
      ],
      hint: '`const age = Number(text);` then `if (Number.isNaN(age) || age < 0) throw new Error("Invalid age: " + text);` then `return age;`.',
      solution: `function parseAge(text) {
  const age = Number(text);
  if (Number.isNaN(age) || age < 0) {
    throw new Error("Invalid age: " + text);
  }
  return age;
}
`,
    },
    {
      type: 'task',
      title: 'Catch it',
      md: `
\`parseAge\` is in the starter. Write \`safeAge(text)\` that returns \`parseAge(text)\`, or \`null\` if it throws.

~~~
safeAge("36")    → 36
safeAge("abc")   → null
~~~

This is lesson 15's \`safeLoad\` without the \`await\`.
`,
      starter: `function parseAge(text) {
  const age = Number(text);
  if (Number.isNaN(age) || age < 0) {
    throw new Error("Invalid age: " + text);
  }
  return age;
}

function safeAge(text) {
  // your code here
}
`,
      tests: [
        { name: 'safeAge("36") is 36', code: `eq(safeAge("36"), 36);` },
        { name: 'safeAge("abc") is null', code: `eq(safeAge("abc"), null);` },
      ],
      hint: '`try { return parseAge(text); } catch (err) { return null; }`',
      solution: `function parseAge(text) {
  const age = Number(text);
  if (Number.isNaN(age) || age < 0) {
    throw new Error("Invalid age: " + text);
  }
  return age;
}

function safeAge(text) {
  try {
    return parseAge(text);
  } catch (err) {
    return null;
  }
}
`,
      explain: 'Only catch where you can actually do something useful, like falling back to `null` or showing a message. A `catch` that swallows every error silently hides bugs.',
    },
    {
      type: 'read',
      title: 'Your own error class',
      md: `
Sometimes the caller needs to know **which kind** of failure happened: "not found" should show a 404, "invalid input" should highlight a form field. Make your own error type with \`extends\` from lesson 14:

~~~js
class ValidationError extends Error {
  constructor(field, message) {
    super(message);                  // Error's constructor sets this.message
    this.name = "ValidationError";   // so logs say what kind it is
    this.field = field;              // extra info for whoever catches it
  }
}

try {
  throw new ValidationError("email", "Email is required");
} catch (err) {
  if (err instanceof ValidationError) {
    console.log(\`Fix the \${err.field} field: \${err.message}\`);
  } else {
    throw err;                       // not ours: let it keep going up
  }
}
~~~

The pattern in the \`catch\`: handle the errors you expect, and **re-throw** anything else. Swallowing an unexpected error is how bugs go missing.
`,
    },
    {
      type: 'predict',
      title: 'Which branch?',
      md: 'Two calls. One throws your error, one hits a built-in error.',
      code: `class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

function handle(fn) {
  try {
    fn();
  } catch (err) {
    if (err instanceof ValidationError) console.log("form error:", err.message);
    else console.log("bug:", err.name);
  }
}

handle(() => { throw new ValidationError("Name is too short"); });
handle(() => { const user = null; return user.name; });`,
      output: `form error: Name is too short
bug: TypeError`,
      explain: `
- The first function throws a \`ValidationError\`, so \`instanceof ValidationError\` is true.
- The second reads a key from \`null\`, which makes JavaScript throw a built-in \`TypeError\`. It's not a \`ValidationError\`, so it goes to the \`else\`.

\`instanceof\` works here because \`ValidationError\` **extends** \`Error\`. Every \`ValidationError\` is also an \`Error\`, but not every \`Error\` is a \`ValidationError\`.
`,
    },
    {
      type: 'task',
      title: 'NotFoundError',
      md: `
Write a class \`NotFoundError\` that extends \`Error\`. Its constructor takes an \`id\` and:

- calls \`super\` with the message \`"No item with id "\` followed by the id
- sets \`this.name\` to \`"NotFoundError"\`
- stores the id as \`this.id\`

~~~
const err = new NotFoundError(7);
err.message   → "No item with id 7"
err.name      → "NotFoundError"
err.id        → 7
~~~
`,
      starter: `// your NotFoundError class here
`,
      tests: [
        { name: 'it is an Error', code: `assert(new NotFoundError(7) instanceof Error, "use extends Error");` },
        { name: 'the message names the id', code: `eq(new NotFoundError(7).message, "No item with id 7");` },
        { name: 'name is "NotFoundError"', code: `eq(new NotFoundError(7).name, "NotFoundError");` },
        { name: 'it keeps the id', code: `eq(new NotFoundError(7).id, 7);` },
      ],
      hint: 'Same shape as `ValidationError`: `constructor(id) { super("No item with id " + id); this.name = ...; this.id = id; }`.',
      solution: `class NotFoundError extends Error {
  constructor(id) {
    super("No item with id " + id);
    this.name = "NotFoundError";
    this.id = id;
  }
}
`,
    },
    {
      type: 'read',
      title: 'Map: an object with any key',
      md: `
In lesson 11 you counted things with a plain object as the accumulator. That works, but objects have a quirk: **every key becomes a string.** \`obj[1]\` and \`obj["1"]\` are the same box.

A **Map** is a lookup table where the key can be **anything**, kept exactly as it is: numbers, strings, even objects.

~~~js
const ages = new Map();
ages.set("Ada", 36);               // set(key, value)
ages.set("Linus", 17);

console.log(ages.get("Ada"));      // get(key)
console.log(ages.has("Grace"));    // has(key): true or false
console.log(ages.size);            // how many entries (not .length)

for (const [name, age] of ages) {  // loops as [key, value] pairs, in the order you added them
  console.log(name, age);
}
~~~

| Plain object | Map |
|---|---|
| \`obj[key] = value\` | \`map.set(key, value)\` |
| \`obj[key]\` | \`map.get(key)\` |
| \`key in obj\` | \`map.has(key)\` |
| \`Object.keys(obj).length\` | \`map.size\` |

Use a plain object for **data with known fields** (\`{ name, age }\`). Use a Map for a **lookup table** that grows as you go, like counts or a cache.
`,
    },
    {
      type: 'predict',
      title: 'The number 1 and the string "1"',
      code: `const obj = {};
obj[1] = "number";
obj["1"] = "string";
console.log(Object.keys(obj).length);

const map = new Map();
map.set(1, "number");
map.set("1", "string");
console.log(map.size);
console.log(map.get(1));`,
      output: `1
2
number`,
      explain: `
- The object turns the key \`1\` into \`"1"\`, so the second line **overwrote** the first. One key.
- The Map keeps \`1\` and \`"1"\` as two different keys, so it has 2 entries and \`get(1)\` still finds \`"number"\`.

The common wrong answer is \`2\` for the object, from expecting it to keep the number.
`,
    },
    {
      type: 'task',
      title: 'countWords with a Map',
      md: `
**Example** (lesson 11's version, with a plain object):

~~~
function countWordsObj(words) {
  return words.reduce((counts, w) => {
    counts[w] = (counts[w] ?? 0) + 1;
    return counts;
  }, {});
}
~~~

**Your turn:** write \`countWords(words)\` that returns a **Map** from each word to how many times it appears. Same \`reduce\`, with \`new Map()\` as the start value, \`get\` to read and \`set\` to write.

~~~
countWords(["a", "b", "a"])   → Map(2) { "a" => 2, "b" => 1 }
~~~
`,
      starter: `function countWords(words) {
  // your code here
}
`,
      tests: [
        { name: '["a", "b", "a"] counts a twice and b once', code: `eq(countWords(["a", "b", "a"]), new Map([["a", 2], ["b", 1]]));` },
        { name: 'an empty list gives an empty Map', code: `eq(countWords([]), new Map());` },
        { name: 'it returns a Map, not an object', code: `assert(countWords(["x"]) instanceof Map, "start the reduce with new Map()");` },
      ],
      hint: 'In the callback: `counts.set(w, (counts.get(w) ?? 0) + 1);` then `return counts;`. `get` gives `undefined` for a word you haven\'t seen, and `?? 0` turns that into 0.',
      solution: `function countWords(words) {
  return words.reduce((counts, w) => {
    counts.set(w, (counts.get(w) ?? 0) + 1);
    return counts;
  }, new Map());
}
`,
    },
    {
      type: 'read',
      title: 'Set: a list with no duplicates',
      md: `
A **Set** holds values, each **at most once**. Adding something that's already there does nothing.

~~~js
const tags = new Set();
tags.add("js");
tags.add("react");
tags.add("js");                    // already there: ignored

console.log(tags.size);
console.log(tags.has("react"));
console.log([...tags]);            // spread (lesson 12) turns it back into an array

const nums = [3, 1, 3, 2, 1];
console.log([...new Set(nums)]);   // the one-line "remove duplicates", keeps first-seen order
~~~

| Array | Set |
|---|---|
| \`arr.push(x)\` | \`set.add(x)\` |
| \`arr.includes(x)\` | \`set.has(x)\` |
| \`arr.length\` | \`set.size\` |

\`set.has(x)\` stays fast no matter how big the set gets, while \`arr.includes(x)\` checks items one by one. The DSA track's hash maps lesson explains why. For now: when the question is "have I seen this before?", reach for a Set.
`,
    },
    {
      type: 'task',
      title: 'unique',
      md: `
**Example** (already solved):

~~~
function countUnique(items) {
  return new Set(items).size;
}
~~~

**Your turn:** \`unique(items)\` returns a new **array** with the duplicates removed, keeping the first-seen order.

~~~
unique([3, 1, 3, 2, 1])   → [3, 1, 2]
~~~
`,
      starter: `function unique(items) {
  // your code here
}
`,
      tests: [
        { name: 'unique([3, 1, 3, 2, 1]) is [3, 1, 2]', code: `eq(unique([3, 1, 3, 2, 1]), [3, 1, 2]);` },
        { name: 'an empty list gives []', code: `eq(unique([]), []);` },
        { name: 'it returns an array, not a Set', code: `assert(Array.isArray(unique(["a"])), "spread the Set into an array: [...set]");` },
      ],
      hint: 'Make a Set from `items`, then spread it into an array: `[...new Set(items)]`.',
      solution: `function unique(items) {
  return [...new Set(items)];
}
`,
    },
    {
      type: 'task',
      title: 'Put it together: assertUnique',
      md: `
This combines the lesson: a Set to remember what you've seen, and a custom error to report a problem.

\`DuplicateError\` is in the starter. Write \`assertUnique(ids)\`:

- Loop over \`ids\` with a Set of the ids seen so far.
- The first time an id is **already** in the Set, throw \`new DuplicateError(id)\`.
- If the loop finishes, return \`true\`.

~~~
assertUnique([1, 2, 3])      → true
assertUnique([1, 2, 1, 2])   → throws DuplicateError, with err.id 1
~~~
`,
      starter: `class DuplicateError extends Error {
  constructor(id) {
    super("Duplicate id: " + id);
    this.name = "DuplicateError";
    this.id = id;
  }
}

function assertUnique(ids) {
  // your code here
}
`,
      tests: [
        { name: 'all different ids return true', code: `eq(assertUnique([1, 2, 3]), true);` },
        { name: 'an empty list returns true', code: `eq(assertUnique([]), true);` },
        { name: 'a repeat throws a DuplicateError', code: `let caught; try { assertUnique([1, 2, 1]); } catch (err) { caught = err; } assert(caught instanceof DuplicateError, "throw new DuplicateError(id)");` },
        { name: 'the error names the first repeated id', code: `let caught; try { assertUnique([5, 1, 2, 1, 2, 5]); } catch (err) { caught = err; } eq(caught && caught.id, 1);` },
      ],
      hint: '`const seen = new Set();` then `for (const id of ids) { if (seen.has(id)) throw new DuplicateError(id); seen.add(id); }` and `return true;` after the loop.',
      solution: `class DuplicateError extends Error {
  constructor(id) {
    super("Duplicate id: " + id);
    this.name = "DuplicateError";
    this.id = id;
  }
}

function assertUnique(ids) {
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) throw new DuplicateError(id);
    seen.add(id);
  }
  return true;
}
`,
      explain: 'In `[5, 1, 2, 1, 2, 5]` the first id to repeat is `1` (at position 3), even though `5` appeared first. Checking `has` **before** `add` is what finds it: the Set only knows about the ids before the current one.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "When does a `finally` block run?",
          choices: ["Always, whether or not an error was thrown", "Only when an error was thrown", "Only when no error was thrown"],
          answer: 0,
          explain: "That's its job: cleanup that must happen either way.",
          why: { 1: "That's `catch`.", 2: "That's the rest of the `try` block." },
        },
        {
          q: "Why `throw new Error(\"...\")` instead of `throw \"...\"`?",
          choices: ["An Error has a `.message` and a stack trace showing where it came from", "Strings can't be thrown", "Error objects are caught faster"],
          answer: 0,
          explain: "The stack trace is what you read when debugging. A thrown string has neither.",
          why: { 1: "JavaScript lets you throw anything, which is exactly why you have to choose well.", 2: "Speed isn't the difference. Information is." },
        },
        {
          q: "In a custom error class, what does `super(message)` do?",
          choices: ["Runs Error's constructor, which sets `this.message`", "Throws the error", "Sets `this.name`"],
          answer: 0,
          explain: "A child class must call `super` before using `this`, and `Error`'s constructor stores the message.",
          why: { 1: "Creating an error never throws it. Only `throw` does.", 2: "`name` stays `\"Error\"` unless you set it yourself." },
        },
        {
          q: "What does `new Set([3, 1, 3]).size` give?",
          choices: ["`2`", "`3`", "`[3, 1]`"],
          answer: 0,
          explain: "The second 3 is ignored, so the Set holds 3 and 1.",
          why: { 1: "A Set keeps each value at most once.", 2: "`.size` is a number, not the values." },
        },
        {
          q: "When is a Map a better choice than a plain object?",
          choices: ["A lookup table built as you go, especially with non-string keys", "A user record with fields like name and age", "Data you'll send as JSON"],
          answer: 0,
          explain: "Maps keep keys of any type and have `size`, `has` and ordered looping built in.",
          why: { 1: "Known fields are what plain objects are for.", 2: "`JSON.stringify` turns a Map into `{}`. Use a plain object for JSON." },
        },
      ],
    },
  ],
};
