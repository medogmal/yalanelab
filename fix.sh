#!/bin/bash
# fix.sh — run this on the server after deploy.sh fails
# bash /var/www/yalanelab/fix.sh

set -e
APP_DIR="/var/www/yalanelab"
cd "$APP_DIR"

echo "=== Fix 1: Rewrite .env without Arabic chars ==="
cat > "$APP_DIR/.env" << 'ENVEOF'
DATABASE_URL="file:./prod.db"
NEXTAUTH_URL="http://206.183.130.163:3000"
NEXTAUTH_SECRET="REPLACE_WITH_OPENSSL_RAND_HEX_32"
NEXTAUTH_URL_INTERNAL="http://localhost:3000"
REDIS_URL=""
EMAIL_USER=""
EMAIL_PASS=""
EMAIL_FROM="noreply@yalanelab.com"
NEXT_PUBLIC_BASE_URL="http://206.183.130.163:3000"
NODE_ENV="production"
ENVEOF

# Generate proper secret
SECRET=$(openssl rand -hex 32)
sed -i "s/REPLACE_WITH_OPENSSL_RAND_HEX_32/$SECRET/" "$APP_DIR/.env"
echo "Secret generated: $SECRET"

echo "=== Fix 2: Prisma generate ==="
npx prisma generate

echo "=== Fix 3: Prisma db push ==="
npx prisma db push --accept-data-loss

echo "=== Fix 4: Build ==="
npm run build

echo "=== Fix 5: PM2 restart ==="
pm2 delete yalanelab 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "=== DONE ==="
echo "App running at: http://206.183.130.163:3000"
pm2 status
