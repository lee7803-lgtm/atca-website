import { NextResponse } from "next/server";
import { generateCertificationApplicationNo } from "@/lib/application-number";
import { defaultMaterialReview, findOpenCertificationApplicationByContact, insertCertificationApplication, SupabaseConfigError, SupabaseRequestError, uploadCertificationAttachment } from "@/lib/supabase/server";
import type { CertificationApplicationPayload, CertificationApplicationRecord, CertificationSubmitResponse, CertificationAttachment, CertificationLevel, CertificationPath } from "@/types/certification";

const validCertificationTypes = ["taoist_priest"];
const validCertificationPaths: CertificationPath[] = ["zhengyi", "quanzhen", "other_international"];
const validCertificationLevels: CertificationLevel[] = ["refuge_entry", "transmission_or_crowning", "register_or_precept", "senior_taoist", "special_lineage"];
const phonePattern = /^[+\d][\d\s().-]{5,29}$/;
const allowedFileTypes = ["application/pdf", "image/jpeg", "image/png"];
const allowedFileExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
const maxFileSize = 2 * 1024 * 1024;
const allowedUploadFields = new Set([
  "luDocument",
  "jieDocument",
  "duDocument",
  "guanJinDocument",
  "lineageProof",
  "templeProof",
  "internalVoucher",
  "idProof",
  "photo",
  "criminalRecord",
  "educationProof",
  "practiceReport",
  "organizationLetter",
  "crossCulturePlan"
]);

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

  ["declarationAccepted", "ethicsConfirmed", "boundaryConfirmed", "dataUseAccepted", "certificatePublicAccepted", "termsAccepted", "privacyAccepted"].forEach((key) => {
    record[key] = record[key] === "true";
  });

  return record;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidLength(value: string, min: number, max: number) {
  return value.length >= min && value.length <= max;
}

function validateFiles(formData: FormData | null) {
  const fieldErrors: Record<string, string> = {};
  if (!formData) return fieldErrors;

  formData.forEach((value, key) => {
    if (!(value instanceof File) || value.size === 0) return;

    if (!allowedUploadFields.has(key)) {
      fieldErrors[key] = "请勿上传与申请无关的文件。";
      return;
    }

    const lowerName = value.name.toLowerCase();
    const hasAllowedExtension = allowedFileExtensions.some((extension) => lowerName.endsWith(extension));
    if (!allowedFileTypes.includes(value.type) && !hasAllowedExtension) {
      fieldErrors[key] = "文件格式不支持，请上传 PDF、JPG、JPEG 或 PNG 文件。";
      return;
    }

    if (value.size > maxFileSize) {
      fieldErrors[key] = "文件大小超过限制，请上传不超过 2MB 的文件。";
    }
  });

  return fieldErrors;
}

