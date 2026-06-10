import Link from "next/link";
import { IconBadge } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard, NoticeBox, Section } from "@/components/Section";
import type { V2Action, V2Card, V2PageData, V2Section } from "@/lib/v2/content";

function V2Actions({ actions }: { actions: V2Action[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
      {actions.map((action, index) => {
        const isPrimary = action.variant ? action.variant === "primary" : index === 0;
        const className = isPrimary
          ? "max-w-full rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]"
          : "max-w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]";

        return (
          <Link className={className} href={action.href} key={`${action.href}-${action.label}`}>
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}

function V2Icon({ item }: { item: V2Card }) {
  if (!item.icon) return undefined;

  return (
    <IconBadge
      name={item.icon}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

function V2CardBody({ item }: { item: V2Card }) {
  return (
    <>
      {item.labels?.length ? (
        <div className="flex min-w-0 flex-wrap gap-2">
          {item.labels.map((label) => (
            <span className="max-w-full break-words rounded-full border border-[#e4ded0] bg-[#f8f7f3] px-3 py-1.5 text-xs font-medium text-[#66594d]" key={label}>
              {label}
            </span>
          ))}
        </div>
      ) : null}
      {item.href ? (
        <Link className="inline-flex text-sm font-semibold text-[#8a6b3e] transition hover:text-[#7F1D1D]" href={item.href}>
          进入栏目
        </Link>
      ) : null}
    </>
  );
}

function V2Cards({ cards }: { cards: V2Card[] }) {
  return (
    <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((item, index) => (
        <InfoCard icon={V2Icon({ item })} index={`0${index + 1}`} key={`${item.title}-${index}`} text={item.text} title={item.title}>
          <V2CardBody item={item} />
        </InfoCard>
      ))}
    </div>
  );
}

function V2PageSection({ section, index }: { index: number; section: V2Section }) {
  return (
    <Section
      afterHero={section.afterHero ?? index === 0}
      eyebrow={section.eyebrow}
      intro={section.intro}
      title={section.title}
      tone={section.tone}
    >
      <div className="grid min-w-0 gap-7">
        {section.cards ? <V2Cards cards={section.cards} /> : null}
        {section.notice ? <NoticeBox>{section.notice}</NoticeBox> : null}
        {section.actions ? <V2Actions actions={section.actions} /> : null}
      </div>
    </Section>
  );
}

export function V2BoundaryNotice({ text, title }: { text: string; title: string }) {
  return (
    <article className="min-w-0 overflow-hidden border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
      <h3 className="font-serif text-2xl text-porcelain">{title}</h3>
      <p className="mt-4">{text}</p>
    </article>
  );
}

export function V2InfoPage({ page }: { page: V2PageData }) {
  return (
    <>
      <PageHero
        actions={page.actions}
        atmosphere={page.atmosphere}
        backgroundImagePosition={page.backgroundImagePosition}
        backgroundImageSrc={page.backgroundImageSrc}
        eyebrow={page.eyebrow}
        imagePosition={page.imagePosition}
        imageSrc={page.imageSrc}
        intro={page.intro}
        subtitle={page.subtitle}
        title={page.title}
        visualDescription={page.visualDescription}
        visualEyebrow={page.visualEyebrow}
        visualMark={page.visualMark}
        visualSeal={page.visualSeal}
        visualTitle={page.visualTitle}
      />

      {page.sections.map((section, index) => (
        <V2PageSection index={index} key={`${section.title}-${index}`} section={section} />
      ))}

      {page.boundaryNotices?.length ? (
        <Section eyebrow="Boundary" title="边界说明" tone="soft">
          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            {page.boundaryNotices.map((notice) => (
              <V2BoundaryNotice key={notice.title} {...notice} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}

