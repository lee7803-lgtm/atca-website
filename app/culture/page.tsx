import type { Metadata } from "next";
import { V2InfoPage } from "@/components/v2/V2InfoPage";
import { publicBoundaries, type V2PageData } from "@/lib/v2/content";

export const metadata: Metadata = {
  title: "道教文化｜国际道教与文化协会 ITCA"
};

const page: V2PageData = {
  actions: [
    { href: "/faith", label: "道教信仰" },
    { href: "/doctrine", label: "教理教义", variant: "secondary" },
    { href: "/exchange", label: "文化交流", variant: "secondary" }
  ],
  atmosphere: "gate",
  backgroundImageSrc: "/images/atca/about-cultural-space.jpg",
  eyebrow: "Taoist Culture",
  imageSrc: "/images/itca/01-home-hero.png",
  intro: "道教文化栏目用于汇总道教信仰、教理教义、经典思想、宫观文化、修行生活、文化交流和公开资料入口，面向公众提供克制、稳健、可继续阅读的文化导览。",
  metadataTitle: "道教文化｜国际道教与文化协会 ITCA",
  sections: [
    {
      afterHero: true,
      cards: [
        { href: "/faith", icon: "value", title: "道教信仰", text: "介绍道法自然、济世利人、宫观文化、修行生活和当代文化表达。" },
        { href: "/doctrine", icon: "certificate", title: "教理教义", text: "整理经典导读、伦理修身、生命修炼、基础术语和学习路径。" },
        { href: "/exchange", icon: "international", title: "文化交流", text: "展示国际交流、文化研究、课程研修、机构合作和活动记录。" },
        { href: "/development", icon: "cooperation", title: "发展中心", text: "承接文化研究、教育传播、国际交流、项目共建和资料整理工作。" },
        { href: "/data", icon: "query", title: "资料中心", text: "展示经审核允许公开的文化资料、机构资料、活动资料和课程资料。" },
        { href: "/cooperation", icon: "contact", title: "联系合作", text: "为文化机构、研究单位、课程团队和国际伙伴提供正式沟通入口。" }
      ],
      eyebrow: "Culture Map",
      intro: "该总览页帮助公众从文化阅读、学习研修、交流合作和公开资料四类路径进入相关栏目。",
      title: "文化栏目导览"
    },
    {
      cards: [
        { icon: "structure", title: "尊重传统", text: "内容表达尊重道教传承、经典语境、宫观文化和师承脉络。" },
        { icon: "membership", title: "面向公众", text: "以公众可理解的语言提供基础介绍，不替代个人宗教实践指导。" },
        { icon: "value", title: "克制表达", text: "避免功效化、神秘化、夸张化和不适合公开传播的表述。" }
      ],
      eyebrow: "Principles",
      intro: "道教文化内容以公开介绍、文化学习和交流展示为主。",
      title: "内容原则",
      tone: "soft"
    },
    {
      notice: "涉及养生、道医中医、易学认知等内容时，官网坚持文化研究和交流展示定位，不作医疗诊断、治疗建议、药品功效承诺或确定性预测承诺，不替代医生建议。",
      title: "文化内容边界"
    }
  ],
  boundaryNotices: [
    { title: "道医中医文化边界", text: publicBoundaries.daoMedicine },
    { title: "易学认知边界", text: publicBoundaries.yijing }
  ],
  title: "道教文化",
  visualDescription: "汇总信仰文化、教理教义、文化交流和资料中心入口，形成公众浏览的文化导览。",
  visualSeal: "文化",
  visualTitle: "道教文化导览"
};

export default function CulturePage() {
  return <V2InfoPage page={page} />;
}
