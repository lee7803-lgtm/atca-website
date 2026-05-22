import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard } from "@/components/Section";

export const metadata: Metadata = {
  title: "认证体系｜国际道教与文化协会 ITCA"
};

const process: Array<{ title: string; icon: IconBadgeName }> = [
  { title: "选择认证", icon: "certificate" },
  { title: "填写资料", icon: "value" },
  { title: "提交申请", icon: "certification" },
  { title: "人工审核", icon: "association" },
  { title: "审核决定", icon: "query" },
  { title: "证书核验", icon: "query" }
];

const purposes: Array<{ title: string; text: string; icon: IconBadgeName }> = [
  { title: "登记道士身份及等级", text: "记录申请人的道教身份、法名道名、道派背景及相关等级信息。", icon: "certificate" },
  { title: "记录师承与修道经历", text: "整理申请人的师承关系、传承来源、修道经历与相关证明资料。", icon: "structure" },
  { title: "纳入协会认证备案", text: "将通过审核的认证资料纳入协会认证与备案体系，作为后续核验依据。", icon: "certification" },
  { title: "作为协会活动参与依据", text: "作为申请参与协会相关道教文化交流、经典学习、礼仪活动等事项的参考依据之一。", icon: "international" }
];

const overview: Array<{ title: string; text: string; icon: IconBadgeName }> = [
  { title: "认证是什么", text: "认证是协会依据申请资料开展审核、记录建档和证书核验的信息服务。", icon: "certification" },
  { title: "为什么需要认证", text: "用于整理个人身份、师承、修学与实践资料，便于后续核验和文化交流场景中的信息展示。", icon: "query" },
  { title: "适合谁", text: "适合需要提交道教身份、师承信息、修学经历和相关证明材料进行协会审核的申请人。", icon: "individual" },
  { title: "审核方式", text: "申请提交后进入人工审核，ITCA 可根据资料完整性和核验需要要求补充材料。", icon: "association" }
];

const roleEntrances: Array<{ title: string; text: string; href: string; action: string; icon: IconBadgeName }> = [
  {
    title: "认证申请",
    text: "用于申请人提交道士资格认证申请，填写认证路径、申报等级、身份资料、师承传承、资质凭证、实践经历与声明承诺。",
    href: "/certification/taoist-priest",
    action: "进入认证申请",
    icon: "certification"
  },
  {
    title: "申请进度 / 申请结果查询",
    text: "用于申请人本人使用申请编号和预留邮箱或手机号查询申请状态、审核反馈、证书生成情况，以及证书查看与打印入口。申请编号在证书核发后仍可继续使用。",
    href: "/application/query",
    action: "查询申请结果",
    icon: "query"
  },
  {
    title: "证书公开核验",
    text: "用于公众、合作方及第三方机构使用证书编号和持证人姓名核验证书公开信息。该入口不查询申请进度，不提供证书打印。",
    href: "/certificate-query",
    action: "公开核验证书",
    icon: "certificate"
  }
];

const futureDirections = ["个人认证", "传承认证", "专业能力认证", "机构认证"];

