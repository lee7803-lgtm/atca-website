import type { IconBadgeName } from "@/components/IconBadge";

export type V2Action = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

export type V2Card = {
  href?: string;
  icon?: IconBadgeName;
  labels?: string[];
  text: string;
  title: string;
};

export type V2Section = {
  afterHero?: boolean;
  actions?: V2Action[];
  cards?: V2Card[];
  eyebrow?: string;
  intro?: string;
  notice?: string;
  tone?: "default" | "soft";
  title: string;
};

export type V2PageData = {
  actions?: V2Action[];
  atmosphere?: "standard" | "gate" | "credential";
  backgroundImagePosition?: string;
  backgroundImageSrc?: string;
  boundaryNotices?: Array<{ title: string; text: string }>;
  eyebrow: string;
  imagePosition?: string;
  imageSrc?: string;
  intro: string;
  metadataTitle: string;
  sections: V2Section[];
  subtitle?: string;
  title: string;
  visualDescription?: string;
  visualEyebrow?: string;
  visualMark?: string;
  visualSeal?: string;
  visualTitle?: string;
};

export const publicBoundaries = {
  certification:
    "协会认证服务主要用于资料核验、身份背景认证、师承与学习经历归档、国际化展示和公众查询支持。相关认证不等同于政府宗教资格认证、法定宗教职务证明，也不替代其他机构依法依规开展的认证或管理。",
  daoMedicine:
    "道医中医相关栏目仅用于文化研究、养生资料整理和交流展示，不构成医疗诊断、治疗建议或药品功效承诺。涉及健康问题时，应咨询具备资质的专业人员。",
  yijing:
    "易学与东方认知相关内容仅作传统文化研究、认知辅助和自我理解参考，不替代医疗、法律、金融、心理治疗等专业判断，也不作确定性预测承诺。",
  data:
    "资料中心涉及个人、机构、师承、证书等信息时，遵循最小公开原则。证件信息、联系方式、内部备注、审核意见和非公开材料不在前台展示。"
};

export const serviceEntries = [
  { href: "/member/apply", label: "个人会员申请" },
  { href: "/organization/apply", label: "机构会员申请" },
  { href: "/certification/taoist-priest", label: "道士资格认证申请" },
  { href: "/application/query", label: "申请进度查询" },
  { href: "/certificate-query", label: "证书公开核验" },
  { href: "/member-query", label: "会员公开核验" }
];

export const developmentCenters: V2Card[] = [
  {
    href: "/development/health-practice",
    icon: "value",
    labels: ["养生文化", "修习交流", "安全提示"],
    title: "养生实践发展中心",
    text: "围绕道家养生、导引修习、静修实践与身心修养文化开展资料整理、课程交流和活动协作。"
  },
  {
    href: "/development/cultural-creative",
    icon: "cooperation",
    labels: ["文化设计", "文创合作", "空间展示"],
    title: "文化创意发展中心",
    text: "推动道教文化符号、文创产品、展陈空间和文化传播项目的规范表达与合作落地。"
  },
  {
    href: "/development/education",
    icon: "membership",
    labels: ["课程研修", "师资交流", "学习档案"],
    title: "教育发展中心",
    text: "建设面向会员、学习者和合作机构的课程研修、文化讲座、师资交流与学习记录体系。"
  },
  {
    href: "/development/international-exchange",
    icon: "international",
    labels: ["国际交流", "会议访问", "机构协作"],
    title: "国际交流发展中心",
    text: "面向不同国家和地区推动文化互鉴、机构访问、会议交流和公开资料整理。"
  },
  {
    href: "/development/yijing-cognition",
    icon: "query",
    labels: ["易学研究", "认知参考", "伦理边界"],
    title: "易学认知发展中心",
    text: "以易学、象数文化和东方认知模型为研究对象，提供文化学习、认知辅助和交流展示。"
  },
  {
    href: "/development/dao-medicine",
    icon: "certificate",
    labels: ["道医文化", "中医养生", "资料整理"],
    title: "道医中医文化发展中心",
    text: "整理道医文化、中医养生、药膳文化和导引传统相关资料，推动研究交流与合规传播。"
  }
];

