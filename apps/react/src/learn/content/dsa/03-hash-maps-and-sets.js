// DSA course · lesson 3. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'hash-maps-and-sets',
  builds: ['dsa/big-o', 'dsa/arrays-two-pointers', 'js/objects', 'js/reduce-and-sort', 'js/errors-and-maps-sets'],
  title: 'Hash maps and sets',
  goal: 'Use Map and Set with confidence: store and look up by key, count things, remember what you have seen, and turn O(n²) searches into O(n).',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'The problem: "have I seen this before?"',
      md: `
In lesson 1 your \`hasDuplicate\` compared every pair: O(n²). Look at what the inner loop is really asking: **"have I seen this value already?"** It answers by scanning the array again, every time.

What you want is a place to **write things down** as you go, where checking is instant. That's a **hash map** (and its simpler cousin, a **set**).

You already know one. In JavaScript lesson 7 you used plain objects, and in lesson 11 you counted words with one:

~~~js
const counts = {};
for (const w of ["a", "b", "a"]) {
  counts[w] = (counts[w] || 0) + 1;
}
console.log(counts);      // { a: 2, b: 1 }
console.log(counts["a"]); // jump straight to the "a" box
~~~

\`counts["a"]\` doesn't search through the keys one by one. JavaScript turns the key into a location (that's the "hash" part) and jumps there. So reading, writing and checking a key are **O(1) on average**.

This lesson does the same thing with \`Map\` and \`Set\`, which are built for exactly this job. Go slowly; every later lesson leans on it.
`,
    },
    {
      type: 'read',
      title: 'Map: five things to learn',
      md: `
A \`Map\` is a box of **key → value** pairs. You talk to it with methods instead of brackets:

~~~js
const ages = new Map();      // 1. make an empty one

ages.set("Ada", 36);         // 2. set(key, value): add or overwrite
ages.set("Linus", 17);

console.log(ages.get("Ada"));   // 3. get(key): read a value
console.log(ages.has("Linus")); // 4. has(key): is the key there? true/false
console.log(ages.size);         // how many pairs (a property, no ())

ages.delete("Linus");           // 5. delete(key): remove a pair
console.log(ages);
~~~

| You want to... | Object | Map |
|---|---|---|
| make one | \`{}\` | \`new Map()\` |
| write | \`obj[key] = v\` | \`map.set(key, v)\` |
| read | \`obj[key]\` | \`map.get(key)\` |
| check | \`key in obj\` | \`map.has(key)\` |
| remove | \`delete obj[key]\` | \`map.delete(key)\` |
| count | \`Object.keys(obj).length\` | \`map.size\` |

Run it, then **Edit**: set \`"Ada"\` to \`37\` a second time and see that \`set\` overwrites instead of adding a second "Ada".

You can also start a Map with pairs already in it: \`new Map([["Ada", 36], ["Linus", 17]])\`. Each inner array is one \`[key, value]\` pair.
`,
    },
    {
      type: 'predict',
      title: 'Reading a key that isn\'t there',
      md: 'Three lines. One of them asks for a key that was never set.',
      code: `const ages = new Map([["Ada", 36]]);

console.log(ages.get("Ada"));
console.log(ages.get("Bob"));
console.log(ages.has("Bob"));`,
      output: `36
undefined
false`,
      explain: `
- \`get\` on a missing key gives \`undefined\`, not an error.
- \`has\` gives a clean \`true\`/\`false\`.

So when a value could legitimately be \`0\`, \`""\` or \`false\`, check with \`has\`, not with \`if (map.get(key))\`. That trap is the same one as \`||\` vs \`??\` in JavaScript lesson 7.
`,
    },
    {
      type: 'task',
      title: 'makeAges',
      md: `
Just the syntax, nothing else. Write \`makeAges()\` that creates a new Map, sets \`"Ada"\` to \`36\` and \`"Linus"\` to \`17\`, and returns the Map.

~~~
const m = makeAges();
m.get("Ada")   → 36
m.size         → 2
~~~
`,
      starter: `function makeAges() {
  const ages = new Map();
  // set two pairs here

  return ages;
}
`,
      tests: [
        { name: 'it returns a Map', code: `assert(makeAges() instanceof Map, "return the Map, not an object");` },
        { name: 'Ada is 36', code: `eq(makeAges().get("Ada"), 36);` },
        { name: 'Linus is 17', code: `eq(makeAges().get("Linus"), 17);` },
        { name: 'it has exactly 2 pairs', code: `eq(makeAges().size, 2);` },
      ],
      hint: 'Two lines: `ages.set("Ada", 36);` and the same for Linus.',
      solution: `function makeAges() {
  const ages = new Map();
  ages.set("Ada", 36);
  ages.set("Linus", 17);
  return ages;
}
`,
    },
    {
      type: 'read',
      title: 'Object or Map?',
      md: `
Both work as hash maps. The differences that matter in practice:

~~~js
const obj = {};
obj[1] = "number one";
obj["1"] = "string one";      // same key! object keys become strings
console.log(Object.keys(obj)); // [ "1" ]

const map = new Map();
map.set(1, "number one");
map.set("1", "string one");   // different keys in a Map
console.log(map.size);         // 2
~~~

| | Object | Map |
|---|---|---|
| key types | strings (numbers get turned into strings) | **anything**: numbers, objects, arrays |
| size | \`Object.keys(obj).length\` (O(n)) | \`map.size\` (O(1)) |
| order | mostly insertion, but number-like keys go first | always insertion order |
| looping | \`Object.entries(obj)\` | \`for (const [k, v] of map)\` directly |
| built-in keys | inherits things like \`toString\` | starts truly empty |
| JSON | \`JSON.stringify\` works | needs converting first |

**Rule of thumb:**

- **Data with fixed, known fields** (a user with \`name\` and \`age\`): object.
- **A lookup table you add to and check in a loop** (counts, seen values, index of each number): \`Map\`.

In interviews either is accepted, but \`Map\` avoids the number-key and \`toString\` surprises, so this track uses it.
`,
    },
    {
      type: 'read',
      title: 'Counting with a Map',
      md: `
Counting is the most common hash-map move. It's the \`countWords\` from JavaScript lesson 11, with a Map as the box:

~~~js
const words = ["a", "b", "a"];
const counts = new Map();

for (const w of words) {
  counts.set(w, (counts.get(w) ?? 0) + 1);
}

console.log(counts);
~~~

Read the middle line from the inside out:

1. \`counts.get(w)\`: the count so far, or \`undefined\` the first time.
2. \`?? 0\`: if it's \`undefined\`, use \`0\` instead (\`??\` only replaces \`null\`/\`undefined\`).
3. \`+ 1\`: one more.
4. \`counts.set(w, ...)\`: write the new count back.

| Step | \`w\` | \`counts.get(w)\` | \`counts\` after |
|---|---|---|---|
| start | | | \`Map(0) {}\` |
| 1 | \`"a"\` | \`undefined\` → 0 | \`"a" => 1\` |
| 2 | \`"b"\` | \`undefined\` → 0 | \`"a" => 1, "b" => 1\` |
| 3 | \`"a"\` | \`1\` | \`"a" => 2, "b" => 1\` |

One loop, O(1) work per item: **O(n) time, O(k) space**, where k is the number of different values.

The common mistake is \`counts.set(w, counts.get(w) + 1)\` without the \`?? 0\`. The first time, that's \`undefined + 1\`, which is \`NaN\`.
`,
    },
    {
      type: 'task',
      title: 'countLetters',
      md: `
**Example** (already solved): counting numbers.

~~~
function countNums(nums) {
  const counts = new Map();
  for (const n of nums) {
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  return counts;
}
~~~

**Your turn:** \`countLetters(str)\` returns a Map from each letter to how many times it appears. A \`for...of\` loop over a string gives you one character at a time.

~~~
countLetters("abca")  → Map(3) { "a" => 2, "b" => 1, "c" => 1 }
~~~
`,
      starter: `function countLetters(str) {
  // your code here
}
`,
      tests: [
        { name: '"abca" counts a twice', code: `eq(countLetters("abca").get("a"), 2);` },
        { name: '"abca" gives a => 2, b => 1, c => 1', code: `eq(countLetters("abca"), new Map([["a", 2], ["b", 1], ["c", 1]]));` },
        { name: 'an empty string gives an empty Map', code: `eq(countLetters(""), new Map());` },
      ],
      hint: 'Copy `countNums`, rename `nums` to `str` and `n` to `ch`. The loop is `for (const ch of str)`.',
      solution: `function countLetters(str) {
  const counts = new Map();
  for (const ch of str) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  return counts;
}
`,
    },
    {
      type: 'read',
      title: 'Looping over a Map',
      md: `
A Map loops in the order you inserted the keys. Each item you get is a \`[key, value]\` pair, and destructuring (JavaScript lesson 12) unpacks it:

~~~js
const counts = new Map([["a", 2], ["b", 1], ["c", 3]]);

for (const [letter, count] of counts) {
  console.log(letter, count);
}

console.log([...counts.keys()]);   // just the keys, as an array
console.log([...counts.values()]); // just the values
console.log([...counts]);          // all the pairs
~~~

To find the **biggest** count, use the "keep the best so far" loop from JavaScript lesson 6:

~~~js
const counts = new Map([["a", 2], ["b", 1], ["c", 3]]);
let best = null;
let bestCount = 0;
for (const [key, count] of counts) {
  if (count > bestCount) {
    best = key;
    bestCount = count;
  }
}
console.log(best, bestCount);
~~~
`,
    },
    {
      type: 'task',
      title: 'mostCommon',
      md: `
Combine the last two steps. \`mostCommon(arr)\` returns the value that appears most often. If there's a tie, return the one that appeared first. For an empty array, return \`null\`.

~~~
mostCommon(["b", "a", "b", "c"])  → "b"
mostCommon([1, 2, 2, 3, 3])       → 2   (tie, 2 was seen first)
~~~

Two loops, one after the other: first **count** into a Map, then **keep the best** while looping over the Map. Two O(n) loops is still O(n).
`,
      starter: `function mostCommon(arr) {
  const counts = new Map();
  // 1. count every item into counts

  // 2. loop over counts and keep the key with the biggest count
  let best = null;
  let bestCount = 0;

  return best;
}
`,
      tests: [
        { name: 'mostCommon(["b", "a", "b", "c"]) is "b"', code: `eq(mostCommon(["b", "a", "b", "c"]), "b");` },
        { name: 'a tie returns the value seen first', code: `eq(mostCommon([1, 2, 2, 3, 3]), 2);` },
        { name: 'an empty array gives null', code: `eq(mostCommon([]), null);` },
      ],
      hint: 'Part 1 is the `countLetters` loop. Part 2 is `for (const [key, count] of counts)` with `if (count > bestCount)`. Using `>` (not `>=`) keeps the first one on a tie.',
      solution: `function mostCommon(arr) {
  const counts = new Map();
  for (const x of arr) {
    counts.set(x, (counts.get(x) ?? 0) + 1);
  }

  let best = null;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}
`,
      explain: 'Ties go to the first one because a Map loops in insertion order, and `>` only replaces the best when a count is strictly bigger.',
    },
    {
      type: 'read',
      title: 'Set: a Map with only keys',
      md: `
Sometimes you don't need a value at all, just **"is it in there?"**. That's a \`Set\`: a collection where each value appears **at most once**.

~~~js
const seen = new Set();
seen.add("a");
seen.add("b");
seen.add("a");              // already there: nothing happens

console.log(seen.has("a")); // true, O(1)
console.log(seen.has("z")); // false
console.log(seen.size);     // 2
seen.delete("b");
console.log(seen);
~~~

The methods mirror Map: \`add\` instead of \`set\`, no \`get\` (there's no value to get).

**Dedupe in one line.** \`new Set(array)\` drops duplicates; spreading it back gives an array, in first-seen order:

~~~js
console.log([...new Set([3, 1, 3, 2, 1])]);
~~~

Compare with \`arr.includes(x)\`: same question, but \`includes\` scans the array (O(n)) and \`set.has(x)\` jumps straight there (O(1)). Swapping one for the other inside a loop is how O(n²) becomes O(n).
`,
    },
    {
      type: 'task',
      title: 'unique',
      md: `
\`unique(arr)\` returns a **new array** with duplicates removed, keeping the first-seen order.

~~~
unique([3, 1, 3, 2, 1])  → [3, 1, 2]
~~~

One line, from the previous step.
`,
      starter: `function unique(arr) {
  // your code here
}
`,
      tests: [
        { name: 'unique([3, 1, 3, 2, 1]) is [3, 1, 2]', code: `eq(unique([3, 1, 3, 2, 1]), [3, 1, 2]);` },
        { name: 'it returns an array, not a Set', code: `assert(Array.isArray(unique([1, 1])), "spread the Set back into [...]");` },
        { name: 'an empty array gives []', code: `eq(unique([]), []);` },
      ],
      hint: '`return [...new Set(arr)];`',
      solution: `function unique(arr) {
  return [...new Set(arr)];
}
`,
    },
    {
      type: 'task',
      title: 'hasDuplicate in O(n)',
      md: `
Back to lesson 1's problem, now with a Set. Walk through the array once, keeping a Set called \`seen\`:

- if \`seen\` already has the value, you've found a duplicate: return \`true\`;
- otherwise add it and keep going.

~~~
hasDuplicate([3, 1, 4, 1])  → true
hasDuplicate([1, 2, 3])     → false
~~~
`,
      starter: `function hasDuplicate(arr) {
  const seen = new Set();
  // your loop here

  return false;
}
`,
      tests: [
        { name: 'hasDuplicate([3, 1, 4, 1]) is true', code: `eq(hasDuplicate([3, 1, 4, 1]), true);` },
        { name: 'hasDuplicate([1, 2, 3]) is false', code: `eq(hasDuplicate([1, 2, 3]), false);` },
        { name: 'a large array with no duplicates is fast and false', code: `const big = Array.from({ length: 200000 }, (_, i) => i); eq(hasDuplicate(big), false);` },
      ],
      hint: '`for (const x of arr) { if (seen.has(x)) return true; seen.add(x); }`. Check **before** you add, or every value will look like a duplicate of itself.',
      solution: `function hasDuplicate(arr) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}
`,
      explain: 'O(n) time, O(n) extra space. The brute force was O(n²) time and O(1) space. You traded memory for speed, which is the trade to say out loud in an interview. (The one-liner `new Set(arr).size !== arr.length` is also O(n), but can\'t stop early.)',
    },
    {
      type: 'read',
      title: 'Two-sum: the hash map classic',
      md: `
**Given an array (not sorted) and a target, return the indexes of two numbers that add up to the target.** It's the most-asked interview question there is.

**Brute force:** every pair. O(n²) time, O(1) space.

~~~js
function twoSumBrute(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return null;
}
console.log(twoSumBrute([2, 7, 11, 15], 9));
~~~

**The better question.** When you stand on a number \`x\`, you don't need to search for "any pair". You know exactly which number you need: \`target - x\`. So the question becomes **"have I seen \`target - x\` before, and at which index?"** That's a Map from **value → index**.

| \`i\` | \`x\` | need \`9 - x\` | in \`seen\`? | \`seen\` after |
|---|---|---|---|---|
| 0 | 2 | 7 | no | \`2 => 0\` |
| 1 | 7 | 2 | **yes, at index 0** | return \`[0, 1]\` |

Check **before** you add the current number, so a number never pairs with itself. One pass: **O(n) time, O(n) space.**

Compare with lesson 2: two pointers needs a **sorted** array. The Map version works on any order.
`,
    },
    {
      type: 'task',
      title: 'twoSum',
      md: `
Write \`twoSum(nums, target)\`. Return \`[earlierIndex, currentIndex]\`, or \`null\` if no pair works.

~~~
twoSum([2, 7, 11, 15], 9)  → [0, 1]
twoSum([3, 2, 4], 6)       → [1, 2]
~~~

The loop needs the index, so use \`for (let i = 0; i < nums.length; i++)\`. Inside:

1. \`const need = target - nums[i];\`
2. if \`seen\` has \`need\`, return \`[seen.get(need), i]\`
3. otherwise \`seen.set(nums[i], i)\`
`,
      starter: `function twoSum(nums, target) {
  const seen = new Map(); // value → index
  // your loop here

  return null;
}
`,
      tests: [
        { name: 'twoSum([2, 7, 11, 15], 9) is [0, 1]', code: `eq(twoSum([2, 7, 11, 15], 9), [0, 1]);` },
        { name: 'twoSum([3, 2, 4], 6) is [1, 2], not [0, 0]', code: `eq(twoSum([3, 2, 4], 6), [1, 2]);` },
        { name: 'the same value twice works', code: `eq(twoSum([3, 3], 6), [0, 1]);` },
        { name: 'no pair gives null', code: `eq(twoSum([1, 2], 10), null);` },
      ],
      hint: 'If you get `[0, 0]` for `[3, 2, 4]`, you added `nums[i]` to `seen` before checking. Check first, then set.',
      solution: `function twoSum(nums, target) {
  const seen = new Map(); // value → index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return null;
}
`,
      explain: 'Why `seen.has(need)` and not `if (seen.get(need))`? Because the index can be `0`, which is falsy. `[2, 7]` with target 9 would fail.',
    },
    {
      type: 'read',
      title: 'Grouping: a Map of arrays',
      md: `
Counting stores a **number** per key. Grouping stores a **list** per key. The only new line is "make the list the first time you see this key":

~~~js
const words = ["hi", "cat", "yo", "dog", "a"];
const byLength = new Map();

for (const w of words) {
  const key = w.length;
  if (!byLength.has(key)) byLength.set(key, []); // first time: start an empty list
  byLength.get(key).push(w);                     // add to that key's list
}

console.log(byLength);
~~~

\`byLength.get(key)\` hands you the **same array** that's stored in the Map (references, JavaScript lesson 7), so \`push\` changes the stored list directly. No \`set\` needed afterwards.

This is \`reduce\` into an object from JavaScript lesson 11 again, with a Map and arrays. Modern JavaScript also has a built-in for it, \`Map.groupBy(words, (w) => w.length)\`, and the object version \`Object.groupBy\`. In an interview, write the loop first: it shows you understand it, and you can mention the built-in after.
`,
    },
    {
      type: 'task',
      title: 'groupByFirstLetter',
      md: `
\`groupByFirstLetter(words)\` returns a Map from each first letter to the list of words starting with it, in the order they appeared.

~~~
groupByFirstLetter(["apple", "bob", "avocado"])
  → Map(2) { "a" => ["apple", "avocado"], "b" => ["bob"] }
~~~

Copy the loop from the previous step. The key is \`w[0]\` instead of \`w.length\`.
`,
      starter: `function groupByFirstLetter(words) {
  const groups = new Map();
  // your loop here

  return groups;
}
`,
      tests: [
        { name: 'groups words under their first letter', code: `eq(groupByFirstLetter(["apple", "bob", "avocado"]), new Map([["a", ["apple", "avocado"]], ["b", ["bob"]]]));` },
        { name: 'a letter with one word still gets a list', code: `eq(groupByFirstLetter(["zoo"]).get("z"), ["zoo"]);` },
        { name: 'no words gives an empty Map', code: `eq(groupByFirstLetter([]).size, 0);` },
      ],
      hint: 'Inside `for (const w of words)`: `const key = w[0];`, then `if (!groups.has(key)) groups.set(key, []);`, then `groups.get(key).push(w);`.',
      solution: `function groupByFirstLetter(words) {
  const groups = new Map();
  for (const w of words) {
    const key = w[0];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(w);
  }
  return groups;
}
`,
      explain: 'The classic interview version is "group anagrams": the key is the word with its letters sorted, `[...w].sort().join("")`, so "eat" and "tea" both get the key "aet". Same loop, different key.',
    },
    {
      type: 'read',
      title: 'How to spot a hash map in an interview question',
      md: `
A hash map or set is the answer far more often than any other structure. Listen for:

- **"seen before"**, "duplicate", "unique", "first repeated" → \`Set\`.
- **"how many times"**, "frequency", "most common", "anagram" → \`Map\` of counts.
- **"two numbers that add up to"** on an unsorted array, or "find the pair" → \`Map\` of value → index.
- **"group by"**, "bucket", "categorize" → \`Map\` of key → array.
- Your brute force has **\`includes\`, \`indexOf\` or \`find\` inside a loop** → replace the scan with a lookup.

How to say it: "The brute force rescans the array for every item, O(n²). If I store what I've seen in a hash map, each lookup is O(1) on average, so it's O(n) time with O(n) extra space."

Why "on average"? Rarely, many keys land in the same spot and lookups slow down. Engines handle this well, so O(1) is what everyone uses, but saying "average" shows you know.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: "What does this print?\n\n~~~\nconst m = new Map();\nm.set(\"a\", 1);\nm.set(\"a\", 5);\nconsole.log(m.size, m.get(\"a\"));\n~~~",
          choices: ["`1 5`", "`2 5`", "`2 1`"],
          answer: 0,
          explain: "`set` on an existing key overwrites the value. Keys in a Map are unique.",
          why: { 1: "A Map can't hold the same key twice; the second `set` replaces the value.", 2: "There's still only one key, and its value is now 5." },
        },
        {
          q: "What's wrong with `counts.set(w, counts.get(w) + 1)` for counting?",
          choices: ["The first time, `get` returns `undefined`, and `undefined + 1` is `NaN`", "`set` can't take an expression", "Maps can't hold numbers"],
          answer: 0,
          explain: "Use `(counts.get(w) ?? 0) + 1` so a missing key starts from 0.",
          why: { 1: "Any expression works as the value.", 2: "Values can be anything." },
        },
        {
          q: "In two-sum, why check `seen.has(need)` **before** `seen.set(nums[i], i)`?",
          choices: ["So a number can't pair with itself", "Because `set` deletes the old keys", "It doesn't matter, either order works"],
          answer: 0,
          explain: "With target 6 and `nums[i] = 3`, adding first would find the 3 you just added and return `[i, i]`.",
          why: { 1: "`set` only adds or overwrites one key.", 2: "Try `[3, 2, 4]`, target 6: adding first returns `[0, 0]`." },
        },
        {
          q: "Which is the right tool for \"is this value in the collection?\" inside a loop?",
          choices: ["`set.has(x)`, O(1) on average", "`arr.includes(x)`, O(1)", "`arr.indexOf(x)`, O(log n)"],
          answer: 0,
          explain: "A Set jumps to the value; an array has to scan.",
          why: { 1: "`includes` scans the array: O(n).", 2: "`indexOf` scans too: O(n). O(log n) needs a sorted array and binary search." },
        },
        {
          q: "When would you choose a plain object over a Map?",
          choices: ["For a record with known fields, like `{ name, age }`", "When the keys are numbers you need to keep as numbers", "When you need `.size` often"],
          answer: 0,
          explain: "Objects are for shaped data; Maps are for lookup tables you add to and check.",
          why: { 1: "Object keys become strings, so `1` and `\"1\"` collide. Map keeps them apart.", 2: "`map.size` is built in; an object needs `Object.keys(obj).length`." },
        },
      ],
    },
  ],
};
