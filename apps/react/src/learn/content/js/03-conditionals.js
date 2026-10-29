// JS course · lesson 3. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'conditionals',
  builds: ['js/functions'],
  title: 'Conditionals',
  goal: 'Make decisions in code with comparisons, if / else if / else, && and ||, ternaries, and truthiness.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Comparisons give true or false',
      md: `
A **comparison** asks a yes/no question and answers with \`true\` or \`false\` (a **boolean**):

~~~js
const age = 20;

console.log(age >= 18);      // greater than or equal
console.log(age < 13);       // less than
console.log(age === 20);     // equal (three = signs)
console.log(age !== 20);     // NOT equal
~~~

Because a comparison already **is** \`true\` or \`false\`, a function can return it directly. No \`if\` needed:

~~~
function isTeen(age) {
  return age >= 13 && age <= 19;
}
~~~

Watch out: one \`=\` **assigns** (\`age = 20\` puts 20 into age). Three \`===\` **compares**.
`,
    },
    {
      type: 'predict',
      title: '=== vs ==',
      md: 'JS has two equality checks. Predict all four lines.',
      code: `console.log(5 === "5");
console.log(5 == "5");
console.log(0 == "");
console.log(null == undefined);`,
      output: `false
true
true
true`,
      explain: `
- \`===\` (strict) says: same type **and** same value. The number 5 and the string "5" are different types, so \`false\`.
- \`==\` (loose) converts types before comparing, which leads to surprises like \`0 == ""\` being \`true\`.

**Rule: always use \`===\` and \`!==\`.** Interviewers like asking about \`==\` precisely because it's surprising.
`,
    },
    {
      type: 'task',
      title: 'isAdult',
      md: `
**Example:**

~~~
function isTeen(age) {
  return age >= 13 && age <= 19;
}
~~~

**Your turn:** \`isAdult(18)\` returns \`true\`, \`isAdult(17)\` returns \`false\`. Return the comparison directly.
`,
      starter: `function isAdult(age) {
  // your code here
}
`,
      tests: [
        { name: 'isAdult(18) is true', code: `eq(isAdult(18), true, "18 counts as an adult: use >=");` },
        { name: 'isAdult(17) is false', code: `eq(isAdult(17), false);` },
      ],
      hint: '`return age >= 18;`',
      solution: `function isAdult(age) {
  return age >= 18; // the comparison is already true or false
}
`,
    },
    {
      type: 'read',
      title: 'if / else if / else',
      md: `
When you need to choose between more than two outcomes, chain \`if\`s:

~~~js
function temperature(t) {
  if (t > 30) {
    return "hot";
  } else if (t > 15) {
    return "warm";
  } else {
    return "cold";
  }
}

console.log(temperature(35));
console.log(temperature(20));
console.log(temperature(5));
~~~

JS checks the conditions **top to bottom** and runs only the **first** one that's true. The final \`else\` catches everything that's left.

Trace \`temperature(20)\`:

| Check | Result |
|---|---|
| \`20 > 30\`? | false, skip |
| \`20 > 15\`? | true, return \`"warm"\`, done |
`,
    },
    {
      type: 'predict',
      title: 'Order matters',
      md: 'This function has a bug. Trace it for 500 and for 50.',
      code: `function size(n) {
  if (n > 10) {
    return "medium";
  } else if (n > 100) {
    return "large";
  } else {
    return "small";
  }
}

console.log(size(500));
console.log(size(50));`,
      output: `medium
medium`,
      explain: `
500 is greater than 10, so the **first** check wins and returns \`"medium"\`. The \`n > 100\` check never gets a chance.

Fix: put the **strictest** check first.

~~~
if (n > 100) return "large";
else if (n > 10) return "medium";
else return "small";
~~~
`,
    },
    {
      type: 'task',
      title: 'sign',
      md: `\`sign(5)\` returns \`"positive"\`, \`sign(-2)\` returns \`"negative"\`, and \`sign(0)\` returns \`"zero"\`. Use \`if / else if / else\` like \`temperature\`.`,
      starter: `function sign(n) {
  // your code here
}
`,
      tests: [
        { name: 'sign(5) is "positive"', code: `eq(sign(5), "positive");` },
        { name: 'sign(-2) is "negative"', code: `eq(sign(-2), "negative");` },
        { name: 'sign(0) is "zero"', code: `eq(sign(0), "zero");` },
      ],
      hint: '`if (n > 0) { return "positive"; } else if (n < 0) { return "negative"; } else { return "zero"; }`',
      solution: `function sign(n) {
  if (n > 0) {
    return "positive";
  } else if (n < 0) {
    return "negative";
  } else {
    return "zero"; // the only number left
  }
}
`,
    },
    {
      type: 'task',
      title: 'bigger',
      md: `\`bigger(3, 7)\` returns \`7\`, and \`bigger(9, 2)\` returns \`9\`. Use an \`if\`, not \`Math.max\`.`,
      starter: `function bigger(a, b) {
  // your code here
}
`,
      tests: [
        { name: 'bigger(3, 7) is 7', code: `eq(bigger(3, 7), 7);` },
        { name: 'bigger(9, 2) is 9', code: `eq(bigger(9, 2), 9);` },
      ],
      hint: '`if (a > b) { return a; }` and then, after the if, `return b;`',
      solution: `function bigger(a, b) {
  if (a > b) {
    return a;
  }
  return b; // only reached when a is not bigger
}
`,
      explain: 'You don\'t always need `else`: `return` leaves the function, so any line after the `if` only runs when the condition was false.',
    },
    {
      type: 'read',
      title: 'Combining conditions: && and ||',
      md: `
- \`&&\` means **and**: true only if **both** sides are true.
- \`||\` means **or**: true if **at least one** side is true.
- \`!\` means **not**: flips true and false.

~~~js
const age = 20;
const hasTicket = false;

console.log(age >= 18 && hasTicket);   // both? no
console.log(age >= 18 || hasTicket);   // at least one? yes
console.log(!hasTicket);               // flipped
~~~
`,
    },
    {
      type: 'task',
      title: 'canVote',
      md: `You can vote if you're 18 or older **and** a citizen. \`canVote(20, true)\` returns \`true\`. \`canVote(20, false)\` and \`canVote(16, true)\` return \`false\`.`,
      starter: `function canVote(age, isCitizen) {
  // your code here
}
`,
      tests: [
        { name: 'canVote(20, true) is true', code: `eq(canVote(20, true), true);` },
        { name: 'canVote(20, false) is false', code: `eq(canVote(20, false), false);` },
        { name: 'canVote(16, true) is false', code: `eq(canVote(16, true), false);` },
      ],
      hint: '`return age >= 18 && isCitizen;`',
      solution: `function canVote(age, isCitizen) {
  return age >= 18 && isCitizen; // both must be true
}
`,
    },
    {
      type: 'predict',
      title: 'The "or" trap',
      md: 'Someone wants to check if `day` is a weekend day. Today is Monday.',
      code: `const day = "mon";

console.log(day === "sat" || "sun");

if (day === "sat" || "sun") {
  console.log("weekend!");
}`,
      output: `sun
weekend!`,
      explain: `
\`||\` doesn't mean "equals this or that". It joins two **separate** conditions:

~~~
(day === "sat")  ||  ("sun")
~~~

The left side is \`false\`, so \`||\` returns the right side: the string \`"sun"\`. A non-empty string counts as true in an \`if\`, so it says "weekend!" on a Monday.

Fix: repeat the comparison on both sides.

~~~
day === "sat" || day === "sun"
~~~
`,
    },
    {
      type: 'task',
      title: 'isWeekend',
      md: `\`isWeekend("sat")\` and \`isWeekend("sun")\` return \`true\`, and \`isWeekend("mon")\` returns \`false\`. Avoid the trap you just saw.`,
      starter: `function isWeekend(day) {
  // your code here
}
`,
      tests: [
        { name: 'isWeekend("sat") is true', code: `eq(isWeekend("sat"), true);` },
        { name: 'isWeekend("sun") is true', code: `eq(isWeekend("sun"), true);` },
        { name: 'isWeekend("mon") is false', code: `eq(isWeekend("mon"), false, 'got something other than false: did you write day === "sat" || "sun"?');` },
      ],
      hint: '`return day === "sat" || day === "sun";` with the full comparison on both sides.',
      solution: `function isWeekend(day) {
  return day === "sat" || day === "sun";
}
`,
    },
    {
      type: 'task',
      title: 'grade',
      md: `\`grade(score)\`: 90 and up is \`"A"\`, 80 and up is \`"B"\`, 70 and up is \`"C"\`, anything else is \`"F"\`. Think about the order of your checks.`,
      starter: `function grade(score) {
  // your code here
}
`,
      tests: [
        { name: 'grade(95) is "A"', code: `eq(grade(95), "A");` },
        { name: 'grade(80) is "B"', code: `eq(grade(80), "B", "80 is a B: use >=");` },
        { name: 'grade(75) is "C"', code: `eq(grade(75), "C");` },
        { name: 'grade(10) is "F"', code: `eq(grade(10), "F");` },
      ],
      hint: 'Highest first: `if (score >= 90) return "A";`, then `>= 80`, then `>= 70`, then `return "F";` at the end.',
      solution: `function grade(score) {
  if (score >= 90) {
    return "A";
  } else if (score >= 80) {
    return "B";
  } else if (score >= 70) {
    return "C";
  } else {
    return "F";
  }
}
`,
    },
    {
      type: 'read',
      title: 'Truthy and falsy',
      md: `
An \`if\` doesn't need a real boolean. JS treats every value as either **truthy** or **falsy**.

There are only a few **falsy** values. Memorize them:

~~~
false   0   ""   null   undefined   NaN
~~~

**Everything else is truthy**, including \`"0"\`, \`"false"\`, \`[]\` and \`{}\`.

~~~js
const name = "";

if (name) {
  console.log("Hi " + name);
} else {
  console.log("No name given");
}
~~~

That's why \`if (name)\` is a common way to say "if name isn't empty".
`,
    },
    {
      type: 'predict',
      title: 'Truthiness check',
      md: '`Boolean(x)` tells you whether `x` counts as true or false.',
      code: `console.log(Boolean(0), Boolean("0"), Boolean([]), Boolean(""));`,
      output: `false true true false`,
      explain: '`0` and `""` are on the falsy list. `"0"` is a non-empty string and `[]` is an array, so both are truthy. An empty array being truthy catches people out: to check for an empty array, use `arr.length === 0`.',
    },
    {
      type: 'task',
      title: 'parity, with a ternary',
      md: `
A **ternary** picks one of two values in a single line: \`condition ? valueIfTrue : valueIfFalse\`.

**Example:**

~~~
function yesNo(flag) {
  return flag ? "yes" : "no";
}
~~~

**Your turn:** \`parity(4)\` returns \`"even"\`, \`parity(7)\` returns \`"odd"\`. Use a ternary.
`,
      starter: `function parity(n) {
  // your code here
}
`,
      tests: [
        { name: 'parity(4) is "even"', code: `eq(parity(4), "even");` },
        { name: 'parity(7) is "odd"', code: `eq(parity(7), "odd");` },
      ],
      hint: '`return n % 2 === 0 ? "even" : "odd";`',
      solution: `function parity(n) {
  return n % 2 === 0 ? "even" : "odd";
}
`,
      explain: 'You\'ll use ternaries constantly in React: `{loading ? <Spinner /> : <List />}`.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What do `5 == \"5\"` and `5 === \"5\"` give?",
          choices: ["`true` and `true`", "`true` and `false`", "`false` and `false`", "`false` and `true`"],
          answer: 1,
          explain: "`==` converts types before comparing, so `\"5\"` becomes 5. `===` compares type and value with no conversion. Use `===`.",
          why: ["`===` doesn't convert, so a number and a string are never equal.", "", "`==` converts the string to a number first, so the first one is `true`.", "It's the other way round: `==` is the loose one."],
        },
        {
          q: "What does `grade(95)` return?\n\n~~~\nfunction grade(score) {\n  if (score >= 70) return \"C\";\n  else if (score >= 80) return \"B\";\n  else if (score >= 90) return \"A\";\n  return \"F\";\n}\n~~~",
          choices: ["`\"A\"`", "`\"C\"`", "`\"B\"`"],
          answer: 1,
          explain: "Only the **first** true branch runs. 95 >= 70 is true, so it returns `\"C\"` before the other checks run. Put the strictest check first.",
          why: ["The `>= 90` check is never reached. An earlier branch already matched.", "", "Only the first true branch runs, and that's the `>= 70` one."],
        },
        {
          q: "What does `isWeekend(\"mon\")` return?\n\n~~~\nfunction isWeekend(day) {\n  return day === \"sat\" || \"sun\";\n}\n~~~",
          choices: ["`false`", "`\"sun\"`", "`true`"],
          answer: 1,
          explain: "The right side of `||` is just the string `\"sun\"`, not a comparison. `||` returns the first truthy side, so you get `\"sun\"`. Write `day === \"sat\" || day === \"sun\"`.",
          why: ["It looks like it should be false, but the right side isn't compared to `day` at all.", "", "`||` returns one of its sides, not a boolean."],
        },
        {
          q: "Which of these is **truthy**?",
          choices: ["`0`", "`\"\"`", "`[]`", "`null`"],
          answer: 2,
          explain: "The falsy values are `false`, `0`, `\"\"`, `null`, `undefined` and `NaN`. Everything else is truthy, including an empty array.",
          why: ["`0` is falsy.", "The empty string is falsy.", "", "`null` is falsy."],
        },
        {
          q: "What does this print?\n\n~~~\nconst n = 7;\nconsole.log(n % 2 === 0 ? \"even\" : \"odd\");\n~~~",
          choices: ["`even`", "`odd`", "`true`"],
          answer: 1,
          explain: "7 % 2 is 1, so the condition is false and the ternary picks the value after the `:`.",
          why: ["7 isn't divisible by 2, so the condition is false.", "", "A ternary returns one of its two values, not the condition."],
        },
      ],
    },
  ],
};
