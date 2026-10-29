// Python course · lesson 19. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'crud-router',
  builds: ['python/pydantic-models', 'python/sum-min-max-sort', 'python/unpacking-and-copying', 'node/crud-service'],
  packages: ['fastapi'],
  title: 'A CRUD router',
  goal: 'Build create, read, update and delete routes for one resource on an APIRouter, with the right status code for each: 200, 201, 204, 404.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'CRUD, and where it lives',
      md: `
Almost every API is a set of **resources** (notes, users, orders), each with the same five routes:

| Action | Method and path | Success status |
|---|---|---|
| list | \`GET /notes\` | 200 |
| read one | \`GET /notes/{id}\` | 200, or 404 if missing |
| create | \`POST /notes\` | **201** Created |
| update | \`PUT\` or \`PATCH /notes/{id}\` | 200, or 404 |
| delete | \`DELETE /notes/{id}\` | **204** No Content, or 404 |

Putting a resource's routes on the main \`app\` gets crowded. An \`APIRouter\` is a mini-app for one resource, with a shared path prefix:

~~~py
from fastapi import APIRouter, FastAPI

app = FastAPI()
router = APIRouter(prefix="/notes")

@router.get("")                  # GET /notes
def list_notes():
    return []

@router.get("/{note_id}")        # GET /notes/{note_id}
def get_note(note_id: int):
    return {"id": note_id}

app.include_router(router)       # plug the router into the app

print((await Client(app).get("/notes/7")).json())
~~~

It's Express's \`const router = express.Router()\` plus \`app.use("/notes", router)\`. In a real project each router lives in its own file, such as \`routers/notes.py\`.

To run it locally, the other common command is \`uvicorn\`, which \`fastapi dev\` uses under the hood. \`main:app\` means "the \`app\` variable in \`main.py\`":

~~~bash
uvicorn main:app --reload
~~~
`,
    },
    {
      type: 'predict',
      title: 'Order of include_router',
      md: 'This router gets a second route **after** it was included. What does a request to it return?',
      code: `from fastapi import APIRouter, FastAPI

app = FastAPI()
router = APIRouter(prefix="/notes")

@router.get("")
def list_notes():
    return []

app.include_router(router)

@router.get("/count")
def count():
    return {"count": 0}

print((await Client(app).get("/notes")).status_code)
print((await Client(app).get("/notes/count")).status_code)`,
      output: `200
404`,
      explain: '`include_router` **copies** the routes that exist at that moment. `/count` was added to the router afterwards, so the app never saw it. Keep `app.include_router(router)` after all the route definitions, usually at the bottom of the file or in `main.py`.',
    },
    {
      type: 'read',
      title: 'An in-memory store',
      md: `
Until you add a database, a dict from id to note does the job. The tasks in this lesson all share this starting point:

~~~py
from pydantic import BaseModel, Field

class NoteIn(BaseModel):
    title: str = Field(min_length=1)
    done: bool = False

notes = {1: {"id": 1, "title": "buy milk", "done": False}}

def next_id():
    return max(notes, default=0) + 1      # lesson 11's max, with a default for an empty dict

print(next_id())
~~~

Looping over a dict gives its keys, so \`max(notes)\` is the biggest id so far. \`default=0\` handles the empty store.

Each test on this page starts the code from scratch, so the store resets between tests. A real server keeps it in memory until it restarts, which is exactly why real apps use a database.
`,
    },
    {
      type: 'task',
      title: 'Create: POST /notes',
      md: `
Add \`POST /notes\` on the router. It takes a \`NoteIn\` body, stores \`{"id": next_id(), **note.model_dump()}\` in \`notes\` under that id, and returns it with status **201**.

- POST \`{"title": "call mom"}\` returns 201 and \`{"id": 2, "title": "call mom", "done": False}\`

Keep \`app.include_router(router)\` at the bottom.
`,
      starter: `from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()
router = APIRouter(prefix="/notes")


class NoteIn(BaseModel):
    title: str = Field(min_length=1)
    done: bool = False


notes = {1: {"id": 1, "title": "buy milk", "done": False}}


def next_id():
    return max(notes, default=0) + 1


# add POST /notes here


app.include_router(router)
`,
      tests: [
        { name: 'POST answers 201 with the new note', code: `r = await Client(app).post("/notes", json={"title": "call mom"})
eq(r.status_code, 201)
eq(r.json(), {"id": 2, "title": "call mom", "done": False})` },
        { name: 'the note is saved in the store', code: `await Client(app).post("/notes", json={"title": "call mom"})
eq(notes[2]["title"], "call mom")` },
      ],
      hint: '`@router.post("", status_code=201)` (the empty path means just the prefix). Inside: `new_id = next_id()`, build the dict, `notes[new_id] = saved`, return it.',
      solution: `from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()
router = APIRouter(prefix="/notes")


class NoteIn(BaseModel):
    title: str = Field(min_length=1)
    done: bool = False


notes = {1: {"id": 1, "title": "buy milk", "done": False}}


def next_id():
    return max(notes, default=0) + 1


@router.post("", status_code=201)
def create_note(note: NoteIn):
    new_id = next_id()
    saved = {"id": new_id, **note.model_dump()}
    notes[new_id] = saved
    return saved


app.include_router(router)
`,
    },
    {
      type: 'task',
      title: 'Read: GET /notes and GET /notes/{note_id}',
      md: `
Add two routes:

- \`GET /notes\` returns the list of all notes: \`list(notes.values())\`.
- \`GET /notes/{note_id}\` returns one note, or **404** \`{"detail": "Note not found"}\`.
`,
      starter: `from fastapi import APIRouter, FastAPI, HTTPException

app = FastAPI()
router = APIRouter(prefix="/notes")

notes = {
    1: {"id": 1, "title": "buy milk", "done": False},
    2: {"id": 2, "title": "call mom", "done": True},
}

# add GET /notes and GET /notes/{note_id} here


app.include_router(router)
`,
      tests: [
        { name: 'GET /notes lists both notes', code: `r = await Client(app).get("/notes")
eq(r.status_code, 200)
eq([n["id"] for n in r.json()], [1, 2])` },
        { name: 'GET /notes/2 returns that note', code: `eq((await Client(app).get("/notes/2")).json(), {"id": 2, "title": "call mom", "done": True})` },
        { name: 'a missing note is 404 "Note not found"', code: `r = await Client(app).get("/notes/9")
eq(r.status_code, 404)
eq(r.json(), {"detail": "Note not found"})` },
      ],
      hint: '`@router.get("")` for the list. For one note, use the 404 pattern from lesson 17: `if note_id not in notes: raise HTTPException(status_code=404, detail="Note not found")`.',
      solution: `from fastapi import APIRouter, FastAPI, HTTPException

app = FastAPI()
router = APIRouter(prefix="/notes")

notes = {
    1: {"id": 1, "title": "buy milk", "done": False},
    2: {"id": 2, "title": "call mom", "done": True},
}


@router.get("")
def list_notes():
    return list(notes.values())


@router.get("/{note_id}")
def get_note(note_id: int):
    if note_id not in notes:
        raise HTTPException(status_code=404, detail="Note not found")
    return notes[note_id]


app.include_router(router)
`,
    },
    {
      type: 'read',
      title: 'Delete, and 204 No Content',
      md: `
After a delete there's nothing useful to send back. **204 No Content** says "done, and the body is intentionally empty". Set it on the decorator and return nothing:

~~~py
from fastapi import FastAPI, HTTPException

app = FastAPI()
tags = {1: "urgent", 2: "home"}

@app.delete("/tags/{tag_id}", status_code=204)
def delete_tag(tag_id: int):
    if tag_id not in tags:
        raise HTTPException(status_code=404, detail="Tag not found")
    del tags[tag_id]

c = Client(app)
r = await c.delete("/tags/1")
print(r.status_code, repr(r.text), tags)
print((await c.delete("/tags/1")).status_code)
~~~

Deleting the same id twice gives 404 the second time, because it's gone. Some APIs choose to answer 204 both times instead (called **idempotent** delete). Either is defensible as long as you're consistent; this lesson uses 404.
`,
    },
    {
      type: 'task',
      title: 'Delete: DELETE /notes/{note_id}',
      md: `
Add \`DELETE /notes/{note_id}\`. It removes the note and answers **204** with no body, or **404** \`{"detail": "Note not found"}\` if there's no such note.
`,
      starter: `from fastapi import APIRouter, FastAPI, HTTPException

app = FastAPI()
router = APIRouter(prefix="/notes")

notes = {
    1: {"id": 1, "title": "buy milk", "done": False},
    2: {"id": 2, "title": "call mom", "done": True},
}

# add DELETE /notes/{note_id} here


app.include_router(router)
`,
      tests: [
        { name: 'DELETE answers 204 with an empty body', code: `r = await Client(app).delete("/notes/1")
eq(r.status_code, 204)
eq(r.text, "")` },
        { name: 'the note is gone from the store', code: `await Client(app).delete("/notes/1")
eq(list(notes), [2])` },
        { name: 'deleting a missing note is 404', code: `r = await Client(app).delete("/notes/9")
eq(r.status_code, 404)
eq(r.json(), {"detail": "Note not found"})` },
      ],
      hint: 'Same as `delete_tag` in the reading, with `@router.delete("/{note_id}", status_code=204)`.',
      solution: `from fastapi import APIRouter, FastAPI, HTTPException

app = FastAPI()
router = APIRouter(prefix="/notes")

notes = {
    1: {"id": 1, "title": "buy milk", "done": False},
    2: {"id": 2, "title": "call mom", "done": True},
}


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int):
    if note_id not in notes:
        raise HTTPException(status_code=404, detail="Note not found")
    del notes[note_id]


app.include_router(router)
`,
    },
    {
      type: 'read',
      title: 'PUT replaces, PATCH merges',
      md: `
Two ways to update:

- **PUT** sends the **whole** resource. Fields you leave out go back to their defaults. Use the same \`NoteIn\` model as create.
- **PATCH** sends **only the fields that change**. Its model makes every field optional:

~~~
class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    done: bool | None = None
~~~

For PATCH you need to know which fields the client actually **sent**. \`model_dump(exclude_unset=True)\` gives exactly those:

~~~py
from pydantic import BaseModel

class NoteUpdate(BaseModel):
    title: str | None = None
    done: bool | None = None

patch = NoteUpdate(done=True)
print(patch.model_dump())
print(patch.model_dump(exclude_unset=True))

stored = {"id": 1, "title": "buy milk", "done": False}
print({**stored, **patch.model_dump(exclude_unset=True)})
~~~

The last line is lesson 12's dict merge: later keys win, so only \`done\` changes. Without \`exclude_unset\`, the \`None\` for \`title\` would wipe out the real title.
`,
    },
    {
      type: 'predict',
      title: 'Sent as null vs not sent',
      code: `from pydantic import BaseModel

class NoteUpdate(BaseModel):
    title: str | None = None
    done: bool | None = None

a = NoteUpdate()
b = NoteUpdate(title=None)
print(a.model_dump(exclude_unset=True))
print(b.model_dump(exclude_unset=True))`,
      output: `{}
{'title': None}`,
      explain: '`exclude_unset` tracks whether a field was **given**, not whether it\'s `None`. In `b` the client explicitly sent `title: null`, so it counts as set. That difference matters: "leave the title alone" and "clear the title" are different requests. (Here, a `min_length=1` rule on the real model would reject `null` for title anyway.)',
    },
    {
      type: 'task',
      title: 'Update: PATCH /notes/{note_id}',
      md: `
\`NoteUpdate\` is given. Add \`PATCH /notes/{note_id}\` that merges only the sent fields into the stored note, saves it, and returns it. A missing note is **404** \`{"detail": "Note not found"}\`.

- PATCH \`/notes/1\` with \`{"done": true}\` returns \`{"id": 1, "title": "buy milk", "done": True}\`
`,
      starter: `from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()
router = APIRouter(prefix="/notes")


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    done: bool | None = None


notes = {1: {"id": 1, "title": "buy milk", "done": False}}

# add PATCH /notes/{note_id} here


app.include_router(router)
`,
      tests: [
        { name: 'PATCH changes only done', code: `r = await Client(app).patch("/notes/1", json={"done": True})
eq(r.status_code, 200)
eq(r.json(), {"id": 1, "title": "buy milk", "done": True})` },
        { name: 'PATCH changes only the title', code: `r = await Client(app).patch("/notes/1", json={"title": "buy oat milk"})
eq(r.json(), {"id": 1, "title": "buy oat milk", "done": False})` },
        { name: 'the change is saved in the store', code: `await Client(app).patch("/notes/1", json={"done": True})
eq(notes[1]["done"], True)` },
        { name: 'a missing note is 404', code: `eq((await Client(app).patch("/notes/9", json={"done": True})).status_code, 404)` },
      ],
      hint: 'After the 404 check: `updated = {**notes[note_id], **changes.model_dump(exclude_unset=True)}`, then `notes[note_id] = updated` and return it.',
      solution: `from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()
router = APIRouter(prefix="/notes")


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    done: bool | None = None


notes = {1: {"id": 1, "title": "buy milk", "done": False}}


@router.patch("/{note_id}")
def update_note(note_id: int, changes: NoteUpdate):
    if note_id not in notes:
        raise HTTPException(status_code=404, detail="Note not found")
    updated = {**notes[note_id], **changes.model_dump(exclude_unset=True)}
    notes[note_id] = updated
    return updated


app.include_router(router)
`,
    },
    {
      type: 'task',
      title: 'Filter the list: GET /notes?done=',
      md: `
Last piece, combining lesson 17's optional query parameters with the list route. Add \`GET /notes\` with an optional query parameter \`done\` (a \`bool | None\`, default \`None\`):

- \`/notes\` returns every note
- \`/notes?done=true\` returns only notes where \`done\` is \`True\`
- \`/notes?done=false\` returns only notes where \`done\` is \`False\`
`,
      starter: `from fastapi import APIRouter, FastAPI

app = FastAPI()
router = APIRouter(prefix="/notes")

notes = {
    1: {"id": 1, "title": "buy milk", "done": False},
    2: {"id": 2, "title": "call mom", "done": True},
    3: {"id": 3, "title": "pay rent", "done": True},
}


@router.get("")
def list_notes():
    return list(notes.values())


app.include_router(router)
`,
      tests: [
        { name: 'no filter returns all three', code: `eq([n["id"] for n in (await Client(app).get("/notes")).json()], [1, 2, 3])` },
        { name: 'done=true keeps the finished ones', code: `eq([n["id"] for n in (await Client(app).get("/notes?done=true")).json()], [2, 3])` },
        { name: 'done=false keeps the open one', code: `eq([n["id"] for n in (await Client(app).get("/notes?done=false")).json()], [1])` },
      ],
      hint: 'Add `done: bool | None = None` as a parameter. If `done is None`, return everything; otherwise filter with `[n for n in notes.values() if n["done"] == done]`. Use `is None`, not `if not done`, or `done=false` would look like "no filter".',
      solution: `from fastapi import APIRouter, FastAPI

app = FastAPI()
router = APIRouter(prefix="/notes")

notes = {
    1: {"id": 1, "title": "buy milk", "done": False},
    2: {"id": 2, "title": "call mom", "done": True},
    3: {"id": 3, "title": "pay rent", "done": True},
}


@router.get("")
def list_notes(done: bool | None = None):
    if done is None:
        return list(notes.values())
    return [n for n in notes.values() if n["done"] == done]


app.include_router(router)
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'What status should a successful DELETE with no response body use?',
          choices: ['204 No Content', '200 OK with `null`', '201 Created', '404 Not Found'],
          answer: 0,
          explain: '204 says it worked and the body is intentionally empty.',
          why: { 1: 'It works, but 204 states the intent and avoids a pointless body.', 2: '201 is for creating something.', 3: '404 is for an id that does not exist.' },
        },
        {
          q: 'A client PATCHes `{"done": true}`. Why use `model_dump(exclude_unset=True)`?',
          choices: ['So fields the client did not send are left alone instead of being overwritten with None', 'To remove the id', 'To validate the body', 'To turn the response into JSON'],
          answer: 0,
          explain: 'It keeps only the fields actually present in the request.',
          why: { 1: 'The id is not in the update model at all.', 2: 'Validation already happened when FastAPI built the model.', 3: 'FastAPI turns the return value into JSON on its own.' },
        },
        {
          q: 'What is the difference between PUT and PATCH?',
          choices: ['PUT replaces the whole resource; PATCH changes only the fields sent', 'PUT creates; PATCH deletes', 'They are the same', 'PATCH replaces; PUT merges'],
          answer: 0,
          explain: 'With PUT, a missing field resets to its default. With PATCH, a missing field stays as it was.',
          why: { 1: 'Creating is POST and deleting is DELETE.', 2: 'They differ in what happens to fields you leave out.', 3: 'That is backwards.' },
        },
        {
          q: 'You add a route to a router after calling `app.include_router(router)`. What happens?',
          choices: ['The app never sees the route, so requests to it get 404', 'It works normally', 'Python raises an error when you add it', 'It replaces the earlier routes'],
          answer: 0,
          explain: '`include_router` copies the routes that exist at that moment.',
          why: { 1: 'Routes added later are not copied over.', 2: 'Nothing complains, which is why this bug is easy to miss.', 3: 'It is simply never added to the app.' },
        },
      ],
    },
  ],
};
