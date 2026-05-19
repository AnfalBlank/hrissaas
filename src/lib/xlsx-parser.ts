/**
 * Client-side xlsx → CSV string converter.
 *
 * Strategi: baca file sebagai text per cell menggunakan
 * simple DOM parsing dari xlsx XML (unzipped).
 * Jika gagal, throw error dan user diminta convert ke CSV dulu.
 *
 * Untuk file xlsx yang complex, user bisa:
 * 1. Save as CSV dari Excel/Google Sheets
 * 2. Atau gunakan template CSV yang disediakan
 */
export async function parseXlsx(buffer: ArrayBuffer): Promise<string> {
  // Dynamically import exceljs (sudah ada di deps, tapi berat ~500KB)
  // Hanya load saat user upload xlsx
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount === 0) {
    throw new Error("File xlsx kosong atau tidak punya sheet");
  }

  const rows: string[] = [];
  sheet.eachRow((row, _rowNumber) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      let val = "";
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === "object" && "text" in cell.value) {
          val = String((cell.value as any).text ?? "");
        } else if (cell.value instanceof Date) {
          val = cell.value.toISOString().slice(0, 10);
        } else {
          val = String(cell.value);
        }
      }
      // Escape comma in value
      if (val.includes(",") || val.includes('"')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      cells.push(val);
    });
    rows.push(cells.join(","));
  });

  if (rows.length < 2) {
    throw new Error("File xlsx harus punya header + minimal 1 baris data");
  }

  return rows.join("\n");
}
