export const dynamic = "force-dynamic";

type Standing = { userId: string; name: string; points: number; rank: number };
const mem: { standings: Standing[] } = { standings: [] };

export async function GET() {
  return Response.json({ standings: mem.standings.slice(0, 100) });
}
