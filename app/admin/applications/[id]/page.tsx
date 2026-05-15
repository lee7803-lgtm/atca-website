import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ReviewForm } from "./ReviewForm";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { getApplicationById } from "@/lib/supabase/server";
import type { ApplicationStatus, ApplicationType } from "@/types/application";

export const dynamic = "force-dynamic";

const typeText: Record<ApplicationType, string> = {
  personal_member: "个人会员申请",
  organization_member: "机构会员申请"
};

const statusText: Record<ApplicationStatus, string> = {
  submitted: "已提交",
  pending_review: "审核中",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "已驳回",
  archived: "已建档"
};

export default async function AdminApplicationDetailPage({ params }: { params: { id: string } }) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  const application = await getApplicationById(params.id);
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
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Detail</p>
          <h1 className="mt-3 break-all font-serif text-4xl leading-tight text-porcelain">{application.applicationNo}</h1>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <DetailItem label="申请类型" value={typeText[application.applicationType]} />
            <DetailItem label="当前状态" value={statusText[application.status]} />
            <DetailItem label="姓名 / 机构名称" value={application.name} />
            <DetailItem label="联系人" value={application.contactName || application.name} />
            <DetailItem label="手机 / WhatsApp" value={application.phone} />
            <DetailItem label="邮箱" value={application.email} />
            <DetailItem label="国家 / 地区" value={application.country} />
            <DetailItem label="机构类型" value={application.organizationType || "不适用"} />
            <DetailItem label="是否接收通知" value={application.receiveNotice ? "是" : "否"} />
            <DetailItem label="资料真实性确认" value={application.truthConfirmed ? "已确认" : "未确认"} />
            <DetailItem label="服务条款确认" value={application.termsAccepted ? "已确认" : "未确认"} />
            <DetailItem label="隐私政策确认" value={application.privacyAccepted ? "已确认" : "未确认"} />
            <DetailItem label="确认时间" value={application.confirmedAt ? formatDateTime(application.confirmedAt) : "未记录"} />
            <DetailItem label="提交时间" value={formatDateTime(application.createdAt)} />
            <DetailItem label="更新时间" value={formatDateTime(application.updatedAt)} />
            <DetailItem className="md:col-span-2" label="个人简介 / 机构简介" value={application.profile} />
            <DetailItem className="md:col-span-2" label="申请理由 / 合作意向" value={application.purpose} />
            <DetailItem className="md:col-span-2" label="审核备注" value={application.adminNote || "暂无备注"} />
          </div>
        </section>
        <ReviewForm applicationId={application.id} initialAdminNote={application.adminNote} initialStatus={application.status} />
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
