import Link from "next/link";
import { CulturePattern } from "@/components/CulturePattern";
import { InkLandscape } from "@/components/InkLandscape";

type PageHeroAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  intro: string;
  actions?: PageHeroAction[];
  backgroundImageSrc?: string;
  backgroundImagePosition?: string;
  imageSrc?: string;
  imagePosition?: string;
  visualEyebrow?: string;
  visualMark?: string;
  visualTitle?: string;
  visualDescription?: string;
  visualSeal?: string;
  atmosphere?: "standard" | "gate" | "credential";
};

export function PageHero({
  eyebrow,
  title,
  subtitle,
  intro,
  actions = [],
  backgroundImageSrc = "/images/atca/hero-architecture.jpg",
  backgroundImagePosition = "center 46%",
  imageSrc = "/images/itca/02-home-association.png",
  imagePosition = "center",
  visualEyebrow,
  visualMark = "Culture",
  visualTitle,
  visualDescription,
  visualSeal = "ITCA",
  atmosphere = "standard"
}: PageHeroProps) {
  const visualSealLines = visualSeal.split("\n");

  return (
    <section className={`page-hero page-hero--${atmosphere} relative overflow-hidden border-b border-[#d8d0bf]`}>
      <div className="absolute inset-0 bg-[#2B1D18]" />
      <div
        className="absolute inset-0 scale-[1.03] bg-cover"
        style={{ backgroundImage: `url("${backgroundImageSrc}")`, backgroundPosition: backgroundImagePosition, backgroundSize: "cover" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(81,31,28,0.88)_0%,rgba(81,31,28,0.78)_24%,rgba(72,37,33,0.68)_46%,rgba(43,29,24,0.66)_68%,rgba(37,26,22,0.76)_100%),radial-gradient(circle_at_18%_22%,rgba(143,31,45,0.28)_0%,rgba(143,31,45,0.12)_28%,transparent_56%),linear-gradient(180deg,rgba(28,18,15,0.18)_0%,rgba(28,18,15,0.08)_48%,rgba(28,18,15,0.36)_100%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,250,240,0.08),transparent)]" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d8bd7a]/28 to-transparent" aria-hidden="true" />
      <CulturePattern variant="hero" className="opacity-60" />
      <InkLandscape className="opacity-80" />
      <div className="relative mx-auto grid w-full max-w-7xl min-w-0 gap-8 px-5 py-16 sm:gap-12 sm:px-8 sm:py-18 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:items-center lg:py-28">
        <div className="page-hero__copy min-w-0 max-w-3xl">
          <p className="page-hero__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {subtitle && atmosphere !== "standard" ? <p className="page-hero__subtitle">{subtitle}</p> : null}
          <p className="page-hero__intro">{intro}</p>
          {actions.length > 0 ? (
            <div className="mt-9 flex max-w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions.map((action, index) => {
                const variant = action.variant ?? (index === 0 ? "primary" : "secondary");
                const className = variant === "primary"
                  ? "w-full rounded-xl bg-[#B7833D] px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#A06F32] sm:w-auto"
                  : "w-full rounded-xl border border-[#F8F1E8]/[0.38] bg-white/[0.08] px-6 py-3.5 text-center text-sm font-semibold text-[#F8F1E8] transition hover:bg-white/[0.14] sm:w-auto";

                return (
                  <Link className={`${className} max-w-full min-w-0 break-words`} href={action.href} key={`${action.href}-${action.label}`}>
                    {action.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="min-w-0 max-w-full lg:pt-4">
          <figure className="cultural-visual cultural-visual--portal cultural-visual--has-image min-h-[28rem] max-w-full border-[#79644E] bg-[#f8f1e4] shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <div
              className="cultural-visual__photo"
              style={{ backgroundImage: `url("${imageSrc}")`, backgroundPosition: imagePosition }}
              aria-hidden="true"
            />
            <div className="cultural-visual__paper" aria-hidden="true" />
            <div className="cultural-visual__frame" aria-hidden="true" />
            <div className="cultural-visual__image-content">
              <span className="cultural-visual__image-label">{visualEyebrow ?? eyebrow}</span>
              <div className="cultural-visual__image-heading">
                <div>
                  <p className="cultural-visual__image-mark">{visualMark}</p>
                  <h3>{visualTitle ?? title}</h3>
                  {visualDescription ? <figcaption>{visualDescription}</figcaption> : null}
                </div>
                <span>
                  {visualSealLines.map((line, index) => (
                    <span className="block leading-tight" key={`${line}-${index}`}>{line}</span>
                  ))}
                </span>
              </div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
