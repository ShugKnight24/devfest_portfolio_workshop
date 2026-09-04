// ============================================
// VERSION 3: MASONRY/PINTEREST STYLE
// ============================================
/**
 * PROJECTS VERSION 3: Masonry Layout
 *
 * Difficulty: Intermediate
 *
 * Features:
 * - Pinterest-style masonry grid
 * - Varied card heights
 * - Hover zoom effects
 * - Modern, dynamic look
 *
 * Perfect for: Visual portfolios with lots of projects
 */

export const ProjectsMasonry = ({ projects }) => {
  return (
    <section className="section-container bg-(--color-surface-highlight)">
      <h2 className="section-title">My Projects</h2>

      {/* Masonry Grid using CSS columns */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 max-w-7xl mx-auto">
        {projects.map((project) => (
          <div key={project.id} className="break-inside-avoid mb-6 group">
            <div className="bg-(--color-surface) rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300">
              {/* Image with overlay */}
              <div className="relative overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {project.featured && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-(--color-accent) text-(--color-text-inverse) text-xs font-bold px-3 py-1 rounded-full">
                      ⭐ Featured
                    </span>
                  </div>
                )}

                {/* Hover overlay with quick links */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6 gap-3">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-(--color-surface) text-(--color-text-primary) rounded-lg font-medium hover:bg-(--color-surface-highlight) transition-colors"
                    >
                      View Code
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-(--color-primary) text-(--color-text-inverse) rounded-lg font-medium hover:bg-(--color-secondary) transition-colors"
                    >
                      Live Demo
                    </a>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-(--color-text-primary) mb-2">
                  {project.title}
                </h3>
                <p className="text-(--color-text-secondary) text-sm mb-4">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-(--color-surface-highlight) text-(--color-text-secondary) text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
