import { db, schema } from "@/server/db/client";

/**
 * Catat perubahan pada payroll ke tabel payroll_revisions.
 * Best-effort — tidak melempar error.
 */
export async function logRevision(opts: {
  payrollId: string;
  companyId: string;
  revisedById?: string | null;
  action: "create" | "update" | "approve" | "paid" | "cancel" | "delete";
  snapshot: Record<string, any>;
  diff?: Record<string, { old: any; new: any }>;
  notes?: string | null;
}) {
  try {
    await db.insert(schema.payrollRevisions).values({
      payrollId: opts.payrollId,
      companyId: opts.companyId,
      revisedById: opts.revisedById ?? null,
      action: opts.action,
      snapshot: JSON.stringify(opts.snapshot),
      diff: opts.diff ? JSON.stringify(opts.diff) : null,
      notes: opts.notes ?? null,
    });
  } catch (e) {
    console.warn("[payroll.revision] failed", (e as Error).message);
  }
}

/**
 * Hitung diff (field-level) antara before & after object.
 * Hanya field yang berbeda yang masuk hasil.
 */
export function calcDiff(
  before: Record<string, any>,
  after: Record<string, any>
): Record<string, { old: any; new: any }> {
  const diff: Record<string, { old: any; new: any }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    const a = before[k];
    const b = after[k];
    // Normalisasi Date → ms
    const av = a instanceof Date ? a.getTime() : a;
    const bv = b instanceof Date ? b.getTime() : b;
    if (av !== bv) diff[k] = { old: a, new: b };
  }
  return diff;
}
