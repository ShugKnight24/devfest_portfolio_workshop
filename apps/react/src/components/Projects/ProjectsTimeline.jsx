// ============================================
// VERSION 6: TIMELINE VIEW
// ============================================
/**
 * PROJECTS VERSION 6: Timeline View
 *
 * Difficulty: Advanced
 *
 * Features:
 * - Chronological project display
 * - Vertical timeline with connector line
 * - Alternating left/right layout
 * - Year/date markers
 * - Great for showing progression
 *
 * Perfect for: Storytelling and showcasing growth
 */

export const ProjectsTimeline = ({ projects }) => {
  // You could enhance projects data to include dates
  // For now, we'll use the order as a timeline

  return (
    <section className="section-container bg-linear-to-b from-(--color-surface) to-(--color-surface-highlight)">
      <h2 className="section-title">Project Journey</h2>

      <div className="max-w-5xl mx-auto relative">
        {/* Center Timeline Line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-linear-to-b from-(--color-primary) via-(--color-secondary) to-(--color-accent) hidden md:block"></div>

        {/* Projects */}
        <div className="space-y-12">
          {projects.map((project, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={project.id}
                className={`relative flex items-center ${
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-(--color-primary) rounded-full border-4 border-(--color-surface) shadow-lg z-10 hidden md:block"></div>

                {/* Project Card */}
                <div
                  className={`w-full md:w-5/12 ${
                    isEven ? "md:pr-12" : "md:pl-12"
                  }`}
                >
                  <div className="bg-(--color-surface) rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    {/* Number Badge */}
                    <div
                      className={`absolute -top-4 ${
                        isEven ? "left-4" : "right-4"
                      } w-10 h-10 bg-linear-to-br from-(--color-primary) to-(--color-secondary) text-(--color-text-inverse) rounded-full flex items-center justify-center font-bold text-lg shadow-lg z-20`}
                    >
                      {index + 1}
                    </div>

                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                      {project.featured && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-(--color-accent) text-(--color-text-inverse) px-3 py-1 rounded-full text-xs font-bold">
                            ⭐ Featured
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-(--color-text-primary) mb-3">
                        {project.title}
                      </h3>
                      <p className="text-(--color-text-secondary) mb-4">
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
                            className="flex-1 text-center px-4 py-2 border-2 border-(--color-text-primary) text-(--color-text-primary) rounded-lg hover:bg-(--color-text-primary) hover:text-(--color-text-inverse) transition-colors font-medium"
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
                            Demo
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spacer for alignment */}
                <div className="hidden md:block md:w-5/12"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
