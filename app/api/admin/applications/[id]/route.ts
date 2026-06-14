import { NextResponse } from "next/server";
import { adminSessionCookieName, getAdminSession } from "@/lib/admin/auth";
import { requireAdminApiPermission } from "@/lib/admin/require-admin";
import { AdminApiRequestError, AdminApiUnauthorizedError, updateAdminApplicationAdminNote, updateAdminApplicationReview } from "@/lib/api/admin-applications";
import { recordMemberApplicationReviewNotification } from "@/lib/notifications/workflows";
import { getApplicationById, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/application";

const validStatuses: ApplicationStatus[] = ["submitted", "pending_review", "under_review", "need_more_info", "approved", "rejected", "archived"];

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminApiPermission(request, "applications:read");
  if (auth.response) return auth.response;

  try {
    const application = await getApplicationById(params.id);

    if (!application) {
      return NextResponse.json({ success: false, message: "未找到申请记录。" }, { status: 404 });
    }
    return NextResponse.json({ success: true, application });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json({ success: false, message: "会员申请详情服务尚未完成系统配置，请联系网站管理员处理。" }, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      return NextResponse.json({ success: false, message: "无法读取申请详情，请稍后重试。" }, { status: 500 });
    }

    return NextResponse.json({ success: false, message: "申请详情服务暂时不可用。" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = requireAdminApiPermission(request, "applications:write");
  if (auth.response) return auth.response;
  const adminCookie = getAdminCookie(request);

  let body: { action?: "update_member_material_review"; status?: ApplicationStatus; adminNote?: string };

  try {
    body = (await request.json()) as { action?: "update_member_material_review"; status?: ApplicationStatus; adminNote?: string };
  } catch {
    return NextResponse.json({ success: false, message: "更新资料格式不正确。" }, { status: 400 });
  }

  if (body.action === "update_member_material_review") {
    try {
      const actor = getAdminSession(adminCookie) || undefined;
      const application = await updateAdminApplicationAdminNote(params.id, {
        adminNote: body.adminNote?.trim() || "",
        actor,
        ipAddress: getRequestIp(request),
        userAgent: request.headers.get("user-agent") || ""
      });

      if (!application) {
        return NextResponse.json({ success: false, message: "未找到申请记录。" }, { status: 404 });
      }

      return NextResponse.json({ success: true, application });
    } catch (error) {
      if (error instanceof AdminApiUnauthorizedError) {
        return unauthorized();
      }

      if (error instanceof AdminApiRequestError) {
        return NextResponse.json({ success: false, message: error.message }, { status: error.status });
      }

      if (error instanceof SupabaseConfigError) {
        return NextResponse.json({ success: false, message: "会员资料审核服务尚未完成系统配置，请联系网站管理员处理。" }, { status: 500 });
      }

      if (error instanceof SupabaseRequestError) {
        return NextResponse.json({ success: false, message: `无法保存资料审核记录（后端状态 ${error.status}），请稍后重试或联系网站管理员。` }, { status: 500 });
      }

      return NextResponse.json({ success: false, message: "资料审核保存服务暂时不可用，请确认后台 API 与数据库配置。" }, { status: 500 });
    }
  }

  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json({ success: false, message: "请选择有效的申请状态。" }, { status: 400 });
  }
  if (body.status === "need_more_info" && !body.adminNote?.trim()) {
    return NextResponse.json({ success: false, message: "请填写需要申请人补充或修正的资料说明。" }, { status: 400 });
  }

  try {
    const application = await updateAdminApplicationReview(params.id, {
      status: body.status,
      adminNote: body.adminNote?.trim() || "",
      actor: getAdminSession(adminCookie) || undefined,
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get("user-agent") || ""
    });

    if (!application) {
      return NextResponse.json({ success: false, message: "未找到申请记录。" }, { status: 404 });
    }
    const notificationApplication = await getApplicationById(params.id).catch(() => null);
    if (notificationApplication) await recordMemberApplicationReviewNotification(notificationApplication, body.status);

    return NextResponse.json({ success: true, application });
  } catch (error) {
    if (error instanceof AdminApiUnauthorizedError) {
      return unauthorized();
    }

    if (error instanceof AdminApiRequestError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseConfigError) {
      return NextResponse.json({ success: false, message: "会员申请审核服务尚未完成系统配置，请联系网站管理员处理。" }, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      return NextResponse.json({ success: false, message: "无法保存审核结果，请稍后重试。" }, { status: 500 });
    }

    return NextResponse.json({ success: false, message: "审核保存服务暂时不可用。" }, { status: 500 });
  }
}
