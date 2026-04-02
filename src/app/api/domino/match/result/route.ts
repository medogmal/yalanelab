import { getCurrentUser } from "@/lib/auth/session";
import { applyDominoEloResult, grantXp, recordDominoMatch, loadUsers, addScoreProgress } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const result = String(body?.result || "");
  const durationSec = Number(body?.durationSec || 0);
  const scorePlayer = Number(body?.scorePlayer || 0);
  const before = u.ratings.domino;
  if (result === "win") {
    applyDominoEloResult(u.id, undefined, false);
    grantXp(u.id, 50);
    recordDominoMatch(u.id, "win", durationSec);
  } else if (result === "loss") {
    applyDominoEloResult(undefined, u.id, false);
    grantXp(u.id, 10);
    recordDominoMatch(u.id, "loss", durationSec);
  } else {
    applyDominoEloResult(u.id, u.id, true);
    grantXp(u.id, 20);
    recordDominoMatch(u.id, "draw", durationSec);
  }
  addScoreProgress(u.id, Math.max(0, scorePlayer));
  const after = loadUsers().find((x) => x.id === u.id)!.ratings.domino;
  const delta = after - before;
  return Response.json({ ok: true, ratingBefore: before, ratingAfter: after, delta });
}
