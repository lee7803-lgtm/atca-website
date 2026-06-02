"use client";

import { useEffect, useMemo, useState } from "react";
import type { MasterDataEntry, MasterDataKind } from "@/types/master-data";

export function MasterDataSelector({
  error,
  helperText,
  kind,
  label,
  otherLabel = "其他",
  otherPlaceholder,
  required = false,
  value,
  onChange
}: {
  error?: string;
  helperText?: string;
  kind: MasterDataKind;
  label: string;
  otherLabel?: string;
  otherPlaceholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState<MasterDataEntry[]>([]);
  const [mode, setMode] = useState<"library" | "other">("other");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/master-data?kind=${kind}`)
      .then((response) => response.json())
      .then((result: { success?: boolean; items?: MasterDataEntry[]; message?: string }) => {
        if (cancelled) return;
        setItems(Array.isArray(result.items) ? result.items : []);
        setMessage(result.message || "");
        if (Array.isArray(result.items) && result.items.length > 0 && !value) setMode("library");
      })
      .catch(() => {
        if (!cancelled) setMessage("基础资料暂时无法读取，可直接选择其他并填写。");
      });
    return () => {
      cancelled = true;
    };
  }, [kind, value]);

  const selectedValue = useMemo(() => items.find((item) => item.displayName === value || item.name === value) ? value : "", [items, value]);

  return (
    <div className="grid gap-3 rounded-2xl bg-white/45 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-porcelain">
          {label}
          {required ? <span className="rounded-full bg-[#f8e8e8] px-2 py-0.5 text-xs text-[#7F1D1D]">*</span> : null}
        </span>
        <span className="inline-flex rounded-full border border-[#e4ded0] bg-[#fbf8ef] p-1 text-xs">
          <button className={`rounded-full px-3 py-1 ${mode === "library" ? "bg-white text-[#7F1D1D]" : "text-[#5f5b52]"}`} type="button" onClick={() => setMode("library")}>
            已有资料
          </button>
          <button className={`rounded-full px-3 py-1 ${mode === "other" ? "bg-white text-[#7F1D1D]" : "text-[#5f5b52]"}`} type="button" onClick={() => setMode("other")}>
            {otherLabel}
          </button>
        </span>
      </div>
      {mode === "library" ? (
        <select className="form-input" value={selectedValue} onChange={(event) => onChange(event.target.value)}>
          <option value="">{items.length > 0 ? "请选择" : "暂无可选资料"}</option>
          {items.map((item) => (
            <option key={item.id} value={item.displayName || item.name}>
              {item.displayName || item.name}
            </option>
          ))}
        </select>
      ) : (
        <input className="form-input" placeholder={otherPlaceholder || "请填写"} required={required} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      {helperText || message ? <p className="text-xs leading-6 text-[#8a6b3e]">{message || helperText}</p> : null}
      {error ? <p className="text-xs leading-6 text-[#7F1D1D]">{error}</p> : null}
    </div>
  );
}
