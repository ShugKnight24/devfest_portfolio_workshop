// Git course · lesson 8. Step types: read, predict, check (see ../index.js).
export default {
  id: 'collaboration',
  builds: ['git/remotes', 'git/rebasing', 'git/conflicts'],
  title: 'Working on a team',
  goal: 'Run the feature-branch and pull-request workflow end to end, write Conventional Commit messages, and keep commits small enough to review.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The feature-branch workflow',
      md: `
Most teams work the same way, using everything from lessons 2 to 7:

1. \`main\` always works and can be deployed. Nobody commits to it directly.
2. For each change, make a short-lived branch from an up-to-date \`main\`.
3. Commit on the branch, in small steps.
4. Push it and open a **pull request** (PR; GitLab calls it a merge request).
5. Teammates review it and automated checks (CI) run the tests.
6. When it's approved and green, it's merged into \`main\` and the branch is deleted.

One branch per change, and one change per branch. "Fix login and also restyle the footer" is two branches.
`,
    },
    {
      type: 'predict',
      title: 'Start a change',
      md: 'Your local `main` is a few commits behind the server. Draw the result.',
      code: `git switch main
git pull
git switch -c feat/contact-form
# ... work, commit twice (X and Y) ...
git push -u origin feat/contact-form`,
      output: `A---B---C  main, origin/main
         \\
          X---Y  feat/contact-form, origin/feat/contact-form`,
      explain: `
\`git pull\` first, so the branch starts from the latest \`main\` (\`C\`). Branching from a stale \`main\` means conflicts later for no reason.

The branch name \`feat/contact-form\` is a common convention: a type, a slash, a short description. The slash is just a character in the name.

After the push, GitHub prints a link to open a pull request from this branch.
`,
    },
    {
      type: 'read',
      title: 'Conventional Commits',
      md: `
Many teams follow **Conventional Commits** for commit messages. The first line has this shape:

~~~
type(scope): summary
~~~

| Part | Rule | Example |
|---|---|---|
| type | what kind of change | \`feat\`, \`fix\`, \`docs\`, \`refactor\`, \`test\`, \`chore\`, \`perf\`, \`ci\`, \`build\`, \`style\` |
| scope | optional: which part of the code | \`(auth)\`, \`(api)\`, \`(header)\` |
| summary | imperative, lowercase, no period, short | \`add password reset\` |

~~~
feat(auth): add password reset
fix(api): return 404 for unknown project id
docs: explain local setup
refactor(header): extract nav links into a component
~~~

**Imperative** means it reads as a command: "add", not "added" or "adds". A handy test: "If applied, this commit will *add password reset*."

A breaking change gets a \`!\` after the type or scope, like \`feat(api)!: remove v1 endpoints\`, or a \`BREAKING CHANGE:\` line in the body.

Why bother: \`git log --oneline\` becomes readable, and tools can build changelogs and pick version numbers from it (\`fix\` is a patch, \`feat\` is a minor, \`!\` is a major).
`,
    },
    {
      type: 'read',
      title: 'Small commits',
      md: `
A good commit does **one thing**, and the project still works after it. That makes three jobs easy:

- **Review:** a reviewer can read one idea at a time.
- **Revert:** if one change breaks production, \`git revert\` undoes just that change (lesson 9).
- **Search:** \`git log\` and \`git blame\` explain why a line exists.

Bad and good versions of the same afternoon:

| Instead of | Write |
|---|---|
| \`update stuff\` | \`feat(contact): add form fields\` and \`feat(contact): validate email\` |
| \`fix\` | \`fix(contact): show error when email is empty\` |
| \`wip\`, \`wip\`, \`wip\` | squash them into one commit before review (lesson 5) |

\`git add -p\` (lesson 1) is the tool for splitting one messy working tree into several clean commits.
`,
    },
    {
      type: 'predict',
      title: 'Keep your branch current',
      md: 'While your PR waits, two commits (`D`, `E`) land on `main`. The branch is yours alone.',
      code: `git fetch
git rebase origin/main
git push --force-with-lease`,
      output: `A---B---C---D---E  origin/main
                 \\
                  X'---Y'  feat/contact-form, origin/feat/contact-form`,
      explain: `
\`git fetch\` updated \`origin/main\`. You don't need to update your local \`main\` first: rebase straight onto \`origin/main\`.

Rebasing your own PR branch is fine under the golden rule (lesson 5): only your commits are rewritten. The force-push needs \`--force-with-lease\` (lesson 7).

If teammates also push to this branch, merge instead: \`git merge origin/main\`. No rewrite, no force-push.
`,
    },
    {
      type: 'read',
      title: 'Pull requests and review',
      md: `
A **pull request** asks "please merge my branch into \`main\`". It shows the diff, the commits, review comments and the CI results in one place.

A good PR description answers:

- **What** changed, in a sentence or two.
- **Why**: the bug, ticket or goal.
- **How to check it**: steps to try it, or screenshots for UI.

Reviewing well:

- Comment on the code, not the person. Ask questions: "What happens if \`email\` is empty here?"
- Say which comments block merging and which are just suggestions.
- Small PRs get real reviews. A 2,000-line PR gets "looks good to me".

Responding to review: push new commits that address the comments. Reviewers can see exactly what changed since they last looked. Squash or rebase at the end if your team wants a tidy history.
`,
    },
    {
      type: 'read',
      title: 'The three merge buttons',
      md: `
GitHub offers three ways to merge a PR. Your repo settings decide which are allowed.

| Button | What lands on \`main\` |
|---|---|
| **Create a merge commit** | all your commits plus a merge commit (lesson 4, like \`--no-ff\`) |
| **Squash and merge** | one new commit containing all your changes |
| **Rebase and merge** | your commits replayed onto \`main\`, no merge commit (lesson 5) |

Squash and merge is popular: \`main\` gets one Conventional Commit per PR, however messy the branch was. The PR title often becomes that commit message, so write the title in the same format.

After the merge, clean up locally:

~~~
git switch main
git pull --prune
git branch -d feat/contact-form
~~~

\`--prune\` removes bookmarks like \`origin/feat/contact-form\` for branches that were deleted on the server (GitHub can delete the PR branch for you after merging).
`,
    },
    {
      type: 'predict',
      title: 'Deleting after a squash merge',
      md: 'The PR was merged with **Squash and merge**, and GitHub deleted the remote branch. You run the cleanup commands from the last step.',
      code: `git switch main
git pull --prune
git branch -d feat/contact-form`,
      output: `error: the branch 'feat/contact-form' is not fully merged
hint: If you are sure you want to delete it, run 'git branch -D feat/contact-form'`,
      explain: `
Squash and merge created a **new** commit on \`main\` with the same changes. Your original \`X\` and \`Y\` never became part of \`main\`'s history. \`-d\` checks whether the branch is merged into its upstream, or into the current branch when the upstream is gone. Neither contains \`X\` and \`Y\`, so it refuses.

Here it's safe: you know the PR was merged. Use \`git branch -D feat/contact-form\`.

The same thing happens after **Rebase and merge**, because the replayed commits have new hashes. Only a real merge commit lets \`-d\` see your commits on \`main\`.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'Which is a well-formed Conventional Commit message?',
          choices: ['`fix(auth): reject expired reset tokens`', '`Fixed the auth bug.`', '`fix: Rejected expired tokens and updated the header`'],
          answer: 0,
          explain: 'A type, an optional scope, a colon, then a short imperative summary of one change.',
          why: { 1: 'No type, past tense, and a period at the end.', 2: 'Past tense, and it describes two unrelated changes.' },
        },
        {
          q: 'You need to fix a login bug and restyle the footer. How many branches?',
          choices: ['Two, one per change', 'One, since both are small', 'None, commit to `main` and push'],
          answer: 0,
          explain: 'One change per branch keeps each PR easy to review and easy to revert.',
          why: { 1: 'Small or not, they are unrelated. Reviewers and reverts both work per PR.', 2: 'In the feature-branch workflow nobody commits to `main` directly.' },
        },
        {
          q: 'Your PR branch is only yours and `main` moved on. What keeps the branch current with a clean history?',
          choices: ['`git fetch`, `git rebase origin/main`, `git push --force-with-lease`', '`git rebase origin/main`, then `git pull`, then `git push`', '`git push --force` without fetching'],
          answer: 0,
          explain: 'Fetch to see the new `main`, replay your commits on it, then replace your branch on the server safely.',
          why: { 1: 'Pulling after a rebase merges the old commits back in.', 2: 'Without fetching, there is nothing new to rebase onto, and `--force` has no safety check.' },
        },
        {
          q: 'After a squash merge, why does `git branch -d` refuse to delete your branch?',
          choices: ['Your original commits are not in `main`\'s history; a new squashed commit is', 'The branch still exists on the server', 'You must delete branches on GitHub first'],
          answer: 0,
          explain: 'The squash commit has the same changes but different commits, so git cannot tell the work landed. `-D` is safe once you know it did.',
          why: { 1: '`-d` checks local history, not the server.', 2: 'Local and remote branches are deleted separately, in any order.' },
        },
      ],
    },
  ],
};
