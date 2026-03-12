# يالا نلعب — YallaNe'lab 🎮

منصة ألعاب عربية أصيلة: دومينو · بلوت · شطرنج · لودو

---

## 🚀 تشغيل المشروع

### المتطلبات
- Node.js 20+
- npm / yarn

### خطوات التشغيل

```bash
# 1. نسخ متغيرات البيئة
cp .env.example .env

# 2. تثبيت الاعتماديات
npm install

# 3. تشغيل السيرفر (dev)
npm run dev
```

الموقع يشتغل على: `http://localhost:3000`
الشبكة المحلية (موبايل): `http://<YOUR_IP>:3000`

---

## 📁 هيكل المشروع

```
src/
├── app/                    # Next.js 16 App Router
│   ├── api/                # API Routes
│   │   ├── auth/           # تسجيل دخول / تسجيل
│   │   ├── domino/         # دومينو APIs
│   │   ├── economy/        # المكافأة اليومية، المهام، الصناديق
│   │   ├── leaderboard/    # لوحات المتصدرين
│   │   └── user/           # بروفايل المستخدم
│   └── games/              # صفحات الألعاب
│       ├── domino/
│       ├── chess/
│       ├── baloot/
│       └── ludo/
├── components/
│   ├── domino/             # مكونات الدومينو
│   ├── chess/              # مكونات الشطرنج
│   ├── baloot/             # مكونات البلوت
│   ├── ludo/               # مكونات اللودو
│   ├── platform/           # المنصة العامة
│   └── profile/            # صفحة البروفايل
├── lib/
│   ├── auth/               # نظام المصادقة (JSON file-based)
│   ├── domino/             # منطق لعبة الدومينو
│   ├── chess/              # منطق لعبة الشطرنج
│   └── platform/           # Store + Socket + Themes
└── server/
    └── socket.ts           # Socket.IO handlers
```

---

## 🎮 الألعاب

| اللعبة | الوضع | الحالة |
|--------|-------|--------|
| 🁫 دومينو | تدريب / حملة / رانكد / 4 لاعبين | ✅ مكتمل |
| ♟️ شطرنج | ضد AI (Stockfish) / أونلاين | ✅ مكتمل |
| 🃏 بلوت | أساسي | 🔄 جاري |
| 🎲 لودو | أساسي | 🔄 جاري |

---

## 🔐 نظام المصادقة

المشروع يستخدم نظام مصادقة مخصص (بدون NextAuth):
- بيانات المستخدمين: `data/users.json` (لا ترفعه على GitHub!)
- Session: cookies + in-memory map
- كلمات السر: PBKDF2 + salt

**تسجيل:** `POST /api/auth/register`
**تسجيل دخول:** `POST /api/auth/login`
**بيانات المستخدم:** `GET /api/auth/me`

---

## 🌐 Socket.IO Events

### دومينو
| Event | اتجاه | الوصف |
|-------|-------|-------|
| `domino:join_queue` | client → server | الانضمام للطابور |
| `domino:queued` | server → client | تأكيد الانضمام |
| `domino:match_found` | server → client | وجدنا خصم |
| `domino:join_match` | client → server | إعادة الاتصال |
| `domino:state` | server → client | حالة اللعبة |
| `domino:play` | client → server | لعب قطعة |
| `domino:draw` | client → server | سحب من المستودع |
| `domino:resign` | client → server | الاستسلام |

---

## 🗃️ البيانات

البيانات تُحفظ في:
- `data/users.json` — ملف JSON بسيط (local dev)
- في الإنتاج: استبدله بـ PostgreSQL + Prisma

---

## 🚀 الرفع على Production

### Vercel (موصى به)
```bash
# تأكد من إضافة Environment Variables في Vercel
vercel deploy
```

### Railway / Render
```bash
npm run build
npm run start
```

### متغيرات البيئة المطلوبة
```
DATABASE_URL=      # إذا استخدمت Prisma
NODE_ENV=production
NEXTAUTH_SECRET=   # سكريت عشوائي
```

---

## 🎨 Design System

```css
--bg-primary:   #07090f    /* خلفية داكنة */
--royal-gold:   #f5a623    /* ذهبي ملكي */
--neon-cyan:    #00d4ff    /* سيان نيون */
--domino-felt:  #0a1f14    /* لون الفيلت */
```

Classes جاهزة: `.gold-shimmer` `.glass` `.glass-dark` `.btn-gold` `.card-gold` `.glow-gold`

---

## 🗺️ الخطة القادمة

راجع [ROADMAP.md](./ROADMAP.md) للتفاصيل الكاملة.

---

## 📄 الترخيص

Private — All rights reserved © يالا نلعب 2026
