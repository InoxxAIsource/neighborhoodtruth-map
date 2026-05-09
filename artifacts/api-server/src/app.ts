import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { generateSitemapXml } from "./lib/sitemap";
import { getCityHtml } from "./lib/citySSR";
import { getIntentHtml } from "./lib/intentSSR";
import { getNeighborhoodHtml } from "./lib/neighborhoodSSR";

// Path to the built SPA static assets (JS, CSS, XML, etc.)
// Served by express.static BEFORE any route handlers so that
// /sitemap.xml, /robots.txt, and other static files get their
// correct Content-Type instead of being caught by the SPA handler.
const STATIC_DIR = path.resolve(__dirname, "../../neighborhood-truth/dist/public");

// Path to the built SPA index.html — served as the catch-all for any
// route not handled by SSR or the Replit static file layer.
// Uses __dirname so the path is consistent whether running from
// the workspace root (deployed) or the package dir (dev).
const SPA_INDEX = path.resolve(__dirname, "../../neighborhood-truth/dist/public/index.html");

function serveSpaCatchAll(res: Response): void {
  if (fs.existsSync(SPA_INDEX)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(SPA_INDEX);
  } else {
    res.status(404).send("Not found");
  }
}

const app: Express = express();

// Trust Cloudflare's forwarded headers so Express sees the real
// visitor IP and protocol (X-Forwarded-For, X-Forwarded-Proto).
app.set("trust proxy", 1);

// www → non-www permanent redirect (handled at app level as a fallback
// in case the Cloudflare redirect rule is not firing)
app.use((req, res, next) => {
  const host = req.headers.host || "";
  if (host.startsWith("www.")) {
    const nonWww = host.slice(4);
    return res.redirect(301, `https://${nonWww}${req.originalUrl}`);
  }
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(compression());

// www → non-www permanent redirect.
// Runs before everything else so www.placelabels.com always lands on the
// canonical root domain. Safe with Cloudflare Full SSL — no loop risk because
// the redirect target (placelabels.com) never redirects back to www.
app.use((req: Request, res: Response, next) => {
  if (req.hostname?.startsWith("www.")) {
    const target = `https://placelabels.com${req.url}`;
    return res.redirect(301, target);
  }
  next();
});

app.use(cors());

// HSTS — tell browsers to always use HTTPS for this domain (1 year).
// Only meaningful once a valid TLS certificate is in place.
app.use((_req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 1. Dynamic sitemap — must come BEFORE express.static so it takes priority
//    over the prebuilt dist/public/sitemap.xml (which may be stale after deploys).
app.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const xml = await generateSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    logger.error({ err }, "Failed to generate sitemap");
    res.status(500).send("Sitemap generation failed");
  }
});

// ── 2. Static assets ─────────────────────────────────────────────────────────
// Must be BEFORE all other app.get() routes and the catch-all wildcard.
// { index: false } — don't auto-serve index.html for directories (SSR handles those).
// { redirect: false } — don't 301 /foo to /foo/ for directory entries.
// Cache headers: hashed assets (JS/CSS/images) get 1-year immutable; HTML no-cache.
app.use(
  express.static(STATIC_DIR, {
    index: false,
    redirect: false,
    etag: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        // HTML must never be cached — a new deploy should be seen immediately.
        res.setHeader("Cache-Control", "no-cache");
      } else if (/\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|webp|avif|gif|ico|svg)$/.test(filePath)) {
        // Vite emits content-hashed filenames for all JS/CSS/images, so
        // 1-year immutable is safe — the hash changes on every deploy.
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filePath.endsWith(".xml") || filePath.endsWith(".json") || filePath.endsWith(".txt")) {
        // Sitemaps, manifests, and text files: 1-hour cache with revalidation.
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    },
  }),
);

// ── 3. Specific route handlers ────────────────────────────────────────────────

app.get("/llms.txt", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(
    [
      "# NeighborhoodTruth",
      "",
      "> Crowd-sourced neighborhood reviews and honest local insights for cities worldwide.",
      "",
      "NeighborhoodTruth (placelabels.com) is an interactive map where locals drop labels, vote on community insights, and share honest reviews about neighborhood safety, affordability, nightlife, and family-friendliness. Data is entirely crowd-sourced and covers hundreds of cities globally.",
      "",
      "## Key Features",
      "",
      "- Drop geo-tagged labels with structured tags (safe-at-night, quiet, family-friendly, good-nightlife, affordable, expensive, good-for-students, tourist-heavy, up-and-coming)",
      "- Upvote or downvote community labels to surface the most accurate insights",
      "- Filter the map by tag type and explore neighborhood sentiment",
      "- AI-powered neighborhood chat: ask questions and get context-aware answers about any area",
      "- City and intent pages with aggregated neighborhood data",
      "",
      "## Explore",
      "",
      "- [Interactive Map](https://placelabels.com/) - Browse all crowd-sourced neighborhood labels worldwide",
      "- [New York City](https://placelabels.com/new-york) - Neighborhood insights across NYC",
      "- [Safe Neighborhoods in New York](https://placelabels.com/new-york/safe-neighborhoods)",
      "- [Affordable Areas in New York](https://placelabels.com/new-york/affordable-areas)",
      "- [San Francisco](https://placelabels.com/san-francisco)",
      "- [Los Angeles](https://placelabels.com/los-angeles)",
      "- [London](https://placelabels.com/london)",
      "- [Tokyo](https://placelabels.com/tokyo)",
      "- [Mumbai](https://placelabels.com/mumbai)",
      "- [Bangalore](https://placelabels.com/bangalore)",
      "- [Delhi](https://placelabels.com/delhi)",
      "- [Mumbai Safe Neighborhoods](https://placelabels.com/mumbai/safe-neighborhoods)",
      "- [Bangalore Affordable Areas](https://placelabels.com/bangalore/affordable-areas)",
      "",
      "## Sitemap",
      "",
      "https://placelabels.com/sitemap.xml",
      "",
    ].join("\n")
  );
});

