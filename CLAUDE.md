# Watch Scout — Claude Code Guide

**HANDOVER NOTE:** You are taking over from a previous Claude Code session. This file is your primary context. The project is fully deployed and working. Read this entire file before making any changes.

---

## What This Project Does

A web app that searches Tokyo used watch stores and US websites for live prices on pre-owned watches, then compares Tokyo (tax-free for US tourists) vs US (NYC tax 8.875% + $35 shipping) with live JPY/USD conversion, store info, and buying tips.

**Currently tracked watches:**
- **Tudor Black Bay 58** (ref M79030)
- **Tudor Black Bay 54** (ref M79000)
- **Rolex Oyster Perpetual** (refs 124300/126000)
- **Rolex Explorer** (ref 124270)

Adding a new watch = add one object to `WATCH_CONFIG` array in `src/App.jsx`.

---

## Live URLs

| What | URL |
|------|-----|
| **Live site** | https://watch-scout.netlify.app |
| **GitHub repo** | https://github.com/blackinkservices/watch-scout |
| **Netlify dashboard** | https://app.netlify.com/projects/watch-scout |
| **Anthropic console** | https://console.anthropic.com (org: Black Ink Business Services) |

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Serverless backend | Netlify Functions (Node.js) |
| AI / search | Anthropic Claude claude-sonnet-4-20250514 with web_search_20250305 tool |
| Hosting | Netlify (manual deploys via `netlify deploy --prod` from local) |
| Repo | GitHub (blackinkservices/watch-scout, master branch) |

---

## Project Structure

```
watch-scout/
├── CLAUDE.md                    ← You are here
├── README.md                    ← User-facing docs
├── INSTRUCTIONS.md              ← Setup walkthrough for new users
├── index.html                   ← Vite entry point (MUST be at root, not public/)
├── netlify.toml                 ← Build config + redirect rules
├── vite.config.js               ← Vite + dev proxy config
├── package.json
├── .env                         ← API key (gitignored, never commit)
├── .env.example                 ← Template
├── .gitignore
├── netlify/
│   └── functions/
│       └── search.js            ← Serverless proxy (API key lives here)
└── src/
    ├── main.jsx                 ← React entry point
    └── App.jsx                  ← Entire application (~700 lines)
```

---

## Environment & Accounts

| Item | Details |
|------|---------|
| **Anthropic API key** | Named "watch-scout" in console. Set in `.env` locally AND in Netlify env vars |
| **API tier** | 30,000 input tokens per minute (TPM) — this is the main constraint |
| **Anthropic balance** | ~$9.47 remaining (as of Apr 2026) |
| **GitHub account** | blackinkservices |
| **Netlify account** | Black Ink Business Services (team slug: black-ink-business-services) |
| **GitHub CLI** | Installed at `"/c/Program Files/GitHub CLI/gh.exe"` — may not be in PATH |

---

## How the Agent Works (src/App.jsx)

### Search Flow — 2 searches + 1 synthesis = 3 API calls

The agent makes exactly **2 web search calls** + **1 synthesis call**:

