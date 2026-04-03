import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { db, labelsTable } from "@workspace/db";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { z } from "zod";

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
      system: buildSystemPrompt(clickedLabel, sortedNearby, costContext),
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

export default router;
