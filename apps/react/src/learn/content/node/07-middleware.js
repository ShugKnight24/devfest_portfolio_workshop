// Node course · lesson 7. Step types: read, predict, task, check (see ../index.js).
// The runnable model is synchronous and uses a plain res object { status, headers, body };
// the ~~~node blocks show the Express equivalent.
export default {
  id: 'middleware',
  builds: ['node/routing', 'js/map', 'js/functions'],
  title: 'Middleware: the next() chain',
  goal: 'Write logging, auth and body-parsing middleware, build the next() runner that calls them, and route errors to an error handler.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Work that every request needs',
      md: `
Your router from lesson 6 picks **one** handler per request. But some work applies to many routes:

- log every request
- reject requests without a valid token
- parse JSON bodies
- turn thrown errors into a clean 500

Copying that into every handler is how bugs happen: someone adds a route and forgets the auth check. **Middleware** is the fix. A middleware is a function that sees the request on its way to the handler and decides whether to pass it along:

~~~
function middleware(req, res, next) {
  // look at req, maybe change req or res
  next();          // pass control to the next function in the chain
}
~~~

\`next\` is a **callback** (JavaScript lesson 9: a function you're handed and call when it's time). Calling it means "I'm done, continue". *Not* calling it means "stop here, I've answered".

Express apps are mostly a stack of these, with route handlers at the end. In this lesson \`res\` is a plain object \`{ status, headers, body }\` that middleware fills in.
`,
    },
    {
      type: 'read',
      title: 'A runner in eight lines',
      md: `
Something has to call the stack in order and give each function its \`next\`. Here's the whole thing:

~~~js
function run(stack, req) {
  const res = { status: 200, headers: {}, body: undefined };
  let i = 0;
  function next() {
    const fn = stack[i++];       // take the next function, move the pointer
    if (fn) fn(req, res, next);  // hand it the same next, so it can continue the chain
  }
  next();
  return res;
}

const stack = [
  (req, res, next) => { console.log('1. log', req.method, req.url); next(); },
  (req, res, next) => { req.user = 'ada'; next(); },
  (req, res) => { res.body = 'hello ' + req.user; },
];

console.log(run(stack, { method: 'GET', url: '/me', headers: {} }));
~~~

Run it, then **Edit** the second function to remove its \`next()\` call and run it again. The handler never runs and the body stays \`undefined\`.

Notice how middleware talk to each other: by **adding properties to \`req\`**. The second function sets \`req.user\`; the handler reads it. That's how \`req.body\`, \`req.user\` and \`req.params\` appear in Express.
`,
    },
    {
      type: 'predict',
      title: 'Code after next()',
      md: '`next()` is just a function call, so code after it runs when it returns.',
      code: `function run(stack, req) {
  const res = { status: 200, headers: {}, body: undefined };
  let i = 0;
  function next() {
    const fn = stack[i++];
    if (fn) fn(req, res, next);
  }
  next();
  return res;
}

run([
  (req, res, next) => { console.log('A in'); next(); console.log('A out'); },
  (req, res, next) => { console.log('B in'); next(); console.log('B out'); },
  (req, res) => { console.log('handler'); },
], {});`,
      output: `A in
B in
handler
B out
A out`,
      explain: `
Each \`next()\` call goes one level deeper, and the "out" lines run as the calls return, innermost first. People call this the **onion**: the request goes in through every layer, and the response comes back out through them in reverse.

It's why a timing middleware can do \`const start = Date.now(); next(); log(Date.now() - start)\`. (With async handlers, real frameworks wait for the response to *finish* rather than for \`next()\` to return, but the shape is the same.)
`,
    },
    {
      type: 'task',
      title: 'logger',
      md: `
Write a middleware \`logger(req, res, next)\`. It pushes \`req.method + ' ' + req.url\` into the \`lines\` array (already declared) and then calls \`next()\`.

~~~
logger({ method: 'GET', url: '/todos' }, res, next)
  lines  → ['GET /todos']
  next   → called once
~~~
`,
      starter: `const lines = [];

function logger(req, res, next) {
  // your code here
}
`,
      tests: [
        { name: "logs 'GET /todos'", code: `logger({ method: 'GET', url: '/todos' }, {}, () => {}); eq(lines, ['GET /todos']);` },
        { name: 'calls next exactly once', code: `let calls = 0; logger({ method: 'POST', url: '/x' }, {}, () => { calls++; }); eq(calls, 1);` },
      ],
      hint: "Two lines: `lines.push(req.method + ' ' + req.url);` then `next();`",
      solution: `const lines = [];

function logger(req, res, next) {
  lines.push(req.method + ' ' + req.url);
  next();
}
`,
    },
    {
      type: 'task',
      title: 'requireAuth',
      md: `
Write \`requireAuth(req, res, next)\`:

- If \`req.headers.authorization\` is exactly \`'Bearer secret'\`, set \`req.user = { id: 1 }\` and call \`next()\`.
- Otherwise, set \`res.status = 401\` and \`res.body = { error: 'Unauthorized' }\`, and **don't** call \`next()\`.

~~~
headers { authorization: 'Bearer secret' }  → req.user is { id: 1 }, next() called
headers {}                                    → res.status 401, next() not called
~~~

(A real app verifies a signed token or looks up a session instead of comparing to a fixed string. The middleware shape is the same.)
`,
      starter: `function requireAuth(req, res, next) {
  // your code here
}
`,
      tests: [
        {
          name: 'a valid token reaches next with req.user set',
          code: `const req = { headers: { authorization: 'Bearer secret' } }; let called = false;
requireAuth(req, { status: 200 }, () => { called = true; });
eq(called, true); eq(req.user, { id: 1 });`,
        },
        {
          name: 'no token gives 401 and stops',
          code: `const res = { status: 200 }; let called = false;
requireAuth({ headers: {} }, res, () => { called = true; });
eq(res.status, 401); eq(res.body, { error: 'Unauthorized' }); eq(called, false);`,
        },
        {
          name: 'a wrong token gives 401',
          code: `const res = { status: 200 }; requireAuth({ headers: { authorization: 'Bearer nope' } }, res, () => {}); eq(res.status, 401);`,
        },
      ],
      hint: 'Check the bad case first and `return` early: `if (req.headers.authorization !== "Bearer secret") { res.status = 401; res.body = {...}; return; }`. Then set `req.user` and call `next()`.',
      solution: `function requireAuth(req, res, next) {
  if (req.headers.authorization !== 'Bearer secret') {
    res.status = 401;
    res.body = { error: 'Unauthorized' };
    return;                        // no next(): the chain stops here
  }
  req.user = { id: 1 };
  next();
}
`,
      explain: '401 means "I don\'t know who you are". If the user is known but not allowed (not an admin, not the owner), that is 403. Lesson 8 has the full list.',
    },
    {
      type: 'task',
      title: 'jsonBody',
      md: `
Write \`jsonBody(req, res, next)\`, a tiny \`express.json()\`:

- If \`req.headers['content-type']\` is \`'application/json'\`, replace \`req.body\` (a string) with the parsed object, then call \`next()\`.
- If parsing fails, set \`res.status = 400\` and \`res.body = { error: 'Invalid JSON' }\`, and don't call \`next()\`.
- Any other content type: leave \`req.body\` alone and call \`next()\`.

~~~
{ headers: { 'content-type': 'application/json' }, body: '{"a":1}' }  → req.body becomes { a: 1 }
~~~
`,
      starter: `function jsonBody(req, res, next) {
  // your code here
}
`,
      tests: [
        {
          name: 'parses a JSON body',
          code: `const req = { headers: { 'content-type': 'application/json' }, body: '{"a":1}' }; let called = false;
jsonBody(req, { status: 200 }, () => { called = true; });
eq(req.body, { a: 1 }); eq(called, true);`,
        },
        {
          name: 'broken JSON gives 400 and stops',
          code: `const res = { status: 200 }; let called = false;
jsonBody({ headers: { 'content-type': 'application/json' }, body: '{' }, res, () => { called = true; });
eq(res.status, 400); eq(res.body, { error: 'Invalid JSON' }); eq(called, false);`,
        },
        {
          name: 'other content types pass through untouched',
          code: `const req = { headers: { 'content-type': 'text/plain' }, body: 'hi' }; let called = false;
jsonBody(req, { status: 200 }, () => { called = true; });
eq(req.body, 'hi'); eq(called, true);`,
        },
      ],
      hint: 'If the content type is not JSON, `return next();`. Otherwise `try { req.body = JSON.parse(req.body); } catch { ...400...; return; }` and then `next();`',
      solution: `function jsonBody(req, res, next) {
  if (req.headers['content-type'] !== 'application/json') return next();
  try {
    req.body = JSON.parse(req.body);
  } catch {
    res.status = 400;
    res.body = { error: 'Invalid JSON' };
    return;
  }
  next();
}
`,
      explain: 'Real content types often carry extras like `application/json; charset=utf-8`, so production parsers check the start of the header rather than the exact string. `express.json()` also caps the body size (100kb by default).',
    },
    {
      type: 'read',
      title: 'Errors skip ahead',
      md: `
When something goes wrong, a middleware can call \`next(err)\` with an error. Now the chain changes mode:

- Every **normal** middleware is **skipped**.
- The next **error handler** runs. An error handler is a middleware with **four** parameters: \`(err, req, res, next)\`.

~~~node
app.use(logger);
app.use(requireAuth);
app.get('/todos/:id', getTodo);           // calls next(err) if the database fails

app.use((err, req, res, next) => {        // four params: Express treats this as an error handler
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});
~~~

How does Express know it's an error handler? It checks the function's \`.length\`, the number of declared parameters:

~~~js
const normal = (req, res, next) => {};
const errorHandler = (err, req, res, next) => {};
console.log(normal.length, errorHandler.length);
~~~

That's why an error handler must declare all four parameters even if it never uses \`next\`. Drop one and Express treats it as normal middleware.

Error handlers go **last**, after all your routes, so they can catch errors from any of them.
`,
    },
    {
      type: 'task',
      title: 'Add error routing to the runner',
      md: `
Upgrade \`run\` so \`next\` understands errors:

- \`next()\` with no argument: run the next **normal** middleware (\`fn.length !== 4\`), skipping error handlers.
- \`next(err)\`: skip normal middleware and run the next **error handler** (\`fn.length === 4\`) as \`fn(err, req, res, next)\`.

Hint at the shape: instead of taking exactly one function, \`next\` keeps advancing \`i\` in a \`while\` loop until it finds a function of the right kind.

~~~
run([
  (req, res, next) => next(new Error('db down')),
  (req, res) => { res.body = 'never runs'; },
  (err, req, res, next) => { res.status = 500; res.body = err.message; },
], {})
→ { status: 500, headers: {}, body: 'db down' }
~~~
`,
      starter: `function run(stack, req) {
  const res = { status: 200, headers: {}, body: undefined };
  let i = 0;
  function next(err) {
    const fn = stack[i++];
    if (fn) fn(req, res, next);
  }
  next();
  return res;
}
`,
      tests: [
        {
          name: 'next(err) jumps to the error handler',
          code: `const res = run([
  (req, res, next) => next(new Error('db down')),
  (req, res) => { res.body = 'never runs'; },
  (err, req, res, next) => { res.status = 500; res.body = err.message; },
], {});
eq(res, { status: 500, headers: {}, body: 'db down' });`,
        },
        {
          name: 'without an error, error handlers are skipped',
          code: `const res = run([
  (req, res, next) => next(),
  (err, req, res, next) => { res.status = 500; },
  (req, res) => { res.body = 'ok'; },
], {});
eq(res, { status: 200, headers: {}, body: 'ok' });`,
        },
        {
          name: 'the normal flow still works',
          code: `const res = run([(req, res, next) => { req.user = 'ada'; next(); }, (req, res) => { res.body = req.user; }], {}); eq(res.body, 'ada');`,
        },
      ],
      hint: 'Inside `next(err)`: `while (i < stack.length) { const fn = stack[i++]; const isErrorHandler = fn.length === 4; if (err && isErrorHandler) return fn(err, req, res, next); if (!err && !isErrorHandler) return fn(req, res, next); }`',
      solution: `function run(stack, req) {
  const res = { status: 200, headers: {}, body: undefined };
  let i = 0;
  function next(err) {
    while (i < stack.length) {
      const fn = stack[i++];
      const isErrorHandler = fn.length === 4;
      if (err && isErrorHandler) return fn(err, req, res, next);
      if (!err && !isErrorHandler) return fn(req, res, next);
      // wrong kind for this mode: skip it and keep looking
    }
  }
  next();
  return res;
}
`,
      explain: 'Express also wraps each call in `try`/`catch` and turns a synchronous `throw` into `next(err)`, so a bug in a handler reaches your error handler instead of crashing the request.',
    },
    {
      type: 'read',
      title: 'Async handlers: Express 4 vs Express 5',
      md: `
Real handlers \`await\` a database, and an \`await\` can reject. What happens to that error depends on the Express version:

~~~node
app.get('/todos/:id', async (req, res) => {
  const todo = await db.findTodo(req.params.id);   // suppose this rejects
  res.json(todo);
});
~~~

- **Express 4** didn't look at the promise your handler returned. The rejection became an **unhandled rejection**, which on current Node versions crashes the whole process by default, taking every other in-flight request with it. You had to wrap every async handler in \`try { ... } catch (err) { next(err); }\`.
- **Express 5** (the current major version) checks: if a handler or middleware returns a promise that rejects, Express calls \`next(err)\` for you, so the error reaches your error handler.

So in Express 5 the code above is fine as written, and the \`try\`/\`catch\` is only needed when you want to handle a specific error yourself (for example, turning "not found" into a 404).

Two other Express 5 changes you may trip over: \`req.body\` is \`undefined\` until a body parser such as \`express.json()\` runs, and wildcard routes need a name (\`/*splat\`).
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'A middleware neither calls `next()` nor sets a response. What does the client see?',
          choices: ['The request hangs until it times out', 'An automatic 404', 'An automatic 500'],
          answer: 0,
          explain: 'Nothing continues the chain and nothing answers. Every middleware must either call `next` or respond.',
          why: { 1: 'The 404 fallback is never reached, because the chain stopped.', 2: 'No error happened, so no error handler runs.' },
        },
        {
          q: 'How does Express recognise an error-handling middleware?',
          choices: ['It declares four parameters: `(err, req, res, next)`', 'Its name starts with `error`', 'It is registered with `app.error()`'],
          answer: 0,
          explain: 'Express checks `fn.length === 4`.',
          why: { 1: 'Names are not inspected.', 2: 'There is no `app.error()`; you use `app.use` with four parameters.' },
        },
        {
          q: 'An auth middleware finds no token. What should it do?',
          choices: ['Send a 401 and not call `next()`', 'Call `next()` and let the handler decide', 'Throw an error and also call `next()`'],
          answer: 0,
          explain: 'Stopping the chain is the whole point of an auth check.',
          why: { 1: 'Then every handler has to repeat the check.', 2: 'Doing both runs the chain twice.' },
        },
        {
          q: 'In Express 5, an async handler\'s `await` rejects. Where does the error go?',
          choices: ['To the error-handling middleware, via `next(err)`', 'Nowhere; the request hangs', 'It crashes the process'],
          answer: 0,
          explain: 'Express 5 forwards rejected promises from handlers and middleware to `next(err)`.',
          why: { 1: 'Express 5 does not ignore the returned promise.', 2: 'That was the Express 4 risk; Express 5 catches the rejection first.' },
        },
        {
          q: 'Where do error handlers belong in the stack?',
          choices: ['After all the routes', 'Before all the routes', 'Anywhere; order does not matter'],
          answer: 0,
          explain: '`next(err)` only looks forward in the stack, so handlers placed last can catch errors from every route.',
          why: { 1: 'Errors raised later can never reach a handler placed earlier.', 2: 'The stack runs in order, errors included.' },
        },
      ],
    },
  ],
};
