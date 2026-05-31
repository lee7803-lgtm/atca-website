import "server-only";

import { buildNotificationIdempotencyKey } from "../format";
import { createNotificationLog } from "../logger";
import { buildEmailNotificationTemplate } from "../templates";
import { getEmailProviderConfig } from "./config";
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
    const config = getEmailProviderConfig();
    const provider = resolveEmailProvider();
    const providerResult = await provider.send({
      to: {
        name: input.recipientName || input.applicantName || input.organizationName,
        email: input.recipientEmail
      },
      from: config.from,
      fromName: config.fromName,
      replyTo: config.replyTo,
      subject: template.subject,
      messageBody: template.messageBody,
      templateKey: template.templateKey,
      payloadJson: template.payloadJson,
      allowRealSend: false
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
        providerMessageId: providerResult.providerMessageId,
        errorMessage: logResult.error,
        skippedReason: providerResult.skippedReason,
        error: logResult.error
      };
    }

    return {
      ok: providerResult.ok,
      status: sendStatus,
      notificationLogId: logResult.id,
      provider: providerResult.provider,
      providerMessageId: providerResult.providerMessageId,
      errorMessage: providerResult.errorMessage,
      skippedReason: providerResult.skippedReason,
      error: providerResult.errorMessage
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Email notification failed.";

    return {
      ok: false,
      status: "failed",
      provider: "none",
      errorMessage,
      error: errorMessage
    };
  }
}
