// Python course · lesson 9. Step types: read, predict, task, check (see ../index.js).
// Runnable read blocks are ~~~py and must run cleanly; plain ~~~ blocks are fragments.
export default {
  id: 'list-comprehensions',
  builds: ['python/lists-of-dictionaries', 'js/map'],
  title: 'List comprehensions: transform every item',
  goal: 'Turn a list into a new list, one item at a time, and understand passing functions around well enough to write map yourself.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The problem comprehensions solve',
      md: `
In lesson 8 you built new lists with a loop:

~~~py
nums = [1, 2, 3]

doubled = []             # 1. make an empty list
for n in nums:           # 2. go through each item
    doubled.append(n * 2)  # 3. change it, put the result in the new list

print(doubled)
~~~

Press **▶ Run** to see what it prints. Then press **✎ Edit**, change \`n * 2\` to \`n * 10\`, and run it again.

Notice which part you just changed: **only \`n * 2\`**. Steps 1, 2 and 3 are the same every time, whether you want doubles, names or uppercase strings.

A **list comprehension** is those three steps squeezed into one line. You write only the part that changes:

~~~py
nums = [1, 2, 3]
print([n * 2 for n in nums])
~~~
`,
    },
    {
      type: 'read',
      title: 'The key idea: a function is a value',
      md: `
Before comprehensions, one idea that makes everything in lessons 9–11 click. Go slowly.

A variable can hold a number or a string. It can also hold a **function**:

~~~py
def double(n):
    return n * 2

print(double(4))   # the () CALLS it
print(double)      # no () : the function itself, not called
~~~

Because a function is a value, you can **pass it into another function**, exactly like passing a number:

~~~py
def double(n):
    return n * 2

def do_twice(fn, x):
    return fn(fn(x))    # do_twice calls whatever function it was given

print(do_twice(double, 3))   # double(double(3)) = double(6)
~~~

Two words to learn:

- A function that **takes a function** (like \`do_twice\`) is a **higher-order function**.
- The function you pass in (like \`double\`) is a **callback**: the other function "calls it back".

\`sorted(key=...)\`, \`min(key=...)\` and \`max(key=...)\` in lesson 11 all take a function this way.
`,
    },
    {
      type: 'predict',
      title: 'Passing a function in',
      md: 'Read it slowly. `add_one` is passed in as `fn`.',
      code: `def add_one(n):
    return n + 1

def do_twice(fn, x):
    return fn(fn(x))

print(do_twice(add_one, 5))
print(callable(add_one))`,
      output: `7
True`,
      explain: `
- \`do_twice(add_one, 5)\` runs \`add_one(add_one(5))\`, which is \`add_one(6)\`, which is **7**.
- \`add_one\` without \`()\` is the function itself. \`callable(...)\` asks "can I call this?", and a function says \`True\`.

If you print a function by accident (forgot the \`()\`), Python shows something like \`<function add_one at 0x...>\`. That's your clue.
`,
    },
    {
      type: 'task',
      title: 'Build map yourself',
      md: `
The best way to stop this feeling like magic is to write it. Use only what you know: an empty list, a \`for\` loop and \`append\`.

\`my_map(items, fn)\` returns a **new** list where each item is \`fn(item)\`:

~~~
my_map([1, 2, 3], double)        → [2, 4, 6]
my_map(["a", "b"], str.upper)    → ["A", "B"]
~~~

It's the loop from step 1, with \`n * 2\` replaced by a call to \`fn\`.
`,
      starter: `def my_map(items, fn):
    pass  # your code here
`,
      tests: [
        { name: 'my_map([1, 2, 3], double) is [2, 4, 6]', code: `def double(n):
    return n * 2
eq(my_map([1, 2, 3], double), [2, 4, 6])` },
        { name: 'works with strings', code: `eq(my_map(["a", "b"], str.upper), ["A", "B"])` },
        { name: 'an empty list gives []', code: `eq(my_map([], str.upper), [])` },
        { name: 'the original list is unchanged', code: `nums = [1, 2, 3]
my_map(nums, lambda n: n * 2)
eq(nums, [1, 2, 3])` },
      ],
      hint: `
Three pieces inside the function: \`result = []\`, then \`for item in items:\` with \`result.append(fn(item))\` indented under it. Then \`return result\` after the loop (back at the function's indentation).
`,
      solution: `def my_map(items, fn):
    result = []
    for item in items:
        result.append(fn(item))  # the only new idea: call the callback on each item
    return result
`,
      explain: `Python also has a built-in \`map(fn, items)\` that does this, but real Python code almost always writes a comprehension instead: \`[fn(item) for item in items]\`.`,
    },
    {
      type: 'read',
      title: 'Trace it',
      md: `
Here's \`my_map([1, 2, 3], double)\`, one row per trip around the loop:

| Step | \`item\` | \`fn(item)\` | \`result\` after the append |
|---|---|---|---|
| start | | | \`[]\` |
| 1 | \`1\` | \`2\` | \`[2]\` |
| 2 | \`2\` | \`4\` | \`[2, 4]\` |
| 3 | \`3\` | \`6\` | \`[2, 4, 6]\` |
| end | | | returns \`[2, 4, 6]\` |

Two rules fall straight out of the code you wrote:

1. **The new list is always the same length as the old one.** One append per item. (Want fewer items? That's filtering, next lesson.)
2. **The original list is never touched.** \`result\` is a brand-new list.
`,
    },
    {
      type: 'read',
      title: 'Anatomy of a comprehension',
      md: `
Read a comprehension left to right as a sentence:

~~~
[n * 2  for n  in nums]
 │       │      └─ the list you go through
 │       └─ a name YOU pick for "the current item"
 └─ what each item becomes (written FIRST)
~~~

**"n times 2, for each n in nums."** The square brackets mean "build a list".

- **The name is your choice.** \`[u["name"] for u in users]\` and \`[user["name"] for user in users]\` are the same.
- **What it becomes comes first.** That's the part that feels backwards at first. Say the sentence out loud and it stops feeling backwards.

~~~py
users = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 17}]

print([u["name"] for u in users])
print([u["age"] + 1 for u in users])
print([w.upper() for w in ["hi", "hey"]])
~~~

Python has a built-in \`map()\` too: \`list(map(double, nums))\`. It works, but comprehensions are what you'll see and write in real Python.
`,
    },
    {
      type: 'predict',
      title: 'Warm-up prediction',
      code: `print([n + 10 for n in [1, 2, 3]])`,
      output: `[11, 12, 13]`,
      explain: 'Each item plus 10. Three items in, three items out.',
    },
    {
      type: 'task',
      title: 'doubled',
      md: `
**Example** (already solved):

~~~
def tripled(nums):
    return [n * 3 for n in nums]
~~~

**Your turn:** \`doubled([1, 2, 3])\` returns \`[2, 4, 6]\`. One line: \`return [... for ... in ...]\`.
`,
      starter: `def doubled(nums):
    pass  # your code here
`,
      tests: [
        { name: 'doubled([1, 2, 3]) is [2, 4, 6]', code: `eq(doubled([1, 2, 3]), [2, 4, 6])` },
        { name: 'doubled([]) is []', code: `eq(doubled([]), [])` },
      ],
      hint: 'Same as `tripled` in the example, with `* 2`. Don\'t forget the `return`.',
      solution: `def doubled(nums):
    return [n * 2 for n in nums]
`,
    },
    {
      type: 'task',
      title: 'upper_all',
      md: `
**Example:** calling a method on each item.

~~~
def first_letters(words):
    return [w[0] for w in words]
~~~

**Your turn:** \`upper_all(["a", "b"])\` returns \`["A", "B"]\`. (The method is \`.upper()\`.)
`,
      starter: `def upper_all(words):
    pass  # your code here
`,
      tests: [{ name: 'upper_all(["a", "b"]) is ["A", "B"]', code: `eq(upper_all(["a", "b"]), ["A", "B"])` }],
      hint: 'Each word `w` becomes `w.upper()`. The `()` matters: without it you get the method, not the uppercase string.',
      solution: `def upper_all(words):
    return [w.upper() for w in words]
`,
    },
    {
      type: 'task',
      title: 'lengths',
      md: `No example this time. \`lengths(["hi", "hello"])\` returns \`[2, 5]\`. (The length of anything is \`len(...)\`.)`,
      starter: `def lengths(words):
    pass  # your code here
`,
      tests: [{ name: 'lengths(["hi", "hello"]) is [2, 5]', code: `eq(lengths(["hi", "hello"]), [2, 5])` }],
      hint: 'Each word `w` becomes `len(w)`.',
      solution: `def lengths(words):
    return [len(w) for w in words]
`,
    },
    {
      type: 'predict',
      title: 'Parentheses instead of brackets',
      md: 'Same comprehension, but with `()` around it instead of `[]`.',
      code: `nums = [1, 2, 3]
doubled = (n * 2 for n in nums)
print(type(doubled).__name__)
print(list(doubled))`,
      output: `generator
[2, 4, 6]`,
      explain: `
Round brackets don't make a "tuple comprehension". They make a **generator**: a lazy recipe that produces items only when something asks for them. Printing it directly shows \`<generator object ...>\`, not your numbers. \`list(...)\` runs it.

So: **want a list? Use square brackets.** You'll meet generators on purpose next lesson, inside \`any()\`, \`all()\` and \`next()\`, where lazy is exactly what you want.
`,
    },
    {
      type: 'task',
      title: 'names_of',
      md: `
**Example:** pull one key out of each dict.

~~~
def ages_of(users):
    return [u["age"] for u in users]
~~~

**Your turn:** \`names_of(users)\` returns \`["Ada", "Linus"]\` for users like \`{"id": 1, "name": "Ada", "age": 36, "active": True}\`.
`,
      starter: `def names_of(users):
    pass  # your code here
`,
      tests: [
        {
          name: 'names_of(users) is ["Ada", "Linus"]',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}, {"id": 2, "name": "Linus", "age": 17, "active": False}]
eq(names_of(users), ["Ada", "Linus"])`,
        },
      ],
      hint: 'Same as `ages_of`, with `u["name"]`. Dicts use `["key"]`, not a dot.',
      solution: `def names_of(users):
    return [u["name"] for u in users]
`,
    },
    {
      type: 'task',
      title: 'labels',
      md: `\`labels(users)\` returns \`["Ada (36)", "Linus (17)"]\`. Use an f-string (lesson 1).`,
      starter: `def labels(users):
    pass  # your code here
`,
      tests: [
        {
          name: 'labels(users) is ["Ada (36)", "Linus (17)"]',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}, {"id": 2, "name": "Linus", "age": 17, "active": False}]
eq(labels(users), ["Ada (36)", "Linus (17)"])`,
        },
      ],
      hint: 'Each user becomes `f"{u[\'name\']} ({u[\'age\']})"`. Inside an f-string that uses double quotes, use single quotes for the dict keys.',
      solution: `def labels(users):
    return [f"{u['name']} ({u['age']})" for u in users]
`,
    },
    {
      type: 'predict',
      title: 'Changing the item instead of making a new one',
      md: 'This loop "turns everyone off" by changing each dict. What happens to the **original** list?',
      code: `users = [{"name": "Ada", "active": True}]

off = []
for u in users:
    u["active"] = False
    off.append(u)

print(users[0]["active"])
print(off[0] is users[0])`,
      output: `False
True`,
      explain: `
The new **list** \`off\` holds the **same dict objects** as \`users\` (lesson 7: a variable points at an object, it doesn't copy it). Setting \`u["active"] = False\` changed the original user. \`is\` asks "the very same object?", and the answer is yes.

The fix is to build a **new dict** for each item with \`{**u, ...}\`: copy every key of \`u\`, then override one.

~~~py
users = [{"name": "Ada", "active": True}]
off = [{**u, "active": False} for u in users]
print(users[0]["active"], off[0]["active"])
~~~
`,
    },
    {
      type: 'task',
      title: 'toggle_all',
      md: `
**Example:** return a **new** dict per item.

~~~
def birthday_all(users):
    return [{**u, "age": u["age"] + 1} for u in users]
~~~

**Your turn:** \`toggle_all(users)\` returns new dicts with \`"active"\` flipped (\`True\` becomes \`False\`, \`False\` becomes \`True\`). The original dicts must not change.
`,
      starter: `def toggle_all(users):
    pass  # your code here
`,
      tests: [
        {
          name: 'flips active on every user',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}, {"id": 2, "name": "Linus", "age": 17, "active": False}]
eq([u["active"] for u in toggle_all(users)], [False, True])`,
        },
        {
          name: 'keeps the other keys',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}]
eq(toggle_all(users)[0], {"id": 1, "name": "Ada", "age": 36, "active": False})`,
        },
        {
          name: 'does not change the original users',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}]
