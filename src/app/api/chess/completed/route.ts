import { loadFinished } from "@/lib/chess/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = loadFinished();
  return Response.json({ matches: items });
}
