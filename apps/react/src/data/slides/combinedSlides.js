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
 * THE COMMUNITY THROUGHLINE
 * -------------------------
 * This talk follows Umelo Onyejiaka's "AI Won't Replace Community: Why We Still
 * Need to Learn Together". He makes the case for why we still need each other;
 * this deck is what you build for each other. The bridge opens the talk, and
 * the thread closes it:
 *
 *   umelo-bridge      Umelo gave the why. This is the what.
 *   crew-and-unit     agents are the crew, people are the unit
 *   the-110th         collaboration, accountability, local knowledge
 *   division-4        mentorship, shared experience, access (and its price)
 *   audience-of-one   Audience of One -> Audience of Many is the community move
 *   build-on-it       what makes a thing someone else can build on
 *   find-your-110th   how the unit actually forms
 *   close             help, meet, ship something others can build on
 *
 * ELASTIC
 * -------
 * Length is a VIEW over this deck, not a rewrite of it (see ./runtime.js).
 * Every slide declares a `tier`, and every non-lab slide an `altitude`:
 *
 *   lightning      30 min   CORE + EXTENDED. The argument, the bridge, the live
 *                           build with its standing pairings, the close.
 *   keynote        40 min   concept slides only, to DEEP. Frameworks, characters
 *                           as metaphor, community, the shift. No live build.
 *   standard       60 min   everything to DEEP: ideas, craft and evidence.
 *   workshopShort  90 min   standard plus the two `short` labs, in pairs.
 *   workshopFull   3 h      standard plus every lab, a break and show and tell.
 *
 * Altitude is opt-in: an untagged slide never reaches the keynote. A test
 * enforces that every non-lab slide here carries one.
 *
 * FLEX ZONE — `while-it-builds`
 * ----------------------------
 * A live build takes as long as it takes. The three pairings that work best as
 * standing material (Reacher/Neagley, Denji/Aki, Power) sit in a zone that
 * lightning already budgets for; the deep end of the zone (zero bloat, the
 * reserve roster, and a turn-to-your-neighbour beat) is opened on demand from
 * the HUD when the build runs long. You never stall, and you never fake it.
 */

import { TIER, ALTITUDE, LAB_TRACK } from "./runtime";

const { CONCEPT, TACTICAL } = ALTITUDE;

