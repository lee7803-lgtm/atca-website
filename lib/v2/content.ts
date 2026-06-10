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

export const v2Boundaries = {
  certification:
    "认证服务主要用于资料核验、身份背景认证、师承与学习经历归档、国际化双语展示和公众查询支持。不得表述为官方道士证、政府宗教资格认证、法定宗教职务证明，或替代中国道教协会、世界道教联合会等机构认证。",
  daoMedicine:
    "道医中医相关内容仅用于文化研究、养生资料整理和合作展示，不构成医疗诊断、治疗建议或药品功效承诺。涉及健康风险、禁忌或适用人群时，应提示用户咨询具备资质的专业人员。",
  yijing:
    "易学与东方认知相关内容仅作传统文化研究、认知辅助和自我理解参考，不替代医疗、法律、金融、心理治疗等专业判断，也不作确定性预测承诺。",
  data:
    "数据中心涉及个人、机构、师承、证书、联系方式等信息时，遵循最小公开原则。不得公开敏感字段、证件信息、联系方式、Storage 路径、内部备注或后台审核意见。"
};

export const v2BusinessLoop = [
  { href: "/member/apply", label: "个人会员申请" },
  { href: "/organization/apply", label: "机构会员申请" },
  { href: "/certification/taoist-priest", label: "道士资格认证" },
  { href: "/application/query", label: "申请进度查询" },
  { href: "/payment/checkout", label: "支付入口" },
  { href: "/certificate-query", label: "证书查验" },
  { href: "/member-query", label: "会员查询" }
];

export const developmentCenters: V2Card[] = [
  {
    href: "/development/health-practice",
    icon: "value",
    labels: ["站桩", "辟谷", "丹道", "养生基地"],
    title: "养生与修炼发展中心",
    text: "承接道家养生、功法修炼、辟谷、站桩、温泉养生、丹道和安全伦理工作组。"
  },
  {
    href: "/development/cultural-creative",
    icon: "cooperation",
    labels: ["文化 IP", "文创产品", "品牌联名"],
    title: "文创产业发展中心",
    text: "推动道教文化 IP、礼品、联名项目、品牌会员和文化空间合作。"
  },
  {
    href: "/development/education",
    icon: "membership",
    labels: ["基础课程", "专业研修", "学习档案"],
    title: "教育培训发展中心",
    text: "承接基础文化课程、专项研修、导师师资、学习记录和结业证明管理。"
  },
  {
    href: "/development/international-exchange",
    icon: "international",
    labels: ["地区协会", "会议访问", "国际合作"],
    title: "国际与交流发展中心",
    text: "面向亚太、北美及更多区域推动地区协作、会议访问、项目合作与公开资料建设。"
  },
  {
    href: "/development/yijing-cognition",
    icon: "query",
    labels: ["易学研究", "东方认知", "文化工具"],
    title: "易学与东方认知发展中心",
    text: "围绕易学、河洛理数、五行能量和东方人格认知建立现代化文化表达。"
  },
  {
    href: "/development/dao-medicine",
    icon: "certificate",
    labels: ["道医文化", "中医养生", "合规审查"],
    title: "道医中医研究发展中心",
    text: "围绕道医文化、中医养生、药膳、导引和身心调理开展研究、课程与合作展示。"
  }
];

export const accountModules: V2Card[] = [
  { href: "/account#profile", icon: "individual", title: "我的资料", text: "维护姓名、联系方式、地区、偏好语言和资料授权状态。" },
  { href: "/account#membership", icon: "membership", title: "我的会员", text: "查看会员类型、会员状态、有效期、续期提示和会员申请记录。" },
  { href: "/account#certification", icon: "certification", title: "我的认证", text: "关联道士资格认证申请，查看审核状态、补正要求和证书签发结果。" },
  { href: "/account#certificates", icon: "certificate", title: "我的证书", text: "查看公开核验字段、证书状态、有效期和官网核验入口。" },
  { href: "/account#orders", icon: "cooperation", title: "我的订单", text: "关联支付订单、收据、支付状态和续期订单记录。" },
  { href: "/account#notifications", icon: "contact", title: "我的通知", text: "接收审核、补充资料、支付、证书和活动消息。" },
  { href: "/account#supplement", icon: "value", title: "补充资料", text: "承接审核补正资料提交，与 V1.3 申请补充资料流程保持兼容。" },
  { href: "/account#progress", icon: "query", title: "申请进度", text: "通过申请编号和联系方式绑定既有会员、机构或认证申请记录。" }
];

