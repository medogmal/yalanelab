// ═══════════════════════════════════════════════════════════
//  YALA EDITOR — Character Sprites Library
//  شخصيات SVG جاهزة للاستخدام في الـ Editor
// ═══════════════════════════════════════════════════════════

export interface CharacterSprite {
  id: string;
  name: string;
  category: "hero" | "enemy" | "npc" | "boss" | "animal" | "fantasy";
  tags: string[];
  svg: string;
  width: number;
  height: number;
  color: string;
}

export const ALL_CHARACTERS: CharacterSprite[] = [
  {
    id: "hero_warrior", name: "المحارب", category: "hero",
    tags: ["hero", "sword", "armor"], color: "#7c3aed", width: 48, height: 64,
    svg: `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="24" width="20" height="22" rx="3" fill="#7c3aed"/>
      <circle cx="24" cy="14" r="10" fill="#f5c99a"/>
      <path d="M14 14 Q14 4 24 4 Q34 4 34 14 Z" fill="#5b21b6"/>
      <circle cx="20" cy="13" r="2" fill="#1e1b4b"/>
      <circle cx="28" cy="13" r="2" fill="#1e1b4b"/>
      <rect x="16" y="26" width="6" height="8" rx="1" fill="#5b21b6"/>
      <rect x="26" y="26" width="6" height="8" rx="1" fill="#5b21b6"/>
      <rect x="15" y="44" width="8" height="16" rx="2" fill="#5b21b6"/>
      <rect x="25" y="44" width="8" height="16" rx="2" fill="#5b21b6"/>
      <rect x="14" y="56" width="10" height="6" rx="2" fill="#1e1b4b"/>
      <rect x="24" y="56" width="10" height="6" rx="2" fill="#1e1b4b"/>
      <rect x="36" y="8" width="4" height="28" rx="1" fill="#c0c0c0"/>
      <rect x="33" y="17" width="10" height="3" rx="1" fill="#f59e0b"/>
      <rect x="6" y="25" width="8" height="14" rx="3" fill="#7c3aed"/>
      <rect x="34" y="25" width="8" height="14" rx="3" fill="#7c3aed"/>
    </svg>`
  },
  {
    id: "hero_mage", name: "الساحر", category: "hero",
    tags: ["hero", "magic", "staff"], color: "#2563eb", width: 48, height: 64,
    svg: `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 30 L12 62 L22 62 L24 46 L26 62 L36 62 L38 30 Z" fill="#1d4ed8"/>
      <rect x="16" y="22" width="16" height="12" rx="3" fill="#1d4ed8"/>
      <circle cx="24" cy="13" r="10" fill="#f5c99a"/>
      <path d="M12 14 L24 0 L36 14 Z" fill="#1e3a8a"/>
      <rect x="10" y="12" width="28" height="4" rx="2" fill="#1e3a8a"/>
      <circle cx="20" cy="12" r="2" fill="#2563eb"/>
      <circle cx="28" cy="12" r="2" fill="#2563eb"/>
      <rect x="4" y="6" width="3" height="44" rx="1" fill="#92400e"/>
      <circle cx="5.5" cy="5" r="5" fill="#7c3aed" opacity="0.8"/>
      <circle cx="5.5" cy="5" r="3" fill="#c4b5fd"/>
      <circle cx="1" cy="1" r="1.5" fill="#fde68a"/>
      <circle cx="10" cy="2" r="1.5" fill="#fde68a"/>
    </svg>`
  },
  {
    id: "hero_archer", name: "الرامي", category: "hero",
    tags: ["hero", "bow", "arrow"], color: "#16a34a", width: 48, height: 64,
    svg: `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="24" width="18" height="20" rx="3" fill="#15803d"/>
      <circle cx="24" cy="13" r="10" fill="#f5c99a"/>
      <path d="M14 16 Q14 4 24 3 Q34 4 34 16 Q34 20 24 21 Q14 20 14 16 Z" fill="#166534"/>
      <circle cx="20" cy="12" r="2" fill="#14532d"/>
      <circle cx="28" cy="12" r="2" fill="#14532d"/>
      <rect x="33" y="20" width="6" height="18" rx="2" fill="#92400e"/>
      <path d="M4 10 Q2 24 4 38" fill="none" stroke="#92400e" stroke-width="3"/>
      <line x1="4" y1="10" x2="4" y2="38" stroke="#f5c99a" stroke-width="1"/>
      <line x1="4" y1="24" x2="18" y2="24" stroke="#d97706" stroke-width="1.5"/>
      <polygon points="18,22 22,24 18,26" fill="#6b7280"/>
      <rect x="15" y="43" width="8" height="18" rx="2" fill="#166534"/>
      <rect x="25" y="43" width="8" height="18" rx="2" fill="#166534"/>
    </svg>`
  },
  {
    id: "hero_ninja", name: "النينجا", category: "hero",
    tags: ["hero", "ninja", "stealth"], color: "#1c1917", width: 48, height: 64,
    svg: `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="22" width="20" height="22" rx="3" fill="#1c1917"/>
      <circle cx="24" cy="13" r="10" fill="#1c1917"/>
      <rect x="17" y="9" width="14" height="10" rx="2" fill="#292524"/>
      <ellipse cx="20" cy="12" rx="2.5" ry="2" fill="#ef4444"/>
      <ellipse cx="28" cy="12" rx="2.5" ry="2" fill="#ef4444"/>
      <rect x="14" y="37" width="20" height="4" rx="1" fill="#ef4444"/>
      <rect x="22" y="37" width="4" height="4" fill="#dc2626"/>
      <rect x="14" y="43" width="8" height="18" rx="2" fill="#1c1917"/>
      <rect x="26" y="43" width="8" height="18" rx="2" fill="#1c1917"/>
      <rect x="6" y="23" width="8" height="12" rx="3" fill="#1c1917"/>
      <rect x="34" y="23" width="8" height="12" rx="3" fill="#1c1917"/>
      <rect x="36" y="10" width="3" height="30" rx="1" fill="#c0c0c0"/>
      <rect x="33" y="24" width="9" height="3" rx="1" fill="#f59e0b"/>
    </svg>`
  },
  {
    id: "enemy_slime", name: "السلايم", category: "enemy",
    tags: ["enemy", "slime", "easy"], color: "#16a34a", width: 48, height: 40,
    svg: `<svg viewBox="0 0 48 40" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="26" rx="20" ry="14" fill="#4ade80"/>
      <circle cx="24" cy="16" r="10" fill="#4ade80"/>
      <circle cx="16" cy="20" r="7" fill="#4ade80"/>
      <circle cx="32" cy="20" r="7" fill="#4ade80"/>
      <circle cx="18" cy="22" r="5" fill="white"/>
      <circle cx="30" cy="22" r="5" fill="white"/>
      <circle cx="19" cy="23" r="3" fill="#166534"/>
      <circle cx="31" cy="23" r="3" fill="#166534"/>
      <circle cx="20" cy="22" r="1.5" fill="black"/>
      <circle cx="32" cy="22" r="1.5" fill="black"/>
      <ellipse cx="24" cy="12" rx="6" ry="3" fill="#86efac" opacity="0.6"/>
    </svg>`
  },
  {
    id: "enemy_skeleton", name: "الهيكل", category: "enemy",
    tags: ["enemy", "skeleton", "undead"], color: "#e5e7eb", width: 48, height: 64,
    svg: `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="12" r="10" fill="#f3f4f6"/>
      <ellipse cx="19" cy="11" rx="3.5" ry="4" fill="#1f2937"/>
      <ellipse cx="29" cy="11" rx="3.5" ry="4" fill="#1f2937"/>
      <path d="M22 17 L24 20 L26 17" fill="#1f2937"/>
      <rect x="18" y="20" width="3" height="4" rx="1" fill="white"/>
      <rect x="22" y="20" width="3" height="4" rx="1" fill="white"/>
      <rect x="26" y="20" width="3" height="4" rx="1" fill="white"/>
      <rect x="22" y="24" width="4" height="20" rx="1" fill="#e5e7eb"/>
      <path d="M22 27 Q12 30 13 36 Q14 42 22 42" fill="none" stroke="#d1d5db" stroke-width="2"/>
      <path d="M26 27 Q36 30 35 36 Q34 42 26 42" fill="none" stroke="#d1d5db" stroke-width="2"/>
      <rect x="16" y="44" width="5" height="20" rx="2" fill="#e5e7eb"/>
      <rect x="27" y="44" width="5" height="20" rx="2" fill="#e5e7eb"/>
    </svg>`
  },
  {
    id: "boss_dragon", name: "التنين", category: "boss",
    tags: ["boss", "dragon", "fire"], color: "#dc2626", width: 80, height: 80,
    svg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="52" rx="24" ry="18" fill="#dc2626"/>
      <rect x="32" y="28" width="16" height="20" rx="6" fill="#dc2626"/>
      <ellipse cx="40" cy="24" rx="16" ry="12" fill="#b91c1c"/>
      <ellipse cx="40" cy="30" rx="8" ry="6" fill="#ef4444"/>
      <circle cx="32" cy="20" r="5" fill="#fef08a"/>
      <circle cx="48" cy="20" r="5" fill="#fef08a"/>
      <circle cx="32" cy="21" r="3" fill="#1c1917"/>
      <circle cx="48" cy="21" r="3" fill="#1c1917"/>
      <path d="M30 14 L26 2 L34 10 Z" fill="#7f1d1d"/>
      <path d="M50 14 L54 2 L46 10 Z" fill="#7f1d1d"/>
      <path d="M18 40 Q2 20 10 10 Q18 24 22 38 Z" fill="#991b1b"/>
      <path d="M62 40 Q78 20 70 10 Q62 24 58 38 Z" fill="#991b1b"/>
      <path d="M64 58 Q76 62 74 72 Q66 68 60 64 Z" fill="#dc2626"/>
      <rect x="22" y="62" width="10" height="14" rx="3" fill="#b91c1c"/>
      <rect x="48" y="62" width="10" height="14" rx="3" fill="#b91c1c"/>
      <path d="M48 30 Q58 26 66 20 Q62 32 58 36 Q52 34 48 30 Z" fill="#f97316" opacity="0.9"/>
    </svg>`
  },
  {
    id: "npc_merchant", name: "التاجر", category: "npc",
    tags: ["npc", "shop", "merchant"], color: "#d97706", width: 48, height: 64,
    svg: `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 32 L12 62 L22 62 L24 48 L26 62 L36 62 L38 32 Z" fill="#d97706"/>
      <rect x="15" y="22" width="18" height="14" rx="3" fill="#d97706"/>
      <circle cx="24" cy="12" r="10" fill="#f5c99a"/>
      <ellipse cx="24" cy="4" rx="10" ry="5" fill="#92400e"/>
      <ellipse cx="24" cy="6" rx="14" ry="4" fill="#78350f"/>
      <circle cx="20" cy="11" r="2" fill="#451a03"/>
      <circle cx="28" cy="11" r="2" fill="#451a03"/>
      <path d="M19 16 Q24 20 29 16" fill="none" stroke="#451a03" stroke-width="1.5"/>
      <path d="M17 17 Q24 24 31 17 Q28 22 24 23 Q20 22 17 17 Z" fill="#d6d3d1"/>
      <circle cx="10" cy="46" r="8" fill="#f59e0b"/>
      <circle cx="10" cy="46" r="5" fill="#fbbf24"/>
    </svg>`
  },
  {
    id: "npc_princess", name: "الأميرة", category: "npc",
    tags: ["npc", "princess", "quest"], color: "#ec4899", width: 48, height: 64,
    svg: `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 36 L16 64 L32 64 L40 36 Q34 44 24 44 Q14 44 8 36 Z" fill="#f9a8d4"/>
      <rect x="15" y="22" width="18" height="16" rx="4" fill="#ec4899"/>
      <circle cx="24" cy="12" r="10" fill="#fde8d8"/>
      <path d="M14 8 L14 4 L19 7 L24 3 L29 7 L34 4 L34 8 Z" fill="#f59e0b"/>
      <circle cx="19" cy="6" r="2" fill="#ef4444"/>
      <circle cx="24" cy="4" r="2" fill="#2563eb"/>
      <circle cx="29" cy="6" r="2" fill="#16a34a"/>
      <path d="M14 14 Q10 22 12 28" fill="none" stroke="#fbbf24" stroke-width="4"/>
      <path d="M34 14 Q38 22 36 28" fill="none" stroke="#fbbf24" stroke-width="4"/>
      <ellipse cx="20" cy="12" rx="2.5" ry="3" fill="#9333ea"/>
      <ellipse cx="28" cy="12" rx="2.5" ry="3" fill="#9333ea"/>
      <path d="M20 17 Q24 21 28 17" fill="none" stroke="#be185d" stroke-width="1.5"/>
    </svg>`
  },
  {
    id: "fantasy_fairy", name: "الجنية", category: "fantasy",
    tags: ["fantasy", "fairy", "magic"], color: "#a855f7", width: 48, height: 56,
    svg: `<svg viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="28" rx="12" ry="7" fill="#c4b5fd" opacity="0.7" transform="rotate(-20,12,28)"/>
      <ellipse cx="36" cy="28" rx="12" ry="7" fill="#c4b5fd" opacity="0.7" transform="rotate(20,36,28)"/>
      <ellipse cx="24" cy="36" rx="8" ry="10" fill="#a855f7"/>
      <circle cx="24" cy="16" r="10" fill="#fde8d8"/>
      <path d="M14 14 Q16 4 24 3 Q32 4 34 14" fill="#fbbf24"/>
      <ellipse cx="19" cy="15" rx="3" ry="3.5" fill="#7c3aed"/>
      <ellipse cx="29" cy="15" rx="3" ry="3.5" fill="#7c3aed"/>
      <circle cx="19.5" cy="14" r="1.5" fill="white"/>
      <circle cx="29.5" cy="14" r="1.5" fill="white"/>
      <path d="M19 21 Q24 25 29 21" fill="none" stroke="#be185d" stroke-width="1.5"/>
      <rect x="34" y="22" width="2" height="18" rx="1" fill="#fbbf24"/>
      <circle cx="35" cy="21" r="4" fill="#f0abfc"/>
      <circle cx="6" cy="18" r="2" fill="#fde68a"/>
      <circle cx="42" cy="16" r="2" fill="#fde68a"/>
    </svg>`
  },
  {
    id: "animal_fox", name: "الثعلب", category: "animal",
    tags: ["animal", "fox"], color: "#ea580c", width: 48, height: 56,
    svg: `<svg viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 44 Q50 40 52 52 Q42 56 34 50 Z" fill="#ea580c"/>
      <path d="M36 47 Q48 44 50 52 Q44 54 38 50 Z" fill="white"/>
      <ellipse cx="22" cy="38" rx="14" ry="12" fill="#ea580c"/>
      <circle cx="22" cy="20" r="12" fill="#ea580c"/>
      <polygon points="10,12 6,0 18,10" fill="#ea580c"/>
      <polygon points="12,12 8,2 18,11" fill="#fda4af"/>
      <polygon points="34,12 38,0 26,10" fill="#ea580c"/>
      <polygon points="32,12 36,2 26,11" fill="#fda4af"/>
      <ellipse cx="22" cy="24" rx="8" ry="7" fill="white"/>
      <ellipse cx="22" cy="25" rx="3" ry="2" fill="#1c1917"/>
      <circle cx="16" cy="18" r="3.5" fill="#1c1917"/>
      <circle cx="28" cy="18" r="3.5" fill="#1c1917"/>
      <circle cx="17" cy="17" r="1.5" fill="white"/>
      <circle cx="29" cy="17" r="1.5" fill="white"/>
      <rect x="12" y="46" width="6" height="10" rx="3" fill="#ea580c"/>
      <rect x="22" y="46" width="6" height="10" rx="3" fill="#ea580c"/>
    </svg>`
  },
];

export const CHARACTER_CATEGORIES = [
  { id: "hero",    label: "أبطال",   icon: "⚔️" },
  { id: "enemy",   label: "أعداء",   icon: "👾" },
  { id: "boss",    label: "بوسات",   icon: "🐉" },
  { id: "npc",     label: "شخصيات",  icon: "🧑" },
  { id: "fantasy", label: "خيالي",   icon: "✨" },
  { id: "animal",  label: "حيوانات", icon: "🦊" },
] as const;

export function getCharactersByCategory(cat: string) {
  return ALL_CHARACTERS.filter(c => c.category === cat);
}
