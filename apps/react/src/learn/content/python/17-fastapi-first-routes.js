// Python course · lesson 17. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'fastapi-first-routes',
  builds: ['python/async-basics', 'python/dictionaries', 'python/functions-and-errors', 'node/routing'],
  packages: ['fastapi'],
  title: 'FastAPI: your first routes',
  goal: 'Build GET routes with path and query parameters, let type hints validate input, return 404 with HTTPException, and test every route.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'A route is a decorated function',
      md: `
FastAPI is a Python web framework. A **route** is a plain function with a decorator (lesson 14) that says which method and path it answers. Return a dict and FastAPI sends it as JSON:

~~~py
from fastapi import FastAPI

app = FastAPI()

@app.get("/hello")
def hello():
    return {"message": "Hello, world!"}

r = await Client(app).get("/hello")
print(r.status_code, r.json())
~~~

If you've used Express, it's the same idea with less code:

~~~
app.get("/hello", (req, res) => res.json({ message: "Hello, world!" }));
~~~

The last two lines are how this page **tests** an app. \`Client(app)\` sends a fake HTTP request straight into the app, with no server and no network. \`r.status_code\` is the HTTP status and \`r.json()\` is the parsed body. Real projects do the same with FastAPI's \`TestClient\`.

To run it for real on your own machine, save the app part as \`main.py\` and run:

~~~bash
pip install "fastapi[standard]"
fastapi dev main.py
~~~

Then open http://127.0.0.1:8000/hello, or http://127.0.0.1:8000/docs for interactive docs FastAPI writes for you.
`,
    },
    {
      type: 'predict',
      title: 'A path nobody handles',
      code: `from fastapi import FastAPI

app = FastAPI()

@app.get("/hello")
def hello():
    return {"message": "Hello, world!"}

r = await Client(app).get("/goodbye")
print(r.status_code)
print(r.json())`,
      output: `404
{'detail': 'Not Found'}`,
      explain: 'No route matches `/goodbye`, so FastAPI answers **404** by itself. Note the shape: errors come back as JSON with a `"detail"` key. You\'ll use that same shape for your own errors later in this lesson.',
    },
    {
      type: 'task',
      title: 'GET /ping',
      md: `
Add a route \`GET /ping\` that returns \`{"ok": true}\` (in Python that's \`{"ok": True}\`).

Tests send \`await Client(app).get("/ping")\` and check for status \`200\` and that body.
`,
      starter: `from fastapi import FastAPI

app = FastAPI()

# add GET /ping here
`,
      tests: [
        { name: 'GET /ping answers 200', code: `r = await Client(app).get("/ping")
eq(r.status_code, 200)` },
        { name: 'the body is {"ok": True}', code: `r = await Client(app).get("/ping")
eq(r.json(), {"ok": True})` },
      ],
      hint: 'Copy the `/hello` route: `@app.get("/ping")` on the line above `def ping():`, which returns `{"ok": True}`.',
      solution: `from fastapi import FastAPI

app = FastAPI()


@app.get("/ping")
def ping():
    return {"ok": True}
`,
    },
    {
      type: 'read',
      title: 'Path parameters',
      md: `
Put a name in curly braces in the path, and give the function a parameter with the **same name**. FastAPI fills it in from the URL:

~~~py
from fastapi import FastAPI

app = FastAPI()

@app.get("/square/{n}")
def square(n: int):
    return {"n": n, "square": n * n}

r = await Client(app).get("/square/7")
print(r.json())
~~~

Express writes \`/square/:n\` and gives you \`req.params.n\` as a **string**. Here the type hint \`n: int\` tells FastAPI to convert it to an int for you, so \`n * n\` just works.

Without a type hint (or with \`: str\`), you get the text as it appeared in the URL.
`,
    },
    {
      type: 'task',
      title: 'GET /hello/{name}',
      md: `
Add \`GET /hello/{name}\` that returns \`{"message": "Hello, <name>!"}\`.

- \`/hello/Ada\` returns \`{"message": "Hello, Ada!"}\`
`,
      starter: `from fastapi import FastAPI

app = FastAPI()

# add GET /hello/{name} here
`,
      tests: [
        { name: '/hello/Ada greets Ada', code: `r = await Client(app).get("/hello/Ada")
eq(r.status_code, 200)
eq(r.json(), {"message": "Hello, Ada!"})` },
        { name: '/hello/Grace greets Grace', code: `r = await Client(app).get("/hello/Grace")
eq(r.json(), {"message": "Hello, Grace!"})` },
      ],
      hint: '`@app.get("/hello/{name}")` and `def hello(name: str):`, returning an f-string inside the dict.',
      solution: `from fastapi import FastAPI

app = FastAPI()


@app.get("/hello/{name}")
def hello(name: str):
    return {"message": f"Hello, {name}!"}
`,
    },
    {
      type: 'predict',
      title: 'Not a number',
      md: 'The route says `n: int`. What happens with `/square/abc`?',
      code: `from fastapi import FastAPI

app = FastAPI()

@app.get("/square/{n}")
def square(n: int):
    return {"square": n * n}

r = await Client(app).get("/square/abc")
print(r.status_code)
err = r.json()["detail"][0]
print(err["loc"], err["msg"])`,
      output: `422
['path', 'n'] Input should be a valid integer, unable to parse string as an integer`,
      explain: `
**422 Unprocessable Content** means "I understood the request, but the data in it is invalid". FastAPI checked \`n\` against its type hint and rejected it **before your function ran**. That's the \`parse_age\` job from lesson 13, done for you by the type hint.

The body lists every problem. \`loc\` says where (\`path\`, then the parameter \`n\`), and \`msg\` says what. Most people guess **400** or **500** here. 400 is a generic "bad request", and 500 would mean your code crashed, which it never got the chance to do.
`,
    },
    {
      type: 'read',
      title: 'Query parameters',
      md: `
Any function parameter that is **not** in the path becomes a **query parameter**, the \`?key=value\` part of the URL:

~~~py
from fastapi import FastAPI

app = FastAPI()

@app.get("/greet")
def greet(name: str, excited: bool = False, times: int = 1):
    text = f"Hi, {name}" + ("!" if excited else ".")
    return {"text": " ".join([text] * times)}

c = Client(app)
print((await c.get("/greet?name=Ada")).json())
print((await c.get("/greet?name=Ada&excited=true&times=2")).json())
print((await c.get("/greet")).status_code)
~~~

The rules are the ones from lesson 2's default values:

- **No default** (\`name: str\`) means required. Leaving it out is a 422.
- **A default** (\`times: int = 1\`) means optional.
- \`q: str | None = None\` is the usual way to say "optional, and \`None\` when missing".

Type hints still convert: \`times=2\` arrives as the int \`2\`, and \`excited=true\` as \`True\`.
`,
    },
    {
      type: 'task',
      title: 'GET /add',
      md: `
Add \`GET /add\` with two **required** int query parameters, \`a\` and \`b\`. It returns \`{"result": a + b}\`.

- \`/add?a=2&b=3\` returns \`{"result": 5}\`
- \`/add?a=2\` (no \`b\`) is a **422**, which FastAPI does for you
`,
      starter: `from fastapi import FastAPI

app = FastAPI()

# add GET /add here
`,
      tests: [
        { name: '/add?a=2&b=3 gives 5', code: `r = await Client(app).get("/add?a=2&b=3")
eq(r.status_code, 200)
eq(r.json(), {"result": 5})` },
        { name: 'the numbers are added, not joined as text', code: `eq((await Client(app).get("/add?a=10&b=-4")).json(), {"result": 6})` },
        { name: 'a missing b is a 422', code: `eq((await Client(app).get("/add?a=2")).status_code, 422)` },
      ],
      hint: '`@app.get("/add")` and `def add(a: int, b: int):`. No defaults, so both are required.',
      solution: `from fastapi import FastAPI

app = FastAPI()


@app.get("/add")
def add(a: int, b: int):
    return {"result": a + b}
`,
      explain: 'Without the `: int` hints, `a` and `b` would be strings and `"2" + "3"` would give `"23"`.',
    },
    {
      type: 'read',
      title: 'Your own errors: HTTPException',
      md: `
When the input is valid but the thing doesn't exist, you answer **404** yourself. Raise an \`HTTPException\` (lesson 13's \`raise\`), and FastAPI turns it into a response:

~~~py
from fastapi import FastAPI, HTTPException

app = FastAPI()

BOOKS = {1: {"id": 1, "title": "Dune"}}

@app.get("/books/{book_id}")
def get_book(book_id: int):
    if book_id not in BOOKS:
        raise HTTPException(status_code=404, detail="Book not found")
    return BOOKS[book_id]

c = Client(app)
print((await c.get("/books/1")).json())
r = await c.get("/books/99")
print(r.status_code, r.json())
~~~

\`raise\`, not \`return\`. Raising stops the function wherever it is, even several calls deep, which is why it scales better than returning an error dict and remembering to check it everywhere.

Note the status code split you now have: **404** "that id doesn't exist" (your code decides) and **422** "that isn't even an id" (FastAPI decides).
`,
    },
    {
      type: 'task',
      title: 'GET /users/{user_id}',
      md: `
\`USERS\` is given. Add \`GET /users/{user_id}\` where \`user_id\` is an int:

- \`/users/1\` returns \`{"id": 1, "name": "Ada"}\`
- \`/users/99\` is **404** with body \`{"detail": "User not found"}\`
- \`/users/abc\` is **422** (the type hint handles it)
`,
      starter: `from fastapi import FastAPI, HTTPException

app = FastAPI()

USERS = {
    1: {"id": 1, "name": "Ada"},
    2: {"id": 2, "name": "Grace"},
}

# add GET /users/{user_id} here
`,
      tests: [
        { name: '/users/1 returns Ada', code: `r = await Client(app).get("/users/1")
eq(r.status_code, 200)
eq(r.json(), {"id": 1, "name": "Ada"})` },
        { name: 'an unknown id is 404 "User not found"', code: `r = await Client(app).get("/users/99")
eq(r.status_code, 404)
eq(r.json(), {"detail": "User not found"})` },
        { name: '/users/abc is 422', code: `eq((await Client(app).get("/users/abc")).status_code, 422)` },
      ],
      hint: 'Same shape as `get_book`. Without `: int`, the key would be the string `"1"`, and `"1" in USERS` is `False` because the keys are ints.',
      solution: `from fastapi import FastAPI, HTTPException

app = FastAPI()

USERS = {
    1: {"id": 1, "name": "Ada"},
    2: {"id": 2, "name": "Grace"},
}


@app.get("/users/{user_id}")
def get_user(user_id: int):
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    return USERS[user_id]
`,
    },
    {
      type: 'task',
      title: 'GET /fruits: search and limit',
      md: `
Put the pieces together. \`FRUITS\` is given. Add \`GET /fruits\` with two optional query parameters:

- \`q\`: a string, default \`None\`. When given, keep only fruits that contain \`q\`, ignoring case.
- \`limit\`: an int, default \`3\`. Return at most this many.

Return \`{"results": [...]}\`.

- \`/fruits\` returns \`{"results": ["apple", "banana", "cherry"]}\`
- \`/fruits?q=AP&limit=10\` returns \`{"results": ["apple", "grape", "pineapple"]}\`
`,
      starter: `from fastapi import FastAPI

app = FastAPI()

FRUITS = ["apple", "banana", "cherry", "grape", "pineapple", "watermelon"]

# add GET /fruits here
`,
      tests: [
        { name: 'no parameters gives the first 3', code: `eq((await Client(app).get("/fruits")).json(), {"results": ["apple", "banana", "cherry"]})` },
        { name: 'q filters, ignoring case', code: `eq((await Client(app).get("/fruits?q=AP&limit=10")).json(), {"results": ["apple", "grape", "pineapple"]})` },
        { name: 'limit caps the count', code: `eq((await Client(app).get("/fruits?limit=1")).json(), {"results": ["apple"]})` },
      ],
      hint: 'Signature: `def fruits(q: str | None = None, limit: int = 3):`. Start from `FRUITS`; if `q` is set, filter with a comprehension using `q.lower() in f`. Slice with `[:limit]` at the end.',
      solution: `from fastapi import FastAPI

app = FastAPI()

FRUITS = ["apple", "banana", "cherry", "grape", "pineapple", "watermelon"]


@app.get("/fruits")
def fruits(q: str | None = None, limit: int = 3):
    results = FRUITS
    if q:
        results = [f for f in results if q.lower() in f]
    return {"results": results[:limit]}
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'For `@app.get("/items/{item_id}")` with `def get_item(item_id: int, q: str | None = None)`, where does `q` come from?',
          choices: ['The query string, like `/items/5?q=red`', 'The path', 'The JSON body', 'A header'],
          answer: 0,
          explain: 'Parameters named in the path come from the path. The rest of the simple ones come from the query string.',
          why: { 1: 'Only `item_id` is in the path template.', 2: 'GET routes with simple types read the query string. Bodies come in lesson 18.', 3: 'Headers need `Header()`, in lesson 20.' },
        },
        {
          q: 'A route has `n: int`, and someone calls it with `n=abc`. What status do they get?',
          choices: ['422', '400', '500', '404'],
          answer: 0,
          explain: 'FastAPI validates against the type hint and answers 422 before your function runs.',
          why: { 1: 'Reasonable guess, but FastAPI uses 422 for validation errors.', 2: '500 means your code crashed. It never ran.', 3: 'The route exists. The value is what is wrong.' },
        },
        {
          q: 'How do you answer 404 from inside a route?',
          choices: ['`raise HTTPException(status_code=404, detail="...")`', '`return 404`', '`return {"status": 404}`', '`print(404)`'],
          answer: 0,
          explain: 'Raising stops the function and FastAPI builds the error response.',
          why: { 1: 'That would send the number 404 as a 200 response body.', 2: 'That is a normal 200 response that happens to contain the word status.', 3: 'Printing only writes to the server log.' },
        },
        {
          q: 'What makes a query parameter optional?',
          choices: ['Giving it a default value, like `limit: int = 3`', 'Leaving off the type hint', 'Putting it in curly braces in the path', 'Naming it with a leading underscore'],
          answer: 0,
          explain: 'No default means required, exactly like a normal Python function argument.',
          why: { 1: 'It would still be required, just untyped.', 2: 'Curly braces make it a path parameter, which is always required.', 3: 'The name has nothing to do with it.' },
        },
      ],
    },
  ],
};
