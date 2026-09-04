/**
 * Master Keynote: THE TRILOGY ENSEMBLE (The 110th x Division 4 x The Iron Protocol)
 *
 * Combining the three character ensembles into an epic 3-act masterclass:
 * - Prologue: The Reality (Assemble the Investigators / Manage the Chaos)
 * - Act I: The 110th Special Investigators (Reacher, Neagley, Finlay, Roscoe, O'Donnell, Dixon)
 * - Act II: Public Safety Division 4 (Denji, Aki, Power, Makima, Kishibe)
 * - Act III: The Iron Protocol (Progressive Overload, Isolation Sets, Hypertrophy, The True Scale)
 * - Climax: The Telemetry Crisis (Synthetic Chaos vs. Sovereign Truth)
 * - Epilogue: The Commander's Mandate (Take the Shot, Pull the Cord, Lock It Out)
 */

export const combinedDeckMeta = {
  id: "combined",
  title: "The Trilogy Ensemble // The 110th x Division 4 x The Iron",
  subtitle: "Master Keynote: Squad Orchestration, Devil Contracts & Cognitive Hypertrophy",
  conference: "60-Min Masterclass",
  organization: "Google GDG & Tech Keynote",
  date: "2026",
  duration: "60 min",
  accent: "#00e5ff",
  accentAlt: "#ff0055",
  variant: "combined",
};

export const combinedPresenterNotes = {
  0: "NOTES: Welcome to the master session. Today we fuse three mental models: The 110th Special Investigators (Reacher squad deduction), Public Safety Division 4 (Chainsaw Man contracts and chaos), and The Iron Protocol (Bodybuilding overload and form). [Press N for notes]",
  1: "NOTES: ACT I - The 110th. Reacher brings blunt force; Neagley brings pure isolated execution. Cut civilian token bloat.",
  2: "NOTES: Finlay demands stack traces and strict proof; Roscoe builds for the local problem (Audience of One).",
  3: "NOTES: O'Donnell carries a ceramic switchblade (micro-utilities). Dixon audits the numbers when evidence is corrupt.",
  4: "NOTES: ACT II - Division 4. Denji vibes with momentum, but Aki warns that every dependency is a contract with a devil.",
  5: "NOTES: Power is your LLM: brilliant, powerful, but lies to your face. You must audit the compiler.",
  6: "NOTES: Makima orchestrates agents; taste and curation are your only bottlenecks. Kishibe builds bespoke tools with zero fear.",
  7: "NOTES: ACT III - The Iron Protocol. AI is steroids for developers—you need progressive overload and cognitive hypertrophy.",
  8: "NOTES: Ego lifting crashes codebases; isolation sets build unbreakable systems.",
  9: "NOTES: Hypertrophy. Don't be afraid to delete generated code. Never skip leg day (automated testing).",
  10: "NOTES: The Mirror vs The Scale. The dirty bulk of bloated monorepos vs. sovereign forensic auditing.",
  11: "NOTES: The Final Mandate. You are the commander of the squad. Take the shot. Pull the cord. Step up to the platform.",
};

