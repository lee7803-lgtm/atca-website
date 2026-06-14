import { NextResponse } from "next/server";
import { adminSessionCookieName, getAdminSession } from "@/lib/admin/auth";
import { requireAdminApiPermission } from "@/lib/admin/require-admin";
import { createAuditLog } from "@/lib/admin/audit-logs";
import { getNotificationLogById, updateNotificationSendResult } from "@/lib/notifications/admin";
import { getEmailProviderConfig } from "@/lib/notifications/email/config";
import { resolveEmailProvider } from "@/lib/notifications/email/provider";
import { sanitizeNotificationPayload } from "@/lib/notifications/format";
import { NotificationTableMissingError } from "@/lib/notifications/logger";
import { containsSensitiveNotificationPayload, isManualEmailNotificationAllowed } from "@/lib/notifications/policy";
import { getNotificationRecipientEmail } from "@/lib/notifications/recipient";
import type { EmailProviderSendResult } from "@/lib/notifications/email/types";
import type { NotificationLogRecord, NotificationSendStatus } from "@/lib/notifications/types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminApiPermission(request, "notifications:write");
  if (auth.response) return auth.response;
  const adminCookie = getAdminCookie(request);

  if (!uuidPattern.test(params.id)) {
    return NextResponse.json({ success: false, message: "通知记录不存在。" }, { status: 404 });
  }

  try {
    const notification = await getNotificationLogById(params.id);
    if (!notification) {
      return NextResponse.json({ success: false, message: "通知记录不存在。" }, { status: 404 });
    }

    if (notification.channel !== "email") {
      return NextResponse.json({ success: false, message: "当前仅支持邮件通知单条操作。" }, { status: 400 });
    }

    if (notification.sendStatus === "sent") {
      return NextResponse.json({ success: false, message: "该通知已处理，不重复发送。" }, { status: 409 });
    }

    const providerConfig = getEmailProviderConfig();
    const manualSendBlockReason = getManualSendBlockReason(notification);
    const providerResult = manualSendBlockReason
      ? buildBlockedProviderResult(providerConfig.provider, manualSendBlockReason)
      : await resolveEmailProvider().send({
          to: {
            name: notification.recipientName,
            email: getNotificationRecipientEmail(notification)
          },
          from: providerConfig.from,
          fromName: providerConfig.fromName,
          replyTo: providerConfig.replyTo,
          subject: notification.subject || "ITCA 通知",
          messageBody: notification.messageBody,
          templateKey: notification.templateKey || `manual.${notification.notificationType}`,
          payloadJson: sanitizeNotificationPayload(notification.payloadJson || {}),
          allowRealSend: true
        });
    const now = new Date().toISOString();
    const sendStatus = providerResult.sendStatus;
    const updated = await updateNotificationSendResult(notification.id, {
      sendStatus,
      provider: providerResult.provider,
      providerMessageId: providerResult.providerMessageId,
      providerResponse: {
        provider: providerResult.provider,
        mode: providerConfig.mode,
        configured: providerConfig.configured,
        manualSendEnabled: Boolean(providerConfig.manualSendEnabled),
        manualAction: "single_notification_send",
        skippedReason: providerResult.skippedReason,
        ...sanitizeNotificationPayload(providerResult.providerResponse || {})
      },
      errorMessage: getStatusMessage(sendStatus, providerResult.errorMessage),
      sentAt: sendStatus === "sent" ? now : null,
      failedAt: sendStatus === "failed" ? now : null,
      skippedAt: sendStatus === "skipped" ? now : null
    });

    await writeAuditBestEffort(request, adminCookie, notification.id, notification.notificationType, sendStatus, providerResult.provider);

    return NextResponse.json({
      success: true,
      message: getResponseMessage(sendStatus, providerResult.errorMessage),
      notification: updated
        ? {
            id: updated.id,
            channel: updated.channel,
            sendStatus: updated.sendStatus,
            provider: updated.provider,
            statusTime: updated.sentAt || updated.failedAt || updated.skippedAt || ""
          }
        : null
    });
  } catch (error) {
    if (error instanceof NotificationTableMissingError) {
      return NextResponse.json({ success: false, message: "通知记录表尚未创建。" }, { status: 500 });
    }

    return NextResponse.json({ success: false, message: "通知发送操作暂时不可用，请稍后重试。" }, { status: 500 });
  }
}

function getStatusMessage(status: NotificationSendStatus, providerErrorMessage?: string) {
  if (status === "sent") return "";
  if (status === "skipped") return providerErrorMessage || "本次未真实发送邮件，已记录为跳过。";
  return providerErrorMessage || "通知发送失败，请稍后重试。";
}

function getResponseMessage(status: NotificationSendStatus, providerErrorMessage?: string) {
  if (status === "sent") return "通知发送操作已完成。";
  if (status === "skipped") return providerErrorMessage || "本次未真实发送邮件，已记录为跳过。";
  return "通知发送失败，已记录失败原因。";
}

function getManualSendBlockReason(notification: NotificationLogRecord) {
  if (!isManualEmailNotificationAllowed(notification)) return "manual_send_notification_type_blocked";
  if (containsSensitiveNotificationPayload(notification.payloadJson)) return "manual_send_sensitive_payload_blocked";
  return "";
}

function buildBlockedProviderResult(provider: string, skippedReason: string): EmailProviderSendResult {
  return {
    ok: true,
    sendStatus: "skipped",
    provider,
    providerResponse: {
      provider,
      delivery: "blocked",
      skippedReason
    },
    errorMessage: getBlockedMessage(skippedReason),
    skippedReason
  };
}

function getBlockedMessage(reason: string) {
  if (reason === "manual_send_notification_type_blocked") return "该通知类型不允许在本阶段真实发送。";
  if (reason === "manual_send_sensitive_payload_blocked") return "通知 payload 含敏感字段，本阶段不允许发送。";
  return "该通知不符合本阶段手动发送安全边界。";
}

async function writeAuditBestEffort(
  request: Request,
  adminCookie: string | undefined,
  notificationId: string,
  notificationType: string,
  sendStatus: NotificationSendStatus,
  provider: string
) {
  try {
    const actor = getAdminSession(adminCookie);
    await createAuditLog({
      actorAdminId: actor?.adminId,
      actorEmail: actor?.email,
      actorName: actor?.displayName || "Legacy Admin",
      actorRole: actor?.role || "admin",
      actorType: actor?.actorType || "legacy_admin",
      action: sendStatus === "skipped" ? "notification.simulated_send" : "notification.manual_send",
      resourceType: "notification_log",
      resourceId: notificationId,
      resourceNo: notificationType,
      afterData: {
        sendStatus,
        provider
      },
      summary: sendStatus === "skipped" ? "后台执行单条通知模拟发送。" : "后台执行单条通知发送。",
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") || ""
    });
  } catch {
    // Audit logging is best-effort and must not block the notification operation.
  }
}
