/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "hr"];

export async function GET() {
  try {
    const session = await requireRole(["super_admin", "owner", "hr"]);
    const rows = await db
      .select()
      .from(schema.announcements)
      .where(eq(schema.announcements.companyId, session.companyId))
      .orderBy(desc(schema.announcements.createdAt));
    return ok({ items: rows });
  } catch (e) {
    return handleError(e);
  }
}

const Body = z.object({
  type: z.enum(["banner", "article", "announcement", "promo"]),
  title: z.string(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["live", "draft"]).default("live"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const body = Body.parse(await req.json());
    const [row] = await db
      .insert(schema.announcements)
      .values({ ...body, companyId: session.companyId })
      .returning();
    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "announcement.create",
      details: { id: row.id, type: body.type, title: body.title, status: body.status },
    });
    return ok({ item: row });
  } catch (e) {
    return handleError(e);
  }
}
