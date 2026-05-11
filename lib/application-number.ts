import type { ApplicationType } from "@/types/application";

const typePrefix: Record<ApplicationType, "M" | "O"> = {
  personal_member: "M",
  organization_member: "O"
};

function formatDateSegment(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}${month}${day}`;
}

export function generateApplicationNo(applicationType: ApplicationType, date = new Date()) {
  const dateSegment = formatDateSegment(date);

  // Temporary sequence placeholder. Replace with a database-backed daily sequence when Supabase is connected.
  const sequence = `${Math.floor(1 + Math.random() * 9999)}`.padStart(4, "0");

  return `ATCA-${typePrefix[applicationType]}-${dateSegment}-${sequence}`;
}
