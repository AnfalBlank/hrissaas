/**
 * Telegram Bot API helper.
 * Kirim pesan teks ke user via Telegram Bot.
 *
 * Env:
 * - TELEGRAM_BOT_TOKEN: token dari @BotFather
 *
 * Setiap pegawai perlu menyimpan `telegramChatId` di profil mereka.
 * Chat ID didapat saat user start bot dan kirim /start.
 */
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export const telegramConfigured = () => !!BOT_TOKEN;

export async function sendTelegramText(opts: {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown";
}) {
  if (!telegramConfigured()) {
    console.log("[telegram:mock]", opts.chatId, "→", opts.text);
    return { ok: true, mock: true };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
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
