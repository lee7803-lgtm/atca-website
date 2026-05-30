const localhostBaseUrl = "http://localhost:3000";

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return "";
  }
}

export function getSiteBaseUrl() {
  const explicitUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL || "");
  if (explicitUrl) return explicitUrl;

  const vercelUrl = normalizeBaseUrl(process.env.VERCEL_URL || "");
  if (vercelUrl) return vercelUrl;

  return localhostBaseUrl;
}

export function getCertificateVerificationUrl() {
  return new URL("/certificate-query", getSiteBaseUrl()).toString();
}
