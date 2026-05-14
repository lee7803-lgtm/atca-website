import Link from "next/link";
import type { ReactNode } from "react";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard } from "@/components/Section";

const profileItems = [
  ["组织定位", "协会以道教文化交流、会员服务、资格认证与资料备案为主要工作方向，服务相关个人、机构及文化交流合作事项。", "association"],
  ["当前工作", "协会当前重点开展道士资格认证、个人会员与机构会员申请、证书核验说明及文化合作联络等工作。", "certification"],
  ["边界说明", "协会认证与会员服务属于协会内部审核、备案与服务体系，不等同于政府许可、行政许可、宗教执法资格或商业授权。", "value"]
] as const;

const values = [
  ["尊重传统", "尊重道教传承、师承关系与文化脉络，在资料登记、认证审核与文化交流中保持对传统的敬畏。", "value"],
  ["规范认证", "依照协会流程审核认证申请，确保认证记录有据可查、边界明确。", "certification"],
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
  ["道教文化交流", "组织和推动道教文化、传统文化、经典学习与区域文化交流相关事项。", "international"],
  ["道士资格认证", "围绕道士身份、师承信息、宗派背景、修道经历与相关证明材料开展认证与备案。", "certification"],
  ["会员组织管理", "受理个人会员与机构会员申请，建立会员档案，推动会员服务与协会事务参与。", "membership"],
  ["资料备案与核验", "整理认证、会员与证书相关记录，为后续核验和服务工作提供依据。", "query"],
  ["合作与活动组织", "推动宫观道堂、文化机构、传统文化组织与相关合作方之间的交流与活动合作。", "cooperation"]
] as const;

function AssociationSection({ eyebrow, title, intro, children, tone = "default", compact = false }: { eyebrow?: string; title: string; intro?: string; children: ReactNode; tone?: "default" | "soft"; compact?: boolean }) {
  return (
    <section className={tone === "soft" ? "bg-white/26" : ""}>
      <div className={`mx-auto max-w-7xl px-5 sm:px-8 ${compact ? "py-12 lg:py-16" : "py-14 lg:py-20"}`}>
        <div className="mb-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            {eyebrow ? <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-gold sm:text-sm">{eyebrow}</p> : null}
            <h2 className="font-serif text-3xl leading-tight text-porcelain sm:text-4xl lg:text-[2.65rem]">
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
        eyebrow="About ITCA"
        title="关于协会"
        subtitle="International Taoisme And Cultural Association"
        intro="ITCA · International Taoisme And Cultural Association（国际道教与文化协会 / Persatuan Kebudayaan Dan Taoism Antarabangsa），面向道教文化传承、会员服务、资格认证与文化交流合作，致力于推动道教文化规范传播、资料备案与交流互鉴。"
        imageSrc="/images/atca/about-cultural-space.jpg"
        imagePosition="center 52%"
        visualDescription="通过资料整理、文化展示、学术交流和机构合作，推动道教文化在国际语境中的规范表达与持续发展。"
        visualEyebrow="Culture Heritage"
        visualMark="Culture"
        visualSeal="协会"
        visualTitle="道教文化传承"
      />

      <AssociationSection
        eyebrow="Profile"
        title="协会简介"
        intro="协会围绕道教文化交流、会员服务、资格认证与资料备案开展工作，服务相关个人、机构及文化交流合作事项。"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {profileItems.map(([title, text, icon], index) => (
            <InfoCard icon={<AssociationIcon name={icon} />} index={`0${index + 1}`} key={title} title={title} text={text} />
          ))}
        </div>
      </AssociationSection>

      <AssociationSection eyebrow="Mission" title="宗旨使命" tone="soft">
        <div className="grid gap-5 md:grid-cols-2">
          <InfoCard icon={<AssociationIcon name="value" />} title="宗旨" text="弘扬道教清净自然、济世利人、尊师重道的文化精神，促进道教文化与传统文化在区域内的交流、传承与规范发展。" />
          <InfoCard icon={<AssociationIcon name="cooperation" />} title="使命" text="服务道士资格认证、资料备案、会员工作、文化交流与机构合作，推动相关事务规范有序开展。" />
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
