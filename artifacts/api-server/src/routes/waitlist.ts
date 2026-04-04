import { Router, type IRouter } from "express";
import { db, waitlistTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const waitlistSchema = z.object({
  email: z.string().email().max(200),
  cityInterest: z.string().max(80).optional(),
});

router.post("/", async (req, res) => {
  const parsed = waitlistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const { email, cityInterest } = parsed.data;

  try {
    await db
      .insert(waitlistTable)
      .values({ email, cityInterest: cityInterest ?? null })
      .onConflictDoNothing();
    res.json({ ok: true, message: "You're on the list!" });
  } catch (err) {
    req.log.error({ err }, "Waitlist insert error");
    res.status(500).json({ error: "Failed to join waitlist" });
  }
});

export default router;
