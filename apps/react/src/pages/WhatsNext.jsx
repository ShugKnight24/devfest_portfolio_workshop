import { useState, useEffect } from "react";
import { GithubLogo, LinkedInLogo } from "../components/Icons";
import { useAchievements } from "../components/Achievements";
import { EmojiIcon } from "../components/Icons/EmojiIcon";

/**
 * What's Next Page
 *
 * A curated collection of resources and next steps for students
 * after completing the workshop.
 */

const resources = {
  courses: [
    {
      name: "freeCodeCamp",
      url: "https://www.freecodecamp.org/",
      description:
        "Comprehensive curriculum covering web development, JavaScript, Python, data science, and more",
      tags: ["Free", "Certifications", "Projects"],
      icon: "camp",
    },
    {
      name: "The Odin Project",
      url: "https://www.theodinproject.com/",
      description:
        "Full stack curriculum with JavaScript and Ruby on Rails paths",
      tags: ["Free", "Open Source", "Full Stack"],
      icon: "swords",
    },
    {
      name: "Codecademy",
      url: "https://www.codecademy.com/",
      description:
        "Interactive coding lessons in various programming languages",
      tags: ["Free Tier", "Interactive", "Beginner Friendly"],
      icon: "books",
    },
    {
      name: "Codedex",
      url: "https://www.codedex.io/",
      description:
        "Gamified approach to learning programming with playful lessons",
      tags: ["Free Tier", "Gamified", "Fun"],
      icon: "gamepad",
    },
    {
      name: "Scrimba",
      url: "https://scrimba.com/",
      description: "Interactive screencasts where you can pause and edit code",
      tags: ["Interactive", "React", "Frontend"],
      icon: "tv",
    },
    {
      name: "Frontend Masters",
      url: "https://frontendmasters.com/",
      description: "Expert-led courses on frontend and full-stack development",
      tags: ["Premium", "Expert", "In-depth"],
      icon: "gradCap",
    },
  ],
  games: [
    {
      name: "Flexbox Froggy",
      url: "https://flexboxfroggy.com/",
      description: "Learn CSS Flexbox by helping a frog reach its lily pad",
      tags: ["CSS", "Free", "Beginner"],
      icon: "frog",
    },
    {
      name: "Grid Garden",
      url: "https://cssgridgarden.com/",
      description: "Learn CSS Grid by growing your virtual garden",
      tags: ["CSS", "Free", "Beginner"],
      icon: "carrot",
    },
    {
      name: "CSS Diner",
      url: "https://flukeout.github.io/",
      description: "Master CSS selectors with a restaurant theme",
      tags: ["CSS", "Free", "Selectors"],
      icon: "forkKnife",
    },
    {
      name: "Flexbox Defense",
      url: "http://www.flexboxdefense.com/",
      description: "Tower defense game to learn CSS Flexbox",
      tags: ["CSS", "Free", "Game"],
      icon: "castle",
    },
    {
      name: "CodeCombat",
      url: "https://codecombat.com/",
      description: "Learn programming through an adventure game",
      tags: ["JavaScript", "Python", "RPG"],
      icon: "swords",
    },
    {
      name: "Tailwind Trainer",
      url: "https://codepip.com/games/tailwind-trainer/",
      description: "Practice Tailwind CSS utility classes",
      tags: ["Tailwind", "Free", "Practice"],
      icon: "wind",
    },
  ],
  documentation: [
    {
      name: "React Documentation",
      url: "https://react.dev/",
      description: "Official React docs with interactive examples",
      tags: ["React", "Official", "Reference"],
      icon: "atom",
    },
    {
      name: "MDN Web Docs",
      url: "https://developer.mozilla.org/",
      description: "The definitive resource for web technologies",
      tags: ["HTML", "CSS", "JavaScript"],
      icon: "book",
    },
    {
      name: "Tailwind CSS Docs",
      url: "https://tailwindcss.com/docs",
      description: "Comprehensive Tailwind documentation with examples",
      tags: ["CSS", "Tailwind", "Reference"],
      icon: "wind",
    },
    {
      name: "JavaScript.info",
      url: "https://javascript.info/",
      description: "Modern JavaScript tutorial from basics to advanced",
      tags: ["JavaScript", "Tutorial", "Free"],
      icon: "scroll",
    },
  ],
  practice: [
    {
      name: "LeetCode",
      url: "https://leetcode.com/",
      description: "Coding challenges for interview preparation",
      tags: ["Algorithms", "Interviews", "Free Tier"],
      icon: "calculator",
    },
    {
      name: "Frontend Mentor",
      url: "https://www.frontendmentor.io/",
      description: "Real-world frontend challenges with designs provided",
      tags: ["Frontend", "Projects", "Free Tier"],
      icon: "palette",
    },
    {
      name: "Exercism",
      url: "https://exercism.org/",
      description: "Practice coding with mentorship",
      tags: ["Free", "Mentorship", "Multi-language"],
      icon: "dumbbell",
    },
    {
      name: "Codewars",
      url: "https://www.codewars.com/",
      description: "Train on coding challenges called kata",
      tags: ["Challenges", "Community", "Free"],
      icon: "torii",
    },
    {
      name: "Project Euler",
      url: "https://projecteuler.net/",
      description: "Mathematical/programming problems",
      tags: ["Math", "Algorithms", "Free"],
      icon: "calculator",
    },
  ],
  tools: [
    {
      name: "VS Code",
      url: "https://code.visualstudio.com/",
      description: "The most popular code editor with great extensions",
      tags: ["Editor", "Free", "Extensions"],
      icon: "laptop",
    },
    {
      name: "GitHub",
      url: "https://github.com/",
      description: "Host your code, collaborate, and build your portfolio",
      tags: ["Git", "Portfolio", "Collaboration"],
      icon: "gitBranch",
    },
    {
      name: "Vercel",
      url: "https://vercel.com/",
      description: "Deploy your frontend projects in seconds",
      tags: ["Hosting", "Free Tier", "Fast"],
      icon: "triangle",
    },
    {
      name: "Figma",
      url: "https://www.figma.com/",
      description: "Design tool to create mockups and prototypes",
      tags: ["Design", "Free Tier", "Collaboration"],
      icon: "palette",
    },
    {
      name: "Postman",
      url: "https://www.postman.com/",
      description: "Test and document APIs",
      tags: ["API", "Testing", "Free"],
      icon: "mail",
    },
  ],
  community: [
    {
      name: "Dev.to",
      url: "https://dev.to/",
      description: "Community of developers sharing articles and discussions",
      tags: ["Articles", "Community", "Free"],
      icon: "laptop",
    },
    {
      name: "Stack Overflow",
      url: "https://stackoverflow.com/",
      description: "Q&A for programmers - search for solutions",
      tags: ["Q&A", "Help", "Free"],
      icon: "books",
    },
    {
      name: "Discord Communities",
      url: "https://discord.com/",
      description: "Join developer communities (Reactiflux, Tailwind, etc.)",
      tags: ["Chat", "Community", "Real-time"],
      icon: "chat",
    },
    {
      name: "Twitter/X Tech Community",
      url: "https://twitter.com/",
      description: "Follow developers and stay updated on tech trends",
      tags: ["Social", "News", "Networking"],
      icon: "bird",
    },
  ],
};

