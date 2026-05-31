import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { listNotificationLogs } from "@/lib/notifications/admin";
import { formatNotificationChannel, formatNotificationStatus, formatNotificationType, maskEmail, maskPhone } from "@/lib/notifications/format";
import { NotificationTableMissingError } from "@/lib/notifications/logger";
import type { NotificationLogRecord, NotificationSendStatus } from "@/lib/notifications/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "通知记录｜国际道教与文化协会 ITCA"
};

export default async function AdminNotificationsPage() {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  let logs: NotificationLogRecord[] = [];
  let message = "";
  let messageTone: "info" | "error" = "info";

  try {
    logs = await listNotificationLogs();
  } catch (error) {
    if (error instanceof NotificationTableMissingError) {
      message = "通知记录表尚未创建，请先执行 SQL：supabase/v1-3-notifications.sql。";
      messageTone = "info";
    } else {
      message = "通知记录暂时无法读取，请确认 Supabase 配置和 notification_logs 表是否已部署。";
      messageTone = "error";
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Notification Logs</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-porcelain">通知记录</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[#5f5b52]">
            查看系统、邮件、WhatsApp 与人工处理通知记录。本阶段仅记录通知，不发送真实邮件，也不调用 WhatsApp API。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/admin">
            返回后台首页
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink" href="/admin/audit-logs">
            查看操作记录
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5 text-sm leading-7 text-[#5f5b52]">
        重发功能后续支持。本页不会展示敏感服务端凭证、数据库连接串、管理员 token、Storage path 或证书核验 token。
      </div>

      {message ? (
        <div className={`mt-8 border-l-4 p-5 text-sm leading-7 ${messageTone === "info" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>
          {message}
        </div>
      ) : null}

      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 shadow-aureate">
        <div className="overflow-x-auto">
          <table className="min-w-[1280px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#fbf8ef] text-[#5f5b52]">
              <tr>
                {["创建时间", "通知类型", "渠道", "状态", "接收人", "邮箱 / 手机", "关联编号", "状态时间", "失败原因"].map((item) => (
                  <th className="border-b border-[#e4ded0] px-4 py-3 font-medium" key={item}>{item}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => (
                <tr className="border-b border-[#eee7da] last:border-b-0" key={item.id}>
                  <td className="px-4 py-4 text-[#5f5b52]">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-4 text-porcelain">
                    <p>{formatNotificationType(item.notificationType)}</p>
                    {item.templateKey ? <p className="mt-1 break-all text-xs text-[#8a6b3e]">{item.templateKey}</p> : null}
                  </td>
                  <td className="px-4 py-4 text-[#5f5b52]">{formatNotificationChannel(item.channel)}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.sendStatus} />
                  </td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.recipientName || "未记录"}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">
                    <p>{maskEmail(item.recipientEmail) || "未记录邮箱"}</p>
                    <p className="mt-1 text-xs text-[#8a6b3e]">{maskPhone(item.recipientPhone) || "未记录手机"}</p>
                  </td>
                  <td className="px-4 py-4 text-[#5f5b52]">
                    <p className="break-all">{getRelatedNo(item) || "未关联"}</p>
                    <p className="mt-1 text-xs text-[#8a6b3e]">{[item.sourceType, item.sourceAction].filter(Boolean).join(" / ")}</p>
                  </td>
                  <td className="px-4 py-4 text-[#5f5b52]">{formatDateTime(getStatusTime(item))}</td>
                  <td className="max-w-sm px-4 py-4 text-[#5f5b52]" title={item.errorMessage}>{summarizeError(item.errorMessage)}</td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={9}>暂无通知记录。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: NotificationSendStatus }) {
  const className = {
    pending: "border-[#d8d0bf] bg-[#fbf8ef] text-[#66594d]",
    sent: "border-[#c8d8c2] bg-[#f2f8ef] text-[#355e36]",
    failed: "border-[#e4b8b2] bg-[#fbf0ec] text-[#7F1D1D]",
    skipped: "border-[#d8d0bf] bg-white text-[#8a6b3e]"
  }[status];

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {formatNotificationStatus(status)}
    </span>
  );
}

function getRelatedNo(item: NotificationLogRecord) {
  return item.applicationNo || item.memberNo || item.certificateNo;
}

function getStatusTime(item: NotificationLogRecord) {
  return item.sentAt || item.failedAt || item.skippedAt || item.scheduledAt || "";
}

function summarizeError(value: string) {
  if (!value) return "无";
  return value.length > 80 ? `${value.slice(0, 80)}...` : value;
}

function formatDateTime(value: string) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
