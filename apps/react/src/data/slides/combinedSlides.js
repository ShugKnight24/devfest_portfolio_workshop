/**
 * THE TRILOGY ENSEMBLE — the deck you actually give.
 *
 * Detroit Latin Heritage Month Innovation Summit — September 19, 2026
 * Google GDG Detroit
 *
 * ONE ARGUMENT
 * ------------
 * You are no longer the person who types. You are the person who decides. Every
 * slide here is evidence for that one claim, and the character pairings are the
 * shape the evidence takes: two habits held against each other until the
 * engineering rule between them is obvious.
 *
 *   Reacher / Neagley      context is a budget — bring nothing, name everything
 *   Finlay / Roscoe        the two things an agent cannot know: history, terrain
 *   O'Donnell / Dixon      small tools, real numbers
 *   Denji / Aki            momentum is free, dependencies are a loan
 *   Power                  fluent is not correct
 *   Makima / Kishibe       direct the crew, stay able to do the work yourself
 *
 * ELASTIC
 * -------
 * Length is a VIEW over this deck, not a rewrite of it (see ./runtime.js). Every
 * slide declares a `tier`:
 *
 *   CORE      ~13 min. Cold open, the claim, the formula, Chesterton's Fence,
 *             the three live beats, the turn, the close. The argument.
 *   EXTENDED  ~31 min. The pairings, the context hierarchy, the proof of work.
 *   DEEP      ~56 min. The method in detail, the case file, the career turn.
 *
 * FLEX ZONE — `while-it-builds`
 * ----------------------------
 * A live build takes as long as it takes. The three pairings that work best as
 * standing material (Reacher/Neagley, Denji/Aki, Power) sit in a zone the
 * speaker opens on demand from the HUD, alongside the token-economics and
 * zero-bloat beats and a reserve roster. Nine minutes of material you can spend
 * two minutes or all of. You never stall, and you never have to fake it.
 */

import { TIER } from "./runtime";

export const combinedDeckMeta = {
  id: "combined",
  title: "The Trilogy Ensemble",
  subtitle: "Deduction, Momentum & Form in Agentic Development",
  conference: "Detroit Latin Heritage Month Innovation Summit 2026",
  organization: "Google GDG Detroit",
  date: "September 19, 2026",
  duration: "Elastic — 15 / 30 / 60 min",
  elastic: true,
  defaultRuntime: "lightning",
  accent: "#00ffcc",
  accentAlt: "#ffcc00",
  variant: "combined",
  url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-detroit-latin-heritage-month-innovation-summit/cohost-gdg-detroit/",
};