export const rbacRoles = [
  { key: "super_admin", title: "超级管理员", text: "拥有系统配置、角色权限、关键记录处置和全部后台模块管理权限。" },
  { key: "secretariat_admin", title: "秘书处管理员", text: "统筹申请受理、跨模块协调、内容确认和秘书处日常运营。" },
  { key: "member_admin", title: "会员管理员", text: "管理个人会员、机构会员、会员有效期、续期和会员公开查询资料。" },
  { key: "certification_admin", title: "认证管理员", text: "处理认证申请、材料审核、证书签发、证书状态和公开核验资料。" },
  { key: "finance_admin", title: "财务管理员", text: "处理支付订单、收据、人工确认、退款备注和财务导出。" },
  { key: "content_admin", title: "内容管理员", text: "维护介绍、规章、信仰、教义、文化交流和公告等前台内容。" },
  { key: "development_admin", title: "发展中心管理员", text: "维护六大发展中心、专委会、课程活动和合作项目资料。" },
  { key: "data_center_admin", title: "数据中心管理员", text: "审核机构库、个人库、传承库、课程库、活动库和基地库公开信息。" },
  { key: "notification_admin", title: "通知管理员", text: "维护通知模板、发送记录、失败重试和通知策略。" },
  { key: "readonly_auditor", title: "只读审计员", text: "仅可查看后台总览、操作日志、记录状态和必要的审计字段。" }
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
  "数据中心管理",
  "公告管理",
  "基础资料管理",
  "操作日志",
  "系统设置"
];

