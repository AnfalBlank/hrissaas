/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, fail, handleError } from "@/server/api/respond";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const [existing] = await db
      .select()
      .from(schema.payrollComponents)
      .where(eq(schema.payrollComponents.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Not found");
    await db
      .delete(schema.payrollComponents)
      .where(eq(schema.payrollComponents.id, params.id));
    await audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "payroll.component.delete",
      details: {
        componentId: params.id,
        employeeId: existing.employeeId,
        category: existing.category,
        amount: existing.amount,
      },
    });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
