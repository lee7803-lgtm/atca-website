import type { MemberQueryResponse } from "@/types/member";

const DEFAULT_ITCA_API_BASE_URL = "http://localhost:5001";

function getItcaApiBaseUrl() {
  return process.env.NEXT_PUBLIC_ITCA_API_BASE_URL?.replace(/\/$/, "") || DEFAULT_ITCA_API_BASE_URL;
}

function buildMemberQueryPath(memberNo: string, holderName: string) {
  const params = new URLSearchParams({
    memberNo: memberNo.trim(),
    holderName: holderName.trim()
  });

  return `/api/members/query?${params.toString()}`;
}

async function readMemberQueryResponse(response: Response) {
  return (await response.json()) as MemberQueryResponse;
}

export async function queryPublicMember(memberNo: string, holderName: string) {
  const response = await fetch(`${getItcaApiBaseUrl()}${buildMemberQueryPath(memberNo, holderName)}`);
  const result = await readMemberQueryResponse(response);

  return { response, result };
}
