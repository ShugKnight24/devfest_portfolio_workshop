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
    slideDeckRoute: "/slides/combined",
    topic:
      "Pull the Cord. Bring Backup. — Stop typing boilerplate. Start directing the crew. What Jack Reacher and Chainsaw Man taught me about agentic development",
    abstract:
      "The syntax barrier is dead, and solo coding died with it. Stop typing boilerplate: you are now the commander of an AI squad, directing agents with different roles, different flaws and different strengths at the bottlenecks that actually slow you down. Two unlikely mentors taught me how to lead that crew. Chainsaw Man's Denji pulls the cord and commits before he's ready. Lee Child's Jack Reacher arrives alone and never closes a case without backup. We'll build something live from the room's own frustrations, catch what the squad gets confidently wrong, and leave with three questions that work far beyond code.",
    highlights: [
      "Pull the cord: commit, ship, and learn from the running version",
      "Direct the crew: stop typing boilerplate, start specifying, delegating and verifying",
      "Bring backup: the people who catch what the machine gets confidently wrong",
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
