# 🚀 يالا نلعب — خطة التنفيذ القادمة (أبريل → يوليو 2026)
> **الهدف:** تحويل المنصة من prototype إلى منصة عربية كاملة تنافس CrazyGames
> **الميزة التنافسية:** الهوية الثقافية (مصر 🇪🇬 × السعودية 🇸🇦 × اليمن 🇾🇪) + المنافسة بين الدول

---

## 📊 الوضع الحالي (مارس 2026) — ما تم

| الميزة | الحالة | ملاحظة |
|--------|--------|--------|
| طاولة الدومينو + felt خضراء | ✅ | جميلة |
| فريم ذهبي + لوجو على الطاولة | ✅ | watermark |
| سكين كلاسيك (garrifin) ثابت | ✅ | الافتراضي |
| سيرفر شبكة للموبايل | ✅ | 0.0.0.0:3000 |
| صفحة رئيسية + كروت ألعاب | ✅ | فريم gradient |
| Auth + Login | ✅ | NextAuth |
| DB Schema (Prisma + SQLite) | ✅ | |
| AI للدومينو (تدريب) | ✅ | بسيط |
| Campaign System | ✅ | هيكل جاهز |

---

## 🗓️ المرحلة القادمة: 3 إسبريتات

---

## 🟥 إسبرينت 1 — الهوية الثقافية (أسبوعين)

### 1.1 نظام الـ Cultural Modes (الموودات الثلاثة)

**الفكرة:** `ThemeProvider` يغير كل حاجة في المنصة — الطاولة، الألوان، الخطوط، الصوت

**الملفات المطلوب إنشاؤها:**
```
src/
  lib/
    theme/
      themes.ts          ← تعريف الثيمات الثلاثة
      ThemeContext.tsx   ← Context + Provider
      useTheme.ts        ← hook سهل
  components/
    theme/
      MoodSwitcher.tsx   ← زرار تغيير المود (في الـ sidebar)
      MoodCard.tsx       ← كرت اختيار المود
```

**تعريف الثيم:**
```typescript
type CulturalTheme = {
  id: "egyptian" | "saudi" | "yemeni" | "classic";
  name: string;
  flag: string;
  colors: {
    felt: string;        // لون طاولة الجلد
    border: string;      // لون الإطار
    gold: string;        // لون الذهبي
    primary: string;     // اللون الأساسي
    accent: string;      // لون التمييز
  };
  tableFrame: string;    // مسار صورة الإطار (sultan.png مثلاً)
  font: string;          // اسم الخط
  tileSkin: string;      // skin ID الافتراضي
};
```

**خطوات التطبيق:**
- [ ] `src/lib/theme/themes.ts` — تعريف الثيمات الأربعة
- [ ] `src/lib/theme/ThemeContext.tsx` — Provider + localStorage persist
- [ ] لف `app/layout.tsx` بـ `ThemeProvider`
- [ ] `MoodSwitcher` component جميل في NavBar أو Sidebar
- [ ] تطبيق الثيم على `DominoBoardOnline2D.tsx`:
  - لون الـ felt من `theme.colors.felt`
  - الإطار من `theme.tableFrame` (رفع sultan.png في `/public/tables/`)
  - لون الذهبي من `theme.colors.gold`

**الثيمات:**
```
Classic:  felt=#1a4a2a, frame=classic wood, skin=garrifin
Egyptian: felt=#0d2a3d, frame=egypt pattern, skin=garrifin (+ نقوش ذهبية)
Saudi:    felt=#0a3d25, frame=sultan.png ✅, skin=garrifin (+ زخارف إسلامية)
Yemeni:   felt=#1a0e05, frame=yemeni arch, skin=garrifin (+ ألوان حضرمية)
```

---

### 1.2 إطار الطاولة — sultan.png كـ overlay حقيقي

**المشكلة الحالية:** الإطار CSS فقط، مش صورة حقيقية
**الحل:** رفع `sultan.png` في `/public/tables/frames/sultan.png` واستخدامه كـ `position:absolute` overlay

