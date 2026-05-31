export type NotificationChannel = "email" | "whatsapp" | "system" | "manual";

export type NotificationSendStatus = "pending" | "sent" | "failed" | "skipped";

export type NotificationType =
  | "member_application_submitted"
  | "organization_application_submitted"
  | "certification_application_submitted"
  | "member_application_approved"
  | "member_application_rejected"
  | "member_application_need_more_info"
  | "certification_application_approved"
  | "certification_application_rejected"
  | "certification_application_need_more_info"
  | "supplement_submitted"
  | "certificate_generated"
  | "certificate_pdf_generated"
  | "certificate_delivered"
  | "member_status_updated"
  | "certificate_status_updated"
  | string;

export type NotificationSafePayload = Record<string, unknown>;

export type NotificationLogInput = {
  notificationType: NotificationType;
  channel: NotificationChannel;
  sendStatus?: NotificationSendStatus;
  idempotencyKey?: string;
  applicationId?: string;
  certificationApplicationId?: string;
  certificateId?: string;
  applicationNo?: string;
  memberNo?: string;
  certificateNo?: string;
  sourceType?: string;
  sourceAction?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  subject?: string;
  messageBody: string;
  templateKey?: string;
  payloadJson?: NotificationSafePayload;
  provider?: string;
  providerMessageId?: string;
  providerResponse?: NotificationSafePayload;
  errorMessage?: string;
  createdBy?: string;
  scheduledAt?: string;
  sentAt?: string;
  failedAt?: string;
  skippedAt?: string;
};

export type NotificationLogRecord = Required<
  Pick<
    NotificationLogInput,
    | "notificationType"
    | "channel"
    | "sendStatus"
    | "messageBody"
  >
> & {
  id: string;
  idempotencyKey: string;
  applicationId: string;
  certificationApplicationId: string;
  certificateId: string;
  applicationNo: string;
  memberNo: string;
  certificateNo: string;
  sourceType: string;
  sourceAction: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  subject: string;
  templateKey: string;
  payloadJson: NotificationSafePayload;
  provider: string;
  providerMessageId: string;
  providerResponse: NotificationSafePayload;
  errorMessage: string;
  createdBy: string;
  createdAt: string;
  scheduledAt: string;
  sentAt: string;
  failedAt: string;
  skippedAt: string;
  updatedAt: string;
};

export type ListNotificationLogsParams = {
  limit?: number;
  status?: NotificationSendStatus;
  channel?: NotificationChannel;
};

export type UpdateNotificationSendResultInput = {
  sendStatus: NotificationSendStatus;
  provider: string;
  providerMessageId?: string;
  providerResponse?: NotificationSafePayload;
  errorMessage?: string;
  sentAt?: string | null;
  failedAt?: string | null;
  skippedAt?: string | null;
};

export type CreateNotificationLogResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; tableMissing?: boolean };
