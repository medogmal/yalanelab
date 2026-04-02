import { NextRequest } from "next/server";
import { getUserByEmail, verifyPassword } from "@/lib/auth/store";
import { createSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const user = getUserByEmail(email);
  if (!user) return Response.json({ error: "invalid_credentials" }, { status: 401 });
  const ok = verifyPassword(password, user.passHash, user.salt);
  if (!ok) return Response.json({ error: "invalid_credentials" }, { status: 401 });
  await createSession(user.id);
  return Response.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, tier: user.tier, coins: user.coins, gems: user.gems } });
}
