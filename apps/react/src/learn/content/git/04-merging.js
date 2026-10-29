// Git course · lesson 4. Step types: read, predict, check (see ../index.js).
export default {
  id: 'merging',
  builds: ['git/branches', 'git/history-in-code'],
  title: 'Merging: fast-forward vs merge commit',
  goal: 'Predict whether a merge fast-forwards or creates a merge commit, read the result in git log --graph, and pick between --ff-only and --no-ff.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'Merge brings another branch in',
      md: `
\`git merge feature\` means: "bring the work from \`feature\` into the branch I'm on". The branch you're on is the one that changes. \`feature\` stays where it is.

So the usual sequence is: switch to the branch that should **receive** the work, then merge.

~~~
git switch main
git merge feature
~~~

What git does next depends on the **merge base** you computed in lesson 3. There are two cases:

| Situation | What git does |
|---|---|
| \`main\` hasn't moved since \`feature\` branched off | **Fast-forward**: slide the \`main\` pointer forward. No new commit. |
| both branches have new commits | **Merge commit**: a new commit with two parents that combines both sides. |
`,
    },
    {
      type: 'predict',
      title: 'Case 1: main has not moved',
      md: `Before:

~~~
A---B  main
     \\
      C---D  feature
~~~

Draw the history and guess the first lines of output.`,
      code: `git switch main
git merge feature`,
      output: `Updating 9b0e5a1..e7f3c20
Fast-forward
 src/search.js | 12 ++++++++++++
 1 file changed, 12 insertions(+)

A---B---C---D  main, feature`,
      explain: `
The merge base of \`main\` and \`feature\` is \`B\`, and \`B\` is exactly where \`main\` already is. \`main\` has nothing new, so there is nothing to combine. Git just moves the \`main\` note forward to \`D\`.

That's a **fast-forward**: no new commit, and the history stays a straight line. \`Updating 9b0e5a1..e7f3c20\` is "from \`B\` to \`D\`".
`,
    },
    {
      type: 'predict',
      title: 'Case 2: both branches moved',
      md: `Before:

~~~
A---B---E  main
     \\
      C---D  feature
~~~

Now \`main\` has its own commit \`E\`.`,
      code: `git switch main
git merge feature`,
      output: `Merge made by the 'ort' strategy.
 src/search.js | 12 ++++++++++++
 1 file changed, 12 insertions(+)

A---B---E-------M  main
     \\         /
      C-------D  feature`,
      explain: `
\`main\` can't slide to \`D\`, because that would throw away \`E\`. So git creates a **merge commit** \`M\` whose two parents are \`E\` and \`D\`. Your editor opens with the message \`Merge branch 'feature'\`; save and close to accept it.

\`ort\` is the name of git's default merge strategy (since git 2.34). You never need to choose it.
`,
    },
    {
      type: 'read',
      title: 'How git combines the two sides',
      md: `
Git makes a merge commit with a **three-way merge**. It looks at three snapshots:

- the **merge base** \`B\`
- your side, \`E\`
- their side, \`D\`

For each file, and each part of each file, it asks "who changed this since \`B\`?"

| Changed since B in... | Result |
|---|---|
| neither side | keep it |
| only one side | take that side's version |
| both sides, the same way | take it |
| both sides, differently | **conflict**: you decide (lesson 6) |

This is why the merge base matters. Without it git couldn't tell "they added this line" from "you deleted this line".
`,
    },
    {
      type: 'predict',
      title: 'Read the graph',
      md: '`git log --graph` draws the history with `*` for commits and lines for parents. Read this after the merge from step 3.',
      code: `git log --oneline --graph`,
      output: `*   a1b2c3d (HEAD -> main) Merge branch 'feature'
|\\
| * e7f3c20 (feature) feat: add search results
| * 5c6d7e8 feat: add search box
* | 4d5e6f7 fix: correct footer year
|/
* 9b0e5a1 docs: add install steps
* 3f2a91c docs: add readme`,
      explain: `
Read it from the top:

- \`a1b2c3d\` is the merge commit. \`|\\\` shows it has two parents.
- The right-hand column is \`feature\` (\`C\`, \`D\`). The left-hand column is \`main\`'s own commit \`E\`.
- \`|/\` is where the two lines meet: the merge base \`B\` (\`9b0e5a1\`).

Run \`git log --oneline --graph --all\` on any real repo to see every branch at once.
`,
    },
    {
      type: 'read',
      title: 'Choosing the shape: --ff-only and --no-ff',
      md: `
Two flags let you insist on one shape:

| Command | Effect |
|---|---|
| \`git merge --ff-only feature\` | Fast-forward or nothing. If a merge commit would be needed, git refuses. |
| \`git merge --no-ff feature\` | Always make a merge commit, even when a fast-forward was possible. |

Why want either?

- **--ff-only** is a safety check when updating a branch you don't work on directly, like your local \`main\` from the server. If it fails, something unexpected happened, and you'd rather know.
- **--no-ff** keeps a visible "feature X landed here" commit, even for a branch that could have fast-forwarded. Some teams like that record. Others prefer a straight line.

On GitHub, the "Merge pull request" button always makes a merge commit, like \`--no-ff\`. Lesson 8 covers the other buttons.
`,
    },
    {
      type: 'predict',
      title: '--ff-only on diverged branches',
      md: 'Same diverged history as step 3 (`main` has `E`, `feature` has `C` and `D`).',
      code: `git switch main
git merge --ff-only feature`,
      output: `hint: Diverging branches can't be fast-forwarded, you need to either:
hint:   git merge --no-ff
hint: or:
hint:   git rebase
fatal: Not possible to fast-forward, aborting.`,
      explain: `
The last line is the one that matters: nothing changed. The hints name the two ways forward: a merge commit, or rebasing \`feature\` onto \`main\` first so it can fast-forward. Rebasing is the next lesson.

(The hint lines are shortened here, and their wording varies a little between git versions. The \`fatal\` line is the stable part.)
`,
    },
    {
      type: 'predict',
      title: 'Clean up the branch',
      md: 'After the merge from step 3, `feature`\'s work is part of `main`.',
      code: `git branch -d feature`,
      output: `Deleted branch feature (was e7f3c20).`,
      explain: `
Deleting a branch deletes only the **name**. The commits stay, because \`main\`'s history now reaches them through the merge commit.

\`-d\` checks this first: it refuses to delete a branch whose commits aren't merged into the current branch (or into the branch's upstream, lesson 7). \`-D\` deletes anyway. Use \`-D\` only when you mean "throw this work away".
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'You are on `main` and run `git merge feature`. Which branch changes?',
          choices: ['`main`', '`feature`', 'Both'],
          answer: 0,
          explain: 'Merge brings work into the branch you are on. `feature` does not move.',
          why: { 1: '`feature` is the source. It stays where it was.', 2: 'Only the current branch moves.' },
        },
        {
          q: '`main` is at `B`. `feature` is `B---C---D`. What does `git merge feature` on `main` do?',
          choices: ['Moves `main` to `D` with no new commit', 'Creates a merge commit with parents `B` and `D`', 'Copies `C` and `D` as new commits on `main`'],
          answer: 0,
          explain: '`main` has nothing new since the merge base, so git fast-forwards: it slides the pointer.',
          why: { 1: 'That is what `--no-ff` would force. By default git fast-forwards when it can.', 2: 'Merging never copies commits. Rebasing does that.' },
        },
        {
          q: 'How many parents does a merge commit have?',
          choices: ['Two', 'One', 'None'],
          answer: 0,
          explain: 'One parent from each side. That is how `git log --graph` knows to draw the two lines joining.',
          why: { 1: 'A normal commit has one. A merge commit records both histories.', 2: 'Only the very first commit of a repo has no parent.' },
        },
        {
          q: 'What does `git merge --ff-only feature` do when the branches have diverged?',
          choices: ['Refuses and changes nothing', 'Creates a merge commit anyway', 'Rebases `feature` automatically'],
          answer: 0,
          explain: '`--ff-only` means fast-forward or nothing.',
          why: { 1: 'That is the default without the flag.', 2: 'Git suggests a rebase in the hint, but never does it for you.' },
        },
      ],
    },
  ],
};
