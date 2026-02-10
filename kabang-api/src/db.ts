import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Database } from "bun:sqlite";
import { Client } from "pg";
import { sqliteTable, text as sqliteText, integer } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export type DatabaseType = "sqlite" | "postgresql";

const postgresConnectionString = process.env.POSTGRES_CONNECTION_STRING;
const sqliteDbPath = process.env.SQLITE_DB_PATH || "sqlite.db";

let db: any;
let dbType: DatabaseType;
let kabangs: any;
let isDbConnected = false;
let pgClient: Client | null = null;

async function initializePostgres(): Promise<boolean> {
  if (!postgresConnectionString) return false;
  
  try {
    // Define PostgreSQL table
    kabangs = pgTable("kabangs", {
      id: serial("id").primaryKey(),
      name: pgText("name").notNull(),
      bang: pgText("bang").notNull().unique(),
      url: pgText("url").notNull().unique(),
      category: pgText("category"),
      isDefault: boolean("is_default").default(false),
      createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    });
    
    pgClient = new Client({
      connectionString: postgresConnectionString,
    });
    
    await pgClient.connect();
    
    // Initialize PostgreSQL table
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS kabangs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        bang TEXT NOT NULL UNIQUE,
        url TEXT NOT NULL UNIQUE,
        category TEXT,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db = drizzlePg(pgClient);
    isDbConnected = true;
    console.log("✅ PostgreSQL connected successfully");
    return true;
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error);
    isDbConnected = false;
    return false;
  }
}

function initializeSqlite(): void {
  dbType = "sqlite";
  
  // Define SQLite table
  kabangs = sqliteTable("kabangs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: sqliteText("name").notNull(),
    bang: sqliteText("bang").notNull().unique(),
    url: sqliteText("url").notNull().unique(),
    category: sqliteText("category"),
    isDefault: integer("is_default", { mode: "boolean" }).default(false),
    createdAt: sqliteText("created_at").default(sql`CURRENT_TIMESTAMP`),
  });
  
  const sqlite = new Database(sqliteDbPath);
  sqlite.run("PRAGMA journal_mode = WAL;");
  
  // Initialize SQLite table
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
  
  db = drizzleSqlite(sqlite);
  isDbConnected = true;
  console.log("✅ SQLite initialized successfully");
}

// Initialize database
if (postgresConnectionString) {
  dbType = "postgresql";
  const pgInitialized = await initializePostgres();
  if (!pgInitialized) {
    console.log("⚠️  Falling back to cache-only mode (PostgreSQL unavailable)");
  }
} else {
  initializeSqlite();
}

// Function to check if DB is available
export function isDatabaseConnected(): boolean {
  return isDbConnected;
}

// Function to retry PG connection
export async function retryPostgresConnection(): Promise<boolean> {
  if (dbType === "postgresql" && !isDbConnected && postgresConnectionString) {
    console.log("🔄 Retrying PostgreSQL connection...");
    return await initializePostgres();
  }
  return isDbConnected;
}

// Export types
export type Kabang = {
  id: number;
  name: string;
  bang: string;
  url: string;
  category: string | null;
  isDefault: boolean;
  createdAt: string | Date;
};

export type NewKabang = Omit<Kabang, 'id' | 'createdAt'>;

export { db, kabangs };
export const databaseType: DatabaseType = dbType;
