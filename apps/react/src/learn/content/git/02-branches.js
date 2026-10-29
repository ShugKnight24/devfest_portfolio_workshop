// Git course · lesson 2. Step types: read, predict, check (see ../index.js).
export default {
  id: 'branches',
  builds: ['git/what-git-stores'],
  title: 'Branches are pointers',
  goal: 'See a branch as a name that points at a commit, know what HEAD is, create and switch branches, and recognise detached HEAD.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'A branch is a sticky note',
      md: `
In lesson 1 every commit pointed back at its parent. A **branch** adds one more pointer: a name that points at a commit.

~~~
A <--- B <--- C
              ^
             main
~~~

That's all a branch is. Inside \`.git\`, the file \`refs/heads/main\` holds one line: the hash of \`C\`. Creating a branch writes one small file, which is why branches in git are cheap and you should make lots of them.

When you commit on \`main\`, git creates the new commit with \`C\` as its parent, then moves the \`main\` note forward to it:

~~~
A <--- B <--- C <--- D
                     ^
                    main
~~~

From here on, graphs drop the arrowheads and draw history left to right, oldest first: \`A---B---C---D\`.
`,
    },
    {
      type: 'read',
      title: 'HEAD: where you are',
      md: `
With several branches, git needs to know which one you're on. That's **HEAD**.

Usually HEAD points at a **branch**, and the branch points at a commit:

~~~
HEAD -> main -> C
~~~

The file \`.git/HEAD\` literally says \`ref: refs/heads/main\`.

HEAD answers two questions:

- Which files should be in my working tree? The snapshot of the commit HEAD leads to.
- When I commit, which branch moves forward? The one HEAD points at.

That's what \`(HEAD -> main)\` meant in \`git log --oneline\`.
`,
    },
    {
      type: 'read',
      title: 'The commands',
      md: `
| You want to | Command |
|---|---|
| list branches (\`*\` marks the current one) | \`git branch\` |
| create a branch, stay where you are | \`git branch feature\` |
| move to a branch | \`git switch feature\` |
| create a branch and move to it | \`git switch -c feature\` |
| delete a merged branch | \`git branch -d feature\` |

\`git switch\` arrived in git 2.23 to take over the branch half of \`git checkout\`, which did too many jobs. You'll still see the old forms everywhere, and they work:

| Older form | Same as |
|---|---|
| \`git checkout feature\` | \`git switch feature\` |
| \`git checkout -b feature\` | \`git switch -c feature\` |
`,
    },
    {
      type: 'predict',
      title: 'Create a branch and commit on it',
      md: 'You are on `main` at commit `B`. Draw the history after these commands.',
      code: `git switch -c feature
# edit a file
git commit -am "feat: add search box"   # this makes commit C`,
      output: `A---B  main
     \\
      C  feature  <- HEAD`,
      explain: `
\`git switch -c feature\` created a new note pointing at \`B\` and moved HEAD to it. Both branches pointed at \`B\` for a moment.

Then the commit moved only the branch HEAD was on. \`main\` stayed at \`B\`. (\`-a\` on \`commit\` stages edits to already-tracked files first, so you can skip \`git add\` for them.)
`,
    },
    {
      type: 'predict',
      title: 'Back to main, commit again',
      code: `git switch main
# edit a different file
git commit -am "fix: correct footer year"   # commit D`,
      output: `A---B---D  main  <- HEAD
     \\
      C  feature`,
      explain: `
Now the branches have **diverged**: \`C\` and \`D\` both have \`B\` as their parent. Neither branch contains the other's work.

\`B\` is the last commit both branches share. That's called the **merge base**, and lessons 3 and 4 lean on it.

When you switched back to \`main\`, git also changed your files to match \`B\`. Your search box from \`C\` disappeared from the editor. It's not lost: it's in commit \`C\`, and \`git switch feature\` brings it back.
`,
    },
    {
      type: 'predict',
      title: 'List the branches',
      code: `git branch`,
      output: `  feature
* main`,
      explain: 'Alphabetical, with `*` on the branch HEAD points at. Add `-v` to see each branch\'s latest commit.',
    },
    {
      type: 'predict',
      title: 'Switching with unsaved work',
      md: 'You edit `app.js` on `main` without committing. `app.js` is also different on `feature`. What happens?',
      code: `git switch feature`,
      output: `error: Your local changes to the following files would be overwritten by checkout:
        app.js
Please commit your changes or stash them before you switch branches.
Aborting`,
      explain: `
Switching rewrites your working tree to the other branch's snapshot. That would destroy your uncommitted edit, so git refuses.

If your edits touch files that are the same on both branches, git simply carries them across and the switch succeeds. People find that surprising: uncommitted changes belong to the working tree, not to a branch.

The fixes: commit the work, or stash it (\`git stash\`, lesson 9).
`,
    },
    {
      type: 'read',
      title: 'Detached HEAD',
      md: `
You can also look at an old commit directly. Then HEAD points at a **commit**, not a branch:

~~~
HEAD -> 3f2a91c      (no branch in between)
~~~

This is **detached HEAD**. It's not an error. It's useful for looking around ("did the bug exist back then?").

The risk: if you commit here, no branch moves forward to hold the new commit. When you switch away, nothing points at it and it becomes hard to find.

The fix is one command, run before you switch away: \`git switch -c rescue-branch\`. That puts a name on where you are.

To leave without keeping anything: \`git switch main\`.
`,
    },
    {
      type: 'predict',
      title: 'switch wants a branch',
      md: 'You try to go to an old commit with `git switch`.',
      code: `git switch 3f2a91c`,
      output: `fatal: a branch is expected, got commit '3f2a91c'
hint: If you want to detach HEAD at the commit, try again with the --detach option.`,
      explain: `
\`git switch\` is careful on purpose: it only detaches HEAD when you ask. The old \`git checkout 3f2a91c\` detaches without asking, which is how many people land in detached HEAD by accident.
`,
    },
    {
      type: 'predict',
      title: 'Detach on purpose',
      code: `git switch --detach 3f2a91c
git status`,
      output: `HEAD detached at 3f2a91c
nothing to commit, working tree clean`,
      explain: `
The first line of \`git status\` is how you recognise detached HEAD. Your prompt or editor may also show a hash instead of a branch name.

Look around, then \`git switch main\` to go back. If you made commits you want to keep, run \`git switch -c some-name\` first.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'What is a branch in git?',
          choices: ['A name that points at one commit', 'A separate copy of all the project\'s files', 'A list of the commits that belong to it'],
          answer: 0,
          explain: 'A branch is a small file holding one hash. The history comes from following parent pointers from that commit.',
          why: { 1: 'Git never copies the project for a branch, which is why branches are cheap.', 2: 'A branch stores only its tip. Which commits are "on" it comes from walking parents.' },
        },
        {
          q: 'You are on `feature` and run `git commit`. Which pointers move?',
          choices: ['`feature` moves to the new commit; HEAD still points at `feature`', '`main` and `feature` both move', 'Nothing moves until you push'],
          answer: 0,
          explain: 'Only the branch HEAD points at moves forward. HEAD follows along because it points at the branch, not at a commit.',
          why: { 1: 'Other branches never move when you commit.', 2: 'Commits and branch moves are local and immediate. Pushing is about sharing them.' },
        },
        {
          q: 'What does `git switch -c fix-login` do?',
          choices: ['Creates `fix-login` at the current commit and switches to it', 'Switches to an existing `fix-login` and fails if it is missing', 'Creates `fix-login` but stays on the current branch'],
          answer: 0,
          explain: '`-c` means create. It is the same as `git checkout -b fix-login`.',
          why: { 1: 'That is plain `git switch fix-login`.', 2: 'That is `git branch fix-login`.' },
        },
        {
          q: '`git status` says `HEAD detached at 9b0e5a1` and you just made two commits you want to keep. What do you run first?',
          choices: ['`git switch -c keep-work`', '`git switch main`', '`git commit --amend`'],
          answer: 0,
          explain: 'Put a branch name on where you are, so the commits have something pointing at them.',
          why: { 1: 'Switching away first leaves the two commits with no branch pointing at them.', 2: 'Amending rewrites the last commit and still leaves you detached.' },
        },
      ],
    },
  ],
};
