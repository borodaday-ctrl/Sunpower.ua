// /api/telegram.js
// Безпечний проксі для надсилання заявок у Telegram.
// Токен бота і chat_id зберігаються ТІЛЬКИ тут, на сервері (Vercel Environment Variables),
// і ніколи не потрапляють у код браузера.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ ok: false, error: "Сервер не налаштований (немає TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)" });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== "string" || text.length === 0) {
    return res.status(400).json({ ok: false, error: "Порожнє повідомлення" });
  }
  if (text.length > 4000) {
    return res.status(400).json({ ok: false, error: "Повідомлення занадто довге" });
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });
    const data = await r.json();
    if (!data.ok) {
      console.error("Telegram API error:", data);
      return res.status(200).json({ ok: false, error: data.description || "Невідома помилка Telegram" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Telegram proxy failed:", e);
    return res.status(500).json({ ok: false, error: "Помилка мережі на сервері" });
  }
}
