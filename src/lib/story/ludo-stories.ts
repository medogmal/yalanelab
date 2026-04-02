/* ═══════════════════════════════════════════════════════════════
   LUDO STORIES — قصص خرائط اللودو الخمس
═══════════════════════════════════════════════════════════════ */
import type { MapStory } from "@/lib/story/engine";

export const LUDO_STORIES: MapStory[] = [
  {
    mapId: "home",
    narrator: "جدة حنونة",
    narratorAvatar: "🏠",
    narratorTitle: "جدة البيت",
    lines: [
      { trigger: "map_enter",    narrator: "جدة حنونة", emotion: "happy",
        text: "تعالوا يا ولاد! اللودو جاهز، والعيلة مجتمعة." },
      { trigger: "win",          narrator: "جدة حنونة", emotion: "proud",
        text: "برافو عليك! جدتك فخورة بيك." },
      { trigger: "lose",         narrator: "جدة حنونة", emotion: "happy",
        text: "لا يهم، اللعب مع العيلة أهم من الفوز!" },
      { trigger: "map_complete", narrator: "جدة حنونة", emotion: "proud",
        text: "أبطال البيت! المدينة تنادي الكبار." },
    ],
  },
  {
    mapId: "city",
    narrator: "صديق شاب",
    narratorAvatar: "🌆",
    narratorTitle: "صاحبك في المدينة",
    lines: [
      { trigger: "map_enter",    narrator: "صديق شاب", emotion: "happy",
        text: "المدينة سريعة ومجنونة! هنا الأقوى يفوز." },
      { trigger: "win",          narrator: "صديق شاب", emotion: "proud",
        text: "يسطا! حركة جامدة جداً!" },
      { trigger: "lose",         narrator: "صديق شاب", emotion: "serious",
        text: "ماشي، عادي. الجولة الجاية هتبقى أحسن." },
      { trigger: "midpoint",     narrator: "صديق شاب", levelHint: 5, emotion: "warning",
        text: "نص الطريق... والمنافس بدأ يتسارع. انتبه!" },
      { trigger: "map_complete", narrator: "صديق شاب", emotion: "proud",
        text: "كسبت شوارع المدينة! الغابة أصعب بكتير." },
    ],
  },
  {
    mapId: "forest",
    narrator: "المغامر",
    narratorAvatar: "🌿",
    narratorTitle: "مستكشف الغابات",
    lines: [
      { trigger: "map_enter",    narrator: "المغامر", emotion: "mysterious",
        text: "الغابة مليانة مفاجآت. كل خطوة فيها خطر." },
      { trigger: "win",          narrator: "المغامر", emotion: "happy",
        text: "أتجاوزت عائقاً جديداً! الطريق يفتح." },
      { trigger: "lose",         narrator: "المغامر", emotion: "serious",
        text: "الغابة ابتلعتك هذه المرة. لكن المغامر لا يستسلم." },
      { trigger: "map_complete", narrator: "المغامر", emotion: "proud",
        text: "خرجت من الغابة سالماً! الجبال في الأفق." },
    ],
  },
  {
    mapId: "mountains",
    narrator: "الحكيم",
    narratorAvatar: "⛰️",
    narratorTitle: "حكيم الجبل",
    lines: [
      { trigger: "map_enter",    narrator: "الحكيم", emotion: "serious",
        text: "الجبال لا ترحم المتسرعين. كل حركة محسوبة." },
      { trigger: "win",          narrator: "الحكيم", emotion: "proud",
        text: "ارتقيت درجة. القمة تقترب." },
      { trigger: "lose",         narrator: "الحكيم", emotion: "serious",
        text: "سقطت. لكن الساقط يتعلم أكثر من الناجح." },
      { trigger: "midpoint",     narrator: "الحكيم", levelHint: 5, emotion: "warning",
        text: "نصف الطريق للقمة. الهواء بدأ يرق والطريق يصعب." },
      { trigger: "map_complete", narrator: "الحكيم", emotion: "proud",
        text: "وصلت القمة! المملكة الأخيرة في انتظارك." },
    ],
  },
  {
    mapId: "kingdom",
    narrator: "الملك",
    narratorAvatar: "🏰",
    narratorTitle: "ملك المملكة",
    lines: [
      { trigger: "map_enter",    narrator: "الملك", emotion: "serious",
        text: "مرحباً بالبطل الذي وصل. لكن العرش له ثمن." },
      { trigger: "win",          narrator: "الملك", emotion: "proud",
        text: "جيش منتصر! العرش يقترب." },
      { trigger: "lose",         narrator: "الملك", emotion: "warning",
        text: "المعركة خسرتها. لكن الحرب لم تنتهِ بعد." },
      { trigger: "boss",         narrator: "الملك", emotion: "warning",
        text: "الحارس الأخير للعرش. اكسره وتصبح الملك." },
      { trigger: "map_complete", narrator: "الملك", emotion: "proud",
        text: "التاج لك! بطل اللودو الذي لا يُهزم!" },
    ],
  },
];

export function getLudoStory(mapId: string): MapStory | undefined {
  return LUDO_STORIES.find(s => s.mapId === mapId);
}
