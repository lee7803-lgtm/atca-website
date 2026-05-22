"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { FormTemplateHelper } from "@/components/FormTemplateHelper";
import { PageHero } from "@/components/PageHero";
import type { ApplicationSubmitResponse } from "@/types/application";

const organizationTypes = ["宫观道堂及文化场所", "传统文化机构", "教育研究机构", "社团组织", "合作单位"];

type FormValues = {
  organizationName: string;
  principalName: string;
  contact: string;
  email: string;
  region: string;
  organizationType: string;
  profile: string;
  cooperation: string;
  truthConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
};

const organizationProfileTemplate = `本机构基本情况如下：

1. 机构名称：【请填写】
2. 主要业务 / 服务方向：【请填写】
3. 过往相关活动或合作经历：【请填写】
4. 与道教文化、传统文化或文化交流相关的基础情况：【请填写】

本机构确认所提交资料真实有效，并愿意配合 ITCA 后续审核及沟通。`;

const cooperationTemplate = `本机构希望与 ITCA 在以下方向建立联系或合作：

1. 文化交流活动
2. 会员服务
3. 认证服务
4. 课程或研修项目
5. 其他合作方向：【请填写】

具体合作设想如下：【请根据实际情况填写】

本机构确认以上内容真实，并愿意配合后续沟通和资料补充。`;

const phonePattern = /^[+\d][\d\s().-]{5,29}$/;

const organizationNotices = [
  ["机构会员申请说明", "机构会员申请用于提交机构资料、负责人信息、所在地区、机构类型与合作意向，服务协会审核、建档与联系。"],
  ["真实性与责任说明", "申请人须确认所提交的机构名称、联系方式、身份资料、机构资料及相关说明真实、完整、合法，且为本人或经合法授权提交。协会有权对申请资料进行人工核验；对于资料不完整、无法核验、疑似冒用、伪造、虚假陈述或恶意提交的申请，协会有权要求补充材料、暂停审核、驳回申请，或在建档后撤销相关记录。"],
  ["机构资料用途说明", "所提交资料用于机构会员申请审核、资料建档、合作沟通、服务联系及必要的申请记录留存。"],
  ["审核与联系说明", "申请提交后将进入人工审核与联系流程，如需进一步核对或补充资料，协会可通过登记联系方式沟通。"],
  ["合作意向说明", "合作意向用于了解机构关注方向与后续沟通重点，不代表合作关系已自动成立。"],
  ["服务条款与隐私政策确认说明", "提交前请确认已阅读并同意服务条款、隐私政策及资料使用说明。"]
];

function validateValues(values: FormValues) {
  const errors: Partial<Record<keyof FormValues, string>> = {};

  if (!values.organizationName.trim()) errors.organizationName = "请填写机构名称。";
  else if (values.organizationName.trim().length < 2 || values.organizationName.trim().length > 80) errors.organizationName = "机构名称长度需为 2–80 个字符。";
  if (!values.principalName.trim()) errors.principalName = "请填写负责人姓名。";
  else if (values.principalName.trim().length < 2 || values.principalName.trim().length > 50) errors.principalName = "联系人姓名长度需为 2–50 个字符。";
  if (!values.contact.trim()) errors.contact = "请填写联系电话。";
  else if (!phonePattern.test(values.contact.trim())) errors.contact = "请填写有效联系电话。";
  if (!values.email.trim()) errors.email = "请填写邮箱。";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "请输入有效邮箱地址。";
  if (!values.region.trim()) errors.region = "请选择所在国家或地区。";
  if (!organizationTypes.includes(values.organizationType)) errors.organizationType = "请选择机构类型。";
  if (values.profile.trim().length < 30 || values.profile.trim().length > 2000) errors.profile = "请填写机构介绍，且不少于 30 字、不超过 2000 字。";
  if (values.cooperation.trim().length > 1500) errors.cooperation = "合作意向说明不能超过 1500 字。";
  if (!values.truthConfirmed) errors.truthConfirmed = "请确认所提交资料真实有效。";
  if (!values.termsAccepted) errors.termsAccepted = "请确认服务条款后再提交。";
  if (!values.privacyAccepted) errors.privacyAccepted = "请确认隐私政策后再提交。";

  return errors;
}

