export type CmsPublishStatus = "draft" | "review" | "legal_review" | "scheduled" | "published" | "offline" | "archived";
export type CmsRiskLevel = "normal" | "protected" | "sensitive";

export type CmsChannel = {
  alias?: string;
  blocks: string[];
  description: string;
  id: string;
  label: string;
  ownerRole: string;
  parentId?: string;
  path: string;
  previousLabel?: string;
  protectedRoute: boolean;
  riskLevel: CmsRiskLevel;
  seoTitle: string;
  sortOrder: number;
  status: CmsPublishStatus;
  subChannels?: CmsChannel[];
  templateFields?: string[];
  type: "core" | "culture" | "business" | "data" | "sub_channel";
  visible: boolean;
  visibleInTopNav?: boolean;
};

export type CmsTemplateField = {
  description: string;
  id: string;
  required: boolean;
  title: string;
};

export type CmsBlockTemplate = {
  category: string;
  description: string;
  id: string;
  name: string;
  reviewRequired?: boolean;
};

export type CmsContentItem = {
  channel: string;
  id: string;
  owner: string;
  status: CmsPublishStatus;
  title: string;
  type: "article" | "announcement" | "rule" | "faq" | "report";
  updatedAt: string;
};

export type CmsReviewItem = {
  assignee: string;
  id: string;
  risk: string;
  status: CmsPublishStatus;
  title: string;
  type: string;
};

export type CmsAssetItem = {
  alt: string;
  id: string;
  licenseNote: string;
  name: string;
  status: string;
  type: "image" | "pdf" | "attachment";
};

export type CmsRevisionItem = {
  actor: string;
  action: string;
  id: string;
  note: string;
  target: string;
  time: string;
};

export const cmsChannelHomeTemplateFields: CmsTemplateField[] = [
  { description: "SEO 标题、SEO 摘要、关键词和规范路径。", id: "seo", required: true, title: "SEO 信息" },
  { description: "栏目标题、副标题、简介、主视觉和主次操作入口。", id: "hero", required: true, title: "Hero 首屏" },
  { description: "频道定位、适用对象、内容边界和阅读导引。", id: "intro", required: true, title: "栏目导语" },
  { description: "申请、查询、合作、资料、公告等真实入口。", id: "core_entries", required: true, title: "核心入口" },
  { description: "重点制度、公告、专题、发展中心或资料库聚合。", id: "featured_content", required: true, title: "重点内容" },
  { description: "申请、审核、付款、证书、核验、合作、公开授权等流程说明。", id: "process", required: true, title: "业务流程说明" },
  { description: "认证、道医中医、易学、数据公开、未成年人等边界文案。", id: "compliance", required: true, title: "合规边界说明" },
  { description: "相关文章、制度、公告、活动、资料库条目和页面互链。", id: "related", required: false, title: "关联内容" },
  { description: "发布时间、更新人、发布状态和下架/归档信息。", id: "publish_info", required: true, title: "发布信息" },
  { description: "草稿、待审核、待秘书处/法务确认、已发布等审核状态。", id: "review_status", required: true, title: "审核状态" },
  { description: "版本号、变更说明、历史版本和回滚申请。", id: "revision", required: true, title: "版本记录" }
];