export const combinedDeckMeta = {
  id: "combined",
  title: "Read the Scene. Pull the Cord.",
  subtitle: "Building at the speed of AI, without building alone",
  conference: "Detroit Latin Heritage Month Innovation Summit 2026",
  organization: "Google GDG Detroit",
  date: "September 19, 2026",
  duration: "Elastic — 30 / 40 / 60 min talk, 90 min / 3 h workshop",
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
    altitude: CONCEPT,
    budget: 45,
    title: "Read the Scene.\nPull the Cord.",
    subtitle: "Building at the speed of AI, without building alone",
    description:
      "One developer directing a crew. In a few minutes this room is going to name something that annoys you, out loud, and we are going to build it on stage.",
    conferenceBadge: "GDG Detroit • Latin Heritage Month Innovation Summit",
  },

  {
    id: "umelo-bridge",
    type: "statement",
    tier: TIER.CORE,
    altitude: CONCEPT,
    budget: 90,
    phase: "Building on Umelo Onyejiaka // AI Won't Replace Community",
    title: "Umelo gave you the why.\nThis is the what.",
    description:
      "Umelo Onyejiaka just made the case that AI can hand you answers, but mentorship, accountability, collaboration and a way in still come from people. I am not going to make that case again. I am going to show you what a community does with it: one person solves their own friction, then builds it so the person beside them can run it, and build on it.",
    signature:
      "// Umelo: why we still need to learn together.\n// This talk: what we build for each other, now that one person can build almost anything.",
  },

  {
    id: "thesis",
    type: "statement",
    tier: TIER.CORE,
    altitude: CONCEPT,
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
    altitude: CONCEPT,
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
    altitude: CONCEPT,
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
          "Once the cause is named, stop typing and start directing. One person doing the structural work of a five-person squad, because the squad is agents — and the judgement stays with you and the people you trust.",
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
    altitude: CONCEPT,
    budget: 90,
    phase: "Deduce First // The Fence",
    title: "Do not tear down the fence.",
    subtitle: "Chesterton's Fence // The rule for every delete",
    lede: "There is a fence across a field. It serves no purpose you can see. The reformer says: let us clear it away. The wiser answer is go and find out why it was put there — and when you can tell me that, I may let you take it down.",
    description:
      "When an agent calls a block dead, unreachable, or safe to remove, it is reporting a pattern, not a reason. It has never seen the outage that put the line there. Make it show you the blame line, the ticket, the test — or go ask the person who was there. If nobody can say why the fence is there, that is not permission. That is the investigation.",
    characters: ["finlay"],
  },

  {
    id: "incident-story",
    type: "statement",
    tier: TIER.DEEP,
    altitude: CONCEPT,
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
    altitude: CONCEPT,
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
    altitude: TACTICAL,
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
    altitude: TACTICAL,
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
    altitude: TACTICAL,
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
    altitude: TACTICAL,
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
    altitude: CONCEPT,
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
    altitude: CONCEPT,
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
    id: "zero-bloat",
    type: "zero-bloat",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.DEEP,
    altitude: CONCEPT,
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
    altitude: CONCEPT,
    budget: 95,
    phase: "Reserves // For a build that runs long",
    title: "Three you have not used yet.",
    subtitle: "Provenance, the core primitive, and the rule about speed",
    description:
      "The crew is bigger than the pairings. These three cover the things that only hurt later: unverified provenance, an unguarded core, and velocity spent before the read was locked.",
    characters: ["franz", "pochita", "reze"],
  },

  {
    id: "meet-your-row",
    type: "poll",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.DEEP,
    altitude: TACTICAL,
    budget: 90,
    title: "The agent is working. You are not.",
    subtitle: "Ninety seconds. Turn to someone you did not come with.",
    polls: [
      {
        id: "friction",
        question: "What did you almost shout out as your friction?",
        followUp: "Compare lists. If yours overlap, you just found a collaborator.",
      },
      {
        id: "building",
        question: "What are you building right now, even badly?",
        followUp: "A running ugly thing starts a better conversation than a job title.",
      },
      {
        id: "solved",
        question: "Who do you know who has already solved this?",
        followUp: "That is local knowledge. Trade a name before the build comes back.",
      },
      {
        id: "run-it",
        question: "What would you need to run their thing on your machine?",
        followUp: "Whatever they answer is the first line of their README.",
      },
    ],
  },
  // ───────────────────────────── /FLEX ZONE ────────────────────────────────

  {
    id: "payoff",
    type: "live-build",
    tier: TIER.CORE,
    altitude: TACTICAL,
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

  // ─────────── LAB (both workshops): the room does what it just watched ──────
  {
    id: "lab-friction-pairs",
    type: "lab",
    tier: TIER.LAB,
    labTrack: LAB_TRACK.SHORT,
    budget: 600,
    badge: "LAB // IN PAIRS // 10 MIN",
    title: "The Friction Audit, in pairs",
    subtitle: "Find the real Tuesday — yours and theirs",
    description:
      "Pair with someone you did not arrive with. Each of you writes three chores you redo by hand every week. Then swap lists: your partner picks the most specific one on yours and interrogates it the way Finlay and Roscoe would.",
    objective:
      "Leave with one friction each, sharpened by someone else's questions — and a partner for the next lab.",
    fileTarget: "friction.txt",
    terminalLines: [
      "> friction.txt  // three chores, not three startups",
      "> partner asks: when exactly does this happen, and what do you do by hand?",
      "> partner asks: what broke last time, and who else has this problem?",
      "[LOCKED] One friction each. Evidence, not adjectives.",
    ],
    actionLink: "/operatives",
    actionLabel: "Open Operatives Sandbox",
  },

  // ═══════════════════════════════════════════ ACT III — THE METHOD
  {
    id: "prompt-anatomy",
    type: "comparison",
    tier: TIER.DEEP,
    altitude: TACTICAL,
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
    id: "lab-prompt-clinic",
    type: "lab",
    tier: TIER.LAB,
    labTrack: LAB_TRACK.FULL,
    budget: 600,
    badge: "LAB // IN PAIRS // 10 MIN",
    title: "The Prompt Clinic, peer-reviewed",
    subtitle: "Constraints, not wishes — edited by the person they serve",
    description:
      "Write the prompt for your partner's friction before anything runs, then hand it over. Your partner plays Neagley: strikes every word that is not a goal, a file, a constraint or a definition of done — and adds the one detail only they could know.",
    objective:
      "A four-line prompt (Goal, Files, Constraint, Done when) that the person it is for has signed off on.",
    fileTarget: "prompt_blueprint.md",
    terminalLines: [
      "- could you build something that helps with my newsletter thing?",
      "+ Goal:       dates and action items from the weekly school email",
      "+ Constraint: standard library only. Zero new dependencies",
      "+ Done when:  sample_email.txt produces four dated items",
      "[REVIEWED] Partner added: dates arrive as 'Tues 9/23', never ISO.",
    ],
    actionLink: "/agentic-studio",
    actionLabel: "Open the Prompt Clinic",
  },

  {
    id: "failure-modes",
    type: "comparison",
    tier: TIER.DEEP,
    altitude: TACTICAL,
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
    altitude: TACTICAL,
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
          "Read all of it. If the diff is too large to read, the task was too large to delegate — that is a scoping failure, not a reviewing failure. Ask for one step, stop, check the form, then the next.",
        rule: "Human gate",
      },
    ],
  },

  {
    id: "lab-build-for-partner",
    type: "lab",
    tier: TIER.LAB,
    labTrack: LAB_TRACK.SHORT,
    budget: 1200,
    badge: "LAB // IN PAIRS // 20 MIN",
    title: "Build your partner's Tuesday",
    subtitle: "You direct the crew. They are the acceptance test.",
    description:
      "Swap frictions. You build the smallest thing that kills your partner's chore, not your own. You direct the agent; your partner is Roscoe — the local knowledge and the only judge of done. It counts when it works on their input, not yours.",
    objective:
      "A running v0 that your partner confirms fixes their friction, on their real data, through all three gates.",
    fileTarget: "operative/",
    terminalLines: [
      "> Goal:       partner's friction, in partner's words",
      "> Files:      one new file. Nothing else moves",
      "> Constraint: no new dependencies",
      "> Done when:  partner runs it on their input and says yes",
      "[HANDOFF] Built by one person. Verified by the person it is for.",
    ],
    actionLink: "/agentic-studio",
    actionLabel: "Open Agentic Studio",
  },

  {
    id: "lab-review-swap",
    type: "lab",
    tier: TIER.LAB,
    labTrack: LAB_TRACK.FULL,
    budget: 600,
    badge: "LAB // IN PAIRS // 10 MIN",
    title: "Read each other's diff",
    subtitle: "Two readers catch what one merges",
    description:
      "Trade laptops. Read the code the agent wrote for your partner as if you will be the one paged for it. Hunt for two things: a Power moment — something fluent that nobody actually ran — and a fence — a line neither of you can explain.",
    objective:
      "Each pair names one confident mistake and one unexplained line, and writes a failing test for the mistake.",
    fileTarget: "operative/*.test.*",
    terminalLines: [
      "> git diff --stat   // too big to read? the task was too big",
      "> look for: imports nobody asked for, helpers nobody named",
      "> write the red test first, then let the agent fix it",
      "[CAUGHT] The bug the author was sure was not there.",
    ],
    actionLink: "/operatives",
    actionLabel: "Open Operatives Sandbox",
  },

  {
    id: "break",
    type: "statement",
    tier: TIER.LAB,
    labTrack: LAB_TRACK.FULL,
    budget: 900,
    phase: "Break // 15 minutes",
    center: true,
    title: "Fifteen minutes.\nGo meet someone.",
    description:
      "Refill, stretch, and find one person whose build you have not seen yet. Ask them what broke. The next hour goes faster when you know who in this room has already solved your problem.",
    signature: "// Back in fifteen.\n// Bring back one name you did not have before.",
  },

  {
    id: "pair-odonnell-dixon",
    type: "comparison",
    tier: TIER.EXTENDED,
    altitude: TACTICAL,
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
    id: "tear-it-down",
    type: "statement",
    tier: TIER.DEEP,
    altitude: CONCEPT,
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
    altitude: TACTICAL,
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
    id: "lab-second-sprint",
    type: "lab",
    tier: TIER.LAB,
    labTrack: LAB_TRACK.FULL,
    budget: 1200,
    badge: "LAB // SOLO, THEN PAIRS // 20 MIN",
    title: "Delete v0. Build it again.",
    subtitle: "House rules first, then the rebuild",
    description:
      "v0 already did its job: it showed you the real shape of the problem. Write the house rules file first — conventions, the one test command, the paths it may not touch. Then throw v0 away and rebuild against those rules until your partner's red test goes green.",
    objective:
      "A second version, built from a committed rules file, that passes the failing test your partner wrote.",
    fileTarget: "AGENTS.md",
    terminalLines: [
      "> git rm -r v0/   // sunk cost is not a review argument",
      "> AGENTS.md: conventions, one test command, off-limits paths",
      "> npm run test:run",
      "[GREEN] Partner's red test passes. v0 did its job and is gone.",
    ],
    actionLink: "/agentic-studio",
    actionLabel: "Open Agentic Studio",
  },

  {
    id: "when-not-to-agent",
    type: "comparison",
    tier: TIER.DEEP,
    altitude: CONCEPT,
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
    altitude: CONCEPT,
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
    id: "case-deep-dive",
    type: "process",
    tier: TIER.DEEP,
    altitude: TACTICAL,
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
    id: "system-warning",
    type: "system-warning",
    tier: TIER.DEEP,
    altitude: CONCEPT,
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
    altitude: CONCEPT,
    budget: 110,
    phase: "The Turn // The Only Metric",
    title: "Idea to running\nthing.",
    description:
      "The only velocity number that has ever mattered is the distance between having the thought and watching it run. It used to be weeks, and most of those weeks were typing and waiting for permission. It is now an afternoon, and almost all of that afternoon is deciding. That is the entire shift: judgement got expensive because syntax got cheap.",
    signature:
      "// Coding at the speed of thought is not a slogan.\n// It is a stopwatch, and you can start it today.",
  },

  // ═══════════════════════════════════════════ ACT VI — THE UNIT
  {
    id: "crew-and-unit",
    type: "comparison",
    tier: TIER.EXTENDED,
    altitude: CONCEPT,
    budget: 95,
    phase: "Community // Crew and Unit",
    title: "Agents are the crew. People are the unit.",
    description:
      "An agent multiplies how much one person can build. It does not decide what is worth building, and it cannot catch the mistake it is confident about. Those are jobs for people who know you.",
    columns: [
      {
        character: "The crew — agents",
        narrative:
          "Tireless, parallel, and it has read more code than everyone in this room combined. Three designs before lunch. It has also never been to the outage, never met your users, and sounds exactly as sure when it is wrong. A crew amplifies whatever direction it is pointed in, including the wrong one.",
        type: "character",
        boxContent:
          "// What the crew gives you\n- reach: one person, five workstreams\n- speed: idea to running thing today\n- no idea why the fence is there",
      },
      {
        character: "The unit — people",
        narrative:
          "Reacher can clear a room alone, and on every hard case he calls the 110th anyway. The unit is who remembers the incident behind the fence, who says 'that package was deprecated' before you merge, and who tells you the thing is not worth building at all.",
        type: "character",
        boxContent:
          "// What only the unit gives you\n- what is worth building, and for whom\n- the history behind the fence\n- 'you ran it? show me.'",
      },
    ],
  },

  {
    id: "the-110th",
    type: "process",
    tier: TIER.DEEP,
    altitude: CONCEPT,
    budget: 100,
    subtitle: "COMMUNITY // THE 110TH IS A UNIT",
    title: "Reacher never works a hard case alone.",
    quote:
      "He could take the case by himself. When the case is real, he calls the squad — because the squad sees what he cannot.",
    stages: [
      {
        num: "01",
        name: "Collaboration",
        detail:
          "Dixon follows the money, O'Donnell brings the right tool, Neagley reads the files. Nobody is the whole investigation. The skill you are missing is somebody else's ordinary Tuesday — ask them, and trade them yours.",
        rule: "The squad",
      },
      {
        num: "02",
        name: "Accountability",
        detail:
          "Neagley does not flatter him. She checks his read against the facts and says so when it does not hold. Find the person who will read your diff and ask whether you ran it. An agent is built to agree with you.",
        rule: "Neagley",
      },
      {
        num: "03",
        name: "Local knowledge",
        detail:
          "Roscoe knows the town: who owns what, who lies, what happened last winter. You cannot search for it and no model was trained on it. Your Roscoe already shipped to the users you are guessing about — and is probably at this summit.",
        rule: "Roscoe",
      },
    ],
  },

  {
    id: "division-4",
    type: "process",
    tier: TIER.DEEP,
    altitude: CONCEPT,
    budget: 100,
    subtitle: "COMMUNITY // DIVISION 4 IS A FOUND FAMILY",
    title: "Nobody in Division 4 makes it alone.",
    quote:
      "Denji, Power and Aki end up sharing one apartment. None of them chose it. It is still the reason any of them get better.",
    stages: [
      {
        num: "01",
        name: "Mentorship",
        detail:
          "Kishibe does not hand out answers. He drills fundamentals until they are reflex and tells you exactly what skipping them costs. An agent will explain anything on demand. A mentor decides what you need to struggle with first.",
        rule: "Kishibe",
      },
      {
        num: "02",
        name: "Shared experience",
        detail:
          "Same kitchen, same missions, same bad days. They learn each other's habits by living next to them, not from a manual. A study group or a meetup that actually talks gives you the same thing: people who were there when it broke.",
        rule: "The apartment",
      },
      {
        num: "03",
        name: "Access to opportunity",
        detail:
          "Makima's network opens every door, and every door leads back to her. Access is real and it matters. But a network that only flows toward one person is not a community — it is control. Build the kind that flows both ways.",
        rule: "Makima — read the terms",
      },
    ],
  },

  {
    id: "hiring-shift",
    type: "statement",
    tier: TIER.DEEP,
    altitude: CONCEPT,
    budget: 110,
    phase: "The Turn // Careers",
    title: "Nobody is hiring\na typist.",
    description:
      "The portfolio site with a hero section and three invented projects is finished as a signal — anyone can generate that in an afternoon now, and everybody on the other side of the table knows it. What survives a screen is a tool you actually run, that holds state, that somebody other than you depends on. Bring the thing, bring the reasoning that produced it, and bring the person who used it and will say it worked.",
    signature:
      "// Show the artifact. Then show the read that made it.\n// The reference that lands is from someone who ran your code.",
  },

  {
    id: "audience-of-one",
    type: "paradigm",
    tier: TIER.CORE,
    altitude: CONCEPT,
    budget: 100,
    title: "Audience of One. Then Audience of Many.",
    subtitle: "The community move // Your friction first, then theirs",
    description:
      "Skip six weeks polishing a portfolio nobody opens. Build the thing that fixes your own Tuesday — it will be honest, and you will actually maintain it. Then do the part that connects this talk to Umelo's: put it in the hands of the people around you. A lot of them have your Tuesday.",
    steps: [
      {
        step: "01",
        label: "Solve your own friction",
        desc: "Pick the annoyance you have complained about twice. Build the smallest thing that kills it.",
      },
      {
        step: "02",
        label: "Put it in someone's hands",
        desc: "One person beside you runs it without your help. Whatever breaks for them is what makes it real.",
      },
      {
        step: "03",
        label: "Audience of Many",
        desc: "Open it up so people can use it and build on it. The community you learn with becomes the community you build for.",
      },
    ],
  },

  {
    id: "build-on-it",
    type: "process",
    tier: TIER.EXTENDED,
    altitude: CONCEPT,
    budget: 95,
    subtitle: "AUDIENCE OF MANY // WHAT MAKES A THING BUILDABLE",
    title: "Build it so someone can build on it.",
    quote:
      "A tool only you can run is a diary entry. The moment a stranger can run it, fix it, and bend it to their own week, you have started something bigger than a project.",
    stages: [
      {
        num: "01",
        name: "Runs on their machine",
        detail:
          "Clone, one install, one run. No secrets baked in, no 'works on my laptop'. If the first five minutes need you in the room, nobody gets past them.",
        rule: "One command",
      },
      {
        num: "02",
        name: "Readable in one sitting",
        detail:
          "The same test you hold an agent's diff to, now applied for strangers. People only build on what they understand, and twenty lines they can read beat a framework they have to trust.",
        rule: "Switchblade test",
      },
      {
        num: "03",
        name: "A seam to extend",
        detail:
          "A config file, a data file, one documented function to swap. Name the one place someone else should change it for their own use. That seam is the invitation.",
        rule: "Leave a door open",
      },
    ],
  },

  {
    id: "lab-publish",
    type: "lab",
    tier: TIER.LAB,
    labTrack: LAB_TRACK.FULL,
    budget: 900,
    badge: "LAB // IN PAIRS // 15 MIN",
    title: "Publish it so someone can build on it",
    subtitle: "Audience of One, handed over",
    description:
      "Push it. Write a README that takes a stranger from clone to running in one command, and name the one seam where someone should change it for their own week. Then the real test: your partner clones it on their machine and runs it without asking you a single question.",
    objective:
      "A public repository your partner ran cold, with a documented seam that someone else can extend.",
    fileTarget: "README.md",
    terminalLines: [
      "> git push origin main",
      "> README: install, one command to run, one example input",
      "> SEAM: edit rules.json to fit your own week",
      "> partner: git clone <your-repo> && npm install && npm start",
      "[AUDIENCE OF MANY] It ran on a machine that is not yours.",
    ],
    actionLink: "/showcase",
    actionLabel: "View Community Blueprints",
  },

  {
    id: "find-your-110th",
    type: "paradigm",
    tier: TIER.DEEP,
    altitude: CONCEPT,
    budget: 90,
    title: "Find your 110th. Or start one.",
    subtitle: "Community // How a unit actually forms",
    description:
      "Nobody gets pulled into a unit for being promising. You get pulled in because you kept showing up, you brought something that runs, and you had already helped somebody.",
    steps: [
      {
        step: "01",
        label: "Show up twice",
        desc: "This room counts. GDG, the meetup, the hackathon. The second visit is when people learn your name and remember what you were building.",
      },
      {
        step: "02",
        label: "Bring something that runs",
        desc: "Nobody can help with an intention. Show a working tool, even an ugly one, and someone will say: I built something like that, here is what broke.",
      },
      {
        step: "03",
        label: "Be someone's Neagley first",
        desc: "Review a stranger's pull request. Answer the question you were stuck on last year. The way into a unit is being useful to it before you need it.",
      },
    ],
  },

  {
    id: "lab-show-and-tell",
    type: "lab",
    tier: TIER.LAB,
    labTrack: LAB_TRACK.FULL,
    budget: 1200,
    badge: "LAB // THE WHOLE ROOM // 20 MIN",
    title: "Show & Tell",
    subtitle: "Run it in front of people, then hand it over",
    description:
      "Volunteers, two minutes each. Show the input, hit enter, show the output. Then two sentences: what your partner caught that you missed, and who in this room should fork it next.",
    objective:
      "Demo a live tool, credit the person who made it better, and name the next person to build on it.",
    fileTarget: "blueprints/",
    terminalLines: [
      "> input:   the real CSV, the real email, the real Tuesday",
      "> output:  running, on screen — ugly is fine",
      "> credit:  what my partner caught",
      "> handoff: who should fork this next",
      "[COMMUNITY SYNC] One became many.",
    ],
    actionLink: "/showcase",
    actionLabel: "View Community Blueprints",
  },

  {
    id: "bio",
    type: "bio",
    tier: TIER.DEEP,
    altitude: CONCEPT,
    budget: 60,
    title: "Clearance Level: Admin",
    name: "Shugmi Shumunov",
    role: "Software Engineer & Founder @ Shumunov Solutions",
    details: [
      "Software Engineer & Founder @ Shumunov Solutions — Detroit, MI",
      "Web performance, developer sovereignty, and heavy deadlifts.",
      "Building bespoke tools for an Audience of One, then handing them over.",
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
    altitude: CONCEPT,
    budget: 75,
    title: "Build your Tuesday. Then hand it over.",
    subtitle:
      "Before you leave: meet the person next to you and ask what they still do by hand. This month, help one person get unstuck. Then ship one thing a stranger can run and build on. Everything on screen today is open — clone it, break it, make it yours. The hands-on version runs at Michigan DevFest in November.",
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
  "umelo-bridge":
    "CORE. Say his full name out loud — Umelo Onyejiaka — and the title of his session, 'AI Won't Replace Community.' Then reference ONE specific point from it: his argument that AI can provide answers, but community provides mentorship, accountability, shared experience, collaboration and access to opportunity. Pick whichever of those he actually spent the most time on in the room and name that one. Do not quote him unless you heard the exact words yourself. Then the hand-off, flat: 'Umelo gave you the why. I am going to show you the what.' Under ninety seconds; do not re-argue his talk.",
  thesis:
    "The claim, stated flat, then a beat of silence before you explain it. Junior-heavy room: lean on 'nobody is impressed that you can type.' Senior-heavy room: lean on 'plausible and wrong.'",
  "three-frameworks":
    "EXTENDED. The map for the whole talk — deduce, move, hold form. Say all three out loud once and promise that each one gets a pairing later. Ninety seconds maximum; this is a signpost, not a section.",
  "reacher-formula":
    "Three beats: deduce, then force, then no hesitation. About ninety seconds. Plant the phrase 'the people you trust' in the force beat — it pays off in the community act. This is setup; do not linger.",
  "chestertons-fence":
    "CORE and load-bearing. Tell the parable straight, with no setup, and let it sit before you name Finlay. Then make the turn concrete: the agent says the code is dead, and the agent has never seen the outage that put it there. If you have one line, it is 'if nobody can say why the fence is there, that is not permission — that is the investigation.' Point out that the fastest way to learn why is often a person, not a tool. Show of hands: who has deleted something and found out why a week later.",
  "incident-story":
    "DEEP. The fence slide with a bill attached. Tell it as a story, in past tense, and own that you approved the diff. Do not soften it — the room trusts the rest of the talk more once you have paid for one of these. Land on 'it was wrong about the history.'",
  "pair-finlay-roscoe":
    "EXTENDED. The two gaps: provenance and locality. Concrete ask for the room — next time you open a chat, write the failing test name first. If the room is enterprise-heavy, Roscoe is the stronger half: the model has never met their users.",
  "context-hierarchy":
    "EXTENDED, tactical. Investigate, deduce, verify. The verification gate is the non-negotiable and you should say it in exactly that tone. This is the slide people photograph.",
  "the-ask":
    "TAKE 2-3 ANSWERS FROM THE ROOM. Pick the most SPECIFIC one, never the most ambitious — 'track my water intake' beats 'an app for healthcare.' If the room is quiet for four seconds, use your own fallback friction and move on; do not let the silence stretch. Thank the person by name if they give it — you are building for them now, not for yourself.",
  "launch-build":
    "Write the prompt where they can see it and narrate what you are deliberately leaving out. Kick the build off, then press F to open the flex zone and keep talking. Do not watch the progress bar with them. If you want a bigger swing, take an audience condition live — 'what should happen when the timer hits zero' — and speak the prompt out loud.",
  "pair-reacher-neagley":
    "FLEX. Best opener for the zone because it explains the prompt they just watched you write. Read the civilian prompt in a cheerful voice; it gets the laugh and makes the point for free.",
  "pair-denji-aki":
    "FLEX. Momentum and the bill for it. Aki is the half that lands with senior engineers — the interest comes due on a schedule you do not choose, usually during an incident. Ask how many dependencies they think this app has.",
  "pair-power":
    "FLEX. Reliable laugh, serious point. 'This is your agent on a bad day.' Land on the rule: confidence is a writing style, not evidence. If you did not run it, it did not happen.",
  "zero-bloat":
    "FLEX, DEEP. The folding toothbrush. Short. Good one to drop first if the build comes back early.",
  "roster-reserves":
    "FLEX, DEEP. Three cards, so it stretches or compresses. Use it only if the build is running genuinely long. Franz is the one for a security-minded room; Pochita for anyone maintaining a platform; Reze for the room that wants permission to go fast.",
  "meet-your-row":
    "FLEX, DEEP. The best use of a slow build: the agent is working, so the room should be too. Give them a real ninety seconds, time it, and do not talk over it. Pick ONE question if the room is shy — the first one works best. Walk to the front row and do it yourself. When the build lands, ask one pair what they found in common.",
  payoff:
    "Come back to the build. BE HONEST ABOUT WHAT IS WRONG WITH IT — the audit IS the demo. If the build failed outright, that is still a win: show the failure, read the error out loud, and deduce the cause in front of them. That is a better talk than a clean success. Ask the person whose friction it was whether it would actually fix their week.",
  "lab-friction-pairs":
    "LAB, SHORT TRACK (10m). Both workshops. Make them pair with someone they did NOT arrive with — say it twice. Circulate and disqualify 'a CRM for my manager': the test is whether they have complained about it out loud before today. At the eight-minute mark, tell them to keep the same partner for the build lab.",
  "prompt-anatomy":
    "DEEP, tactical. Put the actual prompt from tonight's build on screen if you can. Spend more time on the right-hand card than the left — what you left out is the part nobody teaches.",
  "lab-prompt-clinic":
    "LAB, FULL TRACK (10m). Three-hour workshop only. The partner edits, not the author — that is the whole exercise. Pick one pair to read their before and after out loud. The detail only the partner could add (the date format, the weird input) is the moment to point at.",
  "failure-modes":
    "DEEP, tactical. The quiet failure is the whole point of the slide. Ask: who has merged something that did exactly what was asked and still broke a customer. Wait for the hands.",
  "verification-gate":
    "DEEP, tactical. Say 'no exceptions' the way you would mean it in a code review. The 'if the diff is too large to read, the task was too large to delegate' line is the one that gets quoted back to you. The step-stop-check sentence replaces the old ego-lifting slide; say it like a spotter.",
  "lab-build-for-partner":
    "LAB, SHORT TRACK (20m). Both workshops. The twist is that nobody builds their own idea — they build their partner's, and the partner decides when it is done. When an agent gets stuck, do NOT fix it for them; ask what the error actually says. Countdown on screen. At the end, ask for one partner who said 'yes, that is my Tuesday.'",
  "lab-review-swap":
    "LAB, FULL TRACK (10m). Trade laptops, physically. The goal is one Power moment and one fence per pair. Ask the room for the most confidently wrong line anyone found — it is always funny and always instructive. Make sure every pair leaves with a red test; the next lab depends on it.",
  break:
    "BREAK, FULL TRACK (15m). Three-hour workshop only. Put a visible countdown on screen. Before they scatter, repeat the ask: find one person whose build you have not seen and learn what broke. Start again on time — the second half has the publishing lab and show and tell.",
  "pair-odonnell-dixon":
    "EXTENDED, tactical. Small tools and real numbers. Dixon is the half to push in a performance-minded room: the bottleneck is never where the confident engineer says it is, and agents are extremely confident engineers.",
  "tear-it-down":
    "DEEP. Hypertrophy. The real content is the second half — people defend generated code in review because they own it, not because it is good. Name that out loud; it is uncomfortable and true.",
  "teach-the-crew":
    "DEEP, tactical. The most immediately actionable slide in the deck. Tell them to go write the conventions file this week. If they are on a team, this is the slide that justifies the whole talk to their manager — and a committed rules file is how a new teammate onboards too, not just an agent.",
  "lab-second-sprint":
    "LAB, FULL TRACK (20m). Three-hour workshop only. Enforce the order: rules file BEFORE the rebuild. People will want to patch v0 instead of deleting it; that reluctance is exactly the tear-it-down slide, so name it. Done means the partner's red test from the review lab is green.",
  "when-not-to-agent":
    "DEEP. The maturity beat. Reversibility, not difficulty, is the line. One-way migrations and auth boundaries are the two examples that always land.",
  "pair-makima-kishibe":
    "EXTENDED. Orchestration plus fundamentals. The warning inside the Makima half is the important part — direct the crew, do not become one of them. Kishibe is the answer to 'will juniors ever learn anything': you drill the loop by hand until it is reflex. Both come back in the community act, so do not spend them fully here.",
  "case-deep-dive":
    "DEEP, tactical. Criminal Cookies through all three lenses. The 2.4 seconds to 40ms number is the hook — say it before you explain it. Admit that you also blamed the database first. Name-check Jacked Alien and the J. Simmons pipeline in one sentence as the other tools you run daily.",
  "system-warning":
    "DEEP. Dramatic turn. Trigger the Reze Override from the top right and let the room react for a beat before you say anything.",
  "speed-of-thought":
    "DEEP. This is the title of the whole thesis, arriving late on purpose. Slow right down. 'Judgement got expensive because syntax got cheap' is the sentence to land. Then the pivot into the next act: 'and one person at that speed is still one person.'",
  "crew-and-unit":
    "EXTENDED. The community act starts here, and it is the slide that ties the talk back to Umelo. Agents amplify one person's reach; people decide what is worth building and catch what the agent gets confidently wrong. Call back explicitly to two earlier beats: the fence (someone remembers why) and Power (someone asks whether you ran it). Do not moralise — describe the division of labour.",
  "the-110th":
    "DEEP. Reframe the characters: these were never lone heroes. Collaboration, accountability, local knowledge. If Umelo's session is fresh, say that two of his five — collaboration and accountability — are right here. Roscoe's line about already shipping to your users works best if you point at the room.",
  "division-4":
    "DEEP. The other three of Umelo's five: mentorship, shared experience, access to opportunity. Kishibe gets the respect; the apartment gets the warmth; Makima gets the warning. Slow down on 'a network that only flows toward one person is not a community — it is control.' That is the line people will argue about afterwards, which is good.",
  "hiring-shift":
    "DEEP. Careers. In a student or early-career room this is the most valuable ninety seconds in the deck — consider promoting it verbally even at shorter runtimes by folding the line into Audience of One. The new last sentence is the community point: the strongest reference is someone who actually used your tool.",
  "audience-of-one":
    "CORE. The turn from technique to career and community. Say out loud that Audience of One to Audience of Many is the literal bridge between Umelo's talk and this one: solve your own friction, then build it so others can use it and build on it. Slow down and let each of the three steps land separately.",
  "build-on-it":
    "EXTENDED. Make 'build something others can build on' concrete, or it is just a slogan. Three tests: runs on their machine, readable in one sitting, a seam to extend. Ask the room: whose side project could a stranger run right now in one command? Expect very few hands; that is the point.",
  "lab-publish":
    "LAB, FULL TRACK (15m). Three-hour workshop only. The partner clones cold and is not allowed to ask questions — every question they would have asked goes into the README. Celebrate the first pair who gets a clean cold run.",
  "find-your-110th":
    "DEEP. Practical and specific, not inspirational. Show up twice; bring something that runs; be someone's Neagley first. Mention GDG Detroit by name as a real place to show up twice. Keep it under ninety seconds.",
  "lab-show-and-tell":
    "LAB, FULL TRACK (20m). Three-hour workshop only. Call up volunteers, two minutes each, hard stop. Input, enter, output. Celebrate every working tool, including the ugly ones. Insist on the two sentences: what the partner caught, and who should fork it next. That credit is the whole workshop in miniature.",
  bio: "DEEP. Personal clearance profile. Thirty seconds at most — the room already knows who you are by now. Point at the GitHub link.",
  close:
    "CORE. The call to action, in order: meet the person next to you right now, help one person get unstuck this month, ship one thing a stranger can build on. Then the DevFest invite. Leave the repo URL on screen while you take questions, and if time allows, literally pause for fifteen seconds so people turn to their neighbour.",
};
