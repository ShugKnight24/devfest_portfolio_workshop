// DSA course · lesson 10. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
// The package installer question, taught the graph way: leaves, waitingOn, dependents (Kahn's algorithm).
const PKGS = `const packages = { app: ["react", "lodash"], react: ["scheduler"], lodash: [], scheduler: [] };`;
const DIAMOND = `const diamond = { app: ["ui", "api"], ui: ["core"], api: ["core"], core: [] };`;
const CYCLIC = `const cyclic = { a: ["b"], b: ["c"], c: ["a"], d: [] };`;
// a valid order puts every package after all of its deps
const VALID = `function checkOrder(pk, order) {
  eq(order.length, Object.keys(pk).length, "number of packages in the order");
  for (const name of Object.keys(pk)) {
    for (const dep of pk[name]) {
      assert(order.indexOf(dep) < order.indexOf(name), dep + " must come before " + name + " (got " + order.join(", ") + ")");
    }
  }
}`;

const SETUP = `  const names = Object.keys(packages);

  // how many deps each package still waits on, and who depends on whom
  const waitingOn = {};
  const dependents = {};
  for (const name of names) {
    waitingOn[name] = packages[name].length;
    dependents[name] = [];
  }
  for (const name of names) {
    for (const dep of packages[name]) {
      dependents[dep].push(name); // dep is needed by name
    }
  }`;

const LOOP = `  // start with the leaves: packages that need nothing
  const ready = names.filter((name) => waitingOn[name] === 0);
  const order = [];

  // install a leaf, then unlock whatever was waiting on it
  while (ready.length > 0) {
    const name = ready.shift();
    order.push(name);
    for (const parent of dependents[name]) {
      waitingOn[parent]--;
      if (waitingOn[parent] === 0) ready.push(parent);
    }
  }`;

