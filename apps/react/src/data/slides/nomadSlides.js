/**
 * Variant 1: THE 110th SPECIAL INVESTIGATORS (The Reacher Lens)
 *
 * Metaphor: Reacher (the AI execution engine) is a blunt force instrument.
 * But an investigation requires a squad:
 * - Reacher: The Deduction Engine — Carries no baggage. Deduces root cause instantly.
 * - Finlay: The Guardrails — Tweed suit, follows rules, demands facts. Strict TS & Vitest suite.
 * - Neagley: The Execution — Pure isolated efficiency. Micro-utilities, zero unnecessary NPM packages.
 * - Roscoe: The Local Moat — Margrave expertise. Hyper-local domain knowledge is your only moat.
 * - O'Donnell: The Switchblade — Ceramic switchblade bypassing corporate metal detectors. Bespoke scripts (pomidor).
 * - Dixon: The Telemetry — Pattern in numbers. Datamoon.com isolating human intent from bot traffic.
 *
 * 60-Minute Masterclass Flow:
 * - Phase 01: The Paradigm (Assemble The Investigators)
 * - Phase 02: Deduction vs Execution (Reacher the Deduction Engine vs Neagley Pure Execution)
 * - Phase 03: Guardrails & Local Moats (Finlay's Guardrails vs Roscoe's Local Moat)
 * - Phase 04: The Specialist Tools (O'Donnell's Switchblade vs Dixon's Forensic Telemetry)
 * - The Mandate: Take the Shot (Sovereign Software for an Audience of One)
 */

export const nomadDeckMeta = {
  id: "nomad",
  title: "The 110th // Special Investigators Lens",
  subtitle: "Squad Orchestration, Token Economics & Surgical Deduction",
  conference: "60-Min Masterclass",
  organization: "Google GDG & Tech Keynote",
  date: "2026",
  duration: "60 min",
  accent: "#00e5ff",
  accentAlt: "#ffaa00",
  variant: "nomad",
};

export const nomadPresenterNotes = {
  0: "NOTES: Welcome them. You are no longer a solo developer typing syntax; you are the Commander of the 110th Special Investigators. Code is a commodity. Orchestration is power. [Press N to toggle notes]",
  1: "NOTES: Phase 02: Introduce Reacher and Neagley. Reacher deduces the root cause with zero baggage. Neagley demands pure isolation and zero dependencies. Contrast the civilian prompt with the investigator prompt.",
  2: "NOTES: Phase 03: Finlay wears tweed, follows rules, and demands proof. He is your strict TypeScript and Vitest compiler keeping Power/LLMs honest. Roscoe knows Margrave—your local domain knowledge is your only moat against generic foundation models.",
  3: "NOTES: Phase 04: O'Donnell carries a ceramic switchblade (bespoke micro-tools like pomidor). Dixon audits the numbers when web telemetry is overrun by synthetic AI bots (Datamoon.com).",
  4: "NOTES: The Mandate: You have the squad. Stop asking for permission from enterprise gatekeepers. Build for an Audience of One and ship.",
};

