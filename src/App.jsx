import { useState, useEffect, useRef } from "react";
import { Sun, Zap, Shield, TrendingUp, ChevronDown, ArrowRight, Check, X,
  Star, Phone, Mail, MapPin, Clock, Award, PlayCircle, MessageCircle,
  Activity, ShoppingCart, Plus, Minus, Trash2, Search, ChevronLeft,
  ChevronRight, Heart, Truck, RotateCcw, CreditCard, Battery, Home,
  Building2, Wrench, FileText, Leaf } from "lucide-react";

/* ══ TELEGRAM ══ */
/* ══ TELEGRAM ══
   Токен бота та chat_id більше НЕ зберігаються в коді сайту (це небезпечно —
   код браузера видно всім). Вони лежать на сервері у Vercel Environment Variables
   і використовуються лише всередині /api/telegram.js. */

/* ══ АНАЛІТИКА ТА РЕКЛАМА (Google Ads / Meta Ads) ══
   Встав свої ID нижче — після цього все почне працювати автоматично.
   Якщо ID не вказано (залишено порожнім "") — трекінг просто не активується,
   сайт продовжує працювати нормально. */
const ADS_CONFIG = {
  // Більше не треба редагувати код — задай ці значення як змінні середовища
  // у Vercel (Settings → Environment Variables), і вони підхопляться самі.
  GA4_ID: import.meta.env.VITE_GA4_ID || "",                       // напр. "G-XXXXXXXXXX"
  GOOGLE_ADS_ID: import.meta.env.VITE_GOOGLE_ADS_ID || "",         // напр. "AW-XXXXXXXXXX"
  GOOGLE_ADS_LEAD_LABEL: import.meta.env.VITE_GOOGLE_ADS_LEAD_LABEL || "",
  GOOGLE_ADS_PURCHASE_LABEL: import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL || "",
  META_PIXEL_ID: import.meta.env.VITE_META_PIXEL_ID || "",         // напр. "1234567890123"
};

// Підвантажує Google Analytics (gtag.js) + Google Ads, якщо вказано ID
function loadGoogleTags() {
  if (!ADS_CONFIG.GA4_ID && !ADS_CONFIG.GOOGLE_ADS_ID) return;
  if (window.__gtagLoaded) return;
  window.__gtagLoaded = true;
  const id = ADS_CONFIG.GA4_ID || ADS_CONFIG.GOOGLE_ADS_ID;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  if (ADS_CONFIG.GA4_ID) window.gtag("config", ADS_CONFIG.GA4_ID);
  if (ADS_CONFIG.GOOGLE_ADS_ID) window.gtag("config", ADS_CONFIG.GOOGLE_ADS_ID);
}

// Підвантажує Meta (Facebook/Instagram) Pixel, якщо вказано ID
function loadMetaPixel() {
  if (!ADS_CONFIG.META_PIXEL_ID) return;
  if (window.__fbqLoaded) return;
  window.__fbqLoaded = true;
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq("init", ADS_CONFIG.META_PIXEL_ID);
  window.fbq("track", "PageView");
}

// Відстеження конверсії "Лід" (заявка з калькулятора / форми)
function trackLead(meta = {}) {
  try {
    if (window.gtag && ADS_CONFIG.GOOGLE_ADS_ID && ADS_CONFIG.GOOGLE_ADS_LEAD_LABEL) {
      window.gtag("event", "conversion", {
        send_to: `${ADS_CONFIG.GOOGLE_ADS_ID}/${ADS_CONFIG.GOOGLE_ADS_LEAD_LABEL}`,
        ...meta,
      });
    }
    if (window.gtag && ADS_CONFIG.GA4_ID) window.gtag("event", "generate_lead", meta);
    if (window.fbq) window.fbq("track", "Lead", meta);
  } catch (e) { console.error("trackLead error:", e); }
}

// Відстеження конверсії "Покупка" (замовлення з магазину)
function trackPurchase(value, currency = "UAH", meta = {}) {
  try {
    if (window.gtag && ADS_CONFIG.GOOGLE_ADS_ID && ADS_CONFIG.GOOGLE_ADS_PURCHASE_LABEL) {
      window.gtag("event", "conversion", {
        send_to: `${ADS_CONFIG.GOOGLE_ADS_ID}/${ADS_CONFIG.GOOGLE_ADS_PURCHASE_LABEL}`,
        value, currency, ...meta,
      });
    }
    if (window.gtag && ADS_CONFIG.GA4_ID) window.gtag("event", "purchase", { value, currency, ...meta });
    if (window.fbq) window.fbq("track", "Purchase", { value, currency, ...meta });
  } catch (e) { console.error("trackPurchase error:", e); }
}


/* ══ RATE LIMITING (захист від спаму) ══ */
const _rateMap = {};
function checkRateLimit(key = "default", max = 3, windowMs = 60000) {
  const now = Date.now();
  if (!_rateMap[key]) _rateMap[key] = [];
  _rateMap[key] = _rateMap[key].filter(t => now - t < windowMs);
  if (_rateMap[key].length >= max) return false;
  _rateMap[key].push(now);
  return true;
}

/* ══ SEO: meta-теги, Open Graph, Schema.org ══ */
function setupSEO() {
  const SITE_URL = "https://sunpower.ua";
  const TITLE = "Sun Power UA — Сонячні електростанції під ключ у Вараші";
  const DESC = "Монтаж сонячних електростанцій для дому та бізнесу. Понад 50 завершених об'єктів, гарантія до 10 років, кредит 0%. Безкоштовний розрахунок СЕС онлайн.";
  const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

  document.title = TITLE;
  document.documentElement.lang = "uk";

  const setMeta = (attr, key, value) => {
    let tag = document.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attr, key); document.head.appendChild(tag); }
    tag.setAttribute("content", value);
  };

  setMeta("name", "description", DESC);
  setMeta("name", "robots", "index, follow");
  setMeta("name", "viewport", "width=device-width, initial-scale=1");

  // Open Graph (Facebook, Telegram, WhatsApp превʼю)
  setMeta("property", "og:type", "website");
  setMeta("property", "og:title", TITLE);
  setMeta("property", "og:description", DESC);
  setMeta("property", "og:image", OG_IMAGE);
  setMeta("property", "og:url", SITE_URL);
  setMeta("property", "og:locale", "uk_UA");
  setMeta("property", "og:site_name", "Sun Power UA");

  // Twitter Card
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", TITLE);
  setMeta("name", "twitter:description", DESC);
  setMeta("name", "twitter:image", OG_IMAGE);

  // Canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel","canonical"); document.head.appendChild(canonical); }
  canonical.setAttribute("href", SITE_URL);

  // Schema.org — LocalBusiness, щоб Google показував адресу/телефон/рейтинг у пошуку
  let ld = document.getElementById("schema-org-data");
  if (!ld) { ld = document.createElement("script"); ld.id = "schema-org-data"; ld.type = "application/ld+json"; document.head.appendChild(ld); }
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "name": "Sun Power UA",
    "image": OG_IMAGE,
    "url": SITE_URL,
    "telephone": "+380962033839",
    "priceRange": "₴₴₴",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "вул. Комунальна 7",
      "addressLocality": "Вараш",
      "addressRegion": "Рівненська область",
      "addressCountry": "UA"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    "sameAs": [
      "https://www.instagram.com/sun.powerua",
      "https://www.facebook.com/profile.php?id=61587772408533",
      "https://www.tiktok.com/@sun.power.ua",
      "https://www.youtube.com/@sunpower-u1"
    ]
  });
}

/* ══ БЕЗПЕКА: санітизація вводу та валідація ══ */
// Захист від HTML-ін'єкцій у повідомлення Telegram (parse_mode: HTML)
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .slice(0, 500); // обмеження довжини проти спаму/переповнення
}
// Валідація українського номера телефону
function isValidPhone(phone) {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  // +380XXXXXXXXX (12 цифр) або 0XXXXXXXXX (10 цифр)
  return /^(380\d{9}|0\d{9})$/.test(digits);
}

async function sendToTelegram(text, extra = {}) {
  try {
    const res = await fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, ...extra }),
    });
    const data = await res.json();
    if (!data.ok) console.error("Telegram error:", data);
    return { ok: !!data.ok, error: data.ok ? null : (data.error || "Невідома помилка") };
  } catch (e) {
    console.error("Telegram send failed:", e);
    return { ok: false, error: e.message || "Помилка мережі (можливо немає інтернету)" };
  }
}

/* ══ ЗАЯВКИ — збереження в базу для адмін-панелі (не блокує Telegram) ══ */
async function saveLead({ type, name, phone, amount, details }) {
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name, phone, amount, details }),
    });
    const data = await res.json();
    return { ok: !!data.ok };
  } catch (e) {
    console.error("saveLead failed:", e);
    return { ok: false };
  }
}

/* ══ MONOBANK — створення рахунку на оплату ══ */
async function createMonobankInvoice({ amount, orderRef, description, customerName, customerPhone }) {
  try {
    const res = await fetch("/api/monobank-create-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, orderRef, description, customerName, customerPhone }),
    });
    const data = await res.json();
    if (!data.ok) return { ok: false, error: data.error || "Не вдалося створити рахунок" };
    return { ok: true, pageUrl: data.pageUrl, invoiceId: data.invoiceId };
  } catch (e) {
    return { ok: false, error: e.message || "Помилка мережі" };
  }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'DM Sans',sans-serif;background:#F5F5F5;color:#1A1A1A;overflow-x:hidden;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%}
