export const Download = ({ className = "w-5 h-5", color = "currentColor" }) => (
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
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);
