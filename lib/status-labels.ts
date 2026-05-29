import type { ApplicationQueryResult, ApplicationStatus } from "@/types/application";
import type { CertificationApplicationAdminRecord, CertificationStatus, SupplementalSubmission } from "@/types/certification";

const baseCertificationStatusText: Record<CertificationStatus, string> = {
  submitted: "已提交",
  under_review: "审核中",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "已驳回",
  certificate_issued: "已生成证书",
  cert_issued: "已生成证书",
  delivered: "已下发",
  archived: "已建档",
  revoked: "已撤销"
};

const baseApplicationStatusText: Record<ApplicationStatus, string> = {
  submitted: "已提交",
  pending_review: "待审核",
  under_review: "审核中",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "已驳回",
  archived: "已建档"
};

export function hasSupplementRecord(value: { supplementSubmittedAt?: string | null; supplementalSubmissions?: SupplementalSubmission[]; hasSupplementalSubmission?: boolean }) {
  return Boolean(value.supplementSubmittedAt || value.hasSupplementalSubmission || value.supplementalSubmissions?.length);
}

export function formatCertificationApplicationStatus(application: Pick<CertificationApplicationAdminRecord, "status" | "supplementSubmittedAt" | "supplementalSubmissions">) {
  if (application.status === "under_review" && hasSupplementRecord(application)) return "已补充，审核中";
  return baseCertificationStatusText[application.status] || "状态待确认";
}

export function formatApplicationStatus(application: { status: ApplicationStatus; supplementSubmittedAt?: string | null; supplementalSubmissions?: SupplementalSubmission[] }) {
  if (application.status === "under_review" && hasSupplementRecord(application)) return "已补充，审核中";
  return baseApplicationStatusText[application.status] || "状态待确认";
}

export function formatQueryStatus(application: ApplicationQueryResult) {
  if (application.status === "under_review" && hasSupplementRecord(application)) return "已补充，审核中";
  if (application.status in baseCertificationStatusText) return baseCertificationStatusText[application.status as CertificationStatus];
  if (application.status in baseApplicationStatusText) return baseApplicationStatusText[application.status as ApplicationStatus];
  return "状态待确认";
}

export function formatSupplementStatusChange(previousStatus: string, nextStatus: string) {
  const labelMap: Record<string, string> = {
    submitted: "已提交",
    pending_review: "待审核",
    under_review: "审核中",
    need_more_info: "需补充资料",
    approved: "已通过",
    rejected: "已驳回",
    certificate_issued: "已生成证书",
    cert_issued: "已生成证书",
    delivered: "已下发",
    archived: "已建档",
    revoked: "已撤销"
  };
  const previous = labelMap[previousStatus] || previousStatus;
  const next = nextStatus === "under_review" ? "已补充，审核中" : labelMap[nextStatus] || nextStatus;
  return `${previous || "未记录"} → ${next || "未记录"}`;
}
