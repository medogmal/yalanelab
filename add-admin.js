#!/usr/bin/env node
// ─── add-admin.js ───
// شغّله على السيرفر: node add-admin.js
const fs = require('fs');
const path = require('path');
const { pbkdf2Sync, randomBytes } = require('crypto');

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// قراءة المستخدمين
let users = [];
try {
  users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
} catch {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
}

// إعداد البيانات
const email    = 'admin@yalanelab.com';
const password = 'Admin@2025';

// لو الأكونت موجود — حدّثه بس
const existing = users.find(u => u.email === email);
if (existing) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  existing.passHash = hash;
  existing.salt     = salt;
  existing.role     = 'super_admin';
  existing.tier     = 'elite';
  existing.coins    = 999999;
  existing.gems     = 999999;
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  console.log('✅ تم تحديث الأكونت الموجود!');
} else {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  const newUser = {
    id: 'super_admin_' + Date.now(),
    name: 'احمد Admin',
    email,
    passHash: hash,
    salt,
    createdAt: Date.now(),
    role: 'super_admin',
    tier: 'elite',
    coins: 999999,
    gems:  999999,
    ratings: { chess: 1200, domino: 1200, ludo: 1200, baloot: 1200 },
    cosmetics: { pieceSet: 'gold', boardTheme: 'ocean' },
    unlockedPieceSets: ['lichess','staunton','gold','neon'],
    unlockedBoardThemes: ['classic','wood','carbon','ocean'],
    xp: 9999, level: 99, streakDays: 0, lastDailyRewardAt: 0,
    chests: { wooden:0, silver:0, golden:0, legendary:0 },
    dailyCycleDay: 1, dailyCycleCount: 0,
    passXP: 0, passLevel: 1, passPremium: true,
    dailyMissions: [], weeklyMissions: [],
    matchesDomino: 0, winsDomino: 0, lossesDomino: 0,
  };
  users.push(newUser);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  console.log('✅ تم إنشاء أكونت جديد!');
}

console.log('');
console.log('📧 Email:    admin@yalanelab.com');
console.log('🔑 Password: Admin@2025');
console.log('👑 Role:     super_admin');
