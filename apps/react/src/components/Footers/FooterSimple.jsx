// VERSION 1: SIMPLE FOOTER
// TODO: Add ids to different sections to complete this
// Quick navigation links (optional)
// TODO: build the quick links in a function to add if the user wants it
import { EmojiIcon } from "@portfolio/icons/react";

const quickLinks = [
  { name: "About", href: "#about" },
  { name: "Projects", href: "#projects" },
  { name: "Skills", href: "#skills" },
  { name: "Contact", href: "#contact" },
];

export const FooterSimple = ({ currentYear, name, socialLinks }) => {
  return (
    <footer className="bg-(--color-surface) text-(--color-text-primary)">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-(--color-text-primary) mb-2">
              {name}
            </h3>
            <p className="text-(--color-text-secondary) text-sm">
              {/* TODO: Make this a tagline in the data */}
              Building amazing digital experiences
            </p>
          </div>

          {/* Quick Links Section */}
          <div className="text-center">
            <h4 className="font-semibold text-(--color-text-primary) mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-(--color-text-secondary) hover:text-(--color-primary) text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links Section */}
          <div className="text-center md:text-right">
            <h4 className="font-semibold text-(--color-text-primary) mb-4">
              Connect
            </h4>
            <div className="flex justify-center md:justify-end gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-(--color-surface-highlight) text-(--color-text-secondary) hover:text-(--color-primary) hover:scale-110 transition-all duration-200"
                  aria-label={link.name}
                >
                  <div className="text-(--color-primary)">{link.icon}</div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-[3px] border-(--color-primary) my-4"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-(--color-primary)">
            © {currentYear} {name}. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-sm text-(--color-text-secondary)">
            <span>Built with</span>
            <EmojiIcon name="heart" className="w-4 h-4 text-red-500 animate-pulse inline" />
            <span>using</span>
            <span className="text-(--color-primary) font-semibold">React</span>
            <span>&amp;</span>
            <span className="text-(--color-secondary) font-semibold">
              Tailwind CSS
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
