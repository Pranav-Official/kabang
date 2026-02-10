import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { readFileSync } from "fs";
import { join } from "path";
import { getAllKabangs } from "./db-service";
import { bangCache } from "./cache";
import { isDatabaseConnected, databaseType } from "./db";
import kabangsRouter from "./routes/kabangs";
import searchRouter from "./routes/search";
import suggestionsRouter from "./routes/suggestions";
import { handleSpecialBang } from "./routes/special-bangs";

// Custom CORS middleware
const corsMiddleware = async (c: any, next: any) => {
  c.header("Access-Control-Allow-Origin", "http://localhost:5123");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Max-Age", "86400");

  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }

  await next();
};

const app = new Hono();

const staticRoot = join(process.cwd(), "public", "ui-build");

// Middleware
if (process.env.NODE_ENV !== "production") {
  app.use(logger());
}

// Initialize cache
async function initializeCache(): Promise<void> {
  try {
    const allKabangs = await getAllKabangs();
    if (allKabangs.length > 0) {
      allKabangs.forEach(({ id, bang, url, name, category, isDefault }) => {
        bangCache.setFull({ 
          id, 
          bang, 
          url, 
          name: name || bang, 
          category: category || null,
          isDefault: isDefault || false
        });
      });
      console.log(`✅ Cache initialized: ${bangCache.size()} bangs from database`);
    } else {
      console.log("⚠️  No bangs found in database. Cache is empty.");
    }
  } catch (error) {
    console.error("⚠️  Cache initialization failed (database unavailable):", error);
    console.log("📝 Search and listing will work once database is available and bangs are added.");
  }
}

initializeCache().catch(console.error);

// Serve static assets FIRST (before API routes and SPA fallback)
app.use("/assets/*", serveStatic({ root: staticRoot }));
app.use("/favicon.ico", serveStatic({ path: join(staticRoot, "favicon.ico") }));
app.use(
  "/manifest.json",
  serveStatic({ path: join(staticRoot, "manifest.json") }),
);
app.use("/robots.txt", serveStatic({ path: join(staticRoot, "robots.txt") }));
app.use(
  "/tanstack-circle-logo.png",
  serveStatic({ path: join(staticRoot, "tanstack-circle-logo.png") }),
);
app.use(
  "/tanstack-word-logo-white.svg",
  serveStatic({ path: join(staticRoot, "tanstack-word-logo-white.svg") }),
);
app.use("/logo192.png", serveStatic({ path: join(staticRoot, "logo192.png") }));
app.use("/logo512.png", serveStatic({ path: join(staticRoot, "logo512.png") }));

// API Routes with CORS
app.use("/kabangs/*", corsMiddleware);
app.use("/search/*", corsMiddleware);
app.use("/suggestions/*", corsMiddleware);
app.use("/health", corsMiddleware);

// Health check endpoint
app.get("/health", async (c) => {
  const dbConnected = await isDatabaseConnected();
  return c.json({
    status: "ok",
    database: {
      type: databaseType,
      connected: dbConnected,
    },
    cache: {
      bangs: bangCache.size(),
    },
  });
});

app.get("/", corsMiddleware, (c) => c.text("Hello Hono!"));
app.route("/kabangs", kabangsRouter);

// Handle special bangs (!kabang, !add) before regular search
app.use("/search", async (c, next) => {
  const query = c.req.query("q") || "";
  const specialResult = await handleSpecialBang(c, query);
  if (specialResult) {
    return specialResult;
  }
  await next();
});
app.route("/search", searchRouter);

app.route("/suggestions", suggestionsRouter);

// Serve dashboard UI for /dashboard route
app.get("/dashboard", (c) => {
  try {
    const indexPath = join(staticRoot, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    return c.html(html);
  } catch (error) {
    console.error("Failed to read dashboard HTML:", error);
    return c.html(
      "<html><body><h1>Kabang Dashboard</h1><p>Error loading dashboard.</p></body></html>",
      500,
    );
  }
});

// SPA fallback - serve index.html for any other route (client-side routing)
app.get("/*", (c) => {
  try {
    const indexPath = join(staticRoot, "index.html");
    const html = readFileSync(indexPath, "utf-8");
    return c.html(html);
  } catch (error) {
    console.error("Failed to read index.html:", error);
    return c.html(
      "<html><body><h1>Kabang</h1><p>Error loading application.</p></body></html>",
      500,
    );
  }
});

export default app;
