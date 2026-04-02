import { NextRequest, NextResponse } from "next/server";
import { listAds, addAd } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listAds());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = String(body?.title || "");
  const content = String(body?.content || "");
  if (!title || !content) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const ad = addAd({ title, content });
  return NextResponse.json(ad);
}
