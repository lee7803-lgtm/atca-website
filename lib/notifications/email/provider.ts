import "server-only";

import { getEmailProviderConfig, normalizeEmailProviderName } from "./config";
import { NoneEmailProvider } from "./none-provider";
import { ResendEmailProvider } from "./resend-provider";
import type { EmailProviderSendInput, EmailProviderSendResult } from "./types";

export type EmailProvider = {
  readonly name: string;
  send(input: EmailProviderSendInput): Promise<EmailProviderSendResult>;
};

export function resolveEmailProvider(): EmailProvider {
  const config = getEmailProviderConfig();
  const providerName = normalizeEmailProviderName(config.provider);
  if (providerName === "none") return new NoneEmailProvider();
  if (providerName === "resend") return new ResendEmailProvider(config);
  if (["smtp", "sendgrid", "other"].includes(providerName)) return new ReservedEmailProvider(config);
  return new UnsupportedEmailProvider(providerName);
}

class ReservedEmailProvider implements EmailProvider {
  readonly name: string;

  constructor(private readonly config: ReturnType<typeof getEmailProviderConfig>) {
    this.name = config.provider;
  }

  async send(_input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const skippedReason = this.config.configured ? "email_provider_reserved_not_implemented" : "email_provider_configuration_incomplete";

    return {
      ok: true,
      sendStatus: "skipped",
      provider: this.name,
      providerResponse: {
        provider: this.name,
        mode: this.config.mode,
        configured: this.config.configured,
        delivery: this.config.configured ? "reserved_not_implemented" : "configuration_incomplete",
        skippedReason
      },
      errorMessage: this.config.safeMessage,
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
