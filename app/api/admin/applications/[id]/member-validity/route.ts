import { NextResponse } from "next/server";
import { adminSessionCookieName, getAdminSession, isValidAdminSessionToken } from "@/lib/admin/auth";
import { AdminApiRequestError, AdminApiUnauthorizedError, updateAdminMemberValidity } from "@/lib/api/admin-applications";
import { SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";

const validMemberStatuses = ["active", "suspended", "revoked", "terminated"];
const validRenewalStatuses = ["none", "pending_renewal", "renewal_in_progress", "renewed"];

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

function isDateOnly(value?: string | null) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const adminCookie = getAdminCookie(request);
  if (!isValidAdminSessionToken(adminCookie)) return unauthorized();

  let body: {
    memberValidFrom?: string | null;
    memberValidUntil?: string | null;
    memberStatus?: string;
    memberRenewalStatus?: string;
    lastRenewedAt?: string | null;
    memberStatusNote?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "更新资料格式不正确。" }, { status: 400 });
  }

  const memberStatus = body.memberStatus?.trim() || "active";
  const memberRenewalStatus = body.memberRenewalStatus?.trim() || "none";
  if (!validMemberStatuses.includes(memberStatus)) {
    return NextResponse.json({ success: false, message: "请选择有效的会员状态。" }, { status: 400 });
  }

  if (!validRenewalStatuses.includes(memberRenewalStatus)) {
    return NextResponse.json({ success: false, message: "请选择有效的续期状态。" }, { status: 400 });
  }

  if (!isDateOnly(body.memberValidFrom) || !isDateOnly(body.memberValidUntil)) {
    return NextResponse.json({ success: false, message: "会员有效期日期格式不正确。" }, { status: 400 });
  }

  if (body.memberValidFrom && body.memberValidUntil && body.memberValidUntil < body.memberValidFrom) {
    return NextResponse.json({ success: false, message: "会员有效期截止日期不能早于开始日期。" }, { status: 400 });
  }

  try {
    const application = await updateAdminMemberValidity(params.id, {
      memberValidFrom: body.memberValidFrom || null,
      memberValidUntil: body.memberValidUntil || null,
      memberStatus,
      memberRenewalStatus,
      lastRenewedAt: body.lastRenewedAt || null,
      memberStatusNote: body.memberStatusNote?.trim() || "",
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
    if (error instanceof SupabaseConfigError) return NextResponse.json({ success: false, message: "会员有效期服务尚未完成系统配置，请联系网站管理员处理。" }, { status: 500 });
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: "无法保存会员有效期，请稍后重试。" }, { status: 500 });
    return NextResponse.json({ success: false, message: "会员有效期保存服务暂时不可用。" }, { status: 500 });
  }
}
