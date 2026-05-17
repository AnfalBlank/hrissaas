/**
 * WhatsApp Cloud API helper.
 * Falls back to console-logging the payload when env not configured.
 */
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";

export const whatsappConfigured = () => !!(TOKEN && PHONE_ID);

function normalizePhone(phone: string) {
  let p = phone.replace(/[^\d]/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1); // Indonesia
  return p;
}

export async function sendWhatsAppText(opts: {
  to: string;
  text: string;
}) {
  if (!whatsappConfigured()) {
    console.log("[whatsapp:mock]", opts.to, "→", opts.text);
    return { ok: true, mock: true };
  }

  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
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
