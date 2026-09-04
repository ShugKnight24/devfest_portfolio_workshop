import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { EmojiIcon } from "./Icons/EmojiIcon";
import { trackEvent } from "@portfolio/telemetry";

/**
 * Achievement System
 *
 * Tracks user progress and unlocks achievements as they complete tasks.
 * Adds gamification to the workshop experience!
 */

const ACHIEVEMENTS = {
  firstVisit: {
    id: "firstVisit",
    title: "Hello, World!",
    description: "Visit the portfolio builder for the first time",
    icon: "👋",
    points: 10,
    secret: false,
  },
  dataCustomizer: {
    id: "dataCustomizer",
    title: "Data Master",
    description: "Customize your portfolio data",
    icon: "📝",
    points: 25,
    secret: false,
  },
  themeExplorer: {
    id: "themeExplorer",
    title: "Style Guru",
    description: "Try 5 different themes",
    icon: "🎨",
    points: 20,
    secret: false,
  },
  lessonComplete: {
    id: "lessonComplete",
    title: "Quick Learner",
    description: "Complete your first lesson",
    icon: "📚",
    points: 15,
    secret: false,
  },
  allLessonsComplete: {
    id: "allLessonsComplete",
    title: "Knowledge Seeker",
    description: "Complete all lessons",
    icon: "🎓",
    points: 100,
    secret: false,
  },
  showcaseExplorer: {
    id: "showcaseExplorer",
    title: "Component Explorer",
    description: "View all component variants in the showcase",
    icon: "🔍",
    points: 20,
    secret: false,
  },
  darkModeMaster: {
    id: "darkModeMaster",
    title: "Night Owl",
    description: "Toggle dark mode 10 times",
    icon: "🌙",
    points: 15,
    secret: true,
  },
  konamiCode: {
    id: "konamiCode",
    title: "Secret Gamer",
    description: "Enter the Konami Code",
    icon: "🎮",
    points: 50,
    secret: true,
  },
  speedRunner: {
    id: "speedRunner",
    title: "Speed Runner",
    description: "Complete the workshop in under 30 minutes",
    icon: "⚡",
    points: 75,
    secret: false,
  },
  codePlayground: {
    id: "codePlayground",
    title: "Code Explorer",
    description: "Run code in the playground 5 times",
    icon: "💻",
    points: 20,
    secret: false,
  },
  helpSeeker: {
    id: "helpSeeker",
    title: "Problem Solver",
    description: "Visit the troubleshooting page",
    icon: "🔧",
    points: 10,
    secret: false,
  },
  keyboardNinja: {
    id: "keyboardNinja",
    title: "Keyboard Ninja",
    description: "Use 5 keyboard shortcuts",
    icon: "⌨️",
    points: 25,
    secret: false,
  },
  resourceReader: {
    id: "resourceReader",
    title: "Lifelong Learner",
    description: "Visit the What's Next page",
    icon: "🚀",
    points: 15,
    secret: false,
  },
  persistentLearner: {
    id: "persistentLearner",
    title: "Persistent Learner",
    description: "Return to the workshop on a different day",
    icon: "📅",
    points: 30,
    secret: false,
  },
  socialButterfly: {
    id: "socialButterfly",
    title: "Social Butterfly",
    description: "Add all your social links",
    icon: "🦋",
    points: 20,
    secret: false,
  },
};

const AchievementContext = createContext(null);

