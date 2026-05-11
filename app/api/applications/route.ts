import { NextResponse } from "next/server";
import { generateApplicationNo } from "@/lib/application-number";
import type { ApplicationRecord, ApplicationSubmitPayload, ApplicationSubmitResponse, ApplicationType, OrganizationType } from "@/types/application";

const validApplicationTypes: ApplicationType[] = ["personal_member", "organization_member"];
const validOrganizationTypes: OrganizationType[] = ["宫观", "文化机构", "培训机构", "企业", "其他"];

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
  const values: ApplicationSubmitPayload = {
    applicationType,
    name: asString(payload.name),
    contactName: asString(payload.contactName),
    phone: asString(payload.phone),
    email: asString(payload.email),
    country: asString(payload.country),
    profile: asString(payload.profile),
    purpose: asString(payload.purpose),
    organizationType: asString(payload.organizationType) as OrganizationType,
    receiveNotice: payload.receiveNotice === true
  };

  if (!validApplicationTypes.includes(values.applicationType)) fieldErrors.applicationType = "申请类型不正确。";
  if (!values.name) fieldErrors.name = values.applicationType === "organization_member" ? "请填写机构名称。" : "请填写姓名。";
  if (!values.phone) fieldErrors.phone = "请填写手机或 WhatsApp。";
  if (!values.email) fieldErrors.email = "请填写邮箱。";
  if (values.email && !isEmail(values.email)) fieldErrors.email = "邮箱格式不正确。";
  if (!values.country) fieldErrors.country = "请填写所在国家或地区。";
  if (!values.profile) fieldErrors.profile = values.applicationType === "organization_member" ? "请填写机构简介。" : "请填写个人简介。";
  if (!values.purpose) fieldErrors.purpose = values.applicationType === "organization_member" ? "请填写合作意向。" : "请填写申请理由。";

  if (values.applicationType === "organization_member") {
    if (!values.contactName) fieldErrors.contactName = "请填写负责人姓名。";
    if (!values.organizationType || !validOrganizationTypes.includes(values.organizationType)) fieldErrors.organizationType = "请选择机构类型。";
  }

  if (values.applicationType === "personal_member") {
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
      fieldErrors
    };

    return NextResponse.json(response, { status: 400 });
  }

  const now = new Date().toISOString();
  const applicationNo = generateApplicationNo(values.applicationType);
  const application: ApplicationRecord = {
    applicationNo,
    applicationType: values.applicationType,
    status: "submitted",
    name: values.name,
    contactName: values.contactName || values.name,
    phone: values.phone,
    email: values.email,
    country: values.country,
    profile: values.profile,
    purpose: values.purpose,
    organizationType: values.organizationType,
    receiveNotice: values.receiveNotice,
    adminNote: "",
    createdAt: now,
    updatedAt: now
  };

  // TODO: Persist `application` to Supabase in the next stage.
  void application;

  const response: ApplicationSubmitResponse = {
    success: true,
    applicationNo,
    status: "submitted"
  };

  return NextResponse.json(response);
}
