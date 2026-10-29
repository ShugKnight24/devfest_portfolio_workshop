// Git course · lesson 7. Step types: read, predict, check (see ../index.js).
export default {
  id: 'remotes',
  builds: ['git/branches', 'git/merging', 'git/rebasing'],
  title: 'Remotes: clone, fetch, pull, push',
  goal: 'Know what origin and origin/main are, tell fetch from pull, set an upstream, and use --force-with-lease instead of --force.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'A remote is another copy',
      md: `
Everything so far happened on your machine. A **remote** is another copy of the same repository somewhere else, usually on GitHub or GitLab.

\`git clone\` copies a repository and remembers where it came from under the name **\`origin\`**. There's nothing special about that name. It's just the default.

Your clone also gets **remote-tracking branches** like \`origin/main\`. Read \`origin/main\` as "where \`main\` was on origin, **the last time I checked**". It's a bookmark you can't commit to. Only talking to the server moves it.

~~~
your machine                         GitHub
main         -> D                    main -> D
origin/main  -> D  (last checked)
~~~

The key idea of this lesson: \`origin/main\` and the server's real \`main\` can disagree, because the server doesn't tell you when it changes. You have to ask.
`,
    },
    {
      type: 'predict',
      title: 'What clone gives you',
      code: `git clone git@github.com:you/portfolio.git
cd portfolio
git branch -a`,
      output: `* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/main`,
      explain: `
\`-a\` shows all branches, including remote-tracking ones.

- \`main\` is your own local branch. Clone created it for you.
- \`remotes/origin/main\` is the bookmark. It's usually written \`origin/main\`.
- \`origin/HEAD -> origin/main\` records the server's default branch.

Your \`main\` **tracks** \`origin/main\`: it's set up as its **upstream**. That's how \`git status\`, \`git pull\` and \`git push\` know where to compare and send.
`,
    },
    {
      type: 'read',
      title: 'fetch vs pull',
      md: `
| Command | Does |
|---|---|
| \`git fetch\` | Download new commits from origin and move the \`origin/*\` bookmarks. **Never touches your branches or files.** |
| \`git pull\` | \`git fetch\`, then merge \`origin/main\` into your \`main\` (or rebase, if configured). |

After a teammate pushes \`E\` and \`F\`:

~~~
after git fetch:

A---B---C---D  main
             \\
              E---F  origin/main

after git pull (a fast-forward here):

A---B---C---D---E---F  main, origin/main
~~~

\`git fetch\` is always safe. Run it whenever you want to look before you change anything.
`,
    },
    {
      type: 'predict',
      title: 'Fetch, then status',
      md: 'A teammate pushed two commits to `main`. You have no new commits of your own.',
      code: `git fetch
git status`,
      output: `On branch main
Your branch is behind 'origin/main' by 2 commits, and can be fast-forwarded.
  (use "git pull" to update your local branch)

nothing to commit, working tree clean`,
      explain: `
\`git status\` compares \`main\` with its upstream \`origin/main\`. The fetch moved \`origin/main\` forward, so now status can tell you that you're behind.

The common surprise: **without** the fetch, status would happily say "Your branch is up to date with 'origin/main'". That only means "up to date with my last check". Fetch first.
`,
    },
    {
      type: 'predict',
      title: 'When both sides moved',
      md: 'This time you also made a commit locally before fetching.',
      code: `git fetch
git status`,
      output: `On branch main
Your branch and 'origin/main' have diverged,
and have 1 and 2 different commits each, respectively.
  (use "git pull" if you want to integrate the remote branch with yours)

nothing to commit, working tree clean`,
      explain: `
This is lesson 4's diverged case, with \`origin/main\` as the other branch: you have 1 commit it lacks, it has 2 you lack.

A plain \`git pull\` here has to choose between a merge commit and a rebase. Recent git versions refuse to guess and stop with "Need to specify how to reconcile divergent branches." Pick a default once:

~~~
git config --global pull.rebase true   # rebase (lesson 5)
git config --global pull.rebase false  # merge (lesson 4)
~~~

Rebasing is safe here: the commits being replayed are yours and unpushed.
`,
    },
    {
      type: 'read',
      title: 'push and upstream',
      md: `
\`git push\` sends your commits to the remote and moves the remote's branch to match yours.

A new branch has no upstream yet, so the first push says where to send it:

~~~
git push -u origin feature
~~~

\`-u\` (long form \`--set-upstream\`) records \`origin/feature\` as the upstream. After that, plain \`git push\` and \`git pull\` know what to do on this branch.

To see every branch's upstream and how far ahead or behind it is:

~~~
git branch -vv
~~~

~~~text
* feature 7d8e9f0 [origin/feature: ahead 1] feat: add search
  main    9b0e5a1 [origin/main] docs: add install steps
~~~

The server only accepts a push that **fast-forwards** its branch. If someone else pushed first, you're rejected and must fetch and integrate their work first.
`,
    },
    {
      type: 'predict',
      title: 'Pushing a new branch without -u',
      code: `git switch -c feature
# ... commit some work ...
git push`,
      output: `fatal: The current branch feature has no upstream branch.
To push the current branch and set the remote as upstream, use

    git push --set-upstream origin feature

To have this happen automatically for branches without a tracking
upstream, see 'push.autoSetupRemote' in 'git help config'.`,
      explain: `
Git won't guess where a new branch should go. Copy the suggested command, or set it once so the first push does it for you:

~~~
git config --global push.autoSetupRemote true
~~~
`,
    },
    {
      type: 'read',
      title: '--force vs --force-with-lease',
      md: `
After a rebase (lesson 5), a normal push is rejected because your branch no longer fast-forwards the server's. You need to **replace** the server's branch.

| Command | Replaces the server's branch... |
|---|---|
| \`git push --force\` | always, whatever is there now |
| \`git push --force-with-lease\` | only if it's still where your \`origin/feature\` says it was |

\`--force\` is dangerous on any branch someone else might push to. If a teammate pushed a commit a minute ago, \`--force\` deletes it from the server without a word.

\`--force-with-lease\` checks first: "is the server's \`feature\` still at the commit I last fetched?" If someone pushed since, it refuses, and you fetch and look before deciding.

One gap: if something runs \`git fetch\` in the background (some editors do), your \`origin/feature\` is updated without you looking, and the lease passes anyway. Adding \`--force-if-includes\` closes that gap. And never force-push \`main\` or any branch others share.
`,
    },
    {
      type: 'predict',
      title: 'The lease saves a teammate\'s commit',
      md: 'You rebased `feature`. Meanwhile a teammate pushed one commit to `origin/feature`, and you have not fetched.',
      code: `git push --force-with-lease`,
      output: `To github.com:you/portfolio.git
 ! [rejected]        feature -> feature (stale info)
error: failed to push some refs to 'github.com:you/portfolio.git'`,
      explain: `
\`stale info\` means: "the server's branch isn't where you think it is." Nothing was overwritten.

Now \`git fetch\`, look at the new commit with \`git log origin/feature\`, and bring it into your branch (for example \`git rebase origin/feature\`) before pushing again. With plain \`--force\`, that commit would be gone from the server.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'What is `origin/main`?',
          choices: ['Your record of where `main` was on origin at your last fetch', 'The live `main` branch on the server', 'A local branch you commit to before pushing'],
          answer: 0,
          explain: 'It is a remote-tracking branch: a bookmark that only moves when you fetch, pull or push.',
          why: { 1: 'It is not live. The server can move on without you knowing.', 2: 'You cannot commit to it. Your local `main` is where you commit.' },
        },
        {
          q: 'What does `git fetch` change?',
          choices: ['Only the `origin/*` remote-tracking branches', 'Your current branch and working files', 'The branches on the server'],
          answer: 0,
          explain: 'Fetch downloads and updates bookmarks. Your branches and files are untouched, which is why it is always safe.',
          why: { 1: 'That is `git pull`, which is fetch plus merge or rebase.', 2: 'Fetch only reads from the server. `git push` changes the server.' },
        },
        {
          q: '`git status` says "Your branch is up to date with \'origin/main\'". What does that guarantee?',
          choices: ['Your `main` matches `origin/main` as of your last fetch', 'Nobody has pushed to the server since you cloned', 'Your `main` matches the server right now'],
          answer: 0,
          explain: 'Status compares against the bookmark. Run `git fetch` first to compare against the server as it is now.',
          why: { 1: 'Status does not contact the server.', 2: 'Only true if you fetched just now.' },
        },
        {
          q: 'You rebased your own feature branch and need to push it. Which command?',
          choices: ['`git push --force-with-lease`', '`git push --force`', '`git pull` and then `git push`'],
          answer: 0,
          explain: 'It replaces the server\'s branch only if nobody pushed since your last fetch.',
          why: { 1: '`--force` would silently delete a teammate\'s new commit.', 2: 'Pulling merges the old, pre-rebase commits back in.' },
        },
      ],
    },
  ],
};
