import Link from "next/link";
import type { Metadata } from "next";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard, NoticeBox, Section } from "@/components/Section";
import { V2BoundaryNotice } from "@/components/v2/V2InfoPage";
import { announcements } from "@/lib/announcements";
import { developmentCenters, publicBoundaries, serviceEntries } from "@/lib/v2/content";

export const metadata: Metadata = {
  title: "国际道教与文化协会 ITCA 官网"
};

const portalEntries: Array<{ href: string; icon: IconBadgeName; text: string; title: string }> = [
  { href: "/intro", icon: "association", title: "协会介绍", text: "了解 ITCA 的宗旨、使命、组织定位、服务对象和国际交流方向。" },
  { href: "/organization", icon: "structure", title: "组织与委员会", text: "了解理事会、秘书处、认证委员会、专家顾问委员会等组织分工。" },
  { href: "/culture", icon: "value", title: "道教文化", text: "阅读道教信仰、教理教义、经典思想、宫观文化和当代文化表达。" },
  { href: "/development", icon: "cooperation", title: "发展中心", text: "查看协会在文化研究、教育传播、国际交流和项目共建方面的专业平台。" },
  { href: "/membership", icon: "membership", title: "会员体系", text: "了解个人会员、机构会员、会员服务、会籍状态和会员申请方式。" },
  { href: "/certification", icon: "certification", title: "认证体系", text: "了解道教文化认证建档申请、资料审核、证书签发和公开核验说明。" },
  { href: "/#announcements", icon: "certificate", title: "公告资讯", text: "查看协会公告、认证通知、会员服务说明和公开信息更新。" },
  { href: "/data", icon: "query", title: "资料中心", text: "查看机构、个人、平台、传承、课程、活动和基地等公开资料结构。" },
  { href: "/verification", icon: "query", title: "查询核验", text: "进入证书公开核验、会员公开核验和申请进度查询入口。" },
  { href: "/cooperation", icon: "contact", title: "联系我们", text: "联系协会秘书处，提交机构合作、文化交流、课程活动和资料更正事项。" }
];

const audience = [
  ["会员与申请人", "个人会员、机构会员、认证申请人可通过官网了解申请条件、提交资料、查询进度并核验证书状态。"],
  ["文化机构与合作伙伴", "宫观道堂、文化机构、研究单位、课程团队和国际伙伴可通过官网了解合作方向与联系路径。"],
  ["公众与研究者", "公众、学习者和研究者可通过官网了解道教文化、教理教义、公告资讯和公开资料。"]
];

const portalOperations = [
  ["协会门户", "承接关于协会、治理公开、组织架构、联系协会和资料更正入口。", "已发布"],
  ["业务闭环", "保留会员申请、机构申请、认证建档申请、申请查询、公开核验、付款和补件路径。", "已可用"],
  ["公开内容更新", "公告、发展中心动态、资料中心内容和重点推荐将按协会实际发布节奏更新。", "持续维护"],
  ["公开边界", "认证、会员、资料公开、道医中医和易学内容均展示合规边界。", "已发布"]
];

