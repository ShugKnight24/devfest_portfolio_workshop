import { useEffect } from "react";

export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in inputs
      const activeElement = document.activeElement;
      const isTyping =
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.isContentEditable;

      if (isTyping) return;

      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      shortcuts.forEach(({ keys, action, preventDefault = true }) => {
        const [modifier, shortcutKey] = keys.includes("+")
          ? keys.split("+")
          : [null, keys];

        const modifierMatch =
          (modifier === "ctrl" && ctrl) ||
          (modifier === "shift" && shift) ||
          (!modifier && !ctrl && !shift);

        if (modifierMatch && key === shortcutKey.toLowerCase()) {
          if (preventDefault) event.preventDefault();
          action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};

// Usage example:
// useKeyboardShortcuts([
//   { keys: "ctrl+k", action: () => setCommandPaletteOpen(true) },
//   { keys: "Escape", action: () => setModalOpen(false) },
//   { keys: "?", action: () => setShowHelp(true) },
// ]);

// Add in app.jsx
// const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

//   useKeyboardShortcuts([
//     { keys: "d", action: () => toggleDarkMode() },
//     { keys: "?", action: () => setShowShortcutsHelp(true) },
//     { keys: "escape", action: () => setShowShortcutsHelp(false) },
//   ]);
