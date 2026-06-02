"use client";

import type { SetStateAction } from "react";

export type AdminTextTemplate = {
  label: string;
  text: string;
};

export function applyAdminTextTemplate(current: string, text: string) {
  if (!current.trim()) return text;
  if (current.includes(text)) return current;
  if (window.confirm("当前内容已有填写，是否追加模板文案？")) return `${current.trim()}\n${text}`;
  return current;
}

export function AdminTemplateButtons({
  disabled = false,
  onSelect,
  templates
}: {
  disabled?: boolean;
  onSelect: (value: SetStateAction<string>) => void;
  templates: AdminTextTemplate[];
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {templates.map((template) => (
        <button
          className="w-full rounded-full border border-[#d8d0bf] bg-white px-4 py-2 text-center text-xs font-semibold text-ink transition hover:border-[#8a6b3e] hover:text-[#7F1D1D] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          disabled={disabled}
          key={template.label}
          onClick={() => onSelect((current) => applyAdminTextTemplate(current, template.text))}
          type="button"
        >
          {template.label}
        </button>
      ))}
    </div>
  );
}
