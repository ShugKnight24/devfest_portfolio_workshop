// Node course · lesson 10. Step types: read, predict, task, check (see ../index.js).
// The worker has no node:events or node:stream, so the runnable parts are small models of them;
// the real APIs are in ~~~node blocks.
export default {
  id: 'events-and-streams',
  builds: ['node/async-await', 'node/middleware', 'js/objects', 'js/filter-and-find', 'js/classes-and-this'],
  title: 'Events and streams',
  goal: 'Build a small EventEmitter to see how Node signals that something happened, and understand streams and backpressure well enough to use them safely.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Something happened: EventEmitter',
      md: `
A promise answers **one** question once: "is the file read yet?" But a server receives **many** requests, a socket receives **many** chunks, a process can get a shutdown signal at any time. For "this can happen any number of times", Node uses **events**.

\`EventEmitter\` from \`node:events\` is the base of most of Node's core objects. HTTP servers, sockets, streams and \`process\` are all emitters:

~~~node
import { EventEmitter } from 'node:events';

const orders = new EventEmitter();

orders.on('created', (order) => console.log('email receipt for', order.id));
orders.on('created', (order) => console.log('update stock for', order.id));

orders.emit('created', { id: 7 });   // runs both listeners, in the order they were added
~~~

~~~node
server.on('request', (req, res) => { /* ... */ });   // what createServer(handler) does for you
process.on('SIGTERM', () => server.close());          // the platform asks you to shut down
~~~

The API is small: \`on(name, fn)\` registers a **listener**, \`emit(name, ...args)\` calls every listener for that name with those args, \`off(name, fn)\` removes one, \`once(name, fn)\` listens a single time. It's the middleware idea from lesson 7 turned sideways: instead of a chain where each function decides whether to continue, every listener gets a turn.
`,
    },
    {
      type: 'task',
      title: 'on and emit',
      md: `
Build the core of an emitter. \`this.listeners\` maps an event name to an array of functions.

- \`on(event, fn)\` adds \`fn\` to that event's array (create the array the first time) and returns \`this\`.
- \`emit(event, ...args)\` calls each listener with \`...args\`, in order. Return \`true\` if there were listeners, \`false\` if not.

~~~
const e = new Emitter();
e.on('greet', (name) => console.log('hi', name));
e.emit('greet', 'Ada')   → logs "hi Ada", returns true
e.emit('nothing')        → returns false
~~~
`,
      starter: `class Emitter {
  constructor() {
    this.listeners = {};
  }

  on(event, fn) {
    // your code here
    return this;
  }

  emit(event, ...args) {
    // your code here
  }
}
`,
      tests: [
        { name: 'a listener gets the arguments', code: `const e = new Emitter(); let got; e.on('greet', (a, b) => { got = [a, b]; }); e.emit('greet', 'Ada', 36); eq(got, ['Ada', 36]);` },
        { name: 'listeners run in the order they were added', code: `const e = new Emitter(); const log = []; e.on('x', () => log.push(1)); e.on('x', () => log.push(2)); e.emit('x'); eq(log, [1, 2]);` },
        { name: 'emit returns true when someone listened', code: `const e = new Emitter(); e.on('x', () => {}); eq(e.emit('x'), true);` },
        { name: 'emit returns false when nobody listened', code: `eq(new Emitter().emit('nothing'), false);` },
      ],
      hint: "In `on`: `(this.listeners[event] ||= []).push(fn);`. In `emit`: `const fns = this.listeners[event] || [];`, loop and call `fn(...args)`, then `return fns.length > 0;`",
      solution: `class Emitter {
  constructor() {
    this.listeners = {};
  }

  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
    return this;
  }

  emit(event, ...args) {
    const fns = this.listeners[event] || [];
    for (const fn of fns) fn(...args);
    return fns.length > 0;
  }
}
`,
      explain: 'Returning `this` from `on` lets calls chain: `e.on("a", f).on("b", g)`. Node\'s real `emit` also returns a boolean for the same reason yours does.',
    },
    {
      type: 'predict',
      title: 'emit is synchronous',
      md: 'Lesson 3 asked "what runs when". Same question for events.',
      code: `class Emitter {
  constructor() { this.listeners = {}; }
  on(event, fn) { (this.listeners[event] ||= []).push(fn); return this; }
  emit(event, ...args) {
    const fns = this.listeners[event] || [];
    for (const fn of fns) fn(...args);
    return fns.length > 0;
  }
}

const e = new Emitter();
e.on('saved', () => console.log('listener'));
console.log('before emit');
e.emit('saved');
console.log('after emit');`,
      output: `before emit
listener
after emit`,
      explain: `
\`emit\` is a plain loop that calls functions, so every listener runs **right there**, before \`emit\` returns. No queue is involved. The real \`EventEmitter\` behaves the same way.

People often assume events are asynchronous because they're used for async things. The *source* of the event (a network packet arriving) is async; the *delivery* to listeners is synchronous. One consequence: a slow listener blocks the code that called \`emit\`, and a listener that throws makes \`emit\` throw.
`,
    },
    {
      type: 'task',
      title: 'off',
      md: `
Add \`off(event, fn)\`: remove that exact function from the event's listeners and return \`this\`. Other listeners stay.

~~~
const log = (x) => console.log(x);
e.on('tick', log);
e.off('tick', log);
e.emit('tick', 1)   → nothing logged, returns false
~~~

\`filter\` (JavaScript lesson 10) makes it one line. Functions compare by identity, so \`f !== fn\` keeps everything except that one function.
`,
      starter: `class Emitter {
  constructor() { this.listeners = {}; }
  on(event, fn) { (this.listeners[event] ||= []).push(fn); return this; }
  emit(event, ...args) {
    const fns = this.listeners[event] || [];
    for (const fn of fns) fn(...args);
    return fns.length > 0;
  }

  off(event, fn) {
    // your code here
    return this;
  }
}
`,
      tests: [
        { name: 'a removed listener no longer runs', code: `const e = new Emitter(); let n = 0; const f = () => n++; e.on('t', f); e.off('t', f); e.emit('t'); eq(n, 0);` },
        { name: 'other listeners keep running', code: `const e = new Emitter(); const log = []; const a = () => log.push('a'); const b = () => log.push('b'); e.on('t', a); e.on('t', b); e.off('t', a); e.emit('t'); eq(log, ['b']);` },
        { name: 'removing from an unknown event does not crash', code: `const e = new Emitter(); e.off('never', () => {}); eq(e.emit('never'), false);` },
      ],
      hint: '`this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== fn);`',
      solution: `class Emitter {
  constructor() { this.listeners = {}; }
  on(event, fn) { (this.listeners[event] ||= []).push(fn); return this; }
  emit(event, ...args) {
    const fns = this.listeners[event] || [];
    for (const fn of fns) fn(...args);
    return fns.length > 0;
  }

  off(event, fn) {
    this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== fn);
    return this;
  }
}
`,
      explain: 'This is why you pass a **named** function when you plan to remove it. `e.on("t", () => ...)` followed by `e.off("t", () => ...)` removes nothing: the two arrows are different functions that just look alike.',
    },
    {
      type: 'task',
      title: 'once',
      md: `
Add \`once(event, fn)\`: listen for the next emit only. The trick is a **wrapper** function that removes itself, then calls \`fn\`:

~~~
const wrapper = (...args) => {
  this.off(event, wrapper);
  fn(...args);
};
~~~

Register \`wrapper\` with \`this.on\` and return \`this\`.

~~~
e.once('ready', () => console.log('ready!'));
e.emit('ready')   → logs "ready!"
e.emit('ready')   → nothing, returns false
~~~
`,
      starter: `class Emitter {
  constructor() { this.listeners = {}; }
  on(event, fn) { (this.listeners[event] ||= []).push(fn); return this; }
  off(event, fn) {
    this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== fn);
    return this;
  }
  emit(event, ...args) {
    const fns = [...(this.listeners[event] || [])];
    for (const fn of fns) fn(...args);
    return fns.length > 0;
  }

  once(event, fn) {
    // your code here
    return this;
  }
}
`,
      tests: [
        { name: 'runs on the first emit', code: `const e = new Emitter(); let n = 0; e.once('r', () => n++); e.emit('r'); eq(n, 1);` },
        { name: 'does not run on the second emit', code: `const e = new Emitter(); let n = 0; e.once('r', () => n++); e.emit('r'); e.emit('r'); eq(n, 1);` },
        { name: 'passes the arguments through', code: `const e = new Emitter(); let got; e.once('r', (a, b) => { got = a + b; }); e.emit('r', 2, 3); eq(got, 5);` },
      ],
      hint: 'Paste the wrapper from the instructions inside `once`, then add `this.on(event, wrapper);` before the `return this`. The arrow function keeps `this` pointing at the emitter.',
      solution: `class Emitter {
  constructor() { this.listeners = {}; }
  on(event, fn) { (this.listeners[event] ||= []).push(fn); return this; }
  off(event, fn) {
    this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== fn);
    return this;
  }
  emit(event, ...args) {
    const fns = [...(this.listeners[event] || [])];
    for (const fn of fns) fn(...args);
    return fns.length > 0;
  }

  once(event, fn) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      fn(...args);
    };
    this.on(event, wrapper);
    return this;
  }
}
`,
      explain: 'Notice `emit` copies the array first (`[...]`). Without the copy, a `once` wrapper removing itself mid-loop would change the array being looped over. Node also gives you `await once(emitter, "ready")` from `node:events`, which turns the next event into a promise.',
    },
    {
      type: 'read',
      title: 'The error event is special',
      md: `
One rule in Node's real \`EventEmitter\` surprises everyone once: if something emits \`'error'\` and **no listener** is registered for \`'error'\`, \`emit\` **throws** the error. In a server, an uncaught throw like that crashes the process.

~~~node
const socket = net.connect(5432, 'db.internal');
socket.on('error', (err) => {          // without this, a refused connection crashes the app
  console.error('db connection failed:', err.message);
});
~~~

So whenever you hold an emitter that can fail (sockets, streams, child processes), attach an \`'error'\` listener. It's the event version of "don't leave a promise without a \`catch\`" from lesson 4.

## Memory leaks

Listeners stay registered until removed. Adding a listener **per request** to a long-lived emitter (like \`process\`) without removing it grows forever. Node warns when one event has more than 10 listeners: \`MaxListenersExceededWarning: Possible EventEmitter memory leak detected\`. When you see it, look for an \`on\` without a matching \`off\`, rather than raising the limit.
`,
    },
    {
      type: 'read',
      title: 'Streams: data a piece at a time',
      md: `
Reading a 2 GB log file with \`readFile\` loads all 2 GB into memory before you can look at the first line. A **stream** hands you the data in **chunks** (64 KB at a time for files) as it arrives, so memory use stays small and work starts immediately.

Streams are emitters with a contract. There are four kinds:

| Kind | You... | Examples |
|---|---|---|
| Readable | read from it | \`fs.createReadStream\`, an incoming HTTP request body |
| Writable | write to it | \`fs.createWriteStream\`, an HTTP response |
| Duplex | both | a TCP socket |
| Transform | write in, read changed data out | gzip, CSV parsers |

The modern way to read one is \`for await\`, because readable streams are **async iterables**:

~~~node
import { createReadStream } from 'node:fs';

let bytes = 0;
for await (const chunk of createReadStream('big.log')) {
  bytes += chunk.length;      // each chunk is a Buffer (raw bytes) unless you set an encoding
}
console.log(bytes);
~~~

You already used this in lesson 5: \`for await (const chunk of req) body += chunk;\` reads a request body, because \`req\` is a readable stream.
`,
    },
    {
      type: 'task',
      title: 'countLines over chunks',
      md: `
Write \`countLines(chunks)\`. \`chunks\` is an **async iterable** of strings (like a stream with an encoding set). Count the newline characters (\`'\\n'\`) across all chunks.

~~~
async function* fakeStream() { yield 'a\\nb'; yield '\\nc\\n'; }
await countLines(fakeStream())   → 3
~~~

A line can be split across two chunks, which is why you count newline characters instead of splitting each chunk into lines.

**Example** of reading an async iterable:

~~~
for await (const chunk of chunks) {
  // chunk is one string
}
~~~
`,
      starter: `async function countLines(chunks) {
  let count = 0;
  // your code here
  return count;
}
`,
      tests: [
        { name: 'counts newlines across chunks', code: `async function* s() { yield 'a\\nb'; yield '\\nc\\n'; } eq(await countLines(s()), 3);` },
        { name: 'no newlines gives 0', code: `async function* s() { yield 'abc'; } eq(await countLines(s()), 0);` },
        { name: 'an empty stream gives 0', code: `async function* s() {} eq(await countLines(s()), 0);` },
      ],
      hint: "Inside the `for await` loop, loop over the characters too: `for (const ch of chunk) if (ch === '\\n') count++;`",
      solution: `async function countLines(chunks) {
  let count = 0;
  for await (const chunk of chunks) {
    for (const ch of chunk) {
      if (ch === '\\n') count++;
    }
  }
  return count;
}
`,
    },
    {
      type: 'read',
      title: 'Backpressure',
      md: `
Streams solve a second problem besides memory: **speed mismatch**. Reading a file from disk is fast; uploading it to a slow client is slow. If you read as fast as you can and write everything, the unsent data piles up in memory, and you're back to loading the whole file.

So a writable stream pushes back. \`write(chunk)\` returns a boolean:

- \`true\`: fine, keep going.
- \`false\`: my buffer is full (it has reached its \`highWaterMark\`). The chunk was still accepted, but **stop writing** until I emit \`'drain'\`.

Here's a tiny model with a limit of 3 chunks:

~~~js
class TinyWritable {
  constructor(highWaterMark) { this.limit = highWaterMark; this.buffered = []; }
  write(chunk) {
    this.buffered.push(chunk);             // always accepted...
    return this.buffered.length < this.limit;  // ...but says whether to continue
  }
}

const out = new TinyWritable(3);
console.log(out.write('a'), out.write('b'), out.write('c'), out.write('d'));
~~~

Ignoring \`false\` is called "not respecting backpressure", and it's how a streaming server runs out of memory under load.

You rarely handle it by hand. \`pipeline\` connects streams, respects backpressure, and cleans up every stream if any of them fails:

~~~node
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';

await pipeline(createReadStream('big.log'), createGzip(), createWriteStream('big.log.gz'));
~~~
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'An emitter calls `emit("saved")`. When do the `saved` listeners run?',
          choices: ['Immediately, one after another, before `emit` returns', 'As microtasks after the current code', 'On the next timer tick'],
          answer: 0,
          explain: '`emit` is a synchronous loop over the listeners.',
          why: { 1: 'No queue is involved; `emit` calls them directly.', 2: 'Timers are not involved either.' },
        },
        {
          q: 'A stream emits `"error"` and nothing listens for `"error"`. What happens?',
          choices: ['`emit` throws, which can crash the process', 'The error is silently ignored', 'Node retries the stream'],
          answer: 0,
          explain: 'An unhandled `"error"` event is thrown. Always attach an error listener to things that can fail.',
          why: { 1: 'Only events other than `"error"` are dropped when nobody listens.', 2: 'There is no automatic retry.' },
        },
        {
          q: '`e.on("t", () => go())` then `e.off("t", () => go())`. Is the listener removed?',
          choices: ['No: the two arrow functions are different objects', 'Yes: they have the same code', 'Only if `go` is pure'],
          answer: 0,
          explain: '`off` compares by identity. Keep a reference: `const f = () => go(); e.on("t", f); e.off("t", f);`',
          why: { 1: 'Functions are compared by reference, like objects.', 2: 'Purity has nothing to do with identity.' },
        },
        {
          q: '`writable.write(chunk)` returns `false`. What should you do?',
          choices: ['Stop writing until the stream emits `"drain"`', 'Write the same chunk again', 'Close the stream; it failed'],
          answer: 0,
          explain: '`false` means the buffer is full. The chunk was accepted; wait for `"drain"` before writing more.',
          why: { 1: 'The chunk was already accepted, so writing it again duplicates it.', 2: 'Nothing failed; it is asking you to slow down.' },
        },
        {
          q: 'Why stream a 2 GB file instead of `readFile`?',
          choices: ['Memory stays small and work starts on the first chunk', 'Streams make the disk faster', '`readFile` cannot read files over 1 GB'],
          answer: 0,
          explain: 'A stream holds a few chunks at a time instead of the whole file.',
          why: { 1: 'The disk speed is the same; memory use is the difference.', 2: 'The real problem is holding it all in memory at once.' },
        },
      ],
    },
  ],
};
