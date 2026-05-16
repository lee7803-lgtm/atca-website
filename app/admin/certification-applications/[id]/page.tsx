import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CertificationReviewForm } from "../ReviewForm";
import { CopyButton } from "@/components/CopyButton";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { createCertificationAttachmentSignedUrl, findCertificateByApplicationId, getCertificationApplicationById, isSupabaseSchemaError, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import type { CertificateQueryResult, CertificationApplicationAdminRecord, CertificationAttachment, CertificationStatus } from "@/types/certification";

export const dynamic = "force-dynamic";

const statusText: Record<CertificationStatus, string> = {
  submitted: "已提交",
  under_review: "审核中",
  need_more_info: "需补充资料",
  approved: "已通过",
  rejected: "已驳回",
  certificate_issued: "已生成证书",
  cert_issued: "已生成证书",
  delivered: "已下发",
  archived: "已归档",
  revoked: "已撤销"
};

const certificateStatusText: Record<string, string> = {
  valid: "有效",
  suspended: "暂停",
  revoked: "已撤销",
  expired: "已过期"
};

export default async function AdminCertificationApplicationDetailPage({ params }: { params: { id: string } }) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  let application: CertificationApplicationAdminRecord | null = null;
  let certificate: CertificateQueryResult | null = null;
  let databaseMessage = "";

  try {
    application = await getCertificationApplicationById(params.id);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      databaseMessage = `数据库环境变量尚未配置完整：${error.missing.join(", ")}。`;
    } else if (isSupabaseSchemaError(error)) {
      databaseMessage = "认证申请数据表尚未配置。请先在 Supabase 执行数据库初始化 SQL：supabase/applications.sql";
    } else if (error instanceof SupabaseRequestError) {
      databaseMessage = "认证申请数据暂时无法读取，请稍后重试或检查 Supabase 服务状态。";
    } else {
      databaseMessage = "认证申请详情暂时无法读取，请稍后重试。";
    }
  }

  if (databaseMessage) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link className="text-sm font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href="/admin/certification-applications">返回申请管理</Link>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/admin">返回后台首页</Link>
            <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/">返回前台首页</Link>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-aureate">
          <h1 className="font-serif text-3xl text-porcelain">认证申请数据表尚未配置</h1>
          <p className="mt-3">{databaseMessage}</p>
        </div>
      </section>
    );
  }

  if (!application) notFound();

  let certificateMessage = "";
  try {
    certificate = await findCertificateByApplicationId(params.id);
  } catch (error) {
    if (isSupabaseSchemaError(error)) {
      certificateMessage = "证书数据表尚未配置。请先在 Supabase 执行数据库初始化 SQL：supabase/applications.sql";
    } else if (error instanceof SupabaseConfigError) {
      certificateMessage = `数据库环境变量尚未配置完整：${error.missing.join(", ")}。`;
    } else {
      certificateMessage = "证书记录暂时无法读取，仍可查看认证申请详情。";
    }
  }

  const existingCertificates = await attachSignedUrls(application.existingCertificates);
  const supportingDocuments = await attachSignedUrls(application.supportingDocuments);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href="/admin/certification-applications">返回申请管理</Link>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/admin">返回后台首页</Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/">返回前台首页</Link>
        </div>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certification Detail</p>
          <h1 className="mt-3 break-all font-serif text-4xl leading-tight text-porcelain">{application.applicationNo}</h1>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <DetailItem label="当前状态" value={statusText[application.status]} />
            <DetailItem label="证书编号" value={certificate?.certificateNo || "尚未生成"} />
            <DetailItem label="证书状态" value={certificate ? certificateStatusText[certificate.status] : "尚未生成"} />
            <DetailItem label="下发状态" value={application.deliveryStatus === "delivered" ? "已下发" : "未下发"} />
            <DetailItem label="下发时间" value={application.deliveredAt ? formatDateTime(application.deliveredAt) : "未记录"} />
            <DetailItem label="申请人中文姓名" value={application.applicantName} />
            <DetailItem label="英文名 / 拼音" value={application.applicantNameEn || "未填写"} />
            <DetailItem label="道名 / 法名" value={application.taoistName} />
            <DetailItem label="性别" value={application.gender || "未填写"} />
            <DetailItem label="出生日期" value={application.birthDate || "未填写"} />
            <DetailItem label="国籍" value={application.nationality || "未填写"} />
            <DetailItem label="现居地" value={application.residence || "未填写"} />
            <DetailItem label="手机 / WhatsApp" value={application.phone} />
            <DetailItem label="邮箱" value={application.email} />
            <DetailItem label="地址" value={application.address || "未填写"} />
            <DetailItem label="师父姓名" value={application.masterName || "未填写"} />
            <DetailItem label="师父道名" value={application.masterTaoistName || "未填写"} />
            <DetailItem label="传承信息" value={application.lineage || "未填写"} />
            <DetailItem label="所属道派" value={application.sect || "未填写"} />
            <DetailItem label="宫观 / 机构" value={application.templeOrOrganization || "未填写"} />
            <DetailItem label="实践年限" value={application.practiceYears || "未填写"} />
            <DetailItem className="md:col-span-2" label="道教履历说明" value={application.experienceSummary || "未填写"} />
            <DetailItem className="md:col-span-2" label="申请理由" value={application.applicationReason || "未填写"} />
            <DetailItem className="md:col-span-2" label="补充备注" value={application.additionalNote || "未填写"} />
            <DetailItem label="资料真实性确认" value={application.declarationAccepted ? "已确认" : "未确认"} />
            <DetailItem label="资料使用确认" value={application.dataUseAccepted ? "已确认" : "未确认"} />
            <DetailItem label="证书核验信息公开确认" value={application.certificatePublicAccepted ? "已确认" : "未确认"} />
            <DetailItem label="服务条款确认" value={application.termsAccepted ? "已确认" : "未确认"} />
            <DetailItem label="隐私政策确认" value={application.privacyAccepted ? "已确认" : "未确认"} />
            <DetailItem label="确认时间" value={application.confirmedAt ? formatDateTime(application.confirmedAt) : "未记录"} />
            <DetailItem label="提交时间" value={formatDateTime(application.createdAt)} />
            <DetailItem className="md:col-span-2" label="内部审核备注" value={application.internalReviewNote || "暂无内部备注"} />
            <DetailItem className="md:col-span-2" label="对申请人反馈" value={application.applicantFeedback || "暂无反馈"} />
            <DetailItem className="md:col-span-2" label="证书项目备注" value={application.reviewNote || "暂无备注"} />
          </div>
          {certificate ? (
            <div className="mt-6 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
              <p className="text-sm font-medium text-porcelain">证书记录已生成</p>
              <p className="mt-2 break-all font-serif text-2xl text-[#7F1D1D]">{certificate.certificateNo}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CopyButton label="复制证书编号" text={certificate.certificateNo} />
                <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href={`/certificates/${encodeURIComponent(certificate.certificateNo)}`}>
                  查看证书核验详情
                </Link>
                <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href={`/certificate-query?certificateNo=${encodeURIComponent(certificate.certificateNo)}&holderName=${encodeURIComponent(certificate.holderName)}`}>
                  公开核验入口
                </Link>
                <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href={`/application/query?number=${application.applicationNo}`}>
                  申请进度查询入口
                </Link>
              </div>
            </div>
          ) : null}
          {certificateMessage ? <div className="mt-6 border-l-4 border-[#8a6b3e] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">{certificateMessage}</div> : null}
        </section>
        <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8 lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Documents</p>
          <h2 className="mt-3 font-serif text-3xl text-porcelain">附件资料</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <AttachmentGroup attachments={existingCertificates} title="资质说明 / 既有证书" />
            <AttachmentGroup attachments={supportingDocuments} title="补充证明材料" />
          </div>
        </section>
        <CertificationReviewForm
          applicantName={application.applicantName}
          applicationId={application.id}
          applicationNo={application.applicationNo}
          certificateNo={certificate?.certificateNo}
          deliveredAt={application.deliveredAt}
          deliveryStatus={application.deliveryStatus}
          initialApplicantFeedback={application.applicantFeedback}
          initialInternalReviewNote={application.internalReviewNote}
          initialReviewNote={application.reviewNote}
          initialStatus={application.status}
        />
      </div>
    </section>
  );
}

