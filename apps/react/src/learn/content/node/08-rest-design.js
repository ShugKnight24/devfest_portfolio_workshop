// Node course · lesson 8. Step types: read, predict, task, check (see ../index.js).
// Handlers return { status, headers, body } with body as a plain object here, to keep tests readable.
export default {
  id: 'rest-design',
  builds: ['node/middleware', 'js/filter-and-find', 'js/spread-and-destructuring'],
  title: 'Designing a REST API',
  goal: 'Name resources with URLs, pick the right method and status code for each operation, validate input, and make retries safe.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Resources, not actions',
      md: `
You can now route a request (lesson 6) and run shared checks before it (lesson 7). This lesson is about the **design**: which URLs and status codes to choose, so other developers can guess how your API works without reading its code.

**REST** organises an API around **resources**: the nouns of your app (todos, users, orders). Each resource gets a URL, and the HTTP method says what to do with it:

| Request | Means |
|---|---|
| \`GET /todos\` | list todos |
| \`POST /todos\` | create a todo |
| \`GET /todos/7\` | read todo 7 |
| \`PATCH /todos/7\` | change some fields of todo 7 |
| \`PUT /todos/7\` | replace todo 7 completely |
| \`DELETE /todos/7\` | delete todo 7 |

Conventions that keep it guessable:

- **Plural nouns**: \`/todos\`, \`/todos/7\`, never \`/getTodo?id=7\` or \`/todo/delete/7\`. The verb is already in the method.
- **Nest only for ownership**, and only one level: \`/users/3/todos\` reads "user 3's todos". Past that, use a filter: \`/todos?userId=3\`.
- **Query strings for filtering, sorting and paging**: \`/todos?done=false&sort=-createdAt&limit=20\`.
`,
    },
    {
      type: 'read',
      title: 'Safe and idempotent',
      md: `
Two properties of methods matter a lot once networks fail and clients retry:

- **Safe**: doesn't change anything on the server. Reading only.
- **Idempotent**: doing it twice leaves the server in the same state as doing it once.

| Method | Safe | Idempotent | Why |
|---|---|---|---|
| GET | yes | yes | only reads |
| PUT | no | yes | "set todo 7 to exactly this" twice is still exactly this |
| DELETE | no | yes | deleting something already deleted leaves it deleted |
| PATCH | no | not guaranteed | \`{ done: true }\` is idempotent, but "add 1 to count" isn't |
| POST | no | no | each call creates another item |

Why it matters: a phone sends \`POST /orders\`, the connection drops before the response arrives, and the app retries. Did the first one go through? With an idempotent method, retrying is always safe. With POST, you may now have two orders. You'll fix that at the end of the lesson.
`,
    },
    {
      type: 'predict',
      title: 'PUT twice, POST twice',
      md: 'A tiny in-memory model. Each "request" runs twice, as if the client retried.',
      code: `const todos = new Map();
let nextId = 1;

function put(id, data) { todos.set(id, { id, ...data }); }
function post(data) { const id = nextId++; todos.set(id, { id, ...data }); }

put(10, { title: 'Write talk' });
put(10, { title: 'Write talk' });
console.log(todos.size);

post({ title: 'Book train' });
post({ title: 'Book train' });
console.log(todos.size);`,
      output: `1
3`,
      explain: `
The two PUTs name the same id, so the second one overwrites the first with identical data: still one todo. The two POSTs each mint a new id, so you get two "Book train" todos, three in total.

PUT is idempotent because the **client chooses the id** and sends the full resource. POST isn't, because the **server chooses** each time.
`,
    },
    {
      type: 'read',
      title: 'Status codes you will actually use',
      md: `
| Code | Name | Use it when |
|---|---|---|
| 200 | OK | a read or update worked, and you send data back |
| 201 | Created | POST made something; add a \`Location\` header with its URL |
| 204 | No Content | it worked and there's nothing to send (typical for DELETE) |
| 400 | Bad Request | the request is malformed: broken JSON, wrong type, missing required query param |
| 401 | Unauthorized | **who are you?** no credentials, or invalid ones |
| 403 | Forbidden | **I know who you are, and no.** logged in, but not allowed |
| 404 | Not Found | no resource at this URL (or you're hiding that it exists) |
| 409 | Conflict | clashes with current state: duplicate email, editing a stale version |
| 422 | Unprocessable Content | well-formed, but fails your rules: empty title, end date before start |
| 500 | Internal Server Error | your code broke; never for bad input |

The two pairs people mix up:

- **401 vs 403**: 401 is about *authentication* (identity), 403 about *authorization* (permission). The misleading names date back decades; go by the meaning.
- **400 vs 422**: 400 when you can't even read the request, 422 when you can read it but the content breaks a rule. Many APIs use 400 for both. That's acceptable; what matters is being **consistent** and sending a body that says what's wrong.
`,
    },
    {
      type: 'task',
      title: 'validateTodo',
      md: `
Validation goes at the edge: check the body before it reaches your data. Write \`validateTodo(body)\` that returns an **array of error messages** (empty means valid):

- \`title\` must be a string that isn't empty after trimming → otherwise \`'title is required'\`
- \`done\`, if present, must be a boolean → otherwise \`'done must be a boolean'\`

~~~
validateTodo({ title: 'Write talk' })              → []
validateTodo({ title: '   ' })                     → ['title is required']
validateTodo({ title: 'x', done: 'yes' })          → ['done must be a boolean']
validateTodo({})                                   → ['title is required']
~~~

Returning **all** the errors at once (instead of stopping at the first) lets a form show every problem in one go.
`,
      starter: `function validateTodo(body) {
  const errors = [];
  // your code here
  return errors;
}
`,
      tests: [
        { name: 'a good todo has no errors', code: `eq(validateTodo({ title: 'Write talk' }), []);` },
        { name: 'a blank title is an error', code: `eq(validateTodo({ title: '   ' }), ['title is required']);` },
        { name: 'a missing title is an error', code: `eq(validateTodo({}), ['title is required']);` },
        { name: 'done must be a boolean if given', code: `eq(validateTodo({ title: 'x', done: 'yes' }), ['done must be a boolean']);` },
        { name: 'both problems are reported together', code: `eq(validateTodo({ title: 5, done: 1 }), ['title is required', 'done must be a boolean']);` },
      ],
      hint: "First check: `if (typeof body.title !== 'string' || body.title.trim() === '') errors.push(...)`. Second: `if (body.done !== undefined && typeof body.done !== 'boolean') errors.push(...)`.",
      solution: `function validateTodo(body) {
  const errors = [];
  if (typeof body.title !== 'string' || body.title.trim() === '') {
    errors.push('title is required');
  }
  if (body.done !== undefined && typeof body.done !== 'boolean') {
    errors.push('done must be a boolean');
  }
  return errors;
}
`,
      explain: 'This is the job TypeScript cannot do for you: types vanish at runtime, and a request body is whatever the client sent. Libraries such as Zod let you write the rules once and get both the check and the TypeScript type.',
    },
    {
      type: 'task',
      title: 'createTodo with the right status codes',
      md: `
Write the handler \`createTodo(req)\` for \`POST /todos\`. \`req.body\` is already parsed. Return \`{ status, headers, body }\`:

1. Validation errors → **422**, body \`{ errors: [...] }\`
2. A todo with the same title (ignoring case) already exists → **409**, body \`{ error: 'Duplicate title' }\`
3. Otherwise, push \`{ id: nextId++, title, done: false }\` onto \`todos\` and respond **201** with the todo as the body and \`headers: { location: '/todos/' + id }\`

Use \`headers: {}\` for the error responses. \`todos\`, \`nextId\` and \`validateTodo\` are in the starter, and the first step is done for you.
`,
      starter: `const todos = [{ id: 1, title: 'Write talk', done: false }];
let nextId = 2;

function validateTodo(body) {
  const errors = [];
  if (typeof body.title !== 'string' || body.title.trim() === '') errors.push('title is required');
  if (body.done !== undefined && typeof body.done !== 'boolean') errors.push('done must be a boolean');
  return errors;
}

function createTodo(req) {
  const errors = validateTodo(req.body);
  if (errors.length) return { status: 422, headers: {}, body: { errors } };
  // your code here
}
`,
      tests: [
        { name: 'a valid todo is 201 with the new todo', code: `const res = createTodo({ body: { title: 'Book train' } }); eq(res.status, 201); eq(res.body, { id: 2, title: 'Book train', done: false });` },
        { name: '201 includes a Location header', code: `eq(createTodo({ body: { title: 'Book train' } }).headers.location, '/todos/2');` },
        { name: 'the todo is stored', code: `createTodo({ body: { title: 'Book train' } }); eq(todos.length, 2);` },
        { name: 'a duplicate title is 409', code: `const res = createTodo({ body: { title: 'write TALK' } }); eq(res.status, 409); eq(todos.length, 1);` },
        { name: 'an invalid body is 422', code: `eq(createTodo({ body: { title: '' } }).status, 422);` },
      ],
      hint: "For the duplicate check: `todos.some((t) => t.title.toLowerCase() === req.body.title.toLowerCase())`. Then build `const todo = { id: nextId++, title: req.body.title, done: false }`, push it, and return the 201.",
      solution: `const todos = [{ id: 1, title: 'Write talk', done: false }];
let nextId = 2;

function validateTodo(body) {
  const errors = [];
  if (typeof body.title !== 'string' || body.title.trim() === '') errors.push('title is required');
  if (body.done !== undefined && typeof body.done !== 'boolean') errors.push('done must be a boolean');
  return errors;
}

function createTodo(req) {
  const errors = validateTodo(req.body);
  if (errors.length) return { status: 422, headers: {}, body: { errors } };

  const title = req.body.title;
  if (todos.some((t) => t.title.toLowerCase() === title.toLowerCase())) {
    return { status: 409, headers: {}, body: { error: 'Duplicate title' } };
  }

  const todo = { id: nextId++, title, done: false };
  todos.push(todo);
  return { status: 201, headers: { location: '/todos/' + todo.id }, body: todo };
}
`,
      explain: 'Notice the order: cheap checks on the request first (422), then checks against stored data (409), and only then the write. Nothing is stored unless every check passed.',
    },
    {
      type: 'read',
      title: 'One error shape everywhere',
      md: `
Clients write one error-handling path, so give them one shape. Pick a format and use it for every 4xx and 5xx. A common choice is the standard **problem details** format (RFC 9457), sent with \`content-type: application/problem+json\`:

~~~json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Invalid todo",
  "status": 422,
  "detail": "title is required"
}
~~~

A simpler house format is fine too, as long as it's the same everywhere:

~~~json
{ "error": { "code": "validation_failed", "message": "Invalid todo", "details": ["title is required"] } }
~~~

Two rules either way:

- **Never send stack traces or database errors to clients.** Log them on the server; send a generic message with the 500.
- **Give errors a stable \`code\`** clients can switch on, instead of making them match message text that you might reword.
`,
    },
    {
      type: 'read',
      title: 'Making POST safe to retry',
      md: `
Back to the phone that retried \`POST /orders\`. The usual fix is an **idempotency key**: the client generates a random ID for the operation (\`crypto.randomUUID()\`) and sends it as a header. A retry sends the **same** key.

~~~text
POST /orders
Idempotency-Key: 5f1c2a9e-8d1b-4c3e-9a0f-1b2c3d4e5f60
~~~

The server remembers keys it has seen, with the response it gave:

- **New key**: do the work, store \`key → response\`, return the response.
- **Seen key**: skip the work and return the stored response again.

Payment APIs work this way, and it's the model you're about to build. In production the store is a database or Redis with an expiry, not a \`Map\` in memory, because memory is per process and lost on restart.
`,
    },
    {
      type: 'task',
      title: 'createOnce',
      md: `
Write \`createOnce(key, data)\` using the \`seen\` Map and the \`create\` function in the starter:

- If \`seen\` has \`key\`, return the stored result **without** calling \`create\`.
- Otherwise call \`create(data)\`, store the result under \`key\`, and return it.

~~~
createOnce('abc', { item: 'book' })   → { id: 1, item: 'book' }
createOnce('abc', { item: 'book' })   → { id: 1, item: 'book' }   (same result, nothing new created)
createOnce('xyz', { item: 'pen' })    → { id: 2, item: 'pen' }
~~~
`,
      starter: `const orders = [];
const create = (data) => {
  const order = { id: orders.length + 1, ...data };
  orders.push(order);
  return order;
};
const seen = new Map();

function createOnce(key, data) {
  return create(data);
}
`,
      tests: [
        { name: 'the first call creates an order', code: `eq(createOnce('abc', { item: 'book' }), { id: 1, item: 'book' });` },
        { name: 'a retry with the same key returns the same order', code: `const a = createOnce('abc', { item: 'book' }); const b = createOnce('abc', { item: 'book' }); eq(b, a);` },
        { name: 'a retry does not create a second order', code: `createOnce('abc', { item: 'book' }); createOnce('abc', { item: 'book' }); eq(orders.length, 1);` },
        { name: 'a different key creates a new order', code: `createOnce('abc', { item: 'book' }); eq(createOnce('xyz', { item: 'pen' }), { id: 2, item: 'pen' });` },
      ],
      hint: '`if (seen.has(key)) return seen.get(key);` Then `const result = create(data); seen.set(key, result); return result;`',
      solution: `const orders = [];
const create = (data) => {
  const order = { id: orders.length + 1, ...data };
  orders.push(order);
  return order;
};
const seen = new Map();

function createOnce(key, data) {
  if (seen.has(key)) return seen.get(key);
  const result = create(data);
  seen.set(key, result);
  return result;
}
`,
      explain: 'This is a cache keyed by operation instead of by input. The same "check the Map, else compute and store" shape is memoisation, which the DSA track uses for dynamic programming.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'Which URL fits REST conventions for deleting order 12?',
          choices: ['`DELETE /orders/12`', '`POST /orders/delete/12`', '`GET /deleteOrder?id=12`'],
          answer: 0,
          explain: 'The resource is in the URL and the action is the method.',
          why: { 1: 'The verb belongs in the method, not the path.', 2: 'GET must be safe; it should never delete anything.' },
        },
        {
          q: 'A logged-in user tries to edit someone else\'s todo. Which status?',
          choices: ['403 Forbidden', '401 Unauthorized', '409 Conflict'],
          answer: 0,
          explain: 'You know who they are; they are not allowed. That is authorization: 403.',
          why: { 1: '401 means you do not know who they are.', 2: '409 is about clashing with current state, not permission.' },
        },
        {
          q: 'Sign-up with an email that is already registered. Which status?',
          choices: ['409 Conflict', '422 Unprocessable Content', '500 Internal Server Error'],
          answer: 0,
          explain: 'The request is valid on its own but clashes with what is stored.',
          why: { 1: '422 is for content that breaks rules by itself, like an empty title.', 2: 'Nothing broke on the server.' },
        },
        {
          q: 'Which method is idempotent?',
          choices: ['PUT', 'POST', 'Neither'],
          answer: 0,
          explain: 'PUT sets a resource to exactly the given state, so repeating it changes nothing further.',
          why: { 1: 'Each POST can create another resource.', 2: 'PUT (and GET and DELETE) are idempotent.' },
        },
        {
          q: 'A DELETE succeeds and there is nothing to return. Which status?',
          choices: ['204 No Content', '201 Created', '404 Not Found'],
          answer: 0,
          explain: '204 means success with an empty body.',
          why: { 1: '201 is for creating.', 2: 'It existed and is now deleted; that is a success.' },
        },
      ],
    },
  ],
};
