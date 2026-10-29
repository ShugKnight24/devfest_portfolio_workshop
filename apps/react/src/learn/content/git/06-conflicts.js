// Git course · lesson 6. Step types: read, predict, check (see ../index.js).
export default {
  id: 'conflicts',
  builds: ['git/merging', 'git/rebasing'],
  title: 'Resolving conflicts',
  goal: 'Know why a conflict happens, read conflict markers, resolve a file, finish or abort the merge, and handle conflicts during a rebase.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'Why conflicts happen',
      md: `
Lesson 4's three-way merge asked, for each part of each file, "who changed this since the merge base?" A **conflict** is the one case git can't decide on its own: **both sides changed the same lines, in different ways**.

~~~
merge base:   const title = "Portfolio";
main:         const title = "My Portfolio";
feature:      const title = "Portfolio | Ada";
~~~

Neither version is "right" to git. Only you know whether you want one, the other, or a mix.

Things that are **not** conflicts:

- both sides changed the same file, but different lines: git combines them
- only one side touched the lines: git takes that side

A conflict is not an error or a broken repo. It's git pausing to ask you a question.
`,
    },
    {
      type: 'predict',
      title: 'The merge stops',
      md: 'You merge the `feature` from the example above into `main`.',
      code: `git switch main
git merge feature`,
      output: `Auto-merging src/header.js
CONFLICT (content): Merge conflict in src/header.js
Automatic merge failed; fix conflicts and then commit the result.`,
      explain: `
\`Auto-merging\` means git tried. \`CONFLICT (content)\` names each file it couldn't finish.

Git is now **in the middle of a merge**. Files without conflicts are already merged and staged. The conflicted file is waiting for you. No merge commit exists yet.
`,
    },
    {
      type: 'read',
      title: 'Reading conflict markers',
      md: `
Open \`src/header.js\`. Git wrote both versions into the file, between markers:

~~~text
<<<<<<< HEAD
const title = "My Portfolio";
=======
const title = "Portfolio | Ada";
>>>>>>> feature
~~~

| Part | Means |
|---|---|
| \`<<<<<<< HEAD\` to \`=======\` | **your** side: the branch you're on (\`main\`) |
| \`=======\` to \`>>>>>>> feature\` | **their** side: the branch you're merging in |

Everything outside the markers merged cleanly. Leave it alone.

**Tip:** \`git config --global merge.conflictStyle zdiff3\` adds a third section, \`||||||| base\`, showing the merge base. Seeing what the line was *before* either change usually makes the right answer obvious.
`,
    },
    {
      type: 'predict',
      title: 'git status during a conflict',
      code: `git status`,
      output: `On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
        both modified:   src/header.js

no changes added to commit (use "git add" and/or "git commit -a")`,
      explain: `
\`git status\` is your checklist. "Unmerged paths" lists what's left to resolve, and the hints tell you the two ways out: finish (\`git add\` each file, then \`git commit\`) or abort (\`git merge --abort\`).
`,
    },
    {
      type: 'read',
      title: 'Resolve, add, commit',
      md: `
Resolving is plain editing:

1. Edit the file so it says what it **should** say. Keep one side, the other, or write a mix.
2. Delete all three marker lines.
3. \`git add src/header.js\` to tell git "this file is resolved".
4. When every file is added, \`git commit\` (or \`git merge --continue\`). Git fills in the merge message for you.

Here you decide you want both ideas:

~~~text
const title = "My Portfolio | Ada";
~~~

~~~
git add src/header.js
git commit
~~~

Your editor's merge view (VS Code shows "Accept Current", "Accept Incoming", "Accept Both") is a shortcut for step 1 and 2. You still run \`git add\` and \`git commit\` (or the editor does it for you).

After resolving, **run the app or the tests**. Two sides can merge without a textual conflict and still break each other, like one side renaming a function the other side calls.
`,
    },
    {
      type: 'predict',
      title: 'Forgetting a marker',
      md: 'You edit the file but leave `=======` in by accident, then add and commit.',
      code: `git add src/header.js
git commit --no-edit`,
      output: `[main 4e5f6a7] Merge branch 'feature'`,
      explain: `
It succeeds. Git doesn't read your file. \`git add\` simply means "I say this is resolved", so the stray marker is now committed and the build breaks.

Two habits catch this:

- \`git diff --check\` before committing reports leftover conflict markers (and trailing whitespace).
- Search the project for \`<<<<<<<\` and \`>>>>>>>\`.
`,
    },
    {
      type: 'predict',
      title: 'Changed your mind? Abort',
      md: 'Back at step 2, in the middle of the conflict, you decide to stop.',
      code: `git merge --abort
git status`,
      output: `On branch main
nothing to commit, working tree clean`,
      explain: `
\`git merge --abort\` puts everything back as it was before \`git merge\`. Nothing is lost, and you can merge again later.

Use it whenever a conflict looks bigger than you expected. Talk to whoever wrote the other side, then try again.
`,
    },
    {
      type: 'read',
      title: 'Conflicts during a rebase',
      md: `
A rebase replays your commits one at a time (lesson 5), so a conflict stops it **at one commit**. You may get a conflict, resolve it, and get another at the next commit.

| Command | When |
|---|---|
| \`git add <file>\`, then \`git rebase --continue\` | conflict resolved, replay the next commit |
| \`git rebase --skip\` | drop this commit entirely (rarely what you want) |
| \`git rebase --abort\` | put the branch back exactly as before the rebase |

During a rebase you don't run \`git commit\` yourself. \`--continue\` does it.

**Watch out:** the marker labels feel flipped. While rebasing \`feature\` onto \`main\`, git is standing on \`main\`'s commits and replaying yours on top. So \`HEAD\` (the "current"/"ours" side) is **\`main\`**, and the incoming side is **your commit**. Read the content, not the labels.
`,
    },
    {
      type: 'read',
      title: 'Fewer conflicts',
      md: `
You can't prevent every conflict, but you can keep them small:

- **Keep branches short-lived.** A branch that lives two days conflicts less than one that lives two weeks.
- **Bring in \`main\` often.** Merge or rebase \`main\` into your branch every day or so. Many small conflicts are easier than one big one.
- **Keep pull requests small.** Less code touched, fewer collisions.
- **Use a formatter.** If everyone runs Prettier, nobody "conflicts" over quotes and spacing.
- **Say what you're working on.** Two people rewriting the same file at once will conflict, every time.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'When does a merge conflict happen?',
          choices: ['Both sides changed the same lines differently since the merge base', 'Both sides changed the same file anywhere', 'The two branches have different numbers of commits'],
          answer: 0,
          explain: 'Changes to different lines of the same file merge automatically. Only overlapping, different edits need you.',
          why: { 1: 'Git merges different lines of the same file without asking.', 2: 'Commit counts do not matter. Only the content of the changes does.' },
        },
        {
          q: 'You are on `main` and ran `git merge feature`. Which side is between `<<<<<<< HEAD` and `=======`?',
          choices: ['`main`, the branch you are on', '`feature`, the branch you are merging in', 'The merge base'],
          answer: 0,
          explain: 'During a merge, HEAD is the branch you are on.',
          why: { 1: '`feature` is between `=======` and `>>>>>>> feature`.', 2: 'The base only shows up with `merge.conflictStyle` set to `diff3` or `zdiff3`, after `|||||||`.' },
        },
        {
          q: 'You edited the conflicted file. What tells git it is resolved?',
          choices: ['`git add` on the file', 'Saving the file', 'Deleting the marker lines'],
          answer: 0,
          explain: '`git add` marks a file as resolved. Git does not check the contents, so check them yourself.',
          why: { 1: 'Saving changes the working tree only. Git waits for `git add`.', 2: 'Git does not read the file to decide. It waits for `git add`.' },
        },
        {
          q: 'Halfway through a messy rebase you want everything back as it was. What do you run?',
          choices: ['`git rebase --abort`', '`git merge --abort`', '`git rebase --skip`'],
          answer: 0,
          explain: '`--abort` puts the branch back exactly where it was before `git rebase`.',
          why: { 1: 'You are in a rebase, not a merge.', 2: '`--skip` drops the current commit and keeps going.' },
        },
      ],
    },
  ],
};
