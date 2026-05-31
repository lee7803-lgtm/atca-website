"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NotificationChannel, NotificationSendStatus } from "@/lib/notifications/types";

type NotificationSendActionProps = {
  id: string;
  channel: NotificationChannel;
  status: NotificationSendStatus;
};

export function NotificationSendAction({ id, channel, status }: NotificationSendActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const isEmail = channel === "email";
  const isSent = status === "sent";
  const disabled = isPending || !isEmail || isSent;
  const label = isSent ? "已处理" : "模拟发送";

  async function handleSend() {
    if (disabled) return;
    setMessage("");

    try {
      const response = await fetch(`/api/admin/notifications/${id}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      const nextMessage = body?.message || (response.ok ? "当前邮件 provider 尚未启用真实发送，本次未发送真实邮件。" : "通知操作失败，请稍后重试。");
      setMessage(nextMessage);
      if (response.ok) {
        startTransition(() => router.refresh());
      }
    } catch {
      setMessage("通知操作失败，请稍后重试。");
    }
  }

  return (
    <div className="flex min-w-[9rem] flex-col items-start gap-2">
      <button
        className="rounded-full border border-[#d8d0bf] bg-[#fbf8ef] px-3 py-2 text-xs font-semibold text-[#66594d] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={handleSend}
        title={!isEmail ? "当前仅支持邮件通知模拟发送" : isSent ? "该通知已处理" : "当前未接入真实邮件服务，仅执行模拟发送"}
        type="button"
      >
        {isPending ? "处理中" : label}
      </button>
      {!isEmail ? <p className="text-xs leading-5 text-[#8a6b3e]">当前仅支持邮件通知模拟发送</p> : null}
      {message ? <p className="max-w-[12rem] text-xs leading-5 text-[#5f5b52]">{message}</p> : null}
    </div>
  );
}
