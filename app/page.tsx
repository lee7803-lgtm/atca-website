import Link from "next/link";
import type { Metadata } from "next";
import { CulturePattern } from "@/components/CulturePattern";
import { CulturalImage } from "@/components/CulturalImage";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { InkLandscape } from "@/components/InkLandscape";

export const metadata: Metadata = {
  title: "国际道教与文化协会 ITCA 官网"
};

const quickEntries = [
  ["认证体系", "/certification"],
  ["会员申请", "/membership"],
  ["证书查询", "/certificate-query"],
  ["联系合作", "/contact"]
];

const services: Array<{ title: string; text: string; href: string; icon: IconBadgeName; visual: "certification" | "membership" | "verification"; visualTitle: string; imageSrc: string; imagePosition: string }> = [
  { title: "认证服务", text: "用于登记申请人的道教身份、师承传承、修道经历及相关证明材料，并按协会流程进行审核与备案。", href: "/certification/taoist-priest", icon: "certification", visual: "certification", visualTitle: "认证资料与备案", imageSrc: "/images/itca/03-service-certification.png", imagePosition: "center 52%" },
  { title: "会员申请", text: "面向个人与机构开放会员申请，用于建立会员档案、参与文化交流及后续合作沟通。", href: "/membership", icon: "membership", visual: "membership", visualTitle: "会员组织服务", imageSrc: "/images/itca/04-service-membership.png", imagePosition: "center 46%" },
  { title: "证书核验", text: "用于通过证书编号与持证人姓名核验证书状态，并保留人工复核说明。", href: "/certificate-query", icon: "query", visual: "verification", visualTitle: "证书查询核验", imageSrc: "/images/itca/05-service-verification.png", imagePosition: "center 58%" }
];

const certificationFeatures = [
  ["可查询", "通过证书编号与姓名核验证书状态，保留人工复核通道。"],
  ["可建档", "围绕身份资料、师承关系、学习经历与实践资料形成协会认证档案。"],
  ["可追溯", "申请、审核、建档、签发与核验流程保持记录链路。"],
  ["边界清晰", "协会认证不等同于政府许可、法定职业资格、商业授权或宗教职务任命。"]
];

const organizationUnits = [
  ["01", "理事会", "组织治理", "统筹协会发展方向、重大事项审议与协会公共事务。"],
  ["02", "秘书处", "执行协调", "负责日常协调、资料受理、信息记录与对外联系。"],
  ["03", "认证委员会", "标准审核", "负责道士资格认证材料审核、评审与备案建议。"],
  ["04", "专家顾问委员会", "学术支持", "提供文化研究、学术交流与专业咨询支持。"],
  ["05", "会员服务部门", "会员联结", "服务个人会员与机构会员申请、沟通与协作。"],
  ["06", "合作发展部门", "合作拓展", "推动机构合作、国际项目、学术交流与资源共建。"]
];

const announcements = [
  ["ITCA 官网信息服务已开放", "本网站用于发布协会介绍、认证须知、会员申请、证书核验与联系合作等信息。"],
  ["道士资格认证为当前认证重点", "协会当前以道士资格认证为主要认证方向，相关申请、审核与备案事项将按协会流程逐步完善。"],
  ["会员申请事项", "个人会员与机构会员可通过官网了解申请要求、资料准备与后续联系方式。"],
  ["证书核验事项", "证书核验可通过官网证书查询页面提交证书编号与持证人姓名进行核验；查询不到或资料需复核时，可联系协会秘书处协助确认。"]
];

const cooperation = [
  ["国际交流", "面向不同国家和地区推动道教文化交流互鉴。", "international"],
  ["文化研究", "围绕经典、仪轨、历史与当代传播开展研究协作。", "value"],
  ["课程研修", "支持文化课程、研修活动与资料整理合作。", "membership"],
  ["机构合作", "对接文化机构、社团组织、研究单位与合作伙伴。", "institution"]
] as const;

