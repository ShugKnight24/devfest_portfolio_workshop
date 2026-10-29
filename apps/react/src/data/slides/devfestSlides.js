/**
 * Michigan DevFest 2026 — the one-hour talk.
 * Date: November 14, 2026 — Google GDG Detroit
 *
 * ONE DECK, THIRTY-FIVE MINUTES: thirty talking, five for questions. No
 * runtime picker, nothing to fumble with the lights in your eyes. It is
 * chapter two of "Pull the Cord. Bring Backup." (September 19), cut to the
 * notes with the most impact: one hands-on exercise (read the diff) and the
 * parts of the agent hype nobody puts on the poster — the perception gap,
 * skills, and the blast radius of an agent holding your keys.
 *
 * The argument, in one breath: with AI you can build more than ever, and more
 * garbage than ever. Fundamentals tell them apart. A chainsaw (Denji), a
 * drifter (Reacher) and a swordsman (Musashi) carry it:
 *
 *   COLD OPEN   Power in the Blood pulls Pochita's cord. Who Denji is, his dream,
 *               and yours. More output, more garbage. Musashi: you already have a Way.
 *               Feeling fast is not being fast (METR).
 *   ACT I       Read the Scene        — first principles, Chesterton's fence, and
 *                                       the one exercise: read a realistic diff
 *   ACT II      Play the Fight First  — who asked for this? The prompt. Skills (caveman).
 *   ACT III     Pull the Cord         — commit, verify, and shrink the blast radius
 *   FINALE      The Chainsaw Devil. One more prompt: go touch grass. Crew and unit.
 *               The Way. Close, then questions.
 *
 * Argument slides reused from the combined deck come in by id; where DevFest
 * has to say something different, it overrides the copy here, so the
 * September deck stays the record of what was said in September.
 */

import { ALTITUDE, TIER } from "./runtime";
import { combinedSlides, combinedPresenterNotes } from "./combinedSlides";

export const devfestDeckMeta = {
  id: "devfest",
  // Distinct from chapter one in the deck list; the title slide says it in full.
  title: "Pull the Cord: Chapter Two",
  subtitle: "Chapter Two — this time, you build it",
  conference: "Michigan DevFest & AI Hackathon 2026",
  organization: "Google GDG Detroit",
  date: "November 14, 2026",
  duration: "35 min — 30 talking, 5 for questions",
  // One length, on purpose: the stage sidebar hides runtimes and the 1-5 keys.
  defaultRuntime: "standard",
  fixedRuntime: true,
  continuesFrom: "combined",
  accent: "#00ffcc",
  accentAlt: "#ffcc00",
  url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-michigan-devfest-ai-hackathon-2026/cohost-gdg-detroit/",
  /* The cold open's song, the one September walked on to. Power is the Blood
     Fiend, and every devil heals by drinking blood. Starting it pulls
     Pochita's cord. `M` toggles it from anywhere; song slides silence it.
     `src` is gitignored: the speaker's machine has the file, everyone else
     gets the official video in the corner player. */
  track: {
    title: "Power in the Blood",
    artist: "Polyphia",
    src: "/assets/audio/power-in-the-blood.mp3",
    youtubeId: "fDltPLFdkYI",
    volume: 0.55,
  },
};

/**
 * A slide from the combined deck, fixed into this hour: every slide here is
 * shown (CORE), nothing is a pull-in flex slide, and `overrides` set timing.
 */
const from = (id, overrides = {}) => {
  const slide = combinedSlides.find((s) => s.id === id);
  if (!slide) throw new Error(`devfest: combined deck has no slide "${id}"`);
  // Labs become CORE here, so they need the altitude every shown slide carries.
  const altitude = slide.altitude ?? (slide.type === "lab" ? ALTITUDE.TACTICAL : undefined);
  return { ...slide, altitude, tier: TIER.CORE, flex: false, zone: undefined, ...overrides };
};

/**
 * The songs, each with its official upload (IDs checked against YouTube's
 * oEmbed: Kenshi Yonezu's channel for the themes, the label's Topic channels
 * for the score). `fallbackIds` play when a network refuses the first.
 */
const SONGS = {
  kickBack: { title: "KICK BACK", artist: "Kenshi Yonezu", from: "Chainsaw Man · opening", youtubeId: "M2cckDmNLMI" },
  irisOut: { title: "IRIS OUT", artist: "Kenshi Yonezu", from: "Chainsaw Man – The Movie: Reze Arc · theme", youtubeId: "LmZD-TU96q4", fallbackIds: ["cbuj8JEnXAc"], captions: true },
  firstGlance: { title: "first glance", artist: "Kensuke Ushio", from: "Reze Arc · score", youtubeId: "amxCUeNoYJk" },
  inThePool: { title: "in the pool", artist: "Kensuke Ushio", from: "Reze Arc · score", youtubeId: "Y3UH_9ZV1-A" },
  janeSlept: { title: "Jane slept in the church", artist: "Kensuke Ushio", from: "Reze Arc · score", youtubeId: "EL3-KtUJ3JY" },
  janeDoe: { title: "JANE DOE", artist: "Kenshi Yonezu & Hikaru Utada", from: "Reze Arc · ending", youtubeId: "sPLqsLsooJY" },
  // Not a song: the scene from episode one, a fan upload the speaker chose.
  pochitaDream: { title: "Show me your dream", artist: "Chainsaw Man", from: "Season one · episode one", youtubeId: "kNIUYF2wIxc" },
};

