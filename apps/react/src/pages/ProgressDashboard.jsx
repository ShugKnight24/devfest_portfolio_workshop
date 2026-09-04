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
  <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6 text-center">
    <div className={`mb-2 text-${color}-500 flex justify-center`}>
      <EmojiIcon name={icon} emoji={icon} className="w-10 h-10" />
    </div>
    <p className={`text-3xl font-bold text-${color}-500`}>{value}</p>
    <p className="text-sm font-medium text-(--color-text) dark:text-(--color-text-dark)">{label}</p>
    {subtext && <p className="text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark) mt-1">{subtext}</p>}
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
    if (count === 0) return "bg-(--color-surface-hover) dark:bg-(--color-surface-dark)/60";
    if (count === 1) return "bg-green-200 dark:bg-green-900";
    if (count <= 3) return "bg-green-400 dark:bg-green-700";
    return "bg-green-600 dark:bg-green-500";
  };

  return (
    <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
      <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark) mb-4 flex items-center gap-2">
        <EmojiIcon
          name="calendar"
          className="w-5 h-5 text-blue-500"
        />
        <span>Activity</span>
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
      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
        <span>Less</span>
        <div className="w-3 h-3 rounded-sm bg-(--color-surface-hover) dark:bg-(--color-surface-dark)/60" />
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
    <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
          <EmojiIcon
            name="books"
            className="w-5 h-5 text-blue-500"
          />
          <span>Lessons</span>
        </h3>
        <span className="text-sm font-medium text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
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
              className="flex items-center justify-between p-3 rounded-lg hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) transition-colors"
            >
              <span
                className={`text-sm ${
                  isCompleted
                    ? "text-green-600 dark:text-green-400 font-medium"
                    : "text-(--color-text) dark:text-(--color-text-dark)"
                }`}
              >
                {lesson.title}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isCompleted
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium"
                    : "bg-(--color-surface-hover) dark:bg-(--color-surface-hover-dark) text-(--color-muted-text) dark:text-(--color-muted-text-dark)"
                }`}
              >
                {isCompleted ? "Done" : "Pending"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Achievement preview
const AchievementPreview = ({ achievements = {}, unlockedIds = [] }) => {
  const recentUnlocked = Object.values(achievements)
    .filter((a) => unlockedIds.includes(a.id))
    .slice(0, 6);

  return (
    <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
          <EmojiIcon
            name="trophy"
            className="w-5 h-5 text-yellow-500"
          />
          <span>Achievements</span>
        </h3>
        <Link
          to="/achievements"
          className="text-sm font-semibold text-blue-500 hover:text-blue-400"
        >
          View all →
        </Link>
      </div>
      {recentUnlocked.length > 0 ? (
        <div className="grid grid-cols-6 gap-2">
          {recentUnlocked.map((achievement) => (
            <div
              key={achievement.id}
              className="aspect-square rounded-xl bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
              title={achievement.title}
            >
              <EmojiIcon name={achievement.icon} emoji={achievement.icon} className="w-6 h-6 text-white" />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-(--color-muted-text) dark:text-(--color-muted-text-dark) text-sm text-center py-4">
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
    <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
          <EmojiIcon
            name="lightning"
            className="w-5 h-5 text-yellow-500"
          />
          <span>Challenges</span>
        </h3>
        <Link
          to="/challenges"
          className="text-sm font-semibold text-blue-500 hover:text-blue-400"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-purple-500">{completedCount}</p>
          <p className="text-xs font-semibold text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-500">
            {stats.totalPoints}
          </p>
          <p className="text-xs font-semibold text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Points</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-500">
            {Math.round((completedCount / totalCount) * 100) || 0}%
          </p>
          <p className="text-xs font-semibold text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Complete</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-4 h-2 bg-(--color-border) dark:bg-(--color-border-dark) rounded-full overflow-hidden">
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
      return { name: "Grand Master", icon: "crown", color: "purple" };
    if (points >= 300) return { name: "Expert", icon: "fire", color: "red" };
    if (points >= 200)
      return { name: "Advanced", icon: "star", color: "orange" };
    if (points >= 100)
      return { name: "Intermediate", icon: "sparkle", color: "yellow" };
    if (points >= 50) return { name: "Beginner", icon: "seedling", color: "green" };
    return { name: "Newcomer", icon: "egg", color: "gray" };
  };

  const totalPoints = getTotalPoints() + challengeStats.totalPoints;
  const rank = getRank(totalPoints);
  const streak = calculateStreak(achievementStats);

  return (
    <div className="min-h-screen bg-(--color-background) dark:bg-(--color-dark) text-(--color-text) dark:text-(--color-text-dark) py-24 transition-colors duration-300">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 rounded-full text-sm font-medium mb-6">
            <span>
              <EmojiIcon
                name="chartBar"
                className="w-5 h-5 text-blue-600 dark:text-blue-400 inline-block align-text-bottom"
              />
            </span>
            <span>Your Learning Journey</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-(--color-text) dark:text-(--color-text-dark) mb-4">
            Progress <span className="text-(--color-primary)">Dashboard</span>
          </h1>
          <p className="text-xl text-(--color-muted-text) dark:text-(--color-muted-text-dark) max-w-2xl mx-auto">
            Track your progress, celebrate achievements, and see how far you've
            come!
          </p>
        </div>

        {/* Overall Progress */}
        <div className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-blue-100 text-sm mb-1 font-medium">Current Rank</p>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <EmojiIcon name={rank.icon} className="w-8 h-8 text-yellow-300" /> {rank.name}
              </h2>
              <p className="text-blue-100 mt-2 font-medium">
                {totalPoints} total points •{" "}
                {streak > 0 ? (
                  <>
                    <EmojiIcon name="fire" className="w-4 h-4 inline-block text-orange-300" />{" "}
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
                <p className="text-blue-100 text-sm font-medium">Overall Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="books"
            value={achievementStats.lessonsCompleted?.length || 0}
            label="Lessons Done"
            color="blue"
            subtext={`of ${LESSONS.length}`}
          />
          <StatCard
            icon="lightning"
            value={completedChallenges.length}
            label="Challenges"
            color="purple"
            subtext={`of ${challenges.length}`}
          />
          <StatCard
            icon="trophy"
            value={unlockedAchievements.length}
            label="Achievements"
            color="yellow"
            subtext={`of ${Object.keys(achievements).length}`}
          />
          <StatCard
            icon="timer"
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
            <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-(--color-text) dark:text-(--color-text-dark) mb-4 flex items-center gap-2">
                <EmojiIcon
                  name="rocket"
                  className="w-5 h-5 text-blue-500"
                />
                <span>Continue Learning</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Link
                  to="/lessons"
                  className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-lg text-center hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                >
                  <span className="flex justify-center text-blue-600 dark:text-blue-400">
                    <EmojiIcon name="book" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mt-1">
                    Lessons
                  </p>
                </Link>
                <Link
                  to="/challenges"
                  className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 rounded-lg text-center hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                >
                  <span className="flex justify-center text-purple-600 dark:text-purple-400">
                    <EmojiIcon name="lightning" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mt-1">
                    Challenges
                  </p>
                </Link>
                <Link
                  to="/showcase"
                  className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/50 rounded-lg text-center hover:bg-green-100 dark:hover:bg-green-900/60 transition-colors"
                >
                  <span className="flex justify-center text-green-600 dark:text-green-400">
                    <EmojiIcon name="palette" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-200 mt-1">
                    Showcase
                  </p>
                </Link>
                <Link
                  to="/achievements"
                  className="p-4 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-100 dark:border-yellow-900/50 rounded-lg text-center hover:bg-yellow-100 dark:hover:bg-yellow-900/60 transition-colors"
                >
                  <span className="flex justify-center text-yellow-600 dark:text-yellow-400">
                    <EmojiIcon name="trophy" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mt-1">
                    Achievements
                  </p>
                </Link>
                <Link
                  to="/components"
                  className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50 rounded-lg text-center hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors"
                >
                  <span className="flex justify-center text-teal-600 dark:text-teal-400">
                    <EmojiIcon name="puzzle" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-semibold text-teal-900 dark:text-teal-200 mt-1">
                    Playground
                  </p>
                </Link>
                <Link
                  to="/dashboard/telemetry"
                  className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-lg text-center hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                >
                  <span className="flex justify-center text-red-600 dark:text-red-400">
                    <EmojiIcon name="robot" className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-semibold text-red-900 dark:text-red-200 mt-1">
                    Telemetry
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Motivation Section */}
        <div className="mt-8 bg-linear-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 text-white text-center">
          <p className="text-lg font-semibold flex items-center justify-center gap-2">
            {overallProgress < 25 && (
              <>
                <EmojiIcon name="rocket" className="w-5 h-5 text-yellow-300" />
                <span>You're just getting started! Every expert was once a beginner.</span>
              </>
            )}
            {overallProgress >= 25 && overallProgress < 50 && (
              <>
                <EmojiIcon name="muscle" className="w-5 h-5 text-yellow-300" />
                <span>Great progress! You're building momentum.</span>
              </>
            )}
            {overallProgress >= 50 && overallProgress < 75 && (
              <>
                <EmojiIcon name="fire" className="w-5 h-5 text-amber-300" />
                <span>Halfway there! Keep up the amazing work!</span>
              </>
            )}
            {overallProgress >= 75 && overallProgress < 100 && (
              <>
                <EmojiIcon name="star" className="w-5 h-5 text-yellow-300" />
                <span>Almost there! The finish line is in sight!</span>
              </>
            )}
            {overallProgress >= 100 && (
              <>
                <EmojiIcon name="party" className="w-5 h-5 text-yellow-300" />
                <span>Incredible! You've mastered everything! Consider becoming a mentor!</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
