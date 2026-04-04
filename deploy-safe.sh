#!/bin/bash
# ═══════════════════════════════════════════════════
#  deploy-safe.sh — deploy يحافظ على data/users.json
# ═══════════════════════════════════════════════════

APP_DIR="/var/www/yalanelab"
DATA_BACKUP="/root/yala_data_backup"

cd "$APP_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  💾 نسخ احتياطي للبيانات..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p "$DATA_BACKUP"
[ -f data/users.json ]  && cp data/users.json  "$DATA_BACKUP/users.json"
[ -f data/worlds.json ] && cp data/worlds.json "$DATA_BACKUP/worlds.json"
echo "✅ Backup OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📥 Git Pull..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git config pull.rebase false
git fetch origin main
git reset --hard origin/main
echo "✅ Git OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔁 استعادة البيانات..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p data
[ -f "$DATA_BACKUP/users.json" ]  && cp "$DATA_BACKUP/users.json"  data/users.json
[ -f "$DATA_BACKUP/worlds.json" ] && cp "$DATA_BACKUP/worlds.json" data/worlds.json
echo "✅ Data restored"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📦 npm install..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm install --legacy-peer-deps 2>&1 | tail -3
echo "✅ npm OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🏗️  Build..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm run build 2>&1 | tail -5
echo "✅ Build OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  👑 تحديث Admin..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node add-admin.js
echo "✅ Admin OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ♻️  Restart PM2..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 restart yalanelab 2>/dev/null || pm2 start npm --name yalanelab -- start
pm2 save
echo "✅ PM2 OK"

echo ""
echo "════════════════════════════════════"
echo "  🎉 Deploy ناجح!"
echo "  📧 admin@yalanelab.com"
echo "  🔑 Admin@2025"
echo "════════════════════════════════════"
pm2 status
