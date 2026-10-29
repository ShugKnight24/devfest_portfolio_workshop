// Challenges · lesson 4. Step types: read, predict, task, check (see ../index.js).
// Fences inside md use ~~~ (blocks marked ~~~js get a Run button, so they must run cleanly).
export default {
  id: 'debounce-and-throttle',
  builds: ['js/functions', 'js/filter-and-find', 'challenges/two-sum', 'js/closures-and-scope'],
  title: 'Debounce and throttle: closures and timers',
  goal: 'Write functions that return functions, keep private state in a closure, and use timers to control how often something runs.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'The question',
      md: `
The most common live-coding question for frontend roles:

> "We have a search box. Every keystroke calls the search API, and that's too many requests. Write \`debounce(fn, ms)\`: it returns a new function that only calls \`fn\` once the user has **stopped** calling it for \`ms\` milliseconds."

~~~
const search = debounce((q) => console.log("search", q), 300);

search("r");      // typing...
search("re");     // typing...
search("rea");    // then 300ms of quiet
                  // → search rea      (once, with the last value)
~~~

It needs two ideas: a **closure** (a function that remembers variables) and a **timer** (\`setTimeout\` / \`clearTimeout\`). This lesson builds both, then adds the cousin question, \`throttle\`.
`,
    },
    {
      type: 'check',
      title: 'Before you code: ask and spot',
      items: [
        {
          q: 'The user types "r", "re", "rea" quickly. Which arguments should `fn` receive?',
          choices: ['The last call\'s: "rea"', 'The first call\'s: "r"', 'All three, as an array'],
          answer: 0,
          explain: 'Standard debounce uses the most recent arguments, because that\'s the current state of the search box. Still worth confirming.',
          why: {
            1: 'That would search for a stale value.',
            2: 'Debounce collapses calls into one. It doesn\'t batch them.',
          },
        },
        {
          q: 'Which clarifying question shows you know the variations?',
          choices: [
            '"Should it fire at the end of the quiet period (trailing) or right away on the first call (leading)?"',
            '"Can I use jQuery?"',
            '"Should the delay be in seconds?"',
          ],
          answer: 0,
          explain: 'Trailing is the default for search boxes. Leading is common for buttons ("fire now, ignore double clicks").',
          why: {
            1: 'Interviews want plain JavaScript.',
            2: 'The example already says milliseconds.',
          },
        },
        {
          q: 'Which words point to "a function that returns a function, with a timer inside"?',
          choices: [
            '"returns a new function that only calls fn when..."',
            '"sort the results"',
            '"count how many"',
          ],
          answer: 0,
          explain: 'A wrapper that decides when to call the real function is a higher-order function with state, which means a closure.',
          why: {
            1: 'Sorting is about order of data, not timing.',
            2: 'That\'s the tally sheet from lesson 1.',
          },
        },
      ],
    },
    {
      type: 'read',
      title: 'Closures: functions that remember',
      md: `
In JavaScript lesson 10, a \`filter\` callback could read \`min\` from the function around it. That's a **closure**: a function remembers the variables from where it was **written**, even after that outer function has returned.

~~~js
function makeCounter() {
  let count = 0;               // private: nothing outside can touch it
  return function () {
    count = count + 1;         // the inner function still sees count
    return count;
  };
}

const next = makeCounter();
console.log(next(), next(), next());

const other = makeCounter();   // a brand-new count
console.log(other());
~~~

Each call to \`makeCounter\` creates a **new** \`count\` box, and the returned function keeps that box alive. This is how debounce will remember its timer between calls.
`,
    },
    {
      type: 'predict',
      title: 'Timers run later',
      md: '`setTimeout(fn, ms)` schedules `fn` and returns an id at once. `clearTimeout(id)` cancels it.',
      code: `const a = setTimeout(() => console.log("A"), 0);
const b = setTimeout(() => console.log("B"), 0);
clearTimeout(a);
console.log("now");
await new Promise((r) => setTimeout(r, 10));`,
      output: `now
B`,
      explain: `
- \`setTimeout\` never runs its callback right away, even with 0ms. So \`"now"\` prints first.
- \`clearTimeout(a)\` cancelled A before it had a chance to run.
- The last line just waits 10ms so B has time to print.

Debounce is exactly this: **every call cancels the previous timer and starts a new one.** Only the last timer survives to fire.
`,
    },
    {
      type: 'task',
      title: 'Part 1: once',
      md: `
Warm up with a closure and no timer. Write \`once(fn)\`. It returns a new function that calls \`fn\` the **first** time only, and returns that first result on every later call.

~~~
const init = once(() => { console.log("setup"); return 42; });
init();   // prints setup, returns 42
init();   // prints nothing, returns 42
~~~

Keep two variables in the closure: \`called\` (a boolean) and \`result\`. Use \`(...args)\` so any arguments pass through to \`fn\`.
`,
      starter: `function once(fn) {
  // your code here
}
`,
      tests: [
        { name: 'the first call returns fn\'s result', code: `const f = once((x) => x * 2); eq(f(4), 8);` },
        { name: 'later calls return the first result', code: `const f = once((x) => x * 2); f(4); eq(f(100), 8);` },
        { name: 'fn runs only once', code: `let runs = 0; const f = once(() => runs++); f(); f(); f(); eq(runs, 1);` },
        { name: 'two once() wrappers are independent', code: `const a = once(() => "a"); const b = once(() => "b"); a(); eq(b(), "b");` },
      ],
      hint: 'Above the returned function: `let called = false; let result;`. Inside: `if (!called) { called = true; result = fn(...args); } return result;`.',
      solution: `function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}
`,
      explain: '`(...args)` collects all arguments into an array, and `fn(...args)` spreads them back out (JavaScript lesson 12). The wrapper works for any function.',
    },
    {
      type: 'read',
      title: 'The plan for debounce',
      md: `
**Brute force** would be "call \`fn\` every time", which is the bug we're fixing. So go straight to the plan:

1. Keep \`timer\` in the closure. It starts as \`undefined\`.
2. Each call: \`clearTimeout(timer)\` to cancel the previous plan.
3. Then \`timer = setTimeout(() => fn(...args), ms)\` to plan a fresh one with **these** arguments.

~~~
time   0ms  search("r")     plan to fire at 300
time 100ms  search("re")    cancel, plan to fire at 400
time 200ms  search("rea")   cancel, plan to fire at 500
time 500ms                  fire fn("rea")
~~~

\`clearTimeout(undefined)\` is allowed and does nothing, so the first call needs no special case.
`,
    },
    {
      type: 'task',
      title: 'Part 2: debounce',
      md: `
Write \`debounce(fn, ms)\`. It returns a function that waits until it hasn't been called for \`ms\` milliseconds, then calls \`fn\` **once** with the **latest** arguments.

~~~
const log = [];
const save = debounce((x) => log.push(x), 30);
save(1); save(2); save(3);
// ...40ms later: log is [3]
~~~

The tests use real timers with short delays, so they take a fraction of a second.
`,
      starter: `function debounce(fn, ms) {
  // your code here
}
`,
      tests: [
        {
          name: 'does not call fn right away',
          code: `const log = []; const f = debounce((x) => log.push(x), 30);
f(1);
eq(log, []);`,
        },
        {
          name: 'three quick calls fire once, with the last value',
          code: `const log = []; const f = debounce((x) => log.push(x), 30);
f(1); f(2); f(3);
await sleep(60);
eq(log, [3]);`,
        },
        {
          name: 'each call restarts the wait',
          code: `const log = []; const f = debounce((x) => log.push(x), 40);
f("a"); await sleep(25);
f("b"); await sleep(25);
eq(log, [], "the second call should have reset the timer");
await sleep(40);
eq(log, ["b"]);`,
        },
        {
          name: 'fires again after a quiet period',
          code: `const log = []; const f = debounce((x) => log.push(x), 20);
f(1); await sleep(40);
f(2); await sleep(40);
eq(log, [1, 2]);`,
        },
      ],
      hint: '`let timer;` above the returned function. Inside `(...args) => { ... }`: first `clearTimeout(timer);`, then `timer = setTimeout(() => fn(...args), ms);`.',
      solution: `function debounce(fn, ms) {
  let timer;                                   // remembered between calls
  return (...args) => {
    clearTimeout(timer);                       // cancel the previous plan
    timer = setTimeout(() => fn(...args), ms); // plan a new one with these args
  };
}
`,
      explain: 'Four lines. The closure keeps `timer` alive between calls, and that one variable is the whole trick.',
    },
    {
      type: 'read',
      title: 'Throttle: the other rate limit',
      md: `
> "Now a scroll handler fires 100 times a second. Write \`throttle(fn, ms)\`: call \`fn\` **at most once every** \`ms\`."

| | debounce | throttle |
|---|---|---|
| fires | after the calls **stop** | **during** the calls, at a steady rate |
| good for | search box, autosave, resize end | scroll position, mouse move, rate-limited clicks |
| 10 calls in 1s, ms = 300 | 1 call, at the end | about 4 calls, spread out |

The simplest throttle fires on the **leading** edge: call \`fn\` now, then ignore calls until \`ms\` has passed.

~~~
ms = 100
time   0  call → fire, remember last = 0
time  30  call → 30 since last fire, ignore
time 120  call → 120 since last fire, fire, last = 120
~~~

It needs no timer at all, just \`Date.now()\` and a variable remembering when \`fn\` last ran.
`,
    },
    {
      type: 'task',
      title: 'Part 3: throttle',
      md: `
Write \`throttle(fn, ms)\`. The returned function calls \`fn\` immediately if at least \`ms\` milliseconds have passed since \`fn\` last ran (or it never ran). Otherwise it does nothing.

~~~
const log = [];
const onScroll = throttle((y) => log.push(y), 50);
onScroll(1); onScroll(2); onScroll(3);   // log is [1]
// ...60ms later
onScroll(4);                             // log is [1, 4]
~~~

Keep \`let last = -Infinity;\` in the closure, so the very first call always passes.
`,
      starter: `function throttle(fn, ms) {
  // your code here
}
`,
      tests: [
        {
          name: 'the first call fires right away',
          code: `const log = []; const f = throttle((x) => log.push(x), 50);
f(1);
eq(log, [1]);`,
        },
        {
          name: 'calls inside the window are ignored',
          code: `const log = []; const f = throttle((x) => log.push(x), 50);
f(1); f(2); f(3);
eq(log, [1]);`,
        },
        {
          name: 'fires again once the window has passed',
          code: `const log = []; const f = throttle((x) => log.push(x), 30);
f(1); await sleep(45);
f(2);
eq(log, [1, 2]);`,
        },
      ],
      hint: 'Inside the returned function: `const now = Date.now();` then `if (now - last >= ms) { last = now; fn(...args); }`.',
      solution: `function throttle(fn, ms) {
  let last = -Infinity;           // when fn last ran
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}
`,
      explain: 'Lodash\'s `throttle` also schedules one trailing call with the last arguments, so the final scroll position isn\'t lost. Mention that as a follow-up rather than coding it first.',
    },
    {
      type: 'read',
      title: 'Walkthrough: the full solution',
      md: `
Trace \`debounce(fn, 300)\` with calls at 0, 100 and 200ms:

| time | event | \`timer\` after | fires? |
|---|---|---|---|
| 0 | call("r") | timer 1, due 300 | |
| 100 | call("re") | timer 1 cancelled, timer 2, due 400 | |
| 200 | call("rea") | timer 2 cancelled, timer 3, due 500 | |
| 500 | timer 3 runs | | \`fn("rea")\` |

**Big-O:** each call is O(1) time. The closure holds one timer id (debounce) or one timestamp (throttle), so O(1) memory per wrapped function.

**In React**, a debounced search usually lives in an effect: start a timer when the query changes, and clear it in the cleanup function. Same \`setTimeout\` / \`clearTimeout\` pair, with React calling the cleanup for you:

~~~
useEffect(() => {
  const id = setTimeout(() => search(query), 300);
  return () => clearTimeout(id);   // the next keystroke cancels this one
}, [query]);
~~~

**Say it:** "Debounce returns a wrapper that keeps a timer in a closure. Each call clears the old timer and starts a new one, so \`fn\` only runs after \`ms\` of quiet, with the latest arguments. Throttle instead remembers when it last ran and ignores calls inside the window."
`,
    },
    {
      type: 'check',
      title: 'Follow-up questions',
      items: [
        {
          q: 'What happens if you write `let timer;` inside the returned function instead of above it?',
          choices: [
            'Every call gets a fresh `timer`, so nothing is ever cancelled and `fn` fires once per call',
            'It works the same',
            'It throws because `timer` is undefined',
          ],
          answer: 0,
          explain: 'The variable must live in the closure, outside the returned function, to survive between calls.',
          why: {
            1: 'Each call would forget the previous timer, so `clearTimeout` would cancel nothing.',
            2: '`clearTimeout(undefined)` is allowed. It just does nothing.',
          },
        },
        {
          q: '"Add a `cancel()` method so a component can drop a pending call when it unmounts." How?',
          choices: [
            'Attach a function to the returned wrapper: `debounced.cancel = () => clearTimeout(timer)`',
            'Call `fn` immediately',
            'Delete the wrapper with `delete`',
          ],
          answer: 0,
          explain: 'Functions are objects, so they can carry methods. The method shares the same closure, so it sees `timer`.',
          why: {
            1: 'Cancel means "never run it", not "run it now". (Running now would be `flush`.)',
            2: '`delete` removes object properties, not pending timers.',
          },
        },
        {
          q: 'Which one fits "save the draft 1 second after the user stops typing"?',
          choices: ['debounce', 'throttle', 'once'],
          answer: 0,
          explain: '"After they stop" is the definition of debounce.',
          why: {
            1: 'Throttle would save every second while they type, too.',
            2: 'Once would save only the very first draft.',
          },
        },
        {
          q: 'A method using `this` is debounced: `obj.save = debounce(obj.save, 300)`. With the arrow-function wrapper, what is `this` inside `fn`?',
          choices: [
            'Not `obj`: `fn(...args)` is a plain call, so `this` is lost',
            'Always `obj`',
            'The timer id',
          ],
          answer: 0,
          explain: 'If `this` matters, use a regular `function (...args)` wrapper and call `fn.apply(this, args)` inside the timer. Mention it; interviewers like seeing you know.',
          why: {
            1: 'Arrow functions don\'t get their own `this`, and `fn(...args)` doesn\'t pass one.',
            2: 'The id is just a number or handle; it isn\'t passed as `this`.',
          },
        },
      ],
    },
  ],
};
