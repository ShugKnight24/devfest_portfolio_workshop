// ============================================
// VERSION 2: FEATURED + GRID LAYOUT
// ============================================
/**
 * PROJECTS VERSION 2: Featured + Grid
 *
 * Difficulty: Intermediate
 *
 * Features:
 * - Separate featured project section
 * - Large hero card for featured project
 * - Grid for other projects
 * - Visual hierarchy
 *
 * Perfect for: Highlighting your best work
 */

import { ProjectCard } from "../ProjectCard";

export const ProjectsFeatured = ({ projects }) => {
  const featuredProjects = projects.filter((project) => project.featured);
  const otherProjects = projects.filter((project) => !project.featured);

  return (
    <section className="section-container bg-(--color-surface)">
      <h2 className="section-title">My Projects</h2>

      {/* Featured Projects - Large Cards */}
      {featuredProjects.length > 0 && (
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-(--color-text-primary) mb-6 flex items-center gap-2">
            <span>⭐</span>
            <span>Featured Work</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-(--color-surface) rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Large Image */}
                <div className="relative h-64 overflow-hidden group">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block px-3 py-1 bg-(--color-accent) text-(--color-text-inverse) text-xs font-bold rounded-full mb-2">
                      ⭐ Featured
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h4 className="text-2xl font-bold text-(--color-text-primary) mb-3">
                    {project.title}
                  </h4>
                  <p className="text-(--color-text-secondary) mb-4 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-(--color-surface-highlight) text-(--color-primary) text-xs px-3 py-1 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="flex gap-3">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-4 py-2 bg-(--color-text-primary) text-(--color-text-inverse) rounded-lg hover:bg-(--color-text-secondary) transition-colors font-medium"
                      >
                        Code
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-4 py-2 bg-(--color-primary) text-(--color-text-inverse) rounded-lg hover:bg-(--color-secondary) transition-colors font-medium"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Projects - Regular Grid */}
      {otherProjects.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-(--color-text-primary) mb-6">
            More Projects
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
