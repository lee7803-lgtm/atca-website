export type ApplicationType = "personal_member" | "organization_member";

export type ApplicationStatus = "submitted" | "pending_review" | "need_more_info" | "approved" | "rejected";

export type OrganizationType = "宫观" | "文化机构" | "培训机构" | "企业" | "其他";

export type ApplicationRecord = {
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
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
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
  applicationType: ApplicationType;
  name: string;
  status: ApplicationStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationQueryResponse =
  | {
      success: true;
      application: ApplicationQueryResult;
    }
  | {
      success: false;
      message: string;
    };
