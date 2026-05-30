import { NextResponse } from "next/server";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { createCertificationAttachmentSignedUrl, getCertificationApplicationById, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!isValidAdminSessionToken(getAdminCookie(request))) return unauthorized();

  try {
    const application = await getCertificationApplicationById(params.id);
    if (!application) return NextResponse.json({ success: false, message: "未找到认证申请。" }, { status: 404 });

    const storagePath = application.certificatePhotoPath || application.supportingDocuments.find((attachment) => attachment.fieldName === "photo" && attachment.storagePath)?.storagePath || "";
    if (!storagePath) return NextResponse.json({ success: false, message: "未记录证书照片。" }, { status: 404 });

    const signedUrl = await createCertificationAttachmentSignedUrl(storagePath, 300);
    const response = await fetch(signedUrl, { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ success: false, message: "证书照片暂时无法读取。" }, { status: 502 });

    return new NextResponse(response.body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": response.headers.get("content-type") || "application/octet-stream"
      }
    });
  } catch (error) {
    if (error instanceof SupabaseConfigError) return NextResponse.json({ success: false, message: "证书照片服务尚未完成系统配置。" }, { status: 500 });
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: "证书照片暂时无法读取。" }, { status: 502 });
    return NextResponse.json({ success: false, message: "证书照片服务暂时不可用。" }, { status: 500 });
  }
}
