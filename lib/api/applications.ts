import type { ApplicationQueryResponse, ApplicationSubmitPayload, ApplicationSubmitResponse } from "@/types/application";

const DEFAULT_ITCA_API_BASE_URL = "http://localhost:5001";

type ApplicationSubmitRequest = Omit<ApplicationSubmitPayload, "organizationType"> & {
  organizationType?: string;
  companyWebsite?: string;
  websiteUrl?: string;
};

function getItcaApiBaseUrl() {
  return process.env.NEXT_PUBLIC_ITCA_API_BASE_URL?.replace(/\/$/, "") || DEFAULT_ITCA_API_BASE_URL;
}

function buildApplicationQueryPath(applicationNo: string, contact: string) {
  const params = new URLSearchParams({
    mode: "number",
    applicationNo: applicationNo.trim(),
    contact: contact.trim()
  });

  return `/api/applications/query?${params.toString()}`;
}

async function readApplicationQueryResponse(response: Response) {
  return (await response.json()) as ApplicationQueryResponse;
}

async function readApplicationSubmitResponse(response: Response) {
  try {
    return (await response.json()) as ApplicationSubmitResponse;
  } catch {
    return {
      success: false,
      message: "申请提交服务返回格式不正确，请稍后重试或联系协会秘书处。",
      errorType: "all_submit_paths_failed"
    } satisfies ApplicationSubmitResponse;
  }
}

async function queryNextApplicationApi(applicationNo: string, contact: string) {
  const response = await fetch(buildApplicationQueryPath(applicationNo, contact));
  const result = await readApplicationQueryResponse(response);

  return { response, result };
}

export async function queryApplicationProgress(applicationNo: string, contact: string) {
  const queryPath = buildApplicationQueryPath(applicationNo, contact);

  try {
    const { response, result } = await queryNextApplicationApi(applicationNo, contact);

    if (response.ok || response.status === 400 || response.status === 404) {
      return { response, result };
    }
  } catch {
    // Fall through to the API service fallback below.
  }

  try {
    const response = await fetch(`${getItcaApiBaseUrl()}${queryPath}`);
    const result = await readApplicationQueryResponse(response);

    if (response.ok || response.status === 400 || response.status === 404) {
      return { response, result };
    }
  } catch {
    // Fall through to the final same-origin retry below.
  }

  return queryNextApplicationApi(applicationNo, contact);
}

async function submitNextApplicationApi(payload: ApplicationSubmitRequest) {
  const response = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await readApplicationSubmitResponse(response);

  return { response, result };
}

async function submitApplicationToItcaApi(path: string, payload: ApplicationSubmitRequest) {
  const response = await fetch(`${getItcaApiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await readApplicationSubmitResponse(response);

  return { response, result };
}

function isValidationFailure(response: Response, result: ApplicationSubmitResponse) {
  return response.status === 400 && result.success === false && Boolean(result.fieldErrors);
}

function isDuplicateFailure(response: Response, result: ApplicationSubmitResponse) {
  return response.status === 409 && result.success === false && result.errorType === "duplicate_application";
}

function buildAllSubmitPathsFailedResult(nextStatus?: number, dotnetStatus?: number): ApplicationSubmitResponse {
  const statusTrail = [nextStatus ? `next:${nextStatus}` : "", dotnetStatus ? `dotnet:${dotnetStatus}` : ""].filter(Boolean).join(",");

  if (statusTrail) {
    console.warn(`[application-submit] all_submit_paths_failed ${statusTrail}`);
  } else {
    console.warn("[application-submit] all_submit_paths_failed");
  }

  return {
    success: false,
    message: "申请提交服务暂时不可用，请稍后重试或联系协会秘书处。",
    errorType: "all_submit_paths_failed"
  };
}

async function submitApplicationWithFallback(path: string, payload: ApplicationSubmitRequest) {
  let nextStatus: number | undefined;

  try {
    const { response, result } = await submitNextApplicationApi(payload);
    nextStatus = response.status;

    if (response.ok || isValidationFailure(response, result) || isDuplicateFailure(response, result)) {
      return { response, result };
    }
  } catch {
    console.warn("[application-submit] next_submit_failed");
  }

  try {
    const { response, result } = await submitApplicationToItcaApi(path, payload);

    if (response.ok || isValidationFailure(response, result) || isDuplicateFailure(response, result)) {
      return { response, result };
    }

    return {
      response,
      result: buildAllSubmitPathsFailedResult(nextStatus, response.status)
    };
  } catch {
    return {
      response: new Response(null, { status: 503 }),
      result: buildAllSubmitPathsFailedResult(nextStatus)
    };
  }
}

export async function submitMemberApplication(payload: ApplicationSubmitRequest) {
  return submitApplicationWithFallback("/api/member-applications", {
    ...payload,
    applicationType: "personal_member"
  });
}

export async function submitOrganizationApplication(payload: ApplicationSubmitRequest) {
  return submitApplicationWithFallback("/api/organization-applications", {
    ...payload,
    applicationType: "organization_member"
  });
}
