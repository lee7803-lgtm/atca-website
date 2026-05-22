import { NextResponse } from "next/server";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { findCertificateByApplicationId, getCertificationApplicationById, isSupabaseSchemaError, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import { formatCertificationApplicationStatus, formatSupplementStatusChange } from "@/lib/status-labels";
import { materialReviewItemLabels, materialReviewStatusLabels, type CertificationAttachment } from "@/types/certification";

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function escapeHtml(value: string | number | boolean | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTime(value?: string | null) {
  if (!value) return "未记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function field(label: string, value: string | number | boolean | null | undefined) {
  return `<div class="field"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "未填写")}</dd></div>`;
}

function section(title: string, content: string) {
  return `<section><h2>${escapeHtml(title)}</h2><div class="grid">${content}</div></section>`;
}

function attachmentRows(attachments: CertificationAttachment[]) {
  if (attachments.length === 0) return `<tr><td colspan="6">未提交附件</td></tr>`;
  return attachments
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.originalName)}</td>
        <td>${escapeHtml(formatAttachmentFieldName(item.fieldName))}</td>
        <td>${escapeHtml(item.mimeType || "未记录")}</td>
        <td>${escapeHtml(item.size ? `${Math.round(item.size / 1024)} KB` : "未记录")}</td>
        <td>${escapeHtml(formatDateTime(item.uploadedAt))}</td>
        <td>${escapeHtml(item.source === "supplement" ? "是" : "否")}</td>
      </tr>`
    )
    .join("");
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
    photo: "道装证件照"
  };
  return labels[fieldName] || "申请证明材料";
}

function materialReviewFields(materialReview: Record<string, string>) {
  return Object.entries(materialReviewItemLabels)
    .map(([key, label]) => field(label, materialReviewStatusLabels[materialReview[key] as keyof typeof materialReviewStatusLabels] || "待审核"))
    .join("");
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!isValidAdminSessionToken(getAdminCookie(request))) {
    return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
  }

  try {
    const application = await getCertificationApplicationById(params.id);
    if (!application) return NextResponse.json({ success: false, message: "未找到认证申请。" }, { status: 404 });

    let certificateNo = "尚未生成";
    try {
      const certificate = await findCertificateByApplicationId(params.id);
      if (certificate?.certificateNo) certificateNo = certificate.certificateNo;
    } catch (error) {
      if (!isSupabaseSchemaError(error)) throw error;
    }

    const allAttachments = [...application.existingCertificates, ...application.supportingDocuments];
    const supplementalContent = application.supplementalSubmissions.length
      ? application.supplementalSubmissions
          .map(
            (item) => `<article class="record">
              <p><strong>提交时间：</strong>${escapeHtml(formatDateTime(item.submittedAt))}</p>
              <p><strong>提交联系方式：</strong>${escapeHtml(item.contact || "未记录")}</p>
              <p><strong>状态变化：</strong>${escapeHtml(formatSupplementStatusChange(item.previousStatus, item.nextStatus))}</p>
              <p><strong>补充说明：</strong>${escapeHtml(item.note || "未填写")}</p>
              <p><strong>修改字段：</strong>${escapeHtml(item.changedFields.map((fieldItem) => `${fieldItem.field}：${fieldItem.oldValue || "未填写"} → ${fieldItem.newValue || "已更新"}`).join("；") || "未记录")}</p>
              <p><strong>补充文件：</strong>${escapeHtml(item.files.map((file) => `${file.originalName}（${formatAttachmentFieldName(file.fieldName)}）`).join("；") || "未上传文件")}</p>
            </article>`
          )
          .join("")
      : "<p>暂无补充 / 修改记录。</p>";

    const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(`ITCA-认证申请-${application.applicationNo}-${application.applicantName}`)}</title>
  <style>
    body { margin: 0; padding: 32px; color: #273331; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fffdf8; }
    h1, h2 { font-family: Georgia, "Times New Roman", serif; color: #273331; }
    h1 { margin: 0 0 8px; font-size: 30px; }
    h2 { margin: 0 0 16px; font-size: 22px; }
    .meta { margin: 0 0 28px; color: #6b6257; }
    section { margin: 0 0 20px; padding: 20px; border: 1px solid #e4ded0; border-radius: 12px; background: #fff; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; }
    .field { border-bottom: 1px solid #eee7da; padding-bottom: 10px; }
    dt { color: #8a6b3e; font-size: 12px; letter-spacing: .08em; }
    dd { margin: 6px 0 0; white-space: pre-wrap; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e4ded0; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #fbf8ef; color: #5f5b52; }
    .record { margin: 0 0 12px; padding: 12px; border: 1px solid #e4ded0; border-radius: 10px; background: #fbf8ef; }
    @media print { body { background: #fff; padding: 18mm; } section { break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>ITCA 认证申请资料</h1>
  <p class="meta">导出时间：${escapeHtml(formatDateTime(new Date().toISOString()))}</p>
  ${section("申请概览", field("申请编号", application.applicationNo) + field("当前状态", formatCertificationApplicationStatus(application)) + field("证书编号", certificateNo) + field("下发状态", application.deliveryStatus === "delivered" ? "已下发" : "未下发") + field("下发时间", formatDateTime(application.deliveredAt)))}
  ${section("基本身份资料", field("姓名", application.applicantName) + field("英文名 / 拼音", application.applicantNameEn) + field("道名 / 法名", application.taoistName) + field("性别", application.gender) + field("出生日期", application.birthDate) + field("国籍", application.nationality) + field("现居地", application.residence))}
  ${section("联系方式", field("手机 / WhatsApp", application.phone) + field("邮箱", application.email) + field("地址", application.address))}
  ${section("师承 / 传承信息", field("师父姓名", application.masterName) + field("师父道名 / 法名", application.masterTaoistName) + field("传承体系", application.lineage) + field("宫观 / 机构", application.templeOrOrganization) + field("师承或传承说明", application.sect) + field("修行年限", application.practiceYears))}
  ${section("推荐人信息", field("推荐人姓名", application.recommenderName) + field("推荐人联系方式", application.recommenderContact) + field("推荐关系 / 推荐说明", application.recommenderRelation))}
  ${section("经历与申请理由", field("经历说明", application.experienceSummary) + field("申请理由", application.applicationReason) + field("补充备注", application.additionalNote))}
  ${section("声明与确认", field("资料真实性确认", application.declarationAccepted ? "已确认" : "未确认") + field("资料使用确认", application.dataUseAccepted ? "已确认" : "未确认") + field("证书核验信息公开确认", application.certificatePublicAccepted ? "已确认" : "未确认") + field("服务条款确认", application.termsAccepted ? "已确认" : "未确认") + field("隐私政策确认", application.privacyAccepted ? "已确认" : "未确认"))}
  ${section("审核记录", field("后台审核备注", application.internalReviewNote || "暂无") + field("对申请人反馈", application.applicantFeedback || "暂无") + field("认证委员会审核意见", application.committeeReviewNote || "暂无") + field("证书项目备注", application.reviewNote || "暂无"))}
  ${section("材料审核状态", materialReviewFields(application.materialReview))}
  <section><h2>补充 / 修改记录</h2>${supplementalContent}</section>
  <section>
    <h2>上传材料清单</h2>
    <table>
      <thead><tr><th>文件名</th><th>材料类型</th><th>文件类型</th><th>大小</th><th>上传时间</th><th>是否补充提交</th></tr></thead>
      <tbody>${attachmentRows(allAttachments)}</tbody>
    </table>
  </section>
</body>
</html>`;

    const filename = encodeURIComponent(`ITCA-认证申请-${application.applicationNo}-${application.applicantName}.html`);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`
      }
    });
  } catch (error) {
    if (error instanceof SupabaseConfigError || isSupabaseSchemaError(error)) {
      return NextResponse.json({ success: false, message: "认证申请导出服务尚未完成系统配置。" }, { status: 500 });
    }
    if (error instanceof SupabaseRequestError) {
      return NextResponse.json({ success: false, message: "认证申请导出服务暂时无法访问数据库。" }, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    }
    return NextResponse.json({ success: false, message: "认证申请导出服务暂时不可用。" }, { status: 500 });
  }
}
