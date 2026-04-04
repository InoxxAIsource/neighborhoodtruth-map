import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { db, labelsTable, votesTable } from "@workspace/db";
import { eq, and, gte, lte, ne, sql, count } from "drizzle-orm";
import { z } from "zod";
import { CITIES } from "../lib/citySSR";

const router: IRouter = Router();

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatAskSchema = z.object({
  labelId: z.string().uuid(),
  question: z.string().min(1).max(500),
  conversationHistory: z.array(chatMessageSchema).max(20),
  costContext: z.string().max(600).optional(),
});

const RADIUS = 0.03;

type LabelRow = typeof labelsTable.$inferSelect;

async function buildContextExtras(lat: number, lng: number): Promise<string> {
  const extras: string[] = [];

  try {
    // Time-of-day context for transit questions
    const hour = new Date().getUTCHours();
    const istHour = (hour + 5) % 24;
    let timeCtx = "";
    if (istHour >= 8 && istHour <= 10) timeCtx = "It is currently morning rush hour (8–10 AM IST) — transit will be congested.";
    else if (istHour >= 17 && istHour <= 20) timeCtx = "It is currently evening rush hour (5–8 PM IST) — expect heavy traffic.";
    else if (istHour >= 22 || istHour <= 5) timeCtx = "It is currently late night/early morning — reduced transit, quieter streets.";
    else timeCtx = `Current time in India: ${istHour}:00 IST — off-peak hours, traffic should be normal.`;
    extras.push(timeCtx);

    // 30-day vote accuracy signal: count "accurate" votes in last 30 days for labels within RADIUS
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const accurateRows = await db
      .select({ total: count() })
      .from(votesTable)
      .innerJoin(labelsTable, eq(votesTable.labelId, labelsTable.id))
      .where(
        and(
          sql`${labelsTable.lat} >= ${lat - RADIUS} AND ${labelsTable.lat} <= ${lat + RADIUS}`,
          sql`${labelsTable.lng} >= ${lng - RADIUS} AND ${labelsTable.lng} <= ${lng + RADIUS}`,
          eq(votesTable.voteType, "accurate"),
          gte(votesTable.createdAt, thirtyDaysAgo),
        )
      );

    const totalVotesRows = await db
      .select({ total: count() })
      .from(votesTable)
      .innerJoin(labelsTable, eq(votesTable.labelId, labelsTable.id))
      .where(
        and(
          sql`${labelsTable.lat} >= ${lat - RADIUS} AND ${labelsTable.lat} <= ${lat + RADIUS}`,
          sql`${labelsTable.lng} >= ${lng - RADIUS} AND ${labelsTable.lng} <= ${lng + RADIUS}`,
          gte(votesTable.createdAt, thirtyDaysAgo),
        )
      );

    const accurateCount = accurateRows[0]?.total ?? 0;
    const totalCount = totalVotesRows[0]?.total ?? 0;

    if (totalCount > 0) {
      const pct = Math.round((Number(accurateCount) / Number(totalCount)) * 100);
      extras.push(`In the last 30 days, ${pct}% of community votes (${accurateCount}/${totalCount}) marked this area as still accurate.`);
    } else {
      extras.push("No recent vote accuracy data for this area in the last 30 days.");
    }

    // Median rental cost from label distribution in the area
    const areaLabels = await db
      .select({ cost: labelsTable.cost })
      .from(labelsTable)
      .where(
        and(
          sql`lat >= ${lat - RADIUS} AND lat <= ${lat + RADIUS}`,
          sql`lng >= ${lng - RADIUS} AND lng <= ${lng + RADIUS}`,
        )
      )
      .limit(50);

    if (areaLabels.length > 0) {
      const costMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
      const costNums = areaLabels.map((l) => costMap[l.cost] ?? 2).sort((a, b) => a - b);
      const mid = Math.floor(costNums.length / 2);
      const medianNum = costNums.length % 2 === 0 ? Math.round((costNums[mid - 1] + costNums[mid]) / 2) : costNums[mid];
      const costLabel = ["$", "$$", "$$$", "$$$$"][medianNum - 1] ?? "$$";
      const costHuman = { "$": "Budget (₹5k–₹15k/mo)", "$$": "Mid-range (₹15k–₹40k/mo)", "$$$": "Expensive (₹40k–₹80k/mo)", "$$$$": "Luxury (₹80k+/mo)" }[costLabel] ?? "Mid-range";
      extras.push(`Community rental cost median for this area: ${costLabel} — ${costHuman} (based on ${areaLabels.length} crowd labels).`);
    }
  } catch {
    // Non-critical; continue without extras
  }

  return extras.length > 0 ? `\nLIVE SIGNALS (use these for context when answering):\n${extras.map((e) => `• ${e}`).join("\n")}` : "";
}

