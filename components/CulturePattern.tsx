type CulturePatternProps = {
  className?: string;
  variant?: "hero" | "cloud" | "water" | "rings";
};

export function CulturePattern({ className = "", variant = "hero" }: CulturePatternProps) {
  if (variant === "rings") {
    return (
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
        <div className="absolute -right-20 top-8 h-72 w-72 rounded-full border border-gold/10" />
        <div className="absolute -right-6 top-20 h-44 w-44 rounded-full border border-[#7F1D1D]/10" />
      </div>
    );
  }

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 1200 520"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      {variant === "hero" ? (
        <>
          <path d="M0 370c120-80 210-80 320 0s210 80 330 0 210-80 330 0 140 80 220 0" stroke="#7F1D1D" strokeOpacity="0.055" />
          <path d="M0 420c120-70 210-70 320 0s210 70 330 0 210-70 330 0 140 70 220 0" stroke="#B08A45" strokeOpacity="0.06" />
          <circle cx="990" cy="124" r="110" stroke="#B08A45" strokeOpacity="0.07" />
          <circle cx="990" cy="124" r="72" stroke="#7F1D1D" strokeOpacity="0.05" />
        </>
      ) : null}
      {variant === "cloud" ? (
        <>
          <path d="M120 180c40-44 96-44 136 0 42-50 110-50 154 0h90" stroke="#7F1D1D" strokeOpacity="0.055" />
          <path d="M720 250c40-44 96-44 136 0 42-50 110-50 154 0h90" stroke="#B08A45" strokeOpacity="0.06" />
        </>
      ) : null}
      {variant === "water" ? (
        <>
          <path d="M90 330c90-34 180-34 270 0s180 34 270 0 180-34 270 0" stroke="#7F1D1D" strokeOpacity="0.055" />
          <path d="M90 370c90-34 180-34 270 0s180 34 270 0 180-34 270 0" stroke="#B08A45" strokeOpacity="0.055" />
        </>
      ) : null}
    </svg>
  );
}
