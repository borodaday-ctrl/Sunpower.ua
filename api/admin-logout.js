// /api/admin-logout.js
import { clearSessionCookie } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
