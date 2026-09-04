// ============================================
// VERSION 1: SIMPLE GRID (Beginner-Friendly)
// ============================================
/**
 * PROJECTS VERSION 1: Simple Grid
 *
 * Difficulty: Beginner
 *
 * Features:
 * - Basic 3-column grid
 * - Uses ProjectCard component
 * - Responsive layout
 * - Clean and straightforward
 *
 * Perfect for: Learning .map() and grid layouts
 */

import { ProjectCard } from "../ProjectCard";

export const ProjectsSimple = ({ projects }) => {
  return (
    <section className="section-container bg-(--color-surface-highlight)">
      <h2 className="section-title">Featured Projects</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {projects.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>
    </section>
  );
};
