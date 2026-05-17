import ExcelJS from "exceljs";

export type Column = {
  header: string;
  key: string;
  width?: number;
  format?: "currency" | "date" | "datetime" | "number";
};

export async function buildExcel(opts: {
  sheet: string;
  title?: string;
  subtitle?: string;
  columns: Column[];
  rows: Record<string, any>[];
  totals?: Record<string, any>;
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Manggala Attendance System";
  wb.created = new Date();
  const ws = wb.addWorksheet(opts.sheet);

  let cursor = 1;
  if (opts.title) {
    const cell = ws.getCell(cursor, 1);
    cell.value = opts.title;
    cell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF1B1F2C" } };
    ws.mergeCells(cursor, 1, cursor, opts.columns.length);
    cursor++;
  }
  if (opts.subtitle) {
    const cell = ws.getCell(cursor, 1);
    cell.value = opts.subtitle;
    cell.font = { name: "Calibri", size: 11, color: { argb: "FF5B6478" } };
    ws.mergeCells(cursor, 1, cursor, opts.columns.length);
    cursor++;
  }
  if (opts.title || opts.subtitle) cursor++;

  // Header row
  const headerRow = ws.getRow(cursor);
  opts.columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3A5CFF" },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: "FF2A3DF5" } } };
  });
  headerRow.height = 24;
  cursor++;

  // Data rows
  for (const row of opts.rows) {
    const r = ws.getRow(cursor);
    opts.columns.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      const v = row[c.key];
      cell.value = v === null || v === undefined ? "" : v;
      if (c.format === "currency" && typeof v === "number") {
        cell.numFmt = '"Rp" #,##0';
      } else if (c.format === "number" && typeof v === "number") {
        cell.numFmt = "#,##0";
      } else if (c.format === "date" && v) {
        cell.value = new Date(v);
        cell.numFmt = "dd mmm yyyy";
      } else if (c.format === "datetime" && v) {
        cell.value = new Date(v);
        cell.numFmt = "dd mmm yyyy hh:mm";
      }
    });
    if (cursor % 2 === 1) {
      r.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF7F7FB" },
        };
      });
    }
    cursor++;
  }

  // Totals row
  if (opts.totals) {
    cursor++;
    const r = ws.getRow(cursor);
    opts.columns.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      const v = opts.totals![c.key];
      if (v !== undefined) {
        cell.value = v;
        if (c.format === "currency") cell.numFmt = '"Rp" #,##0';
        else if (c.format === "number") cell.numFmt = "#,##0";
      } else if (i === 0) {
        cell.value = "TOTAL";
      }
      cell.font = { bold: true };
      cell.border = { top: { style: "double", color: { argb: "FF1B1F2C" } } };
    });
  }

  // Column widths
  opts.columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width ?? Math.max(12, c.header.length + 4);
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
