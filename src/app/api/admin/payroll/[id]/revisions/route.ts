/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(ADMIN_ROLES);

    // Verifikasi payroll milik company tsb
    const [p] = await db
      .select()
      .from(schema.payrolls)
      .where(eq(schema.payrolls.id, params.id));
    if (!p || p.companyId !== session.companyId)
      return fail(404, "Payroll tidak ditemukan");

    const rows = await db
      .select({
        id: schema.payrollRevisions.id,
        payrollId: schema.payrollRevisions.payrollId,
        action: schema.payrollRevisions.action,
        diff: schema.payrollRevisions.diff,
        notes: schema.payrollRevisions.notes,
        createdAt: schema.payrollRevisions.createdAt,
        revisedById: schema.payrollRevisions.revisedById,
        revisedByEmail: schema.users.email,
      })
      .from(schema.payrollRevisions)
      .leftJoin(
        schema.users,
        eq(schema.payrollRevisions.revisedById, schema.users.id)
      )
      .where(
        and(
          eq(schema.payrollRevisions.payrollId, params.id),
          eq(schema.payrollRevisions.companyId, session.companyId)
        )
      )
      .orderBy(desc(schema.payrollRevisions.createdAt));

    // Parse diff JSON untuk kemudahan client
    const items = rows.map((r) => ({
      ...r,
      diff: r.diff ? safeJson(r.diff) : null,
    }));

    return ok({ items });
  } catch (e) {
    return handleError(e);
  }
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