const nextSteps = [
  {
    title: "Polish Your Portfolio",
    description:
      "Add more projects, customize the theme, and make it uniquely yours",
    icon: "sparkles",
    difficulty: "Easy",
    timeEstimate: "1-2 hours",
  },
  {
    title: "Add More Projects",
    description: "Build 2-3 small projects to showcase different skills",
    icon: "tools",
    difficulty: "Medium",
    timeEstimate: "1-2 weeks",
  },
  {
    title: "Connect a Custom Domain",
    description: "Get a .dev or .com domain to look more professional",
    icon: "globe",
    difficulty: "Easy",
    timeEstimate: "30 minutes",
  },
  {
    title: "Add a Blog Section",
    description: "Write about what you're learning to reinforce knowledge",
    icon: "pencil",
    difficulty: "Medium",
    timeEstimate: "3-4 hours",
  },
  {
    title: "Integrate GitHub API",
    description: "Show your live repositories on your portfolio",
    icon: "gitBranch",
    difficulty: "Medium",
    timeEstimate: "2-3 hours",
  },
  {
    title: "Add Animations",
    description: "Learn Framer Motion or CSS animations to add polish",
    icon: "clapper",
    difficulty: "Medium",
    timeEstimate: "4-5 hours",
  },
  {
    title: "Make It Accessible",
    description: "Add ARIA labels, keyboard navigation, and proper semantics",
    icon: "accessibility",
    difficulty: "Medium",
    timeEstimate: "2-3 hours",
  },
  {
    title: "Learn TypeScript",
    description: "Add type safety to catch bugs before they happen",
    icon: "book",
    difficulty: "Hard",
    timeEstimate: "1-2 weeks",
  },
];

