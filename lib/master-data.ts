import "server-only";

import type { MasterDataEntry, MasterDataKind, MasterDataReviewStatus, MasterDataSource, MasterDataStatus } from "@/types/master-data";

type Config = {
  url: string;
  serviceRoleKey: string;
};

export class MasterDataTableMissingError extends Error {
  constructor() {
    super("master_data_entries table is missing.");
  }
}

function getConfig(): Config {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [!url ? "NEXT_PUBLIC_SUPABASE_URL" : "", !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""].filter(Boolean);
  if (missing.length > 0) throw new Error(`Missing Supabase master data configuration: ${missing.join(", ")}`);
  return { url: url as string, serviceRoleKey: serviceRoleKey as string };
}

function headers(config: Config, prefer?: string) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

export async function listMasterDataEntries(params: { kind?: MasterDataKind; publicOnly?: boolean; limit?: number } = {}) {
  const config = getConfig();
  const searchParams = new URLSearchParams({
    select: "id,kind,name,display_name,type,country,region,status,review_status,source,phone,email,note,internal_note,created_at,updated_at",
    order: "updated_at.desc",
    limit: String(Math.min(Math.max(params.limit || 80, 1), 200))
  });
  if (params.kind) searchParams.set("kind", `eq.${params.kind}`);
  if (params.publicOnly) {
    searchParams.set("status", "eq.active");
    searchParams.set("review_status", "eq.approved");
  }

  const response = await fetch(`${config.url}/rest/v1/master_data_entries?${searchParams.toString()}`, {
    method: "GET",
    headers: headers(config),
    cache: "no-store"
  });
  if (!response.ok) {
    const text = await response.text();
    if (isMissingTableError(text, response.status)) throw new MasterDataTableMissingError();
    throw new Error("Master data could not be read.");
  }
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows.map(toEntry);
}

export async function createMasterDataEntry(input: {
  kind: MasterDataKind;
  name: string;
  displayName?: string;
  type?: string;
  country?: string;
  region?: string;
  status?: MasterDataStatus;
  reviewStatus?: MasterDataReviewStatus;
  source?: MasterDataSource;
  phone?: string;
  email?: string;
  note?: string;
  internalNote?: string;
}) {
  const config = getConfig();
  const now = new Date().toISOString();
  const body = {
    kind: input.kind,
    name: input.name.trim(),
    display_name: (input.displayName || input.name).trim(),
    type: input.type || "",
    country: input.country || "",
    region: input.region || "",
    status: input.status || "active",
    review_status: input.reviewStatus || "approved",
    source: input.source || "admin_created",
    phone: input.phone || "",
    email: input.email || "",
    note: input.note || "",
    internal_note: input.internalNote || "",
    created_at: now,
    updated_at: now
  };
  const response = await fetch(`${config.url}/rest/v1/master_data_entries`, {
    method: "POST",
    headers: headers(config, "return=representation"),
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text();
    if (isMissingTableError(text, response.status)) throw new MasterDataTableMissingError();
    throw new Error("Master data could not be created.");
  }
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  return rows[0] ? toEntry(rows[0]) : null;
}

function isMissingTableError(value: string, status?: number) {
  return status === 404 || /master_data_entries|PGRST205|could not find|does not exist|schema cache/i.test(value);
}

function toEntry(row: Record<string, unknown>): MasterDataEntry {
  return {
    id: asString(row.id),
    kind: asString(row.kind) as MasterDataKind,
    name: asString(row.name),
    displayName: asString(row.display_name) || asString(row.name),
    type: asString(row.type),
    country: asString(row.country),
    region: asString(row.region),
    status: (asString(row.status) || "active") as MasterDataStatus,
    reviewStatus: (asString(row.review_status) || "pending") as MasterDataReviewStatus,
    source: (asString(row.source) || "admin_created") as MasterDataSource,
    phone: asString(row.phone),
    email: asString(row.email),
    note: asString(row.note),
    internalNote: asString(row.internal_note),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at)
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}
