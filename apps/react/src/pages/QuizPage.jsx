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
      return { level: "Newcomer", icon: "seedling", color: "text-gray-400" };
    if (accuracy >= 90)
      return { level: "React Master", icon: "trophy", color: "text-yellow-400" };
    if (accuracy >= 75)
      return {
        level: "Skilled Developer",
        icon: "star",
        color: "text-blue-400",
      };
    if (accuracy >= 60)
      return { level: "Learning Fast", icon: "books", color: "text-green-400" };
    return { level: "Getting Started", icon: "target", color: "text-purple-400" };
  };

  const mastery = getMasteryLevel();

  return (
    <div className="min-h-screen bg-(--color-background) dark:bg-(--color-dark) text-(--color-text) dark:text-(--color-text-dark) transition-colors duration-300">
      {/* Header */}
      <div className="bg-(--color-surface)/80 dark:bg-(--color-surface-dark)/80 backdrop-blur-sm border-b border-(--color-border) dark:border-(--color-border-dark) sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="p-2 hover:bg-(--color-surface-hover) dark:hover:bg-(--color-surface-hover-dark) rounded-lg transition-colors"
              >
                <LeftArrow className="w-5 h-5 text-(--color-muted-text) dark:text-(--color-muted-text-dark)" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-(--color-text) dark:text-(--color-text-dark) flex items-center gap-2">
                  <EmojiIcon
                    name="brain"
                    className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  />
                  <span>Knowledge Quiz</span>
                </h1>
                <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">Test your React skills</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("overview")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  view === "overview"
                    ? "bg-purple-600 text-white"
                    : "bg-(--color-surface-hover) dark:bg-(--color-surface-dark) text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setView("leaderboard")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  view === "leaderboard"
                    ? "bg-purple-600 text-white"
                    : "bg-(--color-surface-hover) dark:bg-(--color-surface-dark) text-(--color-muted-text) dark:text-(--color-muted-text-dark) hover:text-(--color-text) dark:hover:text-(--color-text-dark)"
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
                <span className="text-4xl text-yellow-300">
                  <EmojiIcon name={mastery.icon} className="w-10 h-10" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold">{mastery.level}</h2>
                  <p className="text-white/90 font-medium">Keep learning to level up!</p>
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
              <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6 text-center">
                <p className="text-3xl font-bold text-(--color-primary)">
                  {quizStats.totalQuestions}
                </p>
                <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) mt-1">
                  Questions Attempted
                </p>
              </div>
              <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6 text-center">
                <p className="text-3xl font-bold text-emerald-500">
                  {quizStats.correctAnswers}
                </p>
                <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) mt-1">Correct Answers</p>
              </div>
              <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6 text-center">
                <p className="text-3xl font-bold text-amber-500">
                  {quizStats.pointsEarned}
                </p>
                <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) mt-1">Points Earned</p>
              </div>
              <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6 text-center">
                <p className="text-3xl font-bold text-(--color-accent,theme(colors.blue.500))">
                  {getAccuracy()}%
                </p>
                <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark) mt-1">Accuracy Rate</p>
              </div>
            </div>

            {/* Topic Breakdown */}
            <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-(--color-text) dark:text-(--color-text-dark) mb-4">
                Topic Progress
              </h3>
              <div className="space-y-4">
                {topicProgress.map(
                  ({ topic, total, answered, correct, percentage }) => (
                    <div
                      key={topic}
                      className="p-4 bg-(--color-border)/20 dark:bg-(--color-border-dark)/30 rounded-lg border border-(--color-border)/40 dark:border-(--color-border-dark)/40"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-(--color-text) dark:text-(--color-text-dark) capitalize">
                          {topic}
                        </h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                            {answered}/{total}
                          </span>
                          {answered > 0 && (
                            <span
                              className={`font-medium ${
                                correct / answered >= 0.8
                                  ? "text-emerald-500"
                                  : correct / answered >= 0.6
                                    ? "text-amber-500"
                                    : "text-rose-500"
                              }`}
                            >
                              {Math.round((correct / answered) * 100)}% correct
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-(--color-border)/30 dark:bg-(--color-border-dark)/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-(--color-primary) to-(--color-secondary,var(--color-accent)) transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-(--color-text) dark:text-(--color-text-dark) mb-4 flex items-center gap-2">
                <EmojiIcon
                  name="lightbulb"
                  className="w-5 h-5 text-amber-500"
                />
                <span>Learning Tips</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-(--color-border)/20 dark:bg-(--color-border-dark)/30 border border-(--color-border)/30 dark:border-(--color-border-dark)/30 rounded-lg">
                  <div className="p-2 bg-(--color-primary)/10 text-(--color-primary) rounded-lg">
                    <Checkmark className="w-5 h-5 text-(--color-primary)" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-(--color-text) dark:text-(--color-text-dark)">
                      Review Explanations
                    </h4>
                    <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                      Read through each explanation to understand the concepts
                      better.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-(--color-border)/20 dark:bg-(--color-border-dark)/30 border border-(--color-border)/30 dark:border-(--color-border-dark)/30 rounded-lg">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <Checkmark className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-(--color-text) dark:text-(--color-text-dark)">
                      Practice Code
                    </h4>
                    <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                      Try writing the code examples yourself in the Playground.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-(--color-border)/20 dark:bg-(--color-border-dark)/30 border border-(--color-border)/30 dark:border-(--color-border-dark)/30 rounded-lg">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                    <Checkmark className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-(--color-text) dark:text-(--color-text-dark)">
                      Take Challenges
                    </h4>
                    <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
                      Complete coding challenges to apply what you've learned.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-(--color-border)/20 dark:bg-(--color-border-dark)/30 border border-(--color-border)/30 dark:border-(--color-border-dark)/30 rounded-lg">
                  <div className="p-2 bg-(--color-accent,theme(colors.blue.500))/10 text-(--color-accent,theme(colors.blue.500)) rounded-lg">
                    <Checkmark className="w-5 h-5 text-(--color-accent,theme(colors.blue.500))" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-(--color-text) dark:text-(--color-text-dark)">
                      Build Projects
                    </h4>
                    <p className="text-sm text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
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
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-4">Ready for more?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/challenges"
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon name="lightning" className="w-4 h-4" /> Take a Challenge
            </Link>
            <Link
              to="/lessons"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon name="books" className="w-4 h-4" /> View Lessons
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium transition-colors shadow-lg inline-flex items-center gap-1.5"
            >
              <EmojiIcon name="chartBar" className="w-4 h-4" /> View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