app.get("/robots.txt", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(
    [
      "User-agent: *",
      "Allow: /",
      "",
      "Disallow: /api/",
      "",
      "Sitemap: https://placelabels.com/sitemap.xml",
      "",
    ].join("\n")
  );
});

app.get("/api/healthz", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// SSR for homepage — injects H1 + key content for crawlers; React hydrates on load
app.get("/", (_req: Request, res: Response) => {
  const { ssrHtmlShell } = require("./lib/ssrShared");
  const html = ssrHtmlShell({
    title: "PlaceLabels | Honest Neighborhood Reviews from Real Locals",
    description: "Crowd-sourced global neighborhood map. Real locals share honest insights on safety, cost, and vibe — drop a label, vote, and discover the truth about any neighborhood worldwide.",
    canonical: "https://placelabels.com/",
    ogImage: "https://placelabels.com/og-image.png",
    bodyHtml: `
      <div style="text-align:center;padding:3rem 1rem 2rem;">
        <h1 style="font-size:2.5rem;font-weight:900;line-height:1;text-transform:uppercase;letter-spacing:-0.03em;margin-bottom:1rem;">
          What's your neighbourhood <em style="color:#FA76FF;font-style:italic;">really</em> like?
        </h1>
        <p style="font-size:1.125rem;color:#4b5563;max-width:36rem;margin:0 auto 2rem;">
          Crowd-sourced neighborhood insights from real locals. Drop a label, vote on vibes, and discover honest reviews on safety, cost of living, and character — for any neighborhood, anywhere in the world.
        </p>
        <a href="/labels" style="display:inline-block;background:#0d9488;color:#fff;font-weight:700;padding:0.875rem 2rem;border-radius:0.5rem;text-decoration:none;font-size:1rem;">
          Explore the Map →
        </a>
      </div>
      <section style="max-width:48rem;margin:3rem auto 0;">
        <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem;">Explore neighborhoods by city</h2>
        <ul style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:0.5rem;list-style:none;padding:0;">
          <li><a href="/mumbai">Mumbai</a></li>
          <li><a href="/delhi">Delhi</a></li>
          <li><a href="/bangalore">Bangalore</a></li>
          <li><a href="/hyderabad">Hyderabad</a></li>
          <li><a href="/pune">Pune</a></li>
          <li><a href="/new-york">New York</a></li>
          <li><a href="/london">London</a></li>
          <li><a href="/tokyo">Tokyo</a></li>
          <li><a href="/dubai">Dubai</a></li>
          <li><a href="/singapore">Singapore</a></li>
        </ul>
      </section>
    `,
  });
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(html);
});

// API router must be registered BEFORE wildcard SSR routes to prevent
// /:citySlug/:intentSlug from catching /api/labels, /api/chat, etc.
app.use("/api", router);

// SSR routes for city and intent pages
app.get("/:citySlug/:secondSlug", async (req: Request, res: Response) => {
  try {
    const citySlug = req.params.citySlug as string;
    const secondSlug = req.params.secondSlug as string;

    // 1. Try known intent slugs first (safe-neighborhoods, affordable-areas, etc.)
    let html = await getIntentHtml(citySlug, secondSlug);

    // 2. If not an intent, try neighborhood/label slug (e.g. cubbon-park-morning-jogs-peaceful)
    if (!html) {
      html = await getNeighborhoodHtml(citySlug, secondSlug);
    }

    // 3. If still no match, fall back to serving the SPA
    if (!html) {
      serveSpaCatchAll(res);
      return;
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(html);
  } catch (err) {
    logger.error({ err }, "Failed to render intent/neighborhood page");
    res.status(500).send("Page rendering failed");
  }
});

app.get("/:citySlug", async (req: Request, res: Response) => {
  try {
    const citySlug = req.params.citySlug as string;
    const html = await getCityHtml(citySlug);
    if (!html) {
      // Unknown city — serve the SPA so React can handle it
      serveSpaCatchAll(res);
      return;
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(html);
  } catch (err) {
    logger.error({ err }, "Failed to render city page");
    res.status(500).send("Page rendering failed");
  }
});

// Catch-all: serve the React SPA for any route not matched above.
// Replit's static layer already serves static assets (JS/CSS/images),
// so this only fires for HTML navigation requests.
// Express 5 requires a named wildcard parameter (not bare *).
app.get("/{*wildcard}", (_req: Request, res: Response) => {
  serveSpaCatchAll(res);
});

export default app;
