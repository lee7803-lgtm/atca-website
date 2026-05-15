export type CertificationStatus =
  | "submitted"
  | "under_review"
  | "need_more_info"
  | "approved"
  | "rejected"
  | "certificate_issued"
  | "cert_issued"
  | "delivered"
  | "archived"
  | "revoked";

export type CertificateStatus = "valid" | "expired" | "revoked" | "suspended";

export type CertificationType = "taoist_priest";

export type CertificationAttachment = {
  originalName: string;
  storagePath?: string;
  mimeType?: string;
  size?: number;
  fieldName: string;
  uploadedAt?: string;
  signedUrl?: string;
};

export type CertificationApplicationPayload = {
  certificationType: CertificationType;
  applicantName: string;
  applicantNameEn: string;
  taoistName: string;
  gender: string;
  birthDate: string;
  nationality: string;
  residence: string;
  phone: string;
  email: string;
  address: string;
  masterName: string;
  masterTaoistName: string;
  lineage: string;
  templeOrOrganization: string;
  sect: string;
  practiceYears: string;
  experienceSummary: string;
  applicationReason: string;
  additionalNote: string;
  existingCertificates: CertificationAttachment[];
  supportingDocuments: CertificationAttachment[];
  declarationAccepted: boolean;
  ethicsConfirmed: boolean;
  boundaryConfirmed: boolean;
  dataUseAccepted: boolean;
  certificatePublicAccepted: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  confirmedAt: string;
};

export type CertificationApplicationRecord = CertificationApplicationPayload & {
  id?: string;
  applicationNo: string;
  status: CertificationStatus;
  reviewNote: string;
  internalReviewNote: string;
  applicantFeedback: string;
  reviewer: string;
  reviewedAt: string | null;
  deliveryStatus: "not_delivered" | "delivered";
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CertificationApplicationAdminRecord = CertificationApplicationRecord & {
  id: string;
};

export type CertificationSubmitResponse =
  | {
      success: true;
      applicationNo: string;
      status: CertificationStatus;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export type CertificateRecord = {
  id?: string;
  certificateNo: string;
  applicationId: string;
  holderName: string;
  taoistName: string;
  taoistRank: string;
  sect: string;
  issuedDate: string;
  validFrom: string;
  validUntil: string;
  status: CertificateStatus;
  publicQueryEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CertificateQueryResult = {
  certificateNo: string;
  holderName: string;
  taoistName: string;
  taoistRank: string;
  sect: string;
  issuedDate: string;
  validFrom: string;
  validUntil: string;
  status: CertificateStatus;
};

export type CertificateQueryResponse =
  | {
      success: true;
      certificate: CertificateQueryResult;
    }
  | {
      success: false;
      message: string;
    };
