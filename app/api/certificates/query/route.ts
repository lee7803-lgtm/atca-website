import { NextResponse } from "next/server";
import { findCertificateByNoAndHolder, isSupabaseSchemaError, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import type { CertificateQueryResponse } from "@/types/certification";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const certificateNo = searchParams.get("certificateNo")?.trim() || "";
  const holderName = searchParams.get("holderName")?.trim() || "";

  if (!certificateNo || !holderName) {
    const response: CertificateQueryResponse = { success: false, message: "请填写证书编号和持证人姓名后再查询。" };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const certificate = await findCertificateByNoAndHolder(certificateNo, holderName);
    if (!certificate) {
      const response: CertificateQueryResponse = { success: false, message: "未查询到匹配的证书记录，请确认资料是否正确，或联系协会秘书处协助核验。" };
      return NextResponse.json(response, { status: 404 });
    }

    const response: CertificateQueryResponse = { success: true, certificate };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      const response: CertificateQueryResponse = { success: false, message: `证书查询服务尚未完成数据库配置，缺少环境变量：${error.missing.join(", ")}。` };
      return NextResponse.json(response, { status: 500 });
    }

    if (isSupabaseSchemaError(error)) {
      const response: CertificateQueryResponse = { success: false, message: "证书数据表尚未配置。请先在 Supabase 执行数据库初始化 SQL。" };
      return NextResponse.json(response, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      const response: CertificateQueryResponse = { success: false, message: "证书查询服务暂时无法访问数据库，请稍后重试。" };
      return NextResponse.json(response, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    }

    const response: CertificateQueryResponse = { success: false, message: "证书查询服务暂时不可用，请稍后重试。" };
    return NextResponse.json(response, { status: 500 });
  }
}
