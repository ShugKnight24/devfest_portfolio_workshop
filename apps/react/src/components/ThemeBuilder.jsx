import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { createPortal } from "react-dom";
import { Close, Download, Eye, Checkmark } from "./Icons";
import { EmojiIcon } from "./Icons/EmojiIcon";

/**
 * Visual Theme Builder
 *
 * Allows users to create custom themes with a visual color picker interface.
 * Features:
 * - Live preview of color changes
 * - Pre-built color palettes
 * - Export theme as JSON/code
 * - Apply custom theme to portfolio
 */

// Pre-built color palettes for inspiration
const colorPalettes = [
  {
    name: "Ocean Breeze",
    colors: {
      primary: "#0077B6",
      secondary: "#00B4D8",
      accent: "#90E0EF",
      background: "#CAF0F8",
      dark: "#03045E",
      text: "#1B263B",
      textDark: "#E0E1DD",
    },
  },
  {
    name: "Forest Retreat",
    colors: {
      primary: "#2D6A4F",
      secondary: "#40916C",
      accent: "#95D5B2",
      background: "#D8F3DC",
      dark: "#1B4332",
      text: "#081C15",
      textDark: "#B7E4C7",
    },
  },
  {
    name: "Sunset Glow",
    colors: {
      primary: "#FF6B35",
      secondary: "#F7C59F",
      accent: "#EFEFD0",
      background: "#FFF8F0",
      dark: "#2E2E2E",
      text: "#1A1A1A",
      textDark: "#EFEFEF",
    },
  },
  {
    name: "Purple Haze",
    colors: {
      primary: "#7B2CBF",
      secondary: "#9D4EDD",
      accent: "#C77DFF",
      background: "#E0AAFF",
      dark: "#240046",
      text: "#10002B",
      textDark: "#E0AAFF",
    },
  },
  {
    name: "Midnight Tech",
    colors: {
      primary: "#00D9FF",
      secondary: "#00FFA3",
      accent: "#FF00E5",
      background: "#0A0A0F",
      dark: "#050508",
      text: "#FFFFFF",
      textDark: "#E0E0E0",
    },
  },
  {
    name: "Warm Coffee",
    colors: {
      primary: "#6F4E37",
      secondary: "#A67B5B",
      accent: "#ECB176",
      background: "#FED8B1",
      dark: "#3C2415",
      text: "#1A0F0A",
      textDark: "#E8D5C4",
    },
  },
];

// Color input component with label and preview
const ColorPicker = ({ label, value, onChange, description }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-600 overflow-hidden"
          style={{ padding: 0 }}
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} hex color`}
          className="mt-1 text-xs font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 w-24"
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

// Preview card component
const PreviewCard = ({ colors, themeName }) => (
  <div
    className="rounded-xl overflow-hidden shadow-lg"
    style={{ backgroundColor: colors.background }}
  >
    {/* Header preview */}
    <div
      className="p-4"
      style={{
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full"
          style={{ backgroundColor: colors.accent }}
        />
        <div>
          <h3 className="font-bold text-white text-sm">
            {themeName || "Custom Theme"}
          </h3>
          <p className="text-white/80 text-xs">Developer</p>
        </div>
      </div>
    </div>

    {/* Content preview */}
    <div className="p-4">
      <h4 className="font-semibold text-sm mb-2" style={{ color: colors.text }}>
        About Me
      </h4>
      <p className="text-xs mb-3" style={{ color: colors.text, opacity: 0.7 }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>

      {/* Skills preview */}
      <div className="flex gap-2 flex-wrap">
        {["React", "JavaScript", "CSS"].map((skill) => (
          <span
            key={skill}
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: colors.primary }}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>

    {/* Dark mode preview */}
    <div className="p-4" style={{ backgroundColor: colors.dark }}>
      <p className="text-xs" style={{ color: colors.textDark }}>
        Dark mode preview text
      </p>
    </div>
  </div>
);

export const ThemeBuilder = ({ isOpen, onClose }) => {
  const { allThemes, changeTheme } = useTheme();

  const [themeName, setThemeName] = useState("My Custom Theme");
  const [colors, setColors] = useState({
    primary: "#3B82F6",
    secondary: "#8B5CF6",
    accent: "#EC4899",
    background: "#FFFFFF",
    dark: "#1F2937",
    text: "#1F2937",
    textDark: "#F9FAFB",
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset scroll lock on mount/unmount
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle color change
  const updateColor = useCallback((key, value) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Apply palette
  const applyPalette = (palette) => {
    setColors(palette.colors);
    setThemeName(palette.name);
  };

  // Generate theme code
  const generateThemeCode = () => {
    const themeKey = themeName.toLowerCase().replace(/\s+/g, "");
    return `// Add this to your themes.js file
