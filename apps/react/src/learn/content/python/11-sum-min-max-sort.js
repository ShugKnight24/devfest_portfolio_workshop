// Python course · lesson 11. Step types: read, predict, task, check (see ../index.js).
// Runnable read blocks are ~~~py and must run cleanly; plain ~~~ blocks are fragments.
export default {
  id: 'sum-min-max-sort',
  builds: ['python/filter-find-any-all', 'js/reduce-and-sort'],
  title: 'sum, min, max, counting and sorting',
  goal: 'Boil a whole list down to one answer, count things into a dict, and sort by any key without changing the original.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The problem: many items in, one answer out',
      md: `
Lessons 9 and 10 gave you lists back. Sometimes you want **one value** out of a whole list: a total, the biggest, a count per word.

In lesson 8 you did it with a loop and a variable you carried along:

~~~py
nums = [4, 1, 5]

total = 0              # 1. start somewhere
for n in nums:         # 2. go through each item
    total = total + n  # 3. combine it into what you have so far
print(total)
~~~

That variable is called the **accumulator**: a running total you carry from item to item. Picture a box. You start with \`0\` in it, and each item updates what's in the box. At the end, the box is the answer.
`,
    },
    {
      type: 'predict',
      title: 'Trace the box',
      md: 'Same pattern, but multiplying. Follow the box one item at a time.',
      code: `box = 1
for n in [2, 3, 4]:
    box = box * n
    print("box is now", box)
print(box)`,
      output: `box is now 2
box is now 6
box is now 24
24`,
      explain: 'Start `1`, then `1 * 2 = 2`, `2 * 3 = 6`, `6 * 4 = 24`. The starting value matters: start at `0` and every product would be `0`. Adding starts at `0`, multiplying starts at `1`.',
    },
    {
      type: 'task',
      title: 'Build reduce yourself',
      md: `
The loop above has three parts that change: the **start value**, the **combine step**, and the list. Pass all three in and you get a general tool, usually called *reduce*:

\`my_reduce(items, combine, start)\`:

~~~
my_reduce([1, 2, 3], add, 0)        → 6     (0+1, then +2, then +3)
my_reduce([2, 3, 4], multiply, 1)   → 24
~~~

\`combine\` takes two arguments: **what you have so far** and **the current item**, and returns the new "so far".
`,
      starter: `def my_reduce(items, combine, start):
    pass  # your code here
`,
      tests: [
        { name: 'adds with start 0', code: `eq(my_reduce([1, 2, 3], lambda acc, n: acc + n, 0), 6)` },
        { name: 'multiplies with start 1', code: `eq(my_reduce([2, 3, 4], lambda acc, n: acc * n, 1), 24)` },
        { name: 'an empty list gives the start value', code: `eq(my_reduce([], lambda acc, n: acc + n, 0), 0)` },
        { name: 'keeps the bigger one (max)', code: `eq(my_reduce([3, 9, 2], lambda acc, n: n if n > acc else acc, 0), 9)` },
      ],
      hint: '`acc = start`, then `for item in items:` with `acc = combine(acc, item)`. Return `acc` after the loop. It\'s the box from the last step, with the combine step passed in.',
      solution: `def my_reduce(items, combine, start):
    acc = start                  # the box starts with the start value
    for item in items:
        acc = combine(acc, item)  # the callback decides how to combine
    return acc
`,
      explain: 'Python has this as `functools.reduce`, but you\'ll rarely need it: for the common cases there are built-ins, which is what the rest of this lesson is about.',
    },
    {
      type: 'read',
      title: 'The built-ins: sum, math.prod, min, max',
      md: `
The most common accumulators are built in:

~~~py
import math

nums = [4, 1, 5]
print(sum(nums))        # add them all, starting at 0
print(math.prod(nums))  # multiply them all, starting at 1
print(min(nums), max(nums))
~~~

They also take a **generator**, so you can total a field without building a list first:

~~~py
users = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 17}]
print(sum(u["age"] for u in users))
~~~

Read it: "the sum of the user's age, for each user".
`,
    },
    {
      type: 'task',
      title: 'total',
      md: `
**Example** (already solved):

~~~
def average(nums):
    return sum(nums) / len(nums)
~~~

**Your turn:** \`total([1, 2, 3])\` returns \`6\`, and \`total([])\` returns \`0\`.
`,
      starter: `def total(nums):
    pass  # your code here
`,
      tests: [
        { name: 'total([1, 2, 3]) is 6', code: `eq(total([1, 2, 3]), 6)` },
        { name: 'total([]) is 0', code: `eq(total([]), 0)` },
      ],
      hint: '`sum(nums)` already starts at 0, so the empty case works on its own.',
      solution: `def total(nums):
    return sum(nums)
`,
    },
    {
      type: 'task',
      title: 'product',
      md: `\`product([2, 3, 4])\` returns \`24\`. \`math\` is imported for you at the top.`,
      starter: `import math

def product(nums):
    pass  # your code here
`,
      tests: [
        { name: 'product([2, 3, 4]) is 24', code: `eq(product([2, 3, 4]), 24)` },
        { name: 'product([5]) is 5', code: `eq(product([5]), 5)` },
      ],
      hint: '`math.prod(nums)`.',
      solution: `import math

def product(nums):
    return math.prod(nums)
`,
    },
    {
      type: 'predict', throws: true,
      title: 'The max of nothing',
      md: '`sum([])` is `0`. What about `max([])`?',
      code: `print(sum([]))
print(max([]))`,
      output: `0
! ValueError: max() iterable argument is empty (line 2)`,
      explain: `
\`sum\` has a natural starting value (0), so an empty list is fine. \`max\` doesn't: there is no "biggest" of nothing, so it raises an error.

When the list might be empty, give \`max\`/\`min\` a fallback: \`max(nums, default=0)\`. This is the same idea as the start value in \`my_reduce\`.
`,
    },
    {
      type: 'task',
      title: 'max_of',
      md: `
**Example:**

~~~
def min_of(nums):
    return min(nums)
~~~

**Your turn:** \`max_of([3, 9, 2])\` returns \`9\`, and \`max_of([-5, -1])\` returns \`-1\`.
`,
      starter: `def max_of(nums):
    pass  # your code here
`,
      tests: [
        { name: 'max_of([3, 9, 2]) is 9', code: `eq(max_of([3, 9, 2]), 9)` },
        { name: 'works with negative numbers', code: `eq(max_of([-5, -1]), -1)` },
      ],
      hint: '`max(nums)`.',
      solution: `def max_of(nums):
    return max(nums)
`,
    },
    {
      type: 'task',
      title: 'total_age',
      md: `
**Example:** sum over a field with a generator.

~~~
def total_ids(users):
    return sum(u["id"] for u in users)
~~~

**Your turn:** \`total_age(users)\` returns \`98\` for Ada (36), Linus (17) and Grace (45).
`,
      starter: `def total_age(users):
    pass  # your code here
`,
      tests: [
        {
          name: 'total_age(users) is 98',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}, {"id": 2, "name": "Linus", "age": 17, "active": False}, {"id": 3, "name": "Grace", "age": 45, "active": True}]
eq(total_age(users), 98)`,
        },
      ],
      hint: 'Same as `total_ids`, with `u["age"]`.',
      solution: `def total_age(users):
    return sum(u["age"] for u in users)
`,
    },
    {
      type: 'read',
      title: 'min and max with key=: the cheapest product',
      md: `
\`max(users)\` can't work: how would Python know which dict is "biggest"? You tell it, by passing a function as \`key\`:

~~~py
products = [{"name": "pen", "price": 2}, {"name": "cup", "price": 1}, {"name": "mug", "price": 5}]

cheapest = min(products, key=lambda p: p["price"])
print(cheapest)
print(cheapest["name"])
~~~

- \`key=\` is a callback (lesson 9): Python calls it on each item and compares the **results**.
- You get back the **whole item** (the dict), not the price. Take \`["name"]\` from it if you want the name.
- \`lambda p: p["price"]\` is a tiny unnamed function: "given p, return p's price". It's the same as a \`def\` with one \`return\` line.
`,
    },
    {
      type: 'task',
      title: 'cheapest_name',
      md: `
**Example:**

~~~
def oldest(users):
    return max(users, key=lambda u: u["age"])
~~~

**Your turn:** \`cheapest_name([{"name": "pen", "price": 2}, {"name": "cup", "price": 1}])\` returns \`"cup"\`. Note: the **name**, not the whole dict.
`,
      starter: `def cheapest_name(products):
    pass  # your code here
`,
      tests: [
        { name: 'returns "cup"', code: `eq(cheapest_name([{"name": "pen", "price": 2}, {"name": "cup", "price": 1}]), "cup")` },
        { name: 'works when the cheapest is first', code: `eq(cheapest_name([{"name": "a", "price": 1}, {"name": "b", "price": 9}]), "a")` },
      ],
      hint: '`min(products, key=lambda p: p["price"])` gives the cheapest dict; add `["name"]` on the end.',
      solution: `def cheapest_name(products):
    return min(products, key=lambda p: p["price"])["name"]
`,
    },
    {
      type: 'read',
      title: 'Counting into a dict',
      md: `
Sometimes the box is a **dict**: one count per word. Start with \`{}\` and update one key per item:

~~~py
words = ["a", "b", "a"]

counts = {}
for w in words:
    counts[w] = counts.get(w, 0) + 1
print(counts)
~~~

\`counts.get(w, 0)\` means "the current count for \`w\`, or 0 if we haven't seen it yet" (lesson 7).

| \`w\` | \`counts.get(w, 0)\` | \`counts\` after |
|---|---|---|
| | | \`{}\` |
| \`"a"\` | \`0\` | \`{"a": 1}\` |
| \`"b"\` | \`0\` | \`{"a": 1, "b": 1}\` |
| \`"a"\` | \`1\` | \`{"a": 2, "b": 1}\` |

Aside: Python ships a ready-made counter, \`collections.Counter(words)\`. Know the loop first; interviewers often ask you to write it.
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Without .get',
      md: 'Same loop, but reading the key directly.',
      code: `counts = {}
for w in ["a", "b", "a"]:
    counts[w] = counts[w] + 1
print(counts)`,
      output: `! KeyError: 'a' (line 3)`,
      explain: 'The very first `"a"` isn\'t in the dict yet, so `counts["a"]` raises KeyError. `.get(w, 0)` supplies the 0 for words you haven\'t seen.',
    },
    {
      type: 'task',
      title: 'count_words',
      md: `
**Example:** build a dict in a loop.

~~~
def lengths_by_word(words):
    out = {}
    for w in words:
        out[w] = len(w)
    return out
~~~

**Your turn:** \`count_words(["a", "b", "a"])\` returns \`{"a": 2, "b": 1}\`, and \`count_words([])\` returns \`{}\`.
`,
      starter: `def count_words(words):
    pass  # your code here
`,
      tests: [
        { name: 'counts repeated words', code: `eq(count_words(["a", "b", "a"]), {"a": 2, "b": 1})` },
        { name: 'an empty list gives {}', code: `eq(count_words([]), {})` },
      ],
      hint: 'Start `counts = {}`, loop, and inside: `counts[w] = counts.get(w, 0) + 1`. Return `counts` after the loop.',
      solution: `def count_words(words):
    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1  # 0 for a word we haven't seen yet
    return counts
`,
    },
    {
      type: 'read',
      title: 'Sorting: sorted() vs .sort()',
      md: `
Two ways to sort, and the difference matters:

- \`sorted(items)\` returns a **new** sorted list. The original is untouched.
- \`items.sort()\` sorts the list **in place** and returns \`None\`.

~~~py
nums = [3, 1, 2]
print(sorted(nums), nums)
~~~

Sort by a field with \`key=\`, exactly like \`min\` and \`max\`. Biggest first with \`reverse=True\`:

~~~py
users = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 17}, {"name": "Grace", "age": 45}]

print([u["name"] for u in sorted(users, key=lambda u: u["age"])])
print([u["name"] for u in sorted(users, key=lambda u: u["age"], reverse=True)])
~~~
`,
    },
    {
      type: 'predict',
      title: 'The .sort() trap',
      code: `nums = [3, 1, 2]
result = nums.sort()
print(result)
print(nums)`,
      output: `None
[1, 2, 3]`,
      explain: '`.sort()` changes the list itself and returns `None`, so `result = nums.sort()` throws the sorted list away. If you need the sorted list as a value (or must not change the original), use `sorted(nums)`.',
    },
    {
      type: 'task',
      title: 'sort_by_age',
      md: `
**Example:**

~~~
def sort_by_name(users):
    return sorted(users, key=lambda u: u["name"])
~~~

**Your turn:** \`sort_by_age(users)\` returns a **new** list, youngest first: Linus, Ada, Grace. The original list must keep its order.
`,
      starter: `def sort_by_age(users):
    pass  # your code here
`,
      tests: [
        {
          name: 'youngest first',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}, {"id": 2, "name": "Linus", "age": 17, "active": False}, {"id": 3, "name": "Grace", "age": 45, "active": True}]
eq([u["name"] for u in sort_by_age(users)], ["Linus", "Ada", "Grace"])`,
        },
        {
          name: 'the original list keeps its order',
          code: `users = [{"id": 1, "name": "Ada", "age": 36, "active": True}, {"id": 2, "name": "Linus", "age": 17, "active": False}]
sort_by_age(users)
eq([u["name"] for u in users], ["Ada", "Linus"], "the original list was reordered: use sorted(), not .sort()")`,
        },
      ],
      hint: 'Same as `sort_by_name`, with `u["age"]`. Use `sorted(...)`, not `.sort()`.',
      solution: `def sort_by_age(users):
    return sorted(users, key=lambda u: u["age"])  # sorted() leaves the original alone
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'In `my_reduce(items, combine, start)`, what are the two arguments `combine` receives?',
          choices: ['What you have so far, and the current item', 'The current item, and its index', 'The first item, and the last item', 'The whole list, and the start value'],
          answer: 0,
          explain: 'The accumulator (the box) and one item. It returns the new "so far".',
          why: ['', 'That\'s what `enumerate` gives you. Reduce passes the running result.', 'It sees every item, one at a time, not just the ends.', 'It\'s called once per item, with one item.'],
        },
        {
          q: 'What does `max([])` do?',
          choices: ['Raises ValueError', 'Returns `0`', 'Returns `None`', 'Returns `[]`'],
          answer: 0,
          explain: 'There\'s no biggest of nothing. Use `max(nums, default=0)` when the list might be empty.',
          why: ['', '`sum([])` is 0, but `max` has no natural starting value.', 'It doesn\'t quietly return `None`; it raises unless you pass `default=`.', '`max` returns one item, never a list.'],
        },
        {
          q: 'What does `min(products, key=lambda p: p["price"])` return?',
          choices: ['The whole cheapest product dict', 'The lowest price', 'The name of the cheapest product', 'A sorted list of products'],
          answer: 0,
          explain: '`key=` only decides how to compare; you get back the original item. Add `["name"]` or `["price"]` to pick a field.',
          why: ['', 'Prices are what get compared, but the item itself comes back.', 'You\'d need `[...]["name"]` on the end for that.', 'That\'s `sorted(...)`. `min` returns one item.'],
        },
        {
          q: '`result = nums.sort()`. What is `result`?',
          choices: ['`None`', 'The sorted list', 'A copy of the original list', 'An error'],
          answer: 0,
          explain: '`.sort()` sorts in place and returns `None`. Use `sorted(nums)` for a new sorted list.',
          why: ['', '`nums` is sorted now, but `.sort()` itself returns `None`.', 'Nothing is copied; `.sort()` changes `nums`.', 'It runs fine, it just returns `None`.'],
        },
        {
          q: 'Why does `counts[w] = counts[w] + 1` crash on the first word?',
          choices: ['The key isn\'t in the dict yet, so reading it raises KeyError', 'Dicts can\'t store numbers', 'You can\'t assign to a dict inside a loop', 'Strings can\'t be dict keys'],
          answer: 0,
          explain: '`counts.get(w, 0) + 1` reads 0 for a word you haven\'t seen yet.',
          why: ['', 'Dict values can be anything, including numbers.', 'Assigning inside a loop is fine; reading the missing key is the problem.', 'Strings are the most common dict keys.'],
        },
      ],
    },
  ],
};
