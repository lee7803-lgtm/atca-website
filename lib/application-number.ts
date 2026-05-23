import type { ApplicationType } from "@/types/application";

const typePrefix: Record<ApplicationType, "M"> = {
  personal_member: "M",
  organization_member: "M"
};

function formatDateSegment(date: Date) {
  return `${date.getFullYear()}`;
}

export function generateApplicationNo(applicationType: ApplicationType, date = new Date()) {
  const dateSegment = formatDateSegment(date);

  // Temporary sequence placeholder. Replace with a database-backed yearly sequence when Supabase is connected.
  const sequence = `${Math.floor(1 + Math.random() * 999999)}`.padStart(6, "0");

  return `ITCA-${typePrefix[applicationType]}-${dateSegment}-${sequence}`;
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
