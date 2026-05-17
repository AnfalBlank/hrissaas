/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";
import { emitToCompany } from "@/server/realtime/emitter";

export async function GET() {
  try {
    const session = await requireSession();
    const rows = await db
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.companyId, session.companyId))
      .orderBy(desc(schema.chats.createdAt))
      .limit(50);
    return ok({ items: rows.reverse() });
  } catch (e) {
    return handleError(e);
  }
}

const Body = z.object({
  text: z.string().min(1),
  toRole: z.string().optional().default("hr"),
  attachmentUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = Body.parse(await req.json());
    const [row] = await db
      .insert(schema.chats)
      .values({
        companyId: session.companyId,
        fromUserId: session.sub,
        toRole: body.toRole,
        text: body.text,
        attachmentUrl: body.attachmentUrl,
      })
      .returning();

    emitToCompany(session.companyId, "chat:message", { item: row });

    return ok({ chat: row });
  } catch (e) {
    return handleError(e);
  }
}
