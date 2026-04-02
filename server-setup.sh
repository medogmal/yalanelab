#!/bin/bash
set -e
cd /var/www/yalanelab

echo "=== 1. Fix .env ==="
printf 'DATABASE_URL="file:./prod.db"\nNEXTAUTH_URL="http://206.183.130.163:3000"\nNEXTAUTH_SECRET="yalanelab-prod-secret-x9k2p7m4"\nREDIS_URL=""\nNEXT_PUBLIC_BASE_URL="http://206.183.130.163:3000"\n' > .env
cat .env

echo "=== 2. npm install (ensures prisma binaries) ==="
npm install

echo "=== 3. Prisma generate ==="
./node_modules/.bin/prisma generate

echo "=== 4. Prisma db push ==="
./node_modules/.bin/prisma db push --skip-generate 2>/dev/null || true

echo "=== 5. Build ==="
npm run build

echo "=== 6. PM2 ==="
pm2 delete yalanelab 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 status
