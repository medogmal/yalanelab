#!/bin/bash
# ═══════════════════════════════════════════════════════
#  deploy.sh — السحب والتحديث على السيرفر
#  شغّله على السيرفر بعد ما تعمل git push
# ═══════════════════════════════════════════════════════
set -e

APP_DIR="/var/www/yalanelab"
PM2_APP="yalanelab"

echo "🚀 بدء التحديث..."
cd "$APP_DIR"

# 1. سحب أحدث كود
echo "📥 سحب التحديثات من GitHub..."
git pull origin main

# 2. تثبيت الـ packages الجديدة
echo "📦 تثبيت الـ packages..."
npm install --production=false

# 3. Prisma generate
echo "🗄️ تحديث Prisma..."
npx prisma generate

# 4. Build
echo "🔨 بناء المشروع..."
npm run build

# 5. Restart
echo "♻️ إعادة تشغيل السيرفر..."
pm2 restart "$PM2_APP" || pm2 start npm --name "$PM2_APP" -- start

echo "✅ تم التحديث بنجاح!"
pm2 status
