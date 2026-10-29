// Python course · lesson 6. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~py get a Run button, so they must run cleanly).
export default {
  id: 'loops',
  builds: ['python/lists', 'js/loops'],
  title: 'Loops',
  goal: 'Repeat work with for loops: count with range, walk a list, keep a running total, and build a new list.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'for: do something with each item',
      md: `
A \`for\` loop runs the same indented block once for **each item** in a list:

~~~py
names = ["Ada", "Linus", "Grace"]

for name in names:
    print("Hello", name)

print("done")
~~~

Read it as English: "for each \`name\` in \`names\`, do the indented lines."

- \`name\` is a variable **you** pick. Each trip around the loop, it holds the next item.
- The **indented** lines are the body. The first line that's not indented (\`print("done")\`) runs once, after the loop.
- The colon \`:\` at the end of the \`for\` line is required.
`,
    },
    {
      type: 'predict',
      title: 'What runs inside, and what runs after?',
      md: 'Watch the indentation.',
      code: `for n in [1, 2, 3]:
    print(n * 10)
print("end")`,
      output: `10
20
30
end`,
      explain: `
The indented \`print(n * 10)\` runs **three times**, once per item. \`print("end")\` isn't indented, so it's outside the loop and runs **once**, at the end.

In Python, indentation **is** the structure. Moving a line four spaces left or right changes what the program does.
`,
    },
    {
      type: 'read',
      title: 'Counting with range',
      md: `
When you need numbers rather than items, use \`range\`. \`range(start, stop)\` counts from \`start\` up to, but **not including**, \`stop\`:

~~~py
for i in range(1, 4):
    print(i)
~~~

That prints 1, 2, 3. **Not 4.** The stop number is excluded, just like in slicing (\`arr[1:4]\`).

| You write | You get |
|---|---|
| \`range(5)\` | 0, 1, 2, 3, 4 |
| \`range(1, 5)\` | 1, 2, 3, 4 |
| \`range(1, n + 1)\` | 1, 2, ..., n |
| \`range(0, 10, 2)\` | 0, 2, 4, 6, 8 (the third number is the step) |

So "1 up to and including n" is \`range(1, n + 1)\`.
`,
    },
    {
      type: 'predict',
      title: 'Where does range stop?',
      code: `for i in range(2, 5):
    print(i)`,
      output: `2
3
4`,
      explain: '`range(2, 5)` starts at 2 and stops **before** 5. If you wanted 5 included, you\'d write `range(2, 6)`.',
    },
    {
      type: 'read',
      title: 'The accumulator: a running total',
      md: `
The most useful loop pattern: keep a variable **outside** the loop, and update it **inside** the loop.

~~~py
nums = [4, 5, 6]

total = 0           # 1. start the total before the loop
for n in nums:
    total = total + n   # 2. add each item to it
print(total)        # 3. use it after the loop
~~~

Trace it, one row per trip around the loop:

| Trip | \`n\` | \`total\` before | \`total\` after |
|---|---|---|---|
| start | | | \`0\` |
| 1 | \`4\` | \`0\` | \`4\` |
| 2 | \`5\` | \`4\` | \`9\` |
| 3 | \`6\` | \`9\` | \`15\` |

\`total += n\` is a shorter way to write \`total = total + n\`.

Where you start matters: \`0\` for a sum, \`1\` for a product (anything times 0 is 0), \`[]\` for building a list, \`""\` for building a string.
`,
    },
    {
      type: 'task',
      title: 'sum_to',
      md: `
**Example:** multiplies \`1 * 2 * ... * n\`.

~~~
def product_to(n):
    result = 1
    for i in range(1, n + 1):
        result = result * i
    return result
~~~

**Your turn:** \`sum_to(4)\` returns \`10\`, because 1 + 2 + 3 + 4 is 10. Use a loop.
`,
      starter: `def sum_to(n):
    pass  # your code here
`,
      tests: [
        { name: 'sum_to(4) is 10', code: `eq(sum_to(4), 10)` },
        { name: 'sum_to(1) is 1', code: `eq(sum_to(1), 1)` },
        { name: 'sum_to(100) is 5050', code: `eq(sum_to(100), 5050)` },
      ],
      hint: 'Copy the shape of `product_to`, but start at `0` (not 1) and use `+` instead of `*`. Keep `range(1, n + 1)` so `n` is included.',
      solution: `def sum_to(n):
    result = 0  # a sum starts at 0
    for i in range(1, n + 1):  # n + 1 so that n itself is included
        result = result + i
    return result
`,
    },
    {
      type: 'predict',
      title: 'Off by one',
      md: 'This is meant to add 1 + 2 + 3. Look at the `range`.',
      code: `total = 0
for i in range(1, 3):
    total += i
print(total)`,
      output: `3`,
      explain: `
\`range(1, 3)\` is only **1 and 2**, so the total is 3, not 6. The stop number is excluded.

This is the **off-by-one** bug: the loop runs one time too few (or too many). When a loop result is "almost right", check the start and stop first. Here the fix is \`range(1, 4)\`, or in general \`range(1, n + 1)\`.
`,
    },
    {
      type: 'task',
      title: 'total',
      md: `
**Example:** walks the items themselves, no \`range\` needed.

~~~
def product(nums):
    result = 1
    for n in nums:
        result = result * n
    return result
~~~

**Your turn:** \`total([1, 2, 3])\` returns \`6\`. Use a loop, not \`sum()\`. An empty list gives \`0\`.
`,
      starter: `def total(nums):
    pass  # your code here
`,
      tests: [
        { name: 'total([1, 2, 3]) is 6', code: `eq(total([1, 2, 3]), 6)` },
        { name: 'total([]) is 0', code: `eq(total([]), 0)` },
        {
          name: 'uses a loop, not sum()',
          code: `def sum(*args):
    raise AssertionError("use a loop here, not sum()")
eq(total([10, -5]), 5)`,
        },
      ],
      hint: 'Same shape as `product`: start at `0` and add each `n`.',
      solution: `def total(nums):
    result = 0
    for n in nums:
        result += n  # += is short for result = result + n
    return result
`,
    },
    {
      type: 'task',
      title: 'count_evens',
      md: `
**Example:** a counter is an accumulator that adds 1 when something is true.

~~~
def count_positives(nums):
    count = 0
    for n in nums:
        if n > 0:
            count += 1
    return count
~~~

**Your turn:** \`count_evens([1, 2, 3, 4])\` returns \`2\`. (A number is even when \`n % 2 == 0\`.)
`,
      starter: `def count_evens(nums):
    pass  # your code here
`,
      tests: [
        { name: 'count_evens([1, 2, 3, 4]) is 2', code: `eq(count_evens([1, 2, 3, 4]), 2)` },
        { name: 'count_evens([1, 3]) is 0', code: `eq(count_evens([1, 3]), 0)` },
      ],
      hint: 'Same as `count_positives`, but the `if` checks `n % 2 == 0`.',
      solution: `def count_evens(nums):
    count = 0
    for n in nums:
        if n % 2 == 0:  # % is the remainder; even numbers leave 0
            count += 1
    return count
`,
    },
    {
      type: 'predict',
      title: 'Return inside the loop',
      md: 'The `return` is indented one level too far. What comes back?',
      code: `def total(nums):
    result = 0
    for n in nums:
        result += n
        return result

print(total([5, 6, 7]))`,
      output: `5`,
      explain: `
\`return\` ends the function **immediately**. Because it's inside the loop body, the function returns on the very first trip, after adding only the 5.

The fix is to dedent \`return result\` so it lines up with \`for\`. Then it runs once, after the loop has finished.
`,
    },
    {
      type: 'task',
      title: 'double_all',
      md: `
**Example:** building a new list is an accumulator too: start with \`[]\` and \`append\`.

~~~
def add_one_to_all(nums):
    out = []
    for n in nums:
        out.append(n + 1)
    return out
~~~

**Your turn:** \`double_all([1, 2, 3])\` returns \`[2, 4, 6]\`.
`,
      starter: `def double_all(nums):
    pass  # your code here
`,
      tests: [
        { name: 'double_all([1, 2, 3]) is [2, 4, 6]', code: `eq(double_all([1, 2, 3]), [2, 4, 6])` },
        { name: 'double_all([]) is []', code: `eq(double_all([]), [])` },
        { name: 'the original list is not changed', code: `nums = [1, 2]\ndouble_all(nums)\neq(nums, [1, 2])` },
      ],
      hint: 'Same as `add_one_to_all`, appending `n * 2`.',
      solution: `def double_all(nums):
    out = []
    for n in nums:
        out.append(n * 2)
    return out
`,
    },
    {
      type: 'read',
      title: 'Keep the best so far',
      md: `
To find the biggest (or longest, or oldest) item, keep a **best-so-far** variable and replace it whenever you see something better:

~~~py
nums = [3, 9, 4]

best = nums[0]          # start with the first item
for n in nums:
    if n > best:        # better than what we have?
        best = n        # then it's the new best
print(best)
~~~

| Trip | \`n\` | \`n > best\`? | \`best\` after |
|---|---|---|---|
| start | | | \`3\` |
| 1 | \`3\` | no | \`3\` |
| 2 | \`9\` | yes | \`9\` |
| 3 | \`4\` | no | \`9\` |

Why start with \`nums[0]\` and not \`0\`? If every number were negative, \`0\` would "win" even though it's not in the list.
`,
    },
    {
      type: 'task',
      title: 'longest_word',
      md: `\`longest_word(["hi", "hello", "hey"])\` returns \`"hello"\`. On a tie, keep the **first** one: \`longest_word(["abc", "xyz"])\` is \`"abc"\`.`,
      starter: `def longest_word(words):
    pass  # your code here
`,
      tests: [
        { name: 'longest_word(["hi", "hello", "hey"]) is "hello"', code: `eq(longest_word(["hi", "hello", "hey"]), "hello")` },
        { name: 'keeps the first one on a tie', code: `eq(longest_word(["abc", "xyz"]), "abc")` },
      ],
      hint: 'Best-so-far: `best = words[0]`, then replace it when `len(w) > len(best)`. Use `>` (not `>=`) so a tie keeps the first word.',
      solution: `def longest_word(words):
    best = words[0]
    for w in words:
        if len(w) > len(best):  # > not >=, so ties keep the earlier word
            best = w
    return best
`,
    },
    {
      type: 'task',
      title: 'repeat',
      md: `Building a string works like building a list: start with \`""\` and add to it. \`repeat("ab", 3)\` returns \`"ababab"\`, and \`repeat("x", 0)\` returns \`""\`. Use a loop.`,
      starter: `def repeat(s, times):
    pass  # your code here
`,
      tests: [
        { name: 'repeat("ab", 3) is "ababab"', code: `eq(repeat("ab", 3), "ababab")` },
        { name: 'repeat("x", 0) is ""', code: `eq(repeat("x", 0), "")` },
      ],
      hint: '`out = ""`, then `for i in range(times):` add `s` to `out`. `range(times)` runs exactly `times` times.',
      solution: `def repeat(s, times):
    out = ""
    for i in range(times):  # range(3) is 0, 1, 2: three trips
        out += s
    return out
`,
      explain: 'Python also has `s * times`, which does the same thing in one step. Writing the loop is the practice here.',
    },
    {
      type: 'read',
      title: 'Counting down, and enumerate',
      md: `
\`range\` can count backwards with a step of \`-1\`. The stop is still excluded:

~~~py
for i in range(3, 0, -1):
    print(i)
~~~

That prints 3, 2, 1 (it stops before 0).

When you need **both** the position and the item, use \`enumerate\`, which hands you pairs:

~~~py
for i, name in enumerate(["Ada", "Linus"]):
    print(i, name)
~~~

\`i, name\` unpacks each pair into two variables. You'll see this "two names before \`in\`" shape again with dictionaries in lesson 7.
`,
    },
    {
      type: 'task',
      title: 'countdown',
      md: `
**Example:** \`range\`'s third argument is the step.

~~~
def evens_up_to(n):
    out = []
    for i in range(0, n + 1, 2):
        out.append(i)
    return out
~~~

**Your turn:** \`countdown(3)\` returns \`[3, 2, 1]\`.
`,
      starter: `def countdown(n):
    pass  # your code here
`,
      tests: [
        { name: 'countdown(3) is [3, 2, 1]', code: `eq(countdown(3), [3, 2, 1])` },
        { name: 'countdown(1) is [1]', code: `eq(countdown(1), [1])` },
      ],
      hint: 'Build a list with `append`, looping over `range(n, 0, -1)`: start at `n`, stop before `0`, step `-1`.',
      solution: `def countdown(n):
    out = []
    for i in range(n, 0, -1):  # stops before 0, so 1 is the last value
        out.append(i)
    return out
`,
    },
    {
      type: 'predict',
      title: 'enumerate in action',
      code: `for i, letter in enumerate(["a", "b", "c"]):
    print(i, letter)`,
      output: `0 a
1 b
2 c`,
      explain: '`enumerate` counts from 0, like indexes do. Each trip gives you `(position, item)`, unpacked into `i` and `letter`.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer. A wrong pick tells you why.',
      items: [
        {
          q: 'Which numbers does `range(1, 4)` produce?',
          choices: ['1, 2, 3, 4', '1, 2, 3', '0, 1, 2, 3', '2, 3, 4'],
          answer: 1,
          explain: 'The stop number is excluded, so it stops before 4.',
          why: ['The stop (4) is not included. For 1 through 4 you need `range(1, 5)`.', '', 'It starts at the first number you give, 1, not 0.', 'It starts at 1, the start argument.'],
        },
        {
          q: 'You want the sum of `nums`. What should `total` start as?',
          choices: ['`1`', '`0`', '`nums[0]`', '`[]`'],
          answer: 1,
          explain: '0 is the "nothing yet" value for a sum, and an empty list correctly gives 0.',
          why: ['1 is the start for a **product**; for a sum you\'d be off by one.', '', 'Then the loop adds the first item a second time (and an empty list crashes).', '`[]` is the start for building a list, not adding numbers.'],
        },
        {
          q: 'A function returns after adding only the first item. What is the most likely bug?',
          choices: ['The `range` stops too early', '`return` is indented inside the loop', 'The total started at 1', 'The list is empty'],
          answer: 1,
          explain: '`return` ends the function immediately. Inside the loop body, it runs on the first trip.',
          why: ['An early stop would skip items at the end, not return after the first one.', '', 'That would make the answer off by one, not stop after one item.', 'An empty list would never add anything at all.'],
        },
        {
          q: 'For the biggest number in `nums`, why start with `best = nums[0]` instead of `best = 0`?',
          choices: ['It runs faster', 'If every number is negative, 0 would wrongly win', '`0` is not allowed as a variable value', 'There is no difference'],
          answer: 1,
          explain: 'Starting with a real item from the list means the answer is always something in the list.',
          why: ['Speed is the same; this is about correctness.', '', '0 is a perfectly fine value; the problem is that it may not be in the list.', 'With `[-3, -1]`, starting at 0 returns 0, which isn\'t in the list.'],
        },
        {
          q: 'What does this print? `for i in range(3): print("hi")`',
          choices: ['`hi` once', '`hi` three times', '`hi` four times', '0, 1, 2'],
          answer: 1,
          explain: '`range(3)` is 0, 1, 2: three trips. The body prints "hi" each time and never uses `i`.',
          why: ['The body runs once per number in the range.', '', '`range(3)` stops before 3, so there are only three numbers.', 'The body prints `"hi"`, not `i`.'],
        },
      ],
    },
  ],
};
