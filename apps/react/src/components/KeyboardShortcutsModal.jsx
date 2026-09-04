import { useEffect, useState } from "react";
import { Close } from "./Icons";
import { EmojiIcon } from "./Icons/EmojiIcon";

/**
 * Keyboard Shortcuts Modal
 *
 * Shows all available keyboard shortcuts in the app.
 * Opens with ? or Cmd+K / Ctrl+K
 */

const shortcuts = [
  {
    category: "Navigation",
    items: [
      { keys: ["←", "→"], description: "Navigate between lessons" },
      { keys: ["↑", "↓"], description: "Alternative lesson navigation" },
      { keys: ["Home"], description: "Go to first lesson" },
      { keys: ["End"], description: "Go to last lesson" },
    ],
  },
  {
    category: "General",
    items: [
      { keys: ["?"], description: "Open this help modal" },
      { keys: ["⌘", "K"], description: "Open this help modal (Mac)" },
      { keys: ["Ctrl", "K"], description: "Open this help modal (Windows)" },
      { keys: ["Esc"], description: "Close modals / Exit preview mode" },
      { keys: ["D"], description: "Toggle dark mode" },
    ],
  },
  {
    category: "Showcase",
    items: [
      {
        keys: ["←", "→"],
        description: "Navigate component variants (in preview)",
      },
      { keys: ["Esc"], description: "Exit fullscreen preview" },
    ],
  },
  {
    category: "Secret",
    items: [
      {
        keys: ["↑", "↑", "↓", "↓", "←", "→", "←", "→", "B", "A"],
        description: "Konami Code",
        icon: "gamepad",
      },
    ],
  },
];

export const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-(--color-primary) to-(--color-secondary) flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Keyboard Shortcuts
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Navigate faster with these shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <Close className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <span className="text-gray-800 dark:text-gray-200 text-sm inline-flex items-center gap-2">
                        {shortcut.icon && (
                          <EmojiIcon
                            name={shortcut.icon}
                            className="w-4 h-4 text-purple-500 shrink-0"
                          />
                        )}
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span
                            key={keyIndex}
                            className="flex items-center gap-1"
                          >
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-700 dark:text-gray-300 shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 &&
                              shortcut.keys.length <= 2 && (
                                <span className="text-gray-400 text-xs">+</span>
                              )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Press{" "}
            <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
              Esc
            </kbd>{" "}
            to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
