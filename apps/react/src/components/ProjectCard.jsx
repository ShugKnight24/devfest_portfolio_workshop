/**
 * SUB-COMPONENT: Project Card
 *
 * This displays a single project with image, title, description, and links.
 *
 * PROPS TO USE:
 * @param {Object} project - Contains title, description, image, tags, githubUrl, liveUrl
 */

import { ChevronRight } from "./Icons";

export const ProjectCard = (project) => {
  const { title, description, image, tags, githubUrl, liveUrl, featured } =
    project;

  return (
    <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Project Image */}
      <img src={image} alt={title} className="w-full h-48 object-cover" />

      {/* Project Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-(--color-text-primary)">
            {title}
          </h3>
          {featured && (
            <span className="bg-(--color-accent) text-(--color-text-inverse) text-xs px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>

        <p className="text-(--color-text-secondary) mb-4">{description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-(--color-surface-highlight) text-(--color-text-secondary) text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex gap-3">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-(--color-primary) hover:text-(--color-secondary) font-medium text-sm"
            >
              View Code
              <span aria-hidden="true">
                <ChevronRight className="w-4 h-4" />
              </span>
            </a>
          )}
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-(--color-secondary) hover:text-(--color-accent) font-medium text-sm"
            >
              Live Demo
              <span aria-hidden="true">
                <ChevronRight className="w-4 h-4" />
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
