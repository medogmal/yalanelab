import { getCurrentUser } from "@/lib/auth/session";
import { setTier, setCosmetics } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  setTier(u.id, "free");
  setCosmetics(u.id, { pieceSet: "lichess", boardTheme: "classic" });
  return Response.json({ ok: true });
}
