# Watch Scout — Setup Instructions

Follow these steps in order. The whole process takes about 15 minutes.

---

## What you need before starting

| Tool | Check if installed | Install link |
|------|--------------------|--------------|
| Node.js v18+ | `node -v` in terminal | https://nodejs.org |
| Git | `git --version` | https://git-scm.com |
| Claude Code | `claude --version` | Already installed ✓ |
| GitHub account | — | https://github.com |
| Netlify account | — | https://netlify.com (free) |
| Anthropic API key | — | https://console.anthropic.com |

---

## Step 1 — Unzip the project

Unzip `watch-scout.zip` to wherever you keep projects, e.g.:
```
~/Projects/watch-scout/
```

Open a terminal and navigate there:
```bash
cd ~/Projects/watch-scout
```

---

## Step 2 — Run the setup script

This installs everything and initialises git in one shot:

```bash
bash setup.sh
```

The script will:
- ✓ Check Node.js and Git are installed
- ✓ Run `npm install`
- ✓ Install the Netlify CLI globally
- ✓ Create your `.env` file from the template
- ✓ Run `git init` and make the first commit

---

## Step 3 — Add your Anthropic API key

Open the `.env` file in any text editor:

```
ANTHROPIC_API_KEY=sk-ant-YOUR-KEY-HERE
```

Replace `sk-ant-YOUR-KEY-HERE` with your real key from:
👉 https://console.anthropic.com → API Keys → Create Key

**Never share this file or commit it to GitHub** — it's already in `.gitignore`.

---

## Step 4 — Start Claude Code

In the project folder, run:

```bash
claude
```

You're now in a Claude Code session. It automatically reads `CLAUDE.md`
which has the full context of this project.

---

## Step 5 — Push to GitHub

In Claude Code, type:

```
> Create a GitHub repo called watch-scout and push this project to it
```

Claude Code will handle the `git remote`, `gh repo create`, and `git push`.

Or do it manually:
1. Go to https://github.com/new
2. Create a repo called `watch-scout`
3. Run in terminal:
```bash
git remote add origin https://github.com/YOUR_USERNAME/watch-scout.git
git push -u origin main
```

---

## Step 6 — Deploy to Netlify

In Claude Code, type:

```
> Deploy this project to Netlify and set my ANTHROPIC_API_KEY environment variable
```

Claude Code will:
- Run `netlify login` (opens browser to authenticate)
- Run `netlify init` (connects to your Netlify account)
- Set your API key in Netlify's environment
- Deploy the site
- Give you a live URL like `https://watch-scout-abc123.netlify.app`

Or do it manually:
```bash
netlify login
netlify init          # "Create & configure a new site" → follow prompts
netlify env:set ANTHROPIC_API_KEY sk-ant-YOUR-KEY-HERE
netlify deploy --prod
```

---

## Step 7 — Connect GitHub → Netlify (auto-deploy)

In the Netlify dashboard:
1. Go to your site → **Site configuration → Build & deploy → Continuous deployment**
2. Click **Link to Git provider** → GitHub → select `watch-scout`
3. Build command: `npm run build`  |  Publish directory: `dist`

Now every `git push` auto-deploys. Done.

---

## Running locally

```bash
netlify dev
```

Opens at http://localhost:8888 with both the React app and Netlify Functions running.

---

## Iterating with Claude Code

Once set up, open Claude Code in the project folder any time:

```bash
cd ~/Projects/watch-scout
claude
```

Example things to ask:

| What you want | What to type |
|--------------|--------------|
| Run it locally | `> Run the app locally` |
| Fix empty US results | `> The US search results are empty, debug and fix` |
| Add a new watch | `> Add Rolex Submariner as a third watch category` |
| Change the tax rate | `> Change the NYC tax rate to 8.5%` |
| Deploy changes | `> Deploy to Netlify` |
| See what changed | `> What files did we modify today?` |

Claude Code reads `CLAUDE.md` automatically, so it always has full project context.

---

## Project file overview

```
watch-scout/
│
├── CLAUDE.md              ← Claude Code reads this automatically
│                            Contains full project context & architecture
│
├── INSTRUCTIONS.md        ← This file
│
├── setup.sh               ← One-shot setup script (run once)
│
├── src/App.jsx            ← The entire frontend application
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

**`netlify: command not found`**
```bash
npm install -g netlify-cli
```

**`claude: command not found`**
```bash
npm install -g @anthropic-ai/claude-code
```

**US watch results are empty**
The search queries use `site:chrono24.com` style targeting. Some sites
block search indexing. Run again — or ask Claude Code to debug it:
```
> The US search results are empty, try different search queries
```

**`ANTHROPIC_API_KEY is not set` error on Netlify**
Go to Netlify dashboard → your site → **Site configuration →
Environment variables** → Add `ANTHROPIC_API_KEY` → Redeploy.

**API key working locally but not on Netlify**
Make sure you triggered a redeploy *after* setting the env variable.
In Netlify dashboard → Deploys → Trigger deploy.

---

## Costs

Each full scan runs ~17 API calls with web search enabled.
Approximate cost per scan: **$0.05–0.15** depending on result length.

Monitor usage at: https://console.anthropic.com/usage
