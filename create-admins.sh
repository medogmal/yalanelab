#!/bin/bash
# create-admins.sh — creates admin accounts in JSON store (lib/auth/store.ts)
cd /var/www/yalanelab

node << 'JSEOF'
const fs = require('fs');
const path = require('path');
const { pbkdf2Sync, randomBytes } = require('crypto');

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let users = [];
try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); } catch {}

function hashPassword(password, salt) {
  const s = salt || randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, s, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: s };
}

const accounts = [
  { email: 'superadmin@yalanelab.com', name: 'Super Admin', password: 'SuperAdmin@2026', role: 'super_admin' },
  { email: 'admin@yalanelab.com',      name: 'Admin',        password: 'Admin@2026',      role: 'admin' },
];

for (const acc of accounts) {
  const { hash, salt } = hashPassword(acc.password);
  const existing = users.findIndex(u => u.email.toLowerCase() === acc.email.toLowerCase());
  const user = {
    id: `admin_${acc.role}_001`,
    name: acc.name,
    email: acc.email,
    passHash: hash,
    salt,
    role: acc.role,
    tier: 'elite',
    createdAt: Date.now(),
    coins: 999999,
    gems: 9999,
    level: 100,
    xp: 0,
    ratings: { chess: 2000, domino: 2000, ludo: 2000, baloot: 2000 },
    cosmetics: { pieceSet: 'gold', boardTheme: 'carbon' },
    unlockedPieceSets: ['lichess', 'staunton', 'gold', 'neon'],
    unlockedBoardThemes: ['classic', 'wood', 'carbon', 'ocean'],
    streakDays: 0, lastDailyRewardAt: 0,
    chests: { wooden: 0, silver: 0, golden: 0, legendary: 0 },
    dailyCycleDay: 1, dailyCycleCount: 0,
    passXP: 0, passLevel: 50, passPremium: true,
    matchesDomino: 0, winsDomino: 0,
  };
  if (existing >= 0) { users[existing] = user; console.log(`Updated: ${acc.email}`); }
  else { users.push(user); console.log(`Created: ${acc.email}`); }
}

fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
console.log('\n=== DONE ===');
console.log('Super Admin: superadmin@yalanelab.com / SuperAdmin@2026');
console.log('Admin:       admin@yalanelab.com / Admin@2026');
console.log('Dashboard:   http://206.183.130.163/admin');
JSEOF
