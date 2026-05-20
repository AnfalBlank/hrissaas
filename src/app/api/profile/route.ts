/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, fail, handleError } from "@/server/api/respond";

const Patch = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  telegramChatId: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const body = Patch.parse(await req.json());

    const [existing] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, session.employeeId));

    const [employee] = await db
      .update(schema.employees)
      .set(body)
      .where(eq(schema.employees.id, session.employeeId))
      .returning();

    // Audit perubahan bank info (sensitif untuk payroll transfer)
    const bankChanged =
      (body.bankName !== undefined && body.bankName !== existing?.bankName) ||
      (body.bankAccount !== undefined &&
        body.bankAccount !== existing?.bankAccount);
    if (bankChanged) {
      audit({
        companyId: session.companyId,
        userId: session.sub,
        action: "profile.bank.changed",
        details: {
          employeeId: session.employeeId,
          oldBankName: existing?.bankName ?? null,
          newBankName: body.bankName ?? null,
          accountChanged: body.bankAccount !== existing?.bankAccount,
        },
        ip:
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip"),
      });
    }

    return ok({ employee });
  } catch (e) {
    return handleError(e);
  }
}
