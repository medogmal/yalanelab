#!/usr/bin/env pwsh
# deploy.ps1 — deploy to VPS
# Usage: .\deploy.ps1

$SERVER = "root@206.183.130.163"
$PASS   = 'N++k$u:1'
$REMOTE = "/var/www/yalanelab"

$CMDS = @"
cd $REMOTE
echo '--- pulling latest ---'
git pull origin main
echo '--- installing deps ---'
npm install --production=false
echo '--- building ---'
npm run build
echo '--- restarting pm2 ---'
pm2 restart all || pm2 start ecosystem.config.js
pm2 save
echo '=== DEPLOY DONE ==='
"@

Write-Host "Connecting to $SERVER ..." -ForegroundColor Cyan
$CMDS | & "C:\Program Files\PuTTY\plink.exe" -ssh -pw $PASS $SERVER
