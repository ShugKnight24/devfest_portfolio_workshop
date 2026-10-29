// Node course · lesson 9 (track capstone). Step types: read, predict, task, check (see ../index.js).
// Shared code chunks below are reused in several starters so each task only asks for one new piece.
// In this lesson json() keeps body as an object; the server glue would JSON.stringify it once at the edge.

const STORE = `function createStore() {
  const todos = [];
  let nextId = 1;
  return {
    list() { return [...todos]; },
    create({ title }) {
      const todo = { id: nextId++, title, done: false };
      todos.push(todo);
      return todo;
    },
    get(id) { return todos.find((t) => t.id === id) || null; },
    update(id, patch) {
      const i = todos.findIndex((t) => t.id === id);
      if (i === -1) return null;
      todos[i] = { ...todos[i], ...patch, id };
      return todos[i];
    },
    remove(id) {
      const i = todos.findIndex((t) => t.id === id);
      if (i === -1) return false;
      todos.splice(i, 1);
      return true;
    },
  };
}
`;

const SETUP = `${STORE}
const json = (status, data) => ({ status, headers: { 'content-type': 'application/json' }, body: data });

const store = createStore();
store.create({ title: 'Write talk' });   // id 1
store.create({ title: 'Book train' });   // id 2
`;

const VALIDATE = `function validateTodo(body, { partial = false } = {}) {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') errors.push('title is required');
  }
  if (body.done !== undefined && typeof body.done !== 'boolean') errors.push('done must be a boolean');
  return errors;
}
`;

const HANDLERS = `function listTodos(req) {
  let todos = store.list();
  if (req.query.done !== undefined) {
    const want = req.query.done === 'true';
    todos = todos.filter((t) => t.done === want);
  }
  return json(200, todos);
}

function getTodo(req) {
  const todo = store.get(Number(req.params.id));
  if (!todo) return json(404, { error: 'Not found' });
  return json(200, todo);
}

function createTodo(req) {
  const errors = validateTodo(req.body);
  if (errors.length) return json(422, { errors });
  const todo = store.create({ title: req.body.title.trim() });
  const res = json(201, todo);
  res.headers.location = '/todos/' + todo.id;
  return res;
}

function updateTodo(req) {
  const errors = validateTodo(req.body, { partial: true });
  if (errors.length) return json(422, { errors });
  const { title, done } = req.body;
  const patch = {};
  if (title !== undefined) patch.title = title.trim();
  if (done !== undefined) patch.done = done;
  const todo = store.update(Number(req.params.id), patch);
  if (!todo) return json(404, { error: 'Not found' });
  return json(200, todo);
}

function deleteTodo(req) {
  if (!store.remove(Number(req.params.id))) return json(404, { error: 'Not found' });
  return { status: 204, headers: {}, body: null };
}
`;

const ROUTER = `function matchPath(pattern, path) {
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
    add(method, pattern, handler) { routes.push({ method, pattern, handler }); },
    handle(req) {
      const u = new URL(req.url, 'http://localhost');
      const path = u.pathname, query = Object.fromEntries(u.searchParams);
      const allowed = [];
      for (const r of routes) {
        const params = matchPath(r.pattern, path);
        if (!params) continue;
        if (r.method === req.method) return r.handler({ ...req, path, query, params });
        allowed.push(r.method);
      }
      if (allowed.length) return { status: 405, headers: { allow: allowed.join(', ') }, body: { error: 'Method not allowed' } };
      return { status: 404, headers: {}, body: { error: 'Not found' } };
    },
  };
}
`;

