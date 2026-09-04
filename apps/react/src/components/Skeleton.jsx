/**
 * Skeleton Loading Components
 *
 * Placeholder loading states for various content types.
 * Use these while data is being fetched to improve perceived performance.
 *
 * Usage:
 * <Skeleton.Card />
 * <Skeleton.Text lines={3} />
 * <Skeleton.Avatar size="lg" />
 */

// Base skeleton pulse animation
const SkeletonPulse = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-size-[200%_100%] rounded ${className}`}
    style={{ animation: "shimmer 1.5s infinite" }}
  />
);

// Text skeleton
const SkeletonText = ({ lines = 3, className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonPulse
        key={i}
        className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
      />
    ))}
  </div>
);

// Avatar skeleton
const SkeletonAvatar = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <SkeletonPulse className={`${sizes[size]} rounded-full ${className}`} />
  );
};

// Card skeleton
const SkeletonCard = ({ className = "" }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg ${className}`}
  >
    <SkeletonPulse className="h-48 w-full mb-4 rounded-lg" />
    <SkeletonPulse className="h-6 w-3/4 mb-3" />
    <SkeletonText lines={2} />
    <div className="flex gap-2 mt-4">
      <SkeletonPulse className="h-8 w-20 rounded-full" />
      <SkeletonPulse className="h-8 w-20 rounded-full" />
      <SkeletonPulse className="h-8 w-20 rounded-full" />
    </div>
  </div>
);

// Project card skeleton
const SkeletonProjectCard = ({ className = "" }) => (
  <div
    className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg ${className}`}
  >
    <SkeletonPulse className="h-48 w-full" />
    <div className="p-6">
      <SkeletonPulse className="h-6 w-2/3 mb-3" />
      <SkeletonText lines={2} />
      <div className="flex gap-2 mt-4">
        <SkeletonPulse className="h-6 w-16 rounded-full" />
        <SkeletonPulse className="h-6 w-16 rounded-full" />
        <SkeletonPulse className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-3 mt-4">
        <SkeletonPulse className="h-10 flex-1 rounded-lg" />
        <SkeletonPulse className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  </div>
);

// Header skeleton
const SkeletonHeader = ({ className = "" }) => (
  <div className={`text-center py-20 ${className}`}>
    <SkeletonAvatar size="xl" className="mx-auto mb-6" />
    <SkeletonPulse className="h-10 w-64 mx-auto mb-4" />
    <SkeletonPulse className="h-6 w-48 mx-auto mb-6" />
    <div className="flex justify-center gap-4">
      <SkeletonPulse className="h-10 w-10 rounded-full" />
      <SkeletonPulse className="h-10 w-10 rounded-full" />
      <SkeletonPulse className="h-10 w-10 rounded-full" />
    </div>
  </div>
);

// Skills section skeleton
const SkeletonSkills = ({ count = 8, className = "" }) => (
  <div className={`${className}`}>
    <SkeletonPulse className="h-8 w-32 mx-auto mb-8" />
    <div className="flex flex-wrap justify-center gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className="h-10 rounded-full"
          style={{ width: `${80 + Math.random() * 60}px` }}
        />
      ))}
    </div>
  </div>
);

// Table row skeleton
const SkeletonTableRow = ({ columns = 4, className = "" }) => (
  <div className={`flex items-center gap-4 p-4 ${className}`}>
    {Array.from({ length: columns }).map((_, i) => (
      <SkeletonPulse key={i} className="h-4 flex-1" />
    ))}
  </div>
);

// GitHub repo skeleton
const SkeletonGitHubRepo = ({ className = "" }) => (
  <div
    className={`p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 ${className}`}
  >
    <div className="flex items-start justify-between mb-3">
      <SkeletonPulse className="h-5 w-32" />
      <SkeletonPulse className="h-4 w-12" />
    </div>
    <SkeletonText lines={2} className="mb-4" />
    <div className="flex items-center gap-4">
      <SkeletonPulse className="h-4 w-16" />
      <SkeletonPulse className="h-4 w-12" />
      <SkeletonPulse className="h-4 w-12" />
    </div>
  </div>
);

// Export all skeletons
export const Skeleton = {
  Pulse: SkeletonPulse,
  Text: SkeletonText,
  Avatar: SkeletonAvatar,
  Card: SkeletonCard,
  ProjectCard: SkeletonProjectCard,
  Header: SkeletonHeader,
  Skills: SkeletonSkills,
  TableRow: SkeletonTableRow,
  GitHubRepo: SkeletonGitHubRepo,
};

// Add shimmer animation to global styles
export const SkeletonStyles = () => (
  <style>{`
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `}</style>
);

export default Skeleton;
