/**
 * Variant 1: THE 110th SPECIAL INVESTIGATORS (The Reacher Lens)
 *
 * Metaphor: Reacher (the AI execution engine) is a blunt force instrument.
 * But an investigation requires a squad:
 * - Finlay: Rigid structure, strict typings, CI/CD pipeline demanding proof.
 * - Roscoe: Deep local roots, intuition, domain expertise, Audience of One.
 * - Neagley: Pure efficiency, zero bloat, isolated pure functions.
 * - Dixon: Pattern recognition, forensic data telemetry.
 * - O'Donnell: Ceramic switchblade, micro-utilities bypassing bloat.
 *
 * 60-Minute Masterclass Flow:
 * - Phase 01: The Paradigm (Assemble The Investigators)
 * - Phase 02: Token Economics (The Reacher Protocol vs. The Neagley Precision)
 * - Phase 03: Domain Expertise (The Finlay Architecture vs. The Roscoe Advantage)
 * - Phase 04: The Specialist Tools (O'Donnell's Switchblade vs. Dixon's Telemetry)
 * - The Mandate: Take the Shot
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
  0: "NOTES: Welcome them. Point out that solo coding is over. You are now the leader of an AI squad. The $60B Cursor buyout proves code is a commodity. [Press N to hide/show notes. Arrow keys to navigate.]",
  1: "NOTES: Contrast the bloated 'Civilian' prompt with the 'Investigator' prompt. Reacher only deals in facts. Neagley only deals in isolated, untainted execution.",
  2: "NOTES: Use Finlay to talk about strict TypeScript/Enterprise devs who demand facts (logs/errors). Use Roscoe to talk about the 'Audience of One' — building tools for your own specific, local problems that AI can't invent on its own (like Criminal Cookies).",
  3: "NOTES: O'Donnell is the reminder that small, perfectly crafted tools (switchblades) bypass bloated corporate metal detectors. Dixon is the numbers person. If the evidence is corrupt (bot traffic), the investigation fails. Sovereign telemetry is the solution.",
  4: "NOTES: End with massive fire. Remind them that they are the lead investigator of their own lives and careers. They have the team (AI). Now they must lead.",
};

export const nomadSlides = [
  {
    id: "nomad-01",
    type: "statement",
    phase: "Phase 01 // The Paradigm",
    title: "Assemble The\nInvestigators.",
    description:
      "The syntax barrier is dead. We are having conversations with computers that code better than we do. But if you don't orchestrate them with strict discipline, you lose the plot.",
    notes: nomadPresenterNotes[0],
  },
  {
    id: "nomad-02",
    type: "comparison",
    phase: "Phase 02 // Token Economics",
    title: "Token Economics",
    description:
      "Every token wasted is memory forgotten. Reacher brings blunt force; Neagley brings surgical isolation.",
    columns: [
      {
        character: "The Reacher Protocol",
        narrative:
          '"Reacher said nothing." Stop talking to the machine like it\'s human. Every polite word wastes context memory. Be surgical.',
        tag: "Civilian Prompt",
        type: "bad",
        content:
          '"Hi AI, could you please help me write a tracker? Make it nice!"',
        result: "-> Result: Hallucinates 5 NPM packages.",
      },
      {
        character: "The Neagley Precision",
        narrative:
          '"Neagley never misses." She doesn\'t like to be touched. These are your isolated, pure functions. Zero dependencies. Absolute precision execution.',
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
    phase: "Phase 03 // Domain Expertise",
    title: "Domain Expertise",
    description:
      "Global AI models need localized grounding and strict invariant verification.",
    columns: [
      {
        character: "The Finlay Architecture",
        narrative:
          "Finlay is by-the-book. Strict typings. Legacy rules. He relies on evidence and facts. Don't ask AI to 'fix the bug'—give it the exact stack trace. Finlay is your CI/CD pipeline demanding proof.",
        type: "character",
        boxContent:
          "// CI/CD Automated Gate\nconst verified = auditCompiler(diff);\nif (!verified.isValid) throw new ForensicError();",
      },
      {
        character: "The Roscoe Advantage",
        narrative:
          "Roscoe has deep local roots. AI has global knowledge, but it doesn't know your specific problem. Domain expertise is your ultimate moat. Build for an Audience of One.",
        type: "character",
        boxContent:
          "// Audience of One Moat\nconst localContext = loadDomainSpecialization();\nexecuteSovereignWorkflow(localContext);",
      },
    ],
    notes: nomadPresenterNotes[2],
  },
  {
    id: "nomad-04",
    type: "comparison",
    phase: "Phase 04 // The Specialist Tools",
    title: "The Specialist Tools",
    description:
      "Deploy localized micro-utilities and audit the telemetry crime scene.",
    columns: [
      {
        character: "O'Donnell's Switchblade",
        narrative:
          "O'Donnell wears a corporate suit now, but still carries a ceramic switchblade to bypass metal detectors. Build micro-utilities. Avoid monolithic AWS frameworks when a localized SQLite database will do.",
        type: "character",
        boxContent:
          "// Ceramic Switchblade Utility\nconst db = new LocalSQLite(':memory:');\nexport const runAudit = () => db.exec(query);",
      },
      {
        character: "Dixon's Telemetry",
        narrative:
          "Dixon finds the pattern in the numbers. AI bots generate +6,900% more web traffic today. Your dashboards are lying. Sovereign forensic telemetry is how we isolate human intent from agentic noise.",
        type: "character",
        boxContent:
          "// Forensic Telemetry Filter\nconst isHuman = telemetry.detectFingerprint(req);\nif (!isHuman) quarantineBotTraffic(req);",
      },
    ],
    notes: nomadPresenterNotes[3],
  },
  {
    id: "nomad-05",
    type: "statement",
    phase: "The Mandate",
    title: "Take the\nShot.",
    description:
      "There is no 'right or wrong' way to code anymore. There is only what survives contact with reality. Stop waiting for permission. Investigate. Execute. Ship.",
    signature:
      "github.com/shugknight24\n[ VERIFIED ] ¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯ [ VERIFIED ]",
    notes: nomadPresenterNotes[4],
    center: true,
  },
];
