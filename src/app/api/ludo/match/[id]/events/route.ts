import { NextRequest } from "next/server";
import { getEvents } from "@/lib/ludo/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const url = new URL(req.url);
  const since = parseInt(url.searchParams.get("since") || "0", 10);
  const { id } = await context.params;
  const ev = getEvents(id, since);
  return Response.json(ev);
}
