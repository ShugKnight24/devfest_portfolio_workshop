// ============================================
// VERSION 5: INTERACTIVE FILTERABLE SKILLS
// ============================================
/**
 * SKILLS VERSION 5: Interactive Filterable Skills
 *
 * Difficulty: Advanced
 *
 * Features:
 * - Filter buttons by category
 * - Filter by skill level
 * - Interactive state management
 * - Animated transitions
 * - Active filter indicators
 *
 * Perfect for: Learning React state and filtering
 */

import { useState } from "react";
import { SkillBadge } from "../SkillBadge";

export const SkillsInteractive = ({ skills }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeLevel, setActiveLevel] = useState("all");

  // Get unique categories
  const categories = ["all", ...new Set(skills.map((s) => s.category))];
  const levels = ["all", "beginner", "intermediate", "advanced"];

  // Filter skills based on active filters
  const filteredSkills = skills.filter((skill) => {
    const categoryMatch =
      activeCategory === "all" || skill.category === activeCategory;
    const levelMatch = activeLevel === "all" || skill.level === activeLevel;
    return categoryMatch && levelMatch;
  });

  const categoryIcons = {
    all: "🎯",
    frontend: "🎨",
    backend: "⚙️",
    language: "💻",
    tools: "🛠️",
  };

  return (
    <section className="section-container bg-(--color-surface)">
      <h2 className="section-title">Skills & Technologies</h2>

      <div className="max-w-6xl mx-auto">
        {/* Filter Controls */}
        <div className="mb-8 space-y-4">
          {/* Category Filters */}
          <div>
            <h3 className="text-sm font-semibold text-(--color-text-secondary) mb-3 uppercase tracking-wide">
              Filter by Category
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-200 hover:cursor-pointer ${
                    activeCategory === category
                      ? "bg-(--color-primary) text-(--color-text-inverse) shadow-md scale-105"
                      : "bg-(--color-surface-highlight) text-(--color-text-secondary) hover:bg-(--color-border)"
                  }`}
                >
                  <span className="mr-2">
                    {categoryIcons[category] || "📦"}
                  </span>
                  <span className="capitalize">{category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Level Filters */}
          <div>
            <h3 className="text-sm font-semibold text-(--color-text-secondary) mb-3 uppercase tracking-wide">
              Filter by Level
            </h3>
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setActiveLevel(level)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:cursor-pointer ${
                    activeLevel === level
                      ? "bg-(--color-accent) text-(--color-text-inverse) shadow-md scale-105"
                      : "bg-(--color-surface-highlight) text-(--color-text-secondary) hover:bg-(--color-border)"
                  }`}
                >
                  <span className="capitalize">{level}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-center">
          <p className="text-(--color-text-secondary)">
            Showing{" "}
            <span className="font-bold text-(--color-text-primary)">
              {filteredSkills.length}
            </span>{" "}
            skill
            {filteredSkills.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Skills Display */}
        <div className="flex flex-wrap gap-3 justify-center min-h-[100px]">
          {filteredSkills.length > 0 ? (
            filteredSkills.map((skill) => (
              <div key={skill.name} className="animate-fade-in">
                <SkillBadge {...skill} />
              </div>
            ))
          ) : (
            <p className="text-(--color-text-secondary) py-8">
              No skills match your filters. Try selecting different options!
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
