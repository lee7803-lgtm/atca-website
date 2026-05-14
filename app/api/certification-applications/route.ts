import { NextResponse } from "next/server";
import { generateCertificationApplicationNo } from "@/lib/application-number";
import { insertCertificationApplication, SupabaseConfigError, SupabaseRequestError, uploadCertificationAttachment } from "@/lib/supabase/server";
import type { CertificationApplicationPayload, CertificationApplicationRecord, CertificationSubmitResponse, CertificationAttachment } from "@/types/certification";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formDataToRecord(formData: FormData) {
  const record: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (value instanceof File) return;
    record[key] = value;
  });

  ["declarationAccepted", "ethicsConfirmed", "boundaryConfirmed"].forEach((key) => {
    record[key] = record[key] === "true";
  });

  return record;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePayload(payload: unknown) {
  const fieldErrors: Record<string, string> = {};
  if (!isRecord(payload)) return { fieldErrors: { request: "认证申请资料格式不正确。" }, values: null };

  const values: CertificationApplicationPayload = {
    applicantName: asString(payload.applicantName),
    applicantNameEn: asString(payload.applicantNameEn),
    taoistName: asString(payload.taoistName),
    gender: asString(payload.gender),
    birthDate: asString(payload.birthDate),
    nationality: asString(payload.nationality),
    residence: asString(payload.residence),
    phone: asString(payload.phone),
    email: asString(payload.email),
    address: asString(payload.address),
    masterName: asString(payload.masterName),
    masterTaoistName: asString(payload.masterTaoistName),
    lineage: asString(payload.lineage),
    templeOrOrganization: asString(payload.templeOrOrganization),
    sect: asString(payload.sect),
    practiceYears: asString(payload.practiceYears),
    experienceSummary: asString(payload.experienceSummary),
    existingCertificates: [],
    supportingDocuments: [],
    declarationAccepted: payload.declarationAccepted === true,
    ethicsConfirmed: payload.ethicsConfirmed === true,
    boundaryConfirmed: payload.boundaryConfirmed === true
  };

  if (!values.applicantName) fieldErrors.applicantName = "请填写中文姓名。";
  if (!values.taoistName) fieldErrors.taoistName = "请填写道名 / 法名。";
  if (!values.phone) fieldErrors.phone = "请填写手机或 WhatsApp。";
  if (!values.email) fieldErrors.email = "请填写邮箱。";
  if (values.email && !isEmail(values.email)) fieldErrors.email = "邮箱格式不正确。";
  if (!values.masterName) fieldErrors.masterName = "请填写师父姓名。";
  if (!values.lineage) fieldErrors.lineage = "请填写传承信息。";
  if (!values.sect) fieldErrors.sect = "请填写所属道派。";
  if (!values.experienceSummary) fieldErrors.experienceSummary = "请填写实践经历。";
  if (!values.declarationAccepted) fieldErrors.declarationAccepted = "请确认资料真实性声明。";
  if (!values.ethicsConfirmed) fieldErrors.ethicsConfirmed = "请确认遵守《道士伦理守则》。";
  if (!values.boundaryConfirmed) fieldErrors.boundaryConfirmed = "请确认认证说明与适用范围。";

  return { fieldErrors, values };
}

export async function POST(request: Request) {
  let payload: unknown;
  let formData: FormData | null = null;

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      formData = await request.formData();
      payload = formDataToRecord(formData);
    } else {
      payload = await request.json();
    }
  } catch {
    const response: CertificationSubmitResponse = { success: false, message: "认证申请资料格式不正确，请检查后重新提交。" };
    return NextResponse.json(response, { status: 400 });
  }

  const { fieldErrors, values } = validatePayload(payload);
  if (!values || Object.keys(fieldErrors).length > 0) {
    const response: CertificationSubmitResponse = { success: false, message: "认证申请资料未通过基础校验，请补充或修正后重新提交。", fieldErrors };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const now = new Date().toISOString();
    const applicationNo = generateCertificationApplicationNo();
    const existingCertificates: CertificationAttachment[] = [];
    const supportingDocuments: CertificationAttachment[] = [];

    if (formData) {
      const existingFields = ["luDocument", "jieDocument", "duDocument", "guanJinDocument", "lineageProof", "templeProof", "internalVoucher"];
      const supportingFields = ["idProof", "photo", "criminalRecord", "educationProof", "practiceReport", "organizationLetter", "crossCulturePlan"];

      for (const fieldName of existingFields) {
        const file = formData.get(fieldName);
        if (file instanceof File && file.size > 0) {
          existingCertificates.push(await uploadCertificationAttachment({ applicationNo, fieldName, file, category: "existing_certificates", uploadedAt: now }));
        }
      }

      for (const fieldName of supportingFields) {
        const file = formData.get(fieldName);
        if (file instanceof File && file.size > 0) {
          supportingDocuments.push(await uploadCertificationAttachment({ applicationNo, fieldName, file, category: "supporting_documents", uploadedAt: now }));
        }
      }
    }

    const application: CertificationApplicationRecord = {
      ...values,
      existingCertificates,
      supportingDocuments,
      applicationNo,
      status: "submitted",
      reviewNote: "",
      reviewer: "",
      reviewedAt: null,
      createdAt: now,
      updatedAt: now
    };

    await insertCertificationApplication(application);

    const response: CertificationSubmitResponse = { success: true, applicationNo, status: "submitted" };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      const response: CertificationSubmitResponse = { success: false, message: `认证申请提交服务尚未完成数据库配置，缺少环境变量：${error.missing.join(", ")}。` };
      return NextResponse.json(response, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      const lowerMessage = error.message.toLowerCase();
      if (lowerMessage.includes("bucket") || lowerMessage.includes("storage") || lowerMessage.includes("object")) {
        const response: CertificationSubmitResponse = { success: false, message: "附件暂时无法上传，请确认 Supabase Storage 已创建 certification-documents bucket。" };
        return NextResponse.json(response, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
      }

      const response: CertificationSubmitResponse = {
        success: false,
        message:
          "认证申请暂时无法写入数据库。请确认 Supabase 已执行 supabase/applications.sql，并已创建 certification_applications 表及所需字段。"
      };
      return NextResponse.json(response, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    }

    const response: CertificationSubmitResponse = { success: false, message: "认证申请提交服务暂时不可用，请稍后重试。" };
    return NextResponse.json(response, { status: 500 });
  }
}