export const AchievementProvider = ({ children }) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    const saved = localStorage.getItem("achievements");
    return saved ? JSON.parse(saved) : [];
  });

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("achievementStats");
    return saved
      ? JSON.parse(saved)
      : {
          themeSwitches: 0,
          darkModeToggles: 0,
          lessonsCompleted: [],
          playgroundRuns: 0,
          keyboardShortcuts: 0,
          firstVisitDate: null,
          lastVisitDate: null,
        };
  });

  const [notification, setNotification] = useState(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("achievements", JSON.stringify(unlockedAchievements));
  }, [unlockedAchievements]);

  useEffect(() => {
    localStorage.setItem("achievementStats", JSON.stringify(stats));
  }, [stats]);

  // Track first visit
  useEffect(() => {
    if (!stats.firstVisitDate) {
      setStats((prev) => ({
        ...prev,
        firstVisitDate: new Date().toISOString(),
        lastVisitDate: new Date().toISOString(),
      }));
      unlockAchievement("firstVisit");
    } else {
      // Check for returning visitor
      const lastDate = new Date(stats.lastVisitDate).toDateString();
      const today = new Date().toDateString();
      if (lastDate !== today) {
        unlockAchievement("persistentLearner");
      }
      setStats((prev) => ({
        ...prev,
        lastVisitDate: new Date().toISOString(),
      }));
    }
  }, []);

  const unlockAchievement = useCallback(
    (achievementId) => {
      if (unlockedAchievements.includes(achievementId)) return;

      const achievement = ACHIEVEMENTS[achievementId];
      if (!achievement) return;

      trackEvent("achievement_unlocked", { achievement: achievementId });

      setUnlockedAchievements((prev) => [...prev, achievementId]);
      setNotification({
        ...achievement,
        timestamp: Date.now(),
      });

      // Clear notification after animation
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    },
    [unlockedAchievements],
  );

  const trackAction = useCallback(
    (action, data = {}) => {
      trackEvent(action, data);

      switch (action) {
        case "theme_switch":
          setStats((prev) => {
            const newCount = prev.themeSwitches + 1;
            if (newCount >= 5) unlockAchievement("themeExplorer");
            return { ...prev, themeSwitches: newCount };
          });
          break;

        case "dark_mode_toggle":
          setStats((prev) => {
            const newCount = prev.darkModeToggles + 1;
            if (newCount >= 10) unlockAchievement("darkModeMaster");
            return { ...prev, darkModeToggles: newCount };
          });
          break;

        case "lesson_complete":
          setStats((prev) => {
            if (prev.lessonsCompleted.includes(data.lessonId)) return prev;
            const newLessons = [...prev.lessonsCompleted, data.lessonId];
            if (newLessons.length === 1) unlockAchievement("lessonComplete");
            if (newLessons.length >= 9) unlockAchievement("allLessonsComplete");
            return { ...prev, lessonsCompleted: newLessons };
          });
          break;

        case "playground_run":
          setStats((prev) => {
            const newCount = prev.playgroundRuns + 1;
            if (newCount >= 5) unlockAchievement("codePlayground");
            return { ...prev, playgroundRuns: newCount };
          });
          break;

        case "keyboard_shortcut":
          setStats((prev) => {
            const newCount = prev.keyboardShortcuts + 1;
            if (newCount >= 5) unlockAchievement("keyboardNinja");
            return { ...prev, keyboardShortcuts: newCount };
          });
          break;

        case "konami_code":
          unlockAchievement("konamiCode");
          break;

        case "visit_help":
          unlockAchievement("helpSeeker");
          break;

        case "visit_whats_next":
          unlockAchievement("resourceReader");
          break;

        case "visit_showcase":
          unlockAchievement("showcaseExplorer");
          break;

        default:
          break;
      }
    },
    [unlockAchievement],
  );

  const getTotalPoints = () => {
    return unlockedAchievements.reduce((total, id) => {
      return total + (ACHIEVEMENTS[id]?.points || 0);
    }, 0);
  };

  const getProgress = () => {
    const total = Object.keys(ACHIEVEMENTS).length;
    const unlocked = unlockedAchievements.length;
    return Math.round((unlocked / total) * 100);
  };

  return (
    <AchievementContext.Provider
      value={{
        achievements: ACHIEVEMENTS,
        unlockedAchievements,
        unlockAchievement,
        trackAction,
        stats,
        getTotalPoints,
        getProgress,
        notification,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error("useAchievements must be used within AchievementProvider");
  }
  return context;
};

// Achievement notification popup
export const AchievementNotification = () => {
  const { notification } = useAchievements();

  if (!notification) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-200 animate-slide-down">
      <div className="bg-linear-to-r from-yellow-400 via-orange-500 to-pink-500 p-1 rounded-2xl shadow-2xl">
        <div className="bg-gray-900 rounded-xl px-6 py-4 flex items-center gap-4">
          <div className="text-yellow-400 animate-bounce">
            <EmojiIcon emoji={notification.icon} className="w-10 h-10" />
          </div>
          <div>
            <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">
              Achievement Unlocked!
            </p>
            <h3 className="text-white font-bold text-lg">
              {notification.title}
            </h3>
            <p className="text-gray-400 text-sm">{notification.description}</p>
          </div>
          <div className="text-yellow-400 font-bold text-lg">
            +{notification.points}
          </div>
        </div>
      </div>
    </div>
  );
};

