import * as XLSX from "xlsx";

/**
 * Universal Excel (.xlsx) Exporter for SOP Platform
 * Replaces legacy CSV downloads with real, professionally formatted Excel spreadsheets.
 */

export interface ExcelExportOptions {
  sheetName?: string;
  autoWidth?: boolean;
}

/**
 * Clean filename to ensure it has .xlsx extension
 */
function normalizeExcelFilename(filename: string): string {
  const base = filename.replace(/\.(csv|xlsx|xls)$/i, "");
  return `${base}.xlsx`;
}

/**
 * Export 2D array of data (Array of Arrays) to Excel (.xlsx)
 */
export function exportDataToExcel(
  rows: (string | number | boolean | null | undefined)[][],
  filename: string,
  options: ExcelExportOptions = {},
): void {
  if (!rows || !rows.length) {
    throw new Error("Tidak ada data untuk diekspor ke Excel.");
  }

  const sheetName = (options.sheetName || "Data").slice(0, 31);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  if (options.autoWidth !== false && rows.length > 0) {
    const colCount = Math.max(...rows.map((r) => r.length));
    const colWidths: { wch: number }[] = [];

    for (let c = 0; c < colCount; c++) {
      let maxLen = 10;
      for (let r = 0; r < rows.length; r++) {
        const cell = rows[r]?.[c];
        if (cell !== undefined && cell !== null) {
          const str = String(cell);
          if (str.length > maxLen) {
            maxLen = str.length;
          }
        }
      }
      colWidths.push({ wch: Math.min(maxLen + 4, 60) });
    }

    worksheet["!cols"] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const cleanFilename = normalizeExcelFilename(filename);
  XLSX.writeFile(workbook, cleanFilename);
}

/**
 * Export an HTML Table element directly to Excel (.xlsx)
 */
export function exportTableElementToExcel(
  table: HTMLTableElement,
  filename: string,
  sheetName: string = "Sheet1",
): void {
  const rows: string[][] = [];

  const trs = table.querySelectorAll<HTMLTableRowElement>("tr");
  trs.forEach((tr) => {
    const rowCells: string[] = [];
    const cells = tr.querySelectorAll<HTMLElement>("th, td");

    cells.forEach((cell) => {
      // Skip checkbox column or action buttons column
      if (
        cell.querySelector('input[type="checkbox"]') ||
        cell.classList.contains("crm-actions") ||
        cell.getAttribute("aria-label") === "Aksi"
      ) {
        return;
      }

      // Clean cell text
      const text = cell.innerText.replace(/\s+/g, " ").trim();
      rowCells.push(text);
    });

    if (rowCells.some((c) => c.length > 0)) {
      rows.push(rowCells);
    }
  });

  if (!rows.length) {
    throw new Error("Tabel tidak memiliki baris data untuk diekspor.");
  }

  exportDataToExcel(rows, filename, { sheetName });
}

/**
 * Parse CSV text and download as formatted Excel (.xlsx)
 */
export function exportCsvStringToExcel(
  csvText: string,
  filename: string,
  sheetName: string = "Laporan",
): void {
  const cleanCsv = csvText.replace(/^\uFEFF/, "");
  const workbook = XLSX.read(cleanCsv, { type: "string" });

  // Auto-format worksheet sheet name
  const firstSheetName = workbook.SheetNames[0] || "Sheet1";
  const worksheet = workbook.Sheets[firstSheetName];

  if (sheetName && sheetName !== firstSheetName) {
    workbook.SheetNames[0] = sheetName.slice(0, 31);
    workbook.Sheets[sheetName.slice(0, 31)] = worksheet;
    delete workbook.Sheets[firstSheetName];
  }

  const cleanFilename = normalizeExcelFilename(filename);
  XLSX.writeFile(workbook, cleanFilename);
}

/**
 * Global Interceptor that guarantees ANY CSV download in the application
 * (including original prototype legacy export handlers) is automatically
 * converted and downloaded as a real Excel (.xlsx) file.
 */
let interceptorInstalled = false;

export function installGlobalExcelInterceptor(): void {
  if (interceptorInstalled || typeof window === "undefined") return;
  interceptorInstalled = true;

  const originalClick = HTMLAnchorElement.prototype.click;

  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (this.download && /\.csv$/i.test(this.download) && this.href) {
      const excelFilename = this.download.replace(/\.csv$/i, ".xlsx");

      if (this.href.startsWith("blob:") || this.href.startsWith("data:")) {
        void fetch(this.href)
          .then((res) => res.text())
          .then((csvText) => {
            exportCsvStringToExcel(csvText, excelFilename);
          })
          .catch((err) => {
            console.error("Konversi otomatis CSV ke Excel gagal:", err);
            originalClick.call(this);
          });
        return;
      }
    }

    originalClick.call(this);
  };
}