export const v2Pages: Record<string, V2PageData> = {
  intro: {
    actions: [
      { href: "/membership", label: "会员认证" },
      { href: "/cooperation", label: "发展合作", variant: "secondary" }
    ],
    atmosphere: "gate",
    backgroundImageSrc: "/images/atca/about-cultural-space.jpg",
    eyebrow: "Intro",
    imageSrc: "/images/itca/02-home-association.png",
    intro: "介绍页面用于展示协会宗旨、使命、定位、服务对象、国际合作方向，以及与 V1.3 认证、会员、证书核验体系的关系。",
    metadataTitle: "介绍｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "value", title: "协会宗旨", text: "弘扬道教清净自然、济世利人的文化精神，推动道教文化与传统文化在国际语境中的交流与传承。" },
          { icon: "structure", title: "协会使命", text: "服务会员、认证与文化交流工作，推动相关记录规范留存、办理流程清晰可循。" },
          { icon: "association", title: "协会定位", text: "面向道教文化交流、会员服务、资格认证与机构合作，服务相关个人、机构及文化交流事项。" },
          { icon: "international", title: "国际合作", text: "推动宫观道堂、文化机构、传统文化组织之间的交流与合作，以公开资料和正式确认为准。" }
        ],
        eyebrow: "Profile",
        intro: "V2.0 的介绍页不改变 V1.3 业务闭环，只把协会公共叙事和服务边界表达得更清楚。",
        title: "协会介绍"
      },
      {
        cards: [
          { href: "/certification/taoist-priest", icon: "certification", title: "认证申请人", text: "通过既有 V1.3 认证流程提交资料、接受审核、补充材料、签发证书并进入公开核验。" },
          { href: "/member/apply", icon: "membership", title: "个人会员", text: "通过会员申请建立档案，参与文化交流、学习活动和后续会员服务。" },
          { href: "/organization/apply", icon: "institution", title: "机构伙伴", text: "通过机构会员或发展合作入口承接活动、课程、研究和数据中心展示。" }
        ],
        eyebrow: "Audience",
        title: "服务对象",
        tone: "soft"
      }
    ],
    title: "介绍",
    visualDescription: "延续 V1.3 稳健的协会视觉，补齐 V2.0 门户信息架构。",
    visualSeal: "介绍",
    visualTitle: "协会公共介绍"
  },
  rules: {
    actions: [{ href: "/application/query", label: "申请查询" }, { href: "/certificate-query", label: "证书查验", variant: "secondary" }],
    atmosphere: "credential",
    eyebrow: "Rules",
    imageSrc: "/images/itca/03-service-certification.png",
    intro: "规章制度页面用于承载协会治理、会员管理、认证建档、证书核验、信息公开、合作管理和状态处置等公共规则。",
    metadataTitle: "规章制度｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "structure", title: "协会章程与总则", text: "明确协会宗旨、组织架构、会员权益、公共事务处理原则和制度更新机制。" },
          { icon: "membership", title: "会员管理规则", text: "说明个人会员、机构会员申请、审核、有效期、续期、暂停和终止规则。" },
          { icon: "certification", title: "认证与建档规则", text: "围绕身份资料、师承关系、学习经历和实践资料形成审核、建档、签发、核验链路。" },
          { icon: "query", title: "证书签发与核验", text: "公开核验只展示必要字段，证书状态以官网查询页为准，保留人工复核通道。" },
          { icon: "value", title: "资料使用与隐私", text: "申请材料用于审核、建档、联系和服务管理，不在公开页面展示敏感资料。" },
          { icon: "cooperation", title: "合作项目管理", text: "合作申请、项目确认、资料发布和活动记录以秘书处正式确认结果为准。" }
        ],
        eyebrow: "Governance",
        title: "制度栏目"
      },
      {
        notice: "规章制度必须与 V1.3 后台审核、材料补正、记录处置、证书有效期、核验安全、通知发送和基础资料管理保持一致。",
        title: "V1.3 兼容要求",
        tone: "soft"
      }
    ],
    boundaryNotices: [{ title: "认证边界说明", text: v2Boundaries.certification }],
    title: "规章制度",
    visualDescription: "公开制度用于减少申请、认证、会员和合作沟通中的不确定性。",
    visualSeal: "制度",
    visualTitle: "制度与边界"
  },
  faith: {
    actions: [{ href: "/doctrine", label: "教理教义" }, { href: "/exchange", label: "文化交流", variant: "secondary" }],
    atmosphere: "gate",
    backgroundImageSrc: "/images/atca/about-cultural-space.jpg",
    eyebrow: "Faith",
    imageSrc: "/images/itca/01-home-hero.png",
    intro: "道教信仰页面用于面向公众介绍道法自然、济世利人、宫观文化、神仙信仰、斋醮仪式、修行生活与当代文化价值。",
    metadataTitle: "道教信仰｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "value", title: "道法自然", text: "尊重天地自然运行秩序，倡导清净、节制、和合与顺应。" },
          { icon: "cooperation", title: "济世利人", text: "以修身、正心、积德、助人为实践方向，形成社会服务与文化传播基础。" },
          { icon: "institution", title: "宫观文化", text: "展示宫观道堂、传承组织、地方信俗与文化活动资料。" },
          { icon: "international", title: "当代表达", text: "以公众可理解的语言介绍道教文化价值，避免功效承诺和不适合公开传播的仪轨细节。" }
        ],
        eyebrow: "Belief",
        title: "信仰文化"
      },
      {
        notice: "本页面内容作为文化介绍，不承诺宗教活动效果，不进入不适合公开传播的具体仪轨操作，不替代各地宗教事务管理要求。",
        title: "公开表达边界",
        tone: "soft"
      }
    ],
    title: "道教信仰",
    visualDescription: "以公共化、克制的语言介绍信仰文化和当代文化价值。",
    visualSeal: "信仰",
    visualTitle: "信仰文化入口"
  },
  doctrine: {
    actions: [{ href: "/faith", label: "道教信仰" }, { href: "/development/education", label: "教育培训", variant: "secondary" }],
    atmosphere: "gate",
    eyebrow: "Doctrine",
    imageSrc: "/images/itca/02-home-association.png",
    intro: "教理教义页面用于介绍道教经典思想、伦理观、修行观、生命观、基础术语和学习路径。",
    metadataTitle: "教理教义｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "certificate", title: "经典与思想", text: "整理《道德经》《南华经》等经典思想，建立基础导读、术语解释与学习路径。" },
          { icon: "value", title: "伦理与修身", text: "以清净、慈俭、无争、积善为核心，面向现代生活提供文化理解与行为参考。" },
          { icon: "membership", title: "生命与修炼", text: "介绍养生、导引、静修、内丹等传统体系的文化意义，并加入安全与边界说明。" },
          { icon: "query", title: "学习路径", text: "与教育培训发展中心关联，承接公开课程、研修记录和学习档案。" }
        ],
        eyebrow: "Learning",
        title: "教理教义栏目"
      },
      {
        notice: "教理教义内容定位为文化学习与思想介绍，避免绝对化、神秘化、疗效化表达。",
        title: "内容边界",
        tone: "soft"
      }
    ],
    title: "教理教义",
    visualDescription: "以稳健的学习入口承接经典导读、术语解释和课程研修。",
    visualSeal: "教义",
    visualTitle: "经典与学习"
  },
  exchange: {
    actions: [{ href: "/cooperation", label: "发展合作" }, { href: "/development/international-exchange", label: "国际与交流发展中心", variant: "secondary" }],
    atmosphere: "standard",
    backgroundImageSrc: "/images/atca/cooperation-cultural-exchange.jpg",
    eyebrow: "Exchange",
    imageSrc: "/images/itca/06-home-international-cooperation.png",
    intro: "文化交流页面展示协会在国际交流、文化研究、课程研修、机构合作、会议访问和公开资料整理方面的公共活动。",
    metadataTitle: "文化交流｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "international", title: "国际交流", text: "推动不同国家和地区的道教文化交流互鉴。" },
          { icon: "value", title: "文化研究", text: "围绕经典、仪轨、历史与当代传播开展研究协作。" },
          { icon: "membership", title: "课程研修", text: "支持文化课程、研修活动与资料整理合作。" },
          { icon: "institution", title: "机构合作", text: "对接文化机构、社团组织、研究单位与合作伙伴。" }
        ],
        eyebrow: "Programs",
        title: "交流方向"
      },
      {
        notice: "文化交流偏内容展示和活动记录；发展合作偏合作入口和项目对接。未确认项目不得提前承诺。",
        title: "栏目边界",
        tone: "soft"
      }
    ],
    title: "文化交流",
    visualDescription: "展示国际交流、文化研究、课程研修和机构协作的公开信息。",
    visualSeal: "交流",
    visualTitle: "文化交流"
  },
  development: {
    actions: [{ href: "/cooperation", label: "发展合作" }, { href: "/data", label: "数据中心", variant: "secondary" }],
    atmosphere: "standard",
    eyebrow: "Development Centers",
    imageSrc: "/images/itca/06-home-international-cooperation.png",
    intro: "发展中心是 V2.0 从文化展示进入产业协作、教育培训、国际交流、研究发展和数据化沉淀的核心入口。",
    metadataTitle: "发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: developmentCenters,
        eyebrow: "Center Map",
        intro: "六大发展中心统一承接专委会、合作机构、课程项目、研究项目、认证项目和产业合作。",
        title: "六大发展中心"
      },
      {
        cards: [
          { icon: "structure", title: "发展规划", text: "形成发展中心年度规划、专委会建设、课程活动和公开成果展示。" },
          { icon: "cooperation", title: "项目合作", text: "承接机构合作、品牌联名、课程共建、活动联办和基地协作。" },
          { icon: "query", title: "数据沉淀", text: "与数据中心联动，沉淀机构、个人、课程、活动、基地和传承资料。" }
        ],
        title: "总览能力",
        tone: "soft"
      }
    ],
    title: "发展中心",
    visualDescription: "从门户导航进入发展中心体系，承接后续合作、课程、研究和数据治理。",
    visualSeal: "发展",
    visualTitle: "发展中心总览"
  },
  cooperation: {
    actions: [{ href: "mailto:aseantaoist@gmail.com", label: "联系秘书处" }, { href: "/development", label: "查看发展中心", variant: "secondary" }],
    atmosphere: "standard",
    backgroundImageSrc: "/images/atca/cooperation-cultural-exchange.jpg",
    eyebrow: "Cooperation",
    imageSrc: "/images/itca/06-home-international-cooperation.png",
    intro: "发展合作页面面向文化机构、社团组织、研究单位、康养基地、课程团队、文创品牌与国际项目伙伴开放合作。",
    metadataTitle: "发展合作｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "institution", title: "机构合作", text: "宫观、道堂、文化机构、教育机构、研究单位、康养基地等合作入驻。" },
          { icon: "membership", title: "课程与活动合作", text: "共建研修课程、线下营、国际交流活动、论坛会议与文化展览。" },
          { icon: "cooperation", title: "产业与品牌合作", text: "文创、礼品、文化空间、健康生活方式及道文化相关品牌合作。" },
          { icon: "query", title: "数据中心入驻", text: "经审核后进入机构库、课程库、活动库、基地库等公开文化数据库。" }
        ],
        eyebrow: "Partner Tracks",
        title: "合作方向"
      },
      {
        actions: [
          { href: "/membership", label: "会员认证" },
          { href: "/organization/apply", label: "机构会员申请", variant: "secondary" }
        ],
        notice: "合作事项应提供主体资料、项目说明、公开展示范围、联系人和可核验材料。具体合作以协会秘书处正式确认为准。",
        title: "对接要求",
        tone: "soft"
      }
    ],
    title: "发展合作",
    visualDescription: "以项目对接、机构合作、课程活动和数据中心入驻为主要承接方向。",
    visualSeal: "合作",
    visualTitle: "合作对接"
  },
  data: {
    actions: [{ href: "/cooperation", label: "申请入驻" }, { href: "/certificate-query", label: "证书查验", variant: "secondary" }],
    atmosphere: "credential",
    eyebrow: "Data Center",
    imageSrc: "/images/itca/05-service-verification.png",
    intro: "数据中心收录并展示道家与文化领域各分支的机构、个人、平台、传承、课程、活动、基地等资料，形成协会公开文化数据库。",
    metadataTitle: "数据中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "institution", labels: ["地区筛选", "机构展示"], title: "机构库", text: "宫观、道堂、协会、文化机构、研究机构、康养基地。" },
          { icon: "individual", labels: ["个人档案", "认证关联"], title: "个人库", text: "道士、传承人、导师、研究者、讲师、顾问、文化从业者。" },
          { icon: "cooperation", labels: ["合作入口", "平台展示"], title: "平台库", text: "文化平台、课程平台、媒体账号、服务平台、合作系统。" },
          { icon: "structure", labels: ["审核建档", "传承资料"], title: "传承库", text: "门派、功法、师承、谱系、非遗线索与文化资料。" },
          { icon: "membership", title: "课程库", text: "基础课、研修课、专项课、活动课与结业记录。" },
          { icon: "value", title: "产品库", text: "文创产品、课程产品、活动产品、会员产品、认证产品。" },
          { icon: "international", title: "活动库", text: "会议、法会、研修营、文化交流、展览、论坛与访问。" },
          { icon: "certificate", title: "基地库", text: "养生基地、研修基地、文化空间、合作场馆与国际联络点。" }
        ],
        eyebrow: "Public Data",
        title: "数据库结构"
      },
      {
        notice: "数据中心采用公开展示与后台审核分离机制。公开页面只展示经审核允许公开的信息，后台保留审核、隐藏、撤回、纠错和记录处置能力。",
        title: "公开机制",
        tone: "soft"
      }
    ],
    boundaryNotices: [{ title: "数据中心公开信息边界", text: v2Boundaries.data }],
    title: "数据中心",
    visualDescription: "公开信息坚持最小公开原则，敏感字段和内部记录不进入前台展示。",
    visualSeal: "数据",
    visualTitle: "公开文化数据库"
  }
};

