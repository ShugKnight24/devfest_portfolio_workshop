import { createContext, useContext, useEffect, useState } from "react";
import { themes, defaultTheme } from "../config/themes.js";
import { trackEvent } from "@portfolio/telemetry";

const ThemeContext = createContext();

// Color helper to calculate luminance and derive surface/border/text
const hexToRgb = (hex) => {
  if (!hex || typeof hex !== "string") return [0, 0, 0];
  const cleaned = hex.replace("#", "").trim();
  const num = parseInt(
    cleaned.length === 3
      ? cleaned.split("").map((c) => c + c).join("")
      : cleaned,
    16
  );
  if (isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

const rgbToHex = (r, g, b) =>
  `#${[r, g, b]
    .map((x) => Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, "0"))
    .join("")}`;

// Lighten color towards white (factor 0 to 1)
const lightenColor = (hex, factor) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
};

// Darken color towards black (factor 0 to 1)
const darkenColor = (hex, factor) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor));
};

// Relative luminance calculation according to WCAG
const getLuminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const val = v / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Calculate all tokens for a theme
export const resolveThemeTokens = (theme) => {
  const c = theme?.colors || {};
  const darkCanvas = c.dark || "#020304";
  const lightCanvas = c.background || "#F9FAFB";
  const primary = c.primary || "#3B82F6";

  const isDarkCanvasLight = getLuminance(darkCanvas) > 0.2;
  const isLightCanvasDark = getLuminance(lightCanvas) < 0.3;

  // 1. Surface Dark (Cards, panels in dark mode)
  const surfaceDark =
    c.surfaceDark || (isDarkCanvasLight ? darkenColor(darkCanvas, 0.06) : lightenColor(darkCanvas, 0.05));
  const surfaceHoverDark =
    c.surfaceHoverDark || (isDarkCanvasLight ? darkenColor(darkCanvas, 0.12) : lightenColor(darkCanvas, 0.09));

  // 2. Surface Light (Cards, panels in light mode)
  const surface =
    c.surface || (isLightCanvasDark ? lightenColor(lightCanvas, 0.08) : "#FFFFFF");
  const surfaceHover =
    c.surfaceHover || (isLightCanvasDark ? lightenColor(lightCanvas, 0.14) : darkenColor(surface, 0.03));

  // 3. Borders
  const borderDark =
    c.borderDark || (isDarkCanvasLight ? darkenColor(darkCanvas, 0.2) : lightenColor(darkCanvas, 0.12));
  const border =
    c.border || (isLightCanvasDark ? lightenColor(lightCanvas, 0.22) : darkenColor(lightCanvas, 0.12));
  const borderSubtle = c.borderSubtle || `${primary}26`;

  // 4. Text & Muted Text
  const text = c.text || "#1F2937";
  const textDark = c.textDark || "#FFFFFF";
  const mutedText = c.mutedText || darkenColor(text, 0.35);
  const mutedTextDark = c.mutedTextDark || lightenColor(darkCanvas, 0.55);

  // 5. Primary button contrast text
  const primaryLuminance = getLuminance(primary);
  const primaryText = c.primaryText || (primaryLuminance > 0.45 ? "#050608" : "#FFFFFF");

  return {
    primary,
    secondary: c.secondary || primary,
    accent: c.accent || primary,
    background: lightCanvas,
    dark: darkCanvas,
    surface,
    surfaceDark,
    surfaceHover,
    surfaceHoverDark,
    border,
    borderDark,
    borderSubtle,
    text,
    textDark,
    mutedText,
    mutedTextDark,
    primaryText,
  };
};

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

    // Apply all kebab-case and camelCase CSS custom properties
    Object.entries(tokens).forEach(([key, value]) => {
      const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      root.style.setProperty(`--color-${kebab}`, value);
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
