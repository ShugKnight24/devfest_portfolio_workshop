import { useState } from "react";
import { Checkmark } from "./Icons";

/**
 * Copy Button Component
 *
 * A reusable button that copies text to clipboard with visual feedback.
 *
 * Usage:
 * <CopyButton text="code to copy" />
 */

export const CopyButton = ({
  text,
  className = "",
  size = "sm",
  showLabel = false,
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const sizeClasses = {
    xs: "p-1",
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        inline-flex items-center gap-1.5 rounded-lg
        bg-gray-200 dark:bg-gray-700 
        hover:bg-gray-300 dark:hover:bg-gray-600
        text-gray-600 dark:text-gray-300
        transition-all duration-200
        ${sizeClasses[size]}
        ${
          copied
            ? "bg-green-100! dark:bg-green-900/50! text-green-600! dark:text-green-400!"
            : ""
        }
        ${className}
      `}
      title={copied ? "Copied!" : "Copy to clipboard"}
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <Checkmark className={iconSizes[size]} />
          {showLabel && <span className="text-xs font-medium">Copied!</span>}
        </>
      ) : (
        <>
          <svg
            className={iconSizes[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {showLabel && <span className="text-xs font-medium">Copy</span>}
        </>
      )}
    </button>
  );
};

export default CopyButton;
