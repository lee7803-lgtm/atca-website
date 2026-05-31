import "server-only";

import { NoneEmailProvider } from "./none-provider";
import type { EmailProviderName, EmailProviderSendInput, EmailProviderSendResult } from "./types";

export type EmailProvider = {
  readonly name: string;
  send(input: EmailProviderSendInput): Promise<EmailProviderSendResult>;
};

const reservedProviderNames = new Set(["resend", "smtp", "sendgrid", "other"]);

export function resolveEmailProvider(): EmailProvider {
  const providerName = normalizeEmailProviderName(process.env.ITCA_EMAIL_PROVIDER);
  if (providerName === "none") return new NoneEmailProvider();
  if (reservedProviderNames.has(providerName)) return new ReservedEmailProvider(providerName);
  return new UnsupportedEmailProvider(providerName);
}

export function normalizeEmailProviderName(value?: string): EmailProviderName {
  const providerName = (value || "none").trim().toLowerCase();
  return providerName || "none";
}

class ReservedEmailProvider implements EmailProvider {
  constructor(readonly name: string) {}

  async send(_input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const skippedReason = "email_provider_reserved_not_implemented";

    return {
      ok: true,
      sendStatus: "skipped",
      provider: this.name,
      providerResponse: {
        provider: this.name,
        delivery: "reserved_not_implemented",
        skippedReason
      },
      errorMessage: `Email provider "${this.name}" is reserved but not implemented.`,
      skippedReason
    };
  }
}

class UnsupportedEmailProvider implements EmailProvider {
  constructor(readonly name: string) {}

  async send(_input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const skippedReason = "email_provider_unsupported";

    return {
      ok: true,
      sendStatus: "skipped",
      provider: this.name,
      providerResponse: {
        provider: this.name,
        delivery: "unsupported",
        skippedReason
      },
      errorMessage: `Email provider "${this.name}" is not supported.`,
      skippedReason
    };
  }
}
