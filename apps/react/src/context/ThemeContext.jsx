import { createContext, useContext, useEffect, useState } from "react";
import { themes, defaultTheme } from "../config/themes.js";
import { trackEvent } from "@portfolio/telemetry";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Theme State
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved && themes[saved] ? saved : defaultTheme;
  });

  // Dark Mode State
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return false;
      }
    }
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Apply Theme Colors
  useEffect(() => {
    localStorage.setItem("theme", currentTheme);
    const theme = themes[currentTheme];
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    trackEvent("theme_changed", { theme: currentTheme });
  }, [currentTheme]);

  // Apply Dark Mode Class
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(isDark));
    trackEvent("theme_toggle_dark_mode", { isDark });
  }, [isDark]);

  // Listen for System Preference Changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event) => {
      // Only update if user hasn't manually set a preference
      if (localStorage.getItem("darkMode") === null) {
        setIsDark(event.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        changeTheme,
        isDark,
        toggleDarkMode,
        theme: themes[currentTheme],
        allThemes: themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
