import "server-only";

import { buildNotificationIdempotencyKey, sanitizeNotificationPayload } from "./format";
import type { CreateNotificationLogResult, NotificationLogInput } from "./types";

type SupabaseNotificationConfig = {
  url: string;
  serviceRoleKey: string;
};

export class NotificationTableMissingError extends Error {
  constructor() {
    super("notification_logs table is missing.");
  }
}

function getSupabaseNotificationConfig(): SupabaseNotificationConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase notification configuration: ${missing.join(", ")}`);
  }

  return { url: url as string, serviceRoleKey: serviceRoleKey as string };
}

function getHeaders(config: SupabaseNotificationConfig, prefer?: string) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

export async function createNotificationLog(input: NotificationLogInput): Promise<CreateNotificationLogResult> {
  try {
    const config = getSupabaseNotificationConfig();
    const idempotencyKey = input.idempotencyKey || buildNotificationIdempotencyKey(input);
    const sendStatus = input.sendStatus || "pending";
    const now = new Date().toISOString();

    const response = await fetch(`${config.url}/rest/v1/notification_logs`, {
      method: "POST",
      headers: getHeaders(config, "return=representation,resolution=ignore-duplicates"),
      body: JSON.stringify({
        notification_type: input.notificationType,
        channel: input.channel,
        send_status: sendStatus,
        idempotency_key: idempotencyKey || null,
        application_id: input.applicationId || null,
        certification_application_id: input.certificationApplicationId || null,
        certificate_id: input.certificateId || null,
        application_no: input.applicationNo || null,
        member_no: input.memberNo || null,
        certificate_no: input.certificateNo || null,
        source_type: input.sourceType || null,
        source_action: input.sourceAction || null,
        recipient_name: input.recipientName || null,
        recipient_email: input.recipientEmail || null,
        recipient_phone: input.recipientPhone || null,
        subject: input.subject || null,
        message_body: input.messageBody,
        template_key: input.templateKey || null,
        payload_json: sanitizeNotificationPayload(input.payloadJson || {}),
        provider: input.provider || null,
        provider_message_id: input.providerMessageId || null,
        provider_response: sanitizeNotificationPayload(input.providerResponse || {}),
        error_message: input.errorMessage || null,
        created_by: input.createdBy || "system",
        scheduled_at: input.scheduledAt || null,
        sent_at: input.sentAt || (sendStatus === "sent" ? now : null),
        failed_at: input.failedAt || (sendStatus === "failed" ? now : null),
        skipped_at: input.skippedAt || (sendStatus === "skipped" ? now : null)
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: normalizeNotificationError(text), tableMissing: isMissingTableError(text, response.status) };
    }

    const rows = (await response.json().catch(() => [])) as Array<{ id?: string }>;
    return { ok: true, id: rows[0]?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Notification log write failed." };
  }
}

export function isMissingTableError(value: string, status?: number) {
  return status === 404 || /notification_logs|PGRST205|could not find|does not exist|schema cache/i.test(value);
}

export function normalizeNotificationError(value: string) {
  if (isMissingTableError(value)) return "通知记录暂未完成环境配置，请联系技术管理员处理。";
  return "通知记录暂时无法写入。";
}