function validatePayload(payload: unknown) {
  const fieldErrors: Record<string, string> = {};
  if (!isRecord(payload)) return { fieldErrors: { request: "认证申请资料格式不正确。" }, values: null };

  const values: CertificationApplicationPayload = {
    certificationType: asString(payload.certificationType) as CertificationApplicationPayload["certificationType"],
    certificationPath: (asString(payload.certificationPath) || asString(payload.certification_path)) as CertificationPath | "",
    requestedLevel: (asString(payload.requestedLevel) || asString(payload.requested_level)) as CertificationLevel | "",
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
    applicationReason: asString(payload.applicationReason),
    additionalNote: asString(payload.additionalNote),
    existingCertificates: [],
    supportingDocuments: [],
    declarationAccepted: payload.declarationAccepted === true,
    ethicsConfirmed: payload.ethicsConfirmed === true,
    boundaryConfirmed: payload.boundaryConfirmed === true,
    dataUseAccepted: payload.dataUseAccepted === true,
    certificatePublicAccepted: payload.certificatePublicAccepted === true,
    termsAccepted: payload.termsAccepted === true,
    privacyAccepted: payload.privacyAccepted === true,
    confirmedAt: asString(payload.confirmedAt),
    certificatePhotoPath: ""
  };

  const honeypot = asString(payload.companyWebsite) || asString(payload.websiteUrl);
  if (honeypot) fieldErrors.request = "认证申请资料未通过基础校验，请稍后重试。";
  if (!validCertificationTypes.includes(values.certificationType)) fieldErrors.certificationType = "请选择申请认证类型。";
  if (values.certificationPath && !validCertificationPaths.includes(values.certificationPath)) fieldErrors.certificationPath = "请选择有效的传承体系。";
  if (values.requestedLevel && !validCertificationLevels.includes(values.requestedLevel)) fieldErrors.requestedLevel = "请选择有效的申报认证等级。";
  if (!values.applicantName) fieldErrors.applicantName = "请填写中文姓名。";
  if (values.applicantName && !isValidLength(values.applicantName, 2, 50)) fieldErrors.applicantName = "姓名长度需为 2–50 个字符。";
  if (!values.taoistName) fieldErrors.taoistName = "请填写道名 / 法名。";
  if (!values.nationality && !values.residence) fieldErrors.nationality = "请选择所在国家或地区。";
  if (!values.phone) fieldErrors.phone = "请填写联系电话。";
  if (values.phone && !phonePattern.test(values.phone)) fieldErrors.phone = "请填写有效联系电话。";
  if (!values.email) fieldErrors.email = "请填写邮箱。";
  if (values.email && !isEmail(values.email)) fieldErrors.email = "请输入有效邮箱地址。";
  if (!values.masterName) fieldErrors.masterName = "请填写师父姓名。";
  if (!values.lineage) fieldErrors.lineage = "请填写传承信息。";
  if (!values.sect) fieldErrors.sect = "请填写所属道派。";
  if (!values.experienceSummary || !isValidLength(values.experienceSummary, 30, 2000)) fieldErrors.experienceSummary = "请填写道教履历说明，且不少于 30 字、不超过 2000 字。";
  if (values.applicationReason && !isValidLength(values.applicationReason, 20, 1500)) fieldErrors.applicationReason = "申请理由需不少于 20 字、不超过 1500 字。";
  if (values.additionalNote && values.additionalNote.length > 1000) fieldErrors.additionalNote = "补充备注不能超过 1000 字。";
  if (!values.declarationAccepted || !values.dataUseAccepted || !values.certificatePublicAccepted || !values.termsAccepted || !values.privacyAccepted) {
    fieldErrors.declarationAccepted = "请确认声明承诺后再提交。";
  }

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
  const fileErrors = validateFiles(formData);
  Object.assign(fieldErrors, fileErrors);
  if (!values || Object.keys(fieldErrors).length > 0) {
    const response: CertificationSubmitResponse = { success: false, message: "认证申请资料未通过基础校验，请补充或修正后重新提交。", fieldErrors };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const existingOpenApplication = await findOpenCertificationApplicationByContact({
      email: values.email,
      phone: values.phone
    });
    if (existingOpenApplication) {
      const response: CertificationSubmitResponse = {
        success: false,
        message: "系统检测到您已提交过相关申请，请使用申请编号查询进度。如需补充或更正资料，请联系协会秘书处。"
      };
      return NextResponse.json(response, { status: 409 });
    }

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

    const certificatePhotoPath = supportingDocuments.find((item) => item.fieldName === "photo" && item.storagePath)?.storagePath || "";

    const application: CertificationApplicationRecord = {
      ...values,
      confirmedAt: now,
      existingCertificates,
      supportingDocuments,
      certificatePhotoPath,
      applicationNo,
      status: "submitted",
      reviewNote: "",
      internalReviewNote: "",
      applicantFeedback: "",
      approvedPath: "",
      approvedLevel: "",
      materialReview: defaultMaterialReview,
      committeeReviewNote: "",
      reviewer: "",
      reviewedAt: null,
      deliveryStatus: "not_delivered",
      deliveredAt: null,
      createdAt: now,
      updatedAt: now
    };

    await insertCertificationApplication(application);

    const response: CertificationSubmitResponse = { success: true, applicationNo, status: "submitted" };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      const response: CertificationSubmitResponse = { success: false, message: "认证申请提交服务尚未完成系统配置，请联系协会秘书处协助处理。" };
      return NextResponse.json(response, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      const lowerMessage = error.message.toLowerCase();
      if (lowerMessage.includes("bucket") || lowerMessage.includes("storage") || lowerMessage.includes("object")) {
        const response: CertificationSubmitResponse = { success: false, message: "附件暂时无法上传，请稍后重试或联系协会秘书处协助处理。" };
        return NextResponse.json(response, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
      }

      const response: CertificationSubmitResponse = {
        success: false,
        message: "认证申请暂时无法保存，请稍后重试或联系协会秘书处协助处理。"
      };
      return NextResponse.json(response, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    }

    const response: CertificationSubmitResponse = { success: false, message: "认证申请提交服务暂时不可用，请稍后重试。" };
    return NextResponse.json(response, { status: 500 });
  }
}
