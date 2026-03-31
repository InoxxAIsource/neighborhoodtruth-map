import { Router, type IRouter } from "express";
import { db, labelsTable, votesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const createLabelSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  text: z.string().min(1).max(80),
  safety: z.number().int().min(1).max(5),
  vibe: z.array(z.string()).optional().default([]),
  cost: z.enum(["$", "$$", "$$$", "$$$$"]),
  color: z.string().optional().default("#6b7280"),
  category: z.string().nullable().optional(),
});

const voteSchema = z.object({
  voterId: z.string().min(1),
  voteType: z.enum(["upvote", "downvote"]),
});

function formatLabel(row: typeof labelsTable.$inferSelect) {
  return {
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    text: row.text,
    safety: row.safety,
    vibe: row.vibe ?? [],
    cost: row.cost,
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    color: row.color,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const labels = await db.select().from(labelsTable).orderBy(labelsTable.createdAt);
    res.json(labels.map(formatLabel));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch labels");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const parsed = createLabelSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [label] = await db.insert(labelsTable).values({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      text: parsed.data.text,
      safety: parsed.data.safety,
      vibe: parsed.data.vibe,
      cost: parsed.data.cost,
      color: parsed.data.color,
      category: parsed.data.category ?? null,
    }).returning();

    res.status(201).json(formatLabel(label));
  } catch (err) {
    req.log.error({ err }, "Failed to create label");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my-votes", async (req, res) => {
  const { voterId } = req.query;
  if (typeof voterId !== "string" || !voterId) {
    res.status(400).json({ error: "voterId is required" });
    return;
  }

  try {
    const votes = await db.select({
      labelId: votesTable.labelId,
      voteType: votesTable.voteType,
    }).from(votesTable).where(eq(votesTable.voterId, voterId));

    res.json(votes);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch votes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/vote", async (req, res) => {
  const { id } = req.params;
  const parsed = voteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { voterId, voteType } = parsed.data;

  try {
    const [existing] = await db.select({ id: labelsTable.id, upvotes: labelsTable.upvotes, downvotes: labelsTable.downvotes })
      .from(labelsTable)
      .where(eq(labelsTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Label not found" });
      return;
    }

    const [existingVote] = await db.select({ id: votesTable.id })
      .from(votesTable)
      .where(and(eq(votesTable.labelId, id), eq(votesTable.voterId, voterId)))
      .limit(1);

    if (existingVote) {
      res.status(400).json({ error: "Already voted" });
      return;
    }

    await db.insert(votesTable).values({ labelId: id, voterId, voteType });

    const newUpvotes = voteType === "upvote" ? existing.upvotes + 1 : existing.upvotes;
    const newDownvotes = voteType === "downvote" ? existing.downvotes + 1 : existing.downvotes;

    const [updated] = await db.update(labelsTable)
      .set({ upvotes: newUpvotes, downvotes: newDownvotes })
      .where(eq(labelsTable.id, id))
      .returning();

    res.json(formatLabel(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to vote");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
