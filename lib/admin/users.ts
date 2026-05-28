import "server-only";

import { scryptSync, timingSafeEqual } from "node:crypto";

type SupabaseAdminConfig = {
  url: string;
  serviceRoleKey: string;
};

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: "super_admin" | "admin" | "reviewer" | "viewer";
  status: "active" | "disabled";
};

function getSupabaseAdminConfig(): SupabaseAdminConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return { url, serviceRoleKey };
}

function getHeaders(config: SupabaseAdminConfig, prefer?: string) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

function toAdminUser(row: Record<string, unknown>): AdminUser | null {
  if (
    typeof row.id !== "string" ||
    typeof row.email !== "string" ||
    typeof row.display_name !== "string" ||
    typeof row.password_hash !== "string" ||
    typeof row.role !== "string" ||
    typeof row.status !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    role: row.role as AdminUser["role"],
    status: row.status as AdminUser["status"]
  };
}

export async function findActiveAdminUserByEmail(email: string) {
  const config = getSupabaseAdminConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    email: `eq.${email.toLowerCase()}`,
    status: "eq.active",
    select: "id,email,display_name,password_hash,role,status",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/admin_users?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) return null;

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  const row = rows[0];

  return row ? toAdminUser(row) : null;
}

export async function touchAdminLastLogin(adminId: string) {
  const config = getSupabaseAdminConfig();
  if (!config) return;

  await fetch(`${config.url}/rest/v1/admin_users?id=eq.${encodeURIComponent(adminId)}`, {
    method: "PATCH",
    headers: getHeaders(config),
    body: JSON.stringify({ last_login_at: new Date().toISOString() })
  }).catch(() => undefined);
}

export function verifyPasswordHash(password: string, passwordHash: string) {
  const parts = passwordHash.split("$");
  if (parts.length !== 7 || parts[0] !== "scrypt") return false;

  const [, nValue, rValue, pValue, saltValue, hashValue, keyLengthValue] = parts;
  const n = Number(nValue);
  const r = Number(rValue);
  const p = Number(pValue);
  const keyLength = Number(keyLengthValue);

  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p) || !Number.isInteger(keyLength)) {
    return false;
  }

  try {
    const salt = Buffer.from(saltValue, "base64");
    const expected = Buffer.from(hashValue, "base64");
    const received = scryptSync(password, salt, keyLength, { N: n, r, p });

    return received.length === expected.length && timingSafeEqual(received, expected);
  } catch {
    return false;
  }
}
