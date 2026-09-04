// ============================================
// VERSION 4: SKILLS GRID WITH ICONS
// ============================================
/**
 * SKILLS VERSION 4: Skills Grid with Icons
 *
 * Difficulty: Advanced
 *
 * Features:
 * - Card-based grid layout
 * - Icon/emoji for each skill
 * - Hover effects
 * - Level indicators
 * - Category tags
 *
 * Perfect for: Learning card layouts and advanced styling
 */
import { EmojiIcon } from "@portfolio/icons/react";

export const SkillsIcons = ({ skills }) => {
  // Skill icons mapping
  // Clean SVG icons mapped by skill name
  const skillIcons = {
    React: "atom",
    JavaScript: "squareYellow",
    TypeScript: "diamondBlue",
    "Node.js": "squareGreen",
    Python: "python",
    "Tailwind CSS": "wave",
    Git: "branch",
    "REST APIs": "plug",
    MongoDB: "leaf",
    PostgreSQL: "postgres",
    Docker: "whale",
    AWS: "cloud",
  };

  const levelColors = {
    beginner: "border-(--color-secondary) bg-(--color-surface)",
    intermediate: "border-(--color-primary) bg-(--color-surface)",
    advanced: "border-(--color-accent) bg-(--color-surface)",
  };

  const dotColors = {
    beginner: "bg-(--color-secondary)",
    intermediate: "bg-(--color-primary)",
    advanced: "bg-(--color-accent)",
  };

  const levelDots = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };

  return (
    <section className="section-container bg-linear-to-b from-(--color-surface) to-(--color-surface-highlight)">
      <h2 className="section-title">Skills & Technologies</h2>

      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {skills.map((skill) => (
          <div
            key={skill.name}
            className={`relative p-6 rounded-xl border-2 ${
              levelColors[skill.level] ||
              "border-(--color-border) bg-(--color-surface-highlight)"
            } hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}
          >
            {/* Icon */}
            <div className="mb-3 flex justify-center">
              <EmojiIcon
                name={skillIcons[skill.name] || "laptop"}
                className="w-10 h-10 text-(--color-primary)"
              />
            </div>

            {/* Skill name */}
            <h3 className="text-center font-semibold text-(--color-text-primary) mb-2">
              {skill.name}
            </h3>

            {/* Level dots */}
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index < levelDots[skill.level]
                      ? dotColors[skill.level]
                      : "bg-(--color-border)"
                  }`}
                ></div>
              ))}
            </div>

            {/* Category badge */}
            <div className="text-center">
              <span className="text-sm text-(--color-text-secondary) capitalize">
                {skill.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
