# ⌚ Watch Scout

Live used watch price comparison — Tokyo (tax-free) vs US (NYC all-in).

Tracks Tudor Black Bay BB58/BB54 and Rolex Oyster Perpetual/Explorer across
9 Tokyo stores and 6 US websites, with live JPY/USD conversion.

---

## Quickstart with Claude Code

This project is built for Claude Code. Once installed, iterate and deploy
just by describing what you want in plain English.

### 1. Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Requires Node.js 18+. See [docs.claude.com](https://docs.claude.com/en/docs/claude-code/overview).

### 2. Clone & enter the project

```bash
git clone https://github.com/YOUR_USERNAME/watch-scout.git
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

### First deploy

```bash
netlify init
netlify env:set ANTHROPIC_API_KEY sk-ant-YOUR-KEY-HERE
netlify deploy --prod
```

### Every deploy after that

```bash
git add . && git commit -m "what changed" && git push
# Netlify auto-deploys from GitHub main branch
```

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Backend | Netlify Functions (API key never hits the browser) |
| AI | Anthropic Claude + web_search tool |
| Hosting | Netlify (auto-deploys from GitHub) |

## Project structure

```
watch-scout/
├── CLAUDE.md                  ← Claude Code project context
├── netlify/functions/
│   └── search.js              ← Serverless API proxy (key lives here)
├── src/
│   └── App.jsx                ← Entire frontend
├── netlify.toml               ← Build + routing
└── .env.example               ← Copy → .env, add key
```
