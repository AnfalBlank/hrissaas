/**
 * Centralized notification dispatcher — writes to DB, emits via Socket.IO,
 * and optionally sends WhatsApp/email.
 */
import { db, schema } from "@/server/db/client";
import { emitToAdmins, emitToCompany } from "@/server/realtime/emitter";
import { sendWhatsAppText } from "./whatsapp";
import { eq } from "drizzle-orm";

export async function notify(opts: {
  userId: string;
  companyId: string;
  title: string;
  body?: string;
  category?: "system" | "attendance" | "leave" | "payroll" | "cms" | "chat";
  icon?: string;
  link?: string;
  whatsapp?: boolean;
}) {
  const [row] = await db
    .insert(schema.notifications)
    .values({
      userId: opts.userId,
      companyId: opts.companyId,
      title: opts.title,
      body: opts.body,
      icon: opts.icon ?? "bell",
      category: opts.category ?? "system",
      link: opts.link,
    })
    .returning();

  emitToCompany(opts.companyId, "notification", { userId: opts.userId, item: row });

  if (opts.whatsapp) {
    const [emp] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.userId, opts.userId));
    if (emp?.phone) {
      sendWhatsAppText({
        to: emp.phone,
        text: `*${opts.title}*\n${opts.body ?? ""}`,
      }).catch(() => {});
    }
  }

  return row;
}

export function broadcastFeed(
  companyId: string,
  event: string,
  payload: Record<string, any>
) {
  emitToAdmins(companyId, event, payload);
}