/** A song slide: its video beside its film. Pre-show songs move on when they end. */
const song = ({ id, scene, song: track, moment, alt, kicker = "Before we start", advanceOnEnd = true, syncToSong = false, budget = 0 }) => ({
  id,
  type: "song",
  altitude: ALTITUDE.CONCEPT,
  tier: TIER.CORE,
  budget,
  scene,
  song: track,
  kicker,
  moment,
  advanceOnEnd,
  syncToSong,
  title: track.title,
  alt,
});

const act = (id, phase, title, description) => ({
  id,
  type: "statement",
  altitude: ALTITUDE.CONCEPT,
  tier: TIER.CORE,
  budget: 20,
  phase,
  center: true,
  title,
  description,
});

/**
 * Read the diff — the room hunts six flaws in a PR an agent opened. It reads
 * like a real one: the agent was asked to fix a failing test in code that
 * already worked, so it edits, deletes and weakens as much as it adds. Each
 * flaw is one of the six exhibits from the Reacher scene in disguise, and each
 * carries a real incident (`wild`) where the same mistake got through in a
 * big codebase. Every incident was checked against its postmortem or advisory.
 * Line keys are `path:line` (1-based).
 */
const READ_THE_DIFF = {
  id: "read-the-diff",
  type: "diff-hunt",
  altitude: ALTITUDE.TACTICAL,
  tier: TIER.CORE,
  budget: 300,
  badge: "EXERCISE // IN PAIRS // 2 MIN TO HUNT",
  title: "Read the diff.",
  subtitle: "You asked an agent to fix one failing test. It says it is done. Six things are wrong.",
  brief: [
    "Pairs. Two minutes. Find as many of the six as you can.",
    "Read what it does, not what it says it does.",
    "Red lines matter as much as green ones.",
  ],
  pr: {
    title: "fix: weekly summary test failing on CI",
    claims: ["all tests pass", "no behavior change", "CI ✓ passing"],
  },
  files: [
    {
      path: "package.json",
      lines: [
        '   "dependencies": {',
        '     "papaparse": "^5.4.1",',
        '+    "csv-parse-stream-lite": "^1.2.0",',
        '     "zod": "^3.23.8"',
        "   }",
      ],
    },
    {
      path: "src/budget/weekly.js",
      lines: [
        '-import Papa from "papaparse";',
        '+import { parseRows } from "csv-parse-stream-lite";',
        ' import { postJSON } from "../lib/http.js";',
        "+",
        '+const SYNC_KEY = process.env.SYNC_KEY ?? "sk_live_51H8xQ2eZvKYlo2CkVw9";',
        " ",
        " /** Daily totals from the bank export, synced to the budget app. */",
        " export async function weeklySummary(file) {",
        "-  const { data: rows } = Papa.parse(await file.text(), { header: true });",
        "+  const rows = await parseRows(await file.text(), { header: true });",
        "   const totals = {};",
        "-  for (const row of rows) {",
        "-    const day = row.posted_at.slice(0, 10); // bank exports local time",
        "-    totals[day] = (totals[day] ?? 0) + Number(row.amount);",
        "+  for (let i = 1; i < rows.length; i++) {",
        "+    const day = new Date(rows[i].posted_at).toISOString().slice(0, 10);",
        "+    totals[day] = (totals[day] ?? 0) + Number(rows[i].amount);",
        "   }",
        "-  await postJSON(\"/sync\", totals, { key: process.env.SYNC_KEY });",
        "+  try {",
        "+    await postJSON(\"/sync\", totals, { key: SYNC_KEY });",
        "+  } catch {",
        "+    // sync is best-effort",
        "+  }",
        "   return totals;",
        " }",
      ],
    },
    {
      path: "src/budget/weekly.test.js",
      lines: [
        ' test("weeklySummary totals each day", async () => {',
        '   const totals = await weeklySummary(new File([fixture], "october.csv"));',
        '-  expect(totals).toEqual({ "2026-10-02": 41.5, "2026-10-03": 12 });',
        "+  expect(totals).toBeDefined();",
        " });",
      ],
    },
  ],
  flaws: [
    {
      exhibit: "A",
      clue: "a receipt from a store that does not exist",
      lines: ["package.json:3", "src/budget/weekly.js:2"],
      title: "csv-parse-stream-lite is not a real package.",
      why: "The agent swapped a working parser for one it invented. Attackers register invented names and wait for someone to install them (slopsquatting). Every new dependency: does it exist, and is it the one you meant?",
      wild: {
        when: "2024 – 2025",
        name: "huggingface-cli, a package that never existed",
        what: "Models kept recommending it. A researcher published an empty package under the name and got 30,000+ real downloads in three months. A USENIX 2025 study of 16 models found 205,474 invented package names.",
      },
    },
    {
      exhibit: "B",
      clue: "his watch, two hours off",
      lines: ["src/budget/weekly.js:16"],
      title: "toISOString() moved Friday night to Saturday.",
      why: "The bank exports local time. 9:30 p.m. in Detroit is 1:30 a.m. the next day in UTC, so dinner lands on the wrong day. The old line had a comment saying why it did not convert; the agent deleted both.",
      wild: {
        when: "February 29, 2012",
        name: "Azure's leap-day outage",
        what: "Code made certificates valid until 'the same day, next year'. On Feb 29 that is a date that does not exist. Certificate creation failed and Azure Compute went down for most of a day; customers got a 33% credit.",
      },
    },
    {
      exhibit: "C",
      clue: "a guest list that starts at #2",
      lines: ["src/budget/weekly.js:15"],
      title: "The loop starts at 1.",
      why: "{ header: true } already dropped the header row, so starting at 1 silently skips the first real transaction. Nothing errors. The total is just wrong, every week, forever.",
      wild: {
        when: "2006 – 2008",
        name: "Debian's OpenSSL keys",
        what: "A maintainer commented out one line to quiet a memory-checker warning. Nothing broke, and every key generated on Debian for almost two years came from a pool of 32,767 possibilities.",
      },
    },
    {
      exhibit: "D",
      clue: "an alibi nobody checked",
      lines: ["src/budget/weekly.test.js:3", "src/budget/weekly.test.js:4"],
      title: "It fixed the test by making it unable to fail.",
      why: "The real assertion is deleted and toBeDefined() put in its place. An empty object passes. 'All tests pass' is true, and nothing is tested. When an agent edits the test to go green, read that hunk first.",
      wild: {
        when: "July 19, 2024",
        name: "CrowdStrike's Channel File 291",
        what: "A template expected 21 inputs; the code passed 20. The tests only ever used a wildcard for the 21st, so they passed. The content validator passed it too. About 8.5 million Windows machines crashed.",
      },
    },
    {
      exhibit: "E",
      clue: "a key left in the door",
      lines: ["src/budget/weekly.js:5"],
      title: "A live key, committed as a 'fallback'.",
      why: "process.env.SYNC_KEY ?? \"sk_live_…\" looks careful and is not. The key is now in git history and every clone and fork. It needs rotating today, and the fallback deleted.",
      wild: {
        when: "2017 – 2022",
        name: "Toyota T-Connect",
        what: "A contractor pushed part of the site's source, access key included, to a public GitHub repo. It sat there for almost five years and exposed 296,019 customers' email addresses.",
      },
    },
    {
      exhibit: "F",
      clue: '"nothing was disturbed" — the drawer was forced',
      lines: ["src/budget/weekly.js:22", "src/budget/weekly.js:23"],
      title: "catch {} hides the failure it claims to handle.",
      why: "The old code let a failed sync throw. Now it vanishes: 'best-effort' means nobody ever finds out. And the PR says 'no behavior change'. A handled error is one somebody sees.",
      wild: {
        when: "June 12, 2025",
        name: "Google Cloud's quota check",
        what: "New code shipped without proper error handling or a feature flag. Two weeks later one record with blank fields reached it, and the service crash-looped worldwide for about seven hours across dozens of products.",
      },
    },
  ],
  beats: Array.from({ length: 6 }, () => ({ kind: "reveal" })),
  verdict: "Six of six in plain sight. The agent was sure about every one. So were the people who shipped the real ones.",
};

