import { NextResponse } from "next/server";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { generateCertificatePdf } from "@/lib/certificates/pdf";
import {
  createCertificationAttachmentSignedUrl,
  findCertificateByApplicationId,
  getCertificationApplicationById,
  SupabaseConfigError,
  SupabaseRequestError
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
  if (!isValidAdminSessionToken(getAdminCookie(request))) return unauthorized();

  try {
    const application = await getCertificationApplicationById(params.id);
    if (!application) return NextResponse.json({ success: false, message: "未找到认证申请。" }, { status: 404 });

    const certificate = await findCertificateByApplicationId(params.id);
    if (!certificate) return NextResponse.json({ success: false, message: "请先生成证书记录后再生成正式证书 PDF。" }, { status: 400 });

    const photo = await getCertificatePhoto(application);
    const pdf = await generateCertificatePdf({ application, certificate, photo });
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
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: "证书 PDF 生成服务暂时无法读取证书资料。" }, { status: 502 });
    return NextResponse.json({ success: false, message: "证书 PDF 生成失败，请稍后重试。" }, { status: 500 });
  }
}
