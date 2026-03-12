import { getCurrentUser } from "@/lib/auth/session";
import { unlockPieceSet, unlockBoardTheme, Cosmetics } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const kind = String(body?.kind || "");
  const id = String(body?.id || "");
  const premiumPiece = new Set<Cosmetics["pieceSet"]>(["gold", "neon"]);
  const premiumTheme = new Set<Cosmetics["boardTheme"]>(["wood", "carbon", "ocean"]);
  if (kind === "pieceSet") {
    if (premiumPiece.has(id as Cosmetics["pieceSet"]) && u.tier === "free") return Response.json({ error: "payment_required" }, { status: 402 });
    const ok = unlockPieceSet(u.id, id as Cosmetics["pieceSet"]);
    return Response.json({ ok, active: id });
  } else if (kind === "boardTheme") {
    if (premiumTheme.has(id as Cosmetics["boardTheme"]) && u.tier === "free") return Response.json({ error: "payment_required" }, { status: 402 });
    const ok = unlockBoardTheme(u.id, id as Cosmetics["boardTheme"]);
    return Response.json({ ok, active: id });
  }
  return Response.json({ error: "bad_kind" }, { status: 400 });
}