function CertificationSection({ eyebrow, title, intro, children, tone = "default", compact = false, afterHero = false }: { eyebrow?: string; title: string; intro?: string; children: ReactNode; tone?: "default" | "soft"; compact?: boolean; afterHero?: boolean }) {
  return (
    <section className={tone === "soft" ? "bg-white/26" : ""}>
      <div className={`mx-auto max-w-7xl px-5 sm:px-8 ${afterHero ? "pt-12 pb-16 md:pt-14 lg:pt-16 lg:pb-24" : compact ? "py-14 lg:py-18" : "py-16 lg:py-24"}`}>
        <div className="mb-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            {eyebrow ? <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-gold sm:text-sm">{eyebrow}</p> : null}
            <h2 className="font-serif text-3xl leading-tight text-porcelain sm:text-4xl lg:text-[2.75rem]">{title}</h2>
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
        actions={[
          { label: "道士资格认证", href: "/certification/taoist-priest" },
          { label: "证书公开核验", href: "/certificate-query" }
        ]}
        eyebrow="Certification"
        title="认证体系"
        subtitle="Certification System"
        intro="ITCA 认证体系用于发布认证范围、申请流程、资料核验与证书公开核验说明，服务道士资格认证申请、记录建档与官网核验。"
        imageSrc="/images/itca/03-service-certification.png"
        imagePosition="center 52%"
        visualDescription="围绕申请资料、身份备案、审核流程与证书核验，建立规范、可信、可追溯的认证服务体系。"
        visualEyebrow="ITCA Certification"
        visualMark="Credential"
        visualSeal="认证"
        visualTitle="认证资料与备案"
        atmosphere="credential"
      />

      <CertificationSection eyebrow="Overview" title="认证说明" afterHero>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {overview.map((item, index) => (
            <InfoCard icon={<CertificationIcon name={item.icon} />} index={`0${index + 1}`} key={item.title} text={item.text} title={item.title} />
          ))}
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Entrances" title="三类入口说明" intro="认证申请、申请进度 / 申请结果查询、证书公开核验分别服务不同角色和用途，申请人请保存申请编号，公众核验请使用证书编号。">
        <div className="grid gap-5 lg:grid-cols-3">
          {roleEntrances.map((item, index) => (
            <article className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-[0_14px_34px_rgba(31,42,40,0.045)]" key={item.title}>
              <CertificationIcon name={item.icon} />
              <p className="mt-4 text-xs tracking-[0.22em] text-gold">入口 {index + 1}</p>
              <h3 className="mt-3 text-lg font-medium text-porcelain">{item.title}</h3>
              <p className="mt-3 text-sm leading-8 text-[#5f5b52]">{item.text}</p>
              <Link className="mt-5 inline-flex rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink" href={item.href}>
                {item.action}
              </Link>
            </article>
          ))}
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Open Project" title="当前开放认证类别" tone="soft">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <InfoCard icon={<CertificationIcon name="certification" />} title="道士资格认证" text="道士资格认证围绕申请人的身份资料、师承关系、宗派背景、修道经历与相关证明文件进行审核，用于协会备案、证书签发及后续核验。" />
          <div className="min-h-full rounded-2xl border border-gold/35 bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
            申请人须提交身份资料、师承信息、资质文件、实践经历及引荐资料，经协会人工审核后进入记录建档与证书签发流程。
            <div className="mt-5">
              <Link className="inline-flex rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/certification/taoist-priest">
                查看道士资格认证详情
              </Link>
            </div>
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

      <CertificationSection eyebrow="Process" title="认证流程">
        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="absolute left-6 right-6 top-8 hidden h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent xl:block" aria-hidden="true" />
          {process.map((item, index) => (
            <article className="relative rounded-[1.35rem] border border-[#e4ded0] bg-white/95 p-5 shadow-[0_14px_34px_rgba(31,42,40,0.045)]" key={item.title}>
              <CertificationIcon name={item.icon} />
              <p className="mt-4 text-xs tracking-[0.22em] text-gold">第 {index + 1} 步</p>
              <h3 className="mt-4 text-base font-medium leading-7 text-porcelain">{item.title}</h3>
            </article>
          ))}
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Verification" title="证书公开核验方式" tone="soft" compact>
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <InfoCard icon={<CertificationIcon name="query" />} title="官网公开核验" text="证书生成后，公众、合作方及第三方机构可通过证书编号与持证人姓名核验证书公开信息。查询结果仅展示公开核验所需字段。" />
          <div className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)]">
            核验说明：证书公开核验不能查询申请进度，也不展示申请人的联系方式、上传材料、审核意见或二寸道装照。申请人如需查看申请结果或证书打印信息，请前往申请进度 / 申请结果查询。
          </div>
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Future" title="未来认证方向" compact>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {futureDirections.map((item) => (
            <article className="rounded-2xl border border-[#e4ded0] bg-white/92 p-6 shadow-[0_14px_34px_rgba(31,42,40,0.045)]" key={item}>
              <h3 className="text-lg font-medium text-porcelain">{item}</h3>
              <p className="mt-3 text-sm leading-7 text-[#666666]">陆续开放</p>
            </article>
          ))}
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Notice" title="重要提示" tone="soft" compact>
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          提交认证申请前，请确认所填写资料真实、完整、可核验。ITCA 将根据申请人提交的身份资料、师承信息、学习经历、实践记录及相关证明材料进行审核与建档。
          <br />
          ITCA 道士资格认证属于协会认证申请服务，用于资料审核、记录建档、证书核验及文化交流场景中的身份信息展示。
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="inline-flex rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/certification/taoist-priest">
            查看道士资格认证详情
          </Link>
          <Link className="inline-flex rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-sm font-semibold text-ink" href="/certificate-query">
            证书公开核验
          </Link>
        </div>
      </CertificationSection>
    </>
  );
}
