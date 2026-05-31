import type { EmailProviderSendInput, EmailProviderSendResult } from "./types";

export class NoneEmailProvider {
  readonly name = "none";

  async send(_input: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    return {
      ok: true,
      sendStatus: "skipped",
      provider: this.name,
      providerResponse: {
        provider: this.name,
        delivery: "not_configured"
      },
      errorMessage: "Email provider is not configured."
    };
  }
}
