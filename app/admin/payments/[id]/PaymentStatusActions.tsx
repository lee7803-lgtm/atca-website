"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTemplateButtons } from "@/components/admin/AdminTemplateButtons";
import type { PaymentStatus } from "@/lib/api/payments";

type ActionStatus = "manual_review" | "paid" | "cancelled";

const actionLabels: Record<ActionStatus, string> = {
  manual_review: "标记为待财务审核",
  paid: "确认已收款",
  cancelled: "标记为已取消"
};

const paymentStatusNoteTemplates = [
  { label: "人工复核", text: "付款金额或付款信息与订单不一致，需人工复核。" },
  { label: "确认收款", text: "已收到银行电汇付款凭证，金额与订单基本匹配，建议确认收款。" },
  { label: "取消订单", text: "该支付订单已取消，原因已由后台记录。" },
  { label: "财务确认", text: "已完成财务确认，可进入后续复审流程。" }
];

function getAllowedActions(status: PaymentStatus): ActionStatus[] {
  if (status === "pending_payment") return ["manual_review", "paid", "cancelled"];
  if (status === "manual_review") return ["paid", "cancelled"];
  if (status === "failed") return ["manual_review", "cancelled"];
  return [];
}

export function PaymentStatusActions({ orderId, status }: { orderId: string; status: PaymentStatus }) {
  const router = useRouter();
  const actions = getAllowedActions(status);
  const [adminNote, setAdminNote] = useState("");
  const [isSaving, setIsSaving] = useState<ActionStatus | "">("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const submit = async (nextStatus: ActionStatus) => {
    setIsSaving(nextStatus);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/payments/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, adminNote })
      });
      const result = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !result.success) {
        setMessageTone("error");
        setMessage(result.message || "支付订单状态未能保存。");
        return;
      }

      setMessageTone("success");
      setMessage("支付订单状态已保存。");
      setAdminNote("");
      router.refresh();
    } catch {
      setMessageTone("error");
      setMessage("支付订单状态保存服务暂时不可用。");
    } finally {
      setIsSaving("");
    }
  };

  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Manual Actions</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">人工处理</h2>
      <p className="mt-4 text-sm leading-7 text-[#5f5b52]">当前支付通道为银行电汇。建议优先在“付款凭证财务审核”中审核银行回执；确认已收款会写入支付事件、审计记录和通知记录，但不会自动跳过复审。</p>
      <label className="mt-5 grid gap-3">
        <span className="text-sm font-medium text-porcelain">后台备注</span>
        <textarea className="form-input min-h-24 resize-y" value={adminNote} onChange={(event) => setAdminNote(event.target.value)} />
      </label>
      <div className="mt-3">
        <AdminTemplateButtons disabled={Boolean(isSaving)} onSelect={setAdminNote} templates={paymentStatusNoteTemplates} />
      </div>
      {actions.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {actions.map((action) => (
            <button
              className="rounded-full bg-[#7F1D1D] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(isSaving)}
              key={action}
              onClick={() => submit(action)}
              type="button"
            >
              {isSaving === action ? "正在保存..." : actionLabels[action]}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">当前状态不支持本阶段人工变更。</p>
      )}
      {message ? (
        <div className={`mt-5 border-l-4 p-4 text-sm leading-7 ${messageTone === "success" ? "border-[#8a6b3e] bg-[#fbf8ef] text-[#5f5b52]" : "border-[#7F1D1D] bg-[#fbf0ec] text-[#7F1D1D]"}`}>
          {message}
        </div>
      ) : null}
    </section>
  );
}
