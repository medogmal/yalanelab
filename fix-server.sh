#!/bin/bash
# ═══════════════════════════════════════════════════
#  FIX ALL — حل كل مشاكل السيرفر دفعة واحدة
# ═══════════════════════════════════════════════════
set -e
cd /var/www/yalanelab

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1️⃣  إصلاح Git..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git config pull.rebase false
git fetch origin main
git reset --hard origin/main
echo "✅ Git OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  2️⃣  إصلاح Prisma Schema..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# تغيير provider من env() لـ postgresql ثابت
sed -i 's/provider = env("DB_PROVIDER")/provider = "postgresql"/' prisma/schema.prisma
# تأكد إن السطر اتغير
grep "provider" prisma/schema.prisma
echo "✅ Prisma Schema OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  3️⃣  تثبيت الـ packages..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm install --legacy-peer-deps 2>&1 | tail -5
echo "✅ npm install OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  4️⃣  Prisma Generate..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx prisma generate 2>&1 | tail -3
echo "✅ Prisma Generate OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  5️⃣  Prisma Migrate..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx prisma migrate deploy 2>&1 | tail -5
echo "✅ Prisma Migrate OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  6️⃣  Build..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npm run build 2>&1 | tail -10
echo "✅ Build OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  7️⃣  إضافة Super Admin..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
node add-admin.js
echo "✅ Admin OK"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  8️⃣  Restart PM2..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 restart yalanelab 2>/dev/null || pm2 start npm --name yalanelab -- start
pm2 save
echo "✅ PM2 OK"

echo ""
echo "════════════════════════════════════"
echo "  🎉 كل حاجة شغالة!"
echo "  📧 admin@yalanelab.com"
echo "  🔑 Admin@2025"
echo "════════════════════════════════════"
pm2 status
