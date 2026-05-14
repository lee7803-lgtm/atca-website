import Link from "next/link";
import { CulturePattern } from "@/components/CulturePattern";
import { CulturalImage } from "@/components/CulturalImage";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { InkLandscape } from "@/components/InkLandscape";

const quickEntries = [
  ["关于协会", "/association"],
  ["道士资格认证", "/certification/taoist-priest"],
  ["个人会员申请", "/member/apply"],
  ["机构会员申请", "/organization/apply"],
  ["申请进度", "/application/query"],
  ["证书查询", "/certificate-query"],
  ["联系合作", "/contact"]
];

const services: Array<{ title: string; text: string; href: string; icon: IconBadgeName; visual: "certification" | "membership" | "verification"; visualTitle: string; imageSrc: string; imagePosition: string }> = [
  { title: "道士资格认证", text: "用于登记申请人的道教身份、师承传承、修道经历及相关证明材料，并按协会流程进行审核与备案。", href: "/certification/taoist-priest", icon: "certification", visual: "certification", visualTitle: "认证资料与备案", imageSrc: "/images/atca/certification-detail.jpg", imagePosition: "center 52%" },
  { title: "会员申请", text: "面向个人与机构开放会员申请，用于建立会员档案、参与文化交流及后续合作沟通。", href: "/membership", icon: "membership", visual: "membership", visualTitle: "会员组织服务", imageSrc: "/images/atca/member-gathering.jpg", imagePosition: "center 46%" },
  { title: "证书核验", text: "用于通过证书编号与持证人姓名核验证书状态，并保留人工复核说明。", href: "/certificate-query", icon: "query", visual: "verification", visualTitle: "证书查询核验", imageSrc: "/images/atca/certificate-verification.jpg", imagePosition: "center 58%" }
];

const showcases = [
  ["理事会", "统筹协会发展方向、重大事项审议与协会公共事务。", "组织治理", "governance"],
  ["秘书处", "负责日常协调、资料受理、信息记录与对外联系。", "执行协调", "secretariat"],
  ["认证委员会", "负责道士资格认证材料审核、评审与备案建议。", "标准审核", "cert-review"],
  ["专家顾问委员会", "提供文化研究、学术交流与专业咨询支持。", "学术支持", "research"],
  ["会员服务部门", "服务个人会员与机构会员申请、沟通与协作。", "会员联结", "member-service"],
  ["合作发展部门", "推动机构合作、国际项目、学术交流与资源共建。", "合作拓展", "cooperation"]
];

const notices = [
  ["ITCA 官网信息服务已开放", "本网站用于发布协会介绍、认证须知、会员申请、证书核验与联系合作等信息。"],
  ["道士资格认证为当前认证重点", "协会当前以道士资格认证为主要认证方向，相关申请、审核与备案事项将按协会流程逐步完善。"],
  ["会员申请事项", "个人会员与机构会员可通过官网了解申请要求、资料准备与后续联系方式。"],
  ["证书核验事项", "证书核验可通过官网证书查询页面提交证书编号与持证人姓名进行核验；查询不到或资料需复核时，可联系协会秘书处协助确认。"]
];

const cooperation = [
  ["认证咨询", "围绕道士资格认证要求、材料与流程开展咨询", "certification"],
  ["会员申请", "服务个人会员与机构会员申请须知和资料沟通", "membership"],
  ["机构合作", "面向文化机构、社团组织与合作单位开展对接", "institution"],
  ["学术交流", "举办论坛、研讨会与学术研究合作", "international"],
  ["国际项目", "促进国际道教文化交流互鉴", "international"],
  ["媒体合作", "内容共创、品牌传播与媒体平台合作", "contact"]
] as const;

