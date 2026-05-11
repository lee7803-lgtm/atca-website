import type { ApplicationQueryResult, ApplicationRecord } from "@/types/application";

type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

type SupabaseApplicationRow = {
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
