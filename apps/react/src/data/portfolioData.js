/**
 * Portfolio Data Configuration — Strict Typed JSDoc
 *
 * All user identity, skills, projects, and personal operatives are isolated here.
 * Attendees can customize their entire portfolio and agents without modifying UI components.
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
 * @typedef {Object} OperativeItem
 * @property {string} id - Unique slug
 * @property {string} name - Operative name / moniker
 * @property {string} character - Squad archetype (Neagley, Finlay, Roscoe, O'Donnell, Denji, Makima)
 * @property {string} problem - The acute personal friction solved
 * @property {string} target - Language & runtime target (e.g., Python / Web API)
 * @property {string[]} constraints - Zero-bloat constraints
 * @property {string} samplePrompt - The prompt used to generate the operative
 * @property {string} sampleCode - Executable sample snippet
 *
 * @typedef {Object} PortfolioData
 * @property {PersonalInfo} personal - Personal biographical and social metadata
 * @property {SkillItem[]} skills - Array of categorized skills
 * @property {ProjectItem[]} projects - Catalog of portfolio projects
 * @property {OperativeItem[]} operatives - Audience of One bespoke personal agents
 */

/** @type {PortfolioData} */
export const portfolioData = {
  // Personal Information
  personal: {
    name: "Shugmi Shumunov",
    title: "Full Stack Developer - Love JavaScript",
    avatar: "./assets/images/shug_headshot.jpg",
    aboutImage: "./assets/images/shug_animated.jpg",
    bio: "I build sovereign software for an Audience of One. Reclaiming personal autonomy through AI agents, zero-bloat web engineering, and forensic telemetry.",
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
      title: "MiDevFest Website",
      description:
        "The official Michigan DevFest site for GDG Detroit, built with React and Tailwind CSS.",
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
      title: "Cart Commerce (High-Frequency Cart)",
      description:
        "The Reacher Protocol (Speed via Deduction): A white-label storefront on Next.js 15 and React 19. Cart state is a reducer, styling is CSS Modules on design tokens, and every SKU ships GA4 enhanced-ecommerce events plus client-side bot scoring. 129 Vitest tests, zero Sass.",
      image: "./assets/images/cart_commerce.png",
      tags: ["Speed via Deduction", "The Reacher Protocol", "Next.js 15", "React 19", "Zero Bloat"],
      githubUrl: "https://github.com/ShugKnight24/next_shopping_cart",
      liveUrl: "https://next-shopping-cart-beta.vercel.app",
      featured: true,
    },
    {
      id: 5,
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
      id: 6,
      title: "Pomidor (\u043f\u043e\u043c\u0438\u0434\u043e\u0440)",
      description:
        "The Iron Protocol (Speed via Form): An offline-first focus suite in zero-dependency vanilla ES modules. Every tenant's tasks, streaks and notes live in their own client-storage partition \u2014 no backend to trust, no tracking to opt out of. Installable PWA, four languages (EN/RU/AZ/HE).",
      image: "./assets/images/pomidor.png",
      tags: ["Speed via Form", "The Iron Protocol", "Vanilla JS", "PWA", "Audience of One"],
      githubUrl: "https://github.com/ShugKnight24/pomidor",
      liveUrl: "https://shugknight24.github.io/pomidor/",
      featured: true,
    },
    {
      id: 7,
      title: "Clockwork Carnage",
      description:
        "The Chainsaw Man Framework (Speed via Momentum): A DOOM-inspired FPS in vanilla JavaScript and HTML5 Canvas. No engine, no sprite sheets \u2014 every pixel is drawn procedurally in code. Nine-level campaign, endless arena mode, and a level builder that exports JSON.",
      image: "./assets/images/clockwork_carnage.png",
      tags: ["Speed via Momentum", "Chainsaw Man", "Vanilla JS", "HTML5 Canvas"],
      githubUrl: "https://github.com/ShugKnight24/clockwork_carnage",
      liveUrl: "https://shugknight24.github.io/clockwork_carnage/",
      featured: true,
    },
  ],

  // Audience of One: Personal Operatives & Bespoke Agent Blueprints
  operatives: [
    {
      id: "bank-csv-parser",
      name: "Forensic Ledger // Bank CSV Parser",
      character: "Reacher & Neagley (Deduction + Zero Bloat)",
      problem: "Parsing messy bank CSV exports into categorized expenses without uploading financial records to third-party cloud servers.",
      target: "Python 3 or Native Web API (Zero Deps)",
      constraints: ["Zero external NPM/pip packages", "Native CSV & Regex only", "100% offline execution"],
      samplePrompt: "Target: Python script. Goal: Parse local CSV exports from Chase and group transactions by category and month. Constraints: Native OS libraries only, zero external dependencies. Execute.",
      sampleCode: `import csv, sys
from collections import defaultdict
from datetime import datetime

def parse_ledger(filepath):
    categories = defaultdict(float)
    with open(filepath, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            amount = float(row.get('Amount', 0.0))
            category = row.get('Category', 'Uncategorized')
            categories[category] += amount
    for cat, total in sorted(categories.items(), key=lambda x: x[1]):
        print(f"{cat:25}: \${total:10.2f}")

if __name__ == '__main__':
    parse_ledger(sys.argv[1] if len(sys.argv) > 1 else 'transactions.csv')`,
    },
    {
      id: "school-email-scraper",
      name: "Family Signal // School Email Digest",
      character: "Roscoe (Local Moat & Context)",
      problem: "Scraping bloated weekly school newsletters to extract only action items, event dates, and permission slip deadlines.",
      target: "Vanilla JavaScript / Node.js Native",
      constraints: ["No heavy headless browser", "Local regex heuristic extraction", "Terminal or markdown output only"],
      samplePrompt: "Target: Node.js CLI. Goal: Extract dates, deadlines, and action items from school email newsletter dump. Constraints: Built-in readline and RegExp only. Output bullet list.",
      sampleCode: `const fs = require('fs');

function extractSchoolDeadlines(rawText) {
  const dateRegex = /(?:due|by|on|deadline|event)\\s+([A-Za-z]+ \\d{1,2}|\\d{1,2}\\/\\d{1,2})/gi;
  const matches = [...rawText.matchAll(dateRegex)];
  return matches.map(m => ({ phrase: m[0], line: m.input.slice(Math.max(0, m.index - 20), m.index + 40) }));
}

const text = fs.readFileSync('school_update.txt', 'utf8');
console.table(extractSchoolDeadlines(text));`,
    },
    {
      id: "meal-prep-compiler",
      name: "Macro Matrix // Meal Prep Compiler",
      character: "The Iron Protocol (Discipline & Hypertrophy)",
      problem: "Translating weekly calorie and protein targets into exact whole-food grocery weights without paying \$12/month for bloated diet apps.",
      target: "HTML5 / Vanilla JS State Machine",
      constraints: ["Single HTML file", "localStorage persistence", "Zero dependencies"],
      samplePrompt: "Target: Single HTML file. Goal: Interactive meal prep compiler calculating protein grams and food weights based on bodyweight target. Constraints: Zero external CSS/JS frameworks.",
      sampleCode: `const calculateTargets = (bwKg, targetProteinGPerKg = 2.2) => {
  const totalProtein = bwKg * targetProteinGPerKg;
  const chickenBreastG = (totalProtein * 0.6) / 0.31; // 31g protein per 100g
  const eggWhitesG = (totalProtein * 0.4) / 0.11;     // 11g protein per 100g
  return { totalProtein, chickenBreastG, eggWhitesG };
};
console.log(calculateTargets(88));`,
    },
    {
      id: "pomidor-micro-loop",
      name: "Pomidor // Tactical Focus Engine",
      character: "O'Donnell (The Switchblade)",
      problem: "Eliminating distraction with a high-intensity focus timer that bypasses bloated SaaS subscription trackers.",
      target: "Vanilla JS / Pure State Machine",
      constraints: ["Decoupled state machine", "Zero external analytics", "Sub-10ms render latency"],
      samplePrompt: "Target: React component. Goal: Pomodoro interval state machine with work, short break, and long break states. Constraints: Pure reducer, Web Audio API beeps, no npm sound files.",
      sampleCode: `export function pomidorReducer(state, action) {
  switch (action.type) {
    case 'TICK':
      if (state.timeLeft <= 1) return { ...state, timeLeft: state.intervalDuration, rounds: state.rounds + 1 };
      return { ...state, timeLeft: state.timeLeft - 1 };
    case 'TOGGLE':
      return { ...state, isRunning: !state.isRunning };
    default:
      return state;
  }
}`,
    },
  ],
};

export default portfolioData;
