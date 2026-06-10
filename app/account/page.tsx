import Link from "next/link";
import type { Metadata } from "next";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard, NoticeBox, Section } from "@/components/Section";
import { accountModules, v2BusinessLoop } from "@/lib/v2/content";

export const metadata: Metadata = {
  title: "用户中心｜国际道教与文化协会 ITCA"
};

const bindDesign = [
  {
    icon: "query" as IconBadgeName,
    title: "绑定已有申请记录",
    text: "通过申请编号、申请人姓名、手机号或邮箱进行校验，绑定既有个人会员、机构会员或认证申请。"
  },
  {
    icon: "certificate" as IconBadgeName,
    title: "绑定证书记录",
    text: "通过证书编号与持证人姓名核验公开记录，绑定后在我的证书中展示公开状态和有效期。"
  },
  {
    icon: "cooperation" as IconBadgeName,
    title: "绑定支付订单",
    text: "通过申请编号和订单号关联支付记录，保留 V1.3 支付状态和收据管理闭环。"
  }
];

function AccountIcon({ name }: { name: IconBadgeName }) {
  return (
    <IconBadge
      name={name}
      size="lg"
      className="border-gold/45 bg-[#fffaf0] text-[#7F1D1D] shadow-[0_16px_34px_rgba(176,138,69,0.13)] [&_svg]:h-8 [&_svg]:w-8 [&_svg]:[stroke-width:1.75]"
    />
  );
}

export default function AccountPage() {
  return (
    <>
      <PageHero
        actions={[
          { href: "/account/login", label: "登录 / 注册" },
          { href: "/application/query", label: "申请进度查询", variant: "secondary" },
          { href: "/certificate-query", label: "证书查验", variant: "secondary" }
        ]}
        atmosphere="credential"
        eyebrow="Account"
        imageSrc="/images/itca/04-service-membership.png"
        intro="用户中心是 V2.0 面向注册用户、会员、认证申请人、机构账号和合作伙伴的统一入口，用于承接资料、会员、认证、证书、订单、通知、补充资料和申请进度。"
        subtitle="User Center"
        title="用户中心"
        visualDescription="用户系统会兼容 V1.3 既有申请查询、支付、证书和通知流程；数据库结构以 SQL 草案和人工执行为准。"
        visualEyebrow="V2 User System"
        visualMark="Account"
        visualSeal="用户"
        visualTitle="用户系统基础能力"
      />

      <Section afterHero eyebrow="Modules" intro="本轮落成用户中心页面结构和功能入口，后续接入账号数据库、申请绑定和站内通知时不破坏 V1.3 流程。" title="用户中心模块">
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {accountModules.map((item) => (
            <InfoCard icon={<AccountIcon name={item.icon || "membership"} />} key={item.title} text={item.text} title={item.title}>
              <a className="inline-flex text-sm font-semibold text-[#8a6b3e]" href={item.href}>
                查看模块
              </a>
            </InfoCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Binding" intro="账号体系启用后，通过可核验字段把历史申请、证书、订单和通知记录绑定到用户中心。" title="绑定已有申请记录设计" tone="soft">
        <div className="grid min-w-0 gap-5 md:grid-cols-3">
          {bindDesign.map((item) => (
            <InfoCard icon={<AccountIcon name={item.icon} />} key={item.title} text={item.text} title={item.title} />
          ))}
        </div>
        <div className="mt-7 grid min-w-0 gap-4 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate md:grid-cols-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-porcelain">申请编号</span>
            <input className="form-input" placeholder="提交后获得的申请编号" readOnly />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-porcelain">手机号 / 邮箱</span>
            <input className="form-input" placeholder="用于匹配历史申请" readOnly />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-porcelain">证书编号</span>
            <input className="form-input" placeholder="可选" readOnly />
          </label>
          <div className="flex items-end">
            <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href="/application/query">
              先使用 V1.3 查询
            </Link>
          </div>
        </div>
      </Section>

      <Section eyebrow="Compatibility" intro="用户中心不替代 V1.3 的公开业务入口，历史申请和公开核验继续可用。" title="V1.3 兼容入口">
        <NoticeBox>
          账号系统接入前，申请人仍通过申请编号、联系方式、证书编号和姓名使用 V1.3 查询与核验能力。后续账号绑定只做关联展示，不改变原业务记录状态。
        </NoticeBox>
        <div className="mt-7 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {v2BusinessLoop.map((item) => (
            <Link className="rounded-xl border border-[#e4ded0] bg-white/92 px-4 py-3 text-center text-sm font-semibold text-ink shadow-[0_10px_24px_rgba(31,42,40,0.035)] transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}

