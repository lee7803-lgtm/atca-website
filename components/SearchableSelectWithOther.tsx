"use client";

import { useId, useMemo, useState } from "react";

export function SearchableSelectWithOther({
  className = "",
  helperText,
  error,
  label,
  name,
  options,
  otherPlaceholder = "请填写其他内容",
  required = false,
  value,
  onChange
}: {
  className?: string;
  helperText?: string;
  error?: string;
  label: string;
  name?: string;
  options: string[];
  otherPlaceholder?: string;
  required?: boolean;
  value: string;
  onChange?: (value: string) => void;
}) {
  const datalistId = useId();
  const normalizedOptions = useMemo(() => Array.from(new Set([...options, "其他"])), [options]);
  const isKnown = normalizedOptions.includes(value);
  const [mode, setMode] = useState<"select" | "other">(value && !isKnown ? "other" : "select");
  const [selected, setSelected] = useState(isKnown ? value : value ? "其他" : "");
  const [otherValue, setOtherValue] = useState(isKnown ? "" : value);
  const activeValue = mode === "other" ? otherValue : selected;

  function setSelectedValue(nextValue: string) {
    setSelected(nextValue);
    if (nextValue === "其他") {
      setMode("other");
      onChange?.(otherValue);
      return;
    }
    setMode("select");
    onChange?.(nextValue);
  }

  function setOther(nextValue: string) {
    setOtherValue(nextValue);
    onChange?.(nextValue);
  }

  return (
    <label className={`grid min-w-0 gap-3 rounded-2xl bg-white/45 p-3 ${className}`}>
      <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium text-porcelain">
        {label}
        {required ? <span className="rounded-full bg-[#f8e8e8] px-2 py-0.5 text-xs text-[#7F1D1D]">*</span> : null}
      </span>
      <input name={name} type="hidden" value={activeValue} />
      <input
        className="form-input"
        list={datalistId}
        placeholder="搜索或选择"
        required={required && mode === "select"}
        value={mode === "other" ? "其他" : selected}
        onChange={(event) => setSelectedValue(event.target.value)}
      />
      <datalist id={datalistId}>
        {normalizedOptions.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
      {mode === "other" ? (
        <input className="form-input" placeholder={otherPlaceholder} required={required} value={otherValue} onChange={(event) => setOther(event.target.value)} />
      ) : null}
      {error ? <span className="min-w-0 break-words text-xs text-[#7F1D1D]">{error}</span> : null}
      {helperText ? <span className="min-w-0 break-words text-xs leading-6 text-[#8a6b3e]">{helperText}</span> : null}
    </label>
  );
}
