import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import { Checkmark, PaletteSwatch } from "./Icons";

function ThemeSwitcher({
  className = "",
  buttonClassName = "",
  menuClassName = "",
  showLabel = false,
  verticalPos = "top",
  horizontalPos = "center",
  isVertical = false,
}) {
  const { currentTheme, changeTheme, allThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const defaultBtnClass =
    "p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:scale-105 transition-all duration-300 hover:shadow-md hover:cursor-pointer text-gray-700 dark:text-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none";

  const getMenuPlacementClass = () => {
    if (menuClassName) return menuClassName;
    if (isVertical) {
      return horizontalPos === "left"
        ? "left-full ml-2 top-0"
        : "right-full mr-2 top-0";
    }
    return verticalPos === "top"
      ? "top-full mt-2 right-0"
      : "bottom-full mb-2 right-0";
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || defaultBtnClass}
        aria-label="Change theme"
        aria-expanded={isOpen}
        title="Change theme"
      >
        <PaletteSwatch className="w-5 h-5 shrink-0" />
        {showLabel && (
          <span className="text-xs font-mono font-semibold">Themes</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-60"
            onClick={() => setIsOpen(false)}
          />

          {/* Theme Menu */}
          <div
            className={`absolute ${getMenuPlacementClass()} bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-2xl z-70 max-h-96 overflow-y-auto w-72`}
          >
            <div className="p-2 space-y-1">
              <div className="text-xs text-center font-bold text-(--color-text) dark:text-(--color-text-dark) uppercase tracking-wider px-2 py-1.5 border-b border-(--color-border)/60 dark:border-(--color-border-dark)/60">
                Select Theme ({Object.keys(allThemes).length})
              </div>
              {Object.entries(allThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    changeTheme(key);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 flex items-center justify-between gap-2 cursor-pointer ${
                    currentTheme === key
                      ? "bg-(--color-primary)/15 text-(--color-primary) font-semibold border border-(--color-primary)/30"
                      : "hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) text-(--color-text) dark:text-(--color-text-dark)"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Color preview circles */}
                    <div className="flex -space-x-1 shrink-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: theme.colors.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: theme.colors.accent }}
                        title="Accent"
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: theme.colors.secondary }}
                        title="Secondary"
                      />
                    </div>
                    <span className="text-xs truncate">{theme.name}</span>
                  </div>
                  {currentTheme === key && <Checkmark className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ThemeSwitcher;
