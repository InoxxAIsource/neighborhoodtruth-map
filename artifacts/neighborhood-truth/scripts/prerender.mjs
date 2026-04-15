/**
 * Post-build prerender script for PlaceLabels.
 *
 * After `vite build`, this script:
 *  1. Generates a city-specific index.html for each of the 35 city routes
 *     so that Googlebot sees real HTML instead of a blank React shell.
 *  2. Queries the Postgres database (via DATABASE_URL) to build a complete
 *     sitemap.xml that includes every label page URL, then writes it to
 *     dist/public/sitemap.xml (overwriting the static fallback Vite copied).
 *  3. Pings Google Search Console to re-index the updated sitemap.
 *
 * No Puppeteer / headless browser required — runs in plain Node.js.
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST = resolve(__dirname, "../dist/public");
const TEMPLATE_PATH = resolve(DIST, "index.html");

// ─── City list (slug → display name + bounding box) ─────────────────────────
const CITIES = [
  { slug: "new-york",      name: "New York",      latMin: 40.4, latMax: 41.0, lngMin: -74.3, lngMax: -73.7 },
  { slug: "san-francisco", name: "San Francisco", latMin: 37.6, latMax: 37.9, lngMin: -122.6, lngMax: -122.3 },
  { slug: "los-angeles",   name: "Los Angeles",   latMin: 33.7, latMax: 34.4, lngMin: -118.7, lngMax: -118.0 },
  { slug: "toronto",       name: "Toronto",       latMin: 43.5, latMax: 43.9, lngMin: -79.7, lngMax: -79.1 },
  { slug: "mexico-city",   name: "Mexico City",   latMin: 19.2, latMax: 19.6, lngMin: -99.4, lngMax: -98.9 },
  { slug: "buenos-aires",  name: "Buenos Aires",  latMin: -34.8, latMax: -34.4, lngMin: -58.7, lngMax: -58.2 },
  { slug: "london",        name: "London",        latMin: 51.3, latMax: 51.7, lngMin: -0.3, lngMax: 0.1 },
  { slug: "amsterdam",     name: "Amsterdam",     latMin: 52.3, latMax: 52.5, lngMin: 4.7, lngMax: 5.1 },
  { slug: "rome",          name: "Rome",          latMin: 41.7, latMax: 42.1, lngMin: 12.3, lngMax: 12.7 },
  { slug: "istanbul",      name: "Istanbul",      latMin: 40.8, latMax: 41.3, lngMin: 28.6, lngMax: 29.5 },
  { slug: "tel-aviv",      name: "Tel Aviv",      latMin: 31.9, latMax: 32.2, lngMin: 34.7, lngMax: 35.05 },
  { slug: "cairo",         name: "Cairo",         latMin: 29.9, latMax: 30.2, lngMin: 31.1, lngMax: 31.5 },
  { slug: "cape-town",     name: "Cape Town",     latMin: -34.2, latMax: -33.7, lngMin: 18.3, lngMax: 18.7 },
  { slug: "tokyo",         name: "Tokyo",         latMin: 35.5, latMax: 35.8, lngMin: 139.5, lngMax: 139.9 },
  { slug: "seoul",         name: "Seoul",         latMin: 37.4, latMax: 37.7, lngMin: 126.8, lngMax: 127.3 },
  { slug: "hong-kong",     name: "Hong Kong",     latMin: 22.1, latMax: 22.6, lngMin: 113.9, lngMax: 114.5 },
  { slug: "bali",          name: "Bali",          latMin: -8.9, latMax: -8.3, lngMin: 115.0, lngMax: 115.5 },
  { slug: "mumbai",        name: "Mumbai",        latMin: 18.7, latMax: 19.4, lngMin: 72.4, lngMax: 73.3 },
  { slug: "delhi",         name: "Delhi",         latMin: 28.3, latMax: 29.1, lngMin: 76.7, lngMax: 77.5 },
  { slug: "bangalore",     name: "Bangalore",     latMin: 12.5, latMax: 13.4, lngMin: 77.2, lngMax: 78.0 },
  { slug: "hyderabad",     name: "Hyderabad",     latMin: 16.9, latMax: 17.8, lngMin: 78.0, lngMax: 78.9 },
  { slug: "pune",          name: "Pune",          latMin: 18.0, latMax: 18.9, lngMin: 73.4, lngMax: 74.3 },
  { slug: "chennai",       name: "Chennai",       latMin: 12.6, latMax: 13.5, lngMin: 79.8, lngMax: 80.8 },
  { slug: "kolkata",       name: "Kolkata",       latMin: 22.1, latMax: 22.9, lngMin: 88.0, lngMax: 88.8 },
  { slug: "jaipur",        name: "Jaipur",        latMin: 26.4, latMax: 27.2, lngMin: 75.4, lngMax: 76.2 },
  { slug: "karachi",       name: "Karachi",       latMin: 24.7, latMax: 25.2, lngMin: 66.8, lngMax: 67.4 },
  { slug: "lahore",        name: "Lahore",        latMin: 31.3, latMax: 31.7, lngMin: 74.1, lngMax: 74.5 },
  { slug: "goa",           name: "Goa",           latMin: 14.8, latMax: 15.8, lngMin: 73.3, lngMax: 74.3 },
  { slug: "ahmedabad",     name: "Ahmedabad",     latMin: 22.5, latMax: 23.3, lngMin: 72.3, lngMax: 73.2 },
  { slug: "lucknow",       name: "Lucknow",       latMin: 26.3, latMax: 27.1, lngMin: 80.5, lngMax: 81.3 },
  { slug: "chandigarh",    name: "Chandigarh",    latMin: 30.3, latMax: 31.1, lngMin: 76.3, lngMax: 77.2 },
  { slug: "indore",        name: "Indore",        latMin: 22.2, latMax: 23.0, lngMin: 75.4, lngMax: 76.2 },
  { slug: "coimbatore",    name: "Coimbatore",    latMin: 10.8, latMax: 11.2, lngMin: 76.8, lngMax: 77.2 },
  { slug: "tehran",        name: "Tehran",        latMin: 35.5, latMax: 36.0, lngMin: 51.0, lngMax: 51.7 },
  { slug: "jerusalem",     name: "Jerusalem",     latMin: 31.6, latMax: 31.9, lngMin: 35.1, lngMax: 35.4 },
];

// All 14 intent slugs used by intentSSR.ts
const INTENT_SLUGS = [
  "safe-neighborhoods",
  "quiet-neighborhoods",
  "walkable-neighborhoods",
  "affordable-areas",
  "cheap-rent",
  "cost-of-living",
  "expensive-neighborhoods",
  "luxury-real-estate",
  "transit-friendly",
  "nightlife-areas",
  "family-friendly",
  "best-areas-for-students",
  "best-areas-for-young-professionals",
  "expat-neighborhoods",
];

// All city links for the footer (keeps internal linking intact in every page)
const ALL_CITY_LINKS = CITIES.map(
  (c) => `<li><a href="/${c.slug}" style="color:#5eead4;text-decoration:none;font-size:13px;line-height:1.8">${c.name} Neighborhoods</a></li>`
).join("\n");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cityDescription(name) {
  return `Discover the best neighborhoods in ${name} based on real community insights. Check safety ratings, cost of living, and local vibes for every area in ${name} — crowd-sourced by people who actually live there.`;
}

function cityTitle(name) {
  return `${name} Neighborhoods — Real Local Reviews | PlaceLabels`;
}

function cityBreadcrumbSchema(slug, name) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "PlaceLabels", "item": "https://placelabels.com" },
      { "@type": "ListItem", "position": 2, "name": `${name} Neighborhoods`, "item": `https://placelabels.com/${slug}` },
    ],
  });
}

/**
 * Inline-styled body shell injected into #root so crawlers see real content.
 * React replaces this on hydration — it is never shown to real users with JS.
 */
