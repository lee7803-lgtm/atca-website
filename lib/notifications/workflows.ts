import "server-only";

import { sendEmailNotification } from "./email/send";
import type { SendEmailNotificationInput, SendEmailNotificationResult } from "./email/types";
import type { ApplicationAdminRecord, ApplicationRecord, ApplicationStatus, ApplicationType } from "@/types/application";
import type { CertificateRecord, CertificationApplicationAdminRecord, CertificationStatus } from "@/types/certification";

type SafeApplication = Pick<ApplicationRecord, "applicationNo" | "applicationType" | "name" | "contactName" | "email" | "phone"> & {
  id?: string;
  memberNo?: string | null;
};

type SafeCertificationApplication = Pick<CertificationApplicationAdminRecord, "id" | "applicationNo" | "applicantName" | "email" | "phone">;

type SafeCertificate = Pick<CertificateRecord, "certificateNo" | "holderName"> & {
  id?: string;
};

const memberReviewNotificationTypes: Partial<Record<ApplicationStatus, SendEmailNotificationInput["notificationType"]>> = {
  approved: "member_application_approved",
  rejected: "member_application_rejected",
  need_more_info: "member_application_need_more_info"
};

const certificationReviewNotificationTypes: Partial<Record<CertificationStatus, SendEmailNotificationInput["notificationType"]>> = {
  approved: "certification_application_approved",
  rejected: "certification_application_rejected",
  need_more_info: "certification_application_need_more_info"
};

export async function recordMemberApplicationSubmittedNotification(application: SafeApplication) {
  return safeSendEmailNotification({
    notificationType: application.applicationType === "organization_member" ? "organization_application_submitted" : "member_application_submitted",
    recipientName: getApplicationRecipientName(application),
    recipientEmail: application.email,
    applicationId: application.id,
    applicationNo: application.applicationNo,
    memberNo: application.memberNo || undefined,
    sourceType: "application",
    sourceAction: "submitted",
    applicantName: application.applicationType === "personal_member" ? application.name : undefined,
    organizationName: application.applicationType === "organization_member" ? application.name : undefined,
    payloadJson: buildBasePayload(application)
  });
}

export async function recordCertificationApplicationSubmittedNotification(application: SafeCertificationApplication) {
  return safeSendEmailNotification({
    notificationType: "certification_application_submitted",
    recipientName: application.applicantName,
    recipientEmail: application.email,
    certificationApplicationId: application.id,
    applicationNo: application.applicationNo,
    sourceType: "certification_application",
    sourceAction: "submitted",
    applicantName: application.applicantName,
    payloadJson: {
      applicationNo: application.applicationNo,
      applicationKind: "certification"
    }
  });
}

export async function recordMemberApplicationReviewNotification(application: SafeApplication | ApplicationAdminRecord, status: ApplicationStatus) {
  const notificationType = memberReviewNotificationTypes[status];
  if (!notificationType) return skippedResult("member_review_status_not_notifiable");

  return safeSendEmailNotification({
    notificationType,
    recipientName: getApplicationRecipientName(application),
    recipientEmail: application.email,
    applicationId: application.id,
    applicationNo: application.applicationNo,
    memberNo: application.memberNo || undefined,
    sourceType: "application",
    sourceAction: `review_${status}`,
    applicantName: application.applicationType === "personal_member" ? application.name : undefined,
    organizationName: application.applicationType === "organization_member" ? application.name : undefined,
    payloadJson: {
      ...buildBasePayload(application),
      status
    }
  });
}

export async function recordCertificationApplicationReviewNotification(application: SafeCertificationApplication, status: CertificationStatus) {
  const notificationType = certificationReviewNotificationTypes[status];
  if (!notificationType) return skippedResult("certification_review_status_not_notifiable");

  return safeSendEmailNotification({
    notificationType,
    recipientName: application.applicantName,
    recipientEmail: application.email,
    certificationApplicationId: application.id,
    applicationNo: application.applicationNo,
    sourceType: "certification_application",
    sourceAction: `review_${status}`,
    applicantName: application.applicantName,
    payloadJson: {
      applicationNo: application.applicationNo,
      applicationKind: "certification",
      status
    }
  });
}

export async function recordSupplementSubmittedNotification(input: {
  applicationId?: string;
  certificationApplicationId?: string;
  applicationNo: string;
  recipientName: string;
  recipientEmail: string;
  applicationKind: "member" | "organization" | "certification";
  supplementRound?: number;
}) {
  return safeSendEmailNotification({
    notificationType: "supplement_submitted",
    recipientName: input.recipientName,
    recipientEmail: input.recipientEmail,
    applicationId: input.applicationId,
    certificationApplicationId: input.certificationApplicationId,
    applicationNo: input.applicationNo,
    sourceType: input.applicationKind === "certification" ? "certification_application" : "application",
    sourceAction: `supplement_submitted_${input.supplementRound || 1}`,
    applicantName: input.applicationKind === "certification" ? input.recipientName : undefined,
    organizationName: input.applicationKind === "organization" ? input.recipientName : undefined,
    payloadJson: {
      applicationNo: input.applicationNo,
      applicationKind: input.applicationKind,
      supplementRound: input.supplementRound || 1
    }
  });
}

