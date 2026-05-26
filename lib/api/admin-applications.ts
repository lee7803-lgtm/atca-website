import "server-only";

import { getApplicationById, listApplications } from "@/lib/supabase/server";
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

export class AdminApiUnauthorizedError extends Error {
  constructor() {
    super("Admin API request is unauthorized.");
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
