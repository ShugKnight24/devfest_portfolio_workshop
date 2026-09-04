// ============================================
// VERSION 6: SKILLS WITH HOVER DETAILS
// ============================================
/**
 * SKILLS VERSION 6: Skills with Hover Details
 *
 * Difficulty: Advanced
 *
 * Features:
 * - Card layout with hover tooltips
 * - Additional detail on hover
 * - Years of experience
 * - Project count using skill
 * - Smooth animations
 *
 * Perfect for: Advanced interactions and tooltips
 *
 * Note: Requires enhanced data structure with years/projects
 */
export const SkillsDetails = ({ skills }) => {
  // Enhanced skill data (in real app, this would come from props)
  const enhancedSkills = skills.map((skill) => ({
    ...skill,
    years:
      skill.level === "advanced"
        ? "3+"
        : skill.level === "intermediate"
        ? "2+"
        : "1+",
    projects:
      skill.level === "advanced" ? 10 : skill.level === "intermediate" ? 5 : 2,
  }));

  const levelColors = {
    beginner: "from-(--color-secondary) to-(--color-secondary)",
    intermediate: "from-(--color-primary) to-(--color-primary)",
    advanced: "from-(--color-accent) to-(--color-accent)",
  };

  return (
    <section className="section-container bg-(--color-surface-highlight)">
      <h2 className="section-title">Skills & Technologies</h2>

      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {enhancedSkills.map((skill) => (
          <div
            key={skill.name}
            className="group relative bg-(--color-surface) rounded-lg p-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            {/* Front side - Always visible */}
            <div className="text-center">
              <div
                className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-linear-to-br ${
                  levelColors[skill.level] ||
                  "from-(--color-text-secondary) to-(--color-text-secondary)"
                } flex items-center justify-center text-(--color-text-inverse) font-bold text-xl`}
              >
                {skill.name.charAt(0)}
              </div>
              <h3 className="font-semibold text-(--color-text-primary) text-sm">
                {skill.name}
              </h3>
              <p className="text-sm text-(--color-text-secondary) capitalize mt-1">
                {skill.level}
              </p>
            </div>

            {/* Hover overlay - Shows on hover */}
            <div className="absolute inset-0 bg-linear-to-br from-(--color-primary) to-(--color-secondary) rounded-lg opacity-0 group-hover:opacity-95 transition-opacity duration-300 p-4 flex flex-col justify-center text-(--color-text-inverse)">
              <h3 className="font-bold text-center mb-3">{skill.name}</h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Experience:</span>
                  <span className="font-semibold">{skill.years} years</span>
                </div>
                <div className="flex justify-between">
                  <span>Projects:</span>
                  <span className="font-semibold">{skill.projects}+</span>
                </div>
                <div className="flex justify-between">
                  <span>Level:</span>
                  <span className="font-semibold capitalize">
                    {skill.level}
                  </span>
                </div>
              </div>

              {/* Level indicator dots */}
              <div className="flex justify-center gap-1 mt-3">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className={`w-2 h-2 rounded-full ${
                      dot <=
                      (skill.level === "advanced"
                        ? 3
                        : skill.level === "intermediate"
                        ? 2
                        : 1)
                        ? "bg-(--color-text-inverse)"
                        : "bg-(--color-text-inverse)/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
