import { getCurrentUser } from "@/lib/auth/session";
import { loadFinished, FinishedMatch } from "@/lib/chess/store";

export const dynamic = "force-dynamic";

function computeChessStats(userId: string, userName: string, finished: FinishedMatch[]) {
  const mine = finished.filter((m) => m.wUserId === userId || m.bUserId === userId || m.wName === userName || m.bName === userName);
  let wins = 0, losses = 0, draws = 0;
  const timeBreakdown: Record<string, number> = {};
  let currentStreak = 0;
  let bestStreak = 0;
  for (const m of mine) {
    const tc = `${m.time.baseMin}+${m.time.incSec}`;
    timeBreakdown[tc] = (timeBreakdown[tc] || 0) + 1;
    const isWhite = m.wUserId === userId || m.wName === userName;
    const didWin = (isWhite && m.result === "1-0") || (!isWhite && m.result === "0-1");
    const isDraw = m.result === "1/2-1/2";
    if (didWin) { wins++; currentStreak++; bestStreak = Math.max(bestStreak, currentStreak); }
    else if (isDraw) { draws++; }
    else { losses++; currentStreak = 0; }
  }
  const achievements: { id: string; title: string; unlockedAt?: number }[] = [];
  if (mine.length >= 1) achievements.push({ id: "first_game", title: "أول مباراة" });
  if (wins >= 1) achievements.push({ id: "first_win", title: "أول انتصار" });
  if (mine.length >= 10) achievements.push({ id: "ten_games", title: "عشر مباريات" });
  if (bestStreak >= 3) achievements.push({ id: "streak_3", title: "سلسلة انتصارات 3" });
  return {
    rating: undefined,
    stats: { wins, losses, draws },
    timeBreakdown,
    streaks: { bestWinStreak: bestStreak },
    matchesCount: mine.length,
    achievements,
  };
}

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ user: null }, { status: 401 });
  const finished = loadFinished();
  const chess = computeChessStats(u.id, u.name, finished);
  return Response.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      tier: u.tier,
      ratings: u.ratings,
      cosmetics: u.cosmetics,
    },
    profiles: {
      chess,
    },
  });
}
