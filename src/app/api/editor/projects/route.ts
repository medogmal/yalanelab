// ═══════════════════════════════════════════════════════════════
//  API: /api/editor/projects
//  GET  — جلب كل مشاريع المستخدم
//  POST — إنشاء مشروع جديد
// ═══════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { GameEngineData } from "@/types/editor";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page   = parseInt(searchParams.get("page")  || "1");
    const limit  = parseInt(searchParams.get("limit") || "20");

    const where = { ownerId: user.id, ...(status ? { status } : {}) };

    const [projects, total] = await Promise.all([
      prisma.gameProject.findMany({
        where, orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit, take: limit,
        select: { id:true, title:true, description:true, category:true, status:true, thumbnailUrl:true, isPublished:true, playCount:true, likeCount:true, createdAt:true, updatedAt:true },
      }),
      prisma.gameProject.count({ where }),
    ]);

    return NextResponse.json({ projects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("GET /api/editor/projects:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await req.json();
    const { title, description, category, engineData } = body;

    if (!title?.trim()) return NextResponse.json({ error: "عنوان المشروع مطلوب" }, { status: 400 });

    const safeEngineData: GameEngineData = engineData || {
      version: "2.0" as const,
      category: category || "platformer",
      scenes: [{ id: "scene_1", name: "المشهد الأول", width: 1920, height: 1080, backgroundColor: { r: 12, g: 15, b: 30, a: 1 }, gravity: 9.8, objects: [], events: [], vsGraphs: [] }],
      story: { title: title.trim(), synopsis: "", characters: [], chapters: [], winCondition: "", loseCondition: "" },
      variables: {}, prefabs: [],
      assets: { sprites: [], sounds: [], backgrounds: [], tilesets: [] },
      settings: { targetFPS: 60, screenWidth: 1920, screenHeight: 1080, physics: "arcade", gravity: 9.8, pixelsPerUnit: 100, defaultTag: "Untagged", layers: ["Default","UI","Player","Enemy","Ground"], sortingLayers: ["Background","Default","Foreground","UI"] },
    };

    const project = await prisma.gameProject.create({
      data: { title: title.trim(), description: description?.trim() || "", category: category || "platformer", ownerId: user.id, engineData: JSON.stringify(safeEngineData), status: "draft" },
    });

    return NextResponse.json({ ...project, engineData: safeEngineData }, { status: 201 });
  } catch (err) {
    console.error("POST /api/editor/projects:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