export const ${themeKey} = {
  name: "${themeName}",
  colors: {
    primary: "${colors.primary}",
    secondary: "${colors.secondary}",
    accent: "${colors.accent}",
    background: "${colors.background}",
    dark: "${colors.dark}",
    text: "${colors.text}",
    textDark: "${colors.textDark}",
  },
};`;
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateThemeCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as JSON
  const downloadJSON = () => {
    const themeData = {
      name: themeName,
      colors: colors,
    };
    const blob = new Blob([JSON.stringify(themeData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${themeName.toLowerCase().replace(/\s+/g, "-")}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply theme temporarily
  const previewTheme = () => {
    // Create CSS variables for the custom theme
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 inline-flex items-center gap-2">
              <EmojiIcon name="palette" className="w-6 h-6" /> Theme Builder
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create your own custom theme with live preview
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close Theme Builder"
          >
            <Close className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Controls */}
            <div className="space-y-6">
              {/* Theme Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme Name
                </label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  aria-label="Theme Name"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="My Custom Theme"
                />
              </div>

              {/* Color Palettes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Start from a Palette
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {colorPalettes.map((palette) => (
                    <button
                      key={palette.name}
                      onClick={() => applyPalette(palette)}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors group"
                    >
                      <div className="flex gap-0.5 mb-1">
                        {[
                          palette.colors.primary,
                          palette.colors.secondary,
                          palette.colors.accent,
                        ].map((color, i) => (
                          <div
                            key={i}
                            className="h-4 flex-1 first:rounded-l last:rounded-r"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-blue-500 truncate">
                        {palette.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customize Colors
                </label>
                <ColorPicker
                  label="Primary"
                  value={colors.primary}
                  onChange={(v) => updateColor("primary", v)}
                  description="Main brand color, buttons, links"
                />
                <ColorPicker
                  label="Secondary"
                  value={colors.secondary}
                  onChange={(v) => updateColor("secondary", v)}
                  description="Supporting color, gradients"
                />
                <ColorPicker
                  label="Accent"
                  value={colors.accent}
                  onChange={(v) => updateColor("accent", v)}
                  description="Highlights, badges, icons"
                />
                <ColorPicker
                  label="Background"
                  value={colors.background}
                  onChange={(v) => updateColor("background", v)}
                  description="Page background (light mode)"
                />
                <ColorPicker
                  label="Dark"
                  value={colors.dark}
                  onChange={(v) => updateColor("dark", v)}
                  description="Page background (dark mode)"
                />
                <ColorPicker
                  label="Text"
                  value={colors.text}
                  onChange={(v) => updateColor("text", v)}
                  description="Text color (light mode)"
                />
                <ColorPicker
                  label="Text Dark"
                  value={colors.textDark}
                  onChange={(v) => updateColor("textDark", v)}
                  description="Text color (dark mode)"
                />
              </div>
            </div>

            {/* Right: Preview */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Live Preview
                </label>
                <PreviewCard colors={colors} themeName={themeName} />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={previewTheme}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Apply Theme Preview
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export Theme
                </button>
              </div>

              {/* Tips */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2 inline-flex items-center gap-1.5">
                  <EmojiIcon name="lightbulb" className="w-4 h-4" /> Tips
                </h4>
                <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Use contrasting colors for text and background</li>
                  <li>• Test in both light and dark mode</li>
                  <li>• Export your theme to save it permanently</li>
                  <li>• Add your theme to themes.js for full integration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowExportModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Export Theme
            </h3>

            {/* Code Preview */}
            <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                {generateThemeCode()}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                {copied ? <Checkmark className="w-4 h-4" /> : null}
                {copied ? "Copied!" : "Copy Code"}
              </button>
              <button
                onClick={downloadJSON}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Close className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
};

export default ThemeBuilder;
