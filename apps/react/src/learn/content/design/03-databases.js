// System design · lesson 3. Track lang is null: nothing runs, predicts carry an `output` answer.
export default {
  id: 'databases',
  builds: ['js/arrays-of-objects', 'js/filter-and-find', 'dsa/trees'],
  title: 'Databases: SQL, NoSQL, indexes, transactions, replicas, shards',
  goal: 'Choose between SQL and NoSQL for a design, explain why an index makes a query fast, and tell replication apart from sharding.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Rows are objects you keep',
      md: `
In JavaScript lesson 8 you worked with arrays of objects:

~~~
[ { id: 1, name: "Ada", age: 36 }, { id: 2, name: "Linus", age: 17 } ]
~~~

A database keeps data like that **permanently**: it survives restarts, many servers can share it, and it stays correct when many requests write at once.

This lesson covers the database words that come up in every design:

- SQL vs NoSQL
- indexes
- transactions
- replication
- sharding

Each one answers a specific problem. Learn the problem, and the word sticks.
`,
    },
    {
      type: 'read',
      title: 'SQL: tables and joins',
      md: `
A **relational** (SQL) database like PostgreSQL stores **tables** with fixed columns. Tables point at each other with ids, and a **join** combines them in one query:

~~~sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY, name TEXT, email TEXT UNIQUE
);
CREATE TABLE orders (
  id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id),
  total NUMERIC, created_at TIMESTAMPTZ
);

SELECT users.name, orders.total
FROM orders JOIN users ON users.id = orders.user_id
WHERE orders.total > 100;
~~~

What you get:

- **Flexible questions.** You can ask new questions later ("orders over 100") without redesigning anything.
- **Rules the database enforces:** \`UNIQUE\` emails, orders that must point at a real user.
- **Transactions** (coming up).

The cost: one primary database handles all the writes, so writes are harder to spread across machines.
`,
    },
    {
      type: 'read',
      title: 'NoSQL: designed around your questions',
      md: `
"NoSQL" covers several kinds of database. The two you'll meet most:

- **Key-value / wide-column**, like DynamoDB or Cassandra: you look items up by a **key** you designed.
- **Document**, like MongoDB: each record is a JSON-like document.

In DynamoDB you might store orders with a **partition key** \`userId\` and a **sort key** \`orderId\`. Then "all orders for user 42" is one fast lookup, however big the table gets.

~~~
partition key   sort key      other fields
userId=42       order#0007    total=30, status=paid
userId=42       order#0009    total=12, status=new
~~~

What you get: it spreads across many machines by design, so it handles huge volume.

The cost: **you must know your questions up front.** "All orders over 100, across every user" isn't a key lookup. You'd need an extra index (a GSI, global secondary index) or a full scan.

**A simple rule for interviews:** start with Postgres unless you have a reason not to. The reasons: write volume one machine can't take, or access that's always "look up by this key".
`,
    },
    {
      type: 'read',
      title: 'Indexes: the back of the book',
      md: `
Without an index, \`SELECT * FROM users WHERE email = 'ada@example.com'\` checks **every row**. That's \`users.find(...)\` from JavaScript lesson 10: a loop over the whole list.

An **index** is a separate, sorted structure (usually a B-tree) that maps a column's values to where the rows live, like the index at the back of a book. With an index on \`email\`, the database jumps almost straight to the row.

~~~sql
CREATE INDEX users_email_idx ON users (email);
~~~

| | No index | With index |
|---|---|---|
| Lookup cost | grows with the table (every row) | grows very slowly (about log of the row count) |
| Writes | just the row | the row **and** every index on it |
| Disk | just the table | extra space per index |

So indexes aren't free. Add one for each query that runs often and filters or sorts on a column, and not for every column "just in case".

A **composite index** covers several columns in order. \`(conversation_id, created_at)\` makes "the latest 50 messages in this conversation" fast. You'll use exactly that in the chat lesson.
`,
    },
    {
      type: 'predict',
      title: 'The page that got slower every month',
      code: `Login does: SELECT * FROM users WHERE email = ?
The users table has a primary key on id, and nothing else.

Month 1: 5,000 users      login feels instant
Month 12: 5,000,000 users  ???`,
      output: `Login gets slower and slower. With no index on email,
every login scans the whole users table, so its cost grows
with the number of users.`,
      explain: `
At 5,000 rows a full scan is cheap enough that nobody notices, which is why this bug ships. At millions of rows each login reads the whole table, and many logins at once can swamp the database.

The fix is one line: an index on \`email\` (and \`UNIQUE\`, since emails shouldn't repeat). When you name a table in step 3 of the script, say which queries it serves and which index makes each one fast.
`,
    },
    {
      type: 'read',
      title: 'Transactions: all or nothing',
      md: `
Some changes only make sense together. Moving 50 from Ada's account to Grace's is **two** updates:

~~~sql
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 'ada';
UPDATE accounts SET balance = balance + 50 WHERE id = 'grace';
COMMIT;
~~~

A **transaction** wraps them so they happen **all or nothing**. If anything fails before \`COMMIT\`, the database rolls back to before \`BEGIN\`. The guarantees are usually called **ACID**:

- **Atomic:** all or nothing.
- **Consistent:** rules like "balance can't be negative" still hold afterwards.
- **Isolated:** other transactions don't see a half-finished one. Postgres's default level is READ COMMITTED; stricter levels exist when you need them.
- **Durable:** once committed, it survives a crash.

Relational databases are built around transactions. Many NoSQL stores offer more limited ones; DynamoDB, for example, has transactions over a small group of items.
`,
    },
    {
      type: 'predict',
      title: 'The crash in the middle',
      code: `No transaction. The server runs:
  1. UPDATE accounts SET balance = balance - 50 WHERE id = 'ada'
  -- the server crashes here --
  2. UPDATE accounts SET balance = balance + 50 WHERE id = 'grace'`,
      output: `Ada has lost 50 and Grace never got it. The money has
vanished, because the first update was saved on its own.`,
      explain: `
Without a transaction, each statement is saved as soon as it runs. A crash between them leaves the data half-changed.

Inside \`BEGIN ... COMMIT\`, the crash means the transaction never committed, so the first update is rolled back and both balances are as they were. Whenever a design has "do A and B together", say the word **transaction**.
`,
    },
    {
      type: 'read',
      title: 'Replication: copies for reads and safety',
      md: `
**Replication** keeps full copies of the database on other machines.

~~~
writes --> [ Primary ] --copies changes--> [ Replica 1 ]
                       --copies changes--> [ Replica 2 ]
reads  --> any of the three
~~~

- All **writes** go to the primary.
- **Reads** can go to replicas, which spreads the read load.
- If the primary dies, a replica can be **promoted** to take over.

Most setups copy changes **asynchronously**: the primary confirms the write first and the replicas catch up a moment later. That gap is called **replication lag**, usually milliseconds but longer under heavy load.

Replication helps **reads** and **availability**. It does not help write volume: every replica still has to apply every write.
`,
    },
    {
      type: 'predict',
      title: 'Where did my change go?',
      code: `1. User saves a new display name  -> write goes to the primary
2. Page reloads, GET /profile       -> read goes to a replica
   The replica is 200 ms behind.`,
      output: `The page shows the OLD name. The read hit a replica that
hadn't received the change yet.`,
      explain: `
This is called a **read-your-writes** problem, and it's the classic side effect of read replicas.

Common fixes:

- Send a user's reads to the **primary** for a short time after they write.
- Read your own profile from the primary, and other people's from replicas.
- Return the saved value in the write's response, so the page doesn't need to read it again.
`,
    },
    {
      type: 'read',
      title: 'Sharding: splitting the data',
      md: `
When one primary can't take all the **writes**, or the data doesn't fit on one machine, you **shard** (also called partitioning): split the rows across several databases by a **shard key**.

~~~
shard = hash(user_id) % 4

[ Shard 0 ]  [ Shard 1 ]  [ Shard 2 ]  [ Shard 3 ]
 users whose hash lands on each number
~~~

| | Replication | Sharding |
|---|---|---|
| Each machine holds | all the data | part of the data |
| Helps with | reads, surviving failures | writes, data size |
| Costs | replication lag | queries across shards are hard |

Choosing the shard key is the whole game. A good key:

- spreads load **evenly**;
- keeps the data one request needs **on one shard**.

For chat, \`conversation_id\` is good: "the last 50 messages in this conversation" touches one shard. In practice you use both: each shard has its own replicas.
`,
    },
    {
      type: 'predict',
      title: 'The hot shard',
      code: `An analytics table is sharded by the event's date.
Shards: one per day.
Every new event that arrives today is written...`,
      output: `...to today's shard. All writes hit one shard while the
others sit idle, so sharding gave no write scaling at all.`,
      explain: `
This is a **hot partition**: one shard gets most of the traffic. Dates, auto-incrementing ids, and a single very popular key (one celebrity's account, say) all cause it.

Fixes: shard by something that spreads evenly, like a hash of the user id or device id. Or add a small random suffix to a hot key, so its writes spread over several shards, and combine the pieces when you read.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'An admin tool needs to ask new questions of the data every month, with joins across users, orders and products. Which fits better?',
          choices: ['A relational database like Postgres', 'A key-value store designed around one access pattern', 'A cache'],
          answer: 0,
          explain: 'SQL handles new questions and joins without redesigning the data.',
          why: { 1: 'Key-value stores need the questions known up front.', 2: 'A cache isn\'t where data is permanently stored.' },
        },
        {
          q: 'What does an index cost you?',
          choices: ['Slower writes and extra storage', 'Slower reads on that column', 'Nothing at all'],
          answer: 0,
          explain: 'Every insert or update must also update each index on the table.',
          why: { 1: 'Indexes make matching reads faster, not slower.', 2: 'They take space and slow down writes.' },
        },
        {
          q: 'Reads are overloading your Postgres primary, but writes are fine. What do you add first?',
          choices: ['Read replicas (or a cache)', 'Sharding', 'A bigger write-ahead log'],
          answer: 0,
          explain: 'Replicas spread read load. Sharding is for write volume or data size, and it costs much more complexity.',
          why: { 1: 'Sharding solves a write or size problem you don\'t have yet.', 2: 'That doesn\'t address read load.' },
        },
        {
          q: 'A user updates their email and immediately sees the old one. Reads go to an async replica. What is missing?',
          choices: ['Read-your-writes consistency', 'An index on email', 'A transaction'],
          answer: 0,
          explain: 'The replica hadn\'t caught up. Route that user\'s reads to the primary briefly after a write.',
          why: { 1: 'The data exists; it just hasn\'t reached the replica.', 2: 'The write committed fine; the read went to a lagging copy.' },
        },
        {
          q: 'Which is the best shard key for a messages table whose main query is "latest 50 messages in a conversation"?',
          choices: ['conversation_id', 'created_at', 'sender_id'],
          answer: 0,
          explain: 'One conversation lives on one shard, so the main query touches one shard, and many conversations spread the load.',
          why: { 1: 'All new messages would land on the newest shard.', 2: 'A conversation\'s messages would be scattered over many shards.' },
        },
      ],
    },
  ],
};
