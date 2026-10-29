// Python course · lesson 14. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'classes-and-dataclasses',
  builds: ['python/functions-and-errors', 'python/dictionaries', 'js/objects', 'js/classes-and-this'],
  title: 'Classes and dataclasses',
  goal: 'Bundle data and behavior with a class, raise your own exception type, and let @dataclass write the boilerplate.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'A class is a blueprint',
      md: `
So far your data has lived in dicts (lesson 7): \`{"owner": "Ada", "balance": 50}\`. A **class** lets you bundle that data together with the functions that work on it.

~~~py
class Counter:
    def __init__(self, start=0):
        self.count = start          # store data on the object

    def increment(self):
        self.count += 1
        return self.count

c = Counter()
c.increment()
c.increment()
print(c.count)
~~~

Coming from JavaScript:

| JavaScript | Python |
|---|---|
| \`constructor(start)\` | \`def __init__(self, start)\` |
| \`this.count\` | \`self.count\` |
| \`new Counter()\` | \`Counter()\`, no \`new\` |

The odd part is \`self\`. Python passes the object to every method **explicitly** as the first parameter. You write it in the \`def\`, but you never pass it yourself: \`c.increment()\` becomes \`Counter.increment(c)\` behind the scenes.
`,
    },
    {
      type: 'predict',
      title: 'Two objects, two counts',
      code: `class Counter:
    def __init__(self, start=0):
        self.count = start

    def increment(self):
        self.count += 1

a = Counter()
b = Counter(10)
a.increment()
a.increment()
b.increment()
print(a.count, b.count)`,
      output: `2 11`,
      explain: 'Each call to `Counter(...)` makes a new object with its own `self.count`. Changing `a` never touches `b`. The class is the blueprint; each object is a separate house built from it.',
    },
    {
      type: 'task',
      title: 'Dog',
      md: `
**Example:**

~~~
class Cat:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} says meow"
~~~

**Your turn:** write a \`Dog\` class. \`Dog("Rex").name\` is \`"Rex"\`, and \`Dog("Rex").speak()\` returns \`"Rex says woof"\`.
`,
      starter: `class Dog:
    pass  # your code here
`,
      tests: [
        { name: 'Dog("Rex").name is "Rex"', code: `eq(Dog("Rex").name, "Rex")` },
        { name: 'speak() uses the name', code: `eq(Dog("Rex").speak(), "Rex says woof")` },
        { name: 'two dogs keep their own names', code: `a = Dog("A"); b = Dog("B")
eq(a.speak(), "A says woof")` },
      ],
      hint: 'Copy the shape of `Cat` exactly and change "meow" to "woof". Forgetting `self` as the first parameter of `speak` is the most common error here.',
      solution: `class Dog:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} says woof"
`,
    },
    {
      type: 'read',
      title: 'Methods that protect the data',
      md: `
The point of putting functions **inside** the class is that they can enforce rules. Here a bank account refuses a negative deposit, using the \`raise\` from lesson 13:

~~~py
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        self.balance += amount
        return self.balance

acct = BankAccount("Ada", 50)
print(acct.deposit(25))
try:
    acct.deposit(-5)
except ValueError as e:
    print("refused:", e)
print(acct.balance)
~~~

Because the check raises **before** the balance changes, a bad call leaves the account exactly as it was.
`,
    },
    {
      type: 'task',
      title: 'withdraw',
      md: `
Add a \`withdraw(amount)\` method to \`BankAccount\`. If \`amount\` is more than \`self.balance\`, raise \`ValueError("insufficient funds")\` and leave the balance alone. Otherwise subtract it and return the new balance.

- \`BankAccount("Ada", 50).withdraw(20)\` returns \`30\`
- \`BankAccount("Ada", 50).withdraw(80)\` raises \`ValueError\`, and the balance stays \`50\`
`,
      starter: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        self.balance += amount
        return self.balance

    # add withdraw here
`,
      tests: [
        { name: 'withdrawing 20 from 50 returns 30', code: `eq(BankAccount("Ada", 50).withdraw(20), 30)` },
        { name: 'too much raises ValueError and keeps the balance', code: `a = BankAccount("Ada", 50)
try:
    a.withdraw(80)
    raise AssertionError("expected a ValueError, but nothing was raised")
except ValueError as e:
    eq(str(e), "insufficient funds")
eq(a.balance, 50)` },
      ],
      hint: 'Same shape as `deposit`: check first (`if amount > self.balance: raise ...`), then `self.balance -= amount` and return it. Don\'t forget `self` in the `def` line.',
      solution: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        self.balance += amount
        return self.balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount
        return self.balance
`,
    },
    {
      type: 'read',
      title: 'Your own exception type',
      md: `
\`ValueError("insufficient funds")\` works, but a caller can't tell it apart from any other \`ValueError\` without reading the message. A class that **inherits** from \`Exception\` gives the error its own name:

~~~py
class OutOfStock(Exception):
    pass

def buy(stock):
    if stock == 0:
        raise OutOfStock("nothing left")
    return stock - 1

try:
    buy(0)
except OutOfStock as e:
    print("caught:", e)
~~~

\`class OutOfStock(Exception):\` reads as "OutOfStock is a kind of Exception". The parentheses after a class name list its **parent** class, like JavaScript's \`class OutOfStock extends Error\`. The body can be just \`pass\`: it inherits everything it needs, including the message.

Now \`except OutOfStock\` catches exactly this problem and nothing else.
`,
    },
    {
      type: 'task',
      title: 'InsufficientFunds',
      md: `
Define \`class InsufficientFunds(Exception)\` (the body can be \`pass\`), and change \`withdraw\` to raise \`InsufficientFunds("insufficient funds")\` instead of \`ValueError\`.

Tests check that \`withdraw(80)\` on a balance of 50 raises \`InsufficientFunds\`.
`,
      starter: `class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount
        return self.balance
`,
      tests: [
        { name: 'InsufficientFunds is an Exception subclass', code: `assert issubclass(InsufficientFunds, Exception), "InsufficientFunds should inherit from Exception"` },
        { name: 'withdrawing too much raises InsufficientFunds', code: `try:
    BankAccount("Ada", 50).withdraw(80)
    raise AssertionError("expected InsufficientFunds, but nothing was raised")
except InsufficientFunds:
    pass` },
        { name: 'a normal withdrawal still works', code: `eq(BankAccount("Ada", 50).withdraw(20), 30)` },
      ],
      hint: 'Put `class InsufficientFunds(Exception):` with `pass` above `BankAccount`, then swap `ValueError` for `InsufficientFunds` in the `raise` line.',
      solution: `class InsufficientFunds(Exception):
    pass


class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise InsufficientFunds("insufficient funds")
        self.balance -= amount
        return self.balance
`,
    },
    {
      type: 'predict',
      title: 'Are these equal?',
      md: 'Two plain-class points with the same coordinates. What does `==` say?',
      code: `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

a = Point(1, 2)
b = Point(1, 2)
print(a == b)
print(a.x == b.x and a.y == b.y)`,
      output: `False
True`,
      explain: 'For a plain class, `==` asks "is this the very same object?", just like `===` on two JavaScript objects. `a` and `b` are two separate objects that happen to hold the same values, so the answer is `False`. To compare by value you would have to write an `__eq__` method yourself. The next step shows a shortcut.',
    },
    {
      type: 'read',
      title: '@dataclass writes the boilerplate',
      md: `
Many classes are mostly data: an \`__init__\` that copies arguments onto \`self\`, plus value comparison and a readable print. \`@dataclass\` writes all three for you from a list of typed fields:

~~~py
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int

    def flipped(self):            # normal methods still work
        return Point(self.y, self.x)

p = Point(1, 2)
print(p)                          # a readable __repr__ for free
print(p == Point(1, 2))           # __eq__ compares field by field
print(p.flipped())
~~~

The \`x: int\` lines are **type hints**: they name the fields and their types. Python doesn't enforce the types at runtime here. (Pydantic, in lesson 18, does.)

A line starting with \`@\` is a **decorator**: it takes the class (or function) defined right below it and adds to it. FastAPI's \`@app.get(...)\` in lesson 17 is the same idea.
`,
    },
    {
      type: 'predict',
      title: 'A list as a field default',
      md: 'Lesson 13 warned about `items=[]` as a function default. What does a dataclass do with it?',
      throws: true,
      code: `from dataclasses import dataclass

@dataclass
class Order:
    id: int
    items: list = []

print(Order(1))`,
      output: `! ValueError: mutable default <class 'list'> for field items is not allowed: use default_factory (line 3)`,
      explain: `
Dataclasses know about the shared-default trap and refuse to let you fall in. The fix is \`field(default_factory=list)\`: instead of one shared list, the dataclass **calls** \`list()\` to make a fresh one for every new object.

~~~
from dataclasses import dataclass, field

@dataclass
class Order:
    id: int
    items: list = field(default_factory=list)
~~~
`,
    },
    {
      type: 'task',
      title: 'Order',
      md: `
Write a dataclass \`Order\` with fields \`id\` (an int), \`customer\` (a str) and \`items\` (a list that defaults to a fresh empty list). Add a method \`add(self, item)\` that appends \`item\` to \`self.items\` and returns \`self\`, so calls can chain.

- \`Order(1, "Ada").items\` is \`[]\`
- \`Order(1, "Ada").add("pen").add("ink").items\` is \`["pen", "ink"]\`
- \`Order(1, "Ada") == Order(1, "Ada")\` is \`True\`
`,
      starter: `from dataclasses import dataclass, field


class Order:
    pass  # your code here
`,
      tests: [
        { name: 'items starts empty', code: `eq(Order(1, "Ada").items, [])` },
        { name: 'add chains and appends', code: `eq(Order(1, "Ada").add("pen").add("ink").items, ["pen", "ink"])` },
        { name: 'two orders do not share a list', code: `a = Order(1, "Ada").add("pen")
eq(Order(2, "Bob").items, [])` },
        { name: 'equal fields compare equal', code: `eq(Order(1, "Ada") == Order(1, "Ada"), True)` },
      ],
      hint: 'Put `@dataclass` above the class, then three field lines: `id: int`, `customer: str`, `items: list = field(default_factory=list)`. `add` ends with `return self`.',
      solution: `from dataclasses import dataclass, field


@dataclass
class Order:
    id: int
    customer: str
    items: list = field(default_factory=list)

    def add(self, item):
        self.items.append(item)
        return self
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'What is `self` in a method?',
          choices: ['The object the method was called on, passed in automatically', 'A keyword you must pass yourself: `c.increment(c)`', 'The class itself', 'A global variable shared by all objects'],
          answer: 0,
          explain: '`c.increment()` passes `c` as `self` for you. It is Python\'s explicit version of JavaScript\'s `this`.',
          why: { 1: 'You write `self` in the `def`, but Python fills it in on the call.', 2: '`self` is one particular object, not the blueprint.', 3: 'Each object gets its own `self`, which is why two counters keep separate counts.' },
        },
        {
          q: 'Two plain-class objects hold the same values. What does `a == b` give?',
          choices: ['`False`, because they are different objects', '`True`, because the values match', 'An error'],
          answer: 0,
          explain: 'Without an `__eq__` method, `==` compares identity. `@dataclass` writes a value-comparing `__eq__` for you.',
          why: { 1: 'That is what a dataclass gives you, not a plain class.', 2: 'Comparing objects is always allowed. It just compares identity by default.' },
        },
        {
          q: 'How do you give a dataclass field a fresh empty list for each object?',
          choices: ['`items: list = field(default_factory=list)`', '`items: list = []`', '`items: list = None`', '`items = list`'],
          answer: 0,
          explain: '`default_factory` is called once per new object, so nothing is shared.',
          why: { 1: 'The dataclass raises a ValueError for this, to stop the shared-list bug.', 2: 'That defaults to `None`, so `self.items.append` would fail.', 3: 'Without a type hint it is not a field at all, just the `list` class stored on the class.' },
        },
        {
          q: 'What does `class OutOfStock(Exception): pass` do?',
          choices: ['Creates a new exception type you can raise and catch by name', 'Raises an Exception immediately', 'Catches every Exception named OutOfStock', 'Nothing, `pass` makes it an empty, unusable class'],
          answer: 0,
          explain: 'It inherits everything from `Exception`, including the message, and gives it a name `except` can target.',
          why: { 1: 'Defining a class never raises anything. `raise OutOfStock(...)` does.', 2: 'Catching is `except OutOfStock`.', 3: 'It inherits everything it needs from `Exception`, so `pass` is enough.' },
        },
      ],
    },
  ],
};
