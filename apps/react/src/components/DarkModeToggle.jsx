import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "./Icons";

function DarkModeToggle({ className = "" }) {
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2.5 rounded-xl border transition-all duration-300 shadow-sm hover:scale-105 hover:shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
        isDark
          ? "bg-gray-800 border-gray-700 text-amber-400 hover:bg-gray-750"
          : "bg-white border-gray-200 text-indigo-600 hover:bg-gray-50"
      } ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
    </button>
  );
}

export default DarkModeToggle;
