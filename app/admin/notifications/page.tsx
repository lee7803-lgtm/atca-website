import Link from "next/link";
import type { Metadata } from "next";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { NotificationSendAction } from "./NotificationSendAction";
import { requireAdminPage } from "@/lib/admin/require-admin";
import { listNotificationLogs } from "@/lib/notifications/admin";
import { getEmailProviderConfig, isEmailAllowedTestRecipient } from "@/lib/notifications/email/config";
import { formatNotificationChannel, formatNotificationStatus, formatNotificationType, maskEmail, maskPhone } from "@/lib/notifications/format";
import { NotificationTableMissingError } from "@/lib/notifications/logger";
import { getNotificationRecipientEmail } from "@/lib/notifications/recipient";
import { autoNotificationAllowlist, getNotificationResendPolicyText } from "@/lib/notifications/policy";
import type { NotificationLogRecord, NotificationSendStatus } from "@/lib/notifications/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "通知记录｜国际道教与文化协会 ITCA"
};

export default async function AdminNotificationsPage() {
  requireAdminPage("notifications:read");

  let logs: NotificationLogRecord[] = [];
  let message = "";
  let messageTone: "info" | "error" = "info";
  const emailProviderStatus = getEmailProviderConfig();

  try {
    logs = await listNotificationLogs();
  } catch (error) {
    if (error instanceof NotificationTableMissingError) {
      message = "通知记录暂未完成环境配置，请联系技术管理员处理。";
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
            查看系统、邮件、WhatsApp 与人工处理通知记录。本阶段支持单条邮件通知手动发送接入；未配置真实 provider 或处于 dry-run 时不会发送真实邮件，也不调用 WhatsApp API。
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
        自动通知白名单覆盖申请提交、需补充资料、补充资料提交、审核结果、支付订单记录、证书生成 / 下发、会员与证书状态变更。Production 默认 dry-run 或 manual-only；WhatsApp 仅保留字段、模板与状态，不调用真实 API。本页不会展示敏感服务端凭证、数据库连接串、管理员凭证、存储对象路径、PDF path 或证书公开核验凭证。
      </div>
      <div className="mt-4 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 text-xs leading-6 text-[#5f5b52]">
        <p className="font-semibold text-porcelain">当前自动通知白名单</p>
        <p className="mt-2">{autoNotificationAllowlist.join(" / ")}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 text-sm leading-7 text-[#5f5b52]">
        <p className="font-semibold text-porcelain">当前邮件发送模式：{emailProviderStatus.displayName}</p>
        <p className="mt-1">{emailProviderStatus.safeMessage}</p>
        <dl className="mt-3 grid gap-2 text-xs text-[#8a6b3e] sm:grid-cols-2 lg:grid-cols-3">
          <DiagnosticItem label="当前 provider" value={emailProviderStatus.provider} />
          <DiagnosticItem label="当前模式" value={formatProviderMode(emailProviderStatus)} />
          <DiagnosticItem label="Manual send" value={emailProviderStatus.manualSendEnabled ? "已开启" : "未开启"} />
          <DiagnosticItem label="Dry-run" value={emailProviderStatus.dryRun ? "已开启" : "未开启"} />
          <DiagnosticItem label="测试收件人白名单" value={emailProviderStatus.testRecipientAllowlistConfigured ? "已配置" : "未配置"} />
          <DiagnosticItem label="白名单条目数" value={String(emailProviderStatus.testRecipientAllowlistCount || 0)} />
          <DiagnosticItem label="允许真实发送" value={emailProviderStatus.canSend ? "是" : "否"} />
        </dl>
        {!emailProviderStatus.canSend ? (
          <p className="mt-3 text-xs text-[#8a6b3e]">安全原因：{formatBlockReasons(emailProviderStatus)}</p>
        ) : null}
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
                {["创建时间", "通知类型", "渠道 / Provider", "状态", "接收人", "邮箱 / 手机", "业务对象", "最近发送时间", "失败原因", "可重发", "操作"].map((item) => (
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
                  <td className="px-4 py-4 text-[#5f5b52]">
                    <p>{formatNotificationChannel(item.channel)}</p>
                    <p className="mt-1 text-xs text-[#8a6b3e]">{item.provider || "none"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={item.sendStatus} />
                  </td>
                  <td className="px-4 py-4 text-[#5f5b52]">{item.recipientName || "未记录"}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">
                    <p>{maskEmail(getNotificationRecipientEmail(item)) || "未记录邮箱"}</p>
                    <p className="mt-1 text-xs text-[#8a6b3e]">{maskPhone(item.recipientPhone) || "未记录手机"}</p>
                    {item.channel === "email" ? <p className="mt-1 text-xs text-[#8a6b3e]">测试白名单：{formatAllowlistMatch(item, emailProviderStatus)}</p> : null}
                  </td>
                  <td className="px-4 py-4 text-[#5f5b52]">
                    <p className="break-all">{getRelatedNo(item) || "未关联"}</p>
                    <p className="mt-1 text-xs text-[#8a6b3e]">{[item.sourceType, item.sourceAction].filter(Boolean).join(" / ")}</p>
                  </td>
                  <td className="px-4 py-4 text-[#5f5b52]">{formatDateTime(getStatusTime(item))}</td>
                  <td className="max-w-sm px-4 py-4 text-[#5f5b52]" title={item.errorMessage}>{summarizeError(item.errorMessage)}</td>
                  <td className="px-4 py-4 text-[#5f5b52]">{getNotificationResendPolicyText(item)}</td>
                  <td className="px-4 py-4">
                    <NotificationSendAction channel={item.channel} id={item.id} status={item.sendStatus} {...getSendActionCopy(emailProviderStatus)} />
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#5f5b52]" colSpan={11}>暂无通知记录。</td>
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

function DiagnosticItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-[#5f5b52]">{label}</dt>
      <dd className="mt-0.5 break-words">{value}</dd>
    </div>
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

function formatProviderMode(status: ReturnType<typeof getEmailProviderConfig>) {
  if (status.provider === "none") return "模拟发送";
  if (!status.configured) return "配置未完成";
  if (status.dryRun) return "dry-run";
  if (status.canSend) return "可后台单条真实发送";
  return "不会真实发送";
}

function getSendActionCopy(status: ReturnType<typeof getEmailProviderConfig>) {
  if (status.provider === "none") {
    return {
      label: "模拟发送",
      title: "provider=none，本次只记录模拟发送，不会真实发送邮件。",
      helperText: "provider=none，不会真实发送"
    };
  }
  if (status.provider === "resend" && status.dryRun) {
    return {
      label: "dry-run",
      title: "Resend dry-run 已开启，本次不会真实发送邮件。",
      helperText: "dry-run，不会真实发送"
    };
  }
  if (status.provider === "resend" && !status.configured) {
    return {
      label: "配置未完成",
      title: "Resend 配置未完成，本次不会真实发送邮件。",
      helperText: "配置未完成，仅记录跳过"
    };
  }
  if (status.provider === "resend" && !status.manualSendEnabled) {
    return {
      label: "真实发送未开启",
      title: "Resend manual send 未开启，本次不会真实发送邮件。",
      helperText: "manual send 未开启"
    };
  }
  if (status.provider === "resend" && status.canSend) {
    return {
      label: "后台单条发送",
      title: "Resend 已通过全局安全门闩；只有测试白名单内收件人会真实发送。",
      helperText: "仅白名单收件人可真实发送"
    };
  }
  return {
    label: "模拟发送",
    title: "当前 provider 不支持真实发送，本次不会真实发送邮件。",
    helperText: "当前 provider 不支持真实发送"
  };
}

function formatBlockReasons(status: ReturnType<typeof getEmailProviderConfig>) {
  if (status.missingConfig.length > 0) return `配置未完成：${status.missingConfig.join("、")}`;
  const reasons = status.realSendBlockReasons || [];
  if (reasons.length === 0) return "无";
  return reasons.map(formatBlockReason).join("；");
}

function formatAllowlistMatch(notification: NotificationLogRecord, status: ReturnType<typeof getEmailProviderConfig>) {
  if (!status.testRecipientAllowlistConfigured) return "未配置";
  const recipientEmail = getNotificationRecipientEmail(notification);
  if (!recipientEmail) return "收件人邮箱缺失";
  return isEmailAllowedTestRecipient(recipientEmail) ? "已命中" : "未命中";
}

function formatBlockReason(reason: string) {
  const labels: Record<string, string> = {
    provider_none: "当前 provider=none",
    provider_unsupported: "当前 provider 不受支持",
    provider_not_real_send_enabled: "当前 provider 未启用真实发送",
    provider_reserved_not_implemented: "当前 provider 仍为预留实现",
    configuration_incomplete: "配置未完成",
    dry_run_enabled: "dry-run=true",
    manual_send_disabled: "manual send 未开启",
    test_recipient_allowlist_missing: "测试收件人白名单未配置"
  };
  return labels[reason] || reason;
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
