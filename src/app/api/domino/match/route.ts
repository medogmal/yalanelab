import { getCurrentUser } from "@/lib/auth/session";
import { recordDominoMatch, applyDominoEloResult, grantXp, grantCoins } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

// POST /api/domino/match — تسجيل نتيجة مباراة دومينو
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const result = body.result as "win" | "loss" | "draw";
  const durationSec = body.durationSec as number | undefined;
  const coinsReward = body.coins as number | undefined;
  const xpReward = body.xp as number | undefined;

  if (!["win", "loss", "draw"].includes(result)) {
    return Response.json({ error: "invalid result" }, { status: 400 });
  }

  recordDominoMatch(u.id, result, durationSec);

  // منح XP وكوينز من الـ EndDialog
  if (xpReward && xpReward > 0) grantXp(u.id, xpReward);
  if (coinsReward && coinsReward > 0) grantCoins(u.id, coinsReward);

  return Response.json({ ok: true });
}
