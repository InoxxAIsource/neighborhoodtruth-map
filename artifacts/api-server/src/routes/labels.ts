import { Router, type IRouter } from "express";
import { db, labelsTable, votesTable, labelTagsTable } from "@workspace/db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const VALID_TAG_KEYS = [
  "safe-at-night",
  "noisy-on-weekends",
  "family-friendly",
  "expensive",
  "good-nightlife",
  "quiet",
  "good-for-students",
  "well-connected",
] as const;

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
  voteType: z.enum(["upvote", "downvote", "accurate"]),
});

const tagSchema = z.object({
  tagKey: z.enum(VALID_TAG_KEYS),
  voterId: z.string().min(1),
});

function formatLabel(row: typeof labelsTable.$inferSelect, topTags?: string[]) {
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
    topTags: topTags ?? [],
  };
}

router.get("/", async (req, res) => {
  try {
    const labels = await db.select().from(labelsTable).orderBy(labelsTable.createdAt);

    if (!labels.length) {
      res.json([]);
      return;
    }

    const labelIds = labels.map((l) => l.id);

    const tagRows = await db
      .select({
        labelId: labelTagsTable.labelId,
        tagKey: labelTagsTable.tagKey,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(labelTagsTable)
      .where(inArray(labelTagsTable.labelId, labelIds))
      .groupBy(labelTagsTable.labelId, labelTagsTable.tagKey);

    const tagsByLabel: Record<string, { tagKey: string; count: number }[]> = {};
    for (const row of tagRows) {
      if (!tagsByLabel[row.labelId]) tagsByLabel[row.labelId] = [];
      tagsByLabel[row.labelId].push({ tagKey: row.tagKey, count: row.count });
    }

    const result = labels.map((l) => {
      const tags = (tagsByLabel[l.id] ?? [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((t) => t.tagKey);
      return formatLabel(l, tags);
    });

    res.json(result);
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

    res.status(201).json(formatLabel(label, []));
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

router.get("/:id/tags", async (req, res) => {
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

    const tags = await db
      .select({
        tagKey: labelTagsTable.tagKey,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(labelTagsTable)
      .where(eq(labelTagsTable.labelId, id))
      .groupBy(labelTagsTable.tagKey)
      .orderBy(desc(sql`count(*)`));

    res.json(tags);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch tags");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/tags", async (req, res) => {
  const { id } = req.params;
  const parsed = tagSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { tagKey, voterId } = parsed.data;

  try {
    const [label] = await db.select({ id: labelsTable.id })
      .from(labelsTable)
      .where(eq(labelsTable.id, id))
      .limit(1);

    if (!label) {
      res.status(404).json({ error: "Label not found" });
      return;
    }

    const existingVoterTags = await db
      .select({ tagKey: labelTagsTable.tagKey })
      .from(labelTagsTable)
      .where(and(eq(labelTagsTable.labelId, id), eq(labelTagsTable.voterId, voterId)));

    const alreadyTaggedThisKey = existingVoterTags.some((t) => t.tagKey === tagKey);
    if (!alreadyTaggedThisKey && existingVoterTags.length >= 4) {
      res.status(400).json({ error: "Max 4 tags per label per voter" });
      return;
    }

    const result = await db
      .insert(labelTagsTable)
      .values({ labelId: id, tagKey, voterId })
      .onConflictDoNothing()
      .returning({ id: labelTagsTable.id });

    if (!result.length) {
      res.status(200).json({ ok: true, duplicate: true });
      return;
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to add tag");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