export const nomadSlides = [
  {
    id: "nomad-01",
    type: "statement",
    phase: "Phase 01 // The Paradigm",
    title: "Assemble The\nInvestigators.",
    description:
      "The syntax barrier is dead. When anyone can generate code, the differentiator is orchestration. You are the Commander of an elite investigative unit.",
    notes: nomadPresenterNotes[0],
  },
  {
    id: "nomad-02",
    type: "comparison",
    phase: "Phase 02 // Deduction & Execution",
    title: "The Deduction Engine & Pure Execution",
    description:
      "Reacher brings zero baggage and ruthless root-cause deduction; Neagley brings pure isolated efficiency.",
    columns: [
      {
        character: "Reacher (The Deduction Engine)",
        narrative:
          'Carries no baggage. Needs no toothbrush. Looks at a 5,000-line chaotic codebase and deduces the exact root cause in seconds. "Reacher said nothing." Eliminates all polite token fluff.',
        tag: "Civilian Prompt",
        type: "bad",
        content:
          '"Hi AI, could you please help me write a tracker? Make it nice!"',
        result: "-> Result: Hallucinates 5 NPM packages.",
      },
      {
        character: "Neagley (The Execution)",
        narrative:
          '"Neagley never misses." She doesn\'t like to be touched. Represents isolated pure functions, decoupled state machines, and zero unnecessary NPM dependencies. Absolute execution.',
        tag: "Investigator Prompt",
        type: "good",
        content:
          "Target: auth.ts\nConstraints: Vanilla JS, Zero deps.\nOutput: Diff only.",
        result: "-> Result: Exact execution. Zero bloat.",
      },
    ],
    notes: nomadPresenterNotes[1],
  },
  {
    id: "nomad-03",
    type: "comparison",
    phase: "Phase 03 // Guardrails & Local Moat",
    title: "The Guardrails & The Local Moat",
    description:
      "Enterprise AI tools hallucinate globally. Finlay forces verification; Roscoe provides the hyper-local domain moat.",
    columns: [
      {
        character: "Finlay (The Guardrails)",
        narrative:
          "Finlay wears a three-piece tweed suit, follows procedure, and demands facts. AI agents hallucinate constantly. Finlay is your strict TypeScript interfaces, your Vitest suite, and your compiler gatekeeper.",
        type: "character",
        boxContent:
          "// Finlay Verification Gate\ninterface Transaction {\n  readonly id: string;\n  readonly amountCents: number;\n  readonly timestamp: number;\n}\nexpect(auditLedger(input)).toMatchSnapshot();",
      },
      {
        character: "Roscoe (The Local Moat)",
        narrative:
          "Roscoe knows Margrave, Georgia inside and out. Foundation models know Wikipedia and StackOverflow, but they know nothing about your children's school schedule, your fitness regime, or your acute daily friction. Hyper-local context is your moat.",
        type: "character",
        boxContent:
          "// Roscoe Local Context Moat\nconst personalContext = {\n  familyCalendar: readLocalICS(),\n  groceryTaxPayer: 'MI_RESIDENT',\n  strictNutrientProfile: loadLocalMacros()\n};",
      },
    ],
    notes: nomadPresenterNotes[2],
  },
  {
    id: "nomad-04",
    type: "comparison",
    phase: "Phase 04 // The Specialist Tools",
    title: "The Switchblade & The Telemetry",
    description:
      "Bypass monolithic corporate bloat with bespoke switchblade scripts, and isolate synthetic bot noise with forensic telemetry.",
    columns: [
      {
        character: "O'Donnell (The Switchblade)",
        narrative:
          "O'Donnell wears a corporate suit now, but carries a ceramic switchblade to bypass airport metal detectors. These are your bespoke micro-utilities (like pomidor) engineered to replace bloated $15/mo SaaS.",
        type: "character",
        boxContent:
          "// O'Donnell Ceramic Switchblade (pomidor)\nexport const timerCore = (duration) => ({\n  start: () => performance.now(),\n  remaining: (start) => Math.max(0, duration - (performance.now() - start))\n});",
      },
      {
        character: "Dixon (The Telemetry)",
        narrative:
          "Dixon finds the hidden pattern in the financial numbers. AI agents and scrapers generate massive synthetic web traffic. Dixon is Datamoon.com—isolating verified human intent from synthetic noise.",
        type: "character",
        boxContent:
          "// Dixon Forensic Telemetry\nconst fingerprint = evaluateClientIntegrity(request);\nif (fingerprint.isSyntheticBot) {\n  quarantineSyntheticTraffic(request);\n}",
      },
    ],
    notes: nomadPresenterNotes[3],
  },
  {
    id: "nomad-05",
    type: "statement",
    phase: "The Mandate",
    title: "Take the\nShot.",
    subtitle: "COMMAND THE SQUAD // RECLAIM YOUR LIFE",
    description:
      "You don't need permission from corporate managers or venture capitalists. You have the 110th Special Investigators at your side. Deduce the friction. Enforce the guardrails. Build for an Audience of One.",
    signature:
      "github.com/shugknight24 // Datamoon.com\n[ VERIFIED ] ¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯ [ VERIFIED ]",
    notes: nomadPresenterNotes[4],
    center: true,
  },
];
