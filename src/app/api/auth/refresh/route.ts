/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { getSession, SESSION_COOKIE } from "@/server/auth/session";
import { signJwt } from "@/server/auth/jwt";
import { ok, fail, handleError } from "@/server/api/respond";

/**
 * POST /api/auth/refresh
 *
 * Silent refresh: jika JWT masih valid (belum expired), issue token baru
 * dengan expiry reset. Client bisa panggil ini setiap ~6 jam untuk keep
 * session alive tanpa re-login.
 *
 * Jika JWT sudah expired → 401, client harus redirect ke login.
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session) return fail(401, "Session expired, silakan login ulang");

    // Verify user masih aktif
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.sub));
    if (!user || !user.active)
      return fail(401, "Akun tidak aktif");

    // Re-fetch employee (mungkin branchId/shiftId berubah)
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.userId, user.id));

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      employeeId: employee?.id,
    });

    const res = ok({ token, refreshed: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    return handleError(e);
  }
}
