import "server-only";

import { Resend } from "resend";
import type { getEmailProviderConfig } from "./config";
import type { EmailProviderSendInput, EmailProviderSendResult } from "./types";

type ResendProviderConfig = ReturnType<typeof getEmailProviderConfig>;

export class ResendEmailProvider {
  readonly name = "resend";

  constructor(private readonly config: ResendProviderConfig) {}

  async send(input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const apiKey = getResendApiKey();
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
        to: input.to.email as string,
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
  if (!config.canSend) return "email_provider_manual_send_disabled";
  if (!input.allowRealSend) return "email_provider_real_send_not_allowed";
  if (!input.to.email) return "email_recipient_missing";
  if (!input.from) return "email_sender_missing";
  return "";
}

function getSkippedMessage(reason: string) {
  if (reason === "email_provider_dry_run") return "Resend is in dry-run mode.";
  if (reason === "email_provider_manual_send_disabled") return "Resend manual sending is not enabled.";
  if (reason === "email_provider_real_send_not_allowed") return "Real sending is not allowed for this notification path.";
  if (reason === "email_provider_api_key_missing") return "Resend API key is not configured.";
  if (reason === "email_recipient_missing") return "Recipient email is missing.";
  if (reason === "email_sender_missing") return "Sender email is missing.";
  return "Resend email provider configuration is incomplete.";
}

function formatFromAddress(email: string, name?: string) {
  const safeName = name?.replace(/[<>"\r\n]/g, "").trim();
  return safeName ? `${safeName} <${email}>` : email;
}

function getResendApiKey() {
  return (process.env.ITCA_EMAIL_PROVIDER_API_KEY || process.env.ITCA_RESEND_API_KEY || "").trim();
}
