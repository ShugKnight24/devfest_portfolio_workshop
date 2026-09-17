/**
 * Variant 2: PUBLIC SAFETY DIVISION 4 (The Chainsaw Man Lens)
 *
 * Metaphor: Generative AI tools are like Devils—they grant immense,
 * reality-bending power, but if you don't manage contracts and curate chaos,
 * they will eat your codebase alive:
 * - Denji: The Ripcord — Vibe coding. Stop 3-week whiteboarding; pull the cord and start swinging.
 * - Aki: The Contracts — Dependency devil. Every random NPM install trades codebase lifespan.
 * - Makima: The Orchestrator — Agents as tools for macro vision; generate 5, discard 4, merge winner.
 * - Power: The LLM — Pathological liar. Confidently hallucinates non-existent APIs; point her at enemy & verify kill.
 *
 * 60-Minute Masterclass Flow:
 * - Phase 01: Contract Initialized (Curate The Chaos)
 * - Phase 02: Momentum vs Contracts (The Denji Ripcord vs Aki's Tech Debt Contracts)
 * - Phase 03: Power the Pathological Liar (LLM Hallucinations & The Compiler Execution)
 * - Phase 04: The Master Orchestrator (Makima's Multi-Agent Curation)
 * - Phase 05: Telemetry Devils vs Sovereign Truth (Synthetic Web Bots vs Human Intent)
 * - The Final Mandate: What is your dream? Pull the cord.
 */

export const ripcordDeckMeta = {
  id: "ripcord",
  title: "Division 4 // Chainsaw Man Lens",
  subtitle: "Devil Contracts, Chaos Curation & Pure Momentum",
  conference: "60-Min Masterclass",
  organization: "Google GDG & Tech Keynote",
  date: "2026",
  duration: "60 min",
  accent: "#ff0055",
  accentAlt: "#c6ff00",
  variant: "ripcord",
};

export const ripcordPresenterNotes = {
  0: "NOTES: Welcome to Public Safety Division 4. AI gives developers devil powers. If you don't manage contracts and curate chaos, it eats your project alive. [Press N for notes]",
  1: "NOTES: Contrast Denji and Aki. Denji is 'vibe coding'—stop whiteboarding for 3 weeks, pull the cord, and prototype. But Aki reminds us: every random NPM install signs away your codebase's life.",
  2: "NOTES: The crowd will roar for Power. Power is the perfect metaphor for LLMs: immense raw strength, but a pathological liar. She will hallucinate functions with 100% confidence. Verify every kill.",
  3: "NOTES: Makima is orchestration. She doesn't write every line of code; she directs agents toward a macro vision. Generate 5 variations, discard 4, merge the winner. Your taste is the bottleneck.",
  4: "NOTES: Telemetry devil: synthetic bot traffic is exploding. We need sovereign auditing like Datamoon.com to isolate authentic human signal.",
  5: "NOTES: Final Mandate: Denji fought for autonomy and breakfast. You have the ultimate creative engine. Pull the ripcord and build for an Audience of One.",
};

