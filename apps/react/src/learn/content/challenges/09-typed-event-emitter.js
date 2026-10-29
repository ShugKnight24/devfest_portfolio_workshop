// Challenges · lesson 9 (TypeScript). Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~ts get a Run button, so they must run cleanly).
// TS runs through sucrase: types are stripped, not checked. Type errors are taught with check steps.
export default {
  id: 'typed-event-emitter',
  lang: 'ts',
  builds: ['challenges/lru-cache', 'challenges/debounce-and-throttle', 'js/filter-and-find', 'ts/generics', 'node/events-and-streams'],
  title: 'Typed event emitter: on, off, once',
  goal: 'Build a small pub/sub event emitter, then type it so TypeScript rejects unknown event names and wrong payloads.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The question',
      md: `
> "Build an event emitter. \`on(event, listener)\` subscribes, \`emit(event, payload)\` calls every listener for that event. Then make it type-safe: emitting an event that doesn't exist, or with the wrong payload, should be a compile error."

~~~text
type AppEvents = {
  login: { userId: string };
  cart: { count: number };
};

const bus = createEmitter<AppEvents>();
bus.on("login", (p) => console.log("welcome", p.userId));
bus.emit("login", { userId: "u1" });     // → welcome u1
bus.emit("cart", { count: "two" });      // tsc: count must be a number
~~~

(That block only shows the goal. You'll build \`createEmitter\` below.)

Event emitters are everywhere: Node's \`EventEmitter\`, the DOM's \`addEventListener\`, and state libraries that notify components. It reuses the **closure-with-private-state** pattern from the debounce and LRU lessons, and \`filter\` from JavaScript lesson 10 for unsubscribing.
`,
    },
    {
      type: 'check',
      title: 'Before you code: ask and spot',
      items: [
        {
          q: 'Two listeners are subscribed to "login". In what order should they run?',
          choices: ['The order they subscribed in', 'Reverse order', 'Random order'],
          answer: 0,
          explain: 'Subscription order is what Node and the DOM do, and it\'s what people expect. Confirm it anyway.',
          why: {
            1: 'Nothing about an emitter suggests last-in-first-out.',
            2: 'Random order makes bugs impossible to reproduce.',
          },
        },
        {
          q: 'Which question about unsubscribing is worth asking?',
          choices: [
            '"Should `on` return an unsubscribe function, or should there be a separate `off(event, listener)`?"',
            '"Can listeners be arrow functions?"',
            '"Should emit return a string?"',
          ],
          answer: 0,
          explain: 'Both designs are common. Returning an unsubscribe function is what React effects like, because the cleanup is right there. Part 2 does that.',
          why: {
            1: 'Any function works as a listener.',
            2: 'Emit usually returns nothing (Node\'s returns whether anyone was listening).',
          },
        },
        {
          q: 'Which data structure fits "event name → listeners"?',
          choices: [
            'A Map from event name to an array of functions',
            'One array of all listeners',
            'A Set of event names',
          ],
          answer: 0,
          explain: 'It\'s the `groupBy` shape from lesson 1: a key with a list per key. Emit looks up one key and loops over its list.',
          why: {
            1: 'You\'d have to scan every listener and check its event on every emit.',
            2: 'That knows which events exist, but not who is listening.',
          },
        },
      ],
    },
    {
      type: 'read',
      title: 'The plan in plain JavaScript first',
      md: `
Get it working, then add types. The plan:

1. A private \`Map\`: event name → array of listener functions.
2. \`on(event, fn)\`: get the array for \`event\` (make it if missing, like \`groupBy\`), push \`fn\`.
3. \`emit(event, payload)\`: get the array (or \`[]\`), call each listener with \`payload\`.

Here's the same pattern with a single, unnamed channel, so you can see the shape:

~~~ts
function createSignal() {
  const listeners: Array<(value: number) => void> = [];
  return {
    subscribe(fn: (value: number) => void) {
      listeners.push(fn);
    },
    send(value: number) {
      for (const fn of listeners) fn(value);
    },
  };
}

const s = createSignal();
s.subscribe((v) => console.log("A got", v));
s.subscribe((v) => console.log("B got", v));
s.send(7);
~~~

The emitter is this, with one list **per event name**.
`,
    },
    {
      type: 'read',
      title: 'Typing it: an event map and keyof',
      md: `
The types describe events with **one object type**, the event map. Each key is an event name, each value is that event's payload:

~~~
type AppEvents = {
  login: { userId: string };
  cart: { count: number };
};
~~~

Two pieces of TypeScript turn that into checks:

| syntax | means | for AppEvents |
|---|---|---|
| \`keyof Events\` | the union of key names | \`"login"\` or \`"cart"\` |
| \`Events[K]\` | the type stored under key K | \`Events["cart"]\` is \`{ count: number }\` |

So the method signatures are:

~~~
on<K extends keyof Events>(event: K, fn: (payload: Events[K]) => void): void
emit<K extends keyof Events>(event: K, payload: Events[K]): void
~~~

\`K extends keyof Events\` means "K is one of the event names". Once TypeScript knows K is \`"cart"\`, it knows the payload must be \`{ count: number }\`.

Remember: in this editor TypeScript is **stripped, not checked**, so the code runs either way. A real \`tsc\` run gives errors like these:

~~~text
bus.emit("signup", { userId: "u1" });
  error TS2345: Argument of type '"signup"' is not assignable to parameter of type 'keyof AppEvents'.

bus.emit("cart", { count: "two" });
  error TS2322: Type 'string' is not assignable to type 'number'.
~~~
`,
    },
    {
      type: 'check',
      title: 'Which line does tsc reject?',
      md: 'Use the `AppEvents` map: `login` carries `{ userId: string }`, `cart` carries `{ count: number }`.',
      items: [
        {
          q: 'Which call does `tsc` reject?',
          choices: [
            '`bus.emit("logout", {})`',
            '`bus.emit("login", { userId: "u1" })`',
            '`bus.emit("cart", { count: 3 })`',
          ],
          answer: 0,
          explain: '"logout" isn\'t a key of `AppEvents`, so it isn\'t in `keyof AppEvents`.',
          why: {
            1: 'Right name, right payload.',
            2: 'Right name, and 3 is a number.',
          },
        },
        {
          q: 'Which listener does `tsc` reject?',
          choices: [
            '`bus.on("cart", (p) => p.userId.toUpperCase())`',
            '`bus.on("cart", (p) => p.count + 1)`',
            '`bus.on("login", (p) => p.userId.toUpperCase())`',
          ],
          answer: 0,
          explain: 'For "cart", `p` is `{ count: number }`, which has no `userId`. You never wrote a type on `p`; TypeScript worked it out from the event name.',
          why: {
            1: '`count` is a number, so `+ 1` is fine.',
            2: 'For "login", `p.userId` is a string.',
          },
        },
        {
          q: 'Why `<K extends keyof Events>` instead of just `event: keyof Events`?',
          choices: [
            'The generic links the two parameters: once `event` is "cart", `payload` must be `Events["cart"]`',
            'Generics run faster',
            'Without it, `emit` can\'t be called',
          ],
          answer: 0,
          explain: 'With plain `keyof Events`, the payload type could only be "any payload of any event", so `emit("cart", { userId: "u1" })` would pass.',
          why: {
            1: 'Types are erased. They never change runtime speed.',
            2: 'It could be called. It just wouldn\'t catch mismatched payloads.',
          },
        },
      ],
    },
    {
      type: 'task',
      title: 'Part 1: on and emit',
      md: `
Fill in \`on\` and \`emit\`. The types are written for you; the work is the same as \`groupBy\` and the signal example.

- \`on\`: if \`listeners\` has no array for \`event\`, set one. Then push \`fn\`.
- \`emit\`: loop over \`listeners.get(event) ?? []\` and call each with \`payload\`.

~~~
const bus = createEmitter<AppEvents>();
bus.on("login", (p) => seen.push(p.userId));
bus.emit("login", { userId: "u1" });     // seen is ["u1"]
~~~
`,
      starter: `type Listener<T> = (payload: T) => void;

function createEmitter<Events extends Record<string, unknown>>() {
  // the public methods carry the precise types; inside, any listener fits
  const listeners = new Map<keyof Events, Listener<any>[]>();

  function on<K extends keyof Events>(event: K, fn: Listener<Events[K]>) {
    // your code here
  }

  function emit<K extends keyof Events>(event: K, payload: Events[K]) {
    // your code here
  }

  return { on, emit };
}
`,
      tests: [
        {
          name: 'a listener receives the payload',
          code: `const bus = createEmitter(); const seen = [];
bus.on("login", (p) => seen.push(p.userId));
bus.emit("login", { userId: "u1" });
eq(seen, ["u1"]);`,
        },
        {
          name: 'several listeners run in the order they subscribed',
          code: `const bus = createEmitter(); const seen = [];
bus.on("x", () => seen.push("first"));
bus.on("x", () => seen.push("second"));
bus.emit("x", null);
eq(seen, ["first", "second"]);`,
        },
        {
          name: 'events do not mix',
          code: `const bus = createEmitter(); const seen = [];
bus.on("cart", (p) => seen.push(p.count));
bus.emit("login", { userId: "u1" });
eq(seen, []);`,
        },
        {
          name: 'emitting with no listeners does nothing',
          code: `const bus = createEmitter();
bus.emit("nobody", 1); // must not throw`,
        },
      ],
      hint: '`on`: `if (!listeners.has(event)) listeners.set(event, []);` then `listeners.get(event)!.push(fn);`. `emit`: `for (const fn of listeners.get(event) ?? []) fn(payload);`.',
      solution: `type Listener<T> = (payload: T) => void;

function createEmitter<Events extends Record<string, unknown>>() {
  // the public methods carry the precise types; inside, any listener fits
  const listeners = new Map<keyof Events, Listener<any>[]>();

  function on<K extends keyof Events>(event: K, fn: Listener<Events[K]>) {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event)!.push(fn);      // ! : we just made sure it exists
  }

  function emit<K extends keyof Events>(event: K, payload: Events[K]) {
    for (const fn of listeners.get(event) ?? []) fn(payload);
  }

  return { on, emit };
}
`,
      explain: 'The `!` after `get(event)` tells TypeScript "this isn\'t undefined", because `Map.get` is typed as possibly undefined. It\'s safe here because of the line above. At runtime it\'s simply removed.',
    },
    {
      type: 'task',
      title: 'Part 2: unsubscribe',
      md: `
> "A component subscribes when it mounts. When it unmounts, it must stop listening, or you get a memory leak and updates to something that's gone."

Make \`on\` **return a function** that removes that listener. Removing is a \`filter\` (JavaScript lesson 10): keep every listener that isn't \`fn\`.

~~~
const off = bus.on("cart", (p) => seen.push(p.count));
bus.emit("cart", { count: 1 });   // seen is [1]
off();
bus.emit("cart", { count: 2 });   // seen is still [1]
~~~

It's another closure: the returned function remembers \`event\` and \`fn\`.
`,
      starter: `type Listener<T> = (payload: T) => void;

function createEmitter<Events extends Record<string, unknown>>() {
  const listeners = new Map<keyof Events, Listener<any>[]>();

  function on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event)!.push(fn);
    // your code here: return a function that removes fn
  }

  function emit<K extends keyof Events>(event: K, payload: Events[K]) {
    for (const fn of listeners.get(event) ?? []) fn(payload);
  }

  return { on, emit };
}
`,
      tests: [
        {
          name: 'after off(), the listener is not called',
          code: `const bus = createEmitter(); const seen = [];
const off = bus.on("cart", (p) => seen.push(p.count));
bus.emit("cart", { count: 1 });
off();
bus.emit("cart", { count: 2 });
eq(seen, [1]);`,
        },
        {
          name: 'other listeners keep working',
          code: `const bus = createEmitter(); const seen = [];
const offA = bus.on("x", () => seen.push("a"));
bus.on("x", () => seen.push("b"));
offA();
bus.emit("x", null);
eq(seen, ["b"]);`,
        },
        {
          name: 'calling off twice is harmless',
          code: `const bus = createEmitter(); const seen = [];
const off = bus.on("x", () => seen.push("a"));
off(); off();
bus.emit("x", null);
eq(seen, []);`,
        },
      ],
      hint: '`return () => { listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn)); };`',
      solution: `type Listener<T> = (payload: T) => void;

function createEmitter<Events extends Record<string, unknown>>() {
  const listeners = new Map<keyof Events, Listener<any>[]>();

  function on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event)!.push(fn);
    return () => {
      // a new array without fn: also safe if emit is looping over the old one
      listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn));
    };
  }

  function emit<K extends keyof Events>(event: K, payload: Events[K]) {
    for (const fn of listeners.get(event) ?? []) fn(payload);
  }

  return { on, emit };
}
`,
      explain: 'In React this is exactly an effect\'s cleanup: `useEffect(() => bus.on("cart", update), [])`. The effect returns the unsubscribe function, and React calls it on unmount.',
    },
    {
      type: 'task',
      title: 'Part 3: once',
      md: `
> "Add \`once(event, fn)\`: like \`on\`, but the listener runs only the first time, then removes itself."

Build it **from \`on\`**: subscribe a small wrapper that first unsubscribes, then calls \`fn\`.

~~~
bus.once("login", (p) => seen.push(p.userId));
bus.emit("login", { userId: "u1" });
bus.emit("login", { userId: "u2" });
// seen is ["u1"]
~~~

Compare it with \`once\` from lesson 4: there, a flag stopped the second call. Here, removing the listener does.
`,
      starter: `type Listener<T> = (payload: T) => void;

function createEmitter<Events extends Record<string, unknown>>() {
  const listeners = new Map<keyof Events, Listener<any>[]>();

  function on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event)!.push(fn);
    return () => {
      listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn));
    };
  }

  function emit<K extends keyof Events>(event: K, payload: Events[K]) {
    for (const fn of listeners.get(event) ?? []) fn(payload);
  }

  function once<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    // your code here
  }

  return { on, emit, once };
}
`,
      tests: [
        {
          name: 'runs on the first emit only',
          code: `const bus = createEmitter(); const seen = [];
bus.once("login", (p) => seen.push(p.userId));
bus.emit("login", { userId: "u1" });
bus.emit("login", { userId: "u2" });
eq(seen, ["u1"]);`,
        },
        {
          name: 'does not affect normal listeners',
          code: `const bus = createEmitter(); const seen = [];
bus.on("x", () => seen.push("on"));
bus.once("x", () => seen.push("once"));
bus.emit("x", null); bus.emit("x", null);
eq(seen, ["on", "once", "on"]);`,
        },
        {
          name: 'can be cancelled before it fires',
          code: `const bus = createEmitter(); const seen = [];
const off = bus.once("x", () => seen.push("once"));
off();
bus.emit("x", null);
eq(seen, []);`,
        },
      ],
      hint: '`const off = on(event, (payload) => { off(); fn(payload); }); return off;`',
      solution: `type Listener<T> = (payload: T) => void;

function createEmitter<Events extends Record<string, unknown>>() {
  const listeners = new Map<keyof Events, Listener<any>[]>();

  function on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event)!.push(fn);
    return () => {
      listeners.set(event, (listeners.get(event) ?? []).filter((l) => l !== fn));
    };
  }

  function emit<K extends keyof Events>(event: K, payload: Events[K]) {
    for (const fn of listeners.get(event) ?? []) fn(payload);
  }

  function once<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    const off = on(event, (payload) => {
      off();          // remove the wrapper first...
      fn(payload);    // ...then run the real listener
    });
    return off;
  }

  return { on, emit, once };
}
`,
      explain: 'The wrapper can call `off` even though `off` is assigned on the same line: by the time an emit runs the wrapper, `on` has long since returned.',
    },
    {
      type: 'read',
      title: 'Walkthrough: the full solution',
      md: `
Trace one emitter. The Map is shown as event → listeners.

| call | listeners after | output |
|---|---|---|
| \`on("x", A)\` | x → [A] | |
| \`once("x", B)\` | x → [A, wrapB] | |
| \`emit("x", 1)\` | x → [A] | A(1); wrapB removes itself, then B(1) |
| \`emit("x", 2)\` | x → [A] | A(2) |
| \`offA()\` | x → [] | |

Why does removing wrapB **during** the emit not skip anyone? \`off\` builds a **new** array with \`filter\`. The \`for...of\` in \`emit\` keeps looping over the old array it already has. If \`off\` used \`splice\` on the same array, the loop could skip the next listener: a classic bug.

**Big-O:**

| | time |
|---|---|
| \`on\` | O(1) |
| \`emit\` | O(listeners for that event) |
| unsubscribe | O(listeners for that event), because of \`filter\` |

**Say it:** "A Map from event name to an array of listeners, kept private in a closure. \`emit\` loops over a copy-safe array; \`on\` returns an unsubscribe built with \`filter\`; \`once\` is \`on\` with a wrapper that unsubscribes itself. The types use an event map with \`K extends keyof Events\` so the payload type follows the event name."
`,
    },
    {
      type: 'check',
      title: 'Follow-up questions',
      items: [
        {
          q: 'A listener throws. With your `emit`, what happens to the listeners after it?',
          choices: [
            'They don\'t run: the error stops the loop and propagates out of `emit`',
            'They run normally',
            'The emitter retries the listener',
          ],
          answer: 0,
          explain: 'If listeners must be isolated, wrap each call in `try/catch` and report errors separately. Node\'s `EventEmitter` lets the error propagate, like yours.',
          why: {
            1: 'An uncaught throw leaves the `for` loop immediately.',
            2: 'Nothing retries unless you add it (lesson 5).',
          },
        },
        {
          q: 'Why can\'t `tsc` catch a wrong payload if the event map is written as `Record<string, any>`?',
          choices: [
            'Every key is allowed and every payload is `any`, so there\'s nothing to check against',
            'Records are not allowed in generics',
            'It can, `any` is checked strictly',
          ],
          answer: 0,
          explain: 'The safety comes from listing the exact events and payloads. `any` switches checking off.',
          why: {
            1: '`Record` works fine as a constraint, as in `Events extends Record<string, unknown>`.',
            2: '`any` means "don\'t check this".',
          },
        },
        {
          q: 'A component subscribes in an effect but never unsubscribes. What goes wrong?',
          choices: [
            'Each mount adds another listener: duplicates pile up, and listeners keep running for unmounted components',
            'Nothing; the garbage collector removes it',
            'The emitter throws on the second subscribe',
          ],
          answer: 0,
          explain: 'The emitter\'s array still holds the function, so it can\'t be garbage-collected. That\'s why `on` returning an unsubscribe is so handy.',
          why: {
            1: 'The Map still references the listener, so it stays alive.',
            2: 'Nothing checks for duplicates, so it silently adds another.',
          },
        },
      ],
    },
  ],
};
