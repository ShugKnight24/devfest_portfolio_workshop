// Node course · lesson 6. Step types: read, predict, task, check (see ../index.js).
// Requests are plain objects { method, url, headers, body }, as in lesson 5.
export default {
  id: 'routing',
  builds: ['node/http-anatomy', 'js/strings', 'js/loops', 'js/filter-and-find'],
  title: 'Routing: from a URL to the right function',
  goal: 'Build a small router that matches a method and a path pattern like /users/:id, and answers 404 and 405 correctly.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The if-chain stops scaling',
      md: `
In lesson 5, \`handle\` was one \`if\` per endpoint. Picture an API with twenty endpoints:

~~~
if (method === 'GET' && path === '/todos') ...
if (method === 'POST' && path === '/todos') ...
if (method === 'GET' && path.startsWith('/todos/')) ... // and pull the id out by hand
...
~~~

It works, but it mixes two jobs: **deciding which code runs** and **the code itself**. A **router** separates them. You register routes as data, a list of \`{ method, pattern, handler }\`, and one function finds the right handler:

~~~node
router.add('GET', '/todos', listTodos);
router.add('GET', '/todos/:id', getTodo);
router.add('POST', '/todos', createTodo);
~~~

That's the same idea as \`map\` in JavaScript lesson 9: the boring part (looping, matching) is written once, and you hand in only the part that changes (the handler function).

\`:id\` in a pattern is a **path parameter**: a placeholder that matches any one segment and remembers what it matched. \`/todos/:id\` matches \`/todos/42\` with \`{ id: '42' }\`.
`,
    },
    {
      type: 'predict',
      title: 'Splitting paths into segments',
      md: 'Matching works segment by segment, so start by splitting.',
      code: `console.log('/todos/42'.split('/'));
console.log('/todos/:id'.split('/'));
console.log('/todos/42/tags'.split('/').length);`,
      output: `[ "", "todos", "42" ]
[ "", "todos", ":id" ]
4`,
      explain: `
The leading \`/\` produces an empty first segment, and that's fine: it's empty on both sides, so the two still line up.

Now matching is easy to describe. Same number of segments? Then for each position, a segment starting with \`:\` captures the value, and any other segment must match exactly. \`/todos/42/tags\` has 4 segments and \`/todos/:id\` has 3, so it can't match.
`,
    },
    {
      type: 'task',
      title: 'matchPath',
      md: `
Write \`matchPath(pattern, path)\`. Return an object of params if it matches, or \`null\` if it doesn't:

~~~
matchPath('/todos/:id', '/todos/42')          → { id: '42' }
matchPath('/users/:userId/posts/:postId', '/users/7/posts/3')  → { userId: '7', postId: '3' }
matchPath('/todos', '/todos')                 → {}
matchPath('/todos/:id', '/users/42')          → null
matchPath('/todos/:id', '/todos/42/tags')     → null
~~~

The starter splits both strings and handles different lengths. You write the loop.
`,
      starter: `function matchPath(pattern, path) {
  const want = pattern.split('/');
  const got = path.split('/');
  if (want.length !== got.length) return null;

  const params = {};
  // your code here: compare want[i] with got[i]
  return params;
}
`,
      tests: [
        { name: "'/todos/:id' matches '/todos/42'", code: `eq(matchPath('/todos/:id', '/todos/42'), { id: '42' });` },
        { name: 'two params', code: `eq(matchPath('/users/:userId/posts/:postId', '/users/7/posts/3'), { userId: '7', postId: '3' });` },
        { name: 'no params gives {}', code: `eq(matchPath('/todos', '/todos'), {});` },
        { name: 'a different fixed segment gives null', code: `eq(matchPath('/todos/:id', '/users/42'), null);` },
        { name: 'a different length gives null', code: `eq(matchPath('/todos/:id', '/todos/42/tags'), null);` },
      ],
      hint: 'Loop `for (let i = 0; i < want.length; i++)`. If `want[i].startsWith(":")`, set `params[want[i].slice(1)] = got[i]`. Otherwise, if `want[i] !== got[i]`, return `null`.',
      solution: `function matchPath(pattern, path) {
  const want = pattern.split('/');
  const got = path.split('/');
  if (want.length !== got.length) return null;

  const params = {};
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) {
      params[want[i].slice(1)] = got[i];   // ':id' captures under the name 'id'
    } else if (want[i] !== got[i]) {
      return null;
    }
  }
  return params;
}
`,
      explain: 'Params are always **strings**, like query values. `/todos/42` gives `{ id: "42" }`, so compare with `Number(params.id)` when your ids are numbers.',
    },
    {
      type: 'read',
      title: 'A router is a list plus a loop',
      md: `
With \`matchPath\` in hand, a router is a few lines. It keeps an array of routes. \`handle(req)\` goes through them in order and calls the first handler whose method and path both match, passing the params along:

~~~js
function matchPath(pattern, path) {
  const want = pattern.split('/'), got = path.split('/');
  if (want.length !== got.length) return null;
  const params = {};
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = got[i];
    else if (want[i] !== got[i]) return null;
  }
  return params;
}

const routes = [
  { method: 'GET', pattern: '/todos', handler: () => 'list' },
  { method: 'GET', pattern: '/todos/:id', handler: (req) => 'todo ' + req.params.id },
];

function handle(req) {
  for (const r of routes) {
    const params = matchPath(r.pattern, req.path);
    if (params && r.method === req.method) return r.handler({ ...req, params });
  }
  return 'not found';
}

console.log(handle({ method: 'GET', path: '/todos/42' }));
console.log(handle({ method: 'GET', path: '/nope' }));
~~~

\`{ ...req, params }\` (JavaScript lesson 12) gives the handler a copy of the request with \`params\` added, so handlers read \`req.params.id\`. Express uses exactly that name.
`,
    },
    {
      type: 'task',
      title: 'createRouter',
      md: `
Now package it. \`createRouter()\` returns an object with:

- \`add(method, pattern, handler)\`: already written; it pushes onto \`routes\`.
- \`handle(req)\`: **you write the loop.** Call the first matching route's handler with \`{ ...req, path, query, params }\` and return what it returns. If nothing matches, return the 404 that's already there.

~~~
const router = createRouter();
router.add('GET', '/todos/:id', (req) => json(200, { id: req.params.id }));
router.handle({ method: 'GET', url: '/todos/42', headers: {} })   → status 200, body '{"id":"42"}'
router.handle({ method: 'GET', url: '/nope', headers: {} })       → status 404
~~~

\`json\`, \`parseUrl\` and \`matchPath\` from earlier are in the starter.
`,
      starter: `function json(status, data) {
  return { status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}
function parseUrl(url) {
  const u = new URL(url, 'http://localhost');
  return { path: u.pathname, query: Object.fromEntries(u.searchParams) };
}
function matchPath(pattern, path) {
  const want = pattern.split('/'), got = path.split('/');
  if (want.length !== got.length) return null;
  const params = {};
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = got[i];
    else if (want[i] !== got[i]) return null;
  }
  return params;
}

function createRouter() {
  const routes = [];
  return {
    add(method, pattern, handler) {
      routes.push({ method, pattern, handler });
    },
    handle(req) {
      const { path, query } = parseUrl(req.url);
      // your code here
      return json(404, { error: 'Not found' });
    },
  };
}
`,
      tests: [
        {
          name: 'calls the matching handler with params',
          code: `const router = createRouter();
router.add('GET', '/todos/:id', (req) => json(200, { id: req.params.id }));
const res = router.handle({ method: 'GET', url: '/todos/42', headers: {} });
eq(res.status, 200); eq(JSON.parse(res.body), { id: '42' });`,
        },
        {
          name: 'the handler also gets the query',
          code: `const router = createRouter();
router.add('GET', '/todos', (req) => json(200, req.query));
eq(JSON.parse(router.handle({ method: 'GET', url: '/todos?done=true', headers: {} }).body), { done: 'true' });`,
        },
        {
          name: 'an unknown path is 404',
          code: `const router = createRouter();
router.add('GET', '/todos', () => json(200, []));
eq(router.handle({ method: 'GET', url: '/nope', headers: {} }).status, 404);`,
        },
        {
          name: 'the method must match too',
          code: `const router = createRouter();
router.add('GET', '/todos', () => json(200, 'get'));
router.add('POST', '/todos', () => json(201, 'post'));
eq(router.handle({ method: 'POST', url: '/todos', headers: {} }).status, 201);`,
        },
      ],
      hint: 'Inside `handle`: `for (const r of routes) { const params = matchPath(r.pattern, path); if (params && r.method === req.method) return r.handler({ ...req, path, query, params }); }`',
      solution: `function json(status, data) {
  return { status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}
function parseUrl(url) {
  const u = new URL(url, 'http://localhost');
  return { path: u.pathname, query: Object.fromEntries(u.searchParams) };
}
function matchPath(pattern, path) {
  const want = pattern.split('/'), got = path.split('/');
  if (want.length !== got.length) return null;
  const params = {};
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = got[i];
    else if (want[i] !== got[i]) return null;
  }
  return params;
}

function createRouter() {
  const routes = [];
  return {
    add(method, pattern, handler) {
      routes.push({ method, pattern, handler });
    },
    handle(req) {
      const { path, query } = parseUrl(req.url);
      for (const r of routes) {
        const params = matchPath(r.pattern, path);
        if (params && r.method === req.method) {
          return r.handler({ ...req, path, query, params });
        }
      }
      return json(404, { error: 'Not found' });
    },
  };
}
`,
    },
    {
      type: 'predict',
      title: 'Route order matters',
      md: 'Both routes could match `/users/me`. Which one wins?',
      code: `function matchPath(pattern, path) {
  const want = pattern.split('/'), got = path.split('/');
  if (want.length !== got.length) return null;
  const params = {};
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = got[i];
    else if (want[i] !== got[i]) return null;
  }
  return params;
}

const routes = [
  { pattern: '/users/:id', name: 'getUser' },
  { pattern: '/users/me', name: 'getMe' },
];
const winner = routes.find((r) => matchPath(r.pattern, '/users/me'));
console.log(winner.name, matchPath(winner.pattern, '/users/me'));`,
      output: `getUser { id: "me" }`,
      explain: `
The router takes the **first** match, and \`/users/:id\` matches \`/users/me\` with \`{ id: 'me' }\`. So \`getMe\` is never reached, and your code tries to look up a user whose id is \`"me"\`.

The fix is to register **specific routes before general ones**: \`/users/me\` first, then \`/users/:id\`. Express matches in registration order too, so the same rule applies there.
`,
    },
    {
      type: 'read',
      title: '404 or 405?',
      md: `
Two different "no":

- **404 Not Found**: nothing lives at this path. \`GET /nope\`.
- **405 Method Not Allowed**: something lives here, just not for this method. \`DELETE /todos\` when only \`GET\` and \`POST\` are registered.

A 405 response must include an \`Allow\` header listing the methods that *would* work:

~~~text
HTTP/1.1 405 Method Not Allowed
Allow: GET, POST
Content-Type: application/json

{"error":"Method not allowed"}
~~~

It's a small thing, but it tells a client developer "your URL is right, your method is wrong", which is a much faster fix than "this doesn't exist".

(Express answers both cases with 404 by default. If you want 405s there, you add them yourself, which is what you're about to do here.)
`,
    },
    {
      type: 'task',
      title: 'Add 405 with an Allow header',
      md: `
Change \`handle\` so that when the **path** matches one or more routes but none has the right **method**, it returns:

~~~
status 405, body { error: 'Method not allowed' },
headers { 'content-type': 'application/json', allow: 'GET, POST' }
~~~

List the allowed methods in the order the routes were added, joined with \`', '\`. Unknown paths still get 404.

The plan: collect the method of every route whose path matched into an \`allowed\` array as you loop. After the loop, if \`allowed\` isn't empty, return the 405.
`,
      starter: `function json(status, data) {
  return { status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}
function matchPath(pattern, path) {
  const want = pattern.split('/'), got = path.split('/');
  if (want.length !== got.length) return null;
  const params = {};
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = got[i];
    else if (want[i] !== got[i]) return null;
  }
  return params;
}

function createRouter() {
  const routes = [];
  return {
    add(method, pattern, handler) {
      routes.push({ method, pattern, handler });
    },
    handle(req) {
      const path = new URL(req.url, 'http://localhost').pathname;
      for (const r of routes) {
        const params = matchPath(r.pattern, path);
        if (params && r.method === req.method) return r.handler({ ...req, path, params });
      }
      return json(404, { error: 'Not found' });
    },
  };
}
`,
      tests: [
        {
          name: 'a wrong method on a known path is 405',
          code: `const router = createRouter();
router.add('GET', '/todos', () => json(200, []));
router.add('POST', '/todos', () => json(201, {}));
const res = router.handle({ method: 'DELETE', url: '/todos', headers: {} });
eq(res.status, 405); eq(JSON.parse(res.body), { error: 'Method not allowed' });`,
        },
        {
          name: 'the Allow header lists the methods that work',
          code: `const router = createRouter();
router.add('GET', '/todos', () => json(200, []));
router.add('POST', '/todos', () => json(201, {}));
eq(router.handle({ method: 'DELETE', url: '/todos', headers: {} }).headers.allow, 'GET, POST');`,
        },
        {
          name: 'an unknown path is still 404',
          code: `const router = createRouter();
router.add('GET', '/todos', () => json(200, []));
eq(router.handle({ method: 'GET', url: '/nope', headers: {} }).status, 404);`,
        },
        {
          name: 'a matching method still reaches its handler',
          code: `const router = createRouter();
router.add('GET', '/todos/:id', (req) => json(200, { id: req.params.id }));
eq(JSON.parse(router.handle({ method: 'GET', url: '/todos/3', headers: {} }).body), { id: '3' });`,
        },
      ],
      hint: 'Make `const allowed = [];` before the loop. Inside it, when `params` is truthy but the method differs, `allowed.push(r.method)`. After the loop: `if (allowed.length) { const res = json(405, {...}); res.headers.allow = allowed.join(", "); return res; }`',
      solution: `function json(status, data) {
  return { status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}
function matchPath(pattern, path) {
  const want = pattern.split('/'), got = path.split('/');
  if (want.length !== got.length) return null;
  const params = {};
  for (let i = 0; i < want.length; i++) {
    if (want[i].startsWith(':')) params[want[i].slice(1)] = got[i];
    else if (want[i] !== got[i]) return null;
  }
  return params;
}

function createRouter() {
  const routes = [];
  return {
    add(method, pattern, handler) {
      routes.push({ method, pattern, handler });
    },
    handle(req) {
      const path = new URL(req.url, 'http://localhost').pathname;
      const allowed = [];
      for (const r of routes) {
        const params = matchPath(r.pattern, path);
        if (!params) continue;
        if (r.method === req.method) return r.handler({ ...req, path, params });
        allowed.push(r.method);
      }
      if (allowed.length) {
        const res = json(405, { error: 'Method not allowed' });
        res.headers.allow = allowed.join(', ');
        return res;
      }
      return json(404, { error: 'Not found' });
    },
  };
}
`,
    },
    {
      type: 'read',
      title: 'The same thing in Express',
      md: `
Express's router is this lesson's router with more features. The route table looks almost identical:

~~~node
import express from 'express';
const app = express();

app.get('/users/me', (req, res) => res.json({ id: 'me' }));       // specific first
app.get('/users/:id', (req, res) => res.json({ id: req.params.id }));
app.post('/users', (req, res) => res.status(201).json({ created: true }));

app.listen(3000);
~~~

- \`app.get(pattern, handler)\` is your \`router.add('GET', pattern, handler)\`.
- \`req.params\` and \`req.query\` are the objects you built, and their values are strings.
- Instead of *returning* a response, Express handlers *call* methods on \`res\`: \`res.status(201).json(data)\` does what your \`json(201, data)\` did.

One Express 5 detail worth knowing: wildcards must be named. Express 4 accepted \`app.get('*', ...)\`; Express 5 needs \`app.get('/*splat', ...)\`, and the matched part arrives as \`req.params.splat\`.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'What does `/orders/:orderId` give for the path `/orders/99`?',
          choices: ["`{ orderId: '99' }`", '`{ orderId: 99 }`', "`{ id: '99' }`"],
          answer: 0,
          explain: 'The name after the colon becomes the key, and the value is the string from the path.',
          why: { 1: 'Path params are strings until you convert them.', 2: 'The key is whatever follows the colon: `orderId`.' },
        },
        {
          q: 'Routes are registered as `/files/:name` then `/files/latest`. What handles `GET /files/latest`?',
          choices: ['The `/files/:name` handler, with name `latest`', 'The `/files/latest` handler', 'Neither; it is a 404'],
          answer: 0,
          explain: 'The first match wins. Register specific routes before general ones.',
          why: { 1: 'It would, if it were registered first.', 2: '`:name` matches any single segment.' },
        },
        {
          q: 'Only `GET /todos` and `POST /todos` exist. A client sends `PUT /todos`. What should it get?',
          choices: ['405 with `Allow: GET, POST`', '404 Not Found', '400 Bad Request'],
          answer: 0,
          explain: 'The path exists; the method does not. 405 plus an `Allow` header says exactly that.',
          why: { 1: '404 says nothing lives at `/todos`, which is wrong.', 2: '400 is for a malformed request, not an unsupported method.' },
        },
        {
          q: 'Why does `/todos/:id` not match `/todos/5/comments`?',
          choices: ['The number of segments differs', 'Params cannot be numbers', 'Paths are case-sensitive'],
          answer: 0,
          explain: 'Each pattern segment matches exactly one path segment, so the counts must be equal.',
          why: { 1: 'Any text works, digits included.', 2: 'Case is not the problem here; the extra segment is.' },
        },
      ],
    },
  ],
};
