import Link from "next/link";
import type { Metadata } from "next";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { requireAdminPage } from "@/lib/admin/require-admin";
import { listAuditLogs } from "@/lib/admin/audit-logs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "操作记录｜国际道教与文化协会 ITCA"
};

export default async function AdminAuditLogsPage() {
  requireAdminPage("auditLogs:read");

  let logs: Awaited<ReturnType<typeof listAuditLogs>> = [];
  let message = "";

  try {
    logs = await listAuditLogs();
  } catch {
    message = "操作记录暂时无法读取，请确认 Supabase 配置和 audit_logs 表是否已部署。";
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Audit Logs</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">操作记录</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5f5b52]">查看后台关键写操作的基础审计记录。</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/admin">
            返回后台首页
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/">
            返回前台首页
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      {message ? <div className="mt-8 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-5 text-sm leading-7 text-[#7F1D1D]">{message}</div> : null}

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 shadow-aureate">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#fbf8ef] text-[#5f5b52]">
              <tr>
                {["时间", "操作者", "动作", "资源", "摘要", "IP", "User Agent"].map((item) => (
                  <th className="border-b border-[#e4ded0] px-4 py-3 font-medium" key={item}>{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => (
                <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                  <td className="px-4 py-4 text-[#5f5b52]">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-4 text-porcelain">
                    <p>{item.actorName || item.actorEmail || item.actorType}</p>
                    <p className="mt-1 text-xs text-[#8a6b3e]">{[item.actorRole, item.actorType].filter(Boolean).join(" / ")}</p>
                  </td>
                  <td className="px-4 py-4 font-medium text-[#7F1D1D]">{item.action}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">
                    <p>{item.resourceType}</p>
                    <p className="mt-1 break-all text-xs text-[#8a6b3e]">{item.resourceNo || item.resourceId}</p>
                  </td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.summary || "未记录"}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.ipAddress || "未记录"}</td>
                  <td className="max-w-sm truncate px-4 py-4 text-[#5f5b52]" title={item.userAgent}>{item.userAgent || "未记录"}</td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={7}>暂无操作记录。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  if (!value) return "未记录";
  return new Date(value).toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
