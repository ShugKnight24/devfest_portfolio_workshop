// Python course · lesson 4. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'strings',
  builds: ['python/conditionals', 'js/strings'],
  title: 'Strings',
  goal: 'Index, slice and search strings, and chain methods like lower, strip, split and join, knowing each one returns a new string.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'A string is a sequence of characters',
      md: `
A string is text in quotes. \`"hello"\` and \`'hello'\` are the same thing. Pick one style and stick to it.

Each character has a position called an **index**, counting from **0**:

~~~
 h   e   l   l   o
 0   1   2   3   4      ← index from the start
-5  -4  -3  -2  -1      ← negative index from the end
~~~

~~~py
word = "hello"
print(len(word))     # length: how many characters
print(word[0])       # first character
print(word[1])       # second character
print(word[-1])      # last character
~~~

\`len\` is a built-in **function** you call on the string, \`len(word)\`. It isn't a method, so it's not \`word.len()\`.
`,
    },
    {
      type: 'predict', throws: true,
      title: 'Off the end',
      md: '`"hello"` has 5 characters. What happens when you ask for index 5?',
      code: `word = "hello"
print(word[4])
print(word[5])`,
      output: `o
! IndexError: string index out of range (line 3)`,
      explain: 'Indexes start at 0, so the last one is `len(word) - 1`, which is 4. Index 5 doesn\'t exist. For the last character, use `word[-1]`: it works for any length.',
    },
    {
      type: 'task',
      title: 'length',
      md: '`length("hello")` returns `5`, and `length("")` returns `0`.',
      starter: `def length(s):
    pass  # your code here
`,
      tests: [
        { name: 'length("hello") returns 5', code: `eq(length("hello"), 5)` },
        { name: 'length("") returns 0', code: `eq(length(""), 0)` },
      ],
      hint: '`return len(s)`',
      solution: `def length(s):
    return len(s)
`,
    },
    {
      type: 'task',
      title: 'first_char',
      md: `
**Example:**

~~~
def second_char(s):
    return s[1]
~~~

**Your turn:** \`first_char("hello")\` returns \`"h"\`.
`,
      starter: `def first_char(s):
    pass  # your code here
`,
      tests: [{ name: 'first_char("hello") returns "h"', code: `eq(first_char("hello"), "h")` }],
      hint: 'Indexes start at 0: `s[0]`.',
      solution: `def first_char(s):
    return s[0]
`,
    },
    {
      type: 'task',
      title: 'last_char',
      md: '`last_char("hello")` returns `"o"`, and `last_char("a")` returns `"a"`. It should work for any length.',
      starter: `def last_char(s):
    pass  # your code here
`,
      tests: [
        { name: 'last_char("hello") returns "o"', code: `eq(last_char("hello"), "o")` },
        { name: 'last_char("a") returns "a"', code: `eq(last_char("a"), "a")` },
      ],
      hint: 'A negative index counts from the end: `s[-1]`.',
      solution: `def last_char(s):
    return s[-1]  # same as s[len(s) - 1], but shorter
`,
    },
    {
      type: 'read',
      title: 'Strings never change: methods return new strings',
      md: `
Strings have **methods**, functions you call with a dot: \`s.upper()\`, \`s.lower()\`, \`s.strip()\` (removes spaces at both ends).

The important part is that strings are **immutable**: they can never be changed. A method doesn't change the string you call it on. It **returns a new string**.

~~~py
name = "  Ada  "
name.strip()             # makes a new string... and throws it away
print(f"[{name}]")       # unchanged

clean = name.strip()     # keep the new string
print(f"[{clean}]")
~~~

To "change" a string, store the result: \`name = name.strip()\`.
`,
    },
    {
      type: 'predict',
      title: 'Did it change?',
      code: `s = "hello"
s.upper()
print(s)
t = s.upper()
print(t)`,
      output: `hello
HELLO`,
      explain: '`s.upper()` on line 2 builds `"HELLO"` and nobody keeps it, so `s` is still `"hello"`. Storing the result in `t` keeps it.',
    },
    {
      type: 'task',
      title: 'shout',
      md: `
**Example:**

~~~
def whisper(s):
    return s.lower() + "..."
~~~

**Your turn:** \`shout("hey")\` returns \`"HEY!"\`.
`,
      starter: `def shout(s):
    pass  # your code here
`,
      tests: [{ name: 'shout("hey") returns "HEY!"', code: `eq(shout("hey"), "HEY!")` }],
      hint: 'Same shape as `whisper`: `return s.upper() + "!"`.',
      solution: `def shout(s):
    return s.upper() + "!"
`,
    },
    {
      type: 'task',
      title: 'has_at',
      md: `
\`in\` asks "does this text appear inside that text?" and gives \`True\` or \`False\`.

**Example:**

~~~
def has_space(s):
    return " " in s
~~~

**Your turn:** \`has_at("ada@example.com")\` returns \`True\`, \`has_at("ada")\` returns \`False\`.
`,
      starter: `def has_at(email):
    pass  # your code here
`,
      tests: [
        { name: 'has_at("ada@example.com") returns True', code: `eq(has_at("ada@example.com"), True)` },
        { name: 'has_at("ada") returns False', code: `eq(has_at("ada"), False)` },
      ],
      hint: '`return "@" in email`',
      solution: `def has_at(email):
    return "@" in email
`,
    },
    {
      type: 'read',
      title: 'Chaining methods',
      md: `
Each method returns a new string, so you can call another method on the result right away. This is **chaining**, and it reads left to right:

~~~py
raw = "  HeLLo World "
print(raw.strip().lower())
~~~

| Step | Value |
|---|---|
| \`raw\` | \`"  HeLLo World "\` |
| \`.strip()\` | \`"HeLLo World"\` |
| \`.lower()\` | \`"hello world"\` |
`,
    },
    {
      type: 'task',
      title: 'clean',
      md: `
**Example:**

~~~
def tidy(s):
    return s.strip()
~~~

**Your turn:** \`clean("  HeLLo ")\` returns \`"hello"\`: no spaces around it, all lowercase.
`,
      starter: `def clean(s):
    pass  # your code here
`,
      tests: [{ name: 'clean("  HeLLo ") returns "hello"', code: `eq(clean("  HeLLo "), "hello")` }],
      hint: 'Chain two methods: `return s.strip().lower()`.',
      solution: `def clean(s):
    return s.strip().lower()
`,
    },
    {
      type: 'read',
      title: 'Slicing, split and join',
      md: `
A **slice** \`s[start:end]\` takes a piece of a string. The \`end\` index is **not** included. Leave a side out to go all the way to that end:

~~~py
s = "python"
print(s[0:3])    # indexes 0, 1, 2
print(s[2:])     # from index 2 to the end
print(s[:-1])    # everything except the last character
~~~

\`split()\` breaks a string into a **list** of words. \`join\` glues a list back together. Notice that \`join\` is called **on the glue**, not on the list:

~~~py
words = "hello big world".split()
print(words)
print("-".join(words))
print(" ".join(["a", "b", "c"]))
~~~
`,
    },
    {
      type: 'predict',
      title: 'Slicing',
      code: `s = "interview"
print(s[0:5])
print(s[5:])
print(s[-4:])`,
      output: `inter
view
view`,
      explain: '`s[0:5]` is indexes 0–4, five characters. `s[5:]` is from index 5 to the end. `s[-4:]` is the last four characters, which happens to be the same `"view"`.',
    },
    {
      type: 'task',
      title: 'first_word',
      md: `
**Example:**

~~~
def words(sentence):
    return sentence.split()
~~~

**Your turn:** \`first_word("hello big world")\` returns \`"hello"\`.
`,
      starter: `def first_word(sentence):
    pass  # your code here
`,
      tests: [{ name: 'first_word("hello big world") returns "hello"', code: `eq(first_word("hello big world"), "hello")` }],
      hint: '`split()` gives a list, and `[0]` takes its first item: `return sentence.split()[0]`.',
      solution: `def first_word(sentence):
    return sentence.split()[0]
`,
    },
    {
      type: 'predict', throws: true,
      title: 'join is backwards from what you expect',
      code: `words = ["a", "b"]
print("-".join(words))
print(words.join("-"))`,
      output: `a-b
! AttributeError: 'list' object has no attribute 'join' (line 3)`,
      explain: '`join` is a **string** method: you call it on the separator and hand it the list, `"-".join(words)`. Lists don\'t have a `join` method.',
    },
    {
      type: 'task',
      title: 'slug',
      md: `
**Example:**

~~~
def dotted(parts):
    return ".".join(parts)
~~~

**Your turn:** \`slug("Hello Big World")\` returns \`"hello-big-world"\`. That's lowercase, split into words, then joined with \`-\`.
`,
      starter: `def slug(title):
    pass  # your code here
`,
      tests: [
        { name: 'slug("Hello Big World") returns "hello-big-world"', code: `eq(slug("Hello Big World"), "hello-big-world")` },
        { name: 'slug("One") returns "one"', code: `eq(slug("One"), "one")` },
      ],
      hint: 'Chain it: `return "-".join(title.lower().split())`.',
      solution: `def slug(title):
    return "-".join(title.lower().split())
`,
      explain: 'Read it inside out: `title.lower()` gives `"hello big world"`, `.split()` gives `["hello", "big", "world"]`, and `"-".join(...)` glues them with dashes.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'After `s = "hi"` and `s.upper()`, what is `s`?',
          choices: ['`"hi"`', '`"HI"`', '`None`'],
          answer: 0,
          explain: 'Strings never change. `upper()` returned a new `"HI"` that wasn\'t stored. Write `s = s.upper()` to keep it.',
          why: ['', 'upper() returns a new string. It doesn\'t change `s`.', '`s` still holds the original string.'],
        },
        {
          q: 'How do you get the last character of any string `s`?',
          choices: ['`s[-1]`', '`s[len(s)]`', '`s.last()`', '`s[0]`'],
          answer: 0,
          explain: 'A negative index counts from the end. `s[len(s) - 1]` also works, but `s[-1]` is the Python way.',
          why: ['', 'Indexes stop at len(s) - 1, so this is an IndexError.', 'Strings have no `last()` method.', 'That\'s the first character.'],
        },
        {
          q: 'What is `"python"[1:4]`?',
          choices: ['`"yth"`', '`"ytho"`', '`"pyth"`'],
          answer: 0,
          explain: 'Indexes 1, 2 and 3. The end index is not included.',
          why: ['', 'The end index (4) is not included.', 'The slice starts at index 1, not 0.'],
        },
        {
          q: 'How do you join `["a", "b"]` into `"a-b"`?',
          choices: ['`"-".join(["a", "b"])`', '`["a", "b"].join("-")`', '`join(["a", "b"], "-")`'],
          answer: 0,
          explain: '`join` is a string method, called on the separator.',
          why: ['', 'Lists don\'t have a join method. That\'s an AttributeError.', 'There\'s no built-in `join` function.'],
        },
        {
          q: 'What does `"@" in "ada@example.com"` give?',
          choices: ['`True`', '`3`', '`"@"`'],
          answer: 0,
          explain: '`in` asks whether one string appears inside another, and answers `True` or `False`.',
          why: ['', 'That\'s a position. `in` only answers yes or no. (`.find("@")` gives the position.)', '`in` gives a boolean, not the matched text.'],
        },
      ],
    },
  ],
};
