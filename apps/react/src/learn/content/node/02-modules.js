// Node course · lesson 2. Step types: read, predict, task, check (see ../index.js).
// Real import/export can't run in the worker, so module syntax is shown in ~~~node blocks
// and the runnable parts model how a module system works with plain objects and functions.
export default {
  id: 'modules',
  builds: ['node/what-node-is', 'js/functions', 'js/objects'],
  title: 'Modules: import, export and require',
  goal: 'Split code across files with ES modules, recognise CommonJS when you meet it, and understand that a module runs once and is cached.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'One file per job',
      md: `
So far every program has been one file. Real projects split code up: one file for the database, one for the routes, one for helpers. A **module** is just a file that chooses what to share.

Node supports two module systems:

- **ES modules (ESM)**: \`import\` and \`export\`. The JavaScript standard, the same syntax the browser and TypeScript use. Use this for new code.
- **CommonJS (CJS)**: \`require\` and \`module.exports\`. Node's original system. You'll still read it in older projects, config files and Stack Overflow answers.

Here's ESM. Two files, one sharing a function, one using it:

~~~node
// math.js
export function add(a, b) {
  return a + b;
}
export const PI = 3.14159;
~~~

~~~node
// main.js
import { add, PI } from './math.js';

console.log(add(2, 3));  // 5
console.log(PI);         // 3.14159
~~~

Anything a file doesn't \`export\` stays private to that file. That's the main point of modules: each file has its own scope, so two files can both have a variable called \`count\` without clashing.
`,
    },
    {
      type: 'read',
      title: 'Named and default exports',
      md: `
A module can have many **named** exports and at most one **default** export:

~~~node
// users.js
export function findUser(id) { /* ... */ }      // named
export function listUsers() { /* ... */ }       // named
export default function createUser(data) { /* ... */ }  // default
~~~

~~~node
// main.js
import createUser, { findUser, listUsers as all } from './users.js';
import * as users from './users.js';   // everything, as one object: users.findUser(...)
~~~

- **Named imports use braces and must match the exported name.** \`as\` renames on your side.
- **The default import has no braces, and you pick its name.** \`import makeUser from './users.js'\` gets the same function.

The most common mistake is mixing the two up: \`import { createUser } from './users.js'\` fails, because \`createUser\` was exported as the default, not by that name. Node reports it as a \`SyntaxError\` saying the module "does not provide an export named createUser", before any of your code runs.

Many teams use only named exports so names stay the same everywhere and editors can auto-import them.
`,
    },
    {
      type: 'read',
      title: 'How Node decides which system a file uses',
      md: `
| File | Treated as |
|---|---|
| \`.mjs\` | always ESM |
| \`.cjs\` | always CommonJS |
| \`.js\` with \`"type": "module"\` in the nearest package.json | ESM |
| \`.js\` with no \`"type"\` | CommonJS, unless Node detects \`import\`/\`export\` syntax in it |

Set \`"type": "module"\` and you'll rarely think about it again.

A few rules ESM enforces that surprise people coming from CommonJS or bundlers:

- **Relative imports need the file extension**: \`'./math.js'\`, not \`'./math'\`. (Even in TypeScript source, you write \`.js\` in the import path.)
- **Built-in modules use the \`node:\` prefix**: \`import { readFile } from 'node:fs/promises'\`. It works without it, but the prefix makes clear it's built in and not from npm.
- **There's no \`__dirname\` or \`__filename\`.** Use \`import.meta.dirname\` and \`import.meta.filename\` instead.
- **Top-level \`await\` works**, because ESM modules load asynchronously.
`,
    },
    {
      type: 'read',
      title: 'CommonJS, so you can read it',
      md: `
The same two files in CommonJS:

~~~node
// math.cjs
function add(a, b) {
  return a + b;
}
module.exports = { add, PI: 3.14159 };
~~~

~~~node
// main.cjs
const { add, PI } = require('./math.cjs');
console.log(add(2, 3));
~~~

\`require\` is an ordinary function call that returns whatever the other file put on \`module.exports\`. That has two consequences:

- \`require\` can appear anywhere, even inside an \`if\`. ESM \`import\` declarations must be at the top level, which lets tools see the whole dependency graph before running anything.
- \`require\` loads **synchronously**. ESM loads asynchronously.

Mixing them: an ES module can \`import\` a CommonJS file (you get \`module.exports\` as the default import). Recent Node versions (22.12 and later) can also \`require()\` an ES module, as long as that module doesn't use top-level \`await\`.

Underneath both systems is the same idea, and the next steps rebuild it with plain functions.
`,
    },
    {
      type: 'read',
      title: 'A module system in 12 lines',
      md: `
Picture each file as a **function** that fills in an \`exports\` object. A loader runs that function the first time someone asks for the file, and **caches** the result:

~~~js
const files = {
  './math.js': (exports) => {
    console.log('running math.js');
    exports.add = (a, b) => a + b;
  },
};

const cache = {};
function load(name) {
  if (cache[name]) return cache[name];   // already loaded: hand back the same object
  const exports = {};
  files[name](exports);                  // run the file once
  cache[name] = exports;
  return exports;
}

const a = load('./math.js');
const b = load('./math.js');
console.log(a.add(2, 3), a === b);
~~~

Run it. \`running math.js\` prints **once**, even though the file is loaded twice, and both callers get the **same object**. Real CommonJS works this way (wrapping each file in a function is literally how it gives each file its own scope), and ESM caches the same way.
`,
    },
    {
      type: 'predict',
      title: 'A module runs once',
      md: 'Two files import a counter module. Predict all three lines.',
      code: `const files = {
  './counter.js': (exports) => {
    console.log('counter.js runs');
    let count = 0;
    exports.next = () => ++count;
  },
};
const cache = {};
function load(name) {
  if (!cache[name]) {
    cache[name] = {};
    files[name](cache[name]);
  }
  return cache[name];
}

const fromRoutes = load('./counter.js');
const fromJobs = load('./counter.js');
fromRoutes.next();
console.log(fromJobs.next());`,
      output: `counter.js runs
2`,
      explain: `
The module body runs the first time it's loaded, so \`counter.js runs\` prints once. After that, both callers share one \`count\` variable, so the second \`next()\` returns **2**, not 1.

People often expect \`1\`, picturing each import as a fresh copy. It isn't. This is why a module that creates a database connection or an in-memory store gives you **one shared instance** for the whole app, which you'll rely on in lesson 9.
`,
    },
    {
      type: 'task',
      title: 'makeLoader',
      md: `
Package the loader up. \`makeLoader(files)\` returns a \`load(name)\` function:

- \`files\` maps a name to a function \`(exports) => { ... }\`.
- The first \`load(name)\` creates an empty \`exports\` object, calls \`files[name](exports)\`, caches and returns it.
- Later calls with the same name return the cached object without running the file again.

~~~
const load = makeLoader({ './a.js': (exports) => { exports.x = 1; } });
load('./a.js')                     → { x: 1 }
load('./a.js') === load('./a.js')  → true
~~~
`,
      starter: `function makeLoader(files) {
  const cache = {};
  return function load(name) {
    const exports = {};
    files[name](exports);
    return exports;
  };
}
`,
      tests: [
        { name: 'returns what the file exported', code: `const load = makeLoader({ './a.js': (exports) => { exports.x = 1; } }); eq(load('./a.js'), { x: 1 });` },
        { name: 'loading twice gives the same object', code: `const load = makeLoader({ './a.js': (exports) => { exports.x = 1; } }); assert(load('./a.js') === load('./a.js'), 'expected the cached object');` },
        {
          name: 'the file body runs only once',
          code: `let runs = 0;
const load = makeLoader({ './a.js': () => { runs++; } });
load('./a.js'); load('./a.js'); load('./a.js');
eq(runs, 1);`,
        },
      ],
      hint: 'Add a check at the very top of `load`: if `cache[name]` exists, return it. And store `exports` in `cache[name]` before returning.',
      solution: `function makeLoader(files) {
  const cache = {};
  return function load(name) {
    if (cache[name]) return cache[name];
    const exports = {};
    files[name](exports);
    cache[name] = exports;
    return exports;
  };
}
`,
      explain: '`load` remembers `cache` between calls because it was created inside `makeLoader`. That is a closure: a function that keeps access to the variables around where it was defined.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: '`users.js` has `export default function createUser() {}`. Which import works?',
          choices: ["`import createUser from './users.js'`", "`import { createUser } from './users.js'`", "`import createUser from './users'`"],
          answer: 0,
          explain: 'A default export is imported without braces, and ESM needs the file extension.',
          why: { 1: 'Braces ask for a named export called `createUser`, and there is none.', 2: 'ESM in Node needs the `.js` extension on relative imports.' },
        },
        {
          q: 'Your package.json has `"type": "module"`. Which file is CommonJS?',
          choices: ['`config.cjs`', '`server.js`', '`routes.mjs`'],
          answer: 0,
          explain: '`.cjs` is always CommonJS whatever the package says. `.js` follows `"type"`, and `.mjs` is always ESM.',
          why: { 1: 'With `"type": "module"`, `.js` files are ES modules.', 2: '`.mjs` is always an ES module.' },
        },
        {
          q: 'An ES module logs `__dirname`. What happens?',
          choices: ['`ReferenceError: __dirname is not defined`', 'It prints the folder of the file', 'It prints `undefined`'],
          answer: 0,
          explain: '`__dirname` only exists in CommonJS. In ESM use `import.meta.dirname`.',
          why: { 1: 'That is what CommonJS does, not ESM.', 2: 'Using an undeclared name throws; it does not give `undefined`.' },
        },
        {
          q: '`db.js` opens a connection at the top of the file. Three other modules import it. How many connections open?',
          choices: ['One', 'Three', 'Four'],
          answer: 0,
          explain: 'A module body runs once, the first time it is imported. Everyone after that gets the cached exports.',
          why: { 1: 'Imports share one cached instance; they do not re-run the file.', 2: 'There is no extra run for the module itself.' },
        },
        {
          q: 'Why prefer the `node:` prefix in `import fs from "node:fs"`?',
          choices: ['It makes clear the module is built into Node, not an npm package', 'Without it, the import fails', 'It loads a faster version of fs'],
          answer: 0,
          explain: 'The prefix is about clarity and safety: no npm package can shadow a `node:` import.',
          why: { 1: 'Bare `fs` still works for built-ins.', 2: 'It is the same module either way.' },
        },
      ],
    },
  ],
};
