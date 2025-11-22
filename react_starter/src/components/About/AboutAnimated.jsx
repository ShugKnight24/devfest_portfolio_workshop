// ============================================
// VERSION 4: ANIMATED ABOUT WITH TIMELINE
// ============================================

/**
 * ABOUT VERSION 4: Animated About with Timeline
 *
 * Difficulty: Advanced
 *
 * Features:
 * - Animated entrance
 * - Image with decorative elements
 * - Timeline/journey section
 * - Highlights/achievements
 * - Rich visual design
 *
 * Perfect for: Advanced styling and storytelling through design
 */

export const AboutAnimated = ({ avatar, aboutImage, bio }) => {
  const journey = [
    {
      year: "2015",
      title: "Started Coding Journey",
      description:
        "Fell in love with development thanks to a coworker that taught me basics through code katas",
    },
    {
      year: "2016",
      title: "First Professional Role",
      description: "Joined as a junior developer",
    },
    {
      year: "2016",
      title: "First Professional Role",
      description:
        "Joined as an intern at GTB and got the full time job after 3 months",
    },
    {
      year: "2016",
      title: "Working at Lovebook",
      description:
        "Joined as a software developer / engineer and worked there till 2020 in various capacities",
    },
    {
      year: "2021",
      title: "JavaScript / React / React Native Consultant",
      description:
        "Levi's Mobile App, internal tools, and greenfield 3D configurator at Vectorform",
    },
    {
      year: "2025",
      title: "Volunteer",
      description: "MiDevFest website developer",
    },
    {
      year: "2025",
      title: "Present",
      description:
        "Consulting and freelance work in modern web development and other areas",
    },
  ];

  const highlights = [
    { icon: "🎨", text: "Passionate about UI/UX" },
    { icon: "⚡", text: "Performance enthusiast" },
    { icon: "🌱", text: "Continuous learner" },
    { icon: "🤝", text: "Team player" },
  ];

  return (
    <section className="section-container bg-linear-to-b from-(--color-background) to-gray-50 dark:from-(--color-dark) dark:to-gray-900">
      <h2 className="section-title text-(--color-primary)">About Me</h2>

      <div className="max-w-6xl mx-auto">
        {/* Main About Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Image with Decorations */}
          <div className="flex justify-center animate-fade-in">
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -inset-4 bg-linear-to-br from-(--color-primary) via-(--color-secondary) to-(--color-accent) rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-(--color-primary) rounded-full opacity-50 animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-(--color-secondary) rounded-full opacity-50 animate-bounce delay-1000"></div>

              {/* Main Image */}
              <img
                src={
                  aboutImage ||
                  "https://placehold.co/500x500/667eea/FFFFFF?text=Your+Photo"
                }
                alt="Profile"
                className="relative w-80 h-80 rounded-3xl shadow-2xl object-cover border-4 border-white dark:border-gray-800"
              />
            </div>
          </div>

          {/* Bio Content */}
          <div className="animate-slide-up">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-(--color-primary)/10 text-(--color-primary) rounded-full text-sm font-semibold mb-4">
                👋 Hello!
              </span>
              <p className="text-xl text-(--color-text) dark:text-(--color-textDark) leading-relaxed mb-4">
                {bio}
              </p>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <span className="text-2xl">{highlight.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {highlight.text}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <a
              href="#contact"
              className="inline-block px-6 py-3 bg-linear-to-r from-(--color-primary) to-(--color-secondary) text-white rounded-full font-semibold hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
            >
              Let's Connect →
            </a>
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-10 text-(--color-text) dark:text-(--color-textDark)">
            My Journey 🚀
          </h3>

          <div className="grid md:grid-cols-4 gap-6">
            {journey.map((milestone, index) => (
              <div
                key={index}
                className="relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-2"
              >
                {/* Year Badge */}
                <div className="absolute -top-4 left-6 px-4 py-1 bg-linear-to-r from-(--color-primary) to-(--color-secondary) text-white text-sm font-bold rounded-full">
                  {milestone.year}
                </div>

                <div className="mt-4">
                  <h4 className="font-bold text-(--color-text) dark:text-(--color-textDark) mb-2">
                    {milestone.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {milestone.description}
                  </p>
                </div>

                {/* Connector Line (hidden on last item) */}
                {index < journey.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-3 w-6 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
