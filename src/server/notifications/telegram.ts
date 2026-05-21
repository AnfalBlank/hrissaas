/**
 * Telegram Bot API helper.
 * Token bisa dari:
 * 1. DB (payroll_settings.telegramBotToken) — diatur via admin UI
 * 2. Env `TELEGRAM_BOT_TOKEN` — fallback
 */
import { db, schema } from "@/server/db/client";
import { eq } from "drizzle-orm";

let cachedToken: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

async function getToken(companyId?: string): Promise<string | null> {
  // Env always wins if set
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;

  // Cache DB token
  if (cachedToken && Date.now() - cacheTime < CACHE_TTL) return cachedToken;

  if (companyId) {
    try {
      const [settings] = await db
        .select()
        .from(schema.payrollSettings)
        .where(eq(schema.payrollSettings.companyId, companyId));
      if (settings?.telegramBotToken) {
        cachedToken = settings.telegramBotToken;
        cacheTime = Date.now();
        return cachedToken;
      }
    } catch {}
  }
  return null;
}

export function telegramConfigured(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN || cachedToken);
}

export async function sendTelegramText(opts: {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown";
  companyId?: string;
}) {
  const token = await getToken(opts.companyId);
  if (!token) {
    console.log("[telegram:mock]", opts.chatId, "→", opts.text);
    return { ok: true, mock: true };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: opts.chatId,
          text: opts.text,
          parse_mode: opts.parseMode ?? "HTML",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram]", res.status, body);
      return { ok: false, status: res.status, body };
    }
    return { ok: true, mock: false };
  } catch (err) {
    console.error("[telegram] network error", err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Test koneksi bot — panggil getMe untuk verifikasi token valid.
 */
export async function testTelegramBot(token: string): Promise<{
  ok: boolean;
  botName?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const json = await res.json();
    if (json.ok) {
      return { ok: true, botName: json.result?.username };
    }
    return { ok: false, error: json.description ?? "Token tidak valid" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
