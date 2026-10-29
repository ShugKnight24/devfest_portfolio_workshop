// Node course · lesson 11. Step types: read, predict, task, check (see ../index.js).
// Runnable parts take env and headers as plain objects; the real process.env and Express app are ~~~node blocks.
export default {
  id: 'config-security-shipping',
  builds: ['node/crud-service', 'node/middleware', 'node/what-node-is', 'js/conditionals'],
  title: 'Config, security and shipping',
  goal: 'Read configuration from the environment safely, keep secrets out of git and logs, handle CORS, and run a real Express app locally.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Config lives in the environment',
      md: `
Your todo API from lesson 9 needs settings that change between your laptop, CI and production: the port, the database URL, an API key. Hard-coding them means editing code to deploy, and committing secrets to git.

The standard answer is **environment variables**, read through \`process.env\` (lesson 1):

~~~node
const port = Number(process.env.PORT) || 3000;
const databaseUrl = process.env.DATABASE_URL;
~~~

Locally, you keep them in a \`.env\` file and let Node load it. No package needed:

~~~bash
# .env  (never committed)
PORT=3000
DATABASE_URL=postgres://localhost:5432/todos
API_KEY=dev-only-key
~~~

~~~bash
node --env-file=.env src/server.js
node --watch --env-file=.env src/server.js
~~~

(Or call \`process.loadEnvFile()\` at the top of your entry file.) In production, the hosting platform sets the variables, and there's no \`.env\` file at all.

Two files to commit alongside:

- **\`.gitignore\`** with a \`.env\` line, so it can't be committed by accident.
- **\`.env.example\`** with every variable name and a fake value, so a new teammate knows what to set.
`,
    },
    {
      type: 'predict',
      title: 'Everything is a string',
      md: '`env` stands in for `process.env`.',
      code: `const env = { PORT: '8080', DEBUG: 'false' };

console.log(env.PORT + 1);
console.log(Boolean(env.DEBUG));
console.log(Number(env.TIMEOUT));`,
      output: `80801
true
NaN`,
      explain: `
- \`'8080' + 1\` joins strings (lesson 1 again).
- \`Boolean('false')\` is \`true\`: any non-empty string is truthy (JavaScript lesson 10). This one ships to production with debug logging on more often than you'd think. Compare with \`env.DEBUG === 'true'\` instead.
- A missing variable is \`undefined\`, and \`Number(undefined)\` is \`NaN\`. Code that does \`setTimeout(fn, NaN)\` won't fail; it quietly treats the delay as 0.

The fix for all three is the same: read and convert config **once, at startup**, into a typed object, and fail loudly if something's wrong.
`,
    },
    {
      type: 'task',
      title: 'loadConfig',
      md: `
Write \`loadConfig(env)\` that returns \`{ port, debug }\`:

- \`port\`: \`Number(env.PORT)\`, or \`3000\` if \`PORT\` isn't set. If it's set but isn't an integer, **throw** \`new Error('PORT must be a number')\`.
- \`debug\`: \`true\` only when \`env.DEBUG === 'true'\`.

~~~
loadConfig({})                              → { port: 3000, debug: false }
loadConfig({ PORT: '8080', DEBUG: 'true' }) → { port: 8080, debug: true }
loadConfig({ PORT: 'eighty' })              → throws 'PORT must be a number'
~~~

\`Number.isInteger(x)\` is \`false\` for \`NaN\` and for decimals.
`,
      starter: `function loadConfig(env) {
  const port = Number(env.PORT);
  const debug = Boolean(env.DEBUG);
  return { port, debug };
}
`,
      tests: [
        { name: 'defaults when nothing is set', code: `eq(loadConfig({}), { port: 3000, debug: false });` },
        { name: 'reads PORT and DEBUG', code: `eq(loadConfig({ PORT: '8080', DEBUG: 'true' }), { port: 8080, debug: true });` },
        { name: "DEBUG='false' is false", code: `eq(loadConfig({ DEBUG: 'false' }).debug, false);` },
        { name: 'a non-numeric PORT throws', code: `try { loadConfig({ PORT: 'eighty' }); assert(false, 'did not throw'); } catch (e) { eq(e.message, 'PORT must be a number'); }` },
      ],
      hint: "`const port = env.PORT === undefined ? 3000 : Number(env.PORT);` then `if (!Number.isInteger(port)) throw ...`. For debug: `env.DEBUG === 'true'`.",
      solution: `function loadConfig(env) {
  const port = env.PORT === undefined ? 3000 : Number(env.PORT);
  if (!Number.isInteger(port)) throw new Error('PORT must be a number');
  const debug = env.DEBUG === 'true';
  return { port, debug };
}
`,
      explain: 'Crashing at startup with a clear message is a feature: the deploy fails immediately, instead of the app running for an hour and failing on the first request that needs the setting. In the real app you call `loadConfig(process.env)` once and pass the result around.',
    },
    {
      type: 'task',
      title: 'requireEnv',
      md: `
Some settings have no sensible default: a database URL, an API key. Write \`requireEnv(env, name)\` that returns the value, or throws \`new Error('Missing required env var: ' + name)\` if it's missing or an empty string.

~~~
requireEnv({ API_KEY: 'k1' }, 'API_KEY')   → 'k1'
requireEnv({}, 'API_KEY')                  → throws 'Missing required env var: API_KEY'
requireEnv({ API_KEY: '' }, 'API_KEY')     → throws
~~~
`,
      starter: `function requireEnv(env, name) {
  // your code here
}
`,
      tests: [
        { name: 'returns a set value', code: `eq(requireEnv({ API_KEY: 'k1' }, 'API_KEY'), 'k1');` },
        { name: 'a missing variable throws with its name', code: `try { requireEnv({}, 'API_KEY'); assert(false, 'did not throw'); } catch (e) { eq(e.message, 'Missing required env var: API_KEY'); }` },
        { name: 'an empty string throws too', code: `throws(() => requireEnv({ API_KEY: '' }, 'API_KEY'));` },
      ],
      hint: '`const value = env[name];` then `if (!value) throw new Error(...)`. Both `undefined` and `""` are falsy.',
      solution: `function requireEnv(env, name) {
  const value = env[name];
  if (!value) throw new Error('Missing required env var: ' + name);
  return value;
}
`,
      explain: 'The error names the variable but never prints a value. Error messages and logs end up in places with wider access than your secrets should have.',
    },
    {
      type: 'read',
      title: 'Secrets',
      md: `
A **secret** is anything that grants access: database passwords, API keys, signing keys for tokens. The rules:

- **Never commit one.** Not in code, not in \`.env\`, not "just for a minute". Git keeps history: deleting the line in a later commit leaves it readable in the old one, and bots scan public repos for keys within minutes.
- **If one leaks, rotate it.** Create a new key and revoke the old one. Rewriting git history is not enough, because someone may already have a copy.
- **Never log one.** Logging a whole request logs its \`Authorization\` header and cookies. Logging \`process.env\` logs everything.
- **Separate per environment.** Development keys should not work against production.

Platforms (Vercel, Fly, Render, AWS, GitHub Actions) all have a settings page for secrets that injects them as environment variables at runtime. Your code reads \`process.env\` either way.
`,
    },
    {
      type: 'task',
      title: 'redactHeaders',
      md: `
Before logging a request, strip what shouldn't be in logs. Write \`redactHeaders(headers)\` that returns a **new** object where \`authorization\` and \`cookie\` (if present) are replaced with \`'[redacted]'\`. Other headers stay. Don't change the original.

~~~
redactHeaders({ authorization: 'Bearer abc', host: 'api.dev' })
  → { authorization: '[redacted]', host: 'api.dev' }
redactHeaders({ host: 'api.dev' })
  → { host: 'api.dev' }
~~~
`,
      starter: `const SENSITIVE = ['authorization', 'cookie'];

function redactHeaders(headers) {
  const copy = { ...headers };
  // your code here
  return copy;
}
`,
      tests: [
        { name: 'hides authorization', code: `eq(redactHeaders({ authorization: 'Bearer abc', host: 'api.dev' }), { authorization: '[redacted]', host: 'api.dev' });` },
        { name: 'hides cookie', code: `eq(redactHeaders({ cookie: 'sid=1' }).cookie, '[redacted]');` },
        { name: 'does not add headers that were not there', code: `eq(redactHeaders({ host: 'api.dev' }), { host: 'api.dev' });` },
        { name: 'does not change the original', code: `const h = { authorization: 'Bearer abc' }; redactHeaders(h); eq(h.authorization, 'Bearer abc');` },
      ],
      hint: "`for (const name of SENSITIVE) { if (name in copy) copy[name] = '[redacted]'; }`",
      solution: `const SENSITIVE = ['authorization', 'cookie'];

function redactHeaders(headers) {
  const copy = { ...headers };
  for (const name of SENSITIVE) {
    if (name in copy) copy[name] = '[redacted]';
  }
  return copy;
}
`,
    },
    {
      type: 'read',
      title: 'Never trust input',
      md: `
Everything in a request is controlled by the client: body, query, params, headers. Lesson 8's validation is the first defence. The others:

- **Build queries with parameters, never with string concatenation.** This is how SQL injection is prevented:

~~~node
// WRONG: id = "1; DROP TABLE todos" becomes part of the SQL
await db.query("SELECT * FROM todos WHERE id = " + req.params.id);

// RIGHT: the driver sends the value separately; it can never become SQL
await db.query('SELECT * FROM todos WHERE id = $1', [req.params.id]);
~~~

- **Limit body size.** \`express.json()\` rejects bodies over 100kb by default; raise it deliberately, not to "infinity".
- **Allow-list fields** (lesson 9's \`patch\`), so clients can't set \`isAdmin\`.
- **Don't pass input to a shell.** \`exec('convert ' + filename)\` runs whatever the filename contains. Use \`execFile\` with an argument array.
- **Don't leak internals in errors.** A 500 says "Internal error"; the stack trace goes to your logs.
- **Rate-limit** login and other expensive endpoints, so one client can't hammer them.

Most of this is choosing the safe API by default, so there's nothing to remember per request.
`,
    },
    {
      type: 'read',
      title: 'CORS in one page',
      md: `
Your API runs on \`api.example.com\`; your React app on \`app.example.com\`. When the React app calls \`fetch('https://api.example.com/todos')\`, the **browser** checks whether the API allows that origin to read the response. That check is **CORS** (Cross-Origin Resource Sharing).

- An **origin** is scheme + host + port: \`https://app.example.com\` and \`http://localhost:5173\` are different origins.
- The server opts in with a response header: \`Access-Control-Allow-Origin: https://app.example.com\`.
- For requests that aren't "simple" (for example \`PUT\`, \`DELETE\`, or a JSON \`content-type\`), the browser first sends a **preflight** \`OPTIONS\` request asking permission, and the server answers with \`Access-Control-Allow-Methods\` and \`Access-Control-Allow-Headers\`.

Things people get wrong:

- **CORS is not security for your API.** It only stops *browsers* from letting other sites read responses. \`curl\` and server code ignore it entirely, so you still need authentication.
- **\`*\` and cookies don't mix.** If requests carry credentials, you must name the exact origin, not \`*\`.
- **When you echo back one of several allowed origins, add \`Vary: Origin\`**, so a cache doesn't serve one origin's answer to another.

In Express, the \`cors\` package handles all of this from an allow-list. Building the core yourself is next.
`,
    },
    {
      type: 'task',
      title: 'corsHeaders',
      md: `
Write \`corsHeaders(origin, allowed)\`. \`origin\` is the request's \`Origin\` header (may be \`undefined\`) and \`allowed\` is an array of origins.

- If \`origin\` is in \`allowed\`, return \`{ 'access-control-allow-origin': origin, vary: 'Origin' }\`.
- Otherwise return \`{}\` (no CORS headers, so the browser blocks the read).

~~~
const allowed = ['https://app.example.com', 'http://localhost:5173'];
corsHeaders('http://localhost:5173', allowed)  → { 'access-control-allow-origin': 'http://localhost:5173', vary: 'Origin' }
corsHeaders('https://evil.example', allowed)   → {}
~~~
`,
      starter: `function corsHeaders(origin, allowed) {
  return { 'access-control-allow-origin': '*' };
}
`,
      tests: [
        { name: 'an allowed origin is echoed back', code: `eq(corsHeaders('http://localhost:5173', ['https://app.example.com', 'http://localhost:5173']), { 'access-control-allow-origin': 'http://localhost:5173', vary: 'Origin' });` },
        { name: 'an unknown origin gets no CORS headers', code: `eq(corsHeaders('https://evil.example', ['https://app.example.com']), {});` },
        { name: 'no Origin header gets no CORS headers', code: `eq(corsHeaders(undefined, ['https://app.example.com']), {});` },
      ],
      hint: '`if (allowed.includes(origin)) return { ... };` then `return {};`',
      solution: `function corsHeaders(origin, allowed) {
  if (allowed.includes(origin)) {
    return { 'access-control-allow-origin': origin, vary: 'Origin' };
  }
  return {};
}
`,
      explain: 'Wrapped in `(req, res, next) => { Object.assign(res.headers, corsHeaders(req.headers.origin, allowed)); next(); }`, this is a middleware from lesson 7.',
    },
    {
      type: 'read',
      title: 'A real Express 5 app to run',
      md: `
Everything in the track, as files on your machine. Requires a current Node LTS.

~~~bash
mkdir todo-api && cd todo-api
npm init -y
npm pkg set type=module scripts.dev="node --watch --env-file=.env src/server.js" scripts.test="node --test"
npm install express
printf "PORT=3000\\n" > .env && printf ".env\\nnode_modules\\n" > .gitignore
~~~

~~~node
// src/server.js
import express from 'express';
import { createStore } from './store.js';   // lesson 9's createStore, with "export" in front

const port = Number(process.env.PORT) || 3000;
const store = createStore();
const app = express();

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/todos', (req, res) => res.json(store.list()));

app.post('/todos', (req, res) => {
  const title = req.body?.title;
  if (typeof title !== 'string' || !title.trim()) return res.status(422).json({ errors: ['title is required'] });
  const todo = store.create({ title: title.trim() });
  res.status(201).location('/todos/' + todo.id).json(todo);
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));   // no route matched

app.use((err, req, res, next) => {                                     // four params: error handler
  const status = err.status ?? 500;                                    // express.json() sets 400 on bad JSON
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Internal error' : err.message });
});

const server = app.listen(port, () => console.log('listening on http://localhost:' + port));
process.on('SIGTERM', () => server.close());                           // finish in-flight requests, then exit
~~~

~~~bash
npm run dev
curl -i -X POST localhost:3000/todos -H 'content-type: application/json' -d '{"title":"Ship it"}'
~~~

\`req.body?.title\` uses optional chaining because in Express 5 \`req.body\` is \`undefined\` when a request has no JSON body.
`,
    },
    {
      type: 'read',
      title: 'Shipping checklist',
      md: `
What a host expects from a Node service, and which lesson covered it:

| Do | Why |
|---|---|
| Listen on \`process.env.PORT\` | the platform picks the port (this lesson) |
| Read all config at startup, fail fast | bad config fails the deploy, not a user's request |
| \`GET /health\` returns 200 | load balancers check it before sending traffic |
| Log to stdout/stderr, never secrets | the platform collects output; redact headers |
| Handle \`SIGTERM\`: \`server.close()\` | deploys stop old instances gracefully (lesson 10's events) |
| \`npm ci --omit=dev\` in the build | exact lock-file versions, no dev tools in production |
| Errors become clean 4xx/5xx | the error middleware from lesson 7 |
| \`npm test\` passes in CI | \`node --test\` from lesson 9 |

One more current detail: recent Node versions can run \`.ts\` files directly by **stripping** the types, much like this page's runner. Like here, nothing is type-checked when it runs, so keep \`tsc --noEmit\` in CI.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: '`DEBUG=false` is set. What is `Boolean(process.env.DEBUG)`?',
          choices: ['`true`', '`false`', '`undefined`'],
          answer: 0,
          explain: 'The value is the non-empty string `"false"`, which is truthy. Compare with `=== "true"`.',
          why: { 1: 'That would need the boolean `false`, but env values are strings.', 2: 'The variable is set, so it is a string.' },
        },
        {
          q: 'You committed an API key, then deleted it in the next commit. What now?',
          choices: ['Rotate the key: create a new one and revoke the old', 'Nothing; the latest commit is clean', 'Make the repo private'],
          answer: 0,
          explain: 'Git history still contains it, and it may already be copied. Only revoking it makes it useless.',
          why: { 1: 'The old commit still has the key.', 2: 'Anyone who already saw it still has it.' },
        },
        {
          q: 'Which query is safe from SQL injection?',
          choices: ["`db.query('SELECT * FROM todos WHERE id = $1', [id])`", "`db.query('SELECT * FROM todos WHERE id = ' + id)`", "A template literal: `SELECT * FROM todos WHERE id = ${id}`"],
          answer: 0,
          explain: 'Parameters are sent separately from the SQL, so input can never change the query.',
          why: { 1: 'Concatenation lets input become SQL.', 2: 'A template literal is still string concatenation.' },
        },
        {
          q: 'What does CORS protect against?',
          choices: ['Other websites reading your API responses through a visitor\'s browser', 'Anyone calling your API with curl', 'SQL injection'],
          answer: 0,
          explain: 'CORS is enforced by browsers only. You still need authentication for everything else.',
          why: { 1: 'curl ignores CORS completely.', 2: 'That is solved by parameterised queries.' },
        },
        {
          q: 'Your host sends `SIGTERM` before replacing an instance. What should the app do?',
          choices: ['Stop accepting new connections and let in-flight requests finish (`server.close()`)', 'Ignore it', 'Exit immediately with `process.exit(1)`'],
          answer: 0,
          explain: 'A graceful shutdown means no user sees a dropped request during a deploy.',
          why: { 1: 'The host will kill the process anyway after a timeout, mid-request.', 2: 'That cuts off requests in progress and reports a failure.' },
        },
      ],
    },
  ],
};
