// ============================================
// VERSION 4: FILTERABLE BY TECHNOLOGY
// ============================================
/**
 * PROJECTS VERSION 4: Filterable Projects
 *
 * Difficulty: Advanced
 *
 * Features:
 * - Filter by technology/tag
 * - "All" option to show everything
 * - Active filter highlighting
 * - Smooth animations
 * - Project counter
 *
 * Perfect for: Showcasing diverse tech stack
 */

import { useState } from "react";
import { ProjectCard } from "../ProjectCard";
import { EmojiIcon } from "@portfolio/icons/react";

export const ProjectsFilterable = ({ projects }) => {
  const [activeFilter, setActiveFilter] = useState("all");

  // Get all unique tags from projects
  const allTags = [...new Set(projects.flatMap((p) => p.tags))];

  // Filter projects based on active filter
  const filteredProjects =
    activeFilter === "all"
      ? projects
      : projects.filter((p) => p.tags.includes(activeFilter));

  return (
    <section className="section-container bg-(--color-surface)">
      <h2 className="section-title">My Projects</h2>

      <div className="max-w-7xl mx-auto">
        {/* Filter Buttons */}
        <div className="mb-10">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                activeFilter === "all"
                  ? "bg-(--color-primary) text-(--color-text-inverse) shadow-lg scale-105"
                  : "bg-(--color-surface-highlight) text-(--color-text-secondary) hover:bg-(--color-border)"
              }`}
            >
              All Projects ({projects.length})
            </button>
            {allTags.sort().map((tag) => {
              const count = projects.filter((p) => p.tags.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveFilter(tag)}
                  className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                    activeFilter === tag
                      ? "bg-(--color-primary) text-(--color-text-inverse) shadow-lg scale-105"
                      : "bg-(--color-surface-highlight) text-(--color-text-secondary) hover:bg-(--color-border)"
                  }`}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="text-center mb-6">
          <p className="text-(--color-text-secondary)">
            Showing{" "}
            <span className="font-bold text-(--color-text-primary)">
              {filteredProjects.length}
            </span>{" "}
            {filteredProjects.length === 1 ? "project" : "projects"}
            {activeFilter !== "all" && (
              <span className="text-(--color-primary)">
                {" "}
                with {activeFilter}
              </span>
            )}
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
          {filteredProjects.map((project) => (
            <div key={project.id} className="animate-fade-in">
              <ProjectCard {...project} />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <EmojiIcon name="search" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-(--color-text-secondary)">
              No projects found with this technology.
            </p>
            <button
              onClick={() => setActiveFilter("all")}
              className="mt-6 px-6 py-3 bg-(--color-primary) text-(--color-text-inverse) rounded-lg hover:bg-(--color-secondary) transition-colors"
            >
              Show All Projects
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
