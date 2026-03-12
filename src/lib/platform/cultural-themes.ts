/**
 * يالا نلعب — نظام الموودات الثقافية الثلاثة
 * مصر 🇪🇬 · السعودية 🇸🇦 · اليمن 🇾🇪
 */

export type CulturalMood = "egyptian" | "saudi" | "yemeni" | "classic";
export type CountryCode  = "EG" | "SA" | "YE" | "OTHER";

export interface CulturalTheme {
  id: CulturalMood;
  nameAr: string;
  nameEn: string;
  flag: string;
  country: CountryCode;
  colors: {
    primary: string; secondary: string; gold: string;
    felt: string; feltLight: string; text: string;
    border: string; accent: string;
  };
  table: {
    background: string; frameColor: string;
    frameShadow: string; watermarkOpacity: number;
  };
  tiles: { defaultSkin: string; pipColor: string; baseColor: string };
  fonts: { primary: string; secondary: string };
  ui: { greeting: string; winMessage: string; loseMessage: string; turnMessage: string };
}

export const CULTURAL_THEMES: Record<CulturalMood, CulturalTheme> = {

  saudi: {
    id: "saudi", nameAr: "السلطان", nameEn: "Sultan", flag: "🇸🇦", country: "SA",
    colors: { primary:"#07130e", secondary:"#0d2018", gold:"#f5a623", felt:"#0a3d25", feltLight:"#1a6040", text:"#f0f4ff", border:"rgba(180,120,40,0.35)", accent:"#f5a623" },
    table: { background:"/domino/tables/sultan.png", frameColor:"rgba(180,120,40,0.45)", frameShadow:"inset 0 0 0 5px rgba(26,70,40,0.9)", watermarkOpacity:0.18 },
    tiles: { defaultSkin:"default_domino", pipColor:"#1a0d00", baseColor:"#fffef8" },
    fonts: { primary:"Cairo", secondary:"Scheherazade New" },
    ui: { greeting:"أهلاً وسهلاً", winMessage:"انتصار مبين! 🏆", loseMessage:"المرة الجاية إن شاء الله", turnMessage:"دورك" },
  },

  egyptian: {
    id: "egyptian", nameAr: "النيل", nameEn: "Nile", flag: "🇪🇬", country: "EG",
    colors: { primary:"#050e18", secondary:"#0d1e2e", gold:"#c9a227", felt:"#0d3348", feltLight:"#1a5070", text:"#e8f4ff", border:"rgba(100,160,210,0.35)", accent:"#c9a227" },
    table: { background:"/domino/tables/egyptian.png", frameColor:"rgba(100,160,210,0.4)", frameShadow:"inset 0 0 0 5px rgba(5,30,55,0.9)", watermarkOpacity:0.15 },
    tiles: { defaultSkin:"default_domino", pipColor:"#0d1e2e", baseColor:"#fffef5" },
    fonts: { primary:"Cairo", secondary:"Noto Naskh Arabic" },
    ui: { greeting:"أهلاً يا صديقي", winMessage:"برافو عليك يسطا! 🎉", loseMessage:"ماشي، جولة تانية", turnMessage:"دورك يلا" },
  },

  yemeni: {
    id: "yemeni", nameAr: "عدن", nameEn: "Aden", flag: "🇾🇪", country: "YE",
    colors: { primary:"#0e0805", secondary:"#1a1008", gold:"#d4a843", felt:"#1a0e05", feltLight:"#2d1a08", text:"#f5ede0", border:"rgba(180,80,40,0.35)", accent:"#c0392b" },
    table: { background:"/domino/tables/desert.png", frameColor:"rgba(160,80,30,0.5)", frameShadow:"inset 0 0 0 5px rgba(26,14,5,0.9)", watermarkOpacity:0.15 },
    tiles: { defaultSkin:"default_domino", pipColor:"#1a0e05", baseColor:"#fef9f0" },
    fonts: { primary:"Cairo", secondary:"Amiri" },
    ui: { greeting:"مرحبا بك", winMessage:"الله يبارك فيك! 🏆", loseMessage:"القادم أحسن إن شاء الله", turnMessage:"جاء دورك" },
  },

  classic: {
    id: "classic", nameAr: "الكلاسيك", nameEn: "Classic", flag: "🎮", country: "OTHER",
    colors: { primary:"#07090f", secondary:"#0d1120", gold:"#f5a623", felt:"#0a3d25", feltLight:"#1a6040", text:"#f0f4ff", border:"rgba(180,120,40,0.28)", accent:"#f5a623" },
    table: { background:"/domino/tables/classic.png", frameColor:"rgba(180,120,40,0.28)", frameShadow:"inset 0 0 0 4px rgba(26,70,40,0.9)", watermarkOpacity:0.18 },
    tiles: { defaultSkin:"default_domino", pipColor:"#1a0d00", baseColor:"#ffffff" },
    fonts: { primary:"Cairo", secondary:"Cairo" },
    ui: { greeting:"أهلاً", winMessage:"انتصار! 🏆", loseMessage:"المرة القادمة", turnMessage:"دورك!" },
  },
};

export const DEFAULT_MOOD: CulturalMood = "saudi";

export function getMoodByCountry(country: CountryCode): CulturalMood {
  const map: Record<CountryCode, CulturalMood> = { EG:"egyptian", SA:"saudi", YE:"yemeni", OTHER:"classic" };
  return map[country] ?? "classic";
}

export function getTheme(mood: CulturalMood): CulturalTheme {
  return CULTURAL_THEMES[mood] ?? CULTURAL_THEMES.classic;
}
