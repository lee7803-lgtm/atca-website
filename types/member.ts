export type MemberQueryResult = {
  memberNo: string;
  holderName: string;
  memberType: "个人会员" | "机构会员" | string;
  status: string;
  statusLabel: string;
  memberValidFrom?: string | null;
  memberValidUntil?: string | null;
  memberStatus?: string;
  memberRenewalStatus?: string;
  effectiveStatus?: string;
  effectiveStatusLabel?: string;
  daysUntilExpiry?: number | null;
  expiryBucket?: string;
  registeredAt: string;
  approvedAt: string;
  issuer: string;
  verificationNote: string;
};

export type MemberQueryResponse =
  | {
      success: true;
      member: MemberQueryResult;
    }
  | {
      success: false;
      message: string;
    };
