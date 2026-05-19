/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";
import { broadcastFeed } from "@/server/notifications/dispatch";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const [existing] = await db
      .select()
      .from(schema.leaves)
      .where(eq(schema.leaves.id, params.id));
    if (!existing || existing.employeeId !== session.employeeId)
      return fail(404, "Pengajuan tidak ditemukan");

    // Pegawai hanya boleh cancel pending atau approved (kalau approved, restore quota)
    if (existing.status === "rejected")
      return fail(400, "Pengajuan yang ditolak tidak perlu dibatalkan");

    // Restore kuota jika sebelumnya sudah di-approve
    if (existing.status === "approved") {
      const year = new Date(existing.fromDate).getFullYear();
      await db
        .update(schema.leaveQuotas)
        .set({
          used: sql`MAX(0, ${schema.leaveQuotas.used} - ${existing.days})`,
        })
        .where(
          and(
            eq(schema.leaveQuotas.employeeId, existing.employeeId),
            eq(schema.leaveQuotas.type, existing.type),
            eq(schema.leaveQuotas.year, year)
          )
        );
    }

    await db.delete(schema.leaves).where(eq(schema.leaves.id, params.id));
    broadcastFeed(session.companyId, "leave:cancelled", { leaveId: params.id });

    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
