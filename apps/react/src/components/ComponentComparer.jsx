import { useState, useEffect } from "react";

import { ResponsiveFrame } from "./ResponsiveFrame";
import { PreviewModal } from "./PreviewModal";

import {
  Desktop,
  Eye,
  EyeClosed,
  Expand,
  Mobile,
  SingleLayout,
  SplitLayout,
  Swap,
  Tablet,
} from "./Icons";

// Viewport presets - renamed "Full" to "Auto" to avoid confusion
const viewportSizes = [
  { name: "Mobile", width: 375, icon: "mobile" },
  { name: "Tablet", width: 768, icon: "tablet" },
  { name: "Desktop", width: 1024, icon: "desktop" },
  { name: "Auto", width: "100%", icon: "auto" },
];

// Difficulty colors mapping
const difficultyColors = {
  Challenge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  Beginner:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  Intermediate:
    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  Advanced:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
};

// Icons
const Icons = {
  mobile: <Mobile />,
  tablet: <Tablet />,
  desktop: <Desktop />,
  auto: <Expand />,
  preview: <Eye />,
  exit: <EyeClosed />,
  swap: <Swap />,
  single: <SingleLayout />,
  split: <SplitLayout />,
};

export const ComponentComparer = ({ variants, title, description }) => {
  const [leftVariant, setLeftVariant] = useState(0);
  const [rightVariant, setRightVariant] = useState(
    Math.min(1, variants.length - 1)
  );
  const [leftViewport, setLeftViewport] = useState(viewportSizes[3]); // Auto
  const [rightViewport, setRightViewport] = useState(viewportSizes[3]); // Auto
  const [viewMode, setViewMode] = useState("split"); // "split" or "single"
  const [previewPanel, setPreviewPanel] = useState(null); // "left", "right", or null

  const LeftComponent = variants[leftVariant]?.component;
  const RightComponent = variants[rightVariant]?.component;

  // Guard against invalid state
  if (!LeftComponent || !RightComponent) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-500">Loading components...</p>
      </div>
    );
  }

  const swapVariants = () => {
    const temp = leftVariant;
    setLeftVariant(rightVariant);
    setRightVariant(temp);
  };

  // Get difficulty color class
  const getDifficultyColor = (difficulty) => {
    return difficultyColors[difficulty] || difficultyColors.Beginner;
  };

  // Keyboard navigation for preview
  useEffect(() => {
    if (!previewPanel) return;

    const handleKeyDown = (e) => {
      const currentIndex = previewPanel === "left" ? leftVariant : rightVariant;
      const setVariant =
        previewPanel === "left" ? setLeftVariant : setRightVariant;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        setVariant(Math.min(variants.length - 1, currentIndex + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setVariant(Math.max(0, currentIndex - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewPanel, leftVariant, rightVariant, variants.length]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("split")}
                className={`p-2 rounded-md transition-colors cursor-pointer ${
                  viewMode === "split"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                title="Split View - Compare two variants"
              >
                {Icons.split}
              </button>
              <button
                onClick={() => setViewMode("single")}
                className={`p-2 rounded-md transition-colors cursor-pointer ${
                  viewMode === "single"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
                title="Single View - Focus on one variant"
              >
                {Icons.single}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        className={`grid ${
          viewMode === "split" ? "grid-cols-2" : "grid-cols-1"
        } gap-4 p-4 bg-gray-50 dark:bg-gray-900`}
      >
        {/* Left Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {viewMode === "split" ? "Left:" : "Component:"}
            </label>
            <select
              value={leftVariant}
              onChange={(e) => setLeftVariant(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm cursor-pointer focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
            >
              {variants.map((variant, index) => (
                <option key={variant.name} value={index}>
                  {variant.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setPreviewPanel("left")}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-gray-300 dark:border-gray-600"
              title="Open in Preview Mode"
            >
              {Icons.preview}
              <span className="text-xs hidden sm:inline">Preview</span>
            </button>
          </div>

          {/* Left Viewport Controls */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
              Size:
            </span>
            {viewportSizes.map((vp) => (
              <button
                key={vp.name}
                onClick={() => setLeftViewport(vp)}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  leftViewport.name === vp.name
                    ? "bg-(--color-primary) text-white"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                title={`${vp.name}${
                  vp.width !== "100%"
                    ? ` (${vp.width}px)`
                    : " (fill available space)"
                }`}
              >
                {Icons[vp.icon]}
              </button>
            ))}
          </div>
        </div>

        {/* Right Controls (only in split mode) */}
        {viewMode === "split" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Right:
              </label>
              <select
                value={rightVariant}
                onChange={(e) => setRightVariant(Number(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm cursor-pointer focus:ring-2 focus:ring-(--color-secondary) focus:border-transparent"
              >
                {variants.map((variant, index) => (
                  <option key={variant.name} value={index}>
                    {variant.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setPreviewPanel("right")}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-gray-300 dark:border-gray-600"
                title="Open in Preview Mode"
              >
                {Icons.preview}
                <span className="text-xs hidden sm:inline">Preview</span>
              </button>
            </div>

            {/* Right Viewport Controls */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                Size:
              </span>
              {viewportSizes.map((vp) => (
                <button
                  key={vp.name}
                  onClick={() => setRightViewport(vp)}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    rightViewport.name === vp.name
                      ? "bg-(--color-secondary) text-white"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title={`${vp.name}${
                    vp.width !== "100%"
                      ? ` (${vp.width}px)`
                      : " (fill available space)"
                  }`}
                >
                  {Icons[vp.icon]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparison View */}
      <div
        className={`grid ${
          viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        } divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700`}
      >
        {/* Left Panel */}
        <div className="p-4">
          <div className="text-center mb-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                variants[leftVariant].difficulty
              )}`}
            >
              {variants[leftVariant].name}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {variants[leftVariant].difficulty}
            </p>
          </div>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 overflow-auto max-h-[600px]">
            <ResponsiveFrame viewport={leftViewport}>
              <LeftComponent {...variants[leftVariant].props} />
            </ResponsiveFrame>
          </div>
        </div>

        {/* Right Panel (only in split mode) */}
        {viewMode === "split" && (
          <div className="p-4">
            <div className="text-center mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                  variants[rightVariant].difficulty
                )}`}
              >
                {variants[rightVariant].name}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {variants[rightVariant].difficulty}
              </p>
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 overflow-auto max-h-[600px]">
              <ResponsiveFrame viewport={rightViewport}>
                <RightComponent {...variants[rightVariant].props} />
              </ResponsiveFrame>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {viewMode === "split" && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-center">
          <button
            onClick={swapVariants}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2 transition-colors cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
          >
            {Icons.swap}
            Swap Panels
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        difficultyColors={difficultyColors}
        icons={Icons}
        isOpen={previewPanel !== null}
        onClose={() => setPreviewPanel(null)}
        variants={variants}
        selectedIndex={previewPanel === "left" ? leftVariant : rightVariant}
        onChangeVariant={
          previewPanel === "left" ? setLeftVariant : setRightVariant
        }
        viewport={previewPanel === "left" ? leftViewport : rightViewport}
        viewportSizes={viewportSizes}
        onChangeViewport={
          previewPanel === "left" ? setLeftViewport : setRightViewport
        }
      />
    </div>
  );
};
