import "server-only";

import { isMissingTableError, NotificationTableMissingError } from "./logger";
import type { ListNotificationLogsParams, NotificationLogRecord, NotificationSendStatus, NotificationChannel } from "./types";

type SupabaseNotificationConfig = {
  url: string;
  serviceRoleKey: string;
};

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

function getHeaders(config: SupabaseNotificationConfig) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json"
  };
}

export async function listNotificationLogs(params: ListNotificationLogsParams = {}) {
  const config = getSupabaseNotificationConfig();
  const searchParams = new URLSearchParams({
    select:
      "id,notification_type,channel,send_status,idempotency_key,application_id,certification_application_id,certificate_id,application_no,member_no,certificate_no,source_type,source_action,recipient_name,recipient_email,recipient_phone,subject,message_body,template_key,provider,provider_message_id,error_message,created_by,created_at,scheduled_at,sent_at,failed_at,skipped_at,updated_at",
    order: "created_at.desc",
    limit: String(Math.min(Math.max(params.limit || 50, 1), 100))
  });

  if (params.status) searchParams.set("send_status", `eq.${params.status}`);
  if (params.channel) searchParams.set("channel", `eq.${params.channel}`);

  const response = await fetch(`${config.url}/rest/v1/notification_logs?${searchParams.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    if (isMissingTableError(text, response.status)) throw new NotificationTableMissingError();
    throw new Error("Notification logs could not be read.");
  }

  const rows = (await response.json()) as Array<Record<string, string | null>>;
  return rows.map(toNotificationLogRecord);
}

function toNotificationLogRecord(row: Record<string, string | null>): NotificationLogRecord {
  return {
    id: row.id || "",
    notificationType: row.notification_type || "",
    channel: ((row.channel || "system") as NotificationChannel),
    sendStatus: ((row.send_status || "pending") as NotificationSendStatus),
    idempotencyKey: row.idempotency_key || "",
    applicationId: row.application_id || "",
    certificationApplicationId: row.certification_application_id || "",
    certificateId: row.certificate_id || "",
    applicationNo: row.application_no || "",
    memberNo: row.member_no || "",
    certificateNo: row.certificate_no || "",
    sourceType: row.source_type || "",
    sourceAction: row.source_action || "",
    recipientName: row.recipient_name || "",
    recipientEmail: row.recipient_email || "",
    recipientPhone: row.recipient_phone || "",
    subject: row.subject || "",
    messageBody: row.message_body || "",
    templateKey: row.template_key || "",
    provider: row.provider || "",
    providerMessageId: row.provider_message_id || "",
    errorMessage: row.error_message || "",
    createdBy: row.created_by || "",
    createdAt: row.created_at || "",
    scheduledAt: row.scheduled_at || "",
    sentAt: row.sent_at || "",
    failedAt: row.failed_at || "",
    skippedAt: row.skipped_at || "",
    updatedAt: row.updated_at || ""
  };
}
