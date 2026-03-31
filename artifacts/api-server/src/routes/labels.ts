import { Router, type IRouter } from "express";
import { db, labelsTable, votesTable, commentsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
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
    const [existing] = await db.select({ id: labelsTable.id })
      .from(labelsTable)
      .where(eq(labelsTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Label not found" });
      return;
    }

    try {
      await db.insert(votesTable).values({ labelId: id, voterId, voteType });
    } catch (insertErr: unknown) {
      const msg = insertErr instanceof Error ? insertErr.message : String(insertErr);
      if (msg.includes("votes_label_voter_unique") || msg.includes("unique") || msg.includes("duplicate")) {
        res.status(400).json({ error: "Already voted" });
        return;
      }
      throw insertErr;
    }

    const [updated] = await db.update(labelsTable)
      .set({
        upvotes: voteType === "upvote"
          ? sql`${labelsTable.upvotes} + 1`
          : labelsTable.upvotes,
        downvotes: voteType === "downvote"
          ? sql`${labelsTable.downvotes} + 1`
          : labelsTable.downvotes,
      })
      .where(eq(labelsTable.id, id))
      .returning();

    res.json(formatLabel(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to vote");
    res.status(500).json({ error: "Internal server error" });
  }
});

const createCommentSchema = z.object({
  authorId: z.string().min(1),
  body: z.string().min(1).max(200),
});

router.get("/:id/comments", async (req, res) => {
  const { id } = req.params;

  try {
    const [label] = await db.select({ id: labelsTable.id })
      .from(labelsTable)
      .where(eq(labelsTable.id, id))
      .limit(1);

    if (!label) {
      res.status(404).json({ error: "Label not found" });
      return;
    }

    const comments = await db.select({
      id: commentsTable.id,
      authorId: commentsTable.authorId,
      body: commentsTable.body,
      createdAt: commentsTable.createdAt,
    })
      .from(commentsTable)
      .where(eq(commentsTable.labelId, id))
      .orderBy(desc(commentsTable.createdAt))
      .limit(5);

    res.json(comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch comments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/comments", async (req, res) => {
  const { id } = req.params;
  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [label] = await db.select({ id: labelsTable.id })
      .from(labelsTable)
      .where(eq(labelsTable.id, id))
      .limit(1);

    if (!label) {
      res.status(404).json({ error: "Label not found" });
      return;
    }

    const [comment] = await db.insert(commentsTable)
      .values({ labelId: id, authorId: parsed.data.authorId, body: parsed.data.body })
      .returning();

    res.status(201).json({ ...comment, createdAt: comment.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to post comment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
