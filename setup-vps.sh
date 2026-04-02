#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  YALANELAB — VPS SETUP + DEPLOY
#  Run this ONCE on the server: curl -sL https://raw.githubusercontent.com/medogmal/yalanelab/main/setup-vps.sh | bash
#  Or: bash setup-vps.sh
# ═══════════════════════════════════════════════════════════════
set -e
REPO="https://github.com/medogmal/yalanelab.git"
APP_DIR="/var/www/yalanelab"
LOG_DIR="/var/log/yalanelab"
SERVER_IP="206.183.130.163"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${CYAN}→${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

echo -e "\n${CYAN}╔══════════════════════════════════════════╗"
echo -e "║   يالا نلعب — VPS Setup & Deploy        ║"
echo -e "╚══════════════════════════════════════════╝${NC}\n"

# ── 1. Update system ────────────────────────────────────────
info "تحديث الـ packages..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl git build-essential python3 openssl

# ── 2. Node.js 20 ───────────────────────────────────────────
if ! command -v node &>/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]; then
  info "تثبيت Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - -qq
  apt-get install -y -qq nodejs
fi
log "Node.js $(node -v) | npm $(npm -v)"

# ── 3. PM2 ──────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "تثبيت PM2..."
  npm install -g pm2 --quiet
fi
log "PM2 $(pm2 -v)"

# ── 4. Clone / Update app ───────────────────────────────────
mkdir -p "$LOG_DIR"

if [ -d "$APP_DIR/.git" ]; then
  info "تحديث الكود..."
  cd "$APP_DIR"
  git fetch origin --quiet
  git reset --hard origin/main --quiet
  log "كود محدّث على: $(git log --oneline -1)"
else
  info "Clone المشروع..."
  git clone "$REPO" "$APP_DIR" --quiet
  cd "$APP_DIR"
  log "Clone تم بنجاح"
fi
cd "$APP_DIR"

# ── 5. .env ─────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  warn "إنشاء .env..."
  SECRET=$(openssl rand -hex 32)
  cat > .env << ENVEOF
DATABASE_URL="file:./prod.db"
NEXTAUTH_URL="http://${SERVER_IP}:3000"
NEXTAUTH_SECRET="${SECRET}"
REDIS_URL=""
EMAIL_USER=""
EMAIL_PASS=""
EMAIL_FROM="noreply@yalanelab.com"
NEXT_PUBLIC_BASE_URL="http://${SERVER_IP}:3000"
ENVEOF
  log ".env أُنشئ مع secret عشوائي"
else
  log ".env موجود بالفعل"
fi

# ── 6. npm install ──────────────────────────────────────────
info "تثبيت الـ dependencies..."
npm install --prefer-offline 2>&1 | tail -3
log "npm install تم"

# ── 7. Prisma ───────────────────────────────────────────────
info "إعداد قاعدة البيانات..."
npx prisma generate --quiet 2>&1 | tail -2
npx prisma db push --accept-data-loss 2>&1 | tail -3
log "Prisma جاهز"

# ── 8. Build ────────────────────────────────────────────────
info "Build النهائي (قد يستغرق 2-5 دقائق)..."
npm run build 2>&1 | tail -10
log "Build تم بنجاح ✅"

# ── 9. PM2 start ────────────────────────────────────────────
info "تشغيل التطبيق..."
pm2 stop yalanelab 2>/dev/null || true
pm2 delete yalanelab 2>/dev/null || true

# Start using ecosystem config
pm2 start ecosystem.config.js
pm2 save --force
log "PM2 يشغّل التطبيق"

# PM2 startup (auto-start on reboot)
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true

# ── 10. Firewall ─────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  ufw allow 22/tcp  2>/dev/null || true
  ufw allow 80/tcp  2>/dev/null || true
  ufw allow 3000/tcp 2>/dev/null || true
  ufw --force enable 2>/dev/null || true
  log "Firewall: ports 22, 80, 3000 مفتوحة"
fi

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗"
echo -e "║   ✅ يالا نلعب شغال على السيرفر!                   ║"
echo -e "║                                                      ║"
echo -e "║   🌐 http://${SERVER_IP}:3000                 ║"
echo -e "║                                                      ║"
echo -e "║   أوامر مفيدة:                                       ║"
echo -e "║   pm2 status          — حالة التطبيق                ║"
echo -e "║   pm2 logs yalanelab  — logs مباشر                  ║"
echo -e "║   pm2 restart yalanelab — إعادة تشغيل               ║"
echo -e "║   cd /var/www/yalanelab && git pull && npm run build ║"
echo -e "║      && pm2 restart yalanelab  — تحديث              ║"
echo -e "╚══════════════════════════════════════════════════════╝${NC}\n"

pm2 status
