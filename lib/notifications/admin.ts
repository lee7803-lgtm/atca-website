import "server-only";

import { sanitizeNotificationPayload } from "./format";
import { isMissingTableError, NotificationTableMissingError } from "./logger";
import type { ListNotificationLogsParams, NotificationLogRecord, NotificationSendStatus, NotificationChannel, UpdateNotificationSendResultInput } from "./types";

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
      "id,notification_type,channel,send_status,idempotency_key,application_id,certification_application_id,certificate_id,application_no,member_no,certificate_no,source_type,source_action,recipient_name,recipient_email,recipient_phone,subject,message_body,template_key,payload_json,provider,provider_message_id,provider_response,error_message,created_by,created_at,scheduled_at,sent_at,failed_at,skipped_at,updated_at",
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

export async function listRelatedNotificationLogs(params: {
  applicationId?: string;
  certificationApplicationId?: string;
  applicationNo?: string;
  memberNo?: string;
  certificateNo?: string;
  limit?: number;
}) {
  const config = getSupabaseNotificationConfig();
  const orFilters = [
    params.applicationId ? `application_id.eq.${params.applicationId}` : "",
    params.certificationApplicationId ? `certification_application_id.eq.${params.certificationApplicationId}` : "",
    params.applicationNo ? `application_no.eq.${params.applicationNo}` : "",
    params.memberNo ? `member_no.eq.${params.memberNo}` : "",
    params.certificateNo ? `certificate_no.eq.${params.certificateNo}` : ""
  ].filter(Boolean);

  if (orFilters.length === 0) return [];

  const searchParams = new URLSearchParams({
    select:
      "id,notification_type,channel,send_status,application_id,certification_application_id,certificate_id,application_no,member_no,certificate_no,source_type,source_action,recipient_name,recipient_email,recipient_phone,template_key,error_message,created_at,scheduled_at,sent_at,failed_at,skipped_at,updated_at",
    or: `(${orFilters.join(",")})`,
    order: "updated_at.desc",
    limit: String(Math.min(Math.max(params.limit || 5, 1), 20))
  });

  const response = await fetch(`${config.url}/rest/v1/notification_logs?${searchParams.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    if (isMissingTableError(text, response.status)) throw new NotificationTableMissingError();
    throw new Error("Related notification logs could not be read.");
  }

  const rows = (await response.json()) as Array<Record<string, string | null>>;
  return rows.map(toNotificationLogRecord);
}

export async function getNotificationLogById(id: string) {
  const config = getSupabaseNotificationConfig();
  const searchParams = new URLSearchParams({
    select:
      "id,notification_type,channel,send_status,idempotency_key,application_id,certification_application_id,certificate_id,application_no,member_no,certificate_no,source_type,source_action,recipient_name,recipient_email,recipient_phone,subject,message_body,template_key,payload_json,provider,provider_message_id,provider_response,error_message,created_by,created_at,scheduled_at,sent_at,failed_at,skipped_at,updated_at",
    id: `eq.${id}`,
    limit: "1"
  });

  const response = await fetch(`${config.url}/rest/v1/notification_logs?${searchParams.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    if (isMissingTableError(text, response.status)) throw new NotificationTableMissingError();
    throw new Error("Notification log could not be read.");
  }

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? toNotificationLogRecord(rows[0]) : null;
}

export async function updateNotificationSendResult(id: string, input: UpdateNotificationSendResultInput) {
  const config = getSupabaseNotificationConfig();
  const searchParams = new URLSearchParams({ id: `eq.${id}` });
  const response = await fetch(`${config.url}/rest/v1/notification_logs?${searchParams.toString()}`, {
    method: "PATCH",
    headers: {
      ...getHeaders(config),
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      send_status: input.sendStatus,
      provider: input.provider || null,
      provider_message_id: input.providerMessageId || null,
      provider_response: sanitizeNotificationPayload(input.providerResponse || {}),
      error_message: input.errorMessage || null,
      sent_at: input.sentAt || null,
      failed_at: input.failedAt || null,
      skipped_at: input.skippedAt || null
    })
  });

  if (!response.ok) {
    const text = await response.text();
    if (isMissingTableError(text, response.status)) throw new NotificationTableMissingError();
    throw new Error("Notification log could not be updated.");
  }

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? toNotificationLogRecord(rows[0]) : null;
}

function toNotificationLogRecord(row: Record<string, unknown>): NotificationLogRecord {
  return {
    id: asString(row.id),
    notificationType: asString(row.notification_type),
    channel: ((asString(row.channel) || "system") as NotificationChannel),
    sendStatus: ((asString(row.send_status) || "pending") as NotificationSendStatus),
    idempotencyKey: asString(row.idempotency_key),
    applicationId: asString(row.application_id),
    certificationApplicationId: asString(row.certification_application_id),
    certificateId: asString(row.certificate_id),
    applicationNo: asString(row.application_no),
    memberNo: asString(row.member_no),
    certificateNo: asString(row.certificate_no),
    sourceType: asString(row.source_type),
    sourceAction: asString(row.source_action),
    recipientName: asString(row.recipient_name),
    recipientEmail: asString(row.recipient_email),
    recipientPhone: asString(row.recipient_phone),
    subject: asString(row.subject),
    messageBody: asString(row.message_body),
    templateKey: asString(row.template_key),
    payloadJson: toSafePayload(row.payload_json),
    provider: asString(row.provider),
    providerMessageId: asString(row.provider_message_id),
    providerResponse: toSafePayload(row.provider_response),
    errorMessage: asString(row.error_message),
    createdBy: asString(row.created_by),
    createdAt: asString(row.created_at),
    scheduledAt: asString(row.scheduled_at),
    sentAt: asString(row.sent_at),
    failedAt: asString(row.failed_at),
    skippedAt: asString(row.skipped_at),
    updatedAt: asString(row.updated_at)
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toSafePayload(value: unknown) {
  return sanitizeNotificationPayload(value || {});
}
