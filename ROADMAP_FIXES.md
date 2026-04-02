# 🗺️ Roadmap الإصلاحات — yalanelab-main
**آخر تحديث:** 2026-03-17 — ✅ **كل المشاكل اتصلحت بالكامل**
**الحالة العامة:** 33 مشكلة + 3 تحسينات architecture — كلها منتهية

---

## ✅ الجلسة الأولى — إصلاحات البنية الأساسية (16 مشكلة)

| # | المشكلة | الملف |
|---|---|---|
| 1 | البلوت: `pass` bid مكسور | `api/baloot/.../bid/route.ts` |
| 2 | البلوت: `outranks` بتقبل نفس trump | `lib/baloot/game.ts` |
| 3 | البلوت Socket: Object.assign | `server/games/baloot.ts` |
| 4 | اللودو Socket: Object.assign | `server/games/ludo.ts` |
| 5 | اللودو: Match بيبدأ بـ 2 بدل 4 | `server/games/ludo.ts` |
| 6 | اللودو: Turn يتقفز اثنين | `server/games/ludo.ts` |
| 7 | الشطرنج: توحيد نظامَي Socket+API | `server/games/chess.ts` |
| 8 | الشطرنج: Clock مش بيمشي | `server/games/chess.ts` |
| 9 | الدومينو: High Stakes سرقة كوينز | `lib/domino/server.ts` |
| 10 | الدومينو: Start event ناقص في 4-player | `lib/domino/server.ts` |
| 11 | Sessions في RAM ← JSON file | `lib/auth/session.ts` |
| 12 | Friends في RAM ← JSON file | `lib/auth/store.ts` |
| 13 | PrismaClient مكرر في auth.ts | `lib/auth.ts` |
| 14 | `ignoreBuildErrors: true` | `next.config.ts` |
| 15 | NEXTAUTH_SECRET تجريبي | `.env` |
| 16 | ملفات مؤقتة في root | `_trash/` |

---

## ✅ الجلسة الثانية — إصلاحات مؤكدة (14 مشكلة)

| BUG | المشكلة | الملف |
|---|---|---|
| BUG-01 | `country` key مكرر — Build Error | `api/user/me/route.ts` |
| BUG-02 | البلوت Socket: plain object من Redis | `server/games/baloot.ts` |
| BUG-03 | SessionSync لا يعمل مع custom auth | `components/SessionSync.tsx` |
| BUG-04 | Admin endpoints مفتوحة بدون auth | `api/admin/*` + `_auth.ts` |
| BUG-05 | `equipped` معرّف مرتين في store | `lib/platform/store.ts` |
| BUG-06 | `emitMatchState` handCounts keys غلط | `server/socket.ts` |
| BUG-07 | Baloot lobby GET بيستدعي pairPlayers | `api/baloot/lobby/route.ts` |
| BUG-08 | اليوم 7 يدي legendary chest مرتين | `lib/auth/store.ts` |
| BUG-09 | `.env` EMAIL_* لكن `email.ts` تقرأ SMTP_* | `.env` + `.env.example` |
| BUG-10 | اللودو: نظامان منفصلان Redis vs RAM | `server/games/ludo.ts` |
| BUG-11 | `rankScore` سطر مكرر dead code | `lib/baloot/game.ts` |
| BUG-12 | `applyDominoEloResult` كتابة بدون تغيير | `lib/auth/store.ts` |
| BUG-13 | `getCurrentUser` import غير مستخدم | `server/socket.ts` |
| BUG-14 | Guest user بيتحفظ في localStorage | `lib/platform/store.ts` |

---

## ✅ الجلسة الثالثة — Architecture & Performance (3 تحسينات)

| # | التحسين | الملف |
|---|---|---|
| ARCH-01 | توحيد Auth — streak, store/buy, user/update ← custom | `api/streak`, `api/store/buy`, `api/user/update` |
| PERF-01 | Session cache في الذاكرة (60s TTL) بدل disk عند كل request | `lib/auth/session.ts` |
| SCALE-01 | Redis startup check + warning واضح في console | `server.ts` |

---

## 📊 الإحصاء الكلي النهائي

| | العدد |
|---|---|
| ✅ مشاكل + تحسينات تم إصلاحها | **33** |
| ❌ مشاكل كانت مبالغ فيها / غلط | 6 |
| 🔮 باقي لو حبيت تكمل | Redis production setup |

---

## 🔮 الخطوة الوحيدة الباقية (اختيارية)

### تفعيل Redis للـ production
لما تنشر على سيرفر حقيقي، فعّل Redis عشان مباريات الألعاب ما تضيعش:
```bash
# في .env على السيرفر
REDIS_URL="redis://localhost:6379"

# أو لو بتستخدم cloud Redis
REDIS_URL="redis://username:password@host:port"
```
السيرفر هيعرف تلقائياً من خلال الـ startup warning.
