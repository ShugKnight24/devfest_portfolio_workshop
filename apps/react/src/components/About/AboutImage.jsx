// ============================================
// VERSION 2: ABOUT WITH IMAGE (Intermediate)
// ============================================
/**
 * ABOUT VERSION 2: About with Image
 *
 * Difficulty: Intermediate
 *
 * Features:
 * - Image alongside bio text
 * - Two-column layout
 * - Responsive design
 * - Card-style container
 *
 * Perfect for: Learning grid layouts and responsive design
 */

export const AboutImage = ({ avatar, bio }) => {
  return (
    <section className="section-container bg-(--color-background) dark:bg-(--color-dark)">
      <h2 className="section-title text-(--color-primary)">About Me</h2>

      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2 gap-3 items-center p-8">
          {/* Image Side */}
          <div className="flex justify-center">
            <img
              src={
                avatar ||
                "https://placehold.co/400x400/667eea/FFFFFF?text=Your+Photo"
              }
              alt="Profile"
              className="w-64 h-64 rounded-2xl shadow-md object-cover"
            />
          </div>

          {/* Text Side */}
          <div>
            <p className="text-lg text-(--color-text) dark:text-(--color-textDark) leading-relaxed">
              {bio}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
