import { useState, useMemo } from "react";
import { EmojiIcon } from "../components/Icons/EmojiIcon";

/**
 * Resources Page
 *
 * A curated collection of developer resources organized by category.
 * Features search/filter, category cards with icons, and external links.
 */

const resourceCategories = [
  {
    id: "ai-tools",
    label: "AI Development Tools",
    icon: "robot",
    description: "AI-powered tools to supercharge your development workflow",
    resources: [
      {
        name: "Gemini Code Assist",
        url: "https://gemini.google.com",
        description: "Google's AI coding assistant",
        icon: "sparkles",
      },
      {
        name: "GitHub Copilot",
        url: "https://github.com/features/copilot",
        description: "AI pair programmer",
        icon: "robot",
      },
      {
        name: "Cursor",
        url: "https://cursor.com",
        description: "AI-first code editor",
        icon: "mouse",
      },
      {
        name: "Claude",
        url: "https://claude.ai",
        description: "Anthropic's AI assistant",
        icon: "brain",
      },
      {
        name: "OpenCode",
        url: "https://github.com/nicepkg/opencode",
        description: "Open-source AI coding CLI",
        icon: "laptop",
      },
      {
        name: "Antigravity",
        url: "https://deepmind.google",
        description: "Google DeepMind's agentic AI assistant",
        icon: "rocket",
      },
      {
        name: "v0",
        url: "https://v0.dev",
        description: "Vercel's AI UI generator",
        icon: "palette",
      },
      {
        name: "Bolt",
        url: "https://bolt.new",
        description: "StackBlitz AI full-stack generator",
        icon: "lightning",
      },
    ],
  },
  {
    id: "frameworks",
    label: "Framework Documentation",
    icon: "book",
    description: "Official docs for modern web frameworks and tools",
    resources: [
      {
        name: "React",
        url: "https://react.dev",
        description: "Official React documentation with interactive examples",
        icon: "atom",
      },
      {
        name: "Vue 3",
        url: "https://vuejs.org",
        description: "Progressive JavaScript framework docs",
        icon: "heartGreen",
      },
      {
        name: "Svelte",
        url: "https://svelte.dev",
        description: "Cybernetically enhanced web apps",
        icon: "fire",
      },
      {
        name: "MDN Web Docs",
        url: "https://developer.mozilla.org",
        description: "The definitive resource for web technologies",
        icon: "book",
      },
      {
        name: "Tailwind CSS",
        url: "https://tailwindcss.com",
        description: "Utility-first CSS framework",
        icon: "wind",
      },
      {
        name: "web.dev",
        url: "https://web.dev",
        description: "Google's guidance for modern web development",
        icon: "globe",
      },
    ],
  },
  {
    id: "learning",
    label: "Learning Platforms",
    icon: "gradCap",
    description: "Structured learning paths and interactive courses",
    resources: [
      {
        name: "freeCodeCamp",
        url: "https://freecodecamp.org",
        description: "Free comprehensive web development curriculum",
        icon: "camp",
      },
      {
        name: "The Odin Project",
        url: "https://theodinproject.com",
        description: "Full stack curriculum with real-world projects",
        icon: "swords",
      },
      {
        name: "Frontend Masters",
        url: "https://frontendmasters.com",
        description: "Expert-led frontend and full-stack courses",
        icon: "gradCap",
      },
      {
        name: "Scrimba",
        url: "https://scrimba.com",
        description: "Interactive screencasts you can edit live",
        icon: "tv",
      },
      {
        name: "Codedex",
        url: "https://codedex.io",
        description: "Gamified approach to learning programming",
        icon: "gamepad",
      },
      {
        name: "Codecademy",
        url: "https://codecademy.com",
        description: "Interactive coding lessons in many languages",
        icon: "books",
      },
    ],
  },
  {
    id: "practice",
    label: "Practice & Challenges",
    icon: "dumbbell",
    description: "Sharpen your skills with coding challenges and projects",
    resources: [
      {
        name: "Frontend Mentor",
        url: "https://frontendmentor.io",
        description: "Real-world frontend challenges with designs provided",
        icon: "palette",
      },
      {
        name: "LeetCode",
        url: "https://leetcode.com",
        description: "Coding challenges for interview preparation",
        icon: "calculator",
      },
      {
        name: "Exercism",
        url: "https://exercism.org",
        description: "Practice coding with mentorship in 70+ languages",
        icon: "dumbbell",
      },
      {
        name: "Codewars",
        url: "https://codewars.com",
        description: "Train on coding challenges called kata",
        icon: "torii",
      },
    ],
  },
  {
    id: "css-games",
    label: "CSS Games",
    icon: "gamepad",
    description: "Learn CSS layout techniques through fun interactive games",
    resources: [
      {
        name: "Flexbox Froggy",
        url: "https://flexboxfroggy.com",
        description: "Learn CSS Flexbox by helping a frog reach its lily pad",
        icon: "frog",
      },
      {
        name: "Grid Garden",
        url: "https://cssgridgarden.com",
        description: "Learn CSS Grid by growing your virtual garden",
        icon: "carrot",
      },
      {
        name: "CSS Diner",
        url: "https://flukeout.github.io",
        description: "Master CSS selectors with a restaurant theme",
        icon: "forkKnife",
      },
    ],
  },
  {
    id: "design",
    label: "Design Resources",
    icon: "palette",
    description: "Tools for colors, typography, icons, and visual design",
    resources: [
      {
        name: "Figma",
        url: "https://figma.com",
        description: "Collaborative design tool for mockups and prototypes",
        icon: "palette",
      },
      {
        name: "Coolors",
        url: "https://coolors.co",
        description: "Color palette generator",
        icon: "rainbow",
      },
      {
        name: "Google Fonts",
        url: "https://fonts.google.com",
        description: "Free open-source font library",
        icon: "letters",
      },
      {
        name: "Heroicons",
        url: "https://heroicons.com",
        description: "Beautiful hand-crafted SVG icons by the Tailwind team",
        icon: "hero",
      },
      {
        name: "Lucide Icons",
        url: "https://lucide.dev",
        description: "Beautiful and consistent open-source icons",
        icon: "pencil",
      },
    ],
  },
  {
    id: "deployment",
    label: "Deployment",
    icon: "rocket",
    description: "Ship your projects to the world with modern hosting",
    resources: [
      {
        name: "Vercel",
        url: "https://vercel.com",
        description: "Deploy frontend projects in seconds",
        icon: "rocket",
      },
      {
        name: "Netlify",
        url: "https://netlify.com",
        description: "Build, deploy, and scale modern web projects",
        icon: "globe",
      },
      {
        name: "GitHub Pages",
        url: "https://pages.github.com",
        description: "Free static hosting directly from your GitHub repos",
        icon: "document",
      },
    ],
  },
  {
    id: "community",
    label: "Community",
    icon: "users",
    description: "Connect with developers and grow your network",
    resources: [
      {
        name: "GDG",
        url: "https://developers.google.com/community/gdg",
        description: "Google Developer Groups — local tech communities",
        icon: "globe",
      },
      {
        name: "Dev.to",
        url: "https://dev.to",
        description: "Community of developers sharing articles and ideas",
        icon: "user",
      },
      {
        name: "Stack Overflow",
        url: "https://stackoverflow.com",
        description: "Q&A for programmers — search for solutions",
        icon: "books",
      },
    ],
  },
];

