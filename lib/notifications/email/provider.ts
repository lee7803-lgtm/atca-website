import "server-only";

import { NoneEmailProvider } from "./none-provider";
import type { EmailProviderSendInput, EmailProviderSendResult } from "./types";

export type EmailProvider = {
  readonly name: string;
  send(input: EmailProviderSendInput): Promise<EmailProviderSendResult>;
};

export function resolveEmailProvider(): EmailProvider {
  const providerName = (process.env.ITCA_EMAIL_PROVIDER || "none").trim().toLowerCase() || "none";
  if (providerName === "none") return new NoneEmailProvider();
  return new UnsupportedEmailProvider(providerName);
}

class UnsupportedEmailProvider implements EmailProvider {
  constructor(readonly name: string) {}

  async send(_input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    return {
      ok: false,
      sendStatus: "failed",
      provider: this.name,
      providerResponse: {
        provider: this.name,
        delivery: "unsupported"
      },
      errorMessage: `Email provider "${this.name}" is not implemented.`
    };
  }
}
