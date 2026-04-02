/* ═══════════════════════════════════════════════════════════════
   ELO SYSTEM — يالا نلعب
   نظام التقييم والمستويات للمنصة
═══════════════════════════════════════════════════════════════ */

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Tier {
  level:  number;
  name:   string;
  icon:   string;
  minElo: number;
  maxElo: number;
  color:  string;
}

export const TIERS: Tier[] = [
  { level: 1,  name: "نجمة",     icon: "⭐", minElo: 0,    maxElo: 800,  color: "#888780" },
  { level: 2,  name: "برونز I",  icon: "🥉", minElo: 801,  maxElo: 950,  color: "#D85A30" },
  { level: 3,  name: "برونز II", icon: "🥉", minElo: 951,  maxElo: 1100, color: "#993C1D" },
  { level: 4,  name: "فضة I",    icon: "🥈", minElo: 1101, maxElo: 1300, color: "#B4B2A9" },
  { level: 5,  name: "فضة II",   icon: "🥈", minElo: 1301, maxElo: 1500, color: "#5F5E5A" },
  { level: 6,  name: "ذهب I",    icon: "🥇", minElo: 1501, maxElo: 1700, color: "#EF9F27" },
  { level: 7,  name: "ذهب II",   icon: "🥇", minElo: 1701, maxElo: 1900, color: "#BA7517" },
  { level: 8,  name: "ألماس",    icon: "💎", minElo: 1901, maxElo: 2200, color: "#378ADD" },
  { level: 9,  name: "أسطورة",   icon: "🏆", minElo: 2201, maxElo: 2600, color: "#7F77DD" },
  { level: 10, name: "سلطان",    icon: "👑", minElo: 2601, maxElo: 9999, color: "#534AB7" },
];

/** يرجع الـ Tier بناءً على ELO */
export function getTier(elo: number): Tier {
  return [...TIERS].reverse().find(t => elo >= t.minElo) ?? TIERS[0];
}

/** يرجع صعوبة الـ AI بناءً على ELO */
export function getAiDifficulty(elo: number): Difficulty {
  if (elo <= 950)  return "easy";
  if (elo <= 1500) return "medium";
  if (elo <= 2200) return "hard";
  return "expert";
}

/** يحسب تغيير ELO بعد مباراة */
export function calcEloChange(myElo: number, oppElo: number, won: boolean): number {
  const k        = myElo < 1200 ? 32 : myElo < 2000 ? 16 : 8;
  const expected = 1 / (1 + Math.pow(10, (oppElo - myElo) / 400));
  const actual   = won ? 1 : 0;
  return Math.round(k * (actual - expected));
}

/** نطاق البحث عن منافس حسب وقت الانتظار */
export function getMatchRange(waitSeconds: number): number {
  if (waitSeconds < 30) return 150;
  if (waitSeconds < 60) return 300;
  return Infinity; // يكمل بـ AI
}

/** نسبة التقدم داخل الـ Tier الحالي (0–100) */
export function getTierProgress(elo: number): number {
  const tier = getTier(elo);
  if (tier.maxElo === 9999) return 100;
  const range    = tier.maxElo - tier.minElo;
  const progress = elo - tier.minElo;
  return Math.min(100, Math.round((progress / range) * 100));
}
