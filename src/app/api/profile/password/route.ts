/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { ok, fail, handleError } from "@/server/api/respond";

const Body = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = Body.parse(await req.json());

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.sub));
    if (!user) return fail(404, "User tidak ditemukan");

    const valid = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!valid) return fail(400, "Password lama salah");

    await db
      .update(schema.users)
      .set({ passwordHash: await hashPassword(body.newPassword) })
      .where(eq(schema.users.id, user.id));

    return ok({ updated: true });
  } catch (e) {
    return handleError(e);
  }
}
