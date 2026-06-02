export type MemberMaterialReviewStatus = "pending" | "approved" | "need_more_info" | "rejected";

export type MemberMaterialReviewKey = "identity" | "contact" | "membership" | "referral" | "materials";

export type MemberReviewItem = {
  status: MemberMaterialReviewStatus;
  note: string;
};

export type MemberMaterialReviewState = Record<MemberMaterialReviewKey, MemberReviewItem> & {
  initialReview: MemberReviewItem;
};

export const memberMaterialReviewKeys: MemberMaterialReviewKey[] = ["identity", "contact", "membership", "referral", "materials"];

export const memberMaterialReviewLabels: Record<MemberMaterialReviewKey, string> = {
  identity: "基础身份资料",
  contact: "联系方式资料",
  membership: "会员类型与申请信息",
  referral: "引荐人 / 所属宫观 / 机构信息",
  materials: "上传材料 / 附件资料"
};

export const memberMaterialReviewStatusLabels: Record<MemberMaterialReviewStatus, string> = {
  pending: "未审核",
  approved: "通过",
  need_more_info: "需补充",
  rejected: "不通过"
};

const markerPattern = /\n?\[\[member_material_review:([\s\S]*?)\]\]/;

function defaultItem(): MemberReviewItem {
  return { status: "pending", note: "" };
}

export function getDefaultMemberMaterialReview(): MemberMaterialReviewState {
  return {
    identity: defaultItem(),
    contact: defaultItem(),
    membership: defaultItem(),
    referral: defaultItem(),
    materials: defaultItem(),
    initialReview: defaultItem()
  };
}

function normalizeItem(value: unknown): MemberReviewItem {
  if (!value || typeof value !== "object") return defaultItem();
  const item = value as Partial<MemberReviewItem>;
  const status = item.status === "approved" || item.status === "need_more_info" || item.status === "rejected" ? item.status : "pending";
  return {
    status,
    note: typeof item.note === "string" ? item.note : ""
  };
}

export function parseMemberMaterialReview(adminNote: string): MemberMaterialReviewState {
  const defaults = getDefaultMemberMaterialReview();
  const match = adminNote.match(markerPattern);
  if (!match?.[1]) return defaults;

  try {
    const parsed = JSON.parse(match[1]) as Partial<MemberMaterialReviewState>;
    return {
      identity: normalizeItem(parsed.identity),
      contact: normalizeItem(parsed.contact),
      membership: normalizeItem(parsed.membership),
      referral: normalizeItem(parsed.referral),
      materials: normalizeItem(parsed.materials),
      initialReview: normalizeItem(parsed.initialReview)
    };
  } catch {
    return defaults;
  }
}

export function stripMemberMaterialReview(adminNote: string) {
  return adminNote.replace(markerPattern, "").trim();
}

export function mergeMemberMaterialReview(adminNote: string, review: MemberMaterialReviewState) {
  const visibleNote = stripMemberMaterialReview(adminNote);
  const marker = `[[member_material_review:${JSON.stringify(review)}]]`;
  return [visibleNote, marker].filter(Boolean).join("\n\n");
}

export function getMemberMaterialReviewBlockers(review: MemberMaterialReviewState) {
  return memberMaterialReviewKeys
    .filter((key) => review[key].status !== "approved")
    .map((key) => `${memberMaterialReviewLabels[key]}：${memberMaterialReviewStatusLabels[review[key].status]}`);
}