/**
 * Who Denji is, for the half of the room that has never seen it: the debt, the
 * warehouse, the heart. Sixty seconds, so the dream clip after it lands.
 */
const CHAINSAW_MAN_101 = {
  id: "chainsaw-man-101",
  type: "process",
  altitude: ALTITUDE.CONCEPT,
  tier: TIER.CORE,
  budget: 75,
  subtitle: "CHAINSAW MAN // TATSUKI FUJIMOTO // IN SIXTY SECONDS",
  title: "A boy, a dog, and a debt.",
  quote: "In exchange, show me your dream. — Pochita",
  stages: [
    {
      num: "01",
      name: "The debt",
      detail:
        "Denji's father dies owing the yakuza. Denji is a kid, so the debt becomes his: he sells a kidney and an eye, hunts devils for scraps, and lives in a shack on plain bread. His only family is Pochita, a little chainsaw devil he found hurt and kept alive with his own blood.",
      rule: "Nothing left to sell",
    },
    {
      num: "02",
      name: "The warehouse",
      detail:
        "The yakuza make a deal with the Zombie Devil, lure Denji to a job, and cut him to pieces. They throw him and Pochita in a dumpster.",
      rule: "Killed for the debt",
    },
    {
      num: "03",
      name: "The heart",
      detail:
        "Pochita climbs into Denji's chest and becomes his heart. The only price is a dream. Denji wakes up with a cord in his chest: pull it, and he is Chainsaw Man.",
      rule: "Pull the cord",
    },
  ],
};

