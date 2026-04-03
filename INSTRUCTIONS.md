# Watch Scout — Setup Instructions

**Note:** This project is already deployed and working at https://watch-scout.netlify.app.
These instructions are for setting up a fresh copy on a new machine.

---

## What you need before starting

| Tool | Check if installed | Install link |
|------|--------------------|--------------|
| Node.js v18+ | `node -v` in terminal | https://nodejs.org |
| Git | `git --version` | https://git-scm.com |
| Claude Code | `claude --version` | `npm install -g @anthropic-ai/claude-code` |
| GitHub CLI | `gh --version` | `winget install GitHub.cli` or https://cli.github.com |
| Netlify CLI | `netlify --version` | `npm install -g netlify-cli` |

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/blackinkservices/watch-scout.git
cd watch-scout
npm install
```

---

## Step 2 — Add your Anthropic API key

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder with your key from https://console.anthropic.com → API Keys.

The key named "watch-scout" already exists in the Black Ink Business Services org.

**Never commit `.env` to git** — it's in `.gitignore`.

---

## Step 3 — Run locally

```bash
netlify dev
```

Opens at http://localhost:8888 with both the React app and Netlify Functions running.

---

## Step 4 — Link to Netlify (if deploying from this machine)

```bash
netlify login    # Opens browser to authenticate
netlify link     # Select "watch-scout" from the list
```

The Netlify site already exists. You just need to link your local copy to it.

---

## Step 5 — Deploy

```bash
npm run build
git add . && git commit -m "describe what changed" && git push
netlify deploy --prod
```

**Note:** Auto-deploy from GitHub is NOT configured. You must run `netlify deploy --prod` manually after pushing.

---

## Step 6 — Start Claude Code

```bash
claude
```

Claude Code reads `CLAUDE.md` automatically, which has full project context.

---

## Iterating with Claude Code

| What you want | What to type |
|--------------|--------------|
| Run it locally | `> Run the app locally` |
| Fix errors | `> I'm getting this error: <paste error>` |
| Add a new watch | `> Add Rolex Submariner as a new watch option` |
| Change the tax rate | `> Change the NYC tax rate to 8.5%` |
| Deploy changes | `> Deploy to Netlify` |

---

## Current deployment details

| Item | Value |
|------|-------|
| Live URL | https://watch-scout.netlify.app |
| GitHub repo | https://github.com/blackinkservices/watch-scout |
| Branch | master |
| Netlify team | Black Ink Business Services |
| API key name | "watch-scout" (in Anthropic console) |
| API tier | 30k input tokens/min |

---

## Project file overview

```
watch-scout/
│
├── CLAUDE.md              ← Claude Code reads this automatically
│                            Full project context & architecture
│
├── INSTRUCTIONS.md        ← This file
│
├── index.html             ← Vite entry (must be at root, NOT in public/)
│
├── src/App.jsx            ← The entire frontend application (~700 lines)
│                            Edit this to change UI, add watches, etc.
│
├── netlify/functions/
│   └── search.js          ← Serverless API proxy
│                            Your API key lives here (server-side)
│
├── netlify.toml           ← Build settings & URL routing
├── vite.config.js         ← Dev server config
├── package.json           ← Dependencies
├── .env                   ← YOUR API KEY (never commit this)
└── .env.example           ← Template (safe to commit)
```

---

## Troubleshooting

**Rate limit errors (30k tokens/min)**
The app is designed to stay under the limit with 2 searches + 25s delay. If you add more searches, increase the delay in `buildSteps()` or consolidate queries further.

**`Overloaded` error**
Anthropic servers are temporarily busy. The app auto-retries up to 3 times with 15/30/45s backoff. Just wait.

**`netlify: command not found`**
```bash
npm install -g netlify-cli
```

**`gh: command not found`**
On Windows, try the full path: `"/c/Program Files/GitHub CLI/gh.exe"`
Or reinstall: `winget install GitHub.cli`

**Build fails with "Could not resolve entry module index.html"**
Make sure `index.html` is at the project root, NOT in `public/`.

**API key working locally but not on Netlify**
Check Netlify dashboard → Site configuration → Environment variables → verify `ANTHROPIC_API_KEY` is set. Redeploy after adding it.

---

## Costs

Each scan runs 2 web search API calls + 1 synthesis call.
Approximate cost per scan: **$0.03–0.08** depending on result length.

Monitor usage at: https://console.anthropic.com/usage
