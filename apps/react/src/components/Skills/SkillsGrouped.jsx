// ============================================
// VERSION 2: GROUPED BY CATEGORY
// ============================================
/**
 * SKILLS VERSION 2: Grouped by Category
 *
 * Difficulty: Intermediate
 *
 * Features:
 * - Skills organized by category (frontend, backend, tools, etc.)
 * - Section headers for each category
 * - Color-coded badges
 * - Better organization for many skills
 *
 * Perfect for: Learning data grouping and complex layouts
 */

import { SkillBadge } from "../SkillBadge";

export const SkillsGrouped = ({ skills }) => {
  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {});

  // Category display names and icons
  const categoryInfo = {
    frontend: {
      name: "Frontend",
      icon: "🎨",
      color: "text-(--color-primary) border border-(--color-primary)",
    },
    backend: {
      name: "Backend",
      icon: "⚙️",
      color: "text-(--color-secondary) border border-(--color-secondary)",
    },
    language: {
      name: "Languages",
      icon: "💻",
      color: "text-(--color-accent) border border-(--color-accent)",
    },
    tools: {
      name: "Tools & Others",
      icon: "🛠️",
      color: "text-(--color-text-primary) border border-(--color-text-primary)",
    },
    other: {
      name: "Other",
      icon: "📦",
      color:
        "text-(--color-text-secondary) border border-(--color-text-secondary)",
    },
  };

  return (
    <section className="section-container bg-(--color-surface-highlight)">
      <h2 className="section-title">Skills & Technologies</h2>

      <div className="max-w-5xl mx-auto space-y-8">
        {Object.entries(groupedSkills).map(([category, categorySkills]) => (
          <div
            key={category}
            className="bg-(--color-surface) rounded-xl p-6 shadow-sm"
          >
            {/* Category Header */}
            <h3
              className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                categoryInfo[category]?.color + " border-0" ||
                "text-(--color-text-secondary)"
              }`}
            >
              <span className="text-2xl">
                {categoryInfo[category]?.icon || "📦"}
              </span>
              <span>{categoryInfo[category]?.name || category}</span>
            </h3>

            {/* Skills in this category */}
            <div className="flex flex-wrap gap-3">
              {categorySkills.map((skill) => (
                <SkillBadge
                  key={skill.name}
                  {...skill}
                  color={categoryInfo[category]?.color}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
