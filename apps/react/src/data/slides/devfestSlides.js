/**
 * Michigan DevFest & AI Hackathon 2026 — Workshop Spine
 * Date: November 2026 — Google GDG Detroit
 *
 * Theme: "Hackathon Velocity: From Audience of One to Sovereign Software"
 *
 * CHAPTER TWO. This deck is deliberately the sequel to the LHM Summit keynote
 * (see ./lhmSlides.js, September 19 2026). The keynote makes the argument in
 * fifteen minutes and builds one thing live. This deck assumes the argument and
 * spends the day making the room do it with their own hands.
 *
 * Same elastic runtime model (./runtime.js), one tier deeper:
 *   keynote  runtime → the talk portion, no labs. Use this to open the day.
 *   workshop runtime → the full curriculum including all four labs.
 *
 * The four labs were previously a separate `workshop` deck. They live here now,
 * so the day is one continuous document rather than two decks you switch
 * between while forty people watch you fumble a menu.
 */

import { TIER } from "./runtime";

export const devfestDeckMeta = {
  id: "devfest",
  title: "Hackathon Velocity",
  subtitle: "From Audience of One to Sovereign Software",
  conference: "Michigan DevFest & AI Hackathon 2026",
  organization: "Google GDG Detroit",
  date: "November 2026",
  duration: "Elastic — 60 min talk / full-day workshop",
  elastic: true,
  defaultRuntime: "keynote",
  continuesFrom: "lhm",
  accent: "#00ffcc",
  accentAlt: "#ffcc00",
  url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-michigan-devfest-ai-hackathon-2026/cohost-gdg-detroit/",
};