export async function recordCertificateGeneratedNotification(application: SafeCertificationApplication, certificate: SafeCertificate) {
  return safeSendEmailNotification({
    notificationType: "certificate_generated",
    recipientName: application.applicantName || certificate.holderName,
    recipientEmail: application.email,
    certificationApplicationId: application.id,
    certificateId: certificate.id,
    applicationNo: application.applicationNo,
    certificateNo: certificate.certificateNo,
    sourceType: "certificate",
    sourceAction: "generated",
    applicantName: application.applicantName,
    payloadJson: {
      applicationNo: application.applicationNo,
      certificateNo: certificate.certificateNo,
      applicationKind: "certification"
    }
  });
}

export async function recordCertificatePdfGeneratedNotification(application: SafeCertificationApplication, certificate: SafeCertificate) {
  return safeSendEmailNotification({
    notificationType: "certificate_pdf_generated",
    recipientName: application.applicantName || certificate.holderName,
    recipientEmail: application.email,
    certificationApplicationId: application.id,
    certificateId: certificate.id,
    applicationNo: application.applicationNo,
    certificateNo: certificate.certificateNo,
    sourceType: "certificate_pdf",
    sourceAction: "generated",
    applicantName: application.applicantName,
    payloadJson: {
      applicationNo: application.applicationNo,
      certificateNo: certificate.certificateNo,
      applicationKind: "certification"
    }
  });
}

export async function recordCertificateDeliveredNotification(application: SafeCertificationApplication, certificate?: SafeCertificate | null) {
  return safeSendEmailNotification({
    notificationType: "certificate_delivered",
    recipientName: application.applicantName || certificate?.holderName,
    recipientEmail: application.email,
    certificationApplicationId: application.id,
    certificateId: certificate?.id,
    applicationNo: application.applicationNo,
    certificateNo: certificate?.certificateNo,
    sourceType: "certificate",
    sourceAction: "delivered",
    applicantName: application.applicantName,
    payloadJson: {
      applicationNo: application.applicationNo,
      certificateNo: certificate?.certificateNo,
      applicationKind: "certification"
    }
  });
}

export async function recordMemberStatusUpdatedNotification(application: ApplicationAdminRecord) {
  return safeSendEmailNotification({
    notificationType: "member_status_updated",
    recipientName: getApplicationRecipientName(application),
    recipientEmail: application.email,
    applicationId: application.id,
    applicationNo: application.applicationNo,
    memberNo: application.memberNo || undefined,
    sourceType: "member",
    sourceAction: "status_updated",
    applicantName: application.applicationType === "personal_member" ? application.name : undefined,
    organizationName: application.applicationType === "organization_member" ? application.name : undefined,
    payloadJson: {
      ...buildBasePayload(application),
      memberStatus: application.memberStatus,
      memberRenewalStatus: application.memberRenewalStatus
    }
  });
}

export async function recordCertificateStatusUpdatedNotification(application: SafeCertificationApplication, certificate: SafeCertificate) {
  return safeSendEmailNotification({
    notificationType: "certificate_status_updated",
    recipientName: application.applicantName || certificate.holderName,
    recipientEmail: application.email,
    certificationApplicationId: application.id,
    certificateId: certificate.id,
    applicationNo: application.applicationNo,
    certificateNo: certificate.certificateNo,
    sourceType: "certificate",
    sourceAction: "status_updated",
    applicantName: application.applicantName,
    payloadJson: {
      applicationNo: application.applicationNo,
      certificateNo: certificate.certificateNo,
      applicationKind: "certification"
    }
  });
}

async function safeSendEmailNotification(input: SendEmailNotificationInput) {
  try {
    return await sendEmailNotification(input);
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      provider: "none",
      errorMessage: error instanceof Error ? error.message : "Notification recording failed.",
      error: error instanceof Error ? error.message : "Notification recording failed."
    } satisfies SendEmailNotificationResult;
  }
}

function getApplicationRecipientName(application: Pick<ApplicationRecord, "applicationType" | "name" | "contactName">) {
  return application.applicationType === "organization_member" ? application.contactName || application.name : application.name;
}

function buildBasePayload(application: Pick<ApplicationRecord, "applicationNo" | "applicationType"> & { memberNo?: string | null }) {
  return {
    applicationNo: application.applicationNo,
    memberNo: application.memberNo || undefined,
    applicationKind: application.applicationType === "organization_member" ? "organization" : "member"
  };
}

function skippedResult(reason: string): SendEmailNotificationResult {
  return {
    ok: true,
    status: "skipped",
    provider: "none",
    skippedReason: reason,
    errorMessage: reason,
    error: reason
  };
}
