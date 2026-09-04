// ============================================
// VERSION 2: GRADIENT HERO HEADER
// ============================================
/**
 * HEADER VERSION 2: Gradient Hero
 *
 * Difficulty: Intermediate
 *
 * Features:
 * - Eye-catching gradient background
 * - Larger hero-style layout
 * - Styled button-like social links
 * - Avatar/profile image support
 *
 * Perfect for: Learning advanced styling and layout techniques
 */

import DarkModeToggle from "../DarkModeToggle";
import ThemeSwitcher from "../ThemeSwitcher";

import { Email, GithubLogo, LinkedInLogo } from "../Icons";

export const HeaderGradient = ({ personal }) => {
  const { name, title, bio, email, avatar, social } = personal;
  const { github, linkedin, twitter } = social;

  return (
    <header className="bg-(--color-primary) text-white shadow-lg">
      <div className="section-container py-16">
        {/* Top Bar with Dark Mode Toggle & Theme Switcher */}
        <div className="flex justify-end mb-3 gap-3">
          <ThemeSwitcher />
          <DarkModeToggle />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          {/* Optional Avatar */}
          {avatar && (
            <img
              src={avatar}
              alt={name}
              className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white shadow-lg object-cover"
            />
          )}

          {/* Name with animation-ready class */}
          <h1 className="text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg">
            {name}
          </h1>

          {/* Title */}
          <p className="text-2xl md:text-3xl mb-8 text-blue-100">{title}</p>

          {/* TODO: Build this out Dynamically */}
          {/* How can we simplify this? It seems repetitive */}
          {/* Hint: We've already done this in a few different places */}
          {/* Social Links */}
          <div className="flex gap-4 justify-center">
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-(--color-primary) px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              <GithubLogo />
            </a>
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-(--color-primary) px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              <LinkedInLogo />
            </a>
            <a
              href={`mailto:${email}`}
              className="bg-white text-(--color-primary) px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              <Email />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