async function attachSignedUrls(attachments: CertificationAttachment[]) {
  const results: CertificationAttachment[] = [];
  for (const attachment of attachments) {
    if (!attachment.storagePath) {
      results.push(attachment);
      continue;
    }

    try {
      results.push({ ...attachment, signedUrl: await createCertificationAttachmentSignedUrl(attachment.storagePath, 3600) });
    } catch {
      results.push(attachment);
    }
  }

  return results;
}

function AttachmentGroup({ attachments, title }: { attachments: CertificationAttachment[]; title: string }) {
  return (
    <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
      <h3 className="font-medium text-porcelain">{title}</h3>
      {attachments.length === 0 ? <p className="mt-4 text-sm leading-7 text-[#666666]">未提交附件。</p> : null}
      <div className="mt-4 grid gap-4">
        {attachments.map((attachment, index) => (
          <AttachmentCard attachment={attachment} key={`${attachment.storagePath || attachment.originalName}-${index}`} />
        ))}
      </div>
    </div>
  );
}

function AttachmentCard({ attachment }: { attachment: CertificationAttachment }) {
  const isImage = attachment.mimeType?.startsWith("image/") && attachment.signedUrl;

  return (
    <div className="rounded-xl border border-[#e4ded0] bg-white p-4">
      <p className="break-all text-sm font-medium text-porcelain">{attachment.originalName}</p>
      <p className="mt-1 text-xs leading-5 text-[#8a6b3e]">{attachment.fieldName}</p>
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Signed Supabase URLs are short-lived admin-only previews.
        <img alt={attachment.originalName} className="mt-3 max-h-48 rounded-lg border border-[#e4ded0] object-contain" src={attachment.signedUrl} />
      ) : null}
      {!attachment.storagePath ? (
        <p className="mt-3 text-sm leading-7 text-[#7F1D1D]">此附件仅记录了文件名，未保存上传文件，无法预览。</p>
      ) : !attachment.signedUrl ? (
        <p className="mt-3 text-sm leading-7 text-[#7F1D1D]">附件文件未找到，请检查 Supabase Storage 是否已正确配置。</p>
      ) : null}
      {attachment.signedUrl ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-xs font-semibold text-ink" href={attachment.signedUrl} rel="noreferrer" target="_blank">
            {isImage ? "查看原图" : "打开附件"}
          </a>
          <a className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-xs font-semibold text-ink" download={attachment.originalName} href={attachment.signedUrl}>
            下载附件
          </a>
        </div>
      ) : null}
    </div>
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
  return new Date(value).toLocaleString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
