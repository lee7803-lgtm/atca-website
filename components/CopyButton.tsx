"use client";

import { useState } from "react";

export function CopyButton({ label = "复制申请编号", text }: { label?: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button className="rounded-full border border-[#d8d0bf] bg-white px-7 py-3 text-sm font-semibold text-ink" disabled={!text} onClick={copy} type="button">
      {copied ? "已复制" : label}
    </button>
  );
}
