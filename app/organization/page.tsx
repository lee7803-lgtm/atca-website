import type { Metadata } from "next";
import { V2InfoPage } from "@/components/v2/V2InfoPage";
import type { V2PageData } from "@/lib/v2/content";

export const metadata: Metadata = {
  title: "组织与委员会｜国际道教与文化协会 ITCA"
};

const page: V2PageData = {
  actions: [
    { href: "/intro", label: "协会介绍" },
    { href: "/membership", label: "会员体系", variant: "secondary" }
  ],
  atmosphere: "gate",
  backgroundImageSrc: "/images/atca/about-cultural-space.jpg",
  eyebrow: "Organization",
  imageSrc: "/images/itca/02-home-association.png",
  intro: "组织与委员会栏目用于说明 ITCA 的基本治理结构、日常事务分工、认证评审支持和会员服务协作方式，帮助公众理解协会工作如何组织与推进。",
  metadataTitle: "组织与委员会｜国际道教与文化协会 ITCA",
  sections: [
    {
      afterHero: true,
      cards: [
        { icon: "structure", title: "理事会", text: "负责协会发展方向、重大事项审议、制度建设和重要合作事项的统筹。" },
        { icon: "association", title: "秘书处", text: "负责日常协调、资料受理、会员沟通、申请流转、公开信息维护和对外联络。" },
        { icon: "certification", title: "认证委员会", text: "负责认证材料审核、认证标准维护、评审建议、证书记录和公开核验事项。" },
        { icon: "value", title: "专家顾问委员会", text: "为道教文化、传统文化、课程研修、文化交流和专业议题提供咨询支持。" },
        { icon: "membership", title: "会员服务部门", text: "负责个人会员、机构会员的申请说明、资料沟通、会籍服务和活动联系。" },
        { icon: "cooperation", title: "合作发展部门", text: "负责机构合作、文化交流、项目共建、发展中心协作和外部合作沟通。" }
      ],
      eyebrow: "Structure",
      intro: "协会组织结构服务于公开信息、会员服务、认证建档、文化交流和合作发展等工作。",
      title: "组织架构"
    },
    {
      cards: [
        { icon: "query", title: "职责清晰", text: "各部门按照受理、审核、核验、发布、沟通和归档等环节分工协作。" },
        { icon: "certificate", title: "记录可追溯", text: "申请、审核、证书、会员和通知记录以系统留存和公开核验结果为准。" },
        { icon: "international", title: "合作有边界", text: "对外合作以文化交流、课程活动、研究整理和项目共建为主要方向。" }
      ],
      eyebrow: "Governance",
      intro: "组织治理强调流程清晰、职责明确、公开信息克制和资料使用合规。",
      title: "工作原则",
      tone: "soft"
    },
    {
      actions: [
        { href: "/cooperation", label: "联系合作" },
        { href: "/organization/apply", label: "机构会员申请", variant: "secondary" },
        { href: "/application/query", label: "申请进度查询", variant: "secondary" }
      ],
      notice: "组织与委员会页面仅展示协会公开治理结构和工作分工。具体申请、审核、合作和信息发布事项，以官网公开说明及协会秘书处正式确认为准。",
      title: "相关入口"
    }
  ],
  title: "组织与委员会",
  visualDescription: "以清晰组织分工支撑会员服务、认证建档、文化交流、发展中心和合作事项。",
  visualSeal: "组织",
  visualTitle: "组织治理"
};

export default function OrganizationPage() {
  return <V2InfoPage page={page} />;
}
