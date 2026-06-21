// /api/_lib/kv.js
// Обгортка над Vercel KV (Redis). Якщо KV ще не підключено в проєкті
// (немає змінних KV_REST_API_URL / KV_REST_API_TOKEN) — функції повертають
// null/false замість падіння, щоб сайт продовжував працювати на резервних даних.

import { kv } from "@vercel/kv";

export function isKvConfigured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function kvGet(key, fallback = null) {
  if (!isKvConfigured()) return fallback;
  try {
    const val = await kv.get(key);
    return val === null || val === undefined ? fallback : val;
  } catch (e) {
    console.error("KV get failed:", key, e);
    return fallback;
  }
}

export async function kvSet(key, value) {
  if (!isKvConfigured()) return false;
  try {
    await kv.set(key, value);
    return true;
  } catch (e) {
    console.error("KV set failed:", key, e);
    return false;
  }
}

export async function kvDel(key) {
  if (!isKvConfigured()) return false;
  try {
    await kv.del(key);
    return true;
  } catch (e) {
    console.error("KV del failed:", key, e);
    return false;
  }
}
