import { ChallengeModePanel } from "../components/ChallengeMode";
import { EmojiIcon } from "../components/Icons/EmojiIcon";

/**
 * Challenges Page
 *
 * A dedicated page for timed coding challenges.
 */

export const ChallengesPage = () => {
  return (
    <div className="min-h-screen bg-(--color-background) dark:bg-(--color-dark) text-(--color-text) dark:text-(--color-text-dark) py-24 transition-colors duration-300">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 rounded-full text-sm font-medium mb-6">
            <span>
              <EmojiIcon name="lightning" className="w-5 h-5 text-yellow-500" />
            </span>
            <span>Challenge Mode</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-(--color-text) dark:text-(--color-text-dark) mb-4">
            Coding <span className="text-(--color-primary)">Challenges</span>
          </h1>
          <p className="text-xl text-(--color-muted-text) dark:text-(--color-muted-text-dark) max-w-2xl mx-auto">
            Test your React skills with timed challenges. Earn points, unlock
            hints, and level up!
          </p>
        </div>

        {/* How it works */}
        <div className="bg-(--color-surface) dark:bg-(--color-surface-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-xl shadow-lg p-6 mb-12">
          <h2 className="text-lg font-bold text-(--color-text) dark:text-(--color-text-dark) mb-4 flex items-center gap-2">
            <EmojiIcon
              name="gamepad"
              className="w-5 h-5 text-purple-500"
            />
            <span>How it Works</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className="mb-2 flex justify-center text-(--color-primary)">
                <EmojiIcon name="numOne" className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-(--color-text) dark:text-(--color-text-dark)">
                Pick a challenge based on difficulty
              </p>
            </div>
            <div className="p-4">
              <div className="mb-2 flex justify-center text-(--color-primary)">
                <EmojiIcon name="numTwo" className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-(--color-text) dark:text-(--color-text-dark)">
                Race against the timer to complete it
              </p>
            </div>
            <div className="p-4">
              <div className="mb-2 flex justify-center text-(--color-primary)">
                <EmojiIcon name="numThree" className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-(--color-text) dark:text-(--color-text-dark)">
                Use hints if stuck (-5 pts each)
              </p>
            </div>
            <div className="p-4">
              <div className="mb-2 flex justify-center text-(--color-primary)">
                <EmojiIcon name="numFour" className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-(--color-text) dark:text-(--color-text-dark)">
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
