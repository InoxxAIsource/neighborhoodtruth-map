/**
 * Post-build prerender script for PlaceLabels.
 *
 * After `vite build`, this script reads dist/public/index.html and generates
 * a city-specific index.html for each of the 36 city routes so that
 * Googlebot (which does not execute JavaScript) sees real, meaningful HTML
 * instead of a blank <div id="root"></div>.
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

// ─── City list (slug → display name) ────────────────────────────────────────
const CITIES = [
  { slug: "new-york",      name: "New York" },
  { slug: "san-francisco", name: "San Francisco" },
  { slug: "los-angeles",   name: "Los Angeles" },
  { slug: "toronto",       name: "Toronto" },
  { slug: "mexico-city",   name: "Mexico City" },
  { slug: "buenos-aires",  name: "Buenos Aires" },
  { slug: "london",        name: "London" },
  { slug: "amsterdam",     name: "Amsterdam" },
  { slug: "rome",          name: "Rome" },
  { slug: "istanbul",      name: "Istanbul" },
  { slug: "tel-aviv",      name: "Tel Aviv" },
  { slug: "cairo",         name: "Cairo" },
  { slug: "cape-town",     name: "Cape Town" },
  { slug: "tokyo",         name: "Tokyo" },
  { slug: "seoul",         name: "Seoul" },
  { slug: "hong-kong",     name: "Hong Kong" },
  { slug: "bali",          name: "Bali" },
  { slug: "mumbai",        name: "Mumbai" },
  { slug: "delhi",         name: "Delhi" },
  { slug: "bangalore",     name: "Bangalore" },
  { slug: "hyderabad",     name: "Hyderabad" },
  { slug: "pune",          name: "Pune" },
  { slug: "chennai",       name: "Chennai" },
  { slug: "kolkata",       name: "Kolkata" },
  { slug: "jaipur",        name: "Jaipur" },
  { slug: "karachi",       name: "Karachi" },
  { slug: "lahore",        name: "Lahore" },
  { slug: "goa",           name: "Goa" },
  { slug: "ahmedabad",     name: "Ahmedabad" },
  { slug: "lucknow",       name: "Lucknow" },
  { slug: "chandigarh",    name: "Chandigarh" },
  { slug: "indore",        name: "Indore" },
  { slug: "coimbatore",    name: "Coimbatore" },
  { slug: "tehran",        name: "Tehran" },
  { slug: "jerusalem",     name: "Jerusalem" },
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

// ─── Main ─────────────────────────────────────────────────────────────────────

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
  return html.replace('<div id="root"></div>', `<div id="root">${bodyShell}</div>`);
}

async function run() {
  if (!existsSync(TEMPLATE_PATH)) {
    console.error(`✗ Template not found at ${TEMPLATE_PATH}`);
    console.error("  Run `pnpm build` (Vite step) before prerendering.");
    process.exit(1);
  }

  const template = readFileSync(TEMPLATE_PATH, "utf-8");
  let ok = 0;

  for (const { slug, name } of CITIES) {
    const title       = cityTitle(name);
    const description = cityDescription(name);
    const canonical   = `https://placelabels.com/${slug}`;
    const schema      = cityBreadcrumbSchema(slug, name);

    let html = patchHead(template, { title, description, canonical, breadcrumbSchema: schema });
    html = patchBody(html, cityBodyShell(slug, name));

    const dir = resolve(DIST, slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, "index.html"), html, "utf-8");

    console.log(`  ✓ /${slug}  (${name} Neighborhoods)`);
    ok++;
  }

  console.log(`\n🎉 Prerender complete — ${ok}/${CITIES.length} city pages written to dist/public/`);
}

run().catch((err) => { console.error(err); process.exit(1); });
