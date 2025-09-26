import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  hashedPassword: text("hashed_password").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

// Sessions table removed - using JWT instead

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  reportDate: text("report_date").notNull(), // YYYY-MM-DD format
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const customEmojis = sqliteTable("custom_emojis", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const reactions = sqliteTable("reactions", {
  id: text("id").primaryKey(),
  reportId: text("report_id")
    .notNull()
    .references(() => reports.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  emojiName: text("emoji_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;