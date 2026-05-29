import type { ApplicationAdminRecord, ApplicationQueryResult, ApplicationRecord, ApplicationStatus, ApplicationType, OrganizationType } from "@/types/application";
import { certificationLevelLabels } from "@/types/certification";
import { getCertificateEffectiveValidity, getMemberEffectiveValidity } from "@/lib/validity";
import type {
  CertificateQueryResult,
  CertificateRecord,
  CertificationAttachment,
  CertificationApplicationAdminRecord,
  CertificationApplicationRecord,
  CertificationLevel,
  CertificationPath,
  MaterialReview,
  MaterialReviewStatus,
  CertificationStatus,
  SupplementalSubmission
} from "@/types/certification";

type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

const publicNumberSuffixAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const publicNumberSuffixLength = 6;
const publicNumberMaxAttempts = 10;

type SupabaseApplicationRow = {
  id: string;
  application_no: string;
  member_no: string | null;
  member_no_issued_at: string | null;
  member_no_issued_by: string | null;
  member_valid_from: string | null;
  member_valid_until: string | null;
  member_status: string | null;
  member_renewal_status: string | null;
  last_renewed_at: string | null;
  member_status_note: string | null;
  application_no_scheme: string | null;
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
  supplemental_submissions: unknown;
  supplement_submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

type SupabaseCertificationApplicationRow = {
  id: string;
  application_no: string;
  certification_type: string | null;
  certification_path: string | null;
  requested_level: string | null;
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
  recommender_name: string | null;
  recommender_contact: string | null;
  recommender_relation: string | null;
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
  approved_path: string | null;
  approved_level: string | null;
  material_review: unknown;
  committee_review_note: string | null;
  certificate_photo_path: string | null;
  reviewer: string | null;
  reviewed_at: string | null;
  delivery_status: string | null;
  delivered_at: string | null;
  supplemental_submissions: unknown;
  supplement_submitted_at: string | null;
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
  certification_path: string | null;
  certification_level: string | null;
  lineage_or_temple: string | null;
  certificate_photo_path: string | null;
  issued_date: string;
  valid_from: string;
  valid_until: string;
  status: string;
  certificate_review_status: string | null;
  last_reviewed_at: string | null;
  certificate_status_note: string | null;
  public_query_enabled: boolean | null;
  created_at: string;
  updated_at: string;
};

const materialReviewKeys: Array<keyof MaterialReview> = [
  "identity",
  "lineage",
  "credential",
  "practice",
  "recommendation",
  "ethics",
  "photo",
  "completeness",
  "international"
];

const materialReviewStatuses: MaterialReviewStatus[] = ["pending", "passed", "need_more_info", "questionable", "not_applicable"];

function formatCertificationLevel(value: string | null, fallback: string) {
  if (value && value in certificationLevelLabels) return certificationLevelLabels[value as CertificationLevel];
  return value || fallback;
}

export const defaultMaterialReview: MaterialReview = {
  identity: "pending",
  lineage: "pending",
  credential: "pending",
  practice: "pending",
  recommendation: "pending",
  ethics: "pending",
  photo: "pending",
  completeness: "pending",
  international: "pending"
};

export function normalizeMaterialReview(value: unknown): MaterialReview {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...defaultMaterialReview };
  const record = value as Record<string, unknown>;
  const review = { ...defaultMaterialReview };

  materialReviewKeys.forEach((key) => {
    const status = record[key];
    if (typeof status === "string" && materialReviewStatuses.includes(status as MaterialReviewStatus)) {
      review[key] = status as MaterialReviewStatus;
    }
  });

  return review;
}

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

export async function generateItcaNumber(params: { prefix: string; year: number }) {
  const config = getSupabaseConfig();
  const columnName = params.prefix.startsWith("ARID-") ? "application_no" : "member_no";

  for (let attempt = 0; attempt < publicNumberMaxAttempts; attempt += 1) {
    const candidate = `${params.prefix}-${params.year}-${generatePublicNumberSuffix()}`;
    const response = await fetch(`${config.url}/rest/v1/applications?select=${columnName}&${columnName}=eq.${encodeURIComponent(candidate)}&limit=1`, {
      headers: getHeaders(config)
    });

    if (!response.ok) {
      throw new SupabaseRequestError(await readSupabaseError(response), response.status);
    }

    const rows = (await response.json()) as Array<Record<string, string>>;
    if (rows.length === 0) return candidate;
  }

  throw new SupabaseRequestError("Unable to generate a unique public ITCA number.", 500);
}

