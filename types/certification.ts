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

export type CertificateStatus = "pending" | "valid" | "revoked" | "expired";

export type CertificationType = "taoist_priest";

export type CertificationPath = "zhengyi" | "quanzhen" | "other_international";

export type CertificationLevel =
  | "refuge_entry"
  | "transmission_or_crowning"
  | "register_or_precept"
  | "senior_taoist"
  | "special_lineage";

export type MaterialReviewStatus = "pending" | "passed" | "need_more_info" | "questionable" | "not_applicable";

export type MaterialReview = {
  identity: MaterialReviewStatus;
  lineage: MaterialReviewStatus;
  credential: MaterialReviewStatus;
  practice: MaterialReviewStatus;
  recommendation: MaterialReviewStatus;
  ethics: MaterialReviewStatus;
  photo: MaterialReviewStatus;
  completeness: MaterialReviewStatus;
  international: MaterialReviewStatus;
};

export const certificationPathLabels: Record<CertificationPath, string> = {
  zhengyi: "正一",
  quanzhen: "全真",
  other_international: "其他传承"
};

export const certificationLevelLabels: Record<CertificationLevel, string> = {
  refuge_entry: "皈依 / 入道确认",
  transmission_or_crowning: "传度 / 冠巾资格确认",
  register_or_precept: "授箓 / 传戒资格确认",
  senior_taoist: "高道 / 资深道职确认",
  special_lineage: "其他特殊传承说明"
};

export const materialReviewStatusLabels: Record<MaterialReviewStatus, string> = {
  pending: "待审核",
  passed: "通过",
  need_more_info: "需补充",
  questionable: "存疑",
  not_applicable: "不适用"
};

export const materialReviewItemLabels: Record<keyof MaterialReview, string> = {
  identity: "身份真实性",
  lineage: "师承 / 传承",
  credential: "资质凭证",
  practice: "实践经历",
  recommendation: "推荐证明",
  ethics: "伦理承诺",
  photo: "道装证件照",
  completeness: "材料完整性",
  international: "国际申请材料"
};

export type CertificationAttachment = {
  originalName: string;
  storagePath?: string;
  mimeType?: string;
  size?: number;
  fieldName: string;
  uploadedAt?: string;
  signedUrl?: string;
  source?: "application" | "supplement";
  supplementRound?: number;
};

export type SupplementalSubmission = {
  submittedAt: string;
  submittedBy: "applicant" | "admin";
  applicationNo: string;
  contact: string;
  note: string;
  changedFields: Array<{ field: string; oldValue?: string; newValue?: string }>;
  files: CertificationAttachment[];
  previousStatus: string;
  nextStatus: string;
};

export type CertificationApplicationPayload = {
  certificationType: CertificationType;
  certificationPath: CertificationPath | "";
  requestedLevel: CertificationLevel | "";
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
  recommenderName: string;
  recommenderContact: string;
  recommenderRelation: string;
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
  certificatePhotoPath: string;
};

export type CertificationApplicationRecord = CertificationApplicationPayload & {
  id?: string;
  applicationNo: string;
  status: CertificationStatus;
  reviewNote: string;
  internalReviewNote: string;
  applicantFeedback: string;
  approvedPath: CertificationPath | "";
  approvedLevel: CertificationLevel | "";
  materialReview: MaterialReview;
  committeeReviewNote: string;
  reviewer: string;
  reviewedAt: string | null;
  deliveryStatus: "not_delivered" | "delivered";
  deliveredAt: string | null;
  supplementalSubmissions: SupplementalSubmission[];
  supplementSubmittedAt: string | null;
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
  certificationPath: CertificationPath | "";
  certificationLevel: CertificationLevel | string;
  lineageOrTemple: string;
  certificatePhotoPath: string;
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
  certificationType: string;
  certificationPath: CertificationPath | "";
  certificationLevel: string;
  issuer: string;
  issuedDate: string;
  validFrom: string;
  validUntil: string;
  status: CertificateStatus;
  detailUrl: string;
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
