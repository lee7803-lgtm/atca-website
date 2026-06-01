import "server-only";

import { getApplicationById, listApplications, updateApplicationMemberValidity, updateApplicationRecordDisposition, updateApplicationReview } from "@/lib/supabase/server";
import type { AdminSession } from "@/lib/admin/auth";
import type { ApplicationAdminRecord, ApplicationStatus, ApplicationType, RecordDisposition } from "@/types/application";

const DEFAULT_ITCA_API_BASE_URL = "http://localhost:5001";

type ListAdminApplicationsFilters = {
  applicationType?: ApplicationType;
  status?: ApplicationStatus;
  recordDisposition?: RecordDisposition | "all";
  keyword?: string;
  page?: number;
  pageSize?: number;
};

type AdminApplicationsListResponse =
  | {
      success: true;
      applications: ApplicationAdminRecord[];
      page?: number;
      pageSize?: number;
    }
  | {
      success: false;
      message: string;
    };

type AdminApplicationDetailResponse =
  | {
      success: true;
      application: ApplicationAdminRecord;
    }
  | {
      success: false;
      message: string;
    };

type AdminApplicationReviewSummary = {
  id: string;
  applicationNo: string;
  memberNo?: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  adminNote: string;
  updatedAt: string;
};

type AdminApplicationReviewResponse =
  | {
      success: true;
      application: AdminApplicationReviewSummary;
    }
  | {
      success: false;
      message: string;
    };

type UpdateAdminApplicationReviewValues = {
  status: ApplicationStatus;
  adminNote: string;
  actor?: AdminSession;
  ipAddress?: string;
  userAgent?: string;
};

export type UpdateAdminMemberValidityValues = {
  memberValidFrom?: string | null;
  memberValidUntil?: string | null;
  memberStatus: string;
  memberRenewalStatus: string;
  lastRenewedAt?: string | null;
  memberStatusNote?: string;
  actor?: AdminSession;
  ipAddress?: string;
  userAgent?: string;
};

export type UpdateAdminApplicationRecordDispositionValues = {
  recordDisposition: RecordDisposition;
  recordDispositionNote?: string;
  actor?: AdminSession;
  ipAddress?: string;
  userAgent?: string;
};

export class AdminApiUnauthorizedError extends Error {
  constructor() {
    super("Admin API request is unauthorized.");
  }
}

export class AdminApiRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function getItcaApiBaseUrl() {
  return process.env.NEXT_PUBLIC_ITCA_API_BASE_URL?.replace(/\/$/, "") || DEFAULT_ITCA_API_BASE_URL;
}

function getAdminApiHeaders() {
  const token = process.env.ITCA_ADMIN_API_TOKEN || "";

  return {
    "X-ITCA-ADMIN-API-TOKEN": token
  };
}

function getAdminActorHeaders(actor?: AdminSession, ipAddress?: string, userAgent?: string) {
  return {
    ...(actor?.actorType ? { "X-ITCA-ADMIN-ACTOR-TYPE": actor.actorType } : {}),
    ...(actor?.adminId ? { "X-ITCA-ADMIN-ACTOR-ID": actor.adminId } : {}),
    ...(actor?.email ? { "X-ITCA-ADMIN-ACTOR-EMAIL": actor.email } : {}),
    ...(actor?.displayName ? { "X-ITCA-ADMIN-ACTOR-NAME": actor.displayName } : {}),
    ...(actor?.role ? { "X-ITCA-ADMIN-ACTOR-ROLE": actor.role } : {}),
    ...(ipAddress ? { "X-ITCA-ADMIN-IP": ipAddress } : {}),
    ...(userAgent ? { "X-ITCA-ADMIN-USER-AGENT": userAgent } : {})
  };
}

