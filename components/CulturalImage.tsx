import { existsSync, statSync } from "node:fs";
import path from "node:path";

type CulturalImageTone = "architecture" | "space" | "certification" | "membership" | "verification";
type CulturalImageVariant = "standard" | "portal" | "service" | "wide";

type CulturalImageProps = {
  eyebrow: string;
  title: string;
  caption?: string;
  imageSrc?: string;
  imagePosition?: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
  overlaySeal?: string;
  tone?: CulturalImageTone;
  variant?: CulturalImageVariant;
  className?: string;
};

const toneMap: Record<CulturalImageTone, { seal: string; mark: string; accent: string }> = {
  architecture: {
    seal: "山门",
    mark: "ATCA",
    accent: "bg-[#8F1F2D]"
  },
  space: {
    seal: "合作交流",
    mark: "Culture",
    accent: "bg-[#7F1D1D]"
  },
  certification: {
    seal: "认证",
    mark: "Credential",
    accent: "bg-[#8b3f31]"
  },
  membership: {
    seal: "会员",
    mark: "Member",
    accent: "bg-[#7F1D1D]"
  },
  verification: {
    seal: "核验",
    mark: "Verify",
    accent: "bg-[#8F1F2D]"
  }
};

function hasLocalPublicImage(imageSrc?: string) {
  if (!imageSrc || !imageSrc.startsWith("/images/atca/")) {
    return false;
  }

  const imagePath = path.join(process.cwd(), "public", imageSrc);

  if (!existsSync(imagePath)) {
    return false;
  }

  return statSync(imagePath).size > 0;
}

export function CulturalImage({
  eyebrow,
  title,
  caption,
  imageSrc,
  imagePosition = "center",
  overlayTitle,
  overlaySubtitle,
  overlaySeal,
  tone = "space",
  variant = "standard",
  className = ""
}: CulturalImageProps) {
  const current = toneMap[tone];
  const hasImage = hasLocalPublicImage(imageSrc);
  const imageTitle = overlayTitle ?? title;
  const imageSeal = overlaySeal ?? current.seal;
  const showImageMark = true;

  return (
    <figure className={`cultural-visual cultural-visual--${variant} ${hasImage ? "cultural-visual--has-image" : ""} ${className}`}>
      {hasImage ? (
        <div
          className="cultural-visual__photo"
          style={{ backgroundImage: `url("${imageSrc}")`, backgroundPosition: imagePosition }}
          aria-hidden="true"
        />
      ) : null}
      <div className="cultural-visual__paper" aria-hidden="true" />
      <div className="cultural-visual__mountains" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="cultural-visual__frame" aria-hidden="true" />
      {hasImage ? (
        <div className="cultural-visual__image-content">
          <span className="cultural-visual__image-label">{eyebrow}</span>
          <div className="cultural-visual__image-heading">
            <div>
              {showImageMark ? <p className="cultural-visual__image-mark">{current.mark}</p> : null}
              <h3>{imageTitle}</h3>
              {overlaySubtitle ? <p className="cultural-visual__image-subtitle">{overlaySubtitle}</p> : null}
              {caption ? <figcaption>{caption}</figcaption> : null}
            </div>
            <span>{imageSeal}</span>
          </div>
        </div>
      ) : (
        <div className="cultural-visual__content">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex border border-[#A97A3D]/35 bg-[#fffaf0]/82 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-[#7b5a2e]">
              {eyebrow}
            </span>
            <span className={`h-1.5 w-12 ${current.accent}`} aria-hidden="true" />
          </div>
          <div className="mt-auto">
            <div className="mb-5 flex items-end justify-between gap-5">
              <div>
                <p className="font-serif text-4xl leading-none text-[#A97A3D]/24 sm:text-5xl">
                  {current.mark}
                </p>
                <h3 className="mt-3 font-serif text-2xl leading-tight text-[#2A1F1A] sm:text-3xl">
                  {title}
                </h3>
              </div>
              <span className="grid h-16 w-16 shrink-0 place-items-center border border-[#8F1F2D]/36 px-2 text-center text-sm font-medium text-[#8F1F2D] sm:h-20 sm:w-20">
                {current.seal}
              </span>
            </div>
            {caption ? <figcaption className="max-w-md text-sm leading-7 text-[#665b50]">{caption}</figcaption> : null}
          </div>
        </div>
      )}
    </figure>
  );
}
