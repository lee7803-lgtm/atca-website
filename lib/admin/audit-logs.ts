import "server-only";

export type AuditLogRecord = {
  id: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceNo: string;
  summary: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
};

export type CreateAuditLogInput = {
  actorAdminId?: string;
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  actorType?: "admin" | "legacy_admin" | "system";
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceNo?: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  summary?: string;
  ipAddress?: string;
  userAgent?: string;
};

type SupabaseAuditConfig = {
  url: string;
  serviceRoleKey: string;
};

function getSupabaseAuditConfig(): SupabaseAuditConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
    !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : ""
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase audit configuration: ${missing.join(", ")}`);
  }

  return { url: url as string, serviceRoleKey: serviceRoleKey as string };
}

function getHeaders(config: SupabaseAuditConfig) {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json"
  };
}

export async function listAuditLogs(limit = 50) {
  const config = getSupabaseAuditConfig();
  const params = new URLSearchParams({
    select: "id,actor_email,actor_name,actor_role,actor_type,action,resource_type,resource_id,resource_no,summary,ip_address,user_agent,created_at",
    order: "created_at.desc",
    limit: String(Math.min(Math.max(limit, 1), 100))
  });
  const response = await fetch(`${config.url}/rest/v1/audit_logs?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Audit logs could not be read.");
  }

  const rows = (await response.json()) as Array<Record<string, string | null>>;
  return rows.map((row) => ({
    id: row.id || "",
    actorEmail: row.actor_email || "",
    actorName: row.actor_name || "",
    actorRole: row.actor_role || "",
    actorType: row.actor_type || "",
    action: row.action || "",
    resourceType: row.resource_type || "",
    resourceId: row.resource_id || "",
    resourceNo: row.resource_no || "",
    summary: row.summary || "",
    ipAddress: row.ip_address || "",
    userAgent: row.user_agent || "",
    createdAt: row.created_at || ""
  }));
}

export async function createAuditLog(input: CreateAuditLogInput) {
  const config = getSupabaseAuditConfig();
  const response = await fetch(`${config.url}/rest/v1/audit_logs`, {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify({
      actor_admin_id: input.actorAdminId || null,
      actor_email: input.actorEmail || null,
      actor_name: input.actorName || null,
      actor_role: input.actorRole || null,
      actor_type: input.actorType || "system",
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId || null,
      resource_no: input.resourceNo || null,
      before_data: input.beforeData || null,
      after_data: input.afterData || null,
      summary: input.summary || null,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null
    })
  });

  if (!response.ok) {
    throw new Error("Audit log could not be written.");
  }
}
