import type { ApplicationType } from "@/types/application";

const applicationPrefix: Record<ApplicationType, string> = {
  personal_member: "ARID-ITCA-M",
  organization_member: "ARID-ITCA-ORG"
};

export const applicationSequenceKey: Record<ApplicationType, string> = {
  personal_member: "application_member_personal",
  organization_member: "application_member_organization"
};

export const memberPrefix: Record<ApplicationType, string> = {
  personal_member: "ITCA-M",
  organization_member: "ITCA-ORG"
};

export const memberSequenceKey: Record<ApplicationType, string> = {
  personal_member: "member_personal",
  organization_member: "member_organization"
};

function formatDateSegment(date: Date) {
  return `${date.getFullYear()}`;
}

export function generateApplicationNo(applicationType: ApplicationType, date = new Date()) {
  const dateSegment = formatDateSegment(date);

  // Fallback only. Production numbering should use public.generate_itca_number.
  const sequence = `${Math.floor(1 + Math.random() * 999999)}`.padStart(6, "0");

  return `${applicationPrefix[applicationType]}-${dateSegment}-${sequence}`;
}

export function generateCertificationApplicationNo(date = new Date()) {
  const dateSegment = formatDateSegment(date);
  const sequence = `${Math.floor(1 + Math.random() * 999999)}`.padStart(6, "0");

  return `ITCA-TAO-${dateSegment}-${sequence}`;
}

export function generateCertificateNo(date = new Date()) {
  const dateSegment = formatDateSegment(date);
  const sequence = `${Math.floor(1 + Math.random() * 999999)}`.padStart(6, "0");

  return `ITCA-TAO-${dateSegment}-${sequence}`;
}
