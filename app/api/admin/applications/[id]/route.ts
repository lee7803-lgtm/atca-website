import { NextResponse } from "next/server";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { getApplicationById, SupabaseConfigError, SupabaseRequestError, updateApplicationReview } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/application";

const validStatuses: ApplicationStatus[] = ["submitted", "pending_review", "need_more_info", "approved", "rejected", "archived"];

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
      return NextResponse.json({ success: false, message: `数据库配置缺失：${error.missing.join(", ")}。` }, { status: 500 });
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

  try {
    const application = await updateApplicationReview(params.id, {
      status: body.status,
      adminNote: body.adminNote?.trim() || ""
    });

    if (!application) {
      return NextResponse.json({ success: false, message: "未找到申请记录。" }, { status: 404 });
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json({ success: false, message: `数据库配置缺失：${error.missing.join(", ")}。` }, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      return NextResponse.json({ success: false, message: "无法保存审核结果，请稍后重试。" }, { status: 500 });
    }

    return NextResponse.json({ success: false, message: "审核保存服务暂时不可用。" }, { status: 500 });
  }
}
