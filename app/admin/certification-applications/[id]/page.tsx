import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import { CertificateStatusForm, CertificationReviewForm } from "../ReviewForm";
import { MaterialReviewField } from "./MaterialReviewField";
import { CopyButton } from "@/components/CopyButton";
import { formatCertificationApplicationStatus, formatSupplementStatusChange } from "@/lib/status-labels";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { getCertificateVerificationUrl } from "@/lib/site-url";
import { createCertificationAttachmentSignedUrl, findCertificateByApplicationId, findCertificatePdfMetadataByApplicationId, getCertificationApplicationById, isSupabaseSchemaError, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import {
  certificationLevelLabels,
  certificationPathLabels,
  type CertificateQueryResult,
  type CertificatePdfMetadata,
  type CertificationApplicationAdminRecord,
  type CertificationAttachment,
  type CertificationLevel,
  type CertificationPath,
  type CertificationStatus,
  type MaterialReview
} from "@/types/certification";

export const dynamic = "force-dynamic";

const certificateStatusText: Record<string, string> = {
  pending: "待确认",
  valid: "有效",
  revoked: "已撤销",
  suspended: "已暂停",
  expired: "已过期",
  expiring_soon: "即将到期",
  pending_renewal: "待续期",
  renewal_in_progress: "续期中",
  renewed: "已续期",
  validity_not_set: "有效期未设置"
};

const identityMaterialFieldNames = new Set(["idProof"]);
const photoMaterialFieldNames = new Set(["photo", "supplementPhoto"]);
const lineageMaterialFieldNames = new Set(["lineageProof", "templeProof", "duDocument", "guanJinDocument", "jieDocument", "luDocument"]);
const credentialMaterialFieldNames = new Set(["internalVoucher", "educationProof", "organizationLetter"]);

export default async function AdminCertificationApplicationDetailPage({ params }: { params: { id: string } }) {
  if (!isValidAdminSessionToken(cookies().get(adminSessionCookieName)?.value)) redirect("/admin");

  let application: CertificationApplicationAdminRecord | null = null;
  let certificate: CertificateQueryResult | null = null;
  let certificatePdf: CertificatePdfMetadata | null = null;
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
    if (certificate) certificatePdf = await findCertificatePdfMetadataByApplicationId(params.id);
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
  const identityDocuments = sortLatestAttachments(supportingDocuments.filter((attachment) => attachment.fieldName === "idProof"));
  const photoDocuments = sortLatestAttachments(supportingDocuments.filter((attachment) => attachment.fieldName === "photo"));
  const lineageDocuments = sortLatestAttachments(supportingDocuments.filter((attachment) => lineageMaterialFieldNames.has(attachment.fieldName)));
  const credentialDocuments = sortLatestAttachments([...existingCertificates, ...supportingDocuments.filter((attachment) => credentialMaterialFieldNames.has(attachment.fieldName))]);
  const otherDocuments = sortLatestAttachments(supportingDocuments.filter((attachment) => !identityMaterialFieldNames.has(attachment.fieldName) && !photoMaterialFieldNames.has(attachment.fieldName) && !lineageMaterialFieldNames.has(attachment.fieldName) && !credentialMaterialFieldNames.has(attachment.fieldName)));
  const supplementalSubmissions = await attachSupplementalSubmissionUrls(application.supplementalSubmissions);
  const certificateVerificationUrl = getCertificateVerificationUrl();
  const certificateVerificationQrCode = certificate
    ? await QRCode.toDataURL(certificateVerificationUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 320,
        color: {
          dark: "#273331",
          light: "#fffdf7"
        }
      })
    : "";
  const materialReviewSteps: Array<{ key: keyof MaterialReview; note: string; targetId: string }> = [
    { key: "identity", note: "核对姓名、身份材料、道装证件照与申请人一致性。", targetId: "identity-detail" },
    { key: "ethics", note: "核对联系方式、声明确认、资料使用与公开核验确认。", targetId: "contact-detail" },
    { key: "lineage", note: "核对师父、道派、传承体系、宫观或机构资料。", targetId: "lineage-detail" },
    { key: "recommendation", note: "核对推荐人信息、推荐关系和推荐说明。", targetId: "recommendation-detail" },
    { key: "practice", note: "核对实践年限、道教履历和申请理由。", targetId: "practice-detail" },
    { key: "international", note: "核对补充 / 修改记录，确认补交要求是否已处理。", targetId: "supplement-detail" },
    { key: "credential", note: "核对既有证书、资质凭证和其他证明材料。", targetId: "supporting-materials-detail" },
    { key: "photo", note: "核对道装证件照是否可用于证书记录。", targetId: "supporting-materials-detail" },
    { key: "completeness", note: "最终确认上传材料完整性。", targetId: "supporting-materials-detail" }
  ];
  const isMaterialReviewLocked = (index: number) => {
    const previous = index > 0 ? materialReviewSteps[index - 1] : null;
    return previous ? application.materialReview[previous.key] === "pending" : false;
  };
  const materialReviewWorkflow = (
    <div className="grid gap-5" id="material-review">
      <DetailSection id="identity-detail" title="基本身份资料">
        <DetailItem label="申请人中文姓名" value={application.applicantName} />
        <DetailItem label="英文名 / 拼音" value={application.applicantNameEn || "未填写"} />
        <DetailItem label="道名 / 法名" value={application.taoistName || "未填写"} />
        <DetailItem label="性别" value={application.gender || "未填写"} />
        <DetailItem label="出生日期" value={application.birthDate || "未填写"} />
        <DetailItem label="国籍" value={application.nationality || "未填写"} />
        <DetailItem label="现居地" value={application.residence || "未填写"} />
        <DetailItem label="确认时间" value={application.confirmedAt ? formatDateTime(application.confirmedAt) : "未记录"} />
        <AttachmentGroup attachments={identityDocuments} className="md:col-span-2" title="身份证明材料" />
        <MaterialReviewField applicationId={application.id} disabled={isMaterialReviewLocked(0)} disabledReason={isMaterialReviewLocked(0) ? "请先完成上一项资料审核" : undefined} itemKey="identity" label="身份真实性" materialReview={application.materialReview} />
      </DetailSection>

      <DetailSection id="contact-detail" title="联系方式">
        <DetailItem label="手机 / WhatsApp" value={application.phone} />
        <DetailItem label="邮箱" value={application.email} />
        <DetailItem className="md:col-span-2" label="地址" value={application.address || "未填写"} />
        <MaterialReviewField applicationId={application.id} disabled={isMaterialReviewLocked(1)} disabledReason={isMaterialReviewLocked(1) ? "请先完成上一项资料审核" : undefined} itemKey="ethics" label="联系方式" materialReview={application.materialReview} />
      </DetailSection>

      <DetailSection id="lineage-detail" title="师承 / 传承信息">
        <DetailItem label="申报传承体系" value={formatCertificationPath(application.certificationPath)} />
        <DetailItem label="师父姓名" value={application.masterName || "未填写"} />
        <DetailItem label="师父道名" value={application.masterTaoistName || "未填写"} />
        <DetailItem label="传承信息" value={application.lineage || "未填写"} />
        <DetailItem label="所属道派" value={application.sect || "未填写"} />
        <DetailItem label="宫观 / 机构" value={application.templeOrOrganization || "未填写"} />
        <DetailItem label="实践年限" value={application.practiceYears || "未填写"} />
        <MaterialReviewField applicationId={application.id} disabled={isMaterialReviewLocked(2)} disabledReason={isMaterialReviewLocked(2) ? "请先完成上一项资料审核" : undefined} itemKey="lineage" label="师承 / 传承信息" materialReview={application.materialReview} />
      </DetailSection>

      <DetailSection id="recommendation-detail" title="推荐人信息">
        <DetailItem label="推荐人姓名" value={application.recommenderName || "未填写"} />
        <DetailItem label="推荐人联系方式" value={application.recommenderContact || "未填写"} />
        <DetailItem className="md:col-span-2" label="推荐关系 / 推荐说明" value={application.recommenderRelation || "未填写"} />
        <MaterialReviewField applicationId={application.id} disabled={isMaterialReviewLocked(3)} disabledReason={isMaterialReviewLocked(3) ? "请先完成上一项资料审核" : undefined} itemKey="recommendation" label="推荐人信息" materialReview={application.materialReview} />
      </DetailSection>

      <DetailSection id="practice-detail" title="经历与申请理由">
        <DetailItem className="md:col-span-2" label="道教履历说明" value={application.experienceSummary || "未填写"} />
        <DetailItem className="md:col-span-2" label="申请理由" value={application.applicationReason || "未填写"} />
        <DetailItem className="md:col-span-2" label="补充备注" value={application.additionalNote || "未填写"} />
        <MaterialReviewField applicationId={application.id} disabled={isMaterialReviewLocked(4)} disabledReason={isMaterialReviewLocked(4) ? "请先完成上一项资料审核" : undefined} itemKey="practice" label="经历与申请理由" materialReview={application.materialReview} />
      </DetailSection>

      <SupplementalRecords applicationId={application.id} materialReview={application.materialReview} reviewDisabled={isMaterialReviewLocked(5)} submissions={supplementalSubmissions} />

      <DetailSection id="supporting-materials-detail" title="上传材料 / 证明材料">
        <div className="md:col-span-2 grid gap-5">
          <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
            <AttachmentGroup attachments={lineageDocuments} title="师承证明材料" />
            <div className="mt-5">
              <MaterialReviewField applicationId={application.id} disabled={isMaterialReviewLocked(6)} disabledReason={isMaterialReviewLocked(6) ? "请先完成上一项资料审核" : undefined} itemKey="credential" label="师承证明材料" materialReview={application.materialReview} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
            <h3 className="font-medium text-porcelain">道装证件照 / 既有证书</h3>
            {certificatePhoto?.signedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Signed Supabase URLs are short-lived admin-only previews.
              <img alt="道装证件照" className="mt-4 max-h-48 w-full rounded-lg border border-[#e4ded0] bg-white object-contain" src={certificatePhoto.signedUrl} />
            ) : (
              <p className="mt-4 text-sm leading-7 text-[#666666]">未识别到道装证件照。旧申请资料会从附件中的照片资料回退识别。</p>
            )}
            <div className="mt-5 grid gap-5">
              <AttachmentGroup attachments={photoDocuments} title="道装证件照原始附件" />
              <AttachmentGroup attachments={credentialDocuments} title="既有证书 / 资质凭证" />
            </div>
            <div className="mt-5">
              <MaterialReviewField applicationId={application.id} disabled={application.materialReview.credential === "pending"} disabledReason={application.materialReview.credential === "pending" ? "请先完成上一项资料审核" : undefined} itemKey="photo" label="道装证件照 / 既有证书" materialReview={application.materialReview} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5">
            <AttachmentGroup attachments={otherDocuments} title="其他证明材料" />
            <div className="mt-5">
              <MaterialReviewField applicationId={application.id} disabled={application.materialReview.photo === "pending"} disabledReason={application.materialReview.photo === "pending" ? "请先完成上一项资料审核" : undefined} itemKey="completeness" label="其他证明材料" materialReview={application.materialReview} />
            </div>
          </div>
        </div>
      </DetailSection>
    </div>
  );

  return (
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-sm font-medium text-[#8a6b3e] hover:text-[#7F1D1D]" href="/admin/certification-applications">返回申请管理</Link>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/admin">返回后台首页</Link>
          <Link className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-center text-sm font-semibold text-ink" href="/">返回前台首页</Link>
        </div>
      </div>
      <section className="mt-6 rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Certification Detail</p>
            <h1 className="mt-3 font-serif text-3xl leading-tight text-porcelain sm:text-4xl">认证申请详情</h1>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="break-all rounded-xl border border-[#e4ded0] bg-[#fbf8ef] px-4 py-3 text-base font-semibold text-[#7F1D1D]">申请编号：{application.applicationNo}</p>
              <CopyButton label="复制申请编号" text={application.applicationNo} />
              <span className="rounded-full bg-[#7F1D1D] px-4 py-2 text-sm font-semibold text-white">{formatCertificationApplicationStatus(application)}</span>
              <a className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-sm font-semibold text-ink" href={`/api/admin/certification-applications/${application.id}/export`}>
                下载本申请资料
              </a>
            </div>
          </div>
          <div className="w-full max-w-[520px] justify-self-start rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5 text-left text-sm leading-7 text-[#5f5b52] lg:justify-self-end">
            <div className="grid gap-3">
              <HeaderInfoItem label="提交时间" value={formatDateTime(application.createdAt)} />
              <HeaderInfoItem label="申请人" value={application.applicantName} />
              <HeaderInfoItem label="邮箱 / 手机号" value={`${application.email} / ${application.phone}`} />
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="申请编号" value={application.applicationNo} />
          <SummaryItem label="申请人" value={application.applicantName} />
          <SummaryItem href="#review-processing" label="当前审核状态" value={formatCertificationApplicationStatus(application)} />
          <SummaryItem href="#certificate-status" label="证书编号" value={certificate?.certificateNo || "尚未生成"} />
          <SummaryItem href="#approved-info" label="传承体系" value={formatCertificationPath(application.certificationPath)} />
          <SummaryItem href="#approved-info" label="申报认证等级" value={formatCertificationLevel(application.requestedLevel)} />
          <SummaryItem href="#approved-info" label="核定传承体系" value={formatCertificationPath(application.approvedPath)} />
          <SummaryItem href="#approved-info" label="核定认证等级" value={formatCertificationLevel(application.approvedLevel)} />
          <SummaryItem href="#certificate-status" label="证书业务状态" value={certificate ? formatCertificateStatus(certificate) : "尚未生成"} />
          <SummaryItem href="#certificate-status" label="证书有效期" value={certificate ? formatCertificateValidity(certificate) : "有效期未设置"} />
          <SummaryItem href="#delivery-status" label="下发状态" value={application.deliveryStatus === "delivered" ? "已下发" : "未下发"} />
          <SummaryItem label="下发时间" value={application.deliveredAt ? formatDateTime(application.deliveredAt) : "未记录"} />
          <SummaryItem href="#material-review" label="材料审核状态" value={formatMaterialReviewSummary(application.materialReview)} />
        </div>
      </section>

      <div className="mt-8">
        <CertificationReviewForm
          applicationId={application.id}
          applicationNo={application.applicationNo}
          certificateNo={certificate?.certificateNo}
          currentStatusText={formatCertificationApplicationStatus(application)}
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
          auditRecords={<AuditRecords application={application} />}
          certificateMessage={certificateMessage}
          certificateStatusPanel={certificate ? <CertificateStatusForm applicationId={application.id} certificate={certificate} /> : null}
          certificateValidityText={certificate ? formatCertificateValidity(certificate) : ""}
          materialReviewWorkflow={materialReviewWorkflow}
        />
      </div>
      {certificate ? (
        <div className="mt-8">
          <FormalCertificatePreview application={application} certificate={certificate} certificatePdf={certificatePdf} hasCertificatePhoto={Boolean(certificatePhoto?.signedUrl || certificatePhoto?.storagePath)} verificationQrCode={certificateVerificationQrCode} verificationUrl={certificateVerificationUrl} />
        </div>
      ) : null}
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

function formatCertificateValidity(certificate: CertificateQueryResult) {
  if (!certificate.validFrom && !certificate.validUntil) return "有效期未设置";
  return `${formatDateOnly(certificate.validFrom)} - ${formatDateOnly(certificate.validUntil)}`;
}

function formatCertificateStatus(certificate: CertificateQueryResult) {
  return certificate.effectiveStatusLabel || certificateStatusText[certificate.effectiveStatus || certificate.status] || certificate.status;
}

function FormalCertificatePreview({
  application,
  certificate,
  certificatePdf,
  hasCertificatePhoto,
  verificationQrCode,
  verificationUrl
}: {
  application: CertificationApplicationAdminRecord;
  certificate: CertificateQueryResult;
  certificatePdf: CertificatePdfMetadata | null;
  hasCertificatePhoto: boolean;
  verificationQrCode: string;
  verificationUrl: string;
}) {
  const certificateHolderName = certificate.holderName || application.applicantName;
  const taoistName = certificate.taoistName || application.taoistName || "";
  const lineageOrTemple = certificate.lineageOrTemple || [application.sect, application.lineage, application.templeOrOrganization].filter(Boolean).join(" / ");
  const status = formatCertificateStatus(certificate);
  const validity = formatCertificateValidity(certificate);
  const certificationPath = certificate.certificationPath ? certificationPathLabels[certificate.certificationPath] : formatCertificationPath(application.approvedPath);

  return (
    <section className="scroll-mt-6" id="formal-certificate-preview">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Formal Certificate Preview</p>
          <h2 className="mt-2 font-serif text-3xl text-porcelain">正式证书预览</h2>
        </div>
        <div className="grid gap-3 sm:justify-items-end">
          <form action={`/api/admin/certification-applications/${application.id}/certificate-pdf`} method="post" target="_blank">
            <button className="rounded-full bg-[#7F1D1D] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919]" type="submit">
              生成 / 预览 PDF
            </button>
          </form>
          {certificatePdf?.hasPdf ? (
            <a className="rounded-full border border-[#d8d0bf] bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-[#7F1D1D] hover:text-[#7F1D1D]" href={`/api/admin/certification-applications/${application.id}/certificate-pdf`} target="_blank" rel="noreferrer">
              下载已生成 PDF
            </a>
          ) : null}
          <p className="max-w-xl text-sm leading-7 text-[#5f5b52]">本预览使用已生成证书记录渲染，用于后台核对正式版式；PDF 生成后写入私有 Storage，并仅向后台或已完成本人校验的申请人开放下载。</p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl border border-[#e4ded0] bg-white/82 p-4 text-sm leading-7 text-[#5f5b52] sm:grid-cols-4">
        <CertificatePdfStatusItem label="PDF 状态" value={formatCertificatePdfStatus(certificatePdf)} />
        <CertificatePdfStatusItem label="PDF 版本" value={certificatePdf?.version ? `v${certificatePdf.version}` : "未生成"} />
        <CertificatePdfStatusItem label="生成时间" value={certificatePdf?.generatedAt ? formatDateTime(certificatePdf.generatedAt) : "未记录"} />
        <CertificatePdfStatusItem label="文件大小" value={formatFileSize(certificatePdf?.fileSize)} />
      </div>

      <div className="border border-[#cdbf9f] bg-[#f7f0df] p-3 shadow-[0_22px_70px_rgba(39,51,49,0.13)] sm:p-5">
        <article className="relative overflow-hidden border border-[#a98a52] bg-[#fffdf7] px-6 py-8 text-[#273331] sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute inset-4 border border-[#d9c99c]" />
          <div className="pointer-events-none absolute inset-8 border border-[#efe4c8]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#eadfbe] opacity-60" />

          <div className="relative z-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#8a6b3e]">ITCA Official Certificate</p>
            <h3 className="mt-4 font-serif text-3xl leading-tight text-[#273331] sm:text-5xl">国际道教与文化协会</h3>
            <p className="mt-3 text-sm uppercase tracking-[0.18em] text-[#6f6252]">International Taoisme And Cultural Association</p>
            <div className="mx-auto mt-5 h-px w-48 bg-[#b08a45]" />
            <p className="mt-5 font-serif text-2xl text-[#7F1D1D] sm:text-3xl">道士资格认证证书</p>
          </div>

          <div className="relative z-10 mt-10 grid gap-8 lg:grid-cols-[12rem_1fr] lg:items-start">
            <div className="border border-[#d8d0bf] bg-[#fbf8ef] p-3 text-center">
              <p className="mb-3 text-xs tracking-[0.18em] text-[#8a6b3e]">证书照片</p>
              {hasCertificatePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- Admin-only proxy avoids exposing Supabase Storage paths in certificate preview HTML.
                <img alt="证书照片" className="mx-auto max-h-60 w-full bg-white object-contain" src={`/api/admin/certification-applications/${application.id}/certificate-photo`} />
              ) : (
                <div className="grid min-h-56 place-items-center border border-dashed border-[#cdbf9f] bg-white px-4 text-xs leading-6 text-[#8a6b3e]">未记录证书照片</div>
              )}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <CertificatePreviewField label="证书编号" value={certificate.certificateNo} />
                <CertificatePreviewField label="证书状态" value={status} />
                <CertificatePreviewField label="持证人姓名" value={certificateHolderName} />
                <CertificatePreviewField label="道名 / 法名" value={taoistName || "未记录"} />
                <CertificatePreviewField label="认证路径" value={certificationPath} />
                <CertificatePreviewField label="认证等级" value={certificate.certificationLevel || "未记录"} />
                <CertificatePreviewField className="sm:col-span-2" label="传承 / 宫观 / 机构信息" value={lineageOrTemple || "未记录"} />
                <CertificatePreviewField label="签发日期" value={formatDateOnly(certificate.issuedDate)} />
                <CertificatePreviewField label="有效期" value={validity} />
              </div>

              <div className="mt-2 border-l-4 border-[#7F1D1D] bg-[#fbf8ef] px-4 py-3 text-sm leading-7 text-[#5f5b52]">
                核验提示：请访问 ITCA 官网证书核验页面，使用证书编号与持证人姓名共同核验。本证书 PDF 仅供持证人与授权场景使用，公开核验以官网实时结果为准；公众页面不提供 PDF 下载。
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 grid gap-6 sm:grid-cols-[11rem_1fr_1fr] sm:items-end">
            <div className="grid gap-2 border border-[#b08a45] bg-[#fbf8ef] p-3 text-center text-xs leading-6 text-[#8a6b3e]">
              {verificationQrCode ? (
                // eslint-disable-next-line @next/next/no-img-element -- Server-generated data URL contains only the public certificate query URL.
                <img alt="证书核验二维码" className="mx-auto h-28 w-28" src={verificationQrCode} />
              ) : null}
              <span>扫码进入官网核验</span>
              <span className="break-all text-[10px] leading-4 text-[#5f5b52]">{verificationUrl}</span>
            </div>
            <div className="border-t border-[#8a6b3e] pt-3 text-center">
              <p className="font-serif text-lg text-[#273331]">签发人</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8a6b3e]">Authorized Signatory</p>
            </div>
            <div className="border-t border-[#8a6b3e] pt-3 text-center">
              <p className="font-serif text-lg text-[#273331]">协会签章</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8a6b3e]">Official Seal</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function CertificatePdfStatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs tracking-[0.18em] text-[#8a6b3e]">{label}</p>
      <p className="mt-1 font-medium text-porcelain">{value}</p>
    </div>
  );
}

