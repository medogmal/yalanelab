#!/usr/bin/env bash
# يالا نلعب — Quick Update (بعد كل git push)
# شغّله على السيرفر: bash update.sh
set -e
APP_DIR="/var/www/yalanelab"
cd "$APP_DIR"

echo "🔄 Pulling latest code..."
git pull origin main

echo "📦 Installing new deps (if any)..."
npm install --prefer-offline 2>&1 | tail -3

echo "🗄️  Prisma sync..."
npx prisma db push --accept-data-loss 2>&1 | tail -2

echo "🏗️  Building..."
npm run build 2>&1 | tail -5

echo "🚀 Restarting..."
pm2 restart yalanelab

echo "✅ Done! $(pm2 jlist | python3 -c "import sys,json; p=[x for x in json.load(sys.stdin) if x['name']=='yalanelab'][0]; print(f'Status: {p[\"pm2_env\"][\"status\"]}')" 2>/dev/null || pm2 status)"
