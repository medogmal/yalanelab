# يالا نلعب — YallaNelab 🎮

منصة ألعاب عربية متكاملة تجمع الدومينو، البلوت، الشطرنج، واللودو مع هوية ثقافية
حقيقية لكل بلد عربي ونظام منافسة بين الدول.

---

## الألعاب المتاحة

| اللعبة    | الوضع          | المسار                   |
|-----------|----------------|--------------------------|
| الدومينو  | Online + Campaign + Training | /games/domino  |
| البلوت    | Online                       | /games/baloot  |
| الشطرنج   | Online                       | /games/chess   |
| اللودو    | Online                       | /games/ludo    |

---

## المتطلبات

- Node.js 18+
- npm أو yarn

---

## التشغيل

```bash
# تثبيت الاعتمادات
npm install

# تشغيل بيئة التطوير
npm run dev

# بناء الإنتاج
npm run build
npm start
```

يفتح المشروع على: http://localhost:3000

---

## هيكل المشروع

```
src/
  app/
    games/domino/       ← صفحات الدومينو (online/campaign/training)
    games/baloot/       ← صفحات البلوت
    games/chess/        ← صفحات الشطرنج
    games/ludo/         ← صفحات اللودو
    profile/            ← صفحة البروفايل
    leaderboards/       ← صفحة المتصدرين
    api/                ← جميع API Routes
  components/
    domino/             ← مكونات الدومينو
    baloot/             ← مكونات البلوت
    chess/              ← مكونات الشطرنج
    ludo/               ← مكونات اللودو
    platform/           ← PlatformHub + Store + Chat
    profile/            ← ProfileView
  lib/
    auth/               ← session.ts + store.ts (JSON DB)
    domino/             ← game.ts + campaign.ts
    platform/           ← cultural-themes.ts + store (Zustand)
data/
  users.json            ← قاعدة البيانات (JSON file store)
public/
  domino/tables/        ← صور طاولات الدومينو
  skins/domino/         ← سكينات التايلات
```

---

## نظام الهويات الثقافية

المنصة تدعم 3 هويات ثقافية، كل مستخدم يختار بلده:

- **السعودية** — الخليج الملكي: أخضر داكن + ذهبي ملكي + هندسة إسلامية
- **مصر** — نيل الحضارة: نيلي + ذهبي فرعوني + زخارف نيلية
- **اليمن** — قمر صنعاء: بني قمري + أخضر زبيبي + قناطر يمنية

---

## قاعدة البيانات

المشروع يستخدم JSON file store بسيط في `data/users.json`.

### بنية المستخدم الأساسية:
```json
{
  "id": "...",
  "username": "...",
  "email": "...",
  "country": "eg",
  "coins": 500,
  "gems": 10,
  "xp": 0,
  "level": 1,
  "ratings": { "domino": 1200, "chess": 1200 },
  "domino": {
    "matches": 0, "wins": 0, "losses": 0, "draws": 0,
    "currentStreak": 0, "bestStreak": 0
  }
}
```

---

## المتغيرات البيئية

أنشئ ملف `.env.local`:
```env
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## APIs الرئيسية

| Method | Route                   | الوصف                          |
|--------|-------------------------|--------------------------------|
| GET    | /api/auth/me            | بيانات المستخدم الحالي         |
| POST   | /api/auth/login         | تسجيل الدخول                  |
| POST   | /api/auth/register      | إنشاء حساب                    |
| GET    | /api/profile/full       | بيانات المستخدم الكاملة        |
| POST   | /api/domino/match       | تسجيل نتيجة مباراة دومينو     |
| GET    | /api/leaderboard/domino | ترتيب الدومينو                 |
| POST   | /api/economy/daily      | مكافأة الدخول اليومي           |

---

## الخطة القادمة

راجع ملف `FRONTEND_PLAN.md` للخطة الكاملة لإعادة تصميم الفرونت.

---

## التقنيات المستخدمة

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + CSS Variables
- **Animation:** Framer Motion
- **State:** Zustand
- **Font:** Cairo (Google Fonts)
- **Auth:** Custom session (cookie-based)
- **DB:** JSON file store
