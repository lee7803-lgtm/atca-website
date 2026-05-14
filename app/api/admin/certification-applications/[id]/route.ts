import { NextResponse } from "next/server";
import { generateCertificateNo } from "@/lib/application-number";
import {
  findCertificateByApplicationId,
  getCertificationApplicationById,
  insertCertificate,
  isSupabaseSchemaError,
  SupabaseConfigError,
  SupabaseRequestError,
  updateCertificationReview
} from "@/lib/supabase/server";
import type { CertificateRecord, CertificationStatus } from "@/types/certification";

const validStatuses: CertificationStatus[] = ["submitted", "under_review", "need_more_info", "approved", "rejected", "cert_issued", "revoked"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "请求资料格式不正确。" }, { status: 400 });
  }

  if (!isRecord(payload)) return NextResponse.json({ success: false, message: "请求资料格式不正确。" }, { status: 400 });

  try {
    if (payload.generateCertificate === true) {
      const application = await getCertificationApplicationById(params.id);
      if (!application) return NextResponse.json({ success: false, message: "未找到认证申请。" }, { status: 404 });

      const existing = await findCertificateByApplicationId(params.id);
      if (existing) return NextResponse.json({ success: true, certificate: existing, message: "证书记录已存在。" });

      const today = new Date();
      const now = today.toISOString();
      const certificate: CertificateRecord = {
        certificateNo: generateCertificateNo(today),
        applicationId: params.id,
        holderName: application.applicantName,
        taoistName: application.taoistName,
        taoistRank: asString(payload.taoistRank) || "道士资格认证",
        sect: application.sect || application.lineage,
        issuedDate: formatDate(today),
        validFrom: formatDate(today),
        validUntil: formatDate(addYears(today, 3)),
        status: "valid",
        publicQueryEnabled: true,
        createdAt: now,
        updatedAt: now
      };

      await insertCertificate(certificate);
      await updateCertificationReview(params.id, { status: "cert_issued", reviewNote: asString(payload.reviewNote) || application.reviewNote, reviewer: asString(payload.reviewer) || "admin" });

      return NextResponse.json({ success: true, certificate });
    }

    const status = asString(payload.status) as CertificationStatus;
    if (!status || !validStatuses.includes(status)) return NextResponse.json({ success: false, message: "审核状态不正确。" }, { status: 400 });

    const application = await updateCertificationReview(params.id, {
      status,
      reviewNote: asString(payload.reviewNote),
      reviewer: asString(payload.reviewer) || "admin"
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    if (error instanceof SupabaseConfigError) return NextResponse.json({ success: false, message: `数据库配置不完整：${error.missing.join(", ")}。` }, { status: 500 });
    if (isSupabaseSchemaError(error)) {
      return NextResponse.json(
        { success: false, message: "认证申请或证书数据表尚未配置，请先在 Supabase 执行 supabase/applications.sql。" },
        { status: 500 }
      );
    }
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: "认证申请审核服务暂时无法访问数据库。" }, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    return NextResponse.json({ success: false, message: "认证申请审核服务暂时不可用。" }, { status: 500 });
  }
}
