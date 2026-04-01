import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { generateSitemapXml } from "./lib/sitemap";

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      "- [New York City](https://placelabels.com/city/new-york) - Neighborhood insights across NYC",
      "- [Safe Neighborhoods in New York](https://placelabels.com/city/new-york/safe-neighborhoods)",
      "- [Affordable Areas in New York](https://placelabels.com/city/new-york/affordable-areas)",
      "- [San Francisco](https://placelabels.com/city/san-francisco)",
      "- [Los Angeles](https://placelabels.com/city/los-angeles)",
      "- [London](https://placelabels.com/city/london)",
      "- [Tokyo](https://placelabels.com/city/tokyo)",
      "- [Berlin](https://placelabels.com/city/berlin)",
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

app.use("/api", router);

export default app;
