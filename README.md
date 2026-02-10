# 🚀 Kabang

> *The search shortcut system you never knew you needed (but totally do)*

**Kabang** is your own, self-hosted, completely customizable search bang service — heavily inspired by DuckDuckGo's legendary `!bang` shortcuts. Ever wished you could type `!gh react hooks` and magically land on GitHub's search results? Or `!yt lo-fi beats` and be vibing in seconds? **Now you can. And it's all yours.**

No tracking. No third-party reliance. Just pure, unadulterated search power at your fingertips.

---

## 🎯 What the heck is a "Bang"?

Remember DuckDuckGo's `!w` for Wikipedia? `!a` for Amazon? That's a **bang** — a magical prefix that instantly routes your search to the right place. Kabang brings that same superpower to your own server, with *your* custom shortcuts.

```
!g   cats playing piano    → Google search
!yt  lofi beats           → YouTube search
!gh  rust async           → GitHub search
!gmail                    → Instantly open Gmail (no query needed!)
```

**Pro tip:** URLs without `{query}` work as instant shortcuts. Type `!gmail` → boom, you're in your inbox.

---

## 🏗️ Architecture

This project is a beautiful monorepo with three musketeers:

```
📦 kabang/
├── 📁 kabang-api/        # The brain (Hono + Bun + SQLite)
├── 📁 kabang-ui/         # The face (React + Tailwind + TanStack)
└── 📁 kabang-collections/# Pre-made bang collections (JSON)
```

### 🎨 Frontend (kabang-ui/)
- **Framework:** React 19
- **Router:** TanStack Router
- **Styling:** Tailwind CSS 4
- **State:** TanStack Query
- **Icons:** Lucide React
- **Build:** Vite

### ⚡ Backend (kabang-api/)
- **Runtime:** Bun
- **Framework:** Hono
- **Database:** SQLite (default) or PostgreSQL via Drizzle ORM
- **Cache:** In-memory cache for bang lookups

### 📚 Collections (kabang-collections/)
Pre-made JSON files with popular bangs you can import. Starting with `base.json` — 25+ bangs ready to go!

---

## 🚀 Getting Started

The fastest way to get Kabang running? **Docker.** One command and you're bangin'! 💥

---

## 🐳 Docker (The Easy Way)

No dependencies to install. No build steps to remember. Just:

### Using Docker Compose (Recommended)

#### SQLite (Default - Zero Configuration)
```bash
# Clone the repo
git clone <repo-url>
cd kabang

# Start it up
docker-compose up -d
```

That's it! Access Kabang at `http://localhost:5674`
Data is persisted in `./data/sqlite.db`

#### PostgreSQL (Optional)
```bash
# Create .env file with your PostgreSQL connection string
echo "POSTGRES_CONNECTION_STRING=postgresql://user:password@host:5432/database?sslmode=require" > .env

# Start it up
docker-compose up -d
```

### Using Docker/Podman directly

#### SQLite (Default)
```bash
# Build the image
docker build -t kabang .
# OR with Podman
podman build -t kabang .

# Run it
docker run -p 5674:5674 -v ./data:/app/kabang-api/data kabang
# OR with Podman
podman run -p 5674:5674 -v ./data:/app/kabang-api/data kabang
```

#### PostgreSQL (Optional)
```bash
# Build the image
docker build -t kabang .

# Run with PostgreSQL connection string
docker run -p 5674:5674 -e POSTGRES_CONNECTION_STRING="postgresql://user:password@host:5432/database?sslmode=require" kabang
```

**What the Docker image does automatically:**
1. ✅ Installs all dependencies
2. ✅ Builds the React UI
3. ✅ Seeds the database with 25+ bangs from base collection
4. ✅ Starts the API server on port 5674

**📋 Configuration Reference:**
See `.env.example` for all available environment variables and configuration options.

---

## 🔨 Build from Source (For Developers)

Want to hack on Kabang? Build it from source!

