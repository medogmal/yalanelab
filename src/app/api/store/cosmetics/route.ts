import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const catalog = {
  pieceSets: [
    { id: "lichess", name: "Lichess", tier: "free" as const },
    { id: "staunton", name: "Staunton", tier: "free" as const },
    { id: "gold", name: "ذهبي", tier: "pro" as const },
    { id: "neon", name: "نيون", tier: "pro" as const },
  ],
  boardThemes: [
    { id: "classic", name: "كلاسيك", tier: "free" as const },
    { id: "wood", name: "خشب", tier: "pro" as const },
    { id: "carbon", name: "كاربون", tier: "pro" as const },
    { id: "ocean", name: "أوشن", tier: "pro" as const },
  ],
};

export async function GET() {
  const u = await getCurrentUser();
  return Response.json({
    catalog,
    user: u
      ? {
          tier: u.tier,
          cosmetics: u.cosmetics,
          unlockedPieceSets: (u as unknown as { unlockedPieceSets: string[] }).unlockedPieceSets,
          unlockedBoardThemes: (u as unknown as { unlockedBoardThemes: string[] }).unlockedBoardThemes,
        }
      : null,
  });
}
