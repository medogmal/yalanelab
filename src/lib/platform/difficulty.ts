/* ═══════════════════════════════════════════════════════════════
   difficulty.ts — نظام المراحل والصعوبة لكل الألعاب
   ───────────────────────────────────────────────────────────────
   • 5 مستويات صعوبة: beginner → easy → medium → hard → expert
   • كل مستوى له:
       - تأخير تفكير البوت (thinkMs)
       - عدد الأخطاء المسموح بها (mistakeRate 0-1)
       - وصف عربي
   • نظام المراحل: كل لعبة عندها stages
       - الـ stage بيحدد الصعوبة تلقائياً
═══════════════════════════════════════════════════════════════ */

/* ── أنواع الصعوبة ── */
export type DiffLevel = "beginner" | "easy" | "medium" | "hard" | "expert";

export interface DiffConfig {
  level:       DiffLevel;
  label:       string;        // اسم عربي
  emoji:       string;
  thinkMs:     number;        // وقت تفكير البوت بالـ ms
  mistakeRate: number;        // نسبة الأخطاء 0=لا يخطئ 1=عشوائي
  color:       string;
}

/* ── إعدادات كل مستوى ── */
export const DIFFICULTY_CONFIG: Record<DiffLevel, DiffConfig> = {
  beginner: {
    level: "beginner", label: "مبتدئ",  emoji: "🟢",
    thinkMs: 2000, mistakeRate: 0.5, color: "#22c55e",
  },
  easy: {
    level: "easy",     label: "سهل",    emoji: "🟡",
    thinkMs: 2000, mistakeRate: 0.3, color: "#eab308",
  },
  medium: {
    level: "medium",   label: "متوسط",  emoji: "🟠",
    thinkMs: 2200, mistakeRate: 0.15, color: "#f97316",
  },
  hard: {
    level: "hard",     label: "صعب",    emoji: "🔴",
    thinkMs: 2500, mistakeRate: 0.05, color: "#ef4444",
  },
  expert: {
    level: "expert",   label: "خبير",   emoji: "💀",
    thinkMs: 2800, mistakeRate: 0,    color: "#a855f7",
  },
};

/* ══════════════════════════════════════════════════════════════
   نظام المراحل — Stages
   كل لعبة عندها مراحل، كل مرحلة بتحدد:
   - الصعوبة
   - عدد الجولات للفوز بالمرحلة
   - المكافأة
══════════════════════════════════════════════════════════════ */
export interface Stage {
  id:         number;
  title:      string;
  difficulty: DiffLevel;
  winsNeeded: number;     // عدد الفوزات للانتقال للمرحلة التالية
  reward:     { coins: number; xp: number };
  unlockMsg?: string;     // رسالة تظهر لما المرحلة تتفتح
}

/* ── مراحل الدومينو ── */
export const DOMINO_STAGES: Stage[] = [
  { id:1, title:"المبتدئ",      difficulty:"beginner", winsNeeded:2, reward:{coins:50,  xp:20},  unlockMsg:"أهلاً في الدومينو! 🎲" },
  { id:2, title:"المتعلم",      difficulty:"easy",     winsNeeded:3, reward:{coins:75,  xp:30},  unlockMsg:"ممتاز! جاهز للتحدي؟" },
  { id:3, title:"المحترف",      difficulty:"medium",   winsNeeded:3, reward:{coins:100, xp:50},  unlockMsg:"البوت بدأ يفكر أكتر 🤔" },
  { id:4, title:"المتقدم",      difficulty:"hard",     winsNeeded:4, reward:{coins:150, xp:75},  unlockMsg:"مستوى صعب! حظاً موفقاً 🔥" },
  { id:5, title:"أسطورة الدومينو",difficulty:"expert", winsNeeded:5, reward:{coins:300, xp:150}, unlockMsg:"البوت الخبير! هل تقدر؟ 💀" },
];

/* ── مراحل البلوت ── */
export const BALOOT_STAGES: Stage[] = [
  { id:1, title:"المبتدئ",    difficulty:"beginner", winsNeeded:2, reward:{coins:50,  xp:20} },
  { id:2, title:"المتعلم",    difficulty:"easy",     winsNeeded:3, reward:{coins:75,  xp:30} },
  { id:3, title:"المحترف",    difficulty:"medium",   winsNeeded:3, reward:{coins:100, xp:50} },
  { id:4, title:"المتقدم",    difficulty:"hard",     winsNeeded:4, reward:{coins:150, xp:75} },
  { id:5, title:"سلطان البلوت",difficulty:"expert",  winsNeeded:5, reward:{coins:300, xp:150} },
];

/* ── مراحل الشطرنج ── */
export const CHESS_STAGES: Stage[] = [
  { id:1, title:"المبتدئ",      difficulty:"beginner", winsNeeded:2, reward:{coins:50,  xp:20},  unlockMsg:"أهلاً في الشطرنج! ♟" },
  { id:2, title:"المتعلم",      difficulty:"easy",     winsNeeded:3, reward:{coins:75,  xp:30},  unlockMsg:"Stockfish بدأ يفكر أكتر!" },
  { id:3, title:"المحترف",      difficulty:"medium",   winsNeeded:3, reward:{coins:100, xp:50},  unlockMsg:"الـ depth زاد — استعد! 🔥" },
  { id:4, title:"المتقدم",      difficulty:"hard",     winsNeeded:4, reward:{coins:150, xp:75},  unlockMsg:"مستوى صعب جداً 💀" },
  { id:5, title:"عبقري الشطرنج",difficulty:"expert",   winsNeeded:5, reward:{coins:300, xp:150}, unlockMsg:"Stockfish الكامل — هل تقدر؟ 👑" },
];

/* ── مراحل اللودو ── */
export const LUDO_STAGES: Stage[] = [
  { id:1, title:"المبتدئ",   difficulty:"beginner", winsNeeded:2, reward:{coins:50,  xp:20} },
  { id:2, title:"المتعلم",   difficulty:"easy",     winsNeeded:3, reward:{coins:75,  xp:30} },
  { id:3, title:"المحترف",   difficulty:"medium",   winsNeeded:3, reward:{coins:100, xp:50} },
  { id:4, title:"المتقدم",   difficulty:"hard",     winsNeeded:4, reward:{coins:150, xp:75} },
  { id:5, title:"ملك اللودو",difficulty:"expert",   winsNeeded:5, reward:{coins:300, xp:150} },
];

/* ── Helper: الـ stage الحالي من عدد الفوزات ── */
export function getCurrentStage(wins: number, stages: Stage[]): Stage {
  let total = 0;
  for (const stage of stages) {
    total += stage.winsNeeded;
    if (wins < total) return stage;
  }
  return stages[stages.length - 1]; // آخر مرحلة
}

/** تأخير التفكير للبوت حسب الصعوبة */
export function getBotThinkDelay(diff: DiffLevel): number {
  const base = DIFFICULTY_CONFIG[diff].thinkMs;
  // إضافة عشوائية بسيطة عشان تبان طبيعية
  return base + Math.random() * 300;
}

/** هل البوت يخطئ في هذه الحركة؟ */
export function shouldBotMistake(diff: DiffLevel): boolean {
  return Math.random() < DIFFICULTY_CONFIG[diff].mistakeRate;
}
