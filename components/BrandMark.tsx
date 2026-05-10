type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-20 w-20",
  md: "h-36 w-36",
  lg: "h-48 w-48 sm:h-56 sm:w-56"
};

export function BrandMark({ className = "", size = "md" }: BrandMarkProps) {
  return (
    <div className={`relative grid place-items-center ${sizeClass[size]} ${className}`} aria-hidden="true">
      <svg className="h-full w-full" viewBox="0 0 220 220" fill="none">
        <circle cx="110" cy="110" r="103" stroke="#B08A45" strokeOpacity="0.34" strokeWidth="1.4" />
        <circle cx="110" cy="110" r="86" stroke="#7F1D1D" strokeOpacity="0.16" strokeWidth="1" />
        <circle cx="110" cy="110" r="68" stroke="#B08A45" strokeOpacity="0.22" strokeWidth="1" />
        <path
          d="M110 42a68 68 0 0 1 0 136c18-14 26-36 16-55-10-18-32-26-54-13 0-38 15-68 38-68Z"
          stroke="#7F1D1D"
          strokeOpacity="0.26"
          strokeWidth="1.2"
        />
        <path
          d="M110 178a68 68 0 0 1 0-136c-18 14-26 36-16 55 10 18 32 26 54 13 0 38-15 68-38 68Z"
          stroke="#B08A45"
          strokeOpacity="0.28"
          strokeWidth="1.2"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((rotate) => (
          <path
            d="M110 9v18"
            key={rotate}
            stroke={rotate % 90 === 0 ? "#B08A45" : "#7F1D1D"}
            strokeOpacity={rotate % 90 === 0 ? "0.55" : "0.22"}
            strokeWidth="1.4"
            transform={`rotate(${rotate} 110 110)`}
          />
        ))}
        <rect x="80" y="80" width="60" height="60" rx="9" fill="#F7F4EC" stroke="#B08A45" strokeOpacity="0.46" />
        <path d="M95 101h31M101 116h22M110 94v40" stroke="#7F1D1D" strokeOpacity="0.42" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="absolute font-serif text-3xl text-[#7F1D1D] sm:text-4xl">道</span>
    </div>
  );
}
