// /api/_lib/auth.js
// Підписані сесійні куки для адмінки. Без бази даних, без бібліотек —
// лише вбудований Node crypto. Один логін/пароль із Environment Variables,
// без публічної реєстрації.

import crypto from "crypto";

const COOKIE_NAME = "sp_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 годин

function sign(value) {
  const secret = process.env.SESSION_SECRET || "fallback-dev-secret-change-me";
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  let expected;
  try { expected = sign(payload); } catch { return false; }
  const sigBuf = Buffer.from(sig, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  const expiresAt = parseInt(payload, 10);
  return Number.isFinite(expiresAt) && Date.now() <= expiresAt;
}

export function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

export function setSessionCookie(res, token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`);
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

export function isAuthenticated(req) {
  return verifySessionToken(parseCookies(req)[COOKIE_NAME]);
}

export function safeCompare(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) {
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
