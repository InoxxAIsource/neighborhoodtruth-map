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
app.use(cors());

// HSTS — tell browsers to always use HTTPS for this domain (1 year).
// Only meaningful once a valid TLS certificate is in place.
app.use((_req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 1. Static assets ─────────────────────────────────────────────────────────
// Must be BEFORE all app.get() routes and the catch-all wildcard.
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

// ── 2. Specific route handlers ────────────────────────────────────────────────
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
