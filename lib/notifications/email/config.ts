import "server-only";

import type { EmailProviderName, EmailProviderStatus } from "./types";

type EmailProviderConfig = EmailProviderStatus & {
  from?: string;
  fromName?: string;
  replyTo?: string;
};

const reservedProviderNames = new Set(["resend", "smtp", "sendgrid", "other"]);

export function getEmailProviderConfig(): EmailProviderConfig {
  const provider = normalizeEmailProviderName(process.env.ITCA_EMAIL_PROVIDER);
  const dryRun = parseBoolean(process.env.ITCA_EMAIL_DRY_RUN, true);
  const from = cleanEnv(process.env.ITCA_EMAIL_FROM);
  const fromName = cleanEnv(process.env.ITCA_EMAIL_FROM_NAME || process.env.ITCA_EMAIL_SENDER_NAME);
  const replyTo = cleanEnv(process.env.ITCA_EMAIL_REPLY_TO);
  const missingConfig = getMissingConfig(provider, { from, replyTo });

  if (provider === "none") {
    return {
      provider,
      mode: "none",
      configured: true,
      canSend: false,
      displayName: "模拟发送模式",
      safeMessage: "当前为模拟发送模式，不会真实发送邮件。",
      dryRun: true,
      missingConfig: [],
      from,
      fromName,
      replyTo
    };
  }

  if (!reservedProviderNames.has(provider)) {
    return {
      provider,
      mode: "unavailable",
      configured: false,
      canSend: false,
      displayName: "邮件 provider 不可用",
      safeMessage: "当前邮件 provider 不受支持，后台仅允许模拟发送或记录通知。",
      dryRun,
      missingConfig: ["ITCA_EMAIL_PROVIDER"],
      from,
      fromName,
      replyTo
    };
  }

  if (missingConfig.length > 0) {
    return {
      provider,
      mode: "unavailable",
      configured: false,
      canSend: false,
      displayName: "配置未完成",
      safeMessage: "邮件发送配置未完成，后台仅允许模拟发送或记录通知。",
      dryRun,
      missingConfig,
      from,
      fromName,
      replyTo
    };
  }

  return {
    provider,
    mode: dryRun ? "dry-run" : "reserved",
    configured: true,
    canSend: false,
    displayName: dryRun ? "预留 provider dry-run" : "预留 provider",
    safeMessage: "当前 provider 已配置为预留类型，但本版本尚未启用真实发送。",
    dryRun,
    missingConfig: [],
    from,
    fromName,
    replyTo
  };
}

export function normalizeEmailProviderName(value?: string): EmailProviderName {
  const providerName = (value || "none").trim().toLowerCase();
  return providerName || "none";
}

function getMissingConfig(provider: EmailProviderName, common: { from?: string; replyTo?: string }) {
  if (provider === "none") return [];
  if (provider === "smtp") {
    return [
      !common.from ? "ITCA_EMAIL_FROM" : "",
      !common.replyTo ? "ITCA_EMAIL_REPLY_TO" : "",
      !cleanEnv(process.env.ITCA_SMTP_HOST) ? "ITCA_SMTP_HOST" : "",
      !cleanEnv(process.env.ITCA_SMTP_PORT) ? "ITCA_SMTP_PORT" : "",
      !cleanEnv(process.env.ITCA_SMTP_USER) ? "ITCA_SMTP_USER" : "",
      !cleanEnv(process.env.ITCA_SMTP_PASSWORD) ? "ITCA_SMTP_PASSWORD" : ""
    ].filter(Boolean);
  }
  if (provider === "resend") {
    return [
      !common.from ? "ITCA_EMAIL_FROM" : "",
      !common.replyTo ? "ITCA_EMAIL_REPLY_TO" : "",
      !cleanEnv(process.env.ITCA_EMAIL_PROVIDER_API_KEY || process.env.ITCA_RESEND_API_KEY) ? "ITCA_EMAIL_PROVIDER_API_KEY" : ""
    ].filter(Boolean);
  }
  if (provider === "sendgrid") {
    return [
      !common.from ? "ITCA_EMAIL_FROM" : "",
      !common.replyTo ? "ITCA_EMAIL_REPLY_TO" : "",
      !cleanEnv(process.env.ITCA_EMAIL_PROVIDER_API_KEY || process.env.ITCA_SENDGRID_API_KEY) ? "ITCA_EMAIL_PROVIDER_API_KEY" : ""
    ].filter(Boolean);
  }
  if (provider === "other") {
    return [
      !common.from ? "ITCA_EMAIL_FROM" : "",
      !common.replyTo ? "ITCA_EMAIL_REPLY_TO" : "",
      !cleanEnv(process.env.ITCA_EMAIL_PROVIDER_API_KEY) ? "ITCA_EMAIL_PROVIDER_API_KEY" : ""
    ].filter(Boolean);
  }
  return ["ITCA_EMAIL_PROVIDER"];
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function cleanEnv(value: string | undefined) {
  const next = value?.trim();
  return next || undefined;
}