export const cmsChannels: CmsChannel[] = [
  {
    blocks: ["首页 Hero", "快捷入口", "公告摘要", "发展中心推荐", "会员认证说明"],
    description: "官网门户入口，承接会员、认证、查询、合作、资料中心等核心入口。",
    id: "home",
    label: "首页",
    ownerRole: "超级管理员",
    path: "/",
    protectedRoute: true,
    riskLevel: "protected",
    seoTitle: "国际道教与文化协会 ITCA",
    sortOrder: 1,
    status: "published",
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "core",
    visible: true,
    visibleInTopNav: true
  },
  {
    alias: "/about",
    blocks: ["Hero 首屏", "栏目导语", "协会介绍", "规章制度", "组织架构", "联系协会", "边界说明"],
    description: "原“介绍”栏目升级为“关于协会”，说明协会定位、规章制度、组织架构和联系入口。",
    id: "about",
    label: "关于协会",
    ownerRole: "秘书处管理员",
    path: "/intro",
    previousLabel: "介绍",
    protectedRoute: true,
    riskLevel: "protected",
    seoTitle: "关于协会｜国际道教与文化协会 ITCA",
    sortOrder: 2,
    status: "published",
    subChannels: [
      {
        alias: "/about",
        blocks: ["Hero 首屏", "栏目导语", "协会介绍", "服务对象", "联系入口"],
        description: "关于协会频道首页，承接协会介绍、制度、组织架构和联系协会。",
        id: "about-intro",
        label: "协会介绍",
        ownerRole: "秘书处管理员",
        parentId: "about",
        path: "/intro",
        protectedRoute: true,
        riskLevel: "protected",
        seoTitle: "协会介绍｜国际道教与文化协会 ITCA",
        sortOrder: 1,
        status: "published",
        templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
        type: "sub_channel",
        visible: true,
        visibleInTopNav: false
      },
      {
        blocks: ["制度分类", "制度列表", "重点制度摘要", "版本与修订", "适用说明"],
        description: "关于协会下的制度公开页，公开章程、会员规则、认证规则、证书公开核验、资料公开、合作规则和投诉申诉规则。",
        id: "rules",
        label: "规章制度",
        ownerRole: "秘书处管理员",
        parentId: "about",
        path: "/rules",
        protectedRoute: true,
        riskLevel: "sensitive",
        seoTitle: "关于协会 · 规章制度｜国际道教与文化协会 ITCA",
        sortOrder: 2,
        status: "review",
        templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
        type: "sub_channel",
        visible: true,
        visibleInTopNav: false
      },
      {
        blocks: ["组织说明", "理事会", "秘书处", "认证委员会", "专家顾问委员会", "发展中心"],
        description: "关于协会下的组织架构页，说明协会治理、秘书处和业务委员会分工。",
        id: "organization",
        label: "组织架构",
        ownerRole: "秘书处管理员",
        parentId: "about",
        path: "/organization",
        protectedRoute: true,
        riskLevel: "protected",
        seoTitle: "组织架构｜国际道教与文化协会 ITCA",
        sortOrder: 3,
        status: "published",
        templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
        type: "sub_channel",
        visible: true,
        visibleInTopNav: false
      },
      {
        blocks: ["联系说明", "会员申请", "认证申请", "发展合作", "资料更正"],
        description: "关于协会下的联系入口，承接会员申请、认证申请、发展合作和资料更正。",
        id: "contact",
        label: "联系协会",
        ownerRole: "秘书处管理员",
        parentId: "about",
        path: "/contact",
        protectedRoute: true,
        riskLevel: "normal",
        seoTitle: "联系协会｜国际道教与文化协会 ITCA",
        sortOrder: 4,
        status: "published",
        templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
        type: "sub_channel",
        visible: true,
        visibleInTopNav: false
      }
    ],
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "core",
    visible: true,
    visibleInTopNav: true
  },
  {
    blocks: ["基础介绍", "文化主题", "文章列表", "术语解释", "边界说明"],
    description: "面向公众介绍道教信仰文化、宫观文化、修行生活和公开表达边界。",
    id: "faith",
    label: "道教信仰",
    ownerRole: "内容管理员",
    path: "/faith",
    protectedRoute: false,
    riskLevel: "normal",
    seoTitle: "道教信仰｜国际道教与文化协会 ITCA",
    sortOrder: 3,
    status: "published",
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "culture",
    visible: true,
    visibleInTopNav: true
  },
  {
    blocks: ["经典导读", "思想主题", "学习路径", "术语库", "关联课程"],
    description: "承接经典导读、思想主题、学习路径、术语库和教育发展中心课程关联。",
    id: "doctrine",
    label: "教理教义",
    ownerRole: "内容管理员",
    path: "/doctrine",
    protectedRoute: false,
    riskLevel: "normal",
    seoTitle: "教理教义｜国际道教与文化协会 ITCA",
    sortOrder: 4,
    status: "published",
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "culture",
    visible: true,
    visibleInTopNav: true
  },
  {
    blocks: ["交流动态", "项目展示", "活动报道", "合作入口", "资料沉淀"],
    description: "展示交流动态、会议访问、项目案例、活动报道和发展合作入口。",
    id: "exchange",
    label: "文化交流",
    ownerRole: "内容管理员",
    path: "/exchange",
    protectedRoute: false,
    riskLevel: "normal",
    seoTitle: "文化交流｜国际道教与文化协会 ITCA",
    sortOrder: 5,
    status: "published",
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "culture",
    visible: true,
    visibleInTopNav: true
  },
  {
    blocks: ["中心入口", "六大发展中心", "项目与计划", "课程活动", "成果展示"],
    description: "六大发展中心总入口，承接专委会、项目、课程活动、合作和成果沉淀。",
    id: "development",
    label: "发展中心",
    ownerRole: "发展中心管理员",
    path: "/development",
    protectedRoute: true,
    riskLevel: "protected",
    seoTitle: "发展中心｜国际道教与文化协会 ITCA",
    sortOrder: 6,
    status: "published",
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "business",
    visible: true,
    visibleInTopNav: true
  },
  {
    blocks: ["会员类型", "权益说明", "申请流程", "费用与有效期", "FAQ"],
    description: "个人会员、机构会员、权益、申请流程、续期说明和会员公开核验入口。",
    id: "membership",
    label: "会员体系",
    ownerRole: "会员管理员",
    path: "/membership",
    protectedRoute: true,
    riskLevel: "protected",
    seoTitle: "会员体系｜国际道教与文化协会 ITCA",
    sortOrder: 7,
    status: "published",
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "business",
    visible: true,
    visibleInTopNav: true
  },
  {
    blocks: ["认证类型", "申请材料", "审核流程", "证书说明", "合规边界"],
    description: "认证类型、材料清单、审核流程、证书公开核验和协会认证边界说明。",
    id: "certification",
    label: "认证体系",
    ownerRole: "认证管理员",
    path: "/certification",
    protectedRoute: true,
    riskLevel: "sensitive",
    seoTitle: "认证体系｜国际道教与文化协会 ITCA",
    sortOrder: 8,
    status: "review",
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "business",
    visible: true,
    visibleInTopNav: true
  },
  {
    blocks: ["证书公开核验", "会员公开核验", "申请进度查询", "边界说明", "FAQ"],
    description: "查询核验聚合频道，承接证书公开核验、会员公开核验和申请进度查询。",
    id: "verification",
    label: "查询核验",
    ownerRole: "证书管理员",
    path: "/verification",
    protectedRoute: true,
    riskLevel: "protected",
    seoTitle: "查询核验｜国际道教与文化协会 ITCA",
    sortOrder: 9,
    status: "published",
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "business",
    visible: true,
    visibleInTopNav: true
  },
  {
    blocks: ["合作类型", "合作流程", "合作案例", "提交说明", "边界说明"],
    description: "合作类型、合作流程、案例展示、提交说明和授权边界。",
    id: "cooperation",
    label: "发展合作",
    ownerRole: "秘书处管理员",
    path: "/cooperation",
    protectedRoute: false,
    riskLevel: "normal",
    seoTitle: "发展合作｜国际道教与文化协会 ITCA",
    sortOrder: 10,
    status: "published",
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "business",
    visible: true,
    visibleInTopNav: true
  },
  {
    blocks: ["八类数据库入口", "数据列表", "数据详情", "授权说明", "纠错撤回"],
    description: "机构库、个人库、平台库、传承库、课程库、产品库、活动库和基地库入口。",
    id: "data",
    label: "资料中心",
    ownerRole: "资料中心管理员",
    path: "/data",
    protectedRoute: true,
    riskLevel: "sensitive",
    seoTitle: "资料中心｜国际道教与文化协会 ITCA",
    sortOrder: 11,
    status: "legal_review",
    templateFields: cmsChannelHomeTemplateFields.map((field) => field.id),
    type: "data",
    visible: true,
    visibleInTopNav: true
  }
];

