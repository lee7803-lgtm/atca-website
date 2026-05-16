export type Announcement = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  body: string[];
};

export const announcements: Announcement[] = [
  {
    slug: "official-website-launch",
    title: "ITCA 官网初版上线说明",
    date: "2026-05-16",
    summary: "本网站用于发布协会介绍、认证申请、会员申请、证书核验与合作联系等信息服务。",
    body: [
      "ITCA 官网初版已开放基础信息服务，内容包括协会介绍、认证体系说明、个人会员申请、机构会员申请、证书核验与联系合作入口。",
      "官网将作为申请资料提交、进度查询、证书公开核验及协会信息说明的统一入口。相关申请与证书信息以 ITCA 官方审核及登记记录为准。",
      "后续网站内容将围绕认证申请服务、会员服务、资料使用说明及核验说明持续完善。"
    ]
  },
  {
    slug: "taoist-certification-open",
    title: "ITCA 道士资格认证申请通道开放说明",
    date: "2026-05-16",
    summary: "当前开放道士资格认证申请，用于资料审核、记录建档、证书核验与文化交流场景中的身份信息展示。",
    body: [
      "ITCA 当前开放道士资格认证申请通道。申请人可通过官网提交身份资料、师承信息、修学经历、实践说明及相关证明材料。",
      "申请提交后将进入人工审核流程。ITCA 可根据材料完整性与核验需要要求申请人补充资料，审核结果以 ITCA 审核记录为准。",
      "审核通过并生成证书后，证书编号、姓名、认证类型、签发日期及证书状态等必要公开信息可用于官网核验。"
    ]
  },
  {
    slug: "certificate-verification-build",
    title: "ITCA 证书核验功能建设说明",
    date: "2026-05-16",
    summary: "证书核验入口用于公众核验公开证书信息，证书状态以官网核验结果为准。",
    body: [
      "ITCA 官网已建设证书核验入口。公众可通过证书编号与持证人姓名核验公开证书信息。",
      "证书查询结果仅展示公开核验所需信息，不展示申请编号、联系方式、上传材料、审核反馈或内部备注。",
      "如查询不到记录，建议确认输入信息是否与证书登记信息一致，或通过官网联系入口提交核对请求。"
    ]
  }
];

export function getAnnouncement(slug: string) {
  return announcements.find((item) => item.slug === slug);
}
