// Python course · lesson 8. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~py get a Run button, so they must run cleanly).
const P08_USERS = `USERS = [
    {"id": 1, "name": "Ada", "age": 36, "active": True},
    {"id": 2, "name": "Linus", "age": 17, "active": False},
    {"id": 3, "name": "Grace", "age": 45, "active": True},
]
ADA, LINUS, GRACE = USERS
`;

export default {
  id: 'lists-of-dictionaries',
  builds: ['python/dictionaries', 'js/arrays-of-objects'],
  title: 'Lists of dictionaries',
  goal: 'Work with the shape every API returns, a list of dicts, using five loop patterns you will reuse forever.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'The shape of every API response',
      md: `
Put lessons 5 and 7 together and you get the most common data shape in real programs: a **list of dicts**.

~~~py
users = [
    {"id": 1, "name": "Ada", "age": 36, "active": True},
    {"id": 2, "name": "Linus", "age": 17, "active": False},
    {"id": 3, "name": "Grace", "age": 45, "active": True},
]
print(len(users))
print(users[0])
~~~

Rows from a database, products in a shop, messages in a chat: almost every API response is this shape. Each dict is one record, and the list holds them in order.

Reading takes two steps: **first pick the dict** by position, **then pick the key**:

~~~py
users = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 17}]
print(users[1]["name"])
~~~

\`users[1]\` is Linus's dict, then \`["name"]\` opens his name box.
`,
    },
    {
      type: 'predict',
      title: 'Reading from a list of users',
      code: `users = [
    {"name": "Ada", "age": 36},
    {"name": "Linus", "age": 17},
]
print(users[0]["age"])
print(users[-1]["name"])
for u in users:
    print(u["name"], u["age"])`,
      output: `36
Linus
Ada 36
Linus 17`,
      explain: 'In the loop, `u` is one whole dict each trip, so `u["name"]` reads that user\'s name. Most work on lists of dicts is exactly this loop with something interesting in the body.',
    },
    {
      type: 'read',
      title: 'Five loop patterns',
      md: `
Nearly every question you ask of a list of dicts is one of five loop shapes. Learn them by name; the next lessons give each one a shorter form.

| Pattern | The question | You start with |
|---|---|---|
| **collect** | "give me X from every item" | \`out = []\` |
| **find** | "give me the first item where..." | nothing; \`return\` from inside the loop |
| **sum / count** | "how much / how many in total?" | \`total = 0\` |
| **keep-if** | "give me all the items where..." | \`out = []\`, append inside an \`if\` |
| **best so far** | "which one is the biggest / oldest / cheapest?" | \`best = items[0]\` |

Every exercise in this lesson uses this data:

~~~
USERS = [
    {"id": 1, "name": "Ada", "age": 36, "active": True},
    {"id": 2, "name": "Linus", "age": 17, "active": False},
    {"id": 3, "name": "Grace", "age": 45, "active": True},
]
~~~
`,
    },
    {
      type: 'predict',
      title: 'Pattern 1: collect',
      md: 'One output item per input item.',
      code: `users = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 17}]

ages = []
for u in users:
    ages.append(u["age"])
print(ages)`,
      output: `[36, 17]`,
      explain: `
| Trip | \`u["age"]\` | \`ages\` after |
|---|---|---|
| start | | \`[]\` |
| 1 | \`36\` | \`[36]\` |
| 2 | \`17\` | \`[36, 17]\` |

Same length in, same length out. Only the expression inside \`append\` changes from one collect to the next.
`,
    },
    {
      type: 'task',
      title: 'names',
      md: `
**Example:**

~~~
def ages(users):
    out = []
    for u in users:
        out.append(u["age"])
    return out
~~~

**Your turn:** \`names(USERS)\` returns \`["Ada", "Linus", "Grace"]\`. Use a plain loop.
`,
      starter: `def names(users):
    pass  # your code here
`,
      tests: [
        { name: 'names(USERS) is ["Ada", "Linus", "Grace"]', code: P08_USERS + `eq(names(USERS), ["Ada", "Linus", "Grace"])` },
        { name: 'names([]) is []', code: `eq(names([]), [])` },
      ],
      hint: 'Same as `ages`, appending `u["name"]`.',
      solution: `def names(users):
    out = []
    for u in users:
        out.append(u["name"])
    return out
`,
    },
    {
      type: 'predict',
      title: 'Pattern 2: find',
      md: 'Return the first match from **inside** the loop.',
      code: `def first_teen(users):
    for u in users:
        if u["age"] < 20:
            return u
    return None

users = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 17}, {"name": "Tim", "age": 15}]
print(first_teen(users))
print(first_teen([{"name": "Ada", "age": 36}]))`,
      output: `{'name': 'Linus', 'age': 17}
None`,
      explain: `
| Trip | \`u["name"]\` | \`age < 20\`? | What happens |
|---|---|---|---|
| 1 | Ada | no | keep looping |
| 2 | Linus | yes | **return Linus**, the function ends |

Tim is never even looked at: \`return\` stops the loop and the function. The \`return None\` **after** the loop only runs when nothing matched.
`,
    },
    {
      type: 'predict',
      title: 'The classic find bug',
      md: 'Spot the difference: the `return None` has moved.',
      code: `def find_name(users, name):
    for u in users:
        if u["name"] == name:
            return u
        else:
            return None

users = [{"name": "Ada"}, {"name": "Grace"}]
print(find_name(users, "Grace"))`,
      output: `None`,
      explain: `
On the very first trip, Ada isn't Grace, so the \`else\` runs and returns \`None\`. The loop never reaches Grace.

You can only say "not found" **after** checking everything, so \`return None\` belongs after the loop, not in an \`else\`.
`,
    },
    {
      type: 'task',
      title: 'find_by_id',
      md: `
**Example:**

~~~
def first_inactive(users):
    for u in users:
        if not u["active"]:
            return u
    return None
~~~

**Your turn:** \`find_by_id(USERS, 3)\` returns Grace's dict, and \`find_by_id(USERS, 99)\` returns \`None\`.
`,
      starter: `def find_by_id(users, user_id):
    pass  # your code here
`,
      tests: [
        { name: 'find_by_id(USERS, 3) is Grace', code: P08_USERS + `eq(find_by_id(USERS, 3), GRACE)` },
        { name: 'finds the first user too', code: P08_USERS + `eq(find_by_id(USERS, 1), ADA)` },
        { name: 'find_by_id(USERS, 99) is None', code: P08_USERS + `assert find_by_id(USERS, 99) is None, "expected None when no user matches"` },
      ],
      hint: 'Same shape as `first_inactive`. The `if` is `u["id"] == user_id`, and `return None` goes **after** the loop.',
      solution: `def find_by_id(users, user_id):
    for u in users:
        if u["id"] == user_id:
            return u  # first match wins; the loop stops here
    return None  # only reached when nothing matched
`,
    },
    {
      type: 'predict',
      title: 'Pattern 3: sum and count',
      code: `users = [{"age": 36, "active": True}, {"age": 17, "active": False}]

total = 0
count = 0
for u in users:
    total += u["age"]
    if u["active"]:
        count += 1
print(total, count)`,
      output: `53 1`,
      explain: `
Both are accumulators from lesson 6: start at \`0\` before the loop, update inside.

- **sum** adds a field every trip.
- **count** adds \`1\` only when the \`if\` is true.
`,
    },
    {
      type: 'task',
      title: 'total_age',
      md: `\`total_age(USERS)\` returns \`98\` (36 + 17 + 45). An empty list gives \`0\`.`,
      starter: `def total_age(users):
    pass  # your code here
`,
      tests: [
        { name: 'total_age(USERS) is 98', code: P08_USERS + `eq(total_age(USERS), 98)` },
        { name: 'total_age([]) is 0', code: `eq(total_age([]), 0)` },
      ],
      hint: '`total = 0`, then in the loop `total += u["age"]`, then return `total` after the loop.',
      solution: `def total_age(users):
    total = 0
    for u in users:
        total += u["age"]
    return total
`,
    },
    {
      type: 'task',
      title: 'count_active',
      md: `\`count_active(USERS)\` returns \`2\`.`,
      starter: `def count_active(users):
    pass  # your code here
`,
      tests: [
        { name: 'count_active(USERS) is 2', code: P08_USERS + `eq(count_active(USERS), 2)` },
        { name: 'count_active([]) is 0', code: `eq(count_active([]), 0)` },
      ],
      hint: 'A count: start at `0` and add `1` when `u["active"]` is true.',
      solution: `def count_active(users):
    count = 0
    for u in users:
        if u["active"]:  # already True/False, no need for == True
            count += 1
    return count
`,
    },
    {
      type: 'predict',
      title: 'Pattern 4: keep-if',
      code: `users = [{"name": "Ada", "active": True}, {"name": "Linus", "active": False}]

kept = []
for u in users:
    if not u["active"]:
        kept.append(u)
print(kept)
print(len(kept), "of", len(users))`,
      output: `[{'name': 'Linus', 'active': False}]
1 of 2`,
      explain: `
Like collect, but the \`append\` is inside an \`if\`, so only matching items make it into the result. The result can be shorter than the input, or empty.

Keep-if appends the **whole dict**, not one field: you get back the matching records themselves.
`,
    },
    {
      type: 'task',
      title: 'adults',
      md: `
**Example:**

~~~
def inactive(users):
    out = []
    for u in users:
        if not u["active"]:
            out.append(u)
    return out
~~~

**Your turn:** \`adults(USERS)\` returns the dicts for Ada and Grace: everyone aged **18 or more**.
`,
      starter: `def adults(users):
    pass  # your code here
`,
      tests: [
        { name: 'adults(USERS) is [Ada, Grace]', code: P08_USERS + `eq(adults(USERS), [ADA, GRACE])` },
        { name: 'exactly 18 counts as an adult', code: `eq(adults([{"name": "Sam", "age": 18}]), [{"name": "Sam", "age": 18}])` },
      ],
      hint: 'Same as `inactive`, with the condition `u["age"] >= 18`. `>=` so that 18 itself is included.',
      solution: `def adults(users):
    out = []
    for u in users:
        if u["age"] >= 18:  # >= so 18 counts
            out.append(u)
    return out
`,
    },
    {
      type: 'predict',
      title: 'Pattern 5: best so far',
      code: `users = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 17}, {"name": "Grace", "age": 45}]

best = users[0]
for u in users:
    if u["age"] < best["age"]:
        best = u
print(best["name"])`,
      output: `Linus`,
      explain: `
| Trip | \`u["name"]\` | younger than \`best\`? | \`best\` after |
|---|---|---|---|
| start | | | Ada |
| 1 | Ada | no (36 < 36 is false) | Ada |
| 2 | Linus | yes | Linus |
| 3 | Grace | no | Linus |

You compare a **field** (\`["age"]\`) but keep the **whole dict** in \`best\`, so at the end you can read any field from the winner.
`,
    },
    {
      type: 'task',
      title: 'oldest',
      md: `
**Example:**

~~~
def youngest(users):
    best = users[0]
    for u in users:
        if u["age"] < best["age"]:
            best = u
    return best
~~~

**Your turn:** \`oldest(USERS)\` returns Grace's dict.
`,
      starter: `def oldest(users):
    pass  # your code here
`,
      tests: [
        { name: 'oldest(USERS) is Grace', code: P08_USERS + `eq(oldest(USERS), GRACE)` },
        { name: 'works when the oldest is first', code: `eq(oldest([{"age": 90}, {"age": 10}]), {"age": 90})` },
      ],
      hint: 'Same as `youngest`, but flip `<` to `>`.',
      solution: `def oldest(users):
    best = users[0]
    for u in users:
        if u["age"] > best["age"]:
            best = u  # keep the whole dict, not just the age
    return best
`,
    },
    {
      type: 'task',
      title: 'Two patterns together: active_names',
      md: `Real questions often combine patterns. \`active_names(USERS)\` returns \`["Ada", "Grace"]\`: the **names** (collect) of the **active** users (keep-if).`,
      starter: `def active_names(users):
    pass  # your code here
`,
      tests: [
        { name: 'active_names(USERS) is ["Ada", "Grace"]', code: P08_USERS + `eq(active_names(USERS), ["Ada", "Grace"])` },
        { name: 'active_names([]) is []', code: `eq(active_names([]), [])` },
      ],
      hint: 'A keep-if loop, but append `u["name"]` instead of the whole `u`.',
      solution: `def active_names(users):
    out = []
    for u in users:
        if u["active"]:
            out.append(u["name"])  # keep-if decides, collect picks the field
    return out
`,
    },
    {
      type: 'read',
      title: 'Coming next: each pattern gets a one-liner',
      md: `
You now know the five loops by heart. The next three lessons replace each one with a shorter, very common Python form:

| Pattern | Loop you wrote | Coming up |
|---|---|---|
| collect | \`out.append(u["name"])\` | \`[u["name"] for u in users]\` (lesson 9) |
| keep-if | \`if ...: out.append(u)\` | \`[u for u in users if u["active"]]\` (lesson 10) |
| find | \`return u\` inside the loop | \`next((u for u in users if ...), None)\` (lesson 10) |
| sum / count | \`total += u["age"]\` | \`sum(u["age"] for u in users)\` (lesson 11) |
| best so far | \`best = u\` when better | \`max(users, key=lambda u: u["age"])\` (lesson 11) |

A sneak peek, just to see they agree:

~~~py
users = [{"name": "Ada", "age": 36, "active": True}, {"name": "Linus", "age": 17, "active": False}]

print([u["name"] for u in users])
print([u["name"] for u in users if u["active"]])
print(sum(u["age"] for u in users))
print(max(users, key=lambda u: u["age"])["name"])
~~~

The short forms are only short because you already know the loop underneath. When one confuses you, write the loop.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer. A wrong pick tells you why.',
      items: [
        {
          q: '`users = [{"name": "Ada"}, {"name": "Linus"}]`. How do you read `"Linus"`?',
          choices: ['`users["name"][1]`', '`users[1]["name"]`', '`users.name[1]`', '`users[2]["name"]`'],
          answer: 1,
          explain: 'First pick the dict by position, then the key: `users[1]` then `["name"]`.',
          why: ['`users` is a list, so `users["name"]` raises `TypeError`: lists take numbers.', '', 'Dict keys are read with brackets, not dots.', 'Index 2 is out of range; Linus is at index 1.'],
        },
        {
          q: 'In a find loop, where does `return None` go?',
          choices: ['In an `else` next to the `if`', 'After the loop', 'Before the loop', 'Nowhere, Python returns None for you'],
          answer: 1,
          explain: 'You can only say "not found" after checking every item.',
          why: ['Then the first non-match returns `None` and later items are never checked.', '', 'Then the function returns before looking at anything.', 'Leaving it out also gives `None`, but writing it makes the "not found" case explicit, and the question is about placement.'],
        },
        {
          q: 'Which pattern answers "which product is cheapest?"',
          choices: ['collect', 'keep-if', 'best so far', 'sum'],
          answer: 2,
          explain: 'You keep one winner and replace it whenever you see a better one.',
          why: ['Collect gives one value per product, not one winner.', 'Keep-if gives every match, possibly many.', '', 'Sum adds the prices together.'],
        },
        {
          q: 'A keep-if loop over 5 users matches 2. How long is the result?',
          choices: ['5', '2', '1', 'It depends on the first user'],
          answer: 1,
          explain: 'Only matching items are appended, so the result has exactly the matches.',
          why: ['That would be collect, which appends for every item.', '', 'That would be find, which returns one item.', 'Every user is checked; the result only depends on how many match.'],
        },
        {
          q: 'For "best so far", why keep the whole dict in `best` instead of just the age?',
          choices: ['Dicts are faster to compare', 'So you can read any field (like the name) of the winner afterwards', 'Python requires it', 'It makes no difference'],
          answer: 1,
          explain: 'Compare on a field, keep the record. Then `best["name"]` works at the end.',
          why: ['You still compare a field (`best["age"]`); speed isn\'t the point.', '', 'Python lets you keep either; it\'s a design choice.', 'Keeping only the age loses who the winner was.'],
        },
      ],
    },
  ],
};
