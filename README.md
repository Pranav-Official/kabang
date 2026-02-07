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

## 🏗️ Architecture (aka "How the Magic Happens")

This project is a beautiful monorepo with three musketeers:

```
📦 kabang/
├── 📁 kabang-api/        # The brain (Hono + Bun + SQLite)
├── 📁 kabang-ui/         # The face (React + Tailwind + TanStack)
└── 📁 kabang-collections/# Pre-made bang collections (JSON)
```

### 🎨 Frontend (@kabang-ui/)
- **Framework:** React 19 (living on the edge!)
- **Router:** TanStack Router (file-based routing, because why not)
- **Styling:** Tailwind CSS 4 (utility-first goodness)
- **State:** TanStack Query (server state management wizardry)
- **Icons:** Lucide React (gorgeous, consistent icons)
- **Build:** Vite (blazing fast, because life is too short for slow builds)

### ⚡ Backend (@kabang-api/)
- **Runtime:** Bun (JavaScript on steroids)
- **Framework:** Hono (lightning-fast, minimal web framework)
- **Database:** SQLite via Drizzle ORM (simple, fast, no hassle)
- **Cache:** In-memory cache for bang lookups (because speed matters)

### 📚 Collections (@kabang-collections/)
Pre-made JSON files with popular bangs you can import. Starting with `base.json` — 25+ bangs ready to go!

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed (the entire stack runs on Bun)
- A terminal and a dream

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
```bash
cd kabang-api
bun run src/db.ts  # This initializes your SQLite database
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

Your Kabang server is now running at `http://localhost:3000` 🎉

---

## 🎮 How to Use

### Accessing the Dashboard

Once your server is running, open your browser and go to:
```
http://localhost:3000
```

Or type `!kabang` in the search box — yes, we added a bang for our own dashboard because we're meta like that.

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
    "isDefault": false
  }
]
```

---

## 🔧 Setting Up Your Browser

To actually *use* bangs, you need to set Kabang as your browser's search engine:

1. Open your favorite browser settings
2. Add a new search engine with this URL:
   ```
   http://localhost:5674/search?q=%s
   ```
3. Make it your default search engine
4. Type `!kabang` in your address bar to access the dashboard

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

### Port already in use
The API runs on port 3000 by default. Change it in `kabang-api/src/server.ts` if needed.

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
