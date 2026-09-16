/**
 * Lightning Strike — The Sovereign Agent (25-Minute Tactical Dossier)
 * Detroit Latin Heritage Month Innovation Summit 2026 & DevFest
 *
 * Theme: "Personal AI Agents for an Audience of One"
 *
 * Flow:
 * 0:00 - 4:00  | Phase 01: The Hook — Burn the SaaS & The Paradigm Shift
 * 4:00 - 15:00 | Phase 02: The Showstopper — Live Speed of Thought Demo (IDE Mirror)
 * 15:00 - 20:00| Phase 03: The Architecture of Chaos — The Squad Commander
 * 20:00 - 25:00| Phase 04: The Sovereign Community — Blueprint Exchange & Pull the Ripcord
 */

export const lightningDeckMeta = {
  id: "lightning",
  title: "The Sovereign Agent // Lightning Strike (25m)",
  subtitle: "Personal AI Agents for an Audience of One",
  conference: "Detroit Latin Heritage Month Innovation Summit 2026",
  organization: "Google GDG Detroit",
  date: "September 19, 2026",
  duration: "25 min",
  url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-detroit-latin-heritage-month-innovation-summit/cohost-gdg-detroit/",
};

export const lightningSlides = [
  {
    id: "lightning-title",
    type: "title",
    title: "The Sovereign Agent",
    subtitle: "Personal AI Agents for an Audience of One",
    description:
      "The syntax barrier is dead. When execution cost drops to zero, the most valuable software you can build is for an Audience of One: You.",
    conferenceBadge: "25-Minute High-Adrenaline Keynote // GDG Detroit",
  },
  {
    id: "lightning-hook",
    type: "comparison",
    phase: "0:00 - 4:00 // The Hook",
    title: 'Burn the SaaS // "Reacher Said Nothing"',
    subtitle: "Reclaiming Autonomy from Bloated Subscriptions",
    description:
      "We spend 8 hours a day building enterprise B2B SaaS for corporate giants, and then go home and manage our personal lives with bloated, $15/month subscriptions that never fit our needs.",
    columns: [
      {
        character: "The Corporate Loop",
        narrative:
          "Paying $15/month per seat for generic SaaS that leaks your private data, tracks your usage, and breaks every quarterly update.",
        tag: "Corporate Trap",
        type: "bad",
        content:
          "// The Monthly Subscription Tax\nconst personalLife = {\n  taskTracker: '$15/mo',\n  recipeCompiler: '$9/mo',\n  csvParser: '$29/mo (enterprise)',\n  privacy: 'zero'\n};",
        result: "-> Result: Endless recurring bills for 5% of features.",
      },
      {
        character: "The Sovereign Operative",
        narrative:
          "Zero execution cost. You write constraints, the AI produces single-file native utilities running 100% locally on your machine.",
        tag: "Audience of One",
        type: "good",
        content:
          "// Sovereign Audience of One\nconst operative = buildBespokeTool({\n  user: 'myself',\n  cost: '$0.00',\n  dependencies: 'native only',\n  speed: 'instant'\n});",
        result: "-> Result: 100% tailored software that you own forever.",
      },
    ],
  },
  {
    id: "lightning-live-demo",
    type: "process",
    phase: "4:00 - 15:00 // The Showstopper",
    subtitle: "MIRROR THE IDE (CURSOR / WINDSURF)",
    title: "Live Speed of Thought Demo",
    quote:
      '"Watch my thought process. I\'m not writing syntax. I\'m defining constraints. I moved at the speed of thought."',
    stages: [
      {
        num: "01",
        name: "The Ask (Audience Crowdsource)",
        detail:
          'Ask the room: "Who here has a tedious, soul-crushing daily digital task? Not for your boss—for you." (Messy bank CSVs, scraping school newsletters, meal prep macros).',
        rule: "Identify Acute Friction",
      },
      {
        num: "02",
        name: "The Prompt (Constraint Engineering)",
        detail:
          "Prompt live: 'Target: Python script. Goal: Parse local CSVs and group by date. Constraints: Native OS libraries only, zero external dependencies. Execute.'",
        rule: "Define Strict Boundaries",
      },
      {
        num: "03",
        name: "The Magic (15-Second Delivery)",
        detail:
          "Hit enter. Let code generate in 15 seconds. Execute it in terminal. Watch the room gasp: 'I didn't have to remember file watcher syntax. I moved at the speed of thought.'",
        rule: "Immediate Verification",
      },
    ],
  },
  {
    id: "lightning-architecture",
    type: "comparison",
    phase: "15:00 - 20:00 // Architecture",
    title: "The Architecture of Chaos",
    subtitle: "From Solo Coder to Squad Commander",
    description:
      "Speed without discipline is disaster. Scale personal operatives by orchestrating an AI squad with strict separation of roles.",
    columns: [
      {
        character: "Makima (Curating Chaos)",
        narrative:
          "View agents as tools to achieve a macro vision. Generate 5 architectures, discard 4, merge the winner. Your taste and curation are the only bottlenecks.",
        type: "character",
        boxContent:
          "// Macro Orchestration\nconst candidates = await spawnAgents(5);\nconst winner = curateBestArchitecture(candidates);",
      },
      {
        character: "Neagley (Zero-Bloat Execution)",
        narrative:
          "She doesn't like to be touched. Pure isolated efficiency. Real deployed proof: pomidor (tactical focus timer) & next_shopping_cart (high-frequency checkout).",
        type: "character",
        boxContent:
          "// Verified Sovereign Repos\nimport { Pomidor } from 'shugknight24/pomodoro';\nimport { Cart } from 'shugknight24/criminal-cookies';",
      },
    ],
  },
  {
    id: "lightning-community",
    type: "statement",
    phase: "20:00 - 25:00 // Call to Action",
    title: "The Sovereign\nMovement.",
    subtitle: "PULL THE RIPCORD // SHARE THE BLUEPRINTS",
    description:
      "We don't need venture capital to build software that matters. We just need each other. You build a bespoke focus timer, I build a high-speed checkout cart, and we share the blueprints.",
    signature:
      "github.com/shugknight24 // Datamoon.com\n[ VERIFIED ] ¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯ [ VERIFIED ]",
    center: true,
  },
  {
    id: "lightning-clearance",
    type: "bio",
    title: "Clearance Profile",
    name: "Shugmi Shumunov",
    role: "Software Engineer & Builder @ Shumunov Solutions",
    details: [
      "github.com/shugknight24 | datamoon.com",
      "Obsessed with web performance, developer sovereignty, and heavy deadlifts.",
      "Beyond the static portfolio: building bespoke software tools for an Audience of One.",
    ],
    why: [
      "To replace passive resumes with sovereign, production-grade tools.",
      "To demonstrate surgical deduction before applying overwhelming force.",
    ],
    jackpot: "¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯ // VERIFIED",
    photoZoneText: "[ DROP PORTRAIT PHOTO HERE ]",
    image: "/assets/images/shug_headshot.jpg",
  },
];

export const lightningPresenterNotes = {
  "lightning-title":
    "0:00 - Walk on stage with high energy. Declare: The syntax barrier is dead. Today we talk about Personal AI Agents for an Audience of One.",
  "lightning-hook":
    "1:30 - Attack the SaaS tax. Why are we building enterprise platforms all day only to pay $15/mo for clunky personal tools that leak our data?",
  "lightning-live-demo":
    "4:00 - Switch slides off. Mirror IDE. Solicit real audience digital task. Type strict constraint prompt. Generate in 15 seconds and run it live.",
  "lightning-architecture":
    "15:00 - Explain how you prevent chaos: Makima curates multiple drafts; Neagley demands zero NPM dependencies. Show real repos: pomidor & criminal-cookies.",
  "lightning-community":
    "20:00 - Rally the room. We are building an open-source collective of sovereign operatives. Point to GitHub & Datamoon. Tell them: Pull the ripcord.",
  "lightning-clearance":
    "24:00 - Final clearance slide. Open floor for questions or invite them to the hands-on workshop sprint.",
};
