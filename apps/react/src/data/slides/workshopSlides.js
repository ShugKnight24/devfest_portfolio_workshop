/**
 * Builder's Workshop: Audience of One Workshop Format
 * Detroit LHM & DevFest 2026
 *
 * Pivot away from the standard "Let's build a React App" template:
 * - Stage 01: The Friction Audit — Write down the 3 most annoying digital tasks in personal life.
 * - Stage 02: The Prompt Clinic — Teach strict constraints (The Finlay/Neagley method).
 * - Stage 03: The Sprint — 30 minutes to vibe-code with Cursor/Windsurf to build personal operative.
 * - Stage 04: The Show & Tell — Demonstrate operatives, share blueprints, cultivate community of builders.
 */

export const workshopDeckMeta = {
  id: "workshop",
  title: "Builder's Workshop Labs // Audience of One",
  subtitle: "Sovereign Personal Operatives Lab Dashboard",
  conference: "Detroit LHM & DevFest 2026",
  organization: "Google GDG Detroit",
  date: "September 19 & November 2026",
  duration: "Half-Day / All-Day Lab",
  url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-detroit-latin-heritage-month-innovation-summit/cohost-gdg-detroit/",
};

export const workshopSlides = [
  {
    id: "stage-01",
    type: "lab",
    labNumber: "01",
    badge: "STAGE 01 // AUDIT",
    title: "The Friction Audit",
    subtitle: "Identify 3 Acute Personal Bottlenecks",
    description:
      "Stop whiteboarding hypothetical SaaS products. Open your notebook and write down the 3 most soul-crushing, repetitive digital tasks in your personal life.",
    objective: "Identify acute personal friction (bank CSVs, school newsletters, meal prep macros).",
    fileTarget: "personal_friction_audit.txt",
    terminalLines: [
      "> echo '1. Parsing Chase bank CSV exports into monthly totals' >> friction.txt",
      "> echo '2. Digesting 4-page weekly elementary school newsletters' >> friction.txt",
      "> echo '3. Calculating protein and whole-food grocery weights' >> friction.txt",
      "[AUDIT COMPLETE] Target identified. You are building for an Audience of One.",
    ],
    actionLink: "/operatives",
    actionLabel: "Launch Operatives Sandbox",
  },
  {
    id: "stage-02",
    type: "lab",
    labNumber: "02",
    badge: "STAGE 02 // CLINIC",
    title: "The Prompt Clinic",
    subtitle: "The Finlay & Neagley Method",
    description:
      "Teach attendees how to formulate strict constraint prompts instead of polite civilian requests. Define the runtime target, explicit inputs/outputs, and zero external dependencies.",
    objective: "Master constraint-driven prompting: Target, Goal, Strict Constraints, Output format.",
    fileTarget: "prompt_blueprint.md",
    terminalLines: [
      "> Target: Python 3 CLI / Native Web API",
      "> Goal: Extract dates and action items from unstructured newsletter text",
      "> Constraints: Native libraries only (csv, re, datetime), ZERO external dependencies",
      "> Output: Diffs or single-file executable script only",
      "[PROMPT VERIFIED] Zero hallucination vector. Ready for execution.",
    ],
    actionLink: "/agentic-studio",
    actionLabel: "Open Agentic Studio Clinic",
  },
  {
    id: "stage-03",
    type: "lab",
    labNumber: "03",
    badge: "STAGE 03 // SPRINT",
    title: "The 30-Minute Sprint",
    subtitle: "Vibe-Code Your Personal Operative",
    description:
      "Fire up Cursor, Windsurf, or Claude Code. Pull the ripcord like Denji. Attendees have 30 uninterrupted minutes to generate, test, and iterate on their personal operative.",
    objective: "Build and verify a working personal agent (Python script, HTML widget, or macro).",
    fileTarget: "apps/react/src/data/portfolioData.js",
    terminalLines: [
      "> cursor .",
      "> // Prompt: Execute personal operative with strict Neagley isolation",
      "> python3 operative.py test_input.csv",
      "> [SUCCESS] Execution complete in 240ms. Zero dependencies installed.",
    ],
    actionLink: "/operatives",
    actionLabel: "Test in Operatives Sandbox",
  },
  {
    id: "stage-04",
    type: "lab",
    labNumber: "04",
    badge: "STAGE 04 // SHOW & TELL",
    title: "Show & Tell // The Movement",
    subtitle: "Share Blueprints & Cultivate Community",
    description:
      "Step up to the podium. Attendees project their screen, run their personal operative, and export the blueprint into the shared community catalog.",
    objective: "Demonstrate live operative, share architectural blueprint, and join the builder network.",
    fileTarget: "blueprints/operative_export.json",
    terminalLines: [
      "> git add operatives/ && git commit -m 'feat: add school email operative'",
      "> git push origin feat/my-personal-agent",
      "> [COMMUNITY SYNC] Blueprint registered to Sovereign Catalog.",
      "[VERIFIED] ¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯",
    ],
    actionLink: "/showcase",
    actionLabel: "View Community Blueprints",
  },
];

export const workshopPresenterNotes = {
  "stage-01":
    "STAGE 01 (15m): Circulate the room. Push attendees to pick REAL personal friction. Disqualify any ideas like 'I want to build a CRM for my manager'. Force them to solve their own life.",
  "stage-02":
    "STAGE 02 (20m): Break down the Finlay/Neagley prompt structure on the big screen. Show why adding 'Constraints: native libraries only' eliminates 95% of hallucinated NPM packages.",
  "stage-03":
    "STAGE 03 (30m): Put a live 30-minute countdown on the screen. Walk around, spot attendees when their AI gets stuck, and remind them to keep it lean and isolated.",
  "stage-04":
    "STAGE 04 (30m): Call up 4-5 volunteers. Have them show the input, hit enter, and show the output. Celebrate every working operative. Drop the GitHub link to exchange blueprints.",
};
