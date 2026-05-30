import fs from "node:fs";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { certificationPathLabels, type CertificateQueryResult, type CertificationApplicationAdminRecord, type CertificationAttachment } from "@/types/certification";

type CertificatePdfPhoto = {
  data: Buffer;
  contentType: string;
} | null;

export type CertificatePdfInput = {
  application: CertificationApplicationAdminRecord;
  certificate: CertificateQueryResult;
  photo: CertificatePdfPhoto;
};

const cjkFontCandidates = [
  process.env.ITCA_CERTIFICATE_PDF_FONT_PATH || "",
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
  "/Library/Fonts/Arial Unicode.ttf"
].filter(Boolean);

function findCjkFontPath() {
  return cjkFontCandidates.find((path) => fs.existsSync(path)) || "";
}

function formatDateOnly(value?: string | null) {
  if (!value) return "未设置";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[1]}/${match[2]}/${match[3]}`;
}

function formatValidity(certificate: CertificateQueryResult) {
  if (!certificate.validFrom && !certificate.validUntil) return "有效期未设置";
  return `${formatDateOnly(certificate.validFrom)} - ${formatDateOnly(certificate.validUntil)}`;
}

function formatStatus(certificate: CertificateQueryResult) {
  const statusText: Record<string, string> = {
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

  return certificate.effectiveStatusLabel || statusText[certificate.effectiveStatus || certificate.status] || certificate.status;
}

function buildLineageOrTemple(application: CertificationApplicationAdminRecord, certificate: CertificateQueryResult) {
  return certificate.lineageOrTemple || [application.sect, application.lineage, application.templeOrOrganization].filter(Boolean).join(" / ");
}

function buildCertificationPath(application: CertificationApplicationAdminRecord, certificate: CertificateQueryResult) {
  if (certificate.certificationPath) return certificationPathLabels[certificate.certificationPath];
  return application.approvedPath ? certificationPathLabels[application.approvedPath] : "未记录";
}

function collectPdf(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function drawField(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number) {
  doc.fillColor("#8a6b3e").fontSize(8).text(label, x, y, { width, characterSpacing: 1.2 });
  doc.fillColor("#273331").fontSize(13).text(value || "未记录", x, y + 15, { width, lineGap: 2 });
}

export async function generateCertificatePdf({ application, certificate, photo }: CertificatePdfInput) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: {
      Title: `ITCA Certificate ${certificate.certificateNo}`,
      Author: "ITCA / 国际道教与文化协会",
      Subject: "Formal certificate preview PDF"
    },
    compress: false
  });

  const cjkFontPath = findCjkFontPath();
  if (cjkFontPath) {
    doc.registerFont("ITCA-CJK", fs.readFileSync(cjkFontPath));
    doc.font("ITCA-CJK");
  } else {
    doc.font("Helvetica");
  }

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const holderName = certificate.holderName || application.applicantName;
  const taoistName = certificate.taoistName || application.taoistName || "";
  const lineageOrTemple = buildLineageOrTemple(application, certificate);
  const validity = formatValidity(certificate);
  const status = formatStatus(certificate);

  doc.rect(0, 0, pageWidth, pageHeight).fill("#fffdf7");
  doc.rect(28, 28, pageWidth - 56, pageHeight - 56).lineWidth(1).strokeColor("#a98a52").stroke();
  doc.rect(42, 42, pageWidth - 84, pageHeight - 84).lineWidth(0.6).strokeColor("#d9c99c").stroke();
  doc.circle(pageWidth / 2, pageHeight / 2, 116).lineWidth(0.45).strokeColor("#eadfbe").stroke();

  doc.fillColor("#8a6b3e").fontSize(9).text("ITCA OFFICIAL CERTIFICATE", 0, 72, { align: "center", characterSpacing: 2.8 });
  doc.fillColor("#273331").fontSize(28).text("国际道教与文化协会", 0, 96, { align: "center" });
  doc.fillColor("#6f6252").fontSize(9).text("International Taoisme And Cultural Association", 0, 135, { align: "center", characterSpacing: 1.2 });
  doc.moveTo(210, 160).lineTo(pageWidth - 210, 160).lineWidth(0.8).strokeColor("#b08a45").stroke();
  doc.fillColor("#7F1D1D").fontSize(22).text("道士资格认证证书", 0, 176, { align: "center" });

  const photoX = 72;
  const photoY = 238;
  const photoW = 128;
  const photoH = 176;
  doc.rect(photoX, photoY, photoW, photoH).fillAndStroke("#fbf8ef", "#d8d0bf");
  doc.fillColor("#8a6b3e").fontSize(8).text("证书照片", photoX, photoY + 12, { width: photoW, align: "center", characterSpacing: 1.2 });
  if (photo?.data) {
    try {
      doc.image(photo.data, photoX + 12, photoY + 34, { fit: [photoW - 24, photoH - 46], align: "center", valign: "center" });
    } catch {
      doc.fillColor("#8a6b3e").fontSize(9).text("照片暂无法嵌入", photoX + 14, photoY + 82, { width: photoW - 28, align: "center" });
    }
  } else {
    doc.rect(photoX + 14, photoY + 38, photoW - 28, photoH - 52).lineWidth(0.6).dash(4, { space: 4 }).strokeColor("#cdbf9f").stroke().undash();
    doc.fillColor("#8a6b3e").fontSize(9).text("未记录证书照片", photoX + 18, photoY + 90, { width: photoW - 36, align: "center" });
  }

  const fieldX = 230;
  const fieldY = 236;
  const colW = 140;
  const gap = 24;
  drawField(doc, "证书编号", certificate.certificateNo, fieldX, fieldY, colW + 18);
  drawField(doc, "证书状态", status, fieldX + colW + gap + 18, fieldY, colW);
  drawField(doc, "持证人姓名", holderName, fieldX, fieldY + 62, colW);
  drawField(doc, "道名 / 法名", taoistName || "未记录", fieldX + colW + gap + 18, fieldY + 62, colW);
  drawField(doc, "认证路径", buildCertificationPath(application, certificate), fieldX, fieldY + 124, colW);
  drawField(doc, "认证等级", certificate.certificationLevel || "未记录", fieldX + colW + gap + 18, fieldY + 124, colW);
  drawField(doc, "传承 / 宫观 / 机构信息", lineageOrTemple || "未记录", fieldX, fieldY + 186, colW * 2 + gap + 18);
  drawField(doc, "签发日期", formatDateOnly(certificate.issuedDate), fieldX, fieldY + 248, colW);
  drawField(doc, "有效期", validity, fieldX + colW + gap + 18, fieldY + 248, colW + 18);

  doc.rect(72, 560, pageWidth - 144, 64).fillAndStroke("#fbf8ef", "#e4ded0");
  doc.rect(72, 560, 4, 64).fill("#7F1D1D");
  doc.fillColor("#5f5b52").fontSize(10).text(
    "核验提示：本证书信息应以 ITCA 官网公开核验结果为准。公众核验需通过证书编号与持证人姓名共同验证；公众页面不提供 PDF 下载。本 PDF 暂保留二维码占位，二维码核验链接将在 V1.3 第 8.5 阶段处理。",
    88,
    574,
    { width: pageWidth - 176, lineGap: 4 }
  );

  doc.rect(72, 662, 92, 92).fillAndStroke("#fbf8ef", "#b08a45");
  doc.fillColor("#8a6b3e").fontSize(9).text("二维码占位\n8.5 接入核验链接", 83, 696, { width: 70, align: "center", lineGap: 5 });
  doc.moveTo(240, 720).lineTo(380, 720).lineWidth(0.8).strokeColor("#8a6b3e").stroke();
  doc.fillColor("#273331").fontSize(14).text("签发人", 240, 732, { width: 140, align: "center" });
  doc.fillColor("#8a6b3e").fontSize(8).text("Authorized Signatory", 240, 754, { width: 140, align: "center", characterSpacing: 1 });
  doc.moveTo(420, 720).lineTo(532, 720).lineWidth(0.8).strokeColor("#8a6b3e").stroke();
  doc.fillColor("#273331").fontSize(14).text("协会签章", 420, 732, { width: 112, align: "center" });
  doc.fillColor("#8a6b3e").fontSize(8).text("Official Seal", 420, 754, { width: 112, align: "center", characterSpacing: 1 });

  return collectPdf(doc);
}
