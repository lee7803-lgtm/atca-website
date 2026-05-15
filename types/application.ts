export type ApplicationType = "personal_member" | "organization_member";

export type ApplicationStatus = "submitted" | "pending_review" | "need_more_info" | "approved" | "rejected" | "archived";

export type OrganizationType = "宫观" | "文化机构" | "培训机构" | "企业" | "其他";

export type ApplicationRecord = {
  id?: string;
  applicationNo: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  country: string;
  profile: string;
  purpose: string;
  organizationType?: OrganizationType;
  receiveNotice?: boolean;
  truthConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  confirmedAt: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationAdminRecord = Required<Pick<ApplicationRecord, "applicationNo" | "applicationType" | "status" | "name" | "contactName" | "phone" | "email" | "country" | "profile" | "purpose" | "createdAt" | "updatedAt">> & {
  id: string;
  organizationType: OrganizationType | null;
  receiveNotice: boolean;
  truthConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  confirmedAt: string;
  adminNote: string;
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
  applicationType: ApplicationType | "taoist_certification";
  name: string;
  status: ApplicationStatus | "under_review" | "certificate_issued" | "cert_issued" | "delivered" | "revoked";
  adminNote: string;
  certificateNo?: string;
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
