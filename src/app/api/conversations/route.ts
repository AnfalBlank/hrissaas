/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

/**
 * GET — list conversations untuk user yang login.
 * Returns: [{ id, title, type, lastMessageText, lastMessageAt,
 *            otherParticipants: [{userId, name, avatarUrl}],
 *            unreadCount }]
 */
export async function GET() {
  try {
    const session = await requireSession();

    // Conversations user ini
    const myParts = await db
      .select()
      .from(schema.chatParticipants)
      .where(eq(schema.chatParticipants.userId, session.sub));

    if (myParts.length === 0) return ok({ items: [] });

    const convIds = myParts.map((p) => p.conversationId);
    const conversations = await db
      .select()
      .from(schema.chatConversations)
      .where(inArray(schema.chatConversations.id, convIds));

    // All participants for these convs
    const allParts = await db
      .select({
        conversationId: schema.chatParticipants.conversationId,
        userId: schema.chatParticipants.userId,
        userEmail: schema.users.email,
        fullName: schema.employees.fullName,
        avatarUrl: schema.employees.avatarUrl,
      })
      .from(schema.chatParticipants)
      .leftJoin(
        schema.users,
        eq(schema.chatParticipants.userId, schema.users.id)
      )
      .leftJoin(
        schema.employees,
        eq(schema.users.id, schema.employees.userId)
      )
      .where(inArray(schema.chatParticipants.conversationId, convIds));

    // Unread count per conv
    const myPartsByConv = new Map(
      myParts.map((p) => [p.conversationId, p.lastReadAt])
    );

    const items = conversations.map((c) => {
      const others = allParts.filter(
        (p) => p.conversationId === c.id && p.userId !== session.sub
      );
      return {
        id: c.id,
        type: c.type,
        title: c.title,
        lastMessageText: c.lastMessageText,
        lastMessageAt: c.lastMessageAt,
        otherParticipants: others.map((p) => ({
          userId: p.userId,
          name: p.fullName ?? p.userEmail,
          avatarUrl: p.avatarUrl,
        })),
        lastReadAt: myPartsByConv.get(c.id) ?? null,
      };
    });

    // Sort by last message time
    items.sort((a, b) => {
      const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bT - aT;
    });

    return ok({ items });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST — start (or get existing) direct conversation with another user.
 */
const Body = z.object({
  toUserId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { toUserId } = Body.parse(await req.json());
    if (toUserId === session.sub)
      return fail(400, "Tidak bisa chat dengan diri sendiri");

    // Find existing direct conversation
    const myConvs = await db
      .select({ conversationId: schema.chatParticipants.conversationId })
      .from(schema.chatParticipants)
      .where(eq(schema.chatParticipants.userId, session.sub));

    if (myConvs.length > 0) {
      const myConvIds = myConvs.map((c) => c.conversationId);
      const existing = await db
        .select({
          conversationId: schema.chatParticipants.conversationId,
        })
        .from(schema.chatParticipants)
        .innerJoin(
          schema.chatConversations,
          eq(
            schema.chatParticipants.conversationId,
            schema.chatConversations.id
          )
        )
        .where(
          and(
            eq(schema.chatParticipants.userId, toUserId),
            inArray(schema.chatParticipants.conversationId, myConvIds),
            eq(schema.chatConversations.type, "direct")
          )
        );
      if (existing.length > 0) {
        return ok({ conversationId: existing[0].conversationId, existed: true });
      }
    }

    // Create new
    const [conv] = await db
      .insert(schema.chatConversations)
      .values({
        companyId: session.companyId,
        type: "direct",
      })
      .returning();

    await db.insert(schema.chatParticipants).values([
      { conversationId: conv.id, userId: session.sub },
      { conversationId: conv.id, userId: toUserId },
    ]);

    return ok({ conversationId: conv.id, existed: false });
  } catch (e) {
    return handleError(e);
  }
}
