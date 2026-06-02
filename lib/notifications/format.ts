import type { NotificationChannel, NotificationLogInput, NotificationSendStatus, NotificationType } from "./types";

const forbiddenPayloadKeyPattern = /internal|committee|material_review|photo_path|supporting_documents|existing_certificates|storage|pdf_storage_path|vt|token|api[_-]?key|private[_-]?key|service_role|connection|string|password|secret|smtp|recommend|recommender|id_proof|identity/i;

export const notificationTypeLabels: Record<string, string> = {
  member_application_submitted: "会员申请已提交",
  organization_application_submitted: "机构会员申请已提交",
  certification_application_submitted: "认证申请已提交",
  member_application_approved: "会员申请已通过",
  member_application_rejected: "会员申请未通过",
  member_application_need_more_info: "会员申请需补充资料",
  certification_application_approved: "认证申请已通过",
  certification_application_rejected: "认证申请未通过",
  certification_application_need_more_info: "认证申请需补充资料",
  supplement_submitted: "补充资料已提交",
  certificate_generated: "证书已生成",
  certificate_pdf_generated: "正式证书 PDF 已生成",
  certificate_delivered: "证书已下发",
  member_status_updated: "会员状态已更新",
  certificate_status_updated: "证书状态已更新",
  "payment.order_created": "支付订单已创建",
  "payment.order_updated": "支付状态已更新",
  "payment.manual_confirmed": "支付待人工确认",
  "payment.paid": "支付已完成",
  "payment.cancelled": "支付已取消",
  "renewal.payment_required": "续期支付待处理",
  "rereview.payment_required": "复审支付待处理"
};

export const channelLabels: Record<NotificationChannel, string> = {
  email: "邮件",
  whatsapp: "WhatsApp",
  system: "系统记录",
  manual: "人工处理"
};

export const sendStatusLabels: Record<NotificationSendStatus, string> = {
  pending: "待处理",
  sent: "已发送",
  failed: "发送失败",
  skipped: "已跳过"
};

export function formatNotificationType(value: NotificationType) {
  return notificationTypeLabels[value] || value;
}

export function formatNotificationChannel(value: NotificationChannel) {
  return channelLabels[value] || value;
}

export function formatNotificationStatus(value: NotificationSendStatus) {
  return sendStatusLabels[value] || value;
}

export function maskEmail(value?: string) {
  const email = value?.trim();
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!name || !domain) return maskMiddle(email);
  const visible = name.length <= 2 ? name.slice(0, 1) : `${name.slice(0, 2)}${"*".repeat(Math.min(name.length - 2, 4))}`;
  return `${visible}@${domain}`;
}

export function maskPhone(value?: string) {
  const phone = value?.trim();
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return maskMiddle(phone);
  return `${phone.slice(0, Math.min(4, phone.length))}****${phone.slice(-4)}`;
}

export function buildNotificationIdempotencyKey(input: Pick<NotificationLogInput, "notificationType" | "channel" | "applicationNo" | "memberNo" | "certificateNo" | "sourceAction">) {
  return [
    input.notificationType,
    input.channel,
    input.applicationNo || "",
    input.memberNo || "",
    input.certificateNo || "",
    input.sourceAction || ""
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(":");
}

export function sanitizeNotificationPayload(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !forbiddenPayloadKeyPattern.test(key))
      .map(([key, entry]) => [key, sanitizePayloadValue(entry)])
      .filter(([, entry]) => entry !== undefined)
  );
}

function sanitizePayloadValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizePayloadValue).filter((entry) => entry !== undefined);
  if (isRecord(value)) return sanitizeNotificationPayload(value);
  if (typeof value === "string" && looksSensitive(value)) return undefined;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) return value;
  return undefined;
}

function looksSensitive(value: string) {
  return /\/storage\/|supabase\.co\/storage|Bearer\s+|service_role|smtp:\/\/|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\./i.test(value);
}

function maskMiddle(value: string) {
  if (value.length <= 2) return `${value.slice(0, 1)}*`;
  return `${value.slice(0, 1)}${"*".repeat(Math.min(value.length - 2, 4))}${value.slice(-1)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
