import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { z } from "zod";

const router: IRouter = Router();

const labelContextSchema = z.object({
  id: z.string(),
  text: z.string(),
  lat: z.number(),
  lng: z.number(),
  safety: z.number(),
  vibe: z.array(z.string()).nullable().optional(),
  cost: z.string(),
  upvotes: z.number(),
  downvotes: z.number(),
  category: z.string().nullable().optional(),
});

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatAskSchema = z.object({
  question: z.string().min(1).max(500),
  conversationHistory: z.array(chatMessageSchema).max(20),
  clickedLabel: labelContextSchema,
  nearbyLabels: z.array(labelContextSchema).max(30),
});

function buildSystemPrompt(
  clickedLabel: z.infer<typeof labelContextSchema>,
  nearbyLabels: z.infer<typeof labelContextSchema>[],
) {
  const formatLabel = (l: z.infer<typeof labelContextSchema>) => {
    const score = l.upvotes - l.downvotes;
    const vibes = l.vibe?.length ? l.vibe.join(", ") : "none";
    return `• "${l.text}" — Safety: ${l.safety}/5 | Cost: ${l.cost} | Vibes: ${vibes} | Community score: ${score > 0 ? "+" : ""}${score}`;
  };

  const allLabels = [clickedLabel, ...nearbyLabels.filter((l) => l.id !== clickedLabel.id)];
  const labelLines = allLabels.map(formatLabel).join("\n");

  return `You are a hyper-local neighborhood guide for NeighborhoodTruth — a crowd-sourced map of real neighborhood insights from residents and visitors worldwide.

NEIGHBORHOOD DATA around "${clickedLabel.text}" (lat: ${clickedLabel.lat.toFixed(4)}, lng: ${clickedLabel.lng.toFixed(4)}):
${labelLines}

GUIDELINES:
- Answer questions using the crowd-sourced data above. Reference specific labels and vote counts when relevant (e.g., "42 people call this area 'hipster'").
- Be honest about what the data does and doesn't show.
- Keep answers concise — under 160 words unless the user asks for more detail.
- Use a friendly, direct tone. You're like a knowledgeable local friend.
- If the data doesn't answer the question, say so and offer what you can infer.
- Never make up facts not supported by the label data.`;
}

router.post("/ask", async (req, res) => {
  const parsed = chatAskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { question, conversationHistory, clickedLabel, nearbyLabels } = parsed.data;

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
      system: buildSystemPrompt(clickedLabel, nearbyLabels),
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