function cityBodyShell(slug, name) {
  const desc = cityDescription(name);
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif;background:#f9fafb;min-height:100vh">
  <!-- nav -->
  <header style="background:#fff;border-bottom:1px solid #e5e7eb;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50">
    <a href="/" style="display:flex;align-items:center;gap:6px;color:#0d9488;font-weight:700;font-size:1rem;text-decoration:none">🌍 PlaceLabels</a>
    <a href="/" style="color:#0d9488;font-size:0.8rem;border:1px solid #99f6e4;border-radius:8px;padding:6px 12px;text-decoration:none">Open Map</a>
  </header>
  <!-- main -->
  <main style="max-width:900px;margin:0 auto;padding:40px 24px">
    <nav style="font-size:12px;color:#9ca3af;margin-bottom:20px">
      <a href="/" style="color:#0d9488;text-decoration:none">PlaceLabels</a>
      <span style="margin:0 6px">/</span>
      <span style="color:#374151">${name} Neighborhoods</span>
    </nav>
    <h1 style="font-size:2.25rem;font-weight:800;color:#111827;margin:0 0 12px">${name} Neighborhoods</h1>
    <p style="color:#6b7280;font-size:1.05rem;line-height:1.7;max-width:680px;margin:0 0 32px">${desc}</p>
    <div style="display:flex;align-items:center;gap:12px;padding:20px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;color:#6b7280;font-size:14px">
      <div style="width:20px;height:20px;border:3px solid #0d9488;border-top-color:transparent;border-radius:50%;flex-shrink:0"></div>
      Loading neighborhood data…
    </div>
    <p style="font-size:13px;color:#9ca3af;margin-top:16px">
      Explore the map for real-time neighborhood labels from locals.
      <a href="/" style="color:#0d9488;text-decoration:none"> Open interactive map →</a>
    </p>
  </main>
  <!-- city links footer for crawler internal linking -->
  <footer style="background:#111827;color:#d1d5db;padding:48px 24px 32px">
    <div style="max-width:900px;margin:0 auto">
      <p style="font-weight:700;font-size:14px;color:#fff;margin:0 0 20px;padding-bottom:12px;border-bottom:1px solid #374151">Explore Neighborhoods by City</p>
      <ul style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:2px;list-style:none;padding:0;margin:0 0 32px">
        ${ALL_CITY_LINKS}
      </ul>
      <p style="font-size:12px;color:#6b7280;text-align:center;margin:0;padding-top:20px;border-top:1px solid #374151">
        © ${new Date().getFullYear()} PlaceLabels — Crowd-sourced neighborhood intelligence · <a href="/" style="color:#5eead4;text-decoration:none">placelabels.com</a>
      </p>
    </div>
  </footer>
</div>`;
}

// ─── Sitemap helpers ──────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-");
}

function xmlEscape(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toIsoDate(d) {
  const date = d ? new Date(d) : new Date();
  return date.toISOString().split("T")[0];
}

function getCityForCoords(lat, lng) {
  return CITIES.find(
    (c) => lat >= c.latMin && lat <= c.latMax && lng >= c.lngMin && lng <= c.lngMax
  ) ?? null;
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

// ─── Database sitemap generator ──────────────────────────────────────────────

async function generateSitemap() {
  const today = toIsoDate(new Date());
  const BASE = "https://placelabels.com";

  const entries = [];

  // 1. Homepage
  entries.push(urlEntry(`${BASE}/`, today, "daily", "1.0"));

  // 2. City pages + intent pages (static — same regardless of DB content)
  for (const city of CITIES) {
    entries.push(urlEntry(`${BASE}/${city.slug}`, today, "weekly", "0.8"));
    for (const intent of INTENT_SLUGS) {
      entries.push(urlEntry(`${BASE}/${city.slug}/${intent}`, today, "weekly", "0.7"));
    }
  }

  // 3. Label pages — require DB query
  if (!process.env.DATABASE_URL) {
    console.warn("  ⚠  DATABASE_URL not set — skipping label pages in sitemap.");
  } else {
    let pool;
    try {
      const pg = (await import("pg")).default;
      pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

      const { rows: labels } = await pool.query(
        "SELECT lat, lng, text, created_at FROM labels ORDER BY created_at DESC"
      );

      // Deduplicate: one URL per city + slugified text combination
      const seen = new Set();
      let labelCount = 0;

      for (const row of labels) {
        const city = getCityForCoords(row.lat, row.lng);
        if (!city) continue;

        const labelSlug = slugify(row.text);
        const key = `${city.slug}/${labelSlug}`;
        if (seen.has(key)) continue;
        seen.add(key);

        entries.push(
          urlEntry(
            `${BASE}/${city.slug}/${labelSlug}`,
            toIsoDate(row.created_at),
            "weekly",
            "0.5"
          )
        );
        labelCount++;
      }

      console.log(`  ✓ Added ${labelCount} unique label URLs to sitemap`);
    } catch (err) {
      console.error("  ✗ DB query failed — sitemap written without label pages:", err.message);
    } finally {
      if (pool) await pool.end().catch(() => {});
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${entries.join("\n")}

</urlset>`;

  const sitemapPath = resolve(DIST, "sitemap.xml");
  writeFileSync(sitemapPath, xml, "utf-8");

  const cityCount   = CITIES.length;
  const intentCount = CITIES.length * INTENT_SLUGS.length;
  const totalUrls   = entries.length;
  console.log(`  ✓ sitemap.xml written → ${sitemapPath}`);
  console.log(`    1 homepage + ${cityCount} city + ${intentCount} intent + ${totalUrls - 1 - cityCount - intentCount} label = ${totalUrls} total URLs`);

  return totalUrls;
}

