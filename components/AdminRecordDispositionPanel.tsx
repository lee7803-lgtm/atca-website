"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTemplateButtons } from "@/components/admin/AdminTemplateButtons";
import type { RecordDisposition } from "@/types/application";

const dispositionOptions: Array<{ value: RecordDisposition; label: string; description: string }> = [
  { value: "normal", label: "正常记录", description: "后台默认显示，申请人可按现有规则查询。" },
  { value: "test", label: "测试记录", description: "后台默认隐藏，申请人不可查，不占用邮箱 / 手机号。" },
  { value: "archived", label: "归档记录", description: "后台默认隐藏，申请人可查并显示归档提示。" },
  { value: "voided", label: "作废记录", description: "后台默认隐藏，申请人查询时仅提示联系秘书处。" }
];

const dispositionLabels: Record<RecordDisposition, string> = {
  normal: "正常记录",
  test: "测试记录",
  archived: "归档记录",
  voided: "作废记录"
};

const recordDispositionNoteTemplates = [
  { label: "测试记录", text: "该记录用于流程测试，标记为测试记录，不占用正常申请查询与重复申请限制。" },
  { label: "归档记录", text: "该记录已完成阶段性处理，标记为归档保留记录。" },
  { label: "作废记录", text: "该记录因重复、误提交或线下确认不再使用，标记为作废并保留审计记录。" },
  { label: "恢复正常", text: "资料已复核，恢复为正常记录，继续按现有流程处理。" }
];

export function AdminRecordDispositionPanel({
  actionUrl,
  disposition,
  note,
  updatedAt,
  updatedBy
}: {
  actionUrl: string;
  disposition?: RecordDisposition;
  note?: string;
  updatedAt?: string | null;
  updatedBy?: string;
}) {
  const router = useRouter();
  const [recordDisposition, setRecordDisposition] = useState<RecordDisposition>(disposition || "normal");
  const [recordDispositionNote, setRecordDispositionNote] = useState(note || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const save = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(actionUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordDisposition, recordDispositionNote })
      });
      const result = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        setMessageTone("error");
        setMessage(result.message || "记录治理状态未能保存。");
        return;
      }

      setMessageTone("success");
      setMessage("记录治理状态已保存。");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("记录治理保存服务暂时不可用，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="scroll-mt-6 rounded-2xl border border-[#e4ded0] bg-white/94 p-5 shadow-aureate sm:p-8" id="record-disposition">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Record Disposition</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">记录治理</h2>
      <div className="mt-5 grid gap-4">
        <div className="rounded-xl border border-[#e4ded0] bg-[#fbf8ef] px-4 py-3 text-sm leading-7 text-[#5f5b52]">
          <p className="font-semibold text-porcelain">{dispositionLabels[disposition || "normal"]}</p>
          <p className="mt-1">备注：{note || "暂无备注"}</p>
          <p className="mt-1">操作人：{updatedBy || "未记录"}</p>
          <p className="mt-1">操作时间：{updatedAt ? formatDateTime(updatedAt) : "未记录"}</p>
        </div>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">记录类型</span>
          <select className="form-input" value={recordDisposition} onChange={(event) => setRecordDisposition(event.target.value as RecordDisposition)}>
            {dispositionOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <span className="text-xs leading-5 text-[#5f5b52]">{dispositionOptions.find((item) => item.value === recordDisposition)?.description}</span>
        </label>
        <label className="grid gap-3">
          <span className="text-sm font-medium text-porcelain">治理备注</span>
          <textarea className="form-input min-h-24 resize-y" value={recordDispositionNote} onChange={(event) => setRecordDispositionNote(event.target.value)} />
          <AdminTemplateButtons disabled={isSaving} onSelect={setRecordDispositionNote} templates={recordDispositionNoteTemplates} />
          <span className="text-xs leading-5 text-[#5f5b52]">建议填写调整原因、依据或线下处理说明，避免将作废、归档误认为删除。</span>
        </label>
      </div>
      {message ? (
        <div className={`mt-5 border-l-4 p-4 text-sm leading-7 ${messageTone === "success" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>
          {message}
        </div>
      ) : null}
      <button className="mt-6 w-full rounded-full bg-[#7F1D1D] px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={isSaving} onClick={save} type="button">
        {isSaving ? "正在保存..." : "保存记录治理状态"}
      </button>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
