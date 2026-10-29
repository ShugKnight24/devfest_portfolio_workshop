// Python course · lesson 16. Step types: read, predict, task, check (see ../index.js).
export default {
  id: 'async-basics',
  builds: ['python/functions-and-errors', 'python/list-comprehensions', 'node/async-await', 'js/promises-and-async'],
  title: 'async and await',
  goal: 'Write coroutines with async def, wait on them with await, run several at once with asyncio.gather, and give up on slow ones with a timeout.',
  minutes: 30,
  steps: [
    {
      type: 'read',
      title: 'Why async exists',
      md: `
A web server spends most of its time **waiting**: for the database, for another API, for a file. While one request waits, the server could be working on another.

\`async\` / \`await\` is how Python lets one thread juggle many waits. If you've seen JavaScript promises, this is the same model:

| JavaScript | Python |
|---|---|
| \`async function f()\` | \`async def f():\` |
| \`await f()\` | \`await f()\` |
| \`Promise.all([a, b])\` | \`asyncio.gather(a, b)\` |
| \`setTimeout\` wrapped in a promise | \`await asyncio.sleep(seconds)\` |

~~~py
import asyncio

async def greet(name):
    await asyncio.sleep(0.1)      # pretend to wait on the network
    return f"hello, {name}"

print(await greet("Ada"))
~~~

On this page, code runs inside an event loop that's already going, so you can write \`await\` at the top level. In a normal \`.py\` file you start the loop yourself, once:

~~~
import asyncio

async def main():
    print(await greet("Ada"))

asyncio.run(main())
~~~

You won't need \`asyncio.run\` in FastAPI either: the server runs the loop for you.
`,
    },
    {
      type: 'predict',
      title: 'Calling without await',
      code: `import asyncio

async def greet(name):
    return f"hello, {name}"

c = greet("Ada")
print(type(c).__name__)
print(await c)`,
      output: `coroutine
hello, Ada`,
      explain: 'Calling an `async def` function does **not** run its body. It hands back a **coroutine**, a paused piece of work, like a JavaScript promise that hasn\'t been awaited. `await` is what actually runs it and gives you the return value. Forgetting `await` is the most common async bug: you end up with a coroutine object where you expected a string, and Python warns "coroutine was never awaited".',
    },
    {
      type: 'task',
      title: 'double_later',
      md: `
**Example:**

~~~
import asyncio

async def add_later(a, b):
    await asyncio.sleep(0.01)
    return a + b
~~~

**Your turn:** write \`async def double_later(n)\` that sleeps \`0.01\` seconds and then returns \`n * 2\`. \`await double_later(4)\` gives \`8\`.
`,
      starter: `import asyncio


def double_later(n):
    return n * 2
`,
      tests: [
        { name: 'double_later is an async function', code: `import inspect
assert inspect.iscoroutinefunction(double_later), "use async def"` },
        { name: 'await double_later(4) gives 8', code: `eq(await double_later(4), 8)` },
      ],
      hint: 'Change `def` to `async def`, and add `await asyncio.sleep(0.01)` as the first line of the body.',
      solution: `import asyncio


async def double_later(n):
    await asyncio.sleep(0.01)
    return n * 2
`,
    },
    {
      type: 'read',
      title: 'One at a time vs all at once',
      md: `
Awaiting in a loop runs the waits **one after another**, so the times add up:

~~~py
import asyncio, time

async def fetch(name):
    await asyncio.sleep(0.1)
    return f"data:{name}"

start = time.perf_counter()
results = [await fetch(n) for n in ["a", "b", "c"]]
print(results, f"{time.perf_counter() - start:.1f}s")
~~~

\`asyncio.gather\` starts them **all**, then waits for all of them. Three 0.1-second waits overlap, so the whole thing takes about 0.1 seconds:

~~~py
import asyncio, time

async def fetch(name):
    await asyncio.sleep(0.1)
    return f"data:{name}"

start = time.perf_counter()
results = await asyncio.gather(fetch("a"), fetch("b"), fetch("c"))
print(results, f"{time.perf_counter() - start:.1f}s")
~~~

\`gather\` takes the coroutines as separate arguments. When you have a list of names, build the coroutines with a comprehension (lesson 9) and spread them with \`*\` (lesson 13):

~~~
await asyncio.gather(*[fetch(n) for n in names])
~~~

Like \`Promise.all\`, the results come back **in the order you passed them in**, not the order they finished.
`,
    },
    {
      type: 'predict',
      title: 'Finish order vs result order',
      code: `import asyncio

async def job(name, delay):
    await asyncio.sleep(delay)
    print("finished", name)
    return name

results = await asyncio.gather(job("slow", 0.05), job("fast", 0.01))
print(results)`,
      output: `finished fast
finished slow
['slow', 'fast']`,
      explain: 'Both jobs start together, so the short one finishes and prints first. But `gather` lines the results up by **argument position**, so `"slow"` is still first in the list. You can rely on that order when you zip results back to their inputs.',
    },
    {
      type: 'task',
      title: 'fetch_all',
      md: `
\`fake_fetch(name)\` is given: it waits 0.1 seconds and returns \`"data:<name>"\`. Write \`async def fetch_all(names)\` that fetches every name **at the same time** and returns the results as a list, in the same order as \`names\`.

- \`await fetch_all(["a", "b"])\` returns \`["data:a", "data:b"]\`
- five names should take about 0.1 seconds, not 0.5
`,
      starter: `import asyncio


async def fake_fetch(name):
    await asyncio.sleep(0.1)
    return f"data:{name}"


async def fetch_all(names):
    results = []
    for name in names:
        results.append(await fake_fetch(name))
    return results
`,
      tests: [
        { name: 'results come back in order', code: `eq(await fetch_all(["a", "b"]), ["data:a", "data:b"])` },
        { name: 'five fetches run at the same time', code: `import time
start = time.perf_counter()
await fetch_all(["a", "b", "c", "d", "e"])
took = time.perf_counter() - start
assert took < 0.3, f"took {took:.2f}s: are the fetches running one after another?"` },
        { name: 'an empty list gives []', code: `eq(await fetch_all([]), [])` },
      ],
      hint: 'Replace the loop with `await asyncio.gather(*[fake_fetch(n) for n in names])`. `gather` returns a list, so you can return it directly.',
      solution: `import asyncio


async def fake_fetch(name):
    await asyncio.sleep(0.1)
    return f"data:{name}"


async def fetch_all(names):
    return list(await asyncio.gather(*[fake_fetch(n) for n in names]))
`,
    },
    {
      type: 'read',
      title: 'Errors and timeouts',
      md: `
Exceptions from lesson 13 work the same way across \`await\`. If the coroutine raises, the \`await\` line raises, and an ordinary \`try\` / \`except\` catches it.

A slow service is the other common problem. \`asyncio.wait_for(coro, timeout)\` waits at most \`timeout\` seconds. If time runs out, it cancels the work and raises \`TimeoutError\`:

~~~py
import asyncio

async def slow():
    await asyncio.sleep(1)
    return "finally"

try:
    print(await asyncio.wait_for(slow(), timeout=0.05))
except TimeoutError:
    print("gave up")
~~~

(Since Python 3.11, \`asyncio.TimeoutError\` is the same class as the built-in \`TimeoutError\`, so either name works.)
`,
    },
    {
      type: 'task',
      title: 'fetch_or_none',
      md: `
\`slow_fetch(name, delay)\` is given. Write \`async def fetch_or_none(name, delay, timeout)\` that returns \`await slow_fetch(name, delay)\`, but gives up after \`timeout\` seconds and returns \`None\` instead.

- \`await fetch_or_none("a", 0.01, 0.5)\` returns \`"data:a"\`
- \`await fetch_or_none("a", 0.5, 0.01)\` returns \`None\`
`,
      starter: `import asyncio


async def slow_fetch(name, delay):
    await asyncio.sleep(delay)
    return f"data:{name}"


async def fetch_or_none(name, delay, timeout):
    return await slow_fetch(name, delay)
`,
      tests: [
        { name: 'a fast fetch returns its data', code: `eq(await fetch_or_none("a", 0.01, 0.5), "data:a")` },
        { name: 'a fetch slower than the timeout returns None', code: `eq(await fetch_or_none("a", 0.5, 0.01), None)` },
      ],
      hint: 'Wrap the call: `return await asyncio.wait_for(slow_fetch(name, delay), timeout)` inside `try:`, and `except TimeoutError: return None`.',
      solution: `import asyncio


async def slow_fetch(name, delay):
    await asyncio.sleep(delay)
    return f"data:{name}"


async def fetch_or_none(name, delay, timeout):
    try:
        return await asyncio.wait_for(slow_fetch(name, delay), timeout)
    except TimeoutError:
        return None
`,
    },
    {
      type: 'read',
      title: 'Never block the loop',
      md: `
All of this runs on **one thread**. Tasks take turns, and the only place a task hands over its turn is an \`await\`.

So a function that does slow work **without** awaiting freezes everything else:

~~~
async def bad():
    time.sleep(2)            # blocks the whole thread: nothing else runs for 2s

async def good():
    await asyncio.sleep(2)   # pauses this task; others keep running
~~~

The same goes for a regular database driver or \`requests.get\` called inside \`async def\`: they block. In FastAPI that has a simple rule of thumb, which lesson 17 relies on:

- If a route only awaits async libraries, write it as \`async def\`.
- If it calls blocking code, write it as plain \`def\`. FastAPI then runs it on a worker thread so it can't freeze the loop.

The flip side: because tasks only switch at \`await\`, two tasks can't interleave in the middle of a line. A read, an \`await\`, then a write is where races sneak in, the same as in Node.
`,
    },
    {
      type: 'check',
      title: 'Check yourself',
      md: 'Pick an answer for each. A wrong pick tells you why, and you can try again.',
      items: [
        {
          q: 'What does calling `greet("Ada")` do when `greet` is an `async def` function?',
          choices: ['Returns a coroutine; the body has not run yet', 'Runs the body and returns the string', 'Raises an error unless you use await', 'Starts a new thread'],
          answer: 0,
          explain: 'An async function call creates a coroutine. `await` runs it and gives you the result.',
          why: { 1: 'Only `await greet("Ada")` runs the body.', 2: 'The call itself is allowed. You just get a coroutine back.', 3: 'asyncio runs everything on one thread.' },
        },
        {
          q: 'Which is Python\'s `Promise.all([a(), b()])`?',
          choices: ['`await asyncio.gather(a(), b())`', '`await [a(), b()]`', '`asyncio.run(a(), b())`', '`await a(); await b()`'],
          answer: 0,
          explain: '`gather` runs the coroutines concurrently and returns their results in argument order.',
          why: { 1: 'You cannot await a list.', 2: '`asyncio.run` starts an event loop for one coroutine, in a script.', 3: 'That works, but one after the other, so the waits add up.' },
        },
        {
          q: '`gather(job("slow", 0.05), job("fast", 0.01))`: what order are the results in?',
          choices: ['`["slow", "fast"]`, the order passed in', '`["fast", "slow"]`, the order they finished', 'Random'],
          answer: 0,
          explain: 'Results line up with the arguments, whatever order the work finishes in.',
          why: { 1: 'That is the order they print, not the order of the result list.', 2: 'The order is guaranteed.' },
        },
        {
          q: 'Inside an `async def` route, what does `time.sleep(2)` do?',
          choices: ['Blocks the whole event loop, so no other request is served for 2 seconds', 'Pauses only this request', 'Raises an error inside async code', 'Nothing, it is ignored'],
          answer: 0,
          explain: 'Use `await asyncio.sleep(2)` in async code, or a plain `def` route for blocking work.',
          why: { 1: 'That is what `await asyncio.sleep(2)` does.', 2: 'Python allows it, which is why the bug is easy to write.', 3: 'It really sleeps, and takes the whole thread with it.' },
        },
      ],
    },
  ],
};
