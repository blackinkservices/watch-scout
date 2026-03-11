#!/bin/bash
# ============================================================
#  Watch Scout — One-shot setup script
#  Run this once after unzipping the project:  bash setup.sh
# ============================================================

set -e  # Exit immediately if any command fails

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}⌚  Watch Scout — Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Check prerequisites ────────────────────────────────────────────────────
echo -e "${CYAN}[1/6] Checking prerequisites...${NC}"

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}✗ '$1' not found.${NC} $2"
    exit 1
  else
    echo -e "${GREEN}✓ $1 found${NC} ($(command -v $1))"
  fi
}

check_command node  "Install from https://nodejs.org (v18+ required)"
check_command npm   "Comes with Node.js"
check_command git   "Install from https://git-scm.com"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js v18+ required. You have $(node -v).${NC}"
  echo "  Download: https://nodejs.org"
  exit 1
fi

echo ""

# ── 2. Install npm dependencies ───────────────────────────────────────────────
echo -e "${CYAN}[2/6] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# ── 3. Install Netlify CLI ────────────────────────────────────────────────────
echo -e "${CYAN}[3/6] Installing Netlify CLI...${NC}"
if command -v netlify &> /dev/null; then
  echo -e "${GREEN}✓ Netlify CLI already installed${NC}"
else
  npm install -g netlify-cli
  echo -e "${GREEN}✓ Netlify CLI installed${NC}"
fi
echo ""

# ── 4. Set up .env ────────────────────────────────────────────────────────────
echo -e "${CYAN}[4/6] Setting up environment...${NC}"
if [ -f ".env" ]; then
  echo -e "${GREEN}✓ .env already exists${NC}"
else
  cp .env.example .env
  echo -e "${YELLOW}⚠  Created .env from template${NC}"
  echo ""
  echo -e "${BOLD}  You need to add your Anthropic API key:${NC}"
  echo "  1. Get a key at: https://console.anthropic.com"
  echo "  2. Open .env in any text editor"
  echo "  3. Replace 'sk-ant-...' with your real key"
  echo ""
  read -p "  Press Enter to continue (you can add the key later)..."
fi
echo ""

# ── 5. Git init ───────────────────────────────────────────────────────────────
echo -e "${CYAN}[5/6] Setting up Git...${NC}"
if [ -d ".git" ]; then
  echo -e "${GREEN}✓ Git already initialized${NC}"
else
  git init
  git add .
  git commit -m "Initial commit — Watch Scout"
  echo -e "${GREEN}✓ Git repository initialized${NC}"
fi
echo ""

# ── 6. Done ───────────────────────────────────────────────────────────────────
echo -e "${CYAN}[6/6] Setup complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BOLD}  Next steps:${NC}"
echo ""
echo -e "  ${BOLD}Option A — Use Claude Code (recommended)${NC}"
echo "  $ claude"
echo "  > Deploy this project to Netlify and GitHub"
echo ""
echo -e "  ${BOLD}Option B — Manual deploy${NC}"
echo "  $ netlify login"
echo "  $ netlify init"
echo "  $ netlify env:set ANTHROPIC_API_KEY \$(grep ANTHROPIC_API_KEY .env | cut -d= -f2)"
echo "  $ netlify deploy --prod"
echo ""
echo -e "  ${BOLD}Run locally:${NC}"
echo "  $ netlify dev    →  http://localhost:8888"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
