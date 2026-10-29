// Python course · lesson 12. Step types: read, predict, task, check (see ../index.js).
// Runnable read blocks are ~~~py and must run cleanly; plain ~~~ blocks are fragments.
export default {
  id: 'unpacking-and-copying',
  builds: ['python/sum-min-max-sort', 'js/spread-and-destructuring'],
  title: 'Unpacking and copying',
  goal: 'Pull values out of tuples, lists and dicts in one line, merge dicts, and copy nested data without changing the original.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The problem: getting values out',
      md: `
You keep writing lines like these:

~~~py
pair = (3, 4)
x = pair[0]
y = pair[1]
print(x, y)
~~~

**Unpacking** does it in one line. Put names on the left, in the same shape as the value on the right:

~~~py
pair = (3, 4)
x, y = pair
print(x, y)
~~~

Python matches them up by **position**: first name gets the first item, second name the second.
`,
    },
    {
      type: 'predict',
      title: 'The one-line swap',
      code: `a = 1
b = 2
a, b = b, a
print(a, b)`,
      output: `2 1`,
      explain: 'The right side `b, a` is built first as a tuple `(2, 1)`, then unpacked into `a, b`. No temporary variable needed. This trick shows up in interviews.',
    },
    {
      type: 'task',
      title: 'swap',
      md: `
**Example** (already solved):

~~~
def add_pair(pair):
    a, b = pair
    return a + b
~~~

**Your turn:** \`swap((1, 2))\` returns \`(2, 1)\`.
`,
      starter: `def swap(pair):
    pass  # your code here
`,
      tests: [
        { name: 'swap((1, 2)) is (2, 1)', code: `eq(swap((1, 2)), (2, 1))` },
        { name: 'works with strings', code: `eq(swap(("a", "b")), ("b", "a"))` },
      ],
      hint: 'Unpack like the example (`a, b = pair`), then `return (b, a)`.',
      solution: `def swap(pair):
    a, b = pair
    return (b, a)
`,
    },
    {
      type: 'read',
      title: 'The star: grab "the rest"',
      md: `
A name with \`*\` in front collects **everything that's left** into a list:

~~~py
first, *rest = [1, 2, 3, 4]
print(first, rest)

*rest, last = [1, 2, 3, 4]
print(rest, last)
~~~

- Only one starred name per unpacking.
- The starred name is **always a list**, even if it's empty.

And if the number of names doesn't match (with no star), Python stops you:
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Too many values',
      code: `a, b = [1, 2, 3]
print(a, b)`,
      output: `! ValueError: too many values to unpack (expected 2, got 3) (line 1)`,
      explain: 'Without a star, the count has to match exactly. Add `*rest` to collect extras, or fix the shape of the data.',
    },
    {
      type: 'task',
      title: 'first_and_rest',
      md: `
**Example:**

~~~
def last_and_rest(arr):
    *rest, last = arr
    return (last, rest)
~~~

**Your turn:** \`first_and_rest([1, 2, 3])\` returns \`(1, [2, 3])\`, and \`first_and_rest(["x"])\` returns \`("x", [])\`.
`,
      starter: `def first_and_rest(arr):
    pass  # your code here
`,
      tests: [
        { name: 'first_and_rest([1, 2, 3]) is (1, [2, 3])', code: `eq(first_and_rest([1, 2, 3]), (1, [2, 3]))` },
        { name: 'one item gives an empty rest', code: `eq(first_and_rest(["x"]), ("x", []))` },
      ],
      hint: 'Flip the example: `first, *rest = arr`, then `return (first, rest)`.',
      solution: `def first_and_rest(arr):
    first, *rest = arr   # rest is always a list, possibly empty
    return (first, rest)
`,
    },
    {
      type: 'read',
      title: 'Unpacking in for loops',
      md: `
Unpacking works anywhere Python assigns names, including the \`for\` line. When each item is a pair, name both parts:

~~~py
pairs = [("Ada", 36), ("Linus", 17)]

for name, age in pairs:
    print(f"{name} is {age}")
~~~

You've already used this without noticing:

~~~py
ages = {"Ada": 36, "Linus": 17}
for name, age in ages.items():   # .items() gives (key, value) pairs
    print(name, age)

for i, letter in enumerate(["a", "b"]):   # enumerate gives (index, item) pairs
    print(i, letter)
~~~
`,
    },
    {
      type: 'predict',
      title: 'Unpacking pairs',
      code: `scores = [("Ada", 9), ("Linus", 7)]
print([f"{name}={score}" for name, score in scores])`,
      output: `['Ada=9', 'Linus=7']`,
      explain: 'A comprehension\'s `for` part can unpack too. Each tuple is split into `name` and `score` before the front expression uses them.',
    },
    {
      type: 'task',
      title: 'get_city',
      md: `
Dicts don't unpack by key name, so nested reads are just two lookups in a row.

**Example:**

~~~
def get_zip(user):
    return user["address"]["zip"]
~~~

**Your turn:** \`get_city({"name": "Ada", "address": {"city": "London", "zip": "N1"}})\` returns \`"London"\`.
`,
      starter: `def get_city(user):
    pass  # your code here
`,
      tests: [
        { name: 'returns "London"', code: `eq(get_city({"name": "Ada", "address": {"city": "London", "zip": "N1"}}), "London")` },
      ],
      hint: 'Same as `get_zip`, with `["city"]` at the end.',
      solution: `def get_city(user):
    return user["address"]["city"]
`,
    },
    {
      type: 'read',
      title: 'Merging dicts with ** (later wins)',
      md: `
\`**d\` inside \`{...}\` means "pour all of d's keys and values in here". Pour in two dicts and you've merged them. When both have the same key, **the later one wins**:

~~~py
defaults = {"color": "red", "size": "M"}
chosen = {"size": "L"}

print({**defaults, **chosen})
print({**chosen, **defaults})
~~~

Order is everything: put the defaults first and the overrides last. The same trick copies a dict with one change, which you used in lesson 9:

~~~py
user = {"name": "Ada", "age": 36}
older = {**user, "age": 37}
print(user, older)
~~~
`,
    },
    {
      type: 'task',
      title: 'merge',
      md: `
**Example:**

~~~
def with_defaults(options):
    return {"color": "red", "size": "M", **options}
~~~

**Your turn:** \`merge({"a": 1, "b": 2}, {"b": 3})\` returns \`{"a": 1, "b": 3}\`. \`b\` wins on a clash.
`,
      starter: `def merge(a, b):
    pass  # your code here
`,
      tests: [
        { name: 'b wins on a clash', code: `eq(merge({"a": 1, "b": 2}, {"b": 3}), {"a": 1, "b": 3})` },
        { name: 'keeps keys from both', code: `eq(merge({"a": 1}, {"c": 3}), {"a": 1, "c": 3})` },
        { name: 'does not change a', code: `a = {"a": 1}
merge(a, {"a": 2})
eq(a, {"a": 1})` },
      ],
      hint: '`{**a, **b}`: `b` goes last so it wins.',
      solution: `def merge(a, b):
    return {**a, **b}  # later keys win, and both inputs are left alone
`,
    },
    {
      type: 'task',
      title: 'update_age',
      md: `\`update_age({"name": "Ada", "age": 36}, 37)\` returns \`{"name": "Ada", "age": 37}\`, and the dict passed in must **not** change.`,
      starter: `def update_age(user, age):
    pass  # your code here
`,
      tests: [
        { name: 'returns the updated dict', code: `eq(update_age({"name": "Ada", "age": 36}, 37), {"name": "Ada", "age": 37})` },
        { name: 'the original dict does not change', code: `original = {"name": "Ada", "age": 36}
update_age(original, 37)
eq(original["age"], 36, "the original changed: build a new dict with {**user, ...} instead of user['age'] = ...")` },
      ],
      hint: '`return {**user, "age": age}`.',
      solution: `def update_age(user, age):
    return {**user, "age": age}
`,
    },
    {
      type: 'predict',
      title: 'Shallow copies share what\'s inside',
      md: '`{**post}` makes a new dict. But the `"tags"` list inside it?',
      code: `post = {"title": "Hi", "tags": ["a"]}
copy = {**post}
copy["tags"].append("b")
print(post["tags"])
print(copy["tags"] is post["tags"])`,
      output: `['a', 'b']
True`,
      explain: `
\`{**post}\` copies **one level**: the new dict gets the same keys and points at the **same values**. The tags list wasn't copied, so both dicts share it, and appending through the copy changed the original.

This is called a **shallow copy**. To change something nested, copy each level you change: a new dict *and* a new list.
`,
    },
    {
      type: 'read',
      title: 'Copying each level',
      md: `
To add a tag without touching the original, make a new list and put it in a new dict:

~~~py
post = {"title": "Hi", "tags": ["a"]}

new_post = {**post, "tags": [*post["tags"], "b"]}

print(post)
print(new_post)
~~~

- \`[*post["tags"], "b"]\`: a **new list** with the old tags poured in, plus \`"b"\`.
- \`{**post, "tags": ...}\`: a **new dict** with every key copied, and \`"tags"\` replaced by that new list.

Same idea as before: only the levels you change need a copy, but every one of those needs one.
`,
    },
    {
      type: 'task',
      title: 'add_tag',
      md: `
**Example:**

~~~
def add_item(cart, item):
    return [*cart, item]
~~~

**Your turn:** \`add_tag({"title": "Hi", "tags": ["a"]}, "b")\` returns \`{"title": "Hi", "tags": ["a", "b"]}\`. Neither the post nor its tags list may change.
`,
      starter: `def add_tag(post, tag):
    pass  # your code here
`,
      tests: [
        { name: 'returns the post with the new tag', code: `eq(add_tag({"title": "Hi", "tags": ["a"]}, "b"), {"title": "Hi", "tags": ["a", "b"]})` },
        { name: 'the original tags list does not change', code: `post = {"title": "Hi", "tags": ["a"]}
add_tag(post, "b")
eq(post["tags"], ["a"], "the original tags list changed: build a new list with [*post['tags'], tag]")` },
      ],
      hint: '`{**post, "tags": [*post["tags"], tag]}`: a new dict with a new list inside.',
      solution: `def add_tag(post, tag):
    return {**post, "tags": [*post["tags"], tag]}  # copy both levels you change
`,
      explain: 'Using `post["tags"].append(tag)` would pass the first test but change the caller\'s data, which is exactly the shallow-copy trap from two steps ago.',
    },
    {
      type: 'task',
      title: 'from_pairs',
      md: `
**Example:** a dict to a list of pairs.

~~~
def to_pairs(d):
    return list(d.items())
~~~

**Your turn:** the other direction. \`from_pairs([("a", 1), ("b", 2)])\` returns \`{"a": 1, "b": 2}\`.
`,
      starter: `def from_pairs(pairs):
    pass  # your code here
`,
      tests: [
        { name: 'builds a dict from pairs', code: `eq(from_pairs([("a", 1), ("b", 2)]), {"a": 1, "b": 2})` },
        { name: 'an empty list gives {}', code: `eq(from_pairs([]), {})` },
      ],
      hint: '`dict(pairs)`: `dict(...)` accepts a list of `(key, value)` pairs.',
      solution: `def from_pairs(pairs):
    return dict(pairs)
`,
    },
    {
      type: 'read',
      title: 'You know enough for the challenges',
      md: `
That's the whole toolkit. Every Python challenge is these moves, two or three at a time:

| Move | Lesson |
|---|---|
| return, f-strings, if/elif | 1–3 |
| lists, loops, dicts | 5–8 |
| comprehensions | 9 |
| filter with \`if\`, \`next(..., None)\`, \`any\`/\`all\` | 10 |
| \`sum\`, \`min\`/\`max\` with \`key=\`, counting, \`sorted\` | 11 |
| unpacking, \`{**a, **b}\`, copying each level | 12 |

Next stop: the **[Python challenges](/learn/challenges)**. Start with ch01 and ch02. For each function, decide which lesson's tool it needs before typing. If you freeze, come back to that lesson's "build it yourself" step.

Tomorrow, press **Redo from blank** on this lesson and do the exercises once more without hints.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'After `first, *rest = [7]`, what is `rest`?',
          choices: ['`[]`', '`None`', '`7`', 'It raises ValueError'],
          answer: 0,
          explain: 'The starred name always gets a list. With nothing left over, it\'s an empty list.',
          why: ['', 'A starred name is never `None`; it\'s always a list.', '`first` gets the 7. `rest` gets what\'s left, which is nothing.', 'With a star, the count doesn\'t have to match exactly.'],
        },
        {
          q: 'What is `{**{"size": "M"}, **{"size": "L"}}`?',
          choices: ['`{"size": "L"}`', '`{"size": "M"}`', '`{"size": ["M", "L"]}`', 'An error: duplicate key'],
          answer: 0,
          explain: 'When keys clash, the later one wins. Put defaults first, overrides last.',
          why: ['', 'The first value is overwritten by the later one.', 'Merging replaces values; it never combines them into a list.', 'A clash is allowed; the later value wins.'],
        },
        {
          q: '`copy = {**post}` then `copy["tags"].append("x")`. Does `post["tags"]` change?',
          choices: ['Yes: the copy is shallow, so both share the same list', 'No: `{**post}` copies everything', 'No: `append` makes a new list', 'It raises an error'],
          answer: 0,
          explain: 'Only the outer dict is new. Nested lists and dicts are shared until you copy them too: `{**post, "tags": [*post["tags"], "x"]}`.',
          why: ['', '`{**post}` copies one level only.', '`append` changes the list in place; it doesn\'t make a new one.', 'Appending to a shared list is allowed, which is exactly why it\'s a trap.'],
        },
        {
          q: 'What does `a, b = [1, 2, 3]` do?',
          choices: ['Raises ValueError: too many values to unpack', 'Sets `a = 1`, `b = 2` and ignores 3', 'Sets `a = 1`, `b = [2, 3]`', 'Sets `a = [1, 2]`, `b = 3`'],
          answer: 0,
          explain: 'Without a star, the number of names must match the number of values exactly.',
          why: ['', 'Python never silently drops values when unpacking.', 'That needs a star: `a, *b = [1, 2, 3]`.', 'That needs a star on `a`: `*a, b = [1, 2, 3]`.'],
        },
        {
          q: 'In `for name, age in pairs:`, what must each item in `pairs` be?',
          choices: ['Something with exactly two parts, like a tuple `("Ada", 36)`', 'A dict with "name" and "age" keys', 'A string', 'Anything; Python figures it out'],
          answer: 0,
          explain: 'Each item is unpacked into the two names, so it must have two parts. For a dict, loop over `d.items()` to get `(key, value)` pairs.',
          why: ['', 'Dicts unpack into their keys, not by name. Read them with `u["name"]`.', 'A string of exactly two characters would technically unpack, but that\'s almost never what you mean.', 'The shape has to match the names, or you get a ValueError.'],
        },
      ],
    },
  ],
};
