"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { FormTemplateHelper } from "@/components/FormTemplateHelper";
import { PageHero } from "@/components/PageHero";
import type { ApplicationSubmitResponse } from "@/types/application";

type FormValues = {
  memberType: string;
  name: string;
  contact: string;
  email: string;
  region: string;
  profile: string;
  reason: string;
  notice: boolean;
  truthConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
};

const memberTypes = ["个人会员"];
const memberApplicationTemplate = `本人申请成为 ITCA 会员，主要希望参与协会相关文化交流、学习活动、会员服务及后续项目合作。

本人关注的方向包括：
1. 道教文化学习与交流
2. 传统文化活动参与
3. 认证、课程、会员服务或合作项目
4. 其他：【请填写】

本人确认所提交信息真实有效，并同意 ITCA 根据会员申请流程进行审核与联系。`;

const supplementalTemplate = `补充说明如下：

1. 关于本人经历或资料的补充说明：【请填写】
2. 关于证明材料的补充说明：【请填写】
3. 关于联系方式、证书信息或其他事项的说明：【请填写】

如以上内容仍需补充，本人愿意配合 ITCA 后续审核要求。`;

const phonePattern = /^[+\d][\d\s().-]{5,29}$/;

function validateValues(values: FormValues) {
  const errors: Partial<Record<keyof FormValues, string>> = {};

  if (!memberTypes.includes(values.memberType)) errors.memberType = "请选择会员类型。";
  if (!values.name.trim()) errors.name = "请填写姓名。";
  else if (values.name.trim().length < 2 || values.name.trim().length > 50) errors.name = "姓名长度需为 2–50 个字符。";
  if (!values.contact.trim()) errors.contact = "请填写联系电话。";
  else if (!phonePattern.test(values.contact.trim())) errors.contact = "请填写有效联系电话。";
  if (!values.email.trim()) errors.email = "请填写邮箱。";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "请输入有效邮箱地址。";
  if (!values.region.trim()) errors.region = "请选择所在国家或地区。";
  if (values.profile.trim().length > 1000) errors.profile = "补充备注不能超过 1000 字。";
  if (values.reason.trim().length < 20 || values.reason.trim().length > 1500) errors.reason = "请填写会员申请说明，且不少于 20 字、不超过 1500 字。";
  if (!values.truthConfirmed) errors.truthConfirmed = "请确认所提交资料真实有效。";
  if (!values.termsAccepted) errors.termsAccepted = "请确认服务条款后再提交。";
  if (!values.privacyAccepted) errors.privacyAccepted = "请确认隐私政策后再提交。";

  return errors;
}

export default function MemberApplyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [values, setValues] = useState<FormValues>({
    memberType: "个人会员",
    name: "",
    contact: "",
    email: "",
    region: "",
    profile: "",
    reason: "",
    notice: false,
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
          applicationType: "personal_member",
          name: values.name,
          contactName: values.name,
          phone: values.contact,
          email: values.email,
          country: values.region,
          profile: values.profile,
          purpose: values.reason,
          receiveNotice: values.notice,
          truthConfirmed: values.truthConfirmed,
          termsAccepted: values.termsAccepted,
          privacyAccepted: values.privacyAccepted
        })
      });
      const result = (await response.json()) as ApplicationSubmitResponse;

      if (!response.ok || !result.success) {
        setErrorMessage(result.success === false ? result.message : "申请提交未成功，请检查资料后重新提交。");
        return;
      }

      router.push(`/application/success?type=member&number=${encodeURIComponent(result.applicationNo)}`);
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
        eyebrow="Member Application"
        title="个人会员申请"
        subtitle="Individual Member Application"
        intro="个人会员申请用于提交基础资料、联系方式、学习经历与参与意向，服务协会会员审核、建档与后续联系。"
        imageSrc="/images/itca/04-service-membership.png"
        imagePosition="center 46%"
        visualDescription="个人会员申请资料将用于协会会员服务、活动联系与后续审核沟通。"
        visualEyebrow="Application"
        visualMark="Member"
        visualSeal="个人"
        visualTitle="个人会员申请"
      />

      <main className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:px-8 md:pt-14 lg:pt-16 lg:pb-16">
        <section className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <aside className="border-l-4 border-[#7F1D1D] bg-[#fbf8ef] p-6 text-sm leading-8 text-[#5f5b52] shadow-[0_16px_45px_rgba(176,138,69,0.08)]">
            <p className="font-medium text-porcelain">申请说明</p>
            <p className="mt-3">
              请填写个人基础资料及相关说明。所提交资料将用于会员服务、资料建档、活动联系及后续审核沟通。
            </p>
          </aside>

          <form className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8" onSubmit={submitApplication}>
            <div className="mb-7">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Application Form</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-porcelain">个人会员资料</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field error={fieldErrors.memberType} label="会员类型" required>
                <select className="form-input" required value={values.memberType} onChange={(event) => updateValue("memberType", event.target.value)}>
                  {memberTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
              <Field error={fieldErrors.name} label="姓名" required>
                <input className="form-input" required value={values.name} onChange={(event) => updateValue("name", event.target.value)} />
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
              <Field error={fieldErrors.profile} className="md:col-span-2" label="补充备注">
                <textarea className="form-input min-h-32 resize-y" maxLength={1000} value={values.profile} onChange={(event) => updateValue("profile", event.target.value)} />
                <FormTemplateHelper hint="可补充个人经历、联系方式或资料说明，最多 1000 字。" template={supplementalTemplate} onApply={() => updateValue("profile", supplementalTemplate)} />
              </Field>
              <Field error={fieldErrors.reason} className="md:col-span-2" label="会员申请说明" required>
                <textarea className="form-input min-h-36 resize-y" maxLength={1500} required value={values.reason} onChange={(event) => updateValue("reason", event.target.value)} />
                <FormTemplateHelper hint="请说明申请会员的真实目的、关注方向和希望参与的服务，20–1500 字。" template={memberApplicationTemplate} onApply={() => updateValue("reason", memberApplicationTemplate)} />
              </Field>
              <label className="flex items-start gap-3 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52] md:col-span-2">
                <input className="mt-1 h-4 w-4 accent-[#7F1D1D]" checked={values.notice} type="checkbox" onChange={(event) => updateValue("notice", event.target.checked)} />
                <span>愿意接收协会通知、活动联络及申请审核相关消息</span>
              </label>
              <ConfirmCheckbox checked={values.truthConfirmed} error={fieldErrors.truthConfirmed} label="我确认所填写的申请资料真实、完整、合法。" onChange={(checked) => updateValue("truthConfirmed", checked)} />
              <ConfirmCheckbox checked={values.termsAccepted} error={fieldErrors.termsAccepted} label="我已阅读并同意《服务条款》。" onChange={(checked) => updateValue("termsAccepted", checked)} />
              <ConfirmCheckbox checked={values.privacyAccepted} error={fieldErrors.privacyAccepted} label="我已阅读并同意《隐私政策》及资料使用说明。" onChange={(checked) => updateValue("privacyAccepted", checked)} />
            </div>

            {errorMessage ? (
              <div className="mt-6 border-l-4 border-[#7F1D1D] bg-[#fbf0ec] p-4 text-sm leading-7 text-[#7F1D1D]" role="alert">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 border-t border-[#eee7da] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-6 text-[#777]">申请提交后，请保存页面显示的申请编号，以便后续查询办理进度。</p>
              <button className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting ? "正在提交..." : "提交个人会员申请"}
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
