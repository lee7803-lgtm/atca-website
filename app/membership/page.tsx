import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard } from "@/components/Section";

export const metadata: Metadata = {
  title: "会员体系｜国际道教与文化协会 ITCA"
};

const memberTypes = [
  {
    title: "个人会员",
    text: "适用于关注道教文化、传统文化交流、协会活动、学习研修或认证相关服务的个人申请人。",
    href: "/member/apply",
    icon: "individual" as IconBadgeName,
    labels: ["道教文化学习者", "道教文化研究者", "道教文化传播者", "认证建档申请人"]
  },
  {
    title: "机构会员",
    text: "适用于宫观道堂、道教文化机构、传统文化组织、文化交流机构及其他经协会审核认可的机构。",
    href: "/organization/apply",
    icon: "institution" as IconBadgeName,
    labels: ["宫观道堂及文化场所", "传统文化机构", "教育研究机构", "社团组织", "合作单位"]
  }
];

const purposes: Array<{ title: string; text: string; icon: IconBadgeName }> = [
  { title: "参与协会活动", text: "用于了解并参与协会后续组织的文化交流、经典学习、活动联络等事项。", icon: "international" },
  { title: "建立会员档案", text: "用于登记会员基础资料、联系方式、学习或机构背景及后续沟通信息。", icon: "membership" },
  { title: "对接认证建档服务", text: "会员可进一步了解道教文化认证建档相关说明，但会员身份不等于认证建档状态。", icon: "certification" },
  { title: "开展合作联系", text: "机构会员可作为文化交流、活动合作、资料对接及后续合作沟通的基础。", icon: "cooperation" }
];

const process: Array<{ title: string; icon: IconBadgeName }> = [
  { title: "选择会员类型", icon: "membership" },
  { title: "准备申请资料", icon: "certificate" },
  { title: "协会审核确认", icon: "value" },
  { title: "建立会员档案", icon: "structure" }
];

const lifecycleRows = [
  ["申请前须知", "确认个人或机构会员类型，阅读会员身份边界和资料使用说明。", "前台可用"],
  ["申请材料", "提交基础身份、联系方式、学习经历、机构资料或推荐信息。", "前台可用"],
  ["审核流程", "秘书处进行资料初审，必要时进入人工复核和补件流程。", "流程处理"],
  ["付款确认", "涉及费用时从申请进度页进入 Bank Transfer 订单和凭证审核。", "流程处理"],
  ["会员编号生成", "审核通过后生成会员编号，并进入会员公开核验最小字段展示。", "流程处理"],
  ["公开核验", "公众仅可通过会员编号和姓名 / 机构名称核验公开登记状态。", "前台可用"]
];

const membershipFaq = [
  ["我适合申请哪类会员？", "个人学习者、研究者和认证申请人优先选择个人会员；宫观、道堂、文化机构、社团组织选择机构会员。"],
  ["提交后在哪里查询？", "保存申请编号，通过申请进度查询页面查看审核、补件、付款和结果状态。"],
  ["会员是否等于认证？", "不是。会员身份属于协会会员服务体系，认证建档需要另行提交认证申请并通过审核。"]
];

