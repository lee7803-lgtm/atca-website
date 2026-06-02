import { NextResponse } from "next/server";
import { generateApplicationNo } from "@/lib/application-number";
import { isEmailAllowedTestRecipient } from "@/lib/notifications/email/config";
import { recordMemberApplicationSubmittedNotification } from "@/lib/notifications/workflows";
import { findOpenApplicationByContact, generateItcaNumber, insertApplication, SupabaseConfigError, SupabaseRequestError } from "@/lib/supabase/server";
import { hasValidLength, organizationNameLengthMessage, personNameLengthMessage } from "@/lib/validation/names";
import { internationalPhoneMessage, isInternationalPhone } from "@/lib/validation/phone";
import type { ApplicationRecord, ApplicationSubmitPayload, ApplicationSubmitResponse, ApplicationType, OrganizationType } from "@/types/application";

const validApplicationTypes: ApplicationType[] = ["personal_member", "organization_member"];
const validOrganizationTypes: OrganizationType[] = ["宫观道堂及文化场所", "传统文化机构", "教育研究机构", "社团组织", "合作单位", "宫观", "文化机构", "培训机构", "企业", "其他"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePayload(payload: unknown) {
  const fieldErrors: Record<string, string> = {};

  if (!isRecord(payload)) {
    return {
      fieldErrors: { request: "申请资料格式不正确。" },
      values: null
    };
  }

  const applicationType = asString(payload.applicationType) as ApplicationType;
  const honeypot = asString(payload.companyWebsite) || asString(payload.websiteUrl);
  const values: ApplicationSubmitPayload = {
    applicationType,
    name: asString(payload.name),
    contactName: asString(payload.contactName),
    phone: asString(payload.phone),
    email: asString(payload.email),
    country: asString(payload.country),
    profile: asString(payload.profile),
    purpose: asString(payload.purpose),
    referrerName: asString(payload.referrerName),
    referrerContact: asString(payload.referrerContact),
    referrerNote: asString(payload.referrerNote),
    organizationType: asString(payload.organizationType) as OrganizationType,
    receiveNotice: payload.receiveNotice === true,
    truthConfirmed: payload.truthConfirmed === true,
    termsAccepted: payload.termsAccepted === true,
    privacyAccepted: payload.privacyAccepted === true
  };

  if (honeypot) fieldErrors.request = "申请资料未通过基础校验，请稍后重试。";
  if (!validApplicationTypes.includes(values.applicationType)) fieldErrors.applicationType = "申请类型不正确。";
  if (!values.name) fieldErrors.name = values.applicationType === "organization_member" ? "请填写机构名称。" : "请填写姓名。";
  if (values.name && !hasValidLength(values.name, 2, values.applicationType === "organization_member" ? 80 : 50)) {
    fieldErrors.name = values.applicationType === "organization_member" ? organizationNameLengthMessage : personNameLengthMessage;
  }
  if (!values.phone) fieldErrors.phone = "请填写手机或 WhatsApp。";
  if (values.phone && !isInternationalPhone(values.phone)) fieldErrors.phone = internationalPhoneMessage;
  if (!values.email) fieldErrors.email = "请填写邮箱。";
  if (values.email && !isEmail(values.email)) fieldErrors.email = "请输入有效邮箱地址。";
  if (!values.country) fieldErrors.country = "请选择所在国家或地区。";
  if (values.applicationType === "personal_member" && !values.purpose) fieldErrors.purpose = "请填写会员申请说明。";
  if (!values.truthConfirmed) fieldErrors.truthConfirmed = "请确认所提交资料真实有效。";
  if (!values.termsAccepted) fieldErrors.termsAccepted = "请确认服务条款后再提交。";
  if (!values.privacyAccepted) fieldErrors.privacyAccepted = "请确认隐私政策后再提交。";

  if (values.applicationType === "organization_member") {
    if (!values.contactName) fieldErrors.contactName = "请填写负责人姓名。";
    if (values.contactName && !hasValidLength(values.contactName, 2, 50)) fieldErrors.contactName = personNameLengthMessage;
    if (!values.organizationType || !validOrganizationTypes.includes(values.organizationType)) fieldErrors.organizationType = "请选择机构类型。";
    if (!values.profile) fieldErrors.profile = "请填写机构介绍。";
    if (values.profile && !hasValidLength(values.profile, 30, 2000)) fieldErrors.profile = "请填写机构介绍，且不少于 30 字、不超过 2000 字。";
    if (values.purpose && values.purpose.length > 1500) fieldErrors.purpose = "合作意向说明不能超过 1500 字。";
  }

  if (values.applicationType === "personal_member") {
    if (values.name && !hasValidLength(values.name, 2, 50)) fieldErrors.name = personNameLengthMessage;
    if (values.purpose && !hasValidLength(values.purpose, 20, 1500)) fieldErrors.purpose = "请填写会员申请说明，且不少于 20 字、不超过 1500 字。";
    if (values.profile && values.profile.length > 1000) fieldErrors.profile = "补充备注不能超过 1000 字。";
    values.contactName = values.name;
    delete values.organizationType;
  }

  return {
    fieldErrors,
    values
  };
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    const response: ApplicationSubmitResponse = {
      success: false,
      message: "申请资料格式不正确，请检查后重新提交。"
    };

    return NextResponse.json(response, { status: 400 });
  }

  const { fieldErrors, values } = validatePayload(payload);

  if (!values || Object.keys(fieldErrors).length > 0) {
    const response: ApplicationSubmitResponse = {
      success: false,
      message: "申请资料未通过基础校验，请补充或修正后重新提交。",
      errorType: "validation_failed",
      fieldErrors
    };

    return NextResponse.json(response, { status: 400 });
  }

  try {
    if (!isEmailAllowedTestRecipient(values.email)) {
      const existingOpenApplication = await findOpenApplicationByContact({
        applicationType: values.applicationType,
        email: values.email,
        phone: values.phone
      });
      if (existingOpenApplication) {
        const response: ApplicationSubmitResponse = {
          success: false,
          message: "系统检测到您已提交过相关申请，请使用申请编号查询进度。如需补充或更正资料，请联系协会秘书处。",
          errorType: "duplicate_application"
        };
        return NextResponse.json(response, { status: 409 });
      }
    }

    const nowDate = new Date();
    const now = nowDate.toISOString();
    let applicationNo = await generateItcaNumber({
      prefix: values.applicationType === "organization_member" ? "ARID-ITCA-ORG" : "ARID-ITCA-M",
      year: nowDate.getFullYear()
    });
    if (!applicationNo) applicationNo = generateApplicationNo(values.applicationType, nowDate);
    const application: ApplicationRecord = {
      applicationNo,
      applicationNoScheme: "arid",
      applicationType: values.applicationType,
      status: "submitted",
      name: values.name,
      contactName: values.contactName || values.name,
      phone: values.phone,
      email: values.email,
      country: values.country,
      profile: values.profile,
      purpose: values.purpose,
      referrerName: values.referrerName,
      referrerContact: values.referrerContact,
      referrerNote: values.referrerNote,
      organizationType: values.organizationType,
      receiveNotice: values.receiveNotice,
      truthConfirmed: values.truthConfirmed,
      termsAccepted: values.termsAccepted,
      privacyAccepted: values.privacyAccepted,
      confirmedAt: now,
      adminNote: "",
      supplementalSubmissions: [],
      supplementSubmittedAt: null,
      createdAt: now,
      updatedAt: now
    };

    await insertApplication(application);
    await recordMemberApplicationSubmittedNotification(application);

    const response: ApplicationSubmitResponse = {
      success: true,
      applicationNo,
      status: "submitted"
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      const response: ApplicationSubmitResponse = {
        success: false,
        message: `申请提交服务尚未完成数据库配置，缺少环境变量：${error.missing.join(", ")}。`
      };

      return NextResponse.json(response, { status: 500 });
    }

    if (error instanceof SupabaseRequestError) {
      const response: ApplicationSubmitResponse = {
        success: false,
        message: "申请提交服务暂时无法写入资料，系统将尝试备用提交服务；如仍失败请联系协会秘书处。",
        errorType: "next_submit_failed"
      };

      return NextResponse.json(response, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    }

    const response: ApplicationSubmitResponse = {
      success: false,
      message: "申请提交服务暂时不可用，请稍后重试。",
      errorType: "next_submit_failed"
    };

    return NextResponse.json(response, { status: 500 });
  }
}
