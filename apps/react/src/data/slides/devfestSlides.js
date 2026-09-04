/**
 * Michigan DevFest & AI Hackathon 2026 Slide Deck
 * Date: November 2026 — Google GDG Detroit
 *
 * Theme: "Hackathon Velocity: From Audience of One to Sovereign Software"
 * Tailored for high-speed hackathon prototyping, subagents, automated verification,
 * and turning personal bespoke prototypes into scalable production software.
 */

export const devfestDeckMeta = {
  id: "devfest",
  title: "Hackathon Velocity",
  subtitle: "From Audience of One to Sovereign Software",
  conference: "Michigan DevFest & AI Hackathon 2026",
  organization: "Google GDG Detroit",
  date: "November 2026",
  url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-michigan-devfest-ai-hackathon-2026/cohost-gdg-detroit/",
};

export const devfestSlides = [
  {
    id: "title",
    type: "title",
    title: "Hackathon Velocity",
    subtitle: "From Audience of One to Sovereign Software",
    description:
      "A high-speed masterclass in shipping production AI tools during a hackathon: subagent orchestration, modular blocks, and automated gates.",
    conferenceBadge: "GDG Detroit • Michigan DevFest AI Hackathon 2026",
  },
  {
    id: "hackathon-formula",
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
  {
    id: "launch",
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
