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
      <AdminSectionCard title="模块说明与当前状态">
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
            <p className="font-semibold text-porcelain">谁使用</p>
            <p className="mt-2">授权管理员、审核员、内容维护人员、财务审核员、资料中心管理员或只读观察员按权限使用。</p>
          </div>
          <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
            <p className="font-semibold text-porcelain">影响范围</p>
            <p className="mt-2">可能影响前台公开展示、申请流转、通知记录、证书状态、资料公开字段或审计记录。</p>
          </div>
          <div className="rounded-xl border border-[#d8d0bf] bg-white p-4 text-sm leading-7 text-[#5f5b52]">
            <p className="font-semibold text-porcelain">筛选与搜索</p>
            <p className="mt-2">列表筛选 / 搜索预留；真实查询接入后按模块权限开放。</p>
          </div>
        </div>
      </AdminSectionCard>
      {items ? <AdminV2CardGrid items={items} /> : null}
      {children}
    </div>
  );
}

export function AdminV2CardGrid({ items }: { items: AdminV2Item[] }) {
  return (
    <AdminSectionCard title="数据列表 / 功能边界">
      <div className="mt-5 grid gap-3">
      {items.map((item) => (
        <article className="grid gap-4 rounded-xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate lg:grid-cols-[12rem_minmax(0,1fr)_9rem] lg:items-center" key={item.title}>
          <div>
            {item.badge ? <AdminStatusBadge tone="neutral">{item.badge}</AdminStatusBadge> : null}
            <h2 className="mt-3 font-serif text-2xl text-porcelain">{item.title}</h2>
          </div>
          <p className="text-sm leading-7 text-[#5f5b52]">{item.text}</p>
          {item.href ? (
            <Link className="inline-flex justify-center rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href={item.href}>
              进入模块
            </Link>
          ) : (
            <span className="rounded-full border border-dashed border-[#d8d0bf] bg-[#fbf8ef] px-4 py-2 text-center text-xs font-semibold text-[#66594d]">预留入口</span>
          )}
        </article>
      ))}
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-[#d8d0bf] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
        暂无更多实时数据。后续接入数据库列表后，应显示空状态、筛选、搜索、分页、发布状态和审计提示。
      </div>
    </AdminSectionCard>
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
