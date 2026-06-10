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
        intro="登录 / 注册入口用于 V2.0 用户系统。当前不执行 SQL、不修改数据库；正式账号能力以后续 SQL 草案经人工确认执行后启用。"
        subtitle="Login And Registration"
        title="登录 / 注册"
        visualDescription="保留 V1.3 申请查询、支付、证书核验和通知链路，账号绑定只作为后续关联入口。"
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
          用户系统数据库未执行前，请继续使用申请编号、手机号 / 邮箱、证书编号和姓名完成 V1.3 查询与核验。后台审核、支付、通知和证书流程不受影响。
        </NoticeBox>
        <div className="mt-7 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link className="rounded-full bg-[#7F1D1D] px-6 py-3 text-center text-sm font-semibold text-white" href="/application/query">
            申请进度查询
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/certificate-query">
            证书查验
          </Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-6 py-3 text-center text-sm font-semibold text-ink" href="/member-query">
            会员查询
          </Link>
        </div>
      </Section>
    </>
  );
}

