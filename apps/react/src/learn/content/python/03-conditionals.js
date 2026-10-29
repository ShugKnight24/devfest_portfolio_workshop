// Python course · lesson 3. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'conditionals',
  builds: ['python/functions', 'js/conditionals'],
  title: 'Conditionals',
  goal: 'Make decisions with if / elif / else, combine conditions with and / or / not, and know what Python treats as true.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'Comparisons give True or False',
      md: `
A **comparison** asks a yes/no question and answers with \`True\` or \`False\`:

~~~py
age = 20
print(age >= 18)     # greater than or equal
print(age < 13)      # less than
print(age == 20)     # equal: TWO equals signs
print(age != 20)     # not equal
~~~

| Operator | Means |
|---|---|
| \`==\` | equal |
| \`!=\` | not equal |
| \`<\` \`>\` | less than, greater than |
| \`<=\` \`>=\` | less/greater than or equal |

**\`=\` vs \`==\`:** one \`=\` **stores** a value (\`age = 20\`), two \`==\` **compare** (\`age == 20\`). Writing \`if age = 20:\` is a SyntaxError.

You may also see \`is\`. It asks "is this the very same object?", not "are these equal?". Use \`is\` only with \`None\` (\`if x is None:\`) and \`==\` for everything else.
`,
    },
    {
      type: 'task',
      title: 'is_adult',
      md: `
**Example:** return the comparison itself. It's already \`True\` or \`False\`.

~~~
def is_child(age):
    return age < 13
~~~

**Your turn:** \`is_adult(18)\` returns \`True\`, \`is_adult(17)\` returns \`False\`.
`,
      starter: `def is_adult(age):
    pass  # your code here
`,
      tests: [
        { name: 'is_adult(18) returns True', code: `eq(is_adult(18), True)` },
        { name: 'is_adult(17) returns False', code: `eq(is_adult(17), False)` },
      ],
      hint: 'Exactly 18 counts as an adult, so use `>=`: `return age >= 18`.',
      solution: `def is_adult(age):
    return age >= 18
`,
    },
    {
      type: 'read',
      title: 'if / elif / else',
      md: `
To **do** different things depending on a condition, use \`if\`. Each branch is a colon plus an indented block, just like a function body:

~~~py
def temperature(c):
    if c > 25:
        return "hot"
    elif c < 10:          # "else if": only checked when the one above was False
        return "cold"
    else:                 # none of the above
        return "mild"

print(temperature(30))
print(temperature(5))
print(temperature(18))
~~~

Python checks the conditions **top to bottom** and runs only the **first** branch whose condition is \`True\`. \`elif\` and \`else\` are optional.
`,
    },
    {
      type: 'task',
      title: 'sign',
      md: '`sign(5)` returns `"positive"`, `sign(-2)` returns `"negative"`, `sign(0)` returns `"zero"`. Use `if` / `elif` / `else` like `temperature` above.',
      starter: `def sign(n):
    pass  # your code here
`,
      tests: [
        { name: 'sign(5) returns "positive"', code: `eq(sign(5), "positive")` },
        { name: 'sign(-2) returns "negative"', code: `eq(sign(-2), "negative")` },
        { name: 'sign(0) returns "zero"', code: `eq(sign(0), "zero")` },
      ],
      hint: '`if n > 0:` return "positive", `elif n < 0:` return "negative", `else:` return "zero". Each return is indented under its line.',
      solution: `def sign(n):
    if n > 0:
        return "positive"
    elif n < 0:
        return "negative"
    else:
        return "zero"
`,
    },
    {
      type: 'predict',
      title: 'Order matters in an elif chain',
      md: 'This grading function has a bug. What does it give a score of 95?',
      code: `def grade(score):
    if score >= 70:
        return "C"
    elif score >= 90:
        return "A"
    else:
        return "F"

print(grade(95))`,
      output: `C`,
      explain: `
95 is \`>= 70\`, so the **first** branch wins and Python never looks further. Only one branch ever runs.

With \`>=\` thresholds, check the **biggest** one first: \`>= 90\`, then \`>= 80\`, then \`>= 70\`.
`,
    },
    {
      type: 'task',
      title: 'bigger',
      md: '`bigger(3, 8)` returns `8`, and `bigger(9, 2)` returns `9`. Use an `if`, not `max()`.',
      starter: `def bigger(a, b):
    pass  # your code here
`,
      tests: [
        { name: 'bigger(3, 8) returns 8', code: `eq(bigger(3, 8), 8)` },
        { name: 'bigger(9, 2) returns 9', code: `eq(bigger(9, 2), 9)` },
      ],
      hint: '`if a > b:` return `a`, otherwise return `b`. You don\'t even need `else`: if the `if` returned, the function already ended.',
      solution: `def bigger(a, b):
    if a > b:
        return a
    return b  # only reached when a > b was False
`,
    },
    {
      type: 'read',
      title: 'and, or, not',
      md: `
Combine conditions with plain English words:

- \`a and b\` is \`True\` only when **both** are true.
- \`a or b\` is \`True\` when **at least one** is true.
- \`not a\` flips \`True\` and \`False\`.

~~~py
age = 20
has_license = False

print(age >= 16 and has_license)
print(age >= 16 or has_license)
print(not has_license)
~~~
`,
    },
    {
      type: 'task',
      title: 'can_vote',
      md: `
**Example:**

~~~
def can_drive(age, has_license):
    return age >= 16 and has_license
~~~

**Your turn:** \`can_vote(age, is_citizen)\` is \`True\` only when the person is 18 or older **and** a citizen.
`,
      starter: `def can_vote(age, is_citizen):
    pass  # your code here
`,
      tests: [
        { name: 'can_vote(20, True) returns True', code: `eq(can_vote(20, True), True)` },
        { name: 'can_vote(20, False) returns False', code: `eq(can_vote(20, False), False)` },
        { name: 'can_vote(16, True) returns False', code: `eq(can_vote(16, True), False)` },
      ],
      hint: 'Same shape as `can_drive`: `return age >= 18 and is_citizen`.',
      solution: `def can_vote(age, is_citizen):
    return age >= 18 and is_citizen
`,
    },
    {
      type: 'predict',
      title: 'The "or" trap',
      md: 'This looks like it means "day is sat or sun". Watch what it does with `"mon"`.',
      code: `day = "mon"
if day == "sat" or "sun":
    print("weekend!")
else:
    print("weekday")`,
      output: `weekend!`,
      explain: `
Python reads it as \`(day == "sat") or ("sun")\`. The left side is \`False\`, so \`or\` moves on to \`"sun"\`, and a non-empty string counts as **true**. So the condition is true for every day.

Each side of \`or\` must be a full comparison:

~~~
day == "sat" or day == "sun"     # right
day in ("sat", "sun")            # also right, and shorter
~~~
`,
    },
    {
      type: 'task',
      title: 'is_weekend',
      md: `
**Example:**

~~~
def is_a_or_e(letter):
    return letter == "a" or letter == "e"
~~~

**Your turn:** \`is_weekend("sat")\` and \`is_weekend("sun")\` return \`True\`, \`is_weekend("mon")\` returns \`False\`.
`,
      starter: `def is_weekend(day):
    pass  # your code here
`,
      tests: [
        { name: 'is_weekend("sat") returns True', code: `eq(is_weekend("sat"), True)` },
        { name: 'is_weekend("sun") returns True', code: `eq(is_weekend("sun"), True)` },
        { name: 'is_weekend("mon") returns False', code: `eq(is_weekend("mon"), False, 'did you write day == "sat" or "sun"? each side of or needs its own ==')` },
      ],
      hint: 'Write the full comparison on both sides: `return day == "sat" or day == "sun"`.',
      solution: `def is_weekend(day):
    return day == "sat" or day == "sun"
`,
    },
    {
      type: 'read',
      title: 'Truthiness: what counts as true',
      md: `
\`if\` doesn't need an actual \`True\` or \`False\`. Python treats every value as "truthy" or "falsy":

| Falsy (act like False) | Everything else is truthy |
|---|---|
| \`False\`, \`None\` | \`True\` |
| \`0\`, \`0.0\` | any other number, even \`-1\` |
| \`""\` (empty string) | \`"0"\`, \`" "\`, any non-empty string |
| \`[]\`, \`{}\` (empty list or dict) | \`[0]\`, any non-empty list |

~~~py
items = []
if items:
    print("has items")
else:
    print("empty")

name = ""
print(name or "anonymous")   # or gives back the first truthy value
~~~

\`if items:\` is the normal Python way to ask "is this list non-empty?".
`,
    },
    {
      type: 'predict',
      title: 'Truthy or falsy?',
      code: `for value in [0, "0", [], [0], None, " "]:
    if value:
        print(repr(value), "truthy")
    else:
        print(repr(value), "falsy")`,
      output: `0 falsy
'0' truthy
[] falsy
[0] truthy
None falsy
' ' truthy`,
      explain: '`"0"` is a non-empty string, so it\'s truthy even though it looks like zero. `[0]` is a list with one item, so it\'s truthy. A single space is a character, so `" "` is truthy too. (The `for` loop just runs the `if` once per value. Loops get their own lesson.)',
    },
    {
      type: 'task',
      title: 'grade',
      md: '`grade(score)`: 90 and up is `"A"`, 80 and up is `"B"`, 70 and up is `"C"`, anything else is `"F"`. Watch the order (step 5).',
      starter: `def grade(score):
    pass  # your code here
`,
      tests: [
        { name: 'grade(95) and grade(90) are "A"', code: `eq(grade(95), "A"); eq(grade(90), "A")` },
        { name: 'grade(85) is "B"', code: `eq(grade(85), "B")` },
        { name: 'grade(72) is "C"', code: `eq(grade(72), "C")` },
        { name: 'grade(40) is "F"', code: `eq(grade(40), "F")` },
      ],
      hint: 'Biggest threshold first: `if score >= 90:` "A", `elif score >= 80:` "B", `elif score >= 70:` "C", `else:` "F".',
      solution: `def grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "F"
`,
    },
    {
      type: 'task',
      title: 'parity: if/else on one line',
      md: `
A **conditional expression** is an if/else that produces a value, all on one line: \`A if condition else B\`.

**Example:**

~~~
def size(n):
    return "big" if n > 100 else "small"
~~~

**Your turn:** \`parity(4)\` returns \`"even"\`, \`parity(7)\` returns \`"odd"\`. One line, like the example.
`,
      starter: `def parity(n):
    pass  # your code here
`,
      tests: [
        { name: 'parity(4) returns "even"', code: `eq(parity(4), "even")` },
        { name: 'parity(7) returns "odd"', code: `eq(parity(7), "odd")` },
      ],
      hint: '`return "even" if n % 2 == 0 else "odd"`',
      solution: `def parity(n):
    return "even" if n % 2 == 0 else "odd"
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'What\'s wrong with `if day == "sat" or "sun":`?',
          choices: ['It\'s true for every day, because `"sun"` on its own is truthy', 'It\'s a SyntaxError', 'Nothing, it works', 'It\'s only true for "sun"'],
          answer: 0,
          explain: 'Python reads `(day == "sat") or "sun"`. A non-empty string is truthy, so the whole condition is always true. Write `day == "sat" or day == "sun"`.',
          why: ['', 'It runs without error. The bug is quieter than that.', 'Try it with "mon": it still says weekend.', 'It\'s true for every day, not just "sun".'],
        },
        {
          q: 'A grade function checks `>= 70` first, then `>= 90`. What does a score of 95 get?',
          choices: ['The `>= 70` branch\'s grade', 'The `>= 90` branch\'s grade', 'Both branches run'],
          answer: 0,
          explain: 'Only the first true branch runs, and 95 is already `>= 70`. Put the biggest threshold first.',
          why: ['', 'Python never gets there: the first true branch wins.', 'An if/elif chain runs at most one branch.'],
        },
        {
          q: 'Which line is a SyntaxError?',
          choices: ['`if age = 18:`', '`if age == 18:`', '`if age >= 18:`'],
          answer: 0,
          explain: 'One `=` stores a value and can\'t be used as a question. Comparing needs `==`.',
          why: ['', '`==` is the correct way to compare.', '`>=` is a valid comparison.'],
        },
        {
          q: 'Which of these values is truthy?',
          choices: ['`"0"`', '`0`', '`[]`', '`None`'],
          answer: 0,
          explain: '`"0"` is a non-empty string, so it\'s truthy. Only the empty string `""` is falsy.',
          why: ['', 'The number 0 is falsy.', 'An empty list is falsy.', '`None` is falsy.'],
        },
        {
          q: 'What does `"big" if 5 > 100 else "small"` evaluate to?',
          choices: ['`"small"`', '`"big"`', '`False`'],
          answer: 0,
          explain: 'The condition `5 > 100` is False, so the value after `else` is used.',
          why: ['', '"big" is only used when the condition is True.', 'The expression produces one of the two strings, not the condition.'],
        },
      ],
    },
  ],
};
