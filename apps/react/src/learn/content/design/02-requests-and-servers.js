// System design · lesson 2. Track lang is null: nothing runs, predicts carry an `output` answer.
export default {
  id: 'requests-and-servers',
  builds: ['js/objects', 'node/http-anatomy'],
  title: 'Clients, servers, HTTP, DNS and load balancers',
  goal: 'Follow one request from the address bar to a server and back, and know why a load balancer needs stateless servers.',
  minutes: 25,
  steps: [
    {
      type: 'read',
      title: 'One request, start to finish',
      md: `
Lesson 1 drew \`[ Browser ] --> [ API ] --> [ Database ]\`. This lesson zooms into the first arrow. What actually happens when you type \`app.example.com/todos\` and press Enter?

~~~
[ Browser ] --(1) "where is app.example.com?"--> [ DNS ]
[ Browser ] <--(2) "at 203.0.113.10"------------ [ DNS ]
[ Browser ] --(3) GET /todos ------------------> [ Server ]
[ Browser ] <--(4) 200 OK + JSON --------------- [ Server ]
~~~

1. The browser asks **DNS** for the server's IP address.
2. DNS answers with an address.
3. The browser opens a connection to that address (with HTTPS, it also sets up encryption) and sends an **HTTP request**.
4. The server sends back an **HTTP response**.

The **client** is whatever starts the conversation: a browser, a phone app, or another server. The **server** is a program that waits for requests and answers them. The same machine can be both: your API is a server to the browser and a client to the database.
`,
    },
    {
      type: 'read',
      title: 'DNS: the phone book',
      md: `
Computers find each other by **IP address** (like \`203.0.113.10\`). People remember **names**. DNS (the Domain Name System) turns one into the other.

- Your computer asks a **resolver**, usually run by your internet provider or a service like 1.1.1.1.
- The resolver asks the servers responsible for that domain, gets the answer, and **caches** it.
- Every DNS record has a **TTL** (time to live, in seconds). Until the TTL runs out, resolvers and browsers may keep using their cached answer without asking again.

~~~
app.example.com.   300   IN   A   203.0.113.10
name               TTL        type  address
~~~

That caching is why DNS is fast, and also why DNS changes are slow to take effect. Keep that in mind for the next step.
`,
    },
    {
      type: 'predict',
      title: 'The slow move',
      md: 'You move your app to a new server and update DNS. What do users see?',
      code: `Old DNS record:  app.example.com  TTL 86400  -> 203.0.113.10
At 9:00 you change it to                       -> 198.51.100.7
At 9:05 you switch off the old server.`,
      output: `Many users still get the old address from their cached
answer for up to 24 hours (86,400 seconds), so their
requests hit a server that's switched off and fail.`,
      explain: `
A TTL of 86,400 seconds is one day. Resolvers that cached the old answer are allowed to keep using it until it expires.

The standard fix: **a day or more before the move, lower the TTL** (say to 60 seconds), wait for the old long TTL to run out, then change the address. Keep the old server running until traffic to it stops.
`,
    },
    {
      type: 'read',
      title: 'HTTP: requests and responses',
      md: `
HTTP is the format of the conversation. A request has a **method**, a **path**, **headers**, and sometimes a **body**:

~~~
POST /todos HTTP/1.1
Host: app.example.com
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{ "title": "Buy milk" }
~~~

The response has a **status code**, headers, and usually a body. These are the codes you'll use in designs:

| Code | Means | Example |
|---|---|---|
| 200 | OK | \`GET /todos\` worked |
| 201 | Created | \`POST /todos\` made a new row |
| 202 | Accepted, still working | a job was queued |
| 301 / 302 | Moved, go here instead | a URL shortener redirect |
| 400 | Your request is wrong | missing title |
| 401 / 403 | Not logged in / not allowed | |
| 404 | Not found | |
| 429 | Too many requests | rate limited |
| 500 / 503 | Server broke / server unavailable | |

The body is usually JSON, which is just the objects and arrays from JavaScript lesson 7 written as text.
`,
    },
    {
      type: 'read',
      title: 'HTTP has no memory',
      md: `
Each HTTP request stands alone. The server doesn't remember that you sent a request a second ago. This is called being **stateless**.

So how does a server know you're logged in? **You remind it every time.** The browser sends a cookie or an \`Authorization\` header with each request, and the server checks it.

There are two common places to keep "who is logged in":

- **Server-side sessions:** the cookie holds a random session id, and the server looks it up in a session store.
- **Tokens (like JWTs):** the token itself holds the user's id and is signed, so any server can verify it without looking anything up.

Where that session store lives turns out to matter a lot once you have more than one server.
`,
    },
    {
      type: 'read',
      title: 'When one server is not enough',
      md: `
One server eventually runs out of CPU or memory, and when it restarts, your whole app is down. Two ways to grow:

- **Vertical scaling:** a bigger machine. Easy, but there's a ceiling, and it's still one machine that can fail.
- **Horizontal scaling:** more machines running the same code, with a **load balancer** in front to share out requests.

~~~
                      +--> [ Server 1 ] --+
[ Browsers ] --> [ LB ] --> [ Server 2 ] --+--> [ Database ]
                      +--> [ Server 3 ] --+
~~~

The load balancer is the only address the outside world sees (DNS points at it). It picks a server for each request and passes it on.
`,
    },
    {
      type: 'read',
      title: 'How a load balancer chooses',
      md: `
Common ways to pick a server:

- **Round robin:** 1, 2, 3, 1, 2, 3... Simple and fine when requests are similar.
- **Least connections:** send to the server with the fewest requests in progress. Better when some requests are slow.

Two more ideas you'll hear:

- **Health checks:** the load balancer calls something like \`GET /health\` on each server every few seconds. A server that stops answering is taken out of rotation until it recovers.
- **Layer 4 vs layer 7:** an L4 balancer only sees connections (IP and port) and passes bytes through. An L7 balancer understands HTTP, so it can route by path (\`/api\` to one group, \`/images\` to another). On AWS, the Network Load Balancer is L4 and the Application Load Balancer is L7.
`,
    },
    {
      type: 'predict',
      title: 'A server dies',
      md: 'Three servers sit behind a round-robin load balancer with no health checks. What do users see?',
      code: `[ LB, round robin, no health checks ]
   |--> Server 1  (ok)
   |--> Server 2  (crashed)
   |--> Server 3  (ok)`,
      output: `About one request in three fails, because the load balancer
keeps sending every third request to the dead server.`,
      explain: `
Round robin doesn't know a server is dead. It just counts.

With **health checks**, the balancer notices Server 2 failing its checks within a few seconds and stops sending traffic there. Users see a short blip instead of a steady one-in-three failure rate. This is why "add a second server" only improves availability if the balancer can route around a broken one.
`,
    },
    {
      type: 'predict',
      title: 'Logged out at random',
      md: 'Each server keeps logged-in sessions in its own memory. What happens?',
      code: `Request 1: POST /login   -> LB sends to Server 1
           Server 1 stores the session in its memory
Request 2: GET /todos    -> LB sends to Server 2`,
      output: `Server 2 has never seen that session, so it answers 401
and the user looks logged out, even though they just
logged in.`,
      explain: `
The servers aren't **stateless**: each one holds data the others can't see.

Fixes, from best to worst:

1. **Move the state out** of the servers: keep sessions in a shared store like Redis, or use signed tokens any server can verify. Now every server is interchangeable.
2. **Sticky sessions:** the load balancer always sends a user to the same server. It works, but if that server dies the user loses their session, and load spreads unevenly.

Stateless servers are the foundation of horizontal scaling. You'll lean on this in lesson 6.
`,
    },
    {
      type: 'read',
      title: 'A CDN: servers close to users',
      md: `
A load balancer spreads load across your servers in **one place**. A **CDN** (content delivery network, like Amazon CloudFront) puts **copies** of responses in many places around the world.

~~~
[ Browser in Tokyo ] --> [ CDN edge in Tokyo ] --miss--> [ Your LB ]
                         hit: answer right here
~~~

- On a **hit**, the edge answers directly, which saves a long network trip.
- On a **miss**, it asks your servers and keeps a copy for next time.

CDNs suit things many people read and that don't depend on who's asking: images, JavaScript bundles, public pages. You'll see them again in the caching lesson and the file upload case study.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'You lowered a DNS record\'s TTL to 60 seconds a day before a move. Why does that help?',
          choices: ['Cached answers expire within a minute, so users pick up the new address quickly', 'It makes DNS lookups faster', 'It forces browsers to skip DNS'],
          answer: 0,
          explain: 'The TTL is how long caches may keep the answer. A short TTL means the change spreads fast.',
          why: { 1: 'A short TTL means more lookups, not faster ones.', 2: 'Browsers still use DNS; they just re-ask sooner.' },
        },
        {
          q: 'A form submission is saved and an email job is queued, but the email isn\'t sent yet. Which status code fits?',
          choices: ['202 Accepted', '404 Not Found', '500 Internal Server Error'],
          answer: 0,
          explain: '202 means "accepted, still working on it", which matches work handed to a background job.',
          why: { 1: '404 means the thing doesn\'t exist.', 2: 'Nothing broke; the work is just not finished yet.' },
        },
        {
          q: 'Why do load-balanced servers need to be stateless?',
          choices: ['So any server can handle any request, and losing one loses nothing', 'Because HTTP can\'t carry cookies', 'So the load balancer can read the request body'],
          answer: 0,
          explain: 'If state lives in a shared store or a signed token, every server is interchangeable.',
          why: { 1: 'HTTP carries cookies fine; the issue is where the session data lives.', 2: 'Statelessness is about the servers, not what the balancer can read.' },
        },
        {
          q: 'What do health checks add to a load balancer?',
          choices: ['They stop traffic going to servers that aren\'t answering', 'They make each request faster', 'They encrypt traffic'],
          answer: 0,
          explain: 'Without them, a dead server keeps receiving its share of requests.',
          why: { 1: 'They don\'t speed up healthy servers.', 2: 'Encryption is TLS\'s job, not health checks\'.' },
        },
        {
          q: 'Which is a good fit for a CDN?',
          choices: ['The site\'s JavaScript bundle and product images', 'A user\'s private bank balance', 'A POST that creates an order'],
          answer: 0,
          explain: 'CDNs cache content many people read that doesn\'t depend on who is asking.',
          why: { 1: 'Private, per-user data must not be served from a shared cache.', 2: 'Writes go to your servers; there\'s nothing to cache.' },
        },
      ],
    },
  ],
};
