import { useState, useEffect } from "react";
import { useAchievements } from "../components/Achievements";
import { useChallenges } from "../components/ChallengeMode";
import { Link } from "react-router-dom";
import { Checkmark } from "../components/Icons";
import { EmojiIcon } from "../components/Icons/EmojiIcon";

/**
 * Progress Dashboard
 *
 * A central hub showing all learning progress:
 * - Lessons completed
 * - Challenges done
 * - Achievements unlocked
 * - Time spent learning
 * - Visual journey/stats
 */

// Lesson data for tracking — IDs must match reactLessons in Lessons.jsx
const LESSONS = [
  { id: "intro", title: "Intro to React", path: "/lessons/intro" },
  {
    id: "project-structure",
    title: "Project Structure",
    path: "/lessons/project-structure",
  },
  { id: "jsx-basics", title: "JSX Basics", path: "/lessons/jsx-basics" },
  { id: "props", title: "Props & Components", path: "/lessons/props" },
  {
    id: "mapping",
    title: "Mapping Over Data",
    path: "/lessons/mapping",
  },
  { id: "state", title: "State Management", path: "/lessons/state" },
  {
    id: "conditional",
    title: "Conditional Rendering",
    path: "/lessons/conditional",
  },
  { id: "styling", title: "Styling in React", path: "/lessons/styling" },
  {
    id: "deployment",
    title: "Deployment",
    path: "/lessons/deployment",
  },
  { id: "testing", title: "Testing", path: "/lessons/testing" },
  { id: "git-github", title: "Git & GitHub", path: "/lessons/git-github" },
  { id: "ai-assisted", title: "AI-Assisted Dev", path: "/lessons/ai-assisted" },
];

// Calculate streak from visit dates
const calculateStreak = (stats) => {
  if (!stats.lastVisitDate) return 0;

  const today = new Date();
  const lastVisit = new Date(stats.lastVisitDate);
  const diffDays = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));

  // If visited today or yesterday, streak continues
  if (diffDays <= 1) {
    return stats.streak || 1;
  }
  return 0;
};

// Progress ring component
const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = "#3B82F6",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// Stat card component
const StatCard = ({ icon, value, label, color = "blue", subtext }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
    <div className={`mb-2 text-${color}-500 flex justify-center`}>
      <EmojiIcon emoji={icon} className="w-10 h-10" />
    </div>
    <p className={`text-3xl font-bold text-${color}-500`}>{value}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
  </div>
);

// Activity calendar (mini heat map)
const ActivityCalendar = ({ activities = [] }) => {
  // Generate last 28 days
  const days = Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    return date.toISOString().split("T")[0];
  });

  // Count activities per day
  const activityCount = days.map((day) => {
    return activities.filter((a) => a.startsWith(day)).length;
  });

  const getIntensity = (count) => {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count === 1) return "bg-green-200 dark:bg-green-900";
    if (count <= 3) return "bg-green-400 dark:bg-green-700";
    return "bg-green-600 dark:bg-green-500";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
        <EmojiIcon
          emoji="📅"
          className="w-5 h-5 inline-block align-text-bottom"
        />{" "}
        Activity
      </h3>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div
            key={day}
            className={`w-full aspect-square rounded-sm ${getIntensity(
              activityCount[i],
            )}`}
            title={`${day}: ${activityCount[i]} activities`}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-500">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
        <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
        <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
        <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
        <span>More</span>
      </div>
    </div>
  );
};