export const accountModules: V2Card[] = [
  { href: "/account/login", icon: "individual", title: "我的资料", text: "用于说明会员和申请人基础资料的集中查看方向，账号服务开放前不采集新资料。" },
  { href: "/membership", icon: "membership", title: "我的会员", text: "用于了解会员类型、会员状态、会员有效期和相关服务提醒。" },
  { href: "/certification", icon: "certification", title: "我的认证", text: "用于了解认证申请进度、补充资料提示、审核结果和证书记录。" },
  { href: "/certificate-query", icon: "certificate", title: "我的证书", text: "用于核验证书状态、有效期和官网公开核验信息。" },
  { href: "/application/query", icon: "cooperation", title: "我的订单", text: "用于通过申请进度查询进入相关订单、付款说明和财务确认状态。" },
  { href: "/application/query", icon: "contact", title: "我的通知", text: "用于说明申请审核、补充资料、付款、证书和活动通知的集中接收方向。" },
  { href: "/application/query", icon: "value", title: "补充资料", text: "按审核反馈提交补充说明或材料，帮助申请事项继续流转。" },
  { href: "/application/query", icon: "query", title: "申请进度", text: "集中查看会员、机构和认证申请的办理进度。" }
];

export const rbacRoles = [
  { key: "super_admin", title: "超级管理员", text: "负责系统配置、角色分配、关键记录处置和全部后台模块管理。" },
  { key: "secretariat_admin", title: "秘书处管理员", text: "统筹申请受理、跨部门协调、内容确认和秘书处日常运营。" },
  { key: "member_admin", title: "会员管理员", text: "管理个人会员、机构会员、会员有效期、续期和会员公开查询资料。" },
  { key: "certification_admin", title: "认证管理员", text: "处理认证申请、材料审核、证书签发、证书状态和公开核验资料。" },
  { key: "finance_admin", title: "财务管理员", text: "处理支付订单、收据、人工确认、退款备注和财务导出。" },
  { key: "content_admin", title: "内容管理员", text: "维护介绍、规章、信仰、教义、文化交流和公告等前台内容。" },
  { key: "development_admin", title: "发展中心管理员", text: "维护各发展中心、课程活动和合作项目资料。" },
  { key: "data_center_admin", title: "资料中心管理员", text: "审核机构、个人、传承、课程、活动和基地等公开资料。" },
  { key: "notification_admin", title: "通知管理员", text: "维护通知模板、发送记录、失败重试和通知策略。" },
  { key: "readonly_auditor", title: "只读审计员", text: "查看后台总览、操作日志、记录状态和必要审计字段。" }
];

export const rbacPermissionModules = [
  "后台总览",
  "用户管理",
  "角色权限",
  "会员管理",
  "认证管理",
  "证书管理",
  "支付管理",
  "通知管理",
  "内容管理",
  "发展中心管理",
  "资料中心管理",
  "公告管理",
  "基础资料管理",
  "操作日志",
  "系统设置"
];

