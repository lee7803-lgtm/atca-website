import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard } from "@/components/Section";

export const metadata: Metadata = {
  title: "关于协会｜国际道教与文化协会 ITCA"
};

const profileItems = [
  ["协会定位", "ITCA 官网作为国际道教与文化协会相关展示与服务平台，用于协会介绍、认证申请、会员申请、证书核验与合作联系。", "association"],
  ["服务范围", "协会当前重点提供道士资格认证申请、个人会员与机构会员申请、证书核验说明及文化合作联络等信息服务。", "certification"],
  ["服务说明", "认证服务用于资料审核、记录建档、证书核验及文化交流场景中的身份信息展示。", "value"]
] as const;

const values = [
  ["尊重传统", "尊重道教传承、师承关系与文化脉络，在资料登记、认证审核与文化交流中保持对传统的敬畏。", "value"],
  ["规范认证", "依照协会流程审核认证申请，推动认证记录有据可查、流程说明清晰。", "certification"],
  ["国际交流", "面向不同国家和地区，促进道教文化、传统文化与相关机构之间的交流合作。", "international"],
  ["公开透明", "通过官网公开协会信息、认证须知、会员申请与证书核验事项，减少信息不对称。", "query"],
  ["稳健发展", "立足认证、会员与证书核验等基础工作，逐步拓展文化交流与合作服务。", "cooperation"]
] as const;

const structure = [
  ["理事会", "负责协会发展方向、重大事项决议、制度建设与重要合作事项的审议。", "structure"],
  ["秘书处", "负责协会日常事务、资料整理、会员沟通、申请受理与内部协调工作。", "association"],
  ["认证委员会", "负责认证材料审核、认证流程执行、认证标准维护与认证结果建议。", "certification"],
  ["专家顾问委员会", "为道教文化、传统文化、认证标准与交流活动提供专业意见与顾问支持。", "value"],
  ["会员服务部门", "负责个人会员、机构会员的申请须知、资料接收、沟通服务与会籍管理。", "membership"],
  ["合作发展部门", "负责机构合作、文化交流、活动联络、资源对接与外部合作沟通。", "cooperation"]
] as const;

const functions = [
  ["道教文化交流", "组织和推动道教文化、传统文化、经典学习与道教文化国际交流相关事项。", "international"],
  ["道士资格认证", "围绕道士身份、师承信息、宗派背景、修道经历与相关证明材料开展认证与备案。", "certification"],
  ["会员组织管理", "受理个人会员与机构会员申请，建立会员档案，推动会员服务与协会事务参与。", "membership"],
  ["资料备案与核验", "整理认证、会员与证书相关记录，为后续核验和服务工作提供依据。", "query"],
  ["合作与活动组织", "推动宫观道堂、文化机构、传统文化组织与相关合作方之间的交流与活动合作。", "cooperation"]
] as const;

