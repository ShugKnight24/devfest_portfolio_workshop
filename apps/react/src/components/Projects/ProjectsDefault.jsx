// ============================================
// VERSION 1: DEFAULT PROJECTS
// ============================================
/**
 * PROJECTS VERSION 1: Default Grid
 *
 * Difficulty: Beginner
 *
 * Features:
 * - Simple 3-column grid
 * - Project cards with images
 * - Tech stack tags
 * - GitHub and live demo links
 *
 * Perfect for: Getting started with component mapping
 */

import { EmojiIcon } from "@portfolio/icons/react";

export const ProjectsDefault = () => {
  return (
    <section id="projects" className="py-20 px-4 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12 text-slate-800 dark:text-slate-100">
        Featured Projects
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* 
          TODO: Loop over your projects here! 
        */}

        <div className="col-span-full text-center p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          <p className="text-xl text-slate-500 dark:text-slate-400 inline-flex items-center gap-2">
            Your projects grid is empty. Time to write some code!{" "}
            <EmojiIcon name="rocket" className="w-5 h-5 text-blue-500 shrink-0" />
          </p>
        </div>
      </div>
    </section>
  );
};
