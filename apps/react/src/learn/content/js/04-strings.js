// JS course · lesson 4. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'strings',
  builds: ['js/conditionals'],
  title: 'Strings',
  goal: 'Work with text: length, characters by index, searching, cleaning up, and splitting and joining, chaining methods together.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Strings and their methods',
      md: `
A string is text in quotes. Strings come with built-in **methods**: functions you call with a dot.

~~~js
const word = "Hello";

console.log(word.length);          // a property: no ()
console.log(word.toUpperCase());   // a method: needs ()
console.log(word.toLowerCase());
console.log(word.includes("ell"));
~~~

Notice the difference: \`.length\` is a **property** (a value the string already has, so no brackets). \`.toUpperCase()\` is a **method** (it does work, so it needs \`()\`).
`,
    },
    {
      type: 'predict',
      title: 'Strings never change',
      md: 'Read carefully: the first `toUpperCase()` result isn\'t stored anywhere.',
      code: `let word = "hello";

word.toUpperCase();
console.log(word);

const loud = word.toUpperCase();
console.log(loud);`,
      output: `hello
HELLO`,
      explain: `
Strings are **immutable**: no method ever changes the original string. \`toUpperCase()\` makes a **new** string and returns it.

The first call creates \`"HELLO"\` and throws it away, because nothing saves it. \`word\` is still \`"hello"\`.

So with strings, always use the **return value**: store it in a variable or \`return\` it.
`,
    },
    {
      type: 'task',
      title: 'shout',
      md: `
**Example:**

~~~
function whisper(s) {
  return s.toLowerCase() + "...";
}
~~~

**Your turn:** \`shout("hi")\` returns \`"HI!"\`.
`,
      starter: `function shout(s) {
  // your code here
}
`,
      tests: [{ name: 'shout("hi") is "HI!"', code: `eq(shout("hi"), "HI!");` }],
      hint: 'Same shape as `whisper`: `return s.toUpperCase() + "!";`',
      solution: `function shout(s) {
  return s.toUpperCase() + "!"; // toUpperCase returns a new string, then + glues on the !
}
`,
    },
    {
      type: 'task',
      title: 'len',
      md: `\`len("hello")\` returns \`5\`, and \`len("")\` returns \`0\`. Strings have a \`.length\` property.`,
      starter: `function len(s) {
  // your code here
}
`,
      tests: [
        { name: 'len("hello") is 5', code: `eq(len("hello"), 5);` },
        { name: 'len("") is 0', code: `eq(len(""), 0);` },
      ],
      hint: '`return s.length;` with no brackets after `length`.',
      solution: `function len(s) {
  return s.length; // a property, not a method: no ()
}
`,
    },
    {
      type: 'read',
      title: 'Characters by index',
      md: `
Every character has a position number, its **index**. Indexes start at **0**, not 1:

~~~
 "h"  "e"  "l"  "l"  "o"
  0    1    2    3    4
~~~

~~~js
const s = "hello";

console.log(s[0]);             // first character
console.log(s[1]);             // second character
console.log(s[s.length - 1]);  // last: length is 5, so the last index is 4
console.log(s.at(-1));         // the modern way to get the last one
~~~

\`.at(-1)\` counts from the end: \`-1\` is the last character, \`-2\` the one before it.
`,
    },
    {
      type: 'task',
      title: 'firstChar',
      md: `
**Example:**

~~~
function secondChar(s) {
  return s[1];
}
~~~

**Your turn:** \`firstChar("hello")\` returns \`"h"\`.
`,
      starter: `function firstChar(s) {
  // your code here
}
`,
      tests: [{ name: 'firstChar("hello") is "h"', code: `eq(firstChar("hello"), "h", "indexes start at 0");` }],
      hint: 'Indexes start at 0: `return s[0];`',
      solution: `function firstChar(s) {
  return s[0];
}
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Off the end, and a common typo',
      code: `const s = "hello";
console.log(s[0], s[4], s[5], s.at(-1));
console.log(s.length());`,
      output: `h o undefined o
! s.length is not a function`,
      explain: `
- \`s[5]\` is past the end (the last index is 4). JS doesn't crash, it just gives \`undefined\`.
- \`s.length()\` adds brackets to a **property**. \`s.length\` is the number 5, and you can't call a number, so JS throws **"s.length is not a function"**.
`,
    },
    {
      type: 'task',
      title: 'lastChar',
      md: `\`lastChar("hello")\` returns \`"o"\`. Use \`.at(-1)\`, or \`s[s.length - 1]\`.`,
      starter: `function lastChar(s) {
  // your code here
}
`,
      tests: [
        { name: 'lastChar("hello") is "o"', code: `eq(lastChar("hello"), "o");` },
        { name: 'lastChar("hi") is "i"', code: `eq(lastChar("hi"), "i");` },
      ],
      hint: '`return s.at(-1);`',
      solution: `function lastChar(s) {
  return s.at(-1); // same as s[s.length - 1]
}
`,
    },
    {
      type: 'task',
      title: 'hasAt',
      md: `
**Example:** \`.includes(...)\` returns \`true\` or \`false\`.

~~~
function hasSpace(s) {
  return s.includes(" ");
}
~~~

**Your turn:** \`hasAt("ada@example.com")\` returns \`true\`, and \`hasAt("nope")\` returns \`false\`.
`,
      starter: `function hasAt(email) {
  // your code here
}
`,
      tests: [
        { name: 'hasAt("ada@example.com") is true', code: `eq(hasAt("ada@example.com"), true);` },
        { name: 'hasAt("nope") is false', code: `eq(hasAt("nope"), false);` },
      ],
      hint: 'Same as `hasSpace`, looking for `"@"`.',
      solution: `function hasAt(email) {
  return email.includes("@");
}
`,
    },
    {
      type: 'read',
      title: 'Chaining methods',
      md: `
Each string method returns a **new string**, and a string has methods. So you can call another method straight on the result. That's called **chaining**:

~~~js
const raw = "  HeLLo  ";

console.log(raw.trim());                 // removes spaces at both ends
console.log(raw.trim().toLowerCase());   // then lowercases that
~~~

Read a chain left to right, one step at a time:

| Step | Value |
|---|---|
| \`raw\` | \`"  HeLLo  "\` |
| \`.trim()\` | \`"HeLLo"\` |
| \`.toLowerCase()\` | \`"hello"\` |
`,
    },
    {
      type: 'task',
      title: 'clean',
      md: `\`clean("  HeLLo  ")\` returns \`"hello"\`: trim the spaces **and** lowercase it, in one chain.`,
      starter: `function clean(s) {
  // your code here
}
`,
      tests: [{ name: 'clean("  HeLLo  ") is "hello"', code: `eq(clean("  HeLLo  "), "hello");` }],
      hint: '`return s.trim().toLowerCase();`',
      solution: `function clean(s) {
  return s.trim().toLowerCase(); // each method returns a new string, so they chain
}
`,
    },
    {
      type: 'read',
      title: 'split and join',
      md: `
\`split\` cuts a string into an **array** of pieces. \`join\` glues an array back into a string.

~~~js
const sentence = "the quick fox";

const words = sentence.split(" ");   // cut at every space
console.log(words);
console.log(words[0]);               // arrays use indexes too
console.log(words.join("-"));        // glue back together with -
~~~

\`split\` lives on strings, \`join\` lives on arrays. You'll use them together all the time.
`,
    },
    {
      type: 'predict',
      title: 'Splitting predictions',
      code: `console.log("a,b,c".split(","));
console.log(["x", "y"].join("-"));
console.log("hi there".split(""));`,
      output: `[ "a", "b", "c" ]
x-y
[ "h", "i", " ", "t", "h", "e", "r", "e" ]`,
      explain: '`split(",")` cuts at each comma. `join("-")` puts a `-` between items. `split("")` (an empty string) cuts between every character, including the space.',
    },
    {
      type: 'task',
      title: 'firstWord',
      md: `
**Example:**

~~~
function lastWord(sentence) {
  return sentence.split(" ").at(-1);
}
~~~

**Your turn:** \`firstWord("the quick fox")\` returns \`"the"\`, and \`firstWord("solo")\` returns \`"solo"\`.
`,
      starter: `function firstWord(sentence) {
  // your code here
}
`,
      tests: [
        { name: 'firstWord("the quick fox") is "the"', code: `eq(firstWord("the quick fox"), "the");` },
        { name: 'firstWord("solo") is "solo"', code: `eq(firstWord("solo"), "solo");` },
      ],
      hint: 'Like `lastWord`, but take index 0: `return sentence.split(" ")[0];`',
      solution: `function firstWord(sentence) {
  return sentence.split(" ")[0];
}
`,
    },
    {
      type: 'task',
      title: 'slug',
      md: `
A **slug** is the URL-friendly version of a title. \`slug("Hello Big World")\` returns \`"hello-big-world"\`.

Three steps, chained: lowercase it, split on \`" "\`, then join with \`"-"\`.
`,
      starter: `function slug(title) {
  // your code here
}
`,
      tests: [
        { name: 'slug("Hello Big World") is "hello-big-world"', code: `eq(slug("Hello Big World"), "hello-big-world");` },
        { name: 'slug("One") is "one"', code: `eq(slug("One"), "one");` },
      ],
      hint: '`return title.toLowerCase().split(" ").join("-");`',
      solution: `function slug(title) {
  // "Hello Big World" -> "hello big world" -> ["hello", "big", "world"] -> "hello-big-world"
  return title.toLowerCase().split(" ").join("-");
}
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What does this print?\n\n~~~\nconst word = \"hi\";\nword.toUpperCase();\nconsole.log(word);\n~~~",
          choices: ["`HI`", "`hi`", "`undefined`"],
          answer: 1,
          explain: "Strings never change. `toUpperCase()` returns a **new** string, which this code throws away. Store it: `const loud = word.toUpperCase();`.",
          why: ["The new string was never stored, and `word` itself can't change.", "", "`word` still holds `\"hi\"`. Nothing removed it."],
        },
        {
          q: "What happens with `\"hello\".length()`?",
          choices: ["It gives `5`", "An error: `length` is not a function", "It gives `undefined`"],
          answer: 1,
          explain: "`length` is a property (a number), not a method. Write `s.length` with no brackets.",
          why: ["`length` is already the number. Adding `()` tries to call a number.", "", "It doesn't quietly fail. It throws."],
        },
        {
          q: "Which gives the **last** character of `s`?",
          choices: ["`s[s.length]`", "`s[s.length - 1]`", "`s[-1]`"],
          answer: 1,
          explain: "Indexes start at 0, so the last one is `length - 1`. `s.at(-1)` also works.",
          why: ["That's one past the end, so it gives `undefined`.", "", "Brackets don't count from the end in JS, so `s[-1]` is `undefined`. Use `s.at(-1)`."],
        },
        {
          q: "What does this return?\n\n~~~\n\"Hello Big World\".toLowerCase().split(\" \").join(\"-\")\n~~~",
          choices: ["`\"hello-big-world\"`", "`[ \"hello\", \"big\", \"world\" ]`", "`\"hello big world\"`"],
          answer: 0,
          explain: "Each method returns a new value for the next one: lowercase string, then an array of words, then one string glued with `-`.",
          why: ["", "That's the value after `split`, but `join` turns it back into a string.", "That's after `toLowerCase` only. `split` and `join` swap the spaces for dashes."],
        },
        {
          q: "What does `\"Hello\".includes(\"h\")` give?",
          choices: ["`true`", "`false`", "`\"h\"`"],
          answer: 1,
          explain: "String comparisons are case-sensitive: `\"H\"` and `\"h\"` are different characters.",
          why: ["`\"Hello\"` has a capital H, and `\"h\"` is not `\"H\"`.", "", "`includes` returns a boolean."],
        },
      ],
    },
  ],
};