export const combinedSlides = [
  // ═══════════════════════════════════════════ ACT 0 — THE CLAIM
  {
    id: "title",
    type: "title",
    tier: TIER.CORE,
    budget: 45,
    title: "The Trilogy Ensemble",
    subtitle: "Deduction. Momentum. Form.",
    description:
      "One developer directing a crew. In a few minutes this room is going to name something that annoys you, out loud, and we are going to build it on stage.",
    conferenceBadge: "GDG Detroit • Latin Heritage Month Innovation Summit",
  },

  {
    id: "thesis",
    type: "statement",
    tier: TIER.CORE,
    budget: 70,
    phase: "The Claim",
    center: true,
    title: "The syntax barrier\nis dead.",
    description:
      "Typing a for-loop stopped being the scarce skill. What is scarce is knowing which loop, knowing why, and being able to tell when the machine hands you something plausible and wrong. Everything after this slide is about that one judgement.",
    signature:
      "// Nobody is impressed that you can type.\n// They are impressed that you knew what to build.",
  },

  {
    id: "three-frameworks",
    type: "process",
    tier: TIER.EXTENDED,
    budget: 105,
    subtitle: "THE WHOLE ARGUMENT, ONE SLIDE",
    title: "Three ways to go faster.",
    quote:
      "Deduction tells you what to build. Momentum makes it real. Form decides whether it survives contact with an agent.",
    stages: [
      {
        num: "01",
        name: "Deduce",
        detail:
          "Read the scene before you touch it. Most bad agent output is a bad question asked confidently. Narrow the problem to the three lines that matter and the answer comes back surgical instead of plausible.",
        rule: "Reacher",
      },
      {
        num: "02",
        name: "Move",
        detail:
          "A running wrong version teaches you more than another hour of diagram, because now you are arguing with something real instead of with yourself.",
        rule: "Denji",
      },
      {
        num: "03",
        name: "Hold Form",
        detail:
          "Strict boundaries are not bureaucracy. They are what sets the blast radius of every edit an agent makes while you are looking somewhere else.",
        rule: "The Iron",
      },
    ],
  },

  // ═══════════════════════════════════════════ ACT I — DEDUCE FIRST
  {
    id: "reacher-formula",
    type: "reacher-intro",
    tier: TIER.CORE,
    budget: 95,
    title: "Deduce first. Then overwhelming force.",
    subtitle: "The Reacher Formula, applied to a codebase",
    quote:
      "In an investigation, details matter. You look, you analyze, and when the moment comes, you hit first and you hit hard.",
    traits: [
      {
        title: "Deduce First",
        description:
          "Walk into the crime scene of a broken system and read the tire tracks in the stack trace. Name the cause before you touch a line. An agent handed a vague question will answer it beautifully and be wrong.",
        icon: "search",
        reacherQuote: "I don't mind the questions. I mind the lies.",
      },
      {
        title: "Then Overwhelming Force",
        description:
          "Once the cause is named, stop typing and start directing. One person doing the structural work of a five-person squad, because the squad is agents and you are the only one in the room with judgement.",
        icon: "lightning",
        reacherQuote: "I like to hit first, and hit hard.",
      },
      {
        title: "Zero Hesitation",
        description:
          "Analysis without execution is a nice opinion. When the read is locked, move. The gap between knowing and shipping is where most careers quietly stall.",
        icon: "rocket",
        reacherQuote: "Semicolon purgatory is over.",
      },
    ],
  },

  {
    id: "chestertons-fence",
    type: "character-roster",
    tier: TIER.CORE,
    budget: 90,
    phase: "Deduce First // The Fence",
    title: "Do not tear down the fence.",
    subtitle: "Chesterton's Fence // The rule for every delete",
    lede: "There is a fence across a field. It serves no purpose you can see. The reformer says: let us clear it away. The wiser answer is go and find out why it was put there — and when you can tell me that, I may let you take it down.",
    description:
      "When an agent calls a block dead, unreachable, or safe to remove, it is reporting a pattern, not a reason. It has never seen the outage that put the line there. Make it show you the blame line, the ticket, the test. If nobody can say why the fence is there, that is not permission. That is the investigation.",
    characters: ["finlay"],
  },

  {
    id: "incident-story",
    type: "statement",
    tier: TIER.DEEP,
    budget: 110,
    phase: "Deduce First // The Bill",
    title: "The fence I removed\nin March.",
    description:
      "Nine lines in a nightly job. No comment, no obvious purpose. The agent called them unreachable, the tests were green, and it shipped. Five weeks later a handful of customers were billed twice: those nine lines were a guard added after an incident nobody wrote down.",
    signature:
      "// It was not wrong about the pattern.\n// It was wrong about the history — the part it cannot see.",
  },

  {
    id: "pair-finlay-roscoe",
    type: "comparison",
    tier: TIER.EXTENDED,
    budget: 95,
    phase: "Act I // Evidence & Terrain",
    title: "The two things it cannot know.",
    description:
      "An agent has read more code than you ever will. It has never seen your incident history and never met your users. Those two gaps are your job.",
    columns: [
      {
        character: "Finlay — By the book",
        narrative:
          "Harvard, methodical, will not move on a hunch. Neither should the crew. Never ask an agent to 'fix the login bug' — an adjective is not evidence. Hand it the failing test name and the top five frames, and the fix stops being a guess.",
        type: "character",
        boxContent:
          "// Evidence, not adjectives\n- the failing test, by name\n- stack trace, top 5 frames\n- the commit that last touched it",
      },
      {
        character: "Roscoe — Local knowledge",
        narrative:
          "The cop who actually knows the town. The model knows every framework and none of your users, so it will solve the wrong problem beautifully. State the constraint only you could know before you state the task.",
        type: "character",
        boxContent:
          "// Terrain the model has never walked\n- who actually uses this, and when\n- what broke here last year\n- the constraint nobody wrote down",
      },
    ],
  },

  {
    id: "context-hierarchy",
    type: "process",
    tier: TIER.EXTENDED,
    budget: 100,
    subtitle: "ARCHITECTURE // HOW TO FEED AN AGENT",
    title: "Investigate. Deduce. Verify.",
    quote:
      "Beware of unearned wisdom. If you never audit the output, you have outsourced your judgement to a server you do not own.",
    stages: [
      {
        num: "01",
        name: "Investigate",
        detail:
          "Pull symbols and line ranges. Never dump whole files. The context you did not need is context the model spends instead of thinking about your problem.",
        rule: "Symbol Scoping",
      },
      {
        num: "02",
        name: "Deduce",
        detail:
          "Write the smallest diff that could possibly work, against a named root cause and a typed spec. Two files, not twenty.",
        rule: "Surgical Diffs",
      },
      {
        num: "03",
        name: "Verify",
        detail:
          "Types, tests, and a production build, every time, with no human discretion in the loop. The gate is the only thing standing between you and a plausible lie.",
        rule: "CI Gatekeeper",
      },
    ],
  },

  // ═══════════════════════════════════════════ ACT II — LIVE
  {
    id: "the-ask",
    type: "live-build",
    tier: TIER.CORE,
    budget: 110,
    phase: "Live // 01",
    title: "Name something that annoys you.",
    subtitle: "Out loud. Right now.",
    description:
      "Not a startup idea. A small, specific, stupid piece of friction in your actual week — the thing you redo by hand every Tuesday, the spreadsheet you hate.",
    prompts: [
      "What do you still do by hand?",
      "What tab is open that you resent?",
      "What needs 'there should be an app'?",
    ],
    speakerCue: "TAKE 2-3 FROM THE ROOM. PICK THE MOST SPECIFIC ONE.",
    ctaText: "Open Agentic Studio",
    ctaLink: "/agentic-studio",
  },

  {
    id: "launch-build",
    type: "live-build",
    tier: TIER.CORE,
    budget: 90,
    phase: "Live // 02",
    title: "Now watch it get built.",
    subtitle: "Deduction into force, in public.",
    description:
      "One precise prompt — a spec, not a wish. Watch what goes into it, and what I deliberately leave out. Context is a budget you are spending.",
    prompts: [
      "State the constraint, not the solution.",
      "Name the files. Never paste the repo.",
      "Define 'done' before you start.",
    ],
    speakerCue: "KICK OFF THE BUILD. THEN OPEN THE FLEX ZONE — F KEY — AND TALK.",
    ctaText: "Open Operatives Sandbox",
    ctaLink: "/operatives",
    opensZone: "while-it-builds",
  },

  // ───────────── FLEX ZONE: standing room while the agent works ─────────────
  {
    id: "pair-reacher-neagley",
    type: "comparison",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 95,
    phase: "Pairing // Token Economics",
    title: "Context is a budget.",
    description:
      "Two halves of one rule. Reacher brings no baggage; Neagley names the exact thing. Everything else you type is spent memory.",
    columns: [
      {
        character: "Reacher — No baggage",
        narrative:
          "Expired passport, folding toothbrush, nothing to slow the read. In a prompt that means no inherited framing: do not tell the agent what you already assume is broken, or it will agree with you and go looking for proof.",
        tag: "Civilian prompt",
        type: "bad",
        content:
          '"Hey! Could you look through the repo and fix\nthe login bug? Pretty sure it\'s the session\nlogic. Thanks so much :)"',
        result: "-> 40k tokens of context, three invented helpers, no fix.",
      },
      {
        character: "Neagley — Exact scope",
        narrative:
          "Total recall, zero tolerance for anything extra. Hand over files and line ranges, never the whole repo, and state what 'done' looks like before it starts. Precision is not politeness; it is what makes the diff reviewable.",
        tag: "Investigator prompt",
        type: "good",
        content:
          'Files: src/auth/session.ts L40-96\nRepro: session.spec.ts "expired token"\nConstraint: no new dependencies\nOutput: unified diff only',
        result: "-> One file touched. Test green. Nothing else moved.",
      },
    ],
  },

  {
    id: "pair-denji-aki",
    type: "comparison",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 95,
    phase: "Pairing // Velocity & Debt",
    title: "Move fast. Sign nothing.",
    description:
      "Momentum inside your own code is free. Momentum bought with dependencies is a loan, and you do not set the repayment date.",
    columns: [
      {
        character: "Denji — Pull the ripcord",
        narrative:
          "No formal training, no plan, immediate action. Generate the imperfect version and let it be wrong out loud. Ten minutes of running code will tell you what three hours of planning could not, because now the problem is arguing back.",
        type: "character",
        boxContent:
          "// v0 is a probe, not an asset\nconst v0 = scaffold(idea);\nrun(v0); break(v0); decide();",
      },
      {
        character: "Aki — The contract has a price",
        narrative:
          "Every devil contract costs him lifespan, and he signs them anyway, knowingly. Every package an agent adds costs you an upgrade path, a CVE feed, and someone else's roadmap. Sign when the price is worth it. Never sign by accident.",
        type: "character",
        boxContent:
          "// Ask before every install\n- can I write this in 20 lines?\n- who maintains it in 2029?\n- what does removing it cost?",
      },
    ],
  },

  {
    id: "pair-power",
    type: "comparison",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 90,
    phase: "Pairing // Confidence",
    title: "Fluent is not correct.",
    description:
      "The failure that costs you is not the agent refusing. It is the agent answering perfectly, in your house style, and being wrong.",
    columns: [
      {
        character: "Power — Confident and wrong",
        narrative:
          "Brash, loyal, lies constantly, and never once sounds unsure. That is your agent on a bad day. Confidence is a writing style, generated from the same distribution as the answer — it carries no information about whether the answer is true.",
        type: "character",
      },
      {
        tag: "The tell",
        type: "bad",
        content:
          'Agent: "Imported the v4 client, as requested."\n\nYou:   "That package was deprecated in 2019."\n\nAgent: "You\'re absolutely right — here is v5."',
        result: "-> Rule: if you did not run it, it did not happen.",
      },
    ],
  },

  {
    id: "token-economics",
    type: "energy",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 90,
    title: "Noise vs. Silence",
    subtitle: "Leverage is quiet",
    content: `// The corporate loop
const bloatedAgency = {
  standups: 4,
  npmDeps: 142,
  shipped: "two buttons"
};

// The Reacher response
function protocol() {
  /* Reacher said nothing. */
  return deduceRootCause()
      && applyOverwhelmingForce();
}`,
    description:
      "Ballmer screamed DEVELOPERS until his voice went. Real leverage has never been loud. Same rule inside the prompt: cut the filler, keep the constraint, strike once.",
    videoUrl: "https://www.youtube.com/watch?v=8fcSviC7cRM",
  },

  {
    id: "zero-bloat",
    type: "zero-bloat",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 80,
    title: "The Zero-Bloat Doctrine",
    subtitle: "Sovereignty // You own your stack or it owns you",
    quote: "You don't need a lot of luggage when you know where you're going.",
    description:
      "Eighty packages for a date helper is not productivity, it is a loan against a codebase you have not finished writing. Modern CSS and the native web platform cover more than most people check before they install.",
    photoZoneText: "[ DROP DEADLIFT / TECH PHOTO HERE ]",
    image: "",
  },

  {
    id: "roster-reserves",
    type: "character-roster",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.DEEP,
    budget: 95,
    phase: "Reserves // For a build that runs long",
    title: "Three you have not used yet.",
    subtitle: "Provenance, the core primitive, and the rule about speed",
    description:
      "The crew is bigger than the pairings. These three cover the things that only hurt later: unverified provenance, an unguarded core, and velocity spent before the read was locked.",
    characters: ["franz", "pochita", "reze"],
  },
  // ───────────────────────────── /FLEX ZONE ────────────────────────────────

  {
    id: "payoff",
    type: "live-build",
    tier: TIER.CORE,
    budget: 115,
    phase: "Live // 03",
    title: "That did not exist when we started.",
    subtitle: "Let's read it together.",
    description:
      "Not finished, not perfect — that is the point. The skill is not that it generated something. It is that I can tell you what is wrong with it.",
    prompts: [
      "What did it get right?",
      "What did it quietly get wrong?",
      "What would you have missed?",
    ],
    speakerCue: "BE HONEST ABOUT THE FLAWS. THE AUDIT IS THE DEMO.",
    ctaText: "Open the build",
    ctaLink: "/builder",
  },

  // ═══════════════════════════════════════════ ACT III — THE METHOD
  {
    id: "prompt-anatomy",
    type: "comparison",
    tier: TIER.DEEP,
    budget: 120,
    phase: "Method // The Prompt",
    title: "The prompt, line by line.",
    description:
      "Four lines went to the crew. What I left out did more work than what I put in.",
    columns: [
      {
        tag: "What went in",
        type: "good",
        content:
          "Goal:       one sentence, in user terms\nFiles:      the two it may touch\nConstraint: no new dependencies\nDone when:  this test passes",
        result: "-> Every line is something the agent can measurably fail.",
      },
      {
        tag: "Deliberately absent",
        content:
          "- the whole repository\n- please, thanks, and 'you are an expert'\n- my guess at the root cause\n- my suggested implementation",
        result: "-> Each one buys a confident answer to the wrong question.",
      },
    ],
  },

  {
    id: "failure-modes",
    type: "comparison",
    tier: TIER.DEEP,
    budget: 120,
    phase: "Method // Failure",
    title: "Two ways it fails.",
    description:
      "Loud failures are free — the build catches them. Budget your attention for the quiet one.",
    columns: [
      {
        tag: "Loud: confidently wrong",
        type: "bad",
        content:
          "Invents an API. Imports a package that never\nexisted. Writes a test that asserts nothing\nand passes.",
        result: "-> Caught by: the compiler, the build, running it once.",
      },
      {
        tag: "Quiet: technically complete",
        type: "bad",
        content:
          "Does exactly what you asked. Drops the edge\ncase you never mentioned. Ships the happy\npath and reports success.",
        result: "-> Caught by: you, reading the diff. Nothing else will.",
      },
    ],
  },

  {
    id: "verification-gate",
    type: "process",
    tier: TIER.DEEP,
    budget: 120,
    subtitle: "VERIFICATION // WHAT IS ALLOWED TO MERGE",
    title: "Three gates, no exceptions.",
    quote:
      "An agent can write the code. It cannot be the thing that decides the code is correct.",
    stages: [
      {
        num: "01",
        name: "Types",
        detail:
          "The cheapest gate and the first one people disable. A strict compiler kills the entire class of invented APIs before you have read a single line of the diff.",
        rule: "No escape hatch",
      },
      {
        num: "02",
        name: "Tests",
        detail:
          "Write the failing test before the agent writes the fix. Otherwise you are grading an essay against a rubric the author also wrote.",
        rule: "Red first",
      },
      {
        num: "03",
        name: "The diff",
        detail:
          "Read all of it. If the diff is too large to read, the task was too large to delegate — that is a scoping failure, not a reviewing failure.",
        rule: "Human gate",
      },
    ],
  },

  {
    id: "pair-odonnell-dixon",
    type: "comparison",
    tier: TIER.EXTENDED,
    budget: 95,
    phase: "Pairing // Tools & Numbers",
    title: "Small tools. Real numbers.",
    description:
      "Two habits that survive the agent era, because neither one can be faked by fluency.",
    columns: [
      {
        character: "O'Donnell — The ceramic switchblade",
        narrative:
          "He carries the small right tool, not the impressive one. When an agent proposes a framework, ask for the twenty-line version first. You can read twenty lines. You cannot read a dependency tree, and you will be the one paged about it.",
        type: "character",
        boxContent:
          "// The switchblade test\nIf I cannot read it in one sitting,\nI cannot be the one who verifies it.",
      },
      {
        character: "Dixon — Follow the money",
        narrative:
          "Forensic accountant: the numbers do not lie, and the bottleneck is never where the confident engineer says it is. Agents are extremely confident engineers. Make it profile before it refactors, and make it prove the win after.",
        type: "character",
        boxContent:
          "// Before and after, or it did not happen\nconst before = measure();\napplyAgentDiff();\nassert(measure() < before);",
      },
    ],
  },

  {
    id: "ego-vs-isolation",
    type: "comparison",
    tier: TIER.DEEP,
    budget: 105,
    phase: "Form // The Set",
    title: "Ego lifting vs. isolation sets.",
    description:
      "Ask for the whole system in one breath and you get code you cannot debug. Ask for one invariant at a time and you keep the ability to say no.",
    columns: [
      {
        tag: "Ego lifting",
        type: "bad",
        content:
          '"Build the platform. Backend, frontend,\nschema, auth, billing. All of it."',
        result: "-> 4,000 lines you did not read, and now own.",
      },
      {
        tag: "Isolation sets",
        type: "good",
        content:
          '"Step 1: the auth schema only. Stop.\n Step 2: the one route that uses it. Stop.\n Spot me on the form between each set."',
        result: "-> Every step small enough to reject cleanly.",
      },
    ],
  },

  {
    id: "tear-it-down",
    type: "statement",
    tier: TIER.DEEP,
    budget: 95,
    phase: "Form // Hypertrophy",
    title: "Delete the first\nversion.",
    description:
      "Muscle grows because you tear it. The first generated version is a probe: its job is to show you the real shape of the problem and then die. The engineers who struggle with agents are the ones who cannot throw away code that took ten seconds to produce — they start defending it in review, and the argument stops being about the design.",
    signature: "// Sunk cost is not a code review argument.\n// It never was. It is just cheaper to spot now.",
  },

  {
    id: "teach-the-crew",
    type: "process",
    tier: TIER.DEEP,
    budget: 120,
    subtitle: "ONBOARDING // IT IS A NEW HIRE EVERY SINGLE RUN",
    title: "Write down the house rules.",
    quote:
      "It has no memory of the correction you made yesterday. If a rule is not in the repository, it does not exist.",
    stages: [
      {
        num: "01",
        name: "Conventions, committed",
        detail:
          "The idioms, the naming, the directories that are off limits. A file the agent reads on every run beats a correction you retype on every run.",
        rule: "In the repo",
      },
      {
        num: "02",
        name: "Commands, not folklore",
        detail:
          "One documented lint, one typecheck, one test command. If verification is tribal knowledge, it gets skipped exactly when the pressure is highest.",
        rule: "One command",
      },
      {
        num: "03",
        name: "Boundaries, stated",
        detail:
          "Name the files it may touch and the ones it may not. Blast radius is a setting, and you are the only one in a position to set it.",
        rule: "Scoped",
      },
    ],
  },

  {
    id: "when-not-to-agent",
    type: "comparison",
    tier: TIER.DEEP,
    budget: 115,
    phase: "Method // The Line",
    title: "What you never delegate.",
    description:
      "The line is not difficulty. It is reversibility, and who gets named when it goes wrong.",
    columns: [
      {
        tag: "Delegate freely",
        type: "good",
        content:
          "Scaffolding. Mechanical refactors. Test\nfixtures. Migrations you can re-run. Anything\na red build catches for free.",
        result: "-> Cheap to check, cheap to undo.",
      },
      {
        tag: "Keep it yourself",
        content:
          "One-way data migrations. Auth and permission\nboundaries. Anything a customer sees with\nyour name on it. What the product is.",
        result: "-> Nobody is going to review your judgement for you.",
      },
    ],
  },

  {
    id: "pair-makima-kishibe",
    type: "comparison",
    tier: TIER.EXTENDED,
    budget: 95,
    phase: "Pairing // Command",
    title: "Direct the crew. Stay sharp.",
    description:
      "Orchestration is the whole skill now, and it only holds while you could still do the work yourself.",
    columns: [
      {
        character: "Makima — Control",
        narrative:
          "She sees the whole board and moves everyone on it. That is the job: three candidate designs in parallel, discard two, merge one. The trap is in the same sentence — direct the crew, do not become one of them. Judgement is the one thing you are not allowed to delegate.",
        type: "character",
        boxContent:
          "// Orchestration, not abdication\nconst options = await Promise.all(\n  agents.map((a) => a.propose(spec))\n);\nreturn iChoose(options); // not it",
      },
      {
        character: "Kishibe — The veteran",
        narrative:
          "He drills fundamentals until they are reflexes, because under pressure reflexes are all anyone has. Run investigate-deduce-verify by hand often enough that you notice, instantly, the moment an agent skips a step.",
        type: "character",
        boxContent:
          "// Keep the loop in muscle memory\nread the trace -> name the cause\n  -> smallest diff -> prove it",
      },
    ],
  },

  // ═══════════════════════════════════════════ ACT IV — THE EVIDENCE
  {
    id: "case-studies",
    type: "case-studies",
    tier: TIER.EXTENDED,
    budget: 120,
    title: "What it looks like with time",
    subtitle: "Proof of Work // Things I actually run",
    items: [
      {
        category: "Guerilla E-Commerce",
        title: "Criminal Cookies",
        problem: "Plugin bloat, monthly SaaS rent, and a checkout that took seconds to answer.",
        solution:
          "Localized high-frequency checkout compiled to micro-components. No platform tax.",
        impact: "Sub-second purchases with direct inventory sync.",
        icon: "shopping",
      },
      {
        category: "Fitness State Machine",
        title: "Jacked Alien",
        problem: "Every workout app I tried lagged mid-set or needed a network round trip.",
        solution:
          "Finite state machine driving workout cadence. Zero external deps. Runs offline.",
        impact: "Zero-latency state, fully local, on any device.",
        icon: "activity",
      },
      {
        category: "Media Pipeline",
        title: "J. Simmons Prod.",
        problem: "Hours a week lost to manual video encoding across fragmented platforms.",
        solution: "Zero-bloat backend replacing the manual transcode workflow end to end.",
        impact: "Hands-off pipeline. Channels scale without me.",
        icon: "play",
      },
    ],
  },

  {
    id: "case-deep-dive",
    type: "process",
    tier: TIER.DEEP,
    budget: 120,
    subtitle: "CASE FILE // ONE PROJECT, ALL THREE LENSES",
    title: "Criminal Cookies, end to end.",
    quote:
      "The same method you just watched on stage, with more time and a real customer at the end of it.",
    stages: [
      {
        num: "01",
        name: "Deduce",
        detail:
          "Checkout took 2.4 seconds and everyone blamed the database. Profiling put the database at 40ms and the plugin stack at the rest. The fix was a delete, not a rewrite — and I would never have believed that without the numbers.",
        rule: "Measure first",
      },
      {
        num: "02",
        name: "Move",
        detail:
          "Rebuilt the cart as a local state machine over a weekend. It was wrong in three places, and those three places are how I learned what the real invariants were.",
        rule: "v0 is a probe",
      },
      {
        num: "03",
        name: "Hold form",
        detail:
          "Cart state fully isolated from render. That one boundary is the reason an agent can rewrite the pricing rules today without being able to break the checkout.",
        rule: "Blast radius",
      },
    ],
  },

  {
    id: "dirty-bulk",
    type: "comparison",
    tier: TIER.DEEP,
    budget: 110,
    phase: "Evidence // The Scale",
    title: "Vanity metrics vs. the scale.",
    description:
      "Generated code inflates every number the industry used to trust. Pick the metrics that get worse when you cheat.",
    columns: [
      {
        tag: "The dirty bulk",
        type: "bad",
        content:
          "Lines shipped. Commits per week. PRs merged.\nRepos created. Traffic graphs fed by bots.",
        result: "-> Looks enormous. Holds nothing under load.",
      },
      {
        tag: "The scale",
        type: "good",
        content:
          "Time to first byte. Defects that reached a\nuser. Dependencies removed. Time from idea\nto running thing.",
        result: "-> Numbers that punish volume instead of rewarding it.",
      },
    ],
  },

  {
    id: "system-warning",
    type: "system-warning",
    tier: TIER.DEEP,
    budget: 80,
    title: "Deduction alone is not enough.",
    subtitle: "System Warning // The Velocity Ceiling",
    description:
      "The read can be flawless and still lose. Executing at human typing speed means being right slowly while someone less careful ships.",
    triggerPrompt: ">> SPEAKER: INITIATE REZE OVERRIDE (TOP RIGHT) <<",
  },

  // ═══════════════════════════════════════════ ACT V — THE TURN
  {
    id: "speed-of-thought",
    type: "statement",
    tier: TIER.DEEP,
    budget: 110,
    phase: "The Turn // The Only Metric",
    title: "Idea to running\nthing.",
    description:
      "The only velocity number that has ever mattered is the distance between having the thought and watching it run. It used to be weeks, and most of those weeks were typing and waiting for permission. It is now an afternoon, and almost all of that afternoon is deciding. That is the entire shift: judgement got expensive because syntax got cheap.",
    signature:
      "// Coding at the speed of thought is not a slogan.\n// It is a stopwatch, and you can start it today.",
  },

  {
    id: "hiring-shift",
    type: "statement",
    tier: TIER.DEEP,
    budget: 110,
    phase: "The Turn // Careers",
    title: "Nobody is hiring\na typist.",
    description:
      "The portfolio site with a hero section and three invented projects is finished as a signal — anyone can generate that in an afternoon now, and everybody on the other side of the table knows it. What survives a screen is a tool you actually run, that holds state, that somebody other than you depends on. Bring the thing, and bring the reasoning that produced it.",
    signature: "// Show the artifact. Then show the read that made it.",
  },

  {
    id: "audience-of-one",
    type: "paradigm",
    tier: TIER.CORE,
    budget: 100,
    title: "Build for an Audience of One",
    subtitle: "Paradigm // Then let it scale past you",
    description:
      "The standard advice is six weeks polishing a portfolio nobody opens. Burn it. Build the thing that fixes your own Tuesday. It will be honest, you will actually maintain it, and it turns out a lot of other people have your Tuesday.",
    steps: [
      {
        step: "01",
        label: "Solve your own friction",
        desc: "Pick the annoyance you have complained about twice. Build the smallest thing that kills it.",
      },
      {
        step: "02",
        label: "Proof beats presentation",
        desc: "One working tool that holds state says more than any template site, because it cannot be faked in an afternoon.",
      },
      {
        step: "03",
        label: "Audience of Many",
        desc: "Package it, open it up, let people build on your architecture. That is the whole career move.",
      },
    ],
  },

  {
    id: "bio",
    type: "bio",
    tier: TIER.DEEP,
    budget: 85,
    title: "Clearance Level: Admin",
    name: "Shugmi Shumunov",
    role: "Software Engineer & Founder @ Shumunov Solutions",
    details: [
      "Software Engineer & Founder @ Shumunov Solutions — Detroit, MI",
      "Web performance, developer sovereignty, and heavy deadlifts.",
      "Building bespoke tools for an Audience of One.",
      "github.com/shugknight24",
    ],
    why: [
      "To get developers off passive resumes and onto production-grade tools they actually use.",
      "To show the deduction before the force, because the force is the easy half.",
    ],
    jackpot: "¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯ // VERIFIED",
    image: "/assets/images/shug_headshot.jpg",
    photoZoneText: "[ DROP PORTRAIT PHOTO HERE ]",
  },

  {
    id: "close",
    type: "launch",
    tier: TIER.CORE,
    budget: 60,
    title: "Go build your Tuesday.",
    subtitle:
      "Everything on screen tonight is open. Clone it, break it, make it yours. The hands-on version runs at Michigan DevFest in November.",
    ctaText: "Start here",
    ctaLink: "/guide",
  },
];

