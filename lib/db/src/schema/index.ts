import { pgTable, uuid, doublePrecision, varchar, smallint, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const labelsTable = pgTable("labels", {
  id: uuid("id").defaultRandom().primaryKey(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  text: varchar("text", { length: 80 }).notNull(),
  safety: smallint("safety").notNull(),
  vibe: text("vibe").array().default([]),
  cost: varchar("cost", { length: 8 }).notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  color: text("color").default("#6b7280"),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const votesTable = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  labelId: uuid("label_id").notNull().references(() => labelsTable.id, { onDelete: "cascade" }),
  voterId: text("voter_id").notNull(),
  voteType: text("vote_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertLabelSchema = createInsertSchema(labelsTable).omit({ id: true, createdAt: true });
export const insertVoteSchema = createInsertSchema(votesTable).omit({ id: true, createdAt: true });

export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Label = typeof labelsTable.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;
