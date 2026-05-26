import type { ApplicationQueryResponse } from "@/types/application";

const DEFAULT_ITCA_API_BASE_URL = "http://localhost:5001";

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

async function queryNextApplicationApi(applicationNo: string, contact: string) {
  const response = await fetch(buildApplicationQueryPath(applicationNo, contact));
  const result = await readApplicationQueryResponse(response);

  return { response, result };
}

export async function queryApplicationProgress(applicationNo: string, contact: string) {
  const queryPath = buildApplicationQueryPath(applicationNo, contact);

  try {
    const response = await fetch(`${getItcaApiBaseUrl()}${queryPath}`);
    const result = await readApplicationQueryResponse(response);

    if (response.ok || response.status === 400 || response.status === 404) {
      return { response, result };
    }
  } catch {
    return queryNextApplicationApi(applicationNo, contact);
  }

  return queryNextApplicationApi(applicationNo, contact);
}
