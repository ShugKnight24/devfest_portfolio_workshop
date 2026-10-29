// Node course · lesson 1. Step types: read, predict, task, check (see ../index.js).
// Code here runs in a browser worker, so real Node code (process, fs, http) uses ~~~node display blocks.
export default {
  id: 'what-node-is',
  builds: ['js/objects', 'js/loops'],
  title: 'What Node is: JavaScript outside the browser',
  goal: 'Know what Node adds to the JavaScript you already write, how to run a file, and what package.json and npm scripts are for.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'Same language, different room',
      md: `
Everything from the JavaScript and TypeScript tracks still applies: values, functions, objects, \`map\`, \`filter\`, \`reduce\`. Node doesn't change the language. It changes **where the language runs** and **what it can reach**.

A JavaScript runtime is two things glued together:

- **An engine** that runs the code. Chrome and Node both use **V8**.
- **APIs around the engine** that let the code touch the outside world.

The browser gives V8 a page to work with. Node gives V8 a computer:

| | Browser | Node |
|---|---|---|
| Engine | V8 (Chrome), others elsewhere | V8 |
| Global object | \`window\` (and \`globalThis\`) | \`globalThis\` |
| Reaches | the DOM, \`fetch\`, \`localStorage\` | files, network sockets, processes, env vars, \`fetch\` |
| Runs | when a page loads | when you type \`node file.js\` |

The other half of Node is **libuv**, a C library that does slow work (reading files, waiting on network sockets, timers) in the background and tells your JavaScript when it's done. That's why a single JavaScript thread can serve thousands of requests: it never sits and waits. Lesson 3 is about how that works.
`,
    },
    {
      type: 'predict',
      title: 'No DOM here',
      md: 'The code on this page runs in a browser **worker**, which, like Node, has no page attached. Predict the three words.',
      code: `console.log(typeof document);
console.log(typeof globalThis);
console.log(typeof setTimeout);`,
      output: `undefined
object
function`,
      explain: `
- \`document\` is the DOM. There's no page, so there's no \`document\`. In Node it's \`undefined\` too.
- \`globalThis\` is the standard name for the global object in every runtime. Use it instead of \`window\` in code that might run on a server.
- \`setTimeout\` isn't part of the JavaScript language. Every runtime adds it, and Node adds its own version.

The common mistake is copying browser code into a server file and getting \`ReferenceError: document is not defined\`. That error means "this code assumed a page".
`,
    },
    {
      type: 'read',
      title: 'Running a file',
      md: `
Write a file and hand it to \`node\`:

~~~node
// hello.js
const name = 'Ada';
console.log(\`Hello, \${name}\`);
~~~

~~~bash
node hello.js            # runs it once, prints "Hello, Ada", exits
node --watch hello.js    # reruns every time you save the file
node                     # no file: an interactive prompt (the REPL)
~~~

Three things to notice:

- \`console.log\` goes to your **terminal**, not a browser console.
- The program **exits on its own** when there's nothing left to do. A server doesn't exit because it's still listening for connections.
- \`--watch\` is built into Node (no extra package needed) and is the usual way to develop.

Node ships a new major version twice a year, and the even-numbered ones become **LTS** (long-term support). Use the current LTS for real projects. Check yours with \`node --version\`.
`,
    },
    {
      type: 'read',
      title: 'The process object',
      md: `
In the browser, the page is your context. In Node, your context is the **process**: the running program. Node gives you a global \`process\` object that describes it:

~~~node
// app.js, run with: node app.js --port 3000
console.log(process.argv);      // ['/usr/local/bin/node', '/path/to/app.js', '--port', '3000']
console.log(process.env.HOME);  // environment variables, always strings (or undefined)
console.log(process.cwd());     // the folder you ran the command from
process.exitCode = 1;           // exit with "failure" once the program finishes
~~~

- \`process.argv\` is an **array of strings**: the path to node, the path to your file, then whatever you typed after it.
- \`process.env\` is an **object of strings**. Lesson 11 is about using it for config.
- An **exit code** of \`0\` means success; anything else means failure. Scripts and CI read it.

The first two items of \`argv\` are almost never what you want, which is why code that reads arguments starts with \`process.argv.slice(2)\`.
`,
    },
    {
      type: 'predict',
      title: 'Slicing argv',
      md: 'Here `argv` is what `process.argv` would hold for `node app.js --port 3000`.',
      code: `const argv = ['/usr/local/bin/node', '/app/app.js', '--port', '3000'];
const args = argv.slice(2);
console.log(args);
console.log(args[1] + 1);`,
      output: `[ "--port", "3000" ]
30001`,
      explain: `
\`slice(2)\` drops the first two items. Then \`args[1]\` is the **string** \`"3000"\`, so \`+ 1\` joins strings instead of adding. Command-line arguments and environment variables are always strings. Convert with \`Number(args[1])\` when you need a number.
`,
    },
    {
      type: 'task',
      title: 'parseArgs',
      md: `
Write \`parseArgs(argv)\`. It skips the first two items, then reads the rest as \`--name value\` pairs into an object:

~~~
parseArgs(['node', 'app.js', '--port', '3000', '--host', 'localhost'])
  → { port: '3000', host: 'localhost' }

parseArgs(['node', 'app.js'])  → {}
~~~

Leave values as strings. Assume every flag has a value right after it.
`,
      starter: `function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {};
  // your code here
  return result;
}
`,
      tests: [
        { name: 'reads two flags', code: `eq(parseArgs(['node', 'app.js', '--port', '3000', '--host', 'localhost']), { port: '3000', host: 'localhost' });` },
        { name: 'no flags gives {}', code: `eq(parseArgs(['node', 'app.js']), {});` },
        { name: 'values stay strings', code: `eq(parseArgs(['node', 'app.js', '--port', '80']).port, '80');` },
      ],
      hint: 'Loop with a classic `for (let i = 0; i < args.length; i += 2)`. The name is `args[i]` without its first two characters (`.slice(2)`), and the value is `args[i + 1]`.',
      solution: `function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i].slice(2);   // '--port' becomes 'port'
    result[name] = args[i + 1];
  }
  return result;
}
`,
      explain: 'Node ships a fuller version of this as `parseArgs` in `node:util`, with booleans, short flags and errors for unknown options. Writing the small one first shows you there is no magic in it.',
    },
    {
      type: 'read',
      title: 'package.json: the project file',
      md: `
A Node project is a folder with a \`package.json\` at the top. \`npm init -y\` creates one:

~~~json
{
  "name": "todo-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^5.1.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
~~~

- **\`type: "module"\`** makes \`.js\` files use \`import\`/\`export\`. Next lesson explains why that matters.
- **\`scripts\`** are named shell commands. \`npm run dev\` runs the \`dev\` line. \`npm start\` and \`npm test\` are shortcuts for those two names.
- **\`dependencies\`** are needed to run the app; **\`devDependencies\`** only to build or test it.
- **\`^5.1.0\`** means "5.1.0 or any newer 5.x". The caret never jumps to 6.0.0, because a new major version may break your code.

\`npm install express\` downloads into \`node_modules/\` and records the exact versions in \`package-lock.json\`. Commit the lock file; never commit \`node_modules/\`. On a fresh clone or in CI, \`npm ci\` installs exactly what the lock file says.
`,
    },
    {
      type: 'task',
      title: 'scriptFor',
      md: `
\`npm run <name>\` looks the name up in \`scripts\` and fails if it isn't there. Write that lookup.

\`scriptFor(pkg, name)\` returns the command string. If the script doesn't exist, throw \`new Error('Missing script: ' + name)\`:

~~~
const pkg = { scripts: { dev: 'node --watch src/server.js' } };
scriptFor(pkg, 'dev')    → 'node --watch src/server.js'
scriptFor(pkg, 'build')  → throws Error('Missing script: build')
~~~

Some package.json files have no \`scripts\` key at all. Treat that like an empty object.
`,
      starter: `function scriptFor(pkg, name) {
  // your code here
}
`,
      tests: [
        { name: 'finds an existing script', code: `eq(scriptFor({ scripts: { dev: 'node --watch src/server.js' } }, 'dev'), 'node --watch src/server.js');` },
        { name: 'throws for a missing script', code: `throws(() => scriptFor({ scripts: { dev: 'x' } }, 'build'));` },
        {
          name: 'the error message names the script',
          code: `try { scriptFor({ scripts: {} }, 'build'); assert(false, 'did not throw'); } catch (e) { eq(e.message, 'Missing script: build'); }`,
        },
        { name: 'a package with no scripts key throws too', code: `throws(() => scriptFor({ name: 'app' }, 'dev'));` },
      ],
      hint: 'Start with `const scripts = pkg.scripts || {};`. Then `const cmd = scripts[name];` and throw if `cmd` is `undefined`.',
      solution: `function scriptFor(pkg, name) {
  const scripts = pkg.scripts || {};
  const cmd = scripts[name];
  if (cmd === undefined) throw new Error('Missing script: ' + name);
  return cmd;
}
`,
    },
    {
      type: 'read',
      title: 'npm, npx and node --run',
      md: `
Three commands that look alike:

~~~bash
npm install            # install everything in package.json
npm install zod        # add a dependency (writes package.json and the lock file)
npm install -D vitest  # add a devDependency
npm run dev            # run the "dev" script
npx tsc --version      # run a tool from node_modules/.bin (or download it once)
node --run dev         # Node's own, faster script runner (no npm lifecycle hooks)
~~~

Inside a script, binaries from \`node_modules/.bin\` are on the PATH, which is why \`"test": "vitest"\` works without a global install.

## What Node is good at

Node shines at **I/O-heavy** work: APIs, proxies, real-time apps, CLIs, build tools. Most of a request's time is spent waiting on a database or another service, and Node waits cheaply.

It's weaker at **CPU-heavy** work (image processing, big number crunching) on the main thread, because while your JavaScript is busy computing, nothing else on that thread runs. You'll see why in lesson 3.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'What does Node add on top of the V8 engine?',
          choices: ['APIs for files, network, processes and env vars, plus libuv for background I/O', 'A different version of the JavaScript language', 'The DOM, so server code can build pages'],
          answer: 0,
          explain: 'The language is the same JavaScript. Node adds the APIs that reach the machine, and libuv does the waiting.',
          why: { 1: 'Node runs the same JavaScript as Chrome, both on V8.', 2: 'There is no DOM in Node: `document` is undefined.' },
        },
        {
          q: 'You run `node app.js --port 3000`. What is `process.argv[2]`?',
          choices: ['`"--port"`', '`"3000"`', '`"app.js"`'],
          answer: 0,
          explain: 'Index 0 is the node binary, index 1 is the file, so index 2 is the first thing you typed after the file.',
          why: { 1: 'That is index 3.', 2: 'Index 1 is the file, and it is a full path, not just the name.' },
        },
        {
          q: '`process.env.PORT` is set to 8080. What is `process.env.PORT + 1`?',
          choices: ['`"80801"`', '`8081`', '`NaN`'],
          answer: 0,
          explain: 'Environment variables are always strings, so `+` joins them. Use `Number(process.env.PORT)` first.',
          why: { 1: 'That would need a number, and env values are strings.', 2: '`NaN` comes from math on a non-numeric string, but `+` with a string concatenates.' },
        },
        {
          q: 'Which files should go in git?',
          choices: ['`package.json` and `package-lock.json`', '`package.json` and `node_modules/`', 'Only `node_modules/`'],
          answer: 0,
          explain: 'The lock file pins exact versions so everyone installs the same tree. `node_modules/` is rebuilt from it with `npm ci`.',
          why: { 1: '`node_modules/` is huge, platform-specific and fully rebuildable.', 2: 'Without package.json nobody knows what to install.' },
        },
        {
          q: 'The dependency says `"express": "^5.1.0"`. Which version can npm install?',
          choices: ['5.2.3', '6.0.0', '4.21.2'],
          answer: 0,
          explain: 'The caret allows newer minor and patch versions within the same major: 5.x, at least 5.1.0.',
          why: { 1: 'A new major version can break your code, so the caret never crosses it.', 2: 'That is older than 5.1.0.' },
        },
      ],
    },
  ],
};
