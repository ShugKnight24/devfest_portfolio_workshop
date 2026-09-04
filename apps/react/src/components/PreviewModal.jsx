import { useEffect } from "react";
import { createPortal } from "react-dom";

export const PreviewModal = ({
  difficultyColors,
  icons,
  isOpen,
  onClose,
  variants,
  selectedIndex,
  onChangeVariant,
  viewport,
  viewportSizes,
  onChangeViewport,
}) => {
  const SelectedComponent = variants[selectedIndex]?.component;
  const difficulty = variants[selectedIndex]?.difficulty || "Beginner";
  const colorClass = difficultyColors[difficulty] || difficultyColors.Beginner;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !SelectedComponent) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-gray-900/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          {/* Variant Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 hidden sm:inline">
              Component:
            </span>
            <select
              value={selectedIndex}
              onChange={(event) => onChangeVariant(Number(event.target.value))}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm cursor-pointer focus:ring-2 focus:ring-(--color-primary)"
            >
              {variants.map((variant, index) => (
                <option key={variant.name} value={index}>
                  {variant.name}
                </option>
              ))}
            </select>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}
            >
              {difficulty}
            </span>
          </div>

          <div className="h-6 w-px bg-gray-700 hidden sm:block" />

          {/* Viewport Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 hidden sm:inline">
              Width:
            </span>
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              {viewportSizes.map((vp) => (
                <button
                  key={vp.name}
                  onClick={() => onChangeViewport(vp)}
                  className={`p-2 rounded-md transition-colors cursor-pointer ${
                    viewport.name === vp.name
                      ? "bg-(--color-primary) text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-600"
                  }`}
                  title={`${vp.name}${
                    vp.width !== "100%"
                      ? ` (${vp.width}px)`
                      : " (fill available space)"
                  }`}
                >
                  {icons[vp.icon]}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500 hidden sm:inline">
              {viewport.width === "100%" ? "Auto" : `${viewport.width}px`}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          title="Close (Esc)"
        >
          <span className="text-sm hidden sm:inline">Close</span>
          {icons.exit}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 flex items-start justify-center bg-gray-950">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-auto transition-all duration-300"
          style={{
            width: viewport.width === "100%" ? "100%" : `${viewport.width}px`,
            maxWidth: "100%",
          }}
        >
          <SelectedComponent {...variants[selectedIndex].props} />
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-gray-800 border-t border-gray-700 text-center">
        <span className="text-sm text-gray-400">
          Press{" "}
          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mx-1">Esc</kbd>{" "}
          to close • Use{" "}
          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mx-1">←</kbd>
          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mx-1">→</kbd> to
          change variants
        </span>
      </div>
    </div>,
    document.body
  );
};
