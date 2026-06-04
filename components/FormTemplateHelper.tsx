"use client";

type FormTemplateHelperProps = {
  hint: string;
  template: string;
  onApply: () => void;
};

export function FormTemplateHelper({ hint, template, onApply }: FormTemplateHelperProps) {
  return (
    <div className="mt-3 min-w-0 max-w-full overflow-hidden rounded-xl border border-[#e4ded0] bg-[#fbf8ef] p-4 text-xs leading-6 text-[#66594d]">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 break-words">{hint}</p>
        <button className="rounded-full border border-[#d8d0bf] bg-white px-4 py-2 font-semibold text-ink transition hover:border-[#b08a45]" type="button" onClick={onApply}>
          套用模板
        </button>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer font-semibold text-[#7F1D1D]">查看填写示例</summary>
        <pre className="mt-3 max-w-full whitespace-pre-wrap break-words rounded-lg bg-white/70 p-3 font-sans text-xs leading-6 text-[#5f5b52]">{template}</pre>
      </details>
      <p className="mt-3 text-[#8a6b3e]">模板仅供填写参考，请根据本人真实情况修改后提交。</p>
    </div>
  );
}