function AssociationSection({ eyebrow, title, intro, children, tone = "default", compact = false, afterHero = false }: { eyebrow?: string; title: string; intro?: string; children: ReactNode; tone?: "default" | "soft"; compact?: boolean; afterHero?: boolean }) {
  return (
    <section className={tone === "soft" ? "bg-white/26" : ""}>
      <div className={`mx-auto max-w-7xl px-5 sm:px-8 ${afterHero ? "pt-12 pb-16 md:pt-14 lg:pt-16 lg:pb-24" : compact ? "py-14 lg:py-18" : "py-16 lg:py-24"}`}>
        <div className="mb-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            {eyebrow ? <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-gold sm:text-sm">{eyebrow}</p> : null}
            <h2 className="font-serif text-3xl leading-tight text-porcelain sm:text-4xl lg:text-[2.75rem]">
              {title}
            </h2>
          </div>
          {intro ? <p className="max-w-2xl text-sm leading-8 text-[#666666] lg:justify-self-end">{intro}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function AssociationIcon({ name }: { name: IconBadgeName }) {
  return (
    <IconBadge
      name={name}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

export default function AssociationPage() {
  return (
    <>
      <PageHero
        actions={[
          { label: "联系合作", href: "/contact" }
        ]}
        eyebrow="About ITCA"
        title="关于协会"
        intro="ITCA 官网用于协会介绍、认证申请、会员申请、证书核验与合作联系等信息服务，服务道教文化传承与国际交流。"
        backgroundImageSrc="/images/atca/about-cultural-space.jpg"
        backgroundImagePosition="center 48%"
        imageSrc="/images/itca/02-home-association.png"
        imagePosition="center 52%"
        visualDescription="通过资料整理、文化展示、学术交流和机构合作，推动道教文化在国际语境中的规范表达与持续发展。"
        visualEyebrow="Culture Heritage"
        visualMark="Culture"
        visualSeal="协会"
        visualTitle="道教文化传承"
        atmosphere="gate"
      />

      <AssociationSection
        eyebrow="Profile"
        title="协会简介"
        intro="协会围绕道教文化交流、会员服务、认证申请与资料建档开展工作，服务相关个人、机构及文化交流合作事项。"
        afterHero
      >
        <div className="grid gap-5 md:grid-cols-3">
          {profileItems.map(([title, text, icon], index) => (
            <InfoCard icon={<AssociationIcon name={icon} />} index={`0${index + 1}`} key={title} title={title} text={text} />
          ))}
        </div>
      </AssociationSection>

      <AssociationSection eyebrow="Mission" title="宗旨使命" tone="soft">
        <div className="grid gap-5 md:grid-cols-2">
          <InfoCard icon={<AssociationIcon name="value" />} title="宗旨" text="弘扬道教清净自然、济世利人、尊师重道的文化精神，促进道教文化与传统文化在国际语境中的交流、传承与规范发展。" />
          <InfoCard icon={<AssociationIcon name="cooperation" />} title="使命" text="服务道士资格认证申请、资料建档、会员工作、文化交流与机构合作，推动相关事务规范有序开展。" />
        </div>
      </AssociationSection>

      <AssociationSection eyebrow="Service Relationship" title="认证与会员服务关系">
        <div className="grid gap-5 md:grid-cols-3">
          <InfoCard icon={<AssociationIcon name="membership" />} title="会员服务" text="个人会员与机构会员申请用于建立会员档案、沟通参与意向，并承接后续文化交流、活动联系与合作服务。" />
          <InfoCard icon={<AssociationIcon name="certification" />} title="认证申请服务" text="认证申请服务围绕身份资料、师承信息、学习经历、实践说明和证明材料进行审核与记录建档。" />
          <InfoCard icon={<AssociationIcon name="international" />} title="国际文化交流定位" text="协会面向不同国家和地区，以文化交流、资料整理、会员联络和合作沟通推动道教文化的规范表达。" />
        </div>
      </AssociationSection>

      <AssociationSection eyebrow="Values" title="核心价值">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {values.map(([title, text, icon], index) => (
            <InfoCard icon={<AssociationIcon name={icon} />} index={`0${index + 1}`} key={title} text={text} title={title} />
          ))}
        </div>
      </AssociationSection>

      <AssociationSection eyebrow="Structure" title="组织架构" tone="soft">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {structure.map(([title, text, icon], index) => (
            <InfoCard icon={<AssociationIcon name={icon} />} index={`0${index + 1}`} key={title} text={text} title={title} />
          ))}
        </div>
      </AssociationSection>

      <AssociationSection eyebrow="Functions" title="核心职能">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {functions.map(([title, text, icon], index) => (
            <InfoCard icon={<AssociationIcon name={icon} />} index={`0${index + 1}`} key={title} text={text} title={title} />
          ))}
        </div>
      </AssociationSection>

      <AssociationSection eyebrow="Next Step" title="后续事项" tone="soft" compact>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/certification">了解认证体系</Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/membership">申请会员</Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/contact">联系合作</Link>
        </div>
      </AssociationSection>
    </>
  );
}