export const devfestSlides = [
  {
    id: "title",
    tier: TIER.CORE,
    type: "title",
    title: "Hackathon Velocity",
    subtitle: "From Audience of One to Sovereign Software",
    description:
      "A high-speed masterclass in shipping production AI tools during a hackathon: subagent orchestration, modular blocks, and automated gates.",
    conferenceBadge: "GDG Detroit • Michigan DevFest AI Hackathon 2026",
  },
  {
    id: "chapter-two",
    type: "statement",
    tier: TIER.CORE,
    budget: 80,
    phase: "Chapter Two",
    center: true,
    title: "You watched it.\nNow you do it.",
    description:
      "In September I stood on a stage and built one thing, live, in about four minutes, off a problem somebody in the room shouted at me. That was the argument. Today is the part where you stop watching and your name is on the commit.",
    signature: "// Sept 19 — The Reacher Protocol — one build, fifteen minutes.\n// Today — four labs, your friction, your repo.",
  },
  {
    id: "hackathon-formula",
    tier: TIER.CORE,
    type: "reacher-intro",
    title: "The Hackathon Velocity Triad",
    subtitle: "Speed • Precision • Zero Human Verification",
    quote: "In a 24-hour hackathon, the team that writes the cleanest modular contracts and verifies automatically wins every time.",
    traits: [
      {
        title: "Micro-Scoped Context",
        description:
          "Never feed an entire codebase to an LLM. Feed Level 1 persistent rules and Level 2 specs, and let subagents locate symbols.",
        icon: "fileText",
        reacherQuote: "Evaluate. Long experience had taught me to evaluate and assess.",
      },
      {
        title: "Subagent Pipelines",
        description:
          "Orchestrate `cavecrew-investigator`, `cavecrew-builder`, and `cavecrew-reviewer` in parallel for rapid surgical diffs.",
        icon: "users",
        reacherQuote: "I'm a cautious person. But not a timid one.",
      },
      {
        title: "Zero-Human Gates",
        description:
          "Vitest and Vite build scripts acting as the automated gatekeeper. If the tests fail, the agent self-corrects before you look.",
        icon: "checkCircle",
        reacherQuote: "Hope for the best, plan for the worst.",
      },
    ],
  },
  {
    id: "audience-pulse",
    tier: TIER.CORE,
    type: "poll",
    title: "Hackathon Readiness Check",
    subtitle: "Where does your hackathon squad stand right now?",
    polls: [
      {
        id: "idea",
        question: "Who here has a project idea they want to build today?",
        followUp:
          "Great! Frame it as an 'Audience of One' problem first: what pain point are you personally fixing?",
        icon: "lightbulb",
        audienceCount: "Idea Stage",
      },
      {
        id: "team",
        question: "Who is looking to collaborate or join a hackathon squad?",
        followUp:
          "Connect with your row! Combining a frontend designer with an agentic backend hacker is the golden formula.",
        icon: "users",
        audienceCount: "Team Building",
      },
      {
        id: "tools",
        question: "Who has struggled with AI tools hallucinating broken imports or dependencies?",
        followUp:
          "That stops today. We will set up strict Level 1 AGENTS.md rules to eliminate broken packages.",
        icon: "shield",
        audienceCount: "Agentic Engineering",
      },
      {
        id: "deploy",
        question: "Who wants to have their hackathon app deployed live with a custom domain before sunset?",
        followUp:
          "Zero-config Vercel deployment is built into this starter repo. Ship early and iterate in public.",
        icon: "rocket",
        audienceCount: "Deployment Target",
      },
    ],
  },
  {
    id: "whoami",
    tier: TIER.DEEP,
    type: "bio",
    title: "Who Am I?",
    name: "Shugmi Shumunov",
    role: "Software Engineer & Builder @ Shumunov Solutions",
    details: [
      "Consulting, distributed systems, and modern web application development",
      "Hackathon judge and speaker across Michigan technology communities",
      "Builder of sovereign developer tooling and high-velocity workflows",
    ],
    why: [
      "To help you win your hackathon track with production-ready architecture",
      "To show you how to orchestrate AI subagents without context collapse",
      "To inspire you to ship software that lives beyond the demo stage",
    ],
  },
  {
    id: "beyond-portfolio",
    tier: TIER.CORE,
    type: "paradigm",
    title: "The Hackathon Trap vs. The Sovereign Maker",
    subtitle: "Build What Matters",
    steps: [
      {
        step: "01",
        label: "The Trap: Fake Demos",
        desc: "Building a flashy UI that breaks the second a user clicks anything outside the predetermined demo path.",
      },
      {
        step: "02",
        label: "The Solution: Real Utility",
        desc: "Solve a real friction you experience every day. A real state machine, real persistence, real data.",
      },
      {
        step: "03",
        label: "The Force Multiplier",
        desc: "Use subagent pipelines to generate tests first (TDD), then code the minimal implementation to pass.",
      },
      {
        step: "04",
        label: "Ship Live",
        desc: "Deploy to production immediately. Hand judges a live URL on their own phones.",
      },
    ],
  },
  {
    id: "case-studies",
    tier: TIER.EXTENDED,
    type: "case-studies",
    title: "From Personal Hack to Production",
    subtitle: "Real Software Solutions That Scaled",
    items: [
      {
        title: "J. Simmons Productions",
        category: "Media Pipeline",
        problem: "Manual file conversions and sluggish cloud uploads during video production.",
        solution: "Lightweight dynamic modules processing distribution hooks asynchronously.",
        impact: "Saved hundreds of production hours weekly.",
        icon: "tv",
      },
      {
        title: "Jacked Alien",
        category: "State Machine Engine",
        problem: "Existing trackers unable to adapt workout volume dynamically.",
        solution: "Finite state machine with localStorage persistence and instant response.",
        impact: "Zero external dependencies, 100% offline capable.",
        icon: "activity",
      },
      {
        title: "Criminal Cookies",
        category: "High-Frequency E-Commerce",
        problem: "Legacy storefronts taking 8 seconds to load on mobile networks.",
        solution: "Vite + Tailwind micro-checkout bypassing heavy e-commerce frameworks.",
        impact: "Sub-second load times and frictionless ordering.",
        icon: "cart",
      },
    ],
  },
  {
    id: "reacher-loop",
    tier: TIER.CORE,
    type: "process",
    title: "The Hackathon Sprint Loop",
    subtitle: "Spec • Build • Verify • Deploy",
    stages: [
      {
        num: "01",
        name: "Define SPEC.md",
        detail: "Lock user stories, prop interfaces, and acceptance criteria in 1 page.",
        rule: "Task-Level Contract",
      },
      {
        num: "02",
        name: "TDD Harness",
        detail: "Write failing Vitest test asserting expected behavior.",
        rule: "Automated Target",
      },
      {
        num: "03",
        name: "Surgical Build",
        detail: "Implement minimal code to pass tests. Zero boilerplate.",
        rule: "Zero-Bloat Implementation",
      },
      {
        num: "04",
        name: "Vercel Deploy",
        detail: "Production build validation and instantaneous live deployment.",
        rule: "Live Deployment",
      },
    ],
  },
  // ───────────────────────── LABS (workshop runtime only) ─────────────────────
  // Previously a separate `workshop` deck. Folded in so the day is one document.
  {
    id: "lab-01",
    type: "lab",
    tier: TIER.LAB,
    budget: 900,
    labNumber: "01",
    badge: "LAB 01 // AUDIT",
    title: "The Friction Audit",
    subtitle: "Find three real bottlenecks in your own week",
    description:
      "Close the tab with the startup ideas in it. Write down the three most repetitive, soul-crushing digital tasks in your ACTUAL life. Not a product. A chore.",
    objective: "Identify acute personal friction — bank CSVs, school newsletters, macro math.",
    fileTarget: "personal_friction_audit.txt",
    terminalLines: [
      "> echo '1. Parsing Chase CSV exports into monthly totals' >> friction.txt",
      "> echo '2. Digesting 4-page weekly school newsletters' >> friction.txt",
      "> echo '3. Calculating protein and grocery weights' >> friction.txt",
      "[AUDIT COMPLETE] Target identified. Audience of One.",
    ],
    actionLink: "/operatives",
    actionLabel: "Launch Operatives Sandbox",
  },
  {
    id: "lab-02",
    type: "lab",
    tier: TIER.LAB,
    budget: 1200,
    labNumber: "02",
    badge: "LAB 02 // CLINIC",
    title: "The Prompt Clinic",
    subtitle: "Constraints, not wishes",
    description:
      "A polite request gets you a plausible answer. A constraint gets you a correct one. Write the runtime target, the explicit inputs and outputs, and the dependency ceiling — before you write the ask.",
    objective: "Master constraint-driven prompting: Target, Goal, Constraints, Output format.",
    fileTarget: "prompt_blueprint.md",
    terminalLines: [
      "> Target: Python 3 CLI / native Web API",
      "> Goal: Extract dates and action items from unstructured newsletter text",
      "> Constraints: stdlib only (csv, re, datetime). ZERO external dependencies",
      "> Output: unified diff, or one executable file. Nothing else",
      "[PROMPT VERIFIED] Hallucination surface minimised.",
    ],
    actionLink: "/agentic-studio",
    actionLabel: "Open the Prompt Clinic",
  },
  {
    id: "lab-03",
    type: "lab",
    tier: TIER.LAB,
    budget: 1800,
    labNumber: "03",
    badge: "LAB 03 // SPRINT",
    title: "The 30-Minute Sprint",
    subtitle: "Build your operative",
    description:
      "Thirty uninterrupted minutes. Generate, run it, read what came back, correct it, run it again. The loop is the skill — not the first output.",
    objective: "Ship a working personal agent: a script, a widget, or a macro. It must run.",
    fileTarget: "apps/react/src/data/portfolioData.js",
    terminalLines: [
      "> claude .",
      "> // Prompt: personal operative, strict isolation, stdlib only",
      "> python3 operative.py test_input.csv",
      "> [SUCCESS] Completed in 240ms. Zero dependencies installed.",
    ],
    actionLink: "/operatives",
    actionLabel: "Test in Operatives Sandbox",
  },
  {
    id: "lab-04",
    type: "lab",
    tier: TIER.LAB,
    budget: 1800,
    labNumber: "04",
    badge: "LAB 04 // SHOW & TELL",
    title: "Show & Tell",
    subtitle: "Run it in front of people",
    description:
      "Project your screen. Show the input, hit enter, show the output. Then push the blueprint so somebody else can run your thing on their machine. That last step is what turns One into Many.",
    objective: "Demo a live operative, publish the blueprint, join the builder network.",
    fileTarget: "blueprints/operative_export.json",
    terminalLines: [
      "> git add operatives/ && git commit -m 'feat: add school email operative'",
      "> git push origin feat/my-personal-agent",
      "> [COMMUNITY SYNC] Blueprint registered.",
      "[VERIFIED] ¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯",
    ],
    actionLink: "/showcase",
    actionLabel: "View Community Blueprints",
  },
  {
    id: "launch",
    tier: TIER.CORE,
    type: "launch",
    title: "Hackathon Countdown: Let's Build",
    subtitle: "Your Roadmap for DevFest 2026",
    stages: [
      "1. Clone the starter repository: git clone & npm install",
      "2. Select your persona track in /guide (Beginner, Pro, Maker)",
      "3. Use Agentic Studio to generate your Audience of One prototype",
      "4. Run automated tests (npm run test:run) to verify zero errors",
      "5. Push to GitHub and deploy live on Vercel for the judges!",
    ],
    ctaText: "Open Hackathon Guide & Tracks",
    ctaLink: "/guide",
  },
];

