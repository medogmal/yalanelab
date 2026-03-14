/* ═══════════════════════════════════════════════════════════════
   DOMINO CAMPAIGN SYSTEM
   خرائط + مستويات + win conditions
   ═══════════════════════════════════════════════════════════════ */

export type WinCondition =
  | { type: "win_match" }
  | { type: "points";   target: number }
  | { type: "max_turns"; count: number }
  | { type: "no_draws" };

export type LevelConfig = {
  id:                 string;
  levelNumber:        number;
  title:              string;
  description:        string;
  winCondition:       WinCondition;
  opponentDifficulty: "easy" | "medium" | "hard" | "expert";
  rewards:            { coins: number; xp: number; stars: number };
  locked?:            boolean;
};

export type CampaignMap = {
  id:          string;
  name:        string;
  description: string;
  bgImage:     string;
  themeColor:  string;
  levels:      LevelConfig[];
};

/* ─── helper ── */
function levels(
  prefix: string,
  count:  number,
  diff:   (i: number) => LevelConfig["opponentDifficulty"],
  cond:   (i: number) => WinCondition,
  reward: (i: number) => { coins: number; xp: number; stars: number },
  title:  (i: number) => string,
  desc:   (i: number) => string,
): LevelConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id:                 `${prefix}-${i + 1}`,
    levelNumber:        i + 1,
    title:              title(i),
    description:        desc(i),
    winCondition:       cond(i),
    opponentDifficulty: diff(i),
    rewards:            reward(i),
    locked:             i !== 0,
  }));
}

export const CAMPAIGN_MAPS: CampaignMap[] = [
  /* ═══════ 1. الكلاسيكية ═══════ */
  {
    id:          "classic",
    name:        "الكلاسيكية",
    description: "البداية في عالم الدومينو. تعلّم الأساسيات واهزم المبتدئين.",
    bgImage:     "/domino/tables/classic.png",
    themeColor:  "emerald",
    levels: levels(
      "classic", 10,
      i => i < 3 ? "easy" : i < 7 ? "medium" : "hard",
      _i => ({ type: "win_match" }),
      i  => ({ coins: 100 * (i + 1), xp: 50 * (i + 1), stars: 3 }),
      i  => `المستوى ${i + 1}`,
      i  => i === 0
        ? "فز بأول مباراة لتثبت جدارتك 🎯"
        : `تحدٍّ جديد بانتظارك — المستوى ${i + 1}`,
    ),
  },

  /* ═══════ 2. الصحراء الغامضة ═══════ */
  {
    id:          "desert",
    name:        "الصحراء الغامضة",
    description: "تحديات قاسية تحت شمس الصحراء. الذكاء هنا هو مفتاح النجاة.",
    bgImage:     "/domino/tables/desert.png",
    themeColor:  "amber",
    levels: levels(
      "desert", 10,
      _i => "medium",
      _i => ({ type: "points", target: 50 }),
      i  => ({ coins: 200 * (i + 1), xp: 100 * (i + 1), stars: 3 }),
      i  => `واحة ${i + 1}`,
      _i => "اجمع ٥٠ نقطة أو أكثر في المباراة 🏜️",
    ),
  },

  /* ═══════ 3. أسرار الفراعنة ═══════ */
  {
    id:          "egyptian",
    name:        "أسرار الفراعنة",
    description: "في حضرة التاريخ، فقط الأساطير يمكنهم الفوز.",
    bgImage:     "/domino/tables/egyptian.png",
    themeColor:  "yellow",
    levels: levels(
      "egypt", 10,
      _i => "hard",
      _i => ({ type: "no_draws" }),
      i  => ({ coins: 300 * (i + 1), xp: 150 * (i + 1), stars: 3 }),
      i  => `مقبرة ${i + 1}`,
      _i => "فز دون سحب أي قطعة من المستودع 🏛️",
    ),
  },

  /* ═══════ 4. قصر السلطان ═══════ */
  {
    id:          "sultan",
    name:        "قصر السلطان",
    description: "الفخامة تتطلب مهارة عالية. هل أنت جدير بلقب الوزير؟",
    bgImage:     "/domino/tables/sultan.png",
    themeColor:  "purple",
    levels: levels(
      "sultan", 10,
      _i => "expert",
      _i => ({ type: "max_turns", count: 10 }),
      i  => ({ coins: 500 * (i + 1), xp: 250 * (i + 1), stars: 3 }),
      i  => `مجلس ${i + 1}`,
      _i => "اهزم الخبير في أقل من ١٠ أدوار 👑",
    ),
  },

  /* ═══════ 5. الليالي التركية ═══════ */
  {
    id:          "turkish",
    name:        "الليالي التركية",
    description: "النهاية الكبرى. هنا يُتوَّج أبطال الدومينو.",
    bgImage:     "/domino/tables/turkish.png",
    themeColor:  "rose",
    levels: levels(
      "turkish", 10,
      _i => "expert",
      _i => ({ type: "win_match" }),
      i  => ({ coins: 1000 * (i + 1), xp: 500 * (i + 1), stars: 3 }),
      i  => `ليلة ${i + 1}`,
      _i => "البقاء للأقوى — فز ضد خبير متكامل 🌙",
    ),
  },
];

/* ═══════════════════════════════════════════════════════════════
   WIN CONDITION CHECKER
   يُستدعى من الـ Board بعد كل حركة
   ═══════════════════════════════════════════════════════════════ */
export interface GameSnapshot {
  winner:     string | null;   // "player" أو null
  totalTurns: number;
  playerPips: number;          // pip count للاعب في نهاية اللعبة
  didDraw:    boolean;         // هل سحب اللاعب قطعة خلال المباراة؟
}

export function checkWinCondition(
  cond:     WinCondition,
  snap:     GameSnapshot,
): { passed: boolean; reason: string } {
  const won = snap.winner === "player";

  switch (cond.type) {
    case "win_match":
      return {
        passed: won,
        reason: won ? "فزت بالمباراة! 🏆" : "خسرت المباراة",
      };

    case "points":
      // الـ points = مجموع قطع الخصم اللي جمعها اللاعب
      // نحسبها من الـ scores لاحقاً — للتبسيط: الفوز = اجتزت الـ target
      return {
        passed: won,
        reason: won ? `جمعت النقاط المطلوبة ✅` : "لم تجمع النقاط الكافية",
      };

    case "max_turns":
      return {
        passed: won && snap.totalTurns <= cond.count,
        reason: won && snap.totalTurns <= cond.count
          ? `فزت في ${snap.totalTurns} أدوار فقط! ⚡`
          : snap.totalTurns > cond.count
          ? `تجاوزت ${cond.count} دور (${snap.totalTurns})`
          : "لم تفز",
      };

    case "no_draws":
      return {
        passed: won && !snap.didDraw,
        reason: won && !snap.didDraw
          ? "فزت بدون سحب! 🎯"
          : snap.didDraw
          ? "سحبت قطعة — الشرط لم يتحقق"
          : "لم تفز",
      };

    default:
      return { passed: false, reason: "شرط غير معروف" };
  }
}
