import type { ReactNode } from "react";
import { IconBadge } from "@/components/IconBadge";

type SectionProps = {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  tone?: "default" | "soft";
};

export function Section({ eyebrow, title, intro, children, tone = "default" }: SectionProps) {
  return (
    <section className={tone === "soft" ? "bg-white/26" : ""}>
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="mb-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            {eyebrow ? (
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-gold sm:text-sm">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="font-serif text-3xl leading-tight text-porcelain sm:text-4xl lg:text-5xl">
              {title}
            </h2>
          </div>
          {intro ? <p className="max-w-2xl text-base leading-8 text-[#666666] lg:justify-self-end">{intro}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function InfoCard({
  title,
  text,
  index,
  icon,
  children
}: {
  title: string;
  text: string;
  index?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="pattern-card min-h-full rounded-2xl border border-[#e5e0d5] bg-white/82 p-5 shadow-[0_18px_55px_rgba(31,42,40,0.055)] transition hover:-translate-y-0.5 hover:border-gold/35 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        {icon ?? (index ? <p className="font-serif text-3xl text-gold/72 sm:text-4xl">{index}</p> : <span />)}
        {index && icon ? <p className="font-serif text-2xl text-gold/65">{index}</p> : <span className="cultural-chip" aria-hidden="true" />}
      </div>
      <h3 className="text-lg font-medium text-porcelain">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-[#666666]">{text}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}

export function NoticeBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gold/35 bg-[#fbf8ef] p-5 text-sm leading-7 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-6">
      {children}
    </div>
  );
}

export function FlowList({ items }: { items: string[] }) {
  return (
    <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <div className="absolute left-6 right-6 top-7 hidden h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent xl:block" aria-hidden="true" />
      {items.map((item, index) => (
        <article
          className="relative rounded-2xl border border-[#e4ded0] bg-white/95 p-5 shadow-aureate"
          key={item}
        >
          <IconBadge name="certification" size="sm" />
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-gold">Step 0{index + 1}</p>
          <h3 className="mt-4 text-base font-medium leading-7 text-porcelain">{item}</h3>
        </article>
      ))}
    </div>
  );
}
