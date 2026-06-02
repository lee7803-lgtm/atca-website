export type MasterDataKind = "referee" | "organization";
export type MasterDataStatus = "active" | "inactive";
export type MasterDataReviewStatus = "pending" | "approved" | "rejected";
export type MasterDataSource = "admin_created" | "applicant_submitted" | "migrated";

export type MasterDataEntry = {
  id: string;
  kind: MasterDataKind;
  name: string;
  displayName: string;
  type: string;
  country: string;
  region: string;
  status: MasterDataStatus;
  reviewStatus: MasterDataReviewStatus;
  source: MasterDataSource;
  phone: string;
  email: string;
  note: string;
  internalNote: string;
  createdAt: string;
  updatedAt: string;
};
