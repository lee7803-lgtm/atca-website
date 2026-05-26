import { NextResponse } from "next/server";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { AdminApiRequestError, AdminApiUnauthorizedError, updateAdminApplicationReview } from "@/lib/api/admin-applications";
import { getApplicationById, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/application";

const validStatuses: ApplicationStatus[] = ["submitted", "pending_review", "under_review", "need_more_info", "approved", "rejected", "archived"];

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!isValidAdminSessionToken(getAdminCookie(request))) return unauthorized();

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
  if (!isValidAdminSessionToken(getAdminCookie(request))) return unauthorized();

  let body: { status?: ApplicationStatus; adminNote?: string };

  try {
    body = (await request.json()) as { status?: ApplicationStatus; adminNote?: string };
  } catch {
    return NextResponse.json({ success: false, message: "更新资料格式不正确。" }, { status: 400 });
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
      adminNote: body.adminNote?.trim() || ""
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
      return NextResponse.json({ success: false, message: "会员申请审核服务尚未完成系统配置，请联系网站管理员处理。" }, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      return NextResponse.json({ success: false, message: "无法保存审核结果，请稍后重试。" }, { status: 500 });
    }

    return NextResponse.json({ success: false, message: "审核保存服务暂时不可用。" }, { status: 500 });
  }
}
