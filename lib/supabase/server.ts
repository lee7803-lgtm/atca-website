import type { ApplicationAdminRecord, ApplicationQueryResult, ApplicationRecord, ApplicationStatus, ApplicationType, OrganizationType } from "@/types/application";
import type {
  CertificateQueryResult,
  CertificateRecord,
  CertificationAttachment,
  CertificationApplicationAdminRecord,
  CertificationApplicationRecord,
  CertificationStatus
} from "@/types/certification";

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
  truth_confirmed: boolean | null;
  terms_accepted: boolean | null;
  privacy_accepted: boolean | null;
  confirmed_at: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type SupabaseCertificationApplicationRow = {
  id: string;
  application_no: string;
  certification_type: string | null;
  applicant_name: string;
  applicant_name_en: string | null;
  taoist_name: string | null;
  gender: string | null;
  birth_date: string | null;
  nationality: string | null;
  residence: string | null;
  phone: string;
  email: string;
  address: string | null;
  master_name: string | null;
  master_taoist_name: string | null;
  lineage: string | null;
  temple_or_organization: string | null;
  sect: string | null;
  practice_years: string | null;
  experience_summary: string | null;
  application_reason: string | null;
  additional_note: string | null;
  existing_certificates: unknown;
  supporting_documents: unknown;
  declaration_accepted: boolean | null;
  ethics_confirmed: boolean | null;
  boundary_confirmed: boolean | null;
  data_use_accepted: boolean | null;
  certificate_public_accepted: boolean | null;
  terms_accepted: boolean | null;
  privacy_accepted: boolean | null;
  confirmed_at: string | null;
  status: string;
  review_note: string | null;
  internal_review_note: string | null;
  applicant_feedback: string | null;
  reviewer: string | null;
  reviewed_at: string | null;
  delivery_status: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

type SupabaseCertificateRow = {
  id: string;
  certificate_no: string;
  application_id: string;
  holder_name: string;
  taoist_name: string | null;
  taoist_rank: string | null;
  sect: string | null;
  issued_date: string;
  valid_from: string;
  valid_until: string;
  status: string;
  public_query_enabled: boolean | null;
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

export function isSupabaseSchemaError(error: unknown) {
  if (!(error instanceof SupabaseRequestError)) return false;
  const message = error.message.toLowerCase();

  return (
    error.status === 404 ||
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    message.includes("could not find") ||
    message.includes("column")
  );
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
    truth_confirmed: application.truthConfirmed,
    terms_accepted: application.termsAccepted,
    privacy_accepted: application.privacyAccepted,
    confirmed_at: application.confirmedAt,
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

function toCertificationQueryResult(
  row: Pick<SupabaseCertificationApplicationRow, "id" | "application_no" | "applicant_name" | "status" | "review_note" | "applicant_feedback" | "delivery_status" | "delivered_at" | "created_at" | "updated_at">,
  certificateNo?: string
): ApplicationQueryResult {
  return {
    applicationNo: row.application_no,
    applicationType: "taoist_certification",
    name: row.applicant_name,
    status: row.status as ApplicationQueryResult["status"],
    adminNote: row.applicant_feedback ?? row.review_note ?? "",
    certificateNo,
    certificateDetailUrl: certificateNo ? `/certificates/${encodeURIComponent(certificateNo)}` : undefined,
    deliveryStatus: row.delivery_status === "delivered" ? "delivered" : "not_delivered",
    deliveredAt: row.delivered_at,
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
    truthConfirmed: row.truth_confirmed ?? false,
    termsAccepted: row.terms_accepted ?? false,
    privacyAccepted: row.privacy_accepted ?? false,
    confirmedAt: row.confirmed_at ?? "",
    adminNote: row.admin_note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toCertificationRow(application: CertificationApplicationRecord) {
  return {
    application_no: application.applicationNo,
    certification_type: application.certificationType,
    applicant_name: application.applicantName,
    applicant_name_en: application.applicantNameEn,
    taoist_name: application.taoistName,
    gender: application.gender,
    birth_date: application.birthDate || null,
    nationality: application.nationality,
    residence: application.residence,
    phone: application.phone,
    email: application.email,
    address: application.address,
    master_name: application.masterName,
    master_taoist_name: application.masterTaoistName,
    lineage: application.lineage,
    temple_or_organization: application.templeOrOrganization,
    sect: application.sect,
    practice_years: application.practiceYears,
    experience_summary: application.experienceSummary,
    application_reason: application.applicationReason,
    additional_note: application.additionalNote,
    existing_certificates: application.existingCertificates,
    supporting_documents: application.supportingDocuments,
    declaration_accepted: application.declarationAccepted,
    ethics_confirmed: application.ethicsConfirmed,
    boundary_confirmed: application.boundaryConfirmed,
    data_use_accepted: application.dataUseAccepted,
    certificate_public_accepted: application.certificatePublicAccepted,
    terms_accepted: application.termsAccepted,
    privacy_accepted: application.privacyAccepted,
    confirmed_at: application.confirmedAt,
    status: application.status,
    review_note: application.reviewNote,
    internal_review_note: application.internalReviewNote,
    applicant_feedback: application.applicantFeedback,
    reviewer: application.reviewer,
    reviewed_at: application.reviewedAt,
    delivery_status: application.deliveryStatus,
    delivered_at: application.deliveredAt,
    created_at: application.createdAt,
    updated_at: application.updatedAt
  };
}

function normalizeAttachments(value: unknown, fallbackFieldName: string): CertificationAttachment[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return { originalName: item, fieldName: fallbackFieldName };
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const originalName = String(record.original_name || record.originalName || "").trim();
        const storagePath = String(record.storage_path || record.storagePath || "").trim();
        const mimeType = String(record.mime_type || record.mimeType || "").trim();
        const fieldName = String(record.field_name || record.fieldName || fallbackFieldName).trim();
        const uploadedAt = String(record.uploaded_at || record.uploadedAt || "").trim();
        const size = Number(record.size);

        if (!originalName && !storagePath) return null;

        return {
          originalName: originalName || storagePath,
          storagePath: storagePath || undefined,
          mimeType: mimeType || undefined,
          size: Number.isFinite(size) ? size : undefined,
          fieldName,
          uploadedAt: uploadedAt || undefined
        };
      })
      .filter((item): item is CertificationAttachment => Boolean(item));
  }

  if (typeof value === "string") {
    return value
      .split("；")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({ originalName: item, fieldName: fallbackFieldName }));
  }

  return [];
}

function toCertificationAdminRecord(row: SupabaseCertificationApplicationRow): CertificationApplicationAdminRecord {
  return {
    id: row.id,
    applicationNo: row.application_no,
    certificationType: (row.certification_type || "taoist_priest") as CertificationApplicationAdminRecord["certificationType"],
    applicantName: row.applicant_name,
    applicantNameEn: row.applicant_name_en ?? "",
    taoistName: row.taoist_name ?? "",
    gender: row.gender ?? "",
    birthDate: row.birth_date ?? "",
    nationality: row.nationality ?? "",
    residence: row.residence ?? "",
    phone: row.phone,
    email: row.email,
    address: row.address ?? "",
    masterName: row.master_name ?? "",
    masterTaoistName: row.master_taoist_name ?? "",
    lineage: row.lineage ?? "",
    templeOrOrganization: row.temple_or_organization ?? "",
    sect: row.sect ?? "",
    practiceYears: row.practice_years ?? "",
    experienceSummary: row.experience_summary ?? "",
    applicationReason: row.application_reason ?? "",
    additionalNote: row.additional_note ?? "",
    existingCertificates: normalizeAttachments(row.existing_certificates, "existing_certificates"),
    supportingDocuments: normalizeAttachments(row.supporting_documents, "supporting_documents"),
    declarationAccepted: row.declaration_accepted ?? false,
    ethicsConfirmed: row.ethics_confirmed ?? row.data_use_accepted ?? false,
    boundaryConfirmed: row.boundary_confirmed ?? row.certificate_public_accepted ?? false,
    dataUseAccepted: row.data_use_accepted ?? row.ethics_confirmed ?? false,
    certificatePublicAccepted: row.certificate_public_accepted ?? row.boundary_confirmed ?? false,
    termsAccepted: row.terms_accepted ?? false,
    privacyAccepted: row.privacy_accepted ?? false,
    confirmedAt: row.confirmed_at ?? "",
    status: row.status as CertificationStatus,
    reviewNote: row.review_note ?? "",
    internalReviewNote: row.internal_review_note ?? "",
    applicantFeedback: row.applicant_feedback ?? row.review_note ?? "",
    reviewer: row.reviewer ?? "",
    reviewedAt: row.reviewed_at,
    deliveryStatus: row.delivery_status === "delivered" ? "delivered" : "not_delivered",
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toCertificateRow(certificate: CertificateRecord) {
  return {
    certificate_no: certificate.certificateNo,
    application_id: certificate.applicationId,
    holder_name: certificate.holderName,
    taoist_name: certificate.taoistName,
    taoist_rank: certificate.taoistRank,
    sect: certificate.sect,
    issued_date: certificate.issuedDate,
    valid_from: certificate.validFrom,
    valid_until: certificate.validUntil,
    status: certificate.status,
    public_query_enabled: certificate.publicQueryEnabled,
    created_at: certificate.createdAt,
    updated_at: certificate.updatedAt
  };
}

function toCertificateQueryResult(row: SupabaseCertificateRow): CertificateQueryResult {
  return {
    certificateNo: row.certificate_no,
    holderName: row.holder_name,
    certificationType: row.taoist_rank || "道士资格认证",
    issuer: "International Taoisme And Cultural Association",
    issuedDate: row.issued_date,
    status: row.status as CertificateQueryResult["status"],
    detailUrl: `/certificates/${encodeURIComponent(row.certificate_no)}`
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

export async function findApplicationByNoAndContact(applicationNo: string, contact: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    application_no: `eq.${applicationNo}`,
    or: `(email.eq.${contact},phone.eq.${contact})`,
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

export async function findApplicationsByIdentity(filters: {
  applicationType: ApplicationType;
  name: string;
  contact: string;
  contactName?: string;
}) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    application_type: `eq.${filters.applicationType}`,
    name: `eq.${filters.name}`,
    or: `(email.eq.${filters.contact},phone.eq.${filters.contact})`,
    select: "application_no,application_type,name,status,admin_note,created_at,updated_at",
    order: "created_at.desc",
    limit: "10"
  });

  if (filters.contactName) params.set("contact_name", `eq.${filters.contactName}`);

  const response = await fetch(`${config.url}/rest/v1/applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as Array<Pick<SupabaseApplicationRow, "application_no" | "application_type" | "name" | "status" | "admin_note" | "created_at" | "updated_at">>;

  return rows.map(toApplicationQueryResult);
}

export async function findCertificationByNoAndContact(applicationNo: string, contact: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    application_no: `eq.${applicationNo}`,
    or: `(email.eq.${contact},phone.eq.${contact})`,
    select: "id,application_no,applicant_name,status,review_note,applicant_feedback,delivery_status,delivered_at,created_at,updated_at",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/certification_applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as Array<Pick<SupabaseCertificationApplicationRow, "id" | "application_no" | "applicant_name" | "status" | "review_note" | "applicant_feedback" | "delivery_status" | "delivered_at" | "created_at" | "updated_at">>;
  const row = rows[0];
  const certificate = row ? await findCertificateByApplicationIdSafe(row.id) : null;

  return row ? toCertificationQueryResult(row, certificate?.certificateNo) : null;
}

export async function findCertificationsByIdentity(filters: { applicantName: string; taoistName: string; contact: string }) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    applicant_name: `eq.${filters.applicantName}`,
    taoist_name: `eq.${filters.taoistName}`,
    or: `(email.eq.${filters.contact},phone.eq.${filters.contact})`,
    select: "id,application_no,applicant_name,status,review_note,applicant_feedback,delivery_status,delivered_at,created_at,updated_at",
    order: "created_at.desc",
    limit: "10"
  });
  const response = await fetch(`${config.url}/rest/v1/certification_applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as Array<Pick<SupabaseCertificationApplicationRow, "id" | "application_no" | "applicant_name" | "status" | "review_note" | "applicant_feedback" | "delivery_status" | "delivered_at" | "created_at" | "updated_at">>;

  const results: ApplicationQueryResult[] = [];
  for (const row of rows) {
    const certificate = await findCertificateByApplicationIdSafe(row.id);
    results.push(toCertificationQueryResult(row, certificate?.certificateNo));
  }

  return results;
}

export async function listApplications(filters: { applicationType?: ApplicationType; status?: ApplicationStatus } = {}) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    select:
      "id,application_no,application_type,status,name,contact_name,phone,email,country,organization_type,profile,purpose,receive_notice,truth_confirmed,terms_accepted,privacy_accepted,confirmed_at,admin_note,created_at,updated_at",
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
    select:
      "id,application_no,application_type,status,name,contact_name,phone,email,country,organization_type,profile,purpose,receive_notice,truth_confirmed,terms_accepted,privacy_accepted,confirmed_at,admin_note,created_at,updated_at",
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

export async function insertCertificationApplication(application: CertificationApplicationRecord) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/certification_applications`, {
    method: "POST",
    headers: getHeaders(config, "return=representation"),
    body: JSON.stringify(toCertificationRow(application))
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  return application;
}

export async function listCertificationApplications(filters: { status?: CertificationStatus; q?: string } = {}) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    select: "*",
    order: "created_at.desc"
  });

  if (filters.status) params.set("status", `eq.${filters.status}`);
  if (filters.q) params.set("or", `(application_no.ilike.*${filters.q}*,applicant_name.ilike.*${filters.q}*,taoist_name.ilike.*${filters.q}*)`);

  const response = await fetch(`${config.url}/rest/v1/certification_applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseCertificationApplicationRow[];

  return rows.map(toCertificationAdminRecord);
}

export async function getCertificationApplicationById(id: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    id: `eq.${id}`,
    select: "*",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/certification_applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseCertificationApplicationRow[];
  const row = rows[0];

  return row ? toCertificationAdminRecord(row) : null;
}

export async function updateCertificationReview(
  id: string,
  values: {
    status: CertificationStatus;
    reviewNote?: string;
    internalReviewNote?: string;
    applicantFeedback?: string;
    reviewer: string;
    deliveryStatus?: "not_delivered" | "delivered";
    deliveredAt?: string | null;
  }
) {
  const config = getSupabaseConfig();
  const now = new Date().toISOString();
  const body: Record<string, string | null> = {
    status: values.status,
    reviewer: values.reviewer,
    reviewed_at: now,
    updated_at: now
  };

  if (values.reviewNote !== undefined) body.review_note = values.reviewNote;
  if (values.internalReviewNote !== undefined) body.internal_review_note = values.internalReviewNote;
  if (values.applicantFeedback !== undefined) body.applicant_feedback = values.applicantFeedback;
  if (values.deliveryStatus !== undefined) body.delivery_status = values.deliveryStatus;
  if (values.deliveredAt !== undefined) body.delivered_at = values.deliveredAt;

  const response = await fetch(`${config.url}/rest/v1/certification_applications?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: getHeaders(config, "return=representation"),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseCertificationApplicationRow[];
  const row = rows[0];

  return row ? toCertificationAdminRecord(row) : null;
}

export async function deleteCertificateByNo(certificateNo: string) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/certificates?certificate_no=eq.${encodeURIComponent(certificateNo)}`, {
    method: "DELETE",
    headers: getHeaders(config)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }
}

export async function insertCertificate(certificate: CertificateRecord) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/certificates`, {
    method: "POST",
    headers: getHeaders(config, "return=representation"),
    body: JSON.stringify(toCertificateRow(certificate))
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  return certificate;
}

export async function findCertificateByApplicationId(applicationId: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    application_id: `eq.${applicationId}`,
    select: "*",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/certificates?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseCertificateRow[];
  const row = rows[0];

  return row ? toCertificateQueryResult(row) : null;
}

export async function findPublicCertificateByNo(certificateNo: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    certificate_no: `eq.${certificateNo}`,
    public_query_enabled: "eq.true",
    select: "*",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/certificates?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseCertificateRow[];
  const row = rows[0];

  return row ? toCertificateQueryResult(row) : null;
}

async function findCertificateByApplicationIdSafe(applicationId: string) {
  try {
    return await findCertificateByApplicationId(applicationId);
  } catch (error) {
    if (isSupabaseSchemaError(error)) return null;
    throw error;
  }
}

export async function checkCertificatesTableConfigured() {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    select: "id",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/certificates?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  return true;
}

const certificationDocumentsBucket = "certification-documents";

function sanitizeStorageName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "document";
}

export async function uploadCertificationAttachment(params: {
  applicationNo: string;
  fieldName: string;
  file: File;
  category: "existing_certificates" | "supporting_documents";
  uploadedAt: string;
}) {
  const config = getSupabaseConfig();
  const originalName = params.file.name || "document";
  const timestamp = params.uploadedAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const storagePath = `certification-applications/${params.applicationNo}/${params.category}/${params.fieldName}/${timestamp}-${sanitizeStorageName(originalName)}`;
  const response = await fetch(`${config.url}/storage/v1/object/${certificationDocumentsBucket}/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": params.file.type || "application/octet-stream",
      "x-upsert": "false"
    },
    body: params.file
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  return {
    originalName,
    storagePath,
    mimeType: params.file.type || "application/octet-stream",
    size: params.file.size,
    fieldName: params.fieldName,
    uploadedAt: params.uploadedAt
  } satisfies CertificationAttachment;
}

export async function createCertificationAttachmentSignedUrl(storagePath: string, expiresIn = 3600) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/storage/v1/object/sign/${certificationDocumentsBucket}/${storagePath}`, {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify({ expiresIn })
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const data = (await response.json()) as { signedURL?: string; signedUrl?: string };
  const signedPath = data.signedURL || data.signedUrl || "";

  return signedPath.startsWith("http") ? signedPath : `${config.url}/storage/v1${signedPath}`;
}

export async function findCertificateByNoAndHolder(certificateNo: string, holderName: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    certificate_no: `eq.${certificateNo}`,
    holder_name: `eq.${holderName}`,
    public_query_enabled: "eq.true",
    select: "*",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/certificates?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseCertificateRow[];
  const row = rows[0];

  return row ? toCertificateQueryResult(row) : null;
}
