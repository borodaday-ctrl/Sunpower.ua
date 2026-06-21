// /api/products.js
// GET  -> віддає поточний каталог товарів (публічно, для магазину на сайті)
// POST -> зберігає новий каталог (тільки для адмінки, перевіряє сесію)
//
// Якщо Vercel KV ще не підключено — GET поверне ok:false і фронтенд
// автоматично використає вбудований резервний каталог (SEED_PRODUCTS),
// сайт не зламається.

import { kvGet, kvSet, isKvConfigured } from "./_lib/kv.js";
import { isAuthenticated } from "./_lib/auth.js";

const KEY = "sunpower:products";

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (!isKvConfigured()) {
      return res.status(200).json({ ok: false, reason: "kv_not_configured", products: [] });
    }
    const products = await kvGet(KEY, null);
    if (!products) {
      return res.status(200).json({ ok: false, reason: "empty", products: [] });
    }
    return res.status(200).json({ ok: true, products });
  }

  if (req.method === "POST") {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ ok: false, error: "Потрібна авторизація" });
    }
    if (!isKvConfigured()) {
      return res.status(503).json({ ok: false, error: "База даних не підключена (Vercel KV)" });
    }
    const { products } = req.body || {};
    if (!Array.isArray(products)) {
      return res.status(400).json({ ok: false, error: "Очікувався масив products" });
    }
    if (products.length > 500) {
      return res.status(400).json({ ok: false, error: "Забагато товарів (ліміт 500)" });
    }
    const saved = await kvSet(KEY, products);
    if (!saved) return res.status(500).json({ ok: false, error: "Не вдалося зберегти" });
    return res.status(200).json({ ok: true, count: products.length });
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
