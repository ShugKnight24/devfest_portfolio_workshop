// ============================================
// ALTERNATIVE VERSION 3: GLASS MORPHISM
// ============================================
/**
 * Footer - Glass Morphism Version
 *
 * Modern glassmorphism design with backdrop blur
 */

import { EmojiIcon } from "@portfolio/icons/react";

export const FooterGlass = ({ currentYear, name, socialLinks }) => {
  return (
    <footer className="relative bg-(--color-surface)">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-(--color-surface)/30 rounded-3xl shadow-2xl border border-(--color-border)/50 p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Left: Name & Tagline */}
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-(--color-text-primary) mb-1">
                {name}
              </h3>
              <p className="text-(--color-text-secondary)">
                Let's build something amazing together
              </p>
            </div>

            {/* Right: Social Links */}
            <div className="flex flex-wrap justify-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                  className="px-4 py-2 rounded-xl backdrop-blur-md bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2 text-sm text-(--color-text-primary)"
                >
                  <div className="text-(--color-primary)">{link.icon}</div>
                  <div className="font-medium text-(--color-text-primary)">
                    {link.name}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-(--color-border) my-6"></div>

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-(--color-text-secondary)">
            <p>
              © {currentYear} {name}. All rights reserved.
            </p>
            <p className="flex items-center gap-1.5">
              Made with <EmojiIcon name="heart" className="w-4 h-4 text-red-500 inline" /> using{" "}
              <span className="font-semibold text-(--color-primary)">
                React
              </span>{" "}
              &{" "}
              <span className="font-semibold text-(--color-secondary)">
                Tailwind
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