export const v2Pages: Record<string, V2PageData> = {
  intro: {
    actions: [
      { href: "/membership", label: "了解会员体系" },
      { href: "/cooperation", label: "联系合作", variant: "secondary" }
    ],
    atmosphere: "gate",
    backgroundImageSrc: "/images/atca/about-cultural-space.jpg",
    eyebrow: "About ITCA",
    imageSrc: "/images/itca/02-home-association.png",
    intro: "国际道教与文化协会 ITCA 面向道教文化传承、会员服务、认证建档、国际交流和机构合作，提供公开、稳健、可查询的官网信息服务。",
    metadataTitle: "关于协会｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "value", title: "协会宗旨", text: "弘扬道教清净自然、济世利人的文化精神，推动道教文化与中华传统文化在国际语境中的交流与传承。" },
          { icon: "structure", title: "协会使命", text: "服务会员、认证、文化交流与资料整理工作，推动相关记录规范留存、办理流程清晰可循。" },
          { icon: "association", title: "协会定位", text: "作为面向公众、会员、申请人、文化机构和合作伙伴的协会门户，提供介绍、申请、核验、公告与合作信息。" },
          { icon: "international", title: "国际视野", text: "面向不同国家和地区推动宫观道堂、文化机构、研究单位和传统文化组织之间的交流互鉴。" }
        ],
        eyebrow: "Profile",
        intro: "协会介绍页帮助公众了解 ITCA 的基本定位、服务对象和官网信息边界。",
        title: "协会介绍"
      },
      {
        cards: [
          { href: "/certification/taoist-priest", icon: "certification", title: "认证申请人", text: "可了解认证范围、申请材料、审核流程和证书公开核验方式。" },
          { href: "/membership", icon: "membership", title: "会员与学习者", text: "可了解个人会员、机构会员、会员服务、文化交流和活动参与方式。" },
          { href: "/cooperation", icon: "institution", title: "机构与合作伙伴", text: "可了解文化交流、课程活动、研究合作、资料整理和项目共建方式。" }
        ],
        eyebrow: "Audience",
        intro: "官网服务对象包括会员、认证申请人、文化爱好者、研究者、机构伙伴和国际交流对象。",
        title: "服务对象",
        tone: "soft"
      },
      {
        cards: [
          { icon: "structure", title: "理事会", text: "统筹协会发展方向、重大事项审议和协会公共事务。" },
          { icon: "association", title: "秘书处", text: "负责日常协调、资料受理、信息记录、会员沟通与对外联系。" },
          { icon: "certification", title: "认证委员会", text: "负责认证材料审核、认证标准维护、评审建议和证书记录管理。" },
          { icon: "value", title: "专家顾问委员会", text: "为文化研究、学术交流、课程建设和专业议题提供咨询支持。" }
        ],
        eyebrow: "Organization",
        intro: "组织与委员会信息用于说明协会各项工作的基本分工。",
        title: "组织与委员会"
      }
    ],
    title: "关于协会",
    visualDescription: "协会官网以公开、克制、正式的信息表达服务公众浏览、会员申请、认证核验和合作沟通。",
    visualSeal: "协会",
    visualTitle: "关于协会"
  },
  rules: {
    actions: [{ href: "/application/query", label: "申请进度查询" }, { href: "/certificate-query", label: "证书公开核验", variant: "secondary" }],
    atmosphere: "credential",
    eyebrow: "Rules",
    imageSrc: "/images/itca/03-service-certification.png",
    intro: "规章制度栏目公开协会治理、会员管理、认证建档、证书核验、信息公开、合作管理和复核处置等基础规则。",
    metadataTitle: "规章制度｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "structure", title: "协会章程与总则", text: "说明协会宗旨、组织架构、会员权益、公共事务处理原则和制度更新机制。" },
          { icon: "membership", title: "会员管理规则", text: "说明个人会员、机构会员申请、审核、会籍状态、续期、暂停和终止规则。" },
          { icon: "certification", title: "认证与建档规则", text: "围绕身份资料、师承关系、学习经历和实践资料，建立审核、建档、签发和核验链路。" },
          { icon: "query", title: "证书签发与核验", text: "公开核验只展示必要字段，证书状态以官网查询页为准，并保留人工复核通道。" },
          { icon: "value", title: "资料使用与隐私", text: "申请材料用于审核、建档、联系和服务管理，不在公开页面展示敏感资料。" },
          { icon: "cooperation", title: "合作项目管理", text: "合作申请、项目确认、资料发布和活动记录以协会秘书处正式确认为准。" }
        ],
        eyebrow: "Governance",
        intro: "规章制度为申请、认证、会员、核验和合作提供统一说明，减少信息不对称。",
        title: "制度栏目"
      },
      {
        notice: "协会将根据实际工作需要持续完善相关规则。涉及具体申请、核验、合作或复核事项，以官网公开信息和协会秘书处确认为准。",
        title: "制度适用说明",
        tone: "soft"
      }
    ],
    boundaryNotices: [{ title: "认证边界说明", text: publicBoundaries.certification }],
    title: "规章制度",
    visualDescription: "公开制度用于说明申请、认证、会员、核验和合作事项的处理原则。",
    visualSeal: "制度",
    visualTitle: "制度与边界"
  },
  faith: {
    actions: [{ href: "/doctrine", label: "教理教义" }, { href: "/exchange", label: "文化交流", variant: "secondary" }],
    atmosphere: "gate",
    backgroundImageSrc: "/images/atca/about-cultural-space.jpg",
    eyebrow: "Taoist Culture",
    imageSrc: "/images/itca/01-home-hero.png",
    intro: "道教信仰栏目以面向公众的语言介绍道法自然、济世利人、宫观文化、斋醮仪式、修行生活与当代文化价值。",
    metadataTitle: "道教信仰｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "value", title: "道法自然", text: "尊重天地自然运行秩序，倡导清净、节制、和合与顺应。" },
          { icon: "cooperation", title: "济世利人", text: "以修身、正心、积德、助人为实践方向，形成社会服务与文化传播基础。" },
          { icon: "institution", title: "宫观文化", text: "介绍宫观道堂、传承组织、地方信俗和文化活动资料。" },
          { icon: "international", title: "当代表达", text: "以公众可理解的语言介绍道教文化价值，保持尊重传统与面向现代的平衡。" }
        ],
        eyebrow: "Belief",
        intro: "该栏目重在文化介绍和公共理解，不涉及不适合公开传播的具体仪轨操作。",
        title: "信仰文化"
      },
      {
        cards: [
          { icon: "certificate", title: "经典学习", text: "引导读者认识经典、术语与基本思想，为深入学习提供方向。" },
          { icon: "membership", title: "修行生活", text: "介绍诵经、静修、礼仪、节令与日常修身的文化意义。" },
          { icon: "query", title: "资料整理", text: "通过公开资料、讲座和活动记录，形成可持续的道教文化知识入口。" }
        ],
        title: "栏目内容",
        tone: "soft"
      }
    ],
    title: "道教信仰",
    visualDescription: "以公共化、克制的语言介绍信仰文化和当代文化价值。",
    visualSeal: "信仰",
    visualTitle: "信仰文化入口"
  },
  doctrine: {
    actions: [{ href: "/faith", label: "道教信仰" }, { href: "/development/education", label: "教育发展中心", variant: "secondary" }],
    atmosphere: "gate",
    eyebrow: "Doctrine",
    imageSrc: "/images/itca/02-home-association.png",
    intro: "教理教义栏目介绍道教经典思想、伦理观、修行观、生命观、基础术语和学习路径，帮助公众建立稳健的文化理解。",
    metadataTitle: "教理教义｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "certificate", title: "经典与思想", text: "围绕《道德经》《南华经》等经典，整理基础导读、术语解释和学习线索。" },
          { icon: "value", title: "伦理与修身", text: "以清净、慈俭、无争、积善等观念为核心，介绍道教伦理和修身传统。" },
          { icon: "membership", title: "生命与修炼", text: "从文化角度介绍养生、导引、静修、内丹等传统体系的历史意义。" },
          { icon: "query", title: "学习路径", text: "与教育发展中心、课程研修和公开讲座形成关联，为学习者提供清晰入口。" }
        ],
        eyebrow: "Learning",
        intro: "栏目表达以文化学习和思想介绍为主，避免绝对化、神秘化或功效化表述。",
        title: "教理教义栏目"
      },
      {
        notice: "教理教义内容面向公众浏览和文化学习，不替代个人宗教实践指导，也不构成任何医疗、法律或商业判断建议。",
        title: "内容说明",
        tone: "soft"
      }
    ],
    title: "教理教义",
    visualDescription: "以稳健的学习入口承接经典导读、术语解释和课程研修。",
    visualSeal: "教义",
    visualTitle: "经典与学习"
  },
  exchange: {
    actions: [{ href: "/cooperation", label: "联系合作" }, { href: "/development/international-exchange", label: "国际交流发展中心", variant: "secondary" }],
    atmosphere: "standard",
    backgroundImageSrc: "/images/atca/cooperation-cultural-exchange.jpg",
    eyebrow: "Cultural Exchange",
    imageSrc: "/images/itca/06-home-international-cooperation.png",
    intro: "文化交流栏目展示协会在国际交流、文化研究、课程研修、机构合作、会议访问和公开资料整理方面的工作方向。",
    metadataTitle: "文化交流｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "international", title: "国际交流", text: "推动不同国家和地区的道教文化交流互鉴。" },
          { icon: "value", title: "文化研究", text: "围绕经典、历史、仪轨文化和当代传播开展研究协作。" },
          { icon: "membership", title: "课程研修", text: "支持文化课程、公开讲座、研修活动和资料整理合作。" },
          { icon: "institution", title: "机构合作", text: "对接文化机构、社团组织、研究单位和国际项目伙伴。" }
        ],
        eyebrow: "Programs",
        intro: "文化交流偏重公开活动、资料展示和成果记录；具体合作事项以正式确认为准。",
        title: "交流方向"
      },
      {
        cards: [
          { icon: "certificate", title: "活动发布", text: "发布会议、访问、讲座、展览和文化活动相关信息。" },
          { icon: "query", title: "资料沉淀", text: "整理活动纪要、公开图片、合作成果和相关研究资料。" },
          { icon: "cooperation", title: "伙伴联络", text: "为机构交流、课程共建和文化项目提供正式联络入口。" }
        ],
        title: "信息结构",
        tone: "soft"
      }
    ],
    title: "文化交流",
    visualDescription: "展示国际交流、文化研究、课程研修和机构协作的公开信息。",
    visualSeal: "交流",
    visualTitle: "文化交流"
  },
  development: {
    actions: [{ href: "/cooperation", label: "联系合作" }, { href: "/data", label: "资料中心", variant: "secondary" }],
    atmosphere: "standard",
    eyebrow: "Development Centers",
    imageSrc: "/images/itca/06-home-international-cooperation.png",
    intro: "发展中心是协会推动文化研究、交流合作、教育传播、项目孵化与社会服务的专业化平台，服务国际道教文化传播、会员发展、机构合作和文化项目落地。",
    metadataTitle: "发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "structure", title: "设立背景", text: "随着道教文化交流、会员服务、课程研修和机构合作需求增长，协会需要更专业的分工平台承接相关工作。" },
          { icon: "association", title: "平台定位", text: "发展中心不是单一项目招商页，而是面向研究、教育、交流、资料整理和社会服务的专业化协作平台。" },
          { icon: "international", title: "使命关系", text: "各中心共同服务于国际道教文化传播、会员发展、机构合作和文化项目落地。" },
          { icon: "value", title: "合作边界", text: "对外合作以文化交流、研究合作、课程活动、项目共建和资料整理为主，避免功效承诺和夸张宣传。" }
        ],
        eyebrow: "Foundation",
        intro: "先说明发展中心的设立原因、工作定位和合作边界，再进入各中心具体介绍。",
        title: "发展中心是什么"
      },
      {
        cards: developmentCenters,
        eyebrow: "Center Map",
        intro: "六个发展中心按照文化研究、教育传播、国际交流、创意合作和资料整理方向形成分工。",
        title: "发展中心体系",
        tone: "soft"
      },
      {
        notice: "发展中心对外合作坚持文化交流、研究合作、课程活动、项目共建和资料整理定位。涉及养生、道医中医、易学认知等内容时，不作医疗功效承诺、确定性预测承诺或商业夸张宣传。",
        title: "合作边界"
      }
    ],
    title: "发展中心",
    visualDescription: "发展中心以文化研究、教育传播、国际交流和资料整理为核心，推动协会使命落地。",
    visualSeal: "发展",
    visualTitle: "发展中心"
  },
  cooperation: {
    actions: [{ href: "mailto:aseantaoist@gmail.com", label: "联系秘书处" }, { href: "/development", label: "查看发展中心", variant: "secondary" }],
    atmosphere: "standard",
    backgroundImageSrc: "/images/atca/cooperation-cultural-exchange.jpg",
    eyebrow: "Cooperation",
    imageSrc: "/images/itca/06-home-international-cooperation.png",
    intro: "发展合作面向文化机构、社团组织、研究单位、康养基地、课程团队、文创品牌和国际项目伙伴，提供正式、清晰的合作沟通入口。",
    metadataTitle: "发展合作｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "institution", title: "机构合作", text: "面向宫观、道堂、文化机构、教育机构、研究单位和康养基地开展沟通。" },
          { icon: "membership", title: "课程与活动合作", text: "围绕公开讲座、研修活动、论坛会议、文化展览和资料整理开展合作。" },
          { icon: "cooperation", title: "产业与品牌合作", text: "围绕文创产品、文化空间、礼品设计和健康生活方式项目进行规范合作。" },
          { icon: "query", title: "资料中心入驻", text: "经审核后，相关机构、课程、活动和基地资料可进入公开资料中心展示。" }
        ],
        eyebrow: "Partner Tracks",
        intro: "合作页面用于说明合作方向、提交资料、审核沟通和公开展示范围。",
        title: "合作方向"
      },
      {
        actions: [
          { href: "/membership", label: "了解会员体系" },
          { href: "/organization/apply", label: "机构会员申请", variant: "secondary" }
        ],
        notice: "合作事项应提供主体资料、项目说明、公开展示范围、联系人和可核验材料。具体合作以协会秘书处正式确认为准。",
        title: "对接要求",
        tone: "soft"
      }
    ],
    title: "发展合作",
    visualDescription: "以项目对接、机构合作、课程活动和资料中心入驻为主要承接方向。",
    visualSeal: "合作",
    visualTitle: "合作对接"
  },
  data: {
    actions: [{ href: "/cooperation", label: "申请入驻" }, { href: "/certificate-query", label: "证书公开核验", variant: "secondary" }],
    atmosphere: "credential",
    eyebrow: "Resource Center",
    imageSrc: "/images/itca/05-service-verification.png",
    intro: "资料中心用于收录并展示道教文化与相关交流领域的机构、个人、平台、传承、课程、活动和基地等公开资料。",
    metadataTitle: "资料中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "institution", labels: ["地区筛选", "机构展示"], title: "机构库", text: "宫观、道堂、协会、文化机构、研究机构和康养基地。" },
          { icon: "individual", labels: ["个人档案", "认证关联"], title: "个人库", text: "道士、传承人、导师、研究者、讲师、顾问和文化从业者。" },
          { icon: "cooperation", labels: ["合作入口", "平台展示"], title: "平台库", text: "文化平台、课程平台、媒体账号、服务平台和合作系统。" },
          { icon: "structure", labels: ["审核建档", "传承资料"], title: "传承库", text: "门派、功法、师承、谱系、非遗线索和文化资料。" },
          { icon: "membership", title: "课程库", text: "基础课、研修课、专项课、活动课和结业记录。" },
          { icon: "value", title: "产品库", text: "文创产品、课程产品、活动产品、会员产品和认证产品。" },
          { icon: "international", title: "活动库", text: "会议、法会、研修营、文化交流、展览、论坛和访问。" },
          { icon: "certificate", title: "基地库", text: "养生基地、研修基地、文化空间、合作场馆和国际联络点。" }
        ],
        eyebrow: "Public Data",
        intro: "资料中心坚持审核后展示和最小公开原则，帮助公众了解可公开的协会资料与文化资源。",
        title: "资料中心结构"
      },
      {
        notice: "资料中心只展示经审核允许公开的信息。涉及个人、机构、师承、证书等内容时，敏感字段和内部审核信息不进入前台展示。",
        title: "公开机制",
        tone: "soft"
      }
    ],
    boundaryNotices: [{ title: "资料中心公开信息边界", text: publicBoundaries.data }],
    title: "资料中心",
    visualDescription: "公开信息坚持最小公开原则，敏感字段和内部记录不进入前台展示。",
    visualSeal: "资料",
    visualTitle: "公开资料中心"
  }
};

