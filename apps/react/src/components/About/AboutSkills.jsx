// ============================================
// VERSION 5: SPLIT LAYOUT WITH SKILLS PREVIEW
// ============================================
/**
 * ABOUT VERSION 5: About with Skills Preview
 *
 * Difficulty: Advanced
 *
 * Features:
 * - Split layout with image
 * - Bio text
 * - Quick skills/interests preview
 * - Download resume button
 * - Contact CTA
 *
 * Perfect for: Comprehensive about section with multiple data points
 */

// TODO: Add a resume and update the download resume button's href to actual resume location

import { Email } from "../Icons";
import { EmojiIcon } from "@portfolio/icons/react";

export const AboutSkills = ({ avatar, bio }) => {
  // TODO: Make skills and interests configurable via props or portfolioData
  const quickSkills = [
    "React & Next.js",
    "TypeScript",
    "Node.js",
    "Tailwind CSS",
    "REST APIs",
    "Git & GitHub",
  ];

  // TODO: Find Icons for interests
  const interests = [
    { icon: "💻", text: "Web Development" },
    { icon: "📱", text: "Mobile Apps" },
    { icon: "🎨", text: "UI/UX Design" },
    { icon: "🤖", text: "AI & ML" },
  ];

  return (
    <section className="section-container bg-(--color-surface)">
      <h2 className="section-title">About Me</h2>

      <div className="max-w-6xl mx-auto">
        {/* Main Split Layout */}
        <div className="grid lg:grid-cols-5 gap-3 items-start">
          {/* Left Column - Image & Quick Info */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <img
                src={
                  avatar ||
                  "https://placehold.co/400x400/667eea/FFFFFF?text=Your+Photo"
                }
                alt="Profile"
                className="w-full aspect-square rounded-2xl shadow-xl object-cover mb-6"
              />

              {/* Quick Actions */}
              <div className="space-y-3">
                {/* TODO: Add a resume and update the download resume button's href to actual resume location */}
                {/* <a
                  href="/resume.pdf"
                  download
                  className="block w-full text-center px-6 py-3 bg-linear-to-r from-(--color-primary) to-(--color-secondary) text-(--color-text-inverse) rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Download Resume
                </a> */}
                <a
                  href="#contact"
                  className="flex justify-center gap-1.5 items-center w-full text-center px-6 py-3 border-2 border-(--color-border) text-(--color-text-secondary) rounded-lg font-semibold hover:border-(--color-primary) hover:text-(--color-primary) transition-all duration-200"
                >
                  <Email /> Get In Touch
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-3">
            {/* Bio */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-(--color-text-primary) mb-4 inline-flex items-center gap-2">
                Hi there! <EmojiIcon name="wave" className="w-6 h-6 inline-block" />
              </h3>
              <p className="text-lg text-(--color-text-secondary) leading-relaxed mb-4">
                {bio}
              </p>
              {/* TODO: Make below info configurable or update this */}
              <p className="text-(--color-text-secondary) leading-relaxed">
                I believe in writing clean, maintainable code and creating user
                experiences that delight. When I'm not coding, you'll find me
                exploring new technologies or contributing to open source
                projects.
              </p>
            </div>

            {/* Quick Skills */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-(--color-text-primary) mb-4">
                Core Technologies
              </h3>
              <div className="flex flex-wrap gap-3">
                {quickSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-(--color-surface-highlight) text-(--color-text-secondary) rounded-full text-sm font-medium hover:bg-(--color-primary) hover:text-(--color-text-inverse) transition-colors duration-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <h3 className="text-xl font-bold text-(--color-text-primary) mb-4">
                What I Love Working On
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {interests.map((interest, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-(--color-surface-highlight) rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    <EmojiIcon emoji={interest.icon} className="w-8 h-8 shrink-0 text-(--color-primary)" />
                    <span className="font-medium text-(--color-text-primary)">
                      {interest.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
