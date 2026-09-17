export const SpeakerOff = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    role="img"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5L6 9H3v6h3l5 4V5z"
    />
    <path strokeLinecap="round" d="M16 9.5l5 5M21 9.5l-5 5" />
  </svg>
);

export default SpeakerOff;
