import { NextResponse } from "next/server";
import { adminSessionCookieName, getAdminSession } from "@/lib/admin/auth";
import { requireAdminApiPermission } from "@/lib/admin/require-admin";
import { SupabaseConfigError, SupabaseRequestError, updateCertificationRecordDisposition } from "@/lib/supabase/server";
import type { CertificationRecordDisposition } from "@/types/certification";

const validDispositions: CertificationRecordDisposition[] = ["normal", "test", "archived", "voided"];

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminApiPermission(request, "certification:write");
  if (auth.response) return auth.response;
  const adminCookie = getAdminCookie(request);

  let body: { recordDisposition?: CertificationRecordDisposition; recordDispositionNote?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "更新资料格式不正确。" }, { status: 400 });
  }

  if (!body.recordDisposition || !validDispositions.includes(body.recordDisposition)) {
    return NextResponse.json({ success: false, message: "请选择有效的记录类型。" }, { status: 400 });
  }

  const actor = getAdminSession(adminCookie) || undefined;

  try {
    const application = await updateCertificationRecordDisposition(params.id, {
      recordDisposition: body.recordDisposition,
      recordDispositionNote: body.recordDispositionNote?.trim() || "",
      actorEmail: actor?.email || "",
      actorName: actor?.displayName || "",
      actorRole: actor?.role || "",
      actorType: actor?.actorType || "legacy_admin",
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") || ""
    });

    if (!application) {
      return NextResponse.json({ success: false, message: "未找到认证申请。" }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    if (error instanceof SupabaseConfigError) return NextResponse.json({ success: false, message: "记录治理服务尚未完成系统配置，请联系网站管理员处理。" }, { status: 500 });
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: "无法保存记录治理状态，请稍后重试。" }, { status: 500 });
    return NextResponse.json({ success: false, message: "记录治理保存服务暂时不可用。" }, { status: 500 });
  }
}