export const cmsBlockLibrary: CmsBlockTemplate[] = [
  { category: "页面基础", description: "配置标题、副标题、简介、背景图、主按钮和次按钮。", id: "hero", name: "Hero 首屏" },
  { category: "内容展示", description: "用于服务对象、制度分类、发展中心入口、资料库入口。", id: "cards", name: "三/六卡片组" },
  { category: "内容展示", description: "用于协会介绍、制度说明、边界说明的正文展示。", id: "rich-text", name: "富文本区块" },
  { category: "内容展示", description: "用于文化介绍、项目案例和活动报道。", id: "image-text", name: "图文区块" },
  { category: "结构化", description: "用于发展历程、制度修订、项目进度。", id: "timeline", name: "时间线" },
  { category: "文件", description: "用于制度 PDF、公开附件和版本文件下载。", id: "downloads", name: "文件下载列表", reviewRequired: true },
  { category: "问答", description: "用于会员、认证、查询核验和合作常见问题。", id: "faq", name: "FAQ" },
  { category: "聚合", description: "用于公告、文化文章、交流动态聚合。", id: "article-list", name: "文章列表" },
  { category: "聚合", description: "用于课程、活动、报名说明和回顾展示。", id: "event-list", name: "活动课程列表" },
  { category: "资料中心", description: "用于八类数据库入口和公开数量展示。", id: "database-entry", name: "数据库入口组", reviewRequired: true },
  { category: "合规", description: "用于认证、道医、易学、隐私、数据公开等高风险提示。", id: "boundary", name: "边界说明框", reviewRequired: true },
  { category: "转化", description: "用于申请、查询、合作、联系入口。", id: "cta", name: "CTA 操作区" }
];