**كود التطبيق:**
```tsx
{/* داخل DominoBoardOnline2D — فوق الـ felt */}
{theme.tableFrame && (
  <img
    src={theme.tableFrame}
    alt=""
    className="absolute inset-0 w-full h-full object-fill pointer-events-none z-[3]"
    style={{ opacity: 0.92 }}
  />
)}
```

**المطلوب:**
- [ ] نسخ `sultan.png` لـ `/public/tables/frames/sultan.png`
- [ ] إضافة property `tableFrame` لكل ثيم
- [ ] إضافة الـ img overlay في الـ Board Component
- [ ] التأكد من أن الـ overlay لا يغطي التايلز (z-index صح)

---

### 1.3 اختيار الدولة عند التسجيل

**الملفات المطلوب تعديلها:**
```
src/app/auth/register/page.tsx  ← إضافة خطوة "من أين أنت؟"
prisma/schema.prisma            ← إضافة حقل country + mood للـ Profile
src/app/api/auth/register/route.ts ← حفظ الدولة
```

**الحقول الجديدة في DB:**
```prisma
model Profile {
  // ... الحقول الموجودة ...
  country    String   @default("egypt")  // egypt | saudi | yemen | other
  mood       String   @default("classic") // cultural theme
  city       String?
}
```

**UI التسجيل الجديد:**
- خطوة 1: الاسم + البريد + كلمة السر
- خطوة 2: "من أي دولة أنت؟" — 3 كروت: 🇪🇬 مصر / 🇸🇦 السعودية / 🇾🇪 اليمن / 🌍 أخرى
- خطوة 3: اختيار المود الثقافي (بيأثر على شكل المنصة)

---

## 🟧 إسبرينت 2 — المنافسة بين الدول (أسبوعين)

### 2.1 نظام Leaderboard بالدول

**الملفات الجديدة:**
```
src/
  app/
    leaderboard/
      page.tsx           ← صفحة المتصدرين
  components/
    leaderboard/
      CountryBattle.tsx  ← battle bar مصر vs السعودية vs اليمن
      PlayerRankCard.tsx ← كرت اللاعب مع العلم والرتبة
      LiveScoreboard.tsx ← live نقاط الدول
  lib/
    leaderboard/
      queries.ts         ← queries Prisma للـ rankings
```

**الـ DB Schema الإضافي:**
```prisma
model CountryScore {
  id        Int      @id @default(autoincrement())
  country   String   // egypt | saudi | yemen
  week      String   // "2026-W14"
  score     Int      @default(0)
  wins      Int      @default(0)
  updatedAt DateTime @updatedAt
}
```

**شكل الـ Leaderboard:**
```
┌─────────────────────────────────────────┐
│  ⚔️ معركة الأسبوع                       │
│  🇪🇬 مصر  [████████░░] 1,247 نقطة       │
│  🇸🇦 سعودية [██████░░░] 983 نقطة        │
│  🇾🇪 يمن   [████░░░░░] 612 نقطة         │
└─────────────────────────────────────────┘
│ # │ اللاعب         │ الدولة │ النقاط  │
│ 1 │ 👑 أبو علي     │ 🇸🇦    │ 2,840  │
│ 2 │ حسن البطل      │ 🇪🇬    │ 2,301  │
│ 3 │ عبدالله اليمني │ 🇾🇪    │ 1,987  │
```

---

### 2.2 نظام تحديث النقاط

**عند انتهاء كل مباراة:**
```typescript
// في src/lib/game/scoring.ts
async function recordWin(userId: string, gameType: string) {
  const profile = await prisma.profile.findUnique({ where: { userId } });

  // إضافة XP للاعب
  await prisma.profile.update({
    where: { userId },
    data: { xp: { increment: XP_PER_WIN[gameType] } }
  });

  // إضافة نقطة لدولة اللاعب
  await prisma.countryScore.upsert({
    where: { country_week: { country: profile.country, week: getCurrentWeek() } },
    update: { score: { increment: 1 }, wins: { increment: 1 } },
    create: { country: profile.country, week: getCurrentWeek(), score: 1, wins: 1 }
  });
}
```

---