export const developmentPageData: Record<string, V2PageData> = {
  "health-practice": {
    actions: [{ href: "/development", label: "发展中心总览" }, { href: "/cooperation", label: "合作对接", variant: "secondary" }],
    atmosphere: "standard",
    eyebrow: "Health Practice",
    imageSrc: "/images/itca/02-home-association.png",
    intro: "养生与修炼发展中心围绕道家养生、功法修炼、辟谷、站桩、温泉养生、丹道等方向建立专委会、课程体系、活动体系与基地合作。",
    metadataTitle: "养生与修炼发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "value", title: "站桩专委会", text: "站桩功法、基础训练、师资培养和活动组织。" },
          { icon: "cooperation", title: "温泉养生专委会", text: "温泉疗养、康养基地和身心休养项目合作。" },
          { icon: "membership", title: "辟谷专委会", text: "辟谷标准、线上营、线下营、安全说明与导师体系。" },
          { icon: "certificate", title: "丹道专委会", text: "丹道文化、功法研究、课程研修与传承资料整理。" },
          { icon: "international", title: "功法修炼专委会", text: "传统功法、导引、静修、练功记录与活动承接。" },
          { icon: "institution", title: "养生基地工作组", text: "对接养生修炼基地、课程活动、场地合作与安全流程。" }
        ],
        title: "专委会与工作组"
      },
      {
        notice: "本中心内容仅作文化学习、身心养护资料和活动合作展示，不承诺疗效。涉及禁忌、健康风险、特殊人群和线下活动时，必须提供风险提示。",
        title: "安全与伦理边界",
        tone: "soft"
      }
    ],
    boundaryNotices: [{ title: "道医中医与养生边界", text: v2Boundaries.daoMedicine }],
    title: "养生与修炼发展中心",
    visualDescription: "围绕传统养生、修炼文化、课程活动和基地合作形成规范入口。",
    visualSeal: "养生",
    visualTitle: "养生与修炼"
  },
  "cultural-creative": {
    actions: [{ href: "/development", label: "发展中心总览" }, { href: "/cooperation", label: "品牌合作", variant: "secondary" }],
    atmosphere: "standard",
    eyebrow: "Cultural Creative",
    imageSrc: "/images/itca/06-home-international-cooperation.png",
    intro: "文创产业发展中心推动道教文化 IP、礼品、文创产品、联名项目、品牌会员与文化空间合作。",
    metadataTitle: "文创产业发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "value", title: "文化 IP 与视觉体系", text: "开发协会视觉、徽章、证书、文创符号与文化主题包装。" },
          { icon: "cooperation", title: "高端礼品与联名", text: "以轻联盟、轻联名、高端礼品、品牌会员作为第一阶段合作方向。" },
          { icon: "institution", title: "文化空间合作", text: "支持道文化展陈、活动空间、课程空间与跨界文化项目。" },
          { icon: "certificate", title: "授权与使用规则", text: "明确标识、证书、文化内容和联名权益的授权边界。" }
        ],
        title: "产业方向"
      },
      {
        notice: "文创产业合作服务文化传播和产业协作，不改变协会认证业务的权威边界，不得以联名合作替代认证审核。",
        title: "合作边界",
        tone: "soft"
      }
    ],
    title: "文创产业发展中心",
    visualDescription: "以稳健的协会品牌承接文化 IP、礼品、联名和文化空间合作。",
    visualSeal: "文创",
    visualTitle: "文化产业协作"
  },
  education: {
    actions: [{ href: "/development", label: "发展中心总览" }, { href: "/account", label: "学习档案", variant: "secondary" }],
    atmosphere: "gate",
    eyebrow: "Education",
    imageSrc: "/images/itca/04-service-membership.png",
    intro: "教育培训发展中心承接道学院、基础课程、专业课程、研修营、师资培养、学习档案与结业认证。",
    metadataTitle: "教育培训发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "membership", title: "基础文化课程", text: "面向大众建立道教文化、经典导读、礼仪常识与信仰文化入门。" },
          { icon: "certification", title: "专业研修课程", text: "面向从业者与学习者开设丹道、易学、道医、功法等专项课程。" },
          { icon: "individual", title: "导师与师资", text: "建立讲师入驻、课程审核、授课记录与学员反馈机制。" },
          { icon: "query", title: "证书与学习档案", text: "对课程学习、结业证明、研修记录与会员成长路径进行建档。" }
        ],
        title: "培训体系"
      },
      {
        notice: "课程证书和学习档案应与资格认证区分，不能表达为职业许可、法定资质或宗教职务证明。",
        title: "学习证明边界",
        tone: "soft"
      }
    ],
    boundaryNotices: [{ title: "认证边界说明", text: v2Boundaries.certification }],
    title: "教育培训发展中心",
    visualDescription: "承接课程、研修、师资和学习档案，兼容后续用户中心。",
    visualSeal: "教育",
    visualTitle: "课程与学习档案"
  },
  "international-exchange": {
    actions: [{ href: "/exchange", label: "文化交流" }, { href: "/cooperation", label: "合作对接", variant: "secondary" }],
    atmosphere: "standard",
    backgroundImageSrc: "/images/atca/cooperation-cultural-exchange.jpg",
    eyebrow: "International Exchange",
    imageSrc: "/images/itca/06-home-international-cooperation.png",
    intro: "国际与交流发展中心面向亚太、北美及更多区域，推动协会分支建设、国际合作、学术交流、会议活动与机构互认。",
    metadataTitle: "国际与交流发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "international", title: "地区协会协作", text: "支持亚太地区协会、北美地区协会与未来地区组织的信息发布与项目协同。" },
          { icon: "cooperation", title: "会议与访问", text: "建立会议纪要、活动公告、访问交流、合作备忘录等公共资料。" },
          { icon: "institution", title: "国际项目合作", text: "对接文化机构、研究单位、宫观道堂、教育机构及民间文化组织。" },
          { icon: "certificate", title: "多语言资料", text: "为国际合作准备中英文说明、认证边界、数据公开边界和活动资料。" }
        ],
        title: "国际协作方向"
      },
      {
        notice: "国际合作内容以公开合作事实和协会沟通结果为准，不提前承诺未确认项目、未签署合作或未完成审核的互认事项。",
        title: "合作确认边界",
        tone: "soft"
      }
    ],
    title: "国际与交流发展中心",
    visualDescription: "面向国际协作和文化互鉴，沉淀公开活动和机构合作资料。",
    visualSeal: "国际",
    visualTitle: "国际交流协作"
  },
  "yijing-cognition": {
    actions: [{ href: "/development", label: "发展中心总览" }, { href: "/doctrine", label: "教理教义", variant: "secondary" }],
    atmosphere: "credential",
    eyebrow: "Yijing Cognition",
    imageSrc: "/images/itca/03-service-certification.png",
    intro: "易学与东方认知发展中心围绕易学、河洛理数、六十四卦、五行能量、东方人格认知、人生结构理解等方向，建立现代化表达体系。",
    metadataTitle: "易学与东方认知发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "certificate", title: "易学研究", text: "整理易经、河洛、数理、象数与传统预测文化的研究材料。" },
          { icon: "individual", title: "东方人格认知", text: "以五行能量等模型作为大众认知自我、理解关系的入口。" },
          { icon: "query", title: "工具与产品", text: "承接测试、日课、卦象笔记、学习工具与 AI 辅助解读产品。" },
          { icon: "value", title: "伦理与边界", text: "强调文化参考、认知辅助与自我成长，不替代专业判断。" }
        ],
        title: "研究与产品方向"
      }
    ],
    boundaryNotices: [{ title: "易学与东方认知边界", text: v2Boundaries.yijing }],
    title: "易学与东方认知发展中心",
    visualDescription: "以传统文化研究和认知辅助为定位，避免确定性承诺。",
    visualSeal: "易学",
    visualTitle: "东方认知"
  },
  "dao-medicine": {
    actions: [{ href: "/development", label: "发展中心总览" }, { href: "/cooperation", label: "研究合作", variant: "secondary" }],
    atmosphere: "credential",
    eyebrow: "Dao Medicine",
    imageSrc: "/images/itca/02-home-association.png",
    intro: "道医中医研究发展中心围绕道医文化、中医养生、药膳、导引、身心调理等方向开展研究、课程、资料整理和合作展示。",
    metadataTitle: "道医中医研究发展中心｜国际道教与文化协会 ITCA",
    sections: [
      {
        afterHero: true,
        cards: [
          { icon: "certificate", title: "道医文化研究", text: "整理道医历史、经典、人物、技法与当代表达。" },
          { icon: "cooperation", title: "中医养生合作", text: "对接中医、药膳、康养、营养、体重管理等专业伙伴。" },
          { icon: "value", title: "研究与合规", text: "建立顾问机制、风险说明、内容审查与公开传播规范。" },
          { icon: "query", title: "课程资料整理", text: "对养生课程、研修资料和合作展示内容进行审核与归档。" }
        ],
        title: "研究方向"
      }
    ],
    boundaryNotices: [{ title: "道医中医边界", text: v2Boundaries.daoMedicine }],
    title: "道医中医研究发展中心",
    visualDescription: "文化研究和养生资料展示必须与医疗诊疗、治疗建议明确区分。",
    visualSeal: "道医",
    visualTitle: "道医中医研究"
  }
};

