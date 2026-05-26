import type { CertificateQueryResponse } from "@/types/certification";
import type { CertificateQueryResult } from "@/types/certification";

const DEFAULT_ITCA_API_BASE_URL = "http://localhost:5001";

export type CertificateDetailResult =
  | {
      status: "found";
      certificate: CertificateQueryResult;
      source: "dotnet" | "fallback";
    }
  | {
      status: "not-found";
      message: string;
      source: "dotnet" | "fallback";
    };

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

function buildCertificateDetailPath(certificateNo: string) {
  return `/api/certificates/${encodeURIComponent(certificateNo.trim())}`;
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

export async function getCertificateDetail(
  certificateNo: string,
  fallbackQuery?: (certificateNo: string) => Promise<CertificateQueryResult | null>
): Promise<CertificateDetailResult> {
  const normalizedCertificateNo = certificateNo.trim();
  const detailPath = buildCertificateDetailPath(normalizedCertificateNo);

  try {
    const response = await fetch(`${getItcaApiBaseUrl()}${detailPath}`, {
      cache: "no-store"
    });
    const result = await readCertificateQueryResponse(response);

    if (response.ok && result.success) {
      return {
        status: "found",
        certificate: result.certificate,
        source: "dotnet"
      };
    }

    if (response.status === 404) {
      return {
        status: "not-found",
        message: result.success === false ? result.message : "未查询到对应公开证书记录。",
        source: "dotnet"
      };
    }
  } catch {
    return getCertificateDetailFromFallback(normalizedCertificateNo, fallbackQuery);
  }

  return getCertificateDetailFromFallback(normalizedCertificateNo, fallbackQuery);
}

async function getCertificateDetailFromFallback(
  certificateNo: string,
  fallbackQuery?: (certificateNo: string) => Promise<CertificateQueryResult | null>
): Promise<CertificateDetailResult> {
  if (!fallbackQuery) {
    return {
      status: "not-found",
      message: "证书公开核验详情服务暂时不可用，请稍后重试。",
      source: "fallback"
    };
  }

  const certificate = await fallbackQuery(certificateNo);

  if (certificate) {
    return {
      status: "found",
      certificate,
      source: "fallback"
    };
  }

  return {
    status: "not-found",
    message: "未查询到对应公开证书记录。请确认链接是否正确，或返回证书公开核验页重新核验。",
    source: "fallback"
  };
}