// ─── Google ping ─────────────────────────────────────────────────────────────

async function pingGoogle() {
  // Google requires the sitemap URL to be percent-encoded in the query string.
  const sitemapUrl = "https://placelabels.com/sitemap.xml";
  const PING_URL = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  try {
    const res = await fetch(PING_URL, { redirect: "follow" });
    if (res.ok || res.status === 204) {
      console.log(`  ✓ Google pinged (${res.status}) — sitemap reindex requested`);
    } else {
      // Non-fatal: Google deprecated the ping endpoint in June 2023.
      // Submit via Search Console for full control.
      console.warn(`  ⚠  Google ping returned ${res.status} (non-fatal — use Search Console for manual resubmission)`);
    }
  } catch (err) {
    console.warn(`  ⚠  Google ping failed (non-fatal): ${err.message}`);
  }
}

// ─── HTML prerender helpers ───────────────────────────────────────────────────

function patchHead(html, { title, description, canonical, breadcrumbSchema }) {
  // <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  // <meta name="description">
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${description}"`
  );

  // og:title / og:description / og:url
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/,   `$1${title}$2`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/,  `$1${description}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/,   `$1${canonical}$2`);

  // twitter:title / twitter:description
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/,  `$1${title}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/,  `$1${description}$2`);

  // canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${canonical}"`
  );

  // Inject city breadcrumb schema before </head>
  html = html.replace(
    "</head>",
    `<script type="application/ld+json">${breadcrumbSchema}</script>\n</head>`
  );

  return html;
}

function patchBody(html, bodyShell) {
  return html.replace(
    /<div id="root">[\s\S]*?<\/div>/,
    `<div id="root">${bodyShell}</div>`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  // ── Step 1: generate sitemap.xml with all label URLs ──
  // NOTE: City pages are intentionally NOT prerendered to static files.
  // Writing dist/public/{city}/index.html creates directory entries that cause
  // Replit's CDN to issue a 301 redirect (/mumbai → /mumbai/) before the
  // Express SSR handler ever runs. The /:citySlug Express SSR handler serves
  // all city pages directly with a 200 + correct SSR HTML — no files needed.
  console.log("\n🗺️  Generating sitemap.xml…");
  const totalUrls = await generateSitemap();

  // ── Step 2: ping Google ──
  console.log("\n📡 Pinging Google Search Console…");
  await pingGoogle();

  console.log(`\n✅ Done — ${totalUrls} URLs in sitemap.xml\n`);
}

run().catch((err) => { console.error(err); process.exit(1); });
