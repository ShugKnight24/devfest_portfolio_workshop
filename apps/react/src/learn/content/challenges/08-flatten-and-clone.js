// Challenges · lesson 8. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'flatten-and-clone',
  builds: ['js/spread-and-destructuring', 'js/objects', 'challenges/valid-parentheses', 'dsa/recursion'],
  title: 'Flatten and deep clone: recursion',
  goal: 'Handle data nested to any depth by doing the same thing to each smaller piece, then use that to flatten arrays and copy objects all the way down.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The question',
      md: `
> "Write \`flatten(arr)\`. The array can contain numbers and other arrays, nested to **any depth**. Return one flat array, in order. Don't use the built-in \`.flat\`."

~~~
flatten([1, [2, [3, [4]], 5]])   → [1, 2, 3, 4, 5]
flatten([[[]]])                  → []
~~~

The follow-up is usually a cousin: "Now write \`deepClone(obj)\`." In JavaScript lesson 12 you saw that spread copies only **one level**: nested arrays and objects are still shared. A deep clone fixes that, and it's the same idea as flatten.

The words "any depth" are the hint. You can't write one loop per level when you don't know how many levels there are. You need **recursion**.
`,
    },
    {
      type: 'check',
      title: 'Before you code: ask and spot',
      items: [
        {
          q: 'Which question is worth asking about `flatten`?',
          choices: [
            '"Should it flatten all the way, or only to a given depth?"',
            '"Can I use recursion?"',
            '"Should the numbers be sorted?"',
          ],
          answer: 0,
          explain: 'The built-in `arr.flat()` defaults to depth 1, so it\'s a real ambiguity. Part 2 adds a depth.',
          why: {
            1: 'Explain your approach; don\'t ask permission for it.',
            2: 'Flattening keeps the original order.',
          },
        },
        {
          q: 'For `deepClone`, which inputs should you ask about?',
          choices: [
            '"Will there be Dates, Maps, functions, or objects that refer to themselves?"',
            '"Are the keys in alphabetical order?"',
            '"How many keys are there?"',
          ],
          answer: 0,
          explain: 'Plain objects, arrays and primitives are the core. Special types and cycles are classic follow-ups, so name them up front.',
          why: {
            1: 'Key order doesn\'t change how you copy.',
            2: 'Size doesn\'t change the approach.',
          },
        },
        {
          q: 'Which phrase points to recursion?',
          choices: [
            '"nested to any depth": the inner piece looks like the whole',
            '"return an array": arrays need recursion',
            '"in order": order needs recursion',
          ],
          answer: 0,
          explain: 'When a piece of the input has the same shape as the whole input (an array inside an array), solve the piece with the same function.',
          why: {
            1: 'Most functions return arrays without recursion.',
            2: 'A plain loop keeps order too.',
          },
        },
      ],
    },
    {
      type: 'read',
      title: 'Recursion in one example',
      md: `
A **recursive** function calls itself on a **smaller** piece of the problem. It needs two parts:

- a **base case**: a piece so small you answer it directly, with no call;
- a **recursive case**: break off a smaller piece and call yourself on it.

Here's adding up every number in a nested array:

~~~js
function sumAll(arr) {
  let total = 0;
  for (const item of arr) {
    if (Array.isArray(item)) {
      total += sumAll(item);   // recursive case: a smaller array, same job
    } else {
      total += item;           // base case: a plain number
    }
  }
  return total;
}

console.log(sumAll([1, [2, [3, 4]], 5]));
~~~

Trust the call. When you write \`sumAll(item)\`, assume it already works for the inner array, and only worry about **this** level. That trust is the hardest part of recursion, and the most useful.

You've already met the machinery: each call waits on the **call stack**, last in, first out, the same shape as the brackets in lesson 3.
`,
    },
    {
      type: 'predict',
      title: 'Watch the calls nest',
      code: `function depth(arr, level) {
  console.log("level " + level + ": " + arr.length + " items");
  for (const item of arr) {
    if (Array.isArray(item)) depth(item, level + 1);
  }
}

depth([1, [2, [3]], [4]], 1);`,
      output: `level 1: 3 items
level 2: 2 items
level 3: 1 items
level 2: 1 items`,
      explain: `
The outer call (level 1) reaches \`[2, [3]]\` and calls itself at level 2. That call reaches \`[3]\` and goes to level 3. Level 3 has no arrays inside, so it returns, then level 2 returns, and level 1 carries on to \`[4]\`.

Every call finishes its own loop before going back up: **depth first**.
`,
    },
    {
      type: 'task',
      title: 'Part 1: flatten',
      md: `
Write \`flatten(arr)\`: one flat array of every non-array item, in order, however deep the nesting.

It's \`sumAll\` with an array instead of a total:

- For a plain item: \`push\` it.
- For an array: \`flatten\` it, and push **every item** of the result: \`result.push(...flatten(item))\`.

~~~
flatten([1, [2, [3, [4]], 5]])   → [1, 2, 3, 4, 5]
~~~
`,
      starter: `function flatten(arr) {
  // your code here
}
`,
      tests: [
        { name: 'flatten([1, [2, [3, [4]], 5]]) is [1, 2, 3, 4, 5]', code: `eq(flatten([1, [2, [3, [4]], 5]]), [1, 2, 3, 4, 5]);` },
        { name: 'an already flat array stays the same', code: `eq(flatten([1, 2]), [1, 2]);` },
        { name: 'empty arrays disappear', code: `eq(flatten([[], [[]], 1]), [1]);` },
        { name: 'works for strings too', code: `eq(flatten(["a", ["b"]]), ["a", "b"]);` },
      ],
      hint: '`const result = [];` Loop over `arr`. `if (Array.isArray(item)) result.push(...flatten(item)); else result.push(item);`. Return `result`.',
      solution: `function flatten(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));  // trust the call: it returns a flat array
    } else {
      result.push(item);              // base case: a plain value
    }
  }
  return result;
}
`,
      explain: 'The `...` matters. `result.push(flatten(item))` would push the inner array as one item, and you\'d be back where you started.',
    },
    {
      type: 'task',
      title: 'Part 2: flatten to a depth',
      md: `
> "Now take a \`depth\` argument, like the built-in \`arr.flat(depth)\`. Depth 1 removes one level of nesting."

Write \`flattenDepth(arr, depth)\`. If \`depth\` is 0, return a copy of \`arr\` as it is. Otherwise, arrays inside get flattened with \`depth - 1\`.

~~~
flattenDepth([1, [2, [3, [4]]]], 1)   → [1, 2, [3, [4]]]
flattenDepth([1, [2, [3, [4]]]], 2)   → [1, 2, 3, [4]]
flattenDepth([1, [2]], 0)             → [1, [2]]
~~~

Each recursive call gets a smaller \`depth\`, and \`depth === 0\` is a new base case.
`,
      starter: `function flattenDepth(arr, depth) {
  // your code here
}
`,
      tests: [
        { name: 'depth 1 removes one level', code: `eq(flattenDepth([1, [2, [3, [4]]]], 1), [1, 2, [3, [4]]]);` },
        { name: 'depth 2 removes two levels', code: `eq(flattenDepth([1, [2, [3, [4]]]], 2), [1, 2, 3, [4]]);` },
        { name: 'depth 0 changes nothing', code: `eq(flattenDepth([1, [2]], 0), [1, [2]]);` },
        { name: 'Infinity flattens everything', code: `eq(flattenDepth([1, [2, [3, [4]]]], Infinity), [1, 2, 3, 4]);` },
      ],
      hint: 'Start with `if (depth === 0) return [...arr];`. Then the Part 1 loop, but the recursive call is `flattenDepth(item, depth - 1)`.',
      solution: `function flattenDepth(arr, depth) {
  if (depth === 0) return [...arr];             // base case: no more levels to remove
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenDepth(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}
`,
      explain: '`Infinity - 1` is still `Infinity`, so depth `Infinity` never reaches the base case and flattens everything. That\'s how `arr.flat(Infinity)` behaves too.',
    },
    {
      type: 'read',
      title: 'Part 3: deep clone',
      md: `
> "Write \`deepClone(value)\`. Changing anything in the copy, at any depth, must not change the original."

In JavaScript lesson 12, \`{ ...post }\` copied the post, but \`tags\` was still the same array in both. A deep clone copies every level.

Three cases, and two of them are recursive:

| \`value\` is | return |
|---|---|
| an array | a new array: \`deepClone\` each item |
| a plain object | a new object: \`deepClone\` each value, same keys |
| anything else (number, string, boolean, null, undefined) | \`value\` itself: those can't be changed in place |

Two checks you'll need:

~~~js
console.log(Array.isArray([1]), Array.isArray({}));
console.log(typeof {}, typeof [], typeof null);   // careful: arrays and null are "object" too
~~~

So check \`Array.isArray\` **first**, then \`typeof value === "object" && value !== null\`.
`,
    },
    {
      type: 'task',
      title: 'Part 3: deepClone',
      md: `
Write \`deepClone(value)\` for numbers, strings, booleans, \`null\`, arrays and plain objects, nested any way.

~~~
const post = { title: "Hi", tags: ["a"], meta: { likes: 1 } };
const copy = deepClone(post);
copy.tags.push("b");
copy.meta.likes = 99;
post   → still { title: "Hi", tags: ["a"], meta: { likes: 1 } }
~~~

Arrays: \`value.map(deepClone)\`. Objects: a loop over \`Object.keys(value)\`, setting \`copy[key] = deepClone(value[key])\`.
`,
      starter: `function deepClone(value) {
  // your code here
}
`,
      tests: [
        { name: 'the copy looks the same', code: `const post = { title: "Hi", tags: ["a"], meta: { likes: 1 } }; eq(deepClone(post), post);` },
        {
          name: 'changing a nested array in the copy leaves the original alone',
          code: `const post = { title: "Hi", tags: ["a"] }; const copy = deepClone(post); copy.tags.push("b");
eq(post.tags, ["a"], "tags is still shared: clone arrays too");`,
        },
        {
          name: 'changing a nested object in the copy leaves the original alone',
          code: `const post = { meta: { likes: 1, by: { name: "Ada" } } }; const copy = deepClone(post); copy.meta.by.name = "Linus";
eq(post.meta.by.name, "Ada");`,
        },
        { name: 'arrays of objects are copied all the way down', code: `const list = [{ n: 1 }]; const copy = deepClone(list); copy[0].n = 2; eq(list[0].n, 1); assert(Array.isArray(copy), "an array should stay an array");` },
        { name: 'primitives and null come back as they are', code: `eq(deepClone(5), 5); eq(deepClone("x"), "x"); eq(deepClone(null), null);` },
      ],
      hint: '`if (Array.isArray(value)) return value.map(deepClone);` Then `if (typeof value === "object" && value !== null) { const copy = {}; for (const key of Object.keys(value)) copy[key] = deepClone(value[key]); return copy; }`. Otherwise `return value;`.',
      solution: `function deepClone(value) {
  if (Array.isArray(value)) {
    return value.map(deepClone);                // a new array, each item cloned
  }
  if (typeof value === "object" && value !== null) {
    const copy = {};
    for (const key of Object.keys(value)) {
      copy[key] = deepClone(value[key]);        // a new object, each value cloned
    }
    return copy;
  }
  return value;                                 // base case: primitives and null
}
`,
      explain: 'In real code you\'d write `structuredClone(post)`, built into browsers and Node. Interviewers ask for the hand-written version to see recursion and the `typeof null` trap.',
    },
    {
      type: 'read',
      title: 'Walkthrough: the full solution',
      md: `
Trace \`flatten([1, [2, [3]]])\`. Each indent is one call deeper:

| call | sees | returns |
|---|---|---|
| flatten([1, [2, [3]]]) | 1 → push; [2, [3]] → recurse | |
| · flatten([2, [3]]) | 2 → push; [3] → recurse | |
| · · flatten([3]) | 3 → push | \`[3]\` |
| · flatten([2, [3]]) | spreads \`[3]\` in | \`[2, 3]\` |
| flatten([1, [2, [3]]]) | spreads \`[2, 3]\` in | \`[1, 2, 3]\` |

**Big-O**, with n values in total and d the deepest nesting:

| | time | extra memory |
|---|---|---|
| flatten | O(n) to visit everything; the spreads copy values back up, so worst case about O(n·d) | O(d) for the call stack, plus the result |
| deepClone | O(n) | O(n) for the copy, O(d) for the call stack |

If O(n·d) comes up, mention the fix: pass one shared \`result\` array down into a helper and push into it directly, so nothing is copied twice.

**Say it:** "The inner pieces have the same shape as the whole, so I recurse. Plain values are the base case; arrays recurse. The call stack is d deep, so extremely deep input could overflow it, and then I'd switch to a loop with my own stack."
`,
    },
    {
      type: 'check',
      title: 'Follow-up questions',
      items: [
        {
          q: 'What happens if you call your `deepClone` on an object that contains itself (`a.self = a`)?',
          choices: [
            'It recurses forever and throws "Maximum call stack size exceeded"',
            'It returns a perfect copy',
            'It returns undefined',
          ],
          answer: 0,
          explain: 'The fix is a `Map` from original to copy: before cloning an object, check whether you\'ve already cloned it, and reuse that copy. `structuredClone` does this for you.',
          why: {
            1: 'Nothing stops the recursion on a cycle.',
            2: 'It never returns at all.',
          },
        },
        {
          q: 'Your `deepClone` gets a `Date`. What comes back?',
          choices: [
            'A plain empty object `{}`, because a Date has no own keys',
            'A copy of the Date',
            'The same Date object',
          ],
          answer: 0,
          explain: '`typeof date` is "object" and `Object.keys(date)` is empty. Handle it with `if (value instanceof Date) return new Date(value)`.',
          why: {
            1: 'Nothing in the code knows how to build a Date.',
            2: 'It goes through the object branch, so a new `{}` is returned.',
          },
        },
        {
          q: '"Flatten without recursion." What replaces the call stack?',
          choices: [
            'Your own stack: an array you push inner arrays onto and pop from in a loop',
            'A Set',
            'Sorting the array first',
          ],
          answer: 0,
          explain: 'Recursion uses the call stack behind the scenes. Making the stack explicit avoids the depth limit, at the cost of a little bookkeeping to keep the order.',
          why: {
            1: 'A Set removes duplicates; it doesn\'t track what\'s left to visit.',
            2: 'Sorting would scramble the order you need to keep.',
          },
        },
        {
          q: 'Why check `Array.isArray(value)` before `typeof value === "object"`?',
          choices: [
            'Arrays are objects too, so the object branch would turn them into `{ 0: ..., 1: ... }`',
            'It\'s faster',
            '`typeof` throws on arrays',
          ],
          answer: 0,
          explain: '`typeof []` is "object". The more specific check has to come first.',
          why: {
            1: 'Speed isn\'t the reason; correctness is.',
            2: '`typeof` never throws. It just says "object".',
          },
        },
      ],
    },
  ],
};
