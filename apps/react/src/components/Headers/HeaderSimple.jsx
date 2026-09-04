// ============================================
// VERSION 1: SIMPLE HEADER (Beginner-Friendly)
// ============================================
/**
 * HEADER VERSION 1: Simple & Clean
 *
 * Difficulty: Beginner
 *
 * Features:
 * - Basic centered layout
 * - Name and title display
 * - Simple social links with emojis
 *
 * Perfect for: First-time React users learning props and JSX
 */

import { Email, GithubLogo, LinkedInLogo, TwitterLogo } from "../Icons";

import DarkModeToggle from "../DarkModeToggle";
import ThemeSwitcher from "../ThemeSwitcher";

export const HeaderSimple = ({ personal }) => {
  const { name, title, bio, email, avatar, social } = personal;
  const { github, linkedin, twitter } = social;

  return (
    <header className="bg-(--color-background) dark:bg-(--color-dark) shadow-sm transition-colors duration-300">
      <div className="section-container py-12">
        {/* TODO: Make this reusable and configurable */}
        {/* Top Bar with Dark Mode Toggle & Theme Switcher */}
        <div className="flex justify-end mb-3 gap-3">
          <ThemeSwitcher />
          <DarkModeToggle />
        </div>

        {/* Content */}
        <div className="text-center">
          {/* Name */}
          <h1 className="text-4xl font-bold text-(--color-text) dark:text-(--color-textDark) mb-2">
            {name}
          </h1>

          {/* Title */}
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            {title}
          </p>

          {/* Social Links */}
          <div className="flex gap-4 justify-center">
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-primary) hover:text-(--color-secondary) hover:underline flex items-center gap-1 transition-colors"
            >
              <GithubLogo />
            </a>
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-primary) hover:text-(--color-secondary) hover:underline flex items-center gap-1 transition-colors"
            >
              <LinkedInLogo />
            </a>
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-primary) hover:text-(--color-secondary) hover:underline flex items-center gap-1 transition-colors"
            >
              <TwitterLogo />
            </a>
            <a
              href={`mailto:${email}`}
              className="text-(--color-primary) hover:text-(--color-secondary) hover:underline transition-colors"
            >
              <Email />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
