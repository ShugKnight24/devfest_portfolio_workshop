/**
 * SUB-COMPONENT: Skill Badge
 *
 * This is a reusable component for displaying a single skill.
 * It's used by the Skills component.
 *
 * PROPS TO USE:
 * @param {string} name - The skill name (e.g., "React")
 * @param {string} level - Skill level: "beginner", "intermediate", or "advanced"
 * @param {string} category - Skill category (e.g., "frontend", "backend")
 */

export const SkillBadge = ({ category, color, name }) => {
  // TODO: Display the skill category as well
  return (
    <span
      className={`px-4 py-2 rounded-full text-sm font-medium ${
        color || "bg-(--color-surface-highlight) text-(--color-text-primary)"
      }`}
    >
      {name}
    </span>
  );
};
