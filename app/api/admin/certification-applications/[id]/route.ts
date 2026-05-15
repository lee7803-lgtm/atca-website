import { NextResponse } from "next/server";
import { generateCertificateNo } from "@/lib/application-number";
import { adminSessionCookieName, isValidAdminSessionToken } from "@/lib/admin/auth";
import {
  deleteCertificateByNo,
  findCertificateByApplicationId,
  getCertificationApplicationById,
  insertCertificate,
  isSupabaseSchemaError,
  SupabaseConfigError,
  SupabaseRequestError,
  updateCertificationReview
} from "@/lib/supabase/server";
import type { CertificateRecord, CertificationStatus } from "@/types/certification";

const validStatuses: CertificationStatus[] = ["submitted", "under_review", "need_more_info", "approved", "rejected", "certificate_issued", "cert_issued", "delivered", "archived", "revoked"];
const certificateIssuedStatuses: CertificationStatus[] = ["certificate_issued", "cert_issued", "delivered"];

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

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
  if (!isValidAdminSessionToken(getAdminCookie(request))) return unauthorized();

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "请求资料格式不正确。" }, { status: 400 });
  }

  if (!isRecord(payload)) return NextResponse.json({ success: false, message: "请求资料格式不正确。" }, { status: 400 });

  try {
    const application = await getCertificationApplicationById(params.id);
    if (!application) return NextResponse.json({ success: false, message: "未找到认证申请。" }, { status: 404 });

    const action = asString(payload.action);
    const internalReviewNote = asString(payload.internalReviewNote);
    const applicantFeedback = asString(payload.applicantFeedback);
    const reviewer = asString(payload.reviewer) || "admin";

    if (payload.generateCertificate === true || action === "generate_certificate") {
      const existing = await findCertificateByApplicationId(params.id);
      if (existing) return NextResponse.json({ success: true, certificate: existing, message: "证书记录已存在。" });

      if (application.status !== "approved") {
        return NextResponse.json({ success: false, message: "只有审核通过的申请可以生成证书。" }, { status: 400 });
      }

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
      try {
        await updateCertificationReview(params.id, {
          status: "certificate_issued",
          reviewNote: asString(payload.reviewNote) || application.reviewNote,
          internalReviewNote: internalReviewNote || application.internalReviewNote,
          applicantFeedback: applicantFeedback || application.applicantFeedback || "您的认证申请已审核通过，证书记录已生成。",
          reviewer
        });
      } catch (error) {
        try {
          await deleteCertificateByNo(certificate.certificateNo);
        } catch {
          // Best-effort cleanup. The caller receives a clear failure message below.
        }
        throw error;
      }

      return NextResponse.json({ success: true, certificate });
    }

    if (action === "mark_delivered") {
      const existing = await findCertificateByApplicationId(params.id);
      if (!existing) return NextResponse.json({ success: false, message: "请先生成证书记录后再标记下发。" }, { status: 400 });

      const deliveredAt = new Date().toISOString();
      const updated = await updateCertificationReview(params.id, {
        status: "delivered",
        reviewNote: asString(payload.reviewNote) || application.reviewNote,
        internalReviewNote: internalReviewNote || application.internalReviewNote,
        applicantFeedback: applicantFeedback || application.applicantFeedback || "您的证书记录已生成并已完成下发。",
        reviewer,
        deliveryStatus: "delivered",
        deliveredAt
      });

      return NextResponse.json({ success: true, application: updated });
    }

    if (action === "archive") {
      const updated = await updateCertificationReview(params.id, {
        status: "archived",
        reviewNote: asString(payload.reviewNote) || application.reviewNote,
        internalReviewNote: internalReviewNote || application.internalReviewNote,
        applicantFeedback: applicantFeedback || application.applicantFeedback,
        reviewer
      });

      return NextResponse.json({ success: true, application: updated });
    }

    const status = asString(payload.status) as CertificationStatus;
    if (!status || !validStatuses.includes(status)) return NextResponse.json({ success: false, message: "审核状态不正确。" }, { status: 400 });
    if (certificateIssuedStatuses.includes(status)) return NextResponse.json({ success: false, message: "请使用对应操作按钮生成证书或标记下发。" }, { status: 400 });

    const updatedApplication = await updateCertificationReview(params.id, {
      status,
      reviewNote: asString(payload.reviewNote),
      internalReviewNote,
      applicantFeedback,
      reviewer
    });

    return NextResponse.json({ success: true, application: updatedApplication });
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