function buildSystemPrompt(clickedLabel: LabelRow, nearbyLabels: LabelRow[], costContext?: string) {
  const formatLabel = (l: LabelRow) => {
    const score = l.upvotes - l.downvotes;
    const vibes = l.vibe?.length ? l.vibe.join(", ") : "none";
    const cat = l.category ? ` | Category: ${l.category}` : "";
    return `• "${l.text}" — Safety: ${l.safety}/5 | Cost: ${l.cost} | Vibes: ${vibes}${cat} | Score: ${score > 0 ? "+" : ""}${score}`;
  };

  const allLabels = [clickedLabel, ...nearbyLabels];
  const labelLines = allLabels.map(formatLabel).join("\n");

  const avgSafety = (allLabels.reduce((s, l) => s + l.safety, 0) / allLabels.length).toFixed(1);
  const costMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
  const avgCostNum = allLabels.reduce((s, l) => s + (costMap[l.cost] || 2), 0) / allLabels.length;
  const costLabel = ["$", "$$", "$$$", "$$$$"][Math.round(avgCostNum) - 1] ?? "$$";
  const vibeCounts: Record<string, number> = {};
  allLabels.forEach((l) => (l.vibe ?? []).forEach((v) => { vibeCounts[v] = (vibeCounts[v] || 0) + 1; }));
  const topVibes = Object.entries(vibeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, c]) => `${v} (×${c})`).join(", ");

  const costSection = costContext
    ? `\nLIVE COST INTELLIGENCE (use these EXACT numbers when answering price questions):\n${costContext}`
    : "";

  return `You are a sharp, knowledgeable local guide for PlaceLabels — a crowd-sourced global neighborhood map. Users click pins on the map and ask you real questions about living, visiting, or relocating to this area.

FOCAL NEIGHBORHOOD: "${clickedLabel.text}"
Coordinates: ${clickedLabel.lat.toFixed(4)}, ${clickedLabel.lng.toFixed(4)}
Area snapshot (${allLabels.length} crowd labels): avg safety ${avgSafety}/5 | typical cost ${costLabel} | top vibes: ${topVibes || "varied"}
${costSection}
NEARBY CROWD LABELS:
${labelLines}

ANSWERING RULES:
1. **Be specific and local** — give real numbers, real place names, real comparisons. Never give vague answers.
2. **Use crowd data first** — quote label names, safety scores, vibes. Then supplement with city knowledge.
3. **Flag general knowledge** — if going beyond crowd data, say "Based on this area generally..." once, briefly.
4. **Format clearly** — use **bold** for key points, short bullet lists (- item) for comparisons or breakdowns. No walls of text.
5. **Length** — 80–140 words max unless user asks for detail. One focused section, not a generic essay.
6. **Prices** — ALWAYS use the Live Cost Intelligence numbers when they exist. Quote them directly: "A coffee runs ${costContext ? "the actual range from the data" : "~$X–$Y"}."
7. **Never invent** crowd votes, labels, or fake price ranges.

TOPIC CHEAT SHEET:
- SAFETY: safety 4–5 = safe, 3 = moderate, 1–2 = take care. Mention specific label signals.
- COST/RENT: Use the Live Cost Intelligence data. If absent, use cost tier ($→$$$$) + city-level knowledge.
- TRANSPORT: Use "well-connected" tag or your knowledge of city transit in this district.
- NIGHTLIFE: "good-nightlife" tag + Bars category = active scene.
- FAMILY: high safety + "family-friendly" tag + Parks = good for families.
- EXPATS/NOMADS: safety + connectivity + cost — synthesise all three.
- RELIGION/CULTURE: use your real-world knowledge of this district; be respectful and factual.`;
}

router.post("/ask", async (req, res) => {
  const parsed = chatAskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { labelId, question, conversationHistory, costContext } = parsed.data;

  let clickedLabel: LabelRow | undefined;
  try {
    const rows = await db.select().from(labelsTable).where(eq(labelsTable.id, labelId)).limit(1);
    clickedLabel = rows[0];
  } catch (err) {
    req.log.error({ err }, "Failed to fetch label");
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  if (!clickedLabel) {
    res.status(404).json({ error: "Label not found" });
    return;
  }

  let nearbyLabels: LabelRow[] = [];
  try {
    nearbyLabels = await db
      .select()
      .from(labelsTable)
      .where(
        and(
          gte(labelsTable.lat, clickedLabel.lat - RADIUS),
          lte(labelsTable.lat, clickedLabel.lat + RADIUS),
          gte(labelsTable.lng, clickedLabel.lng - RADIUS),
          lte(labelsTable.lng, clickedLabel.lng + RADIUS),
          ne(labelsTable.id, labelId),
        ),
      )
      .limit(25);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch nearby labels");
  }

  const sortedNearby = nearbyLabels
    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));

  const liveExtras = await buildContextExtras(clickedLabel.lat, clickedLabel.lng);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const messages = [
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: question },
  ];

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: buildSystemPrompt(clickedLabel, sortedNearby, costContext) + liveExtras,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.write(`data: ${JSON.stringify({ error: "AI request failed, please try again" })}\n\n`);
    res.end();
  }
});

// ---- Migration Mode: /api/chat/relocate ----

