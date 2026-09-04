/**
 * Speaking Events Data Configuration
 *
 * Details for upcoming keynotes, workshops, and archives:
 * - Detroit Latin Heritage Month Innovation Summit (Sept 19, 2026)
 * - Michigan DevFest & AI Hackathon 2026 (Nov 2026)
 * - Detroit Pride Summit 2026 (Archive)
 */

export const speakingEvents = [
  {
    id: "lhm-2026",
    title: "Detroit Latin Heritage Month Innovation Summit",
    shortTitle: "LHM Innovation Summit",
    organization: "Google GDG Detroit",
    date: "September 19, 2026",
    location: "Detroit, MI",
    badge: "Upcoming Keynote",
    status: "upcoming",
    url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-detroit-latin-heritage-month-innovation-summit/cohost-gdg-detroit/",
    slideDeckRoute: "/slides/lhm",
    topic: "The Reacher Protocol: Critical Deduction & Overwhelming Force in Agentic Dev",
    abstract:
      "Moving beyond static portfolios: how to pair Sherlock Holmes-level root cause deduction with the unstoppable strength of agentic workflows to build personal software solutions that scale to others.",
    highlights: [
      "Reacher Deduction Model (Sherlock Holmes Intellect + Force of 3 Men)",
      "Beyond the Portfolio: Audience of One to Audience of Many",
      "Context Hierarchy & Zero-Bloat Engineering",
    ],
  },
  {
    id: "devfest-2026",
    title: "Michigan DevFest & AI Hackathon 2026",
    shortTitle: "Michigan DevFest & AI Hackathon",
    organization: "Google GDG Detroit",
    date: "November 2026",
    location: "Detroit, MI",
    badge: "Upcoming Workshop & Hackathon",
    status: "upcoming",
    url: "https://gdg.community.dev/events/details/google-gdg-detroit-presents-michigan-devfest-ai-hackathon-2026/cohost-gdg-detroit/",
    slideDeckRoute: "/slides/devfest",
    topic: "Hackathon Velocity: From Audience of One to Sovereign Software",
    abstract:
      "A high-speed masterclass in building and shipping production AI applications during a hackathon: subagent orchestration, modular state machines, and closed-loop verification gates.",
    highlights: [
      "Subagent Orchestration (`cavecrew` Investigator, Builder, Reviewer)",
      "Zero-Human Verification Gates (Vitest + Production Build)",
      "Rapid Hackathon Prototyping & Live Deployment",
    ],
  },
  {
    id: "pride-2026",
    title: "Detroit Pride 2026 Summit",
    shortTitle: "Detroit Pride Summit",
    organization: "GDG Detroit",
    date: "June 2026",
    location: "Detroit, MI",
    badge: "Previous Talk (Archive)",
    status: "archived",
    url: "https://gdg.community.dev/",
    slideDeckRoute: "/slides/pride",
    topic: "Coding at the Speed of Thought: The REZE_BOMB System",
    abstract:
      "Rapid portfolio generation, modular block assembly, and the Skeptic Protocol: question the machine and audit the compiler.",
    highlights: [
      "The REZE_BOMB Architecture",
      "Component Block Assembly (Header, About, Skills, Projects, Footer)",
      "Steve Ballmer DEVELOPERS! Energy & Skeptic Protocol",
    ],
  },
];

export const getEventById = (id) => speakingEvents.find((e) => e.id === id);

export const getUpcomingEvents = () =>
  speakingEvents.filter((e) => e.status === "upcoming");

export const getArchivedEvents = () =>
  speakingEvents.filter((e) => e.status === "archived");
