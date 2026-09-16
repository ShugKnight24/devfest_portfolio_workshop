import { createContext, useContext, useEffect, useState } from "react";
import { themes, defaultTheme } from "../config/themes.js";
import { trackEvent } from "@portfolio/telemetry";

const ThemeContext = createContext();

/*
 * Token resolution lives in @portfolio/themes/tokens.js so it can be unit
 * tested without a DOM and shared with the vanilla starter. It is re-exported
 * here because existing imports pull `resolveThemeTokens` from this module.
 *
 * That resolver is contrast-aware: 27 of the themes in this package declare
 * only 7 of the 17 tokens, and deriving the rest with plain arithmetic left 28
 * of 34 themes failing WCAG AA. It now measures each derived pair and corrects
 * it. See tokens.test.js, which fails the build if any theme regresses.
 */
export { resolveThemeTokens, contrastRatio, getLuminance } from "@portfolio/themes/tokens";
import { resolveThemeTokens } from "@portfolio/themes/tokens";

export function ThemeProvider({ children }) {
  // Theme State
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    // Default to reacher if no saved theme or if legacy 'default' is stored
    if (!saved || saved === "default") {
      return defaultTheme;
    }
    return themes[saved] ? saved : defaultTheme;
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
    try {
      localStorage.setItem("theme", currentTheme);
    } catch (e) {
      // ignore
    }
    const rawTheme = themes[currentTheme] || themes[defaultTheme];
    const tokens = resolveThemeTokens(rawTheme);
    const root = document.documentElement;

    /*
     * `primary` is tuned for the DARK canvas and measures ~1.3:1 as text on the
     * light one, which is why light mode was unreadable. `secondary` and
     * `accent` have the same problem (Pochita gold is 2:1 on bone). So the
     * mode-sensitive tokens are not written inline here: they are published as
     * `--brand-*` pairs and index.css picks the right one per mode. Writing
     * them inline would beat both rules and pin the dark value everywhere.
     */
    const MODE_SENSITIVE = new Set(["primary", "primaryText", "secondary", "accent"]);

    Object.entries(tokens).forEach(([key, value]) => {
      if (MODE_SENSITIVE.has(key)) return;
      const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      root.style.setProperty(`--color-${kebab}`, value);
      root.style.setProperty(`--color-${key}`, value);
    });

    root.style.setProperty("--brand-primary-dark", tokens.primary);
    root.style.setProperty("--brand-primary-light", tokens.primaryOnLight);
    root.style.setProperty("--brand-primary-text-dark", tokens.primaryText);
    root.style.setProperty("--brand-primary-text-light", tokens.primaryTextOnLight);
    root.style.setProperty("--brand-secondary-dark", tokens.secondary);
    root.style.setProperty("--brand-secondary-light", tokens.secondaryOnLight);
    root.style.setProperty("--brand-accent-dark", tokens.accent);
    root.style.setProperty("--brand-accent-light", tokens.accentOnLight);

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
