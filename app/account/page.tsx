import Link from "next/link";
import type { Metadata } from "next";
import { IconBadge, type IconBadgeName } from "@/components/IconBadge";
import { PageHero } from "@/components/PageHero";
import { InfoCard, NoticeBox, Section } from "@/components/Section";
import { accountModules, serviceEntries } from "@/lib/v2/content";

export const metadata: Metadata = {
  title: "用户中心｜国际道教与文化协会 ITCA"
};

const bindDesign = [
  {
    icon: "query" as IconBadgeName,
    title: "绑定已有申请记录",
    text: "账号服务开放后，可通过申请编号、申请人姓名、手机号或邮箱进行校验，集中查看个人会员、机构会员或认证申请。"
  },
  {
    icon: "certificate" as IconBadgeName,
    title: "绑定证书记录",
    text: "账号服务开放后，可通过证书编号与持证人姓名核验公开记录，并在用户中心查看证书公开状态和有效期。"
  },
  {
    icon: "cooperation" as IconBadgeName,
    title: "绑定支付订单",
    text: "账号服务开放后，可通过申请编号和订单号关联支付记录，方便申请人查看付款说明和财务确认状态。"
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
        intro="用户中心面向注册用户、会员、认证申请人、机构账号和合作伙伴，用于集中说明资料、会员、认证、证书、订单、通知、补充资料和申请进度等服务入口。"
        subtitle="User Center"
        title="用户中心"
        visualDescription="账号系统建设中。现阶段请继续通过申请进度查询、证书公开核验和会员公开核验入口办理相关事项。"
        visualEyebrow="Account Service"
        visualMark="Account"
        visualSeal="用户"
        visualTitle="用户中心"
      />

      <Section afterHero eyebrow="Modules" intro="用户中心将用于集中查看与本人相关的会员、认证、证书、订单和通知信息。正式开放前，申请人仍可使用官网现有查询核验入口。" title="用户中心服务">
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {accountModules.map((item) => (
            <InfoCard icon={<AccountIcon name={item.icon || "membership"} />} key={item.title} text={item.text} title={item.title}>
              <a className="inline-flex text-sm font-semibold text-[#8a6b3e]" href={item.href}>
                查看相关入口
              </a>
            </InfoCard>
          ))}
        </div>
      </Section>

      <Section eyebrow="Binding" intro="账号服务开放后，申请人可通过可核验信息将历史申请、证书和订单记录纳入用户中心查看。" title="记录绑定说明" tone="soft">
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
              前往申请进度查询
            </Link>
          </div>
        </div>
      </Section>

      <Section eyebrow="Available Services" intro="用户中心开放前，以下公开服务入口继续提供申请、查询和核验能力。" title="当前可用服务">
        <NoticeBox>
          如需查询申请进度、核验证书或核验会员信息，请使用官网公开查询入口。支付事项请从申请进度查询页面进入，按对应订单提示办理。
        </NoticeBox>
        <div className="mt-7 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {serviceEntries.map((item) => (
            <Link className="rounded-xl border border-[#e4ded0] bg-white/92 px-4 py-3 text-center text-sm font-semibold text-ink shadow-[0_10px_24px_rgba(31,42,40,0.035)] transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
