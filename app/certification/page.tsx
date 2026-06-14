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
  { title: "在线了解认证要求", icon: "certificate" },
  { title: "提交申请资料", icon: "value" },
  { title: "初步资料审核", icon: "certification" },
  { title: "认证委员会审核", icon: "association" },
  { title: "补充资料或面谈", icon: "cooperation" },
  { title: "认证结果确认", icon: "query" },
  { title: "生成 / 颁发认证证书", icon: "certificate" },
  { title: "官网证书公开核验", icon: "query" }
];

const purposes: Array<{ title: string; text: string; icon: IconBadgeName }> = [
  { title: "登记道士身份及等级", text: "记录申请人的道教身份、法名道名、道派背景及相关等级信息。", icon: "certificate" },
  { title: "记录师承与修道经历", text: "整理申请人的师承关系、传承来源、修道经历与相关证明资料。", icon: "structure" },
  { title: "纳入协会认证建档", text: "将通过审核的认证资料纳入协会认证建档体系，作为后续公开核验依据。", icon: "certification" },
  { title: "文化交流参考", text: "可作为协会内部文化交流、学习活动、资料建档与相关沟通场景中的参考信息之一。", icon: "international" }
];

const overview: Array<{ title: string; text: string; icon: IconBadgeName }> = [
  { title: "认证是什么", text: "认证是协会依据申请资料开展审核、记录建档和证书公开核验的信息服务。", icon: "certification" },
  { title: "为什么需要认证", text: "用于整理个人身份、师承、修学与实践资料，便于后续核验和文化交流场景中的信息展示。", icon: "query" },
  { title: "适合谁", text: "适合需要提交道教身份、师承信息、修学经历和相关证明材料进行协会审核的申请人。", icon: "individual" },
  { title: "审核方式", text: "申请提交后进入人工审核，ITCA 可根据资料完整性和核验需要要求补充材料。", icon: "association" }
];

function CertificationSection({ eyebrow, title, intro, children, tone = "default", compact = false, afterHero = false }: { eyebrow?: string; title: string; intro?: string; children: ReactNode; tone?: "default" | "soft"; compact?: boolean; afterHero?: boolean }) {
  return (
    <section className={tone === "soft" ? "section-surface-soft" : "section-surface"}>
      <div className={`mx-auto w-full max-w-7xl min-w-0 px-5 sm:px-8 ${afterHero ? "pt-12 pb-16 md:pt-14 lg:pt-16 lg:pb-24" : compact ? "py-14 lg:py-18" : "py-16 lg:py-24"}`}>
        <div className="mb-10 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <div className="min-w-0">
            {eyebrow ? <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-gold sm:text-sm">{eyebrow}</p> : null}
            <h2 className="font-serif text-3xl leading-tight text-porcelain sm:text-4xl lg:text-[2.75rem]">{title}</h2>
          </div>
          {intro ? <p className="min-w-0 max-w-2xl text-sm leading-8 text-[#666666] lg:justify-self-end">{intro}</p> : null}
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
          { label: "认证建档申请", href: "/certification/taoist-priest" },
          { label: "申请查询", href: "/application/query" },
          { label: "证书公开核验", href: "/certificate-query" }
        ]}
        eyebrow="Certification"
        title="认证体系"
        intro="ITCA 认证体系用于发布认证范围、申请流程、资料核验与证书公开核验说明，服务道教文化认证建档、道士认证建档与官网核验。"
        backgroundImageSrc="/images/atca/certification-detail.jpg"
        backgroundImagePosition="center 50%"
        imageSrc="/images/itca/03-service-certification.png"
        imagePosition="center 52%"
        visualDescription="围绕申请资料、身份备案、审核流程与证书公开核验，建立规范、可信、可追溯的认证服务体系。"
        visualEyebrow="ITCA Certification"
        visualMark="Credential"
        visualSeal="认证"
        visualTitle="认证资料与备案"
        atmosphere="credential"
      />

      <CertificationSection eyebrow="Overview" title="认证说明" afterHero>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {overview.map((item, index) => (
            <InfoCard icon={<CertificationIcon name={item.icon} />} index={`0${index + 1}`} key={item.title} text={item.text} title={item.title} />
          ))}
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Open Project" title="开放认证项目" tone="soft">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <InfoCard icon={<CertificationIcon name="certification" />} title="道教文化认证建档" text="道教文化认证建档 / 道士认证建档围绕申请人的身份资料、师承关系、宗派背景、修道经历与相关证明文件进行审核，用于协会记录建档、证书签发及后续核验。" />
          <div className="min-h-full min-w-0 overflow-hidden rounded-2xl border border-gold/35 bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
            申请人须提交身份资料、师承信息、资质文件、实践经历及引荐资料，经协会人工审核后进入记录建档与证书签发流程。
            <div className="mt-5">
              <Link className="inline-flex max-w-full rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/certification/taoist-priest">
                查看认证建档详情
              </Link>
            </div>
          </div>
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Purpose" title="认证目的">
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {purposes.map((item, index) => (
            <InfoCard icon={<CertificationIcon name={item.icon} />} index={`0${index + 1}`} key={item.title} text={item.text} title={item.title} />
          ))}
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Process" title="认证流程" tone="soft">
        <div className="relative grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-6 right-6 top-8 hidden h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent xl:block" aria-hidden="true" />
          {process.map((item, index) => (
            <article className="relative min-w-0 overflow-hidden rounded-[1.35rem] border border-[#e4ded0] bg-white/95 p-5 shadow-[0_14px_34px_rgba(31,42,40,0.045)]" key={item.title}>
              <CertificationIcon name={item.icon} />
              <p className="mt-4 text-xs tracking-[0.22em] text-gold">第 {index + 1} 步</p>
              <h3 className="mt-4 text-base font-medium leading-7 text-porcelain">{item.title}</h3>
            </article>
          ))}
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Verification" title="证书公开核验方式" compact>
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <InfoCard icon={<CertificationIcon name="query" />} title="官网公开核验" text="证书生成后，公众、合作方及第三方机构可通过证书编号与持证人姓名核验证书公开信息。查询结果仅展示公开核验所需资料。" />
          <div className="min-w-0 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/94 p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)]">
            核验说明：证书公开核验不能查询申请进度，也不展示申请人的联系方式、上传材料、审核意见或道装证件照。申请人如需查看申请结果或证书打印信息，请前往申请查询。
          </div>
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Scope" title="其他认证项目说明" tone="soft" compact>
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          ITCA 官网目前公开道教文化认证建档申请入口。其他认证项目如需开放，将以协会正式公告和对应申请说明为准；未公告前不作为开放申请项目。
        </div>
      </CertificationSection>

      <CertificationSection eyebrow="Notice" title="重要提示" compact>
        <div className="min-w-0 overflow-hidden border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          提交认证申请前，请确认所填写资料真实、完整、可核验。ITCA 将根据申请人提交的身份资料、师承信息、学习经历、实践记录及相关证明材料进行审核与建档。
          <br />
          本认证为 ITCA 协会认证建档，用于文化交流、会员服务和协会内部记录场景中的参考信息，不构成政府许可、行政执业资格或法定从业资质。公开核验只证明协会公开登记状态，不替代任何政府、监管机构或专业机构核查。认证结果不得用于与道教文化、协会活动、文化交流无关的商业宣传或误导性用途。
        </div>
        <div className="mt-7 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="inline-flex max-w-full rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/certification/taoist-priest">
            查看认证建档详情
          </Link>
          <Link className="inline-flex max-w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/certificate-query">
            证书公开核验
          </Link>
        </div>
      </CertificationSection>
    </>
  );
}
