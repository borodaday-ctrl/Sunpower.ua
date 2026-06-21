// /api/monobank-create-invoice.js
// Створює рахунок на оплату через Monobank Acquiring API.
// MONOBANK_TOKEN зберігається ТІЛЬКИ на сервері (Vercel Environment Variables).
// Документація: https://monobank.ua/api-docs/acquiring/methods/ia/post--api--merchant--invoice--create

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const TOKEN = process.env.MONOBANK_TOKEN;
  if (!TOKEN) {
    // Платіжка ще не підключена — фронтенд має обробити цю помилку
    // і запропонувати клієнту альтернативний спосіб оплати (готівка / заявка в Telegram).
    return res.status(503).json({ ok: false, error: "Оплата карткою тимчасово недоступна. Залиште заявку — менеджер зв'яжеться для оплати." });
  }

  const { amount, orderRef, description, customerName, customerPhone } = req.body || {};

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ ok: false, error: "Некоректна сума" });
  }
  if (amount > 1000000) {
    return res.status(400).json({ ok: false, error: "Сума перевищує допустимий ліміт" });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const r = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Token": TOKEN },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // сума в копійках
        ccy: 980, // UAH
        merchantPaymInfo: {
          reference: orderRef || `sunpower_${Date.now()}`,
          destination: description || "Оплата замовлення Sun Power UA",
          comment: customerName ? `Замовник: ${customerName}${customerPhone ? ", " + customerPhone : ""}` : undefined,
        },
        redirectUrl: `${origin}/?payment=success`,
        webHookUrl: `${origin}/api/monobank-webhook`,
        validity: 3600, // рахунок дійсний 1 годину
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("Monobank create invoice error:", data);
      return res.status(r.status).json({ ok: false, error: data.errText || "Помилка створення рахунку Monobank" });
    }

    return res.status(200).json({ ok: true, invoiceId: data.invoiceId, pageUrl: data.pageUrl });
  } catch (e) {
    console.error("Monobank invoice request failed:", e);
    return res.status(500).json({ ok: false, error: "Помилка зв'язку з Monobank" });
  }
}
