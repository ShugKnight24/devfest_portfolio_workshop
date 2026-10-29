// JS course · lesson 8. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'arrays-of-objects',
  builds: ['js/objects'],
  title: 'Arrays of objects',
  goal: 'Work with the shape every API sends back, using five named loop patterns that map, filter, find and reduce replace next.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The shape of every API response',
      md: `
Put lessons 5 and 7 together and you get the data shape you'll handle more than any other: **an array of objects**.

~~~js
const users = [
  { id: 1, name: "Ada", age: 36, active: true },
  { id: 2, name: "Linus", age: 17, active: false },
  { id: 3, name: "Grace", age: 85, active: true },
];
console.log(users.length);
~~~

A list of users, orders, messages, todos: almost every API sends back exactly this. Reading from it is two steps, **position first, then label**:

~~~js
const users = [
  { id: 1, name: "Ada", age: 36, active: true },
  { id: 2, name: "Linus", age: 17, active: false },
];
const second = users[1];       // step 1: the array gives you an object
console.log(second.name);      // step 2: the object gives you a value
console.log(users[1].name);    // both steps at once
~~~
`,
    },
    {
      type: 'predict',
      title: 'Reading from a list of users',
      code: `const users = [
  { id: 1, name: "Ada", age: 36, active: true },
  { id: 2, name: "Linus", age: 17, active: false },
];
console.log(users.length);
console.log(users[1].name);
console.log(users[0]);
console.log(users[0].age > users[1].age);`,
      output: `2
Linus
{ id: 1, name: "Ada", age: 36, active: true }
true`,
      explain: `
- \`users.length\` counts **objects**, not fields: 2.
- \`users[1].name\`: the second user, then their name.
- \`users[0]\`: the whole first object.
- \`users[0].age > users[1].age\`: 36 > 17.
`,
    },
    {
      type: 'read',
      title: 'Five loop patterns',
      md: `
Nearly every "do something with this list" question is one of **five patterns**. Learn to name them and half the work is done before you type.

| Pattern | Question it answers | Starts with | Each lap |
|---|---|---|---|
| **Collect** | "give me every name" | \`const out = []\` | \`out.push(...)\` |
| **Find** | "give me the user with id 2" | nothing | \`if (match) return item\` |
| **Sum / count** | "total age", "how many active" | \`let total = 0\` | \`total = total + ...\` |
| **Keep-if** | "only the adults" | \`const out = []\` | \`if (test) out.push(item)\` |
| **Best so far** | "the oldest user" | \`let best = arr[0]\` | \`if (better) best = item\` |

You'll do each one now: first watch it run, then write one yourself. Every pattern uses a plain \`for...of\` loop (lesson 6).
`,
    },
    {
      type: 'predict',
      title: 'Pattern 1: collect',
      md: 'Build a new array with one value from each object.',
      code: `const users = [
  { id: 1, name: "Ada", age: 36, active: true },
  { id: 2, name: "Linus", age: 17, active: false },
  { id: 3, name: "Grace", age: 85, active: true },
];

const out = [];
for (const user of users) {
  out.push(user.id);
}
console.log(out);`,
      output: `[ 1, 2, 3 ]`,
      explain: `
| lap | \`user\` | push | \`out\` after |
|---|---|---|---|
| start | | | \`[]\` |
| 1 | Ada | 1 | \`[1]\` |
| 2 | Linus | 2 | \`[1, 2]\` |
| 3 | Grace | 3 | \`[1, 2, 3]\` |

Collect always gives you an array the **same length** as the input.
`,
    },
    {
      type: 'task',
      title: 'names',
      md: `
**Example** (already solved): collect one field from each object.

~~~
function ids(users) {
  const out = [];
  for (const user of users) {
    out.push(user.id);
  }
  return out;
}
~~~

**Your turn:** \`names(users)\` returns \`["Ada", "Linus", "Grace"]\` for users shaped like \`{ id: 1, name: "Ada", age: 36, active: true }\`.
`,
      starter: `function names(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'names(users) is ["Ada", "Linus", "Grace"]',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
eq(names(users), ["Ada", "Linus", "Grace"]);`,
        },
        { name: 'names([]) is []', code: `eq(names([]), []);` },
      ],
      hint: 'Same as `ids`, with `user.name`.',
      solution: `function names(users) {
  const out = [];
  for (const user of users) {
    out.push(user.name);
  }
  return out;
}
`,
    },
    {
      type: 'predict',
      title: 'Pattern 2: find',
      md: 'Walk the list and **stop** at the first match. `return` inside a loop leaves the whole function immediately.',
      code: `function findByName(users, name) {
  for (const user of users) {
    if (user.name === name) {
      return user;
    }
  }
  return null;
}

const users = [
  { id: 1, name: "Ada", age: 36, active: true },
  { id: 2, name: "Linus", age: 17, active: false },
];
console.log(findByName(users, "Linus"));
console.log(findByName(users, "Zed"));`,
      output: `{ id: 2, name: "Linus", age: 17, active: false }
null`,
      explain: `
Looking for \`"Linus"\`:

| lap | \`user.name\` | match? | what happens |
|---|---|---|---|
| 1 | Ada | no | keep going |
| 2 | Linus | **yes** | \`return user\`: the function ends right here |

Looking for \`"Zed"\`, no lap matches, the loop finishes, and the line **after** the loop runs: \`return null\`. That final \`return null\` is your "not found" answer.
`,
    },
    {
      type: 'predict',
      title: 'The classic find bug',
      md: 'This version adds an `else`. Looks harmless. Grace is in the list...',
      code: `function findByName(users, name) {
  for (const user of users) {
    if (user.name === name) {
      return user;
    } else {
      return null;
    }
  }
}

const users = [
  { id: 1, name: "Ada", age: 36, active: true },
  { id: 3, name: "Grace", age: 85, active: true },
];
console.log(findByName(users, "Grace"));`,
      output: `null`,
      explain: `
On lap 1 the user is Ada, not a match, so the \`else\` runs \`return null\`, and the function is **over**. It never looks at Grace.

You can only say "not found" after checking **everyone**, which means **after** the loop, not inside it.
`,
    },
    {
      type: 'task',
      title: 'findById',
      md: `\`findById(users, 2)\` returns the **whole user** with id 2, or \`null\` if there isn't one. Use the find pattern: return inside the loop on a match, \`return null\` after the loop.`,
      starter: `function findById(users, id) {
  // your code here
}
`,
      tests: [
        {
          name: 'findById(users, 2) is the Linus object',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
assert(findById(users, 2) === users[1], "expected the user object with id 2");`,
        },
        {
          name: 'finds the last user too',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 3, name: "Grace", age: 85, active: true }];
assert(findById(users, 3) === users[1], "expected Grace: is there a return null inside the loop?");`,
        },
        {
          name: 'findById(users, 99) is null',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }];
eq(findById(users, 99), null);`,
        },
      ],
      hint: 'Copy the shape of `findByName` from two steps back, but compare `user.id === id`. The `return null` goes **after** the loop.',
      solution: `function findById(users, id) {
  for (const user of users) {
    if (user.id === id) {
      return user; // found it: stop right here
    }
  }
  return null; // only after checking everyone
}
`,
    },
    {
      type: 'predict',
      title: 'Pattern 3: sum and count',
      md: 'The accumulator from lesson 6, reading a field from each object. This one **counts**: it adds 1, not the age.',
      code: `const users = [
  { id: 1, name: "Ada", age: 36, active: true },
  { id: 2, name: "Linus", age: 17, active: false },
  { id: 3, name: "Grace", age: 85, active: true },
];

let count = 0;
for (const user of users) {
  if (user.age >= 18) {
    count = count + 1;
  }
}
console.log(count);`,
      output: `2`,
      explain: `
| lap | \`user.age\` | \`>= 18\`? | \`count\` after |
|---|---|---|---|
| start | | | 0 |
| 1 | 36 | yes | 1 |
| 2 | 17 | no | 1 |
| 3 | 85 | yes | 2 |

**Sum** adds a value each lap (\`total = total + user.age\`). **Count** adds 1 when a test passes. Both start at 0, before the loop.
`,
    },
    {
      type: 'task',
      title: 'totalAge',
      md: `\`totalAge(users)\` returns the sum of everyone's age. For Ada (36), Linus (17) and Grace (85) that's \`138\`. An empty list gives \`0\`.`,
      starter: `function totalAge(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'totalAge(users) is 138',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
eq(totalAge(users), 138);`,
        },
        { name: 'totalAge([]) is 0', code: `eq(totalAge([]), 0);` },
      ],
      hint: '`let total = 0;` before the loop, `total = total + user.age;` inside it, `return total;` after it.',
      solution: `function totalAge(users) {
  let total = 0;
  for (const user of users) {
    total = total + user.age; // sum: add the field itself
  }
  return total;
}
`,
    },
    {
      type: 'task',
      title: 'countActive',
      md: `\`countActive(users)\` returns how many users have \`active: true\`. (\`user.active\` is already \`true\` or \`false\`, so it can go straight into the \`if\`.)`,
      starter: `function countActive(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'countActive(users) is 2',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
eq(countActive(users), 2);`,
        },
        { name: 'countActive([]) is 0', code: `eq(countActive([]), 0);` },
      ],
      hint: 'The count pattern from the predict step, with `if (user.active)` as the test.',
      solution: `function countActive(users) {
  let count = 0;
  for (const user of users) {
    if (user.active) { // already a boolean, no === true needed
      count = count + 1;
    }
  }
  return count;
}
`,
    },
    {
      type: 'predict',
      title: 'Pattern 4: keep-if',
      md: 'Like collect, but only some items make it into the new array, and they go in **whole**.',
      code: `const users = [
  { id: 1, name: "Ada", age: 36, active: true },
  { id: 2, name: "Linus", age: 17, active: false },
  { id: 3, name: "Grace", age: 85, active: true },
];

const out = [];
for (const user of users) {
  if (!user.active) {
    out.push(user);
  }
}
console.log(out);
console.log(out.length);`,
      output: `[ { id: 2, name: "Linus", age: 17, active: false } ]
1`,
      explain: `
\`!user.active\` flips the boolean, so it's true for **inactive** users. Only Linus passes, so the result is an array of one object.

Keep-if gives you an array that is **the same length or shorter** than the input, and the items are the original objects, unchanged.
`,
    },
    {
      type: 'task',
      title: 'adults',
      md: `
**Example:** keep only some objects.

~~~
function inactive(users) {
  const out = [];
  for (const user of users) {
    if (!user.active) {
      out.push(user);
    }
  }
  return out;
}
~~~

**Your turn:** \`adults(users)\` returns the users whose age is 18 or more.
`,
      starter: `function adults(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'adults(users) is Ada and Grace',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
eq(adults(users), [users[0], users[2]]);`,
        },
        {
          name: 'exactly 18 counts as an adult',
          code: `const users = [{ id: 4, name: "Sam", age: 18, active: true }];
eq(adults(users).length, 1, "18 should count: use >= not >");`,
        },
      ],
      hint: 'Same as `inactive`, with the test `user.age >= 18`.',
      solution: `function adults(users) {
  const out = [];
  for (const user of users) {
    if (user.age >= 18) {
      out.push(user); // push the whole user, not just a field
    }
  }
  return out;
}
`,
    },
    {
      type: 'predict',
      title: 'Pattern 5: best so far',
      md: 'Remember the best object seen so far. Compare a **field**, keep the **whole object**.',
      code: `const users = [
  { id: 1, name: "Ada", age: 36, active: true },
  { id: 2, name: "Linus", age: 17, active: false },
  { id: 3, name: "Grace", age: 85, active: true },
];

let youngest = users[0];
for (const user of users) {
  if (user.age < youngest.age) {
    youngest = user;
  }
}
console.log(youngest.name);`,
      output: `Linus`,
      explain: `
| lap | \`user\` | \`user.age < youngest.age\`? | \`youngest\` after |
|---|---|---|---|
| start | | | Ada (36) |
| 1 | Ada (36) | 36 < 36? no | Ada |
| 2 | Linus (17) | 17 < 36? **yes** | Linus |
| 3 | Grace (85) | 85 < 17? no | Linus |

Start with \`users[0]\` so the answer is always a real user from the list.
`,
    },
    {
      type: 'task',
      title: 'oldest',
      md: `\`oldest(users)\` returns the **whole user object** with the highest age. Start with the first user, like the youngest example, but flip the comparison.`,
      starter: `function oldest(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'oldest(users) is the Grace object',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
assert(oldest(users) === users[2], "expected the whole Grace object");`,
        },
        {
          name: 'works when the oldest is first',
          code: `const users = [{ id: 3, name: "Grace", age: 85, active: true }, { id: 1, name: "Ada", age: 36, active: true }];
assert(oldest(users) === users[0], "expected Grace");`,
        },
      ],
      hint: '`let best = users[0];` then in the loop `if (user.age > best.age) { best = user; }`. Return `best`, not `best.age`.',
      solution: `function oldest(users) {
  let best = users[0];
  for (const user of users) {
    if (user.age > best.age) { // compare the field...
      best = user; // ...keep the whole object
    }
  }
  return best;
}
`,
    },
    {
      type: 'task',
      title: 'Two patterns together: activeNames',
      md: `
Real questions often combine patterns. "The names of the active users" is **keep-if** (only active ones) plus **collect** (their names), and you can do both in one loop.

\`activeNames(users)\` returns \`["Ada", "Grace"]\` for the usual three users.
`,
      starter: `function activeNames(users) {
  // your code here
}
`,
      tests: [
        {
          name: 'activeNames(users) is ["Ada", "Grace"]',
          code: `const users = [{ id: 1, name: "Ada", age: 36, active: true }, { id: 2, name: "Linus", age: 17, active: false }, { id: 3, name: "Grace", age: 85, active: true }];
eq(activeNames(users), ["Ada", "Grace"]);`,
        },
        { name: 'activeNames([]) is []', code: `eq(activeNames([]), []);` },
      ],
      hint: 'The keep-if loop, but push `user.name` instead of `user`.',
      solution: `function activeNames(users) {
  const out = [];
  for (const user of users) {
    if (user.active) {
      out.push(user.name); // keep-if decides who, collect decides what
    }
  }
  return out;
}
`,
    },
    {
      type: 'read',
      title: 'Coming next: each pattern gets a one-liner',
      md: `
You've now written every pattern by hand. That matters, because the next three lessons replace each one with a built-in **higher-order function**, and they're just these loops packaged up:

| Pattern | Built-in | Lesson |
|---|---|---|
| Collect | \`map\` | 9 |
| Keep-if | \`filter\` | 10 |
| Find | \`find\` | 10 |
| Sum / count / best so far | \`reduce\` | 11 |

Here's a preview. Same answers as your loops, one line each:

~~~js
const users = [
  { id: 1, name: "Ada", age: 36, active: true },
  { id: 2, name: "Linus", age: 17, active: false },
  { id: 3, name: "Grace", age: 85, active: true },
];
console.log(users.map((u) => u.name));
console.log(users.filter((u) => u.age >= 18).length);
console.log(users.find((u) => u.id === 2).name);
console.log(users.reduce((total, u) => total + u.age, 0));
~~~

Don't worry about the syntax yet. When it shows up, remember: **it's one of your five loops.**
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "How do you read the name of the **third** user in `users`?",
          choices: ["`users[3].name`", "`users[2].name`", "`users.name[2]`"],
          answer: 1,
          explain: "Position first (the third item is index 2), then the label.",
          why: ["Index 3 is the fourth user.", "", "`users` is an array of objects. It has no `.name` of its own."],
        },
        {
          q: "What does this print?\n\n~~~\nfunction findById(users, id) {\n  for (const user of users) {\n    if (user.id === id) return user;\n    else return null;\n  }\n}\n\nconst users = [{ id: 1 }, { id: 2 }];\nconsole.log(findById(users, 2));\n~~~",
          choices: ["`{ id: 2 }`", "`null`", "`undefined`"],
          answer: 1,
          explain: "The `else return null` quits on the first user that doesn't match. \"Not found\" can only be decided **after** the loop has checked everyone.",
          why: ["The loop never reaches user 2. It returns on the first lap.", "", "It returns `null` explicitly on the first lap."],
        },
        {
          q: "You want the names of only the active users. Which loop patterns do you combine?",
          choices: ["Collect only", "Keep-if, then collect", "Best so far"],
          answer: 1,
          explain: "Keep-if picks the active users; collect turns each of those into a name. In lesson 10 that becomes `filter` then `map`.",
          why: ["Collect alone keeps every user, active or not.", "", "Best so far finds one winner, not a list."],
        },
        {
          q: "For \"the oldest user\", what do you keep in `best`?",
          choices: ["The biggest age number", "The whole user object", "The index"],
          answer: 1,
          explain: "Compare `user.age` with `best.age`, but keep the whole user, because the task returns the user.",
          why: ["You'd lose who it was, and the task returns the user.", "", "Possible, but awkward. Keep the user itself."],
        },
        {
          q: "What does this print?\n\n~~~\nconst users = [{ age: 30 }, { age: 12 }];\nlet total = 0;\nfor (const u of users) total = total + u.age;\nconsole.log(total);\n~~~",
          choices: ["`42`", "`3012`", "`NaN`"],
          answer: 0,
          explain: "The ages are numbers, so `+` adds them.",
          why: ["", "`+` only glues when one side is a string. These are numbers.", "`NaN` would mean adding something that isn't a number, like a missing field."],
        },
      ],
    },
  ],
};
