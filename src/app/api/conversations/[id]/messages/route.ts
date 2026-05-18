/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";
import { emitToCompany } from "@/server/realtime/emitter";

async function ensureParticipant(conversationId: string, userId: string) {
  const [p] = await db
    .select()
    .from(schema.chatParticipants)
    .where(
      and(
        eq(schema.chatParticipants.conversationId, conversationId),
        eq(schema.chatParticipants.userId, userId)
      )
    );
  return p;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const part = await ensureParticipant(params.id, session.sub);
    if (!part) return fail(403, "Bukan peserta percakapan");

    const messages = await db
      .select({
        id: schema.chatMessages.id,
        text: schema.chatMessages.text,
        attachmentUrl: schema.chatMessages.attachmentUrl,
        attachmentName: schema.chatMessages.attachmentName,
        attachmentMime: schema.chatMessages.attachmentMime,
        attachmentSize: schema.chatMessages.attachmentSize,
        fromUserId: schema.chatMessages.fromUserId,
        createdAt: schema.chatMessages.createdAt,
        senderName: schema.employees.fullName,
        senderAvatar: schema.employees.avatarUrl,
      })
      .from(schema.chatMessages)
      .leftJoin(
        schema.employees,
        eq(schema.chatMessages.fromUserId, schema.employees.userId)
      )
      .where(eq(schema.chatMessages.conversationId, params.id))
      .orderBy(asc(schema.chatMessages.createdAt))
      .limit(200);

    // Mark as read
    await db
      .update(schema.chatParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(schema.chatParticipants.conversationId, params.id),
          eq(schema.chatParticipants.userId, session.sub)
        )
      );

    return ok({ messages });
  } catch (e) {
    return handleError(e);
  }
}

const Body = z.object({
  text: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentMime: z.string().optional(),
  attachmentSize: z.number().int().nonnegative().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const part = await ensureParticipant(params.id, session.sub);
    if (!part) return fail(403, "Bukan peserta percakapan");

    const body = Body.parse(await req.json());
    if (!body.text && !body.attachmentUrl)
      return fail(400, "Pesan kosong");

    const [msg] = await db
      .insert(schema.chatMessages)
      .values({
        conversationId: params.id,
        fromUserId: session.sub,
        text: body.text,
        attachmentUrl: body.attachmentUrl,
        attachmentName: body.attachmentName,
        attachmentMime: body.attachmentMime,
        attachmentSize: body.attachmentSize,
      })
      .returning();

    // Update conversation last message
    const lastText =
      body.text ||
      (body.attachmentName ? `📎 ${body.attachmentName}` : "📎 Lampiran");
    await db
      .update(schema.chatConversations)
      .set({
        lastMessageAt: new Date(),
        lastMessageText: lastText.slice(0, 100),
      })
      .where(eq(schema.chatConversations.id, params.id));

    emitToCompany(session.companyId, "conv:message", {
      conversationId: params.id,
      message: msg,
    });

    return ok({ message: msg });
  } catch (e) {
    return handleError(e);
  }
}
