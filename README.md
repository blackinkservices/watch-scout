# Watch Scout

Live used watch price comparison — Tokyo (tax-free) vs US (NYC all-in).

Tracks Tudor Black Bay BB58/BB54 and Rolex Oyster Perpetual/Explorer across
Tokyo stores and US websites, with live JPY/USD conversion.

**Live site:** https://watch-scout.netlify.app
**Repo:** https://github.com/blackinkservices/watch-scout

---

## Quickstart with Claude Code

This project is built for Claude Code. Once installed, iterate and deploy
just by describing what you want in plain English.

### 1. Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Requires Node.js 18+.

### 2. Clone & enter the project

```bash
git clone https://github.com/blackinkservices/watch-scout.git
cd watch-scout
npm install
```

### 3. Add your API key

```bash
cp .env.example .env
# Paste your Anthropic API key into .env
# Get one at: https://console.anthropic.com
```

### 4. Start Claude Code

```bash
claude
```

Claude Code reads `CLAUDE.md` automatically and has full context of the project.

### 5. Example prompts to try

```
> Run the app locally
> Add a Rolex Daytona section
> The US search results are empty — debug and fix it
> Deploy to Netlify
> Make the savings badge bigger and easier to read
```

---

## Manual setup (without Claude Code)

```bash
npm install
npm install -g netlify-cli
netlify login
cp .env.example .env   # add your ANTHROPIC_API_KEY
netlify dev            # http://localhost:8888
```

### Deploy

```bash
npm run build
git add . && git commit -m "what changed" && git push
netlify deploy --prod
```

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Backend | Netlify Functions (API key never hits the browser) |
| AI | Anthropic Claude claude-sonnet-4-20250514 + web_search tool |
| Hosting | Netlify |

## How it works

The app makes 2 web search API calls (Tokyo prices + US prices) with a 25-second gap to stay under Anthropic's 30k tokens/min rate limit, then a synthesis call compiles results into structured JSON. Total run time is ~50 seconds.

A dropdown lets you search one watch at a time or all four at once.

## Project structure

```
watch-scout/
├── CLAUDE.md                  ← Claude Code project context (start here)
├── index.html                 ← Vite entry point (must be at root)
├── netlify/functions/
│   └── search.js              ← Serverless API proxy (key lives here)
├── src/
│   └── App.jsx                ← Entire frontend (~700 lines)
├── netlify.toml               ← Build + routing
└── .env.example               ← Copy → .env, add key
```
