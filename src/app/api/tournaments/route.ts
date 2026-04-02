import { NextRequest, NextResponse } from "next/server";
import { listTournaments, createTournament } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listTournaments());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body?.name || "");
  const startAt = String(body?.startAt || "");
  const capacity = Number(body?.capacity || 0);
  if (!name || !startAt || capacity < 2) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const t = createTournament({ name, startAt, capacity });
  return NextResponse.json(t);
}
