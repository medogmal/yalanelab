// ═══════════════════════════════════════════════════════════════
//  API: /api/editor/projects
//  GET  — جلب كل مشاريع المستخدم الحالي
//  POST — إنشاء مشروع جديد
// ═══════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { GameEngineData } from "@/types/editor";

// ── GET /api/editor/projects ─────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");   // draft | published | archived
    const page   = parseInt(searchParams.get("page")  || "1");
    const limit  = parseInt(searchParams.get("limit") || "20");

    const where = {
      ownerId: session.user.id,
      ...(status ? { status } : {}),
    };

    const [projects, total] = await Promise.all([
      prisma.gameProject.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id:           true,
          title:        true,
          description:  true,
          category:     true,
          status:       true,
          thumbnailUrl: true,
          isPublished:  true,
          playCount:    true,
          likeCount:    true,
          createdAt:    true,
          updatedAt:    true,
          // لا نرجع engineData في القائمة عشان الحجم
        },
      }),
      prisma.gameProject.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/editor/projects:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

// ── POST /api/editor/projects ────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, engineData } = body;

    if (!title || typeof title !== "string" || title.trim().length < 1) {
      return NextResponse.json({ error: "عنوان المشروع مطلوب" }, { status: 400 });
    }

    // التحقق من الـ engineData
    const safeEngineData: GameEngineData = engineData || {
      version: "1.0",
      category: category || "platformer",
      scenes: [
        {
          id: "scene_1",
          name: "المشهد الأول",
          width: 1920,
          height: 1080,
          backgroundColor: { r: 30, g: 30, b: 50, a: 1 },
          gravity: 9.8,
          objects: [],
          events: [],
        },
      ],
      story: {
        title: title.trim(),
        synopsis: "",
        characters: [],
        chapters: [],
        winCondition: "",
        loseCondition: "",
      },
      variables: {},
      assets: { sprites: [], sounds: [], backgrounds: [] },
      settings: {
        targetFPS: 60,
        screenWidth: 800,
        screenHeight: 600,
        physics: "arcade",
      },
    };

    const project = await prisma.gameProject.create({
      data: {
        title:       title.trim(),
        description: description?.trim() || "",
        category:    category || "platformer",
        ownerId:     session.user.id,
        engineData:  JSON.stringify(safeEngineData),
        status:      "draft",
      },
    });

    return NextResponse.json({
      ...project,
      engineData: safeEngineData,
    }, { status: 201 });

  } catch (err) {
    console.error("POST /api/editor/projects:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