export default {
  id: 'crud-service',
  builds: ['node/rest-design', 'node/routing', 'js/filter-and-find', 'js/spread-and-destructuring'],
  title: 'Capstone: a todo API, store to routes',
  goal: 'Build a complete in-memory CRUD service in layers: a data store, one handler per endpoint, and a router that ties them together, all tested without a server.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'The plan: three layers',
      md: `
This lesson puts lessons 5 to 8 together into one working API for todos. You'll build it in three layers, each only talking to the one below:

~~~text
HTTP glue (node:http or Express)     turns real requests into plain objects   (lesson 5)
  router                             method + path → handler                  (lesson 6)
    handlers                         validate, pick a status code, call the store  (lesson 8)
      store                          the data: create, list, get, update, remove
~~~

Why layers? Each one can be tested on its own, and each can be swapped. The store here keeps todos in an array; later it could talk to Postgres, and **no handler would change**, because handlers only call \`store.get(id)\`, not "SELECT ...".

The endpoints you're building:

| Request | Success | Failure |
|---|---|---|
| \`GET /todos\` (optional \`?done=true\`) | 200, array | |
| \`GET /todos/:id\` | 200, todo | 404 |
| \`POST /todos\` | 201 + Location | 422 |
| \`PATCH /todos/:id\` | 200, todo | 404, 422 |
| \`DELETE /todos/:id\` | 204 | 404 |

Every task is small, and each starter already contains the pieces you built before it.
`,
    },
    {
      type: 'task',
      title: 'Store: create and list',
      md: `
\`createStore()\` returns an object whose methods share a private \`todos\` array and \`nextId\` counter (the closure idea from lesson 2's loader).

Write two methods:

- \`create({ title })\` makes \`{ id: nextId++, title, done: false }\`, pushes it, and returns it.
- \`list()\` returns a **copy** of the array (\`[...todos]\`), so callers can't push into your data by accident.

~~~
const store = createStore();
store.create({ title: 'Write talk' })   → { id: 1, title: 'Write talk', done: false }
store.list()                            → [{ id: 1, title: 'Write talk', done: false }]
~~~
`,
      starter: `function createStore() {
  const todos = [];
  let nextId = 1;
  return {
    list() {
      // your code here
    },
    create({ title }) {
      // your code here
    },
  };
}
`,
      tests: [
        { name: 'create returns the new todo', code: `const store = createStore(); eq(store.create({ title: 'Write talk' }), { id: 1, title: 'Write talk', done: false });` },
        { name: 'ids count up from 1', code: `const store = createStore(); store.create({ title: 'a' }); eq(store.create({ title: 'b' }).id, 2);` },
        { name: 'list returns what was created', code: `const store = createStore(); store.create({ title: 'a' }); eq(store.list(), [{ id: 1, title: 'a', done: false }]);` },
        { name: 'pushing into the list does not change the store', code: `const store = createStore(); store.list().push('junk'); eq(store.list(), []);` },
      ],
      hint: '`list` is one line: `return [...todos];`. `create` is three: build the object with `id: nextId++`, push it, return it.',
      solution: `function createStore() {
  const todos = [];
  let nextId = 1;
  return {
    list() {
      return [...todos];
    },
    create({ title }) {
      const todo = { id: nextId++, title, done: false };
      todos.push(todo);
      return todo;
    },
  };
}
`,
    },
    {
      type: 'task',
      title: 'Store: get and remove',
      md: `
Add two methods to the store:

- \`get(id)\` returns the todo with that \`id\`, or \`null\` if there isn't one.
- \`remove(id)\` deletes it and returns \`true\`, or returns \`false\` if it wasn't there.

~~~
store.get(1)      → { id: 1, title: 'Write talk', done: false }
store.get(99)     → null
store.remove(1)   → true      (and store.get(1) is now null)
store.remove(1)   → false
~~~

\`find\` (JavaScript lesson 10) returns \`undefined\` when nothing matches, so turn that into \`null\`. For \`remove\`, \`findIndex\` gives the position (or \`-1\`), and \`todos.splice(i, 1)\` removes one item at that position.
`,
      starter: `function createStore() {
  const todos = [];
  let nextId = 1;
  return {
    list() { return [...todos]; },
    create({ title }) {
      const todo = { id: nextId++, title, done: false };
      todos.push(todo);
      return todo;
    },
    get(id) {
      // your code here
    },
    remove(id) {
      // your code here
    },
  };
}
`,
      tests: [
        { name: 'get finds a todo by id', code: `const s = createStore(); s.create({ title: 'a' }); eq(s.get(1), { id: 1, title: 'a', done: false });` },
        { name: 'get gives null for an unknown id', code: `const s = createStore(); eq(s.get(99), null);` },
        { name: 'remove deletes and returns true', code: `const s = createStore(); s.create({ title: 'a' }); eq(s.remove(1), true); eq(s.get(1), null);` },
        { name: 'remove gives false the second time', code: `const s = createStore(); s.create({ title: 'a' }); s.remove(1); eq(s.remove(1), false);` },
      ],
      hint: '`get`: `return todos.find((t) => t.id === id) || null;`. `remove`: find the index; if it is `-1` return `false`, otherwise `splice` and return `true`.',
      solution: `function createStore() {
  const todos = [];
  let nextId = 1;
  return {
    list() { return [...todos]; },
    create({ title }) {
      const todo = { id: nextId++, title, done: false };
      todos.push(todo);
      return todo;
    },
    get(id) {
      return todos.find((t) => t.id === id) || null;
    },
    remove(id) {
      const i = todos.findIndex((t) => t.id === id);
      if (i === -1) return false;
      todos.splice(i, 1);
      return true;
    },
  };
}
`,
    },
    {
      type: 'task',
      title: 'Store: update',
      md: `
Last store method. \`update(id, patch)\` merges \`patch\` into the todo and returns the updated todo, or \`null\` if the id doesn't exist. The \`id\` must never change, even if \`patch\` contains one.

~~~
store.update(1, { done: true })            → { id: 1, title: 'Write talk', done: true }
store.update(1, { id: 50, title: 'Talk' }) → { id: 1, title: 'Talk', done: true }
store.update(99, { done: true })           → null
~~~

Replace the item with a **new object** rather than changing the old one: \`{ ...old, ...patch, id }\`. Later keys win, so putting \`id\` last protects it.
`,
      starter: `function createStore() {
  const todos = [];
  let nextId = 1;
  return {
    list() { return [...todos]; },
    create({ title }) {
      const todo = { id: nextId++, title, done: false };
      todos.push(todo);
      return todo;
    },
    get(id) { return todos.find((t) => t.id === id) || null; },
    update(id, patch) {
      // your code here
    },
  };
}
`,
      tests: [
        { name: 'merges the patch', code: `const s = createStore(); s.create({ title: 'Write talk' }); eq(s.update(1, { done: true }), { id: 1, title: 'Write talk', done: true });` },
        { name: 'the change is stored', code: `const s = createStore(); s.create({ title: 'a' }); s.update(1, { title: 'b' }); eq(s.get(1).title, 'b');` },
        { name: 'the id cannot be changed', code: `const s = createStore(); s.create({ title: 'a' }); eq(s.update(1, { id: 50 }).id, 1);` },
        { name: 'an unknown id gives null', code: `const s = createStore(); eq(s.update(99, { done: true }), null);` },
      ],
      hint: 'Find the index like `remove` did. If it is `-1`, return `null`. Otherwise `todos[i] = { ...todos[i], ...patch, id };` and return `todos[i]`.',
      solution: `function createStore() {
  const todos = [];
  let nextId = 1;
  return {
    list() { return [...todos]; },
    create({ title }) {
      const todo = { id: nextId++, title, done: false };
      todos.push(todo);
      return todo;
    },
    get(id) { return todos.find((t) => t.id === id) || null; },
    update(id, patch) {
      const i = todos.findIndex((t) => t.id === id);
      if (i === -1) return null;
      todos[i] = { ...todos[i], ...patch, id };
      return todos[i];
    },
  };
}
`,
    },
    {
      type: 'predict',
      title: 'The id from the URL',
      md: 'The store is done. Before writing handlers, one trap. `req.params.id` comes from the URL.',
      code: `const todos = [{ id: 1, title: 'Write talk' }, { id: 2, title: 'Book train' }];
const params = { id: '2' };

console.log(todos.find((t) => t.id === params.id));
console.log(todos.find((t) => t.id === Number(params.id)));
console.log(Number('abc'));`,
      output: `undefined
{ id: 2, title: "Book train" }
NaN`,
      explain: `
Path params are strings (lesson 6), and \`===\` never treats \`2\` and \`"2"\` as equal. So the first lookup finds nothing, and your API would answer 404 for a todo that exists. Convert at the edge with \`Number(req.params.id)\`.

\`Number('abc')\` is \`NaN\`, and no todo has id \`NaN\` (\`NaN\` isn't even equal to itself), so \`GET /todos/abc\` falls through to a 404. That's a reasonable answer; some APIs return 400 for an id that can't be a number.
`,
    },
    {
      type: 'read',
      title: 'The handler layer',
      md: `
Each handler gets a request that the router has already enriched with \`params\` and \`query\`, and that middleware has already given a parsed \`body\` (lesson 7). It does three things: **validate**, **call the store**, **pick the status code**.

In this lesson, \`json(status, data)\` keeps \`body\` as an object to make the tests easy to read. The HTTP glue calls \`JSON.stringify\` once on the way out.

The starters include a shared store with two todos already in it:

~~~js
const json = (status, data) => ({ status, headers: { 'content-type': 'application/json' }, body: data });

function getTodo(req, store) {
  const todo = store.find((t) => t.id === Number(req.params.id));
  if (!todo) return json(404, { error: 'Not found' });
  return json(200, todo);
}

const store = [{ id: 1, title: 'Write talk', done: false }];
console.log(getTodo({ params: { id: '1' } }, store));
console.log(getTodo({ params: { id: '9' } }, store).status);
~~~

That's the shape of every handler: check, call, return. The real \`getTodo\` is your next task, with the store from the last three steps.
`,
    },
    {
      type: 'task',
      title: 'GET /todos/:id',
      md: `
Write \`getTodo(req)\`. Use \`store.get(...)\` with the id converted to a number.

~~~
getTodo({ params: { id: '1' } })   → json(200, { id: 1, title: 'Write talk', done: false })
getTodo({ params: { id: '99' } })  → json(404, { error: 'Not found' })
~~~
`,
      starter: SETUP + `
function getTodo(req) {
  // your code here
}
`,
      tests: [
        { name: 'an existing id is 200 with the todo', code: `const res = getTodo({ params: { id: '1' } }); eq(res.status, 200); eq(res.body, { id: 1, title: 'Write talk', done: false });` },
        { name: 'an unknown id is 404', code: `const res = getTodo({ params: { id: '99' } }); eq(res.status, 404); eq(res.body, { error: 'Not found' });` },
      ],
      hint: '`const todo = store.get(Number(req.params.id));` If it is `null`, return the 404; otherwise `json(200, todo)`.',
      solution: SETUP + `
function getTodo(req) {
  const todo = store.get(Number(req.params.id));
  if (!todo) return json(404, { error: 'Not found' });
  return json(200, todo);
}
`,
    },
    {
      type: 'task',
      title: 'GET /todos with a filter',
      md: `
Write \`listTodos(req)\`. It returns **200** with all todos. If \`req.query.done\` is given, keep only the matching ones. Remember the query value is the **string** \`'true'\` or \`'false'\`.

~~~
listTodos({ query: {} })                → 200, both todos
listTodos({ query: { done: 'false' } }) → 200, todos whose done is false
listTodos({ query: { done: 'true' } })  → 200, [] (none are done yet)
~~~
`,
      starter: SETUP + `
function listTodos(req) {
  let todos = store.list();
  // your code here: filter when req.query.done is given
  return json(200, todos);
}
`,
      tests: [
        { name: 'no filter returns every todo', code: `eq(listTodos({ query: {} }).body.length, 2);` },
        { name: "done='true' keeps only done todos", code: `store.update(2, { done: true }); eq(listTodos({ query: { done: 'true' } }).body.map((t) => t.id), [2]);` },
        { name: "done='false' keeps only open todos", code: `store.update(2, { done: true }); eq(listTodos({ query: { done: 'false' } }).body.map((t) => t.id), [1]);` },
      ],
      hint: "Inside `if (req.query.done !== undefined)`: `const want = req.query.done === 'true';` then `todos = todos.filter((t) => t.done === want);`",
      solution: SETUP + `
function listTodos(req) {
  let todos = store.list();
  if (req.query.done !== undefined) {
    const want = req.query.done === 'true';   // the string 'true' becomes the boolean true
    todos = todos.filter((t) => t.done === want);
  }
  return json(200, todos);
}
`,
    },
    {
      type: 'task',
      title: 'POST /todos',
      md: `
Write \`createTodo(req)\`. \`validateTodo\` from lesson 8 is in the starter.

- Validation errors → **422** with \`{ errors }\`
- Otherwise create the todo with the **trimmed** title and return **201**, the todo as the body, and a \`location\` header of \`'/todos/' + id\`.

~~~
createTodo({ body: { title: '  Ship it ' } })
  → status 201, body { id: 3, title: 'Ship it', done: false }, headers.location '/todos/3'
~~~

\`json()\` gives you a \`headers\` object you can add \`location\` to.
`,
      starter: SETUP + '\n' + VALIDATE + `
function createTodo(req) {
  // your code here
}
`,
      tests: [
        { name: 'a valid todo is 201 with a trimmed title', code: `const res = createTodo({ body: { title: '  Ship it ' } }); eq(res.status, 201); eq(res.body, { id: 3, title: 'Ship it', done: false });` },
        { name: 'Location points at the new todo', code: `eq(createTodo({ body: { title: 'Ship it' } }).headers.location, '/todos/3');` },
        { name: 'it is stored', code: `createTodo({ body: { title: 'Ship it' } }); eq(store.list().length, 3);` },
        { name: 'an empty title is 422 and stores nothing', code: `const res = createTodo({ body: { title: '' } }); eq(res.status, 422); eq(res.body, { errors: ['title is required'] }); eq(store.list().length, 2);` },
      ],
      hint: 'Validate first and return the 422 if `errors.length`. Then `const todo = store.create({ title: req.body.title.trim() });`, `const res = json(201, todo);`, `res.headers.location = "/todos/" + todo.id;`, `return res;`',
      solution: SETUP + '\n' + VALIDATE + `
function createTodo(req) {
  const errors = validateTodo(req.body);
  if (errors.length) return json(422, { errors });
  const todo = store.create({ title: req.body.title.trim() });
  const res = json(201, todo);
  res.headers.location = '/todos/' + todo.id;
  return res;
}
`,
    },
    {
      type: 'task',
      title: 'DELETE /todos/:id',
      md: `
Write \`deleteTodo(req)\`:

- If \`store.remove(...)\` returns \`false\`, respond **404** \`{ error: 'Not found' }\`.
- Otherwise respond **204** with an empty body: \`{ status: 204, headers: {}, body: null }\`.

~~~
deleteTodo({ params: { id: '1' } })    → { status: 204, headers: {}, body: null }
deleteTodo({ params: { id: '1' } })    → 404 the second time
~~~
`,
      starter: SETUP + `
function deleteTodo(req) {
  // your code here
}
`,
      tests: [
        { name: 'deleting an existing todo is 204', code: `eq(deleteTodo({ params: { id: '1' } }), { status: 204, headers: {}, body: null });` },
        { name: 'it is gone afterwards', code: `deleteTodo({ params: { id: '1' } }); eq(store.get(1), null);` },
        { name: 'deleting it again is 404', code: `deleteTodo({ params: { id: '1' } }); eq(deleteTodo({ params: { id: '1' } }).status, 404);` },
      ],
      hint: '`if (!store.remove(Number(req.params.id))) return json(404, { error: "Not found" });` then return the 204 object.',
      solution: SETUP + `
function deleteTodo(req) {
  if (!store.remove(Number(req.params.id))) return json(404, { error: 'Not found' });
  return { status: 204, headers: {}, body: null };
}
`,
      explain: 'The second DELETE returns 404 but leaves the server in the same state (the todo is still gone), so DELETE stays idempotent. Idempotence is about the state, not the status code.',
    },
    {
      type: 'task',
      title: 'PATCH /todos/:id',
      md: `
Write \`updateTodo(req)\`. A PATCH may send just some fields, so validate with \`validateTodo(req.body, { partial: true })\`, which only checks the fields that are present.

1. Validation errors → **422** with \`{ errors }\`.
2. Build a \`patch\` with only \`title\` (trimmed) and \`done\`, and only if they were sent. Ignore any other keys, such as \`id\`.
3. \`store.update(...)\` returns \`null\` → **404**. Otherwise **200** with the updated todo.

~~~
updateTodo({ params: { id: '1' }, body: { done: true } })   → 200, { id: 1, title: 'Write talk', done: true }
updateTodo({ params: { id: '1' }, body: { done: 'yes' } })  → 422
updateTodo({ params: { id: '9' }, body: { done: true } })   → 404
~~~

Step 2 is already written in the starter. Add steps 1 and 3.
`,
      starter: SETUP + '\n' + VALIDATE + `
function updateTodo(req) {
  // step 1: validate

  const { title, done } = req.body;
  const patch = {};
  if (title !== undefined) patch.title = title.trim();
  if (done !== undefined) patch.done = done;

  // step 3: update, then 404 or 200
}
`,
      tests: [
        { name: 'updates a field and returns 200', code: `const res = updateTodo({ params: { id: '1' }, body: { done: true } }); eq(res.status, 200); eq(res.body, { id: 1, title: 'Write talk', done: true });` },
        { name: 'an invalid field is 422', code: `eq(updateTodo({ params: { id: '1' }, body: { done: 'yes' } }).status, 422);` },
        { name: 'an unknown id is 404', code: `eq(updateTodo({ params: { id: '9' }, body: { done: true } }).status, 404);` },
        { name: 'extra keys like id are ignored', code: `eq(updateTodo({ params: { id: '1' }, body: { id: 77, title: 'Talk' } }).body, { id: 1, title: 'Talk', done: false });` },
      ],
      hint: 'Step 1 is the same two lines as `createTodo`, with `{ partial: true }`. Step 3: `const todo = store.update(Number(req.params.id), patch);` then 404 if `!todo`, else `json(200, todo)`.',
      solution: SETUP + '\n' + VALIDATE + `
function updateTodo(req) {
  const errors = validateTodo(req.body, { partial: true });
  if (errors.length) return json(422, { errors });

  const { title, done } = req.body;
  const patch = {};
  if (title !== undefined) patch.title = title.trim();
  if (done !== undefined) patch.done = done;

  const todo = store.update(Number(req.params.id), patch);
  if (!todo) return json(404, { error: 'Not found' });
  return json(200, todo);
}
`,
      explain: 'Building `patch` from named fields is an allow-list. Passing `req.body` straight to the store would let a client set any field you store, such as `ownerId` or `isAdmin`. That bug is called **mass assignment**.',
    },
    {
      type: 'task',
      title: 'Wire up the routes',
      md: `
Every piece exists. The starter has the store, the five handlers, and the router from lesson 6 (with 404 and 405). Write \`buildApp()\`: create a router, register the five routes, and return it.

~~~
const app = buildApp();
app.handle({ method: 'GET', url: '/todos/1', headers: {} })        → 200
app.handle({ method: 'POST', url: '/todos', headers: {}, body: { title: 'Ship it' } })  → 201
app.handle({ method: 'PUT', url: '/todos/1', headers: {} })        → 405, allow: 'GET, PATCH, DELETE'
~~~

Register the \`/todos/:id\` routes in the order GET, PATCH, DELETE so the \`allow\` header matches.
`,
      starter: SETUP + '\n' + VALIDATE + '\n' + HANDLERS + '\n' + ROUTER + `
function buildApp() {
  const app = createRouter();
  app.add('GET', '/todos', listTodos);
  // your code here: the other four routes
  return app;
}
`,
      tests: [
        { name: 'GET /todos lists todos', code: `const res = buildApp().handle({ method: 'GET', url: '/todos', headers: {} }); eq(res.status, 200); eq(res.body.length, 2);` },
        { name: 'GET /todos/1 is 200', code: `eq(buildApp().handle({ method: 'GET', url: '/todos/1', headers: {} }).status, 200);` },
        { name: 'POST /todos creates one', code: `const app = buildApp(); eq(app.handle({ method: 'POST', url: '/todos', headers: {}, body: { title: 'Ship it' } }).status, 201); eq(app.handle({ method: 'GET', url: '/todos', headers: {} }).body.length, 3);` },
        { name: 'PATCH then DELETE work', code: `const app = buildApp(); eq(app.handle({ method: 'PATCH', url: '/todos/2', headers: {}, body: { done: true } }).body.done, true); eq(app.handle({ method: 'DELETE', url: '/todos/2', headers: {} }).status, 204);` },
        { name: 'PUT /todos/1 is 405 with the allowed methods', code: `const res = buildApp().handle({ method: 'PUT', url: '/todos/1', headers: {} }); eq(res.status, 405); eq(res.headers.allow, 'GET, PATCH, DELETE');` },
      ],
      hint: "Four more lines like the first: `app.add('POST', '/todos', createTodo);`, then `GET`, `PATCH` and `DELETE` on `'/todos/:id'`.",
      solution: SETUP + '\n' + VALIDATE + '\n' + HANDLERS + '\n' + ROUTER + `
function buildApp() {
  const app = createRouter();
  app.add('GET', '/todos', listTodos);
  app.add('POST', '/todos', createTodo);
  app.add('GET', '/todos/:id', getTodo);
  app.add('PATCH', '/todos/:id', updateTodo);
  app.add('DELETE', '/todos/:id', deleteTodo);
  return app;
}
`,
      explain: 'That is a complete REST API with validation, correct status codes and no server. Everything from here on is plumbing.',
    },
    {
      type: 'read',
      title: 'The same tests with node:test',
      md: `
The tests you've been passing are plain function calls with \`eq\`. On your machine, Node has a test runner built in. Split the code into modules (lesson 2), then:

~~~node
// test/todos.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';

test('POST /todos creates a todo', () => {
  const app = buildApp();
  const res = app.handle({ method: 'POST', url: '/todos', headers: {}, body: { title: 'Ship it' } });
  assert.equal(res.status, 201);
  assert.equal(res.body.title, 'Ship it');
});

test('an empty title is rejected', () => {
  const res = buildApp().handle({ method: 'POST', url: '/todos', headers: {}, body: { title: '' } });
  assert.equal(res.status, 422);
  assert.deepEqual(res.body, { errors: ['title is required'] });
});
~~~

~~~bash
node --test              # finds files named like *.test.js and runs them
node --test --watch      # reruns on save
~~~

\`assert.equal\` compares with \`===\`; \`assert.deepEqual\` (from \`node:assert/strict\`) compares structure, like \`eq\` here. No dependencies to install.

One catch: each test above calls \`buildApp()\`, but if the store is created once at module level, all tests share it (lesson 2: a module runs once). Have \`buildApp\` create a fresh store so tests can't affect each other.
`,
    },
    {
      type: 'read',
      title: 'The same API in Express',
      md: `
To serve it for real, the store and validation stay exactly as written. Express replaces your router, \`json()\` and body parsing:

~~~node
// src/server.js
import express from 'express';
import { createStore } from './store.js';
import { validateTodo } from './validate.js';

const store = createStore();
const app = express();
app.use(express.json());

app.get('/todos/:id', (req, res) => {
  const todo = store.get(Number(req.params.id));
  if (!todo) return res.status(404).json({ error: 'Not found' });
  res.json(todo);
});

app.post('/todos', (req, res) => {
  const errors = validateTodo(req.body);
  if (errors.length) return res.status(422).json({ errors });
  const todo = store.create({ title: req.body.title.trim() });
  res.status(201).location('/todos/' + todo.id).json(todo);
});

app.delete('/todos/:id', (req, res) => {
  if (!store.remove(Number(req.params.id))) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

app.listen(3000, () => console.log('http://localhost:3000'));
~~~

Compare \`getTodo\`: same three steps, but "return a response object" became "call methods on \`res\`". Because your handlers are pure, a common pattern is to keep them pure and write one small adapter that turns \`{ status, headers, body }\` into \`res.status(...).set(...).json(...)\`.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'Why does `store.get(req.params.id)` return `null` for a todo that exists?',
          choices: ['`req.params.id` is the string `"1"`, and `"1" === 1` is false', 'The store is empty between requests', '`get` only works with `find`'],
          answer: 0,
          explain: 'Path params are strings. Convert with `Number(...)` before comparing.',
          why: { 1: 'The store is a module-level object that persists while the process runs.', 2: 'The problem is the type of the id, not the method.' },
        },
        {
          q: 'Why build `patch` from `title` and `done` instead of passing `req.body` to `store.update`?',
          choices: ['So clients can only change fields you allow (no mass assignment)', 'Because `req.body` is a string', 'Because spread does not work on request bodies'],
          answer: 0,
          explain: 'An allow-list stops a client setting fields like `id` or `ownerId`.',
          why: { 1: 'It was already parsed by middleware.', 2: 'Spread works on any object; that is the danger.' },
        },
        {
          q: 'Moving from the array store to Postgres, which layer has to change?',
          choices: ['Only the store', 'The store and every handler', 'The router'],
          answer: 0,
          explain: 'Handlers call `store.get(id)` and never see how it is implemented.',
          why: { 1: 'Handlers only depend on the store\'s methods, not its internals.', 2: 'Routing has nothing to do with where data lives.' },
        },
        {
          q: 'What should `DELETE /todos/1` return the second time?',
          choices: ['404, and the state is unchanged, so DELETE is still idempotent', '204 again, or it is not idempotent', '500, because the delete failed'],
          answer: 0,
          explain: 'Idempotent means the same server state, not necessarily the same status code.',
          why: { 1: 'Idempotence is about state; 404 is accurate here.', 2: 'Nothing broke; there was simply nothing to delete.' },
        },
      ],
    },
  ],
};
