/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";
import { audit } from "@/server/auth/audit";

const ADMIN_ROLES = ["super_admin", "hr", "owner"];

const Patch = z.object({
  status: z
    .enum(["present", "late", "leave", "sick", "permission", "alpha", "overtime"])
    .optional(),
  checkInAt: z.string().optional().nullable(),
  checkOutAt: z.string().optional().nullable(),
  lateMinutes: z.number().int().nonnegative().optional(),
  overtimeMinutes: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const body = Patch.parse(await req.json());

    const [existing] = await db
      .select()
      .from(schema.attendances)
      .where(eq(schema.attendances.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Absensi tidak ditemukan");

    const patch: any = { ...body };
    if (body.checkInAt !== undefined)
      patch.checkInAt = body.checkInAt ? new Date(body.checkInAt) : null;
    if (body.checkOutAt !== undefined)
      patch.checkOutAt = body.checkOutAt ? new Date(body.checkOutAt) : null;

    const [row] = await db
      .update(schema.attendances)
      .set(patch)
      .where(eq(schema.attendances.id, params.id))
      .returning();

    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "attendance.manual_correction",
      details: { attendanceId: params.id, patch: body },
    });

    return ok({ attendance: row });
  } catch (e) {
    return handleError(e);
  }
}
