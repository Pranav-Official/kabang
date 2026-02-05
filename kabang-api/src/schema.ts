import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const kabangs = sqliteTable("kabangs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  bang: text("bang").notNull().unique(),
  url: text("url").notNull().unique(),
  category: text("category"),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Optional: Export types for use in your React app
export type Kabang = typeof kabangs.$inferSelect;
export type NewKabang = typeof kabangs.$inferInsert;
