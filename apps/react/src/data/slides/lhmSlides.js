/**
 * The Reacher Protocol — Elastic Keynote Spine
 *
 * Detroit Latin Heritage Month Innovation Summit — September 19, 2026
 * Google GDG Detroit
 *
 * This is the ONE deck. It runs at 15, 30, or 60 minutes without being rewritten,
 * because length lives in `tier` (see ./runtime.js), not in the content.
 *
 * SHAPE OF THE TALK
 *   1. Cold open + the claim
 *   2. The Reacher formula — why deduction beats typing speed
 *      2b. Chesterton's Fence — the one thing never to let an agent delete
 *   3. THE ASK — the room names a real friction, out loud
 *   4. LAUNCH — the agent starts building that thing, live
 *   5. [ FLEX ZONE: while-it-builds ] — standing room while the agent works
 *   6. PAYOFF — come back, look at what exists now
 *   7. The prepared example — the version that had time to breathe
 *   8. Audience of One — why this scales past you
 *   9. Close
 *
 * The flex zone is the load-bearing idea. A live build takes as long as it
 * takes. Slides 5a-5e are material you can stand on for two minutes or eleven,
 * pulled in from the presenter HUD on demand. You never stall, and you never
 * have to fake it.
 */

import { TIER } from "./runtime";

export const lhmDeckMeta = {
  // Shelved under `lhm-spine`: the id `lhm` is now an alias onto `combined`,
  // which absorbed this spine and adds the character pairings on top of it.
  id: "lhm-spine",
  title: "The Reacher Protocol",
  subtitle: "Critical Deduction & Overwhelming Force in Agentic Dev",
  conference: "Detroit Latin Heritage Month Innovation Summit 2026",
  organization: "Google GDG Detroit",
  date: "September 19, 2026",
  duration: "Elastic — 15 / 30 / 60 min",
  elastic: true,
  defaultRuntime: "lightning",
  accent: "#00ffcc",
  accentAlt: "#ffcc00",
  url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-detroit-latin-heritage-month-innovation-summit/cohost-gdg-detroit/",
};

