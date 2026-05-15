"use client";

export function PrintButton({ label = "打印证书" }: { label?: string }) {
  return (
    <button className="rounded-full bg-[#7F1D1D] px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,29,29,0.18)]" type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