| # | Label | What it does |
|---|-------|-------------|
| 1 | "Searching Tokyo prices" | One broad query across all Tokyo stores (Komehyo, Jackroad, Ginza Rasin, Daikokuya) with EN + JP search terms |
| 2 | "Searching US prices" | One broad query across all US sites (Chrono24, Bob's Watches, WatchBox, SwissWatchExpo) + exchange rate |
| 3 | "Building your report…" | Synthesis call (NO web_search tool) — compiles results into structured JSON |

**Rate limit strategy:**
- 25-second delay between web search calls
- Total: ~19k input tokens in ~50s — safely under the 30k TPM limit
- Auto-retry on 429 (rate limit) and 529 (overloaded) with 15/30/45s exponential backoff
- Non-JSON responses from Netlify/Cloudflare are caught and retried

### Watch Selector Dropdown

Users can select "All Watches" or a single watch from a dropdown. The `buildSteps()` function dynamically generates search queries based on the selection. Searching a single watch uses the same 2+1 call pattern but with narrower queries.

### Key Constants

```js
const TAX  = 0.08875   // NYC sales tax rate
const SHIP = 35        // estimated shipping cost in USD
```

### Data Config (top of App.jsx)

```js
WATCH_CONFIG = [...]  // 4 watch objects with id, brand, displayName, searchTerms, searchTermsJP, etc.
US_SITES = [...]      // 4 US dealer objects with name and domain
TOKYO_STORES = "..."  // Space-separated store names for search queries
DROPDOWN_OPTIONS      // Derived from WATCH_CONFIG
```

---

## Architecture: How API Calls Work

```
Browser
  → POST /api/search            (relative URL, handled by netlify.toml redirect)
  → /.netlify/functions/search  (Netlify Function)
  → https://api.anthropic.com/v1/messages  (with API key injected server-side)
```

The Netlify Function at `netlify/functions/search.js` is a thin proxy.
It reads `process.env.ANTHROPIC_API_KEY` and forwards the request body to Anthropic.
The API key is **never** in the frontend code or visible in the browser.

The function handles non-JSON responses from Anthropic (e.g., Cloudflare HTML error pages during outages) by wrapping them in a JSON error object.

---

## Common Commands

```bash
# Install dependencies
npm install

# Run locally (requires netlify-cli, already installed globally)
netlify dev                    # Runs Vite (port 5173) + Functions (port 8888) together

# Build for production
npm run build                  # Outputs to dist/

# Deploy (from project directory)
git add . && git commit -m "describe what changed" && git push
netlify deploy --prod          # Manual deploy from local machine

# GitHub CLI (may need full path on this machine)
"/c/Program Files/GitHub CLI/gh.exe" <command>
```

**Note:** Auto-deploy from GitHub is NOT configured. Deploys happen manually via `netlify deploy --prod` from the local machine after pushing to GitHub.

---

## Deployment Checklist

When deploying changes:
1. `npm run build` — verify it compiles
2. `git add <files>` — stage changes (never `git add .env`)
3. `git commit -m "..."` — commit
4. `git push` — push to GitHub
5. `netlify deploy --prod` — deploy to Netlify

---

## Known Issues & Gotchas

1. **30k TPM rate limit** — The #1 constraint. Each web_search call uses ~7-10k input tokens (search results count as input). Currently using 2 searches + 25s delay to stay under. If more searches are added, the delay must increase or calls must be consolidated.

2. **529 Overloaded errors** — Anthropic servers sometimes return 529 during peak times. The retry logic handles this (waits 15/30/45s and retries up to 3 times).

3. **index.html must be at project root** — Vite requires `index.html` at the project root, NOT in `public/`. It was moved there from `public/` during initial setup.

4. **Non-JSON API responses** — During outages, Anthropic/Cloudflare may return HTML instead of JSON. Both the Netlify function and the client-side code handle this gracefully.

5. **JSON parse failures in synthesis** — The synthesis step returns JSON. Triple-fallback parser in `parseReport()` handles markdown fences, regex extraction, and backtick stripping.

6. **GitHub CLI not in PATH** — `gh` was installed via winget. Use full path: `"/c/Program Files/GitHub CLI/gh.exe"`

7. **Git committer identity** — Uses auto-detected `Colin Barnhart <cbarnhart@blackinkservices.com>`. Can be set explicitly with `git config --global --edit` if needed.

---

## Git History (most recent first)

```
b78b8bc Consolidate 4 searches to 2 to fix 30k TPM rate limit
45fb23f Add retry on 529 Overloaded responses from Anthropic
ad37dbf Increase delay to 20s between searches for 30k TPM limit
d15c7c1 Fix non-JSON error handling in API proxy and client
b8f27d1 Add watch selector dropdown + consolidate 17 searches to 4-5
d482884 Increase rate limit throttle to 10s + add retry with backoff
2f030ec Add 4s delay between API calls for rate limit
8552015 Fix [object Object] error display
39caeb0 Move index.html to root for Vite build
36b1ca0 Initial commit — Watch Scout v1
```

The original design had 17 sequential searches. These were progressively consolidated: 17 → 4-5 → 4 → 2 to stay under the 30k TPM rate limit.

---

## How to Iterate

| Goal | What to do |
|------|-----------|
| **Add a new watch model** | Add one object to `WATCH_CONFIG` array at top of `src/App.jsx` |
| **Add a new US site** | Add one object to `US_SITES` array |
| **Add a new Tokyo store** | Add to `TOKYO_STORES` string + `StoreGuide` fallback array |
| **Change pricing rules** | Edit `TAX`, `SHIP` constants or `allIn()` function |
| **Change styling** | Edit the `S` object at bottom of `src/App.jsx` |
| **Change search queries** | Edit `buildSteps()` function |
| **Change synthesis prompt** | Edit the `callClaude()` call inside `runAgent()` |
| **Change API proxy** | Edit `netlify/functions/search.js` |
| **Change build/routing** | Edit `netlify.toml` |

---

## Key Files to Edit

| Goal | File |
|------|------|
| Change search queries | `src/App.jsx` → `buildSteps()` function |
| Change UI / layout | `src/App.jsx` → components + `S` styles object |
| Change API proxy logic | `netlify/functions/search.js` |
| Change build/routing | `netlify.toml` |
| Add environment variables | `.env` (local) or Netlify dashboard (prod) |
