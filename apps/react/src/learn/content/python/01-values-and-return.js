// Python course · lesson 1. Step types: read, predict, task, check (see ../index.js).
// ~~~py blocks in read steps get Run / Edit buttons, so they must run cleanly.
export default {
  id: 'values-and-return',
  builds: ['js/values-and-return'],
  title: 'Values, variables and return',
  goal: 'Write tiny functions that hand back a value, and read the error you get when they don\'t.',
  minutes: 20,
  steps: [
    {
      type: 'read',
      title: 'Values and variables',
      md: `
Every program is made of **values**: numbers like \`30\`, text like \`"Ada"\`, and a few special ones like \`True\`, \`False\` and \`None\`.

A **variable** is a name for a value. In Python you just pick a name and use \`=\`:

~~~py
city = "Paris"
count = 0
count = count + 1    # read count (0), add 1, store the result back in count
print(city, count)
~~~

Press **▶ Run** to see what it prints. Then press **✎ Edit**, change \`"Paris"\` to your city, and run it again.

- There's no \`const\` or \`let\`: a name just points at whatever you last assigned to it.
- Names use \`snake_case\`: lowercase words joined by underscores, like \`seconds_per_minute\`.
- \`#\` starts a comment. Python ignores everything after it on that line.
`,
    },
    {
      type: 'predict',
      title: 'Reassigning a variable',
      md: 'Read top to bottom, one line at a time. What is `score` at the end?',
      code: `score = 10
score = score + 5
score = score * 2
print(score)`,
      output: `30`,
      explain: `
Each line reads the **current** value, computes something new and stores it back:

| Line | \`score\` after it |
|---|---|
| \`score = 10\` | \`10\` |
| \`score = score + 5\` | \`15\` |
| \`score = score * 2\` | \`30\` |

\`=\` doesn't mean "is equal to". It means "compute the right side, then store it in the name on the left".
`,
    },
    {
      type: 'read',
      title: 'Functions: a value in, a value out',
      md: `
A **function** is a named recipe. It takes inputs (**parameters**) and hands back one output with \`return\`.

~~~
def add_one(n):
    return n + 1
#│   │      │  └─ colon: "the body starts on the next line"
#│   │      └─ the parameter: a name for whatever gets passed in
#│   └─ the function's name
#└─ def means "define a function"
~~~

The **body** is every line indented under the \`def\` line (4 spaces). Python uses indentation instead of curly braces, so the indentation is part of the code and not just style.

~~~py
def add_one(n):
    return n + 1

print(add_one(5))
print(add_one(-1))
~~~

\`add_one(5)\` **calls** the function: \`n\` becomes \`5\`, the body runs, and \`return\` hands back \`6\`.
`,
    },
    {
      type: 'task',
      title: 'get_age',
      md: `
**Example** (already solved):

~~~
def get_name():
    return "Ada"
~~~

**Your turn:** \`get_age()\` returns the number \`30\`.
`,
      starter: `def get_age():
    pass  # your code here
`,
      tests: [{ name: 'get_age() returns 30', code: `eq(get_age(), 30)` }],
      hint: 'Same shape as `get_name`, but return a number. Numbers have no quotes: `"30"` is text, not a number.',
      solution: `def get_age():
    return 30
`,
      explain: '`pass` means "do nothing". A function that never reaches a `return` hands back `None`, which is why the test said `got None` before.',
    },
    {
      type: 'task',
      title: 'get_greeting',
      md: '`get_greeting()` returns the string `"hello"`.',
      starter: `def get_greeting():
    pass  # your code here
`,
      tests: [{ name: 'get_greeting() returns "hello"', code: `eq(get_greeting(), "hello")` }],
      hint: 'Same as `get_name` from the last step, with a different string.',
      solution: `def get_greeting():
    return "hello"
`,
    },
    {
      type: 'predict',
      title: 'A function with no return',
      md: 'This function computes the right number. Look closely at what it does with it.',
      code: `def add_ten(n):
    n + 10

print(add_ten(5))`,
      output: `None`,
      explain: `
\`n + 10\` is computed (15) and then thrown away, because nothing **returns** it. A function with no \`return\` hands back \`None\`, Python's "no value".

If a test says \`expected 15, got None\`, look for a missing \`return\` first. That's the cause almost every time.
`,
    },
    {
      type: 'task',
      title: 'add_ten',
      md: `
**Example:**

~~~
def add_one(n):
    return n + 1
~~~

**Your turn:** \`add_ten(n)\` returns \`n\` plus 10. \`add_ten(5)\` is \`15\`.
`,
      starter: `def add_ten(n):
    pass  # your code here
`,
      tests: [
        { name: 'add_ten(5) returns 15', code: `eq(add_ten(5), 15)` },
        { name: 'add_ten(-10) returns 0', code: `eq(add_ten(-10), 0)` },
      ],
      hint: 'Copy the shape of `add_one`. Only the number changes.',
      solution: `def add_ten(n):
    return n + 10
`,
    },
    {
      type: 'task',
      title: 'square',
      md: '`square(n)` returns `n` multiplied by itself. `square(3)` is `9`.',
      starter: `def square(n):
    pass  # your code here
`,
      tests: [
        { name: 'square(3) returns 9', code: `eq(square(3), 9)` },
        { name: 'square(0) returns 0', code: `eq(square(0), 0)` },
      ],
      hint: '`*` multiplies. `n * n` is "n times n".',
      solution: `def square(n):
    return n * n  # n ** 2 works too: ** is the power operator
`,
    },
    {
      type: 'read',
      title: 'f-strings: putting values into text',
      md: `
To build text out of values, put an \`f\` before the opening quote and write the values inside \`{}\`:

~~~py
name = "Ada"
age = 36
print(f"Hello {name}")
print(f"{name} is {age} years old")
print(f"Next year: {age + 1}")
~~~

- The \`f\` is what turns \`{name}\` into the value. Without it, Python prints the braces literally.
- You can put any expression inside \`{}\`, like \`{age + 1}\`.
- f-strings turn numbers into text for you. \`"Ada is " + 36\` would be an error, because you can't add text and a number.
`,
    },
    {
      type: 'predict',
      title: 'The forgotten f',
      code: `name = "Ada"
print("Hello {name}")
print(f"Hello {name}")`,
      output: `Hello {name}
Hello Ada`,
      explain: 'The first line has no `f`, so `{name}` is just characters in the text. When a test says something like `got \'Hello {name}\'`, you forgot the `f`.',
    },
    {
      type: 'task',
      title: 'full_name',
      md: `
**Example:**

~~~
def hello(name):
    return f"Hello {name}"
~~~

**Your turn:** \`full_name("Ada", "Lovelace")\` returns \`"Ada Lovelace"\`.
`,
      starter: `def full_name(first, last):
    pass  # your code here
`,
      tests: [{ name: 'full_name("Ada", "Lovelace") returns "Ada Lovelace"', code: `eq(full_name("Ada", "Lovelace"), "Ada Lovelace")` }],
      hint: '`return f"{first} {last}"`: two `{}` with a space between them. Don\'t forget the `f`.',
      solution: `def full_name(first, last):
    return f"{first} {last}"
`,
    },
    {
      type: 'task',
      title: 'describe',
      md: '`describe("Ada", 36)` returns `"Ada is 36 years old"`.',
      starter: `def describe(name, age):
    pass  # your code here
`,
      tests: [
        { name: 'describe("Ada", 36)', code: `eq(describe("Ada", 36), "Ada is 36 years old")` },
        { name: 'describe("Linus", 17)', code: `eq(describe("Linus", 17), "Linus is 17 years old")` },
      ],
      hint: 'Same as `full_name`, with more words around the placeholders: `f"{name} is ..."`.',
      solution: `def describe(name, age):
    return f"{name} is {age} years old"
`,
    },
    {
      type: 'task',
      title: 'hours_to_seconds',
      md: `
**Example:** store a fixed number in a well-named variable, then use it.

~~~
def minutes_to_seconds(minutes):
    seconds_per_minute = 60
    return minutes * seconds_per_minute
~~~

**Your turn:** \`hours_to_seconds(2)\` returns \`7200\`. Store \`3600\` in a variable first, like the example.
`,
      starter: `def hours_to_seconds(hours):
    pass  # your code here
`,
      tests: [
        { name: 'hours_to_seconds(2) returns 7200', code: `eq(hours_to_seconds(2), 7200)` },
        { name: 'hours_to_seconds(0) returns 0', code: `eq(hours_to_seconds(0), 0)` },
      ],
      hint: '`seconds_per_hour = 3600` on one line, then `return hours * seconds_per_hour` on the next. Both lines are indented 4 spaces.',
      solution: `def hours_to_seconds(hours):
    seconds_per_hour = 3600  # a named value reads better than a "magic number"
    return hours * seconds_per_hour
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Indentation is code',
      md: 'The second line of the body is not indented. What happens?',
      code: `def area(w, h):
    result = w * h
return result`,
      output: `! SyntaxError: 'return' outside function (line 3)`,
      explain: `
The body of a function is **only the indented lines**. \`return result\` starts at the left edge, so Python thinks the function already ended, and a \`return\` outside a function is an error.

Keep every line of the body indented by the same 4 spaces. In this editor, pressing Enter after a line ending in \`:\` indents for you.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'A test says `expected 15, got None`. What is the most likely cause?',
          choices: ['The function is missing a `return`', 'The math is wrong', 'The function name is misspelled', 'Python can\'t add numbers inside functions'],
          answer: 0,
          explain: 'A function that never reaches `return` hands back `None`. Wrong math would give a wrong number, not `None`.',
          why: ['', 'Wrong math gives a wrong number, like 14, not None.', 'A misspelled name gives a NameError, not None.', 'Python can do math anywhere. The result just wasn\'t returned.'],
        },
        {
          q: 'What does `print("Hi {name}")` print, if `name = "Ada"`?',
          choices: ['`Hi {name}`', '`Hi Ada`', 'An error'],
          answer: 0,
          explain: 'Without the `f` in front of the quotes, the braces are just characters. `f"Hi {name}"` would print `Hi Ada`.',
          why: ['', 'That needs an f-string: `f"Hi {name}"`.', 'It\'s a perfectly valid string. It just doesn\'t fill anything in.'],
        },
        {
          q: 'What is `x` after these lines? `x = 4`, then `x = x * 2`, then `x = x + 1`',
          choices: ['`9`', '`4`', '`8`', '`5`'],
          answer: 0,
          explain: '4, then 4 × 2 = 8, then 8 + 1 = 9. Each line reads the current value and stores the new one.',
          why: ['', 'x is reassigned twice after it starts at 4.', 'That\'s after the second line. There\'s one more line.', 'That skips the `* 2` line.'],
        },
        {
          q: 'Which line correctly starts a function called `double` that takes `n`?',
          choices: ['`def double(n):`', '`def double(n)`', '`function double(n):`', '`def double n:`'],
          answer: 0,
          explain: '`def`, the name, the parameters in parentheses, then a colon. The body goes on the indented lines below.',
          why: ['', 'It\'s missing the colon at the end.', 'Python uses `def`, not `function`.', 'The parameters need parentheses.'],
        },
        {
          q: 'What decides which lines belong to a function\'s body?',
          choices: ['The lines indented under the `def` line', 'Curly braces around the body', 'Everything until the next blank line'],
          answer: 0,
          explain: 'Python uses indentation to group lines. The body is every line indented under `def ...:`.',
          why: ['', 'Python doesn\'t use curly braces for blocks.', 'Blank lines don\'t matter. Indentation does.'],
        },
      ],
    },
  ],
};
