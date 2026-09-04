// ============================================
// VERSION 5: ANIMATED SPLIT LAYOUT HEADER
// ============================================
/**
 * HEADER VERSION 5: Animated Split Layout (Hybrid)
 *
 * Difficulty: Advanced
 *
 * Features:
 * - Combines animated gradient background from HeaderAnimated
 * - Two-column split layout from HeaderSplit
 * - Typing effect for title
 * - SVG social icons
 * - Decorative elements and animations
 * - Responsive design (stacks on mobile)
 *
 * Perfect for: Creating a stunning, professional hero section with personality
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

export const HeaderAnimatedSplit = ({ personal }) => {
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
      name: "Twitter",
      url: twitter,
      icon: <TwitterLogo />,
    },
    {
      name: "LinkedIn",
      url: linkedin,
      icon: <LinkedInLogo />,
    },
  ];

  return (
    <header className="relative bg-(--color-dark) text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-(--color-primary) rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-(--color-secondary) rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Top Bar with Dark Mode Toggle & Theme Switcher */}
      <div className="flex justify-end m-6 gap-3">
        <ThemeSwitcher />
        <DarkModeToggle />
      </div>

      <div className="relative section-container py-20">
        {/* Split Layout Grid */}
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Side - Image with Decorative Elements */}
          <div className="flex justify-center md:justify-start order-2 md:order-1">
            <div className="relative animate-fade-in">
              {/* Decorative gradient blur behind avatar */}
              <div className="absolute inset-0 bg-linear-to-br from-(--color-primary) via-(--color-secondary) to-(--color-accent) rounded-full blur-2xl opacity-40 scale-110"></div>

              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-full border-4 border-white/10 scale-110 animate-pulse"></div>

              {/* Avatar Image */}
              <img
                src={
                  avatar ||
                  "https://placehold.co/400x400/667eea/FFFFFF?text=Your+Photo"
                }
                alt={name}
                className="relative w-72 h-72 rounded-full object-cover border-4 border-white/30 shadow-2xl"
              />

              {/* Small decorative dots */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-(--color-primary) rounded-full animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-(--color-primary) rounded-full animate-bounce"></div>
              <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-(--color-secondary) rounded-full animate-bounce"></div>
              <div className="absolute -top-4 -left-4 w-6 h-6 bg-(--color-secondary) rounded-full animate-bounce"></div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="text-center md:text-left order-1 md:order-2 animate-slide-up">
            {/* Name with Gradient Text */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
              <span className="text-(--color-primary)">
                {name}
              </span>
            </h1>

            {/* Animated Typing Title */}
            <p className="text-2xl md:text-3xl text-(--color-primary)/80 mb-6">
              {displayedTitle}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>

            {/* Bio */}
            <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-xl">
              {bio}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-3">
              {/* TODO: Add an ID to the projects section */}
              <a
                href="#projects"
                className="px-5 py-3 bg-white text-(--color-dark) rounded-full font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                View My Work
              </a>
              <a
                href={`mailto:${email}`}
                className="flex gap-1.5 px-5 py-3 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-(--color-dark) transition-all duration-200"
              >
                <Email /> Get In Touch
              </a>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 justify-center md:justify-start">
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
