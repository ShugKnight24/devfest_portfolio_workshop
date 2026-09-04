import { useEffect } from "react";
import { Troubleshooting } from "../components/Troubleshooting";
import { EmojiIcon } from "../components/Icons/EmojiIcon";
import { useAchievements } from "../components/Achievements";

/**
 * Troubleshooting Page
 *
 * A dedicated page for common issues and their solutions.
 */

export const TroubleshootingPage = () => {
  const { trackAction } = useAchievements();

  // Track visiting this page for achievement
  useEffect(() => {
    trackAction("visit_help");
  }, [trackAction]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-24">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-sm font-bold border border-amber-300 dark:border-amber-800 mb-6">
            <span>
              <EmojiIcon name="wrench" className="w-4 h-4" />
            </span>
            <span>Help & Support</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-950 dark:text-white mb-4">
            Troubleshooting{" "}
            <span className="text-(--color-primary)">Guide</span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-200 font-medium max-w-2xl mx-auto">
            Stuck on something? Don't worry, we've got you covered. Find
            solutions to common issues below.
          </p>
        </div>

        {/* Troubleshooting Component */}
        <Troubleshooting />
      </div>
    </div>
  );
};

export default TroubleshootingPage;
