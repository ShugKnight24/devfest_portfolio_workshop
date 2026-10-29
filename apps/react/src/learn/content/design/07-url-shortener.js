// System design · lesson 7, the first case study. lang: 'js' so it can include the base62 tasks.
export default {
  id: 'url-shortener',
  lang: 'js',
  builds: ['js/strings', 'js/loops', 'dsa/hash-maps-and-sets'],
  title: 'Case study: a URL shortener',
  goal: 'Design a URL shortener end to end with the five-step script, and write the base62 encoding that turns ids into short codes.',
  minutes: 35,
  steps: [
    {
      type: 'read',
      title: 'Step 1: clarify',
      md: `
This is the first case study, so it uses the five-step script from lesson 1 in full. Every later case study follows the same order.

**The question:** "Design a URL shortener." You paste a long URL and get something like \`sho.rt/aZ3k9\`. Visiting that redirects to the long URL.

**Questions to ask, with typical answers:**

- "Are reads much more common than writes?" Yes. A link is made once and clicked many times. Assume around 100 clicks per link (an assumption; say it as one).
- "Do links expire?" Optionally.
- "Do we need click counts?" Yes, a simple count per link.
- "Custom codes like \`sho.rt/devfest\`?" Nice to have.

Write the conclusion in the corner of the board: **read-heavy, redirects must be fast, analytics can lag a little.** Those three words decide most of the design.
`,
    },
    {
      type: 'read',
      title: 'Step 2: the boxes',
      md: `
Start with the three boxes, then add a cache because the clarify step said "read-heavy":

~~~
[ Browser ] --> [ LB ] --> [ API servers ] --> [ Database ]
                                 |               code -> long URL
                                 +--> [ Cache (Redis) ]
                                       hot codes
~~~

Creating a link: \`POST /links\` goes to the API, which makes a code and saves the row.

Following a link: \`GET /aZ3k9\` goes to the API, which checks Redis first. On a miss it reads the database and caches the answer (lesson 4's cache-aside). Then it redirects.

The API servers are stateless (lesson 6), so you can add more behind the load balancer as traffic grows.
`,
    },
    {
      type: 'read',
      title: 'Step 3: data, API, and which redirect',
      md: `
One table:

~~~
links(code PRIMARY KEY, long_url, owner_id,
      created_at, expires_at)
~~~

The primary key on \`code\` is the index that makes each redirect a single fast lookup (lesson 3).

| Endpoint | Does |
|---|---|
| \`POST /links { url }\` | creates a link, returns \`201\` and \`{ code }\` |
| \`GET /:code\` | redirects to the long URL, or \`404\` |

**301 or 302?**

- **301 Moved Permanently**: browsers may cache the redirect and skip your server next time. Faster for the user, but you **stop seeing those clicks**, and you can't change where the link points.
- **302 Found** (a temporary redirect): the browser comes back to you each time, so you can count every click.

Since we need click counts, choose **302** and say why. That's the trade-off sentence for this design.
`,
    },
    {
      type: 'read',
      title: 'Making short codes: think in base 10 first',
      md: `
Each new link gets the next number from a counter: 1, 2, 3... 125... A number like 3,500,000,000 is long, so we write it with **more symbols per digit**.

First, the familiar version. To get the digits of a number in base 10, repeatedly take \`% 10\` (the last digit) and divide by 10:

~~~js
let n = 4096;
const digits = [];
while (n > 0) {
  digits.unshift(n % 10);     // last digit goes on the front
  n = Math.floor(n / 10);     // drop that digit
}
console.log(digits.join(""));
~~~

**Base 62** is the same loop with 62 instead of 10, using 62 symbols: \`0-9\`, \`a-z\`, \`A-Z\`. Those are all safe in a URL.

~~~
0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
~~~

A symbol's value is its position: \`"0"\` to \`"9"\` are 0 to 9, \`"a"\` is 10, \`"A"\` is 36, and \`"Z"\` is 61.

So \`125\` is \`2 × 62 + 1\`, which is the digits **2** and **1**: the code \`"21"\`.
`,
    },
    {
      type: 'predict',
      title: 'Trace the base 62 loop',
      code: `const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
let n = 125;
let code = "";
while (n > 0) {
  code = ALPHABET[n % 62] + code;
  console.log("remainder", n % 62, "code so far", code);
  n = Math.floor(n / 62);
}`,
      output: `remainder 1 code so far 1
remainder 2 code so far 21`,
      explain: `
- 125 % 62 is 1, so the last symbol is \`ALPHABET[1]\`, which is \`"1"\`. Then 125 / 62, rounded down, is 2.
- 2 % 62 is 2, giving \`"2"\` on the front. 2 / 62 rounded down is 0, so the loop stops.

Each symbol is **prepended**, because the remainders come out last digit first. A common bug is appending, which gives the code backwards.
`,
    },
    {
      type: 'task',
      title: 'encodeBase62',
      md: `
Write \`encodeBase62(n)\` using the loop you just traced. \`ALPHABET\` is given.

One edge case: the loop never runs for \`0\`, so return \`"0"\` for it first.

~~~
encodeBase62(0)    → "0"
encodeBase62(61)   → "Z"
encodeBase62(62)   → "10"
encodeBase62(125)  → "21"
~~~
`,
      starter: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(n) {
  // your code here
}
`,
      tests: [
        { name: '125 becomes "21"', code: `eq(encodeBase62(125), "21");` },
        { name: '61 is the last symbol, "Z"', code: `eq(encodeBase62(61), "Z");` },
        { name: '62 rolls over to "10"', code: `eq(encodeBase62(62), "10");` },
        { name: '0 becomes "0"', code: `eq(encodeBase62(0), "0");` },
      ],
      hint: 'Start with `if (n === 0) return "0";` and `let code = "";`. Loop `while (n > 0)`: prepend `ALPHABET[n % 62]`, then `n = Math.floor(n / 62)`. Return `code`.',
      solution: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(n) {
  if (n === 0) return "0";
  let code = "";
  while (n > 0) {
    code = ALPHABET[n % 62] + code; // prepend: remainders come out last digit first
    n = Math.floor(n / 62);
  }
  return code;
}
`,
    },
    {
      type: 'task',
      title: 'decodeBase62',
      md: `
Now go back the other way. Reading a number left to right in base 10, you do "times 10, plus the next digit": \`"125"\` is \`((1 × 10) + 2) × 10 + 5\`.

Write \`decodeBase62(code)\` the same way with 62. \`ALPHABET.indexOf(ch)\` gives each symbol's value.

~~~
decodeBase62("21")  → 125
decodeBase62("Z")   → 61
decodeBase62("10")  → 62
~~~
`,
      starter: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function decodeBase62(code) {
  let n = 0;
  // your code here
  return n;
}
`,
      tests: [
        { name: '"21" becomes 125', code: `eq(decodeBase62("21"), 125);` },
        { name: '"Z" becomes 61', code: `eq(decodeBase62("Z"), 61);` },
        { name: '"10" becomes 62', code: `eq(decodeBase62("10"), 62);` },
      ],
      hint: 'Loop `for (const ch of code)` and do `n = n * 62 + ALPHABET.indexOf(ch);`',
      solution: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function decodeBase62(code) {
  let n = 0;
  for (const ch of code) {
    n = n * 62 + ALPHABET.indexOf(ch);
  }
  return n;
}
`,
    },
    {
      type: 'predict',
      title: 'How many codes is that?',
      md: 'How many different codes fit in 6 or 7 characters?',
      code: `console.log("6 chars:", (62 ** 6).toLocaleString("en-US"));
console.log("7 chars:", (62 ** 7).toLocaleString("en-US"));`,
      output: `6 chars: 56,800,235,584
7 chars: 3,521,614,606,208`,
      explain: `
Each extra character multiplies the count by 62. Seven characters give about **3.5 trillion** codes. Even at a billion new links a year, that lasts thousands of years.

This is a good place for a one-line estimate in the interview: "seven characters of base 62 is about 3.5 trillion codes, which is plenty."
`,
    },
    {
      type: 'read',
      title: 'Counter, random, or hash?',
      md: `
Three common ways to get a code, each with a trade-off to name:

| Approach | Good | Watch out for |
|---|---|---|
| Counter + base62 | no collisions, short codes | codes are guessable and in order; one counter is a single point of contention |
| Random 7 characters | not guessable | collisions: check the code is free, retry if not |
| Hash of the URL | the same URL gives the same code | collisions after you shorten the hash; two users can't get separate stats for one URL |

**Scaling the counter:** don't hit one counter for every link. Give each API server a **block** of ids (server A takes 1 to 1,000,000, server B the next million), so servers only go back to the counter when a block runs out.

**Guessable codes:** if links might point at private documents, sequential codes let someone walk through them. Use random codes there, or shuffle the counter's bits before encoding.
`,
    },
    {
      type: 'read',
      title: 'Step 4 and 5: what breaks, and the trade-offs',
      md: `
**What breaks first: database reads.** Redirects vastly outnumber creates, and a few links (one shared in a viral post) get most of the clicks. The cache handles this: popular codes stay in Redis and rarely touch the database. Add read replicas if the misses alone grow too big.

**Second: counting clicks on the redirect path.** Writing a row for every click inside the redirect slows the thing users feel most. Instead, push a small click event onto a **queue** (lesson 5) and let a worker add the counts up in batches. The count lags by a few seconds, which the clarify step said was fine.

~~~
GET /aZ3k9 --> [ API ] --> Redis or DB --> 302 to the long URL
                  |
                  +- - click event - -> [ Queue ] --> [ Worker ]
                                                    adds to counts
~~~

**Security:** check submitted URLs against a malware or phishing list, rate-limit link creation (lesson 6) so nobody can mint millions of spam links, and only allow \`http\` and \`https\` URLs.

**The 60-second version:** "One table maps a short code to a URL. Codes come from a counter encoded in base62, so seven characters give about 3.5 trillion. Reads vastly outnumber writes, so Redis sits in front of the database for popular links, and click events go through a queue so redirects stay fast. I'd use a 302 so we can count clicks, at the cost of browsers not caching the redirect."
`,
    },
    {
      type: 'task',
      title: 'Put it together: a tiny shortener',
      md: `
\`encodeBase62\` is included. Write \`createShortener()\`, which returns an object with two methods sharing a counter and a \`Map\`:

- \`shorten(url)\`: add 1 to the counter, encode it, store \`code → url\` in the map, and return the code.
- \`resolve(code)\`: return the URL for the code, or \`undefined\`.

The counter starts at 0, so the first link gets id 1.

~~~
const s = createShortener();
s.shorten("https://example.com/a")  → "1"
s.shorten("https://example.com/b")  → "2"
s.resolve("2")                      → "https://example.com/b"
s.resolve("zzz")                    → undefined
~~~
`,
      starter: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(n) {
  if (n === 0) return "0";
  let code = "";
  while (n > 0) {
    code = ALPHABET[n % 62] + code;
    n = Math.floor(n / 62);
  }
  return code;
}

function createShortener() {
  let counter = 0;
  const links = new Map();
  return {
    shorten(url) {
      // your code here
    },
    resolve(code) {
      // your code here
    },
  };
}
`,
      tests: [
        { name: 'the first two links get codes "1" and "2"', code: `const s = createShortener(); eq(s.shorten("https://a.com"), "1"); eq(s.shorten("https://b.com"), "2");` },
        { name: 'resolve finds the long URL', code: `const s = createShortener(); const code = s.shorten("https://a.com"); eq(s.resolve(code), "https://a.com");` },
        { name: 'an unknown code gives undefined', code: `const s = createShortener(); eq(s.resolve("zzz"), undefined);` },
        { name: 'the 61st link gets the code "Z"', code: `const s = createShortener(); let last; for (let i = 0; i < 61; i++) last = s.shorten("https://x.com/" + i); eq(last, "Z");` },
      ],
      hint: 'In `shorten`: `counter++`, then `const code = encodeBase62(counter);`, `links.set(code, url);`, `return code;`. In `resolve`: `return links.get(code);`',
      solution: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeBase62(n) {
  if (n === 0) return "0";
  let code = "";
  while (n > 0) {
    code = ALPHABET[n % 62] + code;
    n = Math.floor(n / 62);
  }
  return code;
}

function createShortener() {
  let counter = 0;
  const links = new Map();
  return {
    shorten(url) {
      counter++;
      const code = encodeBase62(counter);
      links.set(code, url);
      return code;
    },
    resolve(code) {
      return links.get(code);
    },
  };
}
`,
      explain: 'Swap the Map for the `links` table and the counter for a block of ids per server, and this is the core of the real design.',
    },
    {
      type: 'check',
      title: 'Check yourself',
      items: [
        {
          q: 'Why does the shortener use a 302 redirect instead of a 301?',
          choices: ['Browsers come back each time, so every click can be counted', '302 is faster for the user', '301 isn\'t allowed for external URLs'],
          answer: 0,
          explain: 'A 301 can be cached by the browser, which hides repeat clicks from you.',
          why: { 1: 'A cached 301 is actually faster; that\'s the trade-off.', 2: '301 works for any URL.' },
        },
        {
          q: 'What does the 7-character base62 code space give you?',
          choices: ['About 3.5 trillion codes', 'About 3.5 million codes', 'About 62 times 7, or 434 codes'],
          answer: 0,
          explain: '62 to the power of 7 is 3,521,614,606,208.',
          why: { 1: 'That\'s far too small; 62^4 alone is almost 15 million.', 2: 'The count multiplies by 62 per character; it doesn\'t add.' },
        },
        {
          q: 'What breaks first as the shortener grows?',
          choices: ['Database reads for redirects, fixed with a cache for hot codes', 'Database writes for new links', 'The load balancer'],
          answer: 0,
          explain: 'Clicks vastly outnumber new links, and popular links dominate, so caching hits the biggest load.',
          why: { 1: 'Creates are the rare operation here.', 2: 'Load balancers handle very high traffic; the database is the shared bottleneck.' },
        },
        {
          q: 'Why send click events through a queue?',
          choices: ['So counting doesn\'t slow down the redirect', 'So clicks are counted more accurately', 'Because Redis can\'t store counts'],
          answer: 0,
          explain: 'The redirect returns right away; a worker updates counts in the background.',
          why: { 1: 'Counts arrive slightly later; accuracy is the same at best.', 2: 'Redis can count fine; the point is keeping the redirect path fast.' },
        },
        {
          q: 'A counter-based shortener is used for links to private documents. What is the risk?',
          choices: ['Codes are sequential, so people can guess other links', 'Codes will collide', 'Codes will be too long'],
          answer: 0,
          explain: 'Counter codes go 1, 2, 3... Use random codes (or shuffle the ids) when links must not be guessable.',
          why: { 1: 'A counter never repeats, so no collisions.', 2: 'Counter codes are as short as they can be.' },
        },
      ],
    },
  ],
};
