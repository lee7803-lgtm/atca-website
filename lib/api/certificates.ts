import type { CertificateQueryResponse } from "@/types/certification";

const DEFAULT_ITCA_API_BASE_URL = "http://localhost:5001";

function getItcaApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_ITCA_API_BASE_URL?.replace(/\/$/, "") || DEFAULT_ITCA_API_BASE_URL);
}

function buildCertificateQueryPath(certificateNo: string, holderName: string) {
  const params = new URLSearchParams({
    certificateNo: certificateNo.trim(),
    holderName: holderName.trim()
  });

  return `/api/certificates/query?${params.toString()}`;
}

async function readCertificateQueryResponse(response: Response) {
  return (await response.json()) as CertificateQueryResponse;
}

async function queryNextCertificateApi(certificateNo: string, holderName: string) {
  const response = await fetch(buildCertificateQueryPath(certificateNo, holderName));
  const result = await readCertificateQueryResponse(response);

  return { response, result };
}

export async function queryPublicCertificate(certificateNo: string, holderName: string) {
  const queryPath = buildCertificateQueryPath(certificateNo, holderName);

  try {
    const response = await fetch(`${getItcaApiBaseUrl()}${queryPath}`);
    const result = await readCertificateQueryResponse(response);

    if (response.ok || response.status === 400 || response.status === 404) {
      return { response, result };
    }
  } catch {
    return queryNextCertificateApi(certificateNo, holderName);
  }

  return queryNextCertificateApi(certificateNo, holderName);
}