### Prerequisites
- [Bun](https://bun.sh/) installed
- A terminal and a dream
- (Optional) PostgreSQL database if you want to use PostgreSQL instead of SQLite

### 🏃 Quick Start

#### 1. Install dependencies
```bash
# In kabang-api/
cd kabang-api
bun install

# In kabang-ui/
cd ../kabang-ui
bun install
```

#### 2. Set up the database

**Option A: SQLite (Default - No configuration needed)**
```bash
cd kabang-api
bun run src/db.ts  # This initializes your SQLite database
```

**Option B: PostgreSQL (Optional)**
```bash
cd kabang-api

# Set the environment variable
export POSTGRES_CONNECTION_STRING="postgresql://user:password@host:5432/database?sslmode=require"

# Or create a .env file
echo "POSTGRES_CONNECTION_STRING=postgresql://user:password@host:5432/database?sslmode=require" > .env
```

#### 3. Build the UI (Required!)
```bash
cd kabang-api
bun run build-ui
```

This command:
1. Builds the React UI into static files
2. Copies them to `kabang-api/public/ui-build/`
3. Makes the dashboard available at `/` when the API runs

#### 4. Start the server
```bash
cd kabang-api
bun run dev     # Development mode (hot reload)
# OR
bun run start   # Production mode
```

Your Kabang server is now running at `http://localhost:5674` 🎉

---

## 🎮 How to Use

### 🔧 Setting Up Your Browser

To use bangs, you need to set Kabang as your browser's search engine:

1. Open your browser settings
2. Add a new search engine with this URL:
   ```
   http://localhost:5674/search?q=%s
   ```
3. Make it your default search engine

Now you can type `!kabang` in your address bar to access the dashboard.

### 🔍 Bang Suggestions (Autocomplete)

Kabang supports the OpenSearch Suggestions Extension 1.1 standard, which enables autocomplete in your browser's address bar:

**Suggestion URL:**
```
http://localhost:5674/suggestions?q={searchTerms}
```

**Response Format:**
```json
[
  "!gi",
  ["!g", "!gh", "!gmail"],
  ["Google (Search)", "GitHub (Development)", "Gmail (Utilities)"],
  []
]
```

**Behavior:**
- Returns fuzzy-matched bang suggestions as you type
- Stops suggesting once a valid bang is detected (e.g., `!g` won't suggest other bangs)
- Shows bang name and category in the description

**Setting up in your browser:**
1. Add the search engine with suggestion URL:
   ```
   http://localhost:5674/suggestions?q=%s
   ```
2. The browser will automatically show bang suggestions as you type `!`

### Accessing the Dashboard

Once your server is running, open your browser and go to:
```
http://localhost:5674/dashboard
```

### 📝 Managing Bangs

The dashboard lets you:
- ✅ **Add** new bangs with custom triggers
- ✏️ **Edit** existing ones
- 🗑️ **Delete** the ones you don't need
- ⭐ **Set a default** (for when you search without a bang)
- 📤 **Export** all your bangs to JSON
- 📥 **Import** bangs from JSON files

### 🎁 Importing Pre-made Collections

Don't want to start from scratch? Import our curated collection:

1. Go to the Dashboard
2. Click **"Import"**
3. Select `kabang-collections/base.json`
4. Boom! 25+ bangs instantly added

Or import your own custom JSON:
```json
[
  {
    "name": "My Custom Search",
    "bang": "custom",
    "url": "https://example.com/search?q={query}",
    "category": "Custom",
  }
]
```

---

## 🛠️ Development Workflow

### Running in Development Mode

**Terminal 1 - API:**
```bash
cd kabang-api
bun run dev
```

**Terminal 2 - UI (optional, for hot reload):**
```bash
cd kabang-ui
bun run dev  # Runs on port 5123
```

The UI dev server proxies API requests, so you get instant feedback on UI changes.

### Building for Production

Always build from the API directory:
```bash
cd kabang-api
bun run build      # Full build (UI + API)
```

This ensures the UI is bundled and copied to the API's public folder.

### Database Migrations

Using Drizzle Kit:
```bash
cd kabang-api
bun drizzle-kit generate  # Generate migrations
bun drizzle-kit push      # Apply to database
```

---

## 🎨 Customization Ideas

- **Company internal bangs:** `!wiki`, `!jira`, `!slack`
- **Personal shortcuts:** `!cal` → Google Calendar, `!drive` → Google Drive
- **Developer tools:** `!npm`, `!mdn`, `!caniuse`
- **Shopping:** `!amz`, `!ebay`, `!etsy`

The possibilities are endless! 🌈

---

## 🧪 Tech Stack Deep Dive

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Bun | Fast JavaScript runtime with built-in bundler, test runner, and package manager |
| **API Framework** | Hono | Minimal, fast, and middleware-friendly web framework |
| **Database** | SQLite + Drizzle | Zero-config, lightweight, type-safe ORM |
| **Frontend** | React 19 | Latest and greatest with improved performance |
| **Styling** | Tailwind CSS 4 | Utility-first, dark mode built-in, no CSS files to manage |
| **Routing** | TanStack Router | File-based routing with automatic code splitting |
| **State** | TanStack Query | Server state synchronization made simple |
| **Build Tool** | Vite | Lightning fast HMR and optimized production builds |

---

## 🐛 Troubleshooting

### "Cannot find module" errors
Make sure you've run `bun install` in both `kabang-api/` and `kabang-ui/`

### UI shows 404
You forgot to build! Run `bun run build-ui` in the API directory.

### Database locked
SQLite doesn't like multiple processes. Make sure you only have one instance of the API running.

### PostgreSQL connection failed
If using PostgreSQL, ensure:
- `POSTGRES_CONNECTION_STRING` is set correctly
- The connection string format is: `postgresql://user:password@host:port/database?sslmode=require`
- For Docker, the variable is in your `.env` file or docker-compose.yml
- For manual builds, export it in your shell or create a `.env` file in `kabang-api/`

### Port already in use
The API runs on port 5674 by default. Change it in `kabang-api/src/server.ts` if needed.

---

## 📝 License

MIT — Go wild. Make it yours. Build something cool.

---

## 🙏 Credits

- Inspired by [DuckDuckGo Bangs](https://duckduckgo.com/bang) — the OG shortcut masters
- Built with ❤️ and way too much coffee

---

## 💬 Final Words

> "Why type more when you can type less?" 
> — Ancient Kabang Proverb

Happy banging! 🚀

---

**P.S.** If you build something awesome with Kabang, show it off! We'd love to see what shortcuts you create.

**P.P.S.** Yes, `!kabang` opens this dashboard. We couldn't resist.
