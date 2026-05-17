/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { getSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail(401, "Unauthorized");

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.sub));
    if (!user) return fail(401, "Unauthorized");

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.userId, user.id));

    let branch: any = null;
    let shift: any = null;
    if (employee?.branchId) {
      const [b] = await db
        .select()
        .from(schema.branches)
        .where(eq(schema.branches.id, employee.branchId));
      branch = b ?? null;
    }
    if (employee?.shiftId) {
      const [s] = await db
        .select()
        .from(schema.shifts)
        .where(eq(schema.shifts.id, employee.shiftId));
      shift = s ?? null;
    }

    return ok({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      employee,
      branch,
      shift,
    });
  } catch (e) {
    return handleError(e);
  }
}
