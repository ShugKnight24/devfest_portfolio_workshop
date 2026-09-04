/**
 * LHM Innovation Summit 2026 Slide Deck
 * Date: September 19, 2026 — Google GDG Detroit
 *
 * Theme: "The Reacher Protocol: Critical Deduction & Overwhelming Force in Agentic Dev"
 * Blending Jack Reacher (Sherlock Holmes intellect + strength of 3 men)
 * with Chainsaw Man / Reze explosive execution speed, moving "Beyond the Portfolio"
 * to bespoke personal software solutions for an Audience of One that scale to Many.
 */

export const lhmDeckMeta = {
  id: "lhm",
  title: "The Reacher Protocol (Master Keynote)",
  subtitle: "Critical Deduction & Overwhelming Force in Agentic Dev",
  conference: "Detroit Latin Heritage Month Innovation Summit 2026",
  organization: "Google GDG Detroit",
  date: "September 19, 2026",
  duration: "60 min",
  url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-detroit-latin-heritage-month-innovation-summit/cohost-gdg-detroit/",
};

export const lhmSlides = [
  {
    id: "title",
    type: "title",
    title: "The Reacher Protocol",
    subtitle: "Critical Deduction & Overwhelming Force in Agentic Dev",
    description:
      "Beyond the static portfolio: pairing Sherlock Holmes-level root cause deduction with the explosive physical leverage of AI to build bespoke software tools.",
    conferenceBadge: "GDG Detroit • Latin Heritage Month & DevFest 2026",
  },
  {
    id: "reacher-principle",
    type: "reacher-intro",
    title: "Intellect of Holmes. Strength of 3 Men.",
    subtitle: "The Jack Reacher Formula for Modern Engineering",
    quote:
      "In an investigation, details matter. You look, you analyze, and when the moment comes, you hit first and you hit hard.",
    traits: [
      {
        title: "Sherlockian Deduction",
        description:
          "Walking into the crime scene of a messy codebase, spotting tire tracks in a stack trace, and deducing root causes before touching a single line.",
        icon: "search",
        reacherQuote: "I don't mind the questions. I mind the lies.",
      },
      {
        title: "The Strength of 3 Men",
        description:
          "Not just theorizing, but applying overwhelming agentic leverage. One developer doing the deep structural work of a 5-person engineering squad.",
        icon: "lightning",
        reacherQuote: "I like to hit first, and hit hard.",
      },
      {
        title: "Explosive Reze Velocity",
        description:
          "Borrowing from Chainsaw Man: once the analysis is locked, execute with zero hesitation at the speed of thought.",
        icon: "rocket",
        reacherQuote: "Zero hesitation. Semicolon purgatory is over.",
      },
    ],
  },
  {
    id: "energy",
    type: "energy",
    title: "Noise vs. Silence",
    subtitle: "Phase 01 // Token Economics & Zero-Waste Context",
    content: `// The Corporate Loop
const bloatedAgency = {
  standups: 4,
  unnecessaryNpmDeps: 142,
  codeShipped: "2 buttons"
};

// The Reacher Response
function reacherProtocol() {
  /* "Reacher said nothing." */
  return deduceRootCause() 
      && applyOverwhelmingForce();
}`,
    description:
      "Ballmer screamed 'DEVELOPERS!' until his vocal cords tore. But true agentic power is silent. Every token you waste yapping is memory your agent forgets. Eliminate noise, cut polite filler, preserve context, and strike once.",
    videoUrl: "https://www.youtube.com/watch?v=8fcSviC7cRM",
  },
  {
    id: "zero-bloat",
    type: "zero-bloat",
    title: "The Zero-Bloat Doctrine",
    subtitle: "Phase 02 // Architecture & Sovereignty",
    quote: "You don't need a lot of luggage when you know where you're going.",
    description:
      "Jack Reacher travels with an expired passport and a folding toothbrush. Stop pulling in 80 NPM packages for a simple helper. Keep your stack lean, sovereign, and lightning-fast.",
    photoZoneText: "[ DROP DEADLIFT / TECH PHOTO HERE ]",
    image: "",
  },
  {
    id: "system-warning",
    type: "system-warning",
    title: "Strength isn't enough.",
    subtitle: "System Warning // The Velocity Ceiling",
    description:
      "Reacher’s deduction is flawless. But in 2026, executing at human typing speed gets you killed in the market.",
    triggerPrompt: ">> SPEAKER: INITIATE REZE OVERRIDE (TOP RIGHT) <<",
  },
  {
    id: "paradigm",
    type: "paradigm",
    title: "Beyond the Portfolio: Audience of One",
    subtitle: "Paradigm Shift // Execute Sovereign Software",
    description:
      "Traditional advice: spend weeks polishing a static resume that sits untouched. Burn the resume. Build software to eliminate your own acute daily friction.",
    steps: [
      {
        step: "01",
        label: "Solve Your Friction",
        desc: "Build software to eliminate your own acute daily friction. A workout tracker, a localized checkout engine.",
      },
      {
        step: "02",
        label: "Proof of Sovereignty",
        desc: "A bespoke tool that persists state and solves a real problem is 100x more impressive to hiring managers than a template.",
      },
      {
        step: "03",
        label: "Audience of Many",
        desc: "Package it. Open-source it. Let others run it and build on top of your architecture.",
      },
    ],
  },
  {
    id: "case-studies",
    type: "case-studies",
    title: "Production Scale",
    subtitle: "Proof of Work // Real-World Solutions",
    items: [
      {
        category: "Media Distribution Engine",
        title: "J. Simmons Prod.",
        problem: "Hours lost to manual video encoding workflows across fragmented platforms.",
        solution: "Zero-bloat backend replacing manual transcoding. Channels scale instantly.",
        impact: "Automated end-to-end pipeline with zero manual intervention.",
        icon: "play",
      },
      {
        category: "Fitness State Machine",
        title: "Jacked Alien",
        problem: "Unreliable workout logging apps suffering from network latency and UI lag.",
        solution: "Modular FSM governing real-time workout cadence. Zero external dependencies. Runs offline.",
        impact: "Zero latency state machine running locally on any device.",
        icon: "activity",
      },
      {
        category: "Guerilla E-Commerce",
        title: "Criminal Cookies",
        problem: "Shopify plugin bloat, excessive monthly SaaS fees, and slow checkout carts.",
        solution: "Bypassing legacy bloat with localized high-frequency checkout compiled to micro-components.",
        impact: "Sub-second sovereign purchases with direct inventory synchronization.",
        icon: "shopping",
      },
    ],
  },
  {
    id: "process",
    type: "process",
    title: "The Agentic Dev Loop",
    subtitle: "Architecture // CI Gate",
    quote:
      '"Beware of unearned wisdom." If you don\'t audit the compiler, you are outsourcing your mind to someone else\'s server.',
    stages: [
      {
        num: "01",
        name: "1. Investigate",
        detail: "Scrape symbols and line numbers. Do NOT dump whole files into context.",
        rule: "Symbol Scoping",
      },
      {
        num: "02",
        name: "2. Deduce",
        detail: "Formulate surgical ≤2 file diffs based on typed specs and root cause.",
        rule: "Surgical Diffs",
      },
      {
        num: "03",
        name: "3. Verify",
        detail: "Vitest suite + Production build gate. Zero human intervention required.",
        rule: "CI Gatekeeper",
      },
    ],
  },
  {
    id: "bio",
    type: "bio",
    title: "Clearance Level: Admin",
    name: "Shugmi Shumunov",
    role: "Software Engineer & Builder @ Shumunov Solutions",
    details: [
      "Software Engineer & Founder @ Shumunov Solutions (Detroit, MI)",
      "Obsessed with web performance, developer sovereignty, and heavy deadlifts.",
      "Beyond the static portfolio: building bespoke software tools for an Audience of One.",
      "github.com/shugknight24 • Datamoon.com",
    ],
    why: [
      "To teach developers how to replace passive resumes with sovereign, production-grade tools.",
      "To demonstrate surgical deduction before applying overwhelming force.",
    ],
    jackpot: "😎 ¯\\_(ツ)_/¯ jackpot ¯\\_(ツ)_/¯ 😎",
    image: "/assets/images/shug_headshot.jpg",
    photoZoneText: "[ DROP PORTRAIT PHOTO HERE ]",
  },
];

export const lhmPresenterNotes = {
  title:
    "Set the tone: We are dismantling the static developer portfolio and rebuilding it with critical deduction and agentic leverage.",
  "reacher-principle":
    "Unpack the Reacher formula: Holmes deduction + physical leverage of 3 men + Reze's visceral speed.",
  energy:
    "Contrasting Ballmer shouting DEVELOPERS with Reacher's disciplined silence. Token conservation is engineering rigor.",
  "zero-bloat":
    "Show the folding toothbrush analogy. How many NPM dependencies does a modern developer really need?",
  "system-warning":
    "DRAMATIC TURN: Trigger the Reze Override button in the top right. Watch the room react as the UI transitions to neon magenta glitch mode.",
  paradigm:
    "Audience of One: Stop coding for a theoretical recruiter. Code for your own acute problem. If you love it, others will too.",
  "case-studies":
    "Walk through J. Simmons, Jacked Alien, and Criminal Cookies as concrete evidence.",
  process:
    "Emphasize the 3-step loop: Investigate, Deduce, Verify. The automated gate is non-negotiable.",
  bio:
    "Wrap up with personal clearance profile, Datamoon link, and invite the room into the hands-on lab.",
};
