// Challenges · lesson 1. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'group-and-count',
  builds: ['js/reduce-and-sort', 'js/objects', 'js/strings'],
  title: 'Group and count: the tally sheet',
  goal: 'Turn "how many of each" and "group these by" questions into one pass over the data, then rank the results.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The question',
      md: `
This is the warm-up an interviewer often opens with. Here's how they'd say it:

> "Here's a line of text from a review. Tell me how many times each word appears. Treat \`The\` and \`the\` as the same word."

~~~
countWords("the cat and the hat")
→ { the: 2, cat: 1, and: 1, hat: 1 }
~~~

Then, once you've got it working, they add a requirement:

> "Now group a list of orders by customer." Then: "Now give me the **k** most common words."

You've met the core of this already. In JavaScript lesson 11 you counted words with \`reduce\` and an object as the accumulator. This lesson takes that one idea, the **tally sheet**, and stretches it three ways: counting, grouping, and ranking.
`,
    },
    {
      type: 'check',
      title: 'Before you code: ask and spot',
      md: 'In a real interview, spend a minute here. Pick the best answer for each.',
      items: [
        {
          q: 'Which question is most worth asking before you start counting words?',
          choices: [
            'Should "The" and "the" count as the same word?',
            'Should I use a `for` loop or `reduce`?',
            'Do you want the answer in camelCase?',
          ],
          answer: 0,
          explain: 'It changes the output. Questions about the input and the expected result are the ones interviewers want to hear.',
          why: {
            1: 'That is your decision, not theirs. Ask about the problem, not your tools.',
            2: 'The output shape is already given in the example.',
          },
        },
        {
          q: 'Which phrases in a question point to a tally sheet (an object or Map of counts)?',
          choices: [
            '"how many times", "most common", "duplicates"',
            '"sorted array", "from both ends"',
            '"nested inside nested", "any depth"',
          ],
          answer: 0,
          explain: 'Counting and "have I seen this" questions both want a lookup table you fill in one pass.',
          why: {
            1: 'Those hint at two pointers (lesson 2 has one).',
            2: 'Those hint at recursion (lesson 8).',
          },
        },
        {
          q: 'What should `countWords("")` return?',
          choices: ['`{}`', '`null`', '`0`'],
          answer: 0,
          explain: 'No words means an empty tally. Same shape as usual, just nothing in it. Still, say it out loud: "For empty input I\'ll return an empty object, is that OK?"',
          why: {
            1: 'Returning a different type for one input makes every caller add a special case.',
            2: 'The result is an object of counts, not one number.',
          },
        },
      ],
    },
    {
      type: 'read',
      title: 'The plan, and the slow way first',
      md: `
**Brute force** (say it, then improve it): for every distinct word, walk the whole list and count matches. That's a loop inside a loop, so **O(n²)**.

**Better:** walk the list **once**, and keep a tally sheet. For each word, add 1 to its box:

~~~js
function countLetters(word) {
  const counts = {};
  for (const ch of word) {
    counts[ch] = (counts[ch] || 0) + 1;  // missing box? start from 0
  }
  return counts;
}

console.log(countLetters("banana"));
~~~

One pass, and each update is instant, so it's **O(n)**.

The plan for the interview version:

1. Lowercase the text.
2. Split it into words on spaces.
3. Skip empty strings (two spaces in a row make one).
4. Tally each word exactly like \`countLetters\`.
`,
    },
    {
      type: 'predict',
      title: 'Why the (counts[ch] || 0) part?',
      md: 'Someone writes the shorter version. What does it print?',
      code: `const counts = {};
for (const w of ["a", "b", "a"]) {
  counts[w]++;
}
console.log(counts);`,
      output: `{ a: NaN, b: NaN }`,
      explain: `
The first time you see \`"a"\`, \`counts.a\` is \`undefined\`. And \`undefined + 1\` is \`NaN\` ("not a number"). After that, \`NaN + 1\` is still \`NaN\`.

\`(counts[w] || 0) + 1\` says "use 0 when the box is empty". You'll also see \`(counts[w] ?? 0) + 1\`, which does the same here.
`,
    },
    {
      type: 'task',
      title: 'Part 1: countWords',
      md: `
Write \`countWords(text)\`. It returns an object with how many times each word appears.

- Lowercase everything, so \`The\` and \`the\` are one word.
- Split on spaces: \`text.split(" ")\`.
- Skip empty strings, which appear when there are two spaces in a row.

~~~
countWords("the cat and the hat")  → { the: 2, cat: 1, and: 1, hat: 1 }
countWords("Go go  GO")            → { go: 3 }
~~~
`,
      starter: `function countWords(text) {
  // your code here
}
`,
      tests: [
        { name: 'counts "the cat and the hat"', code: `eq(countWords("the cat and the hat"), { the: 2, cat: 1, and: 1, hat: 1 });` },
        { name: 'upper and lower case count as the same word', code: `eq(countWords("Go go GO"), { go: 3 });` },
        { name: 'double spaces do not create an empty word', code: `eq(countWords("a  b"), { a: 1, b: 1 }, "skip empty strings");` },
        { name: 'an empty string gives {}', code: `eq(countWords(""), {});` },
      ],
      hint: `
Start with \`const counts = {};\`. Loop \`for (const word of text.toLowerCase().split(" "))\`. Inside, \`if (word === "") continue;\`, then the same line as \`countLetters\`.
`,
      solution: `function countWords(text) {
  const counts = {};
  for (const word of text.toLowerCase().split(" ")) {
    if (word === "") continue;                 // two spaces in a row
    counts[word] = (counts[word] || 0) + 1;    // missing box? start from 0
  }
  return counts;
}
`,
      explain: 'Notice `"".split(" ")` gives `[""]`, one empty string. The `continue` handles that case too, so empty text gives `{}` without a special `if`.',
    },
    {
      type: 'read',
      title: 'Grouping is counting with arrays',
      md: `
Part 2 changes one thing. Instead of a **number** in each box, you keep an **array** of the items that belong there.

| | box starts as | each item does |
|---|---|---|
| counting | \`0\` | \`box + 1\` |
| grouping | \`[]\` | \`box.push(item)\` |

Here's grouping words by their first letter:

~~~js
function byFirstLetter(words) {
  const groups = {};
  for (const w of words) {
    const key = w[0];
    if (!groups[key]) groups[key] = [];   // first time: make the empty box
    groups[key].push(w);
  }
  return groups;
}

console.log(byFirstLetter(["ant", "bee", "ape"]));
~~~

The interviewer's version passes in **how to pick the key** as a function, so the same code groups orders by customer, users by city, or words by length. That's a callback, exactly like the ones you passed to \`map\` and \`filter\`.
`,
    },
    {
      type: 'task',
      title: 'Part 2: groupBy',
      md: `
Write \`groupBy(items, keyFn)\`. It returns an object where each key is \`keyFn(item)\`, and each value is the array of items with that key, in their original order.

~~~
groupBy(["hi", "hey", "yo"], (w) => w.length)
→ { 2: ["hi", "yo"], 3: ["hey"] }

groupBy(orders, (o) => o.customer)
→ { ada: [order1, order3], linus: [order2] }
~~~

It's \`byFirstLetter\` with \`w[0]\` replaced by \`keyFn(item)\`.
`,
      starter: `function groupBy(items, keyFn) {
  // your code here
}
`,
      tests: [
        { name: 'groups words by length', code: `eq(groupBy(["hi", "hey", "yo"], (w) => w.length), { 2: ["hi", "yo"], 3: ["hey"] });` },
        {
          name: 'groups orders by customer, keeping order',
          code: `const orders = [{ id: 1, customer: "ada" }, { id: 2, customer: "linus" }, { id: 3, customer: "ada" }];
eq(groupBy(orders, (o) => o.customer), { ada: [orders[0], orders[2]], linus: [orders[1]] });`,
        },
        { name: 'an empty list gives {}', code: `eq(groupBy([], (x) => x), {});` },
      ],
      hint: 'Inside the loop: `const key = keyFn(item);`, then "if there is no box yet, make an empty array", then push the item.',
      solution: `function groupBy(items, keyFn) {
  const groups = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}
`,
      explain: 'Modern JavaScript ships this as `Object.groupBy(items, keyFn)`. Interviewers still ask you to write it, because it shows you can build the tally pattern by hand.',
    },
    {
      type: 'read',
      title: 'Part 3: ranking the tally',
      md: `
> "Now return the **k** most common words, most common first. Break ties alphabetically."

You already have the counts. To rank them, turn the object into a list you can sort. \`Object.entries\` (JavaScript lesson 7) gives \`[key, value]\` pairs:

~~~js
const counts = { the: 2, cat: 1, and: 1 };
const pairs = Object.entries(counts);
console.log(pairs);

pairs.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
console.log(pairs);
console.log(pairs.slice(0, 2).map((p) => p[0]));
~~~

Read the comparator in two halves:

- \`b[1] - a[1]\` sorts by count, biggest first (lesson 11's comparator, flipped).
- When the counts are equal, that's \`0\`, which is falsy, so \`||\` moves on to \`a[0].localeCompare(b[0])\`, which sorts by word, A to Z.

Then \`slice(0, k)\` keeps the top k, and \`map\` keeps just the words.
`,
    },
    {
      type: 'task',
      title: 'Part 3: topWords',
      md: `
Your \`countWords\` from Part 1 is already in the editor. Below it, write \`topWords(text, k)\`: the \`k\` most common words, most common first, ties in alphabetical order.

~~~
topWords("b a b c a b", 2)   → ["b", "a"]
topWords("x y z", 2)         → ["x", "y"]     (all tied: alphabetical)
~~~

Four steps: count, \`Object.entries\`, sort, then \`slice\` and \`map\`.
`,
      starter: `function countWords(text) {
  const counts = {};
  for (const word of text.toLowerCase().split(" ")) {
    if (word === "") continue;
    counts[word] = (counts[word] || 0) + 1;
  }
  return counts;
}

function topWords(text, k) {
  // your code here
}
`,
      tests: [
        { name: 'topWords("b a b c a b", 2) is ["b", "a"]', code: `eq(topWords("b a b c a b", 2), ["b", "a"]);` },
        { name: 'ties are broken alphabetically', code: `eq(topWords("x y z", 2), ["x", "y"]);` },
        { name: 'k bigger than the number of words gives them all', code: `eq(topWords("a b a", 5), ["a", "b"]);` },
        { name: 'counting ignores case', code: `eq(topWords("Hi hi yo", 1), ["hi"]);` },
      ],
      hint: '`const pairs = Object.entries(countWords(text));` Then sort `pairs` with the two-part comparator from the last step, and `return pairs.slice(0, k).map((p) => p[0]);`',
      solution: `function countWords(text) {
  const counts = {};
  for (const word of text.toLowerCase().split(" ")) {
    if (word === "") continue;
    counts[word] = (counts[word] || 0) + 1;
  }
  return counts;
}

function topWords(text, k) {
  const pairs = Object.entries(countWords(text));      // [["b", 3], ["a", 2], ["c", 1]]
  pairs.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return pairs.slice(0, k).map((p) => p[0]);
}
`,
      explain: 'Sorting `pairs` in place is fine here: it is a brand-new array that only this function can see.',
    },
    {
      type: 'read',
      title: 'Walkthrough: the full solution',
      md: `
Trace \`topWords("b a b c a b", 2)\`.

**Counting**, one row per word:

| word | \`counts\` after |
|---|---|
| b | \`{ b: 1 }\` |
| a | \`{ b: 1, a: 1 }\` |
| b | \`{ b: 2, a: 1 }\` |
| c | \`{ b: 2, a: 1, c: 1 }\` |
| a | \`{ b: 2, a: 2, c: 1 }\` |
| b | \`{ b: 3, a: 2, c: 1 }\` |

**Ranking:** entries \`[["b", 3], ["a", 2], ["c", 1]]\`, already in order after sorting. Slice 2 and keep the words: \`["b", "a"]\`.

**Big-O**, with n words and u distinct words:

| part | cost | why |
|---|---|---|
| counting | O(n) | one pass, instant updates |
| entries | O(u) | one pair per distinct word |
| sorting | O(u log u) | sorting is n log n |
| total | O(n + u log u) | |

**Say it:** "One pass to build a tally, then I sort the distinct words by count. Linear for counting, u log u for the sort."
`,
    },
    {
      type: 'check',
      title: 'Follow-up questions',
      md: 'Interviewers like to push on a working answer. Here are the usual pushes.',
      items: [
        {
          q: 'The text contains the word "constructor". What goes wrong with `counts[word] = (counts[word] || 0) + 1` on a plain `{}`?',
          choices: [
            '`counts.constructor` already exists (inherited from Object), so the count becomes a weird string',
            'Nothing, objects accept any key',
            'It throws a TypeError',
          ],
          answer: 0,
          explain: 'A plain object inherits keys like `constructor` and `toString`. A `Map` (next lesson) or `Object.create(null)` has no inherited keys, which is why many people tally with a `Map`.',
          why: {
            1: 'Writing works, but reading the missing box first finds the inherited function.',
            2: 'No error: it quietly builds a string from the function and 1.',
          },
        },
        {
          q: 'If k is always small (say 10) and there are a million distinct words, what can beat sorting all of them?',
          choices: [
            'Keep only the best k seen so far (a small heap), so the cost is about n log k',
            'Sort twice',
            'Use `reduce` instead of a loop',
          ],
          answer: 0,
          explain: 'Saying "a heap of size k" is the expected answer. You don\'t need to code it unless asked.',
          why: {
            1: 'Sorting twice only adds work.',
            2: '`reduce` is the same loop with different syntax. It changes nothing about speed.',
          },
        },
        {
          q: 'What is the time complexity of `groupBy`?',
          choices: ['O(n)', 'O(n²)', 'O(n log n)'],
          answer: 0,
          explain: 'One pass, and each lookup and push is instant.',
          why: {
            1: 'There is no loop inside the loop.',
            2: 'Nothing is sorted.',
          },
        },
        {
          q: '"What about punctuation, like `hat.` and `hat`?" Which answer is best?',
          choices: [
            'Ask whether to strip it, then remove it before splitting (for example with a regex)',
            'Say it can\'t be done',
            'Ignore it silently',
          ],
          answer: 0,
          explain: 'Turn the follow-up into a clarifying question, then name a fix. You don\'t need the perfect regex on the spot.',
          why: {
            1: 'It can, with one extra cleanup step before splitting.',
            2: 'Silently ignoring a requirement is the one thing that hurts you.',
          },
        },
      ],
    },
  ],
};
