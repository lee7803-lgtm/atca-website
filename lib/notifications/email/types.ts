import type { NotificationSafePayload, NotificationSendStatus, NotificationType } from "../types";

export type EmailProviderName = "none" | "resend" | "smtp" | "sendgrid" | "other" | string;

export type EmailProviderMode = "none" | "dry-run" | "reserved" | "unavailable";

export type EmailProviderStatus = {
  provider: EmailProviderName;
  mode: EmailProviderMode;
  configured: boolean;
  canSend: boolean;
  displayName: string;
  safeMessage: string;
  dryRun: boolean;
  missingConfig: string[];
};

export type EmailRecipient = {
  name?: string;
  email?: string;
};

export type EmailProviderSendInput = {
  to: EmailRecipient;
  from?: string;
  replyTo?: string;
  subject: string;
  messageBody: string;
  templateKey: string;
  payloadJson?: NotificationSafePayload;
};

export type EmailProviderSendResult = {
  ok: boolean;
  sendStatus: NotificationSendStatus;
  provider: EmailProviderName;
  providerMessageId?: string;
  providerResponse?: NotificationSafePayload;
  errorMessage?: string;
  skippedReason?: string;
};

export type SendEmailNotificationInput = {
  notificationType: NotificationType;
  recipientName?: string;
  recipientEmail?: string;
  applicantName?: string;
  organizationName?: string;
  applicationId?: string;
  certificationApplicationId?: string;
  certificateId?: string;
  applicationNo?: string;
  memberNo?: string;
  certificateNo?: string;
  sourceType?: string;
  sourceAction?: string;
  idempotencyKey?: string;
  createdBy?: string;
  nextStep?: string;
  publicQueryUrl?: string;
  applicationQueryUrl?: string;
  certificateQueryUrl?: string;
  payloadJson?: NotificationSafePayload;
};

export type SendEmailNotificationResult = {
  ok: boolean;
  status: NotificationSendStatus;
  notificationLogId?: string;
  provider: EmailProviderName;
  providerMessageId?: string;
  errorMessage?: string;
  skippedReason?: string;
  error?: string;
};
