import { useState } from "react";
import { Link } from "react-router-dom";
import { QuizPanel, useQuiz } from "../components/QuizSystem";
import { LeftArrow, Checkmark } from "../components/Icons";
import { useAchievements } from "../components/Achievements";
import { EmojiIcon } from "../components/Icons/EmojiIcon";
import { useEffect } from "react";

/**
 * Quiz Page
 *
 * A dedicated page for taking interactive quizzes to test React knowledge.
 * Features topic-based quizzes with multiple question types.
 */

const QuizPage = () => {
  const { quizStats, getAccuracy, questions, quizHistory } = useQuiz();
  const { trackAction } = useAchievements();
  const [view, setView] = useState("overview"); // overview | leaderboard

  // Track page visit
  useEffect(() => {
    trackAction("page_visit", { page: "quiz" });
  }, []);

  // Calculate total questions across all topics
  const totalQuestions = Object.values(questions).flat().length;
  const answeredQuestions = new Set(quizHistory.map((h) => h.questionId)).size;

  // Calculate topic progress
  const topicProgress = Object.entries(questions).map(
    ([topic, topicQuestions]) => {
      const answered = topicQuestions.filter((q) =>
        quizHistory.some((h) => h.questionId === q.id),
      ).length;
      const correct = topicQuestions.filter((q) =>
        quizHistory.some((h) => h.questionId === q.id && h.isCorrect),
      ).length;
      return {
        topic,
        total: topicQuestions.length,
        answered,
        correct,
        percentage: Math.round((answered / topicQuestions.length) * 100),
      };
    },
  );

  // Determine mastery level
  const getMasteryLevel = () => {
    const accuracy = getAccuracy();
    if (answeredQuestions < 5)
      return { level: "Newcomer", emoji: "🌱", color: "text-gray-500" };
    if (accuracy >= 90)
      return { level: "React Master", emoji: "🏆", color: "text-yellow-500" };
    if (accuracy >= 75)
      return {
        level: "Skilled Developer",
        emoji: "⭐",
        color: "text-blue-500",
      };
    if (accuracy >= 60)
      return { level: "Learning Fast", emoji: "📚", color: "text-green-500" };
    return { level: "Getting Started", emoji: "🎯", color: "text-purple-500" };
  };

  const mastery = getMasteryLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LeftArrow className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  <EmojiIcon
                    emoji="🧠"
                    className="w-6 h-6 inline-block align-text-bottom"
                  />{" "}
                  Knowledge Quiz
                </h1>
                <p className="text-sm text-gray-500">Test your React skills</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("overview")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === "overview"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setView("leaderboard")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  view === "leaderboard"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Mastery Banner */}
        <div className="mb-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">
                  <EmojiIcon emoji={mastery.emoji} className="w-10 h-10" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold">{mastery.level}</h2>
                  <p className="text-white/80">Keep learning to level up!</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{getAccuracy()}%</p>
              <p className="text-white/80">Accuracy</p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-white/80 mb-1">
              <span>Overall Progress</span>
              <span>
                {answeredQuestions}/{totalQuestions} questions
              </span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{
                  width: `${(answeredQuestions / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {view === "overview" ? (
          <QuizPanel />
        ) : (
          /* Progress View */
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                <p className="text-3xl font-bold text-purple-500">
                  {quizStats.totalQuestions}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Questions Attempted
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                <p className="text-3xl font-bold text-green-500">
                  {quizStats.correctAnswers}
                </p>
                <p className="text-sm text-gray-500 mt-1">Correct Answers</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                <p className="text-3xl font-bold text-yellow-500">
                  {quizStats.pointsEarned}
                </p>
                <p className="text-sm text-gray-500 mt-1">Points Earned</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                <p className="text-3xl font-bold text-blue-500">
                  {getAccuracy()}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Accuracy Rate</p>
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Topic Progress
              </h3>
              <div className="space-y-4">
                {topicProgress.map(
                  ({ topic, total, answered, correct, percentage }) => (
                    <div
                      key={topic}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {topic}
                        </h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            {answered}/{total}
                          </span>
                          {answered > 0 && (
                            <span
                              className={`font-medium ${
                                correct / answered >= 0.8
                                  ? "text-green-500"
                                  : correct / answered >= 0.6
                                    ? "text-yellow-500"
                                    : "text-red-500"
                              }`}
                            >
                              {Math.round((correct / answered) * 100)}% correct
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                <EmojiIcon
                  emoji="💡"
                  className="w-5 h-5 inline-block align-text-bottom"
                />{" "}
                Learning Tips
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Checkmark className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Review Explanations
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Read through each explanation to understand the concepts
                      better.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Checkmark className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Practice Code
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Try writing the code examples yourself in the Playground.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Checkmark className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Take Challenges
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Complete coding challenges to apply what you've learned.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Checkmark className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      Build Projects
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Apply your knowledge by building your portfolio.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">Ready for more?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/challenges"
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon emoji="⚡" className="w-4 h-4" /> Take a Challenge
            </Link>
            <Link
              to="/lessons"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon emoji="📚" className="w-4 h-4" /> View Lessons
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon emoji="📊" className="w-4 h-4" /> View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
