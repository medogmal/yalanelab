import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById, updateUser } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// كتالوج المتجر الكامل — YalaWorld Store
// ─────────────────────────────────────────────────────────────────────────────
const STORE_CATALOG = {
  avatars: [
    { id: "avatar_knight",   name: "الفارس",       price: 500,  currency: "coins", emoji: "🏇", tier: "common"   },
    { id: "avatar_wizard",   name: "الساحر",       price: 800,  currency: "coins", emoji: "🧙", tier: "rare"     },
    { id: "avatar_ninja",    name: "النينجا",      price: 1200, currency: "coins", emoji: "🥷", tier: "epic"     },
    { id: "avatar_pharaoh",  name: "الفرعون",      price: 30,   currency: "gems",  emoji: "👑", tier: "legendary"},
    { id: "avatar_explorer", name: "المستكشف",     price: 600,  currency: "coins", emoji: "🗺️", tier: "common"   },
    { id: "avatar_chef",     name: "الطاهي",       price: 400,  currency: "coins", emoji: "👨‍🍳", tier: "common"  },
  ],
  skins: [
    { id: "skin_gold",       name: "جلد ذهبي",    price: 200,  currency: "coins", emoji: "✨", tier: "rare"     },
    { id: "skin_neon",       name: "نيون",         price: 350,  currency: "coins", emoji: "💡", tier: "epic"     },
    { id: "skin_galaxy",     name: "مجرة",         price: 20,   currency: "gems",  emoji: "🌌", tier: "legendary"},
    { id: "skin_desert",     name: "الصحراء",      price: 150,  currency: "coins", emoji: "🏜️", tier: "common"   },
  ],
  worldItems: [
    { id: "item_palm",       name: "نخلة عربية",  price: 50,   currency: "coins", emoji: "🌴", category: "nature"   },
    { id: "item_tent",       name: "خيمة",        price: 80,   currency: "coins", emoji: "⛺", category: "building" },
    { id: "item_fountain",   name: "نافورة",      price: 120,  currency: "coins", emoji: "⛲", category: "building" },
    { id: "item_camel",      name: "جمل",         price: 200,  currency: "coins", emoji: "🐪", category: "animals"  },
    { id: "item_lantern",    name: "فانوس",       price: 60,   currency: "coins", emoji: "🏮", category: "decor"    },
    { id: "item_carpet",     name: "سجادة زرابي", price: 90,   currency: "coins", emoji: "🪆", category: "decor"    },
    { id: "item_mosque",     name: "مسجد صغير",  price: 500,  currency: "coins", emoji: "🕌", category: "building" },
    { id: "item_oasis",      name: "واحة",        price: 350,  currency: "coins", emoji: "🏝️", category: "nature"   },
  ],
  powerups: [
    { id: "xp_boost_1h",     name: "بوست XP ساعة",    price: 10,  currency: "gems", emoji: "⚡", duration: 3600  },
    { id: "build_speed",     name: "بناء x2",          price: 15,  currency: "gems", emoji: "🔨", duration: 7200  },
    { id: "world_spotlight", name: "تمييز عالمك يوم",  price: 50,  currency: "gems", emoji: "🌟", duration: 86400 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// GET — جلب الكتالوج + ما اشتراه اللاعب + رصيده
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "all";

  let catalog: any = STORE_CATALOG;
  if (category !== "all" && category in STORE_CATALOG) {
    catalog = { [category]: (STORE_CATALOG as any)[category] };
  }

  const userInfo = user ? getUserById(user.id) : null;

  return NextResponse.json({
    catalog,
    wallet: userInfo
      ? { coins: userInfo.coins || 0, gems: userInfo.gems || 0 }
      : null,
    owned: userInfo?.ownedItems || [],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — شراء عنصر
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { itemId, category } = body;

  if (!itemId || !category) {
    return NextResponse.json({ error: "itemId و category مطلوبان" }, { status: 400 });
  }

  // إيجاد العنصر في الكتالوج
  const categoryItems = (STORE_CATALOG as any)[category] as any[];
  if (!categoryItems) {
    return NextResponse.json({ error: "category غير موجود" }, { status: 404 });
  }

  const item = categoryItems.find((i: any) => i.id === itemId);
  if (!item) {
    return NextResponse.json({ error: "عنصر غير موجود" }, { status: 404 });
  }

  // جلب بيانات اللاعب
  const userFull = getUserById(user.id);
  if (!userFull) return NextResponse.json({ error: "مستخدم غير موجود" }, { status: 404 });

  // التحقق من الملكية المسبقة
  const owned: string[] = userFull.ownedItems || [];
  if (owned.includes(itemId)) {
    return NextResponse.json({ error: "لديك هذا العنصر بالفعل" }, { status: 409 });
  }

  // التحقق من الرصيد
  const currency = item.currency as "coins" | "gems";
  const balance  = userFull[currency] || 0;

  if (balance < item.price) {
    return NextResponse.json({
      error: `رصيد غير كافٍ — تحتاج ${item.price} ${currency === "coins" ? "كوينز" : "جواهر"} — لديك ${balance}`,
    }, { status: 402 });
  }

  // خصم الرصيد + إضافة العنصر
  const updated = {
    ...userFull,
    [currency]:   balance - item.price,
    ownedItems:   [...owned, itemId],
    updatedAt:    new Date().toISOString(),
  };

  const saved = updateUser(user.id, updated);
  if (!saved) return NextResponse.json({ error: "فشل الحفظ" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    item,
    wallet: {
      coins: updated.coins ?? 0,
      gems:  updated.gems  ?? 0,
    },
    ownedItems: updated.ownedItems,
    message: `✅ اشتريت "${item.name}" بنجاح!`,
  });
}
