import { NextRequest, NextResponse } from "next/server";
import { listMessages, addMessage } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room") || "global";
  return NextResponse.json(listMessages(room));
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room") || "global";
  const body = await req.json();
  const user = String(body?.user || "مستخدم");
  const text = String(body?.text || "");
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
  const m = addMessage(room, user, text);
  return NextResponse.json(m);
}
