import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CertificationReviewForm } from "../ReviewForm";
import { MaterialReviewField } from "./MaterialReviewField";
import { CopyButton } from "@/components/CopyButton";
import { formatCertificationApplicationStatus, formatSupplementStatusChange } from "@/lib/status-labels";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { createCertificationAttachmentSignedUrl, findCertificateByApplicationId, getCertificationApplicationById, isSupabaseSchemaError, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import {
  certificationLevelLabels,
  certificationPathLabels,
  type CertificateQueryResult,
  type CertificationApplicationAdminRecord,
  type CertificationAttachment,
  type CertificationLevel,
  type CertificationPath,
  type CertificationStatus
} from "@/types/certification";

export const dynamic = "force-dynamic";

const certificateStatusText: Record<string, string> = {
  pending: "待确认",
  valid: "有效",
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
      databaseMessage = "认证申请资料服务尚未完成系统配置，请联系网站管理员处理。";
    } else if (isSupabaseSchemaError(error)) {
      databaseMessage = "认证申请资料服务尚未完成系统配置，请联系网站管理员处理。";
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
          <h1 className="font-serif text-3xl text-porcelain">认证申请资料暂不可用</h1>
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
      certificateMessage = "证书记录服务尚未完成系统配置，仍可查看认证申请详情。";
    } else if (error instanceof SupabaseConfigError) {
      certificateMessage = "证书记录服务尚未完成系统配置，仍可查看认证申请详情。";
    } else {
      certificateMessage = "证书记录暂时无法读取，仍可查看认证申请详情。";
    }
  }

  const existingCertificates = await attachSignedUrls(application.existingCertificates);
  const supportingDocuments = await attachSignedUrls(application.supportingDocuments);
  const certificatePhoto = await getCertificatePhoto(application, supportingDocuments);
  const supportingDocumentsWithoutPhoto = sortLatestAttachments(supportingDocuments.filter((attachment) => attachment.fieldName !== "photo"));
  const existingCertificatesLatest = sortLatestAttachments(existingCertificates);
  const supplementalSubmissions = await attachSupplementalSubmissionUrls(application.supplementalSubmissions);
  const materialReviewDisabled = ["certificate_issued", "cert_issued", "delivered", "archived", "revoked"].includes(application.status);
  const supportingMaterialsPanel = (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Documents</p>
      <h3 className="mt-3 font-serif text-2xl text-porcelain">上传材料 / 证明材料</h3>
      <div className="mt-5 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4">
        <h4 className="font-medium text-porcelain">道装证件照</h4>
        {certificatePhoto?.signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Signed Supabase URLs are short-lived admin-only previews.
          <img alt="道装证件照" className="mt-4 max-h-48 w-full rounded-lg border border-[#e4ded0] bg-white object-contain" src={certificatePhoto.signedUrl} />
        ) : (
          <p className="mt-4 text-sm leading-7 text-[#666666]">未识别到道装证件照。旧申请资料会从附件中的照片资料回退识别。</p>
        )}
        <div className="mt-4">
          <MaterialReviewField applicationId={application.id} disabled={materialReviewDisabled} itemKey="photo" materialReview={application.materialReview} />
        </div>
      </div>
      <div className="mt-5 grid gap-5">
        <AttachmentGroup attachments={existingCertificatesLatest} title="资质说明 / 既有证书" />
        <AttachmentGroup attachments={supportingDocumentsWithoutPhoto} title="补充证明材料" />
        <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
          <h3 className="font-medium text-porcelain">上传材料审核状态</h3>
          <div className="mt-4 grid gap-4">
            <MaterialReviewField applicationId={application.id} disabled={materialReviewDisabled} itemKey="credential" materialReview={application.materialReview} />
            <MaterialReviewField applicationId={application.id} disabled={materialReviewDisabled} itemKey="completeness" materialReview={application.materialReview} />
            <MaterialReviewField applicationId={application.id} disabled={materialReviewDisabled} itemKey="international" materialReview={application.materialReview} />
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href="/admin/certification-applications">返回申请管理</Link>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/admin">返回后台首页</Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/">返回前台首页</Link>
        </div>
      </div>
      <section className="mt-6 rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certification Detail</p>
            <h1 className="mt-3 font-serif text-3xl leading-tight text-porcelain sm:text-4xl">认证申请详情</h1>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="break-all rounded-xl border border-[#e4ded0] bg-[#fbf8ef] px-4 py-3 text-base font-semibold text-[#7F1D1D]">申请编号：{application.applicationNo}</p>
              <CopyButton label="复制申请编号" text={application.applicationNo} />
              <span className="rounded-full bg-[#7F1D1D] px-4 py-2 text-sm font-semibold text-white">{formatCertificationApplicationStatus(application)}</span>
              <a className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink" href={`/api/admin/certification-applications/${application.id}/export`}>
                下载本申请资料
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52] lg:min-w-72">
            <p>提交时间：{formatDateTime(application.createdAt)}</p>
            <p>申请人：{application.applicantName}</p>
            <p>邮箱 / 手机号：{application.email} / {application.phone}</p>
          </div>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="传承体系" value={formatCertificationPath(application.certificationPath)} />
          <SummaryItem label="申报认证等级" value={formatCertificationLevel(application.requestedLevel)} />
          <SummaryItem label="核定传承体系" value={formatCertificationPath(application.approvedPath)} />
          <SummaryItem label="核定认证等级" value={formatCertificationLevel(application.approvedLevel)} />
          <SummaryItem label="证书编号" value={certificate?.certificateNo || "尚未生成"} />
          <SummaryItem label="证书状态" value={certificate ? certificateStatusText[certificate.status] : "尚未生成"} />
          <SummaryItem label="下发状态" value={application.deliveryStatus === "delivered" ? "已下发" : "未下发"} />
          <SummaryItem label="下发时间" value={application.deliveredAt ? formatDateTime(application.deliveredAt) : "未记录"} />
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(380px,0.92fr)_minmax(0,1.08fr)] lg:items-start">
        <div className="grid gap-6 lg:order-2">
          <DetailSection title="基本身份资料">
            <DetailItem label="申请人中文姓名" value={application.applicantName} />
            <DetailItem label="英文名 / 拼音" value={application.applicantNameEn || "未填写"} />
            <DetailItem label="道名 / 法名" value={application.taoistName || "未填写"} />
            <DetailItem label="性别" value={application.gender || "未填写"} />
            <DetailItem label="出生日期" value={application.birthDate || "未填写"} />
            <DetailItem label="国籍" value={application.nationality || "未填写"} />
            <DetailItem label="现居地" value={application.residence || "未填写"} />
            <DetailItem label="确认时间" value={application.confirmedAt ? formatDateTime(application.confirmedAt) : "未记录"} />
            <MaterialReviewField applicationId={application.id} disabled={materialReviewDisabled} itemKey="identity" materialReview={application.materialReview} />
          </DetailSection>

          <DetailSection title="联系方式">
            <DetailItem label="手机 / WhatsApp" value={application.phone} />
            <DetailItem label="邮箱" value={application.email} />
            <DetailItem className="md:col-span-2" label="地址" value={application.address || "未填写"} />
          </DetailSection>

          <DetailSection title="师承 / 传承信息">
            <DetailItem label="师父姓名" value={application.masterName || "未填写"} />
            <DetailItem label="师父道名" value={application.masterTaoistName || "未填写"} />
            <DetailItem label="传承信息" value={application.lineage || "未填写"} />
            <DetailItem label="所属道派" value={application.sect || "未填写"} />
            <DetailItem label="宫观 / 机构" value={application.templeOrOrganization || "未填写"} />
            <DetailItem label="实践年限" value={application.practiceYears || "未填写"} />
            <MaterialReviewField applicationId={application.id} disabled={materialReviewDisabled} itemKey="lineage" materialReview={application.materialReview} />
          </DetailSection>

          <DetailSection title="推荐人信息">
            <DetailItem label="推荐人姓名" value={application.recommenderName || "未填写"} />
            <DetailItem label="推荐人联系方式" value={application.recommenderContact || "未填写"} />
            <DetailItem className="md:col-span-2" label="推荐关系 / 推荐说明" value={application.recommenderRelation || "未填写"} />
            <MaterialReviewField applicationId={application.id} disabled={materialReviewDisabled} itemKey="recommendation" materialReview={application.materialReview} />
          </DetailSection>

          <DetailSection title="经历与申请理由">
            <DetailItem className="md:col-span-2" label="道教履历说明" value={application.experienceSummary || "未填写"} />
            <DetailItem className="md:col-span-2" label="申请理由" value={application.applicationReason || "未填写"} />
            <DetailItem className="md:col-span-2" label="补充备注" value={application.additionalNote || "未填写"} />
            <MaterialReviewField applicationId={application.id} disabled={materialReviewDisabled} itemKey="practice" materialReview={application.materialReview} />
          </DetailSection>

          <DetailSection title="声明与确认">
            <DetailItem label="资料真实性确认" value={application.declarationAccepted ? "已确认" : "未确认"} />
            <DetailItem label="资料使用确认" value={application.dataUseAccepted ? "已确认" : "未确认"} />
            <DetailItem label="证书核验信息公开确认" value={application.certificatePublicAccepted ? "已确认" : "未确认"} />
            <DetailItem label="服务条款确认" value={application.termsAccepted ? "已确认" : "未确认"} />
            <DetailItem label="隐私政策确认" value={application.privacyAccepted ? "已确认" : "未确认"} />
            <MaterialReviewField applicationId={application.id} disabled={materialReviewDisabled} itemKey="ethics" materialReview={application.materialReview} />
          </DetailSection>

          <SupplementalRecords submissions={supplementalSubmissions} />

          <DetailSection title="审核记录">
            <DetailItem className="md:col-span-2" label="后台审核备注" value={application.internalReviewNote || "暂无后台审核备注"} />
            <DetailItem className="md:col-span-2" label="对申请人反馈" value={application.applicantFeedback || "暂无反馈"} />
            <DetailItem className="md:col-span-2" label="认证委员会审核意见" value={application.committeeReviewNote || "暂无意见"} />
            <DetailItem className="md:col-span-2" label="证书项目备注" value={application.reviewNote || "暂无备注"} />
          </DetailSection>

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
        </div>

        <div className="grid gap-6 lg:order-1">
          <CertificationReviewForm
            applicantName={application.applicantName}
            applicationId={application.id}
            applicationNo={application.applicationNo}
            certificateNo={certificate?.certificateNo}
            deliveredAt={application.deliveredAt}
            deliveryStatus={application.deliveryStatus}
            initialApprovedLevel={application.approvedLevel}
            initialApprovedPath={application.approvedPath}
            initialApplicantFeedback={application.applicantFeedback}
            initialCommitteeReviewNote={application.committeeReviewNote}
            initialInternalReviewNote={application.internalReviewNote}
            initialMaterialReview={application.materialReview}
            initialReviewNote={application.reviewNote}
            initialStatus={application.status}
            supportingMaterials={supportingMaterialsPanel}
          />
        </div>
      </div>
    </section>
  );
}

