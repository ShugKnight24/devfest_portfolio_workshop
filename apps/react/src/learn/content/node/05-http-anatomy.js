// Node course · lesson 5. Step types: read, predict, task, check (see ../index.js).
// Handlers here are pure functions: a plain request object in, a plain response object out.
// The ~~~node blocks show how the same handler plugs into node:http.
export default {
  id: 'http-anatomy',
  builds: ['node/async-await', 'js/objects', 'js/conditionals'],
  title: 'HTTP: requests and responses',
  goal: 'Name every part of an HTTP request and response, and write a handler as a plain function from request to response.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'HTTP is text with a shape',
      md: `
Every time a browser or app talks to an API, it sends a **request** and gets back a **response**. Under the hood, both are text:

~~~text
POST /todos?notify=true HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer abc123

{"title":"Write the talk"}
~~~

~~~text
HTTP/1.1 201 Created
Content-Type: application/json
Location: /todos/7

{"id":7,"title":"Write the talk","done":false}
~~~

The request has a **method** (\`POST\`), a **path** (\`/todos\`) with an optional **query string** (\`?notify=true\`), **headers** (\`Name: value\` lines), a blank line, then an optional **body**.

The response has a **status code** (\`201\`) with a short reason (\`Created\`), headers, a blank line and a body.

That's all of it. Every server framework, Express included, is a nicer way to read the first message and write the second.
`,
    },
    {
      type: 'read',
      title: 'As JavaScript objects',
      md: `
Node parses that text for you. In this track, a request is a plain object:

~~~
{
  method: 'POST',
  url: '/todos?notify=true',            // path + query, exactly as sent
  headers: { 'content-type': 'application/json', authorization: 'Bearer abc123' },
  body: '{"title":"Write the talk"}',   // a string: you decide how to parse it
}
~~~

and a response is what your code returns:

~~~
{ status: 201, headers: { 'content-type': 'application/json' }, body: '{"id":7, ...}' }
~~~

A **handler** is a function from one to the other: \`handle(req) → res\`. Writing it this way, with no server involved, means you can test it with plain function calls, which is exactly what the tasks here do. At the end of the lesson you'll see the few lines that connect it to a real Node server.
`,
    },
    {
      type: 'predict',
      title: 'Reading a URL',
      md: '`URL` is built into Node and the browser. It needs a full address, so you give it a base for the host part.',
      code: `const u = new URL('/search?q=node&page=2', 'http://localhost');
console.log(u.pathname);
console.log(u.searchParams.get('page'));
console.log(u.searchParams.get('sort'));
console.log(Object.fromEntries(u.searchParams));`,
      output: `/search
2
null
{ q: "node", page: "2" }`,
      explain: `
- \`pathname\` is the path without the query.
- \`searchParams.get('page')\` returns the **string** \`"2"\`, not the number 2. Everything in a URL is text, same as \`process.argv\` in lesson 1.
- A missing parameter gives \`null\`, not \`undefined\`.
- \`Object.fromEntries\` turns all the parameters into a plain object.

Don't split URLs on \`?\` and \`&\` by hand: \`URL\` also handles encoding like \`%20\` and \`+\` for spaces.
`,
    },
    {
      type: 'task',
      title: 'parseUrl',
      md: `
Write \`parseUrl(url)\` that returns the path and the query as an object. Use \`new URL(url, 'http://localhost')\` like the last step.

~~~
parseUrl('/search?q=node&page=2')  → { path: '/search', query: { q: 'node', page: '2' } }
parseUrl('/todos')                 → { path: '/todos', query: {} }
~~~
`,
      starter: `function parseUrl(url) {
  // your code here
}
`,
      tests: [
        { name: 'reads the path and query', code: `eq(parseUrl('/search?q=node&page=2'), { path: '/search', query: { q: 'node', page: '2' } });` },
        { name: 'no query gives {}', code: `eq(parseUrl('/todos'), { path: '/todos', query: {} });` },
        { name: 'decodes %20 into a space', code: `eq(parseUrl('/search?q=hello%20world').query.q, 'hello world');` },
      ],
      hint: 'Two lines: `const u = new URL(url, "http://localhost");` then return `{ path: u.pathname, query: Object.fromEntries(u.searchParams) }`.',
      solution: `function parseUrl(url) {
  const u = new URL(url, 'http://localhost');
  return { path: u.pathname, query: Object.fromEntries(u.searchParams) };
}
`,
    },
    {
      type: 'read',
      title: 'Headers and status codes',
      md: `
**Headers** are metadata. Header names are case-insensitive, so Node lowercases them on \`req.headers\`: you read \`req.headers['content-type']\`, never \`'Content-Type'\`. The ones you'll use most:

| Header | Says |
|---|---|
| \`content-type\` | what the body is, e.g. \`application/json\` |
| \`authorization\` | who is asking, e.g. \`Bearer <token>\` |
| \`location\` | where a newly created thing lives (with 201) |
| \`cache-control\` | whether and how long to cache the response |

**Status codes** are grouped by their first digit:

| Range | Meaning | Common ones |
|---|---|---|
| 2xx | it worked | 200 OK, 201 Created, 204 No Content |
| 3xx | look elsewhere | 301, 302, 304 Not Modified |
| 4xx | **the client** got something wrong | 400, 401, 403, 404, 409, 422 |
| 5xx | **the server** got something wrong | 500, 502, 503 |

The split between 4xx and 5xx matters: a 4xx says "fix your request", a 5xx says "this is our bug, retrying might help". Lesson 8 covers which code to pick when.
`,
    },
    {
      type: 'task',
      title: 'A json() helper',
      md: `
Almost every API response is JSON, so write the helper once.

\`json(status, data)\` returns a response object with the status, a \`content-type\` of \`application/json\`, and the data turned into a JSON string:

~~~
json(200, { ok: true })
  → { status: 200, headers: { 'content-type': 'application/json' }, body: '{"ok":true}' }
~~~
`,
      starter: `function json(status, data) {
  // your code here
}
`,
      tests: [
        { name: 'json(200, { ok: true }) builds the full response', code: `eq(json(200, { ok: true }), { status: 200, headers: { 'content-type': 'application/json' }, body: '{"ok":true}' });` },
        { name: 'the body is a string', code: `eq(typeof json(201, { id: 1 }).body, 'string');` },
        { name: 'keeps the status it was given', code: `eq(json(404, { error: 'Not found' }).status, 404);` },
      ],
      hint: '`JSON.stringify(data)` turns an object into a JSON string. Return an object with `status`, `headers` and `body` keys.',
      solution: `function json(status, data) {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  };
}
`,
    },
    {
      type: 'read',
      title: 'Your first handler',
      md: `
Here's a complete handler for a health check, the endpoint load balancers call to ask "are you alive?":

~~~js
function json(status, data) {
  return { status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}

function handle(req) {
  if (req.method === 'GET' && req.url === '/health') {
    return json(200, { status: 'ok' });
  }
  return json(404, { error: 'Not found' });
}

console.log(handle({ method: 'GET', url: '/health', headers: {} }));
console.log(handle({ method: 'GET', url: '/nope', headers: {} }).status);
~~~

It's an \`if\` and two returns: nothing you didn't know after JavaScript lesson 3. Run it, then **Edit** it to also answer \`GET /version\` with \`{ version: '1.0.0' }\`.
`,
    },
    {
      type: 'task',
      title: 'GET /hello',
      md: `
Write \`handle(req)\` for one route:

- \`GET /hello?name=Ada\` → status 200, body \`{ message: 'Hello, Ada' }\`
- \`GET /hello\` with no name → \`{ message: 'Hello, world' }\`
- any other path → status 404, body \`{ error: 'Not found' }\`

\`json\` and \`parseUrl\` from the earlier tasks are already in the starter. Match on the **path**, not the full URL, because the URL includes the query.
`,
      starter: `function json(status, data) {
  return { status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}
function parseUrl(url) {
  const u = new URL(url, 'http://localhost');
  return { path: u.pathname, query: Object.fromEntries(u.searchParams) };
}

function handle(req) {
  const { path, query } = parseUrl(req.url);
  // your code here
}
`,
      tests: [
        { name: 'greets by name', code: `const res = handle({ method: 'GET', url: '/hello?name=Ada', headers: {} }); eq(res.status, 200); eq(JSON.parse(res.body), { message: 'Hello, Ada' });` },
        { name: 'no name means "world"', code: `eq(JSON.parse(handle({ method: 'GET', url: '/hello', headers: {} }).body), { message: 'Hello, world' });` },
        { name: 'other paths are 404', code: `const res = handle({ method: 'GET', url: '/bye', headers: {} }); eq(res.status, 404); eq(JSON.parse(res.body), { error: 'Not found' });` },
      ],
      hint: 'Inside `if (req.method === "GET" && path === "/hello")`, use `const name = query.name || "world";` and return `json(200, { message: "Hello, " + name })`. After the `if`, return the 404.',
      solution: `function json(status, data) {
  return { status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}
function parseUrl(url) {
  const u = new URL(url, 'http://localhost');
  return { path: u.pathname, query: Object.fromEntries(u.searchParams) };
}

function handle(req) {
  const { path, query } = parseUrl(req.url);
  if (req.method === 'GET' && path === '/hello') {
    const name = query.name || 'world';
    return json(200, { message: 'Hello, ' + name });
  }
  return json(404, { error: 'Not found' });
}
`,
    },
    {
      type: 'read',
      title: 'The request body',
      md: `
A request body arrives as **text** (strictly, as chunks of bytes; lesson 10). A JSON API has to parse it, and parsing can fail: a client may send broken JSON. \`JSON.parse\` throws a \`SyntaxError\` on bad input, so wrap it:

~~~js
function tryParse(text) {
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

console.log(tryParse('{"title":"Write"}'));
console.log(tryParse('{title: Write}'));
~~~

Bad input from a client is a **400 Bad Request**, never a 500. A 500 says your server is broken; here it's the request that's broken. If you let \`JSON.parse\` throw without catching it, a framework will turn it into a 500 and your logs fill with errors that aren't yours.
`,
    },
    {
      type: 'task',
      title: 'POST /echo',
      md: `
Write \`handle(req)\` for \`POST /echo\`:

- If \`req.body\` is valid JSON, respond **200** with the parsed data.
- If it isn't, respond **400** with \`{ error: 'Invalid JSON' }\`.

~~~
handle({ method: 'POST', url: '/echo', headers: {}, body: '{"a":1}' })  → status 200, body '{"a":1}'
handle({ method: 'POST', url: '/echo', headers: {}, body: 'nope' })     → status 400
~~~

Only \`POST /echo\` is tested, so you don't need a 404 branch.
`,
      starter: `function json(status, data) {
  return { status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}

function handle(req) {
  const data = JSON.parse(req.body);
  return json(200, data);
}
`,
      tests: [
        { name: 'valid JSON is echoed with 200', code: `const res = handle({ method: 'POST', url: '/echo', headers: {}, body: '{"a":1}' }); eq(res.status, 200); eq(JSON.parse(res.body), { a: 1 });` },
        { name: 'broken JSON gives 400', code: `eq(handle({ method: 'POST', url: '/echo', headers: {}, body: 'nope' }).status, 400);` },
        { name: 'the 400 body explains why', code: `eq(JSON.parse(handle({ method: 'POST', url: '/echo', headers: {}, body: '{' }).body), { error: 'Invalid JSON' });` },
      ],
      hint: 'Put the `JSON.parse` line and the 200 return inside `try { ... }`, and return `json(400, { error: "Invalid JSON" })` from the `catch`.',
      solution: `function json(status, data) {
  return { status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) };
}

function handle(req) {
  try {
    const data = JSON.parse(req.body);
    return json(200, data);
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }
}
`,
    },
    {
      type: 'read',
      title: 'Plugging it into a real server',
      md: `
Here is the glue that runs a pure \`handle(req)\` on a real port with \`node:http\`. Save it as \`server.js\` and run \`node server.js\`:

~~~node
import { createServer } from 'node:http';
import { handle } from './handle.js';

const server = createServer(async (req, res) => {
  // 1. collect the body: it arrives in chunks
  let body = '';
  for await (const chunk of req) body += chunk;

  // 2. call the pure handler with a plain object
  const out = handle({ method: req.method, url: req.url, headers: req.headers, body });

  // 3. write the response
  res.writeHead(out.status, out.headers);
  res.end(out.body);
});

server.listen(3000, () => console.log('http://localhost:3000'));
~~~

Then, in another terminal:

~~~bash
curl -i 'http://localhost:3000/hello?name=Ada'
curl -i -X POST http://localhost:3000/echo -H 'content-type: application/json' -d '{"a":1}'
~~~

\`-i\` shows the status line and headers, so you can see the exact response you built. The next three lessons grow \`handle\` into a router, a middleware chain and a REST API, and this glue stays the same.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'In `GET /search?q=node&page=2`, what is `/search`?',
          choices: ['The path', 'The query string', 'A header'],
          answer: 0,
          explain: 'The path names the resource. Everything after `?` is the query string.',
          why: { 1: 'The query is `q=node&page=2`.', 2: 'Headers are separate `Name: value` lines.' },
        },
        {
          q: '`new URL("/x?page=2", "http://localhost").searchParams.get("page")` is...',
          choices: ['`"2"`, a string', '`2`, a number', '`null`'],
          answer: 0,
          explain: 'Query values are always strings. Convert with `Number(...)` when you need a number.',
          why: { 1: 'Nothing in a URL is a number until you convert it.', 2: '`null` is for parameters that are missing.' },
        },
        {
          q: 'A client sends a body that is not valid JSON. Which status fits?',
          choices: ['400 Bad Request', '500 Internal Server Error', '404 Not Found'],
          answer: 0,
          explain: 'The request is malformed, which is the client\'s problem: a 4xx.',
          why: { 1: '500 means the server is broken, and it is not.', 2: 'The route exists; the body is the problem.' },
        },
        {
          q: 'How do you read the Content-Type header from a Node request?',
          choices: ["`req.headers['content-type']`", "`req.headers['Content-Type']`", '`req.contentType`'],
          answer: 0,
          explain: 'Node lowercases incoming header names because HTTP header names are case-insensitive.',
          why: { 1: 'The capitalised key is not there; Node stores names lowercased.', 2: 'There is no such property on a Node request.' },
        },
        {
          q: 'Why write the handler as a pure `handle(req) → res` function?',
          choices: ['You can test it with plain function calls, without starting a server', 'Node requires it', 'It makes responses faster'],
          answer: 0,
          explain: 'Keeping HTTP glue thin and logic pure is what makes the logic easy to test.',
          why: { 1: 'Node accepts any callback shape.', 2: 'Speed is the same; testability is the win.' },
        },
      ],
    },
  ],
};
