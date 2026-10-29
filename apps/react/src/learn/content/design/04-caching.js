// System design · lesson 4. This lesson sets lang: 'js' so it can include small runnable tasks.
export default {
  id: 'caching',
  lang: 'js',
  builds: ['js/objects', 'js/functions', 'dsa/hash-maps-and-sets'],
  title: 'Caching: cache-aside, TTL, invalidation and LRU',
  goal: 'Put a cache in front of a slow store, decide when cached data expires, and build the LRU eviction most caches use.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Why cache, and where caches live',
      md: `
Lesson 3 ended with the database doing all the work. Most apps read the same things far more often than they change them: the same product page, the same user profile. A **cache** keeps a copy of popular answers somewhere faster, so most reads skip the slow trip.

Rough numbers, inside one data center (estimates, they vary with hardware and load): reading from a server's own memory takes well under a microsecond, a Redis lookup over the network is a fraction of a millisecond, and a simple indexed database query is a few milliseconds. The database is also shared by every server, so each read you take off it helps everyone.

Caches live at several layers:

| Where | Example | Good for |
|---|---|---|
| Browser | HTTP cache headers | the user's own repeat visits |
| CDN | CloudFront | public files and pages, near users |
| App memory | a \`Map\` in the server | tiny, hot data; each server has its own copy |
| Shared cache | Redis, Memcached | data all servers should agree on |

In designs, "add a cache" usually means **a shared Redis** between the API and the database.
`,
    },
    {
      type: 'read',
      title: 'Cache-aside, step by step',
      md: `
The most common pattern is **cache-aside** (also called lazy loading). The app checks the cache first and only goes to the database on a **miss**:

~~~
[ API ] --(1) get user:1--> [ Cache ]
        <--(2) hit: done, or miss
[ API ] --(3) on a miss: SELECT--> [ DB ]
[ API ] --(4) store user:1--> [ Cache ]
~~~

Here it is with a \`Map\` standing in for Redis and an object standing in for the database. Press **Run**:

~~~js
const db = {
  calls: 0,
  rows: { 1: { id: 1, name: "Ada" } },
  find(id) { this.calls++; return this.rows[id]; },
};
const cache = new Map();

function getUser(id) {
  if (cache.has(id)) return cache.get(id); // (1)(2) hit
  const user = db.find(id);                // (3) miss: read the DB
  cache.set(id, user);                     // (4) remember it
  return user;
}

getUser(1);
getUser(1);
getUser(1);
console.log("database calls:", db.calls);
~~~

Three reads, one database call. The other two were **hits**.
`,
    },
    {
      type: 'predict',
      title: 'Hits and misses',
      md: 'Same pattern, two different ids. How many times does the database get called?',
      code: `const db = { calls: 0, find(id) { this.calls++; return { id }; } };
const cache = new Map();

function getUser(id) {
  if (cache.has(id)) return cache.get(id);
  const user = db.find(id);
  cache.set(id, user);
  return user;
}

getUser(1);
getUser(2);
getUser(1);
getUser(2);
getUser(3);
console.log(db.calls);`,
      output: `3`,
      explain: `
Each **new** id is a miss: 1, 2 and 3, so three database calls. The second reads of 1 and 2 are hits.

The share of reads that are hits is the **hit rate**. Here it's 2 out of 5. A cache only helps when the same keys come back often, which is why caches suit "popular" data.
`,
    },
    {
      type: 'task',
      title: 'Write cache-aside yourself',
      md: `
The starter has a fake \`db\` (it counts its calls) and an empty \`cache\`. Right now \`getUser\` always asks the database.

Change \`getUser(id)\` so that it:

1. returns \`cache.get(id)\` if the cache has that id;
2. otherwise reads \`db.findUser(id)\`, stores it with \`cache.set(id, user)\`, and returns it.

~~~
getUser(1)  → { id: 1, name: "Ada" }   (db.calls is 1)
getUser(1)  → { id: 1, name: "Ada" }   (db.calls is still 1)
~~~
`,
      starter: `const db = {
  calls: 0,
  users: { 1: { id: 1, name: "Ada" }, 2: { id: 2, name: "Grace" } },
  findUser(id) { this.calls++; return this.users[id]; },
};
const cache = new Map();

function getUser(id) {
  // check the cache first
  return db.findUser(id);
}
`,
      tests: [
        { name: 'getUser(2) returns Grace', code: `eq(getUser(2), { id: 2, name: "Grace" });` },
        { name: 'reading the same id twice calls the database once', code: `getUser(1); getUser(1); eq(db.calls, 1);` },
        { name: 'after a read, the user is in the cache', code: `getUser(1); eq(cache.get(1), { id: 1, name: "Ada" });` },
      ],
      hint: 'Start the function with `if (cache.has(id)) return cache.get(id);`. After the database read, call `cache.set(id, user)` before returning.',
      solution: `const db = {
  calls: 0,
  users: { 1: { id: 1, name: "Ada" }, 2: { id: 2, name: "Grace" } },
  findUser(id) { this.calls++; return this.users[id]; },
};
const cache = new Map();

function getUser(id) {
  if (cache.has(id)) return cache.get(id);
  const user = db.findUser(id);
  cache.set(id, user);
  return user;
}
`,
    },
    {
      type: 'predict',
      title: 'The stale copy',
      md: 'The name changes in the database. What does the next read return?',
      code: `const db = { rows: { 1: { name: "Ada" } } };
const cache = new Map();

function getUser(id) {
  if (cache.has(id)) return cache.get(id);
  const user = { ...db.rows[id] };
  cache.set(id, user);
  return user;
}

console.log(getUser(1).name);
db.rows[1] = { name: "Ada Lovelace" }; // the database changes
console.log(getUser(1).name);`,
      output: `Ada
Ada`,
      explain: `
The cache still holds the old copy, and nothing told it the database changed. This is **stale data**, the price of every cache.

There are two tools against it, coming next: an **expiry time** (TTL), so a stale copy can't live forever, and **invalidation**, deleting the cached copy when you write.
`,
    },
    {
      type: 'read',
      title: 'TTL: let copies expire',
      md: `
A **TTL** (time to live) puts a deadline on each cached item. After it passes, the item counts as a miss and is fetched fresh.

In Redis that's one argument: \`SET user:1 "..." EX 60\` keeps the key for 60 seconds. In your own code you store the deadline next to the value:

~~~js
const cache = new Map();

function cacheSet(key, value, ttlMs, now) {
  cache.set(key, { value, expiresAt: now + ttlMs });
}

cacheSet("price:42", 19.99, 60000, 0); // stored at 0, lives 60 s
console.log(cache.get("price:42"));
~~~

Passing \`now\` in, instead of calling \`Date.now()\` inside, makes the code easy to test: you can pretend time has passed.

Choosing a TTL is a trade-off you say out loud: "a 60-second TTL means a price can be up to a minute old. Fine for a catalog, not fine for a bank balance."
`,
    },
    {
      type: 'task',
      title: 'Expire old entries',
      md: `
\`cacheSet\` is written for you. Write \`cacheGet(cache, key, now)\`:

- If the key is missing, return \`undefined\`.
- If \`now\` is **at or past** the entry's \`expiresAt\`, delete the key and return \`undefined\`.
- Otherwise return the entry's \`value\`.

~~~
cacheSet(cache, "a", 1, 1000, 0)   // expires at 1000
cacheGet(cache, "a", 500)    → 1
cacheGet(cache, "a", 1000)   → undefined  (and "a" is deleted)
~~~
`,
      starter: `function cacheSet(cache, key, value, ttlMs, now) {
  cache.set(key, { value, expiresAt: now + ttlMs });
}

function cacheGet(cache, key, now) {
  // your code here
}
`,
      tests: [
        { name: 'a fresh entry returns its value', code: `const c = new Map(); cacheSet(c, "a", 1, 1000, 0); eq(cacheGet(c, "a", 500), 1);` },
        { name: 'a missing key gives undefined', code: `eq(cacheGet(new Map(), "nope", 0), undefined);` },
        { name: 'an entry exactly at its expiry time is expired', code: `const c = new Map(); cacheSet(c, "a", 1, 1000, 0); eq(cacheGet(c, "a", 1000), undefined);` },
        { name: 'an expired entry is deleted from the cache', code: `const c = new Map(); cacheSet(c, "a", 1, 1000, 0); cacheGet(c, "a", 5000); eq(c.has("a"), false);` },
      ],
      hint: 'Read `const entry = cache.get(key)`. If there is no entry, return. If `now >= entry.expiresAt`, call `cache.delete(key)` and return. Otherwise `return entry.value`.',
      solution: `function cacheSet(cache, key, value, ttlMs, now) {
  cache.set(key, { value, expiresAt: now + ttlMs });
}

function cacheGet(cache, key, now) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (now >= entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}
`,
    },
    {
      type: 'read',
      title: 'Invalidation, and the stampede',
      md: `
A TTL limits how stale data can get. **Invalidation** removes the stale copy right away: when you write to the database, delete the cached key too.

~~~
PUT /products/42
  1. UPDATE products SET price = ... WHERE id = 42
  2. DELETE cache key "product:42"
  next read misses and loads the new price
~~~

Why **delete** rather than write the new value into the cache? If two updates race, they can write to the cache in a different order than they wrote to the database, leaving the older value cached. Deleting means the next read loads whatever the database holds. Keep a TTL as well, as a safety net for any invalidation you miss.

One more failure to name: **the stampede** (also called a thundering herd). A very popular key expires, and a thousand requests miss at the same moment and all hit the database together. Fixes:

- let **one** request reload the key while the others wait for it;
- refresh popular keys a little **before** they expire;
- add a small random amount to each TTL so keys don't all expire together.
`,
    },
    {
      type: 'read',
      title: 'When the cache is full: LRU',
      md: `
Memory runs out, so a cache must **evict** something to make room. The most common rule is **LRU, least recently used**: throw out the item nobody has touched for the longest time. Redis can be configured to evict this way.

A JavaScript \`Map\` makes LRU easy, because **a Map remembers insertion order**:

- \`map.keys().next().value\` is the **oldest** key.
- To mark a key as just used, \`delete\` it and \`set\` it again. That moves it to the end.

~~~js
const m = new Map();
m.set("a", 1);
m.set("b", 2);
m.set("c", 3);
console.log([...m.keys()]);

m.delete("a");
m.set("a", 1);           // "a" is now the newest
console.log([...m.keys()]);
console.log("oldest:", m.keys().next().value);
~~~
`,
    },
    {
      type: 'predict',
      title: 'Which key is oldest?',
      code: `const m = new Map();
m.set("x", 1);
m.set("y", 2);
m.set("z", 3);
m.set("x", 10);            // updating an existing key...
console.log([...m.keys()]);
m.delete("y");
m.set("y", 2);
console.log(m.keys().next().value);`,
      output: `[ "x", "y", "z" ]
x`,
      explain: `
Setting an **existing** key changes its value but **not** its position: \`"x"\` stays first. Only \`delete\` followed by \`set\` moves a key to the end.

After moving \`"y"\` to the end, the order is \`x, z, y\`, so the oldest is \`"x"\`. This is the bug to watch for in the next tasks: if \`put\` updates an existing key without deleting it first, that key never becomes "recent".
`,
    },
    {
      type: 'task',
      title: 'LRU part 1: evict the oldest',
      md: `
Finish \`put(key, value)\` in the \`LRUCache\` class. \`get\` is done for now.

1. If the key already exists, \`delete\` it first (so it moves to the end).
2. \`set\` the key.
3. If \`this.map.size\` is now more than \`this.capacity\`, delete the oldest key: \`this.map.keys().next().value\`.

~~~
const c = new LRUCache(2);
c.put("a", 1); c.put("b", 2); c.put("c", 3);
c.get("a")  → undefined   ("a" was evicted)
c.get("c")  → 3
~~~
`,
      starter: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    return this.map.get(key);
  }

  put(key, value) {
    this.map.set(key, value);
    // evict the oldest key if we're over capacity
  }
}
`,
      tests: [
        { name: 'adding a third item to a cache of 2 evicts the first', code: `const c = new LRUCache(2); c.put("a", 1); c.put("b", 2); c.put("c", 3); eq(c.get("a"), undefined); eq(c.get("c"), 3);` },
        { name: 'the size never goes over capacity', code: `const c = new LRUCache(2); for (let i = 0; i < 10; i++) c.put(i, i); eq(c.map.size, 2);` },
        { name: 'updating an existing key makes it the newest', code: `const c = new LRUCache(2); c.put("a", 1); c.put("b", 2); c.put("a", 10); c.put("c", 3); eq(c.get("a"), 10); eq(c.get("b"), undefined);` },
      ],
      hint: 'Before `set`, add `if (this.map.has(key)) this.map.delete(key);`. After it, `if (this.map.size > this.capacity) this.map.delete(this.map.keys().next().value);`',
      solution: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    return this.map.get(key);
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key); // move to the end
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value); // the oldest key
    }
  }
}
`,
    },
    {
      type: 'task',
      title: 'LRU part 2: reading counts as using',
      md: `
\`put\` works now. But "least recently **used**" includes reads: a key you just read should become the newest, so it isn't evicted next.

Change \`get(key)\`:

1. If the key isn't in the map, return \`undefined\`.
2. Otherwise read the value, \`delete\` the key, \`set\` it again, and return the value.

~~~
const c = new LRUCache(2);
c.put("a", 1); c.put("b", 2);
c.get("a");          // "a" is now the newest
c.put("c", 3);       // evicts "b", not "a"
c.get("b")  → undefined
~~~
`,
      starter: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    return this.map.get(key);
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value);
    }
  }
}
`,
      tests: [
        { name: 'reading a key protects it from the next eviction', code: `const c = new LRUCache(2); c.put("a", 1); c.put("b", 2); c.get("a"); c.put("c", 3); eq(c.get("a"), 1); eq(c.get("b"), undefined);` },
        { name: 'get on a missing key gives undefined', code: `const c = new LRUCache(2); eq(c.get("nope"), undefined); eq(c.map.size, 0);` },
        { name: 'get returns the stored value', code: `const c = new LRUCache(2); c.put("a", 1); eq(c.get("a"), 1);` },
      ],
      hint: 'Start with `if (!this.map.has(key)) return undefined;` so you don\'t accidentally `set` a missing key. Then `const value = this.map.get(key);`, delete, set, return.',
      solution: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key); // move to the end: most recently used
    this.map.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value);
    }
  }
}
`,
      explain: 'Both operations are constant time on average, because Map lookups, deletes and inserts are. That\'s the answer to the classic interview follow-up "what is the complexity of your LRU cache?"',
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'In cache-aside, what happens on a miss?',
          choices: ['The app reads the database, stores the result in the cache, and returns it', 'The cache reads the database by itself', 'The request fails and the client retries'],
          answer: 0,
          explain: 'In cache-aside, the application does the loading. The cache is just a place to look first.',
          why: { 1: 'That\'s a different pattern (read-through). In cache-aside the app does the loading.', 2: 'A miss is normal; the app falls back to the database.' },
        },
        {
          q: 'An admin changes a price. What should the update code do to the cache?',
          choices: ['Delete the cached key so the next read loads the new price', 'Nothing; the TTL will handle it eventually', 'Clear the entire cache'],
          answer: 0,
          explain: 'Deleting the one key gives fresh data right away. Keep the TTL as a safety net.',
          why: { 1: 'Users would see the old price until the TTL ran out.', 2: 'That throws away every other good entry and floods the database with misses.' },
        },
        {
          q: 'A hugely popular key expires, and a thousand requests hit the database at once. What is this called?',
          choices: ['A cache stampede', 'A cache hit', 'Replication lag'],
          answer: 0,
          explain: 'Fix it by letting one request reload the key, refreshing early, or adding jitter to TTLs.',
          why: { 1: 'These are misses, all at once.', 2: 'Replication lag is about replicas falling behind, not caches.' },
        },
        {
          q: 'An LRU cache of capacity 2 gets `put(a)`, `put(b)`, `get(a)`, `put(c)`. Which key is evicted?',
          choices: ['b', 'a', 'c'],
          answer: 0,
          explain: 'Reading `a` made it recent, so `b` is the least recently used when `c` arrives.',
          why: { 1: '`a` was just read, so it\'s the most recently used of the two.', 2: '`c` is the item being added.' },
        },
        {
          q: 'Which data should NOT go in a shared CDN cache?',
          choices: ['A page showing the logged-in user\'s account balance', 'The site logo', 'A public product image'],
          answer: 0,
          explain: 'Per-user data in a shared cache can be served to the wrong person.',
          why: { 1: 'The logo is the same for everyone, so it\'s ideal for a CDN.', 2: 'Public images are exactly what CDNs are for.' },
        },
      ],
    },
  ],
};