async function getCertificatePhoto(application: CertificationApplicationAdminRecord, supportingDocuments: CertificationAttachment[]) {
  const storagePath = application.certificatePhotoPath || supportingDocuments.find((attachment) => attachment.fieldName === "photo" && attachment.storagePath)?.storagePath || "";
  if (!storagePath) return null;

  const existing = supportingDocuments.find((attachment) => attachment.storagePath === storagePath);
  if (existing?.signedUrl) return existing;

  try {
    return {
      originalName: existing?.originalName || "道装证件照",
      fieldName: "photo",
      storagePath,
      signedUrl: await createCertificationAttachmentSignedUrl(storagePath, 3600)
    } satisfies CertificationAttachment;
  } catch {
    return {
      originalName: existing?.originalName || "道装证件照",
      fieldName: "photo",
      storagePath
    } satisfies CertificationAttachment;
  }
}

function formatCertificationPath(value: CertificationPath | "") {
  return value ? certificationPathLabels[value] : "未填写";
}

function formatCertificationLevel(value: CertificationLevel | "") {
  return value ? certificationLevelLabels[value] : "未填写";
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
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
      <p className="mt-1 text-xs leading-5 text-[#8a6b3e]">{formatAttachmentFieldName(attachment.fieldName)}</p>
      {attachment.source === "supplement" ? <p className="mt-1 text-xs leading-5 text-[#7F1D1D]">补充提交{attachment.supplementRound ? ` · 第 ${attachment.supplementRound} 次` : ""}</p> : null}
      {attachment.uploadedAt ? <p className="mt-1 text-xs leading-5 text-[#6f655b]">{formatDateTime(attachment.uploadedAt)}</p> : null}
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Signed Supabase URLs are short-lived admin-only previews.
        <img alt={attachment.originalName} className="mt-3 max-h-32 w-full rounded-lg border border-[#e4ded0] bg-[#fbf8ef] object-contain" src={attachment.signedUrl} />
      ) : null}
      {!attachment.storagePath ? (
        <p className="mt-3 text-sm leading-7 text-[#7F1D1D]">此附件仅记录文件名，附件文件暂不可显示，请联系协会秘书处核验。</p>
      ) : !attachment.signedUrl ? (
        <p className="mt-3 text-sm leading-7 text-[#7F1D1D]">附件文件暂不可显示，请联系协会秘书处核验。</p>
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

function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-7">
      <h2 className="font-serif text-2xl text-porcelain">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] px-4 py-3">
      <p className="text-xs tracking-[0.18em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 break-all text-sm font-medium leading-6 text-porcelain">{value}</p>
    </div>
  );
}