export const devfestPresenterNotes = {
  "chapter-two":
    "Explicitly call back to the September keynote. Some of this room was there; most were not. Give the 20-second version of the live build so nobody feels locked out, then pivot hard to 'today you do it.'",
  "lab-01":
    "LAB 01 (15m): Circulate. Push people toward REAL personal friction and disqualify 'a CRM for my manager.' The test is whether they have complained about it out loud before today.",
  "lab-02":
    "LAB 02 (20m): Break the prompt structure down on the big screen. Show live how adding 'stdlib only' kills most hallucinated imports. Have someone read a bad prompt and a good prompt back to back.",
  "lab-03":
    "LAB 03 (30m): Countdown on screen. Walk the room. When someone's agent is stuck, do NOT fix it for them — ask them what the error actually says. That is the whole lesson.",
  "lab-04":
    "LAB 04 (30m): Call up 4-5 volunteers. Input, enter, output. Celebrate every working operative, including the ugly ones. Close by pushing blueprints so the room leaves with each other's work.",
  title:
    "Welcome Michigan DevFest & AI Hackathon attendees! Highlight that this session is optimized for maximum shipping velocity during the hackathon.",
  "hackathon-formula":
    "Explain the Triad: Micro-scoped context, subagent pipelines, and zero-human automated testing gates. This is how solo hackers beat big teams.",
  "audience-pulse":
    "Survey the room: who needs ideas? who needs team members? Direct them to connect before hacking begins.",
  whoami:
    "Introduce yourself as an engineer, startup builder, and fellow hackathon competitor.",
  "beyond-portfolio":
    "Emphasize: don't build vaporware demos for the judges. Build a working tool for an Audience of One that judges can test on their own phones.",
  "case-studies":
    "Walk through the 3 real-world case studies. Show how each started as a simple, sharp solution to a personal friction.",
  "reacher-loop":
    "Explain the sprint loop: SPEC.md -> failing test -> minimal code -> instant Vercel deploy.",
  launch:
    "Kick off the hacking session! Remind everyone that mentors and guides are available.",
};
