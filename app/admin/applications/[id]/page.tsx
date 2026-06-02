import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MemberStatusForm, ReviewForm } from "./ReviewForm";
import { RelatedNotificationRecords, RelatedPaymentRecords } from "@/components/AdminRelatedRecords";
import { AdminContactCorrectionPanel } from "@/components/AdminContactCorrectionPanel";
import { AdminRecordDispositionPanel } from "@/components/AdminRecordDispositionPanel";
import { CreatePaymentOrderForm } from "@/app/admin/payments/CreatePaymentOrderForm";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { AdminApiUnauthorizedError, getAdminApplication } from "@/lib/api/admin-applications";
import { listRelatedPaymentOrders, PaymentApiRequestError, type PaymentOrderListItem } from "@/lib/api/payments";
import { listRelatedNotificationLogs } from "@/lib/notifications/admin";
import { NotificationTableMissingError } from "@/lib/notifications/logger";
import { formatApplicationStatus } from "@/lib/status-labels";
import type { NotificationLogRecord } from "@/lib/notifications/types";
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

type StageGuide = {
  stage: string;
  statusDescription: string;
  nextAction: string;
  risk: string;
  anchorHref: string;
  anchorLabel: string;
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

  let relatedPayments: PaymentOrderListItem[] = [];
  let paymentMessage = "";
  try {
    relatedPayments = await listRelatedPaymentOrders({
      applicationId: application.id,
      applicationNo: application.applicationNo,
      memberNo: application.memberNo,
      limit: 5
    });
  } catch (error) {
    paymentMessage = error instanceof PaymentApiRequestError ? error.message : "关联支付记录暂时无法读取；申请详情主内容不受影响。";
  }

  let relatedNotifications: NotificationLogRecord[] = [];
  let notificationMessage = "";
  try {
    relatedNotifications = await listRelatedNotificationLogs({
      applicationId: application.id,
      applicationNo: application.applicationNo,
      memberNo: application.memberNo,
      limit: 5
    });
  } catch (error) {
    notificationMessage = error instanceof NotificationTableMissingError ? "通知记录表尚未配置；申请详情主内容不受影响。" : "关联通知记录暂时无法读取；申请详情主内容不受影响。";
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href="/admin/applications">返回申请管理</Link>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink sm:w-auto" href="/admin">返回后台首页</Link>
          <Link className="w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink sm:w-auto" href="/">返回前台首页</Link>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start lg:gap-8">
        <div className="grid gap-5 sm:gap-6">
          <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Detail</p>
            <h1 className="mt-3 break-all font-serif text-4xl leading-tight text-porcelain">{application.applicationNo}</h1>
          </section>
          <MemberStageCard guide={getMemberStageGuide(application)} />
          <DetailSection id="basic-info" title="基本信息">
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
          <DetailSection id="review-notes" title="审核备注">
            <DetailItem className="md:col-span-2" label="审核备注" value={application.adminNote || "暂无备注"} />
            <DetailItem className="md:col-span-2" label="状态备注" value={application.memberStatusNote || "暂无备注"} />
          </DetailSection>
          <RelatedPaymentRecords message={paymentMessage} orders={relatedPayments} />
          <RelatedNotificationRecords logs={relatedNotifications} message={notificationMessage} />
        </div>
        <div className="grid gap-5 sm:gap-6">
          <div className="scroll-mt-6" id="review-processing">
            <ReviewForm applicationId={application.id} initialAdminNote={application.adminNote} initialStatus={application.status} />
          </div>
          <div className="scroll-mt-6" id="payment-processing">
            <CreatePaymentOrderForm sourceId={application.id} sourceType="application" />
          </div>
          <MemberValidityPanel application={application} />
          <div className="scroll-mt-6" id="member-status-processing">
            <MemberStatusForm application={application} />
          </div>
          <AdminContactCorrectionPanel
            actionUrl={`/api/admin/applications/${application.id}/contact`}
            disposition={application.recordDisposition}
            fields={[
              { key: "name", label: "姓名 / 机构名称", required: true },
              { key: "contactName", label: "联系人", required: true },
              { key: "phone", label: "手机 / WhatsApp", required: true },
              { key: "email", label: "邮箱", required: true, type: "email" },
              { key: "country", label: "国家 / 地区", required: true },
              { key: "organizationType", label: "机构类型" }
            ]}
            values={{
              name: application.name,
              contactName: application.contactName || application.name,
              phone: application.phone,
              email: application.email,
              country: application.country,
              organizationType: application.organizationType || ""
            }}
          />
          <AdminRecordDispositionPanel
            actionUrl={`/api/admin/applications/${application.id}/record-disposition`}
            disposition={application.recordDisposition}
            note={application.recordDispositionNote}
            updatedAt={application.recordDispositionAt}
            updatedBy={application.recordDispositionBy}
          />
        </div>
      </div>
    </section>
  );
}

function MemberStageCard({ guide }: { guide: StageGuide }) {
  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5 shadow-aureate sm:p-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Current Stage</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">{guide.stage}</h2>
          <p className="mt-3 text-sm leading-7 text-[#5f5b52]">{guide.statusDescription}</p>
        </div>
        <a className="w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D] sm:w-auto" href={guide.anchorHref}>
          {guide.anchorLabel}
        </a>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <StageGuideItem label="下一步建议动作" value={guide.nextAction} />
        <StageGuideItem label="风险或阻断提示" value={guide.risk} />
      </div>
    </section>
  );
}

function StageGuideItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e4ded0] bg-white px-4 py-3">
      <p className="text-xs tracking-[0.2em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 break-words text-sm leading-7 text-porcelain">{value}</p>
    </div>
  );
}

function getMemberStageGuide(application: ApplicationAdminRecord): StageGuide {
  const hasMemberNo = Boolean(application.memberNo);
  const hasValidity = Boolean(application.memberValidFrom && application.memberValidUntil);

  if (application.status === "archived") {
    return {
      stage: "已建档",
      statusDescription: "该会员申请已进入归档状态，详情页主要用于复核历史资料和会员状态。",
      nextAction: "按需查看基本资料、审核备注或会员有效期记录。",
      risk: "归档申请原则上不再调整审核结论；如需后续维护，请先确认业务依据。",
      anchorHref: "#basic-info",
      anchorLabel: "查看基本信息"
    };
  }

  if (application.status === "rejected") {
    return {
      stage: "已驳回",
      statusDescription: "该会员申请当前为驳回状态，应重点确认审核备注是否足够清晰。",
      nextAction: "检查审核备注，确保申请人可理解未通过或后续处理原因。",
      risk: application.adminNote ? "暂无明显阻断；请避免在备注中记录敏感内部信息。" : "审核备注为空，建议补充驳回原因或处理说明。",
      anchorHref: "#review-processing",
      anchorLabel: "前往审核处理"
    };
  }

  if (application.status === "need_more_info") {
    return {
      stage: "需补充资料",
      statusDescription: "该会员申请正在等待申请人补充资料或秘书处线下确认。",
      nextAction: "复核审核备注中的补充要求；收到补充资料后再继续审核。",
      risk: application.adminNote ? "请确认补充要求具体、可执行，避免申请人无法判断需要提交什么。" : "缺少补充资料说明，申请人可能无法完成补充。",
      anchorHref: "#review-processing",
      anchorLabel: "前往审核处理"
    };
  }

  if (application.status === "submitted" || application.status === "pending_review") {
    return {
      stage: application.status === "submitted" ? "已提交" : "待审核",
      statusDescription: `该会员申请已进入后台，当前状态为${statusText[application.status]}。`,
      nextAction: "核对基本资料、联系方式、申请信息和推荐信息后，进入审核处理区推进状态。",
      risk: "请先确认申请类型、联系方式和资料真实性声明，再作出审核结论。",
      anchorHref: "#review-processing",
      anchorLabel: "前往审核处理"
    };
  }

  if (application.status === "under_review") {
    return {
      stage: "审核中",
      statusDescription: "该会员申请正在审核处理中，需继续确认资料完整性和审核结论。",
      nextAction: "补齐审核备注，选择通过、驳回或要求补充资料。",
      risk: "若资料仍不完整，不建议直接通过；应先要求补充资料。",
      anchorHref: "#review-processing",
      anchorLabel: "继续审核"
    };
  }

  if (application.status === "approved" && !hasMemberNo) {
    return {
      stage: "已通过但会员编号未生成",
      statusDescription: "该申请已审核通过，但会员编号仍为空。",
      nextAction: "进入审核处理或会员状态区域，确认会员编号生成和后续状态维护。",
      risk: hasValidity ? "会员有效期已记录，但会员编号缺失会影响后续查询和建档。" : "会员编号与有效期均未完整，暂不建议建档。",
      anchorHref: "#review-processing",
      anchorLabel: "前往审核处理"
    };
  }

  if (application.status === "approved" && !hasValidity) {
    return {
      stage: "有效期未设置",
      statusDescription: "该申请已通过且会员编号已生成，但会员有效期尚未完整设置。",
      nextAction: "进入会员有效期区域，补齐有效期开始和截止日期。",
      risk: "有效期未设置会影响会员状态判断、续期提醒和后台筛选。",
      anchorHref: "#validity-processing",
      anchorLabel: "设置有效期"
    };
  }

  if (application.status === "approved" && hasMemberNo) {
    return {
      stage: "已通过且会员编号已生成",
      statusDescription: "该会员申请已通过并具备会员编号，可继续确认有效期和会员业务状态。",
      nextAction: "检查会员有效期、状态备注和是否需要创建支付订单或归档。",
      risk: hasValidity ? "暂无明显阻断；归档前请确认支付和有效期记录符合秘书处要求。" : "有效期仍未完整设置，请先补齐。",
      anchorHref: hasValidity ? "#member-status-processing" : "#validity-processing",
      anchorLabel: hasValidity ? "查看会员状态" : "设置有效期"
    };
  }

  return {
    stage: statusText[application.status] || "待处理",
    statusDescription: "该会员申请当前处于后台记录状态。",
    nextAction: "查看基本资料和审核处理区，确认下一步动作。",
    risk: "暂无自动识别的阻断提示。",
    anchorHref: "#review-processing",
    anchorLabel: "前往审核处理"
  };
}

function DetailItem({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={`border-b border-[#eee7da] pb-4 ${className}`}>
      <p className="text-xs tracking-[0.22em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-porcelain">{value}</p>
    </div>
  );
}

function DetailSection({ children, id, title }: { children: ReactNode; id?: string; title: string }) {
  return (
    <section className="scroll-mt-6 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate sm:p-7" id={id}>
      <h2 className="font-serif text-2xl text-porcelain">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function MemberValidityPanel({ application }: { application: ApplicationAdminRecord }) {
  return (
    <section className="scroll-mt-6 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate sm:p-8" id="validity-processing">
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
