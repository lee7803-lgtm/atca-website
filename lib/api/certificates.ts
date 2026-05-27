import type { CertificateQueryResponse } from "@/types/certification";
import type { CertificateQueryResult } from "@/types/certification";

const DEFAULT_ITCA_API_BASE_URL = "http://localhost:5001";

export type CertificateDetailResult =
  | {
      status: "found";
      certificate: CertificateQueryResult;
      source: "dotnet";
    }
  | {
      status: "not-found";
      message: string;
      source: "dotnet";
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

function buildCertificateDetailPath(certificateNo: string, verificationToken: string) {
  const params = new URLSearchParams({ vt: verificationToken });

  return `/api/certificates/${encodeURIComponent(certificateNo.trim())}?${params.toString()}`;
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

export async function getCertificateDetail(certificateNo: string, verificationToken: string): Promise<CertificateDetailResult> {
  const normalizedCertificateNo = certificateNo.trim();
  const normalizedVerificationToken = verificationToken.trim();

  if (!normalizedVerificationToken) {
    return {
      status: "not-found",
      message: "请先完成证书核验。为保护持证人信息，请返回证书查询页面，输入证书编号与持证人姓名进行核验。",
      source: "dotnet"
    };
  }

  const detailPath = buildCertificateDetailPath(normalizedCertificateNo, normalizedVerificationToken);

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

    return {
      status: "not-found",
      message: result.success === false ? result.message : "未查询到对应公开证书记录。",
      source: "dotnet"
    };
  } catch {
    return {
      status: "not-found",
      message: "证书公开核验详情服务暂时不可用，请稍后重试或返回证书查询页面重新核验。",
      source: "dotnet"
    };
  }
}
