import "server-only";

import { Resend } from "resend";
import { getEmailAllowedTestRecipients, isEmailAllowedTestRecipient, isValidEmailAddress, normalizeEmailAddress } from "./config";
import type { getEmailProviderConfig } from "./config";
import type { EmailProviderSendInput, EmailProviderSendResult } from "./types";

type ResendProviderConfig = ReturnType<typeof getEmailProviderConfig>;

export class ResendEmailProvider {
  readonly name = "resend";

  constructor(private readonly config: ResendProviderConfig) {}

  async send(input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const apiKey = getResendApiKey();
    const recipientEmail = normalizeEmailAddress(input.to.email);
    const skippedReason = getSkippedReason(this.config, input, apiKey);
    if (skippedReason) {
      return {
        ok: true,
        sendStatus: "skipped",
        provider: this.name,
        providerResponse: {
          provider: this.name,
          mode: this.config.mode,
          configured: this.config.configured,
          manualSendEnabled: Boolean(this.config.manualSendEnabled),
          testRecipientAllowlistConfigured: Boolean(this.config.testRecipientAllowlistConfigured),
          delivery: "skipped",
          skippedReason
        },
        errorMessage: getSkippedMessage(skippedReason),
        skippedReason
      };
    }

    try {
      const resend = new Resend(apiKey);
      const response = await resend.emails.send({
        from: formatFromAddress(input.from as string, input.fromName || this.config.fromName),
        to: recipientEmail,
        replyTo: input.replyTo || this.config.replyTo,
        subject: input.subject,
        text: input.messageBody
      });

      if (response.error) {
        return {
          ok: false,
          sendStatus: "failed",
          provider: this.name,
          providerResponse: {
            provider: this.name,
            delivery: "rejected",
            errorCode: response.error.name,
            statusCode: response.error.statusCode
          },
          errorMessage: `Resend rejected the email request: ${response.error.name}.`
        };
      }

      return {
        ok: true,
        sendStatus: "sent",
        provider: this.name,
        providerMessageId: response.data.id,
        providerResponse: {
          provider: this.name,
          delivery: "accepted",
          messageId: response.data.id
        }
      };
    } catch (error) {
      return {
        ok: false,
        sendStatus: "failed",
        provider: this.name,
        providerResponse: {
          provider: this.name,
          delivery: "error"
        },
        errorMessage: error instanceof Error ? `Resend request failed: ${error.name}.` : "Resend request failed."
      };
    }
  }
}

function getSkippedReason(config: ResendProviderConfig, input: EmailProviderSendInput, apiKey: string) {
  if (!config.configured) return "email_provider_configuration_incomplete";
  if (config.dryRun) return "email_provider_dry_run";
  if (!apiKey) return "email_provider_api_key_missing";
  if (!config.manualSendEnabled) return "email_provider_manual_send_disabled";
  if (!input.allowRealSend) return "email_provider_real_send_not_allowed";
  const recipientEmail = normalizeEmailAddress(input.to.email);
  if (!recipientEmail) return "email_recipient_missing";
  if (!isValidEmailAddress(recipientEmail)) return "email_recipient_invalid";
  if (!input.from) return "email_sender_missing";
  if (getEmailAllowedTestRecipients().length === 0) return "email_test_recipient_allowlist_missing";
  if (!isEmailAllowedTestRecipient(recipientEmail)) return "email_recipient_not_in_test_allowlist";
  if (!config.canSend) return "email_provider_not_ready";
  return "";
}

function getSkippedMessage(reason: string) {
  if (reason === "email_provider_dry_run") return "Resend 当前为 dry-run，本次未真实发送邮件。";
  if (reason === "email_provider_manual_send_disabled") return "Resend manual send 未开启，本次未真实发送邮件。";
  if (reason === "email_provider_real_send_not_allowed") return "当前通知路径不允许真实发送。";
  if (reason === "email_provider_api_key_missing") return "Resend API key 未配置，本次未真实发送邮件。";
  if (reason === "email_recipient_missing") return "收件人邮箱缺失，本次未真实发送邮件。";
  if (reason === "email_recipient_invalid") return "收件人邮箱格式无效，本次未真实发送邮件。";
  if (reason === "email_sender_missing") return "发件邮箱缺失，本次未真实发送邮件。";
  if (reason === "email_test_recipient_allowlist_missing") return "测试收件人白名单未配置，本次未真实发送邮件。";
  if (reason === "email_recipient_not_in_test_allowlist") return "收件人不在测试白名单内，本次未真实发送邮件。";
  if (reason === "email_provider_not_ready") return "Resend provider 尚未满足真实发送条件。";
  return "Resend 邮件配置未完成，本次未真实发送邮件。";
}

function formatFromAddress(email: string, name?: string) {
  const safeName = name?.replace(/[<>"\r\n]/g, "").trim();
  return safeName ? `${safeName} <${email}>` : email;
}

function getResendApiKey() {
  return (process.env.ITCA_EMAIL_PROVIDER_API_KEY || process.env.ITCA_RESEND_API_KEY || process.env.RESEND_API_KEY || "").trim();
}
