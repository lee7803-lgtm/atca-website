import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLoginForm } from "./AdminLoginForm";
import { AdminPageHeader, AdminSectionCard, AdminStatCard } from "@/components/admin/AdminUI";
import { AdminConfigError, adminSessionCookieName, getAdminPassword, isValidAdminSessionToken } from "@/lib/admin/auth";
import { listAdminApplications } from "@/lib/api/admin-applications";
import { listPaymentOrders } from "@/lib/api/payments";
import { listNotificationLogs } from "@/lib/notifications/admin";
import { listCertificationApplications } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "后台管理｜国际道教与文化协会 ITCA"
};

export default async function AdminPage() {
  let isConfigured = true;

  try {
    getAdminPassword();
  } catch (error) {
    if (error instanceof AdminConfigError) isConfigured = false;
  }

  const isAuthed = isConfigured && isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value);
  const stats = isAuthed ? await getDashboardStats() : null;

  return (
    <section className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader
        eyebrow="Dashboard"
        intro="秘书处用于处理审核优先级、会员 / 认证申请、支付、通知、安全审计和基础资料治理的运营总览。"
        title="后台总览"
      />
      {!isConfigured ? (
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-5 text-sm leading-7 text-[#7F1D1D]">
          后台密码尚未配置，请先完成服务端后台密码环境配置。
        </div>
      ) : isAuthed ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="会员待审核" note={stats?.memberMessage || "已提交 / 待处理 / 审核中 / 需补充资料"} value={stats?.memberPending ?? "—"} />
            <AdminStatCard label="认证待审核" note={stats?.certificationMessage || "已提交 / 审核中 / 需补充资料"} value={stats?.certificationPending ?? "—"} />
            <AdminStatCard label="支付待处理" note={stats?.paymentMessage || "待付款 / 人工确认 / 支付失败"} value={stats?.paymentPending ?? "—"} />
            <AdminStatCard label="通知待处理" note={stats?.notificationMessage || "待发送 / 发送失败"} value={stats?.notificationPending ?? "—"} />
          </div>
          <AdminSectionCard title="优先处理入口">
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminEntryCard href="/admin/workbench" title="审核工作台" text="按优先级查看申请、支付与通知待办。" />
              <AdminEntryCard href="/admin/applications" title="会员申请" text="处理会员审核、有效期、联系方式修正与记录治理。" />
              <AdminEntryCard href="/admin/certification-applications" title="认证申请" text="处理材料审核、证书生成、下发与证书状态。" />
              <AdminEntryCard href="/admin/master-data" title="基础资料" text="维护推荐人、引荐人、宫观、机构与所属组织。" />
            </div>
          </AdminSectionCard>
        </>
      ) : (
        <AdminLoginForm />
      )}
    </section>
  );
}

async function getDashboardStats() {
  const [members, certifications, payments, notifications] = await Promise.allSettled([
    listAdminApplications({ pageSize: 100 }),
    listCertificationApplications(),
    listPaymentOrders({ pageSize: 100 }),
    listNotificationLogs({ limit: 100 })
  ]);

  return {
    memberPending: members.status === "fulfilled" ? members.value.filter((item) => ["submitted", "pending_review", "under_review", "need_more_info"].includes(item.status)).length : "—",
    memberMessage: members.status === "fulfilled" ? "" : "会员申请暂时无法读取",
    certificationPending: certifications.status === "fulfilled" ? certifications.value.filter((item) => ["submitted", "under_review", "need_more_info"].includes(item.status)).length : "—",
    certificationMessage: certifications.status === "fulfilled" ? "" : "认证申请暂时无法读取",
    paymentPending: payments.status === "fulfilled" ? payments.value.filter((item) => ["pending_payment", "manual_review", "failed"].includes(item.status)).length : "—",
    paymentMessage: payments.status === "fulfilled" ? "" : "支付订单暂时无法读取",
    notificationPending: notifications.status === "fulfilled" ? notifications.value.filter((item) => ["pending", "failed"].includes(item.sendStatus)).length : "—",
    notificationMessage: notifications.status === "fulfilled" ? "" : "通知记录暂时无法读取"
  };
}

function AdminEntryCard({ href, text, title }: { href: string; text: string; title: string }) {
  return (
    <Link className="group rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-5 transition hover:border-gold/50 hover:bg-white" href={href}>
      <h2 className="font-serif text-2xl text-porcelain">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#5f5b52]">{text}</p>
      <span className="mt-5 inline-flex rounded-full bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-[#6f1919]">
        进入管理
      </span>
    </Link>
  );
}