const associationHighlights = [
  ["协会宗旨", "弘扬道教清净自然、济世利人的文化精神，推动道教文化与传统文化在国际语境中的交流与传承。"],
  ["协会使命", "服务会员、认证与文化交流工作，推动相关记录规范留存、办理流程清晰可循。"],
  ["协会定位", "面向道教文化交流、会员服务、资格认证与机构合作，服务相关个人、机构及文化交流事项。"],
  ["国际合作", "面向不同国家和地区，推动宫观道堂、文化机构、传统文化组织之间的交流与合作。"]
];

function PortalTitle({ eyebrow, title, intro, light = false }: { eyebrow?: string; title: string; intro?: string; light?: boolean }) {
  return (
    <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className={`text-xs uppercase tracking-[0.28em] ${light ? "text-[#d8bd7a]" : "text-gold"}`}>{eyebrow}</p> : null}
        <h2 className={`mt-3 font-serif text-3xl leading-tight sm:text-4xl lg:text-[2.8rem] ${light ? "text-white" : "text-porcelain"}`}>{title}</h2>
      </div>
      {intro ? <p className={`max-w-2xl text-sm leading-8 ${light ? "text-white/72" : "text-[#666666]"}`}>{intro}</p> : null}
    </div>
  );
}

function PortalCard({ title, text, href, icon, visual, visualTitle, imageSrc, imagePosition }: { title: string; text: string; href: string; icon: IconBadgeName; visual: "certification" | "membership" | "verification"; visualTitle: string; imageSrc: string; imagePosition: string }) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[#e4ded0] bg-white/90 shadow-[0_18px_48px_rgba(31,42,40,0.055)]">
      <CulturalImage
        eyebrow="ITCA Service"
        title={visualTitle}
        imageSrc={imageSrc}
        imagePosition={imagePosition}
        overlaySeal={visual === "certification" ? "认证" : visual === "membership" ? "会员" : "核验"}
        tone={visual}
        variant="service"
        className="min-h-[17rem] rounded-none border-0 shadow-none"
      />
      <div className="p-7">
        <IconBadge name={icon} />
        <h3 className="mt-6 text-xl font-medium text-porcelain">{title}</h3>
        <p className="mt-4 text-sm leading-7 text-[#666666]">{text}</p>
        <Link className="mt-6 inline-flex text-sm font-medium text-[#8a6b3e] transition hover:text-ink" href={href}>
          查看详情 →
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#2A1F1A]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(169,122,61,0.16),transparent_20rem),linear-gradient(135deg,#7F1D1D_0%,#33251F_44%,#2A1F1A_100%)]" />
        <CulturePattern variant="hero" className="opacity-60" />
        <InkLandscape className="opacity-80" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-18 sm:px-8 lg:grid-cols-[1fr_0.72fr] lg:items-center lg:py-28">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs tracking-[0.26em] text-[#e4cf97]">
              ITCA · International Taoisme And Cultural Association
            </p>
            <h1 className="mt-8 font-serif text-5xl leading-tight text-white sm:text-6xl lg:text-7xl">
              国际道教与文化协会
            </h1>
            <p className="mt-7 text-lg leading-9 text-white/80">
              ITCA 官方网站用于发布协会信息、认证体系、会员申请、证书查询与联系合作说明，服务道教文化传承与国际交流。
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link className="rounded-xl bg-[#A97A3D] px-6 py-3.5 text-center text-sm font-semibold text-[#fffaf0] transition hover:bg-[#b88745]" href="/certification">认证体系</Link>
              <Link className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/14" href="/certificate-query">证书查询</Link>
              <Link className="rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/14" href="/membership">会员申请</Link>
            </div>
          </div>
          <div className="lg:pt-4">
            <CulturalImage
              eyebrow="Official Portal"
              title="文化传承与协会服务"
              caption="以协会信息、认证备案、会员服务与国际交流为官网核心入口。"
              imageSrc="/images/itca/01-home-hero.png"
              imagePosition="center 48%"
              overlaySeal="山门"
              tone="architecture"
              variant="portal"
              className="min-h-[28rem] border-[#79644E] bg-[#f8f1e4] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-[#d8d0bf] bg-[#efe4d3]">
        <div className="mx-auto grid max-w-7xl gap-px bg-[#d8d0bf] sm:grid-cols-2 lg:grid-cols-4">
          {quickEntries.map(([label, href]) => (
            <Link className="bg-[#f7f1e6] px-5 py-5 text-center text-sm font-medium text-[#33251F] transition hover:bg-white hover:text-[#8F1F2D] lg:py-6" href={href} key={label}>
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-18 sm:px-8 lg:py-28">
        <PortalTitle eyebrow="Institutional Role" title="协会定位" intro="ITCA 是面向道教文化传承、认证建档、会员组织与国际交流合作的协会平台，以清晰的信息入口承接申请、查询与合作沟通。" />
        <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#e4ded0] bg-white p-7 shadow-[0_18px_48px_rgba(31,42,40,0.055)]">
            <InkLandscape className="opacity-80" />
            <div className="relative grid gap-5 sm:grid-cols-2">
              {associationHighlights.map(([title, text]) => (
                <div className="rounded-[1.25rem] border border-[#e4ded0] bg-[#fbf8ef]/90 p-5" key={title}>
                  <h3 className="text-lg font-medium text-porcelain">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#666666]">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6">
            <CulturalImage
              eyebrow="Culture Inheritance"
              title="道教文化传承"
              caption="通过资料整理、文化展示、学术交流和机构合作，推动道教文化在国际语境中的规范表达与持续发展。"
              imageSrc="/images/itca/02-home-association.png"
              imagePosition="center 52%"
              overlaySeal="融合"
              tone="space"
              variant="standard"
              className="min-h-[25rem]"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#efe7d8] px-5 py-18 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <PortalTitle eyebrow="Official Entries" title="核心服务" intro="官网当前提供认证服务、会员申请与证书核验三类核心入口，并公开说明申请边界与查询方式。" />
          <div className="grid gap-7 lg:grid-cols-3">
            {services.map((item) => <PortalCard key={item.title} {...item} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-18 sm:px-8 lg:py-28">
        <PortalTitle eyebrow="Certification System" title="认证体系" intro="当前认证系统仅开放道士资格认证，用于登记申请人的道教身份、师承传承、学习经历与相关证明材料，并纳入协会认证与资料建档流程。" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {certificationFeatures.map(([title, text], index) => (
            <article className="rounded-[1.35rem] border border-[#e4ded0] bg-white/90 p-6 shadow-[0_14px_34px_rgba(31,42,40,0.045)]" key={title}>
              <p className="text-xs tracking-[0.22em] text-gold">0{index + 1}</p>
              <h3 className="mt-4 text-lg font-medium text-[#1B1B1B]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#2A2A2A]">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-9 border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_14px_34px_rgba(176,138,69,0.07)]">
          ITCA 道士资格认证属于协会认证与资料建档服务，不等同于政府许可、行政许可、法定职业资格、商业授权、宗教职务任命或任何法定执业许可。
        </div>
      </section>

      <section className="bg-[#efe7d8] px-5 py-18 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <PortalTitle eyebrow="ORGANIZATION" title="协会组织与职能" intro="协会依据章程和实际工作需要，设立相应组织分工，负责会员服务、认证审核、文化交流与合作沟通等事务。" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organizationUnits.map(([index, title, tag, text]) => (
              <article className="overflow-hidden rounded-[1.65rem] border border-[#e3dac8] bg-white shadow-[0_18px_48px_rgba(31,42,40,0.055)]" key={title}>
                <div className="relative min-h-[10.5rem] overflow-hidden bg-[#efe2c9]">
                  <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border border-[#caa96a]/45" aria-hidden="true" />
                  <div className="absolute bottom-6 left-6 h-20 w-20 rotate-45 border border-[#b88a48]/45 bg-[#fff7e3]/45" aria-hidden="true" />
                  <div className="absolute bottom-0 right-0 h-24 w-40 rounded-tl-[5rem] bg-[#d9bf82]/32" aria-hidden="true" />
                  <p className="absolute left-7 top-7 font-serif text-5xl leading-none text-[#A97A3D]/35">{index}</p>
                  <span className="absolute right-7 top-7 inline-flex rounded-full border border-[#A97A3D]/30 bg-white/55 px-3 py-1 text-xs font-medium text-[#7b5a2e]">
                    {tag}
                  </span>
                </div>
                <div className="min-h-[10rem] p-7">
                  <h3 className="text-xl font-medium text-[#1B1B1B]">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#5f5b52]">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-18 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <article className="relative overflow-hidden rounded-[1.85rem] bg-[#7F1D1D] p-8 text-white shadow-[0_22px_58px_rgba(127,29,29,0.16)] sm:p-10">
            <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full border border-white/12" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 h-36 w-48 rounded-tl-[6rem] bg-white/8" aria-hidden="true" />
            <div className="relative flex min-h-full flex-col justify-between gap-12">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#e4cf97]">ANNOUNCEMENT</p>
                <h2 className="mt-5 font-serif text-4xl leading-tight text-[#F5E7C4] sm:text-[2.8rem]">协会公告</h2>
              </div>
              <p className="max-w-md text-sm leading-8 text-white/82">
                协会通过官网发布认证、会员、证书核验与合作联系相关信息。涉及具体申请、核验或合作事项，以协会秘书处正式确认为准。
              </p>
            </div>
          </article>
          <article className="rounded-[1.85rem] border border-[#e4ded0] bg-white/92 p-7 shadow-[0_18px_48px_rgba(31,42,40,0.055)] sm:p-9">
            <div className="divide-y divide-[#e4ded0]">
              {announcements.map(([title, text]) => (
                <div className="py-5 first:pt-0 last:pb-0" key={title}>
                  <h3 className="text-lg font-medium text-[#1B1B1B]">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#5f5b52]">{text}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="bg-[#efe7d8] px-5 py-18 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <PortalTitle eyebrow="International Cooperation" title="国际合作与学术交流" intro="面向文化机构、社团组织、研究单位和国际项目伙伴，围绕文化研究、课程研修、资料整理与交流活动开展稳健合作。" />
          <CulturalImage
            eyebrow="Cultural Exchange"
            title="国际文化交流与合作"
            caption="以稳健、克制的协会视觉承接合作沟通场景，保持文化厚度与公共机构感。"
            imageSrc="/images/itca/06-home-international-cooperation.png"
            imagePosition="center 48%"
            overlaySeal="合作交流"
            tone="space"
            variant="wide"
            className="mb-7 min-h-[21rem]"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cooperation.map(([title, text, icon]) => (
              <article className="rounded-[1.35rem] border border-[#e4ded0] bg-white/88 p-6 shadow-[0_14px_34px_rgba(31,42,40,0.045)]" key={title}>
                <IconBadge name={icon} />
                <h3 className="mt-6 text-lg font-medium text-porcelain">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#666666]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#2A1F1A] px-5 py-14 text-white sm:px-8 lg:py-18">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#d8bd7a]">Next Step</p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-[#F5E7C4] sm:text-4xl">申请与查询服务</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
              申请道士资格认证、核验证书记录，或与协会秘书处沟通国际合作与学术交流事项。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:justify-end">
            <Link className="rounded-xl bg-[#A97A3D] px-6 py-3.5 text-center text-sm font-semibold text-[#fffaf0] transition hover:bg-[#b88745]" href="/certification/taoist-priest">申请认证</Link>
            <Link className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/14" href="/certificate-query">查询证书</Link>
            <Link className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/14" href="/contact">联系合作</Link>
          </div>
        </div>
      </section>
    </>
  );
}
