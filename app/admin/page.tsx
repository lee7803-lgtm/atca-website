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

  if (!isConfigured) {
    return (
      <section className="mx-auto max-w-lg">
        <div className="border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-5 text-sm leading-7 text-[#7F1D1D]">
          后台密码尚未配置，请先完成服务端后台密码环境配置。
        </div>
      </section>
    );
  }

  if (!isAuthed) {
    return (
      <section className="mx-auto max-w-lg rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Admin</p>
        <h1 className="mt-3 font-serif text-3xl text-porcelain">管理员登录</h1>
        <p className="mt-3 text-sm leading-7 text-[#5f5b52]">本入口仅供协会授权管理人员使用。请使用管理员密码进入后台。</p>
        <AdminLoginForm />
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-6">
      <AdminPageHeader
        eyebrow="Operations Workbench"
        intro="SaaS 化运营后台用于处理申请、审核、财务、会员、认证证书、内容、发展中心、数据、通知、权限与审计。高风险模块需权限、审计和二次确认。"
        title="工作台"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="会员待审核" note={stats?.memberMessage || "已提交 / 待处理 / 审核中 / 需补充资料"} value={stats?.memberPending ?? "—"} />
        <AdminStatCard label="认证待审核" note={stats?.certificationMessage || "已提交 / 审核中 / 需补充资料"} value={stats?.certificationPending ?? "—"} />
        <AdminStatCard label="支付待处理" note={stats?.paymentMessage || "待付款 / 人工确认 / 支付失败"} value={stats?.paymentPending ?? "—"} />
        <AdminStatCard label="通知待处理" note={stats?.notificationMessage || "待发送 / 发送失败"} value={stats?.notificationPending ?? "—"} />
      </div>
      <AdminSectionCard title="SaaS 化一级模块">
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminEntryCard href="/admin" title="工作台" text="待办、超时、异常、关键指标与下一步提示。" />
          <AdminEntryCard href="/admin/applications" title="申请管理" text="承接会员、机构和历史申请的列表、详情、补件与记录治理。" />
          <AdminEntryCard href="/admin/workbench" title="审核中心" text="按优先级聚合初审、复审、财务和通知待办，只读分流到详情页。" />
          <AdminEntryCard href="/admin/payments" title="财务中心" text="保留 Bank Transfer 订单、凭证、人工确认、取消和审计入口。" />
          <AdminEntryCard href="/admin/applications" title="会员中心" text="映射现有会员申请、会员编号、有效期、续期和会员公开核验资料。" />
          <AdminEntryCard href="/admin/certification-applications" title="认证与证书中心" text="保留认证申请、材料审核、证书生成、PDF、下发和状态维护入口。" />
          <AdminEntryCard href="/admin/content" title="内容 CMS" text="维护关于协会、制度、频道首页、公告、媒体、审核和版本记录。" />
          <AdminEntryCard href="/admin/development" title="发展中心管理" text="维护六大发展中心、专委会、项目、合作机构、成果和风险边界。" />
          <AdminEntryCard href="/admin/development#course-activity" title="课程活动中心" text="建设中 / 后续接入：课程、报名、签到、结业、活动与退款联动。" />
          <AdminEntryCard href="/admin/development#cooperation" title="合作中心" text="建设中 / 后续接入：合作线索、负责人、协议、成果归档和关闭原因。" />
          <AdminEntryCard href="/admin/data-center" title="数据中心" text="治理八类公开资料库、授权、敏感等级、纠错、撤回和归档。" />
          <AdminEntryCard href="/admin/notifications" title="通知中心" text="保留 notification_logs、发送状态、失败重试和后台待办基础。" />
          <AdminEntryCard href="/admin/workbench#risk" title="争议与风控" text="建设中 / 后续接入：投诉、申诉、纠错、退款争议和高风险事件。" />
          <AdminEntryCard href="/admin/roles" title="权限与组织" text="管理角色、权限、职责冲突和管理员组织边界；权限变更需审计。" />
          <AdminEntryCard href="/admin/master-data" title="系统配置" text="维护基础资料、标准配置和受控选项；生产配置变更需二次确认。" />
          <AdminEntryCard href="/admin/audit-logs" title="审计日志" text="只读查询高风险操作、财务事件关联和后台关键变更记录。" />
        </div>
      </AdminSectionCard>
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
