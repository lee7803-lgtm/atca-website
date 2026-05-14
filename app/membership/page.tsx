import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard } from "@/components/Section";

export const metadata: Metadata = {
  title: "会员申请｜国际道教与文化协会 ITCA"
};

const memberTypes = [
  {
    title: "个人会员",
    text: "适用于关注道教文化、传统文化交流、协会活动、学习研修或认证相关服务的个人申请人。",
    href: "/member/apply",
    icon: "individual" as IconBadgeName,
    labels: ["道教文化学习者", "道教文化研究者", "道教文化传播者", "道士资格认证申请人"]
  },
  {
    title: "机构会员",
    text: "适用于宫观道堂、道教文化机构、传统文化组织、文化交流机构及其他经协会审核认可的机构。",
    href: "/organization/apply",
    icon: "institution" as IconBadgeName,
    labels: ["宫观道堂及文化场所", "传统文化机构", "教育培训机构", "社团组织", "研究机构", "合作单位"]
  }
];

const purposes: Array<{ title: string; text: string; icon: IconBadgeName }> = [
  { title: "参与协会活动", text: "用于了解并参与协会后续组织的文化交流、经典学习、活动联络等事项。", icon: "international" },
  { title: "建立会员档案", text: "用于登记会员基础资料、联系方式、学习或机构背景及后续沟通信息。", icon: "membership" },
  { title: "对接认证服务", text: "会员可进一步了解道士资格认证相关说明，但会员身份不等于认证身份。", icon: "certification" },
  { title: "开展合作联系", text: "机构会员可作为文化交流、活动合作、资料对接及后续合作沟通的基础。", icon: "cooperation" }
];

const process: Array<{ title: string; icon: IconBadgeName }> = [
  { title: "选择会员类型", icon: "membership" },
  { title: "准备申请资料", icon: "certificate" },
  { title: "协会审核确认", icon: "value" },
  { title: "建立会员档案", icon: "structure" }
];

function MembershipSection({ eyebrow, title, intro, children, tone = "default", compact = false }: { eyebrow?: string; title: string; intro?: string; children: ReactNode; tone?: "default" | "soft"; compact?: boolean }) {
  return (
    <section className={tone === "soft" ? "bg-white/26" : ""}>
      <div className={`mx-auto max-w-7xl px-5 sm:px-8 ${compact ? "py-14 lg:py-18" : "py-16 lg:py-24"}`}>
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

function MembershipIcon({ name }: { name: IconBadgeName }) {
  return (
    <IconBadge
      name={name}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

function LabelList({ items }: { items: string[] }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map((item) => (
        <span className="rounded-full border border-[#e4ded0] bg-[#f8f7f3] px-3 py-1.5 text-xs font-medium text-[#66594d]" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default function MembershipPage() {
  return (
    <>
      <PageHero
        eyebrow="Membership"
        title="会员申请"
        subtitle="Membership Application"
        intro="申请人可根据自身情况选择个人会员或机构会员类型提交资料。协会秘书处将依据提交信息进行初步审核，并在需要时联系补充相关材料。"
        imageSrc="/images/atca/member-gathering.jpg"
        imagePosition="center 46%"
        visualDescription="为会员提供申请登记、资料提交、服务对接与后续参与协会活动的基础入口。"
        visualEyebrow="Membership Service"
        visualMark="Member"
        visualSeal="会员"
        visualTitle="会员组织服务"
      />

      <MembershipSection eyebrow="Application Notice" title="申请须知" compact>
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          申请人可根据自身情况选择个人会员或机构会员类型提交资料。协会秘书处将依据提交信息进行初步审核，并在需要时与申请人联系补充相关材料。申请提交后，请保存页面显示的申请编号，以便后续查询办理进度。
        </div>
      </MembershipSection>

      <MembershipSection eyebrow="Member Types" title="会员类型">
        <div className="grid gap-6 md:grid-cols-2">
          {memberTypes.map((item) => (
            <article className="pattern-card rounded-[1.5rem] border border-[#e4ded0] bg-white/90 p-6 shadow-[0_18px_48px_rgba(31,42,40,0.055)] sm:p-8" key={item.title}>
              <MembershipIcon name={item.icon} />
              <h2 className="mt-5 text-2xl font-medium text-porcelain">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[#666666]">{item.text}</p>
              <LabelList items={item.labels} />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link className="inline-flex rounded-full bg-[#7F1D1D] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href={item.href}>{item.title}申请</Link>
                <Link className="inline-flex rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-sm font-semibold text-ink" href="/application/query">查询申请进度</Link>
              </div>
            </article>
          ))}
        </div>
      </MembershipSection>

      <MembershipSection eyebrow="Purpose" title="会员申请用途" tone="soft">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {purposes.map((item, index) => (
            <InfoCard icon={<MembershipIcon name={item.icon} />} index={`0${index + 1}`} key={item.title} text={item.text} title={item.title} />
          ))}
        </div>
      </MembershipSection>

      <MembershipSection eyebrow="Process" title="申请流程">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {process.map((item, index) => (
            <article className="rounded-2xl border border-[#e4ded0] bg-white/95 p-5 shadow-aureate" key={item.title}>
              <MembershipIcon name={item.icon} />
              <p className="mt-4 text-xs tracking-[0.22em] text-gold">第 {index + 1} 步</p>
              <h3 className="mt-4 text-base font-medium leading-7 text-porcelain">{item.title}</h3>
            </article>
          ))}
        </div>
      </MembershipSection>

      <MembershipSection eyebrow="Boundary" title="会员身份说明" tone="soft" compact>
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          会员身份属于协会会员服务与档案管理体系，不等同于道士资格认证、行政许可、商业授权或任何法定资质。申请道士资格认证需另行提交认证申请材料，并按认证流程审核。
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/member/apply">申请个人会员</Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/organization/apply">申请机构会员</Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/application/query">申请进度查询</Link>
        </div>
      </MembershipSection>
    </>
  );
}