function buildAdminApplicationsPath(filters: ListAdminApplicationsFilters) {
  const params = new URLSearchParams();
  if (filters.applicationType) params.set("applicationType", filters.applicationType);
  if (filters.status) params.set("status", filters.status);
  if (filters.recordDisposition) params.set("recordDisposition", filters.recordDisposition);
  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

  const query = params.toString();
  return query ? `/api/admin/applications?${query}` : "/api/admin/applications";
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function listAdminApplications(filters: ListAdminApplicationsFilters = {}) {
  try {
    const response = await fetch(`${getItcaApiBaseUrl()}${buildAdminApplicationsPath(filters)}`, {
      cache: "no-store",
      headers: getAdminApiHeaders()
    });

    if (response.status === 401 || response.status === 403) {
      throw new AdminApiUnauthorizedError();
    }

    if (response.ok) {
      const result = (await response.json()) as AdminApplicationsListResponse;
      if (!result.success) {
        return listApplications({
          applicationType: filters.applicationType,
          status: filters.status,
          recordDisposition: filters.recordDisposition
        });
      }

      return result.applications;
    }
  } catch (error) {
    if (error instanceof AdminApiUnauthorizedError) {
      throw error;
    }

    return listApplications({
      applicationType: filters.applicationType,
      status: filters.status,
      recordDisposition: filters.recordDisposition
    });
  }

  return listApplications({
    applicationType: filters.applicationType,
    status: filters.status,
    recordDisposition: filters.recordDisposition
  });
}

export async function getAdminApplication(id: string) {
  if (!isValidUuid(id)) {
    return null;
  }

  try {
    const response = await fetch(`${getItcaApiBaseUrl()}/api/admin/applications/${encodeURIComponent(id)}`, {
      cache: "no-store",
      headers: getAdminApiHeaders()
    });

    if (response.status === 401 || response.status === 403) {
      throw new AdminApiUnauthorizedError();
    }

    if (response.status === 404) {
      return null;
    }

    if (response.ok) {
      const result = (await response.json()) as AdminApplicationDetailResponse;
      if (!result.success) {
        return getApplicationById(id);
      }

      return result.application;
    }
  } catch (error) {
    if (error instanceof AdminApiUnauthorizedError) {
      throw error;
    }

    return getApplicationById(id);
  }

  return getApplicationById(id);
}

export async function updateAdminApplicationReview(id: string, values: UpdateAdminApplicationReviewValues) {
  try {
    const response = await fetch(`${getItcaApiBaseUrl()}/api/admin/applications/${encodeURIComponent(id)}/review`, {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...getAdminApiHeaders(),
        ...getAdminActorHeaders(values.actor, values.ipAddress, values.userAgent)
      },
      body: JSON.stringify({
        status: values.status,
        adminNote: values.adminNote
      })
    });

    if (response.status === 401 || response.status === 403) {
      throw new AdminApiUnauthorizedError();
    }

    if (response.status === 404) {
      return null;
    }

    if (response.status === 400) {
      const result = (await response.json().catch(() => null)) as AdminApplicationReviewResponse | null;
      throw new AdminApiRequestError(400, result && !result.success ? result.message : "请选择有效的申请状态。");
    }

    if (response.ok) {
      const result = (await response.json()) as AdminApplicationReviewResponse;
      if (result.success) {
        return result.application;
      }

      throw new AdminApiRequestError(response.status, result.message || "审核结果未能保存。");
    }
  } catch (error) {
    if (error instanceof AdminApiUnauthorizedError || error instanceof AdminApiRequestError) {
      throw error;
    }

    return updateApplicationReview(id, {
      status: values.status,
      adminNote: values.adminNote,
      issuedBy: values.actor?.email || values.actor?.displayName || "next-admin-fallback",
      actorEmail: values.actor?.email || "",
      actorName: values.actor?.displayName || "",
      actorRole: values.actor?.role || "",
      actorType: values.actor?.actorType || "legacy_admin",
      ipAddress: values.ipAddress,
      userAgent: values.userAgent
    });
  }

  return updateApplicationReview(id, {
    status: values.status,
    adminNote: values.adminNote,
    issuedBy: values.actor?.email || values.actor?.displayName || "next-admin-fallback",
    actorEmail: values.actor?.email || "",
    actorName: values.actor?.displayName || "",
    actorRole: values.actor?.role || "",
    actorType: values.actor?.actorType || "legacy_admin",
    ipAddress: values.ipAddress,
    userAgent: values.userAgent
  });
}

