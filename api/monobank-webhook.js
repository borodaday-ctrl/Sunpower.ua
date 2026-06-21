// /api/monobank-webhook.js
// Приймає сповіщення від Monobank про статус оплати (успіх/скасування)
// і пересилає підтвердження в Telegram. Monobank сам викликає цей URL —
// фронтенд сюди не звертається напряму.
// Документація: https://monobank.ua/api-docs/acquiring/extras/webhooks

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { invoiceId, status, amount, ccy, reference } = req.body || {};

    if (status === "success") {
      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
      if (BOT_TOKEN && CHAT_ID) {
        const sum = typeof amount === "number" ? (amount / 100).toLocaleString("uk-UA") : "—";
        const text =
          `✅ <b>ОПЛАТА ОТРИМАНА (Monobank)</b>\n\n` +
          `🧾 Invoice: ${invoiceId || "—"}\n` +
          `🔖 Замовлення: ${reference || "—"}\n` +
          `💰 Сума: ${sum} ₴`;
        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
          });
        } catch (e) {
          console.error("Webhook telegram notify failed:", e);
        }
      }
    }

    // Monobank очікує 200 OK у відповідь, інакше повторюватиме виклик
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Monobank webhook error:", e);
    return res.status(200).json({ ok: true }); // все одно 200, щоб Monobank не зациклив ретраї
  }
}
