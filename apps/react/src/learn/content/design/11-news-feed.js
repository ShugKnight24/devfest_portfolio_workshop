// System design · lesson 11, case study. Track lang is null: predicts carry an `output` answer.
export default {
  id: 'news-feed',
  builds: ['js/reduce-and-sort', 'design/caching', 'design/databases'],
  title: 'Case study: a news feed',
  goal: 'Design a home feed: build it on read or on write, handle accounts with millions of followers, and page through it without duplicates.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'Step 1: clarify',
      md: `
**The question:** "Design the home feed for a social app." You follow people; your feed shows their posts, newest first.

**Questions to ask, with typical answers:**

- "Newest first, or ranked?" Newest first to start; ranking later.
- "How many people does a typical user follow?" A few hundred. Some follow thousands.
- "Are there accounts with millions of followers?" Yes, a few celebrities.
- "How fresh must it be?" A new post can take a few seconds to show up.

The conclusion: **reads (opening the app) far outnumber posts, a few seconds of delay is fine, and a few accounts are enormous.** That last point decides the design.
`,
    },
    {
      type: 'read',
      title: 'The simplest version: build the feed on read',
      md: `
Store posts and follows, and build the feed when someone asks for it:

~~~
posts(id, author_id, body, created_at)
  index on (author_id, created_at)
follows(follower_id, followee_id)
~~~

~~~sql
SELECT posts.*
FROM posts
JOIN follows ON follows.followee_id = posts.author_id
WHERE follows.follower_id = :me
ORDER BY posts.created_at DESC
LIMIT 20;
~~~

It's the \`sort\` from JavaScript lesson 11 at database scale: gather everyone's recent posts, sort by time, take the top 20. This is called **fan-out on read**: the work spreads out to all the accounts you follow at the moment you read.

For a small app this is the right answer: simple, always fresh, nothing extra to store.
`,
    },
    {
      type: 'predict',
      title: 'What breaks first?',
      code: `Fan-out on read. A user follows 2,000 accounts and opens the
app 30 times a day. Millions of users do the same.`,
      output: `Every feed load gathers and sorts recent posts from up to
2,000 accounts. Multiplied by millions of opens, the database
spends most of its time rebuilding the same feeds.`,
      explain: `
The work happens on the most common action, reading, and it grows with how many accounts each user follows. Caching each finished feed helps for a few seconds, but every new post makes it stale.

So flip it around: do the work when someone **posts**, which is far rarer than reading.
`,
    },
    {
      type: 'read',
      title: 'Fan-out on write',
      md: `
**Fan-out on write** keeps a ready-made feed for each user: a list of post ids, newest first, in a cache like Redis. When someone posts, a worker pushes the post id into each follower's list.

~~~
POST /posts --> [ API ] --save--> [ DB: posts ]
                  |
                  +--job--> [ Queue ] --> [ Fan-out workers ]
                                               |
                         for each follower: add post id to
                         feed:<follower id> in Redis

GET /feed --> [ API ] --> read feed:<me> --> load those posts
~~~

- Reading a feed is now one fast list read plus a lookup of 20 posts.
- Each list is trimmed to, say, the newest 500 ids, so memory stays bounded.
- The fan-out runs in workers behind a queue (lesson 5), so posting stays fast and the feed updates a few seconds later, which the clarify step allowed.
`,
    },
    {
      type: 'predict',
      title: 'The celebrity posts',
      code: `Fan-out on write. An account with 50,000,000 followers
posts a photo.`,
      output: `The workers must write the post id into 50,000,000 feed
lists. That's a huge burst of writes for one post, and many
followers see it late while the queue drains.`,
      explain: `
Fan-out on write makes reads cheap by making posts expensive, and the cost grows with **follower count**. For most accounts that's a few hundred writes. For a celebrity it's tens of millions, every time.

Also, many of those followers won't open the app before the post is old, so much of that work is wasted.
`,
    },
    {
      type: 'read',
      title: 'The hybrid that real systems use',
      md: `
Use each approach where it's cheap:

- **Normal accounts:** fan-out on write. Their posts are pushed into followers' feed lists.
- **Very large accounts** (above some follower threshold): **not** fanned out. Their posts stay in their own list.
- **At read time:** take my precomputed feed list, then merge in recent posts from the few large accounts I follow, sort by time, take 20.

~~~
my feed = merge(
  feed:<me>                       (pushed, from normal accounts)
  recent posts of big accounts I follow   (pulled at read)
) sorted newest first, top 20
~~~

That merge is small: a precomputed list and a handful of short lists. You get cheap reads for everyone and no 50-million-write bursts.

In an interview, landing on this hybrid by yourself, starting from the simple version and fixing what breaks, is exactly the reasoning the five-step script is built to show.
`,
    },
    {
      type: 'read',
      title: 'Paging: use a cursor',
      md: `
Feeds scroll forever, so the API returns a page at a time. The tempting version uses an offset:

~~~
GET /feed?offset=20&limit=20     "skip 20, give me the next 20"
~~~

The better version uses a **cursor**: "give me 20 older than the last one I have".

~~~
GET /feed?before=<id of the last post on screen>&limit=20
~~~

Post ids that sort by time (or a \`created_at\` plus id) make "older than this one" exact. The scenario next shows why offsets go wrong on a feed.
`,
    },
    {
      type: 'predict',
      title: 'The duplicate post',
      code: `Offset paging. You load page 1: posts 1-20 (newest first).
While you read, 3 new posts arrive at the top.
You scroll and the app asks for offset=20, limit=20.`,
      output: `Everything shifted down by 3, so the first 3 posts on page 2
are the last 3 you already saw on page 1. You see duplicates.`,
      explain: `
An offset counts positions, and positions move when new items arrive at the top. (Deletes cause the opposite: posts silently skipped.)

A cursor names a **specific post**: "older than post X". New posts at the top don't change what's older than X, so there are no duplicates and no gaps. Cursor paging is also faster, because the database seeks straight to X instead of counting and skipping rows.
`,
    },
    {
      type: 'read',
      title: 'Step 5: the rest, and the 60-second version',
      md: `
**Other pieces worth one sentence each:**

- **Media:** images and video live in object storage and are served through a CDN (lessons 2 and 10). The feed only stores links.
- **Ranking:** a later step can re-order the merged candidates with a scoring service. Building the candidate list stays the same.
- **Deletes and blocks:** when a post is deleted, readers filter it out when loading posts, so you don't have to edit millions of lists right away.

**Trade-off:** fan-out on write spends storage and post-time work to make reads cheap, and makes new posts take a few seconds to appear.

**The 60-second version:** "Posts and follows live in the database. Each user has a precomputed feed list in Redis. When someone posts, a queue-driven worker pushes the post id into each follower's list, so reading a feed is one list read. Accounts with huge follower counts aren't fanned out; their recent posts are merged in at read time. Feeds page with a cursor, 'older than this post', so new posts don't cause duplicates. Media goes through a CDN."
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'What is fan-out on write?',
          choices: ['When someone posts, push the post into each follower\'s precomputed feed', 'When someone opens the app, gather posts from everyone they follow', 'Copying the database to many replicas'],
          answer: 0,
          explain: 'The work moves from read time to post time, which is the rarer action.',
          why: { 1: 'That\'s fan-out on read.', 2: 'That\'s replication, not feed building.' },
        },
        {
          q: 'Why not fan out a celebrity\'s posts on write?',
          choices: ['One post would mean tens of millions of feed writes', 'Celebrities post too rarely', 'Their posts are too large'],
          answer: 0,
          explain: 'The write cost grows with follower count, so huge accounts are merged in at read time instead.',
          why: { 1: 'How often they post isn\'t the issue; the follower count is.', 2: 'Only the post id is written to each feed.' },
        },
        {
          q: 'Why page a feed with a cursor instead of an offset?',
          choices: ['New posts at the top shift offsets, causing duplicates or gaps', 'Offsets aren\'t supported in SQL', 'Cursors return more posts per page'],
          answer: 0,
          explain: '"Older than post X" stays correct however many new posts arrive.',
          why: { 1: 'SQL supports OFFSET; it\'s just the wrong tool for a moving list.', 2: 'The page size is the same either way.' },
        },
        {
          q: 'A small app with a few thousand users needs a feed. What do you build first?',
          choices: ['Fan-out on read: one query that joins follows and sorts by time', 'The full hybrid with Redis feed lists and workers', 'A ranking service'],
          answer: 0,
          explain: 'Start simple. At this size the query is fast, and you add precomputed feeds when reads become the bottleneck.',
          why: { 1: 'That\'s a lot of moving parts with no problem to solve yet.', 2: 'There\'s nothing to rank until there\'s a feed.' },
        },
      ],
    },
  ],
};
