export const ChevronLeft = ({
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
