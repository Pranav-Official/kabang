import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Database } from "bun:sqlite";
import { Pool } from "pg";
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
let pgPool: Pool | null = null;

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
    
    // Use Pool instead of Client for better connection handling
    pgPool = new Pool({
      connectionString: postgresConnectionString,
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Return error after 5 seconds if connection not established
      // Keepalive settings to prevent connection timeouts
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000, // Start keepalive after 10 seconds
    });
    
    // Handle pool errors - CRITICAL: must catch these to prevent crash
    pgPool.on('error', (err, client) => {
      console.error('PostgreSQL pool error (caught safely):', err.message || err);
      isDbConnected = false;
      // Don't crash - just log and mark as disconnected
      // The next query will trigger a reconnection attempt
    });
    
    // Handle client errors on acquisition
    pgPool.on('connect', (client) => {
      client.on('error', (err) => {
        console.error('PostgreSQL client error (caught safely):', err.message || err);
      });
    });
    
    // Handle acquire errors
    pgPool.on('acquire', (client) => {
      client.on('error', (err) => {
        console.error('PostgreSQL acquire error (caught safely):', err.message || err);
      });
    });
    
    // Test connection by running a simple query
    const client = await pgPool.connect();
    await client.query('SELECT 1');
    client.release();
    
    // Initialize PostgreSQL table
    const setupClient = await pgPool.connect();
    await setupClient.query(`
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
    setupClient.release();
    
    db = drizzlePg(pgPool);
    isDbConnected = true;
    console.log("✅ PostgreSQL pool connected successfully");
    return true;
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error);
    isDbConnected = false;
    if (pgPool) {
      await pgPool.end().catch(() => {});
      pgPool = null;
    }
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
  initializePostgres().then((success) => {
    if (!success) {
      console.log("⚠️  Falling back to cache-only mode (PostgreSQL unavailable)");
    }
  }).catch((err) => {
    console.error("Failed to initialize PostgreSQL:", err);
    console.log("⚠️  Falling back to cache-only mode");
  });
} else {
  initializeSqlite();
}

// Function to check if DB is available - also verifies the connection is still alive
export async function isDatabaseConnected(): Promise<boolean> {
  if (!isDbConnected || !pgPool) return false;
  
  // For PostgreSQL, verify the pool is still healthy
  if (dbType === "postgresql" && pgPool) {
    try {
      const client = await pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error("PostgreSQL health check failed:", error);
      isDbConnected = false;
      return false;
    }
  }
  
  return isDbConnected;
}

// Function to retry PG connection
export async function retryPostgresConnection(): Promise<boolean> {
  if (dbType === "postgresql" && !isDbConnected && postgresConnectionString) {
    console.log("🔄 Retrying PostgreSQL connection...");
    
    // Clean up old pool if exists
    if (pgPool) {
      await pgPool.end().catch(() => {});
      pgPool = null;
    }
    
    return await initializePostgres();
  }
  return isDbConnected;
}

// Cleanup function for graceful shutdown
export async function closeDatabase(): Promise<void> {
  if (pgPool) {
    console.log("Closing PostgreSQL pool...");
    await pgPool.end();
    pgPool = null;
    isDbConnected = false;
  }
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
