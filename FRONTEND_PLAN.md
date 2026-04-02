# يالا نلعب — خطة الفرونت الكاملة 2026
## Frontend Redesign Master Plan

---

## الهدف العام
منصة ألعاب عربية مبهرة بصرياً، هوية ثقافية حقيقية لكل بلد، تصميم 2026 حديث
يريح العين ويشجع على اللعب، بيانات حقيقية من DB، بدون فيك داتا.

---

## ما تم إنجازه ✅

- [x] Design System v3 في globals.css
- [x] Cultural themes system (3 بلدان) في cultural-themes.ts
- [x] PlatformHub الأساسي
- [x] DominoBoardOnline2D مع طاولات CSS (خشب + جلد + إضاءة)
- [x] DominoCampaignMap
- [x] DominoLobby
- [x] Profile Page (3 tabs + بيانات من API)
- [x] Leaderboard Page (domino + chess tabs)
- [x] API: /api/domino/match  (POST: تسجيل نتيجة)
- [x] API: /api/profile/full  (GET: بيانات المستخدم الكاملة)
- [x] API: /api/leaderboard/domino
- [x] API: /api/economy/daily
- [x] auth/store.ts كامل (XP + coins + domino stats + streaks)
- [x] .gitignore
- [x] README.md

---

## الفاضل — مرتب حسب الأولوية ❌

### المرحلة الأولى — إزالة الفيك داتا وربط APIs حقيقية

1. [ ] /api/war/standings       — ترتيب البلدان من DB (بدل WAR array hardcoded)
2. [ ] /api/war/contribute      — إضافة نقاط لبلد اللاعب بعد كل فوز
3. [ ] /api/stats/live          — عدد اللاعبين الحاليين
4. [ ] /api/missions/daily      — مهام اليوم للمستخدم من DB
5. [ ] /api/missions/progress   — تحديث progress للمهمة
6. [ ] /api/leaderboard/chess   — ترتيب الشطرنج
7. [ ] تحديث store.ts لدعم war system + daily missions
8. [ ] PlatformHub.tsx: استبدال WAR/TOP5/quests الـ hardcoded بـ fetch حقيقي

### المرحلة الثانية — إعادة تصميم الألعاب الأربعة

9.  [ ] طاولات الدومينو — 5 طاولات CSS جديدة بدل الصور البشعة:
        - Classic     (خشب زان داكن + لباد أخضر + حافة نحاسية)
        - Royal Saudi (خشب عود أسود + لباد أخضر ملكي + نجوم ذهبية)
        - Egyptian    (خشب أكاسيا + لباد أزرق نيلي + فرعونية)
        - Yemeni      (حجارة صنعاء + لباد بني دافئ + قناطر)
        - Desert Night(رمال ذهبية + لباد بيج + هلال)
10. [ ] ChessGameOnline2D — لوحة عربية فاخرة (عاج + خشب) + قطع بهوية
11. [ ] LudoBoardOnline2D — تصميم ملكي دائري + dice animation ناعم
12. [ ] BalootBoard2D     — طاولة بساط أخضر + أوراق عربية + score board

### المرحلة الثالثة — تحديث UI العام

13. [ ] PlatformHub Hero — خلفية ديناميكية أو animation بدل gradient ساكن
14. [ ] بطاقات الألعاب   — تأثير 3D خفيف عند hover
15. [ ] معركة الدول      — عرض بصري أجمل (خريطة أو podium)
16. [ ] Store Page        — تصميم كامل جديد مع سكينات + preview
17. [ ] Skeleton loaders  — في كل صفحة فيها fetch
18. [ ] NavBar            — notification bell + badge + cultural mood أوضح

### المرحلة الرابعة — ميزات جديدة

19. [ ] Achievement/Badge system حقيقي (DB + UI)
20. [ ] Match history في profile
21. [ ] Country selection عند التسجيل أو في settings
22. [ ] Notification system (bell + badge + dropdown)

### المرحلة الخامسة — تحسينات نهائية

23. [ ] Online matchmaking (Socket.IO wiring)
24. [ ] PWA + performance optimization
25. [ ] Mobile QA شامل

---

## بنية War System (DB Schema المطلوب)

يُنشأ ملف جديد: data/country-war.json
```json
{
  "season": 1,
  "endsAt": "2026-04-01T00:00:00Z",
  "countries": {
    "sa": { "name": "السعودية", "flag": "🇸🇦", "points": 0, "wins": 0 },
    "eg": { "name": "مصر",      "flag": "🇪🇬", "points": 0, "wins": 0 },
    "ye": { "name": "اليمن",    "flag": "🇾🇪", "points": 0, "wins": 0 },
    "ae": { "name": "الإمارات","flag": "🇦🇪",  "points": 0, "wins": 0 },
    "kw": { "name": "الكويت",   "flag": "🇰🇼", "points": 0, "wins": 0 }
  }
}
```

---

## ثيمات البلدان (Design Direction)

### السعودية — "الخليج الملكي"
- ألوان:   أخضر داكن #0d2b1a + ذهبي ملكي #c9a227 + أسود عميق
- زخارف:   هندسة إسلامية، نجوم ثمانية، نمط شبكي ذهبي
- الطاولة: خشب عود أسود + لباد أخضر ملكي + حواف ذهبية منقوشة
- البطاقات: حشو واسع، حواف نصف دائرية
- التأثيرات: وميض ذهبي خفيف، particles نجوم

### مصر — "نيل الحضارة"
- ألوان:   نيلي #1a3a5c + ذهبي فرعوني #d4a843 + بني فخاري #8b5e3c
- زخارف:   هيروغليفية مبسطة، عين حورس، خطوط أفقية نيلية
- الطاولة: خشب أكاسيا + لباد أزرق نيلي + لوتس كزخرفة
- البطاقات: حواف مشطوفة 45° مع خط ذهبي
- التأثيرات: particles ورق بردي، مياه نيل متموجة

### اليمن — "قمر صنعاء"
- ألوان:   بني قمري #3d2008 + أخضر زبيبي #4a7c3f + ذهبي نحاسي #c17f24
- زخارف:   قناطر يمنية، نوافذ قمرية، نقوش جبسية
- الطاولة: حجارة صنعاء القديمة + لباد بني دافئ + قناطر كزخرفة
- البطاقات: حواف قوسية مقتبسة من العمارة اليمنية
- التأثيرات: ضوء قمر فضي، particles قهوة

---

## مبادئ UX

1. اللاعب يعرف وين هو دايماً (active states واضحة)
2. الفعل الأساسي دايماً ظاهر (زرار "العب الآن" في كل صفحة)
3. Feedback فوري لكل كليك (animation/response)
4. Skeleton loaders بدل blank screens
5. رسائل خطأ عربية واضحة مش technical
6. كل إنجاز يتشال ويتكافأ
7. Mobile-first في كل component

---

## مكتبة Micro-animations

- button click:    scale(0.96) → scale(1)   — 100ms
- card hover:      translateY(-6px)          — 250ms ease
- page transition: opacity + translateY      — 200ms
- number change:   countup animation         — 800ms
- win screen:      particles + scale burst   — 1500ms
- notification:    slide in from top         — 300ms
- modal open:      scale(0.95) → scale(1)    — 200ms spring
