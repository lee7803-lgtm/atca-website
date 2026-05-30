import { NextResponse } from "next/server";
import {
  findCertificatePdfStorageByApplicationId,
  getCertificationApplicationByNoAndContact,
  isSupabaseSchemaError,
  markCertificatePdfDownloadedByApplicationId,
  readCertificatePdfObject,
  SupabaseConfigError,
  SupabaseRequestError
} from "@/lib/supabase/server";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "请求资料格式不正确。" }, { status: 400 });
  }

  if (!isRecord(payload)) return NextResponse.json({ success: false, message: "请求资料格式不正确。" }, { status: 400 });

  const applicationNo = asString(payload.applicationNo);
  const contact = asString(payload.contact);

  if (!applicationNo || !contact) {
    return NextResponse.json({ success: false, message: "请填写申请编号和登记联系方式后再下载证书 PDF。" }, { status: 400 });
  }

  try {
    const application = await getCertificationApplicationByNoAndContact(applicationNo, contact);
    if (!application) return NextResponse.json({ success: false, message: "未查询到匹配的认证申请记录。" }, { status: 404 });

    const stored = await findCertificatePdfStorageByApplicationId(application.id);
    if (!stored) return NextResponse.json({ success: false, message: "正式证书 PDF 尚未生成，请等待协会完成证书下发。" }, { status: 404 });

    const pdf = await readCertificatePdfObject(stored.storagePath);
    await markCertificatePdfDownloadedByApplicationId(application.id);

    return new NextResponse(pdf, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${stored.certificateNo}.pdf"`,
        "Content-Type": "application/pdf"
      }
    });
  } catch (error) {
    if (error instanceof SupabaseConfigError) return NextResponse.json({ success: false, message: "证书 PDF 下载服务尚未完成系统配置。" }, { status: 500 });
    if (isSupabaseSchemaError(error)) return NextResponse.json({ success: false, message: "证书 PDF 存储字段尚未完成数据库配置，请联系协会秘书处。" }, { status: 500 });
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: "证书 PDF 暂时无法读取，请稍后重试。" }, { status: 502 });
    return NextResponse.json({ success: false, message: "证书 PDF 下载服务暂时不可用。" }, { status: 500 });
  }
}
