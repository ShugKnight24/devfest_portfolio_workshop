/**
 * Detroit Pride 2026 Summit Slide Deck (Archive)
 *
 * Theme: "Coding at the Speed of Thought: The REZE_BOMB System"
 * The classic keynote featuring Steve Ballmer DEVELOPERS! loop,
 * modular block assembly, and the Skeptic Protocol.
 */

export const prideDeckMeta = {
  id: "pride",
  title: "The REZE_BOMB System",
  subtitle: "Coding at the Speed of Thought",
  conference: "Detroit Pride 2026 Summit (Archive)",
  organization: "GDG Detroit",
  date: "June 2026",
  url: "https://gdg.community.dev/",
};

export const prideSlides = [
  {
    id: "title",
    type: "title",
    title: "Coding at the Speed of Thought",
    subtitle: "The REZE_BOMB System",
    description: "Build a professional portfolio from zero to deployed — today.",
    conferenceBadge: "GDG Detroit • Detroit Pride 2026 Archive",
  },
  {
    id: "energy",
    type: "energy",
    title: "DEVELOPERS!",
    subtitle: "Steve Ballmer Infinite Loop",
    content: `const sweaty = true;

while (sweaty) {
  shoutDevelopers();
}

function shoutDevelopers() {
  console.log("Developers! Developers! Developers!");
}

// Uh oh, we're stuck in an infinite loop!
// Some say Steve Ballmer is still shouting to this day...`,
    description:
      "When I first heard this, I knew that if I ever got the opportunity to lead a workshop, I had to start it like this.",
    videoUrl: "https://www.youtube.com/watch?v=8fcSviC7cRM",
  },
  {
    id: "audience-pulse",
    type: "poll",
    title: "Quick Icebreaker",
    subtitle: "Show of hands for the room • Interactive assessment",
    polls: [
      {
        id: "novice",
        question: "Who here has never built a website or written a line of code before?",
        followUp: "Welcome! This workshop is designed from the ground up for beginners.",
        icon: "user",
        audienceCount: "Beginner Track",
      },
      {
        id: "react",
        question: "Who here has used React before?",
        followUp: "Awesome! You'll pick up the component patterns quickly.",
        icon: "atom",
        audienceCount: "React Track",
      },
      {
        id: "tailwind",
        question: "Who here has used Tailwind CSS before?",
        followUp: "Nice! You'll appreciate the utility-first styling speed.",
        icon: "palette",
        audienceCount: "Styling Track",
      },
      {
        id: "portfolio",
        question: "Who here has built a portfolio website before?",
        followUp: "Great! You'll be able to customize and upgrade your existing portfolio.",
        icon: "globe",
        audienceCount: "Upgraders",
      },
    ],
  },
  {
    id: "whoami",
    type: "bio",
    title: "Who Am I?",
    name: "Shugmi Shumunov",
    role: "Software Engineer @ Shumunov Solutions",
    details: [
      "Consulting and various startups",
      "Passionate about web development, open source, teaching, and lifting weights",
      "Standing on the shoulders of giants — inspired by community mentors",
    ],
    why: [
      "To help you learn and build a professional portfolio",
      "To share my knowledge and experience in web development",
      "To inspire you to keep building and learning after the workshop",
    ],
  },
  {
    id: "philosophy",
    type: "quote",
    title: "Workshop Mindset",
    quotes: [
      {
        text: "Beware of unearned wisdom.",
        subtext: "I encourage you to be a skeptic. Question everything and form your own opinions.",
        author: "Carl Jung",
      },
      {
        text: "Competence will lead to confidence.",
        subtext: "Don't wait to feel ready. Build first, understand the pieces, and confidence follows.",
        author: "Workshop Rule #1",
      },
    ],
  },
  {
    id: "overview",
    type: "process",
    title: "Today's Agenda",
    subtitle: "60-90 Minutes to Production",
    stages: [
      {
        num: "01",
        name: "Setup & Clone",
        detail: "Clone repository, install dependencies, ignite the Vite engine.",
        rule: "Stage 01",
      },
      {
        num: "02",
        name: "Personalize Data",
        detail: "Update portfolioData.js with your personal bio, projects, and skills.",
        rule: "Stage 02",
      },
      {
        num: "03",
        name: "Component Assembly",
        detail: "Uncomment Header, About, Skills, Projects, and Footer blocks in App.jsx.",
        rule: "Stage 03",
      },
      {
        num: "04",
        name: "Live Deployment",
        detail: "Deploy live to Vercel with zero-config continuous deployment.",
        rule: "Stage 04",
      },
    ],
  },
  {
    id: "launch",
    type: "launch",
    title: "Ready to Build?",
    subtitle: "Let's Get Started",
    stages: [
      "1. Open your terminal and run git clone",
      "2. Run npm install && npm run dev",
      "3. Open http://localhost:3000 in your browser",
      "4. Open src/data/portfolioData.js in your editor",
    ],
    ctaText: "Open Starter Guide",
    ctaLink: "/guide",
  },
];

export const pridePresenterNotes = {
  title: "Introduce the REZE_BOMB System and welcome the Detroit Pride audience.",
  energy: "The Steve Ballmer loop! Start with humor and extreme passion for building software.",
  "audience-pulse": "Get a feel for the room's experience level.",
  whoami: "Keep bio friendly, humble, and inspiring.",
  philosophy: "Explain: Beware of unearned wisdom. Auditing is sovereignty.",
  overview: "Walk through the agenda stages: Setup -> Data -> Components -> Deploy.",
  launch: "Instruct everyone to run git clone and get started.",
};
