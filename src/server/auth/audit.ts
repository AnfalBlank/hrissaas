import { db, schema } from "@/server/db/client";

/** Lightweight audit logger. Never throws — best-effort. */
export async function audit(opts: {
  companyId?: string | null;
  userId?: string | null;
  action: string;
  details?: Record<string, any> | string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    await db.insert(schema.auditLogs).values({
      companyId: opts.companyId ?? null,
      userId: opts.userId ?? null,
      action: opts.action,
      details:
        typeof opts.details === "string"
          ? opts.details
          : opts.details
            ? JSON.stringify(opts.details)
            : null,
      ip: opts.ip ?? null,
      userAgent: opts.userAgent ?? null,
    });
  } catch (e) {
    console.warn("[audit] failed", (e as Error).message);
  }
}