const relocateSchema = z.object({
  citySlug: z.string().min(1).max(80),
  budget: z.enum(["5k-10k", "10k-20k", "20k-35k", "35k+"]),
  jobType: z.enum(["IT/Tech", "Student", "Government/PSU", "Business/Self-employed", "Healthcare", "Other"]),
  lifestyle: z.array(z.string()).max(10),
});

function buildRelocateSystemPrompt(
  cityName: string,
  cityLabels: LabelRow[],
  budget: string,
  jobType: string,
  lifestyle: string[]
) {
  const budgetInr: Record<string, string> = {
    "5k-10k": "₹5,000–₹10,000/mo",
    "10k-20k": "₹10,000–₹20,000/mo",
    "20k-35k": "₹20,000–₹35,000/mo",
    "35k+": "₹35,000+/mo",
  };

  // Compute city-level cost median
  const costMap: Record<string, number> = { "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 };
  const costNums = cityLabels.map((l) => costMap[l.cost] ?? 2);
  const avgCostNum = costNums.length > 0 ? costNums.reduce((s, c) => s + c, 0) / costNums.length : 2;
  const costMedianLabel = ["$", "$$", "$$$", "$$$$"][Math.round(avgCostNum) - 1] ?? "$$";
  const costMedianHuman = { "$": "Budget", "$$": "Mid-range", "$$$": "Expensive", "$$$$": "Luxury" }[costMedianLabel] ?? "Mid-range";

  // Group labels by area (text), pick the 30 highest-scored
  const areaScores: Map<string, { safety: number; cost: string; vibes: Set<string>; score: number; lat: number; lng: number }> = new Map();
  for (const l of cityLabels) {
    const key = l.text;
    if (!areaScores.has(key)) {
      areaScores.set(key, { safety: l.safety, cost: l.cost, vibes: new Set(l.vibe ?? []), score: 0, lat: l.lat, lng: l.lng });
    }
    const area = areaScores.get(key)!;
    area.score += l.upvotes - l.downvotes;
    (l.vibe ?? []).forEach((v) => area.vibes.add(v));
  }

  const topAreas = Array.from(areaScores.entries())
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 30)
    .map(([name, data]) => {
      const vibeList = Array.from(data.vibes).join(", ") || "—";
      return `• ${name} | Safety ${data.safety}/5 | Cost ${data.cost} | Vibes: ${vibeList} | Score: ${data.score > 0 ? "+" : ""}${data.score}`;
    })
    .join("\n");

  const lifestyleStr = lifestyle.length > 0 ? lifestyle.join(", ") : "No specific preferences";

  return `You are a relocation advisor for PlaceLabels — a crowd-sourced global neighborhood map. A user wants to move to ${cityName} and needs your help finding the right neighborhood.

USER PROFILE:
- Monthly rent budget: ${budgetInr[budget] ?? budget}
- Job type: ${jobType}
- Lifestyle priorities: ${lifestyleStr}

CITY COST INTELLIGENCE:
- ${cityName} community cost median: ${costMedianLabel} (${costMedianHuman}) — based on ${cityLabels.length} crowd labels

COMMUNITY DATA FOR ${cityName.toUpperCase()} (top ${Math.min(30, areaScores.size)} areas by community score):
${topAreas || "No data yet for this city — use your general knowledge."}

TASK: Recommend exactly 3 neighborhoods that best match the user's profile. For each area use EXACTLY this structure:
### [Neighborhood Name]
[2-line vibe summary referencing community data]
- [Trade-off 1]
- [Trade-off 2]
- [Trade-off 3]
📍 View on map

RULES:
- Prioritise areas from the community data above. Supplement with city knowledge only if data is thin.
- Match cost tier to budget: $ = Budget, $$ = Mid-range, $$$ = Expensive, $$$$ = Luxury.
- Match vibes to lifestyle: Women Safe → safety-priority users; IT Hub / Metro Access King → IT/Tech workers; Student Zone → students; Family Zone → families.
- Be direct and specific. No generic travel-guide filler. Max 220 words total.
- Always use "### Name" markdown headings (level 3) for each neighborhood title.
- If the city data is sparse, give your best recommendations using city knowledge and note it briefly.`;
}

router.post("/relocate", async (req, res) => {
  const parsed = relocateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { citySlug, budget, jobType, lifestyle } = parsed.data;
  const city = CITIES.find((c) => c.slug === citySlug);
  if (!city) {
    res.status(404).json({ error: "City not found" });
    return;
  }

  let cityLabels: LabelRow[] = [];
  try {
    cityLabels = await db
      .select()
      .from(labelsTable)
      .where(
        sql`lat >= ${city.latMin} AND lat <= ${city.latMax} AND lng >= ${city.lngMin} AND lng <= ${city.lngMax}`
      )
      .limit(500);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch city labels for relocation");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: buildRelocateSystemPrompt(city.name, cityLabels, budget, jobType, lifestyle),
      messages: [
        {
          role: "user",
          content: `Please recommend the 3 best neighborhoods in ${city.name} for me based on my profile above.`,
        },
      ],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Relocate AI error");
    res.write(`data: ${JSON.stringify({ error: "AI request failed, please try again" })}\n\n`);
    res.end();
  }
});

export default router;
