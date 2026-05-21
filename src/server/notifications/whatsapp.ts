/**
 * WhatsApp Cloud API helper.
 * Token bisa dari:
 * 1. DB (payroll_settings.whatsappToken + whatsappPhoneId) — diatur via admin UI
 * 2. Env `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` — fallback
 */
import { db, schema } from "@/server/db/client";
import { eq } from "drizzle-orm";

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";

let cachedWa: { token: string; phoneId: string } | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getConfig(companyId?: string) {
  const envToken = process.env.WHATSAPP_TOKEN;
  const envPhone = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (envToken && envPhone) return { token: envToken, phoneId: envPhone };

  if (cachedWa && Date.now() - cacheTime < CACHE_TTL) return cachedWa;

  if (companyId) {
    try {
      const [settings] = await db
        .select()
        .from(schema.payrollSettings)
        .where(eq(schema.payrollSettings.companyId, companyId));
      if (settings?.whatsappToken && settings?.whatsappPhoneId) {
        cachedWa = {
          token: settings.whatsappToken,
          phoneId: settings.whatsappPhoneId,
        };
        cacheTime = Date.now();
        return cachedWa;
      }
    } catch {}
  }
  return null;
}

export function whatsappConfigured(): boolean {
  return !!(
    (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) ||
    cachedWa
  );
}

function normalizePhone(phone: string) {
  let p = phone.replace(/[^\d]/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return p;
}

export async function sendWhatsAppText(opts: {
  to: string;
  text: string;
  companyId?: string;
}) {
  const config = await getConfig(opts.companyId);
  if (!config) {
    console.log("[whatsapp:mock]", opts.to, "→", opts.text);
    return { ok: true, mock: true };
  }

  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${config.phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhone(opts.to),
        type: "text",
        text: { body: opts.text },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[whatsapp]", res.status, body);
    return { ok: false, status: res.status, body };
  }
  return { ok: true, mock: false };
}
