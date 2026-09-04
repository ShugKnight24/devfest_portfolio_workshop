// ============================================
// VERSION 3: DETAILED ABOUT WITH STATS
// ============================================
/**
 * ABOUT VERSION 3: About with Stats/Highlights
 *
 * Difficulty: Intermediate
 *
 * Features:
 * - Bio text with image
 * - Stat cards (years of experience, projects, etc.)
 * - Icon support
 * - Multi-section layout
 *
 * Perfect for: Learning component composition and data presentation
 */

import { EmojiIcon } from "@portfolio/icons/react";

export const AboutStats = ({ bio }) => {
  // TODO: Make stats configurable via props or portfolioData
  const stats = [
    { label: "Years Experience", value: "3+" },
    { label: "Projects Completed", value: "20+" },
    { label: "Technologies", value: "15+" },
    { label: "Happy Clients", value: "10+" },
  ];

  return (
    <section className="section-container bg-(--color-background) dark:bg-(--color-dark)">
      <h2 className="section-title text-(--color-primary)">About Me</h2>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Bio Text */}
        <div>
          <p className="text-lg text-(--color-text) dark:text-(--color-textDark) leading-relaxed mb-8">
            {bio}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            I'm always excited to collaborate on innovative projects and connect
            with fellow developers. Reach out if you're interested in working
            with `These Technologies`. Let's build something amazing together!
            <EmojiIcon name="rocket" className="w-5 h-5 inline-block ml-1 text-(--color-primary) align-text-bottom" />
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="text-3xl font-bold text-(--color-secondary) mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
