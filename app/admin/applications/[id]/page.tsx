import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MemberStatusForm, ReviewForm } from "./ReviewForm";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { AdminApiUnauthorizedError, getAdminApplication } from "@/lib/api/admin-applications";
import { formatApplicationStatus } from "@/lib/status-labels";
import type { ApplicationAdminRecord, ApplicationStatus, ApplicationType } from "@/types/application";

export const dynamic = "force-dynamic";

const typeText: Record<ApplicationType, string> = {
  personal_member: "个人会员申请",
  organization_member: "机构会员申请"
};

const statusText: Record<ApplicationStatus, string> = {
  submitted: "已提交",
  pending_review: "待审核",
  under_review: "审核中",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "已驳回",
  archived: "已建档"
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default async function AdminApplicationDetailPage({ params }: { params: { id: string } }) {
  if (!isValidUuid(params.id)) notFound();
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  let application = null;
  try {
    application = await getAdminApplication(params.id);
  } catch (error) {
    if (error instanceof AdminApiUnauthorizedError) redirect("/admin");
    throw error;
  }
  if (!application) notFound();

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href="/admin/applications">返回申请管理</Link>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/admin">返回后台首页</Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/">返回前台首页</Link>
        </div>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
        <div className="grid gap-6">
          <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Detail</p>
            <h1 className="mt-3 break-all font-serif text-4xl leading-tight text-porcelain">{application.applicationNo}</h1>
          </section>
          <DetailSection title="基本信息">
            <DetailItem label="申请编号" value={application.applicationNo} />
            <DetailItem label="会员编号" value={application.memberNo || "审核通过后生成"} />
            <DetailItem label="申请类型" value={typeText[application.applicationType]} />
            <DetailItem label="当前状态" value={formatApplicationStatus(application)} />
            <DetailItem label="姓名 / 机构名称" value={application.name} />
            <DetailItem label="联系人" value={application.contactName || application.name} />
            <DetailItem label="国家 / 地区" value={application.country} />
            <DetailItem label="机构类型" value={application.organizationType || "不适用"} />
          </DetailSection>
          <DetailSection title="联系方式">
            <DetailItem label="手机 / WhatsApp" value={application.phone} />
            <DetailItem label="邮箱" value={application.email} />
          </DetailSection>
          <DetailSection title="申请信息">
            <DetailItem label="是否接收通知" value={application.receiveNotice ? "是" : "否"} />
            <DetailItem label="资料真实性确认" value={application.truthConfirmed ? "已确认" : "未确认"} />
            <DetailItem label="服务条款确认" value={application.termsAccepted ? "已确认" : "未确认"} />
            <DetailItem label="隐私政策确认" value={application.privacyAccepted ? "已确认" : "未确认"} />
            <DetailItem label="确认时间" value={application.confirmedAt ? formatDateTime(application.confirmedAt) : "未记录"} />
            <DetailItem label="提交时间" value={formatDateTime(application.createdAt)} />
            <DetailItem label="更新时间" value={formatDateTime(application.updatedAt)} />
            <DetailItem label="会员编号生成时间" value={application.memberNoIssuedAt ? formatDateTime(application.memberNoIssuedAt) : "暂未生成"} />
            <DetailItem label="会员编号生成来源" value={application.memberNoIssuedBy || "暂未生成"} />
          </DetailSection>
          <DetailSection title="补充说明">
            <DetailItem label="会员有效期" value={formatMemberValidityRange(application)} />
            <DetailItem label="统一状态" value={formatMemberValidityStatus(application)} />
            <DetailItem label="最近续期时间" value={application.lastRenewedAt ? formatDateTime(application.lastRenewedAt) : "未记录"} />
            <DetailItem className="md:col-span-2" label="个人简介 / 机构简介" value={application.profile} />
            <DetailItem className="md:col-span-2" label="申请理由 / 合作意向" value={application.purpose} />
          </DetailSection>
          <DetailSection title="审核备注">
            <DetailItem className="md:col-span-2" label="审核备注" value={application.adminNote || "暂无备注"} />
            <DetailItem className="md:col-span-2" label="状态备注" value={application.memberStatusNote || "暂无备注"} />
          </DetailSection>
        </div>
        <div className="grid gap-6">
          <ReviewForm applicationId={application.id} initialAdminNote={application.adminNote} initialStatus={application.status} />
          <MemberValidityPanel application={application} />
          <MemberStatusForm application={application} />
        </div>
      </div>
    </section>
  );
}

function DetailItem({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={`border-b border-[#eee7da] pb-4 ${className}`}>
      <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-porcelain">{value}</p>
    </div>
  );
}

function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-7">
      <h2 className="font-serif text-2xl text-porcelain">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function MemberValidityPanel({ application }: { application: ApplicationAdminRecord }) {
  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Validity</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">会员有效期</h2>
      <div className="mt-6 grid gap-4">
        <DetailItem label="有效期" value={formatMemberValidityRange(application)} />
        <DetailItem label="统一状态" value={formatMemberValidityStatus(application)} />
      </div>
    </section>
  );
}

function formatMemberValidityRange(application: ApplicationAdminRecord) {
  if (!application.memberValidFrom && !application.memberValidUntil) return "有效期未设置";
  if (application.memberValidFrom && application.memberValidUntil) {
    return `${formatDateOnly(application.memberValidFrom)} - ${formatDateOnly(application.memberValidUntil)}`;
  }

  return `${application.memberValidFrom ? formatDateOnly(application.memberValidFrom) : "未设置"} - ${application.memberValidUntil ? formatDateOnly(application.memberValidUntil) : "未设置"}`;
}

function formatMemberValidityStatus(application: ApplicationAdminRecord) {
  if (!application.memberValidFrom && !application.memberValidUntil) return "有效期未设置";
  if (application.memberEffectiveStatus === "expiring_soon") return "即将到期";
  return application.memberEffectiveStatusLabel || "有效期未设置";
}

function formatDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[1]}/${match[2]}/${match[3]}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
