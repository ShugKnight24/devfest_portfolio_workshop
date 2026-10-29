// Python course · lesson 15. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'collections',
  builds: ['python/dictionaries', 'python/sum-min-max-sort', 'js/reduce-and-sort', 'dsa/hash-maps-and-sets', 'dsa/stacks-and-queues'],
  title: 'Counter, defaultdict and deque',
  goal: 'Count with Counter, group with defaultdict, and use deque as a fast queue, instead of hand-writing the same loops.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Counting, the long way and the short way',
      md: `
In lesson 7 you counted things with a dict and \`.get\`:

~~~py
counts = {}
for fruit in ["apple", "pear", "apple"]:
    counts[fruit] = counts.get(fruit, 0) + 1
print(counts)
~~~

That loop is so common that the standard library has a dict built for it. \`Counter\` lives in the \`collections\` module:

~~~py
from collections import Counter

counts = Counter(["apple", "pear", "apple"])
print(counts)
print(counts["apple"])
print(counts["kiwi"])           # a missing key is 0, not a KeyError
print(counts.most_common(1))    # the top n as (item, count) pairs
~~~

A \`Counter\` **is** a dict (it inherits from \`dict\`), so everything from lesson 7 still works on it. It just adds the counting and \`most_common\`.

This is the "frequency map" from interview problems: count once in O(n), then answer questions about the counts.
`,
    },
    {
      type: 'predict',
      title: 'Counting letters',
      md: 'A string is a sequence of characters, so `Counter` counts its letters.',
      code: `from collections import Counter

c = Counter("banana")
print(c.most_common(2))
print(c["z"])`,
      output: `[('a', 3), ('n', 2)]
0`,
      explain: '"banana" has three `a`, two `n` and one `b`. `most_common(2)` returns a list of `(item, count)` tuples, biggest first. Asking for a letter that never appeared gives `0` instead of raising `KeyError`, which is the main convenience over a plain dict.',
    },
    {
      type: 'task',
      title: 'top_words',
      md: `
Write \`top_words(text, n)\` that returns the \`n\` most common words as \`(word, count)\` tuples. Lowercase the text first, and split on whitespace.

- \`top_words("the cat and the hat", 1)\` returns \`[("the", 2)]\`
- \`top_words("A a b", 2)\` returns \`[("a", 2), ("b", 1)]\`
`,
      starter: `from collections import Counter


def top_words(text, n):
    pass  # your code here
`,
      tests: [
        { name: 'the most common word in "the cat and the hat"', code: `eq(top_words("the cat and the hat", 1), [("the", 2)])` },
        { name: 'case is ignored', code: `eq(top_words("A a b", 2), [("a", 2), ("b", 1)])` },
      ],
      hint: '`text.lower().split()` gives the list of words (lesson 4). Pass that list to `Counter`, then call `.most_common(n)`.',
      solution: `from collections import Counter


def top_words(text, n):
    return Counter(text.lower().split()).most_common(n)
`,
    },
    {
      type: 'read',
      title: 'Grouping with defaultdict',
      md: `
Grouping is counting's cousin. By hand, you have to create each list the first time you see its key:

~~~py
groups = {}
for word in ["apple", "bean", "avocado"]:
    key = word[0]
    if key not in groups:
        groups[key] = []
    groups[key].append(word)
print(groups)
~~~

A \`defaultdict\` removes the \`if\`. You give it a function that makes the starting value, and it calls that function whenever you touch a missing key:

~~~py
from collections import defaultdict

groups = defaultdict(list)        # missing key -> a new empty list
for word in ["apple", "bean", "avocado"]:
    groups[word[0]].append(word)
print(dict(groups))
~~~

Pass the **function** \`list\`, not a list \`[]\`. Same reason as \`default_factory\` in lesson 14: it needs to make a **fresh** list for each key.

\`defaultdict(int)\` starts each missing key at \`0\` (because \`int()\` is \`0\`), which is another way to count.
`,
    },
    {
      type: 'predict',
      title: 'Just looking creates a key',
      code: `from collections import defaultdict

d = defaultdict(int)
d["x"] += 1
print(d["missing"])
print(len(d))
print(dict(d))`,
      output: `0
2
{'x': 1, 'missing': 0}`,
      explain: 'Reading `d["missing"]` with square brackets doesn\'t just return 0, it **stores** 0 under that key. That\'s why `len(d)` is 2. If you only want to look, use `d.get("missing")` or `"missing" in d`, which never create anything. This surprise is why you usually convert to a plain `dict(...)` before returning one.',
    },
    {
      type: 'task',
      title: 'group_by_first_letter',
      md: `
Write \`group_by_first_letter(words)\`. It returns a **plain dict** mapping each first letter to the words that start with it, in their original order.

- \`group_by_first_letter(["apple", "bean", "avocado"])\` returns \`{"a": ["apple", "avocado"], "b": ["bean"]}\`
- \`group_by_first_letter([])\` returns \`{}\`
`,
      starter: `from collections import defaultdict


def group_by_first_letter(words):
    pass  # your code here
`,
      tests: [
        { name: 'groups apple and avocado under "a"', code: `eq(group_by_first_letter(["apple", "bean", "avocado"]), {"a": ["apple", "avocado"], "b": ["bean"]})` },
        { name: 'an empty list gives an empty dict', code: `eq(group_by_first_letter([]), {})` },
        { name: 'the result is a plain dict', code: `eq(type(group_by_first_letter(["x"])), dict)` },
      ],
      hint: 'Copy the defaultdict example from the reading, and return `dict(groups)` at the end.',
      solution: `from collections import defaultdict


def group_by_first_letter(words):
    groups = defaultdict(list)
    for word in words:
        groups[word[0]].append(word)
    return dict(groups)
`,
    },
    {
      type: 'task',
      title: 'names_by_city',
      md: `
Same pattern, now with the lists of dicts from lesson 8. Write \`names_by_city(people)\` that groups each person's \`"name"\` under their \`"city"\`, as a plain dict.

~~~
people = [
    {"name": "Ada", "city": "London"},
    {"name": "Grace", "city": "New York"},
    {"name": "Alan", "city": "London"},
]
names_by_city(people)  # {"London": ["Ada", "Alan"], "New York": ["Grace"]}
~~~
`,
      starter: `from collections import defaultdict


def names_by_city(people):
    pass  # your code here
`,
      tests: [
        { name: 'groups Ada and Alan under London', code: `people = [{"name": "Ada", "city": "London"}, {"name": "Grace", "city": "New York"}, {"name": "Alan", "city": "London"}]
eq(names_by_city(people), {"London": ["Ada", "Alan"], "New York": ["Grace"]})` },
        { name: 'no people gives an empty dict', code: `eq(names_by_city([]), {})` },
      ],
      hint: 'The key is `person["city"]` and the thing you append is `person["name"]`. Everything else matches the previous task.',
      solution: `from collections import defaultdict


def names_by_city(people):
    groups = defaultdict(list)
    for person in people:
        groups[person["city"]].append(person["name"])
    return dict(groups)
`,
    },
    {
      type: 'read',
      title: 'deque: a real queue',
      md: `
A **queue** is first in, first out: people join at the back and leave from the front. You could use a list, with \`append\` to join and \`pop(0)\` to leave. The problem is \`pop(0)\`: removing the first item makes Python shift **every other item** one place left. That's O(n) per removal, which adds up fast in a loop.

A \`deque\` ("deck", a double-ended queue) adds and removes at **both** ends in O(1):

~~~py
from collections import deque

line = deque(["ana", "ben"])
line.append("cy")            # join at the back
first = line.popleft()       # leave from the front, O(1)
print(first, list(line))
~~~

| | list | deque |
|---|---|---|
| add or remove at the end | O(1) | O(1) |
| remove from the front | O(n), \`pop(0)\` | O(1), \`popleft()\` |
| read \`x[i]\` in the middle | O(1) | O(n) |

So: a list for indexing, a deque for queues. Breadth-first search, the classic graph walk, is a \`while queue:\` loop around \`popleft()\`.

One more trick: \`deque(maxlen=3)\` keeps only the **last 3** items. Appending a fourth silently drops the oldest from the front.
`,
    },
    {
      type: 'predict',
      title: 'Both ends',
      code: `from collections import deque

d = deque([2, 3])
d.appendleft(1)
d.append(4)
print(d.popleft(), d.pop())
print(list(d))

recent = deque(maxlen=2)
for page in ["home", "shop", "cart"]:
    recent.append(page)
print(list(recent))`,
      output: `1 4
[2, 3]
['shop', 'cart']`,
      explain: '`appendleft` adds at the front and `append` at the back, giving `[1, 2, 3, 4]`. `popleft` takes `1` and `pop` takes `4`. With `maxlen=2`, adding `"cart"` pushed `"home"` out of the front.',
    },
    {
      type: 'task',
      title: 'last_n',
      md: `
Write \`last_n(events, n)\` that returns the last \`n\` events as a list, using a \`deque\` with \`maxlen\`.

- \`last_n(["a", "b", "c", "d"], 2)\` returns \`["c", "d"]\`
- \`last_n(["a"], 3)\` returns \`["a"]\`
`,
      starter: `from collections import deque


def last_n(events, n):
    pass  # your code here
`,
      tests: [
        { name: 'keeps the last 2 of 4', code: `eq(last_n(["a", "b", "c", "d"], 2), ["c", "d"])` },
        { name: 'fewer events than n keeps them all', code: `eq(last_n(["a"], 3), ["a"])` },
      ],
      hint: '`deque(events, maxlen=n)` builds the deque and trims it in one go. Wrap it in `list(...)` to return a list.',
      solution: `from collections import deque


def last_n(events, n):
    return list(deque(events, maxlen=n))
`,
    },
    {
      type: 'task',
      title: 'first_unique: count, then scan',
      md: `
A classic interview question. Write \`first_unique(text)\` that returns the first character appearing exactly **once**, or \`None\` if there isn't one.

- \`first_unique("swiss")\` returns \`"w"\`
- \`first_unique("aabb")\` returns \`None\`

The two-pass plan: count every character with \`Counter\`, then loop over \`text\` **in order** and return the first one whose count is 1. That's O(n), where checking \`text.count(ch)\` for every character would be O(n²).
`,
      starter: `from collections import Counter


def first_unique(text):
    pass  # your code here
`,
      tests: [
        { name: '"swiss" gives "w"', code: `eq(first_unique("swiss"), "w")` },
        { name: '"aabb" gives None', code: `eq(first_unique("aabb"), None)` },
        { name: '"abc" gives "a"', code: `eq(first_unique("abc"), "a")` },
      ],
      hint: '`counts = Counter(text)`, then `for ch in text: if counts[ch] == 1: return ch`. After the loop, `return None`.',
      solution: `from collections import Counter


def first_unique(text):
    counts = Counter(text)
    for ch in text:
        if counts[ch] == 1:
            return ch
    return None
`,
      explain: 'Loop over `text`, not over `counts`, so "first" means first in the original string.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'What does `Counter("hello")["z"]` give?',
          choices: ['`0`', 'A `KeyError`', '`None`', '`1`'],
          answer: 0,
          explain: 'A Counter treats a missing key as a count of 0.',
          why: { 1: 'That is what a plain dict does. Counter is friendlier.', 2: 'Counts are numbers, so missing means 0.', 3: '"z" never appears in "hello".' },
        },
        {
          q: 'Why `defaultdict(list)` and not `defaultdict([])`?',
          choices: ['It needs a function to call for each new key, so each key gets its own new list', 'They mean the same thing', '`[]` is not allowed inside parentheses', '`list` is faster to type'],
          answer: 0,
          explain: 'defaultdict calls the function you give it every time a key is missing. `[]` is one list, not a way to make lists.',
          why: { 1: '`defaultdict([])` raises a TypeError: the first argument must be callable.', 2: 'You can pass a list anywhere. It just is not a factory.', 3: 'The reason is about behavior, not typing.' },
        },
        {
          q: 'Why prefer `deque.popleft()` over `list.pop(0)` for a queue?',
          choices: ['`popleft` is O(1); `pop(0)` shifts every remaining item, O(n)', '`pop(0)` removes the last item', '`list.pop(0)` raises an error', 'A deque uses less memory for indexing'],
          answer: 0,
          explain: 'A deque is built to add and remove at both ends in constant time.',
          why: { 1: '`pop(0)` removes the first item. It is just slow.', 2: 'It works, it is just O(n).', 3: 'Indexing into the middle of a deque is actually slower than a list.' },
        },
        {
          q: 'You read `d["k"]` on a `defaultdict(int)` that has no "k". What happens to `d`?',
          choices: ['It now contains `"k": 0`', 'Nothing changes', 'It raises KeyError', 'It removes "k"'],
          answer: 0,
          explain: 'Square-bracket access on a missing key creates it with the default. Use `.get` or `in` to look without creating.',
          why: { 1: 'That is the surprise: reading a missing key stores the default.', 2: 'A defaultdict never raises KeyError on `[]` access.', 3: 'There was no "k" to remove.' },
        },
      ],
    },
  ],
};
