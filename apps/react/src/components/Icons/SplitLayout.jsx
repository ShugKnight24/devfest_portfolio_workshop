export const SplitLayout = ({
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
      d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4m6-16h4a1 1 0 011 1v14a1 1 0 01-1 1h-4m-6-16v16"
    />
  </svg>
);
