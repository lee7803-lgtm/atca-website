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
  const manualSendEnabled = parseBoolean(process.env.ITCA_EMAIL_MANUAL_SEND_ENABLED, false);
  const testRecipientAllowlist = getEmailAllowedTestRecipients();
  const testRecipientAllowlistConfigured = testRecipientAllowlist.length > 0;
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
      manualSendEnabled: false,
      testRecipientAllowlistConfigured,
      realSendBlockReasons: ["provider_none"],
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
      manualSendEnabled,
      testRecipientAllowlistConfigured,
      realSendBlockReasons: ["provider_unsupported"],
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
      manualSendEnabled,
      testRecipientAllowlistConfigured,
      realSendBlockReasons: getRealSendBlockReasons({
        provider,
        configured: false,
        dryRun,
        manualSendEnabled,
        testRecipientAllowlistConfigured,
        missingConfig
      }),
      missingConfig,
      from,
      fromName,
      replyTo
    };
  }

  if (provider === "resend") {
    const realSendBlockReasons = getRealSendBlockReasons({
      provider,
      configured: true,
      dryRun,
      manualSendEnabled,
      testRecipientAllowlistConfigured,
      missingConfig: []
    });
    const canSend = realSendBlockReasons.length === 0;
    return {
      provider,
      mode: dryRun ? "dry-run" : canSend ? "ready" : "reserved",
      configured: true,
      canSend,
      displayName: dryRun ? "Resend dry-run" : canSend ? "Resend 手动发送已就绪" : "Resend 已配置但未满足真实发送条件",
      safeMessage: dryRun
        ? "Resend 当前处于 dry-run，不会真实发送邮件。"
        : canSend
          ? "Resend 配置已识别，仅后台单条手动发送可调用真实邮件服务。"
          : "Resend 配置已识别，但仍有安全门闩未满足，不会真实发送邮件。",
      dryRun,
      manualSendEnabled,
      testRecipientAllowlistConfigured,
      realSendBlockReasons,
      missingConfig: [],
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
    manualSendEnabled,
    testRecipientAllowlistConfigured,
    realSendBlockReasons: ["provider_reserved_not_implemented"],
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

export function getEmailAllowedTestRecipients() {
  return Array.from(
    new Set(
      (process.env.ITCA_EMAIL_ALLOWED_TEST_RECIPIENTS || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function isEmailAllowedTestRecipient(email?: string) {
  const allowlist = getEmailAllowedTestRecipients();
  if (allowlist.length === 0) return false;
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && allowlist.includes(normalized));
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
      !getProviderApiKey(provider) ? "ITCA_EMAIL_PROVIDER_API_KEY/ITCA_RESEND_API_KEY/RESEND_API_KEY" : ""
    ].filter(Boolean);
  }
  if (provider === "sendgrid") {
    return [
      !common.from ? "ITCA_EMAIL_FROM" : "",
      !common.replyTo ? "ITCA_EMAIL_REPLY_TO" : "",
      !getProviderApiKey(provider) ? "ITCA_EMAIL_PROVIDER_API_KEY" : ""
    ].filter(Boolean);
  }
  if (provider === "other") {
    return [
      !common.from ? "ITCA_EMAIL_FROM" : "",
      !common.replyTo ? "ITCA_EMAIL_REPLY_TO" : "",
      !getProviderApiKey(provider) ? "ITCA_EMAIL_PROVIDER_API_KEY" : ""
    ].filter(Boolean);
  }
  return ["ITCA_EMAIL_PROVIDER"];
}

function getProviderApiKey(provider: EmailProviderName) {
  if (provider === "resend") return cleanEnv(process.env.ITCA_EMAIL_PROVIDER_API_KEY || process.env.ITCA_RESEND_API_KEY || process.env.RESEND_API_KEY);
  if (provider === "sendgrid") return cleanEnv(process.env.ITCA_EMAIL_PROVIDER_API_KEY || process.env.ITCA_SENDGRID_API_KEY);
  if (provider === "other") return cleanEnv(process.env.ITCA_EMAIL_PROVIDER_API_KEY);
  return undefined;
}

function getRealSendBlockReasons(input: {
  provider: EmailProviderName;
  configured: boolean;
  dryRun: boolean;
  manualSendEnabled: boolean;
  testRecipientAllowlistConfigured: boolean;
  missingConfig: string[];
}) {
  const reasons: string[] = [];
  if (input.provider === "none") reasons.push("provider_none");
  if (!input.configured || input.missingConfig.length > 0) reasons.push("configuration_incomplete");
  if (input.dryRun) reasons.push("dry_run_enabled");
  if (!input.manualSendEnabled) reasons.push("manual_send_disabled");
  if (input.provider === "resend" && !input.testRecipientAllowlistConfigured) reasons.push("test_recipient_allowlist_missing");
  if (input.provider !== "resend" && input.provider !== "none") reasons.push("provider_not_real_send_enabled");
  return reasons;
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
