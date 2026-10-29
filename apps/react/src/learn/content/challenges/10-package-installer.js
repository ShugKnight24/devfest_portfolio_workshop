// Challenges · lesson 10: the finale. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
// The three parts build on each other, so finished earlier parts are shared below and reused in later starters.

const BUILD_GRAPH = `function buildGraph(packages) {
  const waitingOn = {};   // name -> how many deps it still needs
  const dependents = {};  // name -> the packages that need it (arrows flipped)
  for (const name of Object.keys(packages)) {
    waitingOn[name] = packages[name].length;
    dependents[name] = [];
  }
  for (const name of Object.keys(packages)) {
    for (const dep of packages[name]) {
      dependents[dep].push(name);   // dep is needed by name
    }
  }
  return { waitingOn, dependents };
}`;

const PART1 = `function getInstallOrder(packages) {
  const { waitingOn, dependents } = buildGraph(packages);
  const names = Object.keys(packages);
  const ready = names.filter((name) => waitingOn[name] === 0);   // the leaves
  const order = [];

  while (ready.length > 0) {
    const name = ready.shift();
    order.push(name);
    for (const parent of dependents[name]) {
      waitingOn[parent]--;                         // one fewer to wait for
      if (waitingOn[parent] === 0) ready.push(parent);
    }
  }

  if (order.length !== names.length) throw new Error("Cycle detected");
  return order;
}`;

const PKGS = `const packages = { app: ["react", "lodash"], react: ["scheduler"], lodash: [], scheduler: [] };`;
const CYCLIC = `const cyclic = { a: ["b"], b: ["c"], c: ["a"], d: [] };`;
const DIAMOND = `const diamond = { app: ["ui", "api"], ui: ["core"], api: ["core"], core: [] };`;

// a fake installer for Part 3 tests: records start/done and how many ran at once
const RUN_SETUP = `const log = [];
let inFlight = 0, most = 0;
const delays = { lodash: 60, scheduler: 10, react: 10, app: 10 };
const install = async (name) => {
  log.push("start " + name);
  inFlight++; most = Math.max(most, inFlight);
  await sleep(delays[name] || 5);
  inFlight--;
  log.push("done " + name);
};`;

const PART3_TOP = `function installAll(packages, install, limit) {
  const { waitingOn, dependents } = buildGraph(packages);
  const names = Object.keys(packages);

  return new Promise((resolve, reject) => {
    try {
      getInstallOrder(packages);       // Part 1 throws on a cycle: fail before installing anything
    } catch (err) {
      reject(err);
      return;
    }
    if (names.length === 0) {
      resolve([]);
      return;
    }

    const ready = names.filter((name) => waitingOn[name] === 0);
    const finished = [];
    let running = 0;
    let failed = false;

    function startMore() {
      while (!failed && running < limit && ready.length > 0) {
        const name = ready.shift();
        running++;
        install(name).then(
          () => {`;

const PART3_BOTTOM = `          },
          (err) => {
            failed = true;             // stop starting new installs
            reject(err);
          }
        );
      }
    }

    startMore();
  });
}`;

const PART3_SUCCESS = `
            running--;
            finished.push(name);
            for (const parent of dependents[name]) {
              waitingOn[parent]--;
              if (waitingOn[parent] === 0) ready.push(parent);
            }
            if (finished.length === names.length) resolve(finished);
            else startMore();              // a slot is free: fill it`;