const ResourceCard = ({ resource }) => (
  <a
    href={resource.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block p-5 bg-(--color-surface) dark:bg-(--color-surface-dark) rounded-xl border border-(--color-border) dark:border-(--color-border-dark) hover:border-(--color-primary) dark:hover:border-(--color-primary) hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-start gap-4">
      <span className="text-3xl text-(--color-primary)">
        <EmojiIcon name={resource.icon} className="w-8 h-8" />
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark) group-hover:text-(--color-primary) transition-colors flex items-center gap-2">
          {resource.name}
          <svg
            className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </h3>
        <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium mt-1 line-clamp-2">
          {resource.description}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-(--color-border)/20 dark:bg-(--color-border-dark)/30 text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium rounded-full border border-(--color-border)/30 dark:border-(--color-border-dark)/30"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  </a>
);

const NextStepCard = ({ step, index }) => {
  const difficultyColors = {
    Easy: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold",
    Medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold",
    Hard: "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold",
  };

  return (
    <div className="flex items-start gap-4 p-5 bg-(--color-surface) dark:bg-(--color-surface-dark) rounded-xl border border-(--color-border) dark:border-(--color-border-dark) hover:shadow-md transition-shadow">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-(--color-primary)/10 text-(--color-primary) font-bold shrink-0">
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl text-(--color-primary)">
            <EmojiIcon name={step.icon} className="w-6 h-6" />
          </span>
          <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark)">
            {step.title}
          </h3>
        </div>
        <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium mb-3">
          {step.description}
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span
            className={`px-2 py-1 rounded-full ${
              difficultyColors[step.difficulty]
            }`}
          >
            {step.difficulty}
          </span>
          <span className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium flex items-center gap-1">
            <EmojiIcon name="timer" className="w-3.5 h-3.5" /> {step.timeEstimate}
          </span>
        </div>
      </div>
    </div>
  );
};