### 2.3 علم الدولة في الـ Player HUD

**في `DominoBoardOnline2D.tsx`:**
```tsx
const COUNTRY_FLAG = {
  egypt: "🇪🇬",
  saudi: "🇸🇦",
  yemen: "🇾🇪",
  other: "🌍"
};

// في OpponentBadge وPlayer info
<span className="text-xs">{COUNTRY_FLAG[player.country]}</span>
```

---

## 🟨 إسبرينت 3 — تجربة اللاعب الكاملة (أسبوعين)

### 3.1 Profile Page كاملة

**الصفحة:** `src/app/profile/[userId]/page.tsx`

**المحتوى:**
```
┌─────────────────────────────────┐
│  [Avatar] أبو علي         🇸🇦   │
│  مستوى 15 · ⭐ 12,840 XP       │
│  [████████████░░] للمستوى 16   │
│                                 │
│  🏆 الإنجازات                   │
│  👑 ملك الدومينو  ✅            │
│  🎯 100 فوز       ✅            │
│  🇸🇦 فخر السعودية ✅            │
│                                 │
│  📊 إحصائيات                    │
│  الدومينو: 234 فوز / 89 خسارة  │
│  الشطرنج: 45 فوز / 30 خسارة   │
└─────────────────────────────────┘
```

**الملفات:**
- [ ] `src/app/profile/[userId]/page.tsx`
- [ ] `src/components/profile/AchievementBadge.tsx`
- [ ] `src/components/profile/StatsCard.tsx`
- [ ] `src/components/profile/XPBar.tsx`

---

### 3.2 Table Selector قبل اللعبة

**الفكرة:** قبل ما يدخل اللعبة، اللاعب يختار طاولته

**الملفات:**
```
src/components/domino/
  TableSelector.tsx   ← modal اختيار الطاولة
```

**الطاولات المتاحة:**
```
🎲 كلاسيك   — مجاني — felt أخضر كلاسيك
🇪🇬 مصري   — 50 كوين — نيلي + زخارف فرعونية
🇸🇦 سعودي  — 50 كوين — سلطاني ذهبي (sultan.png)
🇾🇪 يمني   — 50 كوين — بني حضرمي دافئ
⭐ VIP      — 200 كوين — طاولة خاصة مع تأثيرات
```

---

### 3.3 نظام الكوينز الأساسي

**منطق الكوينز:**
```
فوز في الدومينو:     +20 كوين
خسارة:               +5 كوين (عشان ميحبطوش)
تسجيل دخول يومي:    +10 كوين
إنجاز جديد:         +50 كوين
دعوة صديق:          +100 كوين لكلا الطرفين
```

**في DB:**
```prisma
model Transaction {
  id        Int      @id @default(autoincrement())
  userId    String
  amount    Int      // + أو -
  type      String   // "win" | "daily" | "purchase" | "achievement"
  ref       String?  // matchId أو itemId
  createdAt DateTime @default(now())
}
```

---

### 3.4 شاشة النهاية (Win/Loss Screen)

**الحالية:** بسيطة
**المطلوبة:** احترافية مع:
- Confetti animation عند الفوز
- كوينز وXP بتنضاف مع animation
- Progress bar المستوى يتحرك
- أزرار: "العب تاني" · "العب مع صديق" · "الرئيسية"
- مقارنة بين اللاعبين (من فاز بكام)
- عرض شعار الدولة الفائزة

---

## 🎯 أولويات التنفيذ الفورية (الأسبوع القادم)

### الخطوة 1: رفع sultan.png وتطبيق الإطار الحقيقي
```bash
# نسخ الصورة
cp sultan.png public/tables/frames/sultan.png
# تعديل DominoBoardOnline2D.tsx لاستخدامها
```

### الخطوة 2: ThemeContext بسيط
```
src/lib/theme/themes.ts → 4 ثيمات
src/lib/theme/ThemeContext.tsx → Provider
src/components/theme/MoodSwitcher.tsx → زرار
```

### الخطوة 3: حقل country في DB
```bash
# في schema.prisma: إضافة country + mood
npx prisma migrate dev --name add_country_mood
```

