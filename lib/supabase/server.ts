import type { ApplicationAdminRecord, ApplicationQueryResult, ApplicationRecord, ApplicationStatus, ApplicationType, OrganizationType } from "@/types/application";

type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

type SupabaseApplicationRow = {
  id: string;
  application_no: string;
  application_type: string;
  status: string;
  name: string;
  contact_name: string | null;
  phone: string;
  email: string;
  country: string;
  organization_type: string | null;
  profile: string | null;
  purpose: string | null;
  receive_notice: boolean | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export class SupabaseConfigError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing Supabase environment variables: ${missing.join(", ")}`);
  }
}

export class SupabaseRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

function getSupabaseConfig(): SupabaseConfig {
  const config = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new SupabaseConfigError(missing);
  }

  return {
    url: config.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY
  } as SupabaseConfig;
}

function getHeaders(config: SupabaseConfig, prefer?: string) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

function toSupabaseRow(application: ApplicationRecord) {
  return {
    application_no: application.applicationNo,
    application_type: application.applicationType,
    status: application.status,
    name: application.name,
    contact_name: application.contactName,
    phone: application.phone,
    email: application.email,
    country: application.country,
    organization_type: application.organizationType ?? null,
    profile: application.profile,
    purpose: application.purpose,
    receive_notice: application.receiveNotice ?? false,
    admin_note: application.adminNote ?? "",
    created_at: application.createdAt,
    updated_at: application.updatedAt
  };
}

function toApplicationQueryResult(row: Pick<SupabaseApplicationRow, "application_no" | "application_type" | "name" | "status" | "admin_note" | "created_at" | "updated_at">): ApplicationQueryResult {
  return {
    applicationNo: row.application_no,
    applicationType: row.application_type as ApplicationQueryResult["applicationType"],
    name: row.name,
    status: row.status as ApplicationQueryResult["status"],
    adminNote: row.admin_note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toApplicationAdminRecord(row: SupabaseApplicationRow): ApplicationAdminRecord {
  return {
    id: row.id,
    applicationNo: row.application_no,
    applicationType: row.application_type as ApplicationType,
    status: row.status as ApplicationStatus,
    name: row.name,
    contactName: row.contact_name ?? "",
    phone: row.phone,
    email: row.email,
    country: row.country,
    organizationType: row.organization_type as OrganizationType | null,
    profile: row.profile ?? "",
    purpose: row.purpose ?? "",
    receiveNotice: row.receive_notice ?? false,
    adminNote: row.admin_note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function readSupabaseError(response: Response) {
  try {
    const error = (await response.json()) as { message?: string; details?: string };
    return error.message || error.details || "Supabase request failed.";
  } catch {
    return "Supabase request failed.";
  }
}

export async function insertApplication(application: ApplicationRecord) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/applications`, {
    method: "POST",
    headers: getHeaders(config, "return=representation"),
    body: JSON.stringify(toSupabaseRow(application))
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  return application;
}

export async function findApplicationByNoAndEmail(applicationNo: string, email: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    application_no: `eq.${applicationNo}`,
    email: `eq.${email}`,
    select: "application_no,application_type,name,status,admin_note,created_at,updated_at",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as Array<Pick<SupabaseApplicationRow, "application_no" | "application_type" | "name" | "status" | "admin_note" | "created_at" | "updated_at">>;
  const row = rows[0];

  return row ? toApplicationQueryResult(row) : null;
}

export async function listApplications(filters: { applicationType?: ApplicationType; status?: ApplicationStatus } = {}) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    select: "id,application_no,application_type,status,name,contact_name,phone,email,country,organization_type,profile,purpose,receive_notice,admin_note,created_at,updated_at",
    order: "created_at.desc"
  });

  if (filters.applicationType) params.set("application_type", `eq.${filters.applicationType}`);
  if (filters.status) params.set("status", `eq.${filters.status}`);

  const response = await fetch(`${config.url}/rest/v1/applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseApplicationRow[];

  return rows.map(toApplicationAdminRecord);
}

export async function getApplicationById(id: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    id: `eq.${id}`,
    select: "id,application_no,application_type,status,name,contact_name,phone,email,country,organization_type,profile,purpose,receive_notice,admin_note,created_at,updated_at",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseApplicationRow[];
  const row = rows[0];

  return row ? toApplicationAdminRecord(row) : null;
}

export async function updateApplicationReview(id: string, values: { status: ApplicationStatus; adminNote: string }) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/applications?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: getHeaders(config, "return=representation"),
    body: JSON.stringify({
      status: values.status,
      admin_note: values.adminNote,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseApplicationRow[];
  const row = rows[0];

  return row ? toApplicationAdminRecord(row) : null;
}
