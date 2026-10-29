// Python course · lesson 5. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~py get a Run button, so they must run cleanly).
export default {
  id: 'lists',
  builds: ['python/strings', 'js/arrays'],
  title: 'Lists',
  goal: 'Store many values in order, read them by position, and add to a list without breaking the original.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'A list is a numbered row of boxes',
      md: `
So far every variable held **one** value. A **list** holds many, in order, inside square brackets:

~~~py
scores = [90, 72, 85]
names = ["Ada", "Linus", "Grace"]
empty = []

print(scores)
print(names)
print(empty)
~~~

Picture a row of boxes. Each box has a **position number**, called an **index**, and the numbering starts at **0**, not 1:

| index | 0 | 1 | 2 |
|---|---|---|---|
| value | \`"Ada"\` | \`"Linus"\` | \`"Grace"\` |

You read a box with square brackets after the name: \`names[0]\` is \`"Ada"\`.

Lists show up everywhere: rows from a database, items in a cart, results from an API.
`,
    },
    {
      type: 'predict',
      title: 'Reading by index',
      md: 'Remember: counting starts at 0.',
      code: `names = ["Ada", "Linus", "Grace"]

print(names[0])
print(names[2])
print(names[1])`,
      output: `Ada
Grace
Linus`,
      explain: `
\`names[0]\` is the **first** box, \`names[1]\` the second, \`names[2]\` the third.

A handy way to think of it: the index is "how many steps from the start". The first item is zero steps away.
`,
    },
    {
      type: 'task',
      title: 'first',
      md: `
**Example** (already solved):

~~~
def second(arr):
    return arr[1]
~~~

**Your turn:** \`first([10, 20, 30])\` returns \`10\`.
`,
      starter: `def first(arr):
    pass  # your code here
`,
      tests: [
        { name: 'first([10, 20, 30]) is 10', code: `eq(first([10, 20, 30]), 10)` },
        { name: 'first(["only"]) is "only"', code: `eq(first(["only"]), "only")` },
      ],
      hint: 'Same as `second`, but the first item is at index `0`.',
      solution: `def first(arr):
    return arr[0]  # index 0 is the first item
`,
    },
    {
      type: 'read',
      title: 'len, and counting from the end',
      md: `
\`len(x)\` tells you how many items a list has:

~~~py
names = ["Ada", "Linus", "Grace"]
print(len(names))
print(len([]))
~~~

Python has a shortcut for the end of a list: **negative indexes** count backwards. \`-1\` is the last item, \`-2\` the one before it.

~~~py
names = ["Ada", "Linus", "Grace"]
print(names[-1])
print(names[-2])
~~~

| index | 0 | 1 | 2 |
|---|---|---|---|
| negative index | -3 | -2 | -1 |
| value | \`"Ada"\` | \`"Linus"\` | \`"Grace"\` |

So "the last item" is always \`arr[-1]\`, no matter how long the list is.
`,
    },
    {
      type: 'task',
      title: 'last',
      md: `\`last([10, 20, 30])\` returns \`30\`. It must work for a list of any length, including a list with one item.`,
      starter: `def last(arr):
    pass  # your code here
`,
      tests: [
        { name: 'last([10, 20, 30]) is 30', code: `eq(last([10, 20, 30]), 30)` },
        { name: 'last(["only"]) is "only"', code: `eq(last(["only"]), "only")` },
        { name: 'works for a longer list', code: `eq(last([1, 2, 3, 4, 5, 6]), 6)` },
      ],
      hint: 'A negative index counts from the end. Which one is the very last item?',
      solution: `def last(arr):
    return arr[-1]  # -1 always means "the last item"
`,
    },
    {
      type: 'task',
      title: 'count',
      md: `\`count([10, 20, 30])\` returns \`3\`, and \`count([])\` returns \`0\`.`,
      starter: `def count(arr):
    pass  # your code here
`,
      tests: [
        { name: 'count([10, 20, 30]) is 3', code: `eq(count([10, 20, 30]), 3)` },
        { name: 'count([]) is 0', code: `eq(count([]), 0)` },
      ],
      hint: 'Python has a built-in function that gives the number of items: `len(...)`.',
      solution: `def count(arr):
    return len(arr)
`,
    },
    {
      type: 'predict', throws: true,
      title: 'The off-by-one trap',
      md: 'The list has 3 items. What happens when you ask for index 3?',
      code: `names = ["Ada", "Linus", "Grace"]
print(len(names))
print(names[3])`,
      output: `3
! IndexError: list index out of range (line 3)`,
      explain: `
The list has **3** items, but the indexes are **0, 1 and 2**. There is no box number 3, so Python stops with \`IndexError: list index out of range\`.

The last index is always \`len(names) - 1\`. That's the classic **off-by-one** mistake: mixing up "how many" with "the last position". \`names[-1]\` sidesteps it completely.
`,
    },
    {
      type: 'read',
      title: 'Is it in there? in',
      md: `
\`x in some_list\` asks "is this value somewhere in the list?" and gives back \`True\` or \`False\`:

~~~py
names = ["Ada", "Linus", "Grace"]

print("Ada" in names)
print("Bob" in names)
print("Bob" not in names)
~~~

It compares with \`==\`, so \`"ada"\` (lowercase) would **not** be found: strings must match exactly.

You can use it straight in an \`if\`:

~~~py
cart = ["milk", "eggs"]
if "milk" in cart:
    print("got milk")
~~~
`,
    },
    {
      type: 'task',
      title: 'contains',
      md: `
**Example:**

~~~
def has_zero(arr):
    return 0 in arr
~~~

**Your turn:** \`contains([1, 2, 3], 2)\` returns \`True\`, and \`contains([1, 2, 3], 9)\` returns \`False\`.
`,
      starter: `def contains(arr, x):
    pass  # your code here
`,
      tests: [
        { name: 'contains([1, 2, 3], 2) is True', code: `eq(contains([1, 2, 3], 2), True)` },
        { name: 'contains([1, 2, 3], 9) is False', code: `eq(contains([1, 2, 3], 9), False)` },
      ],
      hint: 'Same as `has_zero`, but look for `x` instead of `0`. No `if` needed: `x in arr` already is `True` or `False`.',
      solution: `def contains(arr, x):
    return x in arr  # already a bool, so return it directly
`,
    },
    {
      type: 'read',
      title: 'Adding items: change it, or build a new one?',
      md: `
There are two ways to "add" to a list, and they behave very differently.

**\`append\` changes the list itself** (in place) and returns \`None\`:

~~~py
nums = [1, 2]
nums.append(3)
print(nums)
~~~

**\`+\` builds a brand-new list** and leaves both originals alone:

~~~py
nums = [1, 2]
bigger = nums + [3]
print(nums)
print(bigger)
~~~

Notice \`nums + [3]\` and not \`nums + 3\`: \`+\` joins **two lists**, so the new item goes in its own brackets.

Why care? When a function receives a list from someone else, changing it with \`append\` changes **their** list too. Building a new one is safer, and later (in React state, or in data pipelines) it's the rule.
`,
    },
    {
      type: 'predict',
      title: 'Two names, one list',
      md: '`b = a` looks like a copy. Is it?',
      code: `a = [1, 2]
b = a
b.append(3)
print(a)
print(b)`,
      output: `[1, 2, 3]
[1, 2, 3]`,
      explain: `
\`b = a\` does **not** copy the list. It gives the **same list** a second name. There's one list in memory with two labels on it, so appending through \`b\` is visible through \`a\`.

You'll go much deeper into this in lesson 7 (dictionaries behave the same way). For now: \`=\` never copies a list.
`,
    },
    {
      type: 'predict',
      title: 'A real new list',
      code: `a = [1, 2]
b = a + [3]
print(a)
print(b)
print(a is b)`,
      output: `[1, 2]
[1, 2, 3]
False`,
      explain: `
\`a + [3]\` built a **new** list, so \`a\` is untouched. \`a is b\` asks "are these the very same list in memory?" and the answer is \`False\`.

(\`==\` asks "same contents?", \`is\` asks "same object?". You'll rarely need \`is\` except for \`x is None\`.)
`,
    },
    {
      type: 'task',
      title: 'add_to_end',
      md: `
**Example:** builds a **new** list; the one passed in is not changed.

~~~
def add_to_start(arr, x):
    return [x] + arr
~~~

**Your turn:** \`add_to_end([1, 2], 3)\` returns \`[1, 2, 3]\` as a **new** list. Don't change \`arr\`.
`,
      starter: `def add_to_end(arr, x):
    pass  # your code here
`,
      tests: [
        { name: 'add_to_end([1, 2], 3) is [1, 2, 3]', code: `eq(add_to_end([1, 2], 3), [1, 2, 3])` },
        {
          name: 'the original list is not changed',
          code: `original = [1, 2]
add_to_end(original, 3)
eq(original, [1, 2], "the list passed in changed: build a new list with + instead of append")`,
        },
      ],
      hint: 'Mirror the example: put `arr` first and `[x]` second, joined with `+`.',
      solution: `def add_to_end(arr, x):
    return arr + [x]  # + builds a new list; append would change the caller's list
`,
    },
    {
      type: 'read',
      title: 'Copying a piece: slicing',
      md: `
A **slice** \`arr[start:stop]\` gives you a **new list** with a range of items. The \`stop\` index is **not included**:

~~~py
nums = [10, 20, 30, 40, 50]

print(nums[1:3])   # indexes 1 and 2
print(nums[:2])    # from the start up to (not including) 2
print(nums[2:])    # from index 2 to the end
print(nums[-2:])   # the last two
~~~

Leaving out \`start\` means "from the beginning", leaving out \`stop\` means "to the end".

A nice property: slicing never raises \`IndexError\`. Asking for more than exists just gives you what's there.

~~~py
print([1, 2][:10])
~~~
`,
    },
    {
      type: 'task',
      title: 'first_three',
      md: `
**Example:**

~~~
def first_two(arr):
    return arr[:2]
~~~

**Your turn:** \`first_three([1, 2, 3, 4, 5])\` returns \`[1, 2, 3]\`. If the list is shorter, return what's there: \`first_three([1])\` is \`[1]\`.
`,
      starter: `def first_three(arr):
    pass  # your code here
`,
      tests: [
        { name: 'first_three([1, 2, 3, 4, 5]) is [1, 2, 3]', code: `eq(first_three([1, 2, 3, 4, 5]), [1, 2, 3])` },
        { name: 'first_three([1]) is [1]', code: `eq(first_three([1]), [1])` },
      ],
      hint: 'Same as `first_two`, with `3`. The stop number is not included, so `[:3]` gives indexes 0, 1 and 2.',
      solution: `def first_three(arr):
    return arr[:3]  # slicing never errors on short lists
`,
    },
    {
      type: 'predict',
      title: 'Slicing makes a copy',
      code: `nums = [1, 2, 3]
copy = nums[:]
copy.append(4)
print(nums)
print(copy)`,
      output: `[1, 2, 3]
[1, 2, 3, 4]`,
      explain: `
\`nums[:]\` is a slice from start to end, so it's a **new list** with the same items. Appending to the copy leaves \`nums\` alone.

Compare with \`b = a\` from earlier, which shared one list. \`nums[:]\` and \`list(nums)\` both make a real (shallow) copy.
`,
    },
    {
      type: 'task',
      title: 'is_empty',
      md: `\`is_empty([])\` returns \`True\`, and \`is_empty([1])\` returns \`False\`. Return a real \`True\`/\`False\`, not the list itself.`,
      starter: `def is_empty(arr):
    pass  # your code here
`,
      tests: [
        { name: 'is_empty([]) is True', code: `eq(is_empty([]), True)` },
        { name: 'is_empty([1]) is False', code: `eq(is_empty([1]), False)` },
      ],
      hint: 'An empty list has length 0. Compare: `len(arr) == 0`.',
      solution: `def is_empty(arr):
    return len(arr) == 0  # a comparison gives a real True/False
`,
      explain: 'You will also see `not arr`, because an empty list is falsy. Both work; `len(arr) == 0` says exactly what it means.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer. A wrong pick tells you why.',
      items: [
        {
          q: '`names = ["Ada", "Linus", "Grace"]`. What is `names[1]`?',
          choices: ['`"Ada"`', '`"Linus"`', '`"Grace"`', 'An `IndexError`'],
          answer: 1,
          explain: 'Indexes start at 0, so index 1 is the **second** item.',
          why: ['That is `names[0]`: counting starts at 0.', '', 'That is `names[2]` (or `names[-1]`).', 'Index 1 exists; only index 3 or higher would be out of range.'],
        },
        {
          q: 'Which expression always gives the last item of a non-empty list `arr`?',
          choices: ['`arr[len(arr)]`', '`arr[-1]`', '`arr[0]`', '`arr[last]`'],
          answer: 1,
          explain: 'Negative indexes count from the end; `-1` is the last item.',
          why: ['That is one past the end, so it raises `IndexError`. The last index is `len(arr) - 1`.', '', 'That is the first item.', '`last` is not a Python keyword; it would be a `NameError`.'],
        },
        {
          q: 'After `a = [1, 2]`, `b = a`, `b.append(3)`, what is `a`?',
          choices: ['`[1, 2]`', '`[1, 2, 3]`', '`[3]`'],
          answer: 1,
          explain: '`b = a` gives the same list a second name. Changing it through `b` changes what `a` sees.',
          why: ['That would be true only if `b` were a copy, like `a[:]` or `a + [3]`.', '', '`append` adds to the end; it doesn\'t replace the list.'],
        },
        {
          q: 'Which one adds `3` **without** changing the original list `nums`?',
          choices: ['`nums.append(3)`', '`nums + [3]`', '`nums + 3`', '`nums[3] = 3`'],
          answer: 1,
          explain: '`+` joins two lists into a brand-new one and leaves both originals alone.',
          why: ['`append` changes `nums` in place (and returns `None`).', '', '`+` needs two lists; adding a list and a number raises `TypeError`.', 'That assigns to index 3, which doesn\'t exist yet: `IndexError`.'],
        },
        {
          q: 'What is `[10, 20, 30, 40][1:3]`?',
          choices: ['`[10, 20, 30]`', '`[20, 30, 40]`', '`[20, 30]`', '`[20]`'],
          answer: 2,
          explain: 'A slice includes `start` and stops **before** `stop`: indexes 1 and 2.',
          why: ['That would be `[0:3]` or `[:3]`.', 'That would be `[1:]` or `[1:4]`: the stop index is not included.', '', 'That would be `[1:2]`.'],
        },
      ],
    },
  ],
};
