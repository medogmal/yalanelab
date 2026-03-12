import { getCurrentUser } from "@/lib/auth/session";
import { setCosmetics, Cosmetics } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

const freePieceSets = new Set(["lichess", "staunton"]);
const premiumPieceSets = new Set(["gold", "neon"]);
const freeThemes = new Set(["classic"]);
const premiumThemes = new Set(["wood", "carbon", "ocean"]);

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ cosmetics: null, available: { freePieceSets: Array.from(freePieceSets), premiumPieceSets: Array.from(premiumPieceSets), freeThemes: Array.from(freeThemes), premiumThemes: Array.from(premiumThemes) } });
  return Response.json({ cosmetics: u.cosmetics, tier: u.tier, available: { freePieceSets: Array.from(freePieceSets), premiumPieceSets: Array.from(premiumPieceSets), freeThemes: Array.from(freeThemes), premiumThemes: Array.from(premiumThemes) } });
}

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const pieceSet = body?.pieceSet ? String(body.pieceSet) : undefined;
  const boardTheme = body?.boardTheme ? String(body.boardTheme) : undefined;
  if (pieceSet && !freePieceSets.has(pieceSet) && !premiumPieceSets.has(pieceSet)) return Response.json({ error: "bad_pieceset" }, { status: 400 });
  if (boardTheme && !freeThemes.has(boardTheme) && !premiumThemes.has(boardTheme)) return Response.json({ error: "bad_theme" }, { status: 400 });
  if (pieceSet && premiumPieceSets.has(pieceSet) && u.tier === "free") return Response.json({ error: "payment_required" }, { status: 402 });
  if (boardTheme && premiumThemes.has(boardTheme) && u.tier === "free") return Response.json({ error: "payment_required" }, { status: 402 });
  const update: Partial<Cosmetics> = {};
  if (pieceSet) update.pieceSet = pieceSet as Cosmetics["pieceSet"];
  if (boardTheme) update.boardTheme = boardTheme as Cosmetics["boardTheme"];
  setCosmetics(u.id, update);
  return Response.json({ ok: true });
}
