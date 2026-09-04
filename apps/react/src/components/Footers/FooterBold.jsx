// ============================================
// ALTERNATIVE VERSION 2: BOLD & COLORFUL
// ============================================
/**
 * Footer - Bold & Colorful Version
 *
 * Eye-catching design with gradient backgrounds and animations
 */

import { EmojiIcon } from "@portfolio/icons/react";

export const FooterBold = ({ currentYear, name, socialLinks }) => {
  return (
    <footer className="relative bg-(--color-primary) text-(--color-text-inverse) overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-(--color-surface) rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-(--color-secondary) rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Main Content */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-2">Let's Connect</h3>
          <p className="text-(--color-text-inverse)/80 max-w-md mx-auto text-sm">
            Open for collaborations, interesting projects, or just a friendly
            chat about technology.
          </p>
        </div>

        {/* Social Buttons - Floating Style */}
        <div className="flex justify-center flex-wrap gap-4 mb-8">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
              className="group relative p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
            >
              <span className="sr-only">{link.name}</span>
              <div className="text-(--color-text-inverse) transition-transform duration-300">
                {link.icon}
              </div>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300"></div>
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-linear-to-r from-transparent via-white/20 to-transparent mb-6"></div>

        {/* Bottom Info */}
        <div className="text-center space-y-2">
          <p className="text-(--color-text-inverse)/80 text-sm">
            © {currentYear} {name}. Crafted with passion and code
          </p>
          <p className="text-(--color-text-inverse)/60 text-xs inline-flex items-center justify-center gap-1.5 w-full">
            Powered by React <EmojiIcon name="atom" className="w-3.5 h-3.5 inline text-cyan-300" /> &amp; Tailwind CSS <EmojiIcon name="palette" className="w-3.5 h-3.5 inline text-amber-300" />
          </p>
        </div>
      </div>
    </footer>
  );
};