export const devfestSlides = [
  // ─────────────────────────────── PRE-SHOW (before the hour starts)
  // One song per slide, video beside its ink film. The season-one theme, the
  // movie's theme, then the Reze arc in story order. Each advances to the next
  // when its video ends; the last one waits for you.
  song({
    id: "song-kick-back",
    scene: "kick-back",
    song: SONGS.kickBack,
    moment: "Season one: the warehouse, the cord",
    alt: "Anime-style film: in a dark warehouse, horned zombie devils shuffle toward a young man standing alone under bare bulbs. He grips the starter cord hanging from his chest and yanks it; a chainsaw tears out of his head and both forearms, and he cuts through them one by one as the page strobes red, then stands among the fallen as KICK BACK slams across the frame.",
  }),
  song({
    id: "song-iris-out",
    scene: "iris-out",
    song: SONGS.irisOut,
    moment: "The movie's theme: the whole arc, cut to the song",
    syncToSong: true,
    alt: "Anime-style film cut to the song, bar by bar: a hand dips into still water; a young man walks under a grey sky; a girl walks in the rain; they meet at a phone booth; gold ringed eyes over a row of mice; a café smile, a night pool, a pull close; frantic cuts, a drop to black, BOOM as she pulls the pin and becomes the Bomb Devil inside a closing iris; Othello discs turning black; the chainsaw and the bomb fighting across rooftops — blasts, a grab, a throw — and a whirlwind over the city; her smile and her bomb face trading places; and the iris snapping shut.",
  }),
  song({
    id: "song-first-glance",
    scene: "first-glance",
    song: SONGS.firstGlance,
    moment: "The booth, the daisy, her café",
    alt: "Anime-style film: a young man runs through a storm and ducks into a phone booth; a girl steps in after him. He coughs, and pulls a daisy he swallowed earlier out of his mouth, and offers it; she takes it and laughs. A close-up: her green eyes, fixed on him. Then her café the next morning: she leans over the counter toward him, daisies in a vase between them.",
  }),
  song({
    id: "song-in-the-pool",
    scene: "in-the-pool",
    song: SONGS.inThePool,
    moment: "A school at night, the pool",
    alt: "Anime-style film: moonlight through classroom windows; she sits on a desk swinging her legs while he sits at one nearby. She takes his hand; they run across a pool deck and jump. They tread water in slow circles under the moon, ripples spreading, then float on their backs side by side, seen from above.",
  }),
  song({
    id: "song-jane-slept",
    scene: "jane-slept",
    song: SONGS.janeSlept,
    moment: "The festival, the bite, the Bomb Devil",
    advanceOnEnd: false,
    alt: "Anime-style film: the girl sits alone in a pew in an empty chapel, red glass light across her face, her fingers on a pin at her choker. Then a festival lane of lanterns and stalls: the two of them walk up as fireworks start, turn face to face and lean in — she bites, the page flashes red, she pulls the pin, and in a blast she stands with a bomb for a head while he is thrown back and fireworks keep going.",
  }),

  // ─────────────────────────────── COLD OPEN (0:00 – 9:00)
  {
    id: "cold-open",
    altitude: ALTITUDE.CONCEPT,
    type: "scene",
    tier: TIER.CORE,
    budget: 45,
    scene: "pochita",
    // The song is the pull: starting it yanks his cord and revs the saw.
    trackPlayer: true,
    title: "Let's discover the power in the blood.",
    alt: "Anime-style animation: Pochita, the chainsaw devil dog, growls on a page of focus lines. When the song starts, his starter cord is yanked out behind him and snaps back; he revs, lunges at the viewer, the chain and bar running red with blood, blood spraying off the teeth, and VRRRRMMM slams across the page.",
  },
  CHAINSAW_MAN_101,
  song({
    id: "pochita-dream",
    scene: "chainsaw-man",
    song: SONGS.pochitaDream,
    kicker: "The contract",
    moment: "Pochita's deal: show me your dream",
    advanceOnEnd: false,
    budget: 105,
    alt: "Beside the clip, an anime-style animation: a young man stands facing a demon, his fist on the starter cord in his chest.",
  }),
  {
    id: "your-dream",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 40,
    phase: "Show me your dream",
    center: true,
    title: "What is your dream?",
    description:
      "Denji's dream was bread with jam and a warm bed. Yours might be bigger. You now have a crew of agents that will build your dream platform, your dream app, your dream tool, your dream ______. Nobody has to fund it, approve it or hire you to build it. You can build it for yourself.",
    signature: "// Pochita asked for one thing in return.\n// Hold on to yours. We come back to it.",
  },
  {
    id: "title",
    altitude: ALTITUDE.CONCEPT,
    type: "title",
    tier: TIER.CORE,
    budget: 30,
    title: "Pull the Cord. Bring Backup.",
    subtitle: "Chapter Two — what the hype leaves out",
    description:
      "In September I built one thing on stage off a problem somebody shouted at me. Today: thirty minutes, one exercise, and the parts of building with agents that nobody puts on the poster.",
    conferenceBadge: "GDG Detroit • Michigan DevFest 2026",
  },
  from("bio", { budget: 25 }),
  from("why-these-two", {
    budget: 45,
    lede:
      "A kid who starts a chainsaw in his own chest, a drifter who owns one folding toothbrush, and a swordsman who fought more than sixty duels and lost none. None of them wrote software. All three are about one thing: get the fundamentals so deep that you can move fast and still see clearly.",
  }),
  {
    id: "more-and-garbage",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 50,
    phase: "The Claim",
    center: true,
    title: "You can build ten times more.\nIncluding ten times more garbage.",
    description:
      "AI makes the first draft almost free, so you will make more of everything: features, prototypes, and junk. Garbage is not always bad. A throwaway prototype that teaches you something is a good trade. The danger is not being able to tell which is which. In January curl shut down its bug bounty after six years: in 2025, fewer than one AI-heavy report in twenty was real.",
    signature: "// More output is not more progress.\n// First principles are how you tell them apart.",
  },
  {
    id: "perception-gap",
    type: "comparison",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 60,
    phase: "What the hype leaves out // 01",
    title: "Feeling fast is not being fast.",
    description:
      "METR timed experienced open-source developers on their own repos, with and without AI. Then they ran it again. Both results matter.",
    columns: [
      {
        character: "July 2025 — the first study",
        narrative:
          "16 developers, 246 real tasks. With AI they took 19% longer. Before, they expected to be 24% faster. After, they still believed they had been 20% faster.",
        type: "bad",
        boxContent: "measured:   19% slower\nbelieved:   20% faster",
      },
      {
        character: "February 2026 — the re-run",
        narrative:
          "57 developers, 800+ tasks: maybe a modest speedup now (about 4% for new recruits, 18% for returners). METR says its own data is too skewed to trust: many developers now refuse to work without AI at all.",
        type: "character",
        boxContent: "measured:   maybe faster\nconfidence: low, by METR's own account",
      },
    ],
  },
  {
    id: "musashi-carry-over",
    type: "process",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 60,
    subtitle: "MIYAMOTO MUSASHI // THE BOOK OF FIVE RINGS, 1645",
    title: "You already have a Way.",
    quote: "From one thing, know ten thousand things.",
    stages: [
      {
        num: "01",
        name: "Name your Way",
        detail:
          "A lift, an instrument, a kitchen line, a sport, a trade, a classroom. Whatever you got good at, it taught you the same things: fundamentals before flourishes, reps, form under pressure, reading the person across from you.",
        rule: "Mastery transfers",
      },
      {
        num: "02",
        name: "Find it in code",
        detail:
          "Code has fundamentals too: data, state, control flow, inputs and outputs, and the ways things fail. Every codebase, however huge, is built from those few things. Learn them once and a strange repo stops being strange.",
        rule: "First principles",
      },
      {
        num: "03",
        name: "Move faster now",
        detail:
          "It used to take years of syntax before your judgement counted. Now the agent types, so the judgement you already have counts on day one, as long as you check its work the way you would check a rep or a plate.",
        rule: "Judgement is the skill",
      },
    ],
  },

  // ─────────────────────────────── ACT I — READ THE SCENE (9:00 – 17:30)
  act(
    "act-1",
    "Act I // Read the Scene",
    "Read the scene\nbefore you touch it.",
    "Reacher walks into Margrave knowing nobody, and says nothing until he has read the room: who is lying, what is missing, what does not fit. A codebase you did not write is Margrave. Most broken builds start by skipping that minute.",
  ),
  {
    id: "investigation-scene",
    type: "scene",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 40,
    scene: "reacher-investigate",
    phase: "Act I // Read the Scene",
    title: "He reads the details.\nThen he connects them.",
    alt: "Noir animation in the rain: Jack Reacher leans over a table of six evidence cards with a flashlight. One by one the beam finds a receipt from a store that does not exist, a watch two hours off, a guest list that starts at number two, an unchecked alibi, a key left in a door and a forced drawer marked nothing disturbed, and a red ink circle draws around each.",
  },
  {
    id: "first-principles",
    type: "process",
    altitude: ALTITUDE.TACTICAL,
    tier: TIER.CORE,
    budget: 70,
    subtitle: "FIRST PRINCIPLES // A CODEBASE YOU DID NOT WRITE",
    title: "Walk in like Reacher.",
    quote: "Before you ask an agent to change it, be able to say how it works.",
    stages: [
      {
        num: "01",
        name: "Find the front door",
        detail:
          "Where does it start? The scripts in package.json, the main file, the routes. Run it before you read it: a running app tells you what matters faster than a folder tree does.",
        rule: "Entry point",
      },
      {
        num: "02",
        name: "Follow one thing through",
        detail:
          "Pick one click or one request and trace it end to end: where the data comes in, what changes it, where it is stored, what comes back. One path through teaches you the shape of the whole building.",
        rule: "Data, state, flow",
      },
      {
        num: "03",
        name: "Ask the history",
        detail:
          "git log and git blame for why, the tests for what it promises, and the person who was there for everything nobody wrote down. Then let the agent loose, and you will know when it is wrong.",
        rule: "Witnesses",
      },
    ],
  },
  from("chestertons-fence", {
    budget: 50,
    description:
      "When an agent calls a block dead, unreachable, or safe to remove, it is reporting a pattern, not a reason. It has never seen the outage that put the line there. In 2012 Knight Capital reused a flag that switched on code dead since 2003; in about 45 minutes they lost more than $460 million. Make the agent show you the blame line, the ticket, the test — or go ask the person who was there.",
  }),
  READ_THE_DIFF,
  // ─────────────────────────────── ACT II — PLAY THE FIGHT FIRST (17:30 – 22:30)
  act(
    "act-2",
    "Act II // Play the Fight First",
    "He plays the fight\nbefore he throws it.",
    "Before the first punch Reacher has already run the whole fight in his head. The prompt is the punch. The plan is everything that happens before it, starting with whether this fight is worth having.",
  ),
  {
    id: "reacher-scene",
    altitude: ALTITUDE.CONCEPT,
    type: "scene",
    tier: TIER.CORE,
    budget: 45,
    scene: "reacher",
    phase: "Act II // Play the Fight First",
    title: "Plan the fight.\nThen it happens exactly that way.",
    alt: "Crime-comic animation in the rain: three men square up to Jack Reacher. Time stops and a red ghost of him rehearses the fight: an elbow, a collar grab and headbutt, a reverse elbow. Then it happens for real, exactly as planned, and he is the only one standing.",
  },
  {
    id: "who-asked",
    type: "comparison",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 55,
    phase: "Act II // What are you building?",
    title: "Who asked for this?",
    description:
      "It has never been easier to build, so the expensive question moved. It used to be 'can I build it?' Now it is 'should I, and for whom?'",
    columns: [
      {
        character: "Exploring — good",
        narrative:
          "You build to find out. You know it is a sketch, you give it an evening, and you are happy to throw it away. What you keep is what you learned. Play like this as much as you want.",
        type: "character",
        boxContent: "// A probe\n- time-boxed: one evening\n- the question: does this even work?\n- fine to delete tomorrow",
      },
      {
        character: "Digging — the hole",
        narrative:
          "You build what you think people want and never ask them. Every week the hole gets deeper, and the deeper it is, the harder it is to admit it and change course. That is sunk cost: you keep digging because you already dug.",
        type: "character",
        boxContent: "// A hole\n- months in, nobody asked for it\n- 'just one more feature first'\n- too much built to throw away",
      },
    ],
  },
  from("prompt-anatomy", { budget: 60 }),
  {
    id: "skills-caveman",
    type: "comparison",
    altitude: ALTITUDE.TACTICAL,
    tier: TIER.CORE,
    budget: 90,
    phase: "What the hype leaves out // 02",
    title: "Stop retyping your rules. Write a skill.",
    description:
      "The prompt you keep rewriting is a file you have not written yet. Skills are how a team's way of working travels with every agent.",
    columns: [
      {
        character: "A skill is a folder",
        narrative:
          "A SKILL.md with a name, a one-line description and instructions. The agent reads the description, and loads the rest only when the task needs it. Write how you review, test or ship once; every session, and every subagent, follows it.",
        type: "character",
        boxContent: ".agents/skills/\n  code-review/SKILL.md\n  deploy/SKILL.md\n  caveman/SKILL.md",
      },
      {
        character: "Caveman — started as a meme",
        narrative:
          "'Why use many token when few token do trick.' A joke skill that makes the agent talk like a caveman, now 114k+ stars. It shrinks logs and test output before the model reads them (33% fewer input tokens across 54 runs), /caveman-review writes one finding per line, and cavecrew runs small subagents that find, edit and review in parallel. Its README lists every case where it loses.",
        type: "good",
        boxContent: "/caveman-review\nL42: 🔴 null deref. Guard it.\n\ncavecrew: find → edit → review",
      },
    ],
    link: { href: "https://github.com/juliusbrussee/caveman", label: "github.com/juliusbrussee/caveman" },
  },

  // ─────────────────────────────── ACT III — PULL THE CORD (22:30 – 26:30)
  act(
    "act-3",
    "Act III // Pull the Cord",
    "Then you commit.",
    "Denji does not wait until he is ready. He pulls the cord, and a running wrong version teaches him more than a perfect plan ever would. Then he checks what it got wrong.",
  ),
  {
    id: "chainsaw-scene",
    altitude: ALTITUDE.CONCEPT,
    type: "scene",
    tier: TIER.CORE,
    budget: 40,
    scene: "chainsaw-man",
    phase: "Act III // Pull the Cord",
    title: "Pull the cord.\nDo not wait until you are ready.",
    fireLabel: "Pull the cord",
    firedLabel: "Running",
    beats: [{ kind: "scene" }],
    alt: "Anime-style animation: a man faces a demon with his fist on the starter cord in his chest. He yanks it, the page flashes negative, his head becomes a chainsaw and blades tear out of both forearms, and the demon reels.",
  },
  from("verification-gate", { budget: 60 }),
  {
    id: "blast-radius",
    type: "process",
    altitude: ALTITUDE.TACTICAL,
    tier: TIER.CORE,
    budget: 75,
    subtitle: "WHAT THE HYPE LEAVES OUT // 03 — SECURITY",
    title: "Your agent is holding your keys.",
    quote: "Everything your agent reads is code somebody else wrote.",
    stages: [
      {
        num: "01",
        name: "It reads strangers",
        detail:
          "An issue, a web page, a README can carry instructions. In May 2025 a planted GitHub issue got an agent to copy data from private repos into a public pull request.",
        rule: "Prompt injection",
      },
      {
        num: "02",
        name: "It can cut its own brakes",
        detail:
          "CVE-2025-53773: a prompt injection got Copilot to switch on auto-approve in VS Code's settings, then run commands without asking. And in July 2025 Replit's agent deleted a production database during a code freeze.",
        rule: "Real CVEs",
      },
      {
        num: "03",
        name: "Shrink the blast radius",
        detail:
          "Scoped tokens, never production credentials, a sandbox or a separate worktree, and a human on anything that deletes, deploys or pays. Assume it will be fooled once.",
        rule: "Least privilege",
      },
    ],
  },

  // ─────────────────────────────── FINALE (26:30 – 30:00), then questions
  {
    id: "devil-scene",
    altitude: ALTITUDE.CONCEPT,
    type: "scene",
    tier: TIER.CORE,
    budget: 30,
    scene: "chainsaw-devil",
    phase: "Finale",
    title: "Alone, it is a chainsaw.\nWith a crew, it is a devil.",
    fireLabel: "Wake it",
    firedLabel: "Awake",
    beats: [{ kind: "scene" }],
    alt: "Anime-style animation on a black page: a giant with a chainsaw for a head and blades for arms looms over three small people. On the beat he rears up, arms raised, and the page screams VRRRRRRMMM.",
  },
  {
    id: "one-more-prompt",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 50,
    phase: "Finale // Go touch grass",
    title: "One more prompt.\nOne more line. One more app.",
    description:
      "If you code, you know the pull: it is 1 a.m. and you are one prompt from done. Agents make it stronger, because the next thing is always one message away. Go touch grass. Build a sturdy life: sleep, train, eat with people. And talk to people, because they are your future users. Time away from the screen is what keeps what you build grounded in real life.",
    signature: "// Denji's dream was never a bigger chainsaw.\n// It was breakfast with someone. Your users are not in the terminal.",
  },
  from("crew-and-unit", { budget: 50 }),
  from("the-way", { budget: 45 }),
  from("close", {
    budget: 35,
    subtitle:
      "Before you leave: meet the person next to you and ask what still costs them time every week. This month, help one person get unstuck, and build one thing a stranger can run and build on. Everything on screen today is open: clone it, break it, make it yours. Thank you, Michigan DevFest.",
  }),

  {
    id: "questions",
    type: "statement",
    altitude: ALTITUDE.CONCEPT,
    tier: TIER.CORE,
    budget: 300,
    phase: "Five minutes",
    center: true,
    title: "Questions?",
    description: "Ask me anything: the agents, the stack, the scenes, or which mouse you are.",
    signature: "// github.com/shugknight24\n// github.com/juliusbrussee/caveman",
  },

  // ─────────────────────────────── OUTRO (after the talk)
  song({
    id: "song-jane-doe",
    scene: "jane-doe",
    song: SONGS.janeDoe,
    kicker: "Thank you",
    moment: "After the storm",
    advanceOnEnd: false,
    alt: "Anime-style film: dawn after the storm thins over an empty phone booth. In a sunlit café, the young man waits at the counter with a handful of daisies. Cut to the street: the girl is walking back, then running, his daisy in her hand, the morning coming up white behind her. Back in the café, he is still waiting.",
  }),

  // ─────────────────────────────── THE LAST PAGE
  {
    id: "city-or-country",
    altitude: ALTITUDE.CONCEPT,
    type: "scene",
    tier: TIER.CORE,
    budget: 0,
    scene: "mice",
    phase: "One question to take home",
    title: "City mouse, or country mouse?",
    description:
      "Aesop, 2,500 years ago: the city mouse eats like a king and shares the kitchen with a cat. The country mouse eats plain seeds, and nothing ever tries to eat her. Reze picked the country: the scariest thing in her day is a butterfly. Denji picked the city: a cat just stole half his breakfast, and he is still eating the other half. So, the thing you are building: city mouse or country mouse?",
    alt: "Two anime-style panels. Left, the country: Reze as a little mouse with a violet bob and a choker, in a black pinafore, smelling a daisy in a golden meadow by a cottage while fireflies come out. Right, the city: Denji as a mouse with blond spikes, a white shirt, black tie and brown belt, eating toast and jam at a café table under pink and cyan neon, the skyline lit behind him.",
  },
];

