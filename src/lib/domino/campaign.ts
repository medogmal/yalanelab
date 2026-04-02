/* ═══════════════════════════════════════════════════════════════
   DOMINO CAMPAIGN SYSTEM v2.0
   خرائط + مستويات + win conditions محكمة
   ═══════════════════════════════════════════════════════════════ */

export type WinCondition =
  | { type: "win_match" }
  | { type: "points";    target: number }
  | { type: "max_turns"; count: number }
  | { type: "no_draws" }
  | { type: "win_streak"; count: number };   // جديد: فوز X مرات متتالية

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

/* ─── helper ─────────────────────────────────────────────────── */
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
      i  => ({ type: "points", target: 30 + i * 5 }),   // 30 → 75 نقطة
      i  => ({ coins: 200 * (i + 1), xp: 100 * (i + 1), stars: 3 }),
      i  => `واحة ${i + 1}`,
      i  => `اجمع ${30 + i * 5} نقطة أو أكثر في المباراة 🏜️`,
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
      i  => ({ type: "max_turns", count: 20 - i }),   // 20 → 11 دور
      i  => ({ coins: 500 * (i + 1), xp: 250 * (i + 1), stars: 3 }),
      i  => `مجلس ${i + 1}`,
      i  => `اهزم الخبير في أقل من ${20 - i} دور 👑`,
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
      i  => i < 5 ? { type: "win_match" } : { type: "no_draws" },
      i  => ({ coins: 1000 * (i + 1), xp: 500 * (i + 1), stars: 3 }),
      i  => `ليلة ${i + 1}`,
      i  => i < 5
        ? "البقاء للأقوى — فز ضد خبير متكامل 🌙"
        : "الليلة الأخيرة — فز بدون سحب ضد خبير 🌟",
    ),
  },
];

/* ═══════════════════════════════════════════════════════════════
   WIN CONDITION CHECKER
═══════════════════════════════════════════════════════════════ */
export interface GameSnapshot {
  winner:       string | null;   // "player" أو "ai" أو null
  totalTurns:   number;
  playerPips:   number;          // pips الخصم التي جمعها اللاعب (= النقاط المكتسبة)
  oppPips:      number;          // pips اللاعب المتبقية (لحساب الخسارة)
  didDraw:      boolean;
  playerScore:  number;          // المجموع التراكمي للنقاط في المباراة
}

export function checkWinCondition(
  cond: WinCondition,
  snap: GameSnapshot,
): { passed: boolean; reason: string } {
  const won = snap.winner === "player";

  switch (cond.type) {
    case "win_match":
      return {
        passed: won,
        reason: won ? "فزت بالمباراة! 🏆" : "خسرت المباراة",
      };

    case "points": {
      // النقاط = مجموع قطع الخصم عند فوز اللاعب
      const pts = won ? snap.playerScore : 0;
      const ok  = won && pts >= cond.target;
      return {
        passed: ok,
        reason: ok
          ? `جمعت ${pts} نقطة ✅`
          : won
          ? `فزت لكن بـ${pts} نقطة فقط (المطلوب ${cond.target})`
          : "لم تفز",
      };
    }

    case "max_turns":
      return {
        passed: won && snap.totalTurns <= cond.count,
        reason: won && snap.totalTurns <= cond.count
          ? `فزت في ${snap.totalTurns} دور! ⚡`
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

    case "win_streak":
      // هذا يُحسب خارجياً من الـ progress
      return {
        passed: won,
        reason: won ? `فوز متتالي! 🔥` : "لم تفز",
      };

    default:
      return { passed: false, reason: "شرط غير معروف" };
  }
}

/* ═══════════════════════════════════════════════════════════════
   PROGRESS HELPERS
═══════════════════════════════════════════════════════════════ */
export type LevelProgress = {
  passed:      boolean;
  completedAt: number;
  stars:       number;
  bestScore?:  number;   // أعلى نقاط في مباراة واحدة
  bestTurns?:  number;   // أقل عدد أدوار للفوز
};

export type MapProgress = Record<string, LevelProgress>;

/** يحسب نجوم المستوى حسب الأداء */
export function calcStars(cond: WinCondition, snap: GameSnapshot): number {
  if (!snap.winner || snap.winner !== "player") return 0;

  switch (cond.type) {
    case "win_match":
      return snap.oppPips === 0 ? 3 : snap.totalTurns < 15 ? 3 : snap.totalTurns < 25 ? 2 : 1;
    case "points": {
      const pts = snap.playerScore;
      if (pts >= cond.target * 1.5) return 3;
      if (pts >= cond.target * 1.2) return 2;
      return 1;
    }
    case "max_turns":
      if (snap.totalTurns <= Math.floor(cond.count * 0.6)) return 3;
      if (snap.totalTurns <= Math.floor(cond.count * 0.8)) return 2;
      return 1;
    case "no_draws":
      return snap.totalTurns < 10 ? 3 : snap.totalTurns < 20 ? 2 : 1;
    default:
      return 1;
  }
}