const associationHighlights = [
  ["协会宗旨", "弘扬道教清净自然、济世利人的文化精神，推动道教文化与传统文化在区域内的交流与传承。"],
  ["协会使命", "服务会员、认证与文化交流工作，推动相关记录规范留存、办理流程清晰可循。"],
  ["协会定位", "面向道教文化交流、会员服务、资格认证与机构合作，服务相关个人、机构及文化交流事项。"],
  ["国际合作", "面向不同国家和地区，推动宫观道堂、文化机构、传统文化组织之间的交流与合作。"]
];

function PortalTitle({ eyebrow, title, intro, light = false }: { eyebrow?: string; title: string; intro?: string; light?: boolean }) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className={`text-xs uppercase tracking-[0.28em] ${light ? "text-[#d8bd7a]" : "text-gold"}`}>{eyebrow}</p> : null}
        <h2 className={`mt-3 font-serif text-3xl leading-tight sm:text-4xl ${light ? "text-white" : "text-porcelain"}`}>{title}</h2>
      </div>
      {intro ? <p className={`max-w-xl text-sm leading-7 ${light ? "text-white/72" : "text-[#666666]"}`}>{intro}</p> : null}
    </div>
  );
}

function PortalCard({ title, text, href, icon, visual, visualTitle, imageSrc, imagePosition }: { title: string; text: string; href: string; icon: IconBadgeName; visual: "certification" | "membership" | "verification"; visualTitle: string; imageSrc: string; imagePosition: string }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e4ded0] bg-white/88 shadow-[0_14px_38px_rgba(31,42,40,0.06)]">
      <CulturalImage
        eyebrow="ITCA Service"
        title={visualTitle}
        imageSrc={imageSrc}
        imagePosition={imagePosition}
        overlaySeal={visual === "certification" ? "认证" : visual === "membership" ? "会员" : "核验"}
        tone={visual}
        variant="service"
        className="min-h-[15rem] rounded-none border-0 shadow-none"
      />
      <div className="p-6">
        <IconBadge name={icon} />
        <h3 className="mt-6 text-lg font-medium text-porcelain">{title}</h3>
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
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_0.72fr] lg:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs tracking-[0.26em] text-[#e4cf97]">
              ITCA · International Taoisme And Cultural Association
            </p>
            <p className="mt-4 text-sm text-[#e4cf97]/80">
              Persatuan Kebudayaan Dan Taoism Antarabangsa
            </p>
            <h1 className="mt-8 font-serif text-5xl leading-tight text-white sm:text-6xl lg:text-7xl">
              国际道教与文化协会
            </h1>
            <p className="mt-7 text-lg leading-9 text-white/80">
              ITCA 官方网站用于发布协会信息、认证体系、会员申请、证书查询与联系合作说明，服务道教文化传承与国际交流。
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link className="rounded-2xl bg-[#A97A3D] px-6 py-3.5 text-center text-sm font-semibold text-[#fffaf0]" href="/association">了解协会</Link>
              <Link className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white" href="/certification">认证体系</Link>
              <Link className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white" href="/membership">会员申请</Link>
              <Link className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white" href="/contact">联系合作</Link>
            </div>
          </div>
          <div className="lg:pt-4">
            <CulturalImage
              eyebrow="Official Portal"
              title="文化传承与协会服务"
              caption="以协会信息、认证备案、会员服务与国际交流为官网核心入口。"
              imageSrc="/images/atca/hero-architecture.jpg"
              imagePosition="center 48%"
              overlaySeal="山门"
              tone="architecture"
              variant="portal"
              className="min-h-[28rem] border-white/18 bg-[#f8f1e4] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-[#d8d0bf] bg-[#efe4d3]">
        <div className="mx-auto grid max-w-7xl gap-px bg-[#d8d0bf] sm:grid-cols-2 lg:grid-cols-7">
          {quickEntries.map(([label, href]) => (
            <Link className="bg-[#f7f1e6] px-5 py-5 text-center text-sm font-medium text-[#33251F] transition hover:bg-white hover:text-[#8F1F2D]" href={href} key={label}>
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <PortalTitle eyebrow="Association Platform" title="ITCA 协会平台" intro="协会面向国际开展道教文化传承、会员服务、资格认证与交流合作。" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#e4ded0] bg-white p-8 shadow-[0_18px_55px_rgba(31,42,40,0.06)]">
            <InkLandscape className="opacity-80" />
            <div className="relative grid gap-5 sm:grid-cols-2">
              {associationHighlights.map(([title, text]) => (
                <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef]/90 p-5" key={title}>
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
              imageSrc="/images/atca/about-cultural-space.jpg"
              imagePosition="center 52%"
              overlaySeal="融合"
              tone="space"
              variant="standard"
              className="min-h-[24rem]"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f2eadc] px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <PortalTitle eyebrow="Core Services" title="核心服务" intro="协会当前重点提供道士资格认证、会员申请与证书核验相关服务，并通过官网公开办理须知与联系渠道。" />
          <div className="grid gap-6 lg:grid-cols-3">
            {services.map((item) => <PortalCard key={item.title} {...item} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <PortalTitle eyebrow="Organization" title="协会组织与职能" intro="协会依据章程和实际工作需要，设立相应组织分工，负责会员服务、认证审核、文化交流与合作沟通等事务。" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {showcases.map(([title, text, label, visual], index) => (
            <article className="overflow-hidden rounded-[1.75rem] border border-[#e4ded0] bg-white shadow-[0_18px_55px_rgba(31,42,40,0.06)]" key={title}>
              <div className={`org-visual org-visual--${visual} h-36 p-5`}>
                <span className="relative z-10 font-serif text-3xl text-[#8F1F2D]/72">0{index + 1}</span>
                <span className="relative z-10 ml-4 inline-flex border border-[#A97A3D]/30 bg-[#fffaf0]/62 px-3 py-1 text-xs tracking-[0.18em] text-[#7b5a2e]">
                  {label}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium text-porcelain">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#666666]">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f7f1e6] px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] bg-[#8b3f31] p-8 text-white shadow-[0_18px_55px_rgba(139,63,49,0.14)]">
            <p className="text-xs uppercase tracking-[0.28em] text-[#f2d79a]">Announcement</p>
            <h2 className="mt-5 font-serif text-3xl">协会公告</h2>
            <p className="mt-5 text-sm leading-8 text-white/78">
              协会通过官网发布认证、会员、证书核验与合作联系相关信息。涉及具体申请、核验或合作事项，以协会秘书处正式确认为准。
            </p>
          </article>
          <div className="rounded-[2rem] border border-[#e4ded0] bg-white p-6 shadow-[0_18px_55px_rgba(31,42,40,0.06)]">
            {notices.map(([title, text]) => (
              <div className="border-b border-[#eee7da] py-4 last:border-b-0" key={title}>
                <p className="text-sm font-medium text-porcelain">{title}</p>
                <p className="mt-2 text-sm leading-7 text-[#666666]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <PortalTitle eyebrow="Cooperation" title="联系合作" intro="面向文化机构、社团组织、研究单位和国际项目伙伴，开展稳健合作。" />
        <CulturalImage
          eyebrow="Cultural Exchange"
          title="国际文化交流与合作"
          caption="以稳健、克制的协会视觉承接合作沟通场景，保持文化厚度与公共机构感。"
          imageSrc="/images/atca/cooperation-cultural-exchange.jpg"
          imagePosition="center 48%"
          overlaySeal="合作交流"
          tone="space"
          variant="wide"
          className="mb-6 min-h-[18rem]"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cooperation.map(([title, text, icon]) => (
            <article className="rounded-[1.75rem] border border-[#e4ded0] bg-white/88 p-6 shadow-[0_14px_38px_rgba(31,42,40,0.06)]" key={title}>
              <IconBadge name={icon} />
              <h3 className="mt-6 text-lg font-medium text-porcelain">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#666666]">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
