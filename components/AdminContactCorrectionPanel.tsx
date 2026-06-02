"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchableSelectWithOther } from "@/components/SearchableSelectWithOther";
import { countryRegionOptions, memberOrganizationTypeOptions } from "@/lib/select-options";
import type { RecordDisposition } from "@/types/application";

type ContactField = {
  key: string;
  label: string;
  required?: boolean;
  type?: "email" | "text";
  optionKind?: "country" | "organizationType";
};

const dispositionLabels: Record<RecordDisposition, string> = {
  normal: "正常记录",
  test: "测试记录",
  archived: "归档记录",
  voided: "作废记录"
};

export function AdminContactCorrectionPanel({
  actionUrl,
  disposition,
  fields,
  title = "基础联系方式修正",
  values
}: {
  actionUrl: string;
  disposition?: RecordDisposition;
  fields: ContactField[];
  title?: string;
  values: Record<string, string>;
}) {
  const router = useRouter();
  const [formValues, setFormValues] = useState(values);
  const [correctionNote, setCorrectionNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const currentDisposition = disposition || "normal";
  const disabled = currentDisposition === "voided";

  const save = async () => {
    if (disabled) {
      setMessageTone("error");
      setMessage("记录已作废，不允许修改联系方式。");
      return;
    }
    if (!correctionNote.trim()) {
      setMessageTone("error");
      setMessage("请填写修正原因。");
      return;
    }
    for (const field of fields) {
      if (field.required && !formValues[field.key]?.trim()) {
        setMessageTone("error");
        setMessage(`请填写${field.label}。`);
        return;
      }
    }

    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch(actionUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formValues, correctionNote })
      });
      const result = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        setMessageTone("error");
        setMessage(result.message || "联系方式修正未能保存。");
        return;
      }

      setMessageTone("success");
      setMessage("联系方式修正已保存。");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("联系方式修正服务暂时不可用，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="scroll-mt-6 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate sm:p-8" id="contact-correction">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Contact Correction</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">{title}</h2>
      <div className="mt-4 rounded-xl border border-[#e4ded0] bg-[#fbf8ef] px-4 py-3 text-sm leading-7 text-[#5f5b52]">
        <p>记录类型：{dispositionLabels[currentDisposition]}</p>
        {currentDisposition === "voided" ? <p className="mt-1 font-medium text-[#7F1D1D]">记录已作废，不允许修改联系方式。</p> : null}
        {currentDisposition === "test" || currentDisposition === "archived" ? <p className="mt-1 font-medium text-[#8a6b3e]">这是非正常记录，保存前请确认修正原因。</p> : null}
      </div>
      <div className="mt-5 grid gap-4">
        {fields.map((field) => (
          field.optionKind ? (
            <div className={disabled ? "pointer-events-none opacity-60" : ""} key={field.key}>
              <SearchableSelectWithOther
                label={field.label}
                options={field.optionKind === "country" ? countryRegionOptions : memberOrganizationTypeOptions}
                required={field.required}
                value={formValues[field.key] || ""}
                onChange={(value) => setFormValues((current) => ({ ...current, [field.key]: value }))}
              />
            </div>
          ) : (
            <label className="grid gap-3" key={field.key}>
              <span className="text-sm font-medium text-porcelain">{field.label}{field.required ? <span className="text-[#7F1D1D]"> *</span> : null}</span>
              <input
                className="form-input"
                disabled={disabled}
                type={field.type || "text"}
                value={formValues[field.key] || ""}
                onChange={(event) => setFormValues((current) => ({ ...current, [field.key]: event.target.value }))}
              />
            </label>
          )
        ))}
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">修正原因 <span className="text-[#7F1D1D]">*</span></span>
          <textarea className="form-input min-h-24 resize-y" disabled={disabled} value={correctionNote} onChange={(event) => setCorrectionNote(event.target.value)} />
          <span className="text-xs leading-5 text-[#5f5b52]">仅记录在后台审计日志，不会在前台申请查询中展示。</span>
        </label>
      </div>
      {message ? (
        <div className={`mt-5 border-l-4 p-4 text-sm leading-7 ${messageTone === "success" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>
          {message}
        </div>
      ) : null}
      <button className="mt-6 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={disabled || isSaving} onClick={save} type="button">
        {isSaving ? "正在保存..." : "保存联系方式修正"}
      </button>
    </section>
  );
}
