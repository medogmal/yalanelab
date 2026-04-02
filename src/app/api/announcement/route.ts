import { NextRequest, NextResponse } from "next/server";
import { getAnnouncement, setAnnouncement } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ text: getAnnouncement() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const text = String(body?.text || "");
  if (!text) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const v = setAnnouncement(text);
  return NextResponse.json({ text: v });
}
