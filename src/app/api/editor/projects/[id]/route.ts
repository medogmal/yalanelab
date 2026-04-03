// ═══════════════════════════════════════════════════════════════
//  API: /api/editor/projects/[id]
// ═══════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const project = await prisma.gameProject.findUnique({ where: { id: params.id } });
    if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
    if (project.ownerId !== user.id && !project.isPublished) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    let engineData;
    try { engineData = JSON.parse(project.engineData); } catch { engineData = {}; }

    return NextResponse.json({ ...project, engineData });
  } catch (err) {
    console.error("GET /api/editor/projects/[id]:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const existing = await prisma.gameProject.findUnique({ where: { id: params.id }, select: { ownerId: true } });
    if (!existing) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
    if (existing.ownerId !== user.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    const body = await req.json();
    const { title, description, category, engineData, status, thumbnailUrl } = body;

    const updated = await prisma.gameProject.update({
      where: { id: params.id },
      data: {
        ...(title        !== undefined && { title: title.trim() }),
        ...(description  !== undefined && { description: description.trim() }),
        ...(category     !== undefined && { category }),
        ...(status       !== undefined && { status }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(engineData   !== undefined && { engineData: typeof engineData === "string" ? engineData : JSON.stringify(engineData) }),
      },
    });

    let parsedEngineData;
    try { parsedEngineData = JSON.parse(updated.engineData); } catch { parsedEngineData = {}; }

    return NextResponse.json({ ...updated, engineData: parsedEngineData });
  } catch (err) {
    console.error("PATCH /api/editor/projects/[id]:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const existing = await prisma.gameProject.findUnique({ where: { id: params.id }, select: { ownerId: true } });
    if (!existing) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
    if (existing.ownerId !== user.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

    await prisma.gameProject.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/editor/projects/[id]:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
