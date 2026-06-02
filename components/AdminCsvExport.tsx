"use client";

type AdminCsvExportProps = {
  headers: string[];
  filename: string;
  rows: string[][];
};

function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function AdminCsvExport({ headers, filename, rows }: AdminCsvExportProps) {
  const exportCsv = () => {
    const header = headers.map((label) => escapeCsvCell(label)).join(",");
    const body = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(","));
    const csv = [header, ...body].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      className="w-full rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      disabled={rows.length === 0}
      onClick={exportCsv}
      type="button"
    >
      导出 CSV
    </button>
  );
}
