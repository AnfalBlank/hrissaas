/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

const QR_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole([
      "super_admin",
      "owner",
      "hr",
      "supervisor",
    ]);
    const url = new URL(req.url);
    const branchId = url.searchParams.get("branchId");
    if (!branchId) return fail(400, "branchId required");

    const [branch] = await db
      .select()
      .from(schema.branches)
      .where(eq(schema.branches.id, branchId));
    if (!branch || branch.companyId !== session.companyId)
      return fail(404, "Cabang tidak ditemukan");

    // Token TTL: 60 detik
    const token = await new SignJWT({
      branchId: branch.id,
      companyId: session.companyId,
      lat: branch.latitude,
      lng: branch.longitude,
      radius: branch.radiusMeters,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("60s")
      .sign(QR_SECRET);

    return ok({
      token,
      branch: {
        id: branch.id,
        name: branch.name,
        city: branch.city,
      },
      expiresInSec: 60,
    });
  } catch (e) {
    return handleError(e);
  }
}
