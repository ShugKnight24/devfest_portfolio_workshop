// ============================================
// VERSION 1: SIMPLE BADGES (Beginner-Friendly)
// ============================================
/**
 * SKILLS VERSION 1: Simple Badges
 *
 * Difficulty: Beginner
 *
 * Features:
 * - Basic badge layout
 * - Color-coded by skill level
 * - Simple flex wrap
 * - Uses SkillBadge component
 *
 * Perfect for: Learning .map() and component reuse
 */

import { SkillBadge } from "../SkillBadge";

export const SkillsSimple = ({ levelColors, skills }) => {
  return (
    <section className="section-container bg-(--color-surface)">
      <h2 className="section-title">Skills & Technologies</h2>

      <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
        {skills.map((skill) => (
          <SkillBadge
            key={skill.name}
            color={levelColors[skill.level]}
            {...skill}
          />
        ))}
      </div>

      {/* TODO: Extract this legend into a sub-component that can be reused throughout skills components */}
      <div className="mt-6 flex flex-col items-center text-center text-(--color-text-secondary)">
        <p className="font-semibold mb-3">Skill Level Legend:</p>
        <p>
          {Object.entries(levelColors).map(([level, color]) => (
            <span
              key={level}
              className={`px-5 py-3 rounded-full text-sm font-medium ${color}`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};