export const ripcordSlides = [
  {
    id: "ripcord-01",
    type: "statement",
    phase: "Contract Initialized",
    title: "Curate The\nChaos.",
    description:
      "We are signing contracts with AI entities that generate syntax faster than humans can read. The modern software engineer is no longer a typist; they are a Curator of Chaos.",
    notes: ripcordPresenterNotes[0],
  },
  {
    id: "ripcord-02",
    type: "comparison",
    phase: "Phase 02 // Momentum vs Contracts",
    title: "Momentum vs Contracts: The Denji Ripcord & Aki",
    description:
      "Move with raw momentum, but beware signing Faustian bargains with unnecessary NPM packages.",
    columns: [
      {
        character: "Denji (The Ripcord)",
        narrative:
          '"Vibe coding." Denji doesn\'t whiteboard system architecture for three weeks. Pull the cord, tell the AI what you want, and start swinging. Get running software on screen in seconds.',
        type: "character",
        boxContent:
          "// The Denji Ripcord Loop\nconst prototype = generateOperative({\n  intent: 'Scrape school newsletter for deadlines',\n  speed: 'speed-of-thought'\n});\nrenderLive(prototype);",
      },
      {
        character: "Aki (The Contracts)",
        narrative:
          "Every time you let an AI install a random NPM dependency, you are signing a contract with the Tech Debt Devil. You trade your codebase's lifespan for a 5-minute shortcut. Keep your stack lean.",
        type: "character",
        boxContent:
          "// Audit the Devil Contract\nconst packageJson = readLocalFile('package.json');\nassert(packageJson.dependencies.length <= 5, 'Reject Faustian dependencies');",
      },
    ],
    notes: ripcordPresenterNotes[1],
  },
  {
    id: "ripcord-03",
    type: "comparison",
    phase: "Phase 03 // The LLM Reality",
    title: "Power (The Pathological LLM)",
    description:
      "Power is immensely capable, but she lies constantly. Treat your LLM like Power: point her at the enemy and verify the kill.",
    columns: [
      {
        character: "Power (The LLM)",
        narrative:
          "Power boasts she has an IQ of 500 and conquered the universe, but she is a pathological liar. This is exactly what an LLM is: it will confidently invent non-existent APIs with plausible variable names. Never take its word without a compiler.",
        type: "character",
        boxContent:
          "// What Power Claims:\nimport { autoReconcileAllTaxes } from 'chase-enterprise-magic';\nautoReconcileAllTaxes(); // Hallucinated package!",
      },
      {
        tag: "The Compiler Execution",
        type: "bad",
        content:
          "AI: \"I implemented the native WebUSB bluetooth bridge you requested!\"\n\nCompiler: \"Error: ReferenceError: WebUSB is not defined in Node.js runtime.\"\n\nVerification: Point the agent at the test suite. If tests fail, send it back.",
        result: "-> Result: Never trust. Always verify with automated compiler gates.",
      },
    ],
    notes: ripcordPresenterNotes[2],
  },
  {
    id: "ripcord-04",
    type: "comparison",
    phase: "Phase 04 // The Orchestrator",
    title: "Makima (The Orchestrator)",
    description:
      "Direct your squad with cold precision. Your personal taste and curation are the only real bottlenecks.",
    columns: [
      {
        character: "Makima's Orchestration",
        narrative:
          "Makima views everyone as a tool to achieve a macro vision. In the age of agentic software, you don't fight in the trenches of syntax. You generate 5 candidate architectures, discard 4, and merge the winner.",
        type: "character",
        boxContent:
          "// Multi-Agent Curation\nconst [archA, archB, archC] = await Promise.all([\n  spawnAgent('Minimal Vanilla JS'),\n  spawnAgent('State Machine Micro-Loop'),\n  spawnAgent('Native SQLite Engine')\n]);\nreturn mergeWinner(archB);",
      },
      {
        character: "Kishibe's Truth",
        narrative:
          '"The hunters the devils fear most are the ones with a screw loose." Stop writing software to please enterprise recruiters with buzzword-stuffed portfolios. Build weird, potent, bespoke software that solves your life.',
        type: "character",
        boxContent:
          "// Bespoke Sovereignty\nbuildForAudienceOfOne({\n  target: 'My acute daily friction',\n  corporateApproval: false,\n  taste: 'uncompromising'\n});",
      },
    ],
    notes: ripcordPresenterNotes[3],
  },
  {
    id: "ripcord-05",
    type: "comparison",
    phase: "Phase 05 // The Telemetry Devil",
    title: "Synthetic Chaos vs Sovereign Truth",
    description:
      "Synthetic bot traffic is poisoning web metrics. Forensic telemetry isolates genuine human signal.",
    columns: [
      {
        tag: "The Telemetry Devil",
        type: "bad",
        content:
          "AI crawlers and scraping loops now account for >50% of web traffic. Web analytics dashboards are lying to developers about user growth and engagement.",
        result: "-> Result: Synthetic hallucinations corrupting product roadmaps.",
      },
      {
        tag: "Sovereign Truth",
        type: "good",
        content:
          "Sovereign telemetry (Datamoon.com): Client-side behavioral heuristics that isolate human mouse movement and authentic intent from synthetic headless browsers.",
        result: "-> Result: 100% verified human proof of work.",
      },
    ],
    notes: ripcordPresenterNotes[4],
  },
  {
    id: "ripcord-06",
    type: "statement",
    phase: "The Mandate",
    title: "What is\nyour dream?",
    subtitle: "PULL THE RIPCORD // BUILD FOR AN AUDIENCE OF ONE",
    description:
      "Denji fought for basic autonomy, good food, and a decent life. You have the most powerful creative engine in human history at your fingertips. Stop asking for permission. Pull the cord.",
    signature:
      "github.com/shugknight24 // Datamoon.com\n[ VERIFIED ] ¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯ [ VERIFIED ]",
    notes: ripcordPresenterNotes[5],
    center: true,
  },
];
