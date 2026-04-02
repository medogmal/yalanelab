#!/bin/bash
# full-deploy.sh — run this on server to do everything
set -e
cd /var/www/yalanelab

echo "=== 1. Pull latest ==="
git pull origin main

echo "=== 2. Fix .env ==="
printf 'DATABASE_URL="file:./prod.db"\nNEXTAUTH_URL="http://206.183.130.163:3000"\nNEXTAUTH_SECRET="yalanelab-prod-secret-x9k2p7m4"\nREDIS_URL=""\nNEXT_PUBLIC_BASE_URL="http://206.183.130.163:3000"\n' > .env

echo "=== 3. Install deps ==="
npm install

echo "=== 4. Prisma ==="
./node_modules/.bin/prisma generate
./node_modules/.bin/prisma db push --skip-generate 2>/dev/null || true

echo "=== 5. Build ==="
npm run build

echo "=== 6. Create admin accounts ==="
bash create-admins.sh

echo "=== 7. Setup nginx ==="
bash nginx-setup.sh

echo "=== 8. Restart app ==="
mkdir -p /var/log/yalanelab
pm2 delete yalanelab 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "========================================="
echo " DONE! Site is live at:"
echo " http://206.183.130.163"
echo " Admin panel: http://206.183.130.163/admin"
echo ""
echo " Super Admin: superadmin@yalanelab.com"
echo " Password:    SuperAdmin@2026"
echo ""
echo " Admin:       admin@yalanelab.com"
echo " Password:    Admin@2026"
echo "========================================="
pm2 status