export default {
  id: 'topological-sort',
  builds: ['dsa/graphs', 'dsa/stacks-and-queues', 'dsa/hash-maps-and-sets'],
  title: 'Topological sort: install the leaves first',
  goal: 'Order things that depend on each other with Kahn\'s algorithm (leaves, waitingOn, dependents), detect cycles, and group the order into install stages.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'The package installer question',
      md: `
This is a real interview question, and the lesson is built around it:

> Given \`{ app: ["react", "lodash"], react: ["scheduler"], lodash: [], scheduler: [] }\`, return an order to install everything so each package comes after what it needs. Throw if that's impossible.

The interviewer's feedback on a loop-based answer was: **move from loops to graphs and leaves.** That's what this lesson does.

The \`packages\` object already **is** a directed graph (lesson 9). Each key is a node, and its array lists the arrows going out of it.

~~~
        app                 arrow = "needs"
       /   \\
      v     v
   react   lodash      <- lodash needs nothing: a LEAF
     |
     v
  scheduler            <- needs nothing: a LEAF
~~~

| Word | Meaning here |
|---|---|
| **leaf** | a package that needs nothing (an empty array). It can be installed **right now** |
| **waitingOn** | how many deps a package still needs. Leaves have 0. The textbook name is *in-degree* |
| **dependents** | the arrows flipped: who needs **me**. \`react\`'s dependents are \`["app"]\` |
| **cycle** | arrows that loop back: a → b → c → a. Nothing in a loop can ever start |
| **topological sort** | any order where every package comes after everything it needs |

**How to spot it:** *depends on*, *prerequisites*, *must happen before*, *build order*, *course schedule*. Say: "This is a dependency graph. I want a topological sort."
`,
    },
    {
      type: 'read',
      title: 'The brute force: loop until nothing changes',
      md: `
The first instinct, "look for empty dep arrays first", is right. As a loop: keep passing over the packages, installing any whose deps are all installed. If a whole pass installs nothing, the rest are stuck in a cycle.

~~~js
${PKGS}

function getInstallOrderLoop(packages) {
  const installed = new Set();
  const order = [];
  const names = Object.keys(packages);

  while (order.length < names.length) {
    let installedThisPass = 0;
    for (const name of names) {
      if (installed.has(name)) continue;
      // ready when every dependency is already installed
      if (packages[name].every((dep) => installed.has(dep))) {
        installed.add(name);
        order.push(name);
        installedThisPass++;
      }
    }
    // a full pass with no progress means the rest are stuck in a cycle
    if (installedThisPass === 0) throw new Error("Cycle detected");
  }
  return order;
}

console.log(getInstallOrderLoop(packages));
~~~

It's correct, and a fine first answer. **Its weakness:** every pass re-scans every package. A long chain (a needs b, b needs c, ...) installs only one package per pass, so n packages can take n passes of n checks: **O(n²)**.

The graph version does the same thing without re-scanning. When a package finishes, it knows **exactly** which packages just got closer to ready.
`,
    },
    {
      type: 'read',
      title: 'Kahn\'s algorithm, step 1: two lookups',
      md: `
Build two lookups once, before installing anything:

- \`waitingOn\`: how many deps each package still needs. \`app\` starts at 2.
- \`dependents\`: the arrows flipped. \`dependents.scheduler\` is \`["react"]\`.

You need the flipped arrows because when \`scheduler\` finishes, you want to jump straight to the packages it unlocks.

~~~js
${PKGS}

const names = Object.keys(packages);
const waitingOn = {};
const dependents = {};
for (const name of names) {
  waitingOn[name] = packages[name].length;
  dependents[name] = [];
}
for (const name of names) {
  for (const dep of packages[name]) {
    dependents[dep].push(name); // dep is needed by name
  }
}

console.log(waitingOn);
console.log(dependents);
~~~

\`Object.keys\` gives the names: you can't \`for...of\` over a plain object directly. Building both takes one pass over packages and one over their deps: **O(V + E)**.
`,
    },
    {
      type: 'predict',
      title: 'Lookups for a diamond',
      md: '`app` needs `ui` and `api`. Both of those need `core`.',
      code: `${DIAMOND}

const waitingOn = {};
const dependents = {};
for (const name of Object.keys(diamond)) {
  waitingOn[name] = diamond[name].length;
  dependents[name] = [];
}
for (const name of Object.keys(diamond)) {
  for (const dep of diamond[name]) dependents[dep].push(name);
}

console.log(waitingOn.app, waitingOn.core);
console.log(dependents.core);`,
      output: `2 0
[ "ui", "api" ]`,
      explain: `
\`app\` lists two deps, so it waits on 2. \`core\` lists none: it's the only leaf.

\`core\` appears in **two** dep arrays, so it has two dependents. When \`core\` installs, both \`ui\` and \`api\` drop to 0 and become new leaves.

If you said \`dependents.core\` is \`[]\`, you read the arrows the original way. \`dependents\` is "who needs me", the flipped direction.
`,
    },
    {
      type: 'read',
      title: 'Step 2: install a leaf, unlock its dependents',
      md: `
Start a \`ready\` list with the leaves. Then repeat: take one ready package, add it to the order, and tell each of its dependents "one fewer to wait for". Any dependent that reaches 0 has just become a leaf, so it joins \`ready\`.

~~~
while ready isn't empty:
  take a name from the front of ready
  push it onto order
  for each parent in dependents[name]:
    waitingOn[parent]--
    if waitingOn[parent] is 0: push parent onto ready
~~~

For the example, \`ready\` starts as \`[lodash, scheduler]\`:

| take | order so far | effect | ready after |
|---|---|---|---|
| lodash | lodash | app 2 → 1 | scheduler |
| scheduler | + scheduler | react 1 → **0** | react |
| react | + react | app 1 → **0** | app |
| app | + app | (none) | (empty) |

\`ready\` is the **queue** from lesson 5. The loop always ends: each package enters \`ready\` at most once, and each arrow is followed once. That's **O(V + E)** overall, against O(n²) for the loop version.
`,
    },
    {
      type: 'task',
      title: 'getInstallOrder',
      md: `
The starter builds \`names\`, \`waitingOn\` and \`dependents\` for you. Write the rest:

1. \`const ready = \` the names whose \`waitingOn\` is 0 (a \`filter\`).
2. \`const order = []\`.
3. The \`while\` loop from the last step.
4. \`return order\`.

~~~
getInstallOrder(packages)   → ["lodash", "scheduler", "react", "app"]
getInstallOrder({})         → []
~~~

Don't worry about cycles yet; that's the next step.
`,
      starter: `function getInstallOrder(packages) {
${SETUP}

  // your code here
}
`,
      tests: [
        { name: 'the example gives lodash, scheduler, react, app', code: `${PKGS}\neq(getInstallOrder(packages), ["lodash", "scheduler", "react", "app"]);` },
        { name: 'in a diamond, every package comes after its deps', code: `${DIAMOND}\n${VALID}\ncheckOrder(diamond, getInstallOrder(diamond));` },
        { name: 'an empty object gives []', code: `eq(getInstallOrder({}), []);` },
      ],
      hint: '`const ready = names.filter((name) => waitingOn[name] === 0);` Then `while (ready.length > 0)`, take `ready.shift()`, push it to `order`, and loop over `dependents[name]` lowering `waitingOn[parent]`.',
      solution: `function getInstallOrder(packages) {
${SETUP}

${LOOP}

  return order;
}
`,
    },
    {
      type: 'predict',
      title: 'What happens with a cycle?',
      md: '`a` needs `b`, `b` needs `c`, `c` needs `a`. `d` needs nothing. This is your function from the last step, with no cycle check.',
      code: `${CYCLIC}

function getInstallOrder(packages) {
${SETUP}

${LOOP}

  return order;
}

console.log(getInstallOrder(cyclic));`,
      output: `[ "d" ]`,
      explain: `
Only \`d\` is a leaf. \`a\`, \`b\` and \`c\` each wait on 1, and the thing each one waits on is another member of the loop. None of them ever reaches 0, so they never enter \`ready\`.

The loop doesn't hang. It just **stops early** and returns fewer packages than went in. That's the whole cycle check: compare the lengths.

If you expected an infinite loop, that's the \`while (true)\` instinct. Kahn's loop runs only while something is ready, so it always ends.
`,
    },
    {
      type: 'task',
      title: 'Throw on a cycle',
      md: `
Add **one line** before \`return order\`: if \`order\` has fewer packages than \`names\`, throw \`new Error("Cycle detected")\`.

~~~
getInstallOrder({ a: ["b"], b: ["a"] })   → throws Error("Cycle detected")
getInstallOrder(packages)                 → still ["lodash", "scheduler", "react", "app"]
~~~
`,
      starter: `function getInstallOrder(packages) {
${SETUP}

${LOOP}

  return order;
}
`,
      tests: [
        { name: 'throws on a cycle', code: `${CYCLIC}\nlet msg = "did not throw";\ntry { getInstallOrder(cyclic); } catch (e) { msg = e.message; }\neq(msg, "Cycle detected");` },
        { name: 'a two-package loop also throws', code: `throws(() => getInstallOrder({ a: ["b"], b: ["a"] }));` },
        { name: 'the example still works', code: `${PKGS}\neq(getInstallOrder(packages), ["lodash", "scheduler", "react", "app"]);` },
      ],
      hint: '`if (order.length !== names.length) throw new Error("Cycle detected");`',
      solution: `function getInstallOrder(packages) {
${SETUP}

${LOOP}

  // anyone left never reached 0: they're waiting on each other
  if (order.length !== names.length) throw new Error("Cycle detected");
  return order;
}
`,
      explain: 'What to say in the interview: "This is a dependency graph, so I want a topological sort. I count how many deps each package waits on, start with the leaves, and each install unlocks its dependents. If anything is left at the end, it\'s a cycle. It\'s linear in packages plus dependencies."',
    },
    {
      type: 'read',
      title: 'Part 2: install stages, the same idea in waves',
      md: `
The follow-up: group packages into **stages**. Everything in a stage can install at the same time, once earlier stages are done. Use as few stages as possible.

~~~
stage 1: [lodash, scheduler]   both need nothing
stage 2: [react]               scheduler is done
stage 3: [app]                 react and lodash are done
~~~

It's the same algorithm. Instead of taking leaves **one at a time**, take **all current leaves together**: that group is a stage. Collect everything they unlock into a \`next\` list, which becomes the following stage.

It's the level-by-level BFS from the trees lesson, where "level" means "stage".

~~~
let stage = the leaves
while stage isn't empty:
  stages.push(stage)
  next = []
  for each name in stage:
    for each parent in dependents[name]:
      waitingOn[parent]--
      if it hit 0: next.push(parent)
  stage = next
~~~

**Why it's the fewest stages:** a package lands in the first wave where all its deps are done. It can't go earlier, because something it needs would still be missing.
`,
    },
    {
      type: 'task',
      title: 'getInstallStages',
      md: `
\`getInstallStages(packages)\` returns an array of stages, each an array of names.

~~~
getInstallStages(packages)   → [["lodash", "scheduler"], ["react"], ["app"]]
getInstallStages({})         → []
~~~

Throw \`new Error("Cycle detected")\` if fewer packages were placed than there are names. Keep a \`placed\` counter, adding \`stage.length\` each round.
`,
      starter: `function getInstallStages(packages) {
${SETUP}

  const stages = [];
  let stage = names.filter((name) => waitingOn[name] === 0);
  let placed = 0;

  // your code here

  return stages;
}
`,
      tests: [
        { name: 'the example gives [[lodash, scheduler], [react], [app]]', code: `${PKGS}\neq(getInstallStages(packages), [["lodash", "scheduler"], ["react"], ["app"]]);` },
        { name: 'a diamond gives 3 stages with ui and api together', code: `${DIAMOND}\nconst s = getInstallStages(diamond);\neq(s.length, 3, "number of stages");\neq(s[0], ["core"]);\neq([...s[1]].sort(), ["api", "ui"]);\neq(s[2], ["app"]);` },
        { name: 'throws on a cycle', code: `${CYCLIC}\nthrows(() => getInstallStages(cyclic));` },
        { name: 'an empty object gives []', code: `eq(getInstallStages({}), []);` },
      ],
      hint: '`while (stage.length > 0) { stages.push(stage); placed += stage.length; const next = []; ... stage = next; }`. Inside, loop over each name in `stage` and each parent in `dependents[name]`. After the while: the cycle check.',
      solution: `function getInstallStages(packages) {
${SETUP}

  const stages = [];
  let stage = names.filter((name) => waitingOn[name] === 0);
  let placed = 0;

  while (stage.length > 0) {
    stages.push(stage);
    placed += stage.length;
    const next = []; // everything this stage unlocks
    for (const name of stage) {
      for (const parent of dependents[name]) {
        waitingOn[parent]--;
        if (waitingOn[parent] === 0) next.push(parent);
      }
    }
    stage = next;
  }

  if (placed !== names.length) throw new Error("Cycle detected");
  return stages;
}
`,
      explain: 'What to say: "Same algorithm as Part 1, but I process the ready list in waves. Each wave is a stage, and whatever a wave unlocks becomes the next wave."',
    },
    {
      type: 'read',
      title: 'The other way: DFS with three states',
      md: `
Some interviewers expect DFS for graphs, so know this version exists. The idea: **to install a package, first install everything it needs (recursion), then install it.**

Cycle detection needs three states: *not seen*, *visiting* (on the path you're exploring right now) and *done*. Reaching a package that's still *visiting* means you walked in a circle.

~~~js
${PKGS}

function getInstallOrderDFS(packages) {
  const order = [];
  const state = {}; // missing = not seen, "visiting", or "done"

  function visit(name) {
    if (state[name] === "done") return;
    if (state[name] === "visiting") throw new Error("Cycle detected at " + name);
    state[name] = "visiting";
    for (const dep of packages[name]) visit(dep); // what I need first
    state[name] = "done";
    order.push(name);                             // then me
  }

  for (const name of Object.keys(packages)) visit(name);
  return order;
}

console.log(getInstallOrderDFS(packages));
~~~

A different order from Kahn's, and also valid: a graph can have many topological orders.

**Kahn vs DFS:** Kahn peels leaves from the outside in, and it's what you need for stages and parallel installs. DFS dives to the bottom first and is short for a plain order. Both are **O(V + E)**.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'In Kahn\'s algorithm, which packages go into `ready` at the start?',
          choices: ['The leaves: `waitingOn` is 0', 'Packages nobody depends on, like `app`', 'Every package, in key order'],
          answer: 0,
          explain: 'A package with nothing to wait for can be installed right now.',
          why: { 1: '`app` is the **last** thing you can install: it waits on everything else.', 2: 'Then you\'d install `app` before `react`.' },
        },
        {
          q: 'Why build `dependents` (the flipped arrows) at all?',
          choices: ['So a finished package can jump straight to the packages it unlocks', 'Because `packages` can\'t be read with `Object.keys`', 'To sort the output alphabetically'],
          answer: 0,
          explain: 'Without it you\'d re-scan every package after each install, which is the O(n²) loop version.',
          why: { 1: '`Object.keys(packages)` works fine.', 2: 'Order inside the result has nothing to do with it.' },
        },
        {
          q: 'How does Kahn\'s algorithm detect a cycle?',
          choices: ['Fewer packages come out than went in', 'The while loop never ends', 'A package\'s `waitingOn` goes below 0'],
          answer: 0,
          explain: 'Packages in a loop never reach 0, so they never enter `ready` and never reach the order.',
          why: { 1: 'The loop only runs while something is ready, so it always stops.', 2: 'Counts only drop when a real dependency finishes, so they never go negative.' },
        },
        {
          q: 'What is the time cost of Kahn\'s algorithm for V packages and E dependency arrows?',
          choices: ['O(V + E)', 'O(V²)', 'O(V log V)'],
          answer: 0,
          explain: 'Each package enters `ready` once and each arrow is followed once.',
          why: { 1: 'That\'s the re-scanning loop version.', 2: 'There\'s no sorting or halving involved.' },
        },
        {
          q: 'The question becomes "which packages can install **in parallel**?". What changes?',
          choices: ['Take all current leaves at once as a stage, and their unlocks become the next stage', 'Switch to DFS', 'Nothing: the plain order already shows it'],
          answer: 0,
          explain: 'Same lookups, same counts. You process the ready list in waves instead of one at a time.',
          why: { 1: 'DFS dives deep first, which is the wrong shape for waves.', 2: 'A flat order doesn\'t say which neighbors could have run together.' },
        },
      ],
    },
  ],
};
