// System design · lesson 1. Track lang is null: nothing runs, predicts carry an `output` answer.
// Diagrams are plain ~~~ fences, at most 70 characters wide so they fit a phone.
export default {
  id: 'interview-script',
  builds: ['js/functions'],
  title: 'The five-step design script',
  goal: 'Have one calm order to talk in for any design question: clarify, draw boxes, data and API, scale and failure, trade-offs.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'A system is a function, only bigger',
      md: `
In JavaScript lesson 2 you wrote functions: input goes in, a result comes out, and the caller doesn't care how the inside works.

A system is the same shape. A request goes in ("show me my todos"), a response comes out, and inside there are a few **boxes** that each do one job:

~~~
[ Browser ] --> [ API server ] --> [ Database ]
~~~

A system design question asks you to choose those boxes and explain why. There's rarely one right answer. What the interviewer is really watching is **how you think out loud**: do you ask before you build, start simple, notice what breaks, and name what you gave up?

So before any specific design, you need an **order to talk in**. Use the same order every time, and you'll never stare at a blank whiteboard wondering where to start.
`,
    },
    {
      type: 'read',
      title: 'The script',
      md: `
Five steps. The times are a guide for a 15-minute question; stretch them for a 45-minute one.

| Step | Time | What you say |
|---|---|---|
| 1. Clarify | 2 min | "Who uses it? What are the 2 or 3 things it must do? Roughly how many users? Anything sensitive?" |
| 2. Draw the boxes | 3 min | Client, API, database. "This is the version that works for 100 users." |
| 3. Data and API | 3 min | The main table or two, and 2 or 3 endpoints. |
| 4. Scale and failure | 4 min | "When this gets busy, the first thing to break is ___, so I'd add ___." |
| 5. Trade-offs and security | 2 min | "I chose ___, which costs me ___." Then auth, encryption, audit. |

If you freeze, say **"Let me start with the simplest version and grow it,"** and draw three boxes. That is always a correct start.

The rest of this lesson walks through each step on one small example: a todo app.
`,
    },
    {
      type: 'read',
      title: 'Step 1: clarify',
      md: `
Every design question is vague on purpose. "Design a todo app" could mean a personal list or a team tool for 10,000 companies. The interviewer wants to see you notice that.

Ask about two kinds of thing:

- **What it does** (features): "One user per list, or shared lists? Do todos survive a refresh?"
- **How well it must do it** (the numbers and the risks): "How many users, roughly? Is any of the data sensitive?"

Then **say your assumptions out loud** and write them in a corner of the board:

~~~
Assumptions
- one user per list, must survive refresh
- a few thousand users
- no sensitive data beyond the user's email
~~~

Three or four questions is plenty. You're not gathering a full spec. You're showing that you won't build the wrong thing.
`,
    },
    {
      type: 'predict',
      title: 'What goes wrong first?',
      md: 'The interviewer opens with this. What is the problem with the reply?',
      code: `Interviewer: "Design a URL shortener."
You (10 seconds later): "I'd use Cassandra, Kafka and
three Redis clusters across two regions."`,
      output: `You've chosen tools before knowing the problem. You don't
know how many links, how many clicks, or whether analytics
matter, so you can't justify any of those boxes.`,
      explain: `
This is the most common mistake, and it comes from nerves: big tool names feel like a strong answer.

But the interviewer can now ask "why Kafka?", and the honest reply is "I don't know yet." Ask first ("How many new links a day? Are reads much more common than writes? Do we need click counts?"), then pick the simplest boxes that fit those answers.
`,
    },
    {
      type: 'read',
      title: 'Step 2: draw the boxes',
      md: `
Start with three boxes and draw them **left to right in the order a request travels**: the user on the left, storage on the right. Number the arrows, then walk through the numbers out loud.

~~~
[ Browser ] --(1) POST /todos--> [ API ] --(2) INSERT--> [ DB ]
[ Browser ] <--(4) 201 + todo--- [ API ] <--(3) new row-- [ DB ]
~~~

1. The browser sends the new todo.
2. The API checks it (is there a title?) and saves it.
3. The database returns the row with its new id.
4. The API replies \`201 Created\`, and the page shows the todo.

Two habits make this step look senior:

- **Say why each box is there** as you draw it. "The API is the only thing allowed to touch the database, so it can check every input."
- **Add boxes later, one at a time**, when step 4 gives you a reason.
`,
    },
    {
      type: 'read',
      title: 'Step 3: data and API',
      md: `
Name the main table and the endpoints. Keep it short: an interviewer wants the shape, not every column.

~~~
todos(id, user_id, title, done, created_at)
~~~

| Endpoint | Does |
|---|---|
| \`GET /todos\` | lists the logged-in user's todos |
| \`POST /todos\` | creates one, returns \`201\` and the new todo |
| \`PATCH /todos/:id\` | toggles \`done\` |

Notice \`user_id\` on the table. That one column tells the interviewer you've thought about **who owns what**, which leads straight into security in step 5.

This is where your JavaScript work pays off: a row is just an object like \`{ id: 1, title: "Shop", done: false }\`, and \`GET /todos\` returns an array of them, the same shape you filtered and mapped in JavaScript lessons 8 to 10.
`,
    },
    {
      type: 'predict',
      title: 'Who is asking?',
      md: 'Here is one way to write `GET /todos`. What breaks?',
      code: `GET /todos?user_id=42

API: SELECT * FROM todos WHERE user_id = <the user_id
     from the query string>`,
      output: `Anyone can change 42 to 43 and read someone else's todos.
The API trusts an id the browser sent instead of the
logged-in user's id from their verified token.`,
      explain: `
The browser is not on your side: anyone can edit a URL or a request body. The API must take the user's identity from something it can verify, such as a signed login token, and ignore any \`user_id\` the client sends.

You'll meet this again in the secure dashboard lesson. For now, the habit is: **never trust who the client says it is.**
`,
    },
    {
      type: 'read',
      title: 'Step 4: what breaks first, and the fix',
      md: `
Now grow the design, **one problem at a time**. The sentence to use is:

> "When this gets busy, the first thing to break is ___, so I'd add ___."

Most fixes come from a short menu. You'll learn each one properly in lessons 2 to 6:

| Symptom | Usual fix |
|---|---|
| One server can't keep up | more servers behind a **load balancer** |
| The same data is read over and over | a **cache** |
| The database is busy with reads | **read replicas** |
| Something slow or flaky sits inside a request | a **queue** and a **worker** |
| Users are far away, or files are big | a **CDN** and object storage |

The trap is adding all of them up front. Each box costs money, adds a way to fail, and needs explaining. A box with no reason behind it is a weakness, not a strength.
`,
    },
    {
      type: 'predict',
      title: 'What breaks first at a few thousand users?',
      md: 'The interviewer asks step 4 for the todo app. What is the best answer?',
      code: `Assumptions on the board: a few thousand users,
each adding maybe 10 todos a day.

Interviewer: "What breaks first?"`,
      output: `Nothing, at this size. One API server and one Postgres
database handle this easily. I'd add a second server behind
a load balancer only if we needed to survive one failing.`,
      explain: `
"Nothing yet" is a real answer, and saying it shows judgment. A few thousand users adding about 10 todos a day is tens of thousands of writes a day: well under one write per second on average.

Then offer what you *would* watch: "If we grew 100 times, I'd look at database reads first and add a cache or a read replica."
`,
    },
    {
      type: 'read',
      title: 'Step 5: trade-offs and security',
      md: `
Close with one choice and its cost. The shape is always the same:

> "I chose ___. That gives me ___, and costs me ___."

For the todo app: "I chose one server and one database. That keeps it simple and cheap, and costs me availability: if the server goes down, the app is down. Fine for now, and easy to grow."

Then a sentence on security. You don't need a lecture, just the basics, said plainly:

- **Auth:** every request carries a login token, and the API checks it.
- **Ownership:** the API only returns the logged-in user's rows.
- **Encryption:** HTTPS in transit, encryption at rest in the database.
- **Audit:** for sensitive systems, log who did what and when.

Useful phrases that buy you a moment to think:

- "Let me start simple and then scale it."
- "I'd measure before adding that, but if it became a bottleneck, I'd..."
- "The trade-off here is..."
`,
    },
    {
      type: 'read',
      title: 'The 60-second version',
      md: `
Every case study in this track ends with a **60-second version**: the whole design in one short paragraph you can say out loud. Here is the todo app:

> "Three boxes: a React client, an API, and a Postgres database. The client calls REST endpoints, and the API validates input and is the only thing that talks to the database. Each todo has a user_id, and the API only reads the logged-in user's rows, taken from their verified token. At this size one server is enough. If we grew a lot, I'd add a cache or a read replica first. We never trust ids sent by the browser."

**How to practise:** read a design once, cover the page, then say its 60-second version out loud and redraw the boxes. If you can tell the story without notes, you know it. You don't need to memorize every detail.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Answer out loud before you open each one.',
      items: [
        {
          q: 'The interviewer says "Design a chat app." What do you do first?',
          choices: ['Ask a few questions: who uses it, group chats or not, roughly how many users', 'Draw the full architecture with every component you know', 'Start writing the database schema'],
          answer: 0,
          explain: 'Clarify first. The answers decide which boxes you need, and asking shows you won\'t build the wrong thing.',
          why: { 1: 'Drawing everything before you know the problem means you can\'t justify any of it.', 2: 'The schema depends on the features, which you haven\'t asked about yet.' },
        },
        {
          q: 'Which order do you draw boxes in?',
          choices: ['Biggest component first', 'Left to right, in the order a request travels', 'Database first, then work outwards'],
          answer: 1,
          explain: 'Following the request lets you narrate it with numbered arrows: "1, the browser sends... 2, the API checks..."',
          why: { 0: 'Size doesn\'t help the listener follow a request.', 2: 'Starting from storage hides the story of the request.' },
        },
        {
          q: 'In step 4, which sentence fits best?',
          choices: ['"I\'d add Kafka, Redis and a CDN to be safe."', '"When this gets busy, the first thing to break is database reads, so I\'d add a cache."', '"It will scale because it\'s in the cloud."'],
          answer: 1,
          explain: 'One problem, one fix, with the reason. That\'s the whole pattern for step 4.',
          why: { 0: 'Boxes with no reason behind them cost money and add ways to fail.', 2: 'The cloud doesn\'t remove bottlenecks; you still have to name them.' },
        },
        {
          q: 'An endpoint is `GET /orders?user_id=7`, and the API returns orders for whatever `user_id` it receives. What\'s wrong?',
          choices: ['Nothing, as long as it uses HTTPS', 'Anyone can change the number and read other people\'s orders', 'GET requests shouldn\'t have query strings'],
          answer: 1,
          explain: 'Identity must come from something the server can verify, like a signed token, not from a value the client chose.',
          why: { 0: 'HTTPS hides the request from eavesdroppers but doesn\'t stop the user editing it.', 2: 'Query strings on GET are normal; the problem is trusting the id.' },
        },
        {
          q: 'Which is a well-formed trade-off statement?',
          choices: ['"I chose a cache. It makes reads fast, and costs me data that can be up to a minute stale."', '"I chose a cache because caches are fast."', '"There are no downsides to this design."'],
          answer: 0,
          explain: 'A trade-off names what you gain and what you pay. Every choice has a cost.',
          why: { 1: 'It names the gain but not the cost.', 2: 'Every design gives something up; saying otherwise sounds junior.' },
        },
      ],
    },
  ],
};
