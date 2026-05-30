import type { ApplicationType } from "@/types/application";

const publicSuffixAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const applicationPrefix: Record<ApplicationType, string> = {
  personal_member: "ARID-ITCA-M",
  organization_member: "ARID-ITCA-ORG"
};

function formatDateSegment(date: Date) {
  return `${date.getFullYear()}`;
}

function generatePublicSuffix() {
  const cryptoApi = globalThis.crypto;
  const values = new Uint32Array(6);
  cryptoApi.getRandomValues(values);

  return Array.from(values, (value) => publicSuffixAlphabet[value % publicSuffixAlphabet.length]).join("");
}

export function generateApplicationNo(applicationType: ApplicationType, date = new Date()) {
  const dateSegment = formatDateSegment(date);
  const sequence = generatePublicSuffix();

  return `${applicationPrefix[applicationType]}-${dateSegment}-${sequence}`;
}

export function generateCertificationApplicationNo(date = new Date()) {
  const dateSegment = formatDateSegment(date);
  const sequence = `${Math.floor(1 + Math.random() * 999999)}`.padStart(6, "0");

  return `ARID-ITCA-TAO-${dateSegment}-${sequence}`;
}

export function generateCertificateNo(date = new Date()) {
  const dateSegment = formatDateSegment(date);
  const sequence = `${Math.floor(1 + Math.random() * 999999)}`.padStart(6, "0");

  return `ITCA-TAO-${dateSegment}-${sequence}`;
}
