// System design · lesson 8, case study. Track lang is null: predicts carry an `output` answer.
export default {
  id: 'chat',
  builds: ['node/events-and-streams', 'design/scaling-and-reliability'],
  title: 'Case study: a chat app',
  goal: 'Design one-to-one and group chat: push messages over WebSockets, link servers with pub/sub, and let clients catch up after a disconnect.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Step 1: clarify',
      md: `
**The question:** "Design a chat app."

**Questions to ask, with typical answers:**

- "One-to-one, groups, or both?" Both; groups of up to a few hundred.
- "Message history?" Yes, kept and scrollable.
- "What if the recipient is offline?" They get a push notification and see the message when they open the app.
- "Online status, read receipts?" Online status yes; read receipts are nice to have.
- "How many users at once?" Assume many servers' worth, so the design must work across several servers.

The conclusion for the corner of the board: **messages must arrive in about a second, must never be lost, and users are spread across many servers.**

The new problem compared with earlier lessons: in HTTP the **client always asks first** (lesson 2). In chat, the **server** needs to tell Bob "you have a message" without Bob asking.
`,
    },
    {
      type: 'read',
      title: 'How the server can talk first',
      md: `
Four ways to get updates to a browser, simplest first:

| Transport | How it works | Fits |
|---|---|---|
| Polling | ask "anything new?" every few seconds | updates every few seconds are fine |
| Long polling | ask, and the server holds the request open until there is news | older environments |
| Server-Sent Events (SSE) | one long HTTP response the server keeps writing to | server-to-client only: live scores, streaming an AI answer |
| WebSocket | one connection that stays open, both sides send any time | chat, multiplayer, anything two-way |

Chat sends **both ways**, often, so **WebSocket** is the usual choice. Each client opens one WebSocket to one chat server and keeps it open.

Polling is still a respectable answer for small apps. Say it: "If updates every few seconds were good enough, I'd start with polling, because it's much simpler."
`,
    },
    {
      type: 'predict',
      title: 'Polling at scale',
      code: `100,000 users have the chat open.
Each browser polls GET /messages/new once per second.
Most of the time there is nothing new.`,
      output: `About 100,000 requests a second hit the servers, and nearly
all of them return "nothing new". You pay for that load
whether anyone is chatting or not.`,
      explain: `
Polling's cost grows with **users × polling rate**, not with how much people actually chat. Slow the polling to every 10 seconds and the load drops tenfold, but messages arrive up to 10 seconds late.

A WebSocket costs one open connection per user, and the server sends only when there's something to send. That's why chat uses it.
`,
    },
    {
      type: 'read',
      title: 'Step 2: the boxes',
      md: `
~~~
[ Client ] ==WebSocket==> [ Chat server A ] --> [ DB: messages ]
[ Client ] ==WebSocket==> [ Chat server B ]
                                 |  ^
                                 v  |
                           [ Redis pub/sub ]
                                 |
                                 +--> [ Queue ] --> [ Push service ]
                                                 (offline users)
~~~

- **Chat servers** hold the WebSocket connections. A load balancer spreads new connections across them.
- **The database** stores every message. It's the source of truth.
- **Redis pub/sub** connects the chat servers to each other. You'll see why in the next step.
- **A queue and push service** reach users who are offline (lesson 5's pattern).
`,
    },
    {
      type: 'predict',
      title: 'Alice and Bob on different servers',
      md: 'There is no pub/sub yet. Each chat server only knows its own connections.',
      code: `Alice is connected to chat server A.
Bob is connected to chat server B.
Alice sends Bob "hi". Server A saves it to the database.`,
      output: `Bob doesn't see it. Server A doesn't hold Bob's connection,
and server B has no idea a message arrived. Bob only sees
"hi" if he reloads and fetches history.`,
      explain: `
This is lesson 2's "logged out at random" problem in a new form: state (who is connected where) is split across servers.

The fix is **pub/sub**. Each chat server **subscribes** to a channel for each conversation its users are in. When server A gets Alice's message, it **publishes** it to that conversation's channel, and Redis delivers it to every subscribed server, including B, which pushes it down Bob's socket.
`,
    },
    {
      type: 'read',
      title: 'Step 3: data and the send path',
      md: `
**Tables:**

~~~
conversations(id, type, created_at)
members(conversation_id, user_id, last_read_message_id)
messages(id, conversation_id, sender_id, body, created_at)
  index on (conversation_id, created_at)
~~~

That composite index from lesson 3 makes "the latest 50 messages in this conversation" one fast range read. For scrolling up, ask for the 50 **before** the oldest one you have (\`?before=<message id>\`), rather than using page numbers.

**The send path, in order:**

1. Alice's client sends the message over its WebSocket, with a client-generated id.
2. Server A **saves it to the database**. Now it can't be lost.
3. Server A **publishes** it to the conversation's channel.
4. Every subscribed server pushes it to its connected members.
5. Members who are offline get a push notification job on the queue.

The order of steps 2 and 3 matters, as the next scenario shows.
`,
    },
    {
      type: 'predict',
      title: 'Publish first, save second',
      code: `A server publishes a message to Redis FIRST,
then saves it to the database.
Right after publishing, the server crashes.`,
      output: `Bob saw the message appear live, but it was never saved.
When anyone reloads the conversation, the message is gone.`,
      explain: `
Publishing before saving lets people see something the system never kept. That's worse than a short delay.

**Save first, then publish.** If the server crashes after saving but before publishing, the message is safe, and recipients get it the next time they load history or reconnect. The rule: **the database is the source of truth, and pub/sub is only a fast notification.**
`,
    },
    {
      type: 'read',
      title: 'Offline, reconnects and duplicates',
      md: `
**Redis pub/sub is fire-and-forget.** It delivers to whoever is subscribed right now and keeps nothing. A server that's restarting, or a phone that just went through a tunnel, misses those messages.

That's fine, because of the save-first rule. On reconnect, the client asks the API for **everything after the last message id it has**:

~~~
GET /conversations/42/messages?after=<last id I have>
~~~

Two details make this solid:

- **Message ids that sort by time** (or a per-conversation sequence number), so "after this id" is well defined.
- **De-duplicate on the client by message id.** A message can arrive both over the socket and in the catch-up fetch. Showing it once is the client's job. Lesson 5's at-least-once thinking, again.

**Offline users:** when a member has no open connection, the server puts a notification job on a queue, and a worker sends a push through Apple's or Google's push service. The next lesson designs that notification service properly.
`,
    },
    {
      type: 'predict',
      title: 'The subscriber that blinked',
      code: `Chat server B restarts. It is unsubscribed from Redis for
3 seconds. During those 3 seconds, 5 messages are published
to conversations that B's users are in.`,
      output: `Server B never receives those 5 messages from Redis; pub/sub
doesn't store them. B's users fetch them from the database
when their clients reconnect and ask for "after my last id".`,
      explain: `
Nothing is lost because nothing depended on pub/sub to keep it. If you needed the stream itself to be replayable (for example, so a new service could read last week's messages), you'd use a log like **Kafka** instead of Redis pub/sub. It keeps messages for a set time and lets each reader track its own position.

In an interview, name the trade-off: "Redis pub/sub is simple and fast but doesn't keep messages. That's acceptable because the database is the source of truth. If we needed replay, I'd switch to Kafka."
`,
    },
    {
      type: 'read',
      title: 'Step 4 and 5: scale, trade-offs, and the 60-second version',
      md: `
**What breaks first:**

- **Open connections.** Each chat server can hold only so many WebSockets. Add servers behind the load balancer; pub/sub links them, so it doesn't matter which server a user lands on.
- **The messages table grows without end.** Shard by \`conversation_id\` (lesson 3), so one conversation's history lives together, and move old messages to cheaper storage.
- **Huge groups.** A message to a 10,000-member channel fans out to 10,000 deliveries. That's where you'd consider a log like Kafka and batching.

**Security:** authenticate the WebSocket when it opens, with the same token as the API, and check the user is a member before subscribing them to a conversation. Escape message text when displaying it, to prevent XSS.

**The 60-second version:** "Clients hold WebSockets to chat servers behind a load balancer. A message is saved to the database first, then published to a Redis channel for its conversation, so whichever server holds each recipient's socket can push it. Offline users get push notifications through a queue. Pub/sub doesn't keep messages, so reconnecting clients fetch everything after their last message id from the database, and de-duplicate by id."
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'Why does chat use WebSockets rather than plain request and response?',
          choices: ['The server must push messages without the client asking first', 'WebSockets are encrypted and HTTP isn\'t', 'HTTP can\'t carry JSON'],
          answer: 0,
          explain: 'A WebSocket stays open so either side can send at any time.',
          why: { 1: 'Both can be encrypted (wss:// and https://).', 2: 'HTTP carries JSON all the time.' },
        },
        {
          q: 'Alice is on server A and Bob on server B. What gets Alice\'s message to Bob in real time?',
          choices: ['Server A publishes to the conversation\'s channel; server B is subscribed and pushes it to Bob', 'The load balancer forwards it to Bob', 'Bob polls server A'],
          answer: 0,
          explain: 'Pub/sub connects the servers so whichever one holds Bob\'s socket hears about the message.',
          why: { 1: 'Load balancers route incoming requests; they don\'t relay messages between users.', 2: 'Bob is connected to B, and polling would undo the point of WebSockets.' },
        },
        {
          q: 'In the send path, which comes first?',
          choices: ['Save to the database', 'Publish to pub/sub', 'Send the push notification'],
          answer: 0,
          explain: 'Once saved, the message can\'t be lost; everything after that is delivery.',
          why: { 1: 'A crash after publishing but before saving shows a message that then vanishes.', 2: 'Push is for offline users, after the message is safely stored.' },
        },
        {
          q: 'A phone reconnects after 30 seconds in a tunnel. How does it get what it missed?',
          choices: ['It asks the API for messages after the last id it has, and de-duplicates by id', 'Redis replays the missed messages', 'It can\'t; those messages are lost'],
          answer: 0,
          explain: 'The database is the source of truth, so catching up is a normal query.',
          why: { 1: 'Redis pub/sub keeps nothing to replay.', 2: 'They were saved first, so they\'re in the database.' },
        },
        {
          q: 'Which shard key fits the messages table?',
          choices: ['conversation_id', 'created_at', 'message body length'],
          answer: 0,
          explain: 'Loading a conversation touches one shard, and conversations spread the load.',
          why: { 1: 'Every new message would hit the newest shard.', 2: 'It doesn\'t match any query you run.' },
        },
      ],
    },
  ],
};
