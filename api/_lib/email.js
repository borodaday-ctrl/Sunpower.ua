// /api/_lib/email.js
// Резервне дублювання заявок на email — на випадок, якщо Telegram пропущено
// або тимчасово недоступний. Використовує Gmail SMTP через App Password
// (НЕ звичайний пароль від Gmail — його Google заблокує).
//
// Як отримати App Password:
// https://myaccount.google.com/apppasswords (потрібна 2FA на акаунті)

import nodemailer from "nodemailer";

let cachedTransporter = null;

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

export async function sendLeadEmail({ type, name, phone, amount, details }) {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, skipped: true }; // не налаштовано — тихо пропускаємо

  const to = process.env.EMAIL_TO || process.env.EMAIL_USER;
  const typeLabels = {
    shop_order: "🛒 Замовлення з магазину",
    calculator: "🔆 Заявка з калькулятора",
    contact_form: "📩 Зворотний дзвінок",
    other: "📋 Заявка",
  };

  const subject = `${typeLabels[type] || "Нова заявка"} — Sun Power UA`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#14532D;margin-top:0;">${typeLabels[type] || "Нова заявка"}</h2>
      ${name ? `<p><b>Ім'я:</b> ${name}</p>` : ""}
      <p><b>Телефон:</b> <a href="tel:${phone}">${phone}</a></p>
      ${amount != null ? `<p><b>Сума:</b> ${Number(amount).toLocaleString("uk-UA")} ₴</p>` : ""}
      ${details ? `<p><b>Деталі:</b> ${details}</p>` : ""}
      <p style="color:#888;font-size:12px;margin-top:20px;">Sun Power UA · автоматичне сповіщення</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Sun Power UA" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (e) {
    console.error("Email send failed:", e);
    return { ok: false, error: e.message };
  }
}
