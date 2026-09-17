import { InstructionSteps } from "./Instructions/InstructionSteps";
import { SpeakingEventsHub } from "./SpeakingEventsHub";
import { EmojiIcon } from "@portfolio/icons/react";

export const StarterInstructions = () => (
  <div className="section-container max-w-7xl mx-auto px-4 py-8">
    {/* Speaking Events & Conference Hub */}
    <SpeakingEventsHub />

    {/* Hero Workshop Introduction */}
    <div className="text-center py-10 my-8 rounded-3xl bg-(--color-surface) dark:bg-transparent dark:bg-gradient-to-b dark:from-blue-900/10 dark:via-gray-900/40 dark:to-transparent border border-(--color-border) dark:border-(--color-border-dark) p-8">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-(--color-primary) text-xs font-mono font-bold uppercase tracking-wider mb-4">
        <EmojiIcon name="shield" className="w-4 h-4" />
        Pull the Cord. Bring Backup. • Workshop Guide
      </div>
      <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
        From Audience of One to Sovereign Software
      </h1>
      <p className="text-lg md:text-xl text-gray-600 dark:text-(--color-text) dark:text-(--color-text-dark) mb-6 max-w-3xl mx-auto leading-relaxed">
        Intellect like Sherlock Holmes. Strength of 3 men. Execution speed like Reze.
        Choose your track below to build personal software solutions that eliminate your own friction and empower others.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-(--color-muted-text) dark:text-(--color-muted-text-dark)">
        <span className="flex items-center gap-1.5">
          <EmojiIcon name="search" className="w-3.5 h-3.5 text-(--color-primary)" />
          Sherlockian Root-Cause Deduction
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <EmojiIcon name="lightning" className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
          Overwhelming AI Leverage
        </span>
        <span>•</span>
        <span className="flex items-center gap-1.5">
          <EmojiIcon name="rocket" className="w-3.5 h-3.5 text-purple-800 dark:text-purple-400" />
          Zero-Bloat Deployment
        </span>
      </div>
    </div>

    {/* Multi-Track Onboarding Steps */}
    <InstructionSteps />
  </div>
);

export default StarterInstructions;