export default function OrganizationApplyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [values, setValues] = useState<FormValues>({
    organizationName: "",
    principalName: "",
    contact: "",
    email: "",
    region: "",
    organizationType: "",
    profile: "",
    cooperation: "",
    truthConfirmed: false,
    termsAccepted: false,
    privacyAccepted: false
  });

  const updateValue = (field: keyof FormValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrorMessage("");
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedFormData = new FormData(event.currentTarget);
    const companyWebsite = String(submittedFormData.get("companyWebsite") || "");

    if (isSubmitting) return;

    setErrorMessage("");
    const nextErrors = validateValues(values);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setErrorMessage("请补充或修正标记的内容后再提交。");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationType: "organization_member",
          name: values.organizationName,
          contactName: values.principalName,
          phone: values.contact,
          email: values.email,
          country: values.region,
          profile: values.profile,
          purpose: values.cooperation,
          organizationType: values.organizationType,
          truthConfirmed: values.truthConfirmed,
          termsAccepted: values.termsAccepted,
          privacyAccepted: values.privacyAccepted,
          companyWebsite
        })
      });
      const result = (await response.json()) as ApplicationSubmitResponse;

      if (!response.ok || !result.success) {
        setErrorMessage(result.success === false ? result.message : "申请提交未成功，请检查资料后重新提交。");
        return;
      }

      router.push(`/application/success?type=organization&number=${encodeURIComponent(result.applicationNo)}`);
    } catch {
      setErrorMessage("申请提交服务暂时不可用，请稍后再试或联系协会秘书处。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        actions={[
          { label: "会员申请", href: "/membership" },
          { label: "联系咨询", href: "/contact" }
        ]}
        eyebrow="Organization Application"
        title="机构会员申请"
        subtitle="Organization Member Application"
        intro="机构会员申请用于提交机构资料、负责人信息、合作方向与证明材料，服务协会审核、建档与合作联系。"
        backgroundImageSrc="/images/atca/member-gathering.jpg"
        backgroundImagePosition="center 48%"
        imageSrc="/images/itca/04-service-membership.png"
        imagePosition="center 48%"
        visualDescription="面向宫观、文化机构、教育研究机构、企业及其他合作单位的会员申请入口。"
        visualEyebrow="Application"
        visualMark="Organization"
        visualSeal="机构"
        visualTitle="机构会员申请"
      />

      <main className="section-surface">
        <section className="mx-auto grid max-w-6xl gap-8 px-5 pt-12 pb-12 sm:px-8 md:pt-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:pt-16 lg:pb-16">
          <aside className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)]">
            <p className="font-medium text-porcelain">申请说明</p>
            <p className="mt-3">
              请填写机构基础资料、负责人信息及合作方向。所提交资料将用于机构会员审核、档案管理及后续合作沟通。
            </p>
            <div className="mt-5 grid gap-4">
              {organizationNotices.map(([title, text]) => (
                <div className="border-t border-[#e4ded0] pt-4" key={title}>
                  <p className="font-medium text-porcelain">{title}</p>
                  <p className="mt-2">{text}</p>
                </div>
              ))}
            </div>
          </aside>

          <form className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8" onSubmit={submitApplication}>
            <input aria-hidden="true" autoComplete="off" className="hidden" name="companyWebsite" tabIndex={-1} type="text" />
            <div className="mb-7">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Form</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">机构会员资料</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field error={fieldErrors.organizationName} label="机构名称" required>
                <input className="form-input" required value={values.organizationName} onChange={(event) => updateValue("organizationName", event.target.value)} />
              </Field>
              <Field error={fieldErrors.principalName} label="负责人姓名" required>
                <input className="form-input" required value={values.principalName} onChange={(event) => updateValue("principalName", event.target.value)} />
              </Field>
              <Field error={fieldErrors.contact} label="手机 / WhatsApp" required>
                <input className="form-input" required value={values.contact} onChange={(event) => updateValue("contact", event.target.value)} />
              </Field>
              <Field error={fieldErrors.email} label="邮箱" required>
                <input className="form-input" required type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} />
              </Field>
              <Field error={fieldErrors.region} label="所在国家 / 地区" required>
                <input className="form-input" required value={values.region} onChange={(event) => updateValue("region", event.target.value)} />
              </Field>
              <Field error={fieldErrors.organizationType} label="机构类型" required>
                <select className="form-input" required value={values.organizationType} onChange={(event) => updateValue("organizationType", event.target.value)}>
                  <option value="">请选择机构类型</option>
                  {organizationTypes.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field error={fieldErrors.profile} className="md:col-span-2" label="机构介绍" required>
                <textarea className="form-input min-h-32 resize-y" maxLength={2000} required value={values.profile} onChange={(event) => updateValue("profile", event.target.value)} />
                <FormTemplateHelper hint="请说明机构基本情况、业务方向和相关文化交流基础，30–2000 字。" template={organizationProfileTemplate} onApply={() => updateValue("profile", organizationProfileTemplate)} />
              </Field>
              <Field error={fieldErrors.cooperation} className="md:col-span-2" label="合作意向说明">
                <textarea className="form-input min-h-36 resize-y" maxLength={1500} value={values.cooperation} onChange={(event) => updateValue("cooperation", event.target.value)} />
                <FormTemplateHelper hint="可说明拟合作方向和具体设想，最多 1500 字。" template={cooperationTemplate} onApply={() => updateValue("cooperation", cooperationTemplate)} />
              </Field>
              <ConfirmCheckbox checked={values.truthConfirmed} error={fieldErrors.truthConfirmed} label="本机构确认所提交的机构名称、联系方式、身份资料、机构资料及相关说明真实、完整、合法，且为本人或经合法授权提交；本机构理解协会可人工核验资料，并可对资料不完整、无法核验、疑似冒用、伪造、虚假陈述或恶意提交的申请要求补充材料、暂停审核、驳回申请，或在建档后撤销相关记录。" onChange={(checked) => updateValue("truthConfirmed", checked)} />
              <ConfirmCheckbox checked={values.termsAccepted} error={fieldErrors.termsAccepted} label="本机构已阅读并同意《服务条款》。" onChange={(checked) => updateValue("termsAccepted", checked)} />
              <ConfirmCheckbox checked={values.privacyAccepted} error={fieldErrors.privacyAccepted} label="本机构已阅读并同意《隐私政策》及资料使用说明。" onChange={(checked) => updateValue("privacyAccepted", checked)} />
            </div>

            {errorMessage ? (
              <div className="mt-6 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 border-t border-[#eee7da] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-6 text-[#777]">申请提交后，请保存页面显示的申请编号，以便后续查询办理进度。</p>
              <button className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting ? "正在提交..." : "提交机构会员申请"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}

function Field({ children, className = "", error = "", label, required = false }: { children: ReactNode; className?: string; error?: string; label: string; required?: boolean }) {
  return (
    <label className={`grid gap-3 rounded-2xl bg-white/45 p-3 ${className}`}>
      <span className="flex items-center gap-2 text-sm font-medium text-porcelain">
        {label}
        {required ? <span className="rounded-full bg-[#f8e8e8] px-2 py-0.5 text-xs text-[#7F1D1D]">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-[#7F1D1D]">{error}</span> : null}
    </label>
  );
}

function ConfirmCheckbox({ checked, error, label, onChange }: { checked: boolean; error?: string; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="grid gap-2 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52] md:col-span-2">
      <span className="flex items-start gap-3">
        <input className="mt-1 h-4 w-4 accent-[#7F1D1D]" checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
        <span>{label}</span>
      </span>
      {error ? <span className="text-xs text-[#7F1D1D]">{error}</span> : null}
    </label>
  );
}
