export const SingleLayout = ({
  className = "w-4 h-4",
  color = "currentColor",
}) => (
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
      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
    />
  </svg>
);
