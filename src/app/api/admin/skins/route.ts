import { NextRequest, NextResponse } from "next/server";
import { listSkins, addSkin, removeSkin } from "@/lib/store";

export async function GET() {
  return NextResponse.json(listSkins());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id || !body.type || !body.name || !body.asset) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    const skin = addSkin(body);
    return NextResponse.json(skin);
  } catch (e) {
    return NextResponse.json({ error: "duplicate_id" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  
  removeSkin(id);
  return NextResponse.json({ success: true });
}
