import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/auth/store";
import crypto from "crypto";

// POST /api/user/challenge — create a challenge invite link
// body: { targetId?, game: "domino"|"chess"|"baloot"|"ludo" }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { targetId, game = "domino" } = await req.json() ?? {};

  const user = getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Generate short invite code
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  const gameRoutes: Record<string, string> = {
    domino: "/games/domino/ranked",
    chess:  "/games/chess/online",
    baloot: "/games/baloot/online",
    ludo:   "/games/ludo/online",
  };

  const baseRoute = gameRoutes[game] ?? gameRoutes.domino;
  const inviteUrl = `${baseRoute}?invite=${code}&from=${user.id}`;

  // In a real system we'd store this code in Redis with TTL
  // For now return the link directly
  return NextResponse.json({ ok: true, code, url: inviteUrl, game, fromName: user.name });
}