export const cmsContentItems: CmsContentItem[] = [
  { channel: "关于协会 / 规章制度", id: "rule-cert-boundary", owner: "秘书处", status: "review", title: "认证建档与证书公开核验规则 v1.1", type: "rule", updatedAt: "2026-06-11" },
  { channel: "关于协会", id: "about-structure", owner: "秘书处", status: "draft", title: "组织架构与委员会介绍", type: "article", updatedAt: "2026-06-11" },
  { channel: "发展中心", id: "dev-dao-medicine", owner: "发展中心", status: "legal_review", title: "道医中医文化发展中心边界说明", type: "article", updatedAt: "2026-06-11" },
  { channel: "资料中心", id: "data-public", owner: "资料中心", status: "legal_review", title: "资料公开授权与撤回规则", type: "faq", updatedAt: "2026-06-11" },
  { channel: "文化交流", id: "exchange-report", owner: "内容运营", status: "published", title: "国际文化交流项目展示", type: "report", updatedAt: "2026-06-10" }
];

export const cmsReviewItems: CmsReviewItem[] = [
  { assignee: "秘书处管理员", id: "review-rules", risk: "制度", status: "review", title: "认证建档与证书公开核验规则 v1.1", type: "关于协会 / 规章制度" },
  { assignee: "法务/合规", id: "review-dao-medicine", risk: "道医/健康", status: "legal_review", title: "道医中医文化发展中心边界说明", type: "发展中心" },
  { assignee: "数据保护", id: "review-data", risk: "个人数据", status: "legal_review", title: "资料公开授权与撤回规则", type: "资料中心" },
  { assignee: "秘书处管理员", id: "review-about", risk: "普通", status: "draft", title: "关于协会组织架构区块", type: "页面区块" }
];

export const cmsAssets: CmsAssetItem[] = [
  { alt: "协会文化空间主视觉", id: "asset-about", licenseNote: "项目内既有素材，待确认最终授权说明。", name: "about-cultural-space.jpg", status: "可用", type: "image" },
  { alt: "规章制度 PDF", id: "asset-rule", licenseNote: "需记录版本、生效日期和审核人。", name: "itca-rules-v1.1.pdf", status: "待审核", type: "pdf" },
  { alt: "文化交流活动图", id: "asset-event", licenseNote: "涉及活动肖像，发布前需确认公开授权。", name: "exchange-event-001.jpg", status: "待授权", type: "image" }
];

export const cmsRevisions: CmsRevisionItem[] = [
  { actor: "超级管理员", action: "栏目改名", id: "rev-001", note: "顶部导航显示名由“介绍”调整为“关于协会”，路径暂保留 /intro。", target: "关于协会", time: "2026-06-11 18:20" },
  { actor: "内容管理员", action: "新增区块", id: "rev-002", note: "关于协会下的规章制度页面新增制度列表和修订记录区块。", target: "关于协会 / 规章制度", time: "2026-06-11 18:28" },
  { actor: "发展中心管理员", action: "提交审核", id: "rev-003", note: "道医中医文化发展中心内容提交合规确认。", target: "发展中心", time: "2026-06-11 18:36" }
];

export function getCmsEditableChannels() {
  return cmsChannels.flatMap((channel) => [channel, ...(channel.subChannels || [])]);
}

export function getCmsTopNavChannels() {
  return cmsChannels.filter((channel) => channel.visibleInTopNav !== false);
}

export function getCmsChannel(id: string) {
  return getCmsEditableChannels().find((channel) => channel.id === id) || cmsChannels[1];
}

export function formatCmsStatus(status: CmsPublishStatus) {
  return {
    archived: "已归档",
    draft: "草稿",
    legal_review: "待法务/秘书处确认",
    offline: "已下架",
    published: "已发布",
    review: "待审核",
    scheduled: "定时发布"
  }[status];
}

export function formatRiskLevel(level: CmsRiskLevel) {
  return {
    normal: "普通",
    protected: "核心保护",
    sensitive: "高风险"
  }[level];
}
