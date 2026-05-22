"use client";

type CsvColumn<T> = {
  key: string;
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
};

type AdminCsvExportProps<T> = {
  columns: Array<CsvColumn<T>>;
  filename: string;
  rows: T[];
};

function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function AdminCsvExport<T>({ columns, filename, rows }: AdminCsvExportProps<T>) {
  const exportCsv = () => {
    const header = columns.map((column) => escapeCsvCell(column.label)).join(",");
    const body = rows.map((row) => columns.map((column) => escapeCsvCell(column.value(row))).join(","));
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
      className="rounded-full border border-[#d8d0bf] bg-white px-5 py-3 text-center text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
      disabled={rows.length === 0}
      onClick={exportCsv}
      type="button"
    >
      导出 CSV
    </button>
  );
}
