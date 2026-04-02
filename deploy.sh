#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  YALANELAB — DEPLOY SCRIPT
#  Run on VPS: bash deploy.sh
# ═══════════════════════════════════════════════════════════
set -e

REPO="https://github.com/eldomna/yalanel3ap.git"
APP_DIR="/var/www/yalanelab"
LOG_DIR="/var/log/yalanelab"
NODE_MIN="18"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   يالا نلعب — Deploy Script v1.0        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. System deps ──────────────────────────────────────
log "تحديث الـ apt..."
apt-get update -qq

# Node.js
if ! command -v node &>/dev/null; then
  warn "Node.js مش موجود — جاري التثبيت..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt "$NODE_MIN" ]; then
  warn "Node.js $NODE_VER قديم — جاري الترقية..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
log "Node.js $(node -v)"

# Git
if ! command -v git &>/dev/null; then
  apt-get install -y git
fi

# PM2
if ! command -v pm2 &>/dev/null; then
  warn "PM2 مش موجود — جاري التثبيت..."
  npm install -g pm2
fi
log "PM2 $(pm2 -v)"

# ── 2. App directory ─────────────────────────────────────
mkdir -p "$APP_DIR" "$LOG_DIR"

if [ -d "$APP_DIR/.git" ]; then
  log "تحديث الكود من GitHub..."
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/main
else
  log "Clone من GitHub..."
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 3. .env ──────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  warn ".env مش موجود — جاري إنشاؤه من الـ example..."
  cp "$APP_DIR/.env.production.example" "$APP_DIR/.env"
  
  # Generate random secret
  SECRET=$(openssl rand -hex 32)
  sed -i "s/CHANGE_THIS_TO_RANDOM_SECRET_64_CHARS/$SECRET/" "$APP_DIR/.env"
  
  warn "تأكد من تعديل الـ .env على: $APP_DIR/.env"
fi

# ── 4. Install deps ──────────────────────────────────────
log "تثبيت الـ dependencies..."
cd "$APP_DIR"
npm install --production=false 2>&1 | tail -5

# ── 5. Prisma ────────────────────────────────────────────
log "إعداد قاعدة البيانات..."
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss

# ── 6. Build ─────────────────────────────────────────────
log "Build الـ Next.js..."
npm run build 2>&1 | tail -10

# ── 7. PM2 ───────────────────────────────────────────────
log "تشغيل التطبيق بـ PM2..."
pm2 stop yalanelab 2>/dev/null || true
pm2 delete yalanelab 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || true

# ── 8. Firewall ──────────────────────────────────────────
if command -v ufw &>/dev/null; then
  ufw allow 3000/tcp 2>/dev/null || true
  log "Port 3000 مفتوح"
fi

# ── Done ─────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ✅ يالا نلعب شغال على السيرفر!                   ║"
echo "║                                                      ║"
echo "║   🌐 http://206.183.130.163:3000                    ║"
echo "║   📋 pm2 logs yalanelab                             ║"
echo "║   🔄 pm2 restart yalanelab                          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
pm2 status
