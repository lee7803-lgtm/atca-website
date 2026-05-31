"use client";

import Link from "next/link";
import { useState } from "react";
import type { PaymentOrderDetail } from "@/lib/api/payments";

type CreatePaymentOrderFormProps = {
  sourceType: "application" | "certification_application";
  sourceId: string;
  title?: string;
};

type CreatePaymentOrderResponse =
  | {
      success: true;
      order: PaymentOrderDetail;
      created: boolean;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export function CreatePaymentOrderForm({ sourceId, sourceType, title = "生成支付订单" }: CreatePaymentOrderFormProps) {
  const [amount, setAmount] = useState("0.00");
  const [currency, setCurrency] = useState("USD");
  const [provider, setProvider] = useState<"manual" | "none">("manual");
  const [paymentChannel, setPaymentChannel] = useState("manual");
  const [adminNote, setAdminNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState<boolean | null>(null);
  const [order, setOrder] = useState<PaymentOrderDetail | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setCreated(null);

    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sourceType,
          sourceId,
          amount: Number(amount),
          currency,
          provider,
          paymentChannel,
          adminNote
        })
      });
      const result = (await response.json().catch(() => null)) as CreatePaymentOrderResponse | null;

      if (!response.ok || !result || !result.success) {
        setMessage(result && !result.success ? result.message : "支付订单未能生成。");
        return;
      }

      setOrder(result.order);
      setCreated(result.created);
      setMessage(result.message);
    } catch {
      setMessage("支付订单创建服务暂时不可用。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#e4ded0] bg-white/94 p-6 shadow-aureate sm:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">Payment Order</p>
      <h2 className="mt-3 font-serif text-3xl text-porcelain">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#5f5b52]">本轮仅生成 manual / none 支付订单，不创建前台付款链接。</p>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-porcelain">
          金额
          <input className="rounded-xl border border-[#d8d0bf] bg-white px-4 py-3 text-sm text-ink outline-none focus:border-[#7F1D1D]" min="0" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-porcelain">
          币种
          <input className="rounded-xl border border-[#d8d0bf] bg-white px-4 py-3 text-sm uppercase text-ink outline-none focus:border-[#7F1D1D]" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-porcelain">
          Provider
          <select
            className="rounded-xl border border-[#d8d0bf] bg-white px-4 py-3 text-sm text-ink outline-none focus:border-[#7F1D1D]"
            value={provider}
            onChange={(event) => {
              const nextProvider = event.target.value as "manual" | "none";
              setProvider(nextProvider);
              setPaymentChannel(nextProvider);
            }}
          >
            <option value="manual">manual</option>
            <option value="none">none</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-porcelain">
          支付渠道
          <input className="rounded-xl border border-[#d8d0bf] bg-white px-4 py-3 text-sm text-ink outline-none focus:border-[#7F1D1D]" value={paymentChannel} onChange={(event) => setPaymentChannel(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-porcelain">
          后台备注
          <textarea className="min-h-28 rounded-xl border border-[#d8d0bf] bg-white px-4 py-3 text-sm leading-7 text-ink outline-none focus:border-[#7F1D1D]" value={adminNote} onChange={(event) => setAdminNote(event.target.value)} />
        </label>
        <button className="rounded-full bg-[#7F1D1D] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)] transition hover:bg-[#6f1919] disabled:cursor-not-allowed disabled:bg-[#a89b89]" disabled={isSaving} type="submit">
          {isSaving ? "生成中..." : "生成支付订单"}
        </button>
      </form>
      {message ? (
        <div className="mt-5 rounded-2xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-sm leading-7 text-[#5f5b52]">
          <p>{message}</p>
          {order ? (
            <div className="mt-3 grid gap-2">
              <p className="font-semibold text-porcelain">{created === false ? "已有订单" : "支付订单"}：{order.orderNo}</p>
              <Link className="font-semibold text-[#8a6b3e] hover:text-[#7F1D1D]" href={`/admin/payments/${order.id}`}>
                查看支付订单详情
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
