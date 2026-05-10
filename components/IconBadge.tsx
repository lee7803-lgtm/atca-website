export type IconBadgeName =
  | "association"
  | "certification"
  | "membership"
  | "individual"
  | "institution"
  | "query"
  | "contact"
  | "international"
  | "certificate"
  | "cooperation"
  | "structure"
  | "value";

type IconBadgeProps = {
  className?: string;
  name: IconBadgeName;
  size?: "sm" | "md" | "lg";
};

const boxSize = {
  sm: "h-11 w-11",
  md: "h-14 w-14",
  lg: "h-16 w-16"
};

function IconPaths({ name }: { name: IconBadgeName }) {
  switch (name) {
    case "association":
      return (
        <>
          <rect x="8" y="8" width="20" height="20" rx="4" />
          <path d="M13 16h10M14 21h8M18 12v13" />
        </>
      );
    case "certification":
      return (
        <>
          <path d="M10 7h16v22H10z" />
          <path d="M14 13h8M14 18h6" />
          <circle cx="23" cy="25" r="5" />
          <path d="M21 25h4M23 23v4" />
        </>
      );
    case "membership":
    case "individual":
      return (
        <>
          <circle cx="18" cy="13" r="5" />
          <path d="M9 29c2-7 16-7 18 0" />
          <circle cx="18" cy="18" r="14" />
        </>
      );
    case "institution":
      return (
        <>
          <path d="M7 15 18 8l11 7" />
          <path d="M10 16v12M16 16v12M22 16v12M7 29h22" />
          <circle cx="18" cy="13" r="2" />
        </>
      );
    case "query":
      return (
        <>
          <path d="M9 7h14v18H9z" />
          <path d="M13 13h6M13 18h5" />
          <circle cx="24" cy="24" r="5" />
          <path d="m28 28 4 4" />
        </>
      );
    case "contact":
    case "cooperation":
      return (
        <>
          <circle cx="13" cy="18" r="7" />
          <circle cx="23" cy="18" r="7" />
          <path d="M10 27c5 4 11 4 16 0" />
        </>
      );
    case "international":
      return (
        <>
          <circle cx="18" cy="18" r="12" />
          <path d="M6 18h24M18 6c4 4 4 20 0 24M18 6c-4 4-4 20 0 24" />
        </>
      );
    case "certificate":
      return (
        <>
          <path d="M8 7h20v24H8z" />
          <path d="M13 13h10M13 18h8M13 23h6" />
          <circle cx="24" cy="25" r="4" />
        </>
      );
    case "structure":
      return (
        <>
          <rect x="13" y="7" width="10" height="7" rx="2" />
          <rect x="6" y="24" width="10" height="7" rx="2" />
          <rect x="20" y="24" width="10" height="7" rx="2" />
          <path d="M18 14v5M11 19h14M11 19v5M25 19v5" />
        </>
      );
    case "value":
      return (
        <>
          <path d="M18 7 29 13v9c0 6-5 9-11 11-6-2-11-5-11-11v-9l11-6Z" />
          <path d="m13 20 4 4 7-8" />
        </>
      );
    default:
      return null;
  }
}

export function IconBadge({ className = "", name, size = "md" }: IconBadgeProps) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full border border-gold/30 bg-[#fbf8ef] text-[#7F1D1D] shadow-[0_14px_35px_rgba(176,138,69,0.08)] ${boxSize[size]} ${className}`}
      aria-hidden="true"
    >
      <svg className="h-7 w-7" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
        <IconPaths name={name} />
        <circle cx="18" cy="18" r="16" stroke="#B08A45" strokeOpacity="0.16" />
      </svg>
    </span>
  );
}
