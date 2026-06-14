import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { NoticeBox, Section } from "@/components/Section";
import { AccountAccessForm } from "./AccountAccessForm";

export const metadata: Metadata = {
  title: "登录 / 注册｜国际道教与文化协会 ITCA"
};

export default function AccountLoginPage() {
  return (
    <>
      <PageHero
        actions={[
          { href: "/account", label: "用户中心" },
          { href: "/application/query", label: "申请查询", variant: "secondary" }
        ]}
        atmosphere="credential"
        eyebrow="Account Access"
        imageSrc="/images/itca/04-service-membership.png"
        intro="登录 / 注册入口用于用户中心服务。账号系统建设中，开放前请继续使用申请进度查询、证书公开核验和会员公开核验入口办理相关事项。"
        subtitle="Login And Registration"
        title="登录 / 注册"
        visualDescription="用户中心开放后，将逐步提供资料、会员、认证、证书、订单和通知集中查看服务。"
        visualEyebrow="User Access"
        visualMark="Account"
        visualSeal="登录"
        visualTitle="用户系统入口"
      />

      <Section afterHero eyebrow="Access" title="登录 / 注册入口">
        <AccountAccessForm />
      </Section>

      <Section eyebrow="Compatibility" title="当前可用入口" tone="soft">
        <NoticeBox>
          如需办理申请、查询进度或核验公开信息，请继续使用官网现有入口。支付事项请从申请进度查询页面进入对应订单。
        </NoticeBox>
        <div className="mt-7 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white" href="/application/query">
            申请进度查询
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/verification">
            查询核验
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/member-query">
            会员查询
          </Link>
        </div>
      </Section>
    </>
  );
}