function formatAttachmentFieldName(fieldName: string) {
  const labels: Record<string, string> = {
    existing_certificates: "既有证书材料",
    supporting_documents: "补充证明材料",
    idProof: "身份证明",
    luDocument: "授箓 / 升箓材料",
    jieDocument: "传戒 / 授戒材料",
    duDocument: "传度材料",
    guanJinDocument: "冠巾材料",
    lineageProof: "师承证明",
    templeProof: "道场证明",
    internalVoucher: "资质凭证",
    criminalRecord: "无犯罪记录证明",
    educationProof: "学历 / 培训证明",
    practiceReport: "道教实践报告",
    organizationLetter: "组织推荐信",
    crossCulturePlan: "跨文化传道计划",
    supplementFiles: "补充材料",
    supplementPhoto: "补充道装证件照"
  };

  return labels[fieldName] || "申请证明材料";
}

function sortLatestAttachments(attachments: CertificationAttachment[]) {
  return [...attachments].sort((a, b) => {
    const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return bTime - aTime;
  });
}

async function attachSupplementalSubmissionUrls(submissions: CertificationApplicationAdminRecord["supplementalSubmissions"]) {
  const results = [];
  for (const submission of submissions) {
    results.push({ ...submission, files: await attachSignedUrls(submission.files) });
  }
  return results;
}