export const WhatsNext = () => {
  const [activeCategory, setActiveCategory] = useState("courses");
  const { trackAction } = useAchievements();

  // Track visiting this page for achievement
  useEffect(() => {
    trackAction("visit_whats_next");
  }, [trackAction]);

  const categories = [
    {
      id: "courses",
      icon: "books",
      label: "Courses",
      description: "Structured learning paths",
    },
    {
      id: "games",
      icon: "gamepad",
      label: "Games",
      description: "Learn by playing",
    },
    {
      id: "documentation",
      icon: "book",
      label: "Docs",
      description: "Reference materials",
    },
    {
      id: "practice",
      icon: "dumbbell",
      label: "Practice",
      description: "Coding challenges",
    },
    {
      id: "tools",
      icon: "tools",
      label: "Tools",
      description: "Essential software",
    },
    {
      id: "community",
      icon: "users",
      label: "Community",
      description: "Connect with others",
    },
  ];

  return (
    <div className="min-h-screen bg-(--color-background) text-(--color-text) dark:text-(--color-text-dark) py-24">
      {/* Hero Section */}
      <div className="section-container text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-primary)/10 text-(--color-primary) rounded-full text-sm font-bold mb-6 border border-(--color-primary)/20">
          <span>
            <EmojiIcon name="party" className="w-5 h-5 inline-block" />
          </span>
          <span>Congratulations on completing the workshop!</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-(--color-text) dark:text-(--color-text-dark) mb-4">
          What's <span className="text-(--color-primary)">Next</span>?
        </h1>
        <p className="text-xl text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium max-w-2xl mx-auto">
          Your journey doesn't end here. Here are resources and next steps to
          continue growing as a developer.
        </p>
      </div>

      {/* Next Steps Section */}
      <div className="section-container mb-20">
        <h2 className="text-2xl font-black text-(--color-text) dark:text-(--color-text-dark) mb-2 text-center flex items-center justify-center gap-2">
          <EmojiIcon
            name="rocket"
            className="w-6 h-6 inline-block align-text-bottom"
          />{" "}
          Suggested Next Steps
        </h2>
        <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium text-center mb-8">
          Pick one and start building momentum
        </p>
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {nextSteps.map((step, index) => (
            <NextStepCard key={step.title} step={step} index={index} />
          ))}
        </div>
      </div>

      {/* Resources Section */}
      <div className="section-container">
        <h2 className="text-2xl font-black text-(--color-text) dark:text-(--color-text-dark) mb-2 text-center flex items-center justify-center gap-2">
          <EmojiIcon
            name="books"
            className="w-6 h-6 inline-block align-text-bottom"
          />{" "}
          Learning Resources
        </h2>
        <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium text-center mb-8">
          Curated resources to continue your journey
        </p>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                activeCategory === category.id
                  ? "bg-(--color-primary) text-(--color-primary-text) shadow-lg"
                  : "bg-(--color-surface) dark:bg-(--color-surface-dark) text-(--color-text) dark:text-(--color-text-dark) hover:border-(--color-primary) border border-(--color-border) dark:border-(--color-border-dark)"
              }`}
            >
              <EmojiIcon
                name={category.icon}
                className="w-4 h-4 inline-block mr-1.5"
              />
              {category.label}
            </button>
          ))}
        </div>

        {/* Active Category Description */}
        <p className="text-center text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium mb-6">
          {categories.find((c) => c.id === activeCategory)?.description}
        </p>

        {/* Resource Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {resources[activeCategory].map((resource) => (
            <ResourceCard key={resource.name} resource={resource} />
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="section-container mt-20">
        <div className="bg-linear-to-r from-(--color-primary) to-(--color-secondary) rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-black mb-4">
            Keep Building, Keep Learning
          </h2>
          <p className="text-white/90 font-medium max-w-2xl mx-auto mb-8">
            The best way to learn is by doing. Pick a project, make mistakes,
            and grow from them. Remember: every expert was once a beginner.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-950 rounded-lg font-bold hover:bg-gray-100 transition-colors"
            >
              <GithubLogo className="w-5 h-5" />
              Share Your Work
            </a>
            <a
              href="https://linkedin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-lg font-bold hover:bg-white/30 transition-colors"
            >
              <LinkedInLogo className="w-5 h-5" />
              Update Your LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* Inspirational Quote */}
      <div className="section-container mt-16 text-center">
        <blockquote className="text-2xl md:text-3xl font-light text-(--color-text) dark:text-(--color-text-dark) italic max-w-3xl mx-auto">
          "The only way to do great work is to love what you do."
        </blockquote>
        <p className="mt-4 text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-semibold">— Steve Jobs</p>
      </div>
    </div>
  );
};

export default WhatsNext;
