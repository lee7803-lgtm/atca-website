import { NextResponse } from "next/server";
import { recordSupplementSubmittedNotification } from "@/lib/notifications/workflows";
import {
  findApplicationSupplementTarget,
  findCertificationSupplementTarget,
  SupabaseConfigError,
  SupabaseRequestError,
  updateApplicationSupplement,
  updateCertificationSupplement,
  uploadCertificationAttachment
} from "@/lib/supabase/server";
import { getAdultBirthDateError } from "@/lib/validation/age";
import { getUploadFileError, isAllowedUploadFile, maxUploadFileSize } from "@/lib/validation/files";
import { hasValidLength, isLatinName, latinNameMessage, personNameLengthMessage } from "@/lib/validation/names";
import { internationalPhoneMessage, isInternationalPhone } from "@/lib/validation/phone";
import type { CertificationApplicationAdminRecord, CertificationAttachment, SupplementalSubmission } from "@/types/certification";

const maxFiles = 5;

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function collectFiles(formData: FormData) {
  const files: Array<{ fieldName: string; file: File }> = [];
  formData.forEach((value, key) => {
    if (value instanceof File && value.size > 0) files.push({ fieldName: key === "photo" || key === "supplementPhoto" ? "photo" : key || "supplementFiles", file: value });
  });
  return files;
}

function changedFields(current: Record<string, string>, next: Record<string, string>, labels: Record<string, string>) {
  return Object.entries(next)
    .filter(([field, value]) => value !== "" && value !== current[field])
    .map(([field, value]) => ({
      field: labels[field] || field,
      oldValue: summarizeChangeValue(current[field]),
      newValue: summarizeChangeValue(value)
    }));
}

function summarizeChangeValue(value: string) {
  const text = value.trim();
  if (!text) return "未填写";
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
}

function validateCertificationRequired(values: Record<string, string>) {
  if (!values.masterName || !values.masterTaoistName || !values.lineage || !values.templeOrOrganization || !values.sect) {
    return "请完整填写师承信息，包括师父姓名、道派 / 传承体系及宫观 / 机构信息。";
  }
  if (!values.recommenderName || !values.recommenderContact || !values.recommenderRelation) {
    return "请填写推荐人姓名、联系方式及推荐关系说明。";
  }
  return "";
}

function validateSupplementContactFields(values: Record<string, string>) {
  if (values.phone && !isInternationalPhone(values.phone)) return internationalPhoneMessage;
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return "请输入有效邮箱地址。";
  return "";
}

function validateCertificationSupplementFields(values: Record<string, string>) {
  const contactError = validateSupplementContactFields(values);
  if (contactError) return contactError;
  if (!values.applicantNameEn) return "请填写英文名 / 拼音。";
  if (values.applicantNameEn && !isLatinName(values.applicantNameEn)) return latinNameMessage;
  if (!values.gender) return "请选择性别。";
  if (!values.birthDate) return "请填写出生日期。";
  if (values.birthDate) {
    const birthDateError = getAdultBirthDateError(values.birthDate);
    if (birthDateError) return birthDateError;
  }
  if (values.experienceSummary && !hasValidLength(values.experienceSummary, 30, 2000)) return "请填写道教履历说明，且不少于 30 字、不超过 2000 字。";
  if (!values.applicationReason || !hasValidLength(values.applicationReason, 20, 1500)) return "申请理由需不少于 20 字、不超过 1500 字。";
  if (values.additionalNote && values.additionalNote.length > 1000) return "补充备注不能超过 1000 字。";
  return "";
}

function validateMemberSupplementFields(values: Record<string, string>, applicationType: string) {
  const contactError = validateSupplementContactFields(values);
  if (contactError) return contactError;
  const isOrganization = applicationType === "organization_member";
  if (values.name && !hasValidLength(values.name, 2, isOrganization ? 80 : 50)) return isOrganization ? "请填写机构名称，长度 2-80 个字符。" : personNameLengthMessage;
  if (values.contactName && !hasValidLength(values.contactName, 2, 50)) return personNameLengthMessage;
  if (isOrganization && values.profile && !hasValidLength(values.profile, 30, 2000)) return "请填写机构介绍，且不少于 30 字、不超过 2000 字。";
  if (!isOrganization && values.profile && values.profile.length > 1000) return "补充备注不能超过 1000 字。";
  if (isOrganization && values.purpose && values.purpose.length > 1500) return "合作意向说明不能超过 1500 字。";
  if (!isOrganization && values.purpose && !hasValidLength(values.purpose, 20, 1500)) return "请填写会员申请说明，且不少于 20 字、不超过 1500 字。";
  return "";
}

