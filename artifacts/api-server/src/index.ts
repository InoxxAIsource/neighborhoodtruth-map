import app from "./app";
import { logger } from "./lib/logger";
import { seedIfNeeded } from "./seed";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function applyMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS label_tags (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        label_id uuid NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
        tag_key text NOT NULL,
        voter_id text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT label_tags_label_tag_voter_unique UNIQUE (label_id, tag_key, voter_id)
      )
    `);
    logger.info("Migrations applied (label_tags ready)");
  } catch (err) {
    logger.error({ err }, "Migration failed — continuing anyway");
  } finally {
    client.release();
  }
}

async function start() {
  try {
    await applyMigrations();
  } catch (err) {
    logger.error({ err }, "applyMigrations threw unexpectedly");
  }

  try {
    await seedIfNeeded();
  } catch (err) {
    logger.error({ err }, "Seed failed on startup — continuing anyway");
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

start();
