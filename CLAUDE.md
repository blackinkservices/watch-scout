# Watch Scout — Claude Code Guide

This file tells Claude Code everything it needs to know to work on and deploy this project.

---

## What This Project Does

A web app that searches 9 Tokyo used watch stores and 6 US websites for live prices on:
- **Tudor Black Bay** — BB58 (ref M79030) and BB54 (ref M79000)
- **Rolex Oyster Perpetual** (ref 124300/126000) and **Explorer** (ref 124270)

It compares Tokyo (tax-free for US tourists) vs US (NYC tax 8.875% + $35 shipping),
with live JPY/USD conversion, store addresses, Google Maps links, and buying tips.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Serverless backend | Netlify Functions (Node.js) |
| AI / search | Anthropic Claude claude-sonnet-4-20250514 with web_search_20250305 tool |
| Hosting | Netlify (auto-deploys from GitHub main branch) |
| Repo | GitHub |

---

## Project Structure

```
watch-scout/
├── CLAUDE.md                    ← You are here
├── README.md                    ← User-facing docs
├── netlify.toml                 ← Build config + redirect rules
├── vite.config.js               ← Vite + dev proxy config
├── package.json
├── .env.example                 ← Template — copy to .env
├── .gitignore                   ← .env excluded from git
├── netlify/
│   └── functions/
│       └── search.js            ← Serverless proxy (API key lives here)
├── public/
│   └── index.html
└── src/
    ├── main.jsx                 ← React entry point
    └── App.jsx                  ← Entire application (components + logic)
```

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `ANTHROPIC_API_KEY` | Netlify dashboard + `.env` locally | Anthropic API key |

**Never commit `.env` to git.** It is in `.gitignore`.

For local dev: copy `.env.example` → `.env` and fill in the key.
For production: set in Netlify dashboard → Site settings → Environment variables.

---

## Common Commands

```bash
# Install dependencies
npm install

# Run locally (requires netlify-cli)
npm install -g netlify-cli
netlify dev                    # Runs Vite (port 5173) + Functions (port 8888) together

# Build for production
npm run build                  # Outputs to dist/

# Deploy manually (if needed)
netlify deploy --prod          # Must be logged in: netlify login

# Link to Netlify site (first time)
netlify link                   # Follow prompts to connect to existing site
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

In local dev, `vite.config.js` proxies `/api/*` → `http://localhost:8888` (netlify dev port).

---

## How the Agent Works (src/App.jsx)

The agent runs 17 sequential web searches:
- 5 Tokyo searches (Tudor BB58, BB54, Japanese-language, Rolex Oyster, Rolex Explorer)
- 10 US searches (Chrono24, Bob's Watches, WatchBox, SwissWatchExpo — each targeted with `site:` operator)
- 1 Tokyo store info search
- 1 live JPY/USD exchange rate search

Then a synthesis call compiles results into structured JSON that the UI renders.

Key constants in `src/App.jsx`:
```js
const TAX  = 0.08875   // NYC sales tax rate
const SHIP = 35        // estimated shipping cost in USD
```

---

## Deployment: GitHub → Netlify (Auto-Deploy)

Once set up, pushing to `main` auto-deploys. Setup steps:

### First-time GitHub setup
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create watch-scout --public --push --source=.
# OR manually: git remote add origin https://github.com/USERNAME/watch-scout.git && git push -u origin main
```

### First-time Netlify setup
```bash
netlify login
netlify init
# Choose: "Create & configure a new site"
# Build command: npm run build
# Publish directory: dist
netlify env:set ANTHROPIC_API_KEY sk-ant-YOUR-KEY-HERE
netlify deploy --prod
```

After this, every `git push` to `main` auto-deploys via the GitHub → Netlify webhook.

### Subsequent deploys
```bash
git add .
git commit -m "describe what changed"
git push                       # Netlify auto-deploys in ~1-2 minutes
```

---

## How to Iterate With Claude Code

When working in this project, Claude Code can:

- **Change which watches are tracked** — edit the search queries in `runAgent()` in `src/App.jsx`
- **Add a new watch model** — add a new step block in `runAgent()` and a new `<WatchSection>` in the JSX
- **Adjust pricing rules** — edit `TAX`, `SHIP` constants or `allIn()` function
- **Change which stores appear in Tokyo guide** — edit the fallback array in `StoreGuide` component
- **Change styling** — all styles are in the `S` object at the bottom of `src/App.jsx`
- **Add email/PDF export** — add a new button + function in `App.jsx`
- **Add more US sites** — add new step objects in the `steps` array in `runAgent()`
- **Deploy** — `git add . && git commit -m "..." && git push`

---

## Gotchas & Known Issues

1. **US search results sometimes empty** — The fix (v6) uses `site:chrono24.com` style queries. If a site blocks search indexing, those results will be empty. Fallback: check site directly.

2. **JSON parse failures** — The synthesis step returns JSON. If Claude wraps it in markdown fences, the triple-fallback parser in `parseReport()` handles it. If it still fails, the raw results are shown.

3. **Slow runs** — 17 sequential API calls with web search takes 45–90 seconds. This is expected.

4. **Rate limits** — Anthropic API has per-minute token limits. If you hit them, add `await delay(1000)` between search steps.

5. **Tax-free eligibility** — Tokyo tax-free requires purchases over ¥5,000 and a valid tourist visa/stamp. The app notes this but doesn't validate it.

---

## Key Files to Edit

| Goal | File |
|------|------|
| Change search queries | `src/App.jsx` → `runAgent()` → `steps` array |
| Change UI / layout | `src/App.jsx` → components + `S` styles object |
| Change API proxy logic | `netlify/functions/search.js` |
| Change build/routing | `netlify.toml` |
| Add environment variables | `.env` (local) or Netlify dashboard (prod) |
