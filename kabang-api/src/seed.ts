import { db } from "./db";
import { kabangs } from "./schema";

const popularBangs = [
  // Search engines
  {
    name: "Google",
    bang: "g",
    url: "https://www.google.com/search?q={query}",
    category: "Search",
    isDefault: true,
  },
  {
    name: "Bing",
    bang: "b",
    url: "https://www.bing.com/search?q={query}",
    category: "Search",
  },
  {
    name: "DuckDuckGo",
    bang: "ddg",
    url: "https://duckduckgo.com/?q={query}",
    category: "Search",
  },
  {
    name: "Brave Search",
    bang: "brave",
    url: "https://search.brave.com/search?q={query}",
    category: "Search",
  },
  {
    name: "Ecosia",
    bang: "eco",
    url: "https://www.ecosia.org/search?q={query}",
    category: "Search",
  },

  // Social media
  {
    name: "YouTube",
    bang: "yt",
    url: "https://www.youtube.com/results?search_query={query}",
    category: "Social",
  },
  {
    name: "Twitter/X",
    bang: "x",
    url: "https://x.com/search?q={query}",
    category: "Social",
  },
  {
    name: "Reddit",
    bang: "r",
    url: "https://www.reddit.com/search/?q={query}",
    category: "Social",
  },
  {
    name: "Instagram",
    bang: "ig",
    url: "https://www.instagram.com/explore/tags/{query}/",
    category: "Social",
  },
  {
    name: "LinkedIn",
    bang: "li",
    url: "https://www.linkedin.com/search/results/all/?keywords={query}",
    category: "Social",
  },

  // Development
  {
    name: "GitHub",
    bang: "gh",
    url: "https://github.com/search?q={query}&type=repositories",
    category: "Development",
  },
  {
    name: "Stack Overflow",
    bang: "so",
    url: "https://stackoverflow.com/search?q={query}",
    category: "Development",
  },
  {
    name: "MDN Web Docs",
    bang: "mdn",
    url: "https://developer.mozilla.org/en-US/search?q={query}",
    category: "Development",
  },
  {
    name: "npm",
    bang: "npm",
    url: "https://www.npmjs.com/search?q={query}",
    category: "Development",
  },
  {
    name: "Docker Hub",
    bang: "docker",
    url: "https://hub.docker.com/search?q={query}",
    category: "Development",
  },

  // Shopping
  {
    name: "Amazon",
    bang: "amz",
    url: "https://www.amazon.com/s?k={query}",
    category: "Shopping",
  },

  // Reference
  {
    name: "Wikipedia",
    bang: "w",
    url: "https://en.wikipedia.org/wiki/Special:Search?search={query}",
    category: "Reference",
  },
  {
    name: "Wiktionary",
    bang: "wt",
    url: "https://en.wiktionary.org/wiki/Special:Search?search={query}",
    category: "Reference",
  },
  {
    name: "Dictionary.com",
    bang: "dict",
    url: "https://www.dictionary.com/browse/{query}",
    category: "Reference",
  },

  // Maps & Travel
  {
    name: "Google Maps",
    bang: "maps",
    url: "https://www.google.com/maps/search/{query}",
    category: "Maps",
  },
  {
    name: "OpenStreetMap",
    bang: "osm",
    url: "https://www.openstreetmap.org/search?query={query}",
    category: "Maps",
  },

  // News
  {
    name: "Google News",
    bang: "news",
    url: "https://news.google.com/search?q={query}",
    category: "News",
  },

  // Entertainment
  {
    name: "Spotify",
    bang: "spotify",
    url: "https://open.spotify.com/search/{query}",
    category: "Entertainment",
  },
  {
    name: "Netflix",
    bang: "netflix",
    url: "https://www.netflix.com/search?q={query}",
    category: "Entertainment",
  },
  {
    name: "IMDb",
    bang: "imdb",
    url: "https://www.imdb.com/find?q={query}",
    category: "Entertainment",
  },

  // Utilities
  {
    name: "Wayback Machine",
    bang: "wayback",
    url: "https://web.archive.org/web/*/{query}",
    category: "Utilities",
  },
  {
    name: "Translate",
    bang: "tr",
    url: "https://translate.google.com/?text={query}",
    category: "Utilities",
  },
  {
    name: "Gmail",
    bang: "gmail",
    url: "https://mail.google.com/mail/u/0/#search/{query}",
    category: "Utilities",
  },

  // AI/Chat
  {
    name: "ChatGPT",
    bang: "chat",
    url: "https://chat.openai.com/?q={query}",
    category: "AI",
  },
  {
    name: "Claude",
    bang: "claude",
    url: "https://claude.ai/new?q={query}",
    category: "AI",
  },
  {
    name: "Perplexity",
    bang: "p",
    url: "https://www.perplexity.ai/search?q={query}",
    category: "AI",
  },

  // Files/Documents
  {
    name: "Google Drive",
    bang: "drive",
    url: "https://drive.google.com/drive/search?q={query}",
    category: "Files",
  },
  {
    name: "Google Docs",
    bang: "docs",
    url: "https://docs.google.com/document/u/0/?q={query}",
    category: "Files",
  },
];

async function seed() {
  console.log("Seeding database with popular bangs...\n");

  let inserted = 0;
  let skipped = 0;

  for (const bang of popularBangs) {
    try {
      await db.insert(kabangs).values(bang);
      const defaultMark = bang.isDefault ? " [DEFAULT]" : "";
      console.log(`✓ Added: ${bang.name} (!${bang.bang}) [${bang.category}]${defaultMark}`);
      inserted++;
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        console.log(`○ Skipped: ${bang.name} (!${bang.bang}) - already exists`);
        skipped++;
      } else {
        console.error(`✗ Error: ${bang.name} - ${error.message}`);
      }
    }
  }

  console.log(`\n───────────────────────`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${popularBangs.length}`);
  console.log("───────────────────────\n");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
