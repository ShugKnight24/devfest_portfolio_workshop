// Python course · lesson 20. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'dependencies-and-auth',
  builds: ['python/crud-router', 'python/strings', 'node/middleware'],
  packages: ['fastapi'],
  title: 'Dependencies and auth',
  goal: 'Share logic between routes with Depends, read a bearer token from the Authorization header, and answer 401 and 403 correctly.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Depends: a function that runs first',
      md: `
Several routes often need the same preparation: read pagination settings, open a database session, find out who's calling. A **dependency** is an ordinary function that does that job. A route asks for its result with \`Depends\`:

~~~py
from fastapi import Depends, FastAPI

app = FastAPI()

def pagination(limit: int = 10, offset: int = 0):
    return {"limit": limit, "offset": offset}

@app.get("/items")
def list_items(page: dict = Depends(pagination)):
    return page

@app.get("/users")
def list_users(page: dict = Depends(pagination)):
    return page

c = Client(app)
print((await c.get("/items")).json())
print((await c.get("/users?limit=2")).json())
~~~

Before calling \`list_items\`, FastAPI calls \`pagination\`, filling **its** parameters from the request exactly as it would for a route (here, two query parameters). The return value becomes \`page\`.

In Express you'd write middleware that sets \`req.page\`. A dependency is more explicit: each route lists what it needs, and FastAPI's \`/docs\` shows those query parameters on both routes.

You'll also see this written with \`Annotated\`, the style FastAPI's docs prefer. It means the same thing:

~~~
from typing import Annotated

def list_items(page: Annotated[dict, Depends(pagination)]): ...
~~~
`,
    },
    {
      type: 'task',
      title: 'A shared dependency',
      md: `
\`USERS\` and the \`pagination\` dependency are given. Add \`GET /users\` that uses \`Depends(pagination)\` and returns \`{"users": ...}\`: the slice of \`USERS\` from \`offset\`, at most \`limit\` long.

- \`/users\` returns all four names
- \`/users?limit=2&offset=1\` returns \`{"users": ["Grace", "Alan"]}\`
`,
      starter: `from fastapi import Depends, FastAPI

app = FastAPI()

USERS = ["Ada", "Grace", "Alan", "Linus"]


def pagination(limit: int = 10, offset: int = 0):
    return {"limit": limit, "offset": offset}

# add GET /users here
`,
      tests: [
        { name: 'no parameters returns everyone', code: `eq((await Client(app).get("/users")).json(), {"users": ["Ada", "Grace", "Alan", "Linus"]})` },
        { name: 'limit=2&offset=1 returns Grace and Alan', code: `eq((await Client(app).get("/users?limit=2&offset=1")).json(), {"users": ["Grace", "Alan"]})` },
      ],
      hint: '`def list_users(page: dict = Depends(pagination)):`, then slice: `USERS[page["offset"]:page["offset"] + page["limit"]]`.',
      solution: `from fastapi import Depends, FastAPI

app = FastAPI()

USERS = ["Ada", "Grace", "Alan", "Linus"]


def pagination(limit: int = 10, offset: int = 0):
    return {"limit": limit, "offset": offset}


@app.get("/users")
def list_users(page: dict = Depends(pagination)):
    start = page["offset"]
    return {"users": USERS[start:start + page["limit"]]}
`,
    },
    {
      type: 'read',
      title: 'Bearer tokens and the Authorization header',
      md: `
After a user logs in, the server hands them a **token**, a long random string. On every later request the client sends it back in a header:

~~~text
Authorization: Bearer 3f9a1c...
~~~

"Bearer" means "whoever bears (holds) this token is allowed in", which is why tokens must stay secret and travel only over HTTPS.

To read a header in FastAPI, use \`Header()\`. The parameter name \`authorization\` matches the \`Authorization\` header (header names ignore case):

~~~py
from fastapi import FastAPI, Header

app = FastAPI()

@app.get("/echo")
def echo(authorization: str | None = Header(default=None)):
    return {"got": authorization}

c = Client(app)
print((await c.get("/echo")).json())
print((await c.get("/echo", headers={"Authorization": "Bearer abc"})).json())
~~~

The value is the whole string, \`"Bearer abc"\`. Pulling the token out is plain string work from lesson 4, which is the next task.
`,
    },
    {
      type: 'task',
      title: 'parse_bearer',
      md: `
Write a plain function (no FastAPI yet) \`parse_bearer(header)\`. It returns the token from \`"Bearer <token>"\`, or \`None\` if the header is missing, uses another scheme, or has no token.

- \`parse_bearer("Bearer abc")\` returns \`"abc"\`
- \`parse_bearer(None)\`, \`parse_bearer("Basic abc")\` and \`parse_bearer("Bearer")\` return \`None\`

\`"Bearer abc".partition(" ")\` returns the 3-tuple \`("Bearer", " ", "abc")\`, which you can unpack (lesson 12).
`,
      starter: `def parse_bearer(header):
    pass  # your code here
`,
      tests: [
        { name: '"Bearer abc" gives "abc"', code: `eq(parse_bearer("Bearer abc"), "abc")` },
        { name: 'a missing header gives None', code: `eq(parse_bearer(None), None)` },
        { name: 'another scheme gives None', code: `eq(parse_bearer("Basic abc"), None)` },
        { name: '"Bearer" with no token gives None', code: `eq(parse_bearer("Bearer"), None)` },
      ],
      hint: 'Start with `if not header: return None`. Then `scheme, _, token = header.partition(" ")`. Return `token` only if `scheme == "Bearer"` and `token` is non-empty.',
      solution: `def parse_bearer(header):
    if not header:
        return None
    scheme, _, token = header.partition(" ")
    if scheme != "Bearer" or not token:
        return None
    return token
`,
    },
    {
      type: 'read',
      title: 'A dependency that says no',
      md: `
Now combine them. \`get_current_user\` is a dependency that reads the header, looks the token up, and either **returns the user** or **raises 401**:

~~~py
from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()
TOKENS = {"t-ada": {"username": "ada", "role": "admin"}}

def get_current_user(authorization: str | None = Header(default=None)):
    scheme, _, token = (authorization or "").partition(" ")
    if scheme != "Bearer" or token not in TOKENS:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TOKENS[token]

@app.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user

c = Client(app)
r = await c.get("/me")
print(r.status_code, r.json(), r.headers["www-authenticate"])
print((await c.get("/me", headers={"Authorization": "Bearer t-ada"})).json())
~~~

If the dependency raises, **the route never runs**. Every protected route just adds \`user = Depends(get_current_user)\`, and the check can't be forgotten halfway down a function.

The \`WWW-Authenticate: Bearer\` header is what the HTTP spec expects on a 401: it tells the client which kind of credentials to send.
`,
    },
    {
      type: 'task',
      title: 'GET /me',
      md: `
\`TOKENS\` is given. Write the dependency \`get_current_user\` and a route \`GET /me\` that returns the current user.

- With \`Authorization: Bearer t-bob\`, \`/me\` returns \`{"username": "bob", "role": "user"}\`
- With no header, or an unknown token, it's **401** with \`{"detail": "Not authenticated"}\` and the header \`WWW-Authenticate: Bearer\`
`,
      starter: `from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()

TOKENS = {
    "t-ada": {"username": "ada", "role": "admin"},
    "t-bob": {"username": "bob", "role": "user"},
}

# add get_current_user and GET /me here
`,
      tests: [
        { name: 'a valid token returns the user', code: `r = await Client(app).get("/me", headers={"Authorization": "Bearer t-bob"})
eq(r.status_code, 200)
eq(r.json(), {"username": "bob", "role": "user"})` },
        { name: 'no header is 401 Not authenticated', code: `r = await Client(app).get("/me")
eq(r.status_code, 401)
eq(r.json(), {"detail": "Not authenticated"})` },
        { name: 'the 401 says WWW-Authenticate: Bearer', code: `r = await Client(app).get("/me")
eq(r.headers.get("www-authenticate"), "Bearer")` },
        { name: 'an unknown token is 401', code: `eq((await Client(app).get("/me", headers={"Authorization": "Bearer nope"})).status_code, 401)` },
      ],
      hint: 'The reading\'s code is the whole answer. Type it out yourself rather than pasting, and check you raise (not return) the HTTPException.',
      solution: `from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()

TOKENS = {
    "t-ada": {"username": "ada", "role": "admin"},
    "t-bob": {"username": "bob", "role": "user"},
}


def get_current_user(authorization: str | None = Header(default=None)):
    scheme, _, token = (authorization or "").partition(" ")
    if scheme != "Bearer" or token not in TOKENS:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TOKENS[token]


@app.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user
`,
    },
    {
      type: 'read',
      title: '401 vs 403, and dependencies on dependencies',
      md: `
Two status codes that people mix up:

| Status | Means | Example |
|---|---|---|
| **401** Unauthorized | "I don't know who you are" | no token, a bad token, an expired token |
| **403** Forbidden | "I know who you are, and the answer is no" | a regular user calling an admin route |

The names are historical; 401 really means **unauthenticated**.

A dependency can itself depend on another one. \`require_admin\` reuses \`get_current_user\`, then adds its own check:

~~~
def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return user
~~~

FastAPI resolves the chain in order. An anonymous caller fails inside \`get_current_user\` and gets **401** before \`require_admin\` ever runs; a logged-in non-admin gets past that and receives **403**.

To run the finished app locally and click through it:

~~~bash
fastapi dev main.py
~~~

Open \`/docs\`, call a protected route, and you'll see the 401. Send a header with \`curl -H "Authorization: Bearer t-ada" localhost:8000/me\` to see it succeed.
`,
    },
    {
      type: 'predict',
      title: 'Who runs first?',
      md: 'A route depends on `b`, which depends on `a`. In what order do they print?',
      code: `from fastapi import Depends, FastAPI

app = FastAPI()

def a():
    print("a ran")
    return 1

def b(x: int = Depends(a)):
    print("b ran")
    return x + 1

@app.get("/")
def route(v: int = Depends(b)):
    print("route ran")
    return {"v": v}

print((await Client(app).get("/")).json())`,
      output: `a ran
b ran
route ran
{'v': 2}`,
      explain: 'FastAPI works from the inside out: `b` needs `a`, so `a` runs first, then `b` with its result, then the route. That is why an anonymous caller hits the 401 inside `get_current_user` before `require_admin` can say 403.',
    },
    {
      type: 'task',
      title: 'GET /admin/stats',
      md: `
\`get_current_user\` is given. Add \`require_admin\` (403 \`{"detail": "Admins only"}\` unless the role is \`"admin"\`) and \`GET /admin/stats\`, which uses it and returns \`{"user_count": 2}\`.

- ada's token \`t-ada\` gets 200 and \`{"user_count": 2}\`
- bob's token \`t-bob\` gets **403**
- no token gets **401**
`,
      starter: `from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()

TOKENS = {
    "t-ada": {"username": "ada", "role": "admin"},
    "t-bob": {"username": "bob", "role": "user"},
}


def get_current_user(authorization: str | None = Header(default=None)):
    scheme, _, token = (authorization or "").partition(" ")
    if scheme != "Bearer" or token not in TOKENS:
        raise HTTPException(status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    return TOKENS[token]

# add require_admin and GET /admin/stats here
`,
      tests: [
        { name: 'an admin gets the stats', code: `r = await Client(app).get("/admin/stats", headers={"Authorization": "Bearer t-ada"})
eq(r.status_code, 200)
eq(r.json(), {"user_count": 2})` },
        { name: 'a regular user gets 403 Admins only', code: `r = await Client(app).get("/admin/stats", headers={"Authorization": "Bearer t-bob"})
eq(r.status_code, 403)
eq(r.json(), {"detail": "Admins only"})` },
        { name: 'no token gets 401', code: `eq((await Client(app).get("/admin/stats")).status_code, 401)` },
      ],
      hint: 'Use the `require_admin` from the reading, then `@app.get("/admin/stats")` with `def stats(admin: dict = Depends(require_admin)):` returning `{"user_count": len(TOKENS)}`.',
      solution: `from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()

TOKENS = {
    "t-ada": {"username": "ada", "role": "admin"},
    "t-bob": {"username": "bob", "role": "user"},
}


def get_current_user(authorization: str | None = Header(default=None)):
    scheme, _, token = (authorization or "").partition(" ")
    if scheme != "Bearer" or token not in TOKENS:
        raise HTTPException(status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    return TOKENS[token]


def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    return user


@app.get("/admin/stats")
def stats(admin: dict = Depends(require_admin)):
    return {"user_count": len(TOKENS)}
`,
    },
    {
      type: 'read',
      title: 'Where tokens come from: login',
      md: `
The last piece is the route that hands out tokens. It checks a username and password, then stores a fresh random token:

~~~
import secrets

@app.post("/login")
def login(body: LoginIn):
    user = USERS.get(body.username)
    if user is None or not secrets.compare_digest(user["password"], body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = secrets.token_urlsafe(32)
    tokens[token] = body.username
    return {"access_token": token, "token_type": "bearer"}
~~~

Three security habits are hiding in those lines:

- \`secrets.token_urlsafe\` makes an unguessable token. Never use \`random\` for anything security-related.
- The error is the **same** for "no such user" and "wrong password", so attackers can't discover which usernames exist.
- \`compare_digest\` takes the same time whether or not the strings match, which blocks timing attacks.

And one this toy skips: real apps store a password **hash** (bcrypt or argon2), never the password itself.
`,
    },
    {
      type: 'task',
      title: 'POST /login, then GET /me',
      md: `
Put it all together. \`USERS\`, \`tokens\`, \`LoginIn\`, \`get_current_user\` and \`/me\` are given. Add \`POST /login\`:

- correct username and password: store a new token in \`tokens\` (token to username) and return \`{"access_token": <token>, "token_type": "bearer"}\`
- anything else: **401** \`{"detail": "Invalid credentials"}\`

The tests log in, then call \`/me\` with the token you returned.
`,
      starter: `import secrets

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

app = FastAPI()

USERS = {"ada": {"password": "lovelace", "role": "admin"}}
tokens = {}  # token -> username


class LoginIn(BaseModel):
    username: str
    password: str


def get_current_user(authorization: str | None = Header(default=None)):
    scheme, _, token = (authorization or "").partition(" ")
    if scheme != "Bearer" or token not in tokens:
        raise HTTPException(status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    username = tokens[token]
    return {"username": username, "role": USERS[username]["role"]}


@app.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user

# add POST /login here
`,
      tests: [
        { name: 'a correct login returns a bearer token', code: `r = await Client(app).post("/login", json={"username": "ada", "password": "lovelace"})
eq(r.status_code, 200)
eq(r.json()["token_type"], "bearer")
assert len(r.json()["access_token"]) >= 16, "the token should be long and random"` },
        { name: 'the token works on /me', code: `c = Client(app)
token = (await c.post("/login", json={"username": "ada", "password": "lovelace"})).json()["access_token"]
r = await c.get("/me", headers={"Authorization": f"Bearer {token}"})
eq(r.json(), {"username": "ada", "role": "admin"})` },
        { name: 'a wrong password is 401 Invalid credentials', code: `r = await Client(app).post("/login", json={"username": "ada", "password": "nope"})
eq(r.status_code, 401)
eq(r.json(), {"detail": "Invalid credentials"})` },
        { name: 'an unknown user gets the same 401', code: `r = await Client(app).post("/login", json={"username": "eve", "password": "x"})
eq(r.json(), {"detail": "Invalid credentials"})` },
      ],
      hint: 'The reading has the route. `USERS.get(body.username)` gives `None` for an unknown user, so one `if` covers both failure cases.',
      solution: `import secrets

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

app = FastAPI()

USERS = {"ada": {"password": "lovelace", "role": "admin"}}
tokens = {}  # token -> username


class LoginIn(BaseModel):
    username: str
    password: str


def get_current_user(authorization: str | None = Header(default=None)):
    scheme, _, token = (authorization or "").partition(" ")
    if scheme != "Bearer" or token not in tokens:
        raise HTTPException(status_code=401, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"})
    username = tokens[token]
    return {"username": username, "role": USERS[username]["role"]}


@app.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user


@app.post("/login")
def login(body: LoginIn):
    user = USERS.get(body.username)
    if user is None or not secrets.compare_digest(user["password"], body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = secrets.token_urlsafe(32)
    tokens[token] = body.username
    return {"access_token": token, "token_type": "bearer"}
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'A logged-in regular user calls an admin-only route. Which status?',
          choices: ['403', '401', '404', '422'],
          answer: 0,
          explain: 'You know who they are, and they still may not. That is 403 Forbidden.',
          why: { 1: '401 is for "I don\'t know who you are", but this user is logged in.', 2: 'The route exists. Hiding it with 404 is a deliberate choice some APIs make, but not the standard answer.', 3: '422 is for invalid input data.' },
        },
        {
          q: 'What happens when a dependency raises HTTPException?',
          choices: ['The route function never runs and the client gets that error', 'The route runs with the dependency value set to None', 'FastAPI retries the dependency', 'The server crashes with a 500'],
          answer: 0,
          explain: 'Dependencies run first. If one raises, FastAPI answers with that error immediately.',
          why: { 1: 'The route is skipped entirely.', 2: 'There are no automatic retries.', 3: 'HTTPException is an expected error, so FastAPI turns it into a normal response.' },
        },
        {
          q: 'How does a route ask for the current user?',
          choices: ['A parameter like `user: dict = Depends(get_current_user)`', 'By calling `get_current_user()` with no arguments in the body', 'With a global variable `current_user`', 'With `@app.middleware("user")`'],
          answer: 0,
          explain: 'FastAPI sees `Depends`, runs the dependency with values from the request, and passes in its result.',
          why: { 1: 'Called by hand, nothing would fill its `authorization` parameter from the request.', 2: 'A global would be shared between concurrent requests.', 3: 'Middleware runs for every request and cannot hand a value to one route parameter like this.' },
        },
        {
          q: 'Why should login return the same error for an unknown user and a wrong password?',
          choices: ['So attackers cannot find out which usernames exist', 'Because FastAPI only allows one error message per route', 'To make the code shorter', 'Because 401 cannot have different details'],
          answer: 0,
          explain: 'Different messages would let anyone probe the API to list valid usernames.',
          why: { 1: 'You can raise as many different errors as you like.', 2: 'Shorter code is a side effect, not the reason.', 3: 'The detail can be any text. Keeping it identical is a security choice.' },
        },
      ],
    },
  ],
};
