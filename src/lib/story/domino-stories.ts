/* ═══════════════════════════════════════════════════════════════
   DOMINO STORIES — قصص خرائط الدومينو الخمس
═══════════════════════════════════════════════════════════════ */
import type { MapStory } from "@/lib/story/engine";

export const DOMINO_STORIES: MapStory[] = [

  /* ════════════════════════════════════════════
     1. الكلاسيكية — أبو سامي
  ════════════════════════════════════════════ */
  {
    mapId: "classic",
    narrator: "أبو سامي",
    narratorAvatar: "👴",
    narratorTitle: "شيخ المحلة",
    lines: [
      { trigger: "map_enter",    narrator: "أبو سامي", emotion: "serious",
        text: "تفضل يا بني، اجلس. الدومينو مش بس قطع — هو حكمة وصبر." },
      { trigger: "level_start",  narrator: "أبو سامي", levelHint: 1, emotion: "happy",
        text: "أول جلسة. خد وقتك، ما فيش استعجال." },
      { trigger: "win",          narrator: "أبو سامي", emotion: "proud",
        text: "ممتاز! الحي بدأ يسمع اسمك." },
      { trigger: "lose",         narrator: "أبو سامي", emotion: "serious",
        text: "خسرت اليوم؟ كويس. الخسارة أحسن معلم." },
      { trigger: "midpoint",     narrator: "أبو سامي", levelHint: 5, emotion: "warning",
        text: "انتبه... جاء أحمد — ابن المنطقة القديمة. مشهور ما يخسرش." },
      { trigger: "map_complete", narrator: "أبو سامي", emotion: "proud",
        text: "انتهت الجلسة. الحي كله عرف اسمك. لكن الطريق لا يزال طويلاً..." },
    ],
  },

  /* ════════════════════════════════════════════
     2. الصحراء — الرحالة
  ════════════════════════════════════════════ */
  {
    mapId: "desert",
    narrator: "الرحالة",
    narratorAvatar: "🧭",
    narratorTitle: "تاجر متجول",
    lines: [
      { trigger: "map_enter",    narrator: "الرحالة", emotion: "mysterious",
        text: "الصحراء تختبر الصبر. هنا الحكمة بتتقاس بالنقاط، مش بالفوز فقط." },
      { trigger: "win",          narrator: "الرحالة", emotion: "happy",
        text: "أحسنت! النقاط هي الزاد في الصحراء." },
      { trigger: "lose",         narrator: "الرحالة", emotion: "serious",
        text: "الرمال لا ترحم. جرب مرة أخرى وأنت أكثر تركيزاً." },
      { trigger: "midpoint",     narrator: "الرحالة", levelHint: 5, emotion: "warning",
        text: "الواحة الخامسة... يقولون فيها لاعب يعرف يقرأ أفكارك." },
      { trigger: "map_complete", narrator: "الرحالة", emotion: "proud",
        text: "عبرت الصحراء! قلة هم من يصلون هنا بنقاط كاملة." },
    ],
  },

  /* ════════════════════════════════════════════
     3. الفراعنة — الحكيم
  ════════════════════════════════════════════ */
  {
    mapId: "egyptian",
    narrator: "الحكيم",
    narratorAvatar: "🏺",
    narratorTitle: "كاهن قديم",
    lines: [
      { trigger: "map_enter",    narrator: "الحكيم", emotion: "mysterious",
        text: "الفراعنة لم يسحبوا أبداً. الانتصار بالقوة وحده." },
      { trigger: "draw_tile",    narrator: "الحكيم", emotion: "warning",
        text: "سحبت قطعة؟ الفراعنة لن يرضوا عن هذا." },
      { trigger: "win",          narrator: "الحكيم", emotion: "proud",
        text: "هذا هو الفتح الحقيقي! بلا سحب، بلا ضعف." },
      { trigger: "lose",         narrator: "الحكيم", emotion: "sad",
        text: "المقبرة لا تفتح أبوابها إلا للأقوياء. حاول مجدداً." },
      { trigger: "midpoint",     narrator: "الحكيم", levelHint: 5, emotion: "mysterious",
        text: "الغرفة الخامسة... آخر من دخلها لم يخرج إلا منتصراً أو مهزوماً." },
      { trigger: "map_complete", narrator: "الحكيم", emotion: "proud",
        text: "اسمك محفور الآن في جدران المعبد. أبدياً." },
    ],
  },

  /* ════════════════════════════════════════════
     4. قصر السلطان — الوزير
  ════════════════════════════════════════════ */
  {
    mapId: "sultan",
    narrator: "الوزير",
    narratorAvatar: "👔",
    narratorTitle: "وزير السلطان",
    lines: [
      { trigger: "map_enter",    narrator: "الوزير", emotion: "serious",
        text: "السلطان لا يقبل إلا من أثبت أنه يتفوق بالسرعة والذكاء." },
      { trigger: "win",          narrator: "الوزير", emotion: "happy",
        text: "جيد. السلطان لاحظ تقدمك." },
      { trigger: "lose",         narrator: "الوزير", emotion: "serious",
        text: "الإخفاق في القصر له ثمن. لكن الفرصة لا تزال متاحة." },
      { trigger: "midpoint",     narrator: "الوزير", levelHint: 5, emotion: "warning",
        text: "الدور الخامس... السلطان بدأ يراقبك شخصياً." },
      { trigger: "boss",         narrator: "الوزير", emotion: "serious",
        text: "هذا هو الحارس الأخير. اكسره وتُفتح لك أبواب القصر." },
      { trigger: "map_complete", narrator: "الوزير", emotion: "proud",
        text: "أُذن لك بالدخول. السلطان ينتظرك في الليالي التركية..." },
    ],
  },

  /* ════════════════════════════════════════════
     5. الليالي التركية — الراوي
  ════════════════════════════════════════════ */
  {
    mapId: "turkish",
    narrator: "الراوي",
    narratorAvatar: "🌙",
    narratorTitle: "الراوي الغامض",
    lines: [
      { trigger: "map_enter",    narrator: "الراوي", emotion: "mysterious",
        text: "هذه ليست لعبة. هذا تاريخ يُكتب." },
      { trigger: "win",          narrator: "الراوي", emotion: "proud",
        text: "...الليل يتذكر كل انتصار." },
      { trigger: "lose",         narrator: "الراوي", emotion: "sad",
        text: "الظلام يبتلع الضعفاء. لكن الفجر يعطي فرصة جديدة." },
      { trigger: "boss",         narrator: "الراوي", emotion: "warning",
        text: "الخصم الأخير لم يخسر منذ سنوات. هذه لحظتك." },
      { trigger: "map_complete", narrator: "الراوي", emotion: "proud",
        text: "...كُتب اسمك في الليالي. لن يُنسى أبداً." },
    ],
  },
];

export function getDominoStory(mapId: string): MapStory | undefined {
  return DOMINO_STORIES.find(s => s.mapId === mapId);
}