// Lesson progress list
const LessonProgress = ({ completedLessons = [] }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">
          <EmojiIcon
            emoji="📚"
            className="w-5 h-5 inline-block align-text-bottom"
          />{" "}
          Lessons
        </h3>
        <span className="text-sm text-gray-500">
          {completedLessons.length}/{LESSONS.length} completed
        </span>
      </div>
      <div className="space-y-2">
        {LESSONS.map((lesson) => {
          const isCompleted = completedLessons.includes(lesson.id);
          return (
            <Link
              key={lesson.id}
              to={lesson.path}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isCompleted
                  ? "bg-green-50 dark:bg-green-900/20"
                  : "bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <Checkmark className="w-3.5 h-3.5 text-white" />
                ) : (
                  <span className="w-2 h-2 rounded-full border border-current opacity-60" />
                )}
              </div>
              <span
                className={`flex-1 text-sm ${
                  isCompleted
                    ? "text-green-700 dark:text-green-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {lesson.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Achievement preview
const AchievementPreview = ({ achievements, unlockedIds }) => {
  const recentUnlocked = Object.values(achievements)
    .filter((a) => unlockedIds.includes(a.id))
    .slice(0, 6);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">
          <EmojiIcon
            emoji="🏆"
            className="w-5 h-5 inline-block align-text-bottom"
          />{" "}
          Achievements
        </h3>
        <Link
          to="/achievements"
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          View all →
        </Link>
      </div>
      {recentUnlocked.length > 0 ? (
        <div className="grid grid-cols-6 gap-2">
          {recentUnlocked.map((achievement) => (
            <div
              key={achievement.id}
              className="aspect-square rounded-xl bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl shadow-lg"
              title={achievement.title}
            >
              {achievement.icon}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">
          Complete tasks to unlock achievements!
        </p>
      )}
    </div>
  );
};

// Challenge stats
const ChallengeStats = ({ stats, challenges, completedChallenges }) => {
  const completedCount = completedChallenges.length;
  const totalCount = challenges.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">
          <EmojiIcon
            emoji="⚡"
            className="w-5 h-5 inline-block align-text-bottom"
          />{" "}
          Challenges
        </h3>
        <Link
          to="/challenges"
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-purple-500">{completedCount}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-500">
            {stats.totalPoints}
          </p>
          <p className="text-xs text-gray-500">Points</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-500">
            {Math.round((completedCount / totalCount) * 100) || 0}%
          </p>
          <p className="text-xs text-gray-500">Complete</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>
    </div>
  );
};

// Main Dashboard Component
export const ProgressDashboard = () => {
  const {
    achievements,
    unlockedAchievements,
    stats: achievementStats,
    getTotalPoints,
    getProgress,
  } = useAchievements();
  const { challenges, completedChallenges, challengeStats } = useChallenges();

  const [sessionTime, setSessionTime] = useState(0);
  const [startTime] = useState(Date.now());

  // Track session time
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate overall progress
  const lessonsProgress =
    ((achievementStats.lessonsCompleted?.length || 0) / LESSONS.length) * 100;
  const challengesProgress =
    (completedChallenges.length / challenges.length) * 100;
  const achievementsProgress = getProgress();
  const overallProgress = Math.round(
    (lessonsProgress + challengesProgress + achievementsProgress) / 3,
  );

  // Get rank
  const getRank = (points) => {
    if (points >= 400)
      return { name: "Grand Master", emoji: "👑", color: "purple" };
    if (points >= 300) return { name: "Expert", emoji: "🔥", color: "red" };
    if (points >= 200)
      return { name: "Advanced", emoji: "⭐", color: "orange" };
    if (points >= 100)
      return { name: "Intermediate", emoji: "🌟", color: "yellow" };
    if (points >= 50) return { name: "Beginner", emoji: "🌱", color: "green" };
    return { name: "Newcomer", emoji: "🥚", color: "gray" };
  };

  const totalPoints = getTotalPoints() + challengeStats.totalPoints;
  const rank = getRank(totalPoints);
  const streak = calculateStreak(achievementStats);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-24">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
            <span>
              <EmojiIcon
                emoji="📊"
                className="w-5 h-5 inline-block align-text-bottom"
              />
            </span>
            <span>Your Learning Journey</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Progress <span className="text-(--color-primary)">Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Track your progress, celebrate achievements, and see how far you've
            come!
          </p>
        </div>

        {/* Overall Progress */}
        <div className="bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-blue-100 text-sm mb-1">Current Rank</p>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <EmojiIcon emoji={rank.emoji} className="w-8 h-8" /> {rank.name}
              </h2>
              <p className="text-blue-100 mt-2">
                {totalPoints} total points •{" "}
                {streak > 0 ? (
                  <>
                    <EmojiIcon emoji="🔥" className="w-4 h-4 inline-block" />{" "}
                    {streak} day streak
                  </>
                ) : (
                  "Start your streak!"
                )}
              </p>
            </div>
            <div className="flex items-center gap-8">
              <ProgressRing progress={overallProgress} color="#FFFFFF" />
              <div className="text-center">
                <p className="text-3xl font-bold">{overallProgress}%</p>
                <p className="text-blue-100 text-sm">Overall Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="📚"
            value={achievementStats.lessonsCompleted?.length || 0}
            label="Lessons Done"
            color="blue"
            subtext={`of ${LESSONS.length}`}
          />
          <StatCard
            icon="⚡"
            value={completedChallenges.length}
            label="Challenges"
            color="purple"
            subtext={`of ${challenges.length}`}
          />
          <StatCard
            icon="🏆"
            value={unlockedAchievements.length}
            label="Achievements"
            color="yellow"
            subtext={`of ${Object.keys(achievements).length}`}
          />
          <StatCard
            icon="⏱️"
            value={formatTime(sessionTime)}
            label="This Session"
            color="green"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <LessonProgress
              completedLessons={achievementStats.lessonsCompleted || []}
            />
            <ActivityCalendar
              activities={[achievementStats.lastVisitDate].filter(Boolean)}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <ChallengeStats
              stats={challengeStats}
              challenges={challenges}
              completedChallenges={completedChallenges}
            />
            <AchievementPreview
              achievements={achievements}
              unlockedIds={unlockedAchievements}
            />

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
                <EmojiIcon
                  emoji="🚀"
                  className="w-5 h-5 inline-block align-text-bottom"
                />{" "}
                Continue Learning
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Link
                  to="/lessons"
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <span className="text-2xl flex justify-center">
                    <EmojiIcon emoji="📖" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-1">
                    Lessons
                  </p>
                </Link>
                <Link
                  to="/challenges"
                  className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                  <span className="text-2xl flex justify-center">
                    <EmojiIcon emoji="⚡" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mt-1">
                    Challenges
                  </p>
                </Link>
                <Link
                  to="/showcase"
                  className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  <span className="text-2xl flex justify-center">
                    <EmojiIcon emoji="🎨" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mt-1">
                    Showcase
                  </p>
                </Link>
                <Link
                  to="/achievements"
                  className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                >
                  <span className="text-2xl flex justify-center">
                    <EmojiIcon emoji="🏆" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mt-1">
                    Achievements
                  </p>
                </Link>
                <Link
                  to="/components"
                  className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-center hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
                >
                  <span className="text-2xl flex justify-center">
                    <EmojiIcon emoji="🧩" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-medium text-teal-700 dark:text-teal-300 mt-1">
                    Playground
                  </p>
                </Link>
                <Link
                  to="/dashboard/telemetry"
                  className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <span className="text-2xl flex justify-center">
                    <EmojiIcon emoji="🤖" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mt-1">
                    Telemetry
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Motivation Section */}
        <div className="mt-8 bg-linear-to-r from-green-400 to-cyan-500 rounded-xl shadow-lg p-6 text-white text-center">
          <p className="text-lg font-medium">
            {overallProgress < 25 && (
              <>
                <EmojiIcon emoji="🚀" className="w-5 h-5 inline-block" /> You're
                just getting started! Every expert was once a beginner.
              </>
            )}
            {overallProgress >= 25 && overallProgress < 50 && (
              <>
                <EmojiIcon emoji="💪" className="w-5 h-5 inline-block" /> Great
                progress! You're building momentum.
              </>
            )}
            {overallProgress >= 50 && overallProgress < 75 && (
              <>
                <EmojiIcon emoji="🔥" className="w-5 h-5 inline-block" />{" "}
                Halfway there! Keep up the amazing work!
              </>
            )}
            {overallProgress >= 75 && overallProgress < 100 && (
              <>
                <EmojiIcon emoji="⭐" className="w-5 h-5 inline-block" /> Almost
                there! The finish line is in sight!
              </>
            )}
            {overallProgress >= 100 && (
              <>
                <EmojiIcon emoji="🎉" className="w-5 h-5 inline-block" />{" "}
                Incredible! You've mastered everything! Consider becoming a
                mentor!
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
