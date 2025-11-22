import { useTheme } from "../context/ThemeContext";

import { Sun, Moon } from "./Icons";

function DarkModeToggle({ className = "" }) {
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:scale-105 transition-all duration-300 hover:shadow-lg hover:cursor-pointer ${className} ${
        isDark ? "bg-gray-100" : "bg-gray-900"
      }`}
      aria-label="Toggle dark mode"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun /> : <Moon />}
    </button>
  );
}

export default DarkModeToggle;
