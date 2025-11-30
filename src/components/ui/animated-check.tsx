export function AnimatedCheck({ className = "" }: { className?: string }) {
  return (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24"
      className={`animated-checkmark ${className}`}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M6 12l4 4l8-8"
        className="checkmark-path"
      />
    </svg>
  );
}