export const combinedSlides = [
  {
    id: "combined-01",
    type: "statement",
    phase: "Prologue // The Paradigm",
    title: "Assemble The\nInvestigators.",
    description:
      "The syntax barrier is dead. Solo coding is over. You are now the Commander of an AI squad directing agents with different roles, different flaws, and different strengths.",
    notes: combinedPresenterNotes[0],
  },
  {
    id: "combined-02",
    type: "comparison",
    phase: "Act I // Token Economics",
    title: "The Reacher Protocol vs. Neagley",
    description:
      "Reacher brings blunt force; Neagley brings surgical isolation. Stop civilian token waste.",
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
    notes: combinedPresenterNotes[1],
  },
  {
    id: "combined-03",
    type: "comparison",
    phase: "Act I // Domain Expertise",
    title: "The Finlay Architecture vs. Roscoe",
    description:
      "Combine strict automated CI/CD verification with intimate local domain knowledge.",
    columns: [
      {
        character: "The Finlay Architecture",
        narrative:
          "Finlay is by-the-book. Strict typings. Legacy rules. He relies on evidence and facts. Don't ask AI to 'fix the bug'—give it the exact stack trace. Finlay is your CI/CD pipeline demanding proof.",
        type: "character",
        boxContent:
          "// Finlay CI/CD Pipeline\nconst verified = auditCompiler(diff);\nassert(verified.hasTestCoverage, 'Evidence required');",
      },
      {
        character: "The Roscoe Advantage",
        narrative:
          "Roscoe has deep local roots. AI has global knowledge, but it doesn't know your specific problem. Domain expertise is your ultimate moat. Build for an Audience of One.",
        type: "character",
        boxContent:
          "// Roscoe Domain Knowledge\nconst localFriction = identifyPersonalNeed();\nconst app = solveAudienceOfOne(localFriction);",
      },
    ],
    notes: combinedPresenterNotes[2],
  },
  {
    id: "combined-04",
    type: "comparison",
    phase: "Act I // Specialist Tools",
    title: "O'Donnell's Switchblade vs. Dixon",
    description:
      "Build lightweight micro-utilities and audit the crime scene telemetry.",
    columns: [
      {
        character: "O'Donnell's Switchblade",
        narrative:
          "O'Donnell wears a corporate suit now, but still carries a ceramic switchblade to bypass metal detectors. Build micro-utilities. Avoid monolithic AWS frameworks when localized storage will do.",
        type: "character",
        boxContent:
          "// Micro-Utility Engine\nconst store = LocalStorageState.init();\nexport const sync = () => store.flush();",
      },
      {
        character: "Dixon's Telemetry",
        narrative:
          "Dixon finds the pattern in the numbers. AI bots generate +6,900% more web traffic today. Dashboards are lying. Sovereign forensic telemetry is how we isolate human intent from agentic noise.",
        type: "character",
        boxContent:
          "// Sovereign Forensics\nconst isRealUser = forensicAudit(req.telemetry);\nfilterSyntheticNoise(isRealUser);",
      },
    ],
    notes: combinedPresenterNotes[3],
  },
  {
    id: "combined-05",
    type: "comparison",
    phase: "Act II // Momentum vs. Contracts",
    title: "The Denji Ripcord vs. Aki Contracts",
    description:
      "Balance raw prototype velocity with strict resistance to tech debt devils.",
    columns: [
      {
        character: "The Denji Ripcord",
        narrative:
          "Denji has no formal training. He just pulls the cord and swings. Stop whiteboarding architecture for 3 weeks. 'Vibe code.' Get the prototype on screen and iterate with momentum.",
        type: "character",
        boxContent:
          "// Vibe Coding Loop\nconst prototype = generatePrototype(idea);\nrenderLiveFeedback(prototype);",
      },
      {
        character: "The Aki Contracts",
        narrative:
          "Aki pays a physical price for his power. Dependencies are contracts. Every time you let an AI hallucinate 10 NPM packages into your code, you trade your codebase's lifespan for a shortcut.",
        type: "character",
        boxContent:
          "// Zero Dependency Boundary\nconst deps = auditPackageJson();\nassert(deps.length === 0, 'No Faustian contracts');",
      },
    ],
    notes: combinedPresenterNotes[4],
  },
  {
    id: "combined-06",
    type: "comparison",
    phase: "Act II // Generative AI",
    title: "The Power Paradigm",
    description:
      "Your LLM is Power: immense brute capability, completely unchecked by truth.",
    columns: [
      {
        character: "The Power Paradigm",
        narrative:
          "Power is pure chaos. She's incredibly strong, but she lies about her stats and needs constant babysitting. This is your LLM. It will confidently hallucinate functions that don't exist. You must verify every kill.",
        type: "character",
      },
      {
        tag: "The Hallucination",
        type: "bad",
        content:
          'AI: "I imported the proprietary API you asked for!"\n\nYou: "This repository hasn\'t existed since 2019."',
        result: "-> Result: Confident lies requiring compiler audit.",
      },
    ],
    notes: combinedPresenterNotes[5],
  },
  {
    id: "combined-07",
    type: "comparison",
    phase: "Act II // The Orchestrator",
    title: "Makima's Orchestration vs. Kishibe",
    description:
      "Taste and curation are the bottlenecks. Have the courage to burn the resume.",
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
          "// Sovereign Moat\nbuildForAudienceOfOne({\n  targetUser: 'myself',\n  moat: 'uncompromising taste'\n});",
      },
    ],
    notes: combinedPresenterNotes[6],
  },
  {
    id: "combined-08",
    type: "statement",
    phase: "Act III // The Iron Protocol",
    title: "Progressive\nOverload.",
    description:
      "In the age of AI, the machine does the heavy lifting, but YOU are the spotter. Code is irrelevant now. The bottleneck is your discipline, your curation, and your form.",
    notes: combinedPresenterNotes[7],
  },
  {
    id: "combined-09",
    type: "comparison",
    phase: "Act III // Form Check",
    title: "Form Check: Ego Lifting vs. Isolation",
    description:
      "Don't ask for a full SaaS in one breath. Target specific system invariants.",
    columns: [
      {
        tag: "Bad Form: Ego Lifting",
        type: "bad",
        content:
          '"Build me a full SaaS platform like Uber. Write the backend, frontend, and DB all at once."',
        result: "-> Result: You get crushed by code you can't debug.",
      },
      {
        tag: "Good Form: Isolation Sets",
        type: "good",
        content:
          '"Step 1: Design the DB schema for auth. Wait for approval.\nStep 2: Write the API route. Spot me on the form."',
        result: "-> Result: Flawless execution. Total architectural sovereignty.",
      },
    ],
    notes: combinedPresenterNotes[8],
  },
  {
    id: "combined-10",
    type: "statement",
    phase: "Act III // Hypertrophy",
    title: "Tear it\nDown.",
    description:
      "Muscle grows by tearing fibers. Codebases evolve the same way. Build great apps by letting AI write the prototype, actively breaking it, and forcing it to refactor stronger. Never skip leg day (Automated Testing).",
    notes: combinedPresenterNotes[9],
  },
  {
    id: "combined-11",
    type: "comparison",
    phase: "The Climax // The Mirror vs. The Scale",
    title: "The Dirty Bulk vs. The True Scale",
    description:
      "Monorepo bloat and bot traffic create illusory gains. Sovereign auditing isolates real signal.",
    columns: [
      {
        tag: "The Dirty Bulk",
        type: "bad",
        content:
          "Generating massive monorepos. Bloated metrics from bot traffic. Looking massive on paper, but zero actual strength.",
        result: "-> Result: Fragile bundle bloat that collapses under true strain.",
      },
      {
        tag: "The True Scale",
        type: "good",
        content:
          "Generative AI inflates vanity metrics. Sovereign forensic auditing is the scale that proves your actual proof of work. Question everything.",
        result: "-> Result: Cold, unyielding truth of sovereign performance.",
      },
    ],
    notes: combinedPresenterNotes[10],
  },
  {
    id: "combined-12",
    type: "statement",
    phase: "Epilogue // The Commander's Mandate",
    title: "Your Set.\nYour Rules.",
    description:
      "Investigate like the 110th. Move with the momentum of Denji. Lift with the strict form of an iron athlete. The platform is yours—stop asking for permission. Take the shot.",
    signature:
      "github.com/shugknight24\n[ VERIFIED ] ¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯ [ VERIFIED ]",
    notes: combinedPresenterNotes[11],
    center: true,
  },
];
