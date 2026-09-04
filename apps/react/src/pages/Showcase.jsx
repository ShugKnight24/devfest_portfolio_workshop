import { useState, useEffect } from "react";
import portfolioData from "../data/examplePortfolioData";
import { ComponentComparer } from "../components/ComponentComparer";
import { useAchievements } from "../components/Achievements";

import {
  Email,
  GithubLogo,
  LinkedInLogo,
  TwitterLogo,
} from "../components/Icons";

// TODO: Move to index imports
// Import Header variants
import { HeaderDefault } from "../components/Headers/HeaderDefault";
import { HeaderSimple } from "../components/Headers/HeaderSimple";
import { HeaderGradient } from "../components/Headers/HeaderGradient";
import { HeaderSplit } from "../components/Headers/HeaderSplit";
import { HeaderAnimated } from "../components/Headers/HeaderAnimated";
import { HeaderAnimatedSplit } from "../components/Headers/HeaderAnimatedSplit";

// Import About variants
import { AboutDefault } from "../components/About/AboutDefault";
import { AboutSimple } from "../components/About/AboutSimple";
import { AboutImage } from "../components/About/AboutImage";
import { AboutSkills } from "../components/About/AboutSkills";
import { AboutStats } from "../components/About/AboutStats";
import { AboutAnimated } from "../components/About/AboutAnimated";

// Import Skills variants
import { SkillsDefault } from "../components/Skills/SkillsDefault";
import { SkillsSimple } from "../components/Skills/SkillsSimple";
import { SkillsGrouped } from "../components/Skills/SkillsGrouped";
import { SkillsProgress } from "../components/Skills/SkillsProgress";
import { SkillsDetails } from "../components/Skills/SkillsDetails";

// Import Footer variants
import { FooterSimple } from "../components/Footers/FooterSimple";
import { FooterMinimal } from "../components/Footers/FooterMinimal";
import { FooterBold } from "../components/Footers/FooterBold";
import { FooterGlass } from "../components/Footers/FooterGlass";
import { FooterDefault } from "../components/Footers/FooterDefault";

// Import Project variants
import { ProjectsSimple } from "../components/Projects/ProjectsSimple";
import { ProjectsFeatured } from "../components/Projects/ProjectsFeatured";
import { ProjectsMasonry } from "../components/Projects/ProjectsMasonry";
import { ProjectsTimeline } from "../components/Projects/ProjectsTimeline";
import { ProjectsFilterable } from "../components/Projects/ProjectsFilterable";
import { ProjectsCarousel } from "../components/Projects/ProjectsCarousel";
import { ProjectsDefault } from "../components/Projects/ProjectsDefault";