export default {
  id: 'package-installer',
  builds: ['challenges/promise-pool', 'challenges/group-and-count', 'challenges/valid-parentheses', 'dsa/topological-sort'],
  title: 'The package installer: a 3-part interview',
  goal: 'Solve a real three-part interview question: an install order (topological sort), install stages, then real async installs with a concurrency limit.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'The question',
      md: `
This is a real interview question, asked in three parts that build on each other. Part 1:

> "You're writing a package manager. Each package lists the packages it needs. Return an order to install everything, so every package comes **after** the packages it needs. If that's impossible, throw."

~~~
getInstallOrder({
  app: ["react", "lodash"],
  react: ["scheduler"],
  lodash: [],
  scheduler: [],
})
→ ["lodash", "scheduler", "react", "app"]
~~~

Part 2 will ask for install **stages** (what can install at the same time), and Part 3 for **real async installs, at most N at a time**.

Everything from this track shows up: lookup tables (lesson 1), a to-do list you take from and add to (lessons 3 and 6), and the limited pool (lesson 6). Interviewers are watching **how you split it up**, so this lesson splits it into four small tasks.
`,
    },
    {
      type: 'check',
      title: 'Before you code: ask and spot',
      items: [
        {
          q: 'What is the strongest hint about what kind of problem this is?',
          choices: [
            '"comes after the packages it needs": things with arrows between them are a graph, and a valid order is a topological sort',
            '"return an array": it\'s an array problem',
            '"packages": it\'s a string problem',
          ],
          answer: 0,
          explain: 'Saying "this is a dependency graph, I want a topological sort" in the first minute is a big signal, even before you write anything.',
          why: {
            1: 'The output is an array, but the structure is a graph.',
            2: 'The names are strings, but the work is about the arrows.',
          },
        },
        {
          q: 'When is an install order impossible?',
          choices: [
            'When packages need each other in a circle, like a → b → c → a',
            'When a package has no dependencies',
            'When two packages need the same dependency',
          ],
          answer: 0,
          explain: 'A cycle means each package waits on another in the circle, so none can go first. That\'s what "throw" is for.',
          why: {
            1: 'Those are the easy ones: they can go first.',
            2: 'Shared dependencies (a "diamond") are fine: install it once, before both.',
          },
        },
        {
          q: 'Which clarifying question is worth asking about the input?',
          choices: [
            '"Can a dependency be missing from the keys, like `{ app: ["left-pad"] }`?"',
            '"Are package names lowercase?"',
            '"Is the object sorted?"',
          ],
          answer: 0,
          explain: 'In this lesson every dependency is also a key. If not, you\'d add the missing ones as packages with no deps. Asking shows you\'re reading the input carefully.',
          why: {
            1: 'Case doesn\'t change the algorithm.',
            2: 'Object keys have an order, but nothing in the problem depends on it.',
          },
        },
      ],
    },
    {
      type: 'read',
      title: 'The slow way first',
      md: `
Picture it as a graph: packages are dots, and an arrow means "needs". **Leaves** are packages that need nothing.

~~~
        app
       /   \\
   react   lodash   ← leaf
     |
  scheduler         ← leaf
~~~

**Brute force:** over and over, scan for any package not yet installed whose deps are all installed. Install it. If a scan finds nothing but packages are left, it's a cycle.

~~~js
function installOrderSlow(packages) {
  const names = Object.keys(packages);
  const installed = new Set();
  const order = [];
  while (order.length < names.length) {
    const next = names.find((n) => !installed.has(n) && packages[n].every((d) => installed.has(d)));
    if (next === undefined) throw new Error("Cycle detected");
    installed.add(next);
    order.push(next);
  }
  return order;
}

console.log(installOrderSlow({ app: ["react", "lodash"], react: ["scheduler"], lodash: [], scheduler: [] }));
~~~

Correct, and a fine thing to say first. But each install rescans every package, so it's about **O(n²)**.

**The faster idea (Kahn's algorithm):** don't rescan. Keep a **count** of what each package is still waiting on. When a package installs, go **straight to** the packages that need it and lower their counts. Whoever hits 0 is ready. For that you need two lookups, built once. That's the first task.
`,
    },
    {
      type: 'task',
      title: 'Step 1: build the two lookups',
      md: `
Write \`buildGraph(packages)\`. It returns \`{ waitingOn, dependents }\`:

- \`waitingOn[name]\`: how many deps \`name\` needs. That's \`packages[name].length\`.
- \`dependents[name]\`: who needs \`name\`. The arrows **flipped**: if app needs react, then \`dependents.react\` includes \`"app"\`.

~~~
buildGraph({ app: ["react"], react: [] })
→ { waitingOn:  { app: 1, react: 0 },
    dependents: { app: [], react: ["app"] } }
~~~

Two loops: the first sets every package's count and an empty array; the second fills the arrays.
`,
      starter: `function buildGraph(packages) {
  const waitingOn = {};
  const dependents = {};
  // your code here
  return { waitingOn, dependents };
}
`,
      tests: [
        {
          name: 'counts how many deps each package needs',
          code: `${PKGS}\neq(buildGraph(packages).waitingOn, { app: 2, react: 1, lodash: 0, scheduler: 0 });`,
        },
        {
          name: 'flips the arrows into dependents',
          code: `${PKGS}\neq(buildGraph(packages).dependents, { app: [], react: ["app"], lodash: ["app"], scheduler: ["react"] });`,
        },
        {
          name: 'a shared dependency lists everyone who needs it',
          code: `${DIAMOND}\neq(buildGraph(diamond).dependents.core, ["ui", "api"]);`,
        },
      ],
      hint: 'Loop 1: `for (const name of Object.keys(packages)) { waitingOn[name] = packages[name].length; dependents[name] = []; }`. Loop 2: for each `name`, for each `dep` of `packages[name]`, `dependents[dep].push(name)`.',
      solution: `${BUILD_GRAPH}
`,
      explain: 'Why two loops? In one loop, `dependents[dep]` might not exist yet when you reach a package whose dep comes later in the object. Setting up every array first avoids that.',
    },
    {
      type: 'read',
      title: 'The plan for Part 1',
      md: `
With the lookups, Kahn's algorithm is a loop over a **ready list**, the same "take one, maybe add more" shape as the stack in lesson 3 and the pile of tickets in lesson 6:

1. \`ready\` starts as the leaves: every package with \`waitingOn === 0\`.
2. While \`ready\` isn't empty: take one (\`shift\`), add it to \`order\`.
3. For each package that needs it: lower its count. If the count hits 0, push it onto \`ready\`.
4. At the end, if \`order\` is shorter than the number of packages, some never reached 0: **a cycle**.

| take | order | effect | ready after |
|---|---|---|---|
| (start) | | | lodash, scheduler |
| lodash | lodash | app 2 → 1 | scheduler |
| scheduler | +scheduler | react 1 → **0** | react |
| react | +react | app 1 → **0** | app |
| app | +app | | (empty) |

In a cycle like \`a → b → c → a\`, none of the three ever reaches 0, so they never enter \`order\`. No infinite loop, and the cycle check is one comparison.
`,
    },
    {
      type: 'task',
      title: 'Part 1: getInstallOrder',
      md: `
\`buildGraph\` is done and in the editor. Write the loop in \`getInstallOrder\`.

~~~
getInstallOrder(packages)   → ["lodash", "scheduler", "react", "app"]
getInstallOrder({ a: ["b"], b: ["a"] })   → throws Error("Cycle detected")
~~~
`,
      starter: `${BUILD_GRAPH}

function getInstallOrder(packages) {
  const { waitingOn, dependents } = buildGraph(packages);
  const names = Object.keys(packages);
  const ready = names.filter((name) => waitingOn[name] === 0);
  const order = [];

  // your code here: the while loop

  if (order.length !== names.length) throw new Error("Cycle detected");
  return order;
}
`,
      tests: [
        { name: 'the example installs lodash, scheduler, react, app', code: `${PKGS}\neq(getInstallOrder(packages), ["lodash", "scheduler", "react", "app"]);` },
        {
          name: 'every package comes after its deps (diamond)',
          code: `${DIAMOND}\nconst order = getInstallOrder(diamond);\neq(order.length, 4, "number of packages");\nfor (const name of Object.keys(diamond)) for (const dep of diamond[name]) assert(order.indexOf(dep) < order.indexOf(name), dep + " must come before " + name);`,
        },
        { name: 'a cycle throws "Cycle detected"', code: `${CYCLIC}\nlet msg = "did not throw";\ntry { getInstallOrder(cyclic); } catch (e) { msg = e.message; }\neq(msg, "Cycle detected");` },
        { name: 'an empty object gives []', code: `eq(getInstallOrder({}), []);` },
      ],
      hint: '`while (ready.length > 0) { const name = ready.shift(); order.push(name); for (const parent of dependents[name]) { waitingOn[parent]--; if (waitingOn[parent] === 0) ready.push(parent); } }`',
      solution: `${BUILD_GRAPH}

${PART1}
`,
    },
    {
      type: 'read',
      title: 'Part 2: stages',
      md: `
> "Now group packages into **stages**. Everything in a stage can install at the same time, once the earlier stages are done. Use as few stages as possible."

~~~
getInstallStages(packages)
→ [["lodash", "scheduler"], ["react"], ["app"]]
~~~

It's Part 1 **in waves**. Instead of taking leaves one at a time, take **all current leaves together**: that's a stage. Everything they unlock goes into the next stage.

~~~
stage 1: [lodash, scheduler]     both need nothing
           scheduler unlocks react; lodash only lowers app to 1
stage 2: [react]
           react unlocks app
stage 3: [app]
~~~

Why is it the fewest stages? Each package lands in the first wave where all its deps are done. It can't go earlier, because something it needs would still be missing.

The code change from Part 1: \`stage\` replaces \`ready\`, and each turn of the loop collects a \`next\` array for the following wave.
`,
    },
    {
      type: 'task',
      title: 'Part 2: getInstallStages',
      md: `
Write the loop in \`getInstallStages\`. Each turn:

1. Push \`stage\` onto \`stages\`, and add \`stage.length\` to \`placed\` (for the cycle check).
2. Make \`const next = []\`. For every package in \`stage\`, lower its dependents' counts; any that hit 0 go into \`next\`.
3. \`stage = next\`.

~~~
getInstallStages(packages)   → [["lodash", "scheduler"], ["react"], ["app"]]
~~~
`,
      starter: `${BUILD_GRAPH}

function getInstallStages(packages) {
  const { waitingOn, dependents } = buildGraph(packages);
  const names = Object.keys(packages);
  const stages = [];
  let stage = names.filter((name) => waitingOn[name] === 0);
  let placed = 0;

  // your code here: while (stage.length > 0) { ... }

  if (placed !== names.length) throw new Error("Cycle detected");
  return stages;
}
`,
      tests: [
        { name: 'the example gives [[lodash, scheduler], [react], [app]]', code: `${PKGS}\neq(getInstallStages(packages), [["lodash", "scheduler"], ["react"], ["app"]]);` },
        {
          name: 'a diamond gives 3 stages, with ui and api together',
          code: `${DIAMOND}\nconst s = getInstallStages(diamond);\neq(s.length, 3, "number of stages");\neq(s[0], ["core"]);\neq([...s[1]].sort(), ["api", "ui"]);\neq(s[2], ["app"]);`,
        },
        { name: 'a cycle throws', code: `${CYCLIC}\nlet msg = "did not throw";\ntry { getInstallStages(cyclic); } catch (e) { msg = e.message; }\neq(msg, "Cycle detected");` },
        { name: 'an empty object gives []', code: `eq(getInstallStages({}), []);` },
      ],
      hint: 'Inside the while: `stages.push(stage); placed += stage.length; const next = [];` then a loop over `stage` that does exactly what Part 1 did for one package, pushing into `next`. End with `stage = next;`.',
      solution: `${BUILD_GRAPH}

function getInstallStages(packages) {
  const { waitingOn, dependents } = buildGraph(packages);
  const names = Object.keys(packages);
  const stages = [];
  let stage = names.filter((name) => waitingOn[name] === 0);
  let placed = 0;

  while (stage.length > 0) {
    stages.push(stage);
    placed += stage.length;
    const next = [];                      // everything this wave unlocks
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
      explain: 'Flatten the stages (`stages.flat()`) and you get a valid Part 1 order. Saying that out loud shows the interviewer that Parts 1 and 2 are the same algorithm.',
    },
    {
      type: 'read',
      title: 'Part 3: install for real, N at a time',
      md: `
> "Now \`install(name)\` is async and takes real time. Install everything with at most \`limit\` running at once. Start a package **as soon as its own deps finish**, without waiting for a whole stage. Resolve with the finish order, or reject with the first error, including a cycle."

It's lesson 6's pool, but the pile of work **grows** as installs finish, so finished installs drive the next step instead of a \`while\` over a fixed list:

- Start installs from \`ready\` until \`limit\` are running.
- When one **finishes**: lower its dependents' counts, add newly-ready ones to \`ready\`, start more.
- When one **fails**: reject, and start nothing new.

~~~
limit 2. install times: lodash 60ms, scheduler 10, react 10, app 10

  0ms  start lodash, start scheduler
 10ms  scheduler done → react ready → start react    (lodash still running)
 20ms  react done (app still waits for lodash)
 60ms  lodash done → app ready → start app
 70ms  app done → resolve [scheduler, react, lodash, app]
~~~

React started at 10ms, before stage 1 was over. Stages would have made it wait until 60ms.

**Why \`new Promise\`:** the moment you're done happens inside some \`.then\` callback, at an unpredictable time. Wrapping everything in one promise and calling \`resolve\` yourself is the cleanest way to say "now".
`,
    },
    {
      type: 'task',
      title: 'Part 3: installAll',
      md: `
Everything is written except what happens when an install **succeeds**. \`buildGraph\` and \`getInstallOrder\` are above it (Part 3 uses Part 1 to reject cycles before installing anything).

Inside the success callback, write the Part 1 loop body plus the async bookkeeping:

1. \`running--\` (a slot is free) and \`finished.push(name)\`.
2. Lower each dependent's count; push any that hit 0 onto \`ready\`.
3. If \`finished.length === names.length\`, \`resolve(finished)\`. Otherwise call \`startMore()\` to fill the free slot.
`,
      starter: `${BUILD_GRAPH}

${PART1}

${PART3_TOP}
            // your code here
${PART3_BOTTOM}
`,
      tests: [
        {
          name: 'installs everything, each package after its deps',
          code: `${PKGS}\n${RUN_SETUP}\nconst finished = await installAll(packages, install, 2);\neq(finished.length, 4, "number installed");\nfor (const name of Object.keys(packages)) for (const dep of packages[name]) assert(log.indexOf("done " + dep) < log.indexOf("start " + name), name + " started before " + dep + " finished");`,
        },
        {
          name: 'never runs more than limit at once',
          code: `const many = {};\nfor (let i = 0; i < 8; i++) many["p" + i] = [];\n${RUN_SETUP}\nawait installAll(many, install, 3);\neq(most, 3, "most installs running at once");`,
        },
        {
          name: 'starts react as soon as scheduler is done, without waiting for lodash',
          code: `${PKGS}\n${RUN_SETUP}\nawait installAll(packages, install, 2);\nassert(log.indexOf("start react") < log.indexOf("done lodash"), "react waited for the whole stage: " + log.join(", "));`,
        },
        {
          name: 'rejects on a cycle without installing anything',
          code: `${CYCLIC}\nlet calls = 0;\nlet msg = "did not reject";\ntry { await installAll(cyclic, async () => { calls++; }, 2); } catch (e) { msg = e.message; }\neq(msg, "Cycle detected");\neq(calls, 0, "installs started");`,
        },
        {
          name: 'rejects with the first install error',
          code: `${PKGS}\nlet msg = "did not reject";\ntry { await installAll(packages, async (name) => { if (name === "react") throw new Error("react failed"); }, 2); } catch (e) { msg = e.message; }\neq(msg, "react failed");`,
        },
      ],
      hint: '`running--; finished.push(name);` then the same `for (const parent of dependents[name])` loop as Part 1. Finish with `if (finished.length === names.length) resolve(finished); else startMore();`.',
      solution: `${BUILD_GRAPH}

${PART1}

${PART3_TOP}${PART3_SUCCESS}
${PART3_BOTTOM}
`,
      explain: '`running` and `ready` need no lock: JavaScript runs one callback at a time, so two finishing installs can never update them at the same moment. The same reason `next++` was safe in lesson 6.',
    },
    {
      type: 'read',
      title: 'Walkthrough: the full solution',
      md: `
The three parts are one algorithm driven three ways:

| part | what takes from the ready list | output |
|---|---|---|
| 1 | a \`while\` loop, one at a time | an order |
| 2 | a \`while\` loop, a whole wave at a time | stages |
| 3 | finished installs, up to \`limit\` in flight | a finish order, async |

**Big-O**, with V packages and E dependency arrows:

| | time | memory |
|---|---|---|
| brute force rescan | about O(V²) | O(V) |
| \`buildGraph\` | O(V + E) | O(V + E) |
| Parts 1 and 2 | O(V + E): each package enters \`ready\` once, each arrow is lowered once | O(V + E) |
| Part 3 | O(V + E) of bookkeeping, plus the install time itself | O(V + E) |

(\`ready.shift()\` is O(V) on a plain array. For huge graphs, use an index pointer instead of \`shift\`. Worth a sentence, not a rewrite.)

**Another way: depth-first search.** To install a package, first install everything it needs (recursion, lesson 8), then push it. Three states per package (not seen, visiting, done) find cycles: reaching a "visiting" package means you walked in a circle. It's short for Part 1, but Kahn's ready list is what makes Parts 2 and 3 natural.

**Say it:** "This is a dependency graph, so I want a topological sort. I count what each package waits on and flip the arrows, start from the leaves, and each install unlocks its dependents. Anything left at the end is a cycle. Stages are the same loop in waves, and the async version drives the same loop from completion callbacks, with a counter capping concurrency. It's linear in packages plus dependencies."
`,
    },
    {
      type: 'check',
      title: 'Follow-up questions',
      items: [
        {
          q: '`{ app: ["left-pad"] }`: left-pad isn\'t a key. What breaks, and what\'s the fix?',
          choices: [
            '`dependents["left-pad"]` doesn\'t exist, so `push` throws. Build `names` from the keys plus every dependency, and use `packages[name] || []`.',
            'Nothing breaks',
            'It\'s a cycle, so it throws "Cycle detected"',
          ],
          answer: 0,
          explain: 'A `Set` of keys and `Object.values(packages).flat()` gives every package name once. This is the clarifying question from the start, paying off.',
          why: {
            1: 'The second loop in `buildGraph` reads `dependents[dep]` for a dep with no array.',
            2: 'There\'s no circle. It crashes with a TypeError before any cycle check.',
          },
        },
        {
          q: 'The interviewer asks for the cycle error to name the stuck packages. Where are they?',
          choices: [
            'Every package whose `waitingOn` count is still above 0 at the end',
            'The last package in `order`',
            'The packages in `ready`',
          ],
          answer: 0,
          explain: '`names.filter((n) => waitingOn[n] > 0)` gives them. (It also includes packages that wait on the cycle without being in it, which is usually what you want to report anyway.)',
          why: {
            1: 'That one installed fine.',
            2: '`ready` is empty when the loop ends.',
          },
        },
        {
          q: 'In Part 3, why reject a cycle up front with `getInstallOrder` instead of noticing it later?',
          choices: [
            'Otherwise you\'d install some packages, then hang forever waiting for ones that can never become ready',
            'It\'s faster to install',
            'Promises can\'t reject later',
          ],
          answer: 0,
          explain: 'With a cycle, `finished` never reaches `names.length` and nothing is left to start, so the promise would never settle. Failing fast avoids a half-done install.',
          why: {
            1: 'It adds a little work. The point is correctness.',
            2: 'They can reject at any time; the problem is that nothing would trigger it.',
          },
        },
        {
          q: '"Retry each failed install once." Using this track, what\'s the smallest change?',
          choices: [
            'Wrap the call: `const tryInstall = (n) => install(n).catch(() => install(n));` and use it in `startMore`',
            'Run `installAll` twice',
            'Raise the limit',
          ],
          answer: 0,
          explain: 'Retries go around the one flaky call (lesson 5), not around the whole job. A real version adds a backoff delay.',
          why: {
            1: 'That reinstalls everything that already worked.',
            2: 'Concurrency doesn\'t fix failures.',
          },
        },
      ],
    },
  ],
};
