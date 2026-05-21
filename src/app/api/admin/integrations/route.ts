/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, fail, handleError } from "@/server/api/respond";
import { testTelegramBot } from "@/server/notifications/telegram";

/**
 * GET — load integration settings
 */
export async function GET() {
  try {
    const session = await requireRole(["super_admin", "owner"]);
    const [settings] = await db
      .select()
      .from(schema.payrollSettings)
      .where(eq(schema.payrollSettings.companyId, session.companyId));

    return ok({
      telegramBotToken: settings?.telegramBotToken
        ? maskToken(settings.telegramBotToken)
        : null,
      telegramConfigured: !!settings?.telegramBotToken,
      whatsappToken: settings?.whatsappToken
        ? maskToken(settings.whatsappToken)
        : null,
      whatsappPhoneId: settings?.whatsappPhoneId ?? null,
      whatsappConfigured: !!(settings?.whatsappToken && settings?.whatsappPhoneId),
    });
  } catch (e) {
    return handleError(e);
  }
}

const Patch = z.object({
  telegramBotToken: z.string().optional().nullable(),
  whatsappToken: z.string().optional().nullable(),
  whatsappPhoneId: z.string().optional().nullable(),
});

/**
 * PATCH — update integration tokens
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(["super_admin", "owner"]);
    const body = Patch.parse(await req.json());

    // Validate Telegram token jika diisi
    if (body.telegramBotToken && !body.telegramBotToken.startsWith("***")) {
      const test = await testTelegramBot(body.telegramBotToken);
      if (!test.ok) {
        return fail(400, `Token Telegram tidak valid: ${test.error}`);
      }
    }

    const update: Record<string, any> = { updatedAt: new Date() };
    if (body.telegramBotToken !== undefined) {
      // Jangan overwrite dengan masked value
      if (body.telegramBotToken && !body.telegramBotToken.startsWith("***")) {
        update.telegramBotToken = body.telegramBotToken;
      } else if (body.telegramBotToken === null || body.telegramBotToken === "") {
        update.telegramBotToken = null;
      }
    }
    if (body.whatsappToken !== undefined) {
      if (body.whatsappToken && !body.whatsappToken.startsWith("***")) {
        update.whatsappToken = body.whatsappToken;
      } else if (body.whatsappToken === null || body.whatsappToken === "") {
        update.whatsappToken = null;
      }
    }
    if (body.whatsappPhoneId !== undefined) {
      update.whatsappPhoneId = body.whatsappPhoneId || null;
    }

    let [existing] = await db
      .select()
      .from(schema.payrollSettings)
      .where(eq(schema.payrollSettings.companyId, session.companyId));
    if (!existing) {
      await db
        .insert(schema.payrollSettings)
        .values({ companyId: session.companyId, ...update });
    } else {
      await db
        .update(schema.payrollSettings)
        .set(update)
        .where(eq(schema.payrollSettings.companyId, session.companyId));
    }

    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "integrations.update",
      details: { changedKeys: Object.keys(update).filter((k) => k !== "updatedAt") },
    });

    return ok({ saved: true });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST — test Telegram connection
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole(["super_admin", "owner"]);
    const { token } = z.object({ token: z.string() }).parse(await req.json());
    const result = await testTelegramBot(token);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

function maskToken(token: string): string {
  if (token.length <= 10) return "***";
  return token.slice(0, 5) + "***" + token.slice(-4);
}
