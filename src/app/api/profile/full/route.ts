import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// GET /api/profile/full
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });

  return Response.json({
    id: u.id,
    name: u.name,
    email: u.email,
    level: u.level || 1,
    xp: u.xp || 0,
    coins: u.coins || 0,
    gems: u.gems || 0,
    ratings: u.ratings,
    tier: u.tier,
    matchesDomino: u.matchesDomino || 0,
    winsDomino: u.winsDomino || 0,
    lossesDomino: u.lossesDomino || 0,
    drawsDomino: u.drawsDomino || 0,
    longestWinStreakDomino: u.longestWinStreakDomino || 0,
    currentWinStreakDomino: u.currentWinStreakDomino || 0,
    streakDays: u.streakDays || 0,
    passLevel: u.passLevel || 1,
    passXP: u.passXP || 0,
    passPremium: u.passPremium || false,
    chests: u.chests || { wooden: 0, silver: 0, golden: 0, legendary: 0 },
  });
}
