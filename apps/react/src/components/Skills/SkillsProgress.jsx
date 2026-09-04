// ============================================
// VERSION 3: SKILLS WITH PROGRESS BARS
// ============================================
/**
 * SKILLS VERSION 3: Skills with Progress Bars
 *
 * Difficulty: Intermediate
 *
 * Features:
 * - Visual progress bars showing skill level
 * - List layout instead of badges
 * - Animated bars (CSS)
 * - Percentage-based visualization
 *
 * Perfect for: Learning CSS animations and visual data representation
 */

export const SkillsProgress = ({ skills }) => {
  const levelPercentage = {
    beginner: 33,
    intermediate: 66,
    advanced: 90,
  };

  // Color schemes for different levels
  const levelColors = {
    beginner: "bg-(--color-secondary)",
    intermediate: "bg-(--color-primary)",
    advanced: "bg-(--color-accent)",
  };

  return (
    <section className="section-container bg-(--color-surface)">
      <h2 className="section-title">Skills & Technologies</h2>

      <div className="max-w-4xl mx-auto space-y-6">
        {skills.map((skill) => {
          const percentage = levelPercentage[skill.level] || 50;
          const colorClass =
            levelColors[skill.level] || "bg-(--color-text-secondary)";

          return (
            <div key={skill.name} className="group">
              {/* Skill name and level */}
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-(--color-text-primary)">
                  {skill.name}
                </span>
                <span className="text-sm text-(--color-text-secondary) capitalize">
                  {skill.level}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-3 bg-(--color-surface-highlight) rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorClass} rounded-full transition-all duration-1000 ease-out group-hover:opacity-90`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
