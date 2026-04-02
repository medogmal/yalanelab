# 🗺️ MASTER ROADMAP — يالا نلعب
> آخر تحديث: مارس 2026  
> الحالة: 🟢 المرحلة 1 + 2 + 3 + 4 مكتملة

---

## 📋 ملخص الحالة

| المرحلة | الوصف | الحالة |
|---------|-------|--------|
| 1 | إصلاح الحرج والمكسور | 🟢 مكتملة (6/6) |
| 2 | نظام ELO والـ Matchmaking | 🟢 مكتملة (5/5) |
| 3 | Campaign القصصية | 🟢 مكتملة (6/6) |
| 4 | جودة الكود والأداء | 🟢 مكتملة (7/7) |

---

## المرحلة 1 — إصلاح الحرج والمكسور 🟢
**الحالة:** مكتملة

| # | المهمة | الملف | الحالة |
|---|--------|-------|--------|
| 1.1 | سكيل الدومينو L-shape | `src/lib/domino/layout.ts` | 🟢 |
| 1.2 | Trump Forcing البلوت | `src/lib/baloot/game.ts` | 🟢 |
| 1.3 | outranks البلوت | `src/lib/baloot/game.ts` | 🟢 |
| 1.4 | Capturing اللودو | `src/lib/ludo/game.ts` | 🟢 |
| 1.5 | الشطرنج component | `src/components/chess/` | 🟢 |
| 1.6 | دمج DominoBoard2D | `src/components/domino/DominoBoard2D.tsx` → re-export | 🟢 |

---

## المرحلة 2 — نظام ELO والـ Matchmaking 🟢
**الحالة:** مكتملة

| # | المهمة | الملف | الحالة |
|---|--------|-------|--------|
| 2.1 | ELO في Prisma Schema | `prisma/schema.prisma` — موجود: dominoRating/ludoRating/etc | 🟢 |
| 2.2 | ملف elo.ts | `src/lib/platform/elo.ts` | 🟢 |
| 2.3 | Skill-Based Matchmaking | `src/lib/domino/server.ts` — ELO pairing موجود | 🟢 |
| 2.4 | AI Difficulty تبع ELO | `src/app/games/domino/training/page.tsx` | 🟢 |
| 2.5 | Tier badge في UI | `src/components/domino/DominoLobby.tsx` | 🟢 |

---

## المرحلة 3 — Campaign القصصية 🟢
**الحالة:** مكتملة

| # | المهمة | الملف | الحالة |
|---|--------|-------|--------|
| 3.1 | Story Engine | `src/lib/story/engine.ts` | 🟢 |
| 3.2 | قصص دومينو (5 خرائط) | `src/lib/story/domino-stories.ts` | 🟢 |
| 3.3 | قصص بلوت (5 خرائط) | `src/lib/story/baloot-stories.ts` | 🟢 |
| 3.4 | قصص لودو (5 خرائط) | `src/lib/story/ludo-stories.ts` | 🟢 |
| 3.5 | StoryBubble Component | `src/components/story/StoryBubble.tsx` | 🟢 |
| 3.6 | Unlock System 7/10 + Toast | `src/components/domino/DominoCampaignMap.tsx` | 🟢 |

---

## المرحلة 4 — جودة الكود والأداء 🟢
**الحالة:** مكتملة

| # | المهمة | الملف | الحالة |
|---|--------|-------|--------|
| 4.1 | تقسيم BalootBoard2D | `src/components/baloot/BalootTypes.ts` + `BalootAssets.tsx` + `BalootSplash.tsx` | 🟢 |
| 4.2 | URL-based Navigation | `src/components/platform/PlatformHub.tsx` — ?tab=home/war/etc | 🟢 |
| 4.3 | WebSocket + Polling fallback | `src/components/domino/DominoBoardOnline2D.tsx` | 🟢 |
| 4.4 | Safe Area الموبايل | `src/components/AppShell.tsx` | 🟢 |
| 4.5 | Timer Cleanup Unmount | `src/components/domino/DominoBoardOnline2D.tsx` | 🟢 |
| 4.6 | rankScore تكرار البلوت | `src/lib/baloot/game.ts` | 🟢 |
| 4.7 | finalizeBidIfReady edge case | `src/lib/baloot/game.ts` | 🟢 |

---

## الملفات الجديدة المضافة

```
src/lib/platform/elo.ts                    ← نظام ELO كامل (10 tiers)
src/lib/story/engine.ts                    ← Story Engine
src/lib/story/domino-stories.ts            ← قصص 5 خرائط دومينو
src/lib/story/baloot-stories.ts            ← قصص 5 خرائط بلوت
src/lib/story/ludo-stories.ts             ← قصص 5 خرائط لودو
src/components/story/StoryBubble.tsx       ← Component القصة
src/components/baloot/BalootTypes.ts       ← Types البلوت المشتركة
src/components/baloot/BalootAssets.tsx     ← Assets مشتركة (AvatarFrame، suitIcon)
src/components/baloot/BalootSplash.tsx     ← Splash + Lobby منفصل
```

---

## 📝 سجل التحديثات

| التاريخ | التغيير |
|---------|---------|
| مارس 2026 | إنشاء الـ Roadmap الأساسي |
| مارس 2026 | المرحلة 1 كاملة — إصلاح كل الـ crashes والـ bugs |
| مارس 2026 | المرحلة 2 كاملة — ELO system + tier badges + AI difficulty |
| مارس 2026 | المرحلة 3 كاملة — Story Engine + 15 قصة + unlock system |
| مارس 2026 | المرحلة 4 كاملة — URL nav + WebSocket + BalootBoard split + cleanup |

---

## ✅ الرود ماب خلصت 100% — جاهز للرفع
