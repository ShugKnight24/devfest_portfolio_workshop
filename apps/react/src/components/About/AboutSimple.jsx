// ============================================
// VERSION 1: SIMPLE ABOUT (Beginner-Friendly)
// ============================================
/**
 * ABOUT VERSION 1: Simple & Clean
 *
 * Difficulty: Beginner
 *
 * Features:
 * - Centered text layout
 * - Simple typography
 * - Clean and minimal design
 *
 * Perfect for: First-time React users learning basic component structure
 */

export const AboutSimple = ({ bio }) => {
  return (
    <section className="section-container bg-(--color-background) dark:bg-(--color-dark) transition-colors duration-300">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="section-title text-(--color-primary)">About Me</h2>
        <p className="text-lg text-(--color-text) dark:text-(--color-textDark) leading-relaxed">
          {bio}
        </p>
      </div>
    </section>
  );
};
