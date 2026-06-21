// /api/leads.js
// POST   -> створює нову заявку (публічно — викликається з калькулятора/кошика).
//           Одночасно надсилає сповіщення в Telegram (як і раніше).
// GET    -> список усіх заявок (тільки адмінка)
// PUT    -> оновити статус заявки (тільки адмінка)
// DELETE -> видалити заявку (тільки адмінка)

import { kv } from "@vercel/kv";
import { isKvConfigured } from "./_lib/kv.js";
import { isAuthenticated } from "./_lib/auth.js";
import { sendLeadEmail } from "./_lib/email.js";

const KEY = "sunpower:leads";

async function notifyTelegram(text) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!BOT_TOKEN || !CHAT_ID) return { ok: false, error: "Telegram не налаштований" };
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML" }),
    });
    const data = await r.json();
    return { ok: !!data.ok, error: data.ok ? null : data.description };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export default async function handler(req, res) {
  // ══ POST — нова заявка (публічно) ══
  if (req.method === "POST") {
    const { type, name, phone, amount, details, telegramText } = req.body || {};
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({ ok: false, error: "Телефон обовʼязковий" });
    }

    const lead = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: type || "other",
      status: "new",
      createdAt: new Date().toISOString(),
      name: (name || "").slice(0, 200),
      phone: phone.slice(0, 40),
      amount: typeof amount === "number" ? amount : null,
      details: (details || "").slice(0, 3000),
    };

    if (isKvConfigured()) {
      try {
        await kv.hset(KEY, { [lead.id]: JSON.stringify(lead) });
      } catch (e) {
        console.error("Failed to save lead to KV:", e);
      }
    }

    const tg = telegramText
      ? await notifyTelegram(telegramText)
      : { ok: true };

    // Email — дублюємо паралельно, не блокуючи відповідь клієнту,
    // і не падаємо, якщо EMAIL_USER/EMAIL_PASS ще не налаштовані.
    sendLeadEmail({ type: lead.type, name: lead.name, phone: lead.phone, amount: lead.amount, details: lead.details })
      .catch((e) => console.error("sendLeadEmail failed:", e));

    return res.status(200).json({ ok: true, leadId: lead.id, telegram: tg });
  }

  // ══ GET — список заявок (адмінка) ══
  if (req.method === "GET") {
    if (!isAuthenticated(req)) return res.status(401).json({ ok: false, error: "Потрібна авторизація" });
    if (!isKvConfigured()) return res.status(200).json({ ok: true, leads: [] });
    try {
      const all = await kv.hgetall(KEY);
      const leads = Object.values(all || {})
        .map((v) => { try { return typeof v === "string" ? JSON.parse(v) : v; } catch { return null; } })
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ ok: true, leads });
    } catch (e) {
      console.error("Failed to list leads:", e);
      return res.status(500).json({ ok: false, error: "Помилка читання заявок" });
    }
  }

  // ══ PUT — оновити статус (адмінка) ══
  if (req.method === "PUT") {
    if (!isAuthenticated(req)) return res.status(401).json({ ok: false, error: "Потрібна авторизація" });
    if (!isKvConfigured()) return res.status(503).json({ ok: false, error: "База даних не підключена" });
    const { id, status } = req.body || {};
    if (!id || !["new", "in_progress", "closed"].includes(status)) {
      return res.status(400).json({ ok: false, error: "Некоректні дані" });
    }
    try {
      const existing = await kv.hget(KEY, id);
      if (!existing) return res.status(404).json({ ok: false, error: "Заявку не знайдено" });
      const lead = typeof existing === "string" ? JSON.parse(existing) : existing;
      lead.status = status;
      await kv.hset(KEY, { [id]: JSON.stringify(lead) });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("Failed to update lead:", e);
      return res.status(500).json({ ok: false, error: "Помилка оновлення" });
    }
  }

  // ══ DELETE — видалити заявку (адмінка) ══
  if (req.method === "DELETE") {
    if (!isAuthenticated(req)) return res.status(401).json({ ok: false, error: "Потрібна авторизація" });
    if (!isKvConfigured()) return res.status(503).json({ ok: false, error: "База даних не підключена" });
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: "Немає id" });
    try {
      await kv.hdel(KEY, id);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Помилка видалення" });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
