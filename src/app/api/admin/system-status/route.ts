/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";
import { r2Configured } from "@/server/storage/r2";
import { whatsappConfigured } from "@/server/notifications/whatsapp";
import { telegramConfigured } from "@/server/notifications/telegram";

export async function GET() {
  try {
    await requireRole(["super_admin", "owner", "hr"]);
    return ok({
      r2: r2Configured(),
      whatsapp: whatsappConfigured(),
      telegram: telegramConfigured(),
      socketIO: !!globalThis.__io__,
      jwt: !!process.env.JWT_SECRET,
    });
  } catch (e) {
    return handleError(e);
  }
}
