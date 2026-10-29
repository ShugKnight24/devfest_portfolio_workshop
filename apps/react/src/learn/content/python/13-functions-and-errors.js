// Python course · lesson 13. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'functions-and-errors',
  builds: ['python/unpacking-and-copying', 'python/functions', 'js/spread-and-destructuring', 'js/errors-and-maps-sets'],
  title: 'Functions deeper, and errors',
  goal: 'Accept any number of arguments with *args and **kwargs, avoid the mutable default trap, and raise and catch exceptions.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: '*args: any number of arguments',
      md: `
In lesson 12 you wrote \`first, *rest = items\`: the star collected "everything left over". The same star works in a \`def\` line. A parameter written \`*args\` collects **all the extra positional arguments** into a tuple:

~~~py
def shout_all(*words):
    print(words)
    for w in words:
        print(w.upper())

shout_all("hi", "there")
shout_all()
~~~

This is JavaScript's rest parameter, \`function f(...words)\`, with one difference: in Python it's a **tuple**, not a list.

The name \`args\` is only a convention. What matters is the \`*\`.
`,
    },
    {
      type: 'predict',
      title: 'What does args hold?',
      code: `def show(first, *rest):
    print(first)
    print(rest)

show(1, 2, 3)
show("only")`,
      output: `1
(2, 3)
only
()`,
      explain: 'Normal parameters are filled first, by position. Whatever is left goes into the starred one. With nothing left, `rest` is an empty tuple `()`, not `None`, so you can always loop over it safely.',
    },
    {
      type: 'task',
      title: 'total',
      md: `
**Example:**

~~~
def longest(*words):
    return max(words, key=len, default="")
~~~

**Your turn:** write \`total(*nums)\` that adds up all its arguments. \`total(1, 2, 3)\` returns \`6\`, and \`total()\` returns \`0\`.
`,
      starter: `def total(*nums):
    pass  # your code here
`,
      tests: [
        { name: 'total(1, 2, 3) returns 6', code: `eq(total(1, 2, 3), 6)` },
        { name: 'total(10) returns 10', code: `eq(total(10), 10)` },
        { name: 'total() with no arguments returns 0', code: `eq(total(), 0)` },
      ],
      hint: '`nums` is a tuple, and `sum()` (lesson 11) works on any tuple, including an empty one.',
      solution: `def total(*nums):
    return sum(nums)
`,
    },
    {
      type: 'read',
      title: '**kwargs: any number of named arguments',
      md: `
Two stars collect the extra **keyword** arguments (the \`name=value\` ones) into a **dict**:

~~~py
def make_tag(name, **attrs):
    print(name, attrs)
    parts = [f'{key}="{value}"' for key, value in attrs.items()]
    return f"<{name} " + " ".join(parts) + ">"

print(make_tag("img", src="cat.png", alt="a cat"))
~~~

In JavaScript you'd pass an options object: \`makeTag("img", { src: "cat.png" })\`. Python lets the caller write the options as plain named arguments, and \`**attrs\` gathers them up.

The stars also work the other way, when **calling**. \`*\` spreads a list into positional arguments and \`**\` spreads a dict into named ones, like JavaScript's \`...\`:

~~~py
def point(x, y):
    return f"({x}, {y})"

print(point(*[3, 4]))
print(point(**{"x": 5, "y": 6}))
~~~
`,
    },
    {
      type: 'task',
      title: 'build_url',
      md: `
Write \`build_url(base, **params)\`. With no params it returns \`base\` unchanged. Otherwise it adds \`?\` and the params as \`key=value\`, **sorted by key**, joined with \`&\`.

- \`build_url("/search")\` returns \`"/search"\`
- \`build_url("/search", q="cat", page=2)\` returns \`"/search?page=2&q=cat"\`

\`sorted(params.items())\` gives you the \`(key, value)\` pairs in key order.
`,
      starter: `def build_url(base, **params):
    pass  # your code here
`,
      tests: [
        { name: 'no params gives the base unchanged', code: `eq(build_url("/search"), "/search")` },
        { name: 'one param', code: `eq(build_url("/search", q="cat"), "/search?q=cat")` },
        { name: 'params are sorted by key', code: `eq(build_url("/search", q="cat", page=2), "/search?page=2&q=cat")` },
      ],
      hint: 'First `if not params: return base`. Then build a list like `[f"{k}={v}" for k, v in sorted(params.items())]` and join it with `"&"`.',
      solution: `def build_url(base, **params):
    if not params:
        return base
    pairs = [f"{k}={v}" for k, v in sorted(params.items())]
    return base + "?" + "&".join(pairs)
`,
    },
    {
      type: 'read',
      title: 'The mutable default trap',
      md: `
Lesson 2 showed default values: \`def greet(name="friend")\`. Here's the catch. A default value is created **once**, when Python reads the \`def\` line, not each time the function is called.

For a string or a number that never matters, because you can't change them in place. For a **list** or **dict** it matters a lot: every call that uses the default shares the **same** list.

The fix is a pattern you'll see in almost every Python codebase. Default to \`None\`, and make a fresh list inside:

~~~py
def add_item(item, items=None):
    if items is None:
        items = []          # a new list on every call
    items.append(item)
    return items

print(add_item("a"))
print(add_item("b"))
~~~

Remember \`is None\` from lesson 3: \`None\` is the one value you compare with \`is\`.
`,
    },
    {
      type: 'predict',
      title: 'The shared list',
      md: 'This version uses a list as the default. What do the two calls print?',
      code: `def add_item(item, items=[]):
    items.append(item)
    return items

print(add_item("a"))
print(add_item("b"))`,
      output: `['a']
['a', 'b']`,
      explain: `
Most people expect \`['b']\` on the second line. But \`items=[]\` built **one** list when the function was defined, and both calls appended to that same list. It keeps growing for the life of the program.

This is the same idea as lesson 12's copying section: two names, one list. Linters flag it, and so do interviewers.
`,
    },
    {
      type: 'task',
      title: 'Fix add_tag',
      md: `
\`add_tag\` has the shared-list bug. Fix it with the \`None\` pattern so each call without a \`tags\` argument starts from an empty list.

- \`add_tag("x")\` returns \`["x"]\`, and calling \`add_tag("y")\` afterwards returns \`["y"]\`
- \`add_tag("z", ["a"])\` still returns \`["a", "z"]\`
`,
      starter: `def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags
`,
      tests: [
        { name: 'two calls do not share a list', code: `add_tag("x")
eq(add_tag("y"), ["y"])` },
        { name: 'a passed-in list is still used', code: `eq(add_tag("z", ["a"]), ["a", "z"])` },
      ],
      hint: 'Change the default to `tags=None`, then the first line of the body is `if tags is None: tags = []`.',
      solution: `def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags
`,
    },
    {
      type: 'read',
      title: 'raise: signal that something is wrong',
      md: `
When a function gets input it can't handle, don't return a strange value like \`-1\` and hope the caller notices. **Raise an exception**. It stops the function immediately, like JavaScript's \`throw\`:

~~~py
def check_age(age):
    if age < 0 or age > 150:
        raise ValueError("age must be between 0 and 150")
    return age

print(check_age(36))
~~~

\`ValueError\` is a built-in exception class meaning "right type, bad value". The ones you'll use most:

| Exception | Means |
|---|---|
| \`ValueError\` | the value is wrong (\`int("abc")\`, an age of -5) |
| \`TypeError\` | the type is wrong (\`"a" + 1\`) |
| \`KeyError\` | a dict has no such key |
| \`IndexError\` | a list has no such index |

Python raises these itself, too. \`int("abc")\` raises a \`ValueError\` for you.
`,
    },
    {
      type: 'task',
      title: 'check_age',
      md: `
Write \`check_age(age)\`. If \`age\` is below 0 or above 150, raise \`ValueError("age must be between 0 and 150")\`. Otherwise return \`age\`.

- \`check_age(36)\` returns \`36\`
- \`check_age(-1)\` raises \`ValueError\` with that exact message
`,
      starter: `def check_age(age):
    pass  # your code here
`,
      tests: [
        { name: 'a normal age comes back unchanged', code: `eq(check_age(36), 36)` },
        { name: 'the edges 0 and 150 are allowed', code: `eq(check_age(0), 0); eq(check_age(150), 150)` },
        { name: '-1 raises ValueError with the message', code: `try:
    check_age(-1)
    raise AssertionError("expected a ValueError, but nothing was raised")
except ValueError as e:
    eq(str(e), "age must be between 0 and 150")` },
        { name: '151 raises ValueError', code: `try:
    check_age(151)
    raise AssertionError("expected a ValueError, but nothing was raised")
except ValueError:
    pass` },
      ],
      hint: '`if age < 0 or age > 150:` then `raise ValueError("...")` indented under it. After the `if`, `return age`.',
      solution: `def check_age(age):
    if age < 0 or age > 150:
        raise ValueError("age must be between 0 and 150")
    return age
`,
    },
    {
      type: 'read',
      title: 'try / except: catch it',
      md: `
\`try\` / \`except\` is JavaScript's \`try\` / \`catch\`, with one big improvement: you say **which** exception types you catch.

~~~py
def to_number(text):
    try:
        n = int(text)
    except ValueError as e:
        print("could not parse:", e)
        return None
    else:
        print("parsed fine")      # runs only if the try block raised nothing
        return n
    finally:
        print("finished", repr(text))   # runs no matter what

print(to_number("42"))
print(to_number("abc"))
~~~

- \`except ValueError as e\` catches only \`ValueError\`. A \`KeyError\` would fly straight past it, which is what you want: you only catch what you know how to handle.
- \`else\` runs when nothing was raised. \`finally\` always runs, even after a \`return\`, so it's where cleanup goes (closing a file or a database connection).

A bare \`except:\` with no type catches **everything**, including your own typos. Avoid it.
`,
    },
    {
      type: 'predict',
      title: 'Which lines run?',
      code: `try:
    print("start")
    n = int("4.5")
    print("got", n)
except ValueError:
    print("bad number")
finally:
    print("done")`,
      output: `start
bad number
done`,
      explain: '`int("4.5")` raises a `ValueError` (int() only accepts whole-number text), so Python jumps straight to `except` and never prints "got". `finally` runs either way. A common wrong guess is `got 4`: `int(4.5)` with a float rounds toward zero, but `int("4.5")` with a string refuses.',
    },
    {
      type: 'task',
      title: 'safe_int',
      md: `
Write \`safe_int(text, default=0)\`. Try \`int(text)\`. If that raises \`ValueError\`, return \`default\` instead.

- \`safe_int("42")\` returns \`42\`
- \`safe_int("abc")\` returns \`0\`
- \`safe_int("abc", -1)\` returns \`-1\`
`,
      starter: `def safe_int(text, default=0):
    return int(text)
`,
      tests: [
        { name: '"42" becomes 42', code: `eq(safe_int("42"), 42)` },
        { name: '"abc" gives the default 0', code: `eq(safe_int("abc"), 0)` },
        { name: 'a custom default is used', code: `eq(safe_int("abc", -1), -1)` },
      ],
      hint: 'Wrap the `return int(text)` in `try:`, then add `except ValueError:` with `return default`.',
      solution: `def safe_int(text, default=0):
    try:
        return int(text)
    except ValueError:
        return default
`,
    },
    {
      type: 'task',
      title: 'parse_age: raise and catch together',
      md: `
Combine both halves. Write \`parse_age(text)\`:

- If \`int(text)\` fails, raise \`ValueError("age must be a whole number")\`.
- If the number is below 0 or above 150, raise \`ValueError("age must be between 0 and 150")\`.
- Otherwise return the number.

So \`parse_age("36")\` returns \`36\`, \`parse_age("abc")\` raises with the first message, and \`parse_age("200")\` raises with the second.

This "catch a low-level error, raise a clearer one" move is exactly what a web API does before it answers **422**, which you'll meet in lesson 17.
`,
      starter: `def parse_age(text):
    pass  # your code here
`,
      tests: [
        { name: '"36" returns 36', code: `eq(parse_age("36"), 36)` },
        { name: '"abc" raises "age must be a whole number"', code: `try:
    parse_age("abc")
    raise AssertionError("expected a ValueError, but nothing was raised")
except ValueError as e:
    eq(str(e), "age must be a whole number")` },
        { name: '"200" raises "age must be between 0 and 150"', code: `try:
    parse_age("200")
    raise AssertionError("expected a ValueError, but nothing was raised")
except ValueError as e:
    eq(str(e), "age must be between 0 and 150")` },
      ],
      hint: 'Put only `age = int(text)` inside `try`, with `except ValueError: raise ValueError("age must be a whole number")`. Then do the range check from `check_age` after the try block.',
      solution: `def parse_age(text):
    try:
        age = int(text)
    except ValueError:
        raise ValueError("age must be a whole number")
    if age < 0 or age > 150:
        raise ValueError("age must be between 0 and 150")
    return age
`,
      explain: 'Keep the `try` block small. If the range check were inside it, its own `ValueError` would be caught by your `except` and turned into the wrong message.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'Inside `def f(*args)`, what is `args` when you call `f(1, 2)`?',
          choices: ['The tuple `(1, 2)`', 'The list `[1, 2]`', 'Just `1`', 'A dict `{0: 1, 1: 2}`'],
          answer: 0,
          explain: '`*args` collects extra positional arguments into a tuple.',
          why: { 1: 'Close, but `*args` in a `def` is always a tuple. (`first, *rest = ...` unpacking gives a list.)', 2: 'The star collects every extra argument, not just the first.', 3: 'Two stars, `**kwargs`, make a dict, and only from named arguments.' },
        },
        {
          q: 'Why is `def f(items=[])` a bug waiting to happen?',
          choices: ['The one default list is shared by every call that uses it', 'An empty list is a SyntaxError as a default', 'The list is recreated every call, which is slow', 'Defaults cannot be lists in Python 3'],
          answer: 0,
          explain: 'Defaults are built once, when `def` runs. Use `items=None` and create the list inside.',
          why: { 1: 'It runs fine, which is why the bug is sneaky.', 2: 'The opposite: it is created only once.', 3: 'They can be, and that is exactly how the bug happens.' },
        },
        {
          q: 'What is JavaScript\'s `throw new Error("bad")` in Python?',
          choices: ['`raise ValueError("bad")`', '`throw ValueError("bad")`', '`return Error("bad")`', '`except ValueError("bad")`'],
          answer: 0,
          explain: 'Python uses `raise`, with an exception class such as `ValueError`.',
          why: { 1: 'Python has no `throw` keyword.', 2: 'Returning an error object does not stop the caller. It is just a value.', 3: '`except` catches exceptions. It does not raise them.' },
        },
        {
          q: 'In `try / except / else / finally`, when does `finally` run?',
          choices: ['Always, whether or not an exception was raised', 'Only when an exception was raised', 'Only when no exception was raised', 'Only when the function returns None'],
          answer: 0,
          explain: '`finally` is for cleanup, so it runs on every path, even after a `return`.',
          why: { 1: 'That is `except`.', 2: 'That is `else`.', 3: 'Return values have nothing to do with it.' },
        },
      ],
    },
  ],
};