/**
 * Presenter notes, keyed by slide id.
 *
 * Every slide has one. This deck is given live, in a dark room, to a mixed
 * audience — a missing note is a slide you will have to improvise.
 */
export const combinedPresenterNotes = {
  title:
    "Cold open. Do NOT introduce yourself yet. Promise the live build inside the first twenty seconds so the room knows something is actually going to happen to them. [Press N for notes]",
  thesis:
    "The claim, stated flat, then a beat of silence before you explain it. Junior-heavy room: lean on 'nobody is impressed that you can type.' Senior-heavy room: lean on 'plausible and wrong.'",
  "three-frameworks":
    "EXTENDED. The map for the whole talk — deduce, move, hold form. Say all three out loud once and promise that each one gets a pairing later. Ninety seconds maximum; this is a signpost, not a section.",
  "reacher-formula":
    "Three beats: deduce, then force, then no hesitation. About ninety seconds. This is setup — the payoff is the live build, so do not linger.",
  "chestertons-fence":
    "CORE and load-bearing. Tell the parable straight, with no setup, and let it sit before you name Finlay. Then make the turn concrete: the agent says the code is dead, and the agent has never seen the outage that put it there. If you have one line, it is 'if nobody can say why the fence is there, that is not permission — that is the investigation.' Show of hands: who has deleted something and found out why a week later.",
  "incident-story":
    "DEEP. The fence slide with a bill attached. Tell it as a story, in past tense, and own that you approved the diff. Do not soften it — the room trusts the rest of the talk more once you have paid for one of these. Land on 'it was wrong about the history.'",
  "pair-finlay-roscoe":
    "EXTENDED. The two gaps: provenance and locality. Concrete ask for the room — next time you open a chat, write the failing test name first. If the room is enterprise-heavy, Roscoe is the stronger half: the model has never met their users.",
  "context-hierarchy":
    "EXTENDED. Investigate, deduce, verify. The verification gate is the non-negotiable and you should say it in exactly that tone. This is the slide people photograph.",
  "the-ask":
    "TAKE 2-3 ANSWERS FROM THE ROOM. Pick the most SPECIFIC one, never the most ambitious — 'track my water intake' beats 'an app for healthcare.' If the room is quiet for four seconds, use your own fallback friction and move on; do not let the silence stretch.",
  "launch-build":
    "Write the prompt where they can see it and narrate what you are deliberately leaving out. Kick the build off, then press F to open the flex zone and keep talking. Do not watch the progress bar with them. If you want a bigger swing, take an audience condition live — 'what should happen when the timer hits zero' — and speak the prompt out loud.",
  "pair-reacher-neagley":
    "FLEX. Best opener for the zone because it explains the prompt they just watched you write. Read the civilian prompt in a cheerful voice; it gets the laugh and makes the point for free.",
  "pair-denji-aki":
    "FLEX. Momentum and the bill for it. Aki is the half that lands with senior engineers — the interest comes due on a schedule you do not choose, usually during an incident. Ask how many dependencies they think this app has.",
  "pair-power":
    "FLEX. Reliable laugh, serious point. 'This is your agent on a bad day.' Land on the rule: confidence is a writing style, not evidence. If you did not run it, it did not happen.",
  "token-economics":
    "FLEX. The Ballmer contrast. Good energy reset mid-zone. The video clip is optional — only if the room is warm and the build is genuinely slow.",
  "zero-bloat":
    "FLEX. The folding toothbrush. Short. Good one to drop first if the build comes back early.",
  "roster-reserves":
    "FLEX, DEEP. Three cards, so it stretches or compresses. Use it only if the build is running genuinely long. Franz is the one for a security-minded room; Pochita for anyone maintaining a platform; Reze for the room that wants permission to go fast.",
  payoff:
    "Come back to the build. BE HONEST ABOUT WHAT IS WRONG WITH IT — the audit IS the demo. If the build failed outright, that is still a win: show the failure, read the error out loud, and deduce the cause in front of them. That is a better talk than a clean success.",
  "prompt-anatomy":
    "DEEP. Put the actual prompt from tonight's build on screen if you can. Spend more time on the right-hand card than the left — what you left out is the part nobody teaches.",
  "failure-modes":
    "DEEP. The quiet failure is the whole point of the slide. Ask: who has merged something that did exactly what was asked and still broke a customer. Wait for the hands.",
  "verification-gate":
    "DEEP. Say 'no exceptions' the way you would mean it in a code review. The 'if the diff is too large to read, the task was too large to delegate' line is the one that gets quoted back to you.",
  "pair-odonnell-dixon":
    "EXTENDED. Small tools and real numbers. Dixon is the half to push in a performance-minded room: the bottleneck is never where the confident engineer says it is, and agents are extremely confident engineers.",
  "ego-vs-isolation":
    "DEEP. Form check. Read the ego-lifting prompt in the voice of someone who thinks it is a great idea. Then the isolation version, slowly. The takeaway is 'small enough to reject.'",
  "tear-it-down":
    "DEEP. Hypertrophy. The real content is the second half — people defend generated code in review because they own it, not because it is good. Name that out loud; it is uncomfortable and true.",
  "teach-the-crew":
    "DEEP. The most immediately actionable slide in the deck. Tell them to go write the conventions file this week. If they are on a team, this is the slide that justifies the whole talk to their manager.",
  "when-not-to-agent":
    "DEEP. The maturity beat. Reversibility, not difficulty, is the line. One-way migrations and auth boundaries are the two examples that always land.",
  "pair-makima-kishibe":
    "EXTENDED. Orchestration plus fundamentals. The warning inside the Makima half is the important part — direct the crew, do not become one of them. Kishibe is the answer to 'will juniors ever learn anything': you drill the loop by hand until it is reflex.",
  "case-studies":
    "EXTENDED. The prepared example, contrasted with what they just watched: same method, more time. Pick ONE to go deep on and name-check the other two.",
  "case-deep-dive":
    "DEEP. Criminal Cookies through all three lenses. The 2.4 seconds to 40ms number is the hook — say it before you explain it. Admit that you also blamed the database first.",
  "dirty-bulk":
    "DEEP. Metrics. The sharpest line is 'numbers that get worse when you cheat.' Good place to mention bot traffic if the room is analytics-minded.",
  "system-warning":
    "DEEP. Dramatic turn. Trigger the Reze Override from the top right and let the room react for a beat before you say anything.",
  "speed-of-thought":
    "DEEP. This is the title of the whole thesis, arriving late on purpose. Slow right down. 'Judgement got expensive because syntax got cheap' is the sentence to land.",
  "hiring-shift":
    "DEEP. Careers. In a student or early-career room this is the most valuable ninety seconds in the deck — consider promoting it verbally even at shorter runtimes by folding the line into Audience of One.",
  "audience-of-one":
    "The turn from technique to career advice. This is the part they repeat to somebody else afterward. Slow down and let each of the three steps land separately.",
  bio: "DEEP. Personal clearance profile. Keep it short and point at the GitHub link.",
  close:
    "Call to action and the DevFest invite. Leave the repo URL on screen while you take questions.",
};
