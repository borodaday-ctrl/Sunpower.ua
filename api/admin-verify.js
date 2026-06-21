// /api/admin-verify.js
import { isAuthenticated } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  return res.status(200).json({ ok: isAuthenticated(req) });
}
