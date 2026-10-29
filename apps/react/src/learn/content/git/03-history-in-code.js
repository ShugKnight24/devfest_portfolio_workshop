// Git course · lesson 3. This one lesson runs JavaScript: you model commits and branches in code.
export default {
  id: 'history-in-code',
  lang: 'js',
  builds: ['git/branches', 'js/objects', 'js/loops', 'dsa/linked-lists', 'dsa/graphs'],
  title: 'Git history in code',
  goal: 'Model commits as objects with parent pointers and branches as a Map, then write log() and find the merge base yourself.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'Commits are objects with a parent',
      md: `
Lessons 1 and 2 said: a commit points at its parent, and a branch is a name that points at a commit. That's small enough to build in JavaScript, and building it makes the next lessons easier.

A commit is an object. Its \`parent\` holds **the parent commit object itself** (an object reference, JavaScript lesson 7), or \`null\` for the first commit:

~~~js
const a = { id: "a", message: "docs: add readme", parent: null };
const b = { id: "b", message: "feat: add header", parent: a };
const c = { id: "c", message: "fix: header color", parent: b };

console.log(c.parent.message);        // one step back
console.log(c.parent.parent.id);      // two steps back
console.log(a.parent);                // the root has no parent
~~~

This is a **linked list**: each item knows only the one before it. Reading history means following \`.parent\` until you reach \`null\`.
`,
    },
    {
      type: 'predict',
      title: 'Walk the chain',
      md: 'A `while` loop that follows parent pointers. What does it print?',
      code: `const a = { id: "a", message: "docs: add readme", parent: null };
const b = { id: "b", message: "feat: add header", parent: a };
const c = { id: "c", message: "fix: header color", parent: b };

let current = c;
while (current !== null) {
  console.log(current.id);
  current = current.parent;
}`,
      explain: `
\`c\`, then \`b\`, then \`a\`, then \`current\` becomes \`null\` and the loop stops.

Newest first, exactly like \`git log\`. Git starts at the commit a branch points at and walks backwards, because backwards is the only direction the pointers go.
`,
    },
    {
      type: 'task',
      title: 'log',
      md: `
Write \`log(commit)\`. It returns an array of **messages**, starting with \`commit\` and following parents until \`null\`.

~~~
// a <- b <- c
log(c) → ["fix: header color", "feat: add header", "docs: add readme"]
log(a)   → ["docs: add readme"]
~~~

It's the loop from the last step, with \`push\` instead of \`console.log\`.
`,
      starter: `function log(commit) {
  // your code here
}
`,
      tests: [
        {
          name: 'log(c) lists three messages, newest first',
          code: `const a = { id: "a", message: "docs: add readme", parent: null };
const b = { id: "b", message: "feat: add header", parent: a };
const c = { id: "c", message: "fix: header color", parent: b };
eq(log(c), ["fix: header color", "feat: add header", "docs: add readme"]);`,
        },
        {
          name: 'the root commit gives one message',
          code: `const a = { id: "a", message: "docs: add readme", parent: null };
eq(log(a), ["docs: add readme"]);`,
        },
      ],
      hint: 'Start with `const messages = []` and `let current = commit`. Loop `while (current !== null)`, push `current.message`, then step to `current.parent`.',
      solution: `function log(commit) {
  const messages = [];
  let current = commit;
  while (current !== null) {
    messages.push(current.message);
    current = current.parent;
  }
  return messages;
}
`,
    },
    {
      type: 'read',
      title: 'Branches as a Map',
      md: `
A branch is a name that points at a commit. In JavaScript that's a **Map** from name to commit object. Two methods are all you need: \`get(key)\` reads, \`set(key, value)\` writes.

~~~js
const a = { id: "a", message: "docs: add readme", parent: null };

const branches = new Map();
branches.set("main", a);
branches.set("feature", a);  // one more name, same commit

console.log(branches.get("feature").id);
console.log(branches.size);
~~~

Creating \`feature\` copied nothing. Both names hold the very same object. That's why branches are cheap in git too.

Committing has two moves:

1. Make a new commit whose parent is the commit the current branch points at.
2. Move that branch to the new commit.
`,
    },
    {
      type: 'task',
      title: 'commitOn',
      md: `
Write \`commitOn(branches, name, id, message)\`. It does the two moves from the last step and returns the new commit.

~~~
// branches: main -> a
const b = commitOn(branches, "main", "b", "feat: add header");
b.parent === a              → true
branches.get("main") === b  → true
~~~

Other branches must not move.
`,
      starter: `function commitOn(branches, name, id, message) {
  // your code here
}
`,
      tests: [
        {
          name: 'the new commit\'s parent is the old branch tip',
          code: `const a = { id: "a", message: "docs: add readme", parent: null };
const branches = new Map([["main", a]]);
const b = commitOn(branches, "main", "b", "feat: add header");
assert(b.parent === a, "parent should be the commit main pointed at");
eq(b.id, "b");
eq(b.message, "feat: add header");`,
        },
        {
          name: 'the branch moves to the new commit',
          code: `const a = { id: "a", message: "docs: add readme", parent: null };
const branches = new Map([["main", a]]);
const b = commitOn(branches, "main", "b", "feat: add header");
assert(branches.get("main") === b, "main should now point at the new commit");`,
        },
        {
          name: 'other branches stay where they were',
          code: `const a = { id: "a", message: "docs: add readme", parent: null };
const branches = new Map([["main", a], ["feature", a]]);
commitOn(branches, "feature", "b", "feat: add search");
assert(branches.get("main") === a, "main should not move");`,
        },
      ],
      hint: 'Build `{ id, message, parent: branches.get(name) }`, then `branches.set(name, commit)`, then return it.',
      solution: `function commitOn(branches, name, id, message) {
  const commit = { id, message, parent: branches.get(name) };
  branches.set(name, commit);
  return commit;
}
`,
      explain: 'That is the whole of `git commit` once the snapshot is saved: a new object pointing back, and one name moved forward.',
    },
    {
      type: 'read',
      title: 'Where two branches meet',
      md: `
Lesson 2 ended with diverged branches:

~~~
A---B---D  main
     \\
      C  feature
~~~

The **merge base** is the newest commit both branches share: \`B\`. Merging (next lesson) needs it, because it answers "what did each side change since they split?"

A plan in two passes:

1. Walk back from one tip and remember every id you see, in a **Set** (\`add\` to put an id in, \`has\` to ask if it's there).
2. Walk back from the other tip. The first commit whose id is in the Set is the merge base.

~~~js
const seen = new Set();
seen.add("b");
console.log(seen.has("b"), seen.has("z"));
~~~
`,
    },
    {
      type: 'task',
      title: 'ancestors',
      md: `
Step 1 of the plan. Write \`ancestors(commit)\`: a **Set** of the ids of \`commit\` and every commit behind it.

~~~
// a <- b <- c
ancestors(c)   → Set { "c", "b", "a" }
~~~

It's \`log\` again, with a Set and ids instead of an array and messages.
`,
      starter: `function ancestors(commit) {
  // your code here
}
`,
      tests: [
        {
          name: 'ancestors(c) holds c, b and a',
          code: `const a = { id: "a", message: "1", parent: null };
const b = { id: "b", message: "2", parent: a };
const c = { id: "c", message: "3", parent: b };
const s = ancestors(c);
assert(s instanceof Set, "return a Set");
eq([...s].sort(), ["a", "b", "c"]);`,
        },
        {
          name: 'a root commit gives a Set with just itself',
          code: `const a = { id: "a", message: "1", parent: null };
eq([...ancestors(a)], ["a"]);`,
        },
      ],
      hint: 'Same loop as `log`. Start with `const ids = new Set()` and call `ids.add(current.id)` each time round.',
      solution: `function ancestors(commit) {
  const ids = new Set();
  let current = commit;
  while (current !== null) {
    ids.add(current.id);
    current = current.parent;
  }
  return ids;
}
`,
    },
    {
      type: 'task',
      title: 'mergeBase',
      md: `
Step 2. Write \`mergeBase(x, y)\`: walk back from \`y\` and return the **id** of the first commit that is also in \`ancestors(x)\`. Return \`null\` if there is none.

~~~
// A---B---D  main
//      \\
//       C  feature
mergeBase(D, C)   → "b"
mergeBase(D, B)   → "b"    (B is behind D, so B itself)
~~~

Your \`ancestors\` from the last step is already defined, so you can call it.
`,
      starter: `function ancestors(commit) {
  const ids = new Set();
  let current = commit;
  while (current !== null) {
    ids.add(current.id);
    current = current.parent;
  }
  return ids;
}

function mergeBase(x, y) {
  // your code here
}
`,
      tests: [
        {
          name: 'diverged branches meet at b',
          code: `const a = { id: "a", message: "1", parent: null };
const b = { id: "b", message: "2", parent: a };
const c = { id: "c", message: "feature", parent: b };
const d = { id: "d", message: "main", parent: b };
eq(mergeBase(d, c), "b");`,
        },
        {
          name: 'when one is behind the other, the base is the one behind',
          code: `const a = { id: "a", message: "1", parent: null };
const b = { id: "b", message: "2", parent: a };
const d = { id: "d", message: "3", parent: b };
eq(mergeBase(d, b), "b");`,
        },
        {
          name: 'unrelated histories give null',
          code: `const a = { id: "a", message: "1", parent: null };
const z = { id: "z", message: "other repo", parent: null };
eq(mergeBase(a, z), null);`,
        },
      ],
      hint: 'Make `const seen = ancestors(x)`. Then loop from `y` like in `log`, and `return current.id` as soon as `seen.has(current.id)`. After the loop, `return null`.',
      solution: `function ancestors(commit) {
  const ids = new Set();
  let current = commit;
  while (current !== null) {
    ids.add(current.id);
    current = current.parent;
  }
  return ids;
}

function mergeBase(x, y) {
  const seen = ancestors(x);
  let current = y;
  while (current !== null) {
    if (seen.has(current.id)) return current.id;
    current = current.parent;
  }
  return null;
}
`,
      explain: `
Real git does the same idea on a graph where a merge commit can have **two** parents, so it walks both. The core trick, "remember one side in a Set, search from the other", is the same. You can ask git directly with \`git merge-base main feature\`.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'Why does `git log` list the newest commit first?',
          choices: ['It starts at the branch tip and follows parent pointers backwards', 'It sorts commits by date, newest first', 'Commits are stored newest first on disk'],
          answer: 0,
          explain: 'Each commit only knows its parent, so the natural walk goes from the tip back to the root.',
          why: { 1: 'Ordering comes from the parent walk, not a date sort. Dates can even be wrong.', 2: 'Storage order has nothing to do with it. The pointers decide.' },
        },
        {
          q: 'In the model, what does creating a branch cost?',
          choices: ['One Map entry pointing at an existing commit', 'A copy of every commit on the current branch', 'A new root commit'],
          answer: 0,
          explain: '`branches.set("feature", tip)` adds a name. No commit is copied.',
          why: { 1: 'Commits are shared by reference. Nothing is copied.', 2: 'A new branch starts at an existing commit, not a new root.' },
        },
        {
          q: '`main` is at `D`, `feature` is at `C`, and both have parent `B`. What is the merge base?',
          choices: ['`B`', '`D`', '`A`, the first commit'],
          answer: 0,
          explain: 'The merge base is the newest commit both branches share. `B` is behind both tips.',
          why: { 1: '`D` is only on `main`.', 2: '`A` is shared too, but `B` is newer. The merge base is the closest shared commit.' },
        },
      ],
    },
  ],
};
