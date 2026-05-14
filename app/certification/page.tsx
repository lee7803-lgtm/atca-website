import Link from "next/link";
import type { ReactNode } from "react";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard } from "@/components/Section";

const process: Array<{ title: string; icon: IconBadgeName }> = [
  { title: "提交申请", icon: "certificate" },
  { title: "资料审核", icon: "query" },
  { title: "学习 / 考核", icon: "value" },
  { title: "协会审定", icon: "association" },
  { title: "发证备案", icon: "certification" },
  { title: "证书核验", icon: "query" }
];

const purposes: Array<{ title: string; text: string; icon: IconBadgeName }> = [
  { title: "登记道士身份及等级", text: "记录申请人的道教身份、法名道名、道派背景及相关等级信息。", icon: "certificate" },
  { title: "记录师承与修道经历", text: "整理申请人的师承关系、传承来源、修道经历与相关证明资料。", icon: "structure" },
  { title: "纳入协会认证备案", text: "将通过审核的认证资料纳入协会认证与备案体系，作为后续核验依据。", icon: "certification" },
  { title: "作为协会活动参与依据", text: "作为申请参与协会相关道教文化交流、经典学习、礼仪活动等事项的参考依据之一。", icon: "international" }
];

function CertificationSection({ eyebrow, title, intro, children, tone = "default", compact = false }: { eyebrow?: string; title: string; intro?: string; children: ReactNode; tone?: "default" | "soft"; compact?: boolean }) {
  return (
    <section className={tone === "soft" ? "bg-white/26" : ""}>
      <div className={`mx-auto max-w-7xl px-5 sm:px-8 ${compact ? "py-12 lg:py-16" : "py-14 lg:py-20"}`}>
        <div className="mb-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            {eyebrow ? <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-gold sm:text-sm">{eyebrow}</p> : null}
            <h2 className="font-serif text-3xl leading-tight text-porcelain sm:text-4xl lg:text-[2.65rem]">{title}</h2>
          </div>
          {intro ? <p className="max-w-2xl text-sm leading-8 text-[#666666] lg:justify-self-end">{intro}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function CertificationIcon({ name }: { name: IconBadgeName }) {
  return (
    <IconBadge
      name={name}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

export default function CertificationPage() {
  return (
    <>
      <PageHero
        eyebrow="Certification"
        title="认证体系"
        subtitle="Certification System"
        intro="协会当前开放的认证方向为“道士资格认证”。该认证用于登记申请人的道教身份、师承传承、修道经历与相关证明材料，并按协会流程进行审核与备案。"
        imageSrc="/images/atca/certification-detail.jpg"
        imagePosition="center 52%"
        visualDescription="围绕申请资料、身份备案、审核流程与证书核验，建立规范、可信、可追溯的认证服务体系。"
        visualEyebrow="ITCA Certification"
        visualMark="Credential"
        visualSeal="认证"
        visualTitle="认证资料与备案"
      />

      <CertificationSection eyebrow="Open Project" title="道士资格认证">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <InfoCard icon={<CertificationIcon name="certification" />} title="道士资格认证" text="道士资格认证围绕申请人的身份资料、师承关系、宗派背景、修道经历与相关证明文件进行审核，用于协会备案、证书签发及后续核验。" />
          <div className="min-h-full rounded-2xl border border-gold/35 bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
            申请人须提交身份资料、师承信息、宗教资质文件、实践经历及引荐资料，经协会审核后进入备案与证书签发流程。
          </div>
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Purpose" title="认证目的">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {purposes.map((item, index) => (
            <InfoCard icon={<CertificationIcon name={item.icon} />} index={`0${index + 1}`} key={item.title} text={item.text} title={item.title} />
          ))}
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Process" title="认证流程" tone="soft">
        <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="absolute left-6 right-6 top-8 hidden h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent xl:block" aria-hidden="true" />
          {process.map((item, index) => (
            <article className="relative rounded-2xl border border-[#e4ded0] bg-white/95 p-5 shadow-aureate" key={item.title}>
              <CertificationIcon name={item.icon} />
              <p className="mt-4 text-xs tracking-[0.22em] text-gold">第 {index + 1} 步</p>
              <h3 className="mt-4 text-base font-medium leading-7 text-porcelain">{item.title}</h3>
            </article>
          ))}
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Scope" title="认证说明与适用范围" compact>
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          提交认证申请前，请确认所填写资料真实、完整、可核验。ITCA 将根据申请人提交的身份资料、师承信息、学习经历、实践记录及相关证明材料进行审核与建档。
          <br />
          本认证用于协会内部认证、资料备案、文化交流、活动参与及证书核验，不等同于政府许可、行政许可、法定职业资格、商业授权或宗教职务任命。
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="inline-flex rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/certification/taoist-priest">
            查看道士资格认证详情
          </Link>
          <Link className="inline-flex rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-sm font-semibold text-ink" href="/certificate-query">
            证书查询
          </Link>
        </div>
      </CertificationSection>
    </>
  );
}
