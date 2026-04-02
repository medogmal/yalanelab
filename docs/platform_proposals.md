# تقرير احترافي شامل لمنصة yalla nelab

## الأهداف والمبادئ
- تجربة تنافسية سلسة لحظيًا عبر ألعاب متعددة، تبدأ بالشطرنج والدومينو.
- هوية بصرية داكنة بلمسات نيون حديثة وقراءة عالية التباين.
- ملف شخصي لكل لاعب مع إحصائيات وتاريخ وإنجازات لكل لعبة.
- تدرّج عضوية ومزايا مميزة تؤثر على التحليل والمشاهدة والاسكينز.
- بنية قابلة للتوسع، قياس وملاحظة، وأمن ومصداقية عالية ضد الغش.

## خريطة المعلومات
- صفحات عامة: الرئيسية، الألعاب، البث المباشر، البطولات، Plus، المتجر، البروفايل، الإدارة.
- ألعاب: الشطرنج (لوحة، جماعي، مشاهدة، تحليل)، الدومينو (3D مبسط حاليًا).
- خدمات: الاشتراك، الاسكينز، التحليل، المشاهدة الحية، التصنيفات.

## الهوية البصرية
- ألوان:
  - أسود كوني: الخلفيات الرئيسية والقوائم.
  - أزرق عميق: الحاويات والبطاقات.
  - سيان نيون: التمييز للروابط والنصوص المهمة.
  - بنفسجي كهربائي: حدود العناصر المختارة وأيقونات النشاط.
  - وردي نيون: الحماس والتنبيهات وأزرار الدعوة للفعل.
  - ذهبي ملكي: شارات VIP والعملات والنقاط.
  - فضي ناصع: النصوص الرئيسية والعناوين الفرعية.
