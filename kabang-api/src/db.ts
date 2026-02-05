import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

const sqlite = new Database("sqlite.db");
sqlite.run("PRAGMA journal_mode = WAL;");

// Initialize table if it doesn't exist
sqlite.run(`
  CREATE TABLE IF NOT EXISTS kabangs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bang TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL UNIQUE,
    category TEXT,
    is_default INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Add category column if it doesn't exist
try {
  sqlite.run(`ALTER TABLE kabangs ADD COLUMN category TEXT`);
} catch (e) {
  // Column already exists, ignore error
}

// Migration: Add is_default column if it doesn't exist
try {
  sqlite.run(`ALTER TABLE kabangs ADD COLUMN is_default INTEGER DEFAULT 0`);
} catch (e) {
  // Column already exists, ignore error
}

export const db = drizzle(sqlite);
