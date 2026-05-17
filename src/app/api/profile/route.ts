/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

const Patch = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const body = Patch.parse(await req.json());

    const [employee] = await db
      .update(schema.employees)
      .set(body)
      .where(eq(schema.employees.id, session.employeeId))
      .returning();
    return ok({ employee });
  } catch (e) {
    return handleError(e);
  }
}
