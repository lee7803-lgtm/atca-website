import { getSiteBaseUrl } from "@/lib/site-url";
import { sanitizeNotificationPayload } from "./format";
import type { NotificationSafePayload, NotificationType } from "./types";

export type EmailNotificationTemplateInput = {
  notificationType: NotificationType;
  recipientName?: string;
  applicantName?: string;
  organizationName?: string;
  applicationNo?: string;
  memberNo?: string;
  certificateNo?: string;
  nextStep?: string;
  publicQueryUrl?: string;
  applicationQueryUrl?: string;
  certificateQueryUrl?: string;
  payloadJson?: NotificationSafePayload;
};

export type EmailNotificationTemplate = {
  subject: string;
  messageBody: string;
  templateKey: string;
  payloadJson: NotificationSafePayload;
};

type TemplateDefinition = {
  subject: string;
  opening: string;
  nextStep?: string;
  includeApplicationQuery?: boolean;
  includeCertificateQuery?: boolean;
};

const templateDefinitions: Record<string, TemplateDefinition> = {
  member_application_submitted: {
    subject: "ITCA 会员申请已提交",
    opening: "您的 ITCA 会员申请已提交。我们将按流程进行审核，并在状态更新后通知您。",
    nextStep: "您可通过官网申请进度查询入口查看最新进度。",
    includeApplicationQuery: true
  },
  organization_application_submitted: {
    subject: "ITCA 机构会员申请已提交",
    opening: "您的 ITCA 机构会员申请已提交。我们将按流程进行审核，并在状态更新后通知您。",
    nextStep: "您可通过官网申请进度查询入口查看最新进度。",
    includeApplicationQuery: true
  },
  certification_application_submitted: {
    subject: "ITCA 认证申请已提交",
    opening: "您的 ITCA 认证申请已提交。我们将按流程进行审核，并在状态更新后通知您。",
    nextStep: "您可通过官网申请进度查询入口查看最新进度。",
    includeApplicationQuery: true
  },
  member_application_need_more_info: {
    subject: "ITCA 会员申请需补充资料",
    opening: "您的 ITCA 会员申请需要补充资料。请根据官网申请进度查询页面显示的提示完成补充。",
    nextStep: "补充资料提交后，申请将继续进入审核流程。",
    includeApplicationQuery: true
  },
  certification_application_need_more_info: {
    subject: "ITCA 认证申请需补充资料",
    opening: "您的 ITCA 认证申请需要补充资料。请根据官网申请进度查询页面显示的提示完成补充。",
    nextStep: "补充资料提交后，申请将继续进入审核流程。",
    includeApplicationQuery: true
  },
  member_application_approved: {
    subject: "ITCA 会员申请已通过",
    opening: "您的 ITCA 会员申请已通过。会员信息已完成记录。",
    nextStep: "如需对外核验会员身份，可使用官网会员公众核验入口。",
    includeApplicationQuery: true
  },
  certification_application_approved: {
    subject: "ITCA 认证申请已通过",
    opening: "您的 ITCA 认证申请已通过。后续证书生成与下发状态将以官网申请进度查询为准。",
    nextStep: "证书生成后，可通过官网证书公众核验入口核验证书真实性。",
    includeApplicationQuery: true,
    includeCertificateQuery: true
  },
  member_application_rejected: {
    subject: "ITCA 会员申请未通过",
    opening: "您的 ITCA 会员申请未通过。请以官网申请进度查询页面显示的结果为准。",
    nextStep: "如需进一步了解公开流程，可通过官网联系方式咨询。",
    includeApplicationQuery: true
  },
  certification_application_rejected: {
    subject: "ITCA 认证申请未通过",
    opening: "您的 ITCA 认证申请未通过。请以官网申请进度查询页面显示的结果为准。",
    nextStep: "如需进一步了解公开流程，可通过官网联系方式咨询。",
    includeApplicationQuery: true
  },
  certificate_generated: {
    subject: "ITCA 证书已生成",
    opening: "您的 ITCA 证书记录已生成。证书真实性可通过官网证书公众核验入口进行核验。",
    nextStep: "公众核验页仅用于核验证书真实性，不提供 PDF 下载。",
    includeApplicationQuery: true,
    includeCertificateQuery: true
  },
  certificate_pdf_generated: {
    subject: "ITCA 正式证书 PDF 已生成",
    opening: "您的 ITCA 正式证书 PDF 已生成。PDF 仅面向申请人本人通过申请进度查询入口下载。",
    nextStep: "公众核验页不提供证书 PDF 下载入口。",
    includeApplicationQuery: true,
    includeCertificateQuery: true
  }
};

export function buildEmailNotificationTemplate(input: EmailNotificationTemplateInput): EmailNotificationTemplate {
  const definition = templateDefinitions[input.notificationType] || {
    subject: "ITCA 通知",
    opening: "您的 ITCA 申请或证书状态已有更新。请通过官网查询入口查看最新信息。",
    nextStep: "如需进一步了解，请通过官网联系方式咨询。",
    includeApplicationQuery: true
  };
  const urls = buildNotificationUrls(input);
  const lines = [
    `${resolveRecipientName(input)}：`,
    "",
    definition.opening,
    "",
    ...buildReferenceLines(input),
    definition.nextStep || input.nextStep ? `后续说明：${input.nextStep || definition.nextStep}` : "",
    definition.includeApplicationQuery ? `申请进度查询：${urls.applicationQueryUrl}` : "",
    definition.includeCertificateQuery ? `证书公众核验：${urls.certificateQueryUrl}` : "",
    input.publicQueryUrl ? `公众查询入口：${input.publicQueryUrl}` : "",
    "",
    "此邮件为 ITCA 官网系统通知。请勿回复本邮件；如需协助，请通过官网公布的联系方式联系。"
  ].filter((line) => line !== undefined);

  return {
    subject: definition.subject,
    messageBody: lines.join("\n"),
    templateKey: `email.${input.notificationType}`,
    payloadJson: sanitizeNotificationPayload({
      notificationType: input.notificationType,
      applicantName: input.applicantName,
      organizationName: input.organizationName,
      applicationNo: input.applicationNo,
      memberNo: input.memberNo,
      certificateNo: input.certificateNo,
      applicationQueryUrl: definition.includeApplicationQuery ? urls.applicationQueryUrl : undefined,
      certificateQueryUrl: definition.includeCertificateQuery ? urls.certificateQueryUrl : undefined,
      publicQueryUrl: input.publicQueryUrl,
      ...(input.payloadJson || {})
    })
  };
}

function buildReferenceLines(input: EmailNotificationTemplateInput) {
  return [
    input.applicationNo ? `申请编号：${input.applicationNo}` : "",
    input.memberNo ? `会员编号：${input.memberNo}` : "",
    input.certificateNo ? `证书编号：${input.certificateNo}` : ""
  ].filter(Boolean);
}

function buildNotificationUrls(input: EmailNotificationTemplateInput) {
  const siteBaseUrl = safeGetSiteBaseUrl();
  return {
    applicationQueryUrl: input.applicationQueryUrl || new URL("/application/query", siteBaseUrl).toString(),
    certificateQueryUrl: input.certificateQueryUrl || new URL("/certificate-query", siteBaseUrl).toString()
  };
}

function resolveRecipientName(input: EmailNotificationTemplateInput) {
  return input.recipientName || input.applicantName || input.organizationName || "您好";
}

function safeGetSiteBaseUrl() {
  try {
    return getSiteBaseUrl();
  } catch {
    return "https://itca.org";
  }
}
