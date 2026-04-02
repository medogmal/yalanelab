import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DB_PATH = path.join(process.cwd(), "data", "worlds.json");

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

// GET — قائمة العوالم مع فلترة وسورت
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "all";
  const sort      = searchParams.get("sort")     || "popular";
  const q         = searchParams.get("q")        || "";
  const page      = parseInt(searchParams.get("page") || "1", 10);
  const limit     = 24;

  let worlds = loadWorlds().filter((w: any) => w.isPublished);

  if (category !== "all") worlds = worlds.filter((w: any) => w.category === category);
  if (q) worlds = worlds.filter((w: any) => w.name.includes(q) || w.description?.includes(q));

  worlds.sort((a: any, b: any) => {
    if (sort === "new")    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "online") return (b.playersOnline || 0) - (a.playersOnline || 0);
    return (b.playCount || 0) - (a.playCount || 0);
  });

  const total   = worlds.length;
  const start   = (page - 1) * limit;
  const sliced  = worlds.slice(start, start + limit);

  return NextResponse.json({ worlds: sliced, total, page, pages: Math.ceil(total / limit) });
}

// POST — إنشاء عالم جديد
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, description, category = "social" } = body;
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const worlds = loadWorlds();
  const world = {
    id:          `world_${Date.now()}`,
    name,
    description: description || "",
    creatorId:   user.id,
    creatorName: user.name || "مجهول",
    category,
    thumbnailUrl:  null,
    webglUrl:      null,
    isVerified:    false,
    isPublished:   false,
    isFeatured:    false,
    playCount:     0,
    likeCount:     0,
    playersOnline: 0,
    playerCapacity:50,
    configJson:    "{}",
    createdAt:     new Date().toISOString(),
    updatedAt:     new Date().toISOString(),
  };
  worlds.push(world);
  saveWorlds(worlds);

  return NextResponse.json({ ok: true, world });
}
