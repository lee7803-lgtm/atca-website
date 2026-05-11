import { NextResponse } from "next/server";
import { findApplicationByNoAndEmail, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import type { ApplicationQueryResponse } from "@/types/application";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const applicationNo = searchParams.get("applicationNo")?.trim() || "";
  const email = searchParams.get("email")?.trim() || "";

  if (!applicationNo || !email) {
    const response: ApplicationQueryResponse = {
      success: false,
      message: "请填写申请编号和邮箱后再查询。"
    };

    return NextResponse.json(response, { status: 400 });
  }

  if (!isEmail(email)) {
    const response: ApplicationQueryResponse = {
      success: false,
      message: "邮箱格式不正确，请检查后重新查询。"
    };

    return NextResponse.json(response, { status: 400 });
  }

  try {
    const application = await findApplicationByNoAndEmail(applicationNo, email);

    if (!application) {
      const response: ApplicationQueryResponse = {
        success: false,
        message: "未查询到匹配的申请记录，请确认申请编号和邮箱是否正确。"
      };

      return NextResponse.json(response, { status: 404 });
    }

    const response: ApplicationQueryResponse = {
      success: true,
      application
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      const response: ApplicationQueryResponse = {
        success: false,
        message: `申请查询服务尚未完成数据库配置，缺少环境变量：${error.missing.join(", ")}。`
      };

      return NextResponse.json(response, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      const response: ApplicationQueryResponse = {
        success: false,
        message: "申请查询服务暂时无法访问数据库，请稍后重试。"
      };

      return NextResponse.json(response, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    }

    const response: ApplicationQueryResponse = {
      success: false,
      message: "申请查询服务暂时不可用，请稍后重试。"
    };

    return NextResponse.json(response, { status: 500 });
  }
}
