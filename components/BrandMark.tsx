import Image from "next/image";

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-10 w-10",
  md: "h-11 w-11",
  lg: "h-48 w-48 sm:h-56 sm:w-56"
};

export function BrandMark({ className = "", size = "md" }: BrandMarkProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={`shrink-0 rounded-full object-contain ${sizeClass[size]} ${className}`}
      height={224}
      priority={size !== "lg"}
      src="/images/brand/itca-logo-mark.png"
      width={224}
    />
  );
}
