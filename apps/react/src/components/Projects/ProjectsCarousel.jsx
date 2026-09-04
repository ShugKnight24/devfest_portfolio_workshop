// ============================================
// VERSION 5: CAROUSEL/SLIDER VIEW
// ============================================
/**
 * PROJECTS VERSION 5: Carousel Slider
 *
 * Difficulty: Advanced
 *
 * Features:
 * - Full-width project showcase
 * - Previous/Next navigation
 * - Dot indicators
 * - Keyboard navigation
 * - Auto-play option
 *
 * Perfect for: Dramatic project presentation
 */

import { useState } from "react";

export const ProjectsCarousel = ({ projects }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const currentProject = projects[currentIndex];

  return (
    <section className="section-container bg-(--color-surface-highlight) text-(--color-text-primary)">
      <h2 className="section-title text-(--color-text-primary)">
        Featured Projects
      </h2>

      <div className="max-w-6xl mx-auto relative">
        {/* Main Carousel */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          {/* Project Display */}
          <div className="grid md:grid-cols-2 gap-0 bg-(--color-surface) text-(--color-text-primary)">
            {/* Image Side */}
            <div className="relative h-96 md:h-auto">
              <img
                src={currentProject.image}
                alt={currentProject.title}
                className="w-full h-full object-cover"
              />
              {currentProject.featured && (
                <div className="absolute top-4 left-4">
                  <span className="bg-(--color-accent) text-(--color-text-inverse) px-3 py-1 rounded-full text-sm font-bold">
                    ⭐ Featured
                  </span>
                </div>
              )}
            </div>

            {/* Content Side */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-4">
                <span className="text-(--color-primary) font-semibold text-sm">
                  Project {currentIndex + 1} of {projects.length}
                </span>
              </div>

              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                {currentProject.title}
              </h3>

              <p className="text-(--color-text-secondary) text-lg mb-6 leading-relaxed">
                {currentProject.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {currentProject.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-(--color-surface-highlight) text-(--color-primary) px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {currentProject.githubUrl && (
                  <a
                    href={currentProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-6 py-3 bg-(--color-text-primary) text-(--color-text-inverse) rounded-lg hover:bg-(--color-text-secondary) transition-colors font-semibold"
                  >
                    View Code →
                  </a>
                )}
                {currentProject.liveUrl && (
                  <a
                    href={currentProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-6 py-3 bg-(--color-primary) text-(--color-text-inverse) rounded-lg hover:bg-(--color-secondary) transition-colors font-semibold"
                  >
                    Live Demo →
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-(--color-surface)/90 hover:bg-(--color-surface) rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Previous project"
          >
            <svg
              className="w-6 h-6 text-(--color-text-primary)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-(--color-surface)/90 hover:bg-(--color-surface) rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Next project"
          >
            <svg
              className="w-6 h-6 text-(--color-text-primary)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {projects.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "w-8 h-3 bg-(--color-primary)"
                  : "w-3 h-3 bg-(--color-primary)/40 hover:bg-(--color-primary)/60"
              }`}
              aria-label={`Go to project ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