export const Showcase = () => {
  const [showGuide, setShowGuide] = useState(true);
  const { trackAction } = useAchievements();

  // Track visiting showcase for achievement
  useEffect(() => {
    trackAction("visit_showcase");
  }, [trackAction]);

  const { personal, skills, projects } = portfolioData;
  const { avatar, aboutImage, bio, name, social } = personal;
  const { github, linkedin, twitter, email } = social;

  const currentYear = new Date().getFullYear();

  const levelColors = {
    advanced: "bg-purple-100 text-purple-800",
    beginner: "bg-green-100 text-green-800",
    challenge: "bg-red-100 text-red-800",
    intermediate: "bg-blue-100 text-blue-800",
  };

  const socialLinks = [
    {
      name: "GitHub",
      url: github,
      color: "from-gray-700 to-gray-900",
      hoverColor: "hover:from-gray-600 hover:to-gray-800",
      icon: <GithubLogo />,
    },
    {
      name: "LinkedIn",
      url: linkedin,
      color: "from-blue-600 to-blue-800",
      hoverColor: "hover:from-blue-500 hover:to-blue-700",
      icon: <LinkedInLogo />,
    },
    {
      name: "Twitter",
      url: twitter,
      color: "from-sky-500 to-blue-600",
      hoverColor: "hover:from-sky-400 hover:to-blue-500",
      icon: <TwitterLogo />,
    },
    {
      name: "Contact Me",
      url: `mailto:${email}`,
      color: "from-green-500 to-green-700",
      hoverColor: "hover:from-green-400 hover:to-green-600",
      icon: <Email />,
    },
  ];

  // Define variant configurations for the comparer
  const headerVariants = [
    {
      name: "Default (Challenge)",
      difficulty: "Challenge",
      component: HeaderDefault,
      props: {},
    },
    {
      name: "Simple",
      difficulty: "Beginner",
      component: HeaderSimple,
      props: { personal },
    },
    {
      name: "Gradient",
      difficulty: "Beginner",
      component: HeaderGradient,
      props: { personal },
    },
    {
      name: "Split",
      difficulty: "Intermediate",
      component: HeaderSplit,
      props: { personal },
    },
    {
      name: "Animated",
      difficulty: "Advanced",
      component: HeaderAnimated,
      props: { personal },
    },
    {
      name: "Animated Split",
      difficulty: "Advanced",
      component: HeaderAnimatedSplit,
      props: { personal },
    },
  ];

  const aboutVariants = [
    {
      name: "Default (Challenge)",
      difficulty: "Challenge",
      component: AboutDefault,
      props: {},
    },
    {
      name: "Simple",
      difficulty: "Beginner",
      component: AboutSimple,
      props: { avatar, bio },
    },
    {
      name: "With Image",
      difficulty: "Beginner",
      component: AboutImage,
      props: { aboutImage, bio },
    },
    {
      name: "With Stats",
      difficulty: "Intermediate",
      component: AboutStats,
      props: { aboutImage, bio },
    },
    {
      name: "Animated",
      difficulty: "Advanced",
      component: AboutAnimated,
      props: { aboutImage, bio },
    },
  ];

  const skillsVariants = [
    {
      name: "Default (Challenge)",
      difficulty: "Challenge",
      component: SkillsDefault,
      props: {},
    },
    {
      name: "Simple",
      difficulty: "Beginner",
      component: SkillsSimple,
      props: { skills, levelColors },
    },
    {
      name: "Grouped",
      difficulty: "Intermediate",
      component: SkillsGrouped,
      props: { skills },
    },
    {
      name: "Progress Bars",
      difficulty: "Intermediate",
      component: SkillsProgress,
      props: { skills },
    },
    {
      name: "Details",
      difficulty: "Advanced",
      component: SkillsDetails,
      props: { skills },
    },
  ];

  const projectVariants = [
    {
      name: "Default (Challenge)",
      difficulty: "Challenge",
      component: ProjectsDefault,
      props: {},
    },
    {
      name: "Simple",
      difficulty: "Beginner",
      component: ProjectsSimple,
      props: { projects },
    },
    {
      name: "Featured",
      difficulty: "Intermediate",
      component: ProjectsFeatured,
      props: { projects },
    },
    {
      name: "Masonry",
      difficulty: "Intermediate",
      component: ProjectsMasonry,
      props: { projects },
    },
    {
      name: "Timeline",
      difficulty: "Intermediate",
      component: ProjectsTimeline,
      props: { projects },
    },
    {
      name: "Filterable",
      difficulty: "Advanced",
      component: ProjectsFilterable,
      props: { projects },
    },
    {
      name: "Carousel",
      difficulty: "Advanced",
      component: ProjectsCarousel,
      props: { projects },
    },
  ];

  const footerVariants = [
    {
      name: "Default (Challenge)",
      difficulty: "Challenge",
      component: FooterDefault,
      props: {},
    },
    {
      name: "Simple",
      difficulty: "Beginner",
      component: FooterSimple,
      props: { socialLinks, name, currentYear },
    },
    {
      name: "Minimal",
      difficulty: "Beginner",
      component: FooterMinimal,
      props: { socialLinks, name, currentYear },
    },
    {
      name: "Bold",
      difficulty: "Intermediate",
      component: FooterBold,
      props: { socialLinks, name, currentYear },
    },
    {
      name: "Glass",
      difficulty: "Advanced",
      component: FooterGlass,
      props: { socialLinks, name, currentYear },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-24">
      <div className="section-container">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
          Component <span className="text-(--color-primary)">Showcase</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-center mb-3">
          Explore, compare, and test different component implementations to find
          the perfect style for your portfolio.
        </p>
      </div>

      {/* Collapsible Guide */}
      <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) rounded-xl shadow-lg border border-(--color-border) dark:border-(--color-border-dark) mb-3 max-w-4xl mx-auto overflow-hidden">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-(--color-border)/20 dark:hover:bg-(--color-border-dark)/30 transition-colors cursor-pointer"
        >
          <h2 className="text-lg font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
            <svg
              className="w-5 h-5 text-(--color-primary)"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            How to Use This Page
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {showGuide ? "Hide" : "Show"} Guide
            </span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                showGuide ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* Collapsible Content */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            showGuide
              ? "max-h-[2000px] opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
            {/* Feature Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="w-8 h-8 rounded-lg bg-(--color-primary)/10 text-(--color-primary) flex items-center justify-center mb-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                  Compare Variants
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Use dropdowns to select different component styles and see
                  them side-by-side
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="w-8 h-8 rounded-lg bg-(--color-secondary)/10 text-(--color-secondary) flex items-center justify-center mb-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                  Test Responsiveness
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Resize the preview to see how components adapt to different
                  screen sizes
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                  Preview Mode
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Open a component in an immersive full-browser preview
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                  Split or Single View
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Toggle between comparing two variants or focusing on just one
                </p>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
                  />
                </svg>
                Keyboard Shortcuts (in Preview Mode)
              </h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                    ←
                  </kbd>
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                    →
                  </kbd>
                  <span>Navigate variants</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                    Esc
                  </kbd>
                  <span>Exit preview</span>
                </div>
              </div>
            </div>

            {/* Difficulty Legend - Challenge is now RED */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Difficulty Levels
              </h3>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Challenge — Fill-in-the-blank exercises
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Beginner — Simple props & basic JSX
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Intermediate — Layout & conditional logic
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Advanced — Animations, hooks & state
                </span>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-(--color-primary) mt-0.5">•</span>
                  <span>
                    <strong>Compare mobile views:</strong> Set both panels to
                    "Mobile" viewport to compare how different variants handle
                    small screens
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-(--color-primary) mt-0.5">•</span>
                  <span>
                    <strong>Start simple:</strong> Begin with Beginner variants,
                    understand the patterns, then explore more complex ones
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-(--color-primary) mt-0.5">•</span>
                  <span>
                    <strong>Mix and match:</strong> Your final portfolio can use
                    different difficulty levels for each section
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-(--color-primary) mt-0.5">•</span>
                  <span>
                    <strong>Check the code:</strong> Each component is in{" "}
                    <code>src/components/[Section]/</code>. Open, edit, and
                    experiment with them to see how they work!
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-(--color-primary) mt-0.5">•</span>
                  <span>
                    <strong>Experiment:</strong> Don't be afraid to tweak props
                    or styles in the code to make components your own
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-(--color-primary) mt-0.5">•</span>
                  <span>
                    <strong>Add your own components:</strong> Once comfortable,
                    try building custom components to further personalize your
                    portfolio. Add them to the list of components to preview how
                    they'd look at different sizes
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-(--color-primary) mt-0.5">•</span>
                  <span>
                    <strong>Have fun!</strong> This is your portfolio — enjoy
                    the process of building and customizing it
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 section-container">
        <ComponentComparer
          title="Header Components"
          description="Compare different header styles - from simple text to animated split layouts."
          variants={headerVariants}
        />

        <ComponentComparer
          title="About Components"
          description="Different ways to present your bio and personal information."
          variants={aboutVariants}
        />

        <ComponentComparer
          title="Skills Components"
          description="Various approaches to displaying your technical skills."
          variants={skillsVariants}
        />

        <ComponentComparer
          title="Project Components"
          description="Different ways to showcase your projects"
          variants={projectVariants}
        />

        <ComponentComparer
          title="Footer Components"
          description="Compare different footer styles."
          variants={footerVariants}
        />
      </div>

      {/* Bottom CTA */}
      <div className="mt-3 text-center section-container">
        <div className="bg-linear-to-r from-(--color-primary)/10 to-(--color-secondary)/10 rounded-2xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Ready to Build?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Head to the Lessons page to learn the concepts, or jump straight
            into coding your portfolio with the components you've discovered
            here.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/lessons"
              className="px-6 py-3 bg-(--color-primary) text-(--color-primary-text) rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Start Learning →
            </a>
            <a
              href="/"
              className="px-6 py-3 bg-(--color-surface) dark:bg-(--color-surface-dark) text-(--color-text) dark:text-(--color-text-dark) rounded-lg font-medium border border-(--color-border) dark:border-(--color-border-dark) hover:border-(--color-primary) transition-colors"
            >
              Let's Build!
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
