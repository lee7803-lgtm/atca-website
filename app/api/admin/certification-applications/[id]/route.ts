import { NextResponse } from "next/server";
import { generateCertificateNo } from "@/lib/application-number";
import { adminSessionCookieName, getAdminSession, isValidAdminSessionToken } from "@/lib/admin/auth";
import {
  deleteCertificateByNo,
  findCertificateByApplicationId,
  getCertificationApplicationById,
  insertCertificate,
  isSupabaseSchemaError,
  normalizeMaterialReview,
  SupabaseConfigError,
  SupabaseRequestError,
  updateCertificateBusinessStatus,
  updateCertificationReview
} from "@/lib/supabase/server";
import { certificationLevelLabels, type CertificateRecord, type CertificationLevel, type CertificationPath, type CertificationStatus, type MaterialReview } from "@/types/certification";

const validStatuses: CertificationStatus[] = ["submitted", "under_review", "need_more_info", "approved", "rejected", "certificate_issued", "cert_issued", "delivered", "archived", "revoked"];
const certificateIssuedStatuses: CertificationStatus[] = ["certificate_issued", "cert_issued", "delivered"];
const validCertificationPaths: CertificationPath[] = ["zhengyi", "quanzhen", "other_international"];
const validCertificationLevels: CertificationLevel[] = ["refuge_entry", "transmission_or_crowning", "register_or_precept", "senior_taoist", "special_lineage"];
const validCertificateBusinessStatuses = ["pending", "valid", "pending_renewal", "renewal_in_progress", "renewed", "suspended", "revoked"];
const reviewBackflowStatuses: CertificationStatus[] = ["submitted", "under_review", "need_more_info", "rejected"];