::selection{background:rgba(34,197,94,.2);color:#1A1A1A}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:#F5F5F5}
::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#22C55E,#F5C518);border-radius:3px}
*,*::before,*::after{box-sizing:border-box}
:root{
  --g1:#22C55E; --g2:#16A34A; --g3:#14532D;
  --y1:#F5C518; --y2:#EAB308;
  --dark:#1A1A1A; --dark2:#2A2A2A; --dark3:#3A3A3A;
  --surface:#FFFFFF; --base:#F5F5F5; --muted:#EFEFEF;
  --text:#1A1A1A; --sub:#555;
  --border:rgba(0,0,0,.09); --radius:16px;
  --shadow:0 8px 32px rgba(0,0,0,.10);
}
@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
@keyframes slowBlink{0%,100%{background:#22C55E;box-shadow:0 8px 28px rgba(34,197,94,.35)}50%{background:#F5C518;box-shadow:0 8px 28px rgba(245,197,24,.5)}}
@keyframes cartBlink{0%,49%{background:#F5C518;box-shadow:0 0 16px rgba(245,197,24,.6);border-color:#F5C518}50%,100%{background:transparent;box-shadow:none;border-color:rgba(255,255,255,.18)}}
@keyframes orderBlink{0%,49%{background:rgba(245,197,24,.22);border-color:rgba(245,197,24,.55);box-shadow:0 0 14px rgba(245,197,24,.25)}50%,100%{background:transparent;border-color:rgba(255,255,255,.3);box-shadow:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes carouselSlide{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}

.reveal{opacity:1;transform:none}
.reveal.in{opacity:1;transform:translateY(0)}
.container{max-width:1200px;margin:0 auto;padding:0 clamp(16px,4vw,64px);box-sizing:border-box}
.section{padding:clamp(32px,5vw,72px) 0;width:100%;box-sizing:border-box}

h1{font-family:'Syne',sans-serif;font-size:clamp(28px,6vw,72px);font-weight:800;line-height:1.05;letter-spacing:-.03em}
h2{font-family:'Syne',sans-serif;font-size:clamp(22px,4vw,46px);font-weight:700;letter-spacing:-.02em;line-height:1.1}
h3{font-family:'Syne',sans-serif;font-size:clamp(15px,2vw,20px);font-weight:700;letter-spacing:-.01em}

.grad-text{background:linear-gradient(135deg,#22C55E,#F5C518);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.green-underline{display:inline-block;position:relative}
.green-underline::after{content:'';position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:60%;height:3px;background:#22C55E;border-radius:2px}

/* BUTTONS */
.btn-green{position:relative;overflow:hidden;background:#22C55E;color:#fff;border:none;border-radius:100px;padding:13px 26px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:all .3s;box-shadow:0 6px 22px rgba(34,197,94,.35);white-space:nowrap;display:inline-flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:.04em}
.btn-green:hover{background:#16A34A;transform:translateY(-2px);box-shadow:0 12px 36px rgba(34,197,94,.48)}
.btn-yellow{background:#F5C518;color:#1A1A1A;border:none;border-radius:100px;padding:13px 26px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:all .3s;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:.04em}
.btn-yellow:hover{background:#EAB308;transform:translateY(-2px)}
.btn-outline-green{background:transparent;color:#22C55E;border:2px solid #22C55E;border-radius:100px;padding:12px 24px;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;cursor:pointer;transition:all .3s;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:.04em}
.btn-outline-green:hover{background:#22C55E;color:#fff}

/* NAVBAR */
.drawer{position:fixed;inset:0;z-index:200;pointer-events:none}
.drawer.open{pointer-events:all}
.drawer-overlay{position:absolute;inset:0;background:rgba(0,0,0,.5);opacity:0;transition:opacity .35s}
.drawer.open .drawer-overlay{opacity:1}
.drawer-panel{position:absolute;top:0;right:0;bottom:0;width:min(300px,90vw);background:#1A1A1A;display:flex;flex-direction:column;overflow:auto;transform:translateX(100%);transition:transform .35s cubic-bezier(.16,1,.3,1)}
.drawer.open .drawer-panel{transform:translateX(0)}

/* CARDS */
.service-card{background:#fff;border:1px solid var(--border);border-radius:20px;padding:28px;transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.service-card:hover{transform:translateY(-6px);box-shadow:0 20px 50px rgba(34,197,94,.15);border-color:rgba(34,197,94,.3)}
.project-card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:var(--shadow);transition:all .4s cubic-bezier(.34,1.56,.64,1)}
.project-card:hover{transform:translateY(-5px);box-shadow:0 20px 52px rgba(0,0,0,.14)}
.partner-logo{background:#fff;border:1px solid var(--border);border-radius:16px;padding:24px 32px;display:flex;align-items:center;justify-content:center;transition:all .3s;height:90px}
.brand-scroller{-ms-overflow-style:none;scrollbar-width:none;height:72px;display:flex;align-items:center}
.brand-scroller::-webkit-scrollbar{display:none}
/* Кнопки шапки: ефект наведення лише на пристроях з мишею (@media hover:hover),
   щоб на телефоні дотик не "застрягав" у підсвіченому стані назавжди */
@media (hover:hover){
  .navicon-search:hover{background:#F5C518 !important;color:#1E6B2E !important;border-color:#F5C518 !important}
  .navicon-wish:hover{border-color:#22C55E !important;background:rgba(34,197,94,.08) !important}
  .navicon-cart:hover{background:#F5C518 !important;color:#1E6B2E !important;border-color:#F5C518 !important;animation-play-state:paused}
}
.partner-logo:hover{box-shadow:0 8px 28px rgba(34,197,94,.15);border-color:rgba(34,197,94,.3);transform:scale(1.04)}

/* SHOP */
.shop-modal{position:fixed;inset:0;z-index:301;background:#F5F5F5;overflow-y:auto;animation:fadeIn .3s ease}
.product-card{background:#fff;border:1px solid var(--border);border-radius:18px;overflow:hidden;transition:all .4s cubic-bezier(.34,1.56,.64,1);position:relative}
.product-card:hover{transform:translateY(-5px);box-shadow:0 18px 48px rgba(0,0,0,.1)}
.product-card:hover .product-img img{transform:scale(1.05)}
.product-img{overflow:hidden;aspect-ratio:4/3;background:#F0F0EC}
.product-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
.cart-panel{position:fixed;top:0;right:0;bottom:0;width:min(400px,100vw);background:#fff;z-index:500;box-shadow:-16px 0 48px rgba(0,0,0,.14);display:flex;flex-direction:column;animation:slideIn .35s cubic-bezier(.16,1,.3,1)}
.cart-toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:9998;background:#1A1A1A;border-radius:16px;padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,.3);animation:toastIn .35s cubic-bezier(.16,1,.3,1);white-space:nowrap}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.cart-overlay{position:fixed;inset:0;z-index:499;background:rgba(0,0,0,.4);animation:fadeIn .2s ease}
.qty-btn{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--border);background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
.qty-btn:hover{border-color:#22C55E;color:#22C55E;background:rgba(34,197,94,.07)}
.filter-chip{padding:7px 16px;border-radius:100px;border:1.5px solid var(--border);background:#fff;font-family:'DM Sans',sans-serif;font-weight:500;font-size:13px;cursor:pointer;transition:all .2s;white-space:nowrap;color:var(--sub)}
.filter-chip.active{border-color:#22C55E;background:rgba(34,197,94,.08);color:#14532D;font-weight:700}
.wishlist-btn{position:absolute;top:10px;right:10px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.95);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;z-index:10;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.wishlist-btn:hover{background:#fff;transform:scale(1.15)}
@media (hover:hover){ .navbar-logo-btn:hover{transform:scale(1.05)} }
.navbar-logo-btn{transition:transform .25s}
.badge-new{position:absolute;top:10px;left:10px;background:#22C55E;color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;z-index:2}
.badge-sale{position:absolute;top:10px;left:10px;background:#EF4444;color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;z-index:2}
.search-box{width:100%;padding:11px 16px 11px 42px;border:2px solid var(--border);border-radius:100px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s;background:#fff}
.search-box:focus{border-color:#22C55E}

.faq-wrap{border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:8px;background:#fff;transition:all .3s}
.faq-wrap.open{border-color:rgba(34,197,94,.3);background:#F0FDF4}
.faq-btn{width:100%;background:none;border:none;padding:18px 22px;text-align:left;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-family:'DM Sans',sans-serif;font-weight:600;font-size:15px;color:var(--text);gap:12px}
.faq-chevron{transition:transform .4s ease;flex-shrink:0;color:#22C55E}
.faq-chevron.open{transform:rotate(180deg)}
.faq-body{max-height:0;overflow:hidden;transition:max-height .4s ease,padding .4s ease;font-size:14px;line-height:1.75;color:var(--sub);padding:0 22px}
.faq-body.open{max-height:260px;padding:0 22px 18px}

.av-stack{display:flex}
.av-stack img{width:33px;height:33px;border-radius:50%;border:2.5px solid #fff;margin-left:-8px;object-fit:cover}
.av-stack img:first-child{margin-left:0}
.noise{position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");pointer-events:none}

@media(max-width:640px){.hide-mobile{display:none!important}}
@media(min-width:641px){.show-mobile{display:none!important}}
`;

const REAL_LOGO = "/images/real_logo.jpg";
const ICON_LOGO = "/images/icon_logo.png";

const KIT_IMG = "/images/kit_img.jpg";

const AVS = ["1494790108755-2616b612b786","1507003211169-0a1dd7228f2d","1438761681033-6461ffad8d80","1500648767791-00dcc994a43e","1534528741775-53994a69daeb"];

const ADVANTAGES = [
  { icon:"🏠", title:"Монтаж під ключ", desc:"Від проєкту до підключення — ми відповідаємо за кожен етап і не залишаємо вас наодинці з проблемами." },
  { icon:"🛡️", title:"Гарантія якості", desc:"Панелі — 10 років, інвертори — 5 років, акумулятори — 5 років. Офіційна гарантія від виробників." },
  { icon:"👷", title:"Досвідчена команда", desc:"50+ закритих об'єктів, 3 роки на ринку. Наші монтажники — сертифіковані фахівці з практичним досвідом." },
];

const PROJECTS = [
  { title:"СЕС 50 кВт — Підприємство", loc:"Вараш", kw:"50 кВт", tag:"Промислова", img:null, imgSrc:"/images/project1.jpg" },
  { title:"СЕС 30 кВт — Виробництво", loc:"Рівненська обл.", kw:"30 кВт", tag:"Мережева", img:null, imgSrc:"/images/project2.jpg" },
  { title:"СЕС 15 кВт — Котедж з садом", loc:"Вараш", kw:"15 кВт", tag:"Гібридна", img:null, imgSrc:"/images/project3.jpg" },
  { title:"СЕС 30 кВт — Наземна станція", loc:"Рівненська обл.", kw:"30 кВт", tag:"Мережева", img:null, imgSrc:"/images/project4.jpg" },
  { title:"СЕС — Кафе «Щедрик»", loc:"Вараш", kw:"10 кВт", tag:"Мережева", img:null, imgSrc:"/images/project5.jpg" },
  { title:"СЕС 9 кВт — Приватний будинок", loc:"Вараш", kw:"9 кВт", tag:"Гібридна", img:null, imgSrc:"/images/project6.jpg" },
  { title:"СЕС 20 кВт — Плоский дах", loc:"Рівне", kw:"20 кВт", tag:"Мережева", img:null, imgSrc:"/images/project7.jpg" },
  { title:"СЕС 5 кВт — Наземна LONGi", loc:"Рівненська обл.", kw:"5 кВт", tag:"Мережева", img:null, imgSrc:"/images/project8.jpg" },
  { title:"СЕС 50 кВт — Промисловий об'єкт", loc:"Вараш", kw:"50 кВт", tag:"Промислова", img:null, imgSrc:"/images/project9.jpg" },
];

const PARTNERS = [
  { name:"Deye",         logoSrc:"/images/logo_deye.png" },
  { name:"LONGi",        logoSrc:"/images/logo_longi.png" },
  { name:"JinKo Solar",  logoSrc:"/images/logo_jinkosolar.png" },
  { name:"JA Solar",     logoSrc:"/images/logo_jasolar.png" },
  { name:"Huawei",       logoSrc:"/images/logo_huawei.png" },
  { name:"Trina Solar",  logoSrc:"/images/logo_trinasolar_v2.png" },
  { name:"Solis",        logoSrc:"/images/logo_solis_v3.png" },
  { name:"SolaX Power",  logoSrc:"/images/logo_solax_v2.png" },
];

const SERVICES = [
  { icon:"⚡", title:"Обладнання", desc:"Пропонуємо сонячні панелі, інвертори, акумулятори та комплектуючі від провідних світових брендів. Лише перевірені рішення з гарантією якості та професійною підтримкою.", price:"від 181 000 ₴", link:"shop" },
  { icon:"🌿", title:"Зелений тариф", desc:"Заробляйте на надлишках виробленої електроенергії. Допоможемо підібрати рішення, підготувати документи та максимально ефективно використовувати можливості зеленого тарифу.", price:"від 0 ₴", link:"contact" },
  { icon:"🏭", title:"СЕС для бізнесу", desc:"Промислові станції від 50 кВт. Кредитування 5-7-9% для юридичних осіб. Термін до 5 років, до 150 млн грн.", price:"від 800 000 ₴", link:"contact" },
  { icon:"💳", title:"Кредит під 0%", desc:"Державна програма — кредит на сонячні панелі та електростанції для приватних осіб без переплат.", price:"0% річних", link:"contact" },
  { icon:"🔋", title:"Накопичення енергії", desc:"ESS системи для зберігання електроенергії. Продавайте надлишок у мережу у найвигідніші години.", price:"під ключ", link:"shop" },
  { icon:"📈", title:"Розширення СЕС", desc:"Збільшення потужності існуючої сонячної станції під ключ. Більше генерації — більше економії.", price:"під ключ", link:"contact" },
];

const STEPS = [
  { n:"01", title:"Консультація", desc:"Безкоштовний розрахунок та підбір системи під ваш об'єкт." },
  { n:"02", title:"Проєкт та договір", desc:"Розробляємо проєкт, допомагаємо з кредитуванням 0% або 5-7-9%." },
  { n:"03", title:"Монтаж 1–3 дні", desc:"Сертифіковані бригади по всій Україні. Встановлення та підключення." },
  { n:"04", title:"Заробляєте!", desc:"Окупність 3–5 років, потім 20+ років безкоштовної електроенергії." },
];

const STATS = [
  { n:50, s:"+", label:"Закритих об'єктів" },
  { n:3, s:" роки", label:"На ринку" },
  { n:1000, s:"+", label:"Встановлених панелей" },
  { n:3, s:" МВт", label:"Виробляємо щодня" },
];

const PACKAGES = [
  { name:"Дім Старт", price:"від 181 000 ₴", desc:"Мережева 5–6 кВт", features:["10 панелей LONGi","Інвертор Huawei","Гарантія 5 років","Підключення до мережі","Базовий моніторинг"], hot:false, color:"#22C55E", emoji:"🏠", tag:"Базовий" },
  { name:"Дім Преміум", price:"від 317 000 ₴", desc:"Гібридна 10–15 кВт", features:["20 панелей LONGi Hi-MO 6","Гібридний інвертор","Акумулятор 10 кВт·год","Net-billing","Моніторинг 24/7","Гарантія 5 років"], hot:true, color:"#22C55E", emoji:"⭐", tag:"Популярний" },
  { name:"Бізнес 5-7-9%", price:"від 800 000 ₴", desc:"Промислові від 50 кВт", features:["Потужність від 50 кВт","Кредит 5–9% річних","До 150 млн грн","Net-billing","Власний менеджер","Гарантія 5 років"], hot:false, dark:true, color:"#F5C518", emoji:"🏭", tag:"Для бізнесу" },
];

const TESTS = [
  { av:AVS[0], name:"Олена", role:"Приватний будинок", date:"2025", text:"Після встановлення сонячних панелей усе працює стабільно й без збоїв. Я задоволена результатом та якістю роботи вашої команди. Усе пояснили доступно, монтаж виконали акуратно й у визначені терміни. Дякую за професійний підхід і підтримку на всіх етапах!", feat:true },
  { av:AVS[1], name:"Олександр", role:"Приватний будинок", date:"2025", text:"Дуже дякую, все працює добре, усім задоволений." },
  { av:AVS[2], name:"Віталій Косовський", role:"Приватний будинок", date:"2025", text:"Обладнання працює без зауважень. Роботою задоволений." },
  { av:AVS[0], name:"Клієнт", role:"СЕС 30 кВт · Бізнес", date:"Січень 2026", text:"З Новим Роком! Да все чудово працює, задоволений вашою роботою." },
];

const FAQS = [
  { q:"Скільки коштує сонячна станція для дому?", a:"Мережева 5-6 кВт — від 181 000 ₴ (4000-4500 USD за курсом 45.25). 10 кВт — від 317 000 ₴ (7000+ USD). 15 кВт — від 385 000 ₴ (8500 USD). Додатковий акумулятор 16 кВт·год — 95 000 ₴." },
  { q:"Яка окупність сонячної станції?", a:"Для підприємців — від 2 років (з урахуванням економії та зеленого тарифу). Для приватного будинку — 7–10 років. Після окупності 20+ років безкоштовної енергії та пасивного доходу." },
  { q:"Що таке зелений тариф Net-billing?", a:"Продаж надлишкової електроенергії в мережу. Оформляємо під ключ для фізичних та юридичних осіб." },
  { q:"Як отримати кредит 5-7-9% для бізнесу?", a:"Держпрограма: до 5 років, до 150 млн грн. Sun Power допомагає з документами та банками." },
  { q:"Що відбувається під час відключень?", a:"Гібридна система з акумулятором продовжує живити будинок автономно без перебоїв. Перемикання займає менше 20 мс — ви навіть не помітите." },
  { q:"Чи можна замість генератора?", a:"Так! СЕС з акумулятором повністю замінює генератор: тихо, без палива, автоматично. Акумулятор 16 кВт·год забезпечує середній будинок на 8–12 годин." },
  { q:"Чи безпечно в умовах воєнного часу?", a:"Так. Сонячні панелі не є ціллю для ударів — вони не мають стратегічного значення. Це децентралізоване приватне майно. При відключенні мережі система автоматично переходить в острівний режим." },
  { q:"Чи можна отримати кредит для ФОП?", a:"Так. Програма 5-7-9% доступна для ФОП і ТОВ. Допомагаємо з документами, підбором банку та оформленням. До 150 млн грн, до 5 років." },
  { q:"Яка гарантія на монтаж та обладнання?", a:"Монтаж — 5 років. Панелі — 10 років. Інвертори — 5 років. Акумулятори — 5 років." },
];

// SEED_PRODUCTS — вбудований резервний каталог. Використовується, якщо база
// даних (Vercel KV) ще не підключена, або порожня. Адмінка перезаписує
// реальні дані поверх цього — SEED лишається лише фабричним стартом.
const SEED_PRODUCTS = [
  { id:1, cat:"Економ", name:"СЕС Економ 4.2 кВт", price:132600, oldPrice:null, mountUAH:16000, img:null, imgSrc:KIT_IMG, badge:null, rating:4.75, reviews:25, power:"4.2 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"10×Ulica 610Вт + EaSun 4.2кВт SMH-III + EaSun 5кВт·год 48V. Курс $1=44.5₴, ціна орієнтовна.", panelName:"10×Ulica 610Вт", invName:"EaSun 4.2кВт SMH-III", akbName:"EaSun 5кВт·год 48V", kit:["Гібридний інвертор EaSun 4.2кВт SMH-III","Сонячні панелі 10×Ulica 610Вт загальною потужністю 4.2 кВт","Акумуляторна батарея EaSun 5кВт·год 48V","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "610 Вт"], ["ККД", "21.3%"], ["Тип елементів", "Mono PERC"], ["К-сть елементів", "132"], ["Напруга Vmp", "41.8 В"], ["Гарантія", "12/25 років"], ["Розміри", "2278×1134×35 мм"]], "inverter": [["Потужність", "4.2 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "1"], ["ККД", "95%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "5 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"], ["Гарантія", "5 років"]]} },
  { id:2, cat:"Економ", name:"СЕС Економ 6.2 кВт", price:162300, oldPrice:null, mountUAH:21400, img:null, imgSrc:KIT_IMG, badge:null, rating:4.8, reviews:32, power:"6.2 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"14×Ulica 610Вт + EaSun 6.2кВт SMG-III + EaSun 5кВт·год 48V. Курс $1=44.5₴, ціна орієнтовна.", panelName:"14×Ulica 610Вт", invName:"EaSun 6.2кВт SMG-III", akbName:"EaSun 5кВт·год 48V", kit:["Гібридний інвертор EaSun 6.2кВт SMG-III","Сонячні панелі 14×Ulica 610Вт загальною потужністю 6.2 кВт","Акумуляторна батарея EaSun 5кВт·год 48V","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "610 Вт"], ["ККД", "21.3%"], ["Тип елементів", "Mono PERC"], ["К-сть елементів", "132"], ["Напруга Vmp", "41.8 В"], ["Гарантія", "12/25 років"], ["Розміри", "2278×1134×35 мм"]], "inverter": [["Потужність", "6.2 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "1"], ["ККД", "95.5%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "5 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"], ["Гарантія", "5 років"]]} },
  { id:3, cat:"Економ", name:"СЕС Економ 8.5 кВт", price:235400, oldPrice:null, mountUAH:31800, img:null, imgSrc:KIT_IMG, badge:null, rating:4.85, reviews:39, power:"8.5 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"18×Ulica 610Вт + EaSun 8.5кВт SMG-II 48V + EaSun 10кВт·год (2 блоки). Курс $1=44.5₴, ціна орієнтовна.", panelName:"18×Ulica 610Вт", invName:"EaSun 8.5кВт SMG-II 48V", akbName:"EaSun 10кВт·год (2 блоки)", kit:["Гібридний інвертор EaSun 8.5кВт SMG-II 48V","Сонячні панелі 18×Ulica 610Вт загальною потужністю 8.5 кВт","Акумуляторна батарея EaSun 10кВт·год (2 блоки)","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "610 Вт"], ["ККД", "21.3%"], ["Тип елементів", "Mono PERC"], ["К-сть елементів", "132"], ["Напруга Vmp", "41.8 В"], ["Гарантія", "12/25 років"], ["Розміри", "2278×1134×35 мм"]], "inverter": [["Потужність", "8.5 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "96%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "10 кВт·год (2 блоки)"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"], ["Гарантія", "5 років"]]} },
  { id:4, cat:"Економ", name:"СЕС Економ 11 кВт", price:320300, oldPrice:null, mountUAH:64100, img:null, imgSrc:KIT_IMG, badge:null, rating:4.7, reviews:46, power:"11 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"24×Ulica 610Вт + EaSun 11кВт SMG-II 48V + Збірка 16кВт·год 48V. Курс $1=44.5₴, ціна орієнтовна.", panelName:"24×Ulica 610Вт", invName:"EaSun 11кВт SMG-II 48V", akbName:"Збірка 16кВт·год 48V", kit:["Гібридний інвертор EaSun 11кВт SMG-II 48V","Сонячні панелі 24×Ulica 610Вт загальною потужністю 11 кВт","Акумуляторна батарея Збірка 16кВт·год 48V","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "610 Вт"], ["ККД", "21.3%"], ["Тип елементів", "Mono PERC"], ["К-сть елементів", "132"], ["Напруга Vmp", "41.8 В"], ["Гарантія", "12/25 років"], ["Розміри", "2278×1134×35 мм"]], "inverter": [["Потужність", "11 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "96%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "16 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"]]} },
  { id:5, cat:"Стандарт", name:"СЕС Стандарт 5 кВт", price:201300, oldPrice:null, mountUAH:15600, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.75, reviews:53, power:"5 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"8×LONGi 615M + Deye 5K гібрид + Deye SE-F16 16кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"8×LONGi 615M", invName:"Deye 5K гібрид", akbName:"Deye SE-F16 16кВт·год", kit:["Гібридний інвертор Deye 5K гібрид","Сонячні панелі 8×LONGi 615M загальною потужністю 5 кВт","Акумуляторна батарея Deye SE-F16 16кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "615 Вт"], ["ККД", "22.5%"], ["Тип елементів", "HPBC Mono (Hi-MO 6)"], ["К-сть елементів", "132"], ["Напруга Vmp", "43.8 В"], ["Гарантія", "15/30 років"], ["Розміри", "2278×1134×30 мм"]], "inverter": [["Потужність", "5 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "16 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В / 314Ah"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:6, cat:"Стандарт", name:"СЕС Стандарт 8 кВт", price:260300, oldPrice:null, mountUAH:21400, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.8, reviews:60, power:"8 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"14×LONGi 615M + Deye SUN-8K гібрид LV + Deye SE-F16 16кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"14×LONGi 615M", invName:"Deye SUN-8K гібрид LV", akbName:"Deye SE-F16 16кВт·год", kit:["Гібридний інвертор Deye SUN-8K гібрид LV","Сонячні панелі 14×LONGi 615M загальною потужністю 8 кВт","Акумуляторна батарея Deye SE-F16 16кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "615 Вт"], ["ККД", "22.5%"], ["Тип елементів", "HPBC Mono (Hi-MO 6)"], ["К-сть елементів", "132"], ["Напруга Vmp", "43.8 В"], ["Гарантія", "15/30 років"], ["Розміри", "2278×1134×30 мм"]], "inverter": [["Потужність", "8 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "16 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В / 314Ah"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:7, cat:"Стандарт", name:"СЕС Стандарт 10 кВт", price:323700, oldPrice:null, mountUAH:31800, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.85, reviews:67, power:"10 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"18×LONGi 615M + Deye SUN-10K гібрид LV + Deye SE-F16-С 16кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"18×LONGi 615M", invName:"Deye SUN-10K гібрид LV", akbName:"Deye SE-F16-С 16кВт·год", kit:["Гібридний інвертор Deye SUN-10K LV","Сонячні панелі LONGi 615M загальною потужністю 10 кВт (18 шт.)","Акумуляторна батарея Deye SE-F16-С 16 кВт·год","Захисна автоматика","Кабельна продукція","Монтажні кріплення"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за світло","Віддалений моніторинг через мобільний додаток","Можливість масштабування системи","Гарантія на обладнання до 10 років"], specs:{"panel": [["Потужність", "615 Вт"], ["ККД", "22.5%"], ["Тип елементів", "HPBC Mono (Hi-MO 6)"], ["К-сть елементів", "132"], ["Напруга Vmp", "43.8 В"], ["Гарантія", "15/30 років"], ["Розміри", "2278×1134×30 мм"]], "inverter": [["Потужність", "10 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "16 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В / 314Ah"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:8, cat:"Стандарт", name:"СЕС Стандарт 12 кВт", price:285900, oldPrice:null, mountUAH:26700, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.7, reviews:74, power:"12 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"17×LONGi 615M + Deye SUN-12K гібрид + АКБ 10кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"17×LONGi 615M", invName:"Deye SUN-12K гібрид", akbName:"АКБ 10кВт·год", kit:["Гібридний інвертор Deye SUN-12K гібрид","Сонячні панелі 17×LONGi 615M загальною потужністю 12 кВт","Акумуляторна батарея АКБ 10кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "615 Вт"], ["ККД", "22.5%"], ["Тип елементів", "HPBC Mono (Hi-MO 6)"], ["К-сть елементів", "132"], ["Напруга Vmp", "43.8 В"], ["Гарантія", "15/30 років"], ["Розміри", "2278×1134×30 мм"]], "inverter": [["Потужність", "12 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "10 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"]]} },
  { id:9, cat:"Стандарт", name:"СЕС Стандарт 15 кВт", price:337300, oldPrice:null, mountUAH:32000, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.75, reviews:21, power:"15 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"18×LONGi 610M + Deye SUN-15K-SG01LP3 LV + Deye SE-F16-С 16кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"18×LONGi 610M", invName:"Deye SUN-15K-SG01LP3 LV", akbName:"Deye SE-F16-С 16кВт·год", kit:["Мережевий інвертор Deye SUN-15K-SG01LP3 LV","Сонячні панелі 18×LONGi 610M загальною потужністю 15 кВт","Акумуляторна батарея Deye SE-F16-С 16кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "610 Вт"], ["ККД", "22.5%"], ["Тип елементів", "Bifacial Mono"], ["Bifacial gain", "+5–10%"], ["Гарантія", "15/30 років"]], "inverter": [["Потужність", "15 кВт"], ["Фаза", "3"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "16 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В / 314Ah"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:10, cat:"Стандарт", name:"СЕС Стандарт 20 кВт", price:651200, oldPrice:null, mountUAH:53400, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.8, reviews:28, power:"20 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"36×LONGi 645M + Deye SUN-20K HP3 HV + Deye SE-F16-С ×3 48кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"36×LONGi 645M", invName:"Deye SUN-20K HP3 HV", akbName:"Deye SE-F16-С ×3 48кВт·год", kit:["Мережевий інвертор Deye SUN-20K HP3 HV","Сонячні панелі 36×LONGi 645M загальною потужністю 20 кВт","Акумуляторна батарея Deye SE-F16-С ×3 48кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "Bifacial TOPCon (Hi-MO 7)"], ["К-сть елементів", "144"], ["Напруга Vmp", "44.9 В"], ["Гарантія", "15/30 років"], ["Розміри", "2384×1303×35 мм"]], "inverter": [["Потужність", "20 кВт"], ["Фаза", "3"], ["Напруга", "150–850В (HV)"], ["MPPT", "2"], ["ККД", "98.4%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "48 кВт·год (3 модулі)"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:11, cat:"Стандарт", name:"СЕС Стандарт 30 кВт", price:786800, oldPrice:null, mountUAH:80100, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.85, reviews:35, power:"30 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"50×LONGi 645M + Deye SUN-30K HP3 HV + Deye BOS-G PRO ×6 30кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"50×LONGi 645M", invName:"Deye SUN-30K HP3 HV", akbName:"Deye BOS-G PRO ×6 30кВт·год", kit:["Мережевий інвертор Deye SUN-30K HP3 HV","Сонячні панелі 50×LONGi 645M загальною потужністю 30 кВт","Акумуляторна батарея Deye BOS-G PRO ×6 30кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "Bifacial TOPCon (Hi-MO 7)"], ["К-сть елементів", "144"], ["Напруга Vmp", "44.9 В"], ["Гарантія", "15/30 років"], ["Розміри", "2384×1303×35 мм"]], "inverter": [["Потужність", "30 кВт"], ["Фаза", "3"], ["Напруга", "150–850В (HV)"], ["MPPT", "3"], ["ККД", "98.4%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "30 кВт·год (6 модулів)"], ["Хімія", "LiFePO4 HV"], ["Напруга", "High Voltage"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:12, cat:"Еліт", name:"СЕС Еліт 15 кВт", price:354700, oldPrice:null, mountUAH:38300, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.7, reviews:42, power:"15 кВт", warranty:"7 років", brand:"Sun Power UA", desc:"18×Jinko Full Black + Solax X3-NEO-15K-LV + Solax T-BAT-LV D53 ×3. Курс $1=44.5₴, ціна орієнтовна.", panelName:"18×Jinko Full Black", invName:"Solax X3-NEO-15K-LV", akbName:"Solax T-BAT-LV D53 ×3", kit:["Гібридний інвертор Solax X3-NEO-15K-LV","Сонячні панелі 18×Jinko Full Black загальною потужністю 15 кВт","Акумуляторна батарея Solax T-BAT-LV D53 ×3","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "455 Вт"], ["ККД", "21.5%"], ["Тип елементів", "N-Type TOPCon"], ["Дизайн", "Full Black (естетичний)"], ["Гарантія", "15/25 років"]], "inverter": [["Потужність", "15 кВт"], ["Фаза", "3"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.5%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "15.9 кВт·год (3×5.3)"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:13, cat:"Еліт", name:"СЕС Еліт 20 кВт Huawei", price:775200, oldPrice:null, mountUAH:53400, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.75, reviews:49, power:"20 кВт", warranty:"7 років", brand:"Sun Power UA", desc:"36×LONGi Hi-MO 6 Bifacial + Huawei SUN2000-20KTL-M3 + Huawei LUNA2000 ×4 64кВт·год. Преміум-панелі + бренд Huawei. Курс $1=44.5₴, ціна орієнтовна.", panelName:"36×LONGi Hi-MO 6 Bifacial", invName:"Huawei SUN2000-20KTL-M3", akbName:"Huawei LUNA2000 ×4 64кВт·год", kit:["Мережевий інвертор Huawei SUN2000-20KTL-M3","Сонячні панелі 36×LONGi Hi-MO 6 Bifacial загальною потужністю 20 кВт","Акумуляторна батарея Huawei LUNA2000 ×4 64кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "615–645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "HPBC Bifacial (преміум)"], ["Bifacial gain", "+10%"], ["Гарантія", "18/30 років"]], "inverter": [["Потужність", "20 кВт"], ["Фаза", "3"], ["MPPT", "2"], ["ККД", "98.6%"], ["Тип", "Мережевий, преміум"]], "akb": [["Ємність", "64 кВт·год (4 модулі)"], ["Хімія", "LiFePO4"], ["Напруга", "Модульна High Voltage"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:14, cat:"Еліт", name:"СЕС Еліт 30 кВт Huawei (мережева)", price:561700, oldPrice:null, mountUAH:93400, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.8, reviews:56, power:"30 кВт", warranty:"7 років", brand:"Sun Power UA", desc:"50×LONGi 645M + Huawei SUN2000-30KTL-M3 (без АКБ). Курс $1=44.5₴, ціна орієнтовна.", panelName:"50×LONGi 645M", invName:"Huawei SUN2000-30KTL-M3", akbName:"—", kit:["Мережевий інвертор Huawei SUN2000-30KTL-M3","Сонячні панелі 50×LONGi 645M загальною потужністю 30 кВт","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Продаж надлишків електроенергії за Net-billing","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "Bifacial TOPCon (Hi-MO 7)"], ["К-сть елементів", "144"], ["Напруга Vmp", "44.9 В"], ["Гарантія", "15/30 років"], ["Розміри", "2384×1303×35 мм"]], "inverter": [["Потужність", "30 кВт"], ["Фаза", "3"], ["MPPT", "2"], ["ККД", "98.6%"], ["Тип", "Мережевий, преміум"]], "akb": []} },
  { id:15, cat:"Еліт", name:"СЕС Еліт 30 кВт Huawei +АКБ", price:1116100, oldPrice:null, mountUAH:80100, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.85, reviews:63, power:"30 кВт", warranty:"7 років", brand:"Sun Power UA", desc:"50×LONGi Hi-MO 6 Bifacial + Huawei SUN2000-30KTL-M3 + Huawei LUNA2000 ×6 96кВт·год. Преміум-панелі + великий буфер АКБ. Курс $1=44.5₴, ціна орієнтовна.", panelName:"50×LONGi Hi-MO 6 Bifacial", invName:"Huawei SUN2000-30KTL-M3", akbName:"Huawei LUNA2000 ×6 96кВт·год", kit:["Мережевий інвертор Huawei SUN2000-30KTL-M3","Сонячні панелі 50×LONGi Hi-MO 6 Bifacial загальною потужністю 30 кВт","Акумуляторна батарея Huawei LUNA2000 ×6 96кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "615–645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "HPBC Bifacial (преміум)"], ["Bifacial gain", "+10%"], ["Гарантія", "18/30 років"]], "inverter": [["Потужність", "30 кВт"], ["Фаза", "3"], ["MPPT", "2"], ["ККД", "98.6%"], ["Тип", "Мережевий, преміум"]], "akb": [["Ємність", "96 кВт·год (6 модулів)"], ["Хімія", "LiFePO4"], ["Напруга", "Модульна High Voltage"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:16, cat:"Еліт", name:"СЕС Еліт 45 кВт", price:1151200, oldPrice:null, mountUAH:115700, img:null, imgSrc:KIT_IMG, badge:"new", rating:4.7, reviews:70, power:"45 кВт", warranty:"7 років", brand:"Sun Power UA", desc:"72×LONGi 645M + Deye SUN-30K ×2 + Deye SE-F16-С ×3 48кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"72×LONGi 645M", invName:"Deye SUN-30K ×2", akbName:"Deye SE-F16-С ×3 48кВт·год", kit:["Мережевий інвертор Deye SUN-30K ×2","Сонячні панелі 72×LONGi 645M загальною потужністю 45 кВт","Акумуляторна батарея Deye SE-F16-С ×3 48кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "Bifacial TOPCon (Hi-MO 7)"], ["К-сть елементів", "144"], ["Напруга Vmp", "44.9 В"], ["Гарантія", "15/30 років"], ["Розміри", "2384×1303×35 мм"]], "inverter": [], "akb": [["Ємність", "48 кВт·год (3 модулі)"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:17, cat:"Self-Made", name:"Self-Made 5 кВт Старт", price:107700, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.75, reviews:77, power:"5 кВт", warranty:"10 років (обладн.)", brand:"Sun Power UA", desc:"10×LONGi 615M + Deye SUN-5K гібрид (без АКБ). Курс $1=44.5₴, ціна орієнтовна.", panelName:"10×LONGi 615M", invName:"Deye SUN-5K гібрид", akbName:"—", kit:["Гібридний інвертор Deye SUN-5K гібрид","Сонячні панелі 10×LONGi 615M загальною потужністю 5 кВт","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Продаж надлишків електроенергії за Net-billing","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "615 Вт"], ["ККД", "22.5%"], ["Тип елементів", "HPBC Mono (Hi-MO 6)"], ["К-сть елементів", "132"], ["Напруга Vmp", "43.8 В"], ["Гарантія", "15/30 років"], ["Розміри", "2278×1134×30 мм"]], "inverter": [], "akb": []} },
  { id:18, cat:"Self-Made", name:"Self-Made 5 кВт +АКБ", price:185700, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.8, reviews:24, power:"5 кВт", warranty:"10 років (обладн.)", brand:"Sun Power UA", desc:"8×LONGi 615M + Deye гібрид 5K + Deye SE-F16 16кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"8×LONGi 615M", invName:"Deye гібрид 5K", akbName:"Deye SE-F16 16кВт·год", kit:["Гібридний інвертор Deye гібрид 5K","Сонячні панелі 8×LONGi 615M загальною потужністю 5 кВт","Акумуляторна батарея Deye SE-F16 16кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "615 Вт"], ["ККД", "22.5%"], ["Тип елементів", "HPBC Mono (Hi-MO 6)"], ["К-сть елементів", "132"], ["Напруга Vmp", "43.8 В"], ["Гарантія", "15/30 років"], ["Розміри", "2278×1134×30 мм"]], "inverter": [], "akb": [["Ємність", "16 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В / 314Ah"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:19, cat:"Self-Made", name:"Self-Made 8 кВт +АКБ", price:239000, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.85, reviews:31, power:"8 кВт", warranty:"10 років (обладн.)", brand:"Sun Power UA", desc:"14×LONGi 615M + Deye SUN-8K гібрид + Deye SE-F16-С 16кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"14×LONGi 615M", invName:"Deye SUN-8K гібрид", akbName:"Deye SE-F16-С 16кВт·год", kit:["Гібридний інвертор Deye SUN-8K гібрид","Сонячні панелі 14×LONGi 615M загальною потужністю 8 кВт","Акумуляторна батарея Deye SE-F16-С 16кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "615 Вт"], ["ККД", "22.5%"], ["Тип елементів", "HPBC Mono (Hi-MO 6)"], ["К-сть елементів", "132"], ["Напруга Vmp", "43.8 В"], ["Гарантія", "15/30 років"], ["Розміри", "2278×1134×30 мм"]], "inverter": [["Потужність", "8 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "16 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В / 314Ah"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:20, cat:"Self-Made", name:"Self-Made 10 кВт +АКБ", price:291900, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.7, reviews:38, power:"10 кВт", warranty:"10 років (обладн.)", brand:"Sun Power UA", desc:"18×LONGi 615M + Deye SUN-10K гібрид + Deye SE-F16-С 16кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"18×LONGi 615M", invName:"Deye SUN-10K гібрид", akbName:"Deye SE-F16-С 16кВт·год", kit:["Гібридний інвертор Deye SUN-10K гібрид","Сонячні панелі 18×LONGi 615M загальною потужністю 10 кВт","Акумуляторна батарея Deye SE-F16-С 16кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "615 Вт"], ["ККД", "22.5%"], ["Тип елементів", "HPBC Mono (Hi-MO 6)"], ["К-сть елементів", "132"], ["Напруга Vmp", "43.8 В"], ["Гарантія", "15/30 років"], ["Розміри", "2278×1134×30 мм"]], "inverter": [["Потужність", "10 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "16 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В / 314Ah"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:21, cat:"Self-Made", name:"Self-Made 15 кВт +АКБ", price:339100, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.75, reviews:45, power:"15 кВт", warranty:"10 років (обладн.)", brand:"Sun Power UA", desc:"24×LONGi 645M + Deye SUN-15K гібрид + Deye SE-F16-С 16кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"24×LONGi 645M", invName:"Deye SUN-15K гібрид", akbName:"Deye SE-F16-С 16кВт·год", kit:["Гібридний інвертор Deye SUN-15K гібрид","Сонячні панелі 24×LONGi 645M загальною потужністю 15 кВт","Акумуляторна батарея Deye SE-F16-С 16кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання"], specs:{"panel": [["Потужність", "645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "Bifacial TOPCon (Hi-MO 7)"], ["К-сть елементів", "144"], ["Напруга Vmp", "44.9 В"], ["Гарантія", "15/30 років"], ["Розміри", "2384×1303×35 мм"]], "inverter": [["Потужність", "15 кВт"], ["Фаза", "3"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "16 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В / 314Ah"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:22, cat:"Бізнес", name:"СЕС Бізнес 30 кВт Гібридна", price:786800, oldPrice:null, mountUAH:80100, img:null, imgSrc:KIT_IMG, badge:null, rating:4.8, reviews:52, power:"30 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"50×LONGi 645M + Deye SUN-30K HP3 HV + Deye BOS-G PRO ×6 30кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"50×LONGi 645M", invName:"Deye SUN-30K HP3 HV", akbName:"Deye BOS-G PRO ×6 30кВт·год", kit:["Мережевий інвертор Deye SUN-30K HP3 HV","Сонячні панелі 50×LONGi 645M загальною потужністю 30 кВт","Акумуляторна батарея Deye BOS-G PRO ×6 30кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання","Кредитування для бізнесу 5-7-9% від держави","Можливість оформлення Net-billing та продажу електроенергії"], specs:{"panel": [["Потужність", "645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "Bifacial TOPCon (Hi-MO 7)"], ["К-сть елементів", "144"], ["Напруга Vmp", "44.9 В"], ["Гарантія", "15/30 років"], ["Розміри", "2384×1303×35 мм"]], "inverter": [["Потужність", "30 кВт"], ["Фаза", "3"], ["Напруга", "150–850В (HV)"], ["MPPT", "3"], ["ККД", "98.4%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "30 кВт·год (6 модулів)"], ["Хімія", "LiFePO4 HV"], ["Напруга", "High Voltage"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:23, cat:"Бізнес", name:"СЕС Бізнес 30 кВт Мережева (бюджет)", price:464300, oldPrice:null, mountUAH:80100, img:null, imgSrc:KIT_IMG, badge:null, rating:4.85, reviews:59, power:"30 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"50×LONGi 645M + Deye SUN-30K мережевий (без АКБ). Курс $1=44.5₴, ціна орієнтовна.", panelName:"50×LONGi 645M", invName:"Deye SUN-30K мережевий", akbName:"—", kit:["Мережевий інвертор Deye SUN-30K мережевий","Сонячні панелі 50×LONGi 645M загальною потужністю 30 кВт","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Продаж надлишків електроенергії за Net-billing","Офіційна гарантія на обладнання","Кредитування для бізнесу 5-7-9% від держави","Можливість оформлення Net-billing та продажу електроенергії"], specs:{"panel": [["Потужність", "645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "Bifacial TOPCon (Hi-MO 7)"], ["К-сть елементів", "144"], ["Напруга Vmp", "44.9 В"], ["Гарантія", "15/30 років"], ["Розміри", "2384×1303×35 мм"]], "inverter": [["Потужність", "30 кВт"], ["Фаза", "3"], ["MPPT", "2"], ["ККД", "98.2%"], ["Тип", "Мережевий (on-grid)"]], "akb": []} },
  { id:24, cat:"Бізнес", name:"СЕС Бізнес 50 кВт Гібридна", price:1388400, oldPrice:null, mountUAH:133500, img:null, imgSrc:KIT_IMG, badge:null, rating:4.7, reviews:66, power:"50 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"80×LONGi 645M + Deye SUN-50K HP3 HV + Deye SE-F16-С ×6 96кВт·год. Курс $1=44.5₴, ціна орієнтовна.", panelName:"80×LONGi 645M", invName:"Deye SUN-50K HP3 HV", akbName:"Deye SE-F16-С ×6 96кВт·год", kit:["Мережевий інвертор Deye SUN-50K HP3 HV","Сонячні панелі 80×LONGi 645M загальною потужністю 50 кВт","Акумуляторна батарея Deye SE-F16-С ×6 96кВт·год","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Резервне живлення будинку при відключенні мережі","Офіційна гарантія на обладнання","Кредитування для бізнесу 5-7-9% від держави","Можливість оформлення Net-billing та продажу електроенергії"], specs:{"panel": [["Потужність", "645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "Bifacial TOPCon (Hi-MO 7)"], ["К-сть елементів", "144"], ["Напруга Vmp", "44.9 В"], ["Гарантія", "15/30 років"], ["Розміри", "2384×1303×35 мм"]], "inverter": [["Потужність", "50 кВт"], ["Фаза", "3"], ["Напруга", "150–850В (HV)"], ["MPPT", "3"], ["ККД", "98.4%"], ["Тип", "Гібридний"]], "akb": [["Ємність", "96 кВт·год (6 модулів)"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:25, cat:"Бізнес", name:"СЕС Бізнес 50 кВт Мережева (бюджет)", price:809900, oldPrice:null, mountUAH:133500, img:null, imgSrc:KIT_IMG, badge:null, rating:4.75, reviews:73, power:"50 кВт", warranty:"5 років", brand:"Sun Power UA", desc:"80×LONGi 645M + Deye SUN-50K-G01 (без АКБ). Курс $1=44.5₴, ціна орієнтовна.", panelName:"80×LONGi 645M", invName:"Deye SUN-50K-G01", akbName:"—", kit:["Мережевий інвертор Deye SUN-50K-G01","Сонячні панелі 80×LONGi 645M загальною потужністю 50 кВт","Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Продаж надлишків електроенергії за Net-billing","Офіційна гарантія на обладнання","Кредитування для бізнесу 5-7-9% від держави","Можливість оформлення Net-billing та продажу електроенергії"], specs:{"panel": [["Потужність", "645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "Bifacial TOPCon (Hi-MO 7)"], ["К-сть елементів", "144"], ["Напруга Vmp", "44.9 В"], ["Гарантія", "15/30 років"], ["Розміри", "2384×1303×35 мм"]], "inverter": [["Потужність", "50 кВт"], ["Фаза", "3"], ["MPPT", "3"], ["ККД", "98.6%"], ["Тип", "Мережевий (on-grid)"]], "akb": []} },
  { id:27, cat:"Панелі", name:"LONGi LR7-72HTH-615M 615Вт", price:4900, oldPrice:null, mountUAH:0, img:"1724041875334-0a6397111c7e", imgSrc:null, badge:null, rating:4.72, reviews:47, power:"615 Вт", warranty:"10 років", brand:"Sun Power UA", desc:"Топова панель HPBC. Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"LONGi 615M", invName:"—", akbName:"—", kit:["1 сонячна панель (ціна за штуку)","Паспорт та сертифікат якості","Монтажна інструкція"], advantages:["Висока ефективність перетворення сонячної енергії","Тривалий термін служби (25–30 років)","Гарантія на потужність та продуктивність","Стійкість до вітрового та снігового навантаження","Сумісна з більшістю гібридних та мережевих інверторів"], specs:{"panel": [["Потужність", "615 Вт"], ["ККД", "22.5%"], ["Тип елементів", "HPBC Mono (Hi-MO 6)"], ["К-сть елементів", "132"], ["Напруга Vmp", "43.8 В"], ["Гарантія", "15/30 років"], ["Розміри", "2278×1134×30 мм"]], "inverter": [], "akb": []} },
  { id:28, cat:"Панелі", name:"LONGi LR7-72HVH-645M 645Вт", price:4900, oldPrice:null, mountUAH:0, img:"1724041875334-0a6397111c7e", imgSrc:null, badge:null, rating:4.78, reviews:52, power:"645 Вт", warranty:"10 років", brand:"Sun Power UA", desc:"Bifacial TOPCon, преміум серія. Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"LONGi 645M", invName:"—", akbName:"—", kit:["1 сонячна панель (ціна за штуку)","Паспорт та сертифікат якості","Монтажна інструкція"], advantages:["Висока ефективність перетворення сонячної енергії","Тривалий термін служби (25–30 років)","Гарантія на потужність та продуктивність","Стійкість до вітрового та снігового навантаження","Сумісна з більшістю гібридних та мережевих інверторів"], specs:{"panel": [["Потужність", "645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "Bifacial TOPCon (Hi-MO 7)"], ["К-сть елементів", "144"], ["Напруга Vmp", "44.9 В"], ["Гарантія", "15/30 років"], ["Розміри", "2384×1303×35 мм"]], "inverter": [], "akb": []} },
  { id:29, cat:"Панелі", name:"Ulica UL-610M132DDGN 610Вт", price:4500, oldPrice:null, mountUAH:0, img:"1724041875334-0a6397111c7e", imgSrc:null, badge:null, rating:4.84, reviews:57, power:"610 Вт", warranty:"10 років", brand:"Sun Power UA", desc:"Бюджетна якісна панель. Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"Ulica 610", invName:"—", akbName:"—", kit:["1 сонячна панель (ціна за штуку)","Паспорт та сертифікат якості","Монтажна інструкція"], advantages:["Висока ефективність перетворення сонячної енергії","Тривалий термін служби (25–30 років)","Гарантія на потужність та продуктивність","Стійкість до вітрового та снігового навантаження","Сумісна з більшістю гібридних та мережевих інверторів"], specs:{"panel": [["Потужність", "610 Вт"], ["ККД", "21.3%"], ["Тип елементів", "Mono PERC"], ["К-сть елементів", "132"], ["Напруга Vmp", "41.8 В"], ["Гарантія", "12/25 років"], ["Розміри", "2278×1134×35 мм"]], "inverter": [], "akb": []} },
  { id:30, cat:"Панелі", name:"Jinko 455W Full Black N-Type", price:4000, oldPrice:null, mountUAH:0, img:"1724041875334-0a6397111c7e", imgSrc:null, badge:null, rating:4.6, reviews:12, power:"455 Вт", warranty:"10 років", brand:"Sun Power UA", desc:"Естетичний чорний дизайн. Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"Jinko Full Black", invName:"—", akbName:"—", kit:["1 сонячна панель (ціна за штуку)","Паспорт та сертифікат якості","Монтажна інструкція"], advantages:["Висока ефективність перетворення сонячної енергії","Тривалий термін служби (25–30 років)","Гарантія на потужність та продуктивність","Стійкість до вітрового та снігового навантаження","Сумісна з більшістю гібридних та мережевих інверторів"], specs:{"panel": [["Потужність", "455 Вт"], ["ККД", "21.5%"], ["Тип елементів", "N-Type TOPCon"], ["Дизайн", "Full Black (естетичний)"], ["Гарантія", "15/25 років"]], "inverter": [], "akb": []} },
  { id:31, cat:"Панелі", name:"LONGi Hi-MO 6 Bifacial (преміум)", price:5600, oldPrice:null, mountUAH:0, img:"1724041875334-0a6397111c7e", imgSrc:null, badge:null, rating:4.66, reviews:17, power:"615-645 Вт", warranty:"10 років", brand:"Sun Power UA", desc:"Преміум bifacial, +10% генерації. Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"LONGi Hi-MO 6 Bifacial", invName:"—", akbName:"—", kit:["1 сонячна панель (ціна за штуку)","Паспорт та сертифікат якості","Монтажна інструкція"], advantages:["Висока ефективність перетворення сонячної енергії","Тривалий термін служби (25–30 років)","Гарантія на потужність та продуктивність","Стійкість до вітрового та снігового навантаження","Сумісна з більшістю гібридних та мережевих інверторів"], specs:{"panel": [["Потужність", "615–645 Вт"], ["ККД", "22.8%"], ["Тип елементів", "HPBC Bifacial (преміум)"], ["Bifacial gain", "+10%"], ["Гарантія", "18/30 років"]], "inverter": [], "akb": []} },
  { id:32, cat:"Інвертори", name:"Deye SUN-5K гібрид", price:35600, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.72, reviews:22, power:"5 кВт", warranty:"10 років", brand:"Sun Power UA", desc:"Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"Deye 5K гібрид", akbName:"—", kit:["Інвертор Deye 5K гібрид","Кабель підключення","Монтажний кронштейн","Технічна документація та гарантійний талон"], advantages:["Висока ефективність перетворення до 98.6%","Вбудований моніторинг через мобільний додаток","Захист від перевантаження та короткого замикання","Підтримка мережевого та автономного режиму роботи","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [["Потужність", "5 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": []} },
  { id:33, cat:"Інвертори", name:"Deye SUN-8K гібрид LV", price:53400, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.78, reviews:27, power:"8 кВт", warranty:"10 років", brand:"Sun Power UA", desc:"Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"Deye SUN-8K", akbName:"—", kit:["Інвертор Deye SUN-8K","Кабель підключення","Монтажний кронштейн","Технічна документація та гарантійний талон"], advantages:["Висока ефективність перетворення до 98.6%","Вбудований моніторинг через мобільний додаток","Захист від перевантаження та короткого замикання","Підтримка мережевого та автономного режиму роботи","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [["Потужність", "8 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": []} },
  { id:34, cat:"Інвертори", name:"Deye SUN-10K гібрид LV", price:80100, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.84, reviews:32, power:"10 кВт", warranty:"10 років", brand:"Sun Power UA", desc:"Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"Deye SUN-10K", akbName:"—", kit:["Інвертор Deye SUN-10K","Кабель підключення","Монтажний кронштейн","Технічна документація та гарантійний талон"], advantages:["Висока ефективність перетворення до 98.6%","Вбудований моніторинг через мобільний додаток","Захист від перевантаження та короткого замикання","Підтримка мережевого та автономного режиму роботи","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [["Потужність", "10 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": []} },
  { id:35, cat:"Інвертори", name:"Deye SUN-15K-SG01LP3 LV", price:93400, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.6, reviews:37, power:"15 кВт", warranty:"10 років", brand:"Sun Power UA", desc:"Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"Deye SUN-15K", akbName:"—", kit:["Інвертор Deye SUN-15K","Кабель підключення","Монтажний кронштейн","Технічна документація та гарантійний талон"], advantages:["Висока ефективність перетворення до 98.6%","Вбудований моніторинг через мобільний додаток","Захист від перевантаження та короткого замикання","Підтримка мережевого та автономного режиму роботи","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [["Потужність", "15 кВт"], ["Фаза", "3"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "97.6%"], ["Тип", "Гібридний"]], "akb": []} },
  { id:36, cat:"Інвертори", name:"Deye SUN-20K HP3 HV", price:89200, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.66, reviews:42, power:"20 кВт", warranty:"10 років", brand:"Sun Power UA", desc:"Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"Deye SUN-20K HP3 HV", akbName:"—", kit:["Інвертор Deye SUN-20K HP3 HV","Кабель підключення","Монтажний кронштейн","Технічна документація та гарантійний талон"], advantages:["Висока ефективність перетворення до 98.6%","Вбудований моніторинг через мобільний додаток","Захист від перевантаження та короткого замикання","Підтримка мережевого та автономного режиму роботи","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [["Потужність", "20 кВт"], ["Фаза", "3"], ["Напруга", "150–850В (HV)"], ["MPPT", "2"], ["ККД", "98.4%"], ["Тип", "Гібридний"]], "akb": []} },
  { id:37, cat:"Інвертори", name:"Deye SUN-30K HP3 HV", price:133500, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.72, reviews:47, power:"30 кВт", warranty:"10 років", brand:"Sun Power UA", desc:"Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"Deye SUN-30K HP3 HV", akbName:"—", kit:["Інвертор Deye SUN-30K HP3 HV","Кабель підключення","Монтажний кронштейн","Технічна документація та гарантійний талон"], advantages:["Висока ефективність перетворення до 98.6%","Вбудований моніторинг через мобільний додаток","Захист від перевантаження та короткого замикання","Підтримка мережевого та автономного режиму роботи","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [["Потужність", "30 кВт"], ["Фаза", "3"], ["Напруга", "150–850В (HV)"], ["MPPT", "3"], ["ККД", "98.4%"], ["Тип", "Гібридний"]], "akb": []} },
  { id:38, cat:"Інвертори", name:"Huawei SUN2000-30KTL-M3", price:109000, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.78, reviews:52, power:"30 кВт", warranty:"10 років", brand:"Sun Power UA", desc:"Преміум бренд, мережевий. Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"Huawei SUN2000-30KTL", akbName:"—", kit:["Інвертор Huawei SUN2000-30KTL","Кабель підключення","Монтажний кронштейн","Технічна документація та гарантійний талон"], advantages:["Висока ефективність перетворення до 98.6%","Вбудований моніторинг через мобільний додаток","Захист від перевантаження та короткого замикання","Підтримка мережевого та автономного режиму роботи","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [["Потужність", "30 кВт"], ["Фаза", "3"], ["MPPT", "2"], ["ККД", "98.6%"], ["Тип", "Мережевий, преміум"]], "akb": []} },
  { id:39, cat:"Інвертори", name:"EaSun 8.5кВт SMG-II 48V", price:28900, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.84, reviews:57, power:"8.5 кВт", warranty:"10 років", brand:"Sun Power UA", desc:"Бюджетний варіант. Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"EaSun 8.5кВт", akbName:"—", kit:["Інвертор EaSun 8.5кВт","Кабель підключення","Монтажний кронштейн","Технічна документація та гарантійний талон"], advantages:["Висока ефективність перетворення до 98.6%","Вбудований моніторинг через мобільний додаток","Захист від перевантаження та короткого замикання","Підтримка мережевого та автономного режиму роботи","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [["Потужність", "8.5 кВт"], ["Фаза", "1"], ["Напруга", "48В (LV)"], ["MPPT", "2"], ["ККД", "96%"], ["Тип", "Гібридний"]], "akb": []} },
  { id:40, cat:"Акумулятори", name:"Deye SE-F16 16кВт·год", price:91200, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.6, reviews:12, power:"16 кВт·год", warranty:"10 років", brand:"Sun Power UA", desc:"Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"Deye SE-F16", kit:["Модуль акумуляторної батареї Deye SE-F16","BMS система управління зарядом","Комунікаційний кабель","Монтажний комплект та документація"], advantages:["Технологія LiFePO4 — найбезпечніша хімія літієвих батарей","6000+ циклів заряду/розряду (≈15–20 років служби)","Захист від перегріву, перезарядки та глибокого розряду","Можливість каскадного розширення ємності","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [["Ємність", "16 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В / 314Ah"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:41, cat:"Акумулятори", name:"Deye BOS-G PRO 5кВт·год (модуль)", price:37800, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.66, reviews:17, power:"5 кВт·год", warranty:"10 років", brand:"Sun Power UA", desc:"High Voltage модуль для каскадування. Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"Deye BOS-G PRO", kit:["Модуль акумуляторної батареї Deye BOS-G PRO","BMS система управління зарядом","Комунікаційний кабель","Монтажний комплект та документація"], advantages:["Технологія LiFePO4 — найбезпечніша хімія літієвих батарей","6000+ циклів заряду/розряду (≈15–20 років служби)","Захист від перегріву, перезарядки та глибокого розряду","Можливість каскадного розширення ємності","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [["Ємність", "5 кВт·год (модуль)"], ["Хімія", "LiFePO4 HV"], ["Напруга", "High Voltage"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:42, cat:"Акумулятори", name:"EaSun 5кВт·год 48V", price:35600, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.72, reviews:22, power:"5 кВт·год", warranty:"10 років", brand:"Sun Power UA", desc:"Бюджетний варіант. Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"EaSun 5кВт·год", kit:["Модуль акумуляторної батареї EaSun 5кВт·год","BMS система управління зарядом","Комунікаційний кабель","Монтажний комплект та документація"], advantages:["Технологія LiFePO4 — найбезпечніша хімія літієвих батарей","6000+ циклів заряду/розряду (≈15–20 років служби)","Захист від перегріву, перезарядки та глибокого розряду","Можливість каскадного розширення ємності","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [["Ємність", "5 кВт·год"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"], ["Гарантія", "5 років"]]} },
  { id:43, cat:"Акумулятори", name:"Solax T-BAT-LV D53 5.3кВт·год", price:37800, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.78, reviews:27, power:"5.3 кВт·год", warranty:"10 років", brand:"Sun Power UA", desc:"Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"Solax T-BAT-LV D53", kit:["Модуль акумуляторної батареї Solax T-BAT-LV D53","BMS система управління зарядом","Комунікаційний кабель","Монтажний комплект та документація"], advantages:["Технологія LiFePO4 — найбезпечніша хімія літієвих батарей","6000+ циклів заряду/розряду (≈15–20 років служби)","Захист від перегріву, перезарядки та глибокого розряду","Можливість каскадного розширення ємності","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [["Ємність", "5.3 кВт·год (модуль)"], ["Хімія", "LiFePO4"], ["Напруга", "51.2В"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:44, cat:"Акумулятори", name:"Huawei LUNA2000 16кВт·год (модуль)", price:91200, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.84, reviews:32, power:"16 кВт·год", warranty:"10 років", brand:"Sun Power UA", desc:"Преміум модульна система. Окремий компонент. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"Huawei LUNA2000", kit:["Модуль акумуляторної батареї Huawei LUNA2000","BMS система управління зарядом","Комунікаційний кабель","Монтажний комплект та документація"], advantages:["Технологія LiFePO4 — найбезпечніша хімія літієвих батарей","6000+ циклів заряду/розряду (≈15–20 років служби)","Захист від перегріву, перезарядки та глибокого розряду","Можливість каскадного розширення ємності","Офіційна гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [["Ємність", "16 кВт·год (модуль)"], ["Хімія", "LiFePO4"], ["Напруга", "Модульна High Voltage"], ["Циклів заряду", "6000+"], ["Гарантія", "10 років"]]} },
  { id:46, cat:"Монтаж", name:"Монтажний профіль (рейка) 2.1м", price:400, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.65, reviews:32, power:"шт", warranty:"10 років", brand:"Sun Power UA", desc:"Несуча рейка для кріплення панелей. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"—", kit:["Несуча рейка для кріплення панелей","Кріпильні елементи та болти","Інструкція з монтажу"], advantages:["Виготовлено з анодованого алюмінію або нержавіючої сталі — не іржавіє","Витримує навантаження вітру та снігу","Сумісне з більшістю типів дахів","Просте та швидке встановлення","Гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [], "mount": [["Довжина", "2.1 м"], ["Матеріал", "Анодований алюміній"], ["Навантаження", "до 5.4 кН/м²"], ["Сумісність", "Скатний/плоский дах"]]} },
  { id:47, cat:"Монтаж", name:"Монтажний профіль (рейка) 4.2м", price:800, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.7, reviews:36, power:"шт", warranty:"10 років", brand:"Sun Power UA", desc:"Подовжена несуча рейка для великих масивів. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"—", kit:["Подовжена несуча рейка для великих масивів","Кріпильні елементи та болти","Інструкція з монтажу"], advantages:["Виготовлено з анодованого алюмінію або нержавіючої сталі — не іржавіє","Витримує навантаження вітру та снігу","Сумісне з більшістю типів дахів","Просте та швидке встановлення","Гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [], "mount": [["Довжина", "4.2 м"], ["Матеріал", "Анодований алюміній"], ["Навантаження", "до 5.4 кН/м²"], ["Сумісність", "Скатний/плоский дах"]]} },
  { id:48, cat:"Монтаж", name:"Притискач міжпанельний (mid clamp)", price:100, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.75, reviews:40, power:"шт", warranty:"10 років", brand:"Sun Power UA", desc:"Кріпить дві сусідні панелі до рейки. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"—", kit:["Кріпить дві сусідні панелі до рейки","Кріпильні елементи та болти","Інструкція з монтажу"], advantages:["Виготовлено з анодованого алюмінію або нержавіючої сталі — не іржавіє","Витримує навантаження вітру та снігу","Сумісне з більшістю типів дахів","Просте та швидке встановлення","Гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [], "mount": [["Тип", "Міжпанельний (mid clamp)"], ["Матеріал", "Алюміній + нерж. сталь"], ["Товщина панелі", "30-40 мм"], ["Колір", "Чорний/сріблястий"]]} },
  { id:49, cat:"Монтаж", name:"Притискач боковий (end clamp)", price:100, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.8, reviews:44, power:"шт", warranty:"10 років", brand:"Sun Power UA", desc:"Фіксує крайню панель ряду. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"—", kit:["Фіксує крайню панель ряду","Кріпильні елементи та болти","Інструкція з монтажу"], advantages:["Виготовлено з анодованого алюмінію або нержавіючої сталі — не іржавіє","Витримує навантаження вітру та снігу","Сумісне з більшістю типів дахів","Просте та швидке встановлення","Гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [], "mount": [["Тип", "Кінцевий/боковий (end clamp)"], ["Матеріал", "Алюміній + нерж. сталь"], ["Товщина панелі", "30-40 мм"], ["Колір", "Чорний/сріблястий"]]} },
  { id:50, cat:"Монтаж", name:"Дахове кріплення-гак (анкер)", price:200, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.6, reviews:8, power:"шт", warranty:"10 років", brand:"Sun Power UA", desc:"Анкерне кріплення рейки до крокв даху. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"—", kit:["Анкерне кріплення рейки до крокв даху","Кріпильні елементи та болти","Інструкція з монтажу"], advantages:["Виготовлено з анодованого алюмінію або нержавіючої сталі — не іржавіє","Витримує навантаження вітру та снігу","Сумісне з більшістю типів дахів","Просте та швидке встановлення","Гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [], "mount": [["Тип", "Гак під металочерепицю"], ["Матеріал", "Нержавіюча сталь"], ["Навантаження", "до 150 кг"], ["Регулювання висоти", "Так"]]} },
  { id:51, cat:"Монтаж", name:"Заземлюючий затискач (grounding clip)", price:0, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.65, reviews:12, power:"шт", warranty:"10 років", brand:"Sun Power UA", desc:"Електричне з'єднання рам панелей для заземлення. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"—", kit:["Електричне з'єднання рам панелей для заземлення","Кріпильні елементи та болти","Інструкція з монтажу"], advantages:["Виготовлено з анодованого алюмінію або нержавіючої сталі — не іржавіє","Витримує навантаження вітру та снігу","Сумісне з більшістю типів дахів","Просте та швидке встановлення","Гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [], "mount": [["Тип", "Заземлюючий затискач"], ["Матеріал", "Нержавіюча сталь"], ["Переріз кабелю", "до 6 мм²"], ["Призначення", "Заземлення рам панелей"]]} },
  { id:52, cat:"Монтаж", name:"Комплект кріплень на 10 панелей", price:11100, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.7, reviews:16, power:"комплект", warranty:"10 років", brand:"Sun Power UA", desc:"Повний набір для монтажу 10 панелей під ключ. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"—", kit:["Повний набір для монтажу 10 панелей під ключ","Кріпильні елементи та болти","Інструкція з монтажу"], advantages:["Виготовлено з анодованого алюмінію або нержавіючої сталі — не іржавіє","Витримує навантаження вітру та снігу","Сумісне з більшістю типів дахів","Просте та швидке встановлення","Гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [], "mount": [["Кількість панелей", "10"], ["До складу входить", "Рейки + притискачі + гаки + заземлення"], ["Матеріал", "Алюміній/нерж. сталь"]]} },
  { id:53, cat:"Монтаж", name:"Комплект кріплень на 20 панелей", price:22200, oldPrice:null, mountUAH:0, img:null, imgSrc:KIT_IMG, badge:null, rating:4.75, reviews:20, power:"комплект", warranty:"10 років", brand:"Sun Power UA", desc:"Повний набір для монтажу 20 панелей під ключ. Курс $1=44.5₴, ціна орієнтовна.", panelName:"—", invName:"—", akbName:"—", kit:["Повний набір для монтажу 20 панелей під ключ","Кріпильні елементи та болти","Інструкція з монтажу"], advantages:["Виготовлено з анодованого алюмінію або нержавіючої сталі — не іржавіє","Витримує навантаження вітру та снігу","Сумісне з більшістю типів дахів","Просте та швидке встановлення","Гарантія 10 років"], specs:{"panel": [], "inverter": [], "akb": [], "mount": [["Кількість панелей", "20"], ["До складу входить", "Рейки + притискачі + гаки + заземлення"], ["Матеріал", "Алюміній/нерж. сталь"]]} },
  { id:45, cat:"Бізнес", name:"СЕС Бізнес 100+ кВт", price:0, oldPrice:null, img:null, imgSrc:KIT_IMG, badge:null, rating:5.0, reviews:6, power:"100+ кВт", warranty:"5 років", brand:"Sun Power UA", desc:"Індивідуальний проєкт під ваш об'єкт — точна ціна після виїзного огляду.", panelName:"За проєктом", invName:"За проєктом", akbName:"За проєктом", kit:["Захисна автоматика (автоматичні вимикачі, ПЗВ)","Сонячний кабель та MC4-конектори","Монтажні кріплення та профілі"], advantages:["Незалежність від відключень електроенергії","Економія на рахунках за електроенергію","Віддалений моніторинг стану системи через мобільний додаток","Можливість подальшого масштабування системи","Продаж надлишків електроенергії за Net-billing","Офіційна гарантія на обладнання","Кредитування для бізнесу 5-7-9% від держави","Можливість оформлення Net-billing та продажу електроенергії"], specs:{"panel":[],"inverter":[],"akb":[]}, custom:true },
];
const SHOP_CATS = ["Всі","Економ","Стандарт","Еліт","Self-Made","Бізнес","Панелі","Інвертори","Акумулятори","Монтаж"];

/* ══ HELPERS ══ */
function Counter({ target, suf }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const t0 = performance.now(), D = 2000;
        const ease = t => t===1?1:1-Math.pow(2,-10*t);
        const tick = now => { const p=Math.min((now-t0)/D,1); setVal(Math.round(ease(p)*target)); if(p<1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString()}{suf}</span>;
}
/* ══ LOGO SVG COMPONENT ══ */
function Logo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#1E6B2E"/>
      <polygon points="50,8 88,28 88,68 50,88 12,68 12,28" fill="none" stroke="#22C55E" strokeWidth="3"/>
      <path d="M35 45 Q35 30 50 28 Q65 30 65 45 Q65 55 58 60 L55 75 L45 75 L42 60 Q35 55 35 45Z" fill="#22C55E" opacity="0.3"/>
      <path d="M38 45 Q38 33 50 31 Q62 33 62 45 Q62 54 56 58 L53 72 L47 72 L44 58 Q38 54 38 45Z" fill="none" stroke="#22C55E" strokeWidth="2"/>
      <circle cx="50" cy="44" r="8" fill="#F5C518"/>
      <line x1="50" y1="22" x2="50" y2="28" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="68" y1="30" x2="64" y2="34" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="72" y1="44" x2="66" y2="44" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ══ СТРІЧКА БРЕНДІВ — автопрокрутка + рідний touch-скрол + drag мишкою ══ */
function BrandMarquee({ partners }) {
  const DUPES = 8;
  const scrollerRef = useRef(null);
  const touchActiveRef = useRef(false);
  const mouseDownRef = useRef(false);
  const mouseStartXRef = useRef(0);
  const mouseStartScrollRef = useRef(0);
  const lastScrollRef = useRef(0);
  const stuckCountRef = useRef(0);
  const [grabbing, setGrabbing] = useState(false);

  // Ініціалізація позиції після завантаження картинок
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let inited = false;
    const tryInit = () => {
      if (inited) return;
      const w = el.scrollWidth / DUPES;
      if (w <= 10) return;
      inited = true;
      el.scrollLeft = w * 2; // стартуємо з 2-го блоку — є запас з обох боків
    };
    tryInit();
    const ro = new ResizeObserver(tryInit);
    ro.observe(el);
    // Повторна спроба коли картинки довантажились
    const imgs = el.querySelectorAll('img');
    imgs.forEach(img => img.addEventListener('load', tryInit, {once:true}));
    return () => ro.disconnect();
  }, []);

  // Автопрокрутка — перевіряємо чи користувач торкається
  useEffect(() => {
    let raf;
    const tick = () => {
      const el = scrollerRef.current;
      if (el && !touchActiveRef.current && !mouseDownRef.current) {
        const w = el.scrollWidth / DUPES;
        if (w > 10) {
          el.scrollLeft += 0.55;
          // Безшовне закільцювання
          if (el.scrollLeft >= w * (DUPES - 2)) el.scrollLeft -= w;
          else if (el.scrollLeft <= 0) el.scrollLeft += w;
          // Детекція "застрягання" (наприклад прокрутка заблокована iOS)
          if (Math.abs(el.scrollLeft - lastScrollRef.current) < 0.01) {
            stuckCountRef.current++;
            if (stuckCountRef.current > 120) { // ~2 секунди
              el.scrollLeft = w * 2; // скидаємо позицію
              stuckCountRef.current = 0;
            }
          } else {
            stuckCountRef.current = 0;
          }
          lastScrollRef.current = el.scrollLeft;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Drag мишкою (десктоп)
  const onMouseDown = e => {
    mouseDownRef.current = true; setGrabbing(true);
    mouseStartXRef.current = e.clientX;
    mouseStartScrollRef.current = scrollerRef.current.scrollLeft;
  };
  const onMouseMove = e => {
    if (!mouseDownRef.current || !scrollerRef.current) return;
    scrollerRef.current.scrollLeft = mouseStartScrollRef.current - (e.clientX - mouseStartXRef.current);
  };
  const endDrag = () => { mouseDownRef.current = false; setGrabbing(false); };

  return (
    <div
      ref={scrollerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchStart={() => { touchActiveRef.current = true; }}
      onTouchEnd={() => { setTimeout(() => { touchActiveRef.current = false; }, 600); }}
      onTouchCancel={() => { touchActiveRef.current = false; }}
      className="brand-scroller"
      style={{ display:"flex",gap:40,overflowX:"auto",WebkitOverflowScrolling:"touch",cursor:grabbing?"grabbing":"grab",userSelect:"none" }}>
      {Array.from({length:DUPES}).flatMap(()=>partners).map((b,i)=>(
        <span key={i} style={{ display:"inline-flex",alignItems:"center",flexShrink:0 }}>
          <img src={b.logoSrc} alt={b.name} style={{height:52,objectFit:"contain",maxWidth:180}} draggable={false}/>
        </span>
      ))}
    </div>
  );
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting){ el.classList.add("in"); obs.disconnect(); } }, { threshold:0.01, rootMargin:"0px 0px 250px 0px" });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return ref;
}

/* ══ SHOP ══ */
/* ══ Зображення товару: реальне фото для готових станцій/панелей,
   іконка-картка для технічних компонентів (надійніше за випадкові фотостоки) ══ */
const ICON_CARD_CONFIG = {
  "Інвертори":   { icon: Zap,     gradient: "linear-gradient(135deg,#1E3A8A,#3B82F6)", label: "Інвертор" },
  "Акумулятори": { icon: Battery, gradient: "linear-gradient(135deg,#14532D,#22C55E)", label: "Акумулятор" },
  "Монтаж":      { icon: Wrench,  gradient: "linear-gradient(135deg,#78350F,#D97706)", label: "Кріплення" },
};
function ProductImage({ product, iconSize = 44 }) {
  const cfg = ICON_CARD_CONFIG[product.cat];
  if (cfg) {
    const Icon = cfg.icon;
    return (
      <div style={{ width:"100%",height:"100%",background:cfg.gradient,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6 }}>
        <Icon size={iconSize} color="#fff" strokeWidth={1.5}/>
        <span style={{ color:"rgba(255,255,255,.85)",fontSize:Math.max(9,iconSize*0.22),fontWeight:700,fontFamily:"Syne,sans-serif",letterSpacing:".03em" }}>{cfg.label}</span>
      </div>
    );
  }
  return <img src={product.imgSrc || `https://images.unsplash.com/photo-${product.img}?auto=format&fit=crop&w=600&q=85`} alt={product.name} loading="lazy" decoding="async" style={{ width:"100%",height:"100%",objectFit:"cover" }}
    onError={(e)=>{ if (e.target.src !== KIT_IMG) e.target.src = KIT_IMG; }}/>;
}

function Shop({ cart, setCart, products, onClose }) {
  const [cat, setCat] = useState("Всі");
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [installMode, setInstallMode] = useState("with"); // "with" | "without"
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState("opis");
  const [addedId, setAddedId] = useState(null);
  const [toastItem, setToastItem] = useState(null);
  const [payStep, setPayStep] = useState(false);
  const [payMethod, setPayMethod] = useState("mono");
  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderComment, setOrderComment] = useState("");
  const [orderSent, setOrderSent] = useState(false);
  const [orderPhoneError, setOrderPhoneError] = useState(false);
  const [orderTgError, setOrderTgError] = useState(null);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [sendingSlow, setSendingSlow] = useState(false);

  // Якщо відправка триває довше 2 секунд — показуємо помаранчевий індикатор
  useEffect(() => {
    if (!sendingOrder) { setSendingSlow(false); return; }
    const t = setTimeout(() => setSendingSlow(true), 2000);
    return () => clearTimeout(t);
  }, [sendingOrder]);

  const COMPONENT_CATS = ["Панелі","Інвертори","Акумулятори","Монтаж"];
  const filtered = products
    .filter(p => COMPONENT_CATS.includes(p.cat) ? true : (installMode==="without" ? p.cat==="Self-Made" : p.cat!=="Self-Made"))
    .filter(p => (cat==="Всі"||p.cat===cat) && (!search||p.name.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b) => sort==="price_asc"?a.price-b.price:sort==="price_desc"?b.price-a.price:sort==="rating"?b.rating-a.rating:b.reviews-a.reviews);

  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  const effectivePrice = (p) => {
    if (installMode === "without" && p.mountUAH) return Math.max(0, p.price - p.mountUAH);
    return p.price;
  };

  const addToCart = p => {
    const price = effectivePrice(p);
    const withInstall = !(installMode === "without" && p.mountUAH);
    setCart(prev => { const ex=prev.find(i=>i.id===p.id); return ex?prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...prev,{...p,price,withInstall,qty:1}]; });
    setAddedId(p.id); setTimeout(()=>setAddedId(null),1400);
    setToastItem(p); setTimeout(()=>setToastItem(null), 3500);
  };
  const changeQty = (id,d) => setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i));
  const removeItem = id => setCart(prev=>prev.filter(i=>i.id!==id));
  const toggleWish = id => setWishlist(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);

  return (
    <div className="shop-modal">
      {/* Shop Header */}
      <div style={{ position:"sticky",top:0,zIndex:10,background:"rgba(245,245,245,.96)",backdropFilter:"blur(16px)",borderBottom:"2px solid #22C55E" }}>
        <div className="container" style={{ display:"flex",alignItems:"center",gap:12,height:62 }}>
          <button onClick={onClose} style={{ display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",color:"var(--sub)",width:34,height:34,borderRadius:8,transition:"all .2s",flexShrink:0 }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(0,0,0,.05)"; e.currentTarget.style.color="#1A1A1A"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#555"; }}
            aria-label="Назад">
            <ChevronLeft size={20}/>
          </button>
          <div style={{ display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0 }}>
            <img src={ICON_LOGO} alt="Sun.Power.Ua" style={{ width:38,height:38,objectFit:"contain",flexShrink:0 }}/>
            <div style={{ display:"flex",flexDirection:"column",lineHeight:1.15,minWidth:0,overflow:"hidden" }}>
              <span style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16,color:"#1E6B2E",letterSpacing:"-0.2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
                Sun<span style={{color:"#22C55E"}}>.</span>Power<span style={{color:"#22C55E"}}>.</span><span style={{color:"#F5C518"}}>Ua</span>
              </span>
              <span style={{ fontSize:11,color:"#aaa",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>Магазин обладнання</span>
            </div>
          </div>
          <button onClick={()=>setCartOpen(true)} style={{ position:"relative",display:"flex",alignItems:"center",gap:7,background:"#22C55E",color:"#fff",border:"none",borderRadius:100,padding:"8px 16px",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:13,flexShrink:0 }}>
            <ShoppingCart size={16}/><span className="hide-mobile">Кошик</span>
            {cartCount>0&&<span style={{ background:"#fff",color:"#22C55E",borderRadius:"50%",width:18,height:18,fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center" }}>{cartCount}</span>}
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop:24,paddingBottom:80 }}>
        {/* Promo */}
        <div style={{ background:"linear-gradient(135deg,#14532D,#1E6B2E)",borderRadius:14,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,position:"relative",overflow:"hidden" }}>
          <div className="noise"/>
          <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:0,position:"relative",zIndex:1 }}>
            <span style={{ fontSize:18,flexShrink:0 }}>🎁</span>
            <span style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>Комплекти СЕС зі знижкою до <span style={{color:"#F5C518"}}>15%</span></span>
          </div>
          <button onClick={()=>{ setInstallMode("with"); setCat("Стандарт"); }} style={{ flexShrink:0,position:"relative",zIndex:1,background:"#F5C518",color:"#1A1A1A",border:"none",borderRadius:100,padding:"7px 12px",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4,cursor:"pointer",fontFamily:"DM Sans,sans-serif" }}>
            <ArrowRight size={12}/>
          </button>
        </div>
        {/* Переваги */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:20 }}>
          {[[<Truck size={11} color="#22C55E"/>,"Доставка"],[<Shield size={11} color="#22C55E"/>,"Гарантія"],[<RotateCcw size={11} color="#22C55E"/>,"Повернення"],[<CreditCard size={11} color="#F5C518"/>,"0% розстр."]].map(([ico,txt],i)=>(
            <div key={i} style={{ background:"#fff",border:"1px solid var(--border)",borderRadius:8,padding:"6px 2px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,textAlign:"center" }}>
              {ico}<span style={{ fontSize:8,fontWeight:500,color:"var(--sub)",lineHeight:1.1 }}>{txt}</span>
            </div>
          ))}
        </div>
        {/* Filters: категорія + пошук + сортування в одному рядку */}
        <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:catMenuOpen?6:16,position:"relative",flexWrap:"wrap" }}>
          <button onClick={()=>setCatMenuOpen(v=>!v)}
            style={{ flex:"1 1 110px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",border:`1.5px solid ${catMenuOpen?"#22C55E":"var(--border)"}`,borderRadius:100,background:catMenuOpen?"rgba(34,197,94,.06)":"#fff",cursor:"pointer",fontFamily:"DM Sans,sans-serif",minWidth:0 }}>
            <span style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:700,color:"#14532D",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
              📂 {cat}
            </span>
            <ChevronDown size={15} color="#22C55E" style={{ flexShrink:0,marginLeft:4,transition:"transform .2s",transform:catMenuOpen?"rotate(180deg)":"none" }}/>
          </button>
          <div style={{ position:"relative",flex:"1 1 110px",minWidth:0 }}>
            <Search size={13} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#aaa" }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Пошук..."
              style={{ width:"100%",padding:"10px 10px 10px 32px",border:"1.5px solid var(--border)",borderRadius:100,fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none",background:"#fff" }}
              onFocus={e=>e.target.style.borderColor="#22C55E"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            {search&&<button onClick={()=>setSearch("")} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#aaa",display:"flex",padding:2 }}><X size={13}/></button>}
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{ padding:"10px 10px",border:"1.5px solid var(--border)",borderRadius:100,fontFamily:"DM Sans,sans-serif",fontSize:12,background:"#fff",color:"var(--sub)",cursor:"pointer",outline:"none",flexShrink:0,maxWidth:120 }}>
            <option value="popular">Популярність</option>
            <option value="rating">Рейтинг</option>
            <option value="price_asc">Ціна ↑</option>
            <option value="price_desc">Ціна ↓</option>
          </select>
        </div>
        {/* Розгорнута панель: монтаж + категорії */}
        {catMenuOpen && (
          <div style={{ background:"#fff",border:"1px solid var(--border)",borderRadius:14,padding:12,marginBottom:16,boxShadow:"0 8px 24px rgba(0,0,0,.06)" }}>
            <div style={{ display:"flex",gap:8,marginBottom:12 }}>
              <button onClick={()=>{ setInstallMode("with"); setCat("Всі"); }}
                style={{ flex:1,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${installMode==="with"?"#22C55E":"var(--border)"}`,background:installMode==="with"?"rgba(34,197,94,.08)":"#FAFAFA",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"DM Sans,sans-serif" }}>
                <Wrench size={13} color={installMode==="with"?"#22C55E":"#9CA3AF"}/>
                <span style={{ fontSize:11,fontWeight:700,color:installMode==="with"?"#14532D":"#555" }}>З монтажем</span>
              </button>
              <button onClick={()=>{ setInstallMode("without"); setCat("Всі"); }}
                style={{ flex:1,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${installMode==="without"?"#F5C518":"var(--border)"}`,background:installMode==="without"?"rgba(245,197,24,.1)":"#FAFAFA",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"DM Sans,sans-serif" }}>
                <Truck size={13} color={installMode==="without"?"#B45309":"#9CA3AF"}/>
                <span style={{ fontSize:11,fontWeight:700,color:installMode==="without"?"#B45309":"#555" }}>Без монтажу</span>
              </button>
            </div>
            <div style={{ height:1,background:"var(--border)",marginBottom:12 }}/>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
              {(installMode==="without" ? ["Всі","Self-Made","Панелі","Інвертори","Акумулятори","Монтаж"] : SHOP_CATS.filter(c=>c!=="Self-Made")).map(c=>(
                <button key={c} className={`filter-chip ${cat===c?"active":""}`} onClick={()=>{ setCat(c); setCatMenuOpen(false); }}>{c}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{ fontSize:12,color:"var(--sub)",marginBottom:18 }}>Знайдено: <strong style={{color:"#1A1A1A"}}>{filtered.length}</strong> товарів</div>
        {/* Grid */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,240px),1fr))",gap:18 }}>
          {filtered.map(p=>(
            <div key={p.id} className="product-card">
              <div className="product-img" onClick={()=>{ setDetail(p); setDetailTab("opis"); }} style={{ position:"relative" }}>
                <ProductImage product={p} iconSize={44}/>
                {p.badge==="new"&&<span style={{ position:"absolute",bottom:10,left:10,background:"#22C55E",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:100,letterSpacing:".04em",zIndex:2 }}>NEW</span>}
                {p.badge==="sale"&&<span style={{ position:"absolute",bottom:10,left:10,background:"#EF4444",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:100,letterSpacing:".04em",zIndex:2 }}>SALE {p.oldPrice?`-${Math.round((1-p.price/p.oldPrice)*100)}%`:""}</span>}
              </div>
              <button className="wishlist-btn" onClick={e=>{ e.stopPropagation(); toggleWish(p.id); }} aria-label="Обране">
                <Heart size={15} color={wishlist.includes(p.id)?"#EF4444":"#9CA3AF"} fill={wishlist.includes(p.id)?"#EF4444":"none"}/>
              </button>
              <div style={{ padding:"14px" }}>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"#22C55E",marginBottom:4 }}>{p.cat} · {p.brand}</div>
                <div onClick={()=>{ setDetail(p); setDetailTab("opis"); }} style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,lineHeight:1.3,marginBottom:7,cursor:"pointer" }}>{p.name}</div>
                <div style={{ display:"flex",alignItems:"center",gap:4,marginBottom:10 }}>
                  <div style={{ display:"flex",gap:1 }}>{[...Array(5)].map((_,i)=><Star key={i} size={10} fill={i<Math.floor(p.rating)?"#F5C518":"#E5E7EB"} color={i<Math.floor(p.rating)?"#F5C518":"#E5E7EB"}/>)}</div>
                  <span style={{ fontSize:11,color:"var(--sub)" }}>{p.rating} ({p.reviews})</span>
                </div>
                <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:12 }}>
                  {p.power&&<span style={{ fontSize:10,padding:"2px 7px",background:"rgba(34,197,94,.1)",borderRadius:6,color:"#14532D",fontWeight:700 }}>{p.power}</span>}
                  <span style={{ fontSize:10,padding:"2px 7px",background:"rgba(245,197,24,.1)",borderRadius:6,color:"#92400E",fontWeight:700 }}>Гарантія {p.warranty}</span>
                </div>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:6 }}>
                  <div>
                    <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:p.custom?14:18,lineHeight:1,color:p.custom?"#22C55E":"#1A1A1A" }}>{p.custom?"За проєктом":`${effectivePrice(p).toLocaleString()} ₴`}</div>
                    {installMode==="without"&&p.mountUAH>0&&!p.custom&&<div style={{ fontSize:10,color:"#B45309",fontWeight:600,marginTop:1 }}>без монтажу −{p.mountUAH.toLocaleString()} ₴</div>}
                    {p.oldPrice&&<div style={{ fontSize:11,color:"#9CA3AF",textDecoration:"line-through" }}>{p.oldPrice.toLocaleString()} ₴</div>}
                  </div>
                  {p.custom ? (
                    <button onClick={()=>{ onClose(); setTimeout(()=>{ const el=document.getElementById("contact"); if(el) el.scrollIntoView({behavior:"smooth"}); },150); }} style={{ display:"flex",alignItems:"center",gap:5,padding:"8px 12px",borderRadius:100,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:12,background:"#1A1A1A",color:"#fff",flexShrink:0,textTransform:"uppercase",letterSpacing:".04em" }}>
                      Заявка
                    </button>
                  ) : (
                  <button onClick={()=>addToCart(p)} style={{ display:"flex",alignItems:"center",gap:5,padding:"8px 12px",borderRadius:100,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:12,transition:"all .3s",background:addedId===p.id?"#14532D":"#22C55E",color:"#fff",flexShrink:0,textTransform:"uppercase",letterSpacing:".04em" }}>
                    {addedId===p.id?<><Check size={12}/> Додано</>:<><Plus size={12}/> В кошик</>}
                  </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CART */}
      {cartOpen&&(
        <><div className="cart-overlay" onClick={()=>setCartOpen(false)}/>
        <div className="cart-panel">
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px 14px",borderBottom:"1px solid var(--border)",flexShrink:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <ShoppingCart size={19} color="#22C55E"/>
              <span style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:17 }}>Кошик</span>
              {cartCount>0&&<span style={{ background:"#22C55E",color:"#fff",borderRadius:100,padding:"2px 8px",fontSize:11,fontWeight:700 }}>{cartCount}</span>}
            </div>
            <button onClick={()=>setCartOpen(false)} style={{ background:"none",border:"none",cursor:"pointer",padding:6,color:"var(--sub)",display:"flex" }}><X size={19}/></button>
          </div>
          <div style={{ flex:1,overflowY:"auto",minHeight:0,padding:"14px" }}>
            {cart.length===0?(<div style={{ textAlign:"center",padding:"60px 24px" }}>
              {/* Іконка кошика з стрілкою вниз — як у Sanlarix */}
              <div style={{ marginBottom:20,display:"flex",justifyContent:"center" }}>
                <svg viewBox="0 0 110 95" width="110" height="95" fill="none" stroke="#CCC" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 26 H25 L34 60 C35 64 38 66 42 66 H78 C82 66 84 63 85 60 L90 33 C90 30 88 28 85 28 H64"/>
                  <path d="M56 26 V48 M50 43 L56 49 L62 43"/>
                  <line x1="40" y1="78" x2="72" y2="78"/>
                  <circle cx="35" cy="78" r="7"/><circle cx="77" cy="78" r="7"/>
                </svg>
              </div>
              <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,textTransform:"uppercase",letterSpacing:".03em",marginBottom:8,color:"#1A1A1A" }}>Ваш кошик наразі порожній</div>
              <p style={{ color:"var(--sub)",fontSize:14,marginBottom:24 }}>Відвідайте наш каталог товарів та послуг</p>
              <button className="btn-yellow" style={{ textTransform:"uppercase",letterSpacing:".05em",fontSize:14,padding:"14px 28px" }} onClick={()=>setCartOpen(false)}>
                ДО ЗАМОВЛЕНЬ ↗
              </button>
            </div>):cart.map(item=>(
              <div key={item.id} style={{ display:"flex",gap:11,padding:"12px 0",borderBottom:"1px solid var(--border)" }}>
                <div style={{ width:68,height:52,borderRadius:10,overflow:"hidden",flexShrink:0 }}>
                  <ProductImage product={item} iconSize={20}/>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,fontSize:12,lineHeight:1.3,marginBottom:2,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" }}>{item.name}</div>
                  {item.withInstall===false&&<div style={{ fontSize:10,color:"#B45309",fontWeight:600,marginBottom:5 }}>📦 без монтажу</div>}
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:item.withInstall===false?0:3 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                      <button className="qty-btn" onClick={()=>changeQty(item.id,-1)}><Minus size={11}/></button>
                      <span style={{ fontWeight:700,fontSize:13,minWidth:18,textAlign:"center" }}>{item.qty}</span>
                      <button className="qty-btn" onClick={()=>changeQty(item.id,1)}><Plus size={11}/></button>
                    </div>
                    <div style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,color:"#22C55E" }}>{(item.price*item.qty).toLocaleString()} ₴</div>
                  </div>
                </div>
                <button onClick={()=>removeItem(item.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#D1D5DB",padding:4 }} onMouseEnter={e=>e.currentTarget.style.color="#EF4444"} onMouseLeave={e=>e.currentTarget.style.color="#D1D5DB"}><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
          {cart.length>0&&(
            <div style={{ padding:"14px 22px",borderTop:"1px solid var(--border)",flexShrink:0 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                <span style={{ color:"var(--sub)",fontSize:13 }}>Разом:</span>
                <span style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20 }}>{cartTotal.toLocaleString()} ₴</span>
              </div>
              <p style={{ fontSize:11,color:"var(--sub)",marginBottom:12 }}>+ доставка та монтаж за домовленістю</p>

              {/* Monobank форма */}
              {!payStep ? (
                <button className="btn-green" style={{ width:"100%",justifyContent:"center",padding:"13px",textTransform:"uppercase" }}
                  onClick={()=>setPayStep(true)}>
                  💳 Оплатити через Monobank <ArrowRight size={14}/>
                </button>
              ) : (
                <div style={{ background:"#F0FDF4",borderRadius:14,padding:16,border:"1px solid rgba(34,197,94,.2)" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
                    {/* Monobank логотип */}
                    <div style={{ width:32,height:32,borderRadius:8,background:"#1B1F3B",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <span style={{ color:"#fff",fontSize:14,fontWeight:900 }}>m</span>
                    </div>
                    <span style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15 }}>Оплата Monobank</span>
                  </div>

                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:11,fontWeight:600,color:"var(--sub)",display:"block",marginBottom:4 }}>ІМ'Я</label>
                    <input type="text" placeholder="Ваше ім'я та прізвище" value={orderName} onChange={e=>setOrderName(e.target.value)}
                      style={{ width:"100%",padding:"9px 12px",border:"1.5px solid var(--border)",borderRadius:10,fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none" }}
                      onFocus={e=>e.target.style.borderColor="#22C55E"}
                      onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:11,fontWeight:600,color:"var(--sub)",display:"block",marginBottom:4 }}>ТЕЛЕФОН *</label>
                    <input type="tel" placeholder="+380 96 203 38 39" value={orderPhone}
                      onChange={e=>{ setOrderPhone(e.target.value); setOrderPhoneError(false); }}
                      style={{ width:"100%",padding:"9px 12px",border:`1.5px solid ${orderPhoneError?"#EF4444":"var(--border)"}`,borderRadius:10,fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none" }}
                      onFocus={e=>e.target.style.borderColor="#22C55E"}
                      onBlur={e=>e.target.style.borderColor=orderPhoneError?"#EF4444":"var(--border)"}/>
                    {orderPhoneError && <p style={{ fontSize:11,color:"#EF4444",marginTop:4 }}>Введіть коректний номер телефону (наприклад, +380961234567)</p>}
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:11,fontWeight:600,color:"var(--sub)",display:"block",marginBottom:4 }}>КОМЕНТАР</label>
                    <input type="text" placeholder="Адреса доставки або коментар" value={orderComment} onChange={e=>setOrderComment(e.target.value)}
                      style={{ width:"100%",padding:"9px 12px",border:"1.5px solid var(--border)",borderRadius:10,fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none" }}
                      onFocus={e=>e.target.style.borderColor="#22C55E"}
                      onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                  </div>

                  {/* Способи оплати */}
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:11,fontWeight:600,color:"var(--sub)",display:"block",marginBottom:8 }}>СПОСІБ ОПЛАТИ</label>
                    <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                      {[
                        { id:"mono", label:"🟡 Оплата карткою (Monobank)" },
                        { id:"cash", label:"💵 Готівка / на місці" },
                      ].map(m=>(
                        <button key={m.id}
                          onClick={()=>setPayMethod(m.id)}
                          style={{ padding:"7px 14px",borderRadius:100,border:`1.5px solid ${payMethod===m.id?"#22C55E":"var(--border)"}`,background:payMethod===m.id?"rgba(34,197,94,.08)":"#fff",fontFamily:"DM Sans,sans-serif",fontSize:12,fontWeight:payMethod===m.id?700:400,color:payMethod===m.id?"#14532D":"#555",cursor:"pointer",transition:"all .2s" }}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Сума */}
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"#fff",borderRadius:10,marginBottom:12,border:"1px solid rgba(34,197,94,.15)" }}>
                    <span style={{ fontSize:13,color:"var(--sub)" }}>До сплати:</span>
                    <span style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,color:"#22C55E" }}>{cartTotal.toLocaleString()} ₴</span>
                  </div>

                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:12,padding:"8px 10px",background:"#F0FDF4",borderRadius:8 }}>
                    <Shield size={13} color="#22C55E" style={{ flexShrink:0 }}/>
                    <span style={{ fontSize:10.5,color:"#15803D",lineHeight:1.4 }}>Дані картки не зберігаються на сайті — оплата на захищеній сторінці Monobank, з'єднання зашифроване</span>
                  </div>

                  {!orderSent ? (
                    <>
                      <button className="btn-green" disabled={sendingOrder} style={{ width:"100%",justifyContent:"center",padding:"13px",textTransform:"uppercase",fontSize:14,opacity:sendingOrder?.85:1, animation: sendingSlow ? "slowBlink 0.9s ease-in-out infinite" : "none", color: sendingSlow ? "#1A1A1A" : "#fff" }}
                        onClick={async ()=>{
                          if (!isValidPhone(orderPhone)) { setOrderPhoneError(true); return; }
                          setOrderTgError(null);
                          setSendingOrder(true);
                          const payLabels = { mono:"🟡 Оплата карткою (Monobank)", cash:"💵 Готівка / на місці" };
                          const itemsList = cart.map(i=>`• ${escapeHtml(i.name)}${i.withInstall===false?" (📦 без монтажу)":""} ×${i.qty} — ${(i.price*i.qty).toLocaleString()} ₴`).join("\n");
                          const orderRef = `SP-${Date.now()}`;
                          const msg = `🛒 <b>НОВЕ ЗАМОВЛЕННЯ ${orderRef}</b>\n\n`
                            + `${itemsList}\n\n`
                            + `💰 <b>Разом: ${cartTotal.toLocaleString()} ₴</b>\n`
                            + `💳 Оплата: ${payLabels[payMethod]}\n\n`
                            + `👤 Ім'я: ${escapeHtml(orderName) || "—"}\n`
                            + `📞 <b>Телефон: ${escapeHtml(orderPhone)}</b>\n`
                            + `📝 Коментар: ${escapeHtml(orderComment) || "—"}`;

                          saveLead({ type:"shop_order", name:orderName, phone:orderPhone, amount:cartTotal, details:cart.map(i=>`${i.name} ×${i.qty}`).join(", ") });

                          if (payMethod === "mono") {
                            // Створюємо реальний рахунок Monobank і одночасно сповіщаємо менеджера
                            const [tgResult, payResult] = await Promise.all([
                              sendToTelegram(msg + "\n\n⏳ Очікує оплату через Monobank..."),
                              createMonobankInvoice({
                                amount: cartTotal,
                                orderRef,
                                description: `Замовлення ${orderRef} — Sun Power UA`,
                                customerName: orderName,
                                customerPhone: orderPhone,
                              }),
                            ]);
                            setSendingOrder(false);
                            if (payResult.ok && payResult.pageUrl) {
                              trackPurchase(cartTotal, "UAH", { content_name: "shop_order_mono", num_items: cart.reduce((s,i)=>s+i.qty,0) });
                              window.location.href = payResult.pageUrl; // редірект на сторінку оплати Monobank
                            } else {
                              // Оплата ще не підключена на сервері — заявка вже пішла в Telegram,
                              // менеджер зв'яжеться для оплати вручну.
                              setOrderTgError(payResult.error || "Оплата тимчасово недоступна. Заявку прийнято, менеджер зв'яжеться з вами.");
                              if (tgResult.ok) setOrderSent(true);
                            }
                          } else {
                            const result = await sendToTelegram(msg);
                            setSendingOrder(false);
                            if (result.ok) { trackPurchase(cartTotal, "UAH", { content_name: "shop_order", num_items: cart.reduce((s,i)=>s+i.qty,0) }); setOrderSent(true); }
                            else { setOrderTgError(result.error); }
                          }
                        }}>
                        {sendingSlow ? "⏳ Ще трохи..." : sendingOrder ? (payMethod==="mono"?"Створюємо рахунок...":"Надсилаємо...") : payMethod==="mono" ? "💳 Перейти до оплати" : "✅ Підтвердити замовлення"}
                      </button>
                      {orderTgError && (
                        <div style={{ marginTop:10, padding:"10px 12px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, fontSize:12, color:"#B91C1C" }}>
                          ⚠️ Помилка надсилання в Telegram: {orderTgError}
                        </div>
                      )}
                      <button style={{ width:"100%",marginTop:7,padding:"8px",background:"none",border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:12,color:"var(--sub)" }}
                        onClick={()=>setPayStep(false)}>
                        ← Назад
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign:"center",padding:"8px 0" }}>
                      <div style={{ fontSize:40,marginBottom:10 }}>🎉</div>
                      <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:17,marginBottom:6 }}>Дякуємо за замовлення!</div>
                      <p style={{ fontSize:13,color:"var(--sub)",lineHeight:1.6,marginBottom:14 }}>Менеджер зв'яжеться з вами протягом 30 секунд для підтвердження.</p>
                      <button className="btn-green" style={{ width:"100%",justifyContent:"center",padding:"12px",textTransform:"uppercase",fontSize:13 }}
                        onClick={()=>{ setPayStep(false); setOrderSent(false); setOrderName(""); setOrderPhone(""); setOrderComment(""); setCart([]); setCartOpen(false); }}>
                        Готово
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button style={{ width:"100%",marginTop:7,padding:"9px",background:"none",border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:12,color:"var(--sub)" }} onClick={()=>setCartOpen(false)}>Продовжити покупки</button>
            </div>
          )}
        </div></>
      )}

      {/* DETAIL */}
      {detail&&(
        <><div className="cart-overlay" onClick={()=>setDetail(null)}/>
        <div className="cart-panel" style={{ width:"min(500px,100vw)" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 12px",borderBottom:"1px solid var(--border)",flexShrink:0 }}>
            <span style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15 }}>Деталі товару</span>
            <button onClick={()=>setDetail(null)} style={{ background:"none",border:"none",cursor:"pointer",padding:6,color:"var(--sub)",display:"flex" }}><X size={19}/></button>
          </div>
          <div style={{ flex:1,overflowY:"auto",minHeight:0 }}>
            <div style={{ aspectRatio:"16/9",overflow:"hidden" }}>
              <ProductImage product={detail} iconSize={56}/>
            </div>
            <div style={{ padding:"18px 20px" }}>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",marginBottom:5 }}>{detail.cat} · {detail.brand}</div>
              <h3 style={{ marginBottom:8,lineHeight:1.3 }}>{detail.name}</h3>
              <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:16 }}>
                <div style={{ display:"flex",gap:2 }}>{[...Array(5)].map((_,i)=><Star key={i} size={12} fill={i<Math.floor(detail.rating)?"#F5C518":"#E5E7EB"} color={i<Math.floor(detail.rating)?"#F5C518":"#E5E7EB"}/>)}</div>
                <span style={{ fontSize:12,color:"var(--sub)" }}>{detail.rating} · {detail.reviews} відгуків</span>
              </div>

              {/* ══ ВКЛАДКИ: ОПИС / ХАРАКТЕРИСТИКИ ══ */}
              <div style={{ display:"flex",gap:4,background:"#F5F5F5",borderRadius:100,padding:4,marginBottom:18 }}>
                {[["opis","Опис"],["specs","Характеристики"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setDetailTab(k)}
                    style={{ flex:1,padding:"8px 12px",borderRadius:100,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:12.5,transition:"all .2s",background:detailTab===k?"#fff":"transparent",color:detailTab===k?"#1A1A1A":"#777",boxShadow:detailTab===k?"0 2px 8px rgba(0,0,0,.08)":"none" }}>
                    {l}
                  </button>
                ))}
              </div>

              {detailTab==="opis" && (<>
              <p style={{ fontSize:13,color:"var(--sub)",lineHeight:1.75,marginBottom:6 }}>{detail.desc.replace(/\s*Курс\s*\$1=[\d.]+₴,?\s*ціна орієнтовна\.?/i,"")}</p>
              {/Курс\s*\$1=[\d.]+₴/i.test(detail.desc) && (
                <p style={{ fontSize:11,color:"#aaa",fontStyle:"italic",marginBottom:18 }}>
                  {detail.desc.match(/Курс\s*\$1=[\d.]+₴,?\s*ціна орієнтовна\.?/i)?.[0]}
                </p>
              )}

              {/* ══ КОМПЛЕКТАЦІЯ ══ */}
              {detail.kit?.length>0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",marginBottom:10 }}>Комплектація</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                    {detail.kit.map((item,i)=>(
                      <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:8 }}>
                        <span style={{ color:"#22C55E",fontSize:13,lineHeight:1.6 }}>•</span>
                        <span style={{ fontSize:13,color:"var(--text)",lineHeight:1.6 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ ПЕРЕВАГИ ══ */}
              {detail.advantages?.length>0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",marginBottom:10 }}>Переваги</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {detail.advantages.map((item,i)=>(
                      <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:8 }}>
                        <div style={{ width:18,height:18,borderRadius:"50%",background:"rgba(34,197,94,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1 }}>
                          <Check size={11} color="#22C55E"/>
                        </div>
                        <span style={{ fontSize:13,color:"var(--text)",lineHeight:1.6 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>)}

              {detailTab==="specs" && (<>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20 }}>
                {[detail.power&&["Потужність",detail.power],["Гарантія",detail.warranty],["Категорія",detail.cat],["Бренд",detail.brand]].filter(Boolean).map(([k,v])=>(
                  <div key={k} style={{ background:"#F5F5F5",borderRadius:10,padding:"9px 12px" }}>
                    <div style={{ fontSize:9,fontWeight:600,color:"var(--sub)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:2 }}>{k}</div>
                    <div style={{ fontWeight:700,fontSize:13 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* ══ ТЕХНІЧНІ ХАРАКТЕРИСТИКИ КОМПОНЕНТІВ ══ */}
              {detail.specs && (detail.specs.panel?.length>0 || detail.specs.inverter?.length>0 || detail.specs.akb?.length>0 || detail.specs.mount?.length>0) && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",marginBottom:12 }}>Технічні характеристики</div>

                  {detail.specs.panel?.length>0 && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:8 }}>
                        <span style={{ fontSize:15 }}>🔆</span>
                        <span style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13 }}>Панелі</span>
                        <span style={{ fontSize:11,color:"var(--sub)" }}>· {detail.panelName}</span>
                      </div>
                      <div style={{ border:"1px solid var(--border)",borderRadius:10,overflow:"hidden" }}>
                        {detail.specs.panel.map(([k,v],i)=>(
                          <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"8px 12px",background:i%2===0?"#fff":"#FAFAFA",borderBottom:i<detail.specs.panel.length-1?"1px solid var(--border)":"none" }}>
                            <span style={{ fontSize:12,color:"var(--sub)" }}>{k}</span>
                            <span style={{ fontSize:12,fontWeight:700,color:"#1A1A1A" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail.specs.inverter?.length>0 && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:8 }}>
                        <span style={{ fontSize:15 }}>⚡</span>
                        <span style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13 }}>Інвертор</span>
                        <span style={{ fontSize:11,color:"var(--sub)" }}>· {detail.invName}</span>
                      </div>
                      <div style={{ border:"1px solid var(--border)",borderRadius:10,overflow:"hidden" }}>
                        {detail.specs.inverter.map(([k,v],i)=>(
                          <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"8px 12px",background:i%2===0?"#fff":"#FAFAFA",borderBottom:i<detail.specs.inverter.length-1?"1px solid var(--border)":"none" }}>
                            <span style={{ fontSize:12,color:"var(--sub)" }}>{k}</span>
                            <span style={{ fontSize:12,fontWeight:700,color:"#1A1A1A" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail.specs.akb?.length>0 && (
                    <div style={{ marginBottom: detail.specs.mount?.length>0 ? 14 : 0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:8 }}>
                        <span style={{ fontSize:15 }}>🔋</span>
                        <span style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13 }}>Акумулятор</span>
                        <span style={{ fontSize:11,color:"var(--sub)" }}>· {detail.akbName}</span>
                      </div>
                      <div style={{ border:"1px solid var(--border)",borderRadius:10,overflow:"hidden" }}>
                        {detail.specs.akb.map(([k,v],i)=>(
                          <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"8px 12px",background:i%2===0?"#fff":"#FAFAFA",borderBottom:i<detail.specs.akb.length-1?"1px solid var(--border)":"none" }}>
                            <span style={{ fontSize:12,color:"var(--sub)" }}>{k}</span>
                            <span style={{ fontSize:12,fontWeight:700,color:"#1A1A1A" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail.specs.mount?.length>0 && (
                    <div>
                      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:8 }}>
                        <span style={{ fontSize:15 }}>🔩</span>
                        <span style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13 }}>Кріплення</span>
                      </div>
                      <div style={{ border:"1px solid var(--border)",borderRadius:10,overflow:"hidden" }}>
                        {detail.specs.mount.map(([k,v],i)=>(
                          <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"8px 12px",background:i%2===0?"#fff":"#FAFAFA",borderBottom:i<detail.specs.mount.length-1?"1px solid var(--border)":"none" }}>
                            <span style={{ fontSize:12,color:"var(--sub)" }}>{k}</span>
                            <span style={{ fontSize:12,fontWeight:700,color:"#1A1A1A" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </>)}
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:detail.custom?20:26,color:detail.custom?"#22C55E":"#1A1A1A" }}>{detail.custom?"За проєктом":`${effectivePrice(detail).toLocaleString()} ₴`}</div>
                  {installMode==="without"&&detail.mountUAH>0&&!detail.custom&&<div style={{ fontSize:11,color:"#B45309",fontWeight:600,marginTop:2 }}>без монтажу (−{detail.mountUAH.toLocaleString()} ₴ за встановлення)</div>}
                  {detail.oldPrice&&<div style={{ fontSize:12,color:"#9CA3AF",textDecoration:"line-through" }}>{detail.oldPrice.toLocaleString()} ₴</div>}
                </div>
                <button className="wishlist-btn" onClick={()=>toggleWish(detail.id)} style={{ position:"static",width:38,height:38 }}>
                  <Heart size={17} color={wishlist.includes(detail.id)?"#22C55E":"#9CA3AF"} fill={wishlist.includes(detail.id)?"#22C55E":"none"}/>
                </button>
              </div>
              {detail.custom ? (
                <button className="btn-green" style={{ width:"100%",justifyContent:"center",padding:"13px",textTransform:"uppercase" }}
                  onClick={()=>{ setDetail(null); onClose(); setTimeout(()=>{ const el=document.getElementById("contact"); if(el) el.scrollIntoView({behavior:"smooth"}); },150); }}>
                  <Phone size={15}/> Залишити заявку
                </button>
              ) : (
              <button className="btn-green" style={{ width:"100%",justifyContent:"center",padding:"13px",textTransform:"uppercase" }} onClick={()=>{ addToCart(detail); setDetail(null); setCartOpen(true); }}>
                <ShoppingCart size={15}/> Додати в кошик
              </button>
              )}
            </div>
          </div>
        </div></>
      )}

      {/* ══ TOAST — сповіщення після додавання в кошик ══ */}
      {toastItem && (
        <div style={{ position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",zIndex:9998,background:"#1A1A1A",borderRadius:16,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,.35)",animation:"toastIn .35s cubic-bezier(.16,1,.3,1)",maxWidth:"calc(100vw - 32px)" }}>
          <div style={{ width:36,height:36,borderRadius:10,background:"rgba(34,197,94,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <Check size={18} color="#22C55E"/>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13,fontWeight:700,color:"#fff",marginBottom:2 }}>Додано в кошик</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,.45)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160 }}>{toastItem.name}</div>
          </div>
          <button
            onClick={()=>{ setToastItem(null); setCartOpen(true); }}
            style={{ flexShrink:0,background:"#22C55E",border:"none",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:12,color:"#fff",whiteSpace:"nowrap" }}>
            Кошик →
          </button>
          <button onClick={()=>setToastItem(null)} style={{ flexShrink:0,background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <X size={13} color="rgba(255,255,255,.5)"/>
          </button>
        </div>
      )}
    </div>
  );
}
function SolarCalculator({ onOpenShop, products }) {
  /* ══ РЕЖИМ: null = вибір, "quick" = 3 питання, "precise" = 12 питань ══ */
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState(1);
  const calcCardRef = useRef(null);
  const [data, setData] = useState({
    type:"", bill:"", credit:false, businessSystem:"hybrid",
    nightLoad:null, peopleHome:null, orientation:null, roofType:null,
    shading:null, roofArea:"", taxStatus:null, region:null, futureLoad:null,
  });
  const [result, setResult] = useState(null);
  const [showConsult, setShowConsult] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [tgError, setTgError] = useState(null);
  const [sent, setSent] = useState(false);
  const [sendingTg, setSendingTg] = useState(false);
  const [sendingSlow, setSendingSlow] = useState(false);

  useEffect(() => {
    if (!sendingTg) { setSendingSlow(false); return; }
    const t = setTimeout(() => setSendingSlow(true), 2000);
    return () => clearTimeout(t);
  }, [sendingTg]);

  // Прокрутка до верху картки калькулятора при зміні кроку —
  // без цього висота контенту різко змінюється (особливо на переході
  // до результату), і старий/новий крок на мить накладаються один на одного.
  // ВАЖЛИВО: пропускаємо перший рендер (завантаження/оновлення сторінки) —
  // інакше будь-яке оновлення сторінки одразу "телепортує" до калькулятора.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!calcCardRef.current) return;
    const t = setTimeout(() => {
      const headerOffset = 92;
      const y = calcCardRef.current.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: Math.max(0, y), behavior:"smooth" });
    }, 30);
    return () => clearTimeout(t);
  }, [step]);

  /* ══ КОНСТАНТИ ТАРИФІВ (нетбілінг 2026) ══ */
  const RETAIL = 4.32;           // ₴/кВт·год — повний роздрібний тариф
  const SELL_INDIVIDUAL = 2.0;   // ₴/кВт·год — ціна РДН після податку 23% (фізособа)
  const SELL_FOP = 2.4;          // ₴/кВт·год — ціна РДН після податку 6% (ФОП)

  /* ══ БАЗОВІ ПАРАМЕТРИ ЗА ТИПОМ ОБ'ЄКТУ (Швидкий режим) ══ */
  const SYSTEM_DEFAULTS = {
    apartment: { selfConsumption:0.35 },
    house:     { selfConsumption:0.65 },
    dacha:     { selfConsumption:0.55 },
    business:  { selfConsumption:0.70 }, // гібридна; мережева — окремий підвибір
  };

  const EXTRA_QUESTIONS = {
    nightLoad: {
      title:"Чи є велике\nнавантаження вночі?", subtitle:"Бойлер, опалення, кондиціонер вночі",
      options:[
        {val:"yes", icon:"🌙", label:"Так, велике", sub:"Бойлер / опалення вночі"},
        {val:"no", icon:"☀️", label:"Ні, переважно вдень", sub:"Звичайне споживання"},
      ]},
    peopleHome: {
      title:"Скільки людей\nвдома вдень?", subtitle:"Впливає на самоспоживання сонця",
      options:[
        {val:"none", icon:"🚪", label:"Нікого, всі на роботі", sub:"-10% самоспоживання"},
        {val:"some", icon:"🧑", label:"1–2 людини part-time", sub:"база"},
        {val:"always", icon:"🏠", label:"Хтось вдома постійно", sub:"+15% самоспоживання"},
      ]},
    orientation: {
      title:"Орієнтація\nдаху?", subtitle:"Впливає на ефективність генерації",
      options:[
        {val:"south", icon:"🧭", label:"Південь", sub:"Максимум сонця"},
        {val:"ew", icon:"↔️", label:"Схід–Захід", sub:"−8% генерації"},
        {val:"north", icon:"⬆️", label:"Північ / складно", sub:"−20% генерації"},
      ]},
    roofType: {
      title:"Тип\nпокрівлі?", subtitle:"Впливає на вартість монтажу",
      options:[
        {val:"pitched", icon:"🏠", label:"Скатний дах", sub:"стандартний монтаж"},
        {val:"flat", icon:"⬜", label:"Плоский дах", sub:"+5% вартості"},
        {val:"ground", icon:"🌍", label:"Наземна установка", sub:"+15% вартості"},
      ]},
    shading: {
      title:"Чи є затінення\nдаху?", subtitle:"Дерева, сусідні будівлі, труби",
      options:[
        {val:"yes", icon:"🌳", label:"Так, є затінення", sub:"−15% генерації"},
        {val:"no", icon:"✅", label:"Ні, дах відкритий", sub:"без втрат"},
      ]},
    taxStatus: {
      title:"Фізособа\nчи ФОП?", subtitle:"Впливає на податок з продажу енергії",
      options:[
        {val:"individual", icon:"🙋", label:"Фізична особа", sub:"Податок 23% з продажу"},
        {val:"fop", icon:"💼", label:"ФОП", sub:"Податок лише 6%"},
      ]},
    region: {
      title:"Ваш\nрегіон?", subtitle:"Кількість сонячних годин різниться",
      options:[
        {val:"south", icon:"🌞", label:"Південь / Одещина", sub:"+10% генерації"},
        {val:"center", icon:"🇺🇦", label:"Центр / Київщина", sub:"база"},
        {val:"west_north", icon:"☁️", label:"Захід / Північ", sub:"−8% генерації"},
      ]},
    futureLoad: {
      title:"Плануєте нові\nнавантаження?", subtitle:"Електромобіль, кондиціонер тощо",
      options:[
        {val:"ev", icon:"🚗", label:"Так, електромобіль", sub:"+20% потужності"},
        {val:"no", icon:"🔌", label:"Ні, без змін", sub:"база"},
      ]},
  };

  const QUICK_STEPS = ["type","bill","payment"];
  const PRECISE_STEPS = ["type","nightLoad","peopleHome","orientation","roofType","shading","roofArea","taxStatus","region","futureLoad","bill","payment"];
  const STEPS = mode === "precise" ? PRECISE_STEPS : QUICK_STEPS;
  const stepKey = STEPS[step-1];
  const totalSteps = STEPS.length;

  /* ══ ЦІНА ЗА кВт (на базі нашого прайс-листа, курс 44.5) ══ */
  const getPricePerKw = (type, power, hybrid) => {
    if (type === "business") return hybrid ? 27400 : 16500;
    if (power <= 6) return 40300;
    if (power <= 10) return 32400;
    return 23100; // до 15 кВт
  };

  /* ══ КОРЕКТУВАННЯ ДЛЯ ТОЧНОГО РЕЖИМУ ══ */
  const computeAdjustments = () => {
    const base = SYSTEM_DEFAULTS[data.type]?.selfConsumption ?? 0.5;
    let selfConsumption = base;
    let genEfficiency = 1.0;
    let costMultiplier = 1.0;
    let powerMultiplier = 1.0;
    let sellPrice = SELL_INDIVIDUAL;

    if (mode === "precise") {
      if (data.nightLoad === "yes") selfConsumption -= 0.10;
      if (data.nightLoad === "no") selfConsumption += 0.05;
      if (data.peopleHome === "none") selfConsumption -= 0.10;
      if (data.peopleHome === "always") selfConsumption += 0.15;
      if (data.orientation === "ew") genEfficiency -= 0.08;
      if (data.orientation === "north") genEfficiency -= 0.20;
      if (data.roofType === "flat") costMultiplier += 0.05;
      if (data.roofType === "ground") costMultiplier += 0.15;
      if (data.shading === "yes") genEfficiency -= 0.15;
      if (data.taxStatus === "fop") sellPrice = SELL_FOP;
      if (data.region === "south") genEfficiency += 0.10;
      if (data.region === "west_north") genEfficiency -= 0.08;
      if (data.futureLoad === "ev") powerMultiplier += 0.20;
    } else if (data.type === "business" && data.businessSystem === "fop") {
      sellPrice = SELL_FOP;
    }

    selfConsumption = Math.min(0.92, Math.max(0.15, selfConsumption));
    genEfficiency = Math.min(1.15, Math.max(0.55, genEfficiency));
    return { selfConsumption, genEfficiency, costMultiplier, powerMultiplier, sellPrice };
  };

  /* ══ ПІДБІР РЕАЛЬНОГО ТОВАРУ З КАТАЛОГУ ══ */
  const parseKw = (kwStr) => {
    const m = String(kwStr).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };

  const findMatchingProduct = (calcPower, type, hybrid) => {
    const category = type === "business" ? "Бізнес" : "Стандарт";
    let candidates = products.filter(p => p.cat === category && !p.custom);

    if (type === "business") {
      candidates = candidates.filter(p => hybrid ? p.name.includes("Гібридна") : p.name.includes("Мережева"));
    }

    candidates = candidates
      .map(p => ({ ...p, _kw: parseKw(p.power) }))
      .filter(p => p._kw != null)
      .sort((a,b) => a._kw - b._kw);

    let match = candidates.find(p => p._kw >= calcPower);
    if (!match && candidates.length) match = candidates[candidates.length-1];
    return match || null;
  };

  const calculate = (creditVal) => {
    const bill = parseFloat(data.bill) || 0;
    const rawPower = Math.ceil(bill / 4.32 / 30 / 4);
    let power;
    if (data.type === "business") power = Math.max(30, rawPower);
    else power = Math.max(5, Math.min(rawPower, 15));

    const adj = computeAdjustments();
    power = Math.ceil((power / adj.genEfficiency) * adj.powerMultiplier);

    const isBusiness = data.type === "business";
    const hybrid = isBusiness ? (data.businessSystem !== "network") : true;

    // Шукаємо найближчий реальний товар у каталозі
    const matched = findMatchingProduct(power, data.type, hybrid);
    const isOversized = isBusiness && matched && matched._kw < power; // потужність більша за максимум каталогу

    const matchedPower = matched ? matched._kw : power;
    const pricePerKw = getPricePerKw(data.type, power, hybrid);
    const cost = matched ? matched.price : Math.round(power * pricePerKw * adj.costMultiplier);

    const savingPercent = adj.selfConsumption + (1 - adj.selfConsumption) * (adj.sellPrice / RETAIL);
    const savingMonth = bill * savingPercent;
    const payback = isBusiness ? Math.max(1.5, cost / (savingMonth * 12)) : cost / (savingMonth * 12);
    const saving25 = savingMonth * 12 * 25;

    setData(d => ({ ...d, credit: creditVal, hybrid }));
    setResult({
      power: matchedPower, cost, savingMonth, payback, saving25, bill,
      savingPercent: Math.round(savingPercent * 100), hybrid,
      productName: matched ? matched.name : null,
      productId: matched ? matched.id : null,
      isOversized,
    });
    setStep(STEPS.length + 1); // результат
  };

  const optBtn = (active) => ({
    background: active?"rgba(34,197,94,.1)":"rgba(255,255,255,.04)",
    border: `1.5px solid ${active?"#22C55E":"rgba(255,255,255,.1)"}`,
    borderRadius:14, padding:"13px 16px", cursor:"pointer", width:"100%",
    color:"#fff", fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:500,
    display:"flex", alignItems:"center", gap:12, textAlign:"left", transition:"all .2s"
  });

  const goBack = () => setStep(s => Math.max(1, s-1));
  const goNext = () => setStep(s => s+1);

  const resetAll = () => {
    setMode(null); setStep(1);
    setData({ type:"", bill:"", credit:false, businessSystem:"hybrid",
      nightLoad:null, peopleHome:null, orientation:null, roofType:null,
      shading:null, roofArea:"", taxStatus:null, region:null, futureLoad:null });
    setResult(null); setShowConsult(false); setSent(false); setPhone("");
  };

  /* ══ Генерик-рендер для додаткових питань Точного режиму ══ */
  const renderQuestionStep = (qKey, dataField) => {
    const q = EXTRA_QUESTIONS[qKey];
    return (
      <div>
        <button onClick={goBack} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",cursor:"pointer",fontSize:12,marginBottom:14,display:"flex",alignItems:"center",gap:5,padding:0,fontFamily:"DM Sans,sans-serif"}}>← Назад</button>
        <h3 style={{color:"#fff",fontSize:19,marginBottom:5,fontFamily:"Syne,sans-serif",fontWeight:800,whiteSpace:"pre-line"}}>{q.title}</h3>
        <p style={{color:"rgba(255,255,255,.4)",fontSize:13,marginBottom:16}}>{q.subtitle}</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {q.options.map(o=>(
            <button key={o.val} style={optBtn(data[dataField]===o.val)} onClick={()=>{ setData(d=>({...d,[dataField]:o.val})); setTimeout(goNext,200); }}>
              <span style={{fontSize:20}}>{o.icon}</span>
              <div><div style={{fontWeight:700}}>{o.label}</div><div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:1}}>{o.sub}</div></div>
              {data[dataField]===o.val&&<span style={{marginLeft:"auto",color:"#22C55E"}}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div ref={calcCardRef} style={{ maxWidth:480, margin:"0 auto" }}>
      <div style={{ background:"rgba(255,255,255,.04)", borderRadius:24, padding:"clamp(20px,4vw,32px)", border:"1px solid rgba(255,255,255,.08)" }}>

        {/* ══ ВИБІР РЕЖИМУ ══ */}
        {mode === null && (
          <div>
            <h3 style={{color:"#fff",fontSize:19,marginBottom:5,fontFamily:"Syne,sans-serif",fontWeight:800}}>Оберіть формат<br/><span style={{color:"#22C55E"}}>розрахунку</span></h3>
            <p style={{color:"rgba(255,255,255,.4)",fontSize:13,marginBottom:18}}>Швидко — орієнтовно. Точно — детальніше</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <button onClick={()=>{ setMode("quick"); setStep(1); }}
                style={{background:"rgba(34,197,94,.08)",border:"1.5px solid rgba(34,197,94,.3)",borderRadius:16,padding:"18px",cursor:"pointer",textAlign:"left",color:"#fff",minHeight:90}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <span style={{fontSize:24}}>⚡</span>
                  <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16}}>Швидко</span>
                </div>
                <p style={{fontSize:12,color:"rgba(255,255,255,.5)",margin:0}}>3 запитання · ~20 секунд · орієнтовний результат</p>
              </button>
              <button onClick={()=>{ setMode("precise"); setStep(1); }}
                style={{background:"rgba(245,197,24,.08)",border:"1.5px solid rgba(245,197,24,.3)",borderRadius:16,padding:"18px",cursor:"pointer",textAlign:"left",color:"#fff",minHeight:90}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <span style={{fontSize:24}}>🎯</span>
                  <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16}}>Точно</span>
                </div>
                <p style={{fontSize:12,color:"rgba(255,255,255,.5)",margin:0}}>12 запитань · ~2 хвилини · максимально точний результат</p>
              </button>
            </div>
          </div>
        )}

        {/* ══ ПРОГРЕС-БАР ══ */}
        {mode !== null && step <= totalSteps && (
          <div style={{ marginBottom:22 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
              <span style={{ color:"rgba(255,255,255,.35)",fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase" }}>Крок {step} з {totalSteps}</span>
              <span style={{ color:"#22C55E",fontSize:11,fontWeight:700 }}>{Math.round(step/totalSteps*100)}%</span>
            </div>
            <div style={{ height:3,background:"rgba(255,255,255,.08)",borderRadius:2,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${step/totalSteps*100}%`,background:"linear-gradient(90deg,#22C55E,#F5C518)",borderRadius:2,transition:"width .5s" }}/>
            </div>
          </div>
        )}

        {/* ══ КРОК: ТИП ОБ'ЄКТУ ══ */}
        {mode !== null && stepKey === "type" && (
          <div>
            <h3 style={{ color:"#fff",fontSize:19,marginBottom:5,fontFamily:"Syne,sans-serif",fontWeight:800 }}>Що хочете<br/><span style={{color:"#22C55E"}}>забезпечити енергією?</span></h3>
            <p style={{ color:"rgba(255,255,255,.4)",fontSize:13,marginBottom:16 }}>Оберіть тип об'єкту</p>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {[
                {val:"house",icon:"🏠",label:"Приватний будинок",sub:"Гібридна, 5–15 кВт"},
                {val:"apartment",icon:"🏢",label:"Квартира / офіс",sub:"Гібридна, малий АКБ"},
                {val:"business",icon:"🏭",label:"Підприємство / бізнес",sub:"від 30 кВт"},
                {val:"dacha",icon:"🌿",label:"Дача / котедж",sub:"Гібридна, малий АКБ"},
              ].map(o=>(
                <button key={o.val} style={optBtn(data.type===o.val)} onClick={()=>{
                  setData({...data,type:o.val});
                  if (o.val !== "business") setTimeout(goNext,250);
                }}>
                  <span style={{fontSize:20}}>{o.icon}</span>
                  <div><div style={{fontWeight:700}}>{o.label}</div><div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:1}}>{o.sub}</div></div>
                  {data.type===o.val&&<span style={{marginLeft:"auto",color:"#22C55E"}}>✓</span>}
                </button>
              ))}
            </div>
            {data.type === "business" && (
              <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid rgba(255,255,255,.08)"}}>
                <p style={{color:"rgba(255,255,255,.5)",fontSize:12,marginBottom:10,fontWeight:600}}>Який тип станції?</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    {val:"hybrid",icon:"🔋",label:"Гібридна (з АКБ)",sub:"Працює і без світла — рекомендовано"},
                    {val:"network",icon:"🔌",label:"Мережева (бюджет)",sub:"Дешевше, але без резерву"},
                  ].map(s=>(
                    <button key={s.val} style={optBtn(data.businessSystem===s.val)} onClick={()=>{ setData(d=>({...d,businessSystem:s.val})); setTimeout(goNext,250); }}>
                      <span style={{fontSize:20}}>{s.icon}</span>
                      <div><div style={{fontWeight:700}}>{s.label}</div><div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:1}}>{s.sub}</div></div>
                      {data.businessSystem===s.val&&<span style={{marginLeft:"auto",color:"#22C55E"}}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ ДОДАТКОВІ КРОКИ ТОЧНОГО РЕЖИМУ ══ */}
        {stepKey === "nightLoad" && renderQuestionStep("nightLoad","nightLoad")}
        {stepKey === "peopleHome" && renderQuestionStep("peopleHome","peopleHome")}
        {stepKey === "orientation" && renderQuestionStep("orientation","orientation")}
        {stepKey === "roofType" && renderQuestionStep("roofType","roofType")}
        {stepKey === "shading" && renderQuestionStep("shading","shading")}
        {stepKey === "taxStatus" && renderQuestionStep("taxStatus","taxStatus")}
        {stepKey === "region" && renderQuestionStep("region","region")}
        {stepKey === "futureLoad" && renderQuestionStep("futureLoad","futureLoad")}

        {/* ══ КРОК: ПЛОЩА ДАХУ (тільки Точний) ══ */}
        {stepKey === "roofArea" && (
          <div>
            <button onClick={goBack} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",cursor:"pointer",fontSize:12,marginBottom:14,display:"flex",alignItems:"center",gap:5,padding:0,fontFamily:"DM Sans,sans-serif"}}>← Назад</button>
            <h3 style={{color:"#fff",fontSize:19,marginBottom:5,fontFamily:"Syne,sans-serif",fontWeight:800}}>Доступна площа<br/><span style={{color:"#22C55E"}}>даху (м²)?</span></h3>
            <p style={{color:"rgba(255,255,255,.4)",fontSize:13,marginBottom:14}}>Орієнтовно, 1 панель ≈ 2.5 м²</p>
            <div style={{position:"relative",marginBottom:18}}>
              <input type="number" placeholder="Наприклад: 60" value={data.roofArea} onChange={e=>setData({...data,roofArea:e.target.value})}
                onKeyDown={e=>e.key==="Enter"&&goNext()}
                style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:12,padding:"13px 16px",color:"#fff",fontFamily:"DM Sans,sans-serif",fontSize:15,outline:"none"}}
                onFocus={e=>e.target.style.borderColor="#22C55E"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.12)"}/>
              <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,.3)",fontSize:13}}>м²</span>
            </div>
            <button onClick={goNext} className="btn-green" style={{width:"100%",justifyContent:"center",padding:"13px"}}>
              {data.roofArea ? "Далі →" : "Пропустити →"}
            </button>
          </div>
        )}

        {/* ══ КРОК: РАХУНОК ══ */}
        {stepKey === "bill" && (
          <div>
            <button onClick={goBack} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",cursor:"pointer",fontSize:12,marginBottom:14,display:"flex",alignItems:"center",gap:5,padding:0,fontFamily:"DM Sans,sans-serif"}}>← Назад</button>
            <h3 style={{color:"#fff",fontSize:19,marginBottom:5,fontFamily:"Syne,sans-serif",fontWeight:800}}>Скільки платите<br/><span style={{color:"#22C55E"}}>за електрику щомісяця?</span></h3>
            <p style={{color:"rgba(255,255,255,.4)",fontSize:13,marginBottom:14}}>Розрахуємо точну економію для вас</p>
            <div style={{position:"relative",marginBottom:10}}>
              <input type="number" placeholder="Наприклад: 2000" value={data.bill} onChange={e=>setData({...data,bill:e.target.value})}
                onKeyDown={e=>e.key==="Enter"&&data.bill&&goNext()}
                style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:12,padding:"13px 16px",color:"#fff",fontFamily:"DM Sans,sans-serif",fontSize:15,outline:"none"}}
                onFocus={e=>e.target.style.borderColor="#22C55E"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.12)"}/>
              <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,.3)",fontSize:13}}>₴/міс</span>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
              {["500","1000","2000","5000","10000","25000","50000"].map(v=>(
                <button key={v} onClick={()=>setData({...data,bill:v})}
                  style={{padding:"6px 12px",borderRadius:100,border:`1.5px solid ${data.bill===v?"#22C55E":"rgba(255,255,255,.1)"}`,background:data.bill===v?"rgba(34,197,94,.1)":"transparent",color:data.bill===v?"#22C55E":"rgba(255,255,255,.4)",cursor:"pointer",fontSize:12,fontFamily:"DM Sans,sans-serif",fontWeight:600,transition:"all .2s"}}>
                  {v} ₴
                </button>
              ))}
            </div>
            <button disabled={!data.bill} onClick={goNext} className="btn-green" style={{width:"100%",justifyContent:"center",padding:"13px",opacity:data.bill?1:.4,cursor:data.bill?"pointer":"default"}}>
              Далі →
            </button>
          </div>
        )}

        {/* ══ КРОК: ОПЛАТА ══ */}
        {stepKey === "payment" && (
          <div>
            <button onClick={goBack} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",cursor:"pointer",fontSize:12,marginBottom:14,display:"flex",alignItems:"center",gap:5,padding:0,fontFamily:"DM Sans,sans-serif"}}>← Назад</button>
            <h3 style={{color:"#fff",fontSize:19,marginBottom:5,fontFamily:"Syne,sans-serif",fontWeight:800}}>Як плануєте<br/><span style={{color:"#22C55E"}}>оплатити систему?</span></h3>
            <p style={{color:"rgba(255,255,255,.4)",fontSize:13,marginBottom:16}}>Підберемо найвигіднішу схему</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {val:false,icon:"💰",label:"Повна оплата",sub:"Знижка 5%"},
                {val:"0",icon:"🏦",label:"Кредит 0% для дому",sub:"Держпрограма"},
                {val:"biz",icon:"📊",label:"Кредит 5-7-9% для бізнесу",sub:"До 150 млн грн"},
                {val:"parts",icon:"📅",label:"Розстрочка",sub:"36 міс. без переплат"},
              ].map(o=>(
                <button key={String(o.val)} style={optBtn(data.credit===o.val)} onClick={()=>calculate(o.val)}>
                  <span style={{fontSize:20}}>{o.icon}</span>
                  <div><div style={{fontWeight:700}}>{o.label}</div><div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:1}}>{o.sub}</div></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ РЕЗУЛЬТАТ ══ */}
        {step === totalSteps+1 && result && !showConsult && (
          <div>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(34,197,94,.12)",border:"2px solid #22C55E",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
                <Check size={22} color="#22C55E"/>
              </div>
              <h3 style={{color:"#fff",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,marginBottom:3}}>Ваш розрахунок готовий!</h3>
              <p style={{color:"rgba(255,255,255,.4)",fontSize:12}}>
                {result.hybrid ? "Гібридна система" : "Мережева система"} · {mode==="precise"?"Точний розрахунок":"Орієнтовний розрахунок"}
              </p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {[
                {l:"Потужність",v:`${result.power} кВт`,c:"#22C55E"},
                {l:"Вартість",v:`${result.cost.toLocaleString()} ₴`,c:"#F5C518"},
                {l:"Економія/міс",v:`~${Math.round(result.savingMonth).toLocaleString()} ₴ (${result.savingPercent}%)`,c:"#22C55E"},
                {l:"Окупність",v:`${result.payback.toFixed(1)} р.`,c:"#F5C518"},
              ].map(x=>(
                <div key={x.l} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(34,197,94,.12)",borderRadius:12,padding:"14px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.35)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>{x.l}</div>
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16,color:x.c}}>{x.v}</div>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.18)",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:2}}>💰 Заощадите за 25 років</div>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,color:"#22C55E"}}>~{Math.round(result.saving25/1000)}K ₴</div>
              </div>
              <span style={{fontSize:26}}>☀️</span>
            </div>

            {result.productName && (
              <div style={{background:"rgba(245,197,24,.08)",border:"1px solid rgba(245,197,24,.25)",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                <div style={{fontSize:10,color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>📦 Підходяща позиція з каталогу</div>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,color:"#fff",marginBottom:8}}>{result.productName}</div>
                {result.isOversized && (
                  <p style={{fontSize:11,color:"#F5C518",marginBottom:8,lineHeight:1.5}}>⚠️ Ваша потреба перевищує цей пакет — точну конфігурацію розрахує інженер</p>
                )}
                <button onClick={onOpenShop} style={{width:"100%",padding:"9px",borderRadius:100,border:"1.5px solid #F5C518",background:"transparent",color:"#F5C518",fontSize:12,fontWeight:700,fontFamily:"DM Sans,sans-serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  🛒 Переглянути в магазині
                </button>
              </div>
            )}

            <button className="btn-green" style={{width:"100%",justifyContent:"center",padding:"13px",textTransform:"uppercase"}} onClick={()=>setShowConsult(true)}>
              📞 Отримати точний розрахунок
            </button>
            <button onClick={resetAll}
              style={{width:"100%",marginTop:8,padding:"8px",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.3)",fontSize:12,fontFamily:"DM Sans,sans-serif"}}>
              ↺ Розрахувати знову
            </button>
          </div>
        )}

        {step === totalSteps+1 && result && showConsult && !sent && (
          <div>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{fontSize:36,marginBottom:8}}>📞</div>
              <h3 style={{color:"#fff",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,marginBottom:4}}>Залиште номер</h3>
              <p style={{color:"rgba(255,255,255,.4)",fontSize:13}}>Передзвонимо протягом 30 секунд</p>
            </div>
            <div style={{background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.12)",borderRadius:12,padding:"10px",marginBottom:14,display:"flex",justifyContent:"space-around"}}>
              {[{l:"Потужність",v:`${result.power} кВт`},{l:"Вартість",v:`${result.cost.toLocaleString()} ₴`},{l:"Окупність",v:`${result.payback.toFixed(1)} р.`}].map(x=>(
                <div key={x.l} style={{textAlign:"center"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>{x.l}</div>
                  <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,color:"#22C55E"}}>{x.v}</div>
                </div>
              ))}
            </div>
            <input type="tel" placeholder="+380 96 203 38 39" value={phone}
              onChange={e=>{ setPhone(e.target.value); setPhoneError(false); }}
              style={{width:"100%",background:"rgba(255,255,255,.06)",border:`1.5px solid ${phoneError?"#EF4444":"rgba(34,197,94,.3)"}`,borderRadius:12,padding:"13px 16px",color:"#fff",fontFamily:"DM Sans,sans-serif",fontSize:15,outline:"none",marginBottom:phoneError?4:10}}
              onFocus={e=>e.target.style.borderColor="#22C55E"} onBlur={e=>e.target.style.borderColor=phoneError?"#EF4444":"rgba(34,197,94,.3)"}/>
            {phoneError && <p style={{fontSize:11,color:"#FCA5A5",marginBottom:8}}>Введіть коректний номер телефону (наприклад, +380961234567)</p>}
            <p style={{fontSize:11,color:"rgba(255,255,255,.25)",marginBottom:12,textAlign:"center"}}>🔒 Без спаму. Тільки один дзвінок від менеджера.</p>
            <button className="btn-green" disabled={!phone || sendingTg} onClick={async ()=>{
                if (!isValidPhone(phone)) { setPhoneError(true); return; }
                setTgError(null);
                setSendingTg(true);
                const typeLabels = { house:"🏠 Приватний будинок", apartment:"🏢 Квартира/офіс", business:"🏭 Підприємство/бізнес", dacha:"🌿 Дача/котедж" };
                const creditLabels = { false:"Повна оплата", "0":"Кредит 0% (дім)", "biz":"Кредит 5-7-9% (бізнес)", "parts":"Розстрочка" };
                const msg = `🔆 <b>НОВА ЗАЯВКА — КАЛЬКУЛЯТОР (${mode==="precise"?"Точний":"Швидкий"})</b>\n\n`
                  + `👤 Тип об'єкту: ${typeLabels[data.type] || data.type}\n`
                  + `🔋 Система: ${result.hybrid ? "Гібридна" : "Мережева"}\n`
                  + `💡 Рахунок за світло: ${result.bill} ₴/міс\n`
                  + `⚡ Потужність СЕС: ${result.power} кВт\n`
                  + `💰 Вартість: ${result.cost.toLocaleString()} ₴\n`
                  + `📉 Економія: ~${Math.round(result.savingMonth).toLocaleString()} ₴/міс (${result.savingPercent}%)\n`
                  + `📅 Окупність: ${result.payback.toFixed(1)} років\n`
                  + `💳 Спосіб оплати: ${creditLabels[String(data.credit)] || "—"}\n\n`
                  + `📞 <b>Телефон: ${escapeHtml(phone)}</b>`;
                saveLead({ type:"calculator", phone, amount:result.cost, details:`${typeLabels[data.type]||data.type} · ${result.power} кВт · economy ${result.savingPercent}%` });
                const res = await sendToTelegram(msg);
                setSendingTg(false);
                if (res.ok) { trackLead({ content_name: "calculator", value: result.cost, currency: "UAH" }); setSent(true); }
                else { setTgError(res.error); }
              }}
              style={{width:"100%",justifyContent:"center",padding:"13px",textTransform:"uppercase",opacity:(phone && !sendingTg)?1:.85, animation: sendingSlow ? "slowBlink 0.9s ease-in-out infinite" : "none", color: sendingSlow ? "#1A1A1A" : "#fff"}}>
              {sendingSlow ? "⏳ Ще трохи..." : sendingTg ? "Надсилаємо..." : "✅ Передзвоніть мені"}
            </button>
            {tgError && (
              <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:10, fontSize:12, color:"#FCA5A5" }}>
                ⚠️ Помилка надсилання в Telegram: {tgError}
              </div>
            )}
            <button onClick={()=>setShowConsult(false)}
              style={{width:"100%",marginTop:8,padding:"8px",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.3)",fontSize:12,fontFamily:"DM Sans,sans-serif"}}>← Назад</button>
          </div>
        )}

        {sent && (
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:44,marginBottom:12}}>🎉</div>
            <h3 style={{color:"#fff",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,marginBottom:8}}>Дякуємо!</h3>
            <p style={{color:"rgba(255,255,255,.55)",fontSize:14,lineHeight:1.7,marginBottom:18}}>
              Наш менеджер зателефонує вам<br/>протягом <strong style={{color:"#22C55E"}}>30 секунд</strong> 📞
            </p>
            <a href="tel:+380962033839" style={{display:"inline-flex",alignItems:"center",gap:8,background:"#22C55E",color:"#fff",borderRadius:100,padding:"12px 24px",textDecoration:"none",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:14,marginBottom:12}}>
              <Phone size={16}/> +38 (096) 203 38 39
            </a><br/>
            <button onClick={resetAll}
              style={{marginTop:10,padding:"8px 18px",background:"none",border:"1px solid rgba(255,255,255,.15)",borderRadius:100,cursor:"pointer",color:"rgba(255,255,255,.4)",fontSize:12,fontFamily:"DM Sans,sans-serif"}}>
              ↺ Розрахувати знову
            </button>
          </div>
        )}

      </div>
      <p style={{textAlign:"center",color:"rgba(255,255,255,.2)",fontSize:11,marginTop:10}}>
        * Розрахунок орієнтовний. Точна ціна — після консультації інженера.
      </p>
    </div>
  );
}



/* ══════════════════════════════════════════════════════════════
   АДМІНКА — вхід без публічної реєстрації, керування заявками і товарами
   Доступ: sunpower-ua.vercel.app/?admin=1
   ══════════════════════════════════════════════════════════════ */

function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username || !password) { setError("Вкажіть логін і пароль"); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.ok) onSuccess();
      else setError(data.error || "Помилка входу");
    } catch (e) {
      setLoading(false);
      setError("Помилка мережі");
    }
  };

  return (
    <div style={{ minHeight:"100vh",background:"#0A0A08",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"DM Sans,sans-serif" }}>
      <div style={{ width:"100%",maxWidth:380,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",borderRadius:24,padding:"32px 28px" }}>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <Logo size={48}/>
          <h2 style={{ color:"#fff",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,marginTop:14,marginBottom:4 }}>Вхід в адмінку</h2>
          <p style={{ color:"rgba(255,255,255,.4)",fontSize:13 }}>Sun Power UA · захищена зона</p>
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,.5)",display:"block",marginBottom:6 }}>ЛОГІН</label>
          <input type="text" value={username} onChange={e=>setUsername(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            style={{ width:"100%",background:"rgba(255,255,255,.06)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:12,padding:"12px 14px",color:"#fff",fontSize:14,outline:"none" }}
            onFocus={e=>e.target.style.borderColor="#22C55E"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.12)"}/>
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,.5)",display:"block",marginBottom:6 }}>ПАРОЛЬ</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            style={{ width:"100%",background:"rgba(255,255,255,.06)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:12,padding:"12px 14px",color:"#fff",fontSize:14,outline:"none" }}
            onFocus={e=>e.target.style.borderColor="#22C55E"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.12)"}/>
        </div>
        {error && <p style={{ fontSize:12,color:"#FCA5A5",marginBottom:14,textAlign:"center" }}>{error}</p>}
        <button onClick={submit} disabled={loading} className="btn-green" style={{ width:"100%",justifyContent:"center",padding:"13px",opacity:loading?.7:1 }}>
          {loading ? "Перевірка..." : "Увійти"}
        </button>
        <p style={{ textAlign:"center",fontSize:11,color:"rgba(255,255,255,.25)",marginTop:16 }}>🔒 Захищене з'єднання · без публічної реєстрації</p>
      </div>
    </div>
  );
}

const LEAD_STATUS = {
  new:         { label:"Новий",    color:"#22C55E", bg:"rgba(34,197,94,.1)" },
  in_progress: { label:"В роботі", color:"#F5C518", bg:"rgba(245,197,24,.12)" },
  closed:      { label:"Закрито",  color:"#9CA3AF", bg:"rgba(156,163,175,.12)" },
};
const LEAD_TYPE_LABEL = {
  shop_order: "🛒 Замовлення",
  calculator: "🔆 Калькулятор",
  contact_form: "📩 Зворотний дзвінок",
  other: "📋 Інше",
};

function AdminLeadsTab() {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const load = () => {
    setError(null);
    fetch("/api/leads")
      .then(r => r.json())
      .then(d => { if (d.ok) setLeads(d.leads); else setError(d.error || "Помилка завантаження"); })
      .catch(() => setError("Помилка мережі"));
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    setLeads(prev => prev.map(l => l.id===id ? {...l, status} : l));
    try {
      await fetch("/api/leads", { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id, status }) });
    } catch {}
  };

  const removeLead = async (id) => {
    setLeads(prev => prev.filter(l => l.id!==id));
    try {
      await fetch("/api/leads", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id }) });
    } catch {}
  };

  if (leads === null && !error) {
    return <div style={{ textAlign:"center",padding:"60px 0",color:"var(--sub)" }}>Завантаження заявок...</div>;
  }
  if (error) {
    return (
      <div style={{ textAlign:"center",padding:"40px 20px" }}>
        <p style={{ color:"#EF4444",marginBottom:12 }}>{error}</p>
        <p style={{ fontSize:13,color:"var(--sub)" }}>Можливо, база даних (Vercel KV) ще не підключена в Environment Variables.</p>
        <button onClick={load} className="btn-outline-green" style={{ marginTop:16 }}>Спробувати знову</button>
      </div>
    );
  }

  const filtered = filterStatus==="all" ? leads : leads.filter(l => l.status===filterStatus);
  const counts = { all: leads.length, new: leads.filter(l=>l.status==="new").length, in_progress: leads.filter(l=>l.status==="in_progress").length, closed: leads.filter(l=>l.status==="closed").length };

  return (
    <div>
      <div style={{ display:"flex",gap:8,marginBottom:18,flexWrap:"wrap" }}>
        {[["all","Всі"],["new","Нові"],["in_progress","В роботі"],["closed","Закриті"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilterStatus(k)}
            style={{ padding:"7px 14px",borderRadius:100,border:`1.5px solid ${filterStatus===k?"#22C55E":"var(--border)"}`,background:filterStatus===k?"rgba(34,197,94,.08)":"#fff",color:filterStatus===k?"#14532D":"#555",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif" }}>
            {l} ({counts[k]})
          </button>
        ))}
      </div>
      {filtered.length===0 ? (
        <div style={{ textAlign:"center",padding:"60px 0",color:"var(--sub)" }}>Заявок немає</div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {filtered.map(lead => {
            const st = LEAD_STATUS[lead.status] || LEAD_STATUS.new;
            return (
              <div key={lead.id} style={{ background:"#fff",border:"1px solid var(--border)",borderRadius:14,padding:16 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:8 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:11,color:"var(--sub)",marginBottom:3 }}>{LEAD_TYPE_LABEL[lead.type] || lead.type} · {new Date(lead.createdAt).toLocaleString("uk-UA")}</div>
                    <div style={{ fontWeight:700,fontSize:15 }}>{lead.name || "Без імені"}</div>
                    <a href={`tel:${lead.phone}`} style={{ color:"#22C55E",fontSize:14,fontWeight:600,textDecoration:"none" }}>{lead.phone}</a>
                  </div>
                  <span style={{ flexShrink:0,padding:"4px 10px",borderRadius:100,fontSize:11,fontWeight:700,color:st.color,background:st.bg }}>{st.label}</span>
                </div>
                {lead.amount!=null && <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16,color:"#22C55E",marginBottom:6 }}>{lead.amount.toLocaleString()} ₴</div>}
                {lead.details && <p style={{ fontSize:13,color:"var(--sub)",marginBottom:10,lineHeight:1.5 }}>{lead.details}</p>}
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  {Object.entries(LEAD_STATUS).map(([k,v])=>(
                    <button key={k} onClick={()=>updateStatus(lead.id,k)}
                      style={{ padding:"5px 10px",borderRadius:8,border:`1.5px solid ${lead.status===k?v.color:"var(--border)"}`,background:lead.status===k?v.bg:"#fff",color:lead.status===k?v.color:"var(--sub)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif" }}>
                      {v.label}
                    </button>
                  ))}
                  <button onClick={()=>removeLead(lead.id)} style={{ marginLeft:"auto",padding:"5px 10px",borderRadius:8,border:"1.5px solid #FEE2E2",background:"#FEF2F2",color:"#EF4444",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif" }}>
                    Видалити
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminProductsTab() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.products.length > 0) setItems(d.products);
        else setItems(SEED_PRODUCTS);
      })
      .catch(() => setError("Помилка мережі"));
  }, []);

  const updateField = (id, field, value) => {
    setItems(prev => prev.map(p => p.id===id ? {...p, [field]: value} : p));
  };

  const removeItem = (id) => setItems(prev => prev.filter(p => p.id!==id));

  const addItem = () => {
    const newId = Math.max(0, ...items.map(p=>p.id)) + 1;
    setItems(prev => [...prev, {
      id:newId, cat:"Економ", name:"Новий товар", price:10000, oldPrice:null, mountUAH:0,
      img:null, imgSrc:null, badge:null, rating:4.8, reviews:0, power:"5 кВт",
      warranty:"5 років", brand:"Sun Power UA", desc:"Опис товару",
      panelName:"—", invName:"—", akbName:"—", specs:{panel:[],inverter:[],akb:[]},
    }]);
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/products", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ products: items }),
      });
      const data = await res.json();
      setSaving(false);
      if (data.ok) setSaveMsg({ ok:true, text:`Збережено ${data.count} товарів` });
      else setSaveMsg({ ok:false, text: data.error || "Помилка збереження" });
    } catch (e) {
      setSaving(false);
      setSaveMsg({ ok:false, text:"Помилка мережі" });
    }
  };

  if (error) return <div style={{ textAlign:"center",padding:"40px 0",color:"#EF4444" }}>{error}</div>;
  if (items === null) return <div style={{ textAlign:"center",padding:"60px 0",color:"var(--sub)" }}>Завантаження каталогу...</div>;

  return (
    <div>
      <div style={{ position:"sticky",top:0,background:"#F5F5F5",zIndex:5,padding:"4px 0 14px",display:"flex",gap:10,alignItems:"center" }}>
        <button onClick={addItem} className="btn-outline-green" style={{ fontSize:13,padding:"9px 16px" }}>+ Додати товар</button>
        <button onClick={save} disabled={saving} className="btn-green" style={{ fontSize:13,padding:"9px 16px",opacity:saving?.7:1 }}>
          {saving ? "Зберігаємо..." : "💾 Зберегти всі зміни"}
        </button>
        <span style={{ fontSize:12,color:"var(--sub)",marginLeft:"auto" }}>{items.length} товарів</span>
      </div>
      {saveMsg && (
        <div style={{ padding:"10px 14px",borderRadius:10,marginBottom:14,fontSize:13,fontWeight:600,
          background: saveMsg.ok ? "#F0FDF4" : "#FEF2F2", color: saveMsg.ok ? "#15803D" : "#EF4444" }}>
          {saveMsg.ok ? "✅ " : "⚠️ "}{saveMsg.text}
        </div>
      )}
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {items.map(p => (
          <div key={p.id} style={{ background:"#fff",border:"1px solid var(--border)",borderRadius:14,padding:14 }}>
            <div style={{ display:"grid",gridTemplateColumns:"1fr",gap:8,marginBottom:8 }}>
              <input value={p.name} onChange={e=>updateField(p.id,"name",e.target.value)}
                style={{ fontWeight:700,fontSize:14,padding:"8px 10px",border:"1.5px solid var(--border)",borderRadius:8,fontFamily:"DM Sans,sans-serif" }}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
              <select value={p.cat} onChange={e=>updateField(p.id,"cat",e.target.value)}
                style={{ padding:"8px 10px",border:"1.5px solid var(--border)",borderRadius:8,fontSize:13,fontFamily:"DM Sans,sans-serif" }}>
                {SHOP_CATS.filter(c=>c!=="Всі").map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <input value={p.power} onChange={e=>updateField(p.id,"power",e.target.value)} placeholder="Потужність"
                style={{ padding:"8px 10px",border:"1.5px solid var(--border)",borderRadius:8,fontSize:13,fontFamily:"DM Sans,sans-serif" }}/>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8 }}>
              <div style={{ position:"relative" }}>
                <input type="number" value={p.price} onChange={e=>updateField(p.id,"price",parseInt(e.target.value)||0)}
                  style={{ width:"100%",padding:"8px 10px",border:"1.5px solid #22C55E",borderRadius:8,fontSize:13,fontWeight:700,color:"#15803D",fontFamily:"DM Sans,sans-serif" }}/>
                <span style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"var(--sub)" }}>₴</span>
              </div>
              <input value={p.warranty} onChange={e=>updateField(p.id,"warranty",e.target.value)} placeholder="Гарантія"
                style={{ padding:"8px 10px",border:"1.5px solid var(--border)",borderRadius:8,fontSize:13,fontFamily:"DM Sans,sans-serif" }}/>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:11,color:"#aaa" }}>ID: {p.id}</span>
              <button onClick={()=>removeItem(p.id)} style={{ padding:"5px 12px",borderRadius:8,border:"1.5px solid #FEE2E2",background:"#FEF2F2",color:"#EF4444",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif" }}>
                Видалити товар
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:16,textAlign:"center" }}>
        <button onClick={save} disabled={saving} className="btn-green" style={{ padding:"12px 24px" }}>
          {saving ? "Зберігаємо..." : "💾 Зберегти всі зміни"}
        </button>
      </div>
    </div>
  );
}

function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState("leads");
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = async () => {
    setLoggingOut(true);
    try { await fetch("/api/admin-logout", { method:"POST" }); } catch {}
    setLoggingOut(false);
    onLogout();
  };
  return (
    <div style={{ minHeight:"100vh",background:"#F5F5F5",fontFamily:"DM Sans,sans-serif" }}>
      <div style={{ background:"#1A1A1A",padding:"16px 20px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <Logo size={28}/>
            <span style={{ color:"#fff",fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15 }}>Адмін-панель</span>
          </div>
          <button onClick={logout} disabled={loggingOut} style={{ background:"rgba(255,255,255,.1)",border:"none",color:"#fff",padding:"8px 16px",borderRadius:100,fontSize:12,fontWeight:600,cursor:"pointer" }}>
            {loggingOut ? "..." : "Вийти"}
          </button>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          {[["leads","📋 Заявки"],["products","📦 Товари"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{ padding:"9px 16px",borderRadius:10,border:"none",background:tab===k?"#22C55E":"rgba(255,255,255,.08)",color:tab===k?"#fff":"rgba(255,255,255,.6)",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif" }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth:720,margin:"0 auto",padding:"24px 16px 60px" }}>
        {tab==="leads" ? <AdminLeadsTab/> : <AdminProductsTab/>}
      </div>
    </div>
  );
}

function AdminGate() {
  const [status, setStatus] = useState("checking");
  useEffect(() => {
    fetch("/api/admin-verify")
      .then(r => r.json())
      .then(d => setStatus(d.ok ? "authed" : "guest"))
      .catch(() => setStatus("guest"));
  }, []);
  if (status === "checking") {
    return (
      <div style={{ minHeight:"100vh",background:"#0A0A08",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <div style={{ width:32,height:32,border:"3px solid rgba(255,255,255,.15)",borderTopColor:"#22C55E",borderRadius:"50%",animation:"spin .8s linear infinite" }}/>
      </div>
    );
  }
  if (status === "authed") return <AdminPanel onLogout={()=>setStatus("guest")}/>;
  return <AdminLogin onSuccess={()=>setStatus("authed")}/>;
}


/* ══ MAIN ══ */
export default function SunPowerUA() {
  const isAdminRoute = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("admin") === "1";
  if (isAdminRoute) return <AdminGate/>;
  return <SunPowerUASite/>;
}

function SunPowerUASite() {
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer]     = useState(false);
  const [wordIdx, setWordIdx]   = useState(0);
  const [billing, setBilling]   = useState("home");
  const [openFaq, setOpenFaq]   = useState(null);
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [tgError, setTgError] = useState(null);
  const [sending, setSending]   = useState(false);
  const [sendingSlow, setSendingSlow] = useState(false);
  const [sent, setSent]         = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [cart, setCart]         = useState([]);
  const [products, setProducts] = useState(SEED_PRODUCTS); // живі дані з бази, з резервним каталогом
  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(d => { if (d.ok && Array.isArray(d.products) && d.products.length > 0) setProducts(d.products); })
      .catch(() => {}); // тихо лишаємось на SEED_PRODUCTS, якщо щось не так
  }, []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishOpen, setWishOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [wishText, setWishText] = useState("");
  const [wishContact, setWishContact] = useState("");
  const [wishSent, setWishSent] = useState(false);
  const [wishError, setWishError] = useState("");

  const heroRef = useRef(null);
  const WORDS = ["Чисту","Зелену","Вічну","Вашу","Незалежну"];
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  useEffect(() => {
    setupSEO();
    loadGoogleTags();
    loadMetaPixel();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      if(heroRef.current) heroRef.current.style.transform=`translateY(${window.scrollY*.26}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { const id=setInterval(()=>setWordIdx(i=>(i+1)%WORDS.length),2600); return ()=>clearInterval(id); }, []);
  useEffect(() => { document.body.style.overflow=shopOpen?"hidden":""; return ()=>{ document.body.style.overflow=""; }; }, [shopOpen]);

  useEffect(() => {
    if (!sending) { setSendingSlow(false); return; }
    const t = setTimeout(() => setSendingSlow(true), 2000);
    return () => clearTimeout(t);
  }, [sending]);

  const handleSend = async () => {
    if (!isValidPhone(phone)) { setPhoneError(true); return; }
    if (!checkRateLimit("contact", 3, 60000)) { setTgError("Забагато заявок. Спробуйте через хвилину."); return; }
    setTgError(null);
    setSending(true);
    const msg = `📩 <b>НОВА ЗАЯВКА — ФОРМА "ЗАЛИШИЛИСЬ ЗАПИТАННЯ"</b>\n\n📞 <b>Телефон: ${escapeHtml(phone)}</b>\n\n⚡ Передзвонити протягом 30 секунд`;
    saveLead({ type:"contact_form", phone, details:"Форма \"Залишились запитання\"" });
    const res = await sendToTelegram(msg);
    setSending(false);
    if (res.ok) { trackLead({ content_name: "contact_form" }); setSent(true); setEmail(""); setPhone(""); }
    else { setTgError(res.error); }
  };

  // Скрол до секції — з відступом під фіксовану шапку (інакше заголовок секції ховається під нею)
  const scrollTo = (id) => {
    setDrawer(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const headerOffset = 92; // висота фіксованої шапки + запас
      const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: Math.max(0, y), behavior:"smooth" });
    }, 100);
  };

  // Відкрити форму заявки (скрол до калькулятора)
  const openCalc = () => scrollTo("calculator");
  const openConsult = () => scrollTo("contact");

  const r1=useReveal(),r2=useReveal(),r3=useReveal(),r4=useReveal(),
        r5=useReveal(),r6=useReveal(),r7=useReveal(),r8=useReveal(),r9=useReveal();

  if(shopOpen) return (<><style>{CSS}</style><Shop cart={cart} setCart={setCart} products={products} onClose={()=>setShopOpen(false)}/></>);

  return (
    <>
      <style>{CSS}</style>

      {/* ══ HEADER — 3 іконки по центру ══ */}
      <header style={{ position:"fixed",top:0,left:0,right:0,zIndex:100, background:scrolled?"rgba(255,255,255,.98)":"rgba(10,10,6,.88)", backdropFilter:"blur(18px)", borderBottom:scrolled?"2px solid #22C55E":"1px solid rgba(255,255,255,.08)", transition:"all .4s cubic-bezier(.16,1,.3,1)", boxShadow:scrolled?"0 2px 16px rgba(34,197,94,.12)":"none", padding:scrolled?"2px 0":"0" }}>
        <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 clamp(12px,3vw,40px)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"clamp(8px,2vw,14px)",height:scrolled?56:64,transition:"height .35s cubic-bezier(.16,1,.3,1)" }}>

          {/* 🔰 Лого */}
          <div onClick={()=>setAboutOpen(true)} className="navbar-logo-btn" style={{ cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <img src={scrolled?ICON_LOGO:REAL_LOGO} alt="Sun.Power.Ua"
              style={{ height:scrolled?40:60, width:scrolled?40:60, objectFit:"contain", borderRadius:scrolled?0:6, transition:"all .35s cubic-bezier(.16,1,.3,1)" }}/>
          </div>

          {/* Кнопки праворуч */}
          <div style={{ display:"flex",alignItems:"center",gap:"clamp(5px,1.5vw,12px)",flexShrink:0 }}>
          {/* 📞 Зв'язок */}
          <button
            onClick={()=>setContactOpen(true)}
            style={{ width:42,height:42,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:"#22C55E",border:"none",cursor:"pointer",boxShadow:"0 4px 14px rgba(34,197,94,.35)",flexShrink:0 }}
            aria-label="Звʼязатися з нами">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.11 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.13 1 .37 1.97.72 2.9a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.18-1.18a2 2 0 012.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0122 16.92z"/>
            </svg>
          </button>

          {/* 🔍 Пошук */}
          <button
            onClick={()=>{ setSearchQuery(""); setSearchOpen(true); }}
            className="navicon-search"
            style={{ width:42,height:42,borderRadius:12,border:scrolled?"1.5px solid rgba(0,0,0,.12)":"1.5px solid rgba(255,255,255,.18)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .35s",background:"transparent",color:scrolled?"#333":"#fff",flexShrink:0 }}
            aria-label="Пошук">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* 💬 Побажання */}
          <button onClick={()=>{
              const last = localStorage.getItem("sunpower_wish_date");
              const today = new Date().toDateString();
              if (last === today) { setWishError("Ви вже залишали побажання сьогодні. Повертайтесь завтра! 🌞"); setWishOpen(true); return; }
              setWishError(""); setWishText(""); setWishContact(""); setWishSent(false); setWishOpen(true);
            }}
            className="navicon-wish"
            style={{ width:42,height:42,borderRadius:12,border:scrolled?"1.5px solid rgba(0,0,0,.12)":"1.5px solid rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:"transparent",cursor:"pointer",transition:"all .25s" }}
            title="Залишити побажання">
            <MessageCircle size={18} color={scrolled?"#1A1A1A":"#fff"}/>
          </button>

          {/* 🛒 Кошик */}
          <button
            onClick={()=>setShopOpen(true)}
            className="navicon-cart"
            style={{ width:42,height:42,borderRadius:12,border:scrolled?"1.5px solid rgba(0,0,0,.12)":"1.5px solid rgba(255,255,255,.18)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .35s",background:"transparent",color:scrolled?"#333":"#fff",position:"relative",flexShrink:0,animation:"orderBlink 4s ease-in-out infinite" }}
            aria-label="Кошик">
            {cartCount === 0 ? (
              <svg viewBox="0 0 110 95" width="30" height="26" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 26 H25 L34 60 C35 64 38 66 42 66 H78 C82 66 84 63 85 60 L90 33 C90 30 88 28 85 28 H64"/>
                <path d="M56 26 V48 M50 43 L56 49 L62 43"/>
                <line x1="40" y1="78" x2="72" y2="78"/>
                <circle cx="35" cy="78" r="7"/><circle cx="77" cy="78" r="7"/>
              </svg>
            ) : (
              <svg viewBox="0 0 110 95" width="30" height="26" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 26 H25 L34 60 C35 64 38 66 42 66 H78 C82 66 84 63 85 60 L90 33 C90 30 88 28 85 28 H64"/>
                <line x1="40" y1="78" x2="72" y2="78"/>
                <circle cx="35" cy="78" r="7"/><circle cx="77" cy="78" r="7"/>
              </svg>
            )}
            {cartCount > 0 && (
              <span style={{ position:"absolute",top:-7,right:-7,minWidth:20,height:20,borderRadius:"50%",background:"#22C55E",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",border:"2.5px solid #fff",fontFamily:"DM Sans,sans-serif",lineHeight:1 }}>
                {cartCount}
              </span>
            )}
          </button>
          </div>{/* /кнопки */}

        </div>
      </header>

      {/* ══ DRAWER ══ */}
      <div className={`drawer ${drawer?"open":""}`}>
        <div className="drawer-overlay" onClick={()=>setDrawer(false)}/>
        <div className="drawer-panel">
          <div style={{ padding:"18px 22px 16px",borderBottom:"1px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:9 }}>
              <Logo size={36}/>
              <span style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:15,color:"#F5C518" }}>Sun.Power.Ua</span>
            </div>
            <button onClick={()=>setDrawer(false)} style={{ background:"none",border:"none",cursor:"pointer",padding:6,color:"rgba(255,255,255,.6)",display:"flex" }}><X size={20}/></button>
          </div>
          <div style={{ padding:"12px 16px 8px" }}>
            <p style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"rgba(255,255,255,.35)",marginBottom:8,paddingLeft:6 }}>НАВІГАЦІЯ</p>
            {[
              { label:"Послуги", id:"services" },
              { label:"Проєкти", id:"projects" },
              { label:"Партнери", id:"partners" },
              { label:"Ціни", id:"pricing" },
              { label:"Відгуки", id:"reviews" },
              { label:"Контакти", id:"contact" },
            ].map(l=>(
              <button key={l.label} onClick={()=>scrollTo(l.id)} style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 10px",borderRadius:10,width:"100%",border:"none",background:"none",fontFamily:"Syne,sans-serif",fontWeight:600,fontSize:15,color:"rgba(255,255,255,.85)",cursor:"pointer",transition:"all .2s",textAlign:"left" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="rgba(34,197,94,.15)"; e.currentTarget.style.color="#22C55E"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,.85)"; }}>{l.label}</button>
            ))}
          </div>
          <div style={{ height:1,background:"rgba(255,255,255,.08)",margin:"4px 16px" }}/>
          <div style={{ padding:"8px 16px" }}>
            <p style={{ fontSize:10,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:"rgba(255,255,255,.35)",marginBottom:8,paddingLeft:6 }}>ДОДАТКОВО</p>
            {[
              { icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 010 20M2 12h20"/></svg>, label:"Мова", sub:"Українська" },
              { icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>, label:"Налаштування", sub:"Профіль" },
              { icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label:"Пошта", sub:"sun.power.ua1@gmail.com" },
              { icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, label:"Допомога онлайн", sub:"Чат з менеджером" },
              { icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3-3a6 6 0 01-7.5 7.5l-6 6a2.12 2.12 0 01-3-3l6-6a6 6 0 017.5-7.5"/></svg>, label:"Сервіс та ТО", sub:"Обслуговування СЕС" },
              { icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label:"Відгуки клієнтів", sub:"530+ задоволених" },
            ].map((item,i)=>(
              <button key={i} onClick={()=>setDrawer(false)} style={{ display:"flex",alignItems:"center",gap:10,padding:"9px 8px",borderRadius:10,width:"100%",border:"none",background:"none",cursor:"pointer",transition:"background .2s",textAlign:"left" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.06)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ width:30,height:30,borderRadius:8,background:"rgba(255,255,255,.07)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:"rgba(255,255,255,.85)",fontFamily:"DM Sans,sans-serif",lineHeight:1.2 }}>{item.label}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,.38)",marginTop:1 }}>{item.sub}</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginTop:"auto",padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,.08)",flexShrink:0 }}>
            <a href="tel:+380962033839" style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:"rgba(34,197,94,.12)",border:"1.5px solid rgba(34,197,94,.25)",textDecoration:"none",marginBottom:10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.11 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.13 1 .37 1.97.72 2.9a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.18-1.18a2 2 0 012.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0122 16.92z"/></svg>
              <div><div style={{ fontSize:12,fontWeight:700,color:"#22C55E" }}>+38 (096) 203 38 39</div><div style={{ fontSize:10,color:"rgba(255,255,255,.38)" }}>Безкоштовно по Україні</div></div>
            </a>
            <button className="btn-yellow" style={{ width:"100%",justifyContent:"center",padding:"12px",textTransform:"uppercase" }} onClick={openCalc}>Розрахувати СЕС <ArrowRight size={14}/></button>
          </div>
        </div>
      </div>

      {/* ══ МОДАЛКА — ПРО КОМПАНІЮ ══ */}
      {aboutOpen && (
        <>
          <div onClick={()=>setAboutOpen(false)} style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.55)",backdropFilter:"blur(6px)",animation:"fadeIn .3s ease" }}/>
          <div style={{ position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:201,width:"min(540px,95vw)",maxHeight:"90vh",overflowY:"auto",background:"#fff",borderRadius:24,boxShadow:"0 32px 80px rgba(0,0,0,.25)",animation:"fadeIn .3s ease" }}>
            {/* Шапка */}
            <div style={{ position:"relative",background:"linear-gradient(135deg,#14532D,#22C55E)",borderRadius:"24px 24px 0 0",padding:"32px 28px 24px",textAlign:"center" }}>
              <button onClick={()=>setAboutOpen(false)} style={{ position:"absolute",top:16,right:16,background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff" }}>
                <X size={18}/>
              </button>
              <img src={REAL_LOGO} alt="Sun.Power.Ua" style={{ width:80,height:80,objectFit:"contain",marginBottom:12 }}/>
              <h2 style={{ color:"#fff",fontSize:24,fontFamily:"Syne,sans-serif",fontWeight:800,marginBottom:4 }}>SUN.POWER.UA</h2>
              <p style={{ color:"rgba(255,255,255,.75)",fontSize:13 }}>Сонячні електростанції під ключ</p>
            </div>

            {/* Контент */}
            <div style={{ padding:"24px 28px" }}>

              {/* Про нас */}
              <div style={{ marginBottom:24 }}>
                <span style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:10 }}>ПРО КОМПАНІЮ</span>
                <p style={{ fontSize:14,color:"var(--sub)",lineHeight:1.75 }}>
                  Sun Power UA — компанія з <strong>3-річним досвідом</strong> у встановленні сонячних електростанцій. Ми закрили понад <strong>50 об'єктів</strong>, встановили більше <strong>1000+ панелей</strong>, а наші станції щодня виробляють близько <strong>3 МВт</strong> чистої енергії.
                </p>
              </div>

              {/* Статистика */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24 }}>
                {[
                  { n:"50+",    l:"Закритих об'єктів" },
                  { n:"3",      l:"Роки на ринку" },
                  { n:"~1000+", l:"Встановлених панелей" },
                  { n:"~3МВт",  l:"Виробляємо щодня" },
                ].map((s,i)=>(
                  <div key={i} style={{ background:"#F0FDF4",borderRadius:14,padding:"14px 16px",border:"1px solid rgba(34,197,94,.15)" }}>
                    <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:22,color:"#16A34A",lineHeight:1,marginBottom:4 }}>{s.n}</div>
                    <div style={{ fontSize:11,color:"var(--sub)",fontWeight:500 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Контакти */}
              <div style={{ marginBottom:24 }}>
                <span style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:12 }}>КОНТАКТИ</span>
                {[
                  { icon:<MapPin size={16} color="#22C55E"/>, text:"м. Вараш, вул. Комунальна 7" },
                  { icon:<Phone size={16} color="#22C55E"/>, text:"+38 (096) 203 38 39", href:"tel:+380962033839" },
                  { icon:<Mail size={16} color="#22C55E"/>, text:"sun.power.ua1@gmail.com", href:"mailto:sun.power.ua1@gmail.com" },
                  { icon:<Clock size={16} color="#22C55E"/>, text:"Пн–Пт: 09:00 – 18:00" },
                ].map((c,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<3?"1px solid #F0F0EC":"none" }}>
                    <div style={{ width:32,height:32,borderRadius:8,background:"rgba(34,197,94,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{c.icon}</div>
                    {c.href
                      ? <a href={c.href} style={{ fontSize:14,fontWeight:500,color:"#1A1A1A",textDecoration:"none" }} onMouseEnter={e=>e.target.style.color="#22C55E"} onMouseLeave={e=>e.target.style.color="#1A1A1A"}>{c.text}</a>
                      : <span style={{ fontSize:14,fontWeight:500,color:"#1A1A1A" }}>{c.text}</span>
                    }
                  </div>
                ))}
              </div>

              {/* Переваги */}
              <div style={{ marginBottom:24 }}>
                <span style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:12 }}>НАШІ ПЕРЕВАГИ</span>
                {[
                  "✅ Комплексні рішення під ключ",
                  "✅ Офіційна гарантія на все обладнання",
                  "✅ Кредит 0% для дому · 5-7-9% для бізнесу",
                  "✅ Зелений тариф Net-billing — оформляємо",
                  "✅ Підтримка на кожному етапі",
                ].map((t,i)=>(
                  <div key={i} style={{ fontSize:14,color:"var(--sub)",padding:"6px 0",lineHeight:1.5 }}>{t}</div>
                ))}
              </div>

              {/* CTA */}
              <button className="btn-green" style={{ width:"100%",justifyContent:"center",padding:"14px",textTransform:"uppercase",fontSize:14 }} onClick={()=>{ setAboutOpen(false); openCalc(); }}>
                Розрахувати СЕС безкоштовно <ArrowRight size={15}/>
              </button>
            </div>
          </div>
        </>
      )}
      <section style={{ position:"relative",display:"flex",alignItems:"center",overflow:"hidden",background:"#080806",padding:"clamp(100px,18vw,160px) 0 clamp(60px,10vw,100px)" }}>
        <div ref={heroRef} style={{ position:"absolute",inset:0,willChange:"transform" }}>
          <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1920&q=90" alt="СЕС Sun Power UA" loading="eager" decoding="async" style={{ width:"100%",height:"115%",objectFit:"cover",objectPosition:"center bottom" }}/>
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(8,8,6,.94) 0%,rgba(8,8,6,.68) 55%,rgba(8,8,6,.84) 100%)" }}/>
        </div>
        <div style={{ position:"absolute",right:"-6%",top:"10%",width:500,height:500,background:"radial-gradient(circle,rgba(34,197,94,.12) 0%,transparent 68%)",pointerEvents:"none" }}/>
        <div className="container" style={{ position:"relative",zIndex:1,paddingTop:"clamp(80px,12vw,110px)",paddingBottom:"clamp(40px,6vw,80px)" }}>
          <div style={{ maxWidth:800 }}>
            <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.22)",borderRadius:100,padding:"7px 15px",marginBottom:26,animation:"fadeUp .6s cubic-bezier(.16,1,.3,1) both" }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:"#22C55E",display:"block",animation:"pulse 2s ease-in-out infinite" }}/>
              <span style={{ color:"#22C55E",fontSize:11,fontWeight:700,letterSpacing:".06em" }}>ВИКОРИСТОВУЄМО НАДІЙНЕ ОБЛАДНАННЯ</span>
            </div>
            <h1 style={{ color:"#fff",marginBottom:22 }}>
              <div style={{ animation:"fadeUp .8s cubic-bezier(.16,1,.3,1) .1s both" }}>
                <span style={{ background:"linear-gradient(135deg,#22C55E,#F5C518)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>Енергетичні</span>
              </div>
              <div style={{ animation:"fadeUp .8s cubic-bezier(.16,1,.3,1) .22s both" }}>рішення під ключ</div>
            </h1>
            <p style={{ color:"rgba(255,255,255,.6)",fontSize:"clamp(15px,2vw,19px)",lineHeight:1.65,marginBottom:32,maxWidth:520,animation:"fadeUp .7s cubic-bezier(.16,1,.3,1) .38s both" }}>
              Наша команда — практики, які знають, як вичавити з кожної станції максимум саме для вас. Працюємо чесно й прозоро та відповідаємо за результат на кожному об'єкті — від першого розрахунку до запуску.
            </p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:10,marginBottom:20,animation:"fadeUp .6s cubic-bezier(.16,1,.3,1) .5s both" }}>
              <button className="btn-green" style={{ padding:"14px 28px",fontSize:14 }} onClick={openCalc}>Замовити розрахунок <ArrowRight size={15}/></button>
              <button
                onClick={()=>setShopOpen(true)}
                onMouseEnter={e=>{ e.currentTarget.style.animationPlayState="paused"; e.currentTarget.style.background="rgba(245,197,24,.35)"; e.currentTarget.style.borderColor="rgba(245,197,24,.7)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.animationPlayState="running"; e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="rgba(255,255,255,.3)"; }}
                style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"14px 24px",fontSize:14,fontFamily:"DM Sans,sans-serif",fontWeight:600,cursor:"pointer",borderRadius:100,background:"transparent",border:"1.5px solid rgba(255,255,255,.3)",color:"#fff",boxShadow:"none",animation:"orderBlink 4s ease-in-out infinite",transition:"background .3s,border-color .3s" }}>
                <ShoppingCart size={17}/> Замовлення
              </button>
            </div>
            <div style={{ display:"flex",flexWrap:"wrap",alignItems:"center",gap:18,animation:"fadeUp .6s cubic-bezier(.16,1,.3,1) .65s both" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ display:"flex" }}>{["#22C55E","#16A34A","#15803D","#14532D","#0F3D20"].map((c,i)=><div key={i} style={{ width:32,height:32,borderRadius:"50%",border:"2.5px solid #fff",marginLeft:i===0?0:"-8px",background:c }}/>)}</div>
                <div>
                  <div style={{ display:"flex",gap:2,marginBottom:2 }}>{[...Array(5)].map((_,i)=><Star key={i} size={12} fill="#F5C518" color="#F5C518"/>)}</div>
                  <span style={{ color:"rgba(255,255,255,.55)",fontSize:12 }}><strong style={{color:"#fff"}}>50+</strong> закритих об'єктів</span>
                </div>
              </div>
              {[{n:"1000+",l:"панелей встановлено"},{n:"~3МВт",l:"виробляємо щодня"}].map(x=>(
                <div key={x.l} style={{ textAlign:"center",flexShrink:0 }}>
                  <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,color:"#22C55E",lineHeight:1,whiteSpace:"nowrap" }}>{x.n}</div>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,.4)",marginTop:1,whiteSpace:"nowrap" }}>{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:7,opacity:.4 }}>
          <span style={{ color:"#fff",fontSize:9,letterSpacing:".14em",textTransform:"uppercase" }}>гортати</span>
          <div style={{ width:1,height:32,background:"linear-gradient(180deg,#fff,transparent)" }}/>
        </div>
      </section>

      {/* ══ LOGOS MARQUEE (інтерактивна — тягнеться пальцем/мишкою в обидва боки) ══ */}
      <section style={{ padding:"10px 0",borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)",background:"#fff",minHeight:100,display:"flex",flexDirection:"column",justifyContent:"center" }}>
        <p style={{ textAlign:"center",fontSize:9,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",color:"var(--sub)",opacity:.5,marginBottom:6 }}>НАДІЙНЕ ОБЛАДНАННЯ СВІТОВИХ БРЕНДІВ</p>
        <BrandMarquee partners={PARTNERS}/>
      </section>

      {/* ══ CALCULATOR ══ */}
      <section id="calculator" style={{ background:"#0A0A08", padding:"clamp(28px,5vw,72px) 0 clamp(80px,12vw,120px)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",right:"-10%",top:"5%",width:400,height:400,background:"radial-gradient(circle,rgba(34,197,94,.08) 0%,transparent 70%)",pointerEvents:"none" }}/>
        <div style={{ position:"absolute",left:"-5%",bottom:"0%",width:300,height:300,background:"radial-gradient(circle,rgba(245,197,24,.06) 0%,transparent 70%)",pointerEvents:"none" }}/>
        <div className="container" style={{ position:"relative",zIndex:1 }}>
          <div style={{ textAlign:"center",marginBottom:32 }}>
            <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:10 }}>КАЛЬКУЛЯТОР</span>
            <h2 style={{ color:"#fff",marginBottom:10 }}>Розрахуйте свою<br/><span style={{ background:"linear-gradient(135deg,#22C55E,#F5C518)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>сонячну станцію</span></h2>
            <p style={{ color:"rgba(255,255,255,.45)",fontSize:15,maxWidth:420,margin:"0 auto" }}>3 кроки — і ви знаєте вартість, економію та термін окупності</p>
          </div>
          <SolarCalculator onOpenShop={()=>setShopOpen(true)} products={products}/>
        </div>
      </section>

      {/* ══ ADVANTAGES ══ */}
      <section style={{ background:"linear-gradient(135deg,#1E6B2E,#22C55E)",padding:"clamp(28px,4vw,64px) 0",position:"relative",overflow:"hidden" }}>
        <div className="noise"/>
        <div className="container" style={{ position:"relative",zIndex:1 }}>
          <div style={{ textAlign:"center",marginBottom:28 }}>
            <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"rgba(255,255,255,.65)",display:"block",marginBottom:12 }}>ЧОМУ НАС ОБИРАЮТЬ</span>
            <h2 style={{ color:"#fff" }}>Наші <span style={{ color:"#F5C518" }}>переваги</span></h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))",gap:0 }}>
            {ADVANTAGES.map((a,i)=>(
              <div key={i} style={{ textAlign:"center",padding:"28px 24px",borderRight:i<ADVANTAGES.length-1?"1px solid rgba(255,255,255,.15)":"none" }}>
                <div style={{ width:72,height:72,borderRadius:"50%",background:"rgba(255,255,255,.95)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(0,0,0,.15)" }}>
                  {a.icon}
                </div>
                <h3 style={{ color:"#fff",marginBottom:10,fontSize:"clamp(15px,2vw,19px)" }}>{a.title}</h3>
                <p style={{ color:"rgba(255,255,255,.8)",fontSize:14,lineHeight:1.7,maxWidth:240,margin:"0 auto" }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section id="services" className="section" style={{ background:"var(--base)" }}>
        <div className="container">
          <div style={{ marginBottom:24 }}>
            <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:10 }}>ПОСЛУГИ</span>
            <h2>Повний спектр рішень<br/><span style={{ background:"linear-gradient(135deg,#22C55E,#F5C518)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>для вашої енергонезалежності</span></h2>
            <div style={{ width:60,height:3,background:"#22C55E",borderRadius:2,marginTop:14 }}/>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,300px),1fr))",gap:16,alignItems:"stretch" }}>
            {SERVICES.map((s,i)=>(
              <div key={i} className="service-card" style={{ display:"flex",flexDirection:"column",height:"100%" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                  <div style={{ width:44,height:44,borderRadius:12,background:i%2===0?"rgba(34,197,94,.1)":"rgba(245,197,24,.1)",display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{fontSize:20}}>{s.icon}</span></div>
                  <span style={{ fontSize:11,fontWeight:700,color:"#22C55E",background:"rgba(34,197,94,.08)",borderRadius:100,padding:"3px 10px" }}>{s.price}</span>
                </div>
                <h3 style={{ marginBottom:8 }}>{s.title}</h3>
                <p style={{ color:"var(--sub)",fontSize:13,lineHeight:1.7,marginBottom:14 }}>{s.desc}</p>
                <button className="btn-outline-green" style={{ padding:"7px 14px",fontSize:12,marginTop:"auto",alignSelf:"flex-start" }} onClick={()=>{ if (s.link==="shop") setShopOpen(true); else openConsult(); }}>Детальніше <ArrowRight size={12}/></button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section style={{ background:"#1A1A1A",padding:"clamp(20px,4vw,52px) 0",position:"relative",overflow:"hidden" }}>
        <div className="noise"/>
        <div className="container">
          <div ref={r3} className="reveal">
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0 }}>
              {STATS.map((s,i)=>(
                <div key={i} style={{ textAlign:"center",padding:"clamp(12px,3vw,24px) clamp(3px,1.5vw,16px)",borderRight:i<STATS.length-1?"1px solid rgba(255,255,255,.08)":"none",minWidth:0 }}>
                  <div style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:"clamp(17px,4.2vw,62px)",lineHeight:1,marginBottom:7,whiteSpace:"nowrap",background:"linear-gradient(135deg,#22C55E,#F5C518)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>
                    <Counter target={s.n} suf={s.s}/>
                  </div>
                  <p style={{ color:"rgba(255,255,255,.38)",fontSize:"clamp(7px,1.6vw,10px)",fontWeight:600,letterSpacing:".04em",textTransform:"uppercase",lineHeight:1.3 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROJECTS ══ */}
      <section id="projects" className="section" style={{ background:"var(--muted)" }}>
        <div className="container">
          <div ref={r4} className="reveal" style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:16,marginBottom:20 }}>
            <div>
              <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:10 }}>РЕАЛІЗОВАНІ ПРОЄКТИ</span>
              <h2>Наші роботи</h2>
              <div style={{ width:60,height:3,background:"#22C55E",borderRadius:2,marginTop:14 }}/>
            </div>
            <button className="btn-yellow" style={{ textTransform:"uppercase",letterSpacing:".04em" }} onClick={()=>scrollTo("projects")}>Дивитись всі проєкти <ArrowRight size={14}/></button>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,300px),1fr))",gap:20 }}>
            {PROJECTS.map((p,i)=>(
              <div key={i} className="project-card">
                <div style={{ padding:"16px 16px 12px" }}>
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:12 }}>
                    <span style={{ background:"#22C55E",color:"#fff",borderRadius:100,padding:"5px 14px",fontSize:13,fontWeight:700 }}>{p.kw}</span>
                    <span style={{ background:"#f5f5f5",color:"var(--sub)",borderRadius:100,padding:"5px 14px",fontSize:13,fontWeight:500,border:"1px solid var(--border)" }}>{p.type}</span>
                    <span style={{ background:"#f5f5f5",color:"var(--sub)",borderRadius:100,padding:"5px 14px",fontSize:13,fontWeight:500,border:"1px solid var(--border)" }}>{p.cat}</span>
                  </div>
                  <h3 style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:17,letterSpacing:".02em",marginBottom:12 }}>{p.title}</h3>
                </div>
                <div style={{ margin:"0 16px 16px",borderRadius:14,overflow:"hidden",aspectRatio:"4/3" }}>
                  <img src={p.imgSrc || `https://images.unsplash.com/photo-${p.img}?auto=format&fit=crop&w=600&q=85`} alt={p.title} loading="lazy" decoding="async" style={{ width:"100%",height:"100%",objectFit:"cover",transition:"transform .5s ease" }}
                    onMouseEnter={e=>e.target.style.transform="scale(1.05)"}
                    onMouseLeave={e=>e.target.style.transform="scale(1)"}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ПОВЕРТАЄМО КОНТРОЛЬ ══ */}
      <section style={{ background:"var(--base)", padding:"clamp(28px,4vw,64px) 0" }}>
        <div className="container">
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,440px),1fr))", gap:24, alignItems:"center" }}>
            <div>
              <h2 style={{ fontSize:"clamp(28px,5vw,48px)", marginBottom:20, lineHeight:1.1 }}>
                Повертаємо Вам контроль<br/><span style={{ background:"linear-gradient(135deg,#22C55E,#F5C518)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>над власною енергією</span>
              </h2>
              <p style={{ fontSize:16, color:"var(--sub)", lineHeight:1.8, marginBottom:32 }}>
                Наша команда — практики, які знають, як вичавити з кожної станції максимум саме для вас. Працюємо чесно й прозоро та відповідаємо за результат на кожному об'єкті — від першого розрахунку до запуску.
              </p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <button className="btn-outline-green" style={{ padding:"13px 24px", textTransform:"uppercase", letterSpacing:".04em" }} onClick={()=>scrollTo("services")}>Дізнатися більше <ArrowRight size={14}/></button>
                <button className="btn-green" style={{ padding:"13px 24px", textTransform:"uppercase", letterSpacing:".04em" }} onClick={openCalc}>Замовити розрахунок <ArrowRight size={14}/></button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {[
                { n:"50+", l:"Закритих об'єктів", icon:"🏠" },
                { n:"3", l:"Роки на ринку", icon:"📅" },
                { n:"1000+", l:"Встановлених панелей", icon:"☀️" },
                { n:"~3МВт", l:"Виробляємо щодня", icon:"⚡" },
              ].map((s,i)=>(
                <div key={i} style={{ background:"#fff", borderRadius:16, padding:"20px", border:"1px solid rgba(34,197,94,.12)", textAlign:"center" }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:28, color:"#22C55E", lineHeight:1, marginBottom:4 }}>{s.n}</div>
                  <div style={{ fontSize:12, color:"var(--sub)", fontWeight:500 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="section" style={{ background:"#fff" }}>
        <div className="container">
          <div ref={r5} className="reveal" style={{ textAlign:"center",marginBottom:28 }}>
            <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:10 }}>ЯК ЦЕ ПРАЦЮЄ</span>
            <h2>Від заявки до власної<br/><span style={{ background:"linear-gradient(135deg,#22C55E,#F5C518)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>електростанції</span></h2>
            <div style={{ width:60,height:3,background:"#22C55E",borderRadius:2,marginTop:14,margin:"14px auto 0" }}/>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:24,position:"relative" }}>
            <svg aria-hidden="true" style={{ position:"absolute",top:27,left:"12.5%",width:"75%",height:2,pointerEvents:"none" }} className="hide-mobile">
              <defs><linearGradient id="lg3" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#22C55E"/><stop offset="1" stopColor="#F5C518"/></linearGradient></defs>
              <line x1="0" y1="1" x2="100%" y2="1" stroke="url(#lg3)" strokeWidth="2" strokeDasharray="6 6"/>
            </svg>
            {STEPS.map((s,i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#22C55E,#16A34A)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(34,197,94,.3)",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,color:"#fff" }}>{s.n}</div>
                <h3 style={{ marginBottom:8 }}>{s.title}</h3>
                <p style={{ color:"var(--sub)",fontSize:13,lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center",marginTop:44 }}>
            <button className="btn-green" style={{ padding:"14px 32px",textTransform:"uppercase" }} onClick={openCalc}>Залишити заявку <ArrowRight size={15}/></button>
          </div>
        </div>
      </section>

      {/* ══ PARTNERS ══ */}
      <section id="partners" className="section" style={{ background:"#fff" }}>
        <div className="container">
          <div style={{ textAlign:"center",marginBottom:24 }}>
            <h2 className="green-underline">ПАРТНЕРИ</h2>
            <div style={{ width:60,height:3,background:"#22C55E",borderRadius:2,margin:"12px auto 0" }}/>
          </div>
        </div>
        <BrandMarquee partners={PARTNERS}/>
      </section>

      {/* ══ PACKAGES ══ */}
      <section id="pricing" className="section" style={{ background:"var(--muted)" }}>
        <div className="container">
          <div ref={r7} className="reveal" style={{ textAlign:"center",marginBottom:20 }}>
            <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:10 }}>ПАКЕТИ</span>
            <h2>Оберіть свій комплект</h2>
            <div style={{ width:60,height:3,background:"#22C55E",borderRadius:2,margin:"12px auto 0" }}/>
            <div style={{ display:"inline-flex",background:"rgba(0,0,0,.07)",borderRadius:100,padding:4,marginTop:22,gap:4 }}>
              {[["home","Для дому"],["biz","Для бізнесу"]].map(([k,l])=>(
                <button key={k} onClick={()=>setBilling(k)} style={{ padding:"7px 18px",borderRadius:100,border:"none",fontFamily:"DM Sans,sans-serif",fontWeight:600,fontSize:13,cursor:"pointer",transition:"all .3s",background:billing===k?"#22C55E":"transparent",color:billing===k?"#fff":"#555",boxShadow:billing===k?"0 2px 10px rgba(34,197,94,.35)":"none" }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,280px),1fr))",gap:18,alignItems:"start" }}>
            {PACKAGES.map((p,i)=>(
              <div key={i} style={{ background:p.dark?"linear-gradient(135deg,#1A1A1A,#2A2A2A)":p.hot?"#fff":"#fff", border:p.hot?`2px solid ${p.color}`:`1px solid var(--border)`, borderRadius:22, padding:28, position:"relative", overflow:"hidden", transform:p.hot?"scale(1.04) translateY(-10px)":"none", boxShadow:p.hot?`0 28px 60px ${p.color}33`:"var(--shadow)", transition:"all .4s" }}>
                {/* Тег */}
                <div style={{ position:"absolute",top:16,right:16,background:p.dark?"rgba(245,197,24,.15)":p.hot?"#22C55E":"rgba(0,0,0,.06)",color:p.dark?"#F5C518":p.hot?"#fff":"#555",borderRadius:100,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:".06em" }}>{p.tag}</div>
                {/* Емодзі + назва */}
                <div style={{ marginBottom:6,display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:28 }}>{p.emoji}</span>
                  <span style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,color:p.dark?"#fff":"#1A1A1A" }}>{p.name}</span>
                </div>
                <p style={{ fontSize:12,color:p.dark?"rgba(255,255,255,.45)":"#555",marginBottom:14 }}>{p.desc}</p>
                {/* Ціна */}
                <div style={{ marginBottom:6 }}>
                  <span style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:30,color:p.dark?"#F5C518":p.hot?p.color:"#1A1A1A",lineHeight:1 }}>{p.price}</span>
                </div>
                <p style={{ fontSize:11,color:p.dark?"rgba(255,255,255,.3)":"#aaa",marginBottom:18 }}>Фінальна вартість після розрахунку</p>
                {/* Фічі */}
                <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:22 }}>
                  {p.features.map((f,j)=>(
                    <div key={j} style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:18,height:18,borderRadius:"50%",background:p.dark?"rgba(245,197,24,.15)":p.hot?"rgba(34,197,94,.1)":"rgba(34,197,94,.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <Check size={10} color={p.dark?"#F5C518":"#22C55E"}/>
                      </div>
                      <span style={{ fontSize:13,color:p.dark?"rgba(255,255,255,.8)":"#444" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={openConsult} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"13px",borderRadius:100,border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:700,fontSize:13,textTransform:"uppercase",letterSpacing:".04em",transition:"all .3s",background:p.dark?"#F5C518":p.hot?p.color:"transparent",color:p.dark?"#1A1A1A":p.hot?"#fff":p.color,boxShadow:p.hot?`0 8px 24px ${p.color}44`:"none",outline:p.hot?"none":`2px solid ${p.color}` }}
                  onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 12px 30px ${p.color}55`; }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=p.hot?`0 8px 24px ${p.color}44`:"none"; }}>
                  Замовити консультацію <ArrowRight size={14}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BEFORE / AFTER ══ */}
      <section style={{ background:"linear-gradient(135deg,#0A0A08,#1A2A1A)",padding:"clamp(32px,6vw,80px) 0",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:600,height:600,background:"radial-gradient(circle,rgba(34,197,94,.06) 0%,transparent 70%)",pointerEvents:"none" }}/>
        <div className="container" style={{ position:"relative",zIndex:1 }}>
          <div style={{ textAlign:"center",marginBottom:36 }}>
            <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:10 }}>РЕАЛЬНА ЕКОНОМІЯ</span>
            <h2 style={{ color:"#fff" }}>Рахунок за світло<br/><span style={{ background:"linear-gradient(135deg,#22C55E,#F5C518)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>до і після СЕС</span></h2>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,300px),1fr))",gap:24,maxWidth:720,margin:"0 auto" }}>
            {/* ДО */}
            <div style={{ background:"rgba(239,68,68,.08)",border:"1.5px solid rgba(239,68,68,.25)",borderRadius:20,padding:28 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
                <div style={{ width:36,height:36,borderRadius:"50%",background:"rgba(239,68,68,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>😰</div>
                <span style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16,color:"rgba(239,68,68,.9)" }}>ДО встановлення</span>
              </div>
              {[
                ["Рахунок за світло","3 500 ₴/міс"],
                ["За рік","42 000 ₴"],
                ["За 10 років","420 000+ ₴"],
                ["Відключення","до 12 год/день"],
                ["Залежність від тарифів","повна"],
              ].map(([l,v])=>(
                <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(239,68,68,.1)" }}>
                  <span style={{ fontSize:13,color:"rgba(255,255,255,.5)" }}>{l}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:"rgba(239,68,68,.8)" }}>{v}</span>
                </div>
              ))}
            </div>
            {/* ПІСЛЯ */}
            <div style={{ background:"rgba(34,197,94,.08)",border:"1.5px solid rgba(34,197,94,.3)",borderRadius:20,padding:28,position:"relative" }}>
              <div style={{ position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",background:"#22C55E",color:"#fff",borderRadius:100,padding:"4px 16px",fontSize:11,fontWeight:700,whiteSpace:"nowrap" }}>⭐ З Sun Power UA</div>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20,marginTop:8 }}>
                <div style={{ width:36,height:36,borderRadius:"50%",background:"rgba(34,197,94,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>😎</div>
                <span style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16,color:"#22C55E" }}>ПІСЛЯ встановлення</span>
              </div>
              {[
                ["Рахунок за світло","~350 ₴/міс"],
                ["Економія за рік","~37 800 ₴"],
                ["За 10 років","~378 000 ₴"],
                ["Відключення","0 год — автономія"],
                ["Залежність від тарифів","мінімальна"],
              ].map(([l,v])=>(
                <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(34,197,94,.1)" }}>
                  <span style={{ fontSize:13,color:"rgba(255,255,255,.5)" }}>{l}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:"#22C55E" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign:"center",marginTop:32 }}>
            <button className="btn-green" style={{ padding:"14px 32px",textTransform:"uppercase" }} onClick={openCalc}>
              Розрахувати мою економію <ArrowRight size={15}/>
            </button>
          </div>
        </div>
      </section>

      {/* ══ ПОРІВНЯЛЬНА ТАБЛИЦЯ: СЕС vs Генератор vs Мережа ══ */}
      <section style={{ background:"#fff",padding:"clamp(28px,5vw,72px) 0" }}>
        <div className="container">
          <div style={{ textAlign:"center",marginBottom:28 }}>
            <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:8 }}>ПОРІВНЯННЯ</span>
            <h2 style={{ marginBottom:0 }}>СЕС проти альтернатив</h2>
            <div style={{ width:60,height:3,background:"#22C55E",borderRadius:2,margin:"10px auto 0" }}/>
          </div>
          <div style={{ border:"1px solid var(--border)",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
            <div style={{ overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
              <table style={{ width:"100%",borderCollapse:"collapse",minWidth:320 }}>
                <thead>
                  <tr>
                    {[
                      {l:"Критерій",  bg:"#f8f8f8", c:"var(--text)", align:"left"},
                      {l:"☀️ СЕС+АКБ",bg:"#22C55E",  c:"#fff",       align:"center"},
                      {l:"⚡ Генератор",bg:"#f8f8f8",c:"var(--sub)", align:"center"},
                      {l:"🔌 Мережа",  bg:"#f8f8f8", c:"var(--sub)", align:"center"},
                    ].map((h,i)=>(
                      <th key={i} style={{ padding:"11px 12px",textAlign:h.align,fontSize:11,fontWeight:700,color:h.c,background:h.bg,fontFamily:"Syne,sans-serif",letterSpacing:".04em",borderBottom:"2px solid",borderBottomColor:i===1?"#16A34A":"#f0f0f0" }}>{h.l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Вартість/міс","~0–350 ₴","800–3000 ₴","2000–5000 ₴"],
                    ["При відключенні","✅ Автономія","✅ Працює","❌ Немає світла"],
                    ["Шум","✅ Безшумно","❌ Гучний","—"],
                    ["Вихлоп/запах","✅ Немає","❌ Є","—"],
                    ["Окупність","7–10 р","Ніколи","—"],
                    ["Заробіток","✅ Зел. тариф","❌ Ні","❌ Ні"],
                    ["Обслуговування","✅ Мінімальне","❌ Регулярне","—"],
                    ["Гарантія","✅ 5–10 р","⚠️ 1–2 р","—"],
                  ].map(([cr,...vals],ri,arr)=>(
                    <tr key={cr} style={{ background:ri%2===0?"#fff":"#fafafa" }}>
                      <td style={{ padding:"10px 12px",fontSize:12,color:"var(--text)",fontWeight:600,borderBottom:ri<arr.length-1?"1px solid #f0f0f0":"none" }}>{cr}</td>
                      {vals.map((v,vi)=>(
                        <td key={vi} style={{ padding:"10px 12px",fontSize:12,textAlign:"center",color:vi===0?"#16A34A":v.startsWith("❌")?"#EF4444":v.startsWith("⚠️")?"#B45309":"var(--sub)",fontWeight:vi===0?700:400,background:vi===0?"rgba(34,197,94,.04)":"transparent",borderBottom:ri<arr.length-1?"1px solid #f0f0f0":"none" }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,flexWrap:"wrap",gap:8 }}>
            <p style={{ fontSize:11,color:"#aaa",margin:0 }}>* Для будинку 5 кВт·год/день, тариф 4.32 ₴/кВт·год</p>
            <span className="show-mobile" style={{ fontSize:11,color:"#aaa" }}>← гортайте →</span>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section id="reviews" className="section" style={{ background:"#fff" }}>
        <div className="container">
          <div ref={r8} className="reveal" style={{ marginBottom:20 }}>
            <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:10 }}>ВІДГУКИ</span>
            <h2>Що кажуть клієнти</h2>
            <div style={{ width:60,height:3,background:"#22C55E",borderRadius:2,marginTop:14 }}/>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,280px),1fr))",gap:18 }}>
            {TESTS.map((t,i)=>(
              <div key={i} style={{ background:t.feat?"linear-gradient(135deg,#1E6B2E,#22C55E)":"#fff", border:t.feat?"none":"1px solid var(--border)", borderRadius:20, padding:26, transition:"all .4s", transform:"translateY(0)", cursor:"default" }}
                onMouseEnter={e=>{ if(!t.feat) e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.1)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}>
                <div style={{ fontSize:56,fontFamily:"Syne,sans-serif",fontWeight:800,lineHeight:.9,color:t.feat?"rgba(255,255,255,.2)":"rgba(34,197,94,.12)",marginBottom:12 }}>"</div>
                <div style={{ display:"flex",gap:2,marginBottom:12 }}>{[...Array(5)].map((_,j)=><Star key={j} size={13} fill={t.feat?"#F5C518":"#22C55E"} color={t.feat?"#F5C518":"#22C55E"}/>)}</div>
                <p style={{ color:t.feat?"rgba(255,255,255,.88)":"#555",lineHeight:1.72,marginBottom:20,fontSize:14 }}>{t.text}</p>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ width:42,height:42,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:15,color:"#fff",background:t.feat?"rgba(255,255,255,.18)":"linear-gradient(135deg,#22C55E,#14532D)",border:`2.5px solid ${t.feat?"rgba(255,255,255,.5)":"#22C55E"}` }}>
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:700,fontSize:14,color:t.feat?"#fff":"#1A1A1A" }}>{t.name}</div>
                    <div style={{ fontSize:11,color:t.feat?"rgba(255,255,255,.6)":"#555" }}>{t.role}</div>
                    <div style={{ fontSize:10,color:t.feat?"rgba(255,255,255,.4)":"rgba(0,0,0,.28)",marginTop:1 }}>{t.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="section" style={{ background:"var(--muted)" }}>
        <div className="container">
          <div style={{ marginBottom:20 }}>
            <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:10 }}>FAQ</span>
            <h2>Часті запитання</h2>
            <div style={{ width:60,height:3,background:"#22C55E",borderRadius:2,marginTop:14 }}/>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,400px),1fr))",gap:8 }}>
            {FAQS.map((f,i)=>(
              <div key={i} className={`faq-wrap ${openFaq===i?"open":""}`}>
                <button className="faq-btn" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                  <span>{f.q}</span>
                  <ChevronDown size={16} className={`faq-chevron ${openFaq===i?"open":""}`}/>
                </button>
                <div className={`faq-body ${openFaq===i?"open":""}`}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONTACT ══ */}
      <section id="contact" className="section" style={{ background:"#fff" }}>
        <div className="container">
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,400px),1fr))",gap:24,alignItems:"center" }}>
            {/* Форма зворотнього дзвінка */}
            <div>
              <span style={{ fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#22C55E",display:"block",marginBottom:10 }}>КОНТАКТИ</span>
              <h2 style={{ marginBottom:8 }}>Наш офіс</h2>
              <div style={{ width:60,height:3,background:"#22C55E",borderRadius:2,marginBottom:28 }}/>
              <div style={{ background:"#F0FDF4",border:"1px solid rgba(34,197,94,.2)",borderRadius:20,padding:28 }}>
                <p style={{ fontSize:15,color:"var(--sub)",lineHeight:1.7,marginBottom:24 }}>Завітайте до нас або зв'яжіться для безкоштовної консультації щодо сонячної станції</p>
                {[
                  { icon:<MapPin size={18} color="#22C55E"/>, text:"м. Вараш, вул. Комунальна 7" },
                  { icon:<Phone size={18} color="#22C55E"/>, text:"+38 (096) 203 38 39", href:"tel:+380962033839" },
                  { icon:<Mail size={18} color="#22C55E"/>, text:"sun.power.ua1@gmail.com", href:"mailto:sun.power.ua1@gmail.com" },
                  { icon:<Clock size={18} color="#22C55E"/>, text:"Пн-Пт: 09:00 – 18:00" },
                ].map((c,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 0",borderBottom:i<3?"1px solid rgba(34,197,94,.12)":"none" }}>
                    <div style={{ width:36,height:36,borderRadius:10,background:"rgba(34,197,94,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{c.icon}</div>
                    {c.href
                      ? <a href={c.href} style={{ fontSize:15,fontWeight:500,color:"#1A1A1A",textDecoration:"none",transition:"color .2s" }} onMouseEnter={e=>e.target.style.color="#22C55E"} onMouseLeave={e=>e.target.style.color="#1A1A1A"}>{c.text}</a>
                      : <span style={{ fontSize:15,fontWeight:500,color:"#1A1A1A" }}>{c.text}</span>}
                  </div>
                ))}
                <button className="btn-outline-green" style={{ marginTop:22,textTransform:"uppercase",letterSpacing:".04em" }} onClick={openCalc}>Розрахувати СЕС <ArrowRight size={14}/></button>
              </div>
            </div>
            {/* Форма перезвону */}
            <div>
              <div style={{ background:"linear-gradient(135deg,#1E6B2E,#22C55E)",borderRadius:20,padding:32,position:"relative",overflow:"hidden" }}>
                <div className="noise"/>
                <div style={{ position:"relative",zIndex:1 }}>
                  <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.15)",borderRadius:100,padding:"7px 16px",marginBottom:20 }}>
                    <span style={{ fontSize:16 }}>⚡</span>
                    <span style={{ color:"#fff",fontSize:13,fontWeight:700 }}>Передзвонимо протягом 30 секунд</span>
                  </div>
                  <h3 style={{ color:"#fff",fontSize:"clamp(18px,3vw,24px)",marginBottom:8 }}>Залишились запитання?</h3>
                  <p style={{ color:"rgba(255,255,255,.75)",fontSize:14,lineHeight:1.6,marginBottom:24 }}>Заповніть форму — і ми вам передзвонимо</p>
                  {sent ? (
                    <div style={{ display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,.15)",borderRadius:14,padding:"16px 20px" }}>
                      <Check size={20} color="#F5C518"/>
                      <div>
                        <div style={{ color:"#fff",fontWeight:700,fontSize:15 }}>Дякуємо!</div>
                        <div style={{ color:"rgba(255,255,255,.7)",fontSize:13 }}>Ми передзвонимо протягом 30 секунд.</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ background:"rgba(255,255,255,.12)",borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,marginBottom:phoneError?4:14,border:`1px solid ${phoneError?"#EF4444":"rgba(255,255,255,.2)"}` }}>
                        <Phone size={17} color="rgba(255,255,255,.6)"/>
                        <input type="text" name="website" style={{display:"none"}} tabIndex={-1} autoComplete="off"/>
                        <input type="tel" value={phone} onChange={e=>{ setPhone(e.target.value); setPhoneError(false); }} placeholder="+380 __ ___ __ __"
                          style={{ background:"none",border:"none",outline:"none",color:"#fff",fontSize:16,fontFamily:"DM Sans,sans-serif",flex:1 }}/>
                      </div>
                      {phoneError && <p style={{ fontSize:12,color:"#FCA5A5",marginBottom:10 }}>Введіть коректний номер телефону (наприклад, +380961234567)</p>}
                      <button onClick={handleSend} className="btn-yellow" style={{ width:"100%",justifyContent:"center",padding:"15px",fontSize:15,letterSpacing:".04em", animation: sendingSlow ? "slowBlink 0.9s ease-in-out infinite" : "none" }}>
                        {sendingSlow
                          ? "⏳ Ще трохи..."
                          : sending
                          ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeDasharray="44" strokeDashoffset="22" style={{ animation:"spin 1s linear infinite",transformOrigin:"9px 9px" }}/></svg>
                          : "ЗАЛИШИТИ ЗАЯВКУ"}
                      </button>
                      {tgError && (
                        <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(239,68,68,.12)", border:"1px solid rgba(239,68,68,.35)", borderRadius:10, fontSize:12, color:"#FCA5A5" }}>
                          ⚠️ Помилка надсилання в Telegram: {tgError}
                        </div>
                      )}
                      <div style={{ display:"flex",justifyContent:"space-between",marginTop:14 }}>
                        <span style={{ fontSize:12,color:"rgba(255,255,255,.5)" }}>3 вільних оператори</span>
                        <span style={{ fontSize:12,color:"rgba(255,255,255,.5)" }}>30+ заявок сьогодні</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background:"#2A2A2A",padding:"clamp(40px,6vw,70px) 0 0" }}>
        <style>{`
          @media(max-width:640px){
            .footer-grid{display:flex!important;flex-direction:column;align-items:center;text-align:center;gap:32px}
            .footer-col1{align-items:center!important}
            .footer-col2 p,.footer-col3 p{text-align:center}
            .footer-col2 div{align-items:center}
            .footer-nav{flex-direction:row!important;flex-wrap:wrap;justify-content:center;gap:8px 16px!important}
            .footer-nav button{font-size:13px!important}
            .footer-social{justify-content:center}
            .footer-social a{width:44px!important;height:44px!important;border-radius:50%!important}
          }
        `}</style>
        <div className="container">
          <div className="footer-grid" style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:40,paddingBottom:40,borderBottom:"1px solid rgba(255,255,255,.08)" }}>

            {/* Колонка 1 — Лого + опис */}
            <div className="footer-col1" style={{ display:"flex",flexDirection:"column",alignItems:"flex-start",gap:16 }}>
              <img src={REAL_LOGO} alt="Sun.Power.Ua" style={{ height:80,width:80,objectFit:"contain" }}/>
              <p style={{ color:"rgba(255,255,255,.45)",fontSize:13,lineHeight:1.7,margin:0 }}>Сонячні електростанції під ключ. Проєктування, монтаж та гарантійне обслуговування.</p>
              <p style={{ color:"rgba(255,255,255,.3)",fontSize:12,margin:0 }}>м. Вараш, вул. Комунальна 7</p>
            </div>

            {/* Колонка 2 — Навігація */}
            <div className="footer-col2">
              <p style={{ color:"rgba(255,255,255,.35)",fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:16 }}>НАВІГАЦІЯ</p>
              <div className="footer-nav" style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {[
                  { label:"Проєкти",    id:"projects"  },
                  { label:"Про нас",    id:"about"     },
                  { label:"Для дому",   id:"pricing", billing:"home"  },
                  { label:"Для бізнесу",id:"pricing", billing:"biz"   },
                  { label:"Замовлення", id:"shop"      },
                  { label:"Контакти",   id:"contact"   },
                ].map(l=>(
                  <button key={l.label}
                    onClick={()=>{ if(l.id==="shop") setShopOpen(true); else if(l.id==="about") setAboutOpen(true); else { if(l.billing) setBilling(l.billing); scrollTo(l.id); } }}
                    style={{ color:"rgba(255,255,255,.55)",fontSize:14,fontWeight:500,transition:"color .2s",background:"none",border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",padding:0,textAlign:"left" }}
                    onMouseEnter={e=>e.target.style.color="#22C55E"}
                    onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.55)"}>{l.label}</button>
                ))}
              </div>
            </div>

            {/* Колонка 3 — Соцмережі + контакти */}
            <div className="footer-col3">
              <p style={{ color:"rgba(255,255,255,.35)",fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:16 }}>МИ В СОЦМЕРЕЖАХ</p>
              <div className="footer-social" style={{ display:"flex",flexWrap:"wrap",gap:12,marginBottom:20 }}>
                {[
                  { label:"Instagram", url:"https://www.instagram.com/sun.powerua?igsh=MW9ucmUzeGZvd2M0dA==", path:"M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                  { label:"Facebook", url:"https://www.facebook.com/profile.php?id=61587772408533", path:"M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
                  { label:"TikTok", url:"https://www.tiktok.com/@sun.power.ua", path:"M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
                  { label:"YouTube", url:"https://www.youtube.com/@sunpower-u1", path:"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
                ].map((s,i)=>(
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    style={{ width:48,height:48,borderRadius:14,border:"1.5px solid rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,.5)",transition:"all .25s",textDecoration:"none",cursor:"pointer" }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor="#22C55E"; e.currentTarget.style.color="#22C55E"; e.currentTarget.style.background="rgba(34,197,94,.1)"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,.15)"; e.currentTarget.style.color="rgba(255,255,255,.5)"; e.currentTarget.style.background="transparent"; }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d={s.path}/></svg>
                  </a>
                ))}
              </div>
              <p style={{ color:"rgba(255,255,255,.45)",fontSize:13,margin:"0 0 4px" }}>📞 +38 (096) 203 38 39</p>
              <p style={{ color:"rgba(255,255,255,.35)",fontSize:12,margin:0 }}>Пн–Пт: 09:00–18:00</p>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ padding:"20px 0 78px",display:"flex",flexWrap:"wrap",gap:12,justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:11,color:"rgba(255,255,255,.3)" }}>© 2025 Sun.Power.Ua · м. Вараш, вул. Комунальна 7</span>
            <div style={{ display:"flex",gap:16 }}>
              {["Політика конфіденційності","Публічна оферта"].map(l=>(
                <button key={l}
                  onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
                  style={{ color:"rgba(255,255,255,.25)",fontSize:11,background:"none",border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif",padding:0,transition:"color .2s" }}
                  onMouseEnter={e=>e.target.style.color="rgba(255,255,255,.6)"}
                  onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.25)"}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>


      {/* ══ МОДАЛКА ПОШУКУ ══ */}
      {searchOpen && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"80px 16px 16px",backdropFilter:"blur(6px)" }}
          onClick={e=>{ if(e.target===e.currentTarget) setSearchOpen(false); }}>
          <div style={{ background:"#fff",borderRadius:24,padding:24,maxWidth:520,width:"100%",boxShadow:"0 32px 80px rgba(0,0,0,.3)" }}>
            {/* Поле пошуку */}
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20,background:"#f5f5f5",borderRadius:14,padding:"12px 16px",border:"2px solid transparent" }}
              onFocus={e=>e.currentTarget.style.borderColor="#22C55E"}
              onBlur={e=>e.currentTarget.style.borderColor="transparent"}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input autoFocus type="text" placeholder="Пошук по сайту..."
                value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                onKeyDown={e=>e.key==="Escape"&&setSearchOpen(false)}
                style={{ border:"none",background:"transparent",outline:"none",fontSize:16,fontFamily:"DM Sans,sans-serif",flex:1,color:"#1A1A1A" }}/>
              {searchQuery && <button onClick={()=>setSearchQuery("")} style={{ border:"none",background:"none",cursor:"pointer",color:"#aaa",fontSize:18,lineHeight:1 }}>×</button>}
              <button onClick={()=>setSearchOpen(false)} style={{ border:"none",background:"none",cursor:"pointer",color:"#aaa",fontSize:12,fontFamily:"DM Sans,sans-serif",flexShrink:0 }}>ESC</button>
            </div>

            {/* Результати */}
            {searchQuery.trim().length > 0 ? (() => {
              const q = searchQuery.toLowerCase();
              const results = [
                // Товари
                ...products.filter(p=>p.name.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q)||(p.cat&&p.cat.toLowerCase().includes(q))||(p.brand&&p.brand.toLowerCase().includes(q)))
                  .map(p=>({ type:"product", icon:"🛒", title:p.name, sub:`${p.cat} · ${p.custom?"за проєктом":p.price.toLocaleString()+" ₴"}`, action:()=>{ setSearchOpen(false); setShopOpen(true); } })),
                // Послуги
                ...SERVICES.filter(s=>s.title.toLowerCase().includes(q)||s.desc.toLowerCase().includes(q))
                  .map(s=>({ type:"service", icon:"⚡", title:s.title, sub:"Послуга", action:()=>{ setSearchOpen(false); scrollTo("services"); } })),
                // FAQ
                ...FAQS.filter(f=>f.q.toLowerCase().includes(q)||f.a.toLowerCase().includes(q))
                  .map(f=>({ type:"faq", icon:"❓", title:f.q, sub:"Часте питання", action:()=>{ setSearchOpen(false); scrollTo("contact"); } })),
                // Секції сайту
                ...[
                  { kw:["калькулятор","розрахунок","ціна","вартість"], icon:"🧮", title:"Калькулятор СЕС", sub:"Розрахуйте вартість станції", action:()=>{ setSearchOpen(false); openCalc(); } },
                  { kw:["контакт","телефон","зв'язок","написати"], icon:"📞", title:"Контакти", sub:"Зв'яжіться з нами", action:()=>{ setSearchOpen(false); scrollTo("contact"); } },
                  { kw:["проект","об'єкт","роботи","приклад"], icon:"📸", title:"Наші проєкти", sub:"Виконані роботи", action:()=>{ setSearchOpen(false); scrollTo("projects"); } },
                  { kw:["відгук","клієнт","думка","оцінка"], icon:"⭐", title:"Відгуки клієнтів", sub:"Що кажуть клієнти", action:()=>{ setSearchOpen(false); scrollTo("reviews"); } },
                  { kw:["партнер","бренд","longi","deye","huawei","jinko"], icon:"🤝", title:"Партнери", sub:"Бренди обладнання", action:()=>{ setSearchOpen(false); scrollTo("partners"); } },
                  { kw:["ціна","пакет","тариф","гібрид","мережева"], icon:"💰", title:"Пакети та ціни", sub:"Оберіть свій комплект", action:()=>{ setSearchOpen(false); scrollTo("pricing"); } },
                ].filter(s=>s.kw.some(k=>k.includes(q)||q.includes(k)))
                  .map(({kw,...s})=>s),
              ].slice(0, 8);

              return results.length > 0 ? (
                <div>
                  <p style={{ fontSize:11,color:"#aaa",fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",marginBottom:12 }}>Знайдено {results.length} результати</p>
                  <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                    {results.map((r,i)=>(
                      <button key={i} onClick={r.action}
                        style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,border:"1.5px solid #f0f0f0",background:"#fff",cursor:"pointer",textAlign:"left",transition:"all .2s",width:"100%" }}
                        onMouseEnter={e=>{ e.currentTarget.style.background="rgba(34,197,94,.06)"; e.currentTarget.style.borderColor="#22C55E"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#f0f0f0"; }}>
                        <span style={{ fontSize:20,flexShrink:0 }}>{r.icon}</span>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:14,fontWeight:600,color:"#1A1A1A",fontFamily:"Syne,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.title}</div>
                          <div style={{ fontSize:11,color:"#aaa",marginTop:1 }}>{r.sub}</div>
                        </div>
                        <ArrowRight size={14} color="#22C55E" style={{ marginLeft:"auto",flexShrink:0 }}/>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:"center",padding:"24px 0" }}>
                  <div style={{ fontSize:36,marginBottom:8 }}>🔍</div>
                  <p style={{ color:"var(--sub)",fontSize:14 }}>Нічого не знайдено за запитом <strong>"{searchQuery}"</strong></p>
                  <p style={{ color:"#aaa",fontSize:12,marginTop:6 }}>Спробуйте: панелі, інвертор, калькулятор, контакти</p>
                </div>
              );
            })() : (
              <div>
                <p style={{ fontSize:11,color:"#aaa",fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",marginBottom:12 }}>Швидкий перехід</p>
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {[
                    { icon:"🧮", title:"Калькулятор СЕС", sub:"Розрахунок вартості та окупності", action:()=>{ setSearchOpen(false); openCalc(); } },
                    { icon:"🛒", title:"Магазин обладнання", sub:"Панелі, інвертори, акумулятори", action:()=>{ setSearchOpen(false); setShopOpen(true); } },
                    { icon:"💰", title:"Пакети та ціни", sub:"Deye, Hybrid, Pro Solar", action:()=>{ setSearchOpen(false); scrollTo("pricing"); } },
                    { icon:"📞", title:"Контакти", sub:"+38 (096) 203 38 39", action:()=>{ setSearchOpen(false); scrollTo("contact"); } },
                  ].map((r,i)=>(
                    <button key={i} onClick={r.action}
                      style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,border:"1.5px solid #f0f0f0",background:"#fff",cursor:"pointer",textAlign:"left",transition:"all .2s",width:"100%" }}
                      onMouseEnter={e=>{ e.currentTarget.style.background="rgba(34,197,94,.06)"; e.currentTarget.style.borderColor="#22C55E"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#f0f0f0"; }}>
                      <span style={{ fontSize:20,flexShrink:0 }}>{r.icon}</span>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:14,fontWeight:600,color:"#1A1A1A",fontFamily:"Syne,sans-serif" }}>{r.title}</div>
                        <div style={{ fontSize:11,color:"#aaa",marginTop:1 }}>{r.sub}</div>
                      </div>
                      <ArrowRight size={14} color="#22C55E" style={{ marginLeft:"auto",flexShrink:0 }}/>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ МОДАЛКА ВИБОРУ СПОСОБУ ЗВ'ЯЗКУ ══ */}
      {contactOpen && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9999,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:0,backdropFilter:"blur(8px)" }}
          onClick={e=>{ if(e.target===e.currentTarget) setContactOpen(false); }}>
          <div style={{ background:"#0F1A0F",borderRadius:"24px 24px 0 0",padding:"28px 24px 40px",width:"100%",maxWidth:480,position:"relative",boxShadow:"0 -8px 40px rgba(0,0,0,.5)" }}>
            {/* Ручка */}
            <div style={{ width:40,height:4,background:"rgba(255,255,255,.15)",borderRadius:2,margin:"0 auto 24px" }}/>
            <button onClick={()=>setContactOpen(false)} style={{ position:"absolute",top:16,right:16,background:"rgba(255,255,255,.08)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <X size={15} color="rgba(255,255,255,.6)"/>
            </button>
            {/* Заголовок */}
            <div style={{ marginBottom:24 }}>
              <h3 style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,color:"#fff",marginBottom:4 }}>Зв'язатися з нами</h3>
              <p style={{ color:"rgba(255,255,255,.4)",fontSize:13 }}>+38 (096) 203 38 39</p>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {/* Зателефонувати */}
              <a href="tel:+380962033839" onClick={()=>setContactOpen(false)}
                style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.2)",textDecoration:"none" }}>
                <div style={{ width:44,height:44,borderRadius:12,background:"#22C55E",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.11 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.13 1 .37 1.97.72 2.9a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.18-1.18a2 2 0 012.11-.45c.93.35 1.9.59 2.9.72A2 2 0 0122 16.92z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:15,fontWeight:700,color:"#fff" }}>Зателефонувати</div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,.4)",marginTop:1 }}>Через мобільну мережу</div>
                </div>
              </a>
              {/* Viber */}
              <a href="viber://chat?number=%2B380962033839" onClick={()=>setContactOpen(false)}
                style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:"rgba(115,96,242,.1)",border:"1px solid rgba(115,96,242,.2)",textDecoration:"none" }}>
                <div style={{ width:44,height:44,borderRadius:12,background:"#7360F2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M11.4 1.1C7.4 1.4 4.1 3.7 2.7 7c-.7 1.7-.9 3-.8 5.3.1 1.9.4 3.1 1.1 4.5 1.2 2.4 3.3 4.3 5.8 5.2l.7.3v1.8c0 1.9 0 1.8.3 1.8.1 0 1-.8 2.1-1.7l1.9-1.7h1.1c2.5-.1 4.4-.7 6.1-2 .8-.6 2-2 2.6-3.1.8-1.6 1.1-3 1.1-5.1-.1-2.8-.9-5-2.5-6.8C20.4 3 18.2 1.8 15.5 1.3c-.9-.2-3.3-.3-4.1-.2zm4.2 4.4c.3.1.4.2.4.4v.5l-.4.1c-.3.1-.4 0-.7-.4-.7-.9-1.8-1.3-3.4-1.3-1.3 0-2.2.3-3 .9-.9.7-1.4 1.8-1.5 3.2v.5l-.4.1-.4.1v-.6C6 7 6.5 5.7 7.5 4.8 8.7 3.8 10.1 3.4 12 3.4c1.6 0 2.8.4 3.6 1.1zm-7.5 2c.9-.5 2-.7 3.3-.5 1 .2 1.8.6 2.4 1.3.5.5.8 1.1.8 1.4 0 .4-.5.5-.9.3-.2-.1-.3-.3-.6-.7-.6-.8-1.4-1.2-2.6-1.2-.8 0-1.5.2-2 .6-.3.2-.4.2-.6.1-.3-.2-.3-.9 0-1.1l.2-.2zm4 2.7c.6.3 1 .9 1 1.5 0 .3-.1.5-.3.6l-.3.2-.4-.2c-.2-.2-.3-.3-.3-.6 0-.5-.4-.9-.9-.9-.3 0-.4-.1-.5-.3-.1-.3 0-.5.2-.7.4-.3.9-.1 1.5.4zm-5.5.5c.2.5.8 1 1.4 1.4.3.2.5.4.5.5 0 .2-.4.7-.6.7-.4 0-1.6-1.1-2-1.8-.2-.5-.2-.6 0-.9.2-.2.4-.2.7.1zm4.2 1.1c.4.1.8.5 1.2 1.1l.3.5.5.1c.5.1.6.2.6.5 0 .2-.1.3-.3.4-.3.2-.5.1-1-.3-.3-.3-.6-.5-.7-.5s-.3.2-.5.4c-.4.5-.6.5-.9.3-.3-.2-.3-.5 0-.9.3-.5.5-.6 1-.6l.5-.1-.3-.5c-.3-.6-.3-.8 0-1 .1-.1.3 0 .6.1zm-2.2 3.1c1.4.6 2.4 1 3.6 1 .6 0 .7.1.7.4 0 .3-.1.4-.7.5-1 .1-2.2-.2-3.9-.9-.9-.4-1-.4-1-.7 0-.2.1-.4.3-.4.1-.1.5.1 1 .1z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:15,fontWeight:700,color:"#fff" }}>Viber</div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,.4)",marginTop:1 }}>Написати повідомлення</div>
                </div>
              </a>
              {/* WhatsApp */}
              <a href="https://wa.me/380962033839" target="_blank" rel="noopener noreferrer" onClick={()=>setContactOpen(false)}
                style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:"rgba(37,211,102,.1)",border:"1px solid rgba(37,211,102,.2)",textDecoration:"none" }}>
                <div style={{ width:44,height:44,borderRadius:12,background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:15,fontWeight:700,color:"#fff" }}>WhatsApp</div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,.4)",marginTop:1 }}>Написати повідомлення</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ══ МОДАЛКА ПОБАЖАННЯ ══ */}
      {wishOpen && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)" }}>
          <div style={{ background:"#fff",borderRadius:24,padding:28,maxWidth:360,width:"100%",position:"relative",boxShadow:"0 32px 80px rgba(0,0,0,.25)" }}>
            <button onClick={()=>setWishOpen(false)} style={{ position:"absolute",top:14,right:14,background:"rgba(0,0,0,.07)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <X size={16} color="#555"/>
            </button>

            {!wishSent ? (
              <>
                <div style={{ textAlign:"center",marginBottom:20 }}>
                  <div style={{ fontSize:36,marginBottom:8 }}>💬</div>
                  <h3 style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,marginBottom:6 }}>Залишіть побажання</h3>
                  <p style={{ color:"var(--sub)",fontSize:13,lineHeight:1.5 }}>Ваша думка допомагає нам ставати кращими</p>
                </div>

                {wishError ? (
                  <div style={{ background:"rgba(245,197,24,.1)",border:"1.5px solid #F5C518",borderRadius:12,padding:"14px 16px",textAlign:"center",marginBottom:16 }}>
                    <div style={{ fontSize:24,marginBottom:6 }}>🌞</div>
                    <p style={{ fontSize:13,color:"var(--sub)",lineHeight:1.5 }}>{wishError}</p>
                    <button onClick={()=>setWishOpen(false)} className="btn-green" style={{ marginTop:14,justifyContent:"center",padding:"10px 24px",textTransform:"uppercase",fontSize:12 }}>Зрозуміло</button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom:10 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                        <label style={{ fontSize:11,fontWeight:600,color:"var(--sub)" }}>ПОБАЖАННЯ</label>
                        <span style={{ fontSize:11,color:wishText.length>80?"#EF4444":"#aaa" }}>{wishText.length}/80</span>
                      </div>
                      <textarea
                        placeholder="Ваше побажання або пропозиція..."
                        value={wishText}
                        maxLength={80}
                        rows={3}
                        onChange={e=>setWishText(e.target.value)}
                        style={{ width:"100%",padding:"10px 14px",border:"1.5px solid #e5e7eb",borderRadius:12,fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none",resize:"none",lineHeight:1.5 }}
                        onFocus={e=>e.target.style.borderColor="#22C55E"}
                        onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <label style={{ fontSize:11,fontWeight:600,color:"var(--sub)",display:"block",marginBottom:4 }}>ТЕЛЕФОН АБО EMAIL</label>
                      <input type="text" placeholder="+380 96 203 38 39 або email@gmail.com"
                        value={wishContact} onChange={e=>setWishContact(e.target.value)}
                        style={{ width:"100%",padding:"10px 14px",border:"1.5px solid #e5e7eb",borderRadius:12,fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none" }}
                        onFocus={e=>e.target.style.borderColor="#22C55E"}
                        onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                    </div>
                    <button className="btn-green" disabled={!wishText.trim() || !wishContact.trim()}
                      style={{ width:"100%",justifyContent:"center",padding:"13px",textTransform:"uppercase",opacity:(wishText.trim()&&wishContact.trim())?1:.4 }}
                      onClick={async()=>{
                        if (wishText.length > 80) return;
                        const msg = `💬 <b>ПОБАЖАННЯ ВІД ВІДВІДУВАЧА</b>

📝 ${escapeHtml(wishText)}
📞 ${escapeHtml(wishContact)}`;
                        await sendToTelegram(msg);
                        localStorage.setItem("sunpower_wish_date", new Date().toDateString());
                        setWishSent(true);
                      }}>
                      Надіслати побажання ✉️
                    </button>
                    <p style={{ textAlign:"center",fontSize:11,color:"#aaa",marginTop:10 }}>1 побажання на день від одного пристрою</p>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign:"center",padding:"8px 0" }}>
                <div style={{ fontSize:44,marginBottom:12 }}>🎉</div>
                <h3 style={{ fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:18,marginBottom:8 }}>Дякуємо!</h3>
                <p style={{ color:"var(--sub)",fontSize:14,lineHeight:1.6,marginBottom:16 }}>Ваше побажання отримано. Ми обов'язково врахуємо його!</p>
                <button onClick={()=>setWishOpen(false)} className="btn-green" style={{ justifyContent:"center",padding:"12px 28px",textTransform:"uppercase" }}>Готово</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ ЛИПКА КНОПКА "ОТРИМАТИ РОЗРАХУНОК" ══ */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:997,background:"rgba(10,10,8,.97)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(34,197,94,.2)" }}>
        {/* Мобільна версія */}
        <div className="show-mobile" style={{ padding:"8px 14px",display:"flex",alignItems:"center",gap:8 }}>
          <button className="btn-green" style={{ flex:1,padding:"11px 16px",fontSize:13,textTransform:"uppercase",whiteSpace:"nowrap",justifyContent:"center" }} onClick={openCalc}>
            РОЗРАХУВАТИ ☀️
          </button>
          <button onClick={()=>setContactOpen(true)} style={{ width:42,height:42,borderRadius:12,background:"rgba(34,197,94,.15)",border:"1.5px solid rgba(34,197,94,.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0 }}>
            <Phone size={18} color="#22C55E"/>
          </button>
        </div>
        {/* Десктопна версія */}
        <div className="hide-mobile" style={{ display:"grid",gridTemplateColumns:"1fr 1fr" }}>
          <button onClick={openCalc} style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"16px 24px",background:"#22C55E",border:"none",borderRight:"1px solid rgba(0,0,0,.15)",cursor:"pointer",transition:"background .2s" }}
            onMouseEnter={e=>e.currentTarget.style.background="#16A34A"} onMouseLeave={e=>e.currentTarget.style.background="#22C55E"}>
            <span style={{ fontSize:18 }}>☀️</span>
            <span style={{ color:"#fff",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,textTransform:"uppercase",letterSpacing:".03em" }}>Безкоштовний розрахунок</span>
            <ArrowRight size={15} color="#fff"/>
          </button>
          <button onClick={()=>setContactOpen(true)} style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"16px 24px",background:"rgba(34,197,94,.12)",border:"none",cursor:"pointer",transition:"background .2s" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(34,197,94,.22)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(34,197,94,.12)"}>
            <Phone size={16} color="#22C55E"/>
            <span style={{ color:"#fff",fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14 }}>+38 (096) 203 38 39</span>
          </button>
        </div>
      </div>

    </>
  );
}
