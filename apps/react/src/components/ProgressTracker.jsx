import { useState, useEffect } from "react";

// Simple SVG Icons
// TODO: Convert to Icon components
const Icons = {
  info: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  data: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
    </svg>
  ),
  header: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h7"
      />
    </svg>
  ),
  about: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  skills: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  ),
  projects: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  ),
  footer: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </svg>
  ),
  styled: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      />
    </svg>
  ),
  deployed: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  ),
  check: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
};

const milestones = [
  {
    id: "data",
    name: "Explore Data",
    description: "Reviewed portfolioData.js",
    icon: "data",
  },
  {
    id: "header",
    name: "Header",
    description: "Built the Header component",
    icon: "header",
  },
  {
    id: "about",
    name: "About",
    description: "Created the About section",
    icon: "about",
  },
  {
    id: "skills",
    name: "Skills",
    description: "Added Skills with .map()",
    icon: "skills",
  },
  {
    id: "projects",
    name: "Projects",
    description: "Displayed project cards",
    icon: "projects",
  },
  {
    id: "footer",
    name: "Footer",
    description: "Completed the Footer",
    icon: "footer",
  },
  {
    id: "styled",
    name: "Styled",
    description: "Applied custom styling",
    icon: "styled",
  },
  {
    id: "deployed",
    name: "Deployed",
    description: "Published online",
    icon: "deployed",
  },
];

export const ProgressTracker = () => {
  const [completed, setCompleted] = useState(() => {
    const saved = localStorage.getItem("workshop_progress");
    return saved ? JSON.parse(saved) : [];
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    localStorage.setItem("workshop_progress", JSON.stringify(completed));
  }, [completed]);

  const toggleMilestone = (id) => {
    const isCompleting = !completed.includes(id);

    if (isCompleting) {
      setCompleted([...completed, id]);
      setNewAchievement(milestones.find((m) => m.id === id));
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);
    } else {
      setCompleted(completed.filter((m) => m !== id));
    }
  };

  const progress = (completed.length / milestones.length) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      {/* Celebration Toast */}
      {showCelebration && newAchievement && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              {Icons.check}
            </div>
            <div>
              <p className="font-semibold text-sm">{newAchievement.name}</p>
              <p className="text-xs text-green-100">Completed!</p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Info Tooltip */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
            Workshop Progress
          </h3>
          <div className="relative">
            <button
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              onClick={() => setShowInfo(!showInfo)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="What is this?"
            >
              {Icons.info}
            </button>
            {showInfo && (
              <div className="absolute left-0 top-full mt-2 z-50 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl">
                <p className="font-semibold mb-1">Track Your Progress</p>
                <p className="text-gray-300 leading-relaxed">
                  Click each milestone as you complete it during the workshop.
                  Your progress is saved locally, so you can pick up where you
                  left off!
                </p>
                <div className="absolute -top-1.5 left-3 w-3 h-3 bg-gray-900 dark:bg-gray-700 rotate-45" />
              </div>
            )}
          </div>
        </div>
        <span className="text-xs font-medium text-(--color-primary)">
          {completed.length}/{milestones.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-(--color-primary) transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Milestones List */}
      <div className="space-y-1">
        {milestones.map((milestone) => {
          const isComplete = completed.includes(milestone.id);
          return (
            <button
              key={milestone.id}
              onClick={() => toggleMilestone(milestone.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-left group cursor-pointer
                ${
                  isComplete
                    ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }
                active:scale-[0.98]
              `}
            >
              {/* Icon/Checkbox */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200
                  ${
                    isComplete
                      ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-300 dark:group-hover:bg-gray-600 group-hover:scale-110"
                  }
                `}
              >
                {isComplete ? Icons.check : Icons[milestone.icon]}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate transition-colors
                    ${
                      isComplete
                        ? "text-green-700 dark:text-green-400"
                        : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100"
                    }
                  `}
                >
                  {milestone.name}
                </p>
                <p
                  className={`text-xs truncate transition-colors
                    ${
                      isComplete
                        ? "text-green-600/70 dark:text-green-500/70"
                        : "text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                    }
                  `}
                >
                  {milestone.description}
                </p>
              </div>

              {/* Hover indicator */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100
                  ${
                    isComplete
                      ? "bg-red-100 dark:bg-red-900/30 text-red-500"
                      : "bg-green-100 dark:bg-green-900/30 text-green-500"
                  }
                `}
              >
                {isComplete ? (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  Icons.check
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Reset */}
      {completed.length > 0 && (
        <button
          onClick={() => setCompleted([])}
          className="mt-3 w-full text-xs text-gray-500 hover:text-red-500 dark:hover:text-red-400 py-2 border-t border-gray-200 dark:border-gray-700 transition-colors hover:bg-red-50 dark:hover:bg-red-900/10 rounded-b-lg"
        >
          Reset Progress
        </button>
      )}
    </div>
  );
};
