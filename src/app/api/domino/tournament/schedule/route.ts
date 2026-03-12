declare global {
  var __TOUR_MEM__: { schedule: Array<{ id: string; name: string; kind: "daily" | "weekly"; startAt: number; registered: number; maxPlayers: number }> } | undefined;
}
function getMem() {
  if (!global.__TOUR_MEM__) {
    const now = Date.now();
    global.__TOUR_MEM__ = {
      schedule: [
        { id: "daily-1", name: "بطولة يومية 16 لاعب", kind: "daily", startAt: now + 60_000, registered: 0, maxPlayers: 16 },
        { id: "daily-2", name: "بطولة يومية 8 لاعب", kind: "daily", startAt: now + 120_000, registered: 0, maxPlayers: 8 },
        { id: "weekly-1", name: "بطولة أسبوعية 32 لاعب", kind: "weekly", startAt: now + 86_400_000, registered: 0, maxPlayers: 32 },
      ],
    };
  }
  return global.__TOUR_MEM__;
}
export const dynamic = "force-dynamic";
export async function GET() {
  const m = getMem();
  return Response.json({ schedule: m.schedule });
}
