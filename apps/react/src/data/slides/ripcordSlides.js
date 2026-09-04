/**
 * Variant 2: PUBLIC SAFETY DIVISION 4 (The Chainsaw Man Lens)
 *
 * Metaphor: Generative AI tools are like Devils—they grant immense,
 * reality-bending power, but if you don't manage contracts and curate chaos,
 * they will eat your codebase alive:
 * - Denji: Momentum over whiteboard theory; pull the cord and vibe code.
 * - Aki: Disciplined contracts; dependencies are deals with devils.
 * - Power: Pure generative chaos; hallucinates with extreme confidence, requires audits.
 * - Makima: The Master Orchestrator; directs agentic squads, taste & curation bottleneck.
 * - Kishibe: The grizzled veteran; burn the resume, build bespoke tools for an Audience of One.
 *
 * 60-Minute Masterclass Flow:
 * - Phase 01: Contract Initialized (Manage The Chaos)
 * - Phase 02: Momentum vs Contracts (The Denji Ripcord vs. The Aki Contracts)
 * - Phase 03: Generative AI (The Power Paradigm vs. The Hallucination)
 * - Phase 04: The Orchestrator (Makima's Orchestration vs. The Kishibe Truth)
 * - Phase 05: The Reality (The Telemetry Devil vs. Sovereign Truth)
 * - The Final Mandate: What is your dream?
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
  0: "NOTES: Welcome them. Set the stage: The tech industry right now is chaotic. Just like CSM, the ones who survive are the ones who learn how to wield the chaos, not hide from it. [Press N to hide/show notes]",
  1: "NOTES: Contrast Denji's raw momentum with Aki's rigid contracts. Tell them to move fast like Denji, but be careful of the 'Tech Debt Devils' like Aki. Keep the stack lean.",
  2: "NOTES: The crowd will love the Power analogy. We all know LLMs act exactly like her. They lie to our faces to look good. We have to be the adults in the room auditing the compiler.",
  3: "NOTES: You are Makima (hopefully less evil). You aren't laying bricks; you are directing the team. Kishibe is the ultimate senior dev. You have to be fearless to throw away old habits.",
  4: "NOTES: Defeat the 'Telemetry Devil' (bot traffic). We have to own our data with sovereign auditing.",
  5: "NOTES: End on massive inspiration. Computers don't have dreams, humans do. Use the tools to build your life with absolute fire.",
};

export const ripcordSlides = [
  {
    id: "ripcord-01",
    type: "statement",
    phase: "Contract Initialized",
    title: "Manage The\nChaos.",
    description:
      "We are making contracts with AI entities that code better than we do. The blank page is a trap. The modern developer doesn't write syntax; they curate chaos.",
    notes: ripcordPresenterNotes[0],
  },
  {
    id: "ripcord-02",
    type: "comparison",
    phase: "Phase 02 // Momentum vs Contracts",
    title: "Momentum vs Contracts",
    description:
      "Move fast with the ripcord, but audit your dependency contracts before they eat your codebase.",
    columns: [
      {
        character: "The Denji Ripcord",
        narrative:
          "Denji has no formal training. He just pulls the cord and swings. Stop whiteboarding architecture for 3 weeks. 'Vibe code.' Get the prototype on screen and iterate with momentum.",
        type: "character",
        boxContent:
          "// The Ripcord Loop\nconst prototype = generatePrototype(idea);\nrenderLiveFeedback(prototype);",
      },
      {
        character: "The Aki Contracts",
        narrative:
          "Aki pays a physical price for his power. Dependencies are contracts. Every time you let an AI hallucinate 10 NPM packages into your code, you trade your codebase's lifespan for a shortcut.",
        type: "character",
        boxContent:
          "// Audit the Contract\nconst deps = auditPackageJson();\nassert(deps.length === 0, 'No Faustian dependencies');",
      },
    ],
    notes: ripcordPresenterNotes[1],
  },
  {
    id: "ripcord-03",
    type: "comparison",
    phase: "Phase 03 // Generative AI",
    title: "Generative AI & Hallucinations",
    description:
      "Power is raw capability coupled with confident deception. Audit every line.",
    columns: [
      {
        character: "The Power Paradigm",
        narrative:
          "Power is pure chaos. She's incredibly strong, but she lies about her stats and needs constant babysitting. This is your LLM. It will confidently hallucinate functions that don't exist. You must point it at the enemy and verify the kill.",
        type: "character",
      },
      {
        tag: "The Hallucination",
        type: "bad",
        content:
          'AI: "I imported the proprietary API you asked for!"\n\nYou: "This repository hasn\'t existed since 2019."',
        result: "-> Result: Confident falsehood requiring compiler audit.",
      },
    ],
    notes: ripcordPresenterNotes[2],
  },
  {
    id: "ripcord-04",
    type: "comparison",
    phase: "Phase 04 // The Orchestrator",
    title: "The Orchestrator",
    description:
      "Taste and curation are the only bottlenecks. Direct your agents fearlessly.",
    columns: [
      {
        character: "Makima's Orchestration",
        narrative:
          "Makima views agents as tools to achieve a macro vision. Your taste and curation are now the only bottlenecks. Be the orchestrator. Generate 4 architecture variations, discard 3, merge the winner.",
        type: "character",
        boxContent:
          "// Agent Orchestration Loop\nconst candidates = await Promise.all(agents.map(a => a.propose()));\nconst winner = curateBestArchitecture(candidates);",
      },
      {
        character: "The Kishibe Truth",
        narrative:
          '"The devils fear the hunters with a screw loose." To survive the AI wave, you have to be slightly crazy. Burn the resume. Build bespoke software for an Audience of One.',
        type: "character",
        boxContent:
          "// Bespoke Sovereignty\nbuildForAudienceOfOne({\n  targetUser: 'myself',\n  moat: 'uncompromising taste'\n});",
      },
    ],
    notes: ripcordPresenterNotes[3],
  },
  {
    id: "ripcord-05",
    type: "comparison",
    phase: "Phase 05 // The Reality",
    title: "The Reality",
    description:
      "The web is flooded with synthetic agent noise. Sovereign auditing is required.",
    columns: [
      {
        tag: "The Telemetry Devil",
        type: "bad",
        content:
          "Bot traffic is destroying web analytics. The agentic loops are creating synthetic noise everywhere.",
        result: "-> Result: Poisoned dashboards and hallucinated growth metrics.",
      },
      {
        tag: "Sovereign Truth",
        type: "good",
        content:
          "You need sovereign truth. Sovereign forensic telemetry is how we survive the noise and prove our proof of work is real.",
        result: "-> Result: 100% verified human intent isolated from bot clutter.",
      },
    ],
    notes: ripcordPresenterNotes[4],
  },
  {
    id: "ripcord-06",
    type: "statement",
    phase: "The Mandate",
    title: "What is\nyour dream?",
    description:
      "Denji fought for basic autonomy. You have the most powerful creative engine in human history at your fingertips. Stop waiting. Pull the cord.",
    signature:
      "github.com/shugknight24\n[ VERIFIED ] ¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯ [ VERIFIED ]",
    notes: ripcordPresenterNotes[5],
    center: true,
  },
];
