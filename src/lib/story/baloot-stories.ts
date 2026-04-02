/* ═══════════════════════════════════════════════════════════════
   BALOOT STORIES — قصص خرائط البلوت الخمس
═══════════════════════════════════════════════════════════════ */
import type { MapStory } from "@/lib/story/engine";

export const BALOOT_STORIES: MapStory[] = [
  {
    mapId: "majlis",
    narrator: "العم خالد",
    narratorAvatar: "☕",
    narratorTitle: "شيخ المجلس",
    lines: [
      { trigger: "map_enter",    narrator: "العم خالد", emotion: "happy",
        text: "أهلاً بك في المجلس. القهوة جاهزة، والبلوت بدأ." },
      { trigger: "win",          narrator: "العم خالد", emotion: "proud",
        text: "أحسنت! المجلس يرحب بك دائماً." },
      { trigger: "lose",         narrator: "العم خالد", emotion: "serious",
        text: "خسرت هذه الجولة. اشرب قهوتك وتعال مرة أخرى." },
      { trigger: "map_complete", narrator: "العم خالد", emotion: "proud",
        text: "أثبتت جدارتك في المجلس. السوق ينتظرك." },
    ],
  },
  {
    mapId: "souq",
    narrator: "التاجر",
    narratorAvatar: "🏪",
    narratorTitle: "تاجر السوق",
    lines: [
      { trigger: "map_enter",    narrator: "التاجر", emotion: "serious",
        text: "في السوق، كل ورقة لها ثمن. العب بذكاء." },
      { trigger: "win",          narrator: "التاجر", emotion: "happy",
        text: "صفقة رابحة! عقلك أسرع من حساباتي." },
      { trigger: "lose",         narrator: "التاجر", emotion: "serious",
        text: "خسرت هذه الصفقة. التجارة دروس متراكمة." },
      { trigger: "midpoint",     narrator: "التاجر", levelHint: 5, emotion: "warning",
        text: "المنافس القادم تاجر كبير... احذر خطواته." },
      { trigger: "map_complete", narrator: "التاجر", emotion: "proud",
        text: "فتحت محلك في أحسن مكان بالسوق. القصر ينادي!" },
    ],
  },
  {
    mapId: "palace",
    narrator: "الوزير",
    narratorAvatar: "🏯",
    narratorTitle: "وزير الملك",
    lines: [
      { trigger: "map_enter",    narrator: "الوزير", emotion: "serious",
        text: "الملك يراقب كل حركة. لا مجال للأخطاء هنا." },
      { trigger: "win",          narrator: "الوزير", emotion: "proud",
        text: "الملك معجب. استمر." },
      { trigger: "lose",         narrator: "الوزير", emotion: "warning",
        text: "الملك لاحظ هذا الإخفاق. لا تكرره." },
      { trigger: "map_complete", narrator: "الوزير", emotion: "proud",
        text: "الملك أعطاك وشاح الشرف. الرحلة تنتظر!" },
    ],
  },
  {
    mapId: "voyage",
    narrator: "البحار",
    narratorAvatar: "⛵",
    narratorTitle: "قبطان السفينة",
    lines: [
      { trigger: "map_enter",    narrator: "البحار", emotion: "mysterious",
        text: "البحر لا يرحم الضعفاء، ولا يكرم إلا الأشجعين." },
      { trigger: "win",          narrator: "البحار", emotion: "happy",
        text: "الريح في صالحنا! تابع." },
      { trigger: "lose",         narrator: "البحار", emotion: "serious",
        text: "عاصفة صغيرة. السفينة لن تغرق، حاول مجدداً." },
      { trigger: "midpoint",     narrator: "البحار", levelHint: 5, emotion: "warning",
        text: "منتصف الرحلة... أصعب جزء لم يأتِ بعد." },
      { trigger: "map_complete", narrator: "البحار", emotion: "proud",
        text: "وصلنا البر! آخر محطة تنتظرك — الأسطورة." },
    ],
  },
  {
    mapId: "legend",
    narrator: "الراوي",
    narratorAvatar: "👑",
    narratorTitle: "راوي الأساطير",
    lines: [
      { trigger: "map_enter",    narrator: "الراوي", emotion: "mysterious",
        text: "هنا تُصنع الأساطير. ليس كل من حاول وصل." },
      { trigger: "win",          narrator: "الراوي", emotion: "proud",
        text: "...يُحكى عنك في المجالس." },
      { trigger: "boss",         narrator: "الراوي", emotion: "warning",
        text: "الخصم الأخير — بطل لم يُهزم من سنوات." },
      { trigger: "map_complete", narrator: "الراوي", emotion: "proud",
        text: "الأسطورة صارت حقيقة. اسمك في كتاب البلوت إلى الأبد." },
    ],
  },
];

export function getBalootStory(mapId: string): MapStory | undefined {
  return BALOOT_STORIES.find(s => s.mapId === mapId);
}
