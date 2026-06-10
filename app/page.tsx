import Link from "next/link";
import type { Metadata } from "next";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard, NoticeBox, Section } from "@/components/Section";
import { V2BoundaryNotice } from "@/components/v2/V2InfoPage";
import { developmentCenters, v2Boundaries, v2BusinessLoop } from "@/lib/v2/content";

export const metadata: Metadata = {
  title: "国际道教与文化协会 ITCA 官网"
};

const portalEntries: Array<{ href: string; icon: IconBadgeName; text: string; title: string }> = [
  { href: "/intro", icon: "association", title: "介绍", text: "协会宗旨、使命、定位、服务对象和国际合作方向。" },
  { href: "/rules", icon: "structure", title: "规章制度", text: "协会章程、会员管理、认证建档、隐私和核验规则。" },
  { href: "/faith", icon: "value", title: "道教信仰", text: "道法自然、济世利人、宫观文化、修行生活和当代价值。" },
  { href: "/doctrine", icon: "certificate", title: "教理教义", text: "经典导读、伦理修身、生命修炼、术语解释和学习路径。" },
  { href: "/exchange", icon: "international", title: "文化交流", text: "国际交流、文化研究、课程研修、机构合作和活动记录。" },
  { href: "/development", icon: "cooperation", title: "发展中心", text: "六大发展中心、专委会、项目合作、课程活动和研究方向。" },
  { href: "/cooperation", icon: "institution", title: "发展合作", text: "机构、课程、活动、产业、品牌和数据中心入驻合作入口。" },
  { href: "/data", icon: "query", title: "数据中心", text: "机构库、个人库、平台库、传承库、课程库、活动库和基地库。" }
];

const userAndAdmin = [
  { href: "/account", icon: "individual" as IconBadgeName, title: "用户中心", text: "承接我的资料、我的会员、我的认证、我的证书、订单、通知、补充资料和申请进度。" },
  { href: "/account/login", icon: "membership" as IconBadgeName, title: "登录 / 注册入口", text: "提供 V2.0 用户系统入口；正式账号能力以后续 SQL 草案和人工数据库变更为准。" },
  { href: "/admin/roles", icon: "structure" as IconBadgeName, title: "后台 RBAC", text: "新增角色、权限、用户管理、内容管理、发展中心和数据中心管理规划入口。" }
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
        进入栏目
      </Link>
    </InfoCard>
  );
}

export default function Home() {
  return (
    <>
      <PageHero
        actions={[
          { href: "/membership", label: "会员认证" },
          { href: "/certificate-query", label: "证书查验", variant: "secondary" },
          { href: "/development", label: "发展中心", variant: "secondary" },
          { href: "/account", label: "登录 / 用户中心", variant: "secondary" }
        ]}
        atmosphere="gate"
        backgroundImageSrc="/images/atca/hero-architecture.jpg"
        eyebrow="Official Portal · ITCA V2.0"
        imageSrc="/images/itca/01-home-hero.png"
        intro="ITCA 官网 V2.0 在 V1.3 申请、审核、支付、证书、核验、通知和后台基础资料管理闭环之上，升级为覆盖导航栏目、发展中心、会员认证、数据中心、用户系统和后台 RBAC 的协会门户。"
        subtitle="International Taoisme And Cultural Association"
        title="国际道教与文化协会"
        visualDescription="延续 V1.3 稳健浅色视觉，不照搬 HTML 原型深色样式；以导航升级版信息架构承接长期门户建设。"
        visualEyebrow="V2 Portal"
        visualMark="ITCA"
        visualSeal="V2.0"
        visualTitle="协会门户升级"
      />

      <section className="border-y border-[#d8d0bf] bg-[#efe4d3]">
        <div className="mx-auto grid max-w-7xl gap-px bg-[#d8d0bf] sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["会员认证", "/membership"],
            ["证书查验", "/certificate-query"],
            ["发展合作", "/cooperation"],
            ["数据中心", "/data"]
          ].map(([label, href]) => (
            <Link className="bg-[#f7f1e6] px-5 py-5 text-center text-sm font-medium text-[#33251F] transition hover:bg-white hover:text-[#8F1F2D] lg:py-6" href={href} key={label}>
              {label}
            </Link>
          ))}
        </div>
      </section>

      <Section
        afterHero
        eyebrow="Information Architecture"
        intro="V2.0 顶部导航按导航升级版固化，覆盖介绍、制度、信仰、教义、交流、发展中心、会员认证、证书查验、合作和数据中心。"
        title="V2.0 门户结构"
      >
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {portalEntries.map((item) => (
            <HomeEntryCard key={item.href} {...item} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Development Centers" intro="发展中心作为 V2.0 的重点频道，承接专委会、课程、项目、合作机构和公开资料沉淀。" title="六大发展中心" tone="soft">
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {developmentCenters.map((item) => (
            <HomeEntryCard href={item.href || "/development"} icon={item.icon || "cooperation"} key={item.title} text={item.text} title={item.title} />
          ))}
        </div>
      </Section>

      <Section eyebrow="V1.3 Compatibility" intro="V2.0 页面扩展不得破坏 V1.3 已有业务闭环；以下入口继续保留并可直接访问。" title="V1.3 业务闭环保留">
        <NoticeBox>
          申请、审核、支付、证书、核验、通知和后台基础资料管理仍沿用现有业务链路。本次升级只增加门户结构、用户入口和 RBAC 管理规划，不改变现有 API 合约和数据库执行状态。
        </NoticeBox>
        <div className="mt-7 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {v2BusinessLoop.map((item) => (
            <Link className="rounded-xl border border-[#e4ded0] bg-white/92 px-4 py-3 text-center text-sm font-semibold text-ink shadow-[0_10px_24px_rgba(31,42,40,0.035)] transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="User And RBAC" intro="用户系统和后台 RBAC 是 V2.0 后续业务承载的基础，本轮先落成页面入口、功能地图和 SQL 草案，不执行 SQL。" title="用户系统与后台权限体系" tone="soft">
        <div className="grid min-w-0 gap-5 md:grid-cols-3">
          {userAndAdmin.map((item) => (
            <HomeEntryCard key={item.href} {...item} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Boundaries" title="内容边界说明">
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
          <V2BoundaryNotice text={v2Boundaries.certification} title="认证边界" />
          <V2BoundaryNotice text={v2Boundaries.daoMedicine} title="道医中医边界" />
          <V2BoundaryNotice text={v2Boundaries.yijing} title="易学与东方认知边界" />
          <V2BoundaryNotice text={v2Boundaries.data} title="数据中心边界" />
        </div>
      </Section>

      <section className="bg-[#2A1F1A] px-5 py-16 text-white sm:px-8 lg:py-18">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#d8bd7a]">Next Step</p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-[#F5E7C4] sm:text-4xl">申请、查询与合作服务</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
              继续使用 V1.3 稳定业务入口提交申请、查询进度、核验证书或联系协会秘书处。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:justify-end">
            <Link className="rounded-xl bg-[#A97A3D] px-6 py-3.5 text-center text-sm font-semibold text-[#fffaf0] transition hover:bg-[#b88745]" href="/certification/taoist-priest">申请认证</Link>
            <Link className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/14" href="/certificate-query">证书查验</Link>
            <Link className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white/14" href="/cooperation">发展合作</Link>
          </div>
        </div>
      </section>
    </>
  );
}
