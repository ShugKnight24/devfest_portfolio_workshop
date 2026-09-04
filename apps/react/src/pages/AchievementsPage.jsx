import { AchievementsPanel, useAchievements } from "../components/Achievements";
import { EmojiIcon } from "../components/Icons/EmojiIcon";

/**
 * Achievements Page
 *
 * Display all achievements and progress in the workshop gamification system.
 */
const AchievementsPage = () => {
  const { getTotalPoints, getProgress, stats, unlockedAchievements } =
    useAchievements();

  // Calculate rank based on points
  const getRank = (points) => {
    if (points >= 400)
      return { name: "Grand Master", color: "text-purple-500", emoji: "👑" };
    if (points >= 300)
      return { name: "Expert", color: "text-red-500", emoji: "🔥" };
    if (points >= 200)
      return { name: "Advanced", color: "text-orange-500", emoji: "⭐" };
    if (points >= 100)
      return { name: "Intermediate", color: "text-yellow-500", emoji: "🌟" };
    if (points >= 50)
      return { name: "Beginner", color: "text-green-500", emoji: "🌱" };
    return { name: "Newcomer", color: "text-gray-500", emoji: "🥚" };
  };

  const totalPoints = getTotalPoints();
  const rank = getRank(totalPoints);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Your Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your achievements and see how far you&apos;ve come!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <p className="text-4xl font-bold text-yellow-500">{totalPoints}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Points
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <p className="text-4xl font-bold text-blue-500">
              {unlockedAchievements.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Achievements
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <p className="text-4xl font-bold text-green-500">
              {getProgress()}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Completion
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <p className={`text-2xl font-bold ${rank.color}`}>
              <EmojiIcon
                emoji={rank.emoji}
                className="w-6 h-6 inline-block align-text-bottom"
              />{" "}
              {rank.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Current Rank
            </p>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Activity Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-500">
                {stats.themeSwitches || 0}
              </p>
              <p className="text-xs text-gray-500">Themes Tried</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-500">
                {stats.lessonsCompleted?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Lessons Completed</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-2xl font-bold text-pink-500">
                {stats.playgroundRuns || 0}
              </p>
              <p className="text-xs text-gray-500">Code Runs</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-2xl font-bold text-cyan-500">
                {stats.keyboardShortcuts || 0}
              </p>
              <p className="text-xs text-gray-500">Shortcuts Used</p>
            </div>
          </div>
        </div>

        {/* Rank Progression */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Rank Progression
          </h2>
          <div className="space-y-4">
            {[
              {
                name: "Newcomer",
                points: 0,
                emoji: "🥚",
                color: "bg-gray-400",
              },
              {
                name: "Beginner",
                points: 50,
                emoji: "🌱",
                color: "bg-green-500",
              },
              {
                name: "Intermediate",
                points: 100,
                emoji: "🌟",
                color: "bg-yellow-500",
              },
              {
                name: "Advanced",
                points: 200,
                emoji: "⭐",
                color: "bg-orange-500",
              },
              { name: "Expert", points: 300, emoji: "🔥", color: "bg-red-500" },
              {
                name: "Grand Master",
                points: 400,
                emoji: "👑",
                color: "bg-purple-500",
              },
            ].map((rankInfo, index) => {
              const isUnlocked = totalPoints >= rankInfo.points;
              const nextRank = [50, 100, 200, 300, 400, 500][index];
              const progress = isUnlocked
                ? 100
                : Math.min(
                    100,
                    ((totalPoints -
                      (index > 0
                        ? [0, 50, 100, 200, 300, 400][index - 1]
                        : 0)) /
                      (rankInfo.points -
                        (index > 0
                          ? [0, 50, 100, 200, 300, 400][index - 1]
                          : 0))) *
                      100,
                  );

              return (
                <div key={rankInfo.name} className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl
                      ${
                        isUnlocked
                          ? rankInfo.color
                          : "bg-gray-200 dark:bg-gray-700"
                      }
                    `}
                  >
                    {isUnlocked ? (
                      <EmojiIcon emoji={rankInfo.emoji} className="w-6 h-6" />
                    ) : (
                      <EmojiIcon emoji="🔒" className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`font-medium ${
                          isUnlocked
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-500"
                        }`}
                      >
                        {rankInfo.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {rankInfo.points} pts
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${rankInfo.color} transition-all duration-500`}
                        style={{
                          width: `${isUnlocked ? 100 : Math.max(0, progress)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements Panel */}
        <AchievementsPanel />

        {/* Tips Section */}
        <div className="mt-8 bg-linear-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">
            <EmojiIcon
              emoji="💡"
              className="w-5 h-5 inline-block align-text-bottom"
            />{" "}
            Tips to Earn More Points
          </h2>
          <ul className="space-y-2 text-sm">
            <li>• Explore different themes in the Theme Switcher</li>
            <li>• Complete all the lessons in the Guide section</li>
            <li>• Try running code in the Playground</li>
            <li>• Use keyboard shortcuts to navigate faster</li>
            <li>• Look for secret achievements (hint: try the Konami code!)</li>
            <li>• Return to the workshop on different days</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