function MembershipSection({ eyebrow, title, intro, children, tone = "default", compact = false, afterHero = false }: { eyebrow?: string; title: string; intro?: string; children: ReactNode; tone?: "default" | "soft"; compact?: boolean; afterHero?: boolean }) {
  return (
    <section className={tone === "soft" ? "section-surface-soft" : "section-surface"}>
      <div className={`mx-auto w-full max-w-7xl min-w-0 px-5 sm:px-8 ${afterHero ? "pt-12 pb-14 md:pt-14 lg:pt-16 lg:pb-18" : compact ? "py-14 lg:py-18" : "py-16 lg:py-24"}`}>
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
    <div className="mt-5 flex min-w-0 flex-wrap gap-2">
      {items.map((item) => (
        <span className="max-w-full break-words rounded-full border border-[#e4ded0] bg-[#f8f7f3] px-3 py-1.5 text-xs font-medium text-[#66594d]" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

function RowList({ rows }: { rows: string[][] }) {
  return (
    <div className="grid min-w-0 gap-3">
      {rows.map(([title, text, status], index) => (
        <article className="grid min-w-0 gap-3 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-[0_10px_24px_rgba(31,42,40,0.035)] md:grid-cols-[10rem_minmax(0,1fr)_8rem] md:items-center" key={title}>
          <div>
            <p className="text-xs tracking-[0.22em] text-gold">0{index + 1}</p>
            <h3 className="mt-2 text-base font-semibold text-porcelain">{title}</h3>
          </div>
          <p className="text-sm leading-7 text-[#5f5b52]">{text}</p>
          <span className="rounded-full border border-[#d8d0bf] bg-[#fbf8ef] px-3 py-1 text-center text-xs font-semibold text-[#66594d]">{status}</span>
        </article>
      ))}
    </div>
  );
}

function EmptyPanel({ text, title }: { text: string; title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8d0bf] bg-[#fbf8ef] p-6 text-sm leading-7 text-[#5f5b52]">
      <p className="font-serif text-2xl text-porcelain">{title}</p>
      <p className="mt-3">{text}</p>
    </div>
  );
}

export default function MembershipPage() {
  return (
    <>
      <PageHero
        actions={[
          { label: "个人会员申请", href: "/member/apply" },
          { label: "机构会员申请", href: "/organization/apply" },
          { label: "会员公开核验", href: "/member-query" }
        ]}
        eyebrow="Membership"
        title="会员体系"
        subtitle="Membership Application"
        intro="ITCA 会员体系用于说明个人会员、机构会员申请范围、资料要求、会员服务、会籍管理和活动参与方式。会员身份属于协会会员服务体系，不等同于认证建档状态。"
        backgroundImageSrc="/images/atca/member-gathering.jpg"
        backgroundImagePosition="center 48%"
        imageSrc="/images/itca/04-service-membership.png"
        imagePosition="center 46%"
        visualDescription="为会员提供申请登记、资料提交、服务对接与参与协会活动的基础入口。"
        visualEyebrow="Membership Service"
        visualMark="Member"
        visualSeal="会员"
        visualTitle="会员组织服务"
      />

      <Breadcrumbs items={[{ label: "会员体系" }]} />

      <MembershipSection eyebrow="Application Notice" title="会员申请须知" compact afterHero>
        <div className="min-w-0 overflow-hidden border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          申请人可根据自身情况选择个人会员或机构会员类型提交资料。协会秘书处将依据提交信息进行初步审核，并在需要时与申请人联系补充相关材料。申请提交后，请保存页面显示的申请编号，以便后续查询办理进度。
        </div>
      </MembershipSection>

      <MembershipSection eyebrow="Member Types" title="会员类型" tone="soft">
        <div className="grid min-w-0 gap-6 md:grid-cols-2">
          {memberTypes.map((item) => (
            <article className="pattern-card min-w-0 overflow-hidden rounded-[1.5rem] border border-[#e4ded0] bg-white/90 p-6 shadow-[0_18px_48px_rgba(31,42,40,0.055)] sm:p-8" key={item.title}>
              <MembershipIcon name={item.icon} />
              <h2 className="mt-5 text-2xl font-medium text-porcelain">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[#666666]">{item.text}</p>
              <LabelList items={item.labels} />
              <div className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link className="inline-flex max-w-full rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href={item.href}>{item.title}申请</Link>
                <Link className="inline-flex max-w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/application/query">查询申请进度</Link>
                <Link className="inline-flex max-w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/member-query">会员公开核验</Link>
              </div>
            </article>
          ))}
        </div>
      </MembershipSection>

      <MembershipSection eyebrow="Purpose" title="会员申请用途">
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {purposes.map((item, index) => (
            <InfoCard icon={<MembershipIcon name={item.icon} />} index={`0${index + 1}`} key={item.title} text={item.text} title={item.title} />
          ))}
        </div>
      </MembershipSection>

      <MembershipSection eyebrow="Process" title="申请流程" tone="soft">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {process.map((item, index) => (
            <article className="min-w-0 overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/95 p-5 shadow-aureate" key={item.title}>
              <MembershipIcon name={item.icon} />
              <p className="mt-4 text-xs tracking-[0.22em] text-gold">第 {index + 1} 步</p>
              <h3 className="mt-4 text-base font-medium leading-7 text-porcelain">{item.title}</h3>
            </article>
          ))}
        </div>
      </MembershipSection>

      <MembershipSection eyebrow="Lifecycle" title="会员业务闭环" intro="用户需要知道申请前准备什么、提交后如何流转、通过后如何查询和核验。">
        <RowList rows={lifecycleRows} />
      </MembershipSection>

      <MembershipSection eyebrow="Updates" title="会员公告与资料列表" intro="协会后续将发布会员公告、材料模板、会员服务说明和常见问题；暂无内容时保持公开说明状态。" tone="soft">
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          <EmptyPanel title="暂无会员公告" text="协会将根据会员服务进展发布会员公告、服务更新和申请说明。" />
          <EmptyPanel title="暂无资料模板" text="会员材料模板、服务手册和公开说明将经审核后发布。" />
        </div>
      </MembershipSection>

      <MembershipSection eyebrow="FAQ" title="常见问题">
        <RowList rows={membershipFaq.map(([title, text]) => [title, text, "公开说明"])} />
      </MembershipSection>

      <MembershipSection eyebrow="Notice" title="会员身份与认证体系的关系" compact>
        <div className="min-w-0 overflow-hidden border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)] sm:p-7">
          会员身份属于协会会员服务与档案管理体系。申请道教文化认证建档或道士认证建档需另行提交认证申请材料，并按认证流程审核。
          <br />
          本认证为 ITCA 协会认证建档，用于文化交流、会员服务和协会内部记录场景中的参考信息，不构成政府许可、行政执业资格或法定从业资质。
        </div>
        <div className="mt-7 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="max-w-full rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" href="/member/apply">申请个人会员</Link>
          <Link className="max-w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/organization/apply">申请机构会员</Link>
          <Link className="max-w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/application/query">申请进度查询</Link>
          <Link className="max-w-full rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/member-query">会员公开核验</Link>
        </div>
      </MembershipSection>
    </>
  );
}