function getAdminCookie(request: Request) {
  return request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${adminSessionCookieName}=`))?.split("=")[1];
}

function unauthorized() {
  return NextResponse.json({ success: false, message: "请先完成后台验证。" }, { status: 401 });
}

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
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

function defaultValidUntil(date: Date) {
  const next = addYears(date, 1);
  next.setDate(next.getDate() - 1);
  return next;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function asCertificationPath(value: unknown) {
  const path = asString(value) as CertificationPath | "";
  return path && validCertificationPaths.includes(path) ? path : "";
}

function asCertificationLevel(value: unknown) {
  const level = asString(value) as CertificationLevel | "";
  return level && validCertificationLevels.includes(level) ? level : "";
}

function asMaterialReview(value: unknown): MaterialReview | undefined {
  if (value === undefined) return undefined;
  return normalizeMaterialReview(value);
}

function isMaterialReviewReady(review: MaterialReview | undefined) {
  if (!review) return false;
  return Object.values(review).every((status) => status === "passed");
}

function buildLineageOrTemple(application: Awaited<ReturnType<typeof getCertificationApplicationById>>) {
  if (!application) return "";
  return [application.sect, application.lineage, application.templeOrOrganization].filter(Boolean).join(" / ");
}

function mapCertificateBusinessStatus(status: string): { certificateStatus: "pending" | "valid" | "revoked"; certificateReviewStatus: string } {
  if (status === "pending") return { certificateStatus: "pending", certificateReviewStatus: "none" };
  if (status === "revoked") return { certificateStatus: "revoked", certificateReviewStatus: "none" };
  if (status === "pending_renewal" || status === "renewal_in_progress" || status === "renewed" || status === "suspended") {
    return { certificateStatus: "valid", certificateReviewStatus: status };
  }

  return { certificateStatus: "valid", certificateReviewStatus: "none" };
}

function isDateOnly(value: string) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const adminCookie = getAdminCookie(request);
  if (!isValidAdminSessionToken(adminCookie)) return unauthorized();

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
    const internalReviewNote = asString(payload.internalReviewNote) || asString(payload.internal_review_note);
    const applicantFeedback = asString(payload.applicantFeedback) || asString(payload.applicant_feedback);
    const approvedPath = asCertificationPath(payload.approvedPath) || asCertificationPath(payload.approved_path);
    const approvedLevel = asCertificationLevel(payload.approvedLevel) || asCertificationLevel(payload.approved_level);
    const materialReview = asMaterialReview(payload.materialReview ?? payload.material_review);
    const committeeReviewNote = asString(payload.committeeReviewNote) || asString(payload.committee_review_note);
    const reviewer = asString(payload.reviewer) || "admin";

    if (action === "update_certificate_status") {
      const existing = await findCertificateByApplicationId(params.id);
      if (!existing) return NextResponse.json({ success: false, message: "请先生成证书记录后再维护证书状态。" }, { status: 400 });

      const businessStatus = asString(payload.certificateBusinessStatus);
      if (!validCertificateBusinessStatuses.includes(businessStatus)) {
        return NextResponse.json({ success: false, message: "请选择有效的证书状态。" }, { status: 400 });
      }

      const mapped = mapCertificateBusinessStatus(businessStatus);
      const validFrom = asString(payload.validFrom);
      const validUntil = asString(payload.validUntil);
      if (!isDateOnly(validFrom) || !isDateOnly(validUntil)) {
        return NextResponse.json({ success: false, message: "证书有效期日期格式不正确。" }, { status: 400 });
      }
      if (validFrom && validUntil && validUntil < validFrom) {
        return NextResponse.json({ success: false, message: "证书有效期截止日期不能早于开始日期。" }, { status: 400 });
      }
      const actor = getAdminSession(adminCookie) || undefined;
      const certificate = await updateCertificateBusinessStatus(params.id, {
        ...mapped,
        validFrom: validFrom || null,
        validUntil: validUntil || null,
        certificateStatusNote: asString(payload.certificateStatusNote),
        actorEmail: actor?.email || "",
        actorName: actor?.displayName || "",
        actorRole: actor?.role || "",
        actorType: actor?.actorType || "legacy_admin",
        ipAddress: getRequestIp(request),
        userAgent: request.headers.get("user-agent") || ""
      });

      return NextResponse.json({ success: true, certificate });
    }

    if (action === "update_material_review") {
      if (!materialReview) return NextResponse.json({ success: false, message: "材料审核状态不正确。" }, { status: 400 });
      const updated = await updateCertificationReview(params.id, {
        status: application.status,
        reviewNote: application.reviewNote,
        internalReviewNote: application.internalReviewNote,
        applicantFeedback: application.applicantFeedback,
        approvedPath: application.approvedPath,
        approvedLevel: application.approvedLevel,
        materialReview,
        committeeReviewNote: application.committeeReviewNote,
        reviewer
      });

      return NextResponse.json({ success: true, application: updated });
    }

    if (payload.generateCertificate === true || action === "generate_certificate") {
      const existing = await findCertificateByApplicationId(params.id);
      if (existing) return NextResponse.json({ success: false, message: "证书记录已存在，不能重复生成证书。" }, { status: 400 });

      if (application.status !== "approved") {
        return NextResponse.json({ success: false, message: "当前申请尚未审核通过，不能生成证书。" }, { status: 400 });
      }

      const finalPath = approvedPath || application.approvedPath;
      const finalLevel = approvedLevel || application.approvedLevel;
      const finalMaterialReview = materialReview || application.materialReview;

      if (!finalPath || !finalLevel) {
        return NextResponse.json({ success: false, message: "请先完成核定传承体系与核定认证等级后再生成证书。" }, { status: 400 });
      }

      if (!isMaterialReviewReady(finalMaterialReview)) {
        return NextResponse.json({ success: false, message: "仍有材料审核项未通过或未完成，暂不能生成证书。" }, { status: 400 });
      }

      const today = new Date();
      const now = today.toISOString();
      const finalLevelLabel = finalLevel ? certificationLevelLabels[finalLevel] : asString(payload.taoistRank) || "道士资格认证";
      const certificate: CertificateRecord = {
        certificateNo: generateCertificateNo(today),
        applicationId: params.id,
        holderName: application.applicantName,
        taoistName: application.taoistName,
        taoistRank: finalLevelLabel,
        sect: application.sect || application.lineage,
        certificationPath: finalPath,
        certificationLevel: finalLevel || asString(payload.taoistRank) || "道士资格认证",
        lineageOrTemple: buildLineageOrTemple(application),
        certificatePhotoPath: application.certificatePhotoPath,
        issuedDate: formatDate(today),
        validFrom: formatDate(today),
        validUntil: formatDate(defaultValidUntil(today)),
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
          approvedPath: finalPath,
          approvedLevel: finalLevel,
          materialReview: finalMaterialReview,
          committeeReviewNote: committeeReviewNote || application.committeeReviewNote,
          reviewer,
          deliveryStatus: "not_delivered",
          deliveredAt: null
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
        approvedPath: approvedPath || application.approvedPath,
        approvedLevel: approvedLevel || application.approvedLevel,
        materialReview: materialReview || application.materialReview,
        committeeReviewNote: committeeReviewNote || application.committeeReviewNote,
        reviewer,
        deliveryStatus: "delivered",
        deliveredAt
      });

      return NextResponse.json({ success: true, application: updated });
    }

    if (action === "correct_not_delivered") {
      const existing = await findCertificateByApplicationId(params.id);
      if (!existing) return NextResponse.json({ success: false, message: "请先生成证书记录后再更正下发状态。" }, { status: 400 });

      const updated = await updateCertificationReview(params.id, {
        status: application.status === "delivered" ? "certificate_issued" : application.status,
        reviewNote: asString(payload.reviewNote) || application.reviewNote,
        internalReviewNote: internalReviewNote || application.internalReviewNote,
        applicantFeedback: applicantFeedback || application.applicantFeedback,
        approvedPath: approvedPath || application.approvedPath,
        approvedLevel: approvedLevel || application.approvedLevel,
        materialReview: materialReview || application.materialReview,
        committeeReviewNote: committeeReviewNote || application.committeeReviewNote,
        reviewer,
        deliveryStatus: "not_delivered",
        deliveredAt: null
      });

      return NextResponse.json({ success: true, application: updated });
    }

    if (action === "archive") {
      const updated = await updateCertificationReview(params.id, {
        status: "archived",
        reviewNote: asString(payload.reviewNote) || application.reviewNote,
        internalReviewNote: internalReviewNote || application.internalReviewNote,
        applicantFeedback: applicantFeedback || application.applicantFeedback,
        approvedPath: approvedPath || application.approvedPath,
        approvedLevel: approvedLevel || application.approvedLevel,
        materialReview: materialReview || application.materialReview,
        committeeReviewNote: committeeReviewNote || application.committeeReviewNote,
        reviewer
      });

      return NextResponse.json({ success: true, application: updated });
    }

    const status = asString(payload.status) as CertificationStatus;
    if (!status || !validStatuses.includes(status)) return NextResponse.json({ success: false, message: "审核状态不正确。" }, { status: 400 });
    if (certificateIssuedStatuses.includes(status)) return NextResponse.json({ success: false, message: "请使用对应操作按钮生成证书或标记下发。" }, { status: 400 });
    const existing = await findCertificateByApplicationId(params.id);
    if ((existing || certificateIssuedStatuses.includes(application.status)) && reviewBackflowStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "证书已生成，审核状态不能倒流；资料虚假请将证书业务状态改为已撤销，存在争议请改为已暂停。" }, { status: 400 });
    }
    if (existing || certificateIssuedStatuses.includes(application.status)) {
      return NextResponse.json({ success: false, message: "证书已生成，审核流程已锁定；后续问题请使用证书状态维护。" }, { status: 400 });
    }
    if (status === "need_more_info" && !applicantFeedback && !application.applicantFeedback) {
      return NextResponse.json({ success: false, message: "请填写需要申请人补充或修正的资料说明。" }, { status: 400 });
    }
    if (status === "rejected" && !applicantFeedback && !application.applicantFeedback) {
      return NextResponse.json({ success: false, message: "请填写对申请人反馈后再保存该审核状态。" }, { status: 400 });
    }
    if (status === "approved" && (!(approvedPath || application.approvedPath) || !(approvedLevel || application.approvedLevel))) {
      return NextResponse.json({ success: false, message: "请先完成核定传承体系与核定认证等级后再保存审核通过状态。" }, { status: 400 });
    }
    if (status === "approved" && !isMaterialReviewReady(materialReview || application.materialReview)) {
      return NextResponse.json({ success: false, message: "所有资料审核项通过后，才能保存最终审核通过。" }, { status: 400 });
    }

    const updatedApplication = await updateCertificationReview(params.id, {
      status,
      reviewNote: asString(payload.reviewNote),
      internalReviewNote,
      applicantFeedback,
      approvedPath,
      approvedLevel,
      materialReview,
      committeeReviewNote,
      reviewer
    });

    return NextResponse.json({ success: true, application: updatedApplication });
  } catch (error) {
    if (error instanceof SupabaseConfigError) return NextResponse.json({ success: false, message: "认证申请审核服务尚未完成系统配置，请联系网站管理员处理。" }, { status: 500 });
    if (isSupabaseSchemaError(error)) {
      return NextResponse.json(
        { success: false, message: "认证申请审核服务尚未完成系统配置，请联系网站管理员处理。" },
        { status: 500 }
      );
    }
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: "认证申请审核服务暂时无法访问数据库。" }, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    return NextResponse.json({ success: false, message: "认证申请审核服务暂时不可用。" }, { status: 500 });
  }
}
