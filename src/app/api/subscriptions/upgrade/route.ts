import { getCurrentUser } from "@/lib/auth/session";
import { setTier, Tier } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const tier = String(body?.tier || "pro");
  if (tier !== "pro" && tier !== "elite") return Response.json({ error: "bad_tier" }, { status: 400 });
  setTier(u.id, tier as Tier);
  return Response.json({ ok: true, tier });
}
