export const User = ({ className = "w-5 h-5", color = "currentColor" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke={color}
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
