import { NextRequest, NextResponse } from "next/server";
import { getStream, setStream } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getStream());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const url = body?.url ?? undefined;
  const prerollSeconds = body?.prerollSeconds ?? undefined;
  const adUrl = body?.adUrl ?? undefined;
  const cfg = setStream({ url, prerollSeconds, adUrl });
  return NextResponse.json(cfg);
}