function SupplementalRecords({ submissions }: { submissions: Array<CertificationApplicationAdminRecord["supplementalSubmissions"][number]> }) {
  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-7">
      <h2 className="font-serif text-2xl text-porcelain">补充 / 修改记录</h2>
      {submissions.length === 0 ? <p className="mt-4 text-sm leading-7 text-[#666666]">暂无补充 / 修改记录。</p> : null}
      <div className="mt-5 grid gap-4">
        {submissions.map((submission, index) => (
          <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5" key={`${submission.submittedAt}-${index}`}>
            <div className="grid gap-3 text-sm leading-7 text-[#5f5b52] md:grid-cols-2">
              <DetailItem label="补充提交时间" value={submission.submittedAt ? formatDateTime(submission.submittedAt) : "未记录"} />
              <DetailItem label="提交时联系方式" value={submission.contact || "未记录"} />
              <DetailItem label="状态变化" value={formatSupplementStatusChange(submission.previousStatus, submission.nextStatus)} />
              <DetailItem label="修改字段摘要" value={submission.changedFields.length > 0 ? submission.changedFields.map((field) => field.field).join("、") : "未记录字段变化"} />
              <DetailItem className="md:col-span-2" label="补充说明" value={summarizeLongText(submission.note || "未填写")} />
            </div>
            {submission.changedFields.length > 0 ? (
              <div className="mt-4 rounded-xl border border-[#e4ded0] bg-white p-4">
                <p className="text-sm font-medium text-porcelain">字段变化</p>
                <div className="mt-3 grid gap-2 text-sm leading-6 text-[#5f5b52]">
                  {submission.changedFields.map((field, fieldIndex) => (
                    <p key={`${field.field}-${fieldIndex}`}>
                      <span className="font-medium text-porcelain">{field.field}：</span>
                      {summarizeLongText(field.oldValue || "未填写")} → {summarizeLongText(field.newValue || "已更新")}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            {submission.files.length > 0 ? <AttachmentGroup attachments={submission.files} title="本次补充文件" /> : null}
          </div>
        ))}
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

function summarizeLongText(value: string) {
  return value.length > 220 ? `${value.slice(0, 220)}...` : value;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
