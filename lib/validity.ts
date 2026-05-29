export type EffectiveValidity = {
  effectiveStatus: string;
  effectiveStatusLabel: string;
  daysUntilExpiry: number | null;
  expiryBucket: string;
};

const expiringSoonDays = 60;

export function getMemberEffectiveValidity(params: {
  memberStatus?: string | null;
  memberRenewalStatus?: string | null;
  memberValidUntil?: string | null;
  today?: Date;
}): EffectiveValidity {
  const memberStatus = normalize(params.memberStatus);
  const renewalStatus = normalize(params.memberRenewalStatus);
  const validUntil = parseDateOnly(params.memberValidUntil);
  const today = toDateOnly(params.today || new Date());

  if (memberStatus === "revoked") return build("revoked", "已撤销", validUntil, today);
  if (memberStatus === "terminated") return build("terminated", "已终止", validUntil, today);
  if (memberStatus === "suspended") return build("terminated", "已终止", validUntil, today);
  if (!validUntil) return build("validity_not_set", "有效期未设置", validUntil, today);

  const days = diffDays(validUntil, today);
  if (days < 0) return build("expired", "已过期", validUntil, today);
  if (days <= expiringSoonDays) return build("expiring_soon", "即将到期", validUntil, today);
  if (renewalStatus === "pending_renewal") return build("pending_renewal", "待续期", validUntil, today);
  if (renewalStatus === "pending_review") return build("renewal_in_progress", "续期中", validUntil, today);
  if (renewalStatus === "renewed") return build("renewed", "已续期", validUntil, today);
  return build("active", "有效", validUntil, today);
}

export function getCertificateEffectiveValidity(params: {
  status?: string | null;
  certificateReviewStatus?: string | null;
  validUntil?: string | null;
  today?: Date;
}): EffectiveValidity {
  const status = normalize(params.status);
  const reviewStatus = normalize(params.certificateReviewStatus);
  const validUntil = parseDateOnly(params.validUntil);
  const today = toDateOnly(params.today || new Date());

  if (status === "revoked") return build("revoked", "已撤销", validUntil, today);
  if (status === "pending") return build("pending", "待签发", validUntil, today);
  if (!validUntil) return build("validity_not_set", "有效期未设置", validUntil, today);

  const days = diffDays(validUntil, today);
  if (days < 0) return build("expired", "已过期", validUntil, today);
  if (days <= expiringSoonDays) return build("expiring_soon", "即将到期", validUntil, today);
  if (reviewStatus === "pending_renewal") return build("pending_renewal", "待续期", validUntil, today);
  if (reviewStatus === "pending_review") return build("renewal_in_progress", "续期中", validUntil, today);
  if (reviewStatus === "reviewed" || reviewStatus === "renewed") return build("renewed", "已续期", validUntil, today);
  return build("valid", "有效", validUntil, today);
}

export function formatExpiryHint(daysUntilExpiry?: number | null, fallback = "有效期未设置") {
  if (daysUntilExpiry === null || daysUntilExpiry === undefined) return fallback;
  if (daysUntilExpiry < 0) return "已过期";
  if (daysUntilExpiry <= 7) return "7 天内到期";
  if (daysUntilExpiry <= 30) return "30 天内到期";
  if (daysUntilExpiry <= 60) return "60 天内到期";
  return "有效";
}

function build(status: string, label: string, validUntil: Date | null, today: Date): EffectiveValidity {
  const days = validUntil ? diffDays(validUntil, today) : null;
  return {
    effectiveStatus: status,
    effectiveStatusLabel: label,
    daysUntilExpiry: days,
    expiryBucket: getExpiryBucket(days)
  };
}

function getExpiryBucket(days: number | null) {
  if (days === null) return "not_set";
  if (days < 0) return "expired";
  if (days <= 7) return "within_7_days";
  if (days <= 30) return "within_30_days";
  if (days <= expiringSoonDays) return "within_60_days";
  return "active";
}

function parseDateOnly(value?: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function toDateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function diffDays(left: Date, right: Date) {
  return Math.round((left.getTime() - right.getTime()) / 86400000);
}

function normalize(value?: string | null) {
  return (value || "").trim().toLowerCase();
}
