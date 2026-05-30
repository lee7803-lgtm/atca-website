"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { materialReviewItemLabels, materialReviewStatusLabels, type MaterialReview, type MaterialReviewStatus } from "@/types/certification";

export function MaterialReviewField({
  applicationId,
  disabled,
  disabledReason,
  itemKey,
  label,
  materialReview,
  targetHref
}: {
  applicationId: string;
  disabled: boolean;
  disabledReason?: string;
  itemKey: keyof MaterialReview;
  label?: string;
  materialReview: MaterialReview;
  targetHref?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState<MaterialReviewStatus>(materialReview[itemKey]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateValue = async (nextValue: MaterialReviewStatus) => {
    setValue(nextValue);
    setMessage("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/certification-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_material_review",
          materialReview: {
            ...materialReview,
            [itemKey]: nextValue
          }
        })
      });
      const result = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !result.success) {
        setValue(materialReview[itemKey]);
        setMessage(result.message || "材料审核状态未能保存。");
        return;
      }
      setMessage("已保存");
      router.refresh();
    } catch {
      setValue(materialReview[itemKey]);
      setMessage("材料审核状态暂时无法保存。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <label className="grid gap-2 rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 md:col-span-2">
      <span className="flex flex-col gap-2 text-sm font-medium text-porcelain sm:flex-row sm:items-center sm:justify-between">
        <span>{label || materialReviewItemLabels[itemKey]}审核状态</span>
        {targetHref ? <a className="text-xs font-semibold text-[#8a6b3e] hover:text-[#7F1D1D]" href={targetHref}>查看资料</a> : null}
      </span>
      <select className="form-input" disabled={disabled || isSaving} value={value} onChange={(event) => updateValue(event.target.value as MaterialReviewStatus)}>
        {Object.entries(materialReviewStatusLabels).map(([status, label]) => (
          <option key={status} value={status}>
            {label}
          </option>
        ))}
      </select>
      {disabled && disabledReason ? <span className="text-xs text-[#7F1D1D]">{disabledReason}</span> : null}
      {message ? <span className={`text-xs ${message === "已保存" ? "text-[#8a6b3e]" : "text-[#7F1D1D]"}`}>{message}</span> : null}
    </label>
  );
}
