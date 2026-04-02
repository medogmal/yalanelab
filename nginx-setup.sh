#!/bin/bash
# nginx-setup.sh — run on server

# 1. Install nginx if not present
apt-get install -y nginx 2>/dev/null

# 2. Write nginx config
cat > /etc/nginx/sites-available/yalanelab << 'NGINX'
server {
    listen 80;
    server_name 206.183.130.163 _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }

    # Static files — serve directly for better performance
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000/_next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /skins/ {
        alias /var/www/yalanelab/public/skins/;
        expires 7d;
    }

    location /avatars/ {
        alias /var/www/yalanelab/public/avatars/;
        expires 7d;
    }
}
NGINX

# 3. Enable site
ln -sf /etc/nginx/sites-available/yalanelab /etc/nginx/sites-enabled/yalanelab
rm -f /etc/nginx/sites-enabled/default

# 4. Test and restart
nginx -t && systemctl restart nginx && echo "=== NGINX OK ==="
systemctl status nginx --no-pager | head -5
