type InkLandscapeProps = {
  className?: string;
};

export function InkLandscape({ className = "" }: InkLandscapeProps) {
  return (
    <svg
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-52 w-full ${className}`}
      viewBox="0 0 1200 260"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 210c100-48 178-72 260-44 82 28 132 28 222-32 92-62 150-58 232 8 82 66 162 62 244 22 82-40 154-32 242 26v70H0v-50Z"
        fill="#7F1D1D"
        fillOpacity="0.035"
      />
      <path
        d="M70 198c86-46 150-54 220-20 70 34 126 24 194-34 74-62 132-60 204-6 84 62 150 52 226 18 72-32 140-18 214 26"
        stroke="#7F1D1D"
        strokeOpacity="0.09"
        strokeWidth="1"
      />
      <path
        d="M164 166c24-22 58-22 82 0 26-26 68-26 94 0h62"
        stroke="#B08A45"
        strokeOpacity="0.1"
      />
      <path d="M990 166v-34l22 16v18M976 166h56" stroke="#7F1D1D" strokeOpacity="0.08" />
    </svg>
  );
}
