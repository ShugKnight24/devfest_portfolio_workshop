// Git course · lesson 1. Step types: read, predict, check (see ../index.js).
// Nothing runs in this track: predict steps show a command sequence and the output to expect.
export default {
  id: 'what-git-stores',
  builds: ['js/objects'],
  title: 'What git stores',
  goal: 'Know what a commit really is, where your changes live (working tree, staging area, repository), and read status, diff and log.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'A commit is a snapshot',
      md: `
Git is a database of **snapshots** of your project. Each time you commit, git saves what every tracked file looks like at that moment.

A **commit** is a small record that holds:

- a snapshot of all the files (unchanged files are not copied again, git reuses the stored version)
- the author, the date and a message
- a pointer to the **parent** commit, the one that came before

That last line is the key to all of git. Each commit points back at its parent, so the history is a chain you can walk backwards, like objects that hold a reference to another object (JavaScript lesson 7):

~~~
A <--- B <--- C
first        newest
~~~

Arrows point backwards on purpose: a commit knows its parent, but a parent never knows its children.

Every commit gets a **hash**, a 40-character ID like \`3f2a91c8e0...\` computed from its contents, including the parent's hash. Change anything (a file, the message, the parent) and you get a different hash. Usually you only need the first 7 characters: \`3f2a91c\`.
`,
    },
    {
      type: 'read',
      title: 'The three areas',
      md: `
Your changes live in one of three places:

~~~
working tree --git add--> staging area --git commit--> repository
(your files)              (the index)                  (.git folder)
~~~

| Area | What it is |
|---|---|
| **Working tree** | The files you see and edit in your editor. |
| **Staging area** (also called the **index**) | The draft of your next commit. |
| **Repository** | The commits themselves, stored in the hidden \`.git\` folder. |

\`git add\` copies a file's current content into the draft. \`git commit\` turns the draft into a real commit.

The common mistake: people think \`git add\` means "track this file forever". It means "put the file **as it is right now** into the next commit". Edit the file again after \`git add\` and the new edit is not in the draft until you add it again.
`,
    },
    {
      type: 'predict',
      title: 'A brand-new repo',
      md: 'You start a repo and create one file. What does `git status` say?',
      code: `git init -b main
echo "# Portfolio" > README.md
git status`,
      output: `On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        README.md

nothing added to commit but untracked files present (use "git add" to track)`,
      explain: `
\`git init -b main\` creates the \`.git\` folder and names the first branch \`main\`.

The file exists in your **working tree**, but git has never seen it, so it is **untracked**. Git will not commit a file you never added. That's a feature: build output and secrets should never sneak in.
`,
    },
    {
      type: 'predict',
      title: 'Stage it',
      code: `git add README.md
git status`,
      output: `On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   README.md`,
      explain: `
"Changes to be committed" is the **staging area**. The file is in the draft of your next commit, but there is still no commit.

Read the hints in brackets. Git tells you how to undo every step, and those hints are usually the right command.
`,
    },
    {
      type: 'predict',
      title: 'Commit it',
      md: 'Your hash will be different. Look at the shape of the output.',
      code: `git commit -m "docs: add readme"`,
      output: `[main (root-commit) 3f2a91c] docs: add readme
 1 file changed, 1 insertion(+)
 create mode 100644 README.md`,
      explain: `
- \`main\` is the branch the commit went onto.
- \`(root-commit)\` means this commit has no parent. Only the first commit is like that.
- \`3f2a91c\` is the short hash.
- \`1 insertion(+)\` counts lines added.

The message format \`docs: add readme\` is a Conventional Commit. Lesson 8 covers it.
`,
    },
    {
      type: 'read',
      title: 'git diff: what changed, and where',
      md: `
\`git diff\` compares two of the three areas. Which two depends on the flag:

| Command | Compares | Answers |
|---|---|---|
| \`git diff\` | working tree vs staging area | "What did I change that isn't staged yet?" |
| \`git diff --staged\` | staging area vs last commit | "What will my next commit contain?" |

Lines starting with \`+\` were added, lines starting with \`-\` were removed:

~~~
diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1 +1,2 @@
 # Portfolio
+Built with React and Node.
~~~

A frequent surprise: you run \`git diff\`, it prints nothing, and you're sure you changed something. You probably already ran \`git add\`. Try \`git diff --staged\`.
`,
    },
    {
      type: 'predict',
      title: 'Staged and modified at once',
      md: 'You add a line, stage it, then add another line without staging. What does `git status` show?',
      code: `echo "Built with React." >> README.md
git add README.md
echo "Deployed on Vercel." >> README.md
git status`,
      output: `On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   README.md

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   README.md`,
      explain: `
The same file shows up twice, and that's correct. The **staging area** holds README with the first new line. The **working tree** has a second line that isn't staged.

If you commit now, only "Built with React." goes in. This is the "\`git add\` is a snapshot, not a subscription" rule from step 2. Run \`git add README.md\` again to include the second line.
`,
    },
    {
      type: 'read',
      title: 'git log: reading history',
      md: `
\`git log\` walks the parent chain from the newest commit backwards and prints each one. The short form is the one you'll use most:

~~~
git log --oneline
~~~

~~~
c41d2e7 (HEAD -> main) feat: add contact section
9b0e5a1 docs: add install steps
3f2a91c docs: add readme
~~~

- Newest first, because git starts at the tip and follows parent pointers.
- \`(HEAD -> main)\` marks where you are. Lesson 2 explains it.
- Add \`--graph\` to draw branches, and \`-p\` to see each commit's diff.
`,
    },
    {
      type: 'predict',
      title: 'Commit, then log',
      md: 'Continuing from step 7 (README has two new lines, one staged).',
      code: `git add README.md
git commit -m "docs: add stack and hosting"
git log --oneline`,
      output: `8a1f0b4 (HEAD -> main) docs: add stack and hosting
3f2a91c docs: add readme`,
      explain: `
\`git add\` staged the second line too, so the commit holds both. The log shows two commits, newest on top. \`8a1f0b4\`'s parent is \`3f2a91c\`.
`,
    },
    {
      type: 'read',
      title: 'Why the staging area exists',
      md: `
Other tools commit everything you changed. Git makes you choose, so one commit can hold **one idea** even when your working tree holds three.

Say you fixed a bug and also renamed some variables. You can stage only the bug fix, commit it, then stage and commit the rename. A reviewer reads two clean commits instead of one tangled one.

Two related tools:

- \`git add -p\` walks through your changes piece by piece and asks which ones to stage.
- A \`.gitignore\` file lists paths git should never offer to add, like \`node_modules/\`, \`dist/\` and \`.env\`.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'What does a commit store?',
          choices: ['A snapshot of the files, metadata, and a pointer to its parent', 'Only the lines that changed since the last commit', 'A copy of the working tree including untracked files'],
          answer: 0,
          explain: 'A commit is a full snapshot plus who, when, why and its parent. Git stores it efficiently by reusing unchanged files.',
          why: { 1: 'Git shows you diffs, but each commit records the whole project state.', 2: 'Untracked files never go into a commit until you add them.' },
        },
        {
          q: 'You edit `app.js`, run `git add app.js`, then edit `app.js` again. What does `git commit` include?',
          choices: ['Only the first edit', 'Both edits', 'Neither edit'],
          answer: 0,
          explain: '`git add` copies the file as it was at that moment into the staging area. The second edit is only in the working tree.',
          why: { 1: '`git add` is a snapshot, not a subscription. Add again to include the second edit.', 2: 'The first edit was staged, so it is committed.' },
        },
        {
          q: 'You staged everything and `git diff` prints nothing. How do you see what you are about to commit?',
          choices: ['`git diff --staged`', '`git log`', '`git status --diff`'],
          answer: 0,
          explain: 'Plain `git diff` compares the working tree to the staging area. `--staged` compares the staging area to the last commit.',
          why: { 1: '`git log` shows commits that already exist.', 2: 'That flag does not exist.' },
        },
        {
          q: 'Why does changing an old commit\'s message give it a new hash?',
          choices: ['The hash is computed from the commit\'s contents, and the message is part of them', 'Git renumbers all commits on every change', 'Hashes are random and assigned at save time'],
          answer: 0,
          explain: 'The hash is a fingerprint of the content, including the message and the parent hash. Different content, different hash.',
          why: { 1: 'Git never renumbers. Hashes are fingerprints, not counters.', 2: 'Hashes are not random. The same content always gives the same hash.' },
        },
      ],
    },
  ],
};
