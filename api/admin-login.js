// /api/admin-login.js
import { createSessionToken, setSessionCookie, safeCompare, delay } from "./_lib/auth.js";

const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  return fwd ? String(fwd).split(",")[0].trim() : (req.socket?.remoteAddress || "unknown");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return res.status(500).json({ ok: false, error: "Адмінка не налаштована (ADMIN_USERNAME / ADMIN_PASSWORD)" });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.firstAttempt < WINDOW_MS && rec.count >= MAX_ATTEMPTS) {
    await delay(700);
    return res.status(429).json({ ok: false, error: "Забагато спроб. Спробуйте через 10 хвилин." });
  }

  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ ok: false, error: "Вкажіть логін і пароль" });

  await delay(250);
  const ok = safeCompare(username, ADMIN_USERNAME) && safeCompare(password, ADMIN_PASSWORD);

  if (!ok) {
    if (!rec || now - rec.firstAttempt > WINDOW_MS) attempts.set(ip, { count: 1, firstAttempt: now });
    else rec.count += 1;
    return res.status(401).json({ ok: false, error: "Невірний логін або пароль" });
  }

  attempts.delete(ip);
  setSessionCookie(res, createSessionToken());
  return res.status(200).json({ ok: true });
}