export const lhmSlides = [
  // ─────────────────────────────────────────────── 1. COLD OPEN
  {
    id: "title",
    type: "title",
    tier: TIER.CORE,
    budget: 45,
    title: "The Reacher Protocol",
    subtitle: "Critical Deduction & Overwhelming Force",
    description:
      "One developer. The deduction of a detective, the leverage of a crew. We are going to build something you name, in this room, in the next few minutes.",
    conferenceBadge: "GDG Detroit • Latin Heritage Month Innovation Summit",
  },

  {
    id: "thesis",
    type: "statement",
    tier: TIER.CORE,
    budget: 75,
    phase: "The Claim",
    center: true,
    title: "The syntax barrier\nis dead.",
    description:
      "Knowing how to type a for-loop stopped being the scarce thing. What is scarce now is knowing WHICH loop, WHY, and being able to tell when the machine hands you something plausible and wrong. Taste and judgement are the whole job.",
    signature: "// Nobody is impressed that you can type.\n// They are impressed that you knew what to build.",
  },

  // ─────────────────────────────────────────────── 2. THE FORMULA
  {
    id: "reacher-formula",
    type: "reacher-intro",
    tier: TIER.CORE,
    budget: 100,
    title: "Intellect of Holmes. Strength of three men.",
    subtitle: "The Jack Reacher Formula for Modern Engineering",
    quote:
      "In an investigation, details matter. You look, you analyze, and when the moment comes, you hit first and you hit hard.",
    traits: [
      {
        title: "Deduce First",
        description:
          "Walk into the crime scene of a broken codebase and read the tire tracks in the stack trace. Find the cause before you touch a line. Most bad AI output is just a bad question asked confidently.",
        icon: "search",
        reacherQuote: "I don't mind the questions. I mind the lies.",
      },
      {
        title: "Then Overwhelming Force",
        description:
          "Once you know the cause, stop typing and start directing. One person doing the structural work of a five-person squad, because the squad is agents and you are the one with the judgement.",
        icon: "lightning",
        reacherQuote: "I like to hit first, and hit hard.",
      },
      {
        title: "Zero Hesitation",
        description:
          "Analysis without execution is just a nice opinion. When the read is locked, move. The gap between knowing and shipping is where most careers quietly stall out.",
        icon: "rocket",
        reacherQuote: "Semicolon purgatory is over.",
      },
    ],
  },

  {
    id: "chestertons-fence",
    type: "character-roster",
    tier: TIER.CORE,
    budget: 100,
    phase: "Deduce First // The Fence",
    title: "Do not tear down the fence.",
    subtitle: "Chesterton's Fence // The rule for every delete",
    lede:
      "There is a fence across a field. It serves no purpose you can see. The reformer says: let us clear it away. The wiser answer is go and find out why it was put there — and when you can tell me that, I may let you take it down.",
    description:
      "When an agent says a block of code is dead, unreachable, or safe to remove, it is reporting a pattern, not a reason — it cannot see the outage that put it there. Confident deletion is the expensive failure mode: the diff looks clean, and the incident arrives a month later. Make it show you the blame line, the ticket, the test that covers it. If nobody can say why the fence is there, that is not permission. That is the investigation.",
    characters: ["finlay"],
  },

  // ─────────────────────────────────────────────── 3. THE ASK  ★ interactive
  {
    id: "the-ask",
    type: "live-build",
    tier: TIER.CORE,
    budget: 120,
    phase: "Live // 01",
    title: "Name something that annoys you.",
    subtitle: "Out loud. Right now.",
    description:
      "Not a startup idea. A small, specific, stupid piece of friction in your actual week. The thing you do by hand every Tuesday. The spreadsheet you hate. The thing you have complained about twice this month.",
    prompts: [
      "What do you do manually that a computer should be doing?",
      "What tab do you have open right now that you resent?",
      "What did you say 'there should be an app for this' about?",
    ],
    speakerCue: "TAKE 2-3 FROM THE ROOM. PICK THE MOST SPECIFIC ONE.",
    ctaText: "Open Agentic Studio",
    ctaLink: "/agentic-studio",
  },

  // ─────────────────────────────────────────────── 4. LAUNCH
  {
    id: "launch-build",
    type: "live-build",
    tier: TIER.CORE,
    budget: 90,
    phase: "Live // 02",
    title: "Now watch it get built.",
    subtitle: "Deduction into force, in public.",
    description:
      "I am going to write one precise prompt — a spec, not a wish — and hand it to the crew. Notice what I put in it and, more importantly, what I leave out. Context is a budget. Every word you waste is memory the agent does not have for your actual problem.",
    prompts: [
      "State the constraint, not the solution.",
      "Name the files. Never paste the whole repo.",
      "Define what 'done' means before you start.",
    ],
    speakerCue: "KICK OFF THE BUILD. THEN OPEN THE FLEX ZONE — F KEY — AND TALK.",
    ctaText: "Open Operatives Sandbox",
    ctaLink: "/operatives",
    opensZone: "while-it-builds",
  },

  // ───────────────────────── 5. FLEX ZONE — standing room while the agent works
  {
    id: "framework-reacher",
    type: "statement",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 90,
    phase: "Framework 01 // Deduction",
    title: "Speed via\nDeduction",
    description:
      "Reacher carries an expired passport and a folding toothbrush. No baggage means nothing slows the read. Applied to code: stop dumping whole files into context. Find the three lines that matter, hand over those, and the answer comes back surgical instead of plausible.",
    signature: "// Reference: next_shopping_cart — localized checkout, zero npm bloat.",
  },

  {
    id: "framework-chainsaw",
    type: "statement",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 90,
    phase: "Framework 02 // Momentum",
    title: "Speed via\nMomentum",
    description:
      "Denji pulls the ripcord and figures it out on the way down. Sometimes the correct move is to generate fast, working, imperfect code and curate it with taste — because seeing a wrong version teaches you what right looks like faster than another hour of planning.",
    signature: "// You are looking at that reference repo right now.",
  },

  {
    id: "framework-iron",
    type: "statement",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 90,
    phase: "Framework 03 // Form",
    title: "Speed via\nForm",
    description:
      "You cannot lift heavy and fast with broken form — you just get hurt sooner. Same with architecture. Strict boundaries and isolated state are not bureaucracy, they are what makes velocity survivable. Sloppy structure means every agent edit has blast radius.",
    signature: "// Reference: pomidor — state machine fully isolated from the UI.",
  },

  {
    id: "roster-110th",
    type: "character-roster",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 105,
    phase: "Roster 01 // The 110th",
    title: "The 110th",
    subtitle: "Special Investigations Unit",
    description:
      "Reacher never worked alone. No single investigator carries every skill — and neither does the crew you direct now. Six habits you can name in a code review.",
    characters: ["reacher", "neagley", "odonnell", "dixon", "franz", "roscoe"],
  },

  {
    id: "roster-division-4",
    type: "character-roster",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 105,
    phase: "Roster 02 // Division 4",
    title: "Division 4",
    subtitle: "Devil Hunters, Public Safety",
    description:
      "The 110th tells you how to read the scene. Division 4 tells you what happens once you move — momentum, the engine worth guarding, and the bill for every shortcut you signed.",
    characters: ["denji", "pochita", "power", "aki", "makima", "reze"],
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
    subtitle: "Context is a budget, not a suggestion",
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
      "Ballmer screamed DEVELOPERS until his voice went. Real leverage is quiet. Every token spent on pleasantries and hedging is memory your agent no longer has for your problem. Cut the filler, keep the precision, strike once.",
    videoUrl: "https://www.youtube.com/watch?v=8fcSviC7cRM",
  },

  {
    id: "zero-bloat",
    type: "zero-bloat",
    flex: true,
    zone: "while-it-builds",
    zoneLabel: "While It Builds",
    tier: TIER.EXTENDED,
    budget: 75,
    title: "The Zero-Bloat Doctrine",
    subtitle: "Sovereignty // You own your stack or it owns you",
    quote: "You don't need a lot of luggage when you know where you're going.",
    description:
      "Eighty packages for a date helper is not productivity, it is a loan. Every dependency is a contract with someone else's release schedule, someone else's security posture, someone else's idea of your roadmap. Modern CSS and native web APIs do more than most people think.",
    photoZoneText: "[ DROP DEADLIFT / TECH PHOTO HERE ]",
    image: "",
  },

  // ─────────────────────────────────────────────── 6. PAYOFF
  {
    id: "payoff",
    type: "live-build",
    tier: TIER.CORE,
    budget: 120,
    phase: "Live // 03",
    title: "That did not exist when we started.",
    subtitle: "Let's read it together.",
    description:
      "It is not finished and it is not perfect — that is the point. The skill on display is not that it generated something. It is that I can look at this and tell you in ten seconds what is wrong with it. That read is the job now.",
    prompts: [
      "What did it get right?",
      "What did it quietly get wrong?",
      "What would you never have caught without reading it?",
    ],
    speakerCue: "BE HONEST ABOUT THE FLAWS. THE AUDIT IS THE DEMO.",
    ctaText: "Open the build",
    ctaLink: "/builder",
  },

  // ─────────────────────────────────────────────── 7. THE PREPARED EXAMPLE
  {
    id: "case-studies",
    type: "case-studies",
    tier: TIER.CORE,
    budget: 135,
    title: "What it looks like with time",
    subtitle: "Proof of Work // Things I actually run",
    items: [
      {
        category: "Guerilla E-Commerce",
        title: "Criminal Cookies",
        problem: "Plugin bloat, monthly SaaS rent, and a checkout that took seconds to respond.",
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
          "Modular finite state machine driving workout cadence. Zero external deps. Runs offline.",
        impact: "Zero-latency state, fully local, on any device.",
        icon: "activity",
      },
      {
        category: "Media Pipeline",
        title: "J. Simmons Prod.",
        problem: "Hours lost every week to manual video encoding across fragmented platforms.",
        solution: "Zero-bloat backend replacing the manual transcode workflow end to end.",
        impact: "Hands-off pipeline. Channels scale without me.",
        icon: "play",
      },
    ],
  },

  // ─────────────────────────────────────────────── 8. THE PARADIGM
  {
    id: "audience-of-one",
    type: "paradigm",
    tier: TIER.CORE,
    budget: 110,
    title: "Build for an Audience of One",
    subtitle: "Paradigm // Then let it scale past you",
    description:
      "The standard advice is to spend six weeks polishing a portfolio site nobody opens. Burn it. Build the thing that fixes your own Tuesday. It will be honest, you will actually maintain it, and it turns out a lot of other people have your Tuesday.",
    steps: [
      {
        step: "01",
        label: "Solve your own friction",
        desc: "Pick the annoyance you have complained about twice. Build the smallest thing that kills it.",
      },
      {
        step: "02",
        label: "Proof beats presentation",
        desc: "One working tool that holds state and solves a real problem says more than any template site.",
      },
      {
        step: "03",
        label: "Audience of Many",
        desc: "Package it, open it up, let people build on your architecture. That is the whole career move.",
      },
    ],
  },

  // ─────────────────────────────────────────────── 9. CLOSE
  {
    id: "close",
    type: "launch",
    tier: TIER.CORE,
    budget: 75,
    title: "Go build your Tuesday.",
    subtitle:
      "Everything on screen tonight is open. Clone it, break it, make it yours. The longer hands-on version runs at Michigan DevFest in November.",
    ctaText: "Start here",
    ctaLink: "/guide",
  },

  // ═══════════════════════════════════════════════ EXTENDED (30 min +)
  {
    id: "context-hierarchy",
    type: "process",
    tier: TIER.EXTENDED,
    budget: 110,
    title: "The Context Hierarchy",
    subtitle: "Architecture // How to actually feed an agent",
    quote:
      '"Beware of unearned wisdom." If you never audit the output, you have outsourced your judgement to someone else\'s server.',
    stages: [
      {
        num: "01",
        name: "1. Investigate",
        detail: "Pull symbols and line numbers. Never dump whole files into context.",
        rule: "Symbol Scoping",
      },
      {
        num: "02",
        name: "2. Deduce",
        detail: "Write a surgical two-file diff against a typed spec and a named root cause.",
        rule: "Surgical Diffs",
      },
      {
        num: "03",
        name: "3. Verify",
        detail: "Test suite plus a production build gate. No human in the loop, no exceptions.",
        rule: "CI Gatekeeper",
      },
    ],
  },

  // ═══════════════════════════════════════════════ DEEP (60 min / keynote)
  {
    id: "system-warning",
    type: "system-warning",
    tier: TIER.DEEP,
    budget: 70,
    title: "Deduction alone is not enough.",
    subtitle: "System Warning // The Velocity Ceiling",
    description:
      "The read can be flawless and still lose. In 2026, executing at human typing speed means being right slowly while someone less careful ships.",
    triggerPrompt: ">> SPEAKER: INITIATE REZE OVERRIDE (TOP RIGHT) <<",
  },

  {
    id: "bio",
    type: "bio",
    tier: TIER.DEEP,
    budget: 75,
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
];

export const lhmPresenterNotes = {
  title:
    "Cold open. Do NOT introduce yourself yet — promise the live build in the first 20 seconds so the room knows something is actually going to happen.",
  thesis:
    "The claim, stated flat. Let it sit for a beat before you explain it. If the room is junior-heavy, lean on 'nobody is impressed that you can type.' If it is senior-heavy, lean on 'plausible and wrong.'",
  "reacher-formula":
    "Three beats: deduce, then force, then no hesitation. Keep it to about 90 seconds — this is setup, not the payoff. The payoff is the live build.",
  "chestertons-fence":
    "CORE. The single most load-bearing new idea in the deck. Tell the parable straight, without setup, and let the room sit in it for a beat before you name Finlay. Then make the turn concrete: the agent says this code is dead, and the agent has never seen the outage that put it there. If you only have time for one line, it is 'if nobody can say why the fence is there, that is not permission — that is the investigation.' Ask for a show of hands: who has deleted something and found out why a week later.",
  "the-ask":
    "TAKE 2-3 ANSWERS FROM THE ROOM. Pick the most SPECIFIC one, not the most ambitious. 'Track my water intake' beats 'an app for healthcare.' If the room is quiet, use your own fallback friction and move — do not let silence stretch.",
  "launch-build":
    "Write the prompt where they can see it. Narrate what you are deliberately NOT including. Kick the build off, then press F to open the flex zone and keep talking. Do not watch the progress bar with them.",
  "framework-reacher":
    "FLEX. Speed via deduction. Drop if the build came back fast.",
  "framework-chainsaw":
    "FLEX. Speed via momentum. Good one to keep — it explains why the imperfect live output is fine.",
  "framework-iron":
    "FLEX. Speed via form. Best one for a senior room.",
  "roster-110th":
    "FLEX. Best standing material in the zone — six cards, so you can burn ninety seconds or twenty. Pick two and move on if the build lands early. Neagley (scope it precisely) and Dixon (measure, do not guess) are the two that survive a cut. Franz is the one to use if the room is security-minded.",
  "roster-division-4":
    "FLEX. The Chainsaw Man half, and the reason the talk is not just Reacher. Power gets the laugh — 'this is your agent on a bad day' — but land on Aki: every shortcut is a contract and the interest comes due on someone else's schedule. Kishibe is held in reserve in src/data/slides/characters.js if you ever need a seventh card.",
  "token-economics":
    "FLEX. The Ballmer contrast. Reliable laugh, and it lands the context-budget point. Optional video clip if the room is warm and you have the time.",
  "zero-bloat":
    "FLEX. The folding toothbrush. Ask how many dependencies they think this app has.",
  payoff:
    "Come back to the build. BE HONEST ABOUT WHAT IS WRONG WITH IT — the audit IS the demo. If the build failed outright, that is still a win: show the failure, read the error out loud, and deduce the cause in front of them. That is a better talk than a clean success.",
  "case-studies":
    "The prepared example. Contrast with what they just watched: same method, more time. Pick ONE to go deep on and name-check the others.",
  "audience-of-one":
    "The turn from technique to career advice. This is the part they will repeat to someone else afterward. Slow down.",
  close:
    "Call to action and the DevFest invite. Leave the repo URL on screen while you take questions.",
  "context-hierarchy":
    "EXTENDED. Investigate, deduce, verify. The verification gate is the non-negotiable — say it that way.",
  "system-warning":
    "DEEP. Dramatic turn. Trigger the Reze Override from the top right and let the room react before you say anything.",
  bio: "DEEP. Personal clearance profile. Keep it short and point at the GitHub link.",
};
