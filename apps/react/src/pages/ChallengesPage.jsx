import { ChallengeModePanel } from "../components/ChallengeMode";
import { EmojiIcon } from "../components/Icons/EmojiIcon";

/**
 * Challenges Page
 *
 * A dedicated page for timed coding challenges.
 */

export const ChallengesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-24">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-6">
            <span>
              <EmojiIcon emoji="⚡" className="w-5 h-5" />
            </span>
            <span>Challenge Mode</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Coding <span className="text-(--color-primary)">Challenges</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Test your React skills with timed challenges. Earn points, unlock
            hints, and level up!
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-12">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            <EmojiIcon
              emoji="🎮"
              className="w-5 h-5 inline-block align-text-bottom"
            />{" "}
            How it Works
          </h2>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className="mb-2 flex justify-center text-(--color-primary)">
                <EmojiIcon emoji="1️⃣" className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pick a challenge based on difficulty
              </p>
            </div>
            <div className="p-4">
              <div className="mb-2 flex justify-center text-(--color-primary)">
                <EmojiIcon emoji="2️⃣" className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Race against the timer to complete it
              </p>
            </div>
            <div className="p-4">
              <div className="mb-2 flex justify-center text-(--color-primary)">
                <EmojiIcon emoji="3️⃣" className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use hints if stuck (-5 pts each)
              </p>
            </div>
            <div className="p-4">
              <div className="mb-2 flex justify-center text-(--color-primary)">
                <EmojiIcon emoji="4️⃣" className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Earn points and track your progress
              </p>
            </div>
          </div>
        </div>

        {/* Challenge Panel */}
        <ChallengeModePanel />
      </div>
    </div>
  );
};

export default ChallengesPage;
