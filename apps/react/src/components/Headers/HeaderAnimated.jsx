// ============================================
// VERSION 4: ANIMATED MODERN HEADER
// ============================================
/**
 * HEADER VERSION 4: Animated & Modern
 *
 * Difficulty: Advanced
 *
 * Features:
 * - CSS animations (fade-in, slide-up)
 * - Typing effect for title (with state)
 * - SVG social icons (instead of emojis)
 * - Call-to-action buttons
 * - Scroll indicator
 *
 * Perfect for: Learning React hooks (useState, useEffect) and animations
 */

import { useState, useEffect } from "react";

import DarkModeToggle from "../DarkModeToggle";
import ThemeSwitcher from "../ThemeSwitcher";

import {
  DownArrow,
  Email,
  GithubLogo,
  LinkedInLogo,
  TwitterLogo,
} from "../Icons";

export const HeaderAnimated = ({ personal }) => {
  const { name, title, bio, email, avatar, social } = personal;
  const { github, linkedin, twitter } = social;
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Typing effect for title
  useEffect(() => {
    if (displayedTitle.length < title.length) {
      const timeout = setTimeout(() => {
        setDisplayedTitle(title.slice(0, displayedTitle.length + 1));
      }, 100);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [displayedTitle, title]);

  // Social icons configuration with actual SVG paths
  const socialLinks = [
    {
      name: "GitHub",
      url: github,
      icon: <GithubLogo />,
    },
    {
      name: "LinkedIn",
      url: linkedin,
      icon: <LinkedInLogo />,
    },
    {
      name: "Twitter",
      url: twitter,
      icon: <TwitterLogo />,
    },
  ];

  return (
    <header className="relative bg-(--color-dark) text-white overflow-hidden flex flex-col justify-center items-center">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-(--color-primary) rounded-full blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-(--color-secondary) rounded-full blur-[100px] opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-(--color-accent) rounded-full blur-[100px] opacity-30 animate-pulse delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-(--color-accent) rounded-full blur-[100px] opacity-30 animate-pulse delay-3000"></div>
      </div>

      {/* Top Bar with Dark Mode Toggle & Theme Switcher */}
      <div className="flex absolute top-[2.5%] right-[2.5%] gap-1.5">
        <ThemeSwitcher />
        <DarkModeToggle />
      </div>

      <div className="relative section-container py-20">
        <div className="max-w-4xl mx-auto">
          {/* Avatar with fade-in animation */}
          {avatar && (
            <div className="flex justify-center mb-8 animate-fade-in">
              <img
                src={avatar}
                alt={name}
                className="w-40 h-40 rounded-full border-4 border-white/60 shadow-2xl object-cover"
              />
            </div>
          )}

          {/* Content with slide-up animation */}
          <div className="text-center space-y-6 animate-slide-up">
            {/* Name */}
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="text-(--color-primary)">
                {name}
              </span>
            </h1>

            {/* Animated Title */}
            <p className="text-2xl md:text-3xl text-blue-100">
              {displayedTitle}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>

            {/* Bio */}
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {bio}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <a
                href="#projects"
                className="px-8 py-3 bg-(--color-primary) rounded-full font-bold hover:opacity-90 transition-opacity shadow-lg hover:shadow-(--color-primary)/50"
              >
                View My Work
              </a>
              <a
                href={`mailto:${email}`}
                className="px-8 flex items-center gap-2 py-3 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-all duration-200"
              >
                <Email /> Get In Touch
              </a>
            </div>

            {/* Social Links with SVG icons */}
            <div className="flex gap-4 justify-center pt-6">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
                  aria-label={link.name}
                  title={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <DownArrow />
      </div>
    </header>
  );
};
