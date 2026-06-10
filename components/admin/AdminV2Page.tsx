import Link from "next/link";
import type { ReactNode } from "react";
import { AdminPageHeader, AdminSectionCard, AdminStatusBadge } from "@/components/admin/AdminUI";

export type AdminV2Item = {
  badge?: string;
  href?: string;
  text: string;
  title: string;
};

export function AdminV2Page({
  actions,
  children,
  eyebrow,
  intro,
  items,
  notice,
  title
}: {
  actions?: ReactNode;
  children?: ReactNode;
  eyebrow: string;
  intro: string;
  items?: AdminV2Item[];
  notice?: string;
  title: string;
}) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader actions={actions} eyebrow={eyebrow} intro={intro} title={title} />
      {notice ? (
        <div className="border-l-4 border-[#8a6b3e] bg-[#fbf8ef] p-5 text-sm leading-7 text-[#5f5b52]">
          {notice}
        </div>
      ) : null}
      {items ? <AdminV2CardGrid items={items} /> : null}
      {children}
    </div>
  );
}

export function AdminV2CardGrid({ items }: { items: AdminV2Item[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article className="rounded-xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate" key={item.title}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-serif text-2xl text-porcelain">{item.title}</h2>
            {item.badge ? <AdminStatusBadge tone="neutral">{item.badge}</AdminStatusBadge> : null}
          </div>
          <p className="mt-3 text-sm leading-7 text-[#5f5b52]">{item.text}</p>
          {item.href ? (
            <Link className="mt-5 inline-flex rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href={item.href}>
              进入模块
            </Link>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function AdminV2LinkActions({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {links.map((link) => (
        <Link className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink" href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function AdminV2SimpleTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <AdminSectionCard title="权限矩阵">
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#fbf8ef] text-[#5f5b52]">
            <tr>
              {columns.map((column) => (
                <th className="border-b border-[#e4ded0] px-4 py-3 font-medium" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-[#eee7da] last:border-b-0" key={row.join("-")}>
                {row.map((cell, index) => (
                  <td className={`px-4 py-4 ${index === 0 ? "font-medium text-porcelain" : "text-[#5f5b52]"}`} key={`${cell}-${index}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSectionCard>
  );
}

