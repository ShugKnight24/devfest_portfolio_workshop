// ============================================
// ALTERNATIVE VERSION 1: MINIMAL MODERN
// ============================================

/**
 * Footer - Minimal Modern Version
 *
 * Clean, minimalist design with focus on essentials
 */

export const FooterMinimal = ({ currentYear, name, socialLinks }) => {
  return (
    <footer className="bg-(--color-surface) border-t border-(--color-border)">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Left: Copyright */}
          <div className="text-(--color-text-secondary) text-sm">
            © {currentYear} {name}
          </div>

          {/* Center: Social Links */}
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors duration-200"
                aria-label={link.name}
                title={link.name}
              >
                {link.icon}
              </a>
            ))}
          </div>

          {/* Right: Built with */}
          <div className="text-(--color-text-secondary) text-sm">
            Built with <span className="text-(--color-primary)">React</span> &{" "}
            <span className="text-(--color-secondary)">Tailwind</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
