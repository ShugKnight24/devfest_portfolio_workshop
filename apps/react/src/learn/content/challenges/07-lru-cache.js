// Challenges · lesson 7. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'lru-cache',
  builds: ['challenges/two-sum', 'challenges/debounce-and-throttle', 'dsa/hash-maps-and-sets', 'design/caching', 'js/classes-and-this'],
  title: 'LRU cache: a Map that remembers order',
  goal: 'Build a fixed-size cache that throws out the least recently used entry, in O(1), using the fact that a Map keeps insertion order.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The question',
      md: `
> "Design a cache that holds at most \`capacity\` items. \`get(key)\` returns the value, or \`undefined\` if it's not there. \`put(key, value)\` stores it. When the cache is full and a new key comes in, throw out the **least recently used** item. Both operations should be O(1)."

~~~
const cache = createLRU(2);
cache.put("a", 1);
cache.put("b", 2);
cache.get("a");        → 1      "a" is now the most recently used
cache.put("c", 3);     →        full: evicts "b", the least recently used
cache.get("b");        → undefined
~~~

**LRU** = least recently used. Browsers, CDNs and databases all cache this way: things you used lately are likely to be used again.

You'll reuse two earlier pieces: the **Map** from the two-sum lesson, and the **closure** from the debounce lesson (the cache's Map lives privately inside \`createLRU\`).
`,
    },
    {
      type: 'check',
      title: 'Before you code: ask and spot',
      items: [
        {
          q: 'Does `get` count as "using" a key?',
          choices: [
            'Yes: reading a key makes it the most recently used',
            'No: only `put` counts',
            'Only if the value changed',
          ],
          answer: 0,
          explain: 'In a standard LRU, both reads and writes refresh a key. It\'s still worth confirming, because it decides what gets evicted.',
          why: {
            1: 'That would be closer to "least recently written". Reads are the whole point of a cache.',
            2: 'Recency is about access, not changes.',
          },
        },
        {
          q: '`put("a", 5)` when "a" is already in a full cache. Should anything be evicted?',
          choices: [
            'No: update the value and refresh "a". The size doesn\'t grow.',
            'Yes: evict the oldest, then add "a" again',
            'Throw an error: the key exists',
          ],
          answer: 0,
          explain: 'Updating an existing key never adds an entry, so there\'s nothing to evict.',
          why: {
            1: 'That would throw out a perfectly good entry for no reason.',
            2: 'Overwriting is normal cache behaviour.',
          },
        },
        {
          q: 'Which phrase tells you the data structure needs to remember **order**?',
          choices: [
            '"least recently used": you need to know which key was touched longest ago',
            '"get returns the value": that\'s a lookup',
            '"capacity": that\'s a number',
          ],
          answer: 0,
          explain: 'A plain lookup gives you O(1) gets, but you also need "who\'s oldest?" in O(1). That\'s a lookup **plus** an order.',
          why: {
            1: 'Lookup is half of it. The eviction rule is the other half.',
            2: 'Capacity says when to evict, not which one.',
          },
        },
      ],
    },
    {
      type: 'read',
      title: 'The plan, and the slow way first',
      md: `
**Brute force:** keep an array of \`[key, value]\` pairs, oldest first. To use a key, find it, cut it out and push it to the end. To evict, \`shift\` the first one.

~~~js
const entries = [["a", 1], ["b", 2]];

function touch(key) {
  const i = entries.findIndex((e) => e[0] === key);   // O(n) search
  const [entry] = entries.splice(i, 1);               // O(n) cut
  entries.push(entry);
}

touch("a");
console.log(entries);
~~~

It works, but \`findIndex\` and \`splice\` walk the array, so each operation is **O(n)**.

**The JavaScript trick:** a \`Map\` already keeps keys **in the order they were inserted**, and \`has\`, \`get\`, \`set\` and \`delete\` are O(1). So the Map is the lookup **and** the order:

- **Oldest** key = the first one: \`map.keys().next().value\`.
- **Refresh** a key = \`delete\` it, then \`set\` it again, which puts it at the end.
`,
    },
    {
      type: 'predict',
      title: 'Map order',
      md: 'Watch what `set` on an existing key does to the order, compared with `delete` then `set`.',
      code: `const m = new Map();
m.set("a", 1);
m.set("b", 2);
m.set("c", 3);

m.set("a", 10);
console.log([...m.keys()]);

m.delete("b");
m.set("b", 2);
console.log([...m.keys()]);
console.log(m.keys().next().value);`,
      output: `[ "a", "b", "c" ]
[ "a", "c", "b" ]
a`,
      explain: `
- \`set\` on a key that's already there **updates the value but keeps its place**. "a" is still first.
- \`delete\` then \`set\` removes it and appends it, so "b" moves to the **end**.
- \`m.keys()\` gives an iterator over keys, oldest first. \`.next().value\` is the first one: the oldest.

That first bullet is the classic LRU bug: refreshing with just \`set\` doesn't move anything.
`,
    },
    {
      type: 'task',
      title: 'Part 1: get and put that refresh',
      md: `
The starter makes the Map and a \`keys()\` helper (oldest first) so the tests can see the order. Fill in \`get\` and \`put\`. No eviction yet.

- \`get(key)\`: if the key is missing, return \`undefined\`. Otherwise, move it to the end (delete, then set) and return its value.
- \`put(key, value)\`: delete the key (harmless if missing), then set it. That puts it at the end.

~~~
const c = createLRU(3);
c.put("a", 1); c.put("b", 2);
c.get("a");     → 1
c.keys();       → ["b", "a"]
~~~
`,
      starter: `function createLRU(capacity) {
  const map = new Map(); // key -> value, oldest first

  return {
    get(key) {
      // your code here
    },
    put(key, value) {
      // your code here
    },
    keys: () => [...map.keys()],
  };
}
`,
      tests: [
        { name: 'get returns a stored value', code: `const c = createLRU(3); c.put("a", 1); eq(c.get("a"), 1);` },
        { name: 'get on a missing key gives undefined', code: `const c = createLRU(3); eq(c.get("nope"), undefined);` },
        { name: 'get moves the key to the end', code: `const c = createLRU(3); c.put("a", 1); c.put("b", 2); c.get("a"); eq(c.keys(), ["b", "a"]);` },
        { name: 'put on an existing key updates it and moves it to the end', code: `const c = createLRU(3); c.put("a", 1); c.put("b", 2); c.put("a", 9); eq(c.keys(), ["b", "a"], "delete before set so the key moves"); eq(c.get("a"), 9);` },
      ],
      hint: '`get`: `if (!map.has(key)) return undefined;` then `const value = map.get(key); map.delete(key); map.set(key, value); return value;`. `put`: `map.delete(key); map.set(key, value);`.',
      solution: `function createLRU(capacity) {
  const map = new Map(); // key -> value, oldest first

  return {
    get(key) {
      if (!map.has(key)) return undefined;
      const value = map.get(key);
      map.delete(key);          // take it out...
      map.set(key, value);      // ...and put it back at the end: most recent
      return value;
    },
    put(key, value) {
      map.delete(key);          // so an existing key moves to the end too
      map.set(key, value);
    },
    keys: () => [...map.keys()],
  };
}
`,
      explain: '`get(key) { ... }` inside an object is shorthand for `get: function (key) { ... }`. Both methods share `map` through the closure, and nothing outside can reach it.',
    },
    {
      type: 'task',
      title: 'Part 2: evict the oldest',
      md: `
Now respect \`capacity\`. At the end of \`put\`, if \`map.size\` is bigger than \`capacity\`, delete the **oldest** key: \`map.keys().next().value\`.

~~~
const c = createLRU(2);
c.put("a", 1); c.put("b", 2);
c.get("a");          // a is fresh, b is now oldest
c.put("c", 3);       // evicts b
c.keys();            → ["a", "c"]
~~~
`,
      starter: `function createLRU(capacity) {
  const map = new Map(); // key -> value, oldest first

  return {
    get(key) {
      if (!map.has(key)) return undefined;
      const value = map.get(key);
      map.delete(key);
      map.set(key, value);
      return value;
    },
    put(key, value) {
      map.delete(key);
      map.set(key, value);
      // your code here: evict the oldest if over capacity
    },
    keys: () => [...map.keys()],
  };
}
`,
      tests: [
        { name: 'never holds more than capacity', code: `const c = createLRU(2); c.put("a", 1); c.put("b", 2); c.put("c", 3); eq(c.keys().length, 2);` },
        { name: 'evicts the least recently used key', code: `const c = createLRU(2); c.put("a", 1); c.put("b", 2); c.get("a"); c.put("c", 3); eq(c.get("b"), undefined, "b was the least recently used"); eq(c.keys(), ["a", "c"]);` },
        { name: 'updating a key in a full cache evicts nothing', code: `const c = createLRU(2); c.put("a", 1); c.put("b", 2); c.put("a", 5); eq(c.keys(), ["b", "a"]);` },
      ],
      hint: 'After the `set`: `if (map.size > capacity) map.delete(map.keys().next().value);`.',
      solution: `function createLRU(capacity) {
  const map = new Map(); // key -> value, oldest first

  return {
    get(key) {
      if (!map.has(key)) return undefined;
      const value = map.get(key);
      map.delete(key);
      map.set(key, value);
      return value;
    },
    put(key, value) {
      map.delete(key);
      map.set(key, value);
      if (map.size > capacity) {
        map.delete(map.keys().next().value); // the first key is the oldest
      }
    },
    keys: () => [...map.keys()],
  };
}
`,
      explain: 'Checking **after** the `set` handles both cases with one `if`: a new key pushes the size over capacity, an updated key doesn\'t.',
    },
    {
      type: 'task',
      title: 'Part 3: memoize with a size limit',
      md: `
> "Use the same idea to cache an expensive function, without letting the cache grow forever."

Write \`memoizeLRU(fn, capacity)\`. It returns a function of **one** argument that:

- returns the cached result if it has one (and marks it as recently used);
- otherwise calls \`fn(arg)\`, stores the result, evicts the oldest if over \`capacity\`, and returns it.

~~~
const slowSquare = (n) => { calls++; return n * n; };
const square = memoizeLRU(slowSquare, 2);
square(3); square(3);   // fn runs once
square(4); square(5);   // 3 is evicted
square(3);              // fn runs again
~~~

It's the closure from \`once\` in lesson 4, with a Map inside. Use \`has\` to check, not \`get\`, so a cached \`0\` or \`undefined\` still counts.
`,
      starter: `function memoizeLRU(fn, capacity) {
  const cache = new Map(); // arg -> result, oldest first
  // your code here: return a function of one argument
}
`,
      tests: [
        {
          name: 'returns the right results',
          code: `const square = memoizeLRU((n) => n * n, 2); eq(square(3), 9); eq(square(4), 16);`,
        },
        {
          name: 'a repeated argument does not call fn again',
          code: `let calls = 0; const square = memoizeLRU((n) => { calls++; return n * n; }, 2);
square(3); square(3); square(3);
eq(calls, 1);`,
        },
        {
          name: 'the least recently used result is evicted',
          code: `let calls = 0; const square = memoizeLRU((n) => { calls++; return n * n; }, 2);
square(3); square(4); square(3); square(5);   // 4 is the oldest now, so 4 is evicted
eq(calls, 3);
square(3); eq(calls, 3, "3 should still be cached");
square(4); eq(calls, 4, "4 should have been evicted");`,
        },
        {
          name: 'a cached result of 0 still counts as cached',
          code: `let calls = 0; const zero = memoizeLRU(() => { calls++; return 0; }, 2);
zero("x"); zero("x");
eq(calls, 1, "use cache.has(arg), not a truthy check");`,
        },
      ],
      hint: '`return (arg) => { ... }`. If `cache.has(arg)`: get the value, delete, set, return it. Otherwise: `const value = fn(arg); cache.set(arg, value);`, evict if `cache.size > capacity`, `return value;`.',
      solution: `function memoizeLRU(fn, capacity) {
  const cache = new Map(); // arg -> result, oldest first
  return (arg) => {
    if (cache.has(arg)) {
      const value = cache.get(arg);
      cache.delete(arg);
      cache.set(arg, value);                 // refresh: most recently used
      return value;
    }
    const value = fn(arg);
    cache.set(arg, value);
    if (cache.size > capacity) cache.delete(cache.keys().next().value);
    return value;
  };
}
`,
    },
    {
      type: 'read',
      title: 'Walkthrough: the full solution',
      md: `
Trace \`createLRU(2)\`. The Map is shown oldest → newest.

| call | Map after | returns | note |
|---|---|---|---|
| put(a, 1) | a | | |
| put(b, 2) | a, b | | |
| get(a) | b, a | 1 | a refreshed |
| put(c, 3) | b, a, c → **a, c** | | over capacity: evict b |
| get(b) | a, c | undefined | |
| put(a, 7) | c, a | | update: a moves, nothing evicted |

**Big-O:** \`has\`, \`get\`, \`set\`, \`delete\` and "first key" are all O(1), so \`get\` and \`put\` are **O(1)**. Memory is O(capacity).

Interviewers often expect a **class**. It's the same code with \`this.map\` instead of a closure:

~~~js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }
  put(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) this.map.delete(this.map.keys().next().value);
  }
}

const c = new LRUCache(2);
c.put("a", 1); c.put("b", 2); c.get("a"); c.put("c", 3);
console.log([...c.map.keys()]);
~~~

**Say it:** "I need an O(1) lookup and an O(1) 'oldest key'. A JavaScript Map gives both, because it keeps insertion order. To refresh a key I delete and re-set it, and to evict I delete the first key. In a language without an ordered map, I'd use a hash map plus a doubly linked list."
`,
    },
    {
      type: 'check',
      title: 'Follow-up questions',
      items: [
        {
          q: '"Do it without relying on Map order, like you would in Java or Python 2." What\'s the classic structure?',
          choices: [
            'A hash map from key to a node in a doubly linked list; move nodes to the front on use, evict from the back',
            'A sorted array of timestamps',
            'Two arrays, one for keys and one for values',
          ],
          answer: 0,
          explain: 'The hash map finds the node in O(1); the doubly linked list moves or removes it in O(1), because each node knows both neighbours.',
          why: {
            1: 'Keeping it sorted costs O(log n) or O(n) per operation.',
            2: 'Finding and moving items in arrays is O(n), the brute force.',
          },
        },
        {
          q: 'Why delete then set in `get`, rather than just `set`?',
          choices: [
            '`set` on an existing key keeps its position, so the key would never become "recent"',
            '`set` throws on an existing key',
            'It\'s only for readability',
          ],
          answer: 0,
          explain: 'This is the one Map rule the whole solution depends on.',
          why: {
            1: '`set` happily overwrites. It just doesn\'t move the key.',
            2: 'Without the delete, eviction picks the wrong key.',
          },
        },
        {
          q: '"Entries should also expire after 60 seconds." What do you store?',
          choices: [
            'The value plus an `expiresAt` timestamp; `get` treats an expired entry as missing and deletes it',
            'A `setTimeout` per key that deletes it',
            'Nothing, LRU already handles it',
          ],
          answer: 0,
          explain: 'Checking the time lazily on read is cheap and needs no timers. (Timers also work, but a million keys means a million timers.)',
          why: {
            1: 'It works for small caches but costs a timer per entry.',
            2: 'LRU evicts by space, not by age.',
          },
        },
        {
          q: 'What\'s the time complexity of `get` and `put` in the Map version?',
          choices: ['O(1) each', 'O(n) each', 'O(log n) each'],
          answer: 0,
          explain: 'Every Map operation used is constant time, including reading the first key from the iterator.',
          why: {
            1: 'That\'s the array brute force.',
            2: 'Nothing is sorted or searched.',
          },
        },
      ],
    },
  ],
};
