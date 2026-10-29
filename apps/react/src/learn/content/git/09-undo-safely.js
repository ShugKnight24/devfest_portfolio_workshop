// Git course · lesson 9. Step types: read, predict, check (see ../index.js).
export default {
  id: 'undo-safely',
  builds: ['git/what-git-stores', 'git/branches', 'git/rebasing', 'git/remotes'],
  title: 'Undoing things safely',
  goal: 'Pick the right undo for each situation (restore, amend, reset, revert, stash), know which ones rewrite history, and recover "lost" commits with the reflog.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'The one question to ask first',
      md: `
Git has many undo commands because there are many things to undo. Before picking one, ask:

> Has anyone else got this commit yet?

- **No** (it's only on your machine): you can **rewrite** history. Change or remove commits as if they never happened.
- **Yes** (you pushed it to a shared branch): **add** a new commit that undoes it. Never rewrite what others have (the golden rule from lesson 5).

The other thing to know is which of the three areas from lesson 1 you're undoing: the working tree, the staging area, or commits. Each command below works on a specific one.
`,
    },
    {
      type: 'read',
      title: 'restore: undo in the working tree and staging area',
      md: `
\`git restore\` works on files, before anything is committed.

| Command | Effect |
|---|---|
| \`git restore --staged app.js\` | unstage: take \`app.js\` out of the draft. Your edits stay in the file. |
| \`git restore app.js\` | discard: put \`app.js\` back to the staged (or last committed) version. |

The second one is **destructive**. Uncommitted edits were never saved in git, so there is no undo for this undo. Run \`git diff app.js\` first if you're unsure.

Older forms you'll see: \`git reset app.js\` for unstaging, and \`git checkout -- app.js\` for discarding. \`git restore\` arrived in git 2.23 to give these jobs a clear name.
`,
    },
    {
      type: 'predict',
      title: 'Unstage a file',
      md: 'You staged two files but only meant to commit `app.js`.',
      code: `git add app.js notes.txt
git restore --staged notes.txt
git status --short`,
      output: `M  app.js
?? notes.txt`,
      explain: `
\`--short\` prints two columns: the staging area on the left, the working tree on the right.

- \`M \` (left column): \`app.js\` is modified and staged.
- \`??\`: \`notes.txt\` is untracked again. It's new, so unstaging it leaves it untracked. The file itself is untouched.
`,
    },
    {
      type: 'read',
      title: 'amend: fix the last commit',
      md: `
Typo in the message, or forgot a file? Fix the **last** commit instead of adding "oops" commits:

~~~
# new message:
git commit --amend -m "feat(contact): add form fields"

# add a forgotten file, keep the message:
git add forgotten.js
git commit --amend --no-edit
~~~

\`--amend\` doesn't edit the commit. Commits never change. It makes a **new** commit with the same parent and moves the branch to it. New hash, so it **rewrites history**. Fine before pushing. After pushing, you'll need \`--force-with-lease\` (lesson 7), and only on a branch that's yours.
`,
    },
    {
      type: 'read',
      title: 'reset: move the branch back',
      md: `
\`git reset <commit>\` moves the current branch pointer to \`<commit>\`. The three modes decide how many of the three areas follow it:

| Mode | Branch moves | Staging area | Working tree | Use it to... |
|---|---|---|---|---|
| \`--soft\` | yes | kept | kept | redo commits: changes stay staged |
| \`--mixed\` (default) | yes | reset | kept | redo commits: changes stay, unstaged |
| \`--hard\` | yes | reset | **reset** | throw the commits and edits away |

~~~
before:              A---B---C  main

git reset HEAD~1:    A---B  main   (C's changes stay in your files)
~~~

\`HEAD~1\` means "one commit before HEAD". \`HEAD~3\` is three back.

All three rewrite history: \`C\` is no longer on \`main\`. Use reset only on commits you haven't shared.

\`--hard\` also wipes any uncommitted edits in your files, and those can't be recovered by any git command.
`,
    },
    {
      type: 'predict',
      title: 'Soft reset: undo the commit, keep the work',
      md: 'Your last commit (`C`, which changed `app.js`) was too big. You want to split it.',
      code: `git reset --soft HEAD~1
git status`,
      output: `On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   app.js`,
      explain: `
\`main\` moved back to \`B\`. Everything \`C\` changed is still there, already staged, as if you had just run \`git add\` but not \`git commit\`.

Now you can \`git restore --staged app.js\`, use \`git add -p\` to stage part of it, and commit in smaller pieces.

(If \`main\` had been pushed, status would also say your branch is behind \`origin/main\` by 1 commit. That's the reminder that you're rewriting something the server already has.)
`,
    },
    {
      type: 'predict',
      title: 'Hard reset',
      md: 'Your last commit `C` was a bad experiment. You want it gone.',
      code: `git reset --hard HEAD~1`,
      output: `HEAD is now at 9b0e5a1 docs: add install steps

A---B  main`,
      explain: `
The branch, staging area and files all went back to \`B\`. \`C\` no longer shows up in \`git log\`.

\`C\` isn't deleted yet, though. Like the old commits after a rebase (lesson 5), it's unreferenced, and the reflog can bring it back. That's step 10.
`,
    },
    {
      type: 'read',
      title: 'revert: undo with a new commit',
      md: `
On a shared branch you can't remove a commit, because others already have it. \`git revert\` instead adds a **new** commit that does the exact opposite:

~~~
before:                 A---B---C  main

git revert C:           A---B---C---R  main
~~~

\`R\` removes the lines \`C\` added and adds back the lines \`C\` removed. History only grows, so everyone can pull it normally. **Revert never rewrites history.**

This is the right tool when a merged change breaks production: revert it, push, and fix it properly in a new PR. It's also why small commits matter (lesson 8): you can revert one change without losing others.
`,
    },
    {
      type: 'predict',
      title: 'Revert the last commit',
      md: '`C` is `feat: add search` and it added a 4-line file. It is already pushed to `main`.',
      code: `git revert HEAD --no-edit`,
      output: `[main 1a2b3c4] Revert "feat: add search"
 1 file changed, 4 deletions(-)
 delete mode 100644 src/search.js`,
      explain: `
A new commit, \`1a2b3c4\`, deletes what \`C\` added. \`C\` itself is still in history, which is the point: anyone can see what happened and why.

\`--no-edit\` accepts the generated message. Without it, your editor opens so you can add the reason.

Push it with a plain \`git push\`. No force needed, because nothing was rewritten.
`,
    },
    {
      type: 'predict',
      title: 'reflog: find the "lost" commit',
      md: 'You regret the hard reset from step 7. The reflog lists every place HEAD has been, newest first.',
      code: `git reflog`,
      output: `9b0e5a1 (HEAD -> main) HEAD@{0}: reset: moving to HEAD~1
c41d2e7 HEAD@{1}: commit: feat: add contact section
9b0e5a1 (HEAD -> main) HEAD@{2}: commit: docs: add install steps
3f2a91c HEAD@{3}: commit (initial): docs: add readme`,
      explain: `
\`HEAD@{1}\` is where HEAD was one move ago: \`c41d2e7\`, the commit you reset away. To get it back:

~~~
git reset --hard c41d2e7          # move main back to it
# or, to keep main as it is:
git branch rescue c41d2e7         # put a new branch on it
~~~

The reflog is local (only on your machine) and keeps entries for a limited time (by default 30 days for commits no branch reaches anymore). It rescues lost **commits** from a bad reset, rebase or amend. It can't rescue edits you never committed.
`,
    },
    {
      type: 'read',
      title: 'stash: put work aside for a moment',
      md: `
You're halfway through something and need a clean working tree: to switch branches (lesson 2's "would be overwritten" error), or to pull.

| Command | Effect |
|---|---|
| \`git stash\` | save your uncommitted changes and clean the working tree |
| \`git stash -u\` | same, including untracked files |
| \`git stash list\` | show saved stashes |
| \`git stash pop\` | re-apply the newest stash and remove it from the list |

Plain \`git stash\` skips untracked (new) files. That's why a new file "didn't get stashed". Use \`-u\`.

Stashes are easy to forget. For anything longer than a few minutes, a commit on a branch is a safer place for work.
`,
    },
    {
      type: 'predict',
      title: 'Stash, switch, come back',
      md: 'You have uncommitted edits to `app.js` on `main` and need to check something on `feature`.',
      code: `git stash
git switch feature
# ... look around ...
git switch main
git stash pop`,
      output: `Saved working directory and index state WIP on main: 9b0e5a1 docs: add install steps
Switched to branch 'feature'
Switched to branch 'main'
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   app.js

no changes added to commit (use "git add" and/or "git commit -a")
Dropped refs/stash@{0} (5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f)`,
      explain: `
\`git stash\` labels the stash with the branch and commit you were on. \`git stash pop\` re-applies it, shows \`git status\`, then drops the stash.

If the pop hits a conflict (the files changed in the meantime), git keeps the stash in the list so nothing is lost. Resolve the conflict as in lesson 6, then \`git stash drop\`.
`,
    },
    {
      type: 'read',
      title: 'Decision table',
      md: `
| I want to... | Use | Rewrites history? |
|---|---|---|
| unstage a file | \`git restore --staged <file>\` | no |
| throw away uncommitted edits to a file | \`git restore <file>\` | no, but the edits are gone for good |
| fix the last commit's message or add a forgotten file | \`git commit --amend\` | yes |
| undo my last commits, keep the changes | \`git reset --soft HEAD~1\` (or \`--mixed\`) | yes |
| throw away my last commits completely | \`git reset --hard HEAD~1\` | yes |
| undo a commit that's already shared | \`git revert <commit>\` | **no** |
| get back a commit I reset or rebased away | \`git reflog\`, then \`git branch rescue <hash>\` | no |
| put work aside to switch branches | \`git stash\` / \`git stash pop\` | no |

The rule that covers almost every case: **rewrite only what is yours alone. Once it's shared, revert.**
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'A commit you pushed to `main` yesterday broke the build. Teammates have pulled since. What do you use?',
          choices: ['`git revert <commit>`', '`git reset --hard HEAD~1` and force-push', '`git commit --amend`'],
          answer: 0,
          explain: 'Revert adds a new commit that undoes the change. Nothing shared is rewritten, so everyone pulls normally.',
          why: { 1: 'Resetting a shared branch rewrites history everyone already has.', 2: 'Amend only touches your latest commit, and it also rewrites history.' },
        },
        {
          q: 'You committed too early and want the changes back as staged edits. Nothing is pushed.',
          choices: ['`git reset --soft HEAD~1`', '`git reset --hard HEAD~1`', '`git revert HEAD`'],
          answer: 0,
          explain: '`--soft` moves the branch back and leaves both the staging area and your files as they were.',
          why: { 1: '`--hard` also throws the changes away.', 2: 'Revert adds an opposite commit. Your history would have both.' },
        },
        {
          q: 'Which of these does NOT rewrite history?',
          choices: ['`git revert`', '`git commit --amend`', '`git reset --soft HEAD~1`'],
          answer: 0,
          explain: 'Revert only adds a commit. Amend and reset both replace or remove existing commits.',
          why: { 1: 'Amend makes a new commit in place of the last one, with a new hash.', 2: 'Reset moves the branch back, so commits drop out of its history.' },
        },
        {
          q: 'You ran `git reset --hard HEAD~2` by mistake. How do you get the commits back?',
          choices: ['Find the old hash in `git reflog`, then `git reset --hard <hash>`', 'They are gone; reset `--hard` deletes commits', '`git restore .`'],
          answer: 0,
          explain: 'The commits still exist. The reflog remembers where HEAD was before the reset.',
          why: { 1: 'Reset moves pointers. The commits stay until git cleans up unreferenced ones, weeks later.', 2: 'Restore works on files against the current commit, which is the wrong commit now.' },
        },
        {
          q: 'You ran `git stash`, but a new file you created is still there. Why?',
          choices: ['Plain `git stash` skips untracked files; use `git stash -u`', 'Stash only saves staged changes', 'The stash failed and nothing was saved'],
          answer: 0,
          explain: 'Untracked files are left alone unless you add `-u` (`--include-untracked`).',
          why: { 1: 'Stash saves staged and unstaged changes to tracked files.', 2: 'It worked for your tracked files. Check `git stash list`.' },
        },
      ],
    },
  ],
};
