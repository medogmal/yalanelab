// ═══════════════════════════════════════════════════════════
//  YALA EDITOR — Assets Metadata (No THREE.js — Safe for SSR)
// ═══════════════════════════════════════════════════════════

export interface Asset3D {
  id: string;
  name: string;
  category: string;
  icon: string;
  scale?: number;
}

export const ASSET_LIBRARY: Asset3D[] = [
  // 🏠 Houses
  { id: "house_simple",   name: "بيت بسيط",     category: "houses",    icon: "🏠", scale: 0.9  },
  { id: "house_modern",   name: "بيت عصري",      category: "houses",    icon: "🏡", scale: 0.85 },
  { id: "villa",          name: "فيلا",           category: "houses",    icon: "🏘️", scale: 0.75 },
  { id: "apartment",      name: "عمارة",          category: "houses",    icon: "🏢", scale: 0.65 },
  // 🏬 Commercial
  { id: "mall",           name: "مول",            category: "commercial", icon: "🏬", scale: 0.55 },
  { id: "shop",           name: "دكان",           category: "commercial", icon: "🏪", scale: 1.0  },
  { id: "gas_station",    name: "محطة بنزين",     category: "commercial", icon: "⛽", scale: 0.8  },
  { id: "office",         name: "مبنى مكاتب",    category: "commercial", icon: "🏦", scale: 0.45 },
  // 🏫 Public
  { id: "school",         name: "مدرسة",          category: "public",    icon: "🏫", scale: 0.7  },
  { id: "hospital",       name: "مستشفى",         category: "public",    icon: "🏥", scale: 0.7  },
  // 🛋️ Furniture
  { id: "sofa",           name: "أريكة",          category: "furniture", icon: "🛋️", scale: 1.1  },
  { id: "bed",            name: "سرير",           category: "furniture", icon: "🛏️", scale: 1.0  },
  { id: "dining_table",   name: "طاولة طعام",    category: "furniture", icon: "🍽️", scale: 1.0  },
  { id: "tv",             name: "تلفزيون",        category: "furniture", icon: "📺", scale: 1.2  },
  { id: "kitchen",        name: "مطبخ",           category: "furniture", icon: "🍳", scale: 1.0  },
  { id: "fridge",         name: "ثلاجة",          category: "furniture", icon: "🧊", scale: 1.1  },
  // 🌳 Outdoor
  { id: "tree_big",       name: "شجرة كبيرة",    category: "outdoor",   icon: "🌳", scale: 1.0  },
  { id: "palm",           name: "نخلة",           category: "outdoor",   icon: "🌴", scale: 1.0  },
  { id: "bench",          name: "مقعد",           category: "outdoor",   icon: "🪑", scale: 1.2  },
  { id: "street_lamp",    name: "عمود إنارة",    category: "outdoor",   icon: "💡", scale: 1.0  },
  { id: "car",            name: "سيارة",          category: "outdoor",   icon: "🚗", scale: 1.0  },
  { id: "fountain",       name: "نافورة",         category: "outdoor",   icon: "⛲", scale: 1.0  },
];

export const ASSET_CATEGORIES = [
  { id: "houses",     label: "بيوت",   icon: "🏠" },
  { id: "commercial", label: "تجاري",  icon: "🏬" },
  { id: "public",     label: "عام",    icon: "🏫" },
  { id: "furniture",  label: "أثاث",   icon: "🛋️" },
  { id: "outdoor",    label: "خارجي",  icon: "🌳" },
];

export function getAssetsByCategory(cat: string) {
  return ASSET_LIBRARY.filter(a => a.category === cat);
}