/** External link icon SVG shared across resource links */
const ExternalLinkIcon = () => (
  <svg
    className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
);

/** Single resource link card */
const ResourceLink = ({ resource }) => (
  <a
    href={resource.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-(--color-border)/20 dark:hover:bg-(--color-border-dark)/30 transition-colors"
  >
    <span className="shrink-0 text-(--color-primary)">
      <EmojiIcon name={resource.icon} emoji={resource.icon} className="w-5 h-5" />
    </span>
    <div className="flex-1 min-w-0">
      <span className="font-semibold text-(--color-text) dark:text-(--color-text-dark) group-hover:text-(--color-primary) transition-colors">
        {resource.name}
      </span>
      <span className="text-(--color-border) dark:text-(--color-border-dark) mx-2">—</span>
      <span className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
        {resource.description}
      </span>
    </div>
    <ExternalLinkIcon />
  </a>
);

/** Category card containing a group of resources */
const CategoryCard = ({ category }) => (
  <div
    id={`resource-category-${category.id}`}
    className="bg-(--color-surface) dark:bg-(--color-surface-dark) rounded-xl shadow-lg border border-(--color-border) dark:border-(--color-border-dark) overflow-hidden hover:shadow-xl transition-shadow duration-300"
  >
    {/* Category header */}
    <div className="px-6 py-5 border-b border-(--color-border) dark:border-(--color-border-dark) bg-(--color-surface-dark)/20">
      <div className="flex items-center gap-3">
        <span className="text-2xl text-(--color-primary)">
          <EmojiIcon name={category.icon || category.emoji} emoji={category.emoji} className="w-7 h-7" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-(--color-text) dark:text-(--color-text-dark)">
            {category.label}
          </h2>
          <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
            {category.description}
          </p>
        </div>
        <span className="ml-auto px-2.5 py-1 text-xs font-semibold bg-(--color-primary)/15 text-(--color-primary) rounded-full border border-(--color-primary)/20">
          {category.resources.length}
        </span>
      </div>
    </div>

    {/* Resource links */}
    <div className="p-2 divide-y divide-(--color-border)/40 dark:divide-(--color-border-dark)/40">
      {category.resources.map((resource) => (
        <ResourceLink key={resource.name} resource={resource} />
      ))}
    </div>
  </div>
);

export const Resources = () => {
  const [searchQuery, setSearchQuery] = useState("");

  /** Filter categories and their resources based on the search query */
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return resourceCategories;

    const query = searchQuery.toLowerCase();
    return resourceCategories
      .map((category) => {
        // Check if category label matches
        const categoryMatches = category.label.toLowerCase().includes(query);
        // Filter resources within the category
        const matchingResources = category.resources.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query)
        );

        if (categoryMatches) return category;
        if (matchingResources.length > 0) {
          return { ...category, resources: matchingResources };
        }
        return null;
      })
      .filter(Boolean);
  }, [searchQuery]);

  const totalResources = resourceCategories.reduce(
    (acc, cat) => acc + cat.resources.length,
    0
  );

  return (
    <div className="min-h-screen bg-(--color-background) text-(--color-text) dark:text-(--color-text-dark) py-24">
      {/* Hero Section */}
      <div className="section-container text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-(--color-primary)/10 text-(--color-primary) rounded-full text-sm font-semibold mb-6 border border-(--color-primary)/20">
          <span>
            <EmojiIcon name="box" className="w-5 h-5 inline-block" />
          </span>
          <span>{totalResources} curated resources</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-(--color-text) dark:text-(--color-text-dark) mb-4">
          Developer{" "}
          <span className="text-(--color-primary)">Resources</span>
        </h1>
        <p className="text-xl text-(--color-muted-text) dark:text-(--color-muted-text-dark) max-w-2xl mx-auto mb-10">
          A curated collection of tools, platforms, and communities to help you
          build, learn, and grow as a developer.
        </p>

        {/* Search / Filter Bar */}
        <div className="max-w-xl mx-auto relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            id="resources-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-12 pr-4 py-3.5 bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl text-(--color-text) dark:text-(--color-text-dark) placeholder-(--color-muted-text)/60 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/50 focus:border-(--color-primary) shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-4 flex items-center text-(--color-muted-text) hover:text-(--color-text) dark:hover:text-(--color-text-dark) cursor-pointer"
              aria-label="Clear search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Search result count */}
        {searchQuery && (
          <p className="mt-4 text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) font-medium">
            {filteredCategories.length === 0
              ? "No resources found"
              : `Showing ${filteredCategories.reduce((acc, cat) => acc + cat.resources.length, 0)} resources in ${filteredCategories.length} ${filteredCategories.length === 1 ? "category" : "categories"}`}
          </p>
        )}
      </div>

      {/* Quick Category Jump */}
      {!searchQuery && (
        <div className="section-container mb-12">
          <div className="flex flex-wrap justify-center gap-2">
            {resourceCategories.map((category) => (
              <a
                key={category.id}
                href={`#resource-category-${category.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-(--color-surface) dark:bg-(--color-surface-dark) text-(--color-text) dark:text-(--color-text-dark) rounded-full border border-(--color-border) dark:border-(--color-border-dark) hover:border-(--color-primary) hover:text-(--color-primary) font-medium transition-colors"
              >
                <EmojiIcon name={category.icon || category.emoji} className="w-4 h-4 text-(--color-primary)" />
                {category.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Category Cards Grid */}
      <div className="section-container">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <EmojiIcon name="search" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl text-gray-700 dark:text-gray-200 font-medium">
              No resources match your search
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="section-container mt-20">
        <div className="bg-linear-to-r from-(--color-primary) to-(--color-secondary) rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Know a great resource?
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            This list is community-driven. If you know a resource that should be
            here, let us know at the workshop or open a pull request!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Resources;
