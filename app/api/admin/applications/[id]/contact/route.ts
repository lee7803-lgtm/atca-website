import { NextResponse } from "next/server";
import { adminSessionCookieName, getAdminSession } from "@/lib/admin/auth";
import { requireAdminApiPermission } from "@/lib/admin/require-admin";
import { AdminApiRequestError, AdminApiUnauthorizedError, updateAdminApplicationContact } from "@/lib/api/admin-applications";
import { SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminApiPermission(request, "applications:write");
  if (auth.response) return auth.response;
  const adminCookie = getAdminCookie(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "更新资料格式不正确。" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  try {
    const application = await updateAdminApplicationContact(params.id, {
      name: asString(payload.name),
      contactName: asString(payload.contactName),
      phone: asString(payload.phone),
      email: asString(payload.email),
      country: asString(payload.country),
      organizationType: asString(payload.organizationType),
      correctionNote: asString(payload.correctionNote),
      actor: getAdminSession(adminCookie) || undefined,
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") || ""
    });

    if (!application) {
      return NextResponse.json({ success: false, message: "未找到申请记录。" }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    if (error instanceof AdminApiUnauthorizedError) return unauthorized();
    if (error instanceof AdminApiRequestError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    if (error instanceof SupabaseConfigError) return NextResponse.json({ success: false, message: "联系方式修正服务尚未完成系统配置，请联系网站管理员处理。" }, { status: 500 });
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: error.message || "无法保存联系方式修正。" }, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    return NextResponse.json({ success: false, message: "联系方式修正服务暂时不可用。" }, { status: 500 });
  }
}