### الخطوة 4: Leaderboard صفحة بسيطة
```
/leaderboard → معركة الدول + top 20 لاعب
```

### الخطوة 5: Profile page أساسية
```
/profile/[id] → صورة + إحصائيات + إنجازات
```

---

## 📱 PWA — تثبيت على الموبايل (أولوية عالية!)

**الملفات المطلوبة:**
```
public/
  manifest.json       ← app manifest
  icons/
    icon-192.png
    icon-512.png
src/app/
  layout.tsx          ← إضافة <link rel="manifest">
```

**`manifest.json`:**
```json
{
  "name": "يالا نلعب",
  "short_name": "يالا نلعب",
  "description": "العب الدومينو والشطرنج والبلوت مع أصدقائك",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#07090f",
  "theme_color": "#f5a623",
  "lang": "ar",
  "dir": "rtl",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**بعد الإضافة:** الموبايل هيعرض "إضافة للشاشة الرئيسية" تلقائياً ✅

---

## ⚡ الـ AI للدومينو — تطوير عاجل

### المشكلة الحالية
الـ AI بيلعب عشوائي — مش محسوسك بتلعب ضد حاجة صعبة

### الحل: 3 مستويات
```typescript
type AILevel = "easy" | "medium" | "hard";

// Easy: عشوائي 100%
// Medium: يفضل الـ doubles + يمنع خصمه
// Hard: يحسب الاحتمالات + يعرف الـ tiles اللي في إيد الخصم
```

**خطوات تطوير الـ AI:**
- [ ] `src/lib/domino/ai.ts` — منطق منفصل للـ AI
- [ ] Easy: اختيار عشوائي من الـ playable tiles
- [ ] Medium: يفضل التايلز اللي عندها قيمة عالية + يحاول يسد
- [ ] Hard: يتتبع الـ tiles اللي اتلعبت + يحسب احتماليات إيد الخصم

---

## 🔧 ديون تقنية — لازم تتحل

| المشكلة | الأولوية | الحل |
|---------|---------|------|
| Hydration errors | 🔴 عالي | mounted state في كل component |
| SQLite → PostgreSQL | 🟡 متوسط | عند الـ production |
| Missing error boundaries | 🟡 متوسط | إضافة `error.tsx` لكل route |
| No loading states | 🟡 متوسط | Skeleton components |
| Socket.IO simulation | 🟡 متوسط | Real matchmaking |
| Missing tests | 🟢 منخفض | Jest + React Testing Library |

---

## 🌍 ملاحظات السوق العربي

### ما يميزنا فعلاً
1. **الهوية الثقافية** — مش مجرد ترجمة، ده تصميم من الأساس للعرب
2. **المنافسة الوطنية** — مصري vs سعودي vs يمني → emotional investment قوي
3. **الألعاب العربية الأصيلة** — الدومينو والبلوت جزء من الثقافة
4. **RTL حقيقي** — مش afterthought، RTL من اليوم الأول

### ما CrazyGames لا يقدر يعمله
- ثيم رمضاني حقيقي مع روح عربية
- تحدي "فخر مصر" ضد "فخر السعودية"
- شخصيات ثقافية (الفلاح · الأمير · الحضرمي)
- دعم RTL كامل مع fonts عربية احترافية

### الـ Target Audience
```
Primary:   شباب 18-35 عربي، يلعب على الموبايل، مهتم بألعاب الورق والدومينو
Secondary: جالية عربية في الخارج (UK, US, Germany) تشتاق للألعاب العربية
Platform:  70% موبايل، 30% لابتوب
```

---

## 📈 KPIs للنجاح

```
الشهر 1: 100 مستخدم مسجل، 500 جلسة لعب
الشهر 3: 1,000 مستخدم، 50 مباراة أونلاين يومياً
الشهر 6: 10,000 مستخدم، أول بطولة دول بـ 100+ مشترك
السنة 1: 50,000 مستخدم نشط شهرياً
```

---

*آخر تحديث: مارس 2026 — كل مرحلة اتنفذت، الـ ROADMAP يتحدث*