export async function updateAdminMemberValidity(id: string, values: UpdateAdminMemberValidityValues) {
  try {
    const response = await fetch(`${getItcaApiBaseUrl()}/api/admin/applications/${encodeURIComponent(id)}/member-validity`, {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...getAdminApiHeaders(),
        ...getAdminActorHeaders(values.actor, values.ipAddress, values.userAgent)
      },
      body: JSON.stringify({
        memberValidFrom: values.memberValidFrom || null,
        memberValidUntil: values.memberValidUntil || null,
        memberStatus: values.memberStatus,
        memberRenewalStatus: values.memberRenewalStatus,
        lastRenewedAt: values.lastRenewedAt || null,
        memberStatusNote: values.memberStatusNote || ""
      })
    });

    if (response.status === 401 || response.status === 403) {
      throw new AdminApiUnauthorizedError();
    }

    if (response.status === 404) {
      return null;
    }

    if (response.status === 400) {
      const result = (await response.json().catch(() => null)) as AdminApplicationDetailResponse | null;
      throw new AdminApiRequestError(400, result && !result.success ? result.message : "会员有效期资料不正确。");
    }

    if (response.ok) {
      const result = (await response.json()) as AdminApplicationDetailResponse;
      if (result.success) return result.application;
      throw new AdminApiRequestError(response.status, result.message || "会员有效期资料未能保存。");
    }
  } catch (error) {
    if (error instanceof AdminApiUnauthorizedError || error instanceof AdminApiRequestError) {
      throw error;
    }

    return updateApplicationMemberValidity(id, {
      memberValidFrom: values.memberValidFrom,
      memberValidUntil: values.memberValidUntil,
      memberStatus: values.memberStatus,
      memberRenewalStatus: values.memberRenewalStatus,
      lastRenewedAt: values.lastRenewedAt,
      memberStatusNote: values.memberStatusNote,
      actorEmail: values.actor?.email || "",
      actorName: values.actor?.displayName || "",
      actorRole: values.actor?.role || "",
      actorType: values.actor?.actorType || "legacy_admin",
      ipAddress: values.ipAddress,
      userAgent: values.userAgent
    });
  }

  return updateApplicationMemberValidity(id, {
    memberValidFrom: values.memberValidFrom,
    memberValidUntil: values.memberValidUntil,
    memberStatus: values.memberStatus,
    memberRenewalStatus: values.memberRenewalStatus,
    lastRenewedAt: values.lastRenewedAt,
    memberStatusNote: values.memberStatusNote,
    actorEmail: values.actor?.email || "",
    actorName: values.actor?.displayName || "",
    actorRole: values.actor?.role || "",
    actorType: values.actor?.actorType || "legacy_admin",
    ipAddress: values.ipAddress,
    userAgent: values.userAgent
  });
}

export async function updateAdminApplicationRecordDisposition(id: string, values: UpdateAdminApplicationRecordDispositionValues) {
  try {
    const response = await fetch(`${getItcaApiBaseUrl()}/api/admin/applications/${encodeURIComponent(id)}/record-disposition`, {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...getAdminApiHeaders(),
        ...getAdminActorHeaders(values.actor, values.ipAddress, values.userAgent)
      },
      body: JSON.stringify({
        recordDisposition: values.recordDisposition,
        recordDispositionNote: values.recordDispositionNote || ""
      })
    });

    if (response.status === 401 || response.status === 403) {
      throw new AdminApiUnauthorizedError();
    }

    if (response.status === 404) {
      return null;
    }

    if (response.status === 400) {
      const result = (await response.json().catch(() => null)) as AdminApplicationDetailResponse | null;
      throw new AdminApiRequestError(400, result && !result.success ? result.message : "记录类型不正确。");
    }

    if (response.ok) {
      const result = (await response.json()) as AdminApplicationDetailResponse;
      if (result.success) return result.application;
      throw new AdminApiRequestError(response.status, result.message || "记录治理状态未能保存。");
    }
  } catch (error) {
    if (error instanceof AdminApiUnauthorizedError || error instanceof AdminApiRequestError) {
      throw error;
    }

    return updateApplicationRecordDisposition(id, {
      recordDisposition: values.recordDisposition,
      recordDispositionNote: values.recordDispositionNote,
      actorEmail: values.actor?.email || "",
      actorName: values.actor?.displayName || "",
      actorRole: values.actor?.role || "",
      actorType: values.actor?.actorType || "legacy_admin",
      ipAddress: values.ipAddress,
      userAgent: values.userAgent
    });
  }

  return updateApplicationRecordDisposition(id, {
    recordDisposition: values.recordDisposition,
    recordDispositionNote: values.recordDispositionNote,
    actorEmail: values.actor?.email || "",
    actorName: values.actor?.displayName || "",
    actorRole: values.actor?.role || "",
    actorType: values.actor?.actorType || "legacy_admin",
    ipAddress: values.ipAddress,
    userAgent: values.userAgent
  });
}
