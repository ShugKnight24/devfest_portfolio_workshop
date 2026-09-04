/**
 * Builder's Workshop Dashboard Slides
 * Detroit LHM & DevFest 2026
 *
 * Hands-on 4-lab workshop architecture.
 */

export const workshopDeckMeta = {
  id: "workshop",
  title: "Builder's Workshop Labs",
  subtitle: "Interactive All-Day Developer Lab Dashboard",
  conference: "Detroit LHM & DevFest 2026",
  organization: "Google GDG Detroit",
  date: "September 19 & November 2026",
  duration: "All-Day",
  url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-detroit-latin-heritage-month-innovation-summit/cohost-gdg-detroit/",
};

export const workshopSlides = [
  {
    id: "lab-01",
    type: "lab",
    labNumber: "01",
    badge: "LAB 01 // INITIATE",
    title: "Clone the Sandbox",
    subtitle: "Establish Sovereign Architecture",
    description:
      "First step: secure your local environment and drop the dead weight. Strip out bloat, verify package signatures, and lock your dependencies.",
    objective: "Establish Sovereign Architecture & Zero-Bloat Environment.",
    fileTarget: "apps/react/package.json",
    terminalLines: [
      "> git clone git@github.com:shugknight24/devfest_portfolio_workshop.git",
      "> cd devfest_portfolio_workshop/apps/react && npm install",
      "> npm run dev",
      "[WARNING] Strip unnecessary NPM dependencies. Keep it sovereign and lean.",
    ],
    actionLink: "/guide",
    actionLabel: "View Setup Guide →",
  },
  {
    id: "lab-02",
    type: "lab",
    labNumber: "02",
    badge: "LAB 02 // DEDUCE",
    title: "Audit Your Data",
    subtitle: "Centralized Data Layer Injection",
    description:
      "Open portfolioData.js. Inject your authentic story. Don't let an LLM write a generic, soulless biography for you. Authenticity is your competitive moat.",
    objective: "Refactor to Centralized Local Data Store (Zero Telemetry Leaks).",
    fileTarget: "apps/react/src/data/portfolioData.js",
    terminalLines: [
      "> vim apps/react/src/data/portfolioData.js",
      "> // Define your genuine narrative, custom projects, and sovereign skills",
      "> [OK] Local data layer updated. Zero third-party telemetry leak.",
    ],
    actionLink: "/builder",
    actionLabel: "Launch Portfolio Builder →",
  },
  {
    id: "lab-03",
    type: "lab",
    labNumber: "03",
    badge: "LAB 03 // BUILD",
    title: "Modular Assembly",
    subtitle: "Audience of One Maker Studio",
    description:
      "Launch the Audience of One Maker Studio. Blueprint your bespoke tool by assembling Header, About, Skills, Projects, and Footer blocks dynamically.",
    objective: "Assemble dynamic layout variants & multi-tier components.",
    fileTarget: "apps/react/src/data/layout.js",
    terminalLines: [
      "> App → ThemeProvider → LayoutEngine → PortfolioBuilder",
      "> Scaffolding 5 modular UI variants...",
      "> [READY] Interactive state machine compiled.",
    ],
    actionLink: "/agentic-studio",
    actionLabel: "Open Agentic Studio →",
  },
  {
    id: "lab-04",
    type: "lab",
    labNumber: "04",
    badge: "LAB 04 // VERIFY",
    title: "The Skeptic Protocol",
    subtitle: "Automated Verification Gates",
    description:
      "Never trust the machine blindly. The Reacher Protocol demands rigorous verification: run tests, pass Vitest gates, and deploy production-ready code.",
    objective: "100% Green CI Gate: Vitest Suite + Clean Production Build.",
    fileTarget: "apps/react/src/pages/WorkshopSlides.test.jsx",
    terminalLines: [
      "> npm --prefix apps/react run test:run",
      "> 54 tests passed. 0 failed. (820ms)",
      "> npm --prefix apps/react run build",
      "[DEPLOYMENT SECURED] Audience of One Live.",
    ],
    actionLink: "/challenges",
    actionLabel: "View Coding Challenges →",
  },
];

export const workshopPresenterNotes = {
  "lab-01":
    "Walk attendees through cloning and running without external services. Emphasize zero lock-in.",
  "lab-02":
    "Guide participants to write their authentic story. No corporate boilerplate.",
  "lab-03":
    "Demonstrate variant swapping live in the browser using the Portfolio Builder and Agentic Studio.",
  "lab-04":
    "Show how automated gates give developers the confidence to let subagents build safely.",
};