toggle_all(users)
eq(users[0]["active"], True, "the original dict changed: build a new one with {**u, ...} instead of setting u['active']")`,
        },
      ],
      hint: 'Same shape as `birthday_all`, but the change is `"active": not u["active"]`. `not` flips a boolean.',
      solution: `def toggle_all(users):
    return [{**u, "active": not u["active"]} for u in users]
`,
      explain: '"Build a copy with one key changed" is the same move as a React state update. In an API it\'s how you return changed data without corrupting what you were given.',
    },
    {
      type: 'predict',
      title: 'Getting the index too',
      code: `print([f"{i}:{letter}" for i, letter in enumerate(["a", "b", "c"])])`,
      output: `['0:a', '1:b', '2:c']`,
      explain: '`enumerate(items)` hands you `(index, item)` pairs, and `for i, letter in ...` unpacks each pair into two names (lesson 12 goes deeper). Reach for it when you need positions; most of the time you don\'t.',
    },
    {
      type: 'read',
      title: "Where you'll see this",
      md: `
- **API responses:** "the database gave us rows, the response needs only names and ids" is one comprehension:

~~~py
rows = [{"id": 1, "name": "Ada", "password": "secret"}, {"id": 2, "name": "Linus", "password": "hunter2"}]
public = [{"id": r["id"], "name": r["name"]} for r in rows]
print(public)
~~~