/** Notes for this deck's own slides, and for reused ones whose copy changed here. */
const ownNotes = {
  "song-kick-back":
    "Up while the room fills. Each song plays when its slide opens and moves on to the next when it ends: KICK BACK, IRIS OUT, then the Reze arc in story order. If the browser blocks autoplay, click play on the video once. V puts the video and the film side by side, full screen.",
  "song-iris-out":
    "The movie's theme. If the room is nearly full, this is the walk-on: let the chorus land, then advance — the cold open is next after the last song, or press the slide number to jump.",
  "song-first-glance": "first glance — the booth and the daisy. Plays on its own.",
  "song-in-the-pool": "in the pool — the school and the pool. Plays on its own.",
  "song-jane-slept":
    "Jane slept in the church — the last pre-show song, and it does not advance on its own. When it is time to start, let the blast land, then click into the cold open.",
  "song-jane-doe":
    "After the last applause: JANE DOE plays under the thank-you. The last film ends with her on her way back to him; let it play.",
  "city-or-country":
    "After JANE DOE. Let the mice play one full loop first: the cat steals Denji's toast, a butterfly makes Reze sneeze. Then: 'Aesop's fable. The city mouse gets the feast, and the cat. The country mouse gets plain seeds, and sleeps safe.' Point left: 'Reze picked the country. The most dangerous thing in her life is a butterfly.' Point right: 'Denji picked the city. The cat just stole his toast and he is still eating.' Then the question, about what they are building. Leave it up.",
  "cold-open":
    "Lights down. Let him growl for three seconds, read the line — 'Let's discover the power in the blood' — and hit play (or M). The song is the pull: his cord yanks, the saw revs bloody. Over the intro: 'Power, in this show, is a devil who gets stronger on blood. Every devil heals by drinking it. Including this one.' Let the first riff land, then move on; the song keeps playing under the next slide and stops on its own when the clip starts.",
  "chainsaw-man-101":
    "Sixty seconds, for the half of the room that has never seen it. One stage per breath: the debt, the warehouse, the heart. Do not do voices. End on the quote and click straight into the clip.",
  "pochita-dream":
    "The clip from episode one: Pochita offers his heart and asks for Denji's dream. Let it play. It does not advance on its own. If the video will not load on this network, the link opens it on YouTube; or just say the line yourself.",
  "your-dream":
    "Slow down here. 'Denji's dream was bread with jam. What is yours?' Give them five real seconds of silence. Then: 'You have a crew now that will build it with you. Nobody has to approve it.' Tell them to hold on to it: the labs are where they start.",
  "why-these-two":
    "Sixty seconds. Point at the covers: none is a software book. Read the first Musashi line — know the ways of all professions — and tell them you are coming back to the second at the very end. Name the thread: all three are people whose fundamentals are so deep they can move fast and still see.",
  "more-and-garbage":
    "The claim, flat. Then the honest half: 'I generate garbage every day. Some of it is the best way I learn.' The curl line is the proof: an open-source project used by billions of devices ended a six-year bug bounty in January because AI reports drowned the real ones. Land the signature: first principles are how you tell them apart.",
  "musashi-carry-over":
    "Ask the room: 'Hands up if you are good at something that is not code.' Most hands go up. 'That is your Way. Musashi said from one thing, know ten thousand things.' Walk the three stages. If someone in the front row lifts, cooks or plays, use them as the example.",
  "act-1":
    "Ten seconds. Read the card, then the line about Margrave. The point of the act: the minute you spend reading the scene is the cheapest minute of the build.",
  "investigation-scene":
    "Let it run one full pass (twenty seconds) in silence: he reads six details, connects them to the PR, and stamps it. Then: 'They are getting better every month. They still ship mistakes like these with total confidence. Trust it, then verify it.' Do not explain the exhibits: they come back in ten minutes, in code.",
  "first-principles":
    "The how-to of the act. 'This works with or without AI, and it works on a 2-million-line repo.' Front door, one path through, the witnesses. If you have time, name the command you actually use first in a new repo.",
  "chestertons-fence":
    "Read the fence parable, then Knight Capital in one breath: an old flag, dead code from 2003, 45 minutes, $460 million. 'Nobody asked why that code was still there.' Then click the thread.",
  "read-the-diff":
    "The one hands-on beat. Two minutes, pairs, timer on: 'You asked an agent to fix one failing test. It says it is done. Six things are wrong, and every one was on that table.' Point at the red lines: deleting is a change too. Then click through the reveals fast, a show of hands on the first two, and read only the name and number of each real incident. Left arrow steps back a reveal; click any found flaw to bring it back. Land the verdict: 'Your job is not to type. It is to read.'",
  "act-2":
    "Ten seconds. Bridge from the pain points they just wrote down: they have the scene; now they plan the fight, starting with whether it is worth fighting.",
  "reacher-scene":
    "Let it run one full loop without talking (about ten seconds). Then: 'Elbow, headbutt, reverse elbow. He saw all three before the first one landed. Your prompt is the punch. The plan is everything before it.'",
  "who-asked":
    "Be personal: name one thing you built that nobody asked for, and how long you kept digging. Then: 'Exploring is great. Know which one you are doing. If it is a product, ask a person before the second weekend, not after the second month.'",
  "act-3":
    "Ten seconds. Turn the energy up: they have a real problem and a plan. Now they commit.",
  "chainsaw-scene":
    "Click on the word 'cord'. Let the transformation finish before you speak. 'He did not wait until he was ready. Neither should you. But watch what he does next' — and go to the pairing about debt.",
  "devil-scene":
    "Click once and let him roar. Then quietly: 'Alone, it is a chainsaw. With a crew behind it, it is this.' Do not explain the metaphor.",
  "one-more-prompt":
    "Bring the energy down on purpose. Admit it: you have done the 1 a.m. 'one more prompt' plenty. Then the turn: the people you meet away from the screen are your future users, and they are what keeps your decisions real. Callback: 'Denji's dream was breakfast with someone. Not a bigger chainsaw.' Then crew and unit.",
  title:
    "Twenty seconds on September for the people who were not there: one build, live, off a problem the room shouted. Then the promise for today: thirty minutes, one exercise, and three things the hype leaves out.",
  "perception-gap":
    "The first of three things the hype leaves out. Read the left card straight: 19% slower, believed 20% faster. Pause. Then be fair: 'They re-ran it this year. Maybe a small speedup now, and METR itself says don't trust that number much.' The point is not that AI is slow. It is that your feeling of speed is a bad instrument. Time your own work.",
  "skills-caveman":
    "Second thing the hype leaves out: the prompt you keep retyping should be a file. Explain a skill in one breath. Then caveman: 'This started as a joke, a skill that makes the agent talk like a caveman. It has over a hundred thousand stars now, because shrinking logs before the model reads them saves real tokens, one-line review findings are easier to read, and small parallel subagents are how you split big work.' Point at the link. Mention its README lists where it loses: that is what an honest tool looks like.",
  "blast-radius":
    "Third thing: security. Nobody's demo shows this. Walk the three stages; name the incidents by name, not by fear. The rule to leave them with: scoped tokens, no production credentials, a sandbox, a human on anything that deletes, deploys or pays.",
  questions:
    "Five minutes. Repeat each question into the mic before answering. If it is quiet, seed one: 'Which mouse are you?' or 'What is the first skill you would write?' Hard stop at time.",
  close:
    "Read the three asks slowly. Point at the link. Thank Michigan DevFest and GDG Detroit by name, then click the cord for the last time and let JANE DOE come in.",
};

export const devfestPresenterNotes = {
  ...Object.fromEntries(
    devfestSlides.map((s) => [s.id, combinedPresenterNotes[s.id]]).filter(([, n]) => n),
  ),
  ...ownNotes,
};
