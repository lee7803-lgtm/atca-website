import type { CertificationAttachment, CertificationPath, SupplementalSubmission } from "./certification";
import type { PublicPaymentOrder } from "./payment";

export type ApplicationType = "personal_member" | "organization_member";

export type ApplicationStatus = "submitted" | "pending_review" | "under_review" | "need_more_info" | "approved" | "rejected" | "archived";

export type RecordDisposition = "normal" | "test" | "archived" | "voided";

export type OrganizationType = "宫观" | "文化机构" | "培训机构" | "企业" | "其他" | "宫观道堂及文化场所" | "传统文化机构" | "教育研究机构" | "社团组织" | "合作单位";

export type ApplicationRecord = {
  id?: string;
  applicationNo: string;
  memberNo?: string | null;
  memberNoIssuedAt?: string | null;
  memberNoIssuedBy?: string | null;
  applicationNoScheme?: "legacy" | "arid" | string | null;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  country: string;
  profile: string;
  purpose: string;
  referrerName?: string;
  referrerContact?: string;
  referrerNote?: string;
  organizationType?: OrganizationType;
  receiveNotice?: boolean;
  truthConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  confirmedAt: string;
  adminNote?: string;
  recordDisposition?: RecordDisposition;
  recordDispositionNote?: string;
  recordDispositionAt?: string | null;
  recordDispositionBy?: string;
  supplementalSubmissions?: SupplementalSubmission[];
  supplementSubmittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationAdminRecord = Required<Pick<ApplicationRecord, "applicationNo" | "applicationType" | "status" | "name" | "contactName" | "phone" | "email" | "country" | "profile" | "purpose" | "createdAt" | "updatedAt">> & {
  id: string;
  memberNo: string;
  memberNoIssuedAt: string | null;
  memberNoIssuedBy: string;
  memberValidFrom: string | null;
  memberValidUntil: string | null;
  memberStatus: string;
  memberRenewalStatus: string;
  lastRenewedAt: string | null;
  memberStatusNote: string;
  memberEffectiveStatus: string;
  memberEffectiveStatusLabel: string;
  daysUntilExpiry: number | null;
  expiryBucket: string;
  referrerName: string;
  referrerContact: string;
  referrerNote: string;
  applicationNoScheme: string;
  organizationType: OrganizationType | null;
  receiveNotice: boolean;
  truthConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  confirmedAt: string;
  adminNote: string;
  recordDisposition: RecordDisposition;
  recordDispositionNote: string;
  recordDispositionAt: string | null;
  recordDispositionBy: string;
  supplementalSubmissions: SupplementalSubmission[];
  supplementSubmittedAt: string | null;
};

export type ApplicationSubmitPayload = {
  applicationType: ApplicationType;
  name: string;
  contactName?: string;
  phone: string;
  email: string;
  country: string;
  profile: string;
  purpose: string;
  referrerName?: string;
  referrerContact?: string;
  referrerNote?: string;
  organizationType?: OrganizationType;
  receiveNotice?: boolean;
  truthConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
};

export type ApplicationSubmitResponse =
  | {
      success: true;
      applicationNo: string;
      status: ApplicationStatus;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export type ApplicationQueryResult = {
  applicationNo: string;
  memberNo?: string | null;
  applicationType: ApplicationType | "taoist_certification";
  name: string;
  status: ApplicationStatus | "under_review" | "certificate_issued" | "cert_issued" | "delivered" | "revoked";
  adminNote: string;
  memberValidFrom?: string | null;
  memberValidUntil?: string | null;
  memberEffectiveStatus?: string | null;
  memberEffectiveStatusLabel?: string | null;
  certificateNo?: string;
  certificateDetailUrl?: string;
  certificateStatus?: "pending" | "valid" | "revoked" | "expired";
  certificateReviewStatus?: string | null;
  certificateEffectiveStatus?: string | null;
  certificateEffectiveStatusLabel?: string | null;
  certificateHolderName?: string;
  certificateTaoistName?: string;
  certificationPath?: CertificationPath | "";
  certificationLevel?: string;
  certificateLineageOrTemple?: string;
  certificateIssuer?: string;
  certificateIssuedDate?: string;
  certificateValidFrom?: string;
  certificateValidUntil?: string;
  certificatePhotoUrl?: string;
  certificatePhotoRecorded?: boolean;
  certificatePdfAvailable?: boolean;
  certificatePdfStatus?: string;
  certificatePdfGeneratedAt?: string | null;
  certificatePdfVersion?: number;
  certificatePdfFileSize?: number | null;
  deliveryStatus?: "not_delivered" | "delivered";
  deliveredAt?: string | null;
  supplementSubmittedAt?: string | null;
  hasSupplementalSubmission?: boolean;
  editableData?: Record<string, string>;
  supportingDocuments?: CertificationAttachment[];
  paymentOrders?: PublicPaymentOrder[];
  recordDisposition?: RecordDisposition;
  recordDispositionNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationQueryResponse =
  | {
      success: true;
      applications: ApplicationQueryResult[];
      application?: ApplicationQueryResult;
    }
  | {
      success: false;
      message: string;
    };
