"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { PageHero } from "@/components/PageHero";
import type { ApplicationSubmitResponse } from "@/types/application";

type FormValues = {
  name: string;
  contact: string;
  email: string;
  region: string;
  profile: string;
  reason: string;
  notice: boolean;
};

export default function MemberApplyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [values, setValues] = useState<FormValues>({
    name: "",
    contact: "",
    email: "",
    region: "",
    profile: "",
    reason: "",
    notice: false
  });

  const updateValue = (field: keyof FormValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrorMessage("");
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");
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
          receiveNotice: values.notice
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
        eyebrow="Member Application"
        title="个人会员申请"
        subtitle="Individual Member Application"
        intro="请填写个人基础资料及相关说明。所提交资料将用于会员服务、资料建档、活动联系及后续审核沟通。"
        imageSrc="/images/atca/member-gathering.jpg"
        imagePosition="center 46%"
        visualDescription="个人会员申请资料将用于协会会员服务、活动联系与后续审核沟通。"
        visualEyebrow="Application"
        visualMark="Member"
        visualSeal="个人"
        visualTitle="个人会员申请"
      />

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 lg:py-16">
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
              <Field label="姓名" required>
                <input className="form-input" required value={values.name} onChange={(event) => updateValue("name", event.target.value)} />
              </Field>
              <Field label="手机 / WhatsApp" required>
                <input className="form-input" required value={values.contact} onChange={(event) => updateValue("contact", event.target.value)} />
              </Field>
              <Field label="邮箱" required>
                <input className="form-input" required type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} />
              </Field>
              <Field label="所在国家 / 地区" required>
                <input className="form-input" required value={values.region} onChange={(event) => updateValue("region", event.target.value)} />
              </Field>
              <Field className="md:col-span-2" label="个人简介" required>
                <textarea className="form-input min-h-32 resize-y" required value={values.profile} onChange={(event) => updateValue("profile", event.target.value)} />
              </Field>
              <Field className="md:col-span-2" label="申请理由" required>
                <textarea className="form-input min-h-36 resize-y" required value={values.reason} onChange={(event) => updateValue("reason", event.target.value)} />
              </Field>
              <label className="flex items-start gap-3 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52] md:col-span-2">
                <input className="mt-1 h-4 w-4 accent-[#7F1D1D]" checked={values.notice} type="checkbox" onChange={(event) => updateValue("notice", event.target.checked)} />
                <span>愿意接收协会通知、活动联络及申请审核相关消息</span>
              </label>
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

function Field({ children, className = "", label, required = false }: { children: ReactNode; className?: string; label: string; required?: boolean }) {
  return (
    <label className={`grid gap-3 rounded-2xl bg-white/45 p-3 ${className}`}>
      <span className="flex items-center gap-2 text-sm font-medium text-porcelain">
        {label}
        {required ? <span className="rounded-full bg-[#f8e8e8] px-2 py-0.5 text-xs text-[#7F1D1D]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
