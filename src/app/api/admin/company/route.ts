/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, fail, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export async function GET() {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const [company] = await db
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.id, session.companyId));
    if (!company) return fail(404, "Perusahaan tidak ditemukan");
    return ok({ company });
  } catch (e) {
    return handleError(e);
  }
}

const Patch = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan dash")
    .optional(),
  domain: z.string().optional().nullable(),
  plan: z.string().optional(),
  timezone: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(["super_admin", "owner"]);
    const body = Patch.parse(await req.json());

    const [existing] = await db
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.id, session.companyId));
    if (!existing) return fail(404, "Perusahaan tidak ditemukan");

    // Check slug uniqueness
    if (body.slug && body.slug !== existing.slug) {
      const [conflict] = await db
        .select()
        .from(schema.companies)
        .where(eq(schema.companies.slug, body.slug));
      if (conflict) return fail(400, "Slug sudah dipakai perusahaan lain");
    }

    const [company] = await db
      .update(schema.companies)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.companies.id, session.companyId))
      .returning();

    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "company.update",
      details: { changedKeys: Object.keys(body) },
    });

    return ok({ company });
  } catch (e) {
    return handleError(e);
  }
}
