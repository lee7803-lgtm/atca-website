import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { adminSessionCookieName, getAdminSession, isValidAdminSessionToken } from "@/lib/admin/auth";
import { CertificatePdfFontError, generateCertificatePdf } from "@/lib/certificates/pdf";
import {
  buildCertificatePdfStoragePath,
  createCertificationAttachmentSignedUrl,
  findCertificateByApplicationId,
  findCertificatePdfMetadataByApplicationId,
  findCertificatePdfStorageByApplicationId,
  getCertificationApplicationById,
  isSupabaseSchemaError,
  markCertificatePdfDownloadedByApplicationId,
  readCertificatePdfObject,
  SupabaseConfigError,
  SupabaseRequestError,
  updateCertificatePdfMetadata,
  uploadCertificatePdf
} from "@/lib/supabase/server";

export const runtime = "nodejs";

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

async function getCertificatePhoto(application: Awaited<ReturnType<typeof getCertificationApplicationById>>) {
  if (!application) return null;
  const storagePath = application.certificatePhotoPath || application.supportingDocuments.find((attachment) => attachment.fieldName === "photo" && attachment.storagePath)?.storagePath || "";
  if (!storagePath) return null;

  const signedUrl = await createCertificationAttachmentSignedUrl(storagePath, 300);
  const response = await fetch(signedUrl, { cache: "no-store" });
  if (!response.ok) return null;

  return {
    data: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "application/octet-stream"
  };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const adminCookie = getAdminCookie(request);
  if (!isValidAdminSessionToken(adminCookie)) return unauthorized();

  try {
    const application = await getCertificationApplicationById(params.id);
    if (!application) return NextResponse.json({ success: false, message: "未找到认证申请。" }, { status: 404 });

    const certificate = await findCertificateByApplicationId(params.id);
    if (!certificate) return NextResponse.json({ success: false, message: "请先生成证书记录后再生成正式证书 PDF。" }, { status: 400 });

    const existingPdf = await findCertificatePdfMetadataByApplicationId(params.id);
    const nextVersion = (existingPdf?.version || 0) + 1;
    const photo = await getCertificatePhoto(application);
    const pdf = await generateCertificatePdf({ application, certificate, photo });
    const storagePath = buildCertificatePdfStoragePath(certificate.certificateNo, nextVersion);
    await uploadCertificatePdf(storagePath, pdf);

    const generatedAt = new Date().toISOString();
    const actor = getAdminSession(adminCookie);
    await updateCertificatePdfMetadata(params.id, {
      storagePath,
      generatedAt,
      generatedBy: actor?.email || actor?.displayName || "legacy_admin",
      version: nextVersion,
      sha256: createHash("sha256").update(pdf).digest("hex"),
      fileSize: pdf.length,
      status: "generated"
    });

    const filename = `${certificate.certificateNo}.pdf`;

    return new NextResponse(pdf, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Type": "application/pdf"
      }
    });
  } catch (error) {
    console.error("Certificate PDF generation failed", error);
    if (error instanceof SupabaseConfigError) return NextResponse.json({ success: false, message: "证书 PDF 生成服务尚未完成系统配置。" }, { status: 500 });
    if (isSupabaseSchemaError(error)) return NextResponse.json({ success: false, message: "证书 PDF 存储字段尚未完成数据库配置，请先执行 PDF 存储 SQL。" }, { status: 500 });
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: "证书 PDF 生成服务暂时无法读取证书资料。" }, { status: 502 });
    if (error instanceof CertificatePdfFontError) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: false, message: "证书 PDF 生成失败，请稍后重试。" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!isValidAdminSessionToken(getAdminCookie(request))) return unauthorized();

  try {
    const stored = await findCertificatePdfStorageByApplicationId(params.id);
    if (!stored) return NextResponse.json({ success: false, message: "尚未生成正式证书 PDF。" }, { status: 404 });

    const pdf = await readCertificatePdfObject(stored.storagePath);
    await markCertificatePdfDownloadedByApplicationId(params.id);

    return new NextResponse(pdf, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${stored.certificateNo}.pdf"`,
        "Content-Type": "application/pdf"
      }
    });
  } catch (error) {
    console.error("Certificate PDF download failed", error);
    if (error instanceof SupabaseConfigError) return NextResponse.json({ success: false, message: "证书 PDF 下载服务尚未完成系统配置。" }, { status: 500 });
    if (isSupabaseSchemaError(error)) return NextResponse.json({ success: false, message: "证书 PDF 存储字段尚未完成数据库配置，请先执行 PDF 存储 SQL。" }, { status: 500 });
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: "证书 PDF 暂时无法读取。" }, { status: 502 });
    return NextResponse.json({ success: false, message: "证书 PDF 下载失败，请稍后重试。" }, { status: 500 });
  }
}
