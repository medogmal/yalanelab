/* ═══════════════════════════════════════════════════════════════
   domino-taunts.ts — جمل التعليق التحفيزية في الدومينو
   تظهر لما اللعبة قريبة من النهاية أو عند حركات مهمة
═══════════════════════════════════════════════════════════════ */

export type TauntTrigger =
  | "about_to_win"      // اللاعب قريب من الفوز
  | "about_to_lose"     // اللاعب قريب من الخسارة
  | "bot_stuck"         // البوت سحب قطعة
  | "player_stuck"      // اللاعب سحب قطعة
  | "double_placed"     // وُضع double
  | "last_tile"         // اللاعب عنده قطعة واحدة
  | "game_blocked"      // اللعبة انسدت
  | "comeback";         // انقلاب في النتيجة

export interface Taunt {
  text:    string;
  trigger: TauntTrigger;
  who:     "player" | "bot" | "both";
}

export const DOMINO_TAUNTS: Taunt[] = [
  /* ── about_to_win ── */
  { trigger:"about_to_win", who:"player", text:"مستحيييل تفوز! 😤" },
  { trigger:"about_to_win", who:"player", text:"والله ما صدقت! 😱" },
  { trigger:"about_to_win", who:"player", text:"الحمدلله على كل حال 😂" },
  { trigger:"about_to_win", who:"player", text:"ضربة محظوظ مش أكتر! 🎲" },
  { trigger:"about_to_win", who:"player", text:"انتهت اللعبة يا بطل؟ 👑" },
  { trigger:"about_to_win", who:"player", text:"الدنيا دايرة يا صاحبي! 🌀" },

  /* ── about_to_lose ── */
  { trigger:"about_to_lose", who:"player", text:"ركز ركز! اللعبة مش خلصت 💪" },
  { trigger:"about_to_lose", who:"player", text:"لسه فيه أمل! اصحى يا بطل 🔥" },
  { trigger:"about_to_lose", who:"player", text:"جرب مرة تانية، المرة دي أنت تعبان 😅" },
  { trigger:"about_to_lose", who:"player", text:"البوت واكلك! 🤖" },

  /* ── bot_stuck ── */
  { trigger:"bot_stuck", who:"both", text:"البوت بيسحب! استغل الفرصة 😈" },
  { trigger:"bot_stuck", who:"both", text:"آه آه البوت في ورطة 😂" },
  { trigger:"bot_stuck", who:"both", text:"هههه البوت مش لاقي يحط 🎉" },

  /* ── player_stuck ── */
  { trigger:"player_stuck", who:"player", text:"مفيش حل؟ اسحب كمان! 😅" },
  { trigger:"player_stuck", who:"player", text:"الدومينو بيكدب عليك! 😂" },
  { trigger:"player_stuck", who:"player", text:"مش قلتلك؟ البوت أشطر منك 😤" },

  /* ── double_placed ── */
  { trigger:"double_placed", who:"both", text:"دبل! الضغط ازداد 😤" },
  { trigger:"double_placed", who:"both", text:"دبل على الطاولة — كل واحد حسابه! ⚡" },
  { trigger:"double_placed", who:"both", text:"الدبل وُضع! الأمور بقت صعبة 🔥" },

  /* ── last_tile ── */
  { trigger:"last_tile", who:"player", text:"قطعة واحدة! تقدر تكملها؟ 😏" },
  { trigger:"last_tile", who:"player", text:"قطعة وخلاص — اللحظة دي مش سهلة! 💎" },
  { trigger:"last_tile", who:"player", text:"آخر قطعة! نفسك طويل؟ 🎯" },

  /* ── game_blocked ── */
  { trigger:"game_blocked", who:"both", text:"الطاولة انسدت! النقط تحسم! 📊" },
  { trigger:"game_blocked", who:"both", text:"مفيش حركة! من عنده أقل يفوز 🏆" },

  /* ── comeback ── */
  { trigger:"comeback", who:"player", text:"انقلاب! مش كنت متوقعها كده! 😱" },
  { trigger:"comeback", who:"player", text:"سبحان الله! الدنيا اتقلبت! 🌀" },
  { trigger:"comeback", who:"player", text:"الدومينو علّمك درس النهارده! 📚" },
];

/** جيب جملة عشوائية لـ trigger معين */
export function getRandomTaunt(trigger: TauntTrigger): string {
  const pool = DOMINO_TAUNTS.filter(t => t.trigger === trigger);
  if (!pool.length) return "";
  return pool[Math.floor(Math.random() * pool.length)].text;
}