- **Cleaning input:** \`[w.strip().lower() for w in words]\`.
- **Immutable updates:** \`[{**t, "done": not t["done"]} if t["id"] == todo_id else t for t in todos]\` changes one item and keeps the rest. That's a comprehension, a conditional expression (lesson 3) and \`{**t}\` together.

~~~py
todos = [{"id": 1, "done": False}, {"id": 2, "done": False}]
todo_id = 2
print([{**t, "done": not t["done"]} if t["id"] == todo_id else t for t in todos])
~~~
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'What does `[n * 2 for n in [1, 2, 3]]` give?',
          choices: ['`[2, 4, 6]`', '`[1, 2, 3, 1, 2, 3]`', '`12`', 'A generator object'],
          answer: 0,
          explain: 'Each item becomes `n * 2`, collected into a new list of the same length.',
          why: ['', 'That would be `[1, 2, 3] * 2`, which repeats the list. The comprehension doubles each item.', 'That would be the sum of the doubled items. A comprehension builds a list, it doesn\'t add things up.', 'Square brackets build a list. Round brackets would give a generator.'],
        },
        {
          q: 'In `[u["name"] for u in users]`, which part is "what each item becomes"?',
          choices: ['`u["name"]`', '`for u`', '`in users`', '`users`'],
          answer: 0,
          explain: 'The expression written first is the result for each item. Read it as "u\'s name, for each u in users".',
          why: ['', '`for u` names the current item; it doesn\'t say what it becomes.', '`in users` says which list to go through.', '`users` is the list you go through, not the result.'],
        },
        {
          q: 'What does `print((n * 2 for n in [1, 2]))` print?',
          choices: ['`<generator object <genexpr> at 0x...>`', '`[2, 4]`', '`(2, 4)`', 'A SyntaxError'],
          answer: 0,
          explain: 'Round brackets make a lazy generator. Wrap it in `list(...)`, or use square brackets, to get the values.',
          why: ['', 'You get `[2, 4]` only with square brackets or `list(...)`.', 'There is no "tuple comprehension"; `tuple(...)` around it would give `(2, 4)`.', 'It\'s valid Python, just not a list.'],
        },
        {
          q: '`off = [u for u in users]`, then `off[0]["active"] = False`. What happens to `users[0]["active"]`?',
          choices: ['It becomes `False` too', 'It stays the same', 'Python raises an error', 'It becomes `None`'],
          answer: 0,
          explain: 'The new list holds the same dict objects. To change one without touching the original, build a new dict: `{**u, "active": False}`.',
          why: ['', 'Only the list is new. The dicts inside it are shared, so changing one changes the original.', 'Changing a dict through any name that points at it is allowed.', 'Nothing sets it to `None`; the shared dict now says `False`.'],
        },
        {
          q: 'What is a callback?',
          choices: ['A function you pass into another function, which calls it for you', 'A function that calls itself', 'The value a function returns', 'A function with no name'],
          answer: 0,
          explain: 'In `my_map(nums, double)`, `double` is the callback: `my_map` calls it once per item.',
          why: ['', 'A function that calls itself is recursive. That\'s a different idea.', 'The return value is what comes back out; the callback goes in.', 'A function with no name is a `lambda`. A lambda can be a callback, but so can any named function.'],
        },
      ],
    },
  ],
};
