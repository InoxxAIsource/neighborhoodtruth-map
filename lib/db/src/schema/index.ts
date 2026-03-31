import { pgTable, uuid, doublePrecision, varchar, smallint, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
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
}, (t) => [
  unique("votes_label_voter_unique").on(t.labelId, t.voterId),
]);

export const commentsTable = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  labelId: uuid("label_id").notNull().references(() => labelsTable.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  body: varchar("body", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const labelTagsTable = pgTable("label_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  labelId: uuid("label_id").notNull().references(() => labelsTable.id, { onDelete: "cascade" }),
  tagKey: text("tag_key").notNull(),
  voterId: text("voter_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique("label_tags_label_tag_voter_unique").on(t.labelId, t.tagKey, t.voterId),
]);

export const insertLabelSchema = createInsertSchema(labelsTable).omit({ id: true, createdAt: true });
export const insertVoteSchema = createInsertSchema(votesTable).omit({ id: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, createdAt: true });
export const insertLabelTagSchema = createInsertSchema(labelTagsTable).omit({ id: true, createdAt: true });

export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Label = typeof labelsTable.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votesTable.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;
export type InsertLabelTag = z.infer<typeof insertLabelTagSchema>;
export type LabelTag = typeof labelTagsTable.$inferSelect;
