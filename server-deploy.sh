cd /var/www/yalanelab
npx prisma generate
npm run build
pm2 restart all || pm2 start ecosystem.config.js
pm2 save
pm2 status
