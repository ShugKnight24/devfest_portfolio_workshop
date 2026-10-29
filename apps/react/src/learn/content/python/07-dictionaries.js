// Python course · lesson 7. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~py get a Run button, so they must run cleanly).
export default {
  id: 'dictionaries',
  builds: ['python/loops', 'js/objects'],
  title: 'Dictionaries',
  goal: 'Store named values in a dict, read them safely, copy before you change, and understand why two names can share one dict.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'The problem dictionaries solve',
      md: `
Say you want to describe one user. With separate variables it gets messy fast:

~~~
user_name = "Ada"
user_age = 36
user_email = "ada@example.com"
~~~

Nothing ties those three together, and you can't pass "the user" to a function as one thing.

A **dictionary** (a **dict**) groups named values into one value, inside curly braces:

~~~py
user = {"name": "Ada", "age": 36, "email": "ada@example.com"}
print(user)
~~~

Picture a set of **labeled boxes**. Each box has a **key** (the label, usually a string) and a **value** (what's inside):

| key | value |
|---|---|
| \`"name"\` | \`"Ada"\` |
| \`"age"\` | \`36\` |
| \`"email"\` | \`"ada@example.com"\` |

A list finds things by **position** (\`names[0]\`). A dict finds things by **name** (\`user["age"]\`).
`,
    },
    {
      type: 'predict',
      title: 'Reading a box',
      code: `user = {"name": "Ada", "age": 36}

print(user["name"])
print(user["age"] + 1)`,
      output: `Ada
37`,
      explain: '`user["name"]` opens the box labeled `"name"`. The value is a normal value: the age is a number, so `+ 1` works on it.',
    },
    {
      type: 'task',
      title: 'get_name',
      md: `
**Example** (already solved):

~~~
def get_age(user):
    return user["age"]
~~~

**Your turn:** \`get_name({"name": "Ada", "age": 36})\` returns \`"Ada"\`.
`,
      starter: `def get_name(user):
    pass  # your code here
`,
      tests: [{ name: 'get_name returns the name', code: `eq(get_name({"name": "Ada", "age": 36}), "Ada")` }],
      hint: 'Same as `get_age`, with the key `"name"`.',
      solution: `def get_name(user):
    return user["name"]
`,
    },
    {
      type: 'read',
      title: 'Building and changing dicts',
      md: `
You build a dict with \`{key: value, ...}\`, and you add or change a box by assigning to it:

~~~py
point = {"x": 3, "y": 4}

point["x"] = 10        # change an existing box
point["z"] = 0         # a new key creates a new box
print(point)

print(len(point))      # how many keys
~~~

Keys are unique: assigning to an existing key **replaces** its value, it never makes a second box.

The values can be anything, including lists and other dicts:

~~~py
user = {"name": "Ada", "tags": ["admin", "math"], "address": {"city": "London"}}
print(user["tags"][0])
print(user["address"]["city"])
~~~

Chained brackets read left to right: first open \`"address"\`, then open \`"city"\` inside it.
`,
    },
    {
      type: 'task',
      title: 'make_user',
      md: `
**Example:**

~~~
def make_point(x, y):
    return {"x": x, "y": y}
~~~

**Your turn:** \`make_user("Ada", 36)\` returns \`{"name": "Ada", "age": 36}\`.
`,
      starter: `def make_user(name, age):
    pass  # your code here
`,
      tests: [{ name: 'make_user("Ada", 36)', code: `eq(make_user("Ada", 36), {"name": "Ada", "age": 36})` }],
      hint: 'Same shape as `make_point`: the keys are strings in quotes (`"name"`, `"age"`), the values are the parameters.',
      solution: `def make_user(name, age):
    return {"name": name, "age": age}  # key in quotes, value is the variable
`,
    },
    {
      type: 'predict', throws: true,
      title: 'A key that is not there',
      md: 'The dict has no `"email"` box.',
      code: `user = {"name": "Ada"}
print(user["name"])
print(user["email"])`,
      output: `Ada
! KeyError: 'email' (line 3)`,
      explain: `
Square brackets **demand** the key. If it's missing, Python stops with \`KeyError\` and tells you which key.

That's often what you want (a missing key is a bug you want to hear about). When a key is **optional**, use \`.get\` instead, coming up next.
`,
    },
    {
      type: 'read',
      title: '.get: read with a fallback',
      md: `
\`d.get(key, default)\` returns the value if the key is there, and \`default\` if it isn't. It never raises:

~~~py
user = {"name": "Ada", "score": 0}

print(user.get("name", "anonymous"))
print(user.get("email", "no email"))
print(user.get("email"))          # no default given: None
print(user.get("score", 100))     # the key exists, so you get 0
~~~

That last line matters: \`.get\` only uses the fallback when the key is **missing**. A real \`0\`, \`""\` or \`False\` stored in the dict comes back as-is.

Rule of thumb:

- \`d["key"]\` when the key **must** be there.
- \`d.get("key", default)\` when it's **optional**.
`,
    },
    {
      type: 'task',
      title: 'get_or',
      md: `
**Example:**

~~~
def age_or_zero(user):
    return user.get("age", 0)
~~~

**Your turn:** \`get_or({"a": 1}, "a", 0)\` returns \`1\`, and \`get_or({"a": 1}, "z", 0)\` returns \`0\`. A stored \`0\` must stay \`0\`: \`get_or({"a": 0}, "a", 5)\` is \`0\`.
`,
      starter: `def get_or(d, key, fallback):
    pass  # your code here
`,
      tests: [
        { name: 'returns the value when the key exists', code: `eq(get_or({"a": 1}, "a", 0), 1)` },
        { name: 'returns the fallback when the key is missing', code: `eq(get_or({"a": 1}, "z", 0), 0)` },
        { name: 'keeps a real 0', code: `eq(get_or({"a": 0}, "a", 5), 0)` },
      ],
      hint: 'Like `age_or_zero`, but the key and the fallback come from the parameters: `d.get(key, fallback)`.',
      solution: `def get_or(d, key, fallback):
    return d.get(key, fallback)  # fallback only when the key is missing
`,
    },
    {
      type: 'task',
      title: 'get_field',
      md: `
So far the key was written in quotes. Often the key is in a **variable** instead. Then you put the variable in the brackets, **without** quotes:

~~~
key = "age"
user[key]     # opens the box named by whatever key holds: "age"
user["key"]   # looks for a box literally named "key"
~~~

**Your turn:** \`get_field({"a": 1, "b": 2}, "b")\` returns \`2\`.
`,
      starter: `def get_field(d, key):
    pass  # your code here
`,
      tests: [
        { name: 'get_field(..., "b") is 2', code: `eq(get_field({"a": 1, "b": 2}, "b"), 2)` },
        { name: 'get_field(..., "a") is 1', code: `eq(get_field({"a": 1, "b": 2}, "a"), 1)` },
      ],
      hint: '`d[key]` with no quotes around `key`, so Python uses the variable\'s value.',
      solution: `def get_field(d, key):
    return d[key]  # no quotes: use the value stored in key
`,
    },
    {
      type: 'read',
      title: 'The big one: names point at dicts, they do not hold copies',
      md: `
This is the most important idea in this lesson.

A variable doesn't **contain** a dict. It **points at** one. Think of the dict as a house, and the variable as a piece of paper with the house's address on it.

~~~
a = {"x": 0}    # build a house, write its address on paper "a"
b = a           # copy the ADDRESS onto paper "b"
~~~

There is still **one** house. \`a\` and \`b\` are two papers with the same address. Whatever you change through \`b\` is changed in the house that \`a\` points at too.

| Line | What exists | \`a\` | \`b\` |
|---|---|---|---|
| \`a = {"x": 0}\` | one dict \`{"x": 0}\` | points at it | |
| \`b = a\` | still one dict | points at it | points at the **same** one |
| \`b["x"] = 1\` | one dict, now \`{"x": 1}\` | sees \`1\` | sees \`1\` |

Lists work exactly the same way (you saw a preview in lesson 5). Numbers and strings can't be changed in place, so you never notice it with them.
`,
    },
    {
      type: 'predict',
      title: 'Two names, one dict',
      code: `a = {"x": 0}
b = a
b["x"] = 1
print(a)
print(a is b)`,
      output: `{'x': 1}
True`,
      explain: `
\`b = a\` did not copy anything. \`a is b\` is \`True\`: both names point at the very same dict, so changing it through \`b\` shows up through \`a\`.

This also happens with function parameters: a function that changes a dict it was given changes the **caller's** dict.
`,
    },
    {
      type: 'predict',
      title: 'Functions get the same dict, too',
      code: `def birthday(user):
    user["age"] += 1
    return user

ada = {"name": "Ada", "age": 36}
older = birthday(ada)
print(ada["age"])
print(older is ada)`,
      output: `37
True`,
      explain: `
The parameter \`user\` is just another name for the caller's dict. \`birthday\` changed Ada for **everyone**, and \`older\` is the same dict, not a new one.

Sometimes that's intended. Often it's a surprise bug: "I only wanted the new version, why did the original change?" The fix is to copy first.
`,
    },
    {
      type: 'read',
      title: 'Making a real copy',
      md: `
Three ways to make a **new** dict with the same keys and values:

~~~py
user = {"name": "Ada"}

c1 = dict(user)
c2 = user.copy()
c3 = {**user}                       # ** unpacks the keys and values into a new dict

c1["name"] = "Changed"
print(user["name"])
print(c1 is user)
~~~

\`{**user, "email": "a@x.com"}\` copies **and** adds or overrides a key in one step. Later keys win:

~~~py
user = {"name": "Ada", "age": 36}
print({**user, "age": 37})
print(user)
~~~

The pattern "copy, then change the copy" keeps the caller's data safe. It's how you update state in React and how you avoid surprise bugs in data pipelines.
`,
    },
    {
      type: 'task',
      title: 'with_email',
      md: `
**Example:** copy first, then change the copy, so the caller's dict stays the same.

~~~
def with_city(user, city):
    copy = dict(user)
    copy["city"] = city
    return copy
~~~

**Your turn:** \`with_email({"name": "Ada"}, "a@x.com")\` returns \`{"name": "Ada", "email": "a@x.com"}\`, and the dict passed in must **not** change.
`,
      starter: `def with_email(user, email):
    pass  # your code here
`,
      tests: [
        { name: 'adds the email', code: `eq(with_email({"name": "Ada"}, "a@x.com"), {"name": "Ada", "email": "a@x.com"})` },
        {
          name: 'the original dict does not change',
          code: `original = {"name": "Ada"}
with_email(original, "a@x.com")
eq(original, {"name": "Ada"}, "the dict passed in changed: copy it first")`,
        },
        {
          name: 'returns a new dict',
          code: `original = {"name": "Ada"}
assert with_email(original, "a@x.com") is not original, "you returned the same dict: make a copy"`,
        },
      ],
      hint: 'Mirror `with_city`: `copy = dict(user)`, set `copy["email"] = email`, return `copy`. (Or in one line: `return {**user, "email": email}`.)',
      solution: `def with_email(user, email):
    copy = dict(user)  # a new dict, so the caller's one is untouched
    copy["email"] = email
    return copy
`,
    },
    {
      type: 'predict',
      title: 'A copy is shallow',
      md: '`dict(user)` copies the top level. What about the list inside?',
      code: `user = {"name": "Ada", "tags": ["admin"]}
copy = dict(user)

copy["name"] = "Grace"
copy["tags"].append("math")

print(user["name"])
print(user["tags"])`,
      output: `Ada
['admin', 'math']`,
      explain: `
The copy got its **own** \`"name"\` box, so changing the name didn't touch \`user\`.

But the \`"tags"\` box holds a **pointer** to a list, and copying the dict copied the pointer, not the list. Both dicts point at the **same** list, so \`append\` shows up in both. That's what **shallow** means: only one level is copied.

To change a nested list safely, copy that level too:

~~~
copy = {**user, "tags": user["tags"] + ["math"]}
~~~
`,
    },
    {
      type: 'read',
      title: 'Asking questions: in, keys, values, items',
      md: `
\`in\` checks the **keys** (not the values):

~~~py
user = {"name": "Ada", "age": 36}
print("name" in user)
print("Ada" in user)
~~~

Three views let you see everything inside:

~~~py
user = {"name": "Ada", "age": 36}
print(list(user.keys()))
print(list(user.values()))
print(list(user.items()))
~~~

\`list(...)\` turns each view into a normal list. Dicts keep keys in the order you added them.

Looping over a dict gives you its keys. To get key **and** value together, loop over \`.items()\` and unpack each pair:

~~~py
prices = {"tea": 3, "cake": 5}
for name, price in prices.items():
    print(name, "costs", price)
~~~
`,
    },
    {
      type: 'task',
      title: 'has_key',
      md: `
**Example:**

~~~
def has_name(d):
    return "name" in d
~~~

**Your turn:** \`has_key({"a": 1}, "a")\` returns \`True\`, \`has_key({"a": 1}, "z")\` returns \`False\`. A key whose value is \`0\` still counts as present.
`,
      starter: `def has_key(d, key):
    pass  # your code here
`,
      tests: [
        { name: 'has_key({"a": 1}, "a") is True', code: `eq(has_key({"a": 1}, "a"), True)` },
        { name: 'has_key({"a": 1}, "z") is False', code: `eq(has_key({"a": 1}, "z"), False)` },
        { name: 'a key with value 0 is still there', code: `eq(has_key({"a": 0}, "a"), True)` },
      ],
      hint: 'Same as `has_name`, with `key` (the variable, no quotes) instead of `"name"`.',
      solution: `def has_key(d, key):
    return key in d  # checks keys, regardless of what the value is
`,
      explain: 'Writing `if d.get(key):` instead would be a bug: it treats a stored `0`, `""` or `False` as "missing".',
    },
    {
      type: 'task',
      title: 'keys_of',
      md: `
**Example:**

~~~
def values_of(d):
    return list(d.values())
~~~

**Your turn:** \`keys_of({"a": 1, "b": 2})\` returns \`["a", "b"]\` as a real list.
`,
      starter: `def keys_of(d):
    pass  # your code here
`,
      tests: [{ name: 'keys_of({"a": 1, "b": 2}) is ["a", "b"]', code: `eq(keys_of({"a": 1, "b": 2}), ["a", "b"])` }],
      hint: 'Same as `values_of`, with `.keys()`. Wrap it in `list(...)` so it compares equal to a list.',
      solution: `def keys_of(d):
    return list(d.keys())  # .keys() is a view; list() makes a plain list
`,
    },
    {
      type: 'predict',
      title: 'Looping over items',
      code: `stock = {"apples": 3, "pears": 0, "plums": 7}
for fruit, count in stock.items():
    if count == 0:
        print(fruit, "sold out")
    else:
        print(fruit, count)`,
      output: `apples 3
pears sold out
plums 7`,
      explain: '`.items()` gives `(key, value)` pairs in insertion order, and `fruit, count` unpacks each one. This loop shape is the dict version of `for x in list`.',
    },
    {
      type: 'read',
      title: 'Aside: dicts and JSON',
      md: `
Almost every API speaks **JSON**, and JSON objects look just like Python dicts. The \`json\` module converts between the two:

~~~py
import json

user = {"name": "Ada", "admin": True, "manager": None}
text = json.dumps(user)       # dict -> JSON text (to send)
print(text)

back = json.loads(text)       # JSON text -> dict (when you receive)
print(back["name"])
~~~

Notice the small differences in the text: JSON writes \`true\`/\`false\`/\`null\` where Python has \`True\`/\`False\`/\`None\`, and always uses double quotes. FastAPI does this conversion for you: you return a dict, and the browser receives JSON.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer. A wrong pick tells you why.',
      items: [
        {
          q: '`user = {"name": "Ada"}`. What does `user["email"]` do?',
          choices: ['Returns `None`', 'Returns `""`', 'Raises `KeyError`', 'Adds an empty `"email"` key'],
          answer: 2,
          explain: 'Square brackets demand the key. For an optional key, use `user.get("email")`, which returns `None`.',
          why: ['That is what `user.get("email")` does, not the brackets.', 'Python never invents a value for a missing key.', '', 'Reading never creates a key; only assigning does.'],
        },
        {
          q: 'After `a = {"x": 0}`, `b = a`, `b["x"] = 1`, what is `a["x"]`?',
          choices: ['`0`', '`1`', '`KeyError`'],
          answer: 1,
          explain: '`b = a` copies the pointer, not the dict. There is one dict with two names.',
          why: ['That would need a real copy, like `b = dict(a)`.', '', 'The key `"x"` exists in the one shared dict.'],
        },
        {
          q: 'Which one makes a new dict and leaves `user` unchanged?',
          choices: ['`new = user`', '`new = {**user, "age": 37}`', '`user["age"] = 37`', '`new = user.update({"age": 37})`'],
          answer: 1,
          explain: '`{**user, ...}` builds a new dict from `user`\'s keys, then applies the override.',
          why: ['That is just a second name for the same dict.', '', 'That changes `user` in place.', '`.update` changes `user` in place and returns `None`, so `new` would be `None`.'],
        },
        {
          q: '`copy = dict(user)`, then `copy["tags"].append("x")`. Does `user["tags"]` change?',
          choices: ['No, `copy` is a separate dict', 'Yes, the copy is shallow so both share the tags list', 'It raises an error'],
          answer: 1,
          explain: 'Only the top level is copied. The `"tags"` value is a pointer to the same list.',
          why: ['The dicts are separate, but the list inside them is shared.', '', 'Appending to a shared list is allowed; it just affects both.'],
        },
        {
          q: '`d = {"count": 0}`. Which check correctly says the key is present?',
          choices: ['`if d.get("count"):`', '`if "count" in d:`', '`if d["count"]:`', '`if 0 in d:`'],
          answer: 1,
          explain: '`in` checks the keys, regardless of the stored value.',
          why: ['`d.get("count")` is `0`, which is falsy, so the `if` says "missing".', '', '`d["count"]` is `0`, which is falsy.', '`in` checks keys; `0` is a value here, not a key.'],
        },
        {
          q: 'How do you loop over both keys and values?',
          choices: ['`for k, v in d:`', '`for k, v in d.items():`', '`for k in d.values():`', '`for k, v in d.keys():`'],
          answer: 1,
          explain: '`.items()` yields `(key, value)` pairs, and `k, v` unpacks each pair.',
          why: ['Looping over a dict gives only keys, so unpacking into two names fails.', '', 'That gives only the values.', '`.keys()` gives only keys.'],
        },
      ],
    },
  ],
};
