// Python course · lesson 10. Step types: read, predict, task, check (see ../index.js).
// Runnable read blocks are ~~~py and must run cleanly; plain ~~~ blocks are fragments.
export default {
  id: 'filter-find-any-all',
  builds: ['python/list-comprehensions', 'js/filter-and-find'],
  title: 'Filtering, finding, any and all',
  goal: 'Keep only the items you want, find the first match, and ask yes/no questions about a whole list.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'The problem: keep some, find one',
      md: `
In lesson 8 you wrote "keep-if" and "find" loops by hand:

~~~py
users = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 17}, {"name": "Grace", "age": 45}]

adults = []
for u in users:
    if u["age"] >= 18:       # the only part that changes
        adults.append(u)
print([u["name"] for u in adults])

found = None
for u in users:
    if u["name"] == "Grace": # the only part that changes
        found = u
        break
print(found)
~~~

Like last lesson, only the **test** changes from one loop to the next. Python lets you write just the test:

- keep the matches: a comprehension with \`if\`
- find the first match: \`next(...)\`
- "is there any…?" / "are they all…?": \`any(...)\` / \`all(...)\`
`,
    },
    {
      type: 'read',
      title: 'Predicates: functions that answer yes or no',
      md: `
A **predicate** is a function (or an expression) that returns \`True\` or \`False\` about one item:

~~~py
def is_adult(u):
    return u["age"] >= 18

def is_even(n):
    return n % 2 == 0

print(is_adult({"name": "Linus", "age": 17}))
print(is_even(4))
~~~

Every tool in this lesson takes a predicate. Filtering keeps items where it's \`True\`. Finding stops at the first \`True\`. \`any\` asks "is it \`True\` for at least one?", \`all\` asks "for every one?".

And since functions are values (lesson 9), you can pass a predicate in, which is exactly what you'll do next.
`,
    },
    {
      type: 'task',
      title: 'Build filter yourself',
      md: `
Write \`my_filter(items, test)\`: a **new** list with only the items where \`test(item)\` is \`True\`.

~~~
my_filter([1, 2, 3, 4], is_even)   → [2, 4]
my_filter([1, 3], is_even)         → []
~~~

It's \`my_map\` from lesson 9 with one change: only \`append\` when the test passes.
`,
      starter: `def my_filter(items, test):
    pass  # your code here
`,
      tests: [
        { name: 'my_filter([1, 2, 3, 4], is_even) is [2, 4]', code: `def is_even(n):
    return n % 2 == 0
eq(my_filter([1, 2, 3, 4], is_even), [2, 4])` },
        { name: 'no matches gives []', code: `eq(my_filter([1, 3], lambda n: n % 2 == 0), [])` },
        { name: 'keeps the original order', code: `eq(my_filter(["hi", "hello", "hey"], lambda w: len(w) >= 3), ["hello", "hey"])` },
        { name: 'the original list is unchanged', code: `nums = [1, 2, 3]
my_filter(nums, lambda n: n > 1)
eq(nums, [1, 2, 3])` },
      ],
      hint: '`result = []`, then `for item in items:`, and inside it `if test(item):` with `result.append(item)` under that. Append the **item itself**, not `test(item)`. Return `result` at the end.',
      solution: `def my_filter(items, test):
    result = []
    for item in items:
        if test(item):          # the callback decides
            result.append(item)  # keep the item itself, unchanged
    return result
`,
    },
    {
      type: 'read',
      title: 'Trace it, then the comprehension version',
      md: `
\`my_filter([1, 2, 3, 4], is_even)\`:

| \`item\` | \`test(item)\` | \`result\` after |
|---|---|---|
| \`1\` | \`False\` | \`[]\` |
| \`2\` | \`True\` | \`[2]\` |
| \`3\` | \`False\` | \`[2]\` |
| \`4\` | \`True\` | \`[2, 4]\` |

Two rules, compared with lesson 9:

1. The result can be **shorter** (even empty), never longer.
2. Items come out **unchanged**. Filtering decides *whether*, not *what*.

In real Python you write it as a comprehension with \`if\` on the end:

~~~
[n  for n in nums  if n % 2 == 0]
 │                 └─ the test: keep only when this is True
 └─ what to keep (here: the item itself)
~~~

Read it: **"n, for each n in nums, if n is even."**

~~~py
nums = [1, 2, 3, 4]
print([n for n in nums if n % 2 == 0])
~~~
`,
    },
    {
      type: 'predict',
      title: 'Filter can return nothing',
      code: `print([n for n in [1, 3, 5] if n > 10])`,
      output: `[]`,
      explain: 'No item passed the test, so you get an **empty list**, not `None` and not an error. Code after a filter can always loop over the result safely.',
    },
    {
      type: 'task',
      title: 'evens',
      md: `
**Example** (already solved):

~~~
def odds(nums):
    return [n for n in nums if n % 2 == 1]
~~~

**Your turn:** \`evens([1, 2, 3, 4])\` returns \`[2, 4]\`.
`,
      starter: `def evens(nums):
    pass  # your code here
`,
      tests: [
        { name: 'evens([1, 2, 3, 4]) is [2, 4]', code: `eq(evens([1, 2, 3, 4]), [2, 4])` },
        { name: 'evens([1, 3]) is []', code: `eq(evens([1, 3]), [])` },
      ],
      hint: 'Same as `odds`, but the test is `n % 2 == 0`.',
      solution: `def evens(nums):
    return [n for n in nums if n % 2 == 0]
`,
    },
    {
      type: 'task',
      title: 'long_words',
      md: `\`long_words(["hi", "hello", "hey"], 3)\` returns \`["hello", "hey"]\`: the words whose length is **3 or more**.`,
      starter: `def long_words(words, min_len):
    pass  # your code here
`,
      tests: [
        { name: 'keeps words of length 3 or more', code: `eq(long_words(["hi", "hello", "hey"], 3), ["hello", "hey"])` },
        { name: 'uses the min_len you pass in', code: `eq(long_words(["hi", "hello", "hey"], 4), ["hello"])` },
      ],
      hint: 'The test is `len(w) >= min_len`. Use `>=`, not `>`, so a word of exactly `min_len` counts.',
      solution: `def long_words(words, min_len):
    return [w for w in words if len(w) >= min_len]
`,
    },
    {
      type: 'task',
      title: 'active_users',
      md: `\`active_users(users)\` returns the user dicts whose \`"active"\` is \`True\`. Users look like \`{"id": 1, "name": "Ada", "age": 36, "active": True}\`.`,
      starter: `def active_users(users):
    pass  # your code here
`,
      tests: [
        {
          name: 'returns Ada and Grace',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}, {"id": 2, "name": "Linus", "age": 17, "active": False}, {"id": 3, "name": "Grace", "age": 45, "active": True}]
eq(active_users(users), [users[0], users[2]])`,
        },
      ],
      hint: '`u["active"]` is already `True` or `False`, so it can be the whole test: `if u["active"]`. No need for `== True`.',
      solution: `def active_users(users):
    return [u for u in users if u["active"]]
`,
    },
    {
      type: 'task',
      title: 'Build find yourself',
      md: `
Finding is different: you want **one item**, the first match, or \`None\` if there isn't one.

Write \`my_find(items, test)\`:

~~~
my_find([5, 12, 8], lambda n: n > 10)   → 12
my_find([1, 2], lambda n: n > 10)       → None
~~~

Loop, and \`return\` the item the moment the test passes. If the loop finishes, nothing matched.
`,
      starter: `def my_find(items, test):
    pass  # your code here
`,
      tests: [
        { name: 'returns the first match', code: `eq(my_find([5, 12, 8, 20], lambda n: n > 10), 12)` },
        { name: 'returns None when nothing matches', code: `assert my_find([1, 2], lambda n: n > 10) is None, "expected None when nothing matches"` },
        { name: 'returns the item itself (a dict)', code: `users = [{"name": "Ada"}, {"name": "Grace"}]
assert my_find(users, lambda u: u["name"] == "Grace") is users[1], "return the matching dict itself"` },
      ],
      hint: '`for item in items:` then `if test(item):` then `return item`. After the loop (not inside it), `return None`.',
      solution: `def my_find(items, test):
    for item in items:
        if test(item):
            return item   # stop at the first match
    return None           # only reached if nothing matched
`,
      explain: 'The classic bug is putting `return None` in an `else:` inside the loop. Then it gives up after checking only the first item.',
    },
    {
      type: 'read',
      title: 'The one-line find: next(...)',
      md: `
Python's one-liner for "first match or \`None\`":

~~~
next((u for u in users if u["id"] == 2), None)
      └──────── a generator of matches ─────┘  └─ default if there are none
~~~

- The inner part is a **generator** (lesson 9's round brackets): a lazy list of matches.
- \`next(...)\` asks it for **one** item, so it stops at the first match without checking the rest.
- The second argument, \`None\`, is what you get if there are no matches.

~~~py
users = [{"id": 1, "name": "Ada"}, {"id": 2, "name": "Linus"}]
print(next((u for u in users if u["id"] == 2), None))
print(next((u for u in users if u["id"] == 9), None))
~~~

Yes, it's dense. Read it as "the next user, out of the users whose id is 2, or None".
`,
    },
    {
      type: 'predict',
      title: 'Forgetting the default',
      md: 'Same as above, but without `, None` and with an id that doesn\'t exist.',
      code: `users = [{"id": 1, "name": "Ada"}]

try:
    print(next(u for u in users if u["id"] == 9))
except StopIteration:
    print("crashed with StopIteration")`,
      output: `crashed with StopIteration`,
      explain: `
With no default, \`next\` on an empty generator raises **StopIteration**: "there is no next item". (\`try\` / \`except\` catches an error so we can print its name; you'll use it properly in the challenges.) In an API, an uncaught error like this is a 500 instead of a clean 404.

Always pass the default: \`next((...), None)\`. Then check for \`None\` and handle "not found" yourself. (With a single argument, Python lets you drop the extra round brackets, which is why the code above looks slightly different.)
`,
    },
    {
      type: 'task',
      title: 'find_by_name',
      md: `
**Example:**

~~~
def find_by_id(users, user_id):
    return next((u for u in users if u["id"] == user_id), None)
~~~

**Your turn:** \`find_by_name(users, "Grace")\` returns Grace's dict; \`find_by_name(users, "Bob")\` returns \`None\`.
`,
      starter: `def find_by_name(users, name):
    pass  # your code here
`,
      tests: [
        {
          name: 'finds Grace',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}, {"id": 3, "name": "Grace", "age": 45, "active": True}]
eq(find_by_name(users, "Grace"), users[1])`,
        },
        {
          name: 'returns None for Bob',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}]
assert find_by_name(users, "Bob") is None, "expected None for a name that isn't there (did you pass the default to next?)"`,
        },
      ],
      hint: 'Copy `find_by_id` and change the test to `u["name"] == name`. Keep the `, None`.',
      solution: `def find_by_name(users, name):
    return next((u for u in users if u["name"] == name), None)
`,
    },
    {
      type: 'read',
      title: 'any and all: yes/no about the whole list',
      md: `
- \`any(...)\`: is the test \`True\` for **at least one** item?
- \`all(...)\`: is it \`True\` for **every** item?

~~~py
nums = [3, -1, 4]
print(any(n < 0 for n in nums))
print(all(n > 0 for n in nums))
~~~

Both **short-circuit**: \`any\` stops at the first \`True\`, \`all\` stops at the first \`False\`. That's why you pass a generator (no square brackets): items are only checked until the answer is known.

Two edge cases that surprise people:

~~~py
print(any(n > 0 for n in []))
print(all(n > 0 for n in []))
~~~

\`any\` of nothing is \`False\` (nobody matched). \`all\` of nothing is \`True\` (nobody failed).
`,
    },
    {
      type: 'predict',
      title: 'Short-circuiting, visibly',
      md: 'The predicate prints every item it checks. How many lines get printed before the answer?',
      code: `def is_negative(n):
    print("checking", n)
    return n < 0

print(any(is_negative(n) for n in [5, -2, 7, 9]))`,
      output: `checking 5
checking -2
True`,
      explain: '`any` stopped at `-2`, the first `True`. It never looked at `7` or `9`. With square brackets (`any([is_negative(n) for n in ...])`) the list would be built first, checking all four.',
    },
    {
      type: 'task',
      title: 'any_negative',
      md: `
**Example:**

~~~
def any_zero(nums):
    return any(n == 0 for n in nums)
~~~

**Your turn:** \`any_negative([1, -2, 3])\` returns \`True\`, \`any_negative([1, 2])\` returns \`False\`.
`,
      starter: `def any_negative(nums):
    pass  # your code here
`,
      tests: [
        { name: 'any_negative([1, -2, 3]) is True', code: `eq(any_negative([1, -2, 3]), True)` },
        { name: 'any_negative([1, 2]) is False', code: `eq(any_negative([1, 2]), False)` },
      ],
      hint: 'Same as `any_zero`, with the test `n < 0`.',
      solution: `def any_negative(nums):
    return any(n < 0 for n in nums)
`,
    },
    {
      type: 'task',
      title: 'all_positive',
      md: `\`all_positive([1, 2, 3])\` returns \`True\`, \`all_positive([1, -2])\` returns \`False\`.`,
      starter: `def all_positive(nums):
    pass  # your code here
`,
      tests: [
        { name: 'all_positive([1, 2, 3]) is True', code: `eq(all_positive([1, 2, 3]), True)` },
        { name: 'all_positive([1, -2]) is False', code: `eq(all_positive([1, -2]), False)` },
      ],
      hint: '`all(n > 0 for n in nums)`.',
      solution: `def all_positive(nums):
    return all(n > 0 for n in nums)
`,
    },
    {
      type: 'read',
      title: 'Filter and transform in one go',
      md: `
A comprehension can filter **and** transform at the same time. The \`if\` decides which items get in, the expression at the front decides what they become:

~~~
[u["name"]  for u in users  if u["active"]]
 └ becomes   └ for each      └ only if
~~~

Read it: **"the user's name, for each user, if the user is active."**

~~~py
users = [{"name": "Ada", "active": True}, {"name": "Linus", "active": False}, {"name": "Grace", "active": True}]
print([u["name"] for u in users if u["active"]])
~~~

The filter runs first (per item), then the transform. That's the same "keep some, then change them" pipeline, in one readable line.
`,
    },
    {
      type: 'task',
      title: 'active_names',
      md: `\`active_names(users)\` returns \`["Ada", "Grace"]\`: the names of the active users. One comprehension.`,
      starter: `def active_names(users):
    pass  # your code here
`,
      tests: [
        {
          name: 'returns ["Ada", "Grace"]',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}, {"id": 2, "name": "Linus", "age": 17, "active": False}, {"id": 3, "name": "Grace", "age": 45, "active": True}]
eq(active_names(users), ["Ada", "Grace"])`,
        },
      ],
      hint: '`[u["name"] for u in users if u["active"]]`: what it becomes at the front, the test at the end.',
      solution: `def active_names(users):
    return [u["name"] for u in users if u["active"]]
`,
    },
    {
      type: 'predict',
      title: 'Which one runs first?',
      md: 'Here the transform at the front would crash on a user without a name. Does the `if` protect it?',
      code: `users = [{"name": "ada"}, {}, {"name": "grace"}]
print([u["name"].title() for u in users if "name" in u])`,
      output: `['Ada', 'Grace']`,
      explain: 'Yes. For each item the `if` is checked first, and only items that pass reach the expression at the front. The empty dict is skipped before `u["name"]` could raise a KeyError.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'What does `[n for n in [1, 3] if n > 5]` give?',
          choices: ['`[]`', '`None`', '`False`', 'An error'],
          answer: 0,
          explain: 'Nothing passed the test, so the new list is simply empty.',
          why: ['', 'A comprehension always builds a list, even when nothing gets in.', 'The test results don\'t come out; the kept items do. Here there are none.', 'Filtering out everything is normal, not an error.'],
        },
        {
          q: 'What does `next((u for u in users if u["id"] == 9), None)` give when no user has id 9?',
          choices: ['`None`', '`[]`', 'It raises StopIteration', 'The last user'],
          answer: 0,
          explain: 'The second argument is the default for "no match". Without it, `next` raises StopIteration.',
          why: ['', 'Finding gives one item or the default, never a list.', 'Only without the `None` default. Here the default is passed.', 'It never returns a non-matching item.'],
        },
        {
          q: 'Filtering vs finding: which is right?',
          choices: ['A filter gives a list (maybe empty); a find gives one item or `None`', 'Both give a list', 'Both give one item', 'A filter gives one item; a find gives a list'],
          answer: 0,
          explain: 'Ask yourself "do I want all matches, or the first one?" and pick the tool by the answer.',
          why: ['', 'A find gives one item or `None`, not a list.', 'A filter gives every match as a list.', 'It\'s the other way round.'],
        },
        {
          q: 'What is `all(n > 0 for n in [])`?',
          choices: ['`True`', '`False`', '`None`', 'An error'],
          answer: 0,
          explain: '`all` looks for a counter-example. With no items there is none, so the answer is `True`. (`any` of an empty list is `False`.)',
          why: ['', 'That\'s `any([])`. `all` is only `False` if some item fails.', '`all` always returns a bool.', 'An empty list is fine for both `any` and `all`.'],
        },
        {
          q: 'In `[u["name"] for u in users if u["active"]]`, what runs first for each user?',
          choices: ['The `if u["active"]` test', 'The `u["name"]` expression', 'Both at the same time', 'Whichever is shorter'],
          answer: 0,
          explain: 'Each item is tested first; only items that pass are turned into `u["name"]`. That\'s why the `if` can protect the front expression.',
          why: ['', 'The front expression only runs for items that passed the test.', 'Python does them in order per item: test, then transform.', 'Order is fixed by the syntax, not by length.'],
        },
      ],
    },
  ],
};
