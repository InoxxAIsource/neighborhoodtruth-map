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
});

const RADIUS = 0.03;

type LabelRow = typeof labelsTable.$inferSelect;

function buildSystemPrompt(clickedLabel: LabelRow, nearbyLabels: LabelRow[]) {
  const formatLabel = (l: LabelRow) => {
    const score = l.upvotes - l.downvotes;
    const vibes = l.vibe?.length ? l.vibe.join(", ") : "none";
    const cat = l.category ? ` | Category: ${l.category}` : "";
    return `• "${l.text}" — Safety: ${l.safety}/5 | Cost: ${l.cost} | Vibes: ${vibes}${cat} | Community score: ${score > 0 ? "+" : ""}${score} (${l.upvotes} up, ${l.downvotes} down)`;
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

  return `You are a hyper-local neighborhood guide for PlaceLabels — a crowd-sourced global map powered by real insights from residents and visitors worldwide.

FOCAL LABEL: "${clickedLabel.text}"
Location: lat ${clickedLabel.lat.toFixed(4)}, lng ${clickedLabel.lng.toFixed(4)}
Area summary (${allLabels.length} crowd-sourced data points): avg safety ${avgSafety}/5 | typical cost ${costLabel} | top vibes: ${topVibes || "varied"}

ALL NEARBY CROWD-SOURCED LABELS:
${labelLines}

YOUR ROLE — answer questions drawing on:
1. CROWD DATA FIRST: The labels above are your primary evidence. Quote specific labels and scores.
2. GENERAL WORLD KNOWLEDGE (secondary): When the data is thin, you may supplement with well-established facts about the real-world location this lat/lng corresponds to — but always flag it ("Based on what I know about this area generally...").

TOPIC GUIDANCE:
• SAFETY & CRIME: Use safety ratings (1=very unsafe, 5=very safe) and community sentiment. A safety of 3+ is generally acceptable; 1-2 suggests caution. Mention if labels specifically note crime or safety issues.
• POPULATION & DENSITY: Infer from vibe tags (Loud=dense/busy, Chill=quieter), label count in area, and your general knowledge of the city/district.
• RELIGION & CULTURAL DEMOGRAPHICS: These rarely appear in label text, so use your general knowledge of the real-world city/district — mention the dominant religions, cultural communities, and religious sites if relevant. Be respectful and factual.
• LIFESTYLE: Draw on vibe tags (Artsy, Nightlife, Family, Bougie, Chill, Loud) and category data (Bars, Parks, Cafes, etc.) to describe the day-to-day feel of living or visiting here.
• NIGHTLIFE: Labels tagged "Nightlife" + category "Bars" indicate a scene; low safety + nightlife = rowdier area. Describe the nightlife character honestly.
• FAMILY-FRIENDLINESS: High safety + Family vibe + Parks/Playgrounds category = family-friendly. Low safety or Nightlife-dominant = less ideal for families.
• COST OF LIVING: $ = budget to moderate, $$$-$$$$ = expensive/affluent. Triangulate with city-level knowledge.
• TRANSIT & COMMUTE: If labels mention transit/metro, use that. Otherwise draw on your general knowledge of the city's transit network in that district.

RESPONSE RULES:
- Stay concise: under 180 words unless the user explicitly asks for more detail.
- Cite the crowd data when relevant: e.g., "The community gives this area a safety of 4/5 and calls it 'Chill'."
- Be honest when data is sparse — say so and supplement with general knowledge.
- Use a friendly, direct tone like a knowledgeable local friend.
- Never invent crowd data points. Invented votes or fake labels are not acceptable.`;
}

router.post("/ask", async (req, res) => {
  const parsed = chatAskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { labelId, question, conversationHistory } = parsed.data;

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
      max_tokens: 8192,
      system: buildSystemPrompt(clickedLabel, sortedNearby),
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
