type PageHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  intro: string;
  imageSrc?: string;
  imagePosition?: string;
  visualEyebrow?: string;
  visualMark?: string;
  visualTitle?: string;
  visualDescription?: string;
  visualSeal?: string;
};

export function PageHero({
  eyebrow,
  title,
  subtitle,
  intro,
  imageSrc = "/images/atca/about-cultural-space.jpg",
  imagePosition = "center",
  visualEyebrow,
  visualMark = "Culture",
  visualTitle,
  visualDescription,
  visualSeal = "ATCA"
}: PageHeroProps) {
  const imageModifier = visualMark ? ` page-hero__image--${visualMark.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "";

  return (
    <section className="page-hero relative overflow-hidden border-b border-[#d8d0bf]">
      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_0.72fr] lg:items-center lg:py-20">
        <div className="page-hero__copy">
          <p className="page-hero__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {subtitle ? <p className="page-hero__subtitle">{subtitle}</p> : null}
          <p className="page-hero__intro">{intro}</p>
        </div>
        <figure className={`page-hero__image${imageModifier} min-h-[18rem] lg:min-h-[24rem]`} style={{ backgroundImage: `url("${imageSrc}")`, backgroundPosition: imagePosition }}>
          <div className="page-hero__image-content">
            <span className="page-hero__image-label">{visualEyebrow ?? eyebrow}</span>
            <div className="page-hero__image-heading">
              <div>
                <p className="page-hero__image-mark">{visualMark}</p>
                <h2>{visualTitle ?? title}</h2>
                {visualDescription ? <figcaption>{visualDescription}</figcaption> : null}
              </div>
              <span>{visualSeal}</span>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
