import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ user: null });
  return Response.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      ratings: u.ratings,
      tier: u.tier,
      cosmetics: u.cosmetics,
      unlockedPieceSets: (u as unknown as { unlockedPieceSets: string[] }).unlockedPieceSets,
      unlockedBoardThemes: (u as unknown as { unlockedBoardThemes: string[] }).unlockedBoardThemes,
      role: u.role,
      coins: u.coins,
      gems: u.gems,
    },
  });
}
