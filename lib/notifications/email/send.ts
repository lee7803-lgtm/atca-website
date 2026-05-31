import "server-only";

import { buildNotificationIdempotencyKey } from "../format";
import { createNotificationLog } from "../logger";
import { buildEmailNotificationTemplate } from "../templates";
import { resolveEmailProvider } from "./provider";
import type { SendEmailNotificationInput, SendEmailNotificationResult } from "./types";

export async function sendEmailNotification(input: SendEmailNotificationInput): Promise<SendEmailNotificationResult> {
  try {
    const template = buildEmailNotificationTemplate({
      notificationType: input.notificationType,
      recipientName: input.recipientName,
      applicantName: input.applicantName,
      organizationName: input.organizationName,
      applicationNo: input.applicationNo,
      memberNo: input.memberNo,
      certificateNo: input.certificateNo,
      nextStep: input.nextStep,
      publicQueryUrl: input.publicQueryUrl,
      applicationQueryUrl: input.applicationQueryUrl,
      certificateQueryUrl: input.certificateQueryUrl,
      payloadJson: input.payloadJson
    });
    const provider = resolveEmailProvider();
    const providerResult = await provider.send({
      to: {
        name: input.recipientName || input.applicantName || input.organizationName,
        email: input.recipientEmail
      },
      from: process.env.ITCA_EMAIL_FROM,
      replyTo: process.env.ITCA_EMAIL_REPLY_TO,
      subject: template.subject,
      messageBody: template.messageBody,
      templateKey: template.templateKey,
      payloadJson: template.payloadJson
    });
    const sendStatus = providerResult.sendStatus;
    const idempotencyKey = input.idempotencyKey || buildNotificationIdempotencyKey({
      notificationType: input.notificationType,
      channel: "email",
      applicationNo: input.applicationNo,
      memberNo: input.memberNo,
      certificateNo: input.certificateNo,
      sourceAction: input.sourceAction || template.templateKey
    });

    const logResult = await createNotificationLog({
      notificationType: input.notificationType,
      channel: "email",
      sendStatus,
      idempotencyKey,
      applicationId: input.applicationId,
      certificationApplicationId: input.certificationApplicationId,
      certificateId: input.certificateId,
      applicationNo: input.applicationNo,
      memberNo: input.memberNo,
      certificateNo: input.certificateNo,
      sourceType: input.sourceType || "email_notification",
      sourceAction: input.sourceAction || template.templateKey,
      recipientName: input.recipientName || input.applicantName || input.organizationName,
      recipientEmail: input.recipientEmail,
      subject: template.subject,
      messageBody: template.messageBody,
      templateKey: template.templateKey,
      payloadJson: template.payloadJson,
      provider: providerResult.provider,
      providerMessageId: providerResult.providerMessageId,
      providerResponse: providerResult.providerResponse,
      errorMessage: providerResult.errorMessage,
      createdBy: input.createdBy || "system"
    });

    if (!logResult.ok) {
      return {
        ok: false,
        status: sendStatus,
        provider: providerResult.provider,
        error: logResult.error
      };
    }

    return {
      ok: providerResult.ok,
      status: sendStatus,
      notificationLogId: logResult.id,
      provider: providerResult.provider,
      error: providerResult.errorMessage
    };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      provider: "none",
      error: error instanceof Error ? error.message : "Email notification failed."
    };
  }
}