- أنماط:
  - تدرجات خلفية: bg-hero-gradient.
  - أزرار نيون: btn-neon.
  - بطاقات متوهجة: card-glow.
  - روابط مميزة: link-accent.
  - شارة ذهبية: badge-gold.
  - نص فضي: text-silver.
  - موجودة في: [globals.css](file:///d:/yallanel3b/nelab-yalla/src/app/globals.css).

## الحساب والعضوية
- الحسابات والجلسات: تخزين JSON مع PBKDF2، جاهزة للتوسع لاحقًا.
  - قراءة المستخدم: [auth/me](file:///d:/yallanel3b/nelab-yalla/src/app/api/auth/me/route.ts).
- العضوية Plus:
  - ترقية/إلغاء: [upgrade](file:///d:/yallanel3b/nelab-yalla/src/app/api/subscriptions/upgrade/route.ts), [cancel](file:///d:/yallanel3b/nelab-yalla/src/app/api/subscriptions/cancel/route.ts).
  - واجهة: [plus/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/plus/page.tsx).
- الاسكينز:
  - حفظ اسكين وثيم: [user/cosmetics](file:///d:/yallanel3b/nelab-yalla/src/app/api/user/cosmetics/route.ts).
  - متجر وعناصر: [store/cosmetics](file:///d:/yallanel3b/nelab-yalla/src/app/api/store/cosmetics/route.ts), [store/purchase](file:///d:/yallanel3b/nelab-yalla/src/app/api/store/purchase/route.ts), [store/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/store/page.tsx).

## الملف الشخصي المتعدد الألعاب
### الرؤية
- لكل مستخدم تبويب لكل لعبة يعرض:
  - التصنيف الحالي والمنحنى الزمني.
  - تاريخ المباريات بمرشحات (زمن، خصوم، نتائج).
  - أفضل نقلات/أخطاء، إنجازات، القطع/الثيمات المفعلة.
  - سجل الجوائز والعملات والشراءات.

### الواجهة المقترحة
- /profile
  - ملخص عام: الاسم، البريد، شارة العضوية، بطاقات تقدم لكل لعبة.
  - تبويبات:
    - Chess: التصنيف، رسم بياني، قائمة المباريات، إنجازات، اسكينز، إعدادات التحليل.
    - Domino: عند تطوير اللعب، إحصائيات الرميات/النتائج، تخطيطات 3D، إنجازات.
    - Store & Purchases: تاريخ العناصر المفعلة.
    - Achievements: كل المنصة.

### البيانات المقترحة (كيان/حقول)
- User: id, name, email, tier, cosmetics, createdAt.
- GameProfile: userId, gameKey, rating, stats {wins,losses,draws}, timeBreakdown, streaks.
- Match: id, gameKey, players[], result, timeControl, pgnOrLog, startedAt, endedAt.
- Achievement: id, gameKey, title, criteria, unlockedAt.
- Purchase: id, userId, itemId, kind, activatedAt.
- Leaderboard: gameKey, timeControl, entries[].

## الصفحات والاقتراحات
### الرئيسية [/]
- بطل واضح به CTA رئيسي، بطاقات ألعاب بارزة بصور جذابة، جزء بث مباشر.
- شريط إعلان ديناميكي: [AnnouncementBar.tsx](file:///d:/yallanel3b/nelab-yalla/src/components/AnnouncementBar.tsx).
- تحسين SEO: meta، OpenGraph، كلمات مفتاحية، مخطط JSON-LD.

### الألعاب [/games]
- بطاقات الصور التفاعلية: [games/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/games/page.tsx).
- تأثير hover خفيف (scale/brightness)، شارة "مميز" عند وجود مزايا Plus.
- عرض إحصائيات قصيرة لكل لعبة (عدد اللاعبين الآن، المباريات الجارية).

### الشطرنج
- الرقعة 2D: [ChessBoard2D.tsx](file:///d:/yallanel3b/nelab-yalla/src/components/chess/ChessBoard2D.tsx).
- اللعب الجماعي [/games/chess/online]:
  - تحديد الوقت، الانضمام للوبي، عرض الساعة، حالة النقلات، تحسين WebSocket بدل polling.
  - صفحة: [online/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/games/chess/online/page.tsx).
- المشاهدة [/games/chess/watch/[id]]:
  - تقييم لحظي للمميزين مع شريط تقييم.
  - صفحة: [watch/[id]](file:///d:/yallanel3b/nelab-yalla/src/app/games/chess/watch/%5Bid%5D/page.tsx).
- التحليل [/games/chess/analyze/[id]]:
  - عمق التحليل حسب العضوية، رسم بياني لمسار التقييم، تلوين الأخطاء.
  - صفحة: [analyze/[id]](file:///d:/yallanel3b/nelab-yalla/src/app/games/chess/analyze/%5Bid%5D/page.tsx).
- السيرفر وواجهات API:
  - اللوبي/الحالة/النقل/الأحداث/PGN: مجموعة مسارات api/chess/*.
  - Stockfish: [stockfish.ts](file:///d:/yallanel3b/nelab-yalla/src/lib/chess/stockfish.ts).

### الدومينو
- مشهد 3D مبسط: [domino/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/games/domino/page.tsx).
- اقتراح: فيزيائيات بسيطة، تفاعلات UI، نتائج وجولة ضد خصم/AI.

### البطولات [/tournaments]
- قوائم البطولات، إنشاء بطولة، دعوات، جداول، نتائج، بث نهائي.
- ربط بالملفات الشخصية والإنجازات.

### البث المباشر [/live]
- كروت البث مع مشغّل، غرف دردشة، روابط دعوة فورية للمشاهدين.
- استخدام WebRTC/SFU أو Twitch/YouTube embeds مبدئيًا.

### Plus [/plus]
- توضيح مزايا الاشتراك، تصنيفات العضوية، مقارنة (Free/Pro/Elite).
- اشتراك بنقرة واحدة، إدارة الفواتير/التجديد لاحقًا.

### المتجر [/store]
- عرض عناصر الاسكينز والثيمات، شراء وتفعيل، معاينة قبل الشراء.
- تصفية حسب لعبة/نوع/تقييم/سعر (عند إضافة عملات).

### الإدارة [/admin]
- مراقبة المباريات الحية، إيقاف الغشاشين، إدارة المحتوى والإعلانات.
- لوحات قياس: عدد اللاعبين، معدل الفوز، تذاكر الدعم.

## المنظومة الاجتماعية
- الأصدقاء: طلبات/قبول/حظر، قوائم خاصة.
- الدعوات للمباريات: رابط مباشر، أو دعوة عبر المنصة.
- الرسائل: قناة لكل مباراة، رسائل خاصة لاحقًا.

## التصنيفات واللوائح
- لوائح عامة لكل لعبة، لوائح حسب وقت اللعب (3+2، 5+0، 10+0).
- شارات للمراكز الأولى، مهام يومية ترفع النشاط.

## الأمن ومصداقية اللعب
- مكافحة الغش: توقيع النقلات، حد لسرعة طلبات التحليل، كشف نمط المحرك.
- سياسات: Rate limit، CSRF، CSP، XSS، تدقيق الجلسات.
- كلمات مرور: PBKDF2 حالياً؛ اقتراح Argon2 لاحقًا.

## الأداء والموثوقية
- WebSocket للأحداث الحية والتوقيت.
- Cache طبقات (server + client)، CDN للصور والأصول.
- ضغط/تصغير، تجزئة الكود، تحميل كسول، Prefetch للصفحات.

## قابلية الوصول والتدويل
- تباين الألوان، مفاتيح الوصول، ARIA.
- تعدد اللغات (العربية/الإنجليزية)، اتجاه RTL مضبوط.

## القياس والملاحظة
- تتبع الأحداث (start match, buy skin, upgrade).
- أخطاء وإستثناءات: Sentry.
- لوحات: Grafana/Datadog، أطر OpenTelemetry لاحقًا.

## بنية البيانات والانتقال من JSON إلى قاعدة بيانات
- حالياً: ملفات JSON في [data].
- اقتراح: SQLite/Prisma كبداية ثم Postgres.
- مخطط أولي:
  - users(id, name, email, pass, tier, created_at)
  - game_profiles(user_id, game_key, rating, stats_json)
  - matches(id, game_key, players_json, result, time_control, log, started_at, ended_at)
  - achievements(id, user_id, game_key, title, unlocked_at)
  - cosmetics(user_id, piece_set, board_theme, unlocked_sets_json, unlocked_themes_json)
  - purchases(id, user_id, item_id, kind, activated_at)
  - leaderboards(id, game_key, time_control, entries_json)

## واجهات API المقترحة (ملخص)
- Profiles:
  - GET /api/profile/[userId]
  - GET /api/profile/[userId]/games/[gameKey]
  - GET /api/profile/[userId]/matches?gameKey=chess&limit=50
- Leaderboards:
  - GET /api/leaderboard/[gameKey]?tc=5+3
- Achievements:
  - GET /api/achievements/[userId]
- Store:
  - GET /api/store/catalog
  - POST /api/store/purchase
- Tournaments:
  - POST /api/tournaments (create)
  - GET /api/tournaments
  - POST /api/tournaments/[id]/join
- Live:
  - GET /api/live/streams

## اختبار وضمان الجودة
- وحدات: Chess engine wrapper, timers, API routers.
- تكامل: تدفق اللعب الجماعي، المشاهدة، التحليل.
- واجهة: اختبارات E2E للصفحات الأساسية.
- أداء: قياس زمن التفاعل، زمن التحديث، ضغط الشبكة.

## خارطة طريق تنفيذية
1. بروفايل متعدد الألعاب: تبويبات، واجهة، API تجميع الإحصائيات.
2. Leaderboards وAchievements متكاملة مع التحليل.
3. WebSocket للأحداث، تحسينات التوقيت الحي.
4. متجر موسّع بعُملات وخصائص مع معاينات تفاعلية.
5. بطولات وبث مباشر MVP.
6. انتقال إلى SQLite/Prisma، إعداد CI/CD، مراقبة/أخطاء.

## مراجع كودية حالية
- النافبار: [NavBar.tsx](file:///d:/yallanel3b/nelab-yalla/src/components/NavBar.tsx)
- الألعاب (بطاقات): [games/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/games/page.tsx)
- الشطرنج:
  - الرقعة: [ChessBoard2D.tsx](file:///d:/yallanel3b/nelab-yalla/src/components/chess/ChessBoard2D.tsx)
  - جماعي: [online/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/games/chess/online/page.tsx)
  - مشاهدة: [watch/[id]](file:///d:/yallanel3b/nelab-yalla/src/app/games/chess/watch/%5Bid%5D/page.tsx)
  - تحليل: [analyze/[id]](file:///d:/yallanel3b/nelab-yalla/src/app/games/chess/analyze/%5Bid%5D/page.tsx)
  - Stockfish: [stockfish.ts](file:///d:/yallanel3b/nelab-yalla/src/lib/chess/stockfish.ts)
- الدومينو: [domino/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/games/domino/page.tsx)
- العضوية والاسكينز:
  - Plus: [plus/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/plus/page.tsx)
  - متجر: [store/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/store/page.tsx)
  - APIs: [user/cosmetics](file:///d:/yallanel3b/nelab-yalla/src/app/api/user/cosmetics/route.ts), [store/*](file:///d:/yallanel3b/nelab-yalla/src/app/api/store/cosmetics/route.ts)
- البروفايل: [profile/page.tsx](file:///d:/yallanel3b/nelab-yalla/src/app/profile/page.tsx)

---

هذا التقرير يقدّم خطة احترافية شاملة قابلة للتنفيذ تدريجيًا. عند الموافقة، أنفّذ أول محور (بروفايل متعدد الألعاب + API + واجهة) مباشرة ثم نتحرّك على بقية المحاور وفق الأولوية. 