// Achievement badge component
export const AchievementBadge = ({ achievementId, size = "md" }) => {
  const { achievements, unlockedAchievements } = useAchievements();
  const achievement = achievements[achievementId];
  const isUnlocked = unlockedAchievements.includes(achievementId);

  if (!achievement) return null;

  const sizes = {
    sm: "w-12 h-12 text-xl",
    md: "w-16 h-16 text-2xl",
    lg: "w-20 h-20 text-3xl",
  };

  return (
    <div
      className={`
        ${sizes[size]} rounded-xl flex items-center justify-center
        transition-all duration-300
        ${
          isUnlocked
            ? "bg-linear-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/30"
            : "bg-gray-200 dark:bg-gray-700 grayscale opacity-50"
        }
      `}
      title={isUnlocked ? achievement.title : "???"}
    >
      <EmojiIcon
        emoji={isUnlocked || !achievement.secret ? achievement.icon : "🔒"}
        className={
          sizes[size].includes("w-12")
            ? "w-6 h-6"
            : sizes[size].includes("w-16")
              ? "w-8 h-8"
              : "w-10 h-10"
        }
      />
    </div>
  );
};

// Achievements panel for displaying all achievements
export const AchievementsPanel = () => {
  const { achievements, unlockedAchievements, getTotalPoints, getProgress } =
    useAchievements();

  const achievementList = Object.values(achievements);
  const visibleAchievements = achievementList.filter(
    (a) => !a.secret || unlockedAchievements.includes(a.id),
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Achievements
          </h2>
          <p className="text-sm text-gray-500">
            {unlockedAchievements.length} / {achievementList.length} unlocked
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-500">
            {getTotalPoints()}
          </p>
          <p className="text-xs text-gray-500">Total Points</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-yellow-400 to-orange-500 transition-all duration-500"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">
          {getProgress()}%
        </p>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {visibleAchievements.map((achievement) => {
          const isUnlocked = unlockedAchievements.includes(achievement.id);
          return (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                isUnlocked
                  ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60"
              }`}
            >
              <div className="mb-2 text-(--color-primary)">
                <EmojiIcon emoji={achievement.icon} className="w-8 h-8" />
              </div>
              <h3
                className={`font-bold text-sm ${
                  isUnlocked
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-500"
                }`}
              >
                {isUnlocked ? achievement.title : "???"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {isUnlocked ? achievement.description : "Keep exploring!"}
              </p>
              {isUnlocked && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-2">
                  +{achievement.points} pts
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Secret achievements hint */}
      {achievementList.filter(
        (a) => a.secret && !unlockedAchievements.includes(a.id),
      ).length > 0 && (
        <p className="text-center text-sm text-gray-500 mt-6">
          <EmojiIcon
            emoji="🔒"
            className="w-4 h-4 inline-block align-text-bottom"
          />{" "}
          There are secret achievements waiting to be discovered...
        </p>
      )}
    </div>
  );
};

export default AchievementProvider;