function HomeIcon({ name }: { name: IconBadgeName }) {
  return (
    <IconBadge
      name={name}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

function HomeEntryCard({ href, icon, text, title }: { href: string; icon: IconBadgeName; text: string; title: string }) {
  return (
    <InfoCard icon={<HomeIcon name={icon} />} text={text} title={title}>
      <Link className="inline-flex text-sm font-semibold text-[#8a6b3e] transition hover:text-[#7F1D1D]" href={href}>
        查看详情
      </Link>
    </InfoCard>
  );
}

function HomeRowList({ rows }: { rows: string[][] }) {
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

export default function Home() {
  return (
    <>
      <PageHero
        actions={[
          { href: "/intro", label: "了解协会" },
          { href: "/membership", label: "会员体系", variant: "secondary" },
          { href: "/verification", label: "查询核验", variant: "secondary" }
        ]}
        atmosphere="gate"
        backgroundImageSrc="/images/atca/hero-architecture.jpg"
        eyebrow="Official Portal · ITCA"
        imageSrc="/images/itca/01-home-hero.png"
        intro="国际道教与文化协会 ITCA 官网面向会员、认证申请人、文化机构、研究者和公众，提供协会介绍、道教文化、会员体系、认证体系、查询核验、发展中心、公告资讯和合作联系等信息服务。"
        subtitle="International Taoisme And Cultural Association"
        title="国际道教与文化协会"
        visualDescription="以稳健、克制、清晰的官网门户，服务道教文化传承、会员发展、认证建档与国际交流合作。"
        visualEyebrow="Official Portal"
        visualMark="ITCA"
        visualSeal="协会"
        visualTitle="文化传承与协会服务"
      />

      <section className="border-y border-[#d8d0bf] bg-[#efe4d3]">
        <div className="mx-auto grid max-w-7xl gap-px bg-[#d8d0bf] sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["个人会员申请", "/member/apply"],
            ["道教文化认证建档申请", "/certification/taoist-priest"],
            ["申请进度查询", "/application/query"],
            ["证书公开核验", "/certificate-query"]
          ].map(([label, href]) => (
            <Link className="bg-[#f7f1e6] px-5 py-5 text-center text-sm font-medium text-[#33251F] transition hover:bg-white hover:text-[#8F1F2D] lg:py-6" href={href} key={label}>
              {label}
            </Link>
          ))}
        </div>
      </section>

      <Section
        afterHero
        eyebrow="About ITCA"
        intro="ITCA 以道教文化传承、会员服务、认证建档、文化交流和国际合作为主要工作方向，官网承担公开信息发布、申请指引、查询核验与合作联系职能。"
        title="协会定位"
      >
        <div className="grid min-w-0 gap-5 md:grid-cols-3">
          {audience.map(([title, text], index) => (
            <InfoCard icon={<HomeIcon name={index === 0 ? "membership" : index === 1 ? "institution" : "international"} />} index={`0${index + 1}`} key={title} text={text} title={title} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Featured Portal" intro="优先展示协会定位、业务闭环、公告资讯、查询核验、发展中心和资料中心等常用内容，帮助访客从首页进入关键服务。" title="门户重点推荐" tone="soft">
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {portalEntries.map((item) => (
            <HomeEntryCard key={`${item.href}-${item.title}`} {...item} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Services" intro="以下入口保留已验证的申请、查询和核验流程。支付事项应从申请进度或订单上下文进入。" title="服务入口">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {serviceEntries.map((item) => (
            <Link className="rounded-xl border border-[#e4ded0] bg-white/92 px-4 py-4 text-center text-sm font-semibold text-ink shadow-[0_10px_24px_rgba(31,42,40,0.035)] transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="Portal Operations" intro="首页作为官网总入口，说明协会门户、业务闭环、内容更新和公开边界。" title="门户运营结构" tone="soft">
        <HomeRowList rows={portalOperations} />
      </Section>

      <Section eyebrow="Latest" intro="公告、专题、重要文件和发展中心动态将按协会实际发布节奏更新；具体申请或核验事项以对应业务页面为准。" title="最新公告与公开更新">
        <div className="grid min-w-0 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-dashed border-[#d8d0bf] bg-[#fbf8ef] p-6 text-sm leading-7 text-[#5f5b52]">
            <p className="font-serif text-2xl text-porcelain">暂无更多最新内容</p>
            <p className="mt-3">协会将根据实际工作进展发布公告、专题、发展中心动态、资料中心更新和重要文件。</p>
          </div>
          <div className="grid min-w-0 gap-3">
            {[
              ["公告资讯", "发布会员、认证、核验、文化交流和合作联系相关公开信息。", "持续更新"],
              ["查询核验", "公众核验只显示最小公开字段，异常情况可联系协会人工复核。", "已可用"],
              ["资料中心", "公开资料以审核允许公开的内容为准，不展示敏感材料或内部路径。", "逐步完善"]
            ].map(([title, text, status]) => (
              <article className="grid min-w-0 gap-3 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-[0_10px_24px_rgba(31,42,40,0.035)] md:grid-cols-[10rem_minmax(0,1fr)_7rem] md:items-center" key={title}>
                <h3 className="text-base font-semibold text-porcelain">{title}</h3>
                <p className="text-sm leading-7 text-[#5f5b52]">{text}</p>
                <span className="rounded-full border border-[#d8d0bf] bg-[#fbf8ef] px-3 py-1 text-center text-xs font-semibold text-[#66594d]">{status}</span>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section eyebrow="Development Centers" intro="发展中心是协会推动文化研究、教育传播、国际交流、项目共建和资料整理的专业化平台。" title="发展中心" tone="soft">
        <NoticeBox>
          发展中心以文化交流、研究合作、课程活动、项目共建和资料整理为主要方向。涉及养生、道医中医、易学认知等内容时，坚持文化研究和交流展示定位，不作医疗功效承诺或确定性预测承诺。
        </NoticeBox>
        <div className="mt-7 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {developmentCenters.map((item) => (
            <HomeEntryCard href={item.href || "/development"} icon={item.icon || "cooperation"} key={item.title} text={item.text} title={item.title} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Query And Verification" intro="查询核验入口用于公众、申请人和合作方核对申请、会员与证书的公开状态。" title="查询核验">
        <div className="grid min-w-0 gap-5 md:grid-cols-3">
          <HomeEntryCard href="/application/query" icon="query" text="申请人可凭申请编号和登记联系方式查询办理进度、审核反馈和付款说明。" title="申请进度查询" />
          <HomeEntryCard href="/certificate-query" icon="certificate" text="公众可通过证书编号与持证人姓名核验证书公开登记信息和当前状态。" title="证书公开核验" />
          <HomeEntryCard href="/member-query" icon="membership" text="公众可根据公开查询条件核验会员登记信息和会员状态。" title="会员公开核验" />
        </div>
      </Section>

      <section className="section-surface-soft" id="announcements">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-20 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch lg:py-28">
          <article className="relative overflow-hidden rounded-[1.85rem] bg-[#7F1D1D] p-8 text-white shadow-[0_22px_58px_rgba(127,29,29,0.16)] sm:p-10">
            <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full border border-white/12" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 h-36 w-48 rounded-tl-[6rem] bg-white/8" aria-hidden="true" />
            <div className="relative flex min-h-full flex-col justify-between gap-12">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#e4cf97]">Announcement</p>
                <h2 className="mt-5 font-serif text-4xl leading-tight text-[#F5E7C4] sm:text-[2.8rem]">公告资讯</h2>
              </div>
              <p className="max-w-md text-sm leading-8 text-white/82">
                协会通过官网发布认证、会员、证书公开核验、文化交流和合作联系相关信息。涉及具体申请或合作事项，以协会秘书处正式确认为准。
              </p>
            </div>
          </article>
          <article className="rounded-[1.85rem] border border-[#e4ded0] bg-white/92 p-7 shadow-[0_18px_48px_rgba(31,42,40,0.055)] sm:p-9">
            <div className="divide-y divide-[#e4ded0]">
              {announcements.map((item) => (
                <Link className="block py-5 transition hover:bg-[#fbf8ef] first:pt-0 last:pb-0 sm:px-3" href={`/announcements/${item.slug}`} key={item.slug}>
                  <h3 className="text-lg font-medium text-[#1B1B1B]">{item.title}</h3>
                  <p className="mt-2 text-xs text-[#8a6b3e]">{item.date}</p>
                  <p className="mt-3 text-sm leading-7 text-[#5f5b52]">{item.summary}</p>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      <Section eyebrow="Boundaries" title="重要说明">
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          <V2BoundaryNotice text={publicBoundaries.certification} title="认证边界" />
          <V2BoundaryNotice text={publicBoundaries.daoMedicine} title="道医中医文化边界" />
          <V2BoundaryNotice text={publicBoundaries.yijing} title="易学认知边界" />
          <V2BoundaryNotice text={publicBoundaries.data} title="资料中心公开边界" />
        </div>
      </Section>

      <section className="bg-[#2A1F1A] px-5 py-16 text-white sm:px-8 lg:py-18">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#d8bd7a]">Contact</p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-[#F5E7C4] sm:text-4xl">联系协会秘书处</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
              如需咨询会员申请、认证核验、文化交流或机构合作事项，请通过官网联系入口与协会秘书处沟通。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:justify-end">
            <Link className="rounded-xl bg-[#A97A3D] px-6 py-3.5 text-center text-sm font-semibold text-[#fffaf0] transition hover:bg-[#b88745]" href="/cooperation">联系我们</Link>
            <Link className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/14" href="/application/query">申请进度查询</Link>
          </div>
        </div>
      </section>
    </>
  );
}
