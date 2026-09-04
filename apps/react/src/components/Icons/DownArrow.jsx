export const DownArrow = ({
  className = "w-6 h-6 text-white/50",
  color = "currentColor",
}) => (
  <svg className={className} fill="none" stroke={color} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 14l-7 7m0 0l-7-7m7 7V3"
    />
  </svg>
);
