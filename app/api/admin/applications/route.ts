import { NextResponse } from "next/server";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import { listApplications, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import type { ApplicationStatus, ApplicationType } from "@/types/application";

const validTypes: ApplicationType[] = ["personal_member", "organization_member"];
const validStatuses: ApplicationStatus[] = ["submitted", "pending_review", "under_review", "need_more_info", "approved", "rejected", "archived"];

export async function GET(request: Request) {
  const session = request instanceof Request ? request.headers.get("cookie") : "";
  const cookieValue = session?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];

  if (!isValidAdminSessionToken(cookieValue)) {
    return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const applicationType = searchParams.get("applicationType") as ApplicationType | null;
  const status = searchParams.get("status") as ApplicationStatus | null;

  try {
    const applications = await listApplications({
      applicationType: applicationType && validTypes.includes(applicationType) ? applicationType : undefined,
      status: status && validStatuses.includes(status) ? status : undefined
    });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return NextResponse.json({ success: false, message: `数据库配置缺失：${error.missing.join(", ")}。` }, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      return NextResponse.json({ success: false, message: "无法读取申请列表，请稍后重试。" }, { status: 500 });
    }

    return NextResponse.json({ success: false, message: "申请列表服务暂时不可用。" }, { status: 500 });
  }
}