function formatCertificatePdfStatus(metadata: CertificatePdfMetadata | null) {
  if (!metadata) return "字段未配置或未生成";
  if (metadata.status === "generated" && metadata.hasPdf) return "已生成";
  if (metadata.status === "failed") return "生成失败";
  return "未生成";
}

function formatFileSize(value?: number | null) {
  if (!value) return "未记录";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function CertificatePreviewField({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={`border-b border-[#d8d0bf] pb-3 ${className}`}>
      <p className="text-xs tracking-[0.2em] text-[#8a6b3e]">{label}</p>
      <p className="mt-1 break-words font-serif text-xl leading-8 text-[#273331]">{value}</p>
    </div>
  );
}

function formatDateOnly(value?: string | null) {
  if (!value) return "有效期未设置";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[1]}/${match[2]}/${match[3]}`;
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

function AttachmentGroup({ attachments, className = "", title }: { attachments: CertificationAttachment[]; className?: string; title: string }) {
  return (
    <div className={`rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-5 ${className}`}>
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

function DetailSection({ children, id, title }: { children: ReactNode; id?: string; title: string }) {
  return (
    <section className="scroll-mt-6 rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-7" id={id}>
      <h2 className="font-serif text-2xl text-porcelain">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function SummaryItem({ href, label, value }: { href?: string; label: string; value: string }) {
  const content = (
    <>
      <p className="text-xs tracking-[0.18em] text-[#8a6b3e]">{label}</p>
      <p className="mt-2 break-all text-sm font-medium leading-6 text-porcelain">{value}</p>
    </>
  );

  if (href) {
    return (
      <a className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] px-4 py-3 transition hover:border-[#8a6b3e] hover:bg-white" href={href}>
        {content}
      </a>
    );
  }

  return (
    <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] px-4 py-3">
      {content}
    </div>
  );
}

function HeaderInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-3">
      <span className="text-xs tracking-[0.18em] text-[#8a6b3e]">{label}</span>
      <span className="break-words text-sm font-medium text-porcelain">{value}</span>
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

function SupplementalRecords({
  applicationId,
  materialReview,
  reviewDisabled,
  submissions
}: {
  applicationId: string;
  materialReview: MaterialReview;
  reviewDisabled: boolean;
  submissions: Array<CertificationApplicationAdminRecord["supplementalSubmissions"][number]>;
}) {
  return (
    <section className="scroll-mt-6 rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-7" id="supplement-detail">
      <h2 className="font-serif text-2xl text-porcelain">补充 / 修改请求</h2>
      {submissions.length === 0 ? <p className="mt-4 text-sm leading-7 text-[#666666]">未提交补充请求。</p> : null}
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
      <div className="mt-5">
        <MaterialReviewField applicationId={applicationId} disabled={reviewDisabled} disabledReason={reviewDisabled ? "请先完成上一项资料审核" : undefined} itemKey="international" label="补充 / 修改请求" materialReview={materialReview} />
      </div>
    </section>
  );
}

function AuditRecords({ application }: { application: CertificationApplicationAdminRecord }) {
  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white p-5" id="review-records">
      <h3 className="font-serif text-2xl text-porcelain">审核记录</h3>
      <div className="mt-5 grid gap-4">
        <DetailItem label="后台审核备注" value={application.internalReviewNote || "暂无后台审核备注"} />
        <DetailItem label="对申请人反馈" value={application.applicantFeedback || "暂无反馈"} />
        <DetailItem label="认证委员会审核意见" value={application.committeeReviewNote || "暂无意见"} />
        <DetailItem label="证书项目备注" value={application.reviewNote || "暂无备注"} />
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

function formatMaterialReviewSummary(materialReview: CertificationApplicationAdminRecord["materialReview"]) {
  const values = Object.values(materialReview);
  if (values.every((status) => status === "passed")) return "全部通过";
  if (values.some((status) => status === "questionable")) return "存在不通过";
  if (values.some((status) => status === "need_more_info")) return "需补充资料";
  if (values.some((status) => status === "pending")) return "仍有未审核";
  return "已逐项处理";
}
