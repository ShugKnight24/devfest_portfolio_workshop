import { useEffect, useState } from "react";

export const ScrollToTop = ({ isVisible, onClick }) => {
  const [progress, setProgress] = useState(0);

  // Calculate how far the user has scrolled (0 to 1)
  useEffect(() => {
    const updateProgress = () => {
      const scrollTotal =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollTotal > 0) {
        setProgress(window.scrollY / scrollTotal);
      }
    };

    window.addEventListener("scroll", updateProgress);
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  const size = 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <div
      className={`fixed bottom-18 right-9 z-50 transition-all duration-200 ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-6 pointer-events-none"
      }`}
    >
      <button
        onClick={onClick}
        className="w-12 h-12 flex items-center justify-center bg-gray-900 dark:bg-gray-800 text-white rounded-full shadow-xl border border-gray-700/60 hover:cursor-pointer hover:bg-black dark:hover:bg-gray-700 hover:scale-110 relative transition-transform focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        aria-label="Scroll to top"
      >
        {/* Progress Ring SVG */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          {/* Indicator Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(156, 163, 175, 0.3)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3B82F6"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-150 ease-out"
          />
        </svg>
        <svg
          className="w-5 h-5 relative z-10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
};
