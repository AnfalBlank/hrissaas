/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const [existing] = await db
      .select()
      .from(schema.overtimeRequests)
      .where(eq(schema.overtimeRequests.id, params.id));
    if (!existing || existing.employeeId !== session.employeeId)
      return fail(404, "Pengajuan tidak ditemukan");
    if (existing.status !== "pending")
      return fail(400, "Hanya pengajuan menunggu yang bisa dibatalkan");
    await db
      .delete(schema.overtimeRequests)
      .where(eq(schema.overtimeRequests.id, params.id));
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
