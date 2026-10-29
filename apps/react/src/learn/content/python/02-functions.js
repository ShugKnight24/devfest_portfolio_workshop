// Python course · lesson 2. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'functions',
  builds: ['python/values-and-return', 'js/functions'],
  title: 'Functions',
  goal: 'Understand parameters, return vs print, default values, lambda, and passing a function into another function.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Parameters and arguments',
      md: `
Two words people mix up:

- A **parameter** is the name in the \`def\` line. It's a placeholder.
- An **argument** is the actual value you pass in when you call the function.

~~~py
def greet(name):          # name is the parameter
    return f"Hi, {name}!"

print(greet("Ada"))       # "Ada" is the argument
print(greet("Linus"))     # same function, different argument
~~~

When you call \`greet("Ada")\`, Python does \`name = "Ada"\` behind the scenes, then runs the body. Each call gets its own fresh \`name\`.

Functions can take several parameters, matched up **by position**:

~~~py
def subtract(a, b):
    return a - b

print(subtract(10, 3))
print(subtract(3, 10))
~~~
`,
    },
    {
      type: 'predict',
      title: 'Order matters',
      code: `def describe(name, age):
    return f"{name} is {age}"

print(describe(36, "Ada"))`,
      output: `36 is Ada`,
      explain: 'Arguments are matched to parameters by position: the first argument becomes `name`, the second becomes `age`. Python has no idea you swapped them. It happily builds the wrong sentence.',
    },
    {
      type: 'read',
      title: 'return vs print',
      md: `
This is the biggest beginner trap, so slow down here.

- \`print(x)\` **shows** \`x\` on the screen, for a human to read. The program can't use what was printed.
- \`return x\` **hands** \`x\` back to the code that called the function, so that code can store it, compare it or pass it on.

Think of a vending machine. \`print\` is the screen saying "Here's your snack!", while \`return\` is the snack actually dropping into the tray. A screen message doesn't give you a snack.

~~~py
def shown(n):
    print(n * 2)       # shows it, hands back None

def handed_back(n):
    return n * 2       # hands it back

a = shown(5)
b = handed_back(5)
print("a is", a)
print("b is", b)
~~~

Run it. \`shown(5)\` prints \`10\`, but \`a\` ends up \`None\`. Tests check the **returned** value, so a function that only prints fails them.
`,
    },
    {
      type: 'predict',
      title: 'A function that prints instead of returning',
      code: `def double(n):
    print(n * 2)

result = double(4)
print(result)`,
      output: `8
None`,
      explain: `
Two lines come out:

1. \`8\` comes from the \`print\` **inside** \`double\`.
2. \`None\` comes from \`print(result)\`. \`double\` never returned anything, so \`result\` is \`None\`.

If a test says \`expected 8, got None\` but you can *see* 8 printed above it, swap \`print\` for \`return\`.
`,
    },
    {
      type: 'read',
      title: 'Anatomy of def, and lambda',
      md: `
~~~
def average(a, b):          # def, name, parameters, colon
    total = a + b           # the body: every indented line
    return total / 2        # return ends the function and hands back a value
~~~

- The colon and the 4-space indentation are required.
- \`return\` **ends** the function immediately. Lines after it in the same block never run.
- \`/\` always gives a decimal (\`4 / 2\` is \`2.0\`). \`//\` rounds down to a whole number.

Python also has a short form for tiny one-expression functions, \`lambda\`:

~~~py
triple = lambda n: n * 3     # the same as: def triple(n): return n * 3

print(triple(4))
~~~

A \`lambda\` holds **one expression** and returns it automatically. It can't contain statements like \`if\` blocks, loops or assignments. Real Python code uses \`def\` for anything with a name. You'll mostly meet \`lambda\` passed straight into another function, like \`sorted(people, key=lambda p: p["age"])\` in a later lesson.
`,
    },
    {
      type: 'task',
      title: 'double (as a lambda)',
      md: `
**Example:**

~~~
triple = lambda n: n * 3
~~~

**Your turn:** \`double(4)\` returns \`8\`. Write it as a lambda, like the example (replace \`None\`).
`,
      starter: `double = lambda n: None
`,
      tests: [
        { name: 'double(4) returns 8', code: `eq(double(4), 8)` },
        { name: 'double(0) returns 0', code: `eq(double(0), 0)` },
      ],
      hint: 'Copy the example and change `3` to `2`.',
      solution: `double = lambda n: n * 2
`,
    },
    {
      type: 'read',
      title: 'Default values',
      md: `
A parameter can have a **default**, used when the caller leaves that argument out:

~~~py
def welcome(place="home"):
    return f"Welcome {place}"

print(welcome("Paris"))
print(welcome())
~~~

Parameters with defaults go **after** the ones without: \`def f(a, b=2)\` is fine, \`def f(a=1, b)\` is an error.

You can also name arguments when you call, which makes calls easier to read and lets you skip the order:

~~~py
def order(item, size="medium", extra_shot=False):
    return f"{size} {item}, extra shot: {extra_shot}"

print(order("latte"))
print(order("latte", extra_shot=True))
~~~
`,
    },
    {
      type: 'task',
      title: 'greet with a default',
      md: `
**Example:**

~~~
def welcome(place="home"):
    return f"Welcome {place}"
~~~

**Your turn:** \`greet("Ada")\` returns \`"Hi, Ada!"\` and \`greet()\` returns \`"Hi, friend!"\`.
`,
      starter: `def greet(name="friend"):
    pass  # your code here
`,
      tests: [
        { name: 'greet("Ada") returns "Hi, Ada!"', code: `eq(greet("Ada"), "Hi, Ada!")` },
        { name: 'greet() returns "Hi, friend!"', code: `eq(greet(), "Hi, friend!")` },
      ],
      hint: 'The default is already in the `def` line. The body is one line: `return f"Hi, {name}!"`.',
      solution: `def greet(name="friend"):
    return f"Hi, {name}!"
`,
    },
    {
      type: 'task',
      title: 'is_even',
      md: `
Comparisons like \`n > 0\` produce \`True\` or \`False\` (capital T and F), and you can return them directly.

**Example:**

~~~
def is_positive(n):
    return n > 0
~~~

**Your turn:** \`is_even(4)\` returns \`True\`, \`is_even(7)\` returns \`False\`. \`%\` gives the remainder: \`7 % 2\` is \`1\`.
`,
      starter: `def is_even(n):
    pass  # your code here
`,
      tests: [
        { name: 'is_even(4) returns True', code: `eq(is_even(4), True)` },
        { name: 'is_even(7) returns False', code: `eq(is_even(7), False)` },
        { name: 'is_even(0) returns True', code: `eq(is_even(0), True)` },
      ],
      hint: 'An even number has remainder 0 when divided by 2: `return n % 2 == 0`.',
      solution: `def is_even(n):
    return n % 2 == 0  # == compares; the comparison itself is already True or False
`,
      explain: 'No `if` needed: `n % 2 == 0` is already `True` or `False`, so return it directly.',
    },
    {
      type: 'task',
      title: 'average',
      md: '`average(2, 4)` returns `3`, and `average(1, 2)` returns `1.5`.',
      starter: `def average(a, b):
    pass  # your code here
`,
      tests: [
        { name: 'average(2, 4) returns 3', code: `eq(average(2, 4), 3)` },
        { name: 'average(1, 2) returns 1.5', code: `eq(average(1, 2), 1.5)` },
      ],
      hint: 'Add first, then divide: `(a + b) / 2`. Without the parentheses, Python divides `b` by 2 first.',
      solution: `def average(a, b):
    return (a + b) / 2
`,
    },
    {
      type: 'predict',
      title: 'Order of operations',
      code: `a = 2
b = 4
print(a + b / 2)
print((a + b) / 2)`,
      output: `4.0
3.0`,
      explain: 'Like in math, `/` and `*` happen before `+` and `-`. The first line is `2 + 2.0`. Parentheses force the addition first. Both results are decimals (`4.0`, `3.0`) because `/` always produces one. A test comparing `3.0` with `3` still passes, since they\'re equal.',
    },
    {
      type: 'task',
      title: 'circle_area',
      md: `
\`math.pi\` is π. You get it with \`import math\` at the top of your code. \`round(x, 2)\` rounds to 2 decimals.

**Example:**

~~~
def third(n):
    return round(n / 3, 2)
~~~

**Your turn:** \`circle_area(2)\` returns \`12.57\` (π × r × r, rounded to 2 decimals).
`,
      starter: `import math

def circle_area(r):
    pass  # your code here
`,
      tests: [
        { name: 'circle_area(2) returns 12.57', code: `eq(circle_area(2), 12.57)` },
        { name: 'circle_area(1) returns 3.14', code: `eq(circle_area(1), 3.14)` },
      ],
      hint: '`return round(math.pi * r * r, 2)`',
      solution: `import math

def circle_area(r):
    return round(math.pi * r * r, 2)
`,
    },
    {
      type: 'task',
      title: 'greet_loudly: one function calling another',
      md: `
Functions can call other functions. The inner call runs first, and its return value is used by the outer one.

**Example** (\`greet\` and \`shout\` are given):

~~~
def greet(name="friend"):
    return f"Hi, {name}!"

def shout(s):
    return s + "!"
~~~

**Your turn:** \`greet_loudly("Ada")\` returns \`"Hi, Ada!!"\`. Call \`greet\`, then pass its result to \`shout\`.
`,
      starter: `def greet(name="friend"):
    return f"Hi, {name}!"

def shout(s):
    return s + "!"

def greet_loudly(name):
    pass  # your code here
`,
      tests: [{ name: 'greet_loudly("Ada") returns "Hi, Ada!!"', code: `eq(greet_loudly("Ada"), "Hi, Ada!!")` }],
      hint: 'Nest the calls: `return shout(greet(name))`. `greet(name)` runs first and gives `"Hi, Ada!"`, then `shout` adds one more `!`.',
      solution: `def greet(name="friend"):
    return f"Hi, {name}!"

def shout(s):
    return s + "!"

def greet_loudly(name):
    return shout(greet(name))
`,
    },
    {
      type: 'read',
      title: 'Functions are values too',
      md: `
A function name without \`()\` is the function **itself**, a value like any other. You can store it in another variable or pass it into another function:

~~~py
def double(n):
    return n * 2

f = double            # no (): f now points at the same function
print(f(5))           # calling it through the new name

def apply_once(fn, x):
    return fn(x)      # call whatever function was passed in

print(apply_once(double, 7))
print(apply_once(lambda s: s.upper(), "hey"))
~~~

A function passed into another function is called a **callback**. This idea is everywhere later on: \`sorted(users, key=...)\`, \`max(products, key=...)\`, and FastAPI's \`Depends(...)\`.
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Forgetting the ()',
      code: `def get_name():
    return "Ada"

print("Hi " + get_name())
print("Hi " + get_name)`,
      output: `Hi Ada
! TypeError: can only concatenate str (not "function") to str (line 5)`,
      explain: 'Line 5 has no `()`, so `get_name` is never called: you\'re adding the function itself to a string, and Python refuses. If you ever print a function by accident you\'ll see something like `<function get_name at 0x...>`. In both cases the fix is to add `()`.',
    },
    {
      type: 'task',
      title: 'apply_twice',
      md: `
**Example:**

~~~
def apply_once(fn, x):
    return fn(x)
~~~

**Your turn:** \`apply_twice(fn, x)\` calls \`fn\` on \`x\`, then calls \`fn\` again on that result. \`apply_twice(double, 3)\` is \`double(double(3))\`, which is \`12\`.
`,
      starter: `def apply_twice(fn, x):
    pass  # your code here
`,
      tests: [
        { name: 'apply_twice(double, 3) returns 12', code: `eq(apply_twice(lambda n: n * 2, 3), 12)` },
        { name: 'works with strings', code: `eq(apply_twice(lambda s: s + "!", "hey"), "hey!!")` },
      ],
      hint: 'Nest the calls, like in `greet_loudly`: `return fn(fn(x))`.',
      solution: `def apply_twice(fn, x):
    return fn(fn(x))
`,
      explain: '`apply_twice` doesn\'t know or care what `fn` does. It just calls it. That\'s the whole idea behind callbacks.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'You see `8` printed, but the test says `expected 8, got None`. What\'s wrong?',
          choices: ['The function uses `print` instead of `return`', 'The test is broken', 'The function returns a string', '8 is the wrong answer'],
          answer: 0,
          explain: '`print` shows the value but hands back `None`. Tests check what the function **returns**.',
          why: ['', 'The test is right: the function really did return None.', 'A string would show as `\'8\'`, not None.', 'The printed 8 is right. It just wasn\'t returned.'],
        },
        {
          q: 'In `def greet(name):` and `greet("Ada")`, what is `"Ada"`?',
          choices: ['An argument', 'A parameter', 'A return value'],
          answer: 0,
          explain: 'The parameter is the placeholder name in the `def` line (`name`). The argument is the value passed in the call (`"Ada"`).',
          why: ['', '`name` is the parameter. "Ada" is what gets passed in.', 'The return value is what comes back out, not what goes in.'],
        },
        {
          q: 'What does `greet()` return, given `def greet(name="friend"): return f"Hi, {name}!"`?',
          choices: ['`"Hi, friend!"`', 'An error: missing argument', '`"Hi, None!"`', '`"Hi, name!"`'],
          answer: 0,
          explain: 'When the argument is left out, the default `"friend"` is used.',
          why: ['', 'There\'s no error, because the parameter has a default.', 'Defaults are used instead of None when you leave the argument out.', 'It\'s an f-string, so `{name}` is filled in.'],
        },
        {
          q: 'Which of these can a `lambda` NOT do?',
          choices: ['Contain an `if` block, a loop or several statements', 'Take parameters', 'Return a value', 'Be passed into another function'],
          answer: 0,
          explain: 'A lambda is a single expression whose value is returned automatically. Anything bigger needs `def`.',
          why: ['', 'Lambdas take parameters: `lambda n: n * 2`.', 'A lambda always returns its expression.', 'Passing a lambda into another function is the main reason to write one.'],
        },
        {
          q: 'What does `print(get_name)` show, when `get_name` is a function?',
          choices: ['Something like `<function get_name at ...>`', 'The value the function returns', 'An error'],
          answer: 0,
          explain: 'Without `()` the function isn\'t called. You\'re printing the function object itself.',
          why: ['', 'That needs `get_name()` with parentheses.', 'Printing a function is allowed. Only things like adding it to a string fail.'],
        },
        {
          q: 'What is `apply_twice(lambda n: n + 1, 5)` if `apply_twice(fn, x)` returns `fn(fn(x))`?',
          choices: ['`7`', '`6`', '`10`', '`11`'],
          answer: 0,
          explain: '`fn(5)` is 6, then `fn(6)` is 7.',
          why: ['', 'That\'s only one call. It calls fn twice.', 'That would be doubling. This fn adds 1.', 'It adds 1 twice: 5 + 1 + 1.'],
        },
      ],
    },
  ],
};
