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
  return (
    <section className={`page-hero page-hero--${atmosphere} relative overflow-hidden border-b border-[#d8d0bf]`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(169,122,61,0.16),transparent_20rem),linear-gradient(135deg,#7F1D1D_0%,#33251F_44%,#2A1F1A_100%)]" />
      <div
        className="absolute inset-0 bg-cover opacity-[0.34]"
        style={{ backgroundImage: `url("${backgroundImageSrc}")`, backgroundPosition: backgroundImagePosition }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(42,31,26,0.96)_0%,rgba(42,31,26,0.88)_32%,rgba(51,37,31,0.70)_52%,rgba(51,37,31,0.46)_74%,rgba(42,31,26,0.36)_100%),radial-gradient(circle_at_72%_22%,rgba(169,122,61,0.18),transparent_22rem)]" aria-hidden="true" />
      <CulturePattern variant="hero" className="opacity-60" />
      <InkLandscape className="opacity-80" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-18 sm:px-8 lg:grid-cols-[1fr_0.72fr] lg:items-center lg:py-28">
        <div className="page-hero__copy max-w-3xl">
          <p className="page-hero__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {subtitle && atmosphere !== "standard" ? <p className="page-hero__subtitle">{subtitle}</p> : null}
          <p className="page-hero__intro">{intro}</p>
          {actions.length > 0 ? (
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions.map((action, index) => {
                const variant = action.variant ?? (index === 0 ? "primary" : "secondary");
                const className = variant === "primary"
                  ? "rounded-xl bg-[#A97A3D] px-6 py-3.5 text-center text-sm font-semibold text-[#fffaf0] transition hover:bg-[#b88745]"
                  : "rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/14";

                return (
                  <Link className={className} href={action.href} key={`${action.href}-${action.label}`}>
                    {action.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="lg:pt-4">
          <figure className="cultural-visual cultural-visual--portal cultural-visual--has-image min-h-[28rem] border-[#79644E] bg-[#f8f1e4] shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
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
                <span>{visualSeal}</span>
              </div>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