function generatePublicNumberSuffix() {
  const values = new Uint32Array(publicNumberSuffixLength);
  globalThis.crypto.getRandomValues(values);

  return Array.from(values, (value) => publicNumberSuffixAlphabet[value % publicNumberSuffixAlphabet.length]).join("");
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

async function writeAuditLog(entry: {
  action: string;
  resourceType: string;
  resourceId: string;
  resourceNo: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  actorType: string;
  beforeData: unknown;
  afterData: unknown;
  summary: string;
  ipAddress: string;
  userAgent: string;
}) {
  try {
    const config = getSupabaseConfig();
    await fetch(`${config.url}/rest/v1/audit_logs`, {
      method: "POST",
      headers: getHeaders(config),
      body: JSON.stringify({
        actor_email: entry.actorEmail || null,
        actor_name: entry.actorName || null,
        actor_role: entry.actorRole || null,
        actor_type: entry.actorType || "legacy_admin",
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        resource_no: entry.resourceNo,
        before_data: entry.beforeData,
        after_data: entry.afterData,
        summary: entry.summary,
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null
      })
    });
  } catch {
    // Audit logging is best effort in the Next.js fallback path.
  }
}

function toSupabaseRow(application: ApplicationRecord) {
  return {
    application_no: application.applicationNo,
    member_no: application.memberNo ?? null,
    member_no_issued_at: application.memberNoIssuedAt ?? null,
    member_no_issued_by: application.memberNoIssuedBy ?? null,
    application_no_scheme: application.applicationNoScheme ?? null,
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
    supplemental_submissions: application.supplementalSubmissions ?? [],
    supplement_submitted_at: application.supplementSubmittedAt ?? null,
    created_at: application.createdAt,
    updated_at: application.updatedAt
  };
}

function toApplicationQueryResult(
  row: Pick<SupabaseApplicationRow, "application_no" | "application_type" | "name" | "status" | "admin_note" | "created_at" | "updated_at"> &
    Partial<Pick<SupabaseApplicationRow, "member_no">> &
    Partial<Pick<SupabaseApplicationRow, "member_valid_from" | "member_valid_until" | "member_status" | "member_renewal_status">> &
    Partial<Pick<SupabaseApplicationRow, "contact_name" | "phone" | "email" | "country" | "profile" | "purpose" | "organization_type" | "supplement_submitted_at" | "supplemental_submissions">>
): ApplicationQueryResult {
  const supplementalSubmissions = normalizeSupplementalSubmissions(row.supplemental_submissions);
  const memberEffective = getMemberEffectiveValidity({
    memberStatus: row.member_status,
    memberRenewalStatus: row.member_renewal_status,
    memberValidUntil: row.member_valid_until
  });
  return {
    applicationNo: row.application_no,
    memberNo: row.member_no ?? null,
    applicationType: row.application_type as ApplicationQueryResult["applicationType"],
    name: row.name,
    status: row.status as ApplicationQueryResult["status"],
    adminNote: row.admin_note ?? "",
    memberValidFrom: row.member_valid_from ?? null,
    memberValidUntil: row.member_valid_until ?? null,
    memberEffectiveStatus: memberEffective.effectiveStatus,
    memberEffectiveStatusLabel: memberEffective.effectiveStatusLabel,
    supplementSubmittedAt: row.supplement_submitted_at ?? null,
    hasSupplementalSubmission: supplementalSubmissions.length > 0,
    editableData:
      row.status === "need_more_info"
        ? {
            name: row.name ?? "",
            contactName: row.contact_name ?? "",
            phone: row.phone ?? "",
            email: row.email ?? "",
            country: row.country ?? "",
            profile: row.profile ?? "",
            purpose: row.purpose ?? "",
            organizationType: row.organization_type ?? ""
          }
        : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toCertificationQueryResult(
  row: Pick<SupabaseCertificationApplicationRow, "id" | "application_no" | "applicant_name" | "status" | "review_note" | "applicant_feedback" | "delivery_status" | "delivered_at" | "created_at" | "updated_at"> &
    Partial<SupabaseCertificationApplicationRow>,
  certificate?: Partial<ApplicationQueryResult> & { certificateNo?: string }
): ApplicationQueryResult {
  const supplementalSubmissions = normalizeSupplementalSubmissions(row.supplemental_submissions);
  return {
    applicationNo: row.application_no,
    applicationType: "taoist_certification",
    name: row.applicant_name,
    status: row.status as ApplicationQueryResult["status"],
    adminNote: row.applicant_feedback ?? row.review_note ?? "",
    certificateNo: certificate?.certificateNo,
    certificateDetailUrl: certificate?.certificateNo ? `/certificates/${encodeURIComponent(certificate.certificateNo)}` : undefined,
    certificateStatus: certificate?.certificateStatus,
    certificateHolderName: certificate?.certificateHolderName,
    certificateTaoistName: certificate?.certificateTaoistName,
    certificationPath: certificate?.certificationPath,
    certificationLevel: certificate?.certificationLevel,
    certificateLineageOrTemple: certificate?.certificateLineageOrTemple,
    certificateIssuer: certificate?.certificateIssuer,
    certificateIssuedDate: certificate?.certificateIssuedDate,
    certificateValidFrom: certificate?.certificateValidFrom,
    certificateValidUntil: certificate?.certificateValidUntil,
    certificatePhotoUrl: certificate?.certificatePhotoUrl,
    certificatePhotoRecorded: certificate?.certificatePhotoRecorded,
    deliveryStatus: row.delivery_status === "delivered" ? "delivered" : "not_delivered",
    deliveredAt: row.delivered_at,
    supplementSubmittedAt: row.supplement_submitted_at ?? null,
    hasSupplementalSubmission: supplementalSubmissions.length > 0,
    editableData:
      row.status === "need_more_info"
        ? {
            applicantName: row.applicant_name ?? "",
            applicantNameEn: row.applicant_name_en ?? "",
            taoistName: row.taoist_name ?? "",
            gender: row.gender ?? "",
            birthDate: row.birth_date ?? "",
            nationality: row.nationality ?? "",
            residence: row.residence ?? "",
            phone: row.phone ?? "",
            email: row.email ?? "",
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
            recommenderName: row.recommender_name ?? "",
            recommenderContact: row.recommender_contact ?? "",
            recommenderRelation: row.recommender_relation ?? ""
          }
        : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toApplicationAdminRecord(row: SupabaseApplicationRow): ApplicationAdminRecord {
  const memberEffective = getMemberEffectiveValidity({
    memberStatus: row.member_status,
    memberRenewalStatus: row.member_renewal_status,
    memberValidUntil: row.member_valid_until
  });

  return {
    id: row.id,
    applicationNo: row.application_no,
    memberNo: row.member_no ?? "",
    memberNoIssuedAt: row.member_no_issued_at,
    memberNoIssuedBy: row.member_no_issued_by ?? "",
    memberValidFrom: row.member_valid_from ?? null,
    memberValidUntil: row.member_valid_until ?? null,
    memberStatus: row.member_status || "active",
    memberRenewalStatus: row.member_renewal_status || "none",
    lastRenewedAt: row.last_renewed_at,
    memberStatusNote: row.member_status_note || "",
    memberEffectiveStatus: memberEffective.effectiveStatus,
    memberEffectiveStatusLabel: memberEffective.effectiveStatusLabel,
    daysUntilExpiry: memberEffective.daysUntilExpiry,
    expiryBucket: memberEffective.expiryBucket,
    applicationNoScheme: row.application_no_scheme ?? "",
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
    supplementalSubmissions: normalizeSupplementalSubmissions(row.supplemental_submissions),
    supplementSubmittedAt: row.supplement_submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toCertificationRow(application: CertificationApplicationRecord) {
  return {
    application_no: application.applicationNo,
    certification_type: application.certificationType,
    certification_path: application.certificationPath || null,
    requested_level: application.requestedLevel || null,
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
    recommender_name: application.recommenderName,
    recommender_contact: application.recommenderContact,
    recommender_relation: application.recommenderRelation,
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
    approved_path: application.approvedPath || null,
    approved_level: application.approvedLevel || null,
    material_review: application.materialReview,
    committee_review_note: application.committeeReviewNote,
    certificate_photo_path: application.certificatePhotoPath || null,
    reviewer: application.reviewer,
    reviewed_at: application.reviewedAt,
    delivery_status: application.deliveryStatus,
    delivered_at: application.deliveredAt,
    supplemental_submissions: application.supplementalSubmissions,
    supplement_submitted_at: application.supplementSubmittedAt,
    created_at: application.createdAt,
    updated_at: application.updatedAt
  };
}

function findCertificatePhotoPath(attachments: CertificationAttachment[]) {
  return attachments.find((item) => item.fieldName === "photo" && item.storagePath)?.storagePath || "";
}

function normalizeAttachments(value: unknown, fallbackFieldName: string): CertificationAttachment[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    const attachments: CertificationAttachment[] = [];
    value.forEach((item) => {
        if (typeof item === "string") {
          attachments.push({ originalName: item, fieldName: fallbackFieldName });
          return;
        }
        if (!item || typeof item !== "object") return;
        const record = item as Record<string, unknown>;
        const originalName = String(record.original_name || record.originalName || "").trim();
        const storagePath = String(record.storage_path || record.storagePath || "").trim();
        const mimeType = String(record.mime_type || record.mimeType || "").trim();
        const fieldName = String(record.field_name || record.fieldName || fallbackFieldName).trim();
        const uploadedAt = String(record.uploaded_at || record.uploadedAt || "").trim();
        const source = String(record.source || "").trim();
        const supplementRound = Number(record.supplement_round || record.supplementRound);
        const size = Number(record.size);

        if (!originalName && !storagePath) return;

        attachments.push({
          originalName: originalName || storagePath,
          storagePath: storagePath || undefined,
          mimeType: mimeType || undefined,
          size: Number.isFinite(size) ? size : undefined,
          fieldName,
          uploadedAt: uploadedAt || undefined,
          source: source === "supplement" ? "supplement" : source === "application" ? "application" : undefined,
          supplementRound: Number.isFinite(supplementRound) ? supplementRound : undefined
        });
      });

    return attachments;
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

function normalizeSupplementalSubmissions(value: unknown): SupplementalSubmission[] {
  if (!Array.isArray(value)) return [];

  const submissions: SupplementalSubmission[] = [];
  value.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const record = item as Record<string, unknown>;
      const submittedAt = String(record.submittedAt || record.submitted_at || "").trim();
      const applicationNo = String(record.applicationNo || record.application_no || "").trim();
      const note = String(record.note || "").trim();
      const changedFields = Array.isArray(record.changedFields) ? record.changedFields : [];
      const files = normalizeAttachments(record.files, "supplement");
      const normalizedChangedFields: Array<{ field: string; oldValue?: string; newValue?: string }> = [];
      changedFields.forEach((field) => {
        if (!field || typeof field !== "object") return;
        const fieldRecord = field as Record<string, unknown>;
        const fieldName = String(fieldRecord.field || "").trim();
        if (!fieldName) return;
        normalizedChangedFields.push({
          field: fieldName,
          oldValue: String(fieldRecord.oldValue || "").trim() || undefined,
          newValue: String(fieldRecord.newValue || "").trim() || undefined
        });
      });

      submissions.push({
        submittedAt,
        submittedBy: "applicant",
        applicationNo,
        contact: String(record.contact || "").trim(),
        note,
        changedFields: normalizedChangedFields,
        files,
        previousStatus: String(record.previousStatus || record.previous_status || "").trim(),
        nextStatus: String(record.nextStatus || record.next_status || "").trim()
      });
    });

  return submissions;
}

function toCertificationAdminRecord(row: SupabaseCertificationApplicationRow): CertificationApplicationAdminRecord {
  return {
    id: row.id,
    applicationNo: row.application_no,
    certificationType: (row.certification_type || "taoist_priest") as CertificationApplicationAdminRecord["certificationType"],
    certificationPath: (row.certification_path || "") as CertificationPath | "",
    requestedLevel: (row.requested_level || "") as CertificationLevel | "",
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
    recommenderName: row.recommender_name ?? "",
    recommenderContact: row.recommender_contact ?? "",
    recommenderRelation: row.recommender_relation ?? "",
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
    approvedPath: (row.approved_path || "") as CertificationPath | "",
    approvedLevel: (row.approved_level || "") as CertificationLevel | "",
    materialReview: normalizeMaterialReview(row.material_review),
    committeeReviewNote: row.committee_review_note ?? "",
    certificatePhotoPath: row.certificate_photo_path || findCertificatePhotoPath(normalizeAttachments(row.supporting_documents, "supporting_documents")),
    reviewer: row.reviewer ?? "",
    reviewedAt: row.reviewed_at,
    deliveryStatus: row.delivery_status === "delivered" ? "delivered" : "not_delivered",
    deliveredAt: row.delivered_at,
    supplementalSubmissions: normalizeSupplementalSubmissions(row.supplemental_submissions),
    supplementSubmittedAt: row.supplement_submitted_at,
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
    certification_path: certificate.certificationPath || null,
    certification_level: certificate.certificationLevel || null,
    lineage_or_temple: certificate.lineageOrTemple,
    certificate_photo_path: certificate.certificatePhotoPath || null,
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
  const effective = getCertificateEffectiveValidity({
    status: row.status,
    certificateReviewStatus: row.certificate_review_status,
    validUntil: row.valid_until
  });

  return {
    certificateNo: row.certificate_no,
    holderName: row.holder_name,
    certificationType: row.taoist_rank || "道士资格认证",
    certificationPath: (row.certification_path || "") as CertificationPath | "",
    certificationLevel: formatCertificationLevel(row.certification_level, row.taoist_rank || "道士资格认证"),
    issuer: "ITCA / 国际道教与文化协会",
    issuedDate: row.issued_date,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    status: row.status as CertificateQueryResult["status"],
    certificateReviewStatus: row.certificate_review_status || "none",
    effectiveStatus: effective.effectiveStatus,
    effectiveStatusLabel: effective.effectiveStatusLabel,
    daysUntilExpiry: effective.daysUntilExpiry,
    expiryBucket: effective.expiryBucket,
    detailUrl: `/certificates/${encodeURIComponent(row.certificate_no)}`
  };
}

async function toApplicantCertificateFields(row: SupabaseCertificateRow) {
  let certificatePhotoUrl = "";
  const certificateEffective = getCertificateEffectiveValidity({
    status: row.status,
    certificateReviewStatus: row.certificate_review_status,
    validUntil: row.valid_until
  });

  if (row.certificate_photo_path) {
    try {
      certificatePhotoUrl = await createCertificationAttachmentSignedUrl(row.certificate_photo_path, 3600);
    } catch {
      certificatePhotoUrl = "";
    }
  }

  return {
    certificateStatus: row.status as ApplicationQueryResult["certificateStatus"],
    certificateReviewStatus: row.certificate_review_status || "none",
    certificateEffectiveStatus: certificateEffective.effectiveStatus,
    certificateEffectiveStatusLabel: certificateEffective.effectiveStatusLabel,
    certificateHolderName: row.holder_name,
    certificateTaoistName: row.taoist_name ?? "",
    certificationPath: (row.certification_path || "") as ApplicationQueryResult["certificationPath"],
    certificationLevel: formatCertificationLevel(row.certification_level, row.taoist_rank || "道士资格认证"),
    certificateLineageOrTemple: row.lineage_or_temple || row.sect || "",
    certificateIssuer: "ITCA / 国际道教与文化协会",
    certificateIssuedDate: row.issued_date,
    certificateValidFrom: row.valid_from,
    certificateValidUntil: row.valid_until,
    certificatePhotoUrl,
    certificatePhotoRecorded: Boolean(row.certificate_photo_path)
  } satisfies Partial<ApplicationQueryResult>;
}

async function createApplicantPhotoFallback(
  row: Pick<SupabaseCertificationApplicationRow, "certificate_photo_path" | "supporting_documents">
) {
  const storagePath = row.certificate_photo_path || findCertificatePhotoPath(normalizeAttachments(row.supporting_documents, "supporting_documents"));
  if (!storagePath) return { certificatePhotoUrl: "", certificatePhotoRecorded: false };

  try {
    return {
      certificatePhotoUrl: await createCertificationAttachmentSignedUrl(storagePath, 3600),
      certificatePhotoRecorded: true
    };
  } catch {
    return {
      certificatePhotoUrl: "",
      certificatePhotoRecorded: true
    };
  }
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
    select: "application_no,member_no,member_valid_from,member_valid_until,member_status,member_renewal_status,application_type,name,status,admin_note,contact_name,phone,email,country,organization_type,profile,purpose,supplemental_submissions,supplement_submitted_at,created_at,updated_at",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseApplicationRow[];
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
    select: "application_no,member_no,member_valid_from,member_valid_until,member_status,member_renewal_status,application_type,name,status,admin_note,contact_name,phone,email,country,organization_type,profile,purpose,supplemental_submissions,supplement_submitted_at,created_at,updated_at",
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

  const rows = (await response.json()) as SupabaseApplicationRow[];

  return rows.map(toApplicationQueryResult);
}

export async function findOpenApplicationByContact(filters: { applicationType: ApplicationType; email: string; phone: string }) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    application_type: `eq.${filters.applicationType}`,
    status: "in.(submitted,pending_review,under_review,need_more_info,approved)",
    or: `(email.eq.${filters.email},phone.eq.${filters.phone})`,
    select: "application_no,member_no,member_valid_from,member_valid_until,member_status,member_renewal_status,application_type,name,status,admin_note,created_at,updated_at",
    order: "created_at.desc",
    limit: "1"
  });

  const response = await fetch(`${config.url}/rest/v1/applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as Array<Pick<SupabaseApplicationRow, "application_no" | "member_no" | "application_type" | "name" | "status" | "admin_note" | "created_at" | "updated_at">>;
  const row = rows[0];

  return row ? toApplicationQueryResult(row) : null;
}

export async function findCertificationByNoAndContact(applicationNo: string, contact: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    application_no: `eq.${applicationNo}`,
    or: `(email.eq.${contact},phone.eq.${contact})`,
    select: "*",
    limit: "1"
  });
  const response = await fetch(`${config.url}/rest/v1/certification_applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseCertificationApplicationRow[];
  const row = rows[0];
  const certificate = row ? await findApplicantCertificateByApplicationIdSafe(row.id) : null;
  if (row && certificate && !certificate.certificatePhotoUrl) {
    Object.assign(certificate, await createApplicantPhotoFallback(row));
  }

  return row ? toCertificationQueryResult(row, certificate || undefined) : null;
}

export async function findCertificationsByIdentity(filters: { applicantName: string; taoistName: string; contact: string }) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    applicant_name: `eq.${filters.applicantName}`,
    taoist_name: `eq.${filters.taoistName}`,
    or: `(email.eq.${filters.contact},phone.eq.${filters.contact})`,
    select: "*",
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

  const rows = (await response.json()) as SupabaseCertificationApplicationRow[];

  const results: ApplicationQueryResult[] = [];
  for (const row of rows) {
    const certificate = await findApplicantCertificateByApplicationIdSafe(row.id);
    if (certificate && !certificate.certificatePhotoUrl) {
      Object.assign(certificate, await createApplicantPhotoFallback(row));
    }
    results.push(toCertificationQueryResult(row, certificate || undefined));
  }

  return results;
}

export async function findOpenCertificationApplicationByContact(filters: { email: string; phone: string }) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    status: "in.(submitted,under_review,need_more_info,approved,certificate_issued,cert_issued)",
    or: `(email.eq.${filters.email},phone.eq.${filters.phone})`,
    select: "id,application_no,applicant_name,status,review_note,applicant_feedback,certificate_photo_path,supporting_documents,delivery_status,delivered_at,supplemental_submissions,supplement_submitted_at,created_at,updated_at",
    order: "created_at.desc",
    limit: "1"
  });

  const response = await fetch(`${config.url}/rest/v1/certification_applications?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(config)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseCertificationApplicationRow[];
  const row = rows[0];

  return row ? toCertificationQueryResult(row) : null;
}

export async function listApplications(filters: { applicationType?: ApplicationType; status?: ApplicationStatus } = {}) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    select:
      "id,application_no,member_no,member_no_issued_at,member_no_issued_by,member_valid_from,member_valid_until,member_status,member_renewal_status,last_renewed_at,member_status_note,application_no_scheme,application_type,status,name,contact_name,phone,email,country,organization_type,profile,purpose,receive_notice,truth_confirmed,terms_accepted,privacy_accepted,confirmed_at,admin_note,supplemental_submissions,supplement_submitted_at,created_at,updated_at",
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
      "id,application_no,member_no,member_no_issued_at,member_no_issued_by,member_valid_from,member_valid_until,member_status,member_renewal_status,last_renewed_at,member_status_note,application_no_scheme,application_type,status,name,contact_name,phone,email,country,organization_type,profile,purpose,receive_notice,truth_confirmed,terms_accepted,privacy_accepted,confirmed_at,admin_note,supplemental_submissions,supplement_submitted_at,created_at,updated_at",
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

export async function updateApplicationReview(id: string, values: { status: ApplicationStatus; adminNote: string; issuedBy?: string }) {
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
  let row = rows[0];

  if (row && values.status === "approved" && !row.member_no && (row.application_type === "personal_member" || row.application_type === "organization_member")) {
    const now = new Date();
    const year = now.getFullYear();
    const isOrganization = row.application_type === "organization_member";
    const memberNo = await generateItcaNumber({
      prefix: isOrganization ? "ITCA-ORG" : "ITCA-M",
      year
    });

    const issueResponse = await fetch(`${config.url}/rest/v1/applications?id=eq.${encodeURIComponent(id)}&member_no=is.null`, {
      method: "PATCH",
      headers: getHeaders(config, "return=representation"),
      body: JSON.stringify({
        member_no: memberNo,
        member_no_issued_at: now.toISOString(),
        member_no_issued_by: values.issuedBy || "next-admin-fallback",
        updated_at: now.toISOString()
      })
    });

    if (!issueResponse.ok) {
      throw new SupabaseRequestError(await readSupabaseError(issueResponse), issueResponse.status);
    }

    const issuedRows = (await issueResponse.json()) as SupabaseApplicationRow[];
    row = issuedRows[0] ?? row;
  }

  return row ? toApplicationAdminRecord(row) : null;
}

export async function updateApplicationMemberValidity(
  id: string,
  values: {
    memberValidFrom?: string | null;
    memberValidUntil?: string | null;
    memberStatus: string;
    memberRenewalStatus: string;
    lastRenewedAt?: string | null;
    memberStatusNote?: string;
    actorEmail?: string;
    actorName?: string;
    actorRole?: string;
    actorType?: string;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  const before = await getApplicationById(id);
  if (!before) return null;

  const config = getSupabaseConfig();
  const now = new Date().toISOString();
  const response = await fetch(`${config.url}/rest/v1/applications?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: getHeaders(config, "return=representation"),
    body: JSON.stringify({
      member_valid_from: values.memberValidFrom || null,
      member_valid_until: values.memberValidUntil || null,
      member_status: values.memberStatus,
      member_renewal_status: values.memberRenewalStatus,
      last_renewed_at: values.lastRenewedAt || null,
      member_status_note: values.memberStatusNote || null,
      updated_at: now
    })
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseApplicationRow[];
  const row = rows[0];
  const updated = row ? toApplicationAdminRecord(row) : null;
  if (updated) {
    await writeAuditLog({
      action: "member_application.validity_update",
      resourceType: "application",
      resourceId: updated.id,
      resourceNo: updated.applicationNo,
      actorEmail: values.actorEmail || "",
      actorName: values.actorName || "",
      actorRole: values.actorRole || "",
      actorType: values.actorType || "legacy_admin",
      beforeData: {
        id: before.id,
        applicationNo: before.applicationNo,
        memberNo: before.memberNo,
        memberValidFrom: before.memberValidFrom,
        memberValidUntil: before.memberValidUntil,
        memberStatus: before.memberStatus,
        memberRenewalStatus: before.memberRenewalStatus,
        lastRenewedAt: before.lastRenewedAt,
        memberStatusNote: before.memberStatusNote
      },
      afterData: {
        id: updated.id,
        applicationNo: updated.applicationNo,
        memberNo: updated.memberNo,
        memberValidFrom: updated.memberValidFrom,
        memberValidUntil: updated.memberValidUntil,
        memberStatus: updated.memberStatus,
        memberRenewalStatus: updated.memberRenewalStatus,
        lastRenewedAt: updated.lastRenewedAt,
        memberStatusNote: updated.memberStatusNote
      },
      summary: `会员申请 ${updated.applicationNo} 有效期资料已更新。`,
      ipAddress: values.ipAddress || "",
      userAgent: values.userAgent || ""
    });
  }

  return updated;
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
  if (filters.q) {
    params.set(
      "or",
      `(application_no.ilike.*${filters.q}*,applicant_name.ilike.*${filters.q}*,taoist_name.ilike.*${filters.q}*,recommender_name.ilike.*${filters.q}*,recommender_contact.ilike.*${filters.q}*)`
    );
  }

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
    approvedPath?: CertificationPath | "";
    approvedLevel?: CertificationLevel | "";
    materialReview?: MaterialReview;
    committeeReviewNote?: string;
    reviewer: string;
    deliveryStatus?: "not_delivered" | "delivered";
    deliveredAt?: string | null;
  }
) {
  const config = getSupabaseConfig();
  const now = new Date().toISOString();
  const body: Record<string, string | MaterialReview | null> = {
    status: values.status,
    reviewer: values.reviewer,
    reviewed_at: now,
    updated_at: now
  };

  if (values.reviewNote !== undefined) body.review_note = values.reviewNote;
  if (values.internalReviewNote !== undefined) body.internal_review_note = values.internalReviewNote;
  if (values.applicantFeedback !== undefined) body.applicant_feedback = values.applicantFeedback;
  if (values.approvedPath !== undefined) body.approved_path = values.approvedPath || null;
  if (values.approvedLevel !== undefined) body.approved_level = values.approvedLevel || null;
  if (values.materialReview !== undefined) body.material_review = values.materialReview;
  if (values.committeeReviewNote !== undefined) body.committee_review_note = values.committeeReviewNote;
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

export async function findCertificationSupplementTarget(applicationNo: string, contact: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    application_no: `eq.${applicationNo}`,
    or: `(email.eq.${contact},phone.eq.${contact})`,
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

export async function findApplicationSupplementTarget(applicationNo: string, contact: string) {
  const config = getSupabaseConfig();
  const params = new URLSearchParams({
    application_no: `eq.${applicationNo}`,
    or: `(email.eq.${contact},phone.eq.${contact})`,
    select:
      "id,application_no,member_no,member_no_issued_at,member_no_issued_by,member_valid_from,member_valid_until,member_status,member_renewal_status,last_renewed_at,member_status_note,application_no_scheme,application_type,status,name,contact_name,phone,email,country,organization_type,profile,purpose,receive_notice,truth_confirmed,terms_accepted,privacy_accepted,confirmed_at,admin_note,supplemental_submissions,supplement_submitted_at,created_at,updated_at",
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

export async function updateCertificationSupplement(
  id: string,
  values: Partial<
    Pick<
      CertificationApplicationRecord,
      | "applicantNameEn"
      | "gender"
      | "birthDate"
      | "nationality"
      | "residence"
      | "address"
      | "phone"
      | "email"
      | "masterName"
      | "masterTaoistName"
      | "lineage"
      | "templeOrOrganization"
      | "sect"
      | "practiceYears"
      | "experienceSummary"
      | "applicationReason"
      | "additionalNote"
      | "recommenderName"
      | "recommenderContact"
      | "recommenderRelation"
      | "supportingDocuments"
      | "certificatePhotoPath"
      | "supplementalSubmissions"
    >
  > & { internalReviewNote?: string }
) {
  const config = getSupabaseConfig();
  const now = new Date().toISOString();
  const body: Record<string, unknown> = {
    status: "under_review",
    supplement_submitted_at: now,
    updated_at: now
  };

  if (values.applicantNameEn !== undefined) body.applicant_name_en = values.applicantNameEn;
  if (values.gender !== undefined) body.gender = values.gender;
  if (values.birthDate !== undefined) body.birth_date = values.birthDate || null;
  if (values.nationality !== undefined) body.nationality = values.nationality;
  if (values.residence !== undefined) body.residence = values.residence;
  if (values.address !== undefined) body.address = values.address;
  if (values.phone !== undefined) body.phone = values.phone;
  if (values.email !== undefined) body.email = values.email;
  if (values.masterName !== undefined) body.master_name = values.masterName;
  if (values.masterTaoistName !== undefined) body.master_taoist_name = values.masterTaoistName;
  if (values.lineage !== undefined) body.lineage = values.lineage;
  if (values.templeOrOrganization !== undefined) body.temple_or_organization = values.templeOrOrganization;
  if (values.sect !== undefined) body.sect = values.sect;
  if (values.practiceYears !== undefined) body.practice_years = values.practiceYears;
  if (values.experienceSummary !== undefined) body.experience_summary = values.experienceSummary;
  if (values.applicationReason !== undefined) body.application_reason = values.applicationReason;
  if (values.additionalNote !== undefined) body.additional_note = values.additionalNote;
  if (values.recommenderName !== undefined) body.recommender_name = values.recommenderName;
  if (values.recommenderContact !== undefined) body.recommender_contact = values.recommenderContact;
  if (values.recommenderRelation !== undefined) body.recommender_relation = values.recommenderRelation;
  if (values.supportingDocuments !== undefined) body.supporting_documents = values.supportingDocuments;
  if (values.certificatePhotoPath !== undefined) body.certificate_photo_path = values.certificatePhotoPath || null;
  if (values.supplementalSubmissions !== undefined) body.supplemental_submissions = values.supplementalSubmissions;
  if (values.internalReviewNote !== undefined) body.internal_review_note = values.internalReviewNote;

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

export async function updateApplicationSupplement(
  id: string,
  values: Partial<Pick<ApplicationRecord, "name" | "contactName" | "email" | "phone" | "country" | "profile" | "purpose" | "supplementalSubmissions">> & {
    adminNote?: string;
  }
) {
  const config = getSupabaseConfig();
  const now = new Date().toISOString();
  const body: Record<string, unknown> = {
    status: "under_review",
    supplement_submitted_at: now,
    updated_at: now
  };

  if (values.name !== undefined) body.name = values.name;
  if (values.contactName !== undefined) body.contact_name = values.contactName;
  if (values.email !== undefined) body.email = values.email;
  if (values.phone !== undefined) body.phone = values.phone;
  if (values.country !== undefined) body.country = values.country;
  if (values.profile !== undefined) body.profile = values.profile;
  if (values.purpose !== undefined) body.purpose = values.purpose;
  if (values.adminNote !== undefined) body.admin_note = values.adminNote;
  if (values.supplementalSubmissions !== undefined) body.supplemental_submissions = values.supplementalSubmissions;

  const response = await fetch(`${config.url}/rest/v1/applications?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: getHeaders(config, "return=representation"),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new SupabaseRequestError(await readSupabaseError(response), response.status);
  }

  const rows = (await response.json()) as SupabaseApplicationRow[];
  const row = rows[0];

  return row ? toApplicationAdminRecord(row) : null;
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

async function findApplicantCertificateByApplicationId(applicationId: string) {
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

  return row
    ? {
        certificateNo: row.certificate_no,
        ...(await toApplicantCertificateFields(row))
      }
    : null;
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

async function findApplicantCertificateByApplicationIdSafe(applicationId: string) {
  try {
    return await findApplicantCertificateByApplicationId(applicationId);
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
  source?: "application" | "supplement";
  supplementRound?: number;
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
    uploadedAt: params.uploadedAt,
    source: params.source,
    supplementRound: params.supplementRound
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
