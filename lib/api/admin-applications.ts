import "server-only";

import { getApplicationById, listApplications, updateApplicationReview } from "@/lib/supabase/server";
import type { ApplicationAdminRecord, ApplicationStatus, ApplicationType } from "@/types/application";

const DEFAULT_ITCA_API_BASE_URL = "http://localhost:5001";

type ListAdminApplicationsFilters = {
  applicationType?: ApplicationType;
  status?: ApplicationStatus;
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

function buildAdminApplicationsPath(filters: ListAdminApplicationsFilters) {
  const params = new URLSearchParams();
  if (filters.applicationType) params.set("applicationType", filters.applicationType);
  if (filters.status) params.set("status", filters.status);
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
          status: filters.status
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
      status: filters.status
    });
  }

  return listApplications({
    applicationType: filters.applicationType,
    status: filters.status
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
        ...getAdminApiHeaders()
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

    return updateApplicationReview(id, values);
  }

  return updateApplicationReview(id, values);
}