export const developmentPageData: Record<string, V2PageData> = {
  "health-practice": {
    actions: [{ href: "/development", label: "发展中心总览" }, { href: "/cooperation", label: "联系合作", variant: "secondary" }],
    atmosphere: "standard",
    eyebrow: "Health Practice",
    imageSrc: "/images/itca/02-home-association.png",
    intro: "养生实践发展中心以道家养生文化、导引修习、静修实践和身心修养资料整理为主要方向，推动安全、克制、合规的文化交流。",
    metadataTitle: "养生实践发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "value", title: "道家养生文化", text: "整理道家养生理念、生活节律、身心修养和传统功法的文化背景。" },
          { icon: "membership", title: "课程与活动", text: "围绕公开讲座、研修活动和文化体验，形成安全提示和活动规范。" },
          { icon: "cooperation", title: "基地与机构合作", text: "与具备条件的文化空间、研修基地和机构伙伴开展资料整理和活动协作。" },
          { icon: "query", title: "安全与伦理", text: "对活动人群、风险提示、禁忌说明和资料公开范围进行审慎管理。" }
        ],
        intro: "该中心以文化研究、资料整理和交流活动为主，不以疗效承诺或商业化包装作为表达重点。",
        title: "中心方向"
      },
      {
        notice: "养生实践相关内容仅作文化学习和活动交流参考，不构成医疗诊断、治疗建议或功效承诺。",
        title: "内容边界",
        tone: "soft"
      }
    ],
    boundaryNotices: [{ title: "养生与道医中医边界", text: publicBoundaries.daoMedicine }],
    title: "养生实践发展中心",
    visualDescription: "以道家养生文化和身心修养资料整理为基础，推动安全、克制的交流活动。",
    visualSeal: "养生",
    visualTitle: "养生实践"
  },
  "cultural-creative": {
    actions: [{ href: "/development", label: "发展中心总览" }, { href: "/cooperation", label: "文化合作", variant: "secondary" }],
    atmosphere: "standard",
    eyebrow: "Cultural Creative",
    imageSrc: "/images/itca/06-home-international-cooperation.png",
    intro: "文化创意发展中心围绕道教文化的当代表达、文创设计、展陈空间和品牌合作，推动传统文化在现代生活中的规范传播。",
    metadataTitle: "文化创意发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "value", title: "文化符号整理", text: "梳理道教文化符号、经典意象和传统美学元素，形成可解释、可追溯的内容基础。" },
          { icon: "cooperation", title: "文创产品合作", text: "围绕礼品、出版、视觉设计、展陈物料等方向开展审慎合作。" },
          { icon: "institution", title: "文化空间展示", text: "支持文化空间、课程空间、展览空间和活动场景中的道教文化展示。" },
          { icon: "certificate", title: "授权与使用", text: "明确标识、图文、证书样式和文化内容的使用边界，避免误导性宣传。" }
        ],
        title: "中心方向"
      },
      {
        notice: "文化创意合作服务于文化传播和公共展示，不改变协会认证规则，也不替代认证审核或证书核验。",
        title: "合作说明",
        tone: "soft"
      }
    ],
    title: "文化创意发展中心",
    visualDescription: "以文化符号整理、文创设计和空间展示为重点，推动传统文化的现代表达。",
    visualSeal: "文创",
    visualTitle: "文化创意"
  },
  education: {
    actions: [{ href: "/development", label: "发展中心总览" }, { href: "/membership", label: "了解会员体系", variant: "secondary" }],
    atmosphere: "gate",
    eyebrow: "Education",
    imageSrc: "/images/itca/04-service-membership.png",
    intro: "教育发展中心面向会员、学习者和合作机构，建设道教文化课程、经典导读、专题研修、师资交流和学习档案体系。",
    metadataTitle: "教育发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "membership", title: "基础文化课程", text: "面向公众和会员介绍道教文化、经典常识、礼仪文化和学习路径。" },
          { icon: "certification", title: "专题研修课程", text: "围绕经典、仪轨文化、道医文化、易学文化和养生文化开展专题学习。" },
          { icon: "individual", title: "师资与讲师", text: "建立讲师资料、课程主题、授课记录和反馈机制，保持课程质量。" },
          { icon: "query", title: "学习档案", text: "记录课程参与、研修证明和学习路径，为会员成长提供参考。" }
        ],
        title: "教育体系"
      },
      {
        notice: "课程学习证明与资格认证应清晰区分。学习记录不等同于职业许可、法定资质或宗教职务证明。",
        title: "学习证明说明",
        tone: "soft"
      }
    ],
    boundaryNotices: [{ title: "认证边界说明", text: publicBoundaries.certification }],
    title: "教育发展中心",
    visualDescription: "以课程研修、经典导读、师资交流和学习档案为核心，服务会员与公众学习。",
    visualSeal: "教育",
    visualTitle: "教育发展"
  },
  "international-exchange": {
    actions: [{ href: "/exchange", label: "文化交流" }, { href: "/cooperation", label: "联系合作", variant: "secondary" }],
    atmosphere: "standard",
    backgroundImageSrc: "/images/atca/cooperation-cultural-exchange.jpg",
    eyebrow: "International Exchange",
    imageSrc: "/images/itca/06-home-international-cooperation.png",
    intro: "国际交流发展中心面向不同国家和地区，推动协会分支协作、机构访问、会议活动、研究交流和多语言资料整理。",
    metadataTitle: "国际交流发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "international", title: "地区协作", text: "支持不同地区协会、文化机构和合作伙伴之间的信息沟通与活动协作。" },
          { icon: "cooperation", title: "会议与访问", text: "整理会议纪要、访问记录、活动公告和合作备忘录等公开资料。" },
          { icon: "institution", title: "国际项目合作", text: "对接文化机构、研究单位、宫观道堂、教育机构和民间文化组织。" },
          { icon: "certificate", title: "多语言资料", text: "为国际传播准备中英文说明、认证边界、公开资料和活动介绍。" }
        ],
        title: "国际协作方向"
      },
      {
        notice: "国际合作内容以公开合作事实和协会确认结果为准，不提前承诺未确认项目、未签署合作或未完成审核的互认事项。",
        title: "合作确认说明",
        tone: "soft"
      }
    ],
    title: "国际交流发展中心",
    visualDescription: "面向国际协作和文化互鉴，沉淀公开活动和机构合作资料。",
    visualSeal: "国际",
    visualTitle: "国际交流"
  },
  "yijing-cognition": {
    actions: [{ href: "/development", label: "发展中心总览" }, { href: "/doctrine", label: "教理教义", variant: "secondary" }],
    atmosphere: "credential",
    eyebrow: "Yijing Cognition",
    imageSrc: "/images/itca/03-service-certification.png",
    intro: "易学认知发展中心以易学、河洛理数、六十四卦、五行文化和东方认知模型为研究对象，推动传统文化的现代化表达。",
    metadataTitle: "易学认知发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "certificate", title: "易学研究", text: "整理易经、河洛、象数、卦象和传统认知文化的研究材料。" },
          { icon: "individual", title: "东方认知", text: "以五行、象数等模型作为文化理解和自我观察的参考工具。" },
          { icon: "query", title: "学习工具", text: "建设笔记、课程、图表和辅助学习资料，帮助公众理解传统文化语境。" },
          { icon: "value", title: "伦理边界", text: "强调文化参考、认知辅助和自我成长，不作确定性预测承诺。" }
        ],
        title: "研究与学习方向"
      }
    ],
    boundaryNotices: [{ title: "易学认知边界", text: publicBoundaries.yijing }],
    title: "易学认知发展中心",
    visualDescription: "以传统文化研究和认知辅助为定位，避免确定性承诺和专业判断替代。",
    visualSeal: "易学",
    visualTitle: "易学认知"
  },
  "dao-medicine": {
    actions: [{ href: "/development", label: "发展中心总览" }, { href: "/cooperation", label: "研究合作", variant: "secondary" }],
    atmosphere: "credential",
    eyebrow: "Dao Medicine Culture",
    imageSrc: "/images/itca/02-home-association.png",
    intro: "道医中医文化发展中心围绕道医文化、中医养生、药膳文化、导引传统和身心调养资料开展研究、课程和合作展示。",
    metadataTitle: "道医中医文化发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "certificate", title: "道医文化研究", text: "整理道医历史、经典、人物、技法和当代表达。" },
          { icon: "cooperation", title: "中医养生合作", text: "对接中医、药膳、康养、营养和体重管理等专业伙伴开展文化交流。" },
          { icon: "value", title: "内容审查", text: "建立顾问机制、风险说明、内容审查和公开传播规范。" },
          { icon: "query", title: "课程资料整理", text: "对养生课程、研修资料和合作展示内容进行审核与归档。" }
        ],
        title: "研究方向"
      }
    ],
    boundaryNotices: [{ title: "道医中医文化边界", text: publicBoundaries.daoMedicine }],
    title: "道医中医文化发展中心",
    visualDescription: "文化研究和养生资料展示必须与医疗诊疗、治疗建议明确区分。",
    visualSeal: "道医",
    visualTitle: "道医中医文化"
  }
};
