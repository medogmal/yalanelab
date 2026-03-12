import { NextRequest, NextResponse } from "next/server";
import { listPages, savePage, deletePage } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listPages());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.id || !body.title) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const page = savePage(body);
  return NextResponse.json(page);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  
  deletePage(id);
  return NextResponse.json({ success: true });
}
