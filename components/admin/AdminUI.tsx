import type { ReactNode } from "react";

export function AdminPageHeader({ actions, eyebrow, intro, title }: { actions?: ReactNode; eyebrow: string; intro?: string; title: string }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-3xl leading-tight text-porcelain sm:text-4xl">{title}</h1>
        {intro ? <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f5b52]">{intro}</p> : null}
      </div>
      {actions ? <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">{actions}</div> : null}
    </div>
  );
}

export function AdminSectionCard({ children, className = "", id, title }: { children: ReactNode; className?: string; id?: string; title?: string }) {
  return (
    <section className={`scroll-mt-24 rounded-xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate sm:p-6 ${className}`} id={id}>
      {title ? <h2 className="font-serif text-2xl text-porcelain">{title}</h2> : null}
      {children}
    </section>
  );
}

export function AdminStatCard({ label, value, note }: { label: string; note?: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate">
      <p className="text-xs tracking-[0.22em] text-gold">{label}</p>
      <p className="mt-3 font-serif text-3xl text-porcelain">{value}</p>
      {note ? <p className="mt-2 text-xs leading-6 text-[#5f5b52]">{note}</p> : null}
    </div>
  );
}

export function AdminStatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "danger" | "warning" }) {
  const className = {
    neutral: "border-[#d8d0bf] bg-[#fbf8ef] text-[#66594d]",
    success: "border-[#c8d8c2] bg-[#f2f8ef] text-[#355e36]",
    danger: "border-[#e4b8b2] bg-[#fbf0ec] text-[#7F1D1D]",
    warning: "border-[#ead7a5] bg-[#fff8df] text-[#8a6b3e]"
  }[tone];

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}
