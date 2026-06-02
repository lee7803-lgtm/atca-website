import type { NotificationLogRecord } from "./types";

export const autoNotificationAllowlist = [
  "member_application_submitted",
  "organization_application_submitted",
  "certification_application_submitted",
  "member_application_need_more_info",
  "certification_application_need_more_info",
  "supplement_submitted",
  "member_application_approved",
  "member_application_rejected",
  "certification_application_approved",
  "certification_application_rejected",
  "payment.order_created",
  "payment.order_updated",
  "payment.manual_confirmed",
  "payment.paid",
  "payment.cancelled",
  "certificate_generated",
  "certificate_delivered",
  "member_status_updated",
  "certificate_status_updated"
];

const manualEmailAllowlist = new Set([
  "member_application_submitted",
  "organization_application_submitted",
  "certification_application_submitted",
  "member_application_need_more_info",
  "certification_application_need_more_info",
  "supplement_submitted",
  "member_application_approved",
  "member_application_rejected",
  "certification_application_approved",
  "certification_application_rejected",
  "certificate_generated",
  "certificate_delivered",
  "member_status_updated",
  "certificate_status_updated"
]);

const highRiskNotificationTypes = new Set([
  "certificate_pdf_generated",
  "renewal.payment_required",
  "rereview.payment_required"
]);

export function isManualEmailNotificationAllowed(notification: Pick<NotificationLogRecord, "channel" | "notificationType" | "payloadJson" | "messageBody">) {
  if (notification.channel !== "email") return false;
  if (highRiskNotificationTypes.has(notification.notificationType)) return false;
  if (notification.notificationType.startsWith("payment.")) return false;
  if (!manualEmailAllowlist.has(notification.notificationType)) return false;
  if (containsSensitiveNotificationPayload(notification.payloadJson)) return false;
  if (containsSensitiveNotificationText(notification.messageBody)) return false;
  return true;
}

export function getNotificationResendPolicyText(notification: Pick<NotificationLogRecord, "channel" | "notificationType" | "payloadJson" | "messageBody" | "sendStatus">) {
  if (notification.sendStatus === "sent") return "已处理";
  if (isManualEmailNotificationAllowed(notification)) return "可按白名单补发";
  if (notification.channel !== "email") return "非邮件预留";
  return "受安全策略限制";
}

export function containsSensitiveNotificationPayload(payload: Record<string, unknown>) {
  return Object.keys(payload || {}).some((key) => /storage|pdf|vt|token|identity|id[_-]?proof|recommend|recommender|committee|internal|material|remark|note/i.test(key));
}

function containsSensitiveNotificationText(value: string) {
  return /\/storage\/|certificate-pdfs|storage path|pdf path|vt=|verificationToken|service_role|RESEND_API_KEY|ITCA_ADMIN_API_TOKEN/i.test(value || "");
}