function certificationCurrent(application: CertificationApplicationAdminRecord) {
  return {
    applicantNameEn: application.applicantNameEn ?? "",
    gender: application.gender ?? "",
    birthDate: application.birthDate ?? "",
    nationality: application.nationality ?? "",
    residence: application.residence ?? "",
    address: application.address ?? "",
    phone: application.phone ?? "",
    email: application.email ?? "",
    masterName: application.masterName ?? "",
    masterTaoistName: application.masterTaoistName ?? "",
    lineage: application.lineage ?? "",
    templeOrOrganization: application.templeOrOrganization ?? "",
    sect: application.sect ?? "",
    practiceYears: application.practiceYears ?? "",
    experienceSummary: application.experienceSummary ?? "",
    applicationReason: application.applicationReason ?? "",
    additionalNote: application.additionalNote ?? "",
    recommenderName: application.recommenderName ?? "",
    recommenderContact: application.recommenderContact ?? "",
    recommenderRelation: application.recommenderRelation ?? ""
  };
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: "补充资料格式不正确，请检查后重新提交。" }, { status: 400 });
  }

  if (asString(formData.get("companyWebsite"))) {
    return NextResponse.json({ success: false, message: "补充资料未通过基础校验，请稍后重试。" }, { status: 400 });
  }

  const applicationNo = asString(formData.get("applicationNo"));
  const contact = asString(formData.get("contact"));
  const supplementNote = asString(formData.get("supplementNote"));

  if (!applicationNo || !contact) return NextResponse.json({ success: false, message: "请填写申请编号和登记邮箱 / 手机号。" }, { status: 400 });
  if (!supplementNote) return NextResponse.json({ success: false, message: "请填写补充说明。" }, { status: 400 });

  const files = collectFiles(formData);
  if (files.length > maxFiles) return NextResponse.json({ success: false, message: "单次最多上传 5 个补充文件。" }, { status: 400 });
  for (const { file } of files) {
    if (file.size <= 0) return NextResponse.json({ success: false, message: "请勿上传空文件。" }, { status: 400 });
    if (!isAllowedUploadFile(file)) return NextResponse.json({ success: false, message: getUploadFileError(file) }, { status: 400 });
    if (file.size > maxUploadFileSize) return NextResponse.json({ success: false, message: getUploadFileError(file) }, { status: 400 });
  }

  try {
    const certification = await findCertificationSupplementTarget(applicationNo, contact);
    if (certification) {
      if (certification.recordDisposition === "archived") {
        return NextResponse.json({ success: false, message: "记录已归档，不支持继续在线补充资料。" }, { status: 400 });
      }
      if (certification.recordDisposition === "voided") {
        return NextResponse.json({ success: false, message: "记录已作废，请联系秘书处。" }, { status: 410 });
      }
      if (certification.recordDisposition && certification.recordDisposition !== "normal") {
        return NextResponse.json({ success: false, message: "当前记录类型不支持在线提交补充资料。" }, { status: 400 });
      }
      if (certification.status !== "need_more_info") {
        return NextResponse.json({ success: false, message: "当前申请状态暂不支持在线提交补充资料。" }, { status: 400 });
      }

      const current = certificationCurrent(certification);
      const next = { ...current };
      Object.keys(next).forEach((field) => {
        const value = asString(formData.get(field));
        if (value) next[field as keyof typeof next] = value;
      });

      const requiredMessage = validateCertificationRequired(next);
      if (requiredMessage) return NextResponse.json({ success: false, message: requiredMessage }, { status: 400 });
      const certificationFieldMessage = validateCertificationSupplementFields(next);
      if (certificationFieldMessage) return NextResponse.json({ success: false, message: certificationFieldMessage }, { status: 400 });

      const now = new Date().toISOString();
      const supplementRound = certification.supplementalSubmissions.length + 1;
      const uploadedFiles: CertificationAttachment[] = [];
      for (const { fieldName, file } of files) {
        uploadedFiles.push(
          await uploadCertificationAttachment({
            applicationNo: certification.applicationNo,
            fieldName,
            file,
            category: "supporting_documents",
            uploadedAt: now,
            source: "supplement",
            supplementRound
          })
        );
      }

      const nextSupportingDocuments = [...certification.supportingDocuments, ...uploadedFiles];
      const latestPhotoPath = uploadedFiles.find((file) => file.fieldName === "photo" && file.storagePath)?.storagePath || certification.certificatePhotoPath;
      const fieldLabels: Record<string, string> = {
        applicantNameEn: "英文名",
        gender: "性别",
        birthDate: "出生日期",
        nationality: "国籍",
        residence: "现居地",
        address: "地址",
        phone: "电话 / WhatsApp",
        email: "邮箱",
        masterName: "师父姓名",
        masterTaoistName: "师父道名 / 法名",
        lineage: "传承体系",
        templeOrOrganization: "宫观 / 机构",
        sect: "师承或传承说明",
        practiceYears: "修行年限",
        experienceSummary: "经历说明",
        applicationReason: "申请理由",
        additionalNote: "补充备注",
        recommenderName: "推荐人姓名",
        recommenderContact: "推荐人联系方式",
        recommenderRelation: "推荐关系 / 推荐说明"
      };
      const certificationChangedFields = changedFields(current, next, fieldLabels);
      if (uploadedFiles.length > 0) {
        certificationChangedFields.push({ field: "上传材料", oldValue: "已保留原材料", newValue: `新增 ${uploadedFiles.length} 个文件` });
      }
      if (latestPhotoPath !== certification.certificatePhotoPath) {
        certificationChangedFields.push({ field: "道装证件照", oldValue: certification.certificatePhotoPath ? "已记录" : "未填写", newValue: "已更新" });
      }
      const submission: SupplementalSubmission = {
        submittedAt: now,
        submittedBy: "applicant",
        applicationNo: certification.applicationNo,
        contact,
        note: supplementNote,
        changedFields: certificationChangedFields,
        files: uploadedFiles,
        previousStatus: certification.status,
        nextStatus: "under_review"
      };

      await updateCertificationSupplement(certification.id, {
        ...next,
        supportingDocuments: nextSupportingDocuments,
        certificatePhotoPath: latestPhotoPath,
        supplementalSubmissions: [...certification.supplementalSubmissions, submission],
        internalReviewNote: [certification.internalReviewNote, "申请人已在线补充 / 修改资料，系统已转回审核中。"].filter(Boolean).join("\n")
      });
      await recordSupplementSubmittedNotification({
        certificationApplicationId: certification.id,
        applicationNo: certification.applicationNo,
        recipientName: certification.applicantName,
        recipientEmail: certification.email,
        applicationKind: "certification",
        supplementRound
      });

      return NextResponse.json({ success: true, message: "补充资料已提交", files: uploadedFiles.map((file) => file.originalName) });
    }

    const application = await findApplicationSupplementTarget(applicationNo, contact);
    if (!application) return NextResponse.json({ success: false, message: "未查询到匹配的申请记录。请确认申请编号和联系方式是否准确。" }, { status: 404 });
    if (application.recordDisposition === "archived") {
      return NextResponse.json({ success: false, message: "记录已归档，不支持继续在线补充资料。" }, { status: 400 });
    }
    if (application.recordDisposition === "voided") {
      return NextResponse.json({ success: false, message: "记录已作废，请联系秘书处。" }, { status: 410 });
    }
    if (application.recordDisposition !== "normal") {
      return NextResponse.json({ success: false, message: "当前记录类型不支持在线提交补充资料。" }, { status: 400 });
    }
    if (application.status !== "need_more_info") {
      return NextResponse.json({ success: false, message: "当前申请状态暂不支持在线提交补充资料。" }, { status: 400 });
    }

    const current = {
      name: application.name,
      contactName: application.contactName,
      phone: application.phone,
      email: application.email,
      country: application.country,
      profile: application.profile,
      purpose: application.purpose
    };
    const next = { ...current };
    Object.keys(next).forEach((field) => {
      const value = asString(formData.get(field));
      if (value) next[field as keyof typeof next] = value;
    });

    const memberFieldMessage = validateMemberSupplementFields(next, application.applicationType);
    if (memberFieldMessage) return NextResponse.json({ success: false, message: memberFieldMessage }, { status: 400 });

    const now = new Date().toISOString();
    const supplementRound = application.supplementalSubmissions.length + 1;
    const uploadedFiles: CertificationAttachment[] = [];
    for (const { fieldName, file } of files) {
      uploadedFiles.push(
        await uploadCertificationAttachment({
          applicationNo: application.applicationNo,
          fieldName,
          file,
          category: "supporting_documents",
          uploadedAt: now,
          source: "supplement",
          supplementRound
        })
      );
    }
    const submission: SupplementalSubmission = {
      submittedAt: now,
      submittedBy: "applicant",
      applicationNo: application.applicationNo,
      contact,
      note: supplementNote,
      changedFields: changedFields(current, next, {
        name: "姓名 / 机构名称",
        contactName: "联系人",
        phone: "电话 / WhatsApp",
        email: "邮箱",
        country: "地址 / 国家地区",
        profile: "申请资料说明",
        purpose: "申请说明"
      }),
      files: uploadedFiles,
      previousStatus: application.status,
      nextStatus: "under_review"
    };

    await updateApplicationSupplement(application.id, {
      ...next,
      adminNote: application.adminNote,
      supplementalSubmissions: [...application.supplementalSubmissions, submission]
    });
    await recordSupplementSubmittedNotification({
      applicationId: application.id,
      applicationNo: application.applicationNo,
      recipientName: application.applicationType === "organization_member" ? application.contactName || application.name : application.name,
      recipientEmail: application.email,
      applicationKind: application.applicationType === "organization_member" ? "organization" : "member",
      supplementRound
    });

    return NextResponse.json({ success: true, message: "补充资料已提交", files: uploadedFiles.map((file) => file.originalName) });
  } catch (error) {
    if (error instanceof SupabaseConfigError) return NextResponse.json({ success: false, message: "补充资料提交服务尚未完成系统配置，请联系协会秘书处。" }, { status: 500 });
    if (error instanceof SupabaseRequestError) return NextResponse.json({ success: false, message: "补充资料暂时无法保存，请稍后重试或联系协会秘书处。" }, { status: error.status >= 400 && error.status < 500 ? 400 : 500 });
    return NextResponse.json({ success: false, message: "补充资料提交服务暂时不可用，请稍后重试。" }, { status: 500 });
  }
}
