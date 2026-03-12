import { getCurrentUser, createSession } from "@/lib/auth/session";
import { getUserById, updateUser } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

// GET /api/user/me  — full profile for logged-in user
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });

  return Response.json({
    user: {
      id:       u.id,
      name:     u.name,
      email:    u.email,
      level:    u.level    || 1,
      xp:       u.xp       || 0,
      coins:    u.coins    || 0,
      gems:     u.gems     || 0,
      role:     u.role     || "user",
      tier:     u.tier     || "free",
      ratings:  u.ratings,
      cosmetics: u.cosmetics,
      stats: {
        matchesDomino:       u.matchesDomino       || 0,
        winsDomino:          u.winsDomino          || 0,
        lossesDomino:        u.lossesDomino        || 0,
        drawsDomino:         u.drawsDomino         || 0,
        longestWinStreak:    u.longestWinStreakDomino || 0,
        currentWinStreak:    u.currentWinStreakDomino || 0,
      },
      chests:        u.chests        || { wooden: 0, silver: 0, golden: 0, legendary: 0 },
      activeChest:   u.activeChest   || null,
      streakDays:    u.streakDays    || 0,
      passLevel:     u.passLevel     || 1,
      passXP:        u.passXP        || 0,
      passPremium:   !!u.passPremium,
      dailyMissions: u.dailyMissions  || [],
      weeklyMissions:u.weeklyMissions || [],
    },
  });
}

// PATCH /api/user/me  — update name or bio
export async function PATCH(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 40) : undefined;
  const bio  = typeof body.bio  === "string" ? body.bio.trim().slice(0, 200) : undefined;

  const fresh = getUserById(u.id);
  if (!fresh) return Response.json({ error: "not_found" }, { status: 404 });

  if (name) fresh.name = name;
  if (bio !== undefined) (fresh as any).bio = bio;

  updateUser(fresh);
  return Response.json({ ok: true });
}
