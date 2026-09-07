/**
 * Portfolio Data Configuration — Strict Typed JSDoc
 *
 * @typedef {Object} SocialLinks
 * @property {string|null} github - GitHub profile or repository URL
 * @property {string|null} linkedin - LinkedIn public profile URL
 * @property {string|null} twitter - Twitter / X profile URL
 *
 * @typedef {Object} PersonalInfo
 * @property {string} name - Developer full legal or stage name
 * @property {string} title - Primary engineering title / role
 * @property {string} avatar - Relative or absolute URI for hero avatar
 * @property {string} aboutImage - URI for about section visual
 * @property {string} bio - Concise developer bio (supports high contrast)
 * @property {string} email - Primary contact email
 * @property {string} portfolio - Canonical portfolio domain URL
 * @property {SocialLinks} social - Social media profile links
 *
 * @typedef {'beginner'|'intermediate'|'advanced'} SkillLevel
 * @typedef {'frontend'|'backend'|'tools'|'language'|'ai'} SkillCategory
 *
 * @typedef {Object} SkillItem
 * @property {string} name - Name of technology or framework
 * @property {SkillLevel} level - Proficiency tier
 * @property {SkillCategory} category - Stack classification category
 *
 * @typedef {Object} ProjectItem
 * @property {number} id - Unique numeric identifier
 * @property {string} title - Project headline
 * @property {string} description - High-impact project summary
 * @property {string} image - Preview image URI
 * @property {string[]} tags - Technology & methodology tags
 * @property {string|null} githubUrl - Source code repository link
 * @property {string|null} liveUrl - Production deployment link
 * @property {boolean} featured - Display as highlighted spotlight
 *
 * @typedef {Object} PortfolioData
 * @property {PersonalInfo} personal - Personal biographical and social metadata
 * @property {SkillItem[]} skills - Array of categorized skills
 * @property {ProjectItem[]} projects - Catalog of portfolio projects
 */

/** @type {PortfolioData} */
export const portfolioData = {
  // Personal Information
  personal: {
    name: "Shugmi Shumunov",
    title: "Full Stack Developer - Love JavaScript",
    avatar: "./assets/images/shug_headshot.jpg",
    aboutImage: "./assets/images/shug_animated.jpg",
    bio: "I'm a passionate developer who loves building beautiful, functional web applications. I specialize in modern JavaScript frameworks and creating seamless user experiences.",
    email: "sshumunov@gmail.com",
    portfolio: "https://shugknight24.github.io",
    social: {
      github: "https://github.com/shugknight24",
      linkedin: "https://www.linkedin.com/in/shugmishumunov/",
      twitter: null,
    },
  },

  // Skills - Categorized with strict typing
  skills: [
    { name: "React", level: "advanced", category: "frontend" },
    { name: "JavaScript", level: "advanced", category: "language" },
    { name: "TypeScript", level: "advanced", category: "language" },
    { name: "Tailwind CSS", level: "advanced", category: "frontend" },
    { name: "Agentic AI / AntiGravity", level: "advanced", category: "ai" },
    { name: "Vue.js", level: "intermediate", category: "language" },
    { name: "Svelte", level: "beginner", category: "language" },
    { name: "Angular", level: "beginner", category: "language" },
    { name: "PHP", level: "intermediate", category: "language" },
    { name: "Python", level: "intermediate", category: "language" },
    { name: "Node.js", level: "intermediate", category: "backend" },
    { name: "Express.js", level: "intermediate", category: "backend" },
    { name: "Git", level: "intermediate", category: "tools" },
    { name: "REST APIs", level: "intermediate", category: "backend" },
  ],

  // Projects - The 3 "Speed of Thought" Framework Tie-Ins
  projects: [
    {
      id: 1,
      title: "MiDevFest Website & Portfolio Workshop",
      description:
        "The Chainsaw Man Framework (Speed via Momentum): A living canvas sandbox built with React and Tailwind CSS. Attendees prompt the engine live and mold the chaos into production software in seconds.",
      image: "./assets/images/devfest_site.png",
      tags: ["Speed via Momentum", "Chainsaw Man", "React", "TailwindCSS"],
      githubUrl: "https://github.com/GDG-Detroit/devfest-website",
      liveUrl: "https://midevfest.com",
      featured: true,
    },
    {
      id: 2,
      title: "My Portfolio Site",
      description:
        "Personal portfolio website showcasing interactive micro-applications, developer tools, and rapid prototyping experiments.",
      image: "./assets/images/personal_portfolio.png",
      tags: ["React", "SCSS", "Audience of One"],
      githubUrl: "https://github.com/ShugKnight24/react_portfolio",
      liveUrl: "https://shugknight24.github.io",
      featured: true,
    },
    {
      id: 3,
      title: "J. Simmons Productions",
      description:
        "Building high-speed media distribution pipelines. We deploy robust backend hooks so video channels scale on lightweight, dynamic modules.",
      image: "./assets/images/devfest_site.png",
      tags: ["Audience of One", "Agentic Tool", "React", "Dynamic Modules"],
      githubUrl: null,
      liveUrl: "https://jsimmonsproductions.com",
      featured: true,
    },
    {
      id: 4,
      title: "Jacked Alien",
      description:
        "Fitness automation scaled through modular state machines. Reusable training modules replace complex customized code, driving rapid progress tracking.",
      image: "./assets/images/personal_portfolio.png",
      tags: ["Audience of One", "State Machines", "React", "Zero-Bloat"],
      githubUrl: "https://github.com/shugknight24/jacked-alien",
      liveUrl: null,
      featured: true,
    },
    {
      id: 5,
      title: "Criminal Cookies (High-Frequency Cart)",
      description:
        "The Reacher Framework (Speed via Deduction): Guerilla-style e-commerce at scale. A localized, high-frequency checkout engine engineered to eliminate NPM bloat and 45 tracking scripts.",
      image: "./assets/images/shum_sol.png",
      tags: ["Speed via Deduction", "The Reacher Framework", "Zero Bloat", "Vite"],
      githubUrl: "https://github.com/shugknight24/criminal-cookies",
      liveUrl: null,
      featured: true,
    },
    {
      id: 6,
      title: "Shumunov Solutions",
      description:
        "A business website for Shumunov Solutions, offering custom web development, backend integrations, and technical consulting.",
      image: "./assets/images/shum_sol.png",
      tags: ["React", "Tailwind CSS", "Consulting"],
      githubUrl: null,
      liveUrl: "http://shumunovsolutions.com",
      featured: true,
    },
    {
      id: 7,
      title: "Pomodoro (Pomidor Micro-Loop)",
      description:
        "The Iron Framework (Speed via Form): An Audience of One productivity micro-loop. Built with strict architectural isolation separating the state machine from the UI.",
      image: "./assets/images/pomodoro.png",
      tags: ["Speed via Form", "The Iron Protocol", "State Isolation", "JavaScript"],
      githubUrl: "https://github.com/shugknight24/pomodoro",
      liveUrl: "https://shugknight24.github.io/pomodoro/",
      featured: false,
    },
  ],
};

export default portfolioData;
