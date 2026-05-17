import PDFDocument from "pdfkit";

export type PdfColumn = {
  header: string;
  key: string;
  width: number; // points
  align?: "left" | "right" | "center";
  format?: (v: any) => string;
};

export function buildPdfTable(opts: {
  title: string;
  subtitle?: string;
  meta?: Record<string, string>;
  columns: PdfColumn[];
  rows: Record<string, any>[];
  totals?: Record<string, any>;
  brand?: { name: string; tagline?: string };
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const brandName = opts.brand?.name ?? "Manggala Attendance System";
    const tagline = opts.brand?.tagline ?? "HRIS Attendance Platform";

    // Header band
    doc.rect(0, 0, doc.page.width, 70).fill("#3A5CFF");
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(brandName, 40, 22);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#DAE6FF")
      .text(tagline, 40, 44);

    doc.fillColor("#0F121B").y = 90;

    // Title
    doc.font("Helvetica-Bold").fontSize(18).text(opts.title, 40);
    if (opts.subtitle) {
      doc
        .moveDown(0.2)
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#5B6478")
        .text(opts.subtitle);
    }
    doc.fillColor("#0F121B").moveDown(0.6);

    // Meta box
    if (opts.meta && Object.keys(opts.meta).length) {
      const startY = doc.y;
      const colW = (doc.page.width - 80) / 3;
      const entries = Object.entries(opts.meta);
      entries.forEach(([k, v], i) => {
        const x = 40 + (i % 3) * colW;
        const y = startY + Math.floor(i / 3) * 36;
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#8A93AD")
          .text(k.toUpperCase(), x, y);
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor("#1B1F2C")
          .text(v, x, y + 12);
      });
      doc.y = startY + Math.ceil(entries.length / 3) * 36 + 8;
      doc.fillColor("#0F121B");
    }

    // Table
    const tableTop = doc.y + 8;
    const tableLeft = 40;
    const totalWidth = opts.columns.reduce((s, c) => s + c.width, 0);

    // Header row
    doc
      .rect(tableLeft, tableTop, totalWidth, 22)
      .fill("#1B1F2C")
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(9);
    let cx = tableLeft;
    for (const col of opts.columns) {
      doc.text(col.header, cx + 6, tableTop + 7, {
        width: col.width - 12,
        align: col.align ?? "left",
        ellipsis: true,
      });
      cx += col.width;
    }

    // Body
    let y = tableTop + 22;
    doc.fillColor("#1B1F2C").font("Helvetica").fontSize(9);

    for (let r = 0; r < opts.rows.length; r++) {
      // page break
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 40;
      }
      const row = opts.rows[r];
      if (r % 2 === 0) {
        doc.rect(tableLeft, y, totalWidth, 22).fill("#F7F7FB");
      }
      doc.fillColor("#1B1F2C").font("Helvetica").fontSize(9);
      cx = tableLeft;
      for (const col of opts.columns) {
        const raw = row[col.key];
        const text = col.format
          ? col.format(raw)
          : raw === null || raw === undefined
            ? "-"
            : String(raw);
        doc.text(text, cx + 6, y + 7, {
          width: col.width - 12,
          align: col.align ?? "left",
          ellipsis: true,
        });
        cx += col.width;
      }
      y += 22;
    }

    // Totals
    if (opts.totals) {
      doc
        .rect(tableLeft, y, totalWidth, 24)
        .fill("#3A5CFF")
        .fillColor("white")
        .font("Helvetica-Bold")
        .fontSize(10);
      cx = tableLeft;
      let firstCell = true;
      for (const col of opts.columns) {
        const raw = opts.totals![col.key];
        let text = "";
        if (firstCell && raw === undefined) {
          text = "TOTAL";
          firstCell = false;
        } else if (raw !== undefined) {
          text = col.format ? col.format(raw) : String(raw);
        }
        doc.text(text, cx + 6, y + 8, {
          width: col.width - 12,
          align: col.align ?? "left",
        });
        cx += col.width;
      }
      y += 24;
    }

    // Footer
    doc
      .fillColor("#8A93AD")
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Dicetak pada ${new Date().toLocaleString("id-ID")} · ${brandName}`,
        40,
        doc.page.height - 30
      );

    doc.end();
  });
}

export const fmtCurrency = (n: any) =>
  typeof n === "number"
    ? `Rp ${n.toLocaleString("id-ID")}`
    : n
      ? String(n)
      : "-";

export const fmtDate = (v: any) =>
  v ? new Date(v).toLocaleDateString("id-ID") : "-";

export const fmtTime = (v: any) =>
  v
    ? new Date(v).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
