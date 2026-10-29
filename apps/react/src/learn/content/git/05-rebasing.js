// Git course · lesson 5. Step types: read, predict, check (see ../index.js).
export default {
  id: 'rebasing',
  builds: ['git/merging', 'git/what-git-stores'],
  title: 'Rebasing: replaying commits',
  goal: 'Know what rebase rewrites and why the hashes change, read an interactive rebase todo list, follow the golden rule, and choose between merge and rebase.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Rebase moves your commits to a new base',
      md: `
Lesson 4 ended with diverged branches and two ways forward: a merge commit, or a rebase. Here's the rebase.

~~~
A---B---E  main
     \\
      C---D  feature
~~~

\`feature\` was built on \`B\`. \`git rebase main\` (run on \`feature\`) says: "take my commits and replay them as if I had started from \`main\`'s tip \`E\`."

Git does it one commit at a time:

1. Find the commits on \`feature\` that aren't on \`main\`: \`C\` and \`D\`.
2. Start from \`E\`.
3. Re-apply \`C\`'s changes on top, making a **new** commit \`C'\`. Then the same for \`D\`, making \`D'\`.
4. Move the \`feature\` pointer to \`D'\`.
`,
    },
    {
      type: 'predict',
      title: 'Draw the result',
      code: `git switch feature
git rebase main`,
      output: `Successfully rebased and updated refs/heads/feature.

A---B---E  main
         \\
          C'---D'  feature`,
      explain: `
\`C'\` and \`D'\` make the same changes as \`C\` and \`D\`, but they are **different commits** with **different hashes**.

Why? In lesson 1, a commit's hash covers its parent's hash. \`C\`'s parent was \`B\`. \`C'\`'s parent is \`E\`. Different parent, different commit. The same is true all the way down the branch.

That's what "rebase rewrites history" means. It doesn't edit commits, because commits can never change. It makes new ones and moves the branch name to them.
`,
    },
    {
      type: 'read',
      title: 'Where did C and D go?',
      md: `
They still exist, for now. No branch points at them anymore, so \`git log\` doesn't show them. Git keeps unreferenced commits for a few weeks by default before cleaning them up, and \`git reflog\` can find them (lesson 9).

After the rebase, the picture is effectively:

~~~
          C---D        (no branch: hidden, cleaned up later)
         /
A---B---E  main
         \\
          C'---D'  feature
~~~

This matters for the golden rule in step 7. If anyone else had \`C\` and \`D\`, they still have them.
`,
    },
    {
      type: 'predict',
      title: 'Now merge it',
      md: 'Continuing from step 2. You switch to `main` and merge.',
      code: `git switch main
git merge feature`,
      output: `Updating 4d5e6f7..b8c9d0e
Fast-forward
 src/search.js | 12 ++++++++++++
 1 file changed, 12 insertions(+)

A---B---E---C'---D'  main, feature`,
      explain: `
After the rebase, \`main\`'s tip \`E\` is the merge base, so the merge is a **fast-forward** (lesson 4). The result is one straight line with no merge commit.

That straight line is why people rebase: \`git log\` reads like a simple list of changes.
`,
    },
    {
      type: 'read',
      title: 'Interactive rebase: tidy your own commits',
      md: `
\`git rebase -i\` lets you edit a list of your recent commits before they're replayed. \`git rebase -i HEAD~3\` means "the last 3 commits". Git opens your editor with a **todo list**, oldest first:

~~~text
pick 5c6d7e8 feat: add search box
pick 7a8b9c0 wip
pick e7f3c20 fix typo in search box
~~~

Change the word at the start of a line to choose what happens to that commit:

| Word | Effect |
|---|---|
| \`pick\` | keep it as it is |
| \`reword\` | keep the changes, edit the message |
| \`edit\` | stop here so you can change the commit |
| \`squash\` | fold into the commit above, combine the messages |
| \`fixup\` | fold into the commit above, keep only the above message |
| \`drop\` | remove the commit |

You can also reorder lines to reorder commits. Save and close the editor, and git replays the list.

Use it on your **own, unpushed** commits to turn "wip, wip, fix typo" into one clean commit before review.
`,
    },
    {
      type: 'predict',
      title: 'Squash the noise',
      md: 'You change the todo list from step 5 to this, then save and close.',
      code: `pick 5c6d7e8 feat: add search box
fixup 7a8b9c0 wip
fixup e7f3c20 fix typo in search box`,
      output: `Successfully rebased and updated refs/heads/feature.

$ git log --oneline -1
3c4d5e6 (HEAD -> feature) feat: add search box`,
      explain: `
\`fixup\` folds each commit into the one above it and throws away its message. Three commits become one: all the changes, with the first message.

The hash is new (\`3c4d5e6\`), even though the first line was \`pick\`. The commit's content changed, so its hash did too.

If you'd used \`squash\` instead, git would open the editor again with all three messages so you could write a combined one.
`,
    },
    {
      type: 'read',
      title: 'The golden rule',
      md: `
> Never rebase commits that other people already have.

Here's what goes wrong. You push \`feature\` with \`C\` and \`D\`. A teammate pulls it and starts building on \`D\`. Then you rebase, so your \`feature\` is now \`C'\` and \`D'\`.

- Your push is rejected: the server's \`feature\` has \`D\`, and \`D'\` doesn't build on it. (Next step.)
- If you force the push, your teammate's work still sits on the old \`D\`. When they pull, git sees two copies of the same changes and they get duplicate commits or conflicts.

Rebasing is safe while the commits exist only on your machine, or on a branch that only you push to and everyone agrees is yours. Once others build on it, merge instead.

The common mistake is rebasing a **shared** branch like \`main\` onto something else. Rebasing your own feature branch **onto** \`main\` is fine. The commits that get rewritten are yours, not \`main\`'s.
`,
    },
    {
      type: 'predict',
      title: 'Pushing after a rebase',
      md: 'You had already pushed `feature` (with `C` and `D`). After `git rebase main` you push again.',
      code: `git push`,
      output: `To github.com:you/portfolio.git
 ! [rejected]        feature -> feature (non-fast-forward)
error: failed to push some refs to 'github.com:you/portfolio.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart.`,
      explain: `
The server only accepts a push that **fast-forwards** its branch. The server's \`feature\` ends at \`D\`. Your new \`D'\` doesn't have \`D\` in its history, so accepting it would drop \`C\` and \`D\`.

The hint suggests \`git pull\`. **Don't** do that here: it would merge the old \`C\` and \`D\` back in next to \`C'\` and \`D'\`, and you'd have every change twice.

If the branch is only yours, the right command is \`git push --force-with-lease\`. Lesson 7 explains why that flag, not \`--force\`.
`,
    },
    {
      type: 'read',
      title: 'Merge or rebase?',
      md: `
Both get your work onto \`main\`. They make different histories:

| | Merge | Rebase |
|---|---|---|
| History shape | true shape, with merge commits | one straight line |
| Rewrites commits? | no | yes, new hashes |
| Safe on shared branches? | yes | no (golden rule) |
| Conflicts | resolved once, in the merge commit | resolved per replayed commit |
| \`git log\` reads | busier | like a simple list |

A common team setup uses both:

- **Rebase** your own feature branch onto \`main\` to stay current and tidy up before review.
- **Merge** (or squash-merge) the pull request into \`main\`.

You can make \`git pull\` rebase instead of merge with \`git pull --rebase\`, or set it once with \`git config --global pull.rebase true\`. That keeps your local, unpushed commits on top of whatever came from the server.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'After `git rebase main`, why do your commits have new hashes?',
          choices: ['Each replayed commit has a new parent, and the parent is part of the hash', 'Rebase adds a timestamp to make them unique', 'Git renames commits when they move between branches'],
          answer: 0,
          explain: 'A commit\'s hash covers its parent. New parent, new commit, all the way down the branch.',
          why: { 1: 'The hash changes because the content (the parent) changed, not because of an added stamp.', 2: 'Commits never belong to a branch. Branches point at commits.' },
        },
        {
          q: 'Which is safe?',
          choices: ['Rebasing your unpushed feature branch onto `main`', 'Rebasing `main` after teammates have pulled it', 'Rebasing a shared release branch to tidy it up'],
          answer: 0,
          explain: 'Only your own commits get rewritten, and nobody else has them yet.',
          why: { 1: 'Teammates have the old `main` commits. Rewriting them breaks their history.', 2: 'Shared means others have the commits. That is exactly what the golden rule forbids.' },
        },
        {
          q: 'In an interactive rebase, which word folds a commit into the one above and drops its message?',
          choices: ['`fixup`', '`squash`', '`drop`'],
          answer: 0,
          explain: '`fixup` keeps the changes and the message of the commit above.',
          why: { 1: '`squash` also folds, but lets you combine the messages.', 2: '`drop` removes the commit and its changes.' },
        },
        {
          q: 'Your push is rejected right after you rebased your own feature branch. What do you run?',
          choices: ['`git push --force-with-lease`', '`git pull`, then push', '`git rebase --abort`'],
          answer: 0,
          explain: 'The rejection is expected after a rewrite. Force with lease replaces the server\'s branch, but only if nobody else pushed in the meantime.',
          why: { 1: 'Pulling merges the old commits back in, so every change appears twice.', 2: 'The rebase already finished. There is nothing to abort.' },
        },
      ],
    },
  ],
};
