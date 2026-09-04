// ============================================
// VERSION 3: SPLIT LAYOUT HEADER
// ============================================
/**
 * HEADER VERSION 3: Split Layout
 *
 * Difficulty: Intermediate
 *
 * Features:
 * - Two-column layout (image left, content right)
 * - Profile image with decorative elements
 * - Social icons array for easy addition
 * - Responsive design (stacks on mobile)
 *
 * Perfect for: Learning flexbox/grid layouts and responsive design
 */

import { Email, GithubLogo, LinkedInLogo, TwitterLogo } from "../Icons";

import DarkModeToggle from "../DarkModeToggle";
import ThemeSwitcher from "../ThemeSwitcher";

export const HeaderSplit = ({ personal }) => {
  const { name, title, bio, email, avatar, social } = personal;
  const { github, linkedin, twitter } = social;

  // TODO: Make these configurable and pass in the colors/icons as props
  const socialLinks = [
    { url: github, icon: <GithubLogo /> },
    { url: linkedin, icon: <LinkedInLogo /> },
    { url: twitter, icon: <TwitterLogo /> },
    { url: `mailto:${email}`, icon: <Email /> },
  ];

  return (
    <header className="flex flex-col md:flex-row">
      <div className="section-container">
        {/* Top Bar with Dark Mode Toggle & Theme Switcher */}
        <div className="flex justify-end mb-3 gap-3">
          <ThemeSwitcher />
          <DarkModeToggle />
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Image */}
          <div className="w-full bg-(--color-background) dark:bg-(--color-dark) flex justify-center p-12 relative rounded-2xl shadow-lg">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-br from-blue-400 to-purple-600 rounded-full blur-xl opacity-30"></div>
              <img
                src={
                  avatar ||
                  "https://placehold.co/400x400/34A853/FFFFFF?text=Your+Photo"
                }
                alt={name}
                className="relative w-64 h-64 rounded-full object-cover border-4 border-gray-100 shadow-xl"
              />
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="max-w-lg mx-auto">
            <p className="text-(--color-primary) font-semibold tracking-wider uppercase mb-2">
              Hello, I'm
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-(--color-text) dark:text-(--color-textDark) mb-4">
              {name}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              {title}
            </p>

            {/* Short bio excerpt */}
            <p className="text-gray-700 mb-6 max-w-lg">{bio.split(".")[0]}.</p>

            {/* Social Links */}
            <div className="flex gap-3 justify-center md:justify-start">
              {socialLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-(--color-primary) dark:hover:text-(--color-primary) transition-colors"
                  aria-label={link.url}
                >
                  <span>{link.icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
