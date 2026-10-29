// Python course · lesson 18. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'pydantic-models',
  builds: ['python/fastapi-first-routes', 'python/classes-and-dataclasses'],
  packages: ['fastapi'],
  title: 'Pydantic models: bodies and validation',
  goal: 'Describe JSON with a Pydantic model, add constraints with Field, accept a POST body with status 201, and shape responses with response_model.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'A dataclass that checks its input',
      md: `
A Pydantic model looks almost exactly like the dataclass from lesson 14. You inherit from \`BaseModel\` instead of using \`@dataclass\`:

~~~py
from pydantic import BaseModel

class Item(BaseModel):
    name: str
    price: float
    in_stock: bool = True

item = Item(name="pen", price="2.5")
print(item)
print(item.price + 1)
print(item.model_dump())
~~~

The big difference: Pydantic **enforces** the type hints. \`price="2.5"\` was converted to the float \`2.5\`, and anything it can't convert is rejected with a \`ValidationError\`.

\`model_dump()\` turns the model back into a plain dict, ready to become JSON.

Two rules to remember. Pydantic models take **keyword** arguments (\`Item(name="pen")\`, not \`Item("pen")\`), and a field with no default is required.
`,
    },
    {
      type: 'predict',
      title: 'What gets rejected?',
      code: `from pydantic import BaseModel, ValidationError

class Item(BaseModel):
    name: str
    price: float

try:
    Item(name="pen", price="cheap")
except ValidationError as e:
    print(e.error_count())
    for err in e.errors():
        print(err["loc"], err["type"])

try:
    Item(price=2)
except ValidationError as e:
    print(e.errors()[0]["loc"], e.errors()[0]["type"])`,
      output: `1
('price',) float_parsing
('name',) missing`,
      explain: '`"cheap"` can\'t become a float, so you get one error located at `price`. Leaving out `name`, which has no default, is a `missing` error. These are the same entries you saw inside a FastAPI 422 body in lesson 17, because FastAPI uses Pydantic underneath.',
    },
    {
      type: 'task',
      title: 'Book',
      md: `
Write a Pydantic model \`Book\` with \`title\` (a str) and \`pages\` (an int).

- \`Book(title="Dune", pages="412").pages\` is the int \`412\`
- \`Book(title="Dune")\` raises \`ValidationError\`
`,
      starter: `from pydantic import BaseModel, ValidationError


class Book(BaseModel):
    pass  # your fields here
`,
      tests: [
        { name: 'pages is converted to an int', code: `eq(Book(title="Dune", pages="412").pages, 412)` },
        { name: 'title is stored', code: `eq(Book(title="Dune", pages=1).title, "Dune")` },
        { name: 'a missing pages raises ValidationError', code: `try:
    Book(title="Dune")
    raise AssertionError("expected a ValidationError, but nothing was raised")
except ValidationError:
    pass` },
      ],
      hint: 'Two lines inside the class, the same as a dataclass: `title: str` and `pages: int`.',
      solution: `from pydantic import BaseModel, ValidationError


class Book(BaseModel):
    title: str
    pages: int
`,
    },
    {
      type: 'read',
      title: 'Constraints with Field',
      md: `
Types alone don't catch an empty name or an age of -5. \`Field(...)\` adds rules on top of the type:

~~~py
from pydantic import BaseModel, Field, ValidationError

class Signup(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    age: int = Field(ge=0, le=150)
    nickname: str | None = None

print(Signup(name="Ada", age=36))
try:
    Signup(name="", age=-1)
except ValidationError as e:
    for err in e.errors():
        print(err["loc"], err["msg"])
~~~

| Rule | For | Means |
|---|---|---|
| \`min_length\`, \`max_length\` | str, list | length limits |
| \`ge\`, \`le\` | numbers | greater/less than or **equal** |
| \`gt\`, \`lt\` | numbers | strictly greater/less |
| \`pattern\` | str | must match a regular expression |

Pydantic reports **every** problem at once, not just the first. Your \`check_age\` from lesson 13 is now one argument: \`Field(ge=0, le=150)\`.
`,
    },
    {
      type: 'task',
      title: 'UserIn',
      md: `
Write a model \`UserIn\`:

- \`name\`: str, 1 to 50 characters
- \`age\`: int, 0 to 150 inclusive
- \`nickname\`: optional str, default \`None\`

\`UserIn(name="Ada", age=36).nickname\` is \`None\`. An empty name or an age of \`-1\` raises \`ValidationError\`.
`,
      starter: `from pydantic import BaseModel, Field, ValidationError


class UserIn(BaseModel):
    name: str
    age: int
`,
      tests: [
        { name: 'a valid user, nickname defaults to None', code: `u = UserIn(name="Ada", age=36)
eq(u.name, "Ada"); eq(u.age, 36); eq(u.nickname, None)` },
        { name: 'an empty name is rejected', code: `try:
    UserIn(name="", age=36)
    raise AssertionError("expected a ValidationError for an empty name")
except ValidationError:
    pass` },
        { name: 'age -1 is rejected but 0 and 150 are fine', code: `UserIn(name="A", age=0); UserIn(name="A", age=150)
try:
    UserIn(name="A", age=-1)
    raise AssertionError("expected a ValidationError for age -1")
except ValidationError:
    pass` },
      ],
      hint: '`name: str = Field(min_length=1, max_length=50)`, `age: int = Field(ge=0, le=150)`, and `nickname: str | None = None`.',
      solution: `from pydantic import BaseModel, Field, ValidationError


class UserIn(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    age: int = Field(ge=0, le=150)
    nickname: str | None = None
`,
    },
    {
      type: 'read',
      title: 'A model as a request body',
      md: `
Give a route parameter a **model** as its type, and FastAPI reads it from the JSON body. It parses the JSON, validates it with the model, and only then calls your function:

~~~py
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class ItemIn(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(gt=0)

items = []

@app.post("/items", status_code=201)
def create_item(item: ItemIn):
    saved = {"id": len(items) + 1, **item.model_dump()}
    items.append(saved)
    return saved

r = await Client(app).post("/items", json={"name": "pen", "price": 2.5})
print(r.status_code, r.json())
~~~

- \`@app.post\` instead of \`@app.get\`. In tests, \`Client(app).post(url, json={...})\` sends the body.
- \`status_code=201\` sets the success status. **201 Created** is the right answer to a POST that made something.
- \`{"id": ..., **item.model_dump()}\` is lesson 12's dict merge with \`**\`.

Express needs \`express.json()\` plus a hand-written validator (or zod) for this. Here, the type hint is the validator.

Run it locally the same way as before, then try POST from the **Try it out** button on \`/docs\`:

~~~bash
fastapi dev main.py
~~~
`,
    },
    {
      type: 'task',
      title: 'POST /notes',
      md: `
\`NoteIn\` and the \`notes\` list are given. Add \`POST /notes\` that takes a \`NoteIn\` body, saves \`{"id": <next id>, "text": ...}\` to \`notes\`, and returns it with status **201**. The first note gets id \`1\`.

- POST \`{"text": "buy milk"}\` returns 201 and \`{"id": 1, "text": "buy milk"}\`
`,
      starter: `from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()


class NoteIn(BaseModel):
    text: str = Field(min_length=1)


notes = []

# add POST /notes here
`,
      tests: [
        { name: 'POST answers 201 with the saved note', code: `r = await Client(app).post("/notes", json={"text": "buy milk"})
eq(r.status_code, 201)
eq(r.json(), {"id": 1, "text": "buy milk"})` },
        { name: 'the second note gets id 2', code: `c = Client(app)
await c.post("/notes", json={"text": "a"})
r = await c.post("/notes", json={"text": "b"})
eq(r.json(), {"id": 2, "text": "b"})` },
        { name: 'an empty text is a 422', code: `eq((await Client(app).post("/notes", json={"text": ""})).status_code, 422)` },
      ],
      hint: 'Copy `create_item` from the reading: `@app.post("/notes", status_code=201)`, a parameter `note: NoteIn`, and `{"id": len(notes) + 1, **note.model_dump()}`.',
      solution: `from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()


class NoteIn(BaseModel):
    text: str = Field(min_length=1)


notes = []


@app.post("/notes", status_code=201)
def create_note(note: NoteIn):
    saved = {"id": len(notes) + 1, **note.model_dump()}
    notes.append(saved)
    return saved
`,
    },
    {
      type: 'predict',
      title: 'A bad body',
      code: `from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class ItemIn(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(gt=0)

@app.post("/items", status_code=201)
def create_item(item: ItemIn):
    print("route ran")
    return item

r = await Client(app).post("/items", json={"name": "pen", "price": -1})
print(r.status_code)
print([e["loc"] for e in r.json()["detail"]])`,
      output: `422
[['body', 'price']]`,
      explain: 'The body failed validation, so FastAPI answered 422 and **"route ran" never printed**. The `loc` now starts with `"body"` (in lesson 17 it was `"path"`), then the field name. Your function only ever sees data that already passed the model.',
    },
    {
      type: 'read',
      title: 'response_model: control what goes out',
      md: `
Models describe what comes **in**. \`response_model\` describes what goes **out**, and FastAPI filters the return value through it. That's how you avoid leaking fields such as a password hash:

~~~py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class UserOut(BaseModel):
    id: int
    name: str

DB = {1: {"id": 1, "name": "Ada", "password_hash": "x9f..."}}

@app.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int):
    return DB[user_id]               # has 3 keys...

r = await Client(app).get("/users/1")
print(r.json())                      # ...but only 2 go out
~~~

Models can also inherit, like the exception classes in lesson 14. A common trio:

~~~
class UserIn(BaseModel):     # what a client may send
    name: str
    age: int

class User(UserIn):          # what you store: everything in UserIn, plus id
    id: int

class UserSummary(BaseModel):  # a smaller view for lists
    id: int
    name: str
~~~
`,
    },
    {
      type: 'task',
      title: 'GET /users/{user_id}/summary',
      md: `
The \`users\` store is given. Add a model \`UserSummary\` with \`id\` (int) and \`name\` (str), and a route \`GET /users/{user_id}/summary\` that returns the stored user through \`response_model=UserSummary\`. A missing id is **404** \`{"detail": "User not found"}\`.

- \`/users/1/summary\` returns \`{"id": 1, "name": "Ada"}\`, with no \`email\`
`,
      starter: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

users = {1: {"id": 1, "name": "Ada", "email": "ada@example.com", "age": 36}}

# add class UserSummary and GET /users/{user_id}/summary here
`,
      tests: [
        { name: 'the summary has only id and name', code: `r = await Client(app).get("/users/1/summary")
eq(r.status_code, 200)
eq(r.json(), {"id": 1, "name": "Ada"})` },
        { name: 'a missing user is 404', code: `r = await Client(app).get("/users/9/summary")
eq(r.status_code, 404)
eq(r.json(), {"detail": "User not found"})` },
      ],
      hint: 'Put `response_model=UserSummary` inside `@app.get(...)`, after the path. In the function, raise the 404 like lesson 17, then `return users[user_id]`. The filtering happens on its own.',
      solution: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

users = {1: {"id": 1, "name": "Ada", "email": "ada@example.com", "age": 36}}


class UserSummary(BaseModel):
    id: int
    name: str


@app.get("/users/{user_id}/summary", response_model=UserSummary)
def user_summary(user_id: int):
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    return users[user_id]
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'A POST body is missing a required field. What does the client get?',
          choices: ['422, and your route function never runs', '400 from your route', '500, because the field is None', '201 with the field set to None'],
          answer: 0,
          explain: 'FastAPI validates the body with the model first and answers 422 on failure.',
          why: { 1: 'Your route never runs, so it cannot answer anything.', 2: 'Nothing crashed. Validation stopped the request first.', 3: 'Only fields with a default can be left out.' },
        },
        {
          q: 'Which `Field` keeps an int between 0 and 150, including both ends?',
          choices: ['`Field(ge=0, le=150)`', '`Field(gt=0, lt=150)`', '`Field(min_length=0, max_length=150)`', '`Field(0, 150)`'],
          answer: 0,
          explain: '`ge` and `le` mean greater/less than or equal.',
          why: { 1: '`gt` and `lt` are strict, so 0 and 150 would be rejected.', 2: 'Those limit the length of strings and lists, not number values.', 3: 'The first positional argument is the default value, not a range.' },
        },
        {
          q: 'What does `response_model=UserSummary` do?',
          choices: ['Filters and validates the return value, so only UserSummary\'s fields are sent', 'Validates the request body', 'Changes the status code', 'Makes the route return a Python object instead of JSON'],
          answer: 0,
          explain: 'It shapes the output. The body\'s shape comes from the parameter\'s model.',
          why: { 1: 'The request body is the parameter typed with a model.', 2: 'That is `status_code=`.', 3: 'The response is still JSON, just filtered.' },
        },
        {
          q: 'What is the right success status for a POST that created a resource?',
          choices: ['201', '200', '204', '202'],
          answer: 0,
          explain: '201 Created. Set it with `status_code=201` on the decorator.',
          why: { 1: '200 works but says less. 201 tells the client something new exists.', 2: '204 means success with no body. Lesson 19 uses it for DELETE.', 3: '202 means "accepted, will process later", for background jobs.' },
        },
      ],
    },
  ],
};
