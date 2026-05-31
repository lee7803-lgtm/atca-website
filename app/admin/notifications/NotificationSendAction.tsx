"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NotificationChannel, NotificationSendStatus } from "@/lib/notifications/types";

type NotificationSendActionProps = {
  id: string;
  channel: NotificationChannel;
  status: NotificationSendStatus;
  label: string;
  title: string;
  helperText: string;
};

export function NotificationSendAction({ id, channel, status, label, title, helperText }: NotificationSendActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const isEmail = channel === "email";
  const isSent = status === "sent";
  const disabled = isPending || !isEmail || isSent;
  const buttonLabel = isSent ? "已处理" : label;

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
        title={!isEmail ? "当前仅支持邮件通知单条操作" : isSent ? "该通知已处理" : title}
        type="button"
      >
        {isPending ? "处理中" : buttonLabel}
      </button>
      {!isEmail ? <p className="text-xs leading-5 text-[#8a6b3e]">当前仅支持邮件通知单条操作</p> : null}
      {isEmail && !isSent ? <p className="max-w-[12rem] text-xs leading-5 text-[#8a6b3e]">{helperText}</p> : null}
      {message ? <p className="max-w-[12rem] text-xs leading-5 text-[#5f5b52]">{message}</p> : null}
    </div>
  );
}
