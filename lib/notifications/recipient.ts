import type { NotificationLogRecord, NotificationSafePayload } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getNotificationRecipientEmail(notification: Pick<NotificationLogRecord, "recipientEmail" | "payloadJson">) {
  return getFirstValidEmail([
    notification.recipientEmail,
    ...getPayloadEmailCandidates(notification.payloadJson)
  ]);
}

export function normalizeNotificationEmail(value?: string) {
  return (value || "").trim().toLowerCase();
}

export function isValidNotificationEmail(value?: string) {
  return emailPattern.test(normalizeNotificationEmail(value));
}

function getFirstValidEmail(candidates: string[]) {
  for (const candidate of candidates) {
    const normalized = normalizeNotificationEmail(candidate);
    if (isValidNotificationEmail(normalized)) return normalized;
  }
  return "";
}

function getPayloadEmailCandidates(payload: NotificationSafePayload) {
  return [
    getString(payload.recipientEmail),
    getString(payload.email),
    getString(payload.contactEmail),
    getString(payload.contact_email),
    getString(payload.recipient),
    getNestedString(payload.to, "email"),
    getNestedString(payload.recipient, "email")
  ].filter(Boolean);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getNestedString(value: unknown, key: string) {
  if (!isRecord(value)) return "";
  return getString(value[key]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
