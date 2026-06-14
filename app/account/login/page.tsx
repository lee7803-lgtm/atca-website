import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHero } from "@/components/PageHero";
import { NoticeBox, Section } from "@/components/Section";
import { AccountAccessForm } from "./AccountAccessForm";

export const metadata: Metadata = {
  title: "账号建设中｜国际道教与文化协会 ITCA"
};

export default function AccountLoginPage() {
  return (
    <>
      <PageHero
        actions={[
          { href: "/application/query", label: "申请进度查询" },
          { href: "/verification", label: "查询核验", variant: "secondary" }
        ]}
        atmosphere="credential"
        eyebrow="Account Service"
        imageSrc="/images/itca/04-service-membership.png"
        intro="用户中心账号系统建设中，当前不作为正式账号入口。申请、核验和补件事项请继续使用已上线业务路径办理。"
        subtitle="Account Service In Progress"
        title="账号建设中"
        visualDescription="用户中心开放后，将逐步提供资料、会员、认证、证书、订单和通知集中查看服务。"
        visualEyebrow="User Access"
        visualMark="Account"
        visualSeal="账号"
        visualTitle="用户系统入口"
      />

      <Breadcrumbs items={[{ href: "/account", label: "用户中心" }, { label: "账号建设中" }]} />

      <Section afterHero eyebrow="Access Status" title="用户中心建设中" intro="本页只说明账号服务状态，不采集注册信息，不创建用户账号，不替代现有申请和核验流程。">
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
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/member/apply">
            个人会员申请
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/organization/apply">
            机构会员申请
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/certification/taoist-priest">
            认证申请
          </Link>
        </div>
      </Section>
    </>
  );
}
