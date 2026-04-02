import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit, getIp } from "@/lib/rateLimit";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DB_PATH = path.join(process.cwd(), "data", "worlds.json");

/* ── helpers ──────────────────────────────── */
function loadWorlds(): any[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch { return []; }
}

function saveWorlds(worlds: any[]) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(worlds, null, 2));
}

function getWorld(id: string) {
  return loadWorlds().find((w: any) => w.id === id) ?? null;
}

/* ════════════════════════════════════════════
   GET /api/worlds/[id]
   جلب بيانات عالم واحد (configJson + metadata)
════════════════════════════════════════════ */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const world = getWorld(id);
  if (!world) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // زيادة عداد المشاهدات
  const worlds = loadWorlds();
  const idx = worlds.findIndex((w: any) => w.id === id);
  if (idx >= 0) {
    worlds[idx].viewCount = (worlds[idx].viewCount || 0) + 1;
    saveWorlds(worlds);
  }

  return NextResponse.json({ world });
}

/* ════════════════════════════════════════════
   PATCH /api/worlds/[id]
   تحديث / حفظ بيانات العالم (Save)
   يقبل: name, description, configJson, thumbnailUrl, category
════════════════════════════════════════════ */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!rateLimit(getIp(req), { max: 60, windowMs: 60_000 }))
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const worlds = loadWorlds();
  const idx = worlds.findIndex((w: any) => w.id === id);

  if (idx === -1) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // تحقق من الملكية أو الـ admin
  if (worlds[idx].creatorId !== user.id && (user as any).role !== "admin")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const allowed = ["name", "description", "configJson", "thumbnailUrl", "category", "playerCapacity"];

  for (const key of allowed) {
    if (body[key] !== undefined) worlds[idx][key] = body[key];
  }
  worlds[idx].updatedAt = new Date().toISOString();
  saveWorlds(worlds);

  return NextResponse.json({ ok: true, world: worlds[idx] });
}

/* ════════════════════════════════════════════
   POST /api/worlds/[id]
   actions: publish | unpublish | like | enter | leave | approve | reject
════════════════════════════════════════════ */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!rateLimit(getIp(req), { max: 30, windowMs: 60_000 }))
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  const user = await getCurrentUser();
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const { action } = body;

  const worlds = loadWorlds();
  const idx = worlds.findIndex((w: any) => w.id === id);
  if (idx === -1) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const world = worlds[idx];

  switch (action) {
    /* ── نشر العالم ── */
    case "publish":
      if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      if (world.creatorId !== user.id)
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      world.isPublished = true;
      world.publishedAt = new Date().toISOString();
      world.status      = "pending_review"; // ينتظر الموافقة
      world.updatedAt   = new Date().toISOString();
      break;

    /* ── إلغاء النشر ── */
    case "unpublish":
      if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      if (world.creatorId !== user.id && (user as any).role !== "admin")
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      world.isPublished = false;
      world.status      = "draft";
      world.updatedAt   = new Date().toISOString();
      break;

    /* ── إعجاب ── */
    case "like":
      if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      world.likeCount = (world.likeCount || 0) + 1;
      // TODO: تحقق من عدم التكرار
      break;

    /* ── دخول العالم (زيادة اللاعبين) ── */
    case "enter":
      world.playersOnline = (world.playersOnline || 0) + 1;
      world.playCount     = (world.playCount || 0) + 1;
      break;

    /* ── مغادرة العالم ── */
    case "leave":
      world.playersOnline = Math.max(0, (world.playersOnline || 0) - 1);
      break;

    /* ── موافقة الـ Admin ── */
    case "approve":
      if (!user || (user as any).role !== "admin")
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      world.isVerified  = true;
      world.status      = "approved";
      world.reviewedAt  = new Date().toISOString();
      world.reviewedBy  = user.id;
      world.updatedAt   = new Date().toISOString();
      break;

    /* ── رفض الـ Admin ── */
    case "reject":
      if (!user || (user as any).role !== "admin")
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      world.isVerified  = false;
      world.isPublished = false;
      world.status      = "rejected";
      world.rejectReason = body.reason || "لا يتوافق مع سياسات المنصة";
      world.reviewedAt  = new Date().toISOString();
      world.reviewedBy  = user.id;
      world.updatedAt   = new Date().toISOString();
      break;

    default:
      return NextResponse.json({ error: `action '${action}' غير معروف` }, { status: 400 });
  }

  worlds[idx] = world;
  saveWorlds(worlds);

  return NextResponse.json({ ok: true, world });
}

/* ════════════════════════════════════════════
   DELETE /api/worlds/[id]
   حذف العالم (المالك أو Admin فقط)
════════════════════════════════════════════ */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const worlds = loadWorlds();
  const idx = worlds.findIndex((w: any) => w.id === id);
  if (idx === -1) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (worlds[idx].creatorId !== user.id && (user as any).role !== "admin")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  worlds.splice(idx, 1);
  saveWorlds(worlds);

  return NextResponse.json({ ok: true, deleted: id });
}
