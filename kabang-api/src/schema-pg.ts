import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const kabangs = pgTable("kabangs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bang: text("bang").notNull().unique(),
  url: text("url").notNull().unique(),
  category: text("category"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Kabang = typeof kabangs.$inferSelect;
export type NewKabang = typeof kabangs.$inferInsert;
