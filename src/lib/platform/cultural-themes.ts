/**
 * يالا نلعب — نظام الموودات الثقافية
 * مصر 🇪🇬 · السعودية 🇸🇦 · اليمن 🇾🇪 · الإمارات 🇦🇪 · الكويت 🇰🇼 · كلاسيك 🎮
 */

export type CulturalMood = "egyptian" | "saudi" | "yemeni" | "emirati" | "kuwaiti" | "classic";
export type CountryCode  = "EG" | "SA" | "YE" | "AE" | "KW" | "OTHER";

export interface CulturalTheme {
  id: CulturalMood;
  nameAr: string;
  nameEn: string;
  flag: string;
  country: CountryCode;

  /** ألوان الـ UI الكاملة */
  colors: {
    primary: string;
    secondary: string;
    gold: string;
    felt: string;
    feltLight: string;
    text: string;
    border: string;
    accent: string;
    accentSoft: string;
    glow: string;
  };

  /** صورة الطاولة وإطارها */
  table: {
    background: string;
    frameColor: string;
    frameShadow: string;
    watermarkOpacity: number;
  };

  /** تايلز الدومينو */
  tiles: { defaultSkin: string; pipColor: string; baseColor: string };

  /** خطوط */
  fonts: { primary: string; secondary: string };

  /** نصوص اللعبة */
  ui: { greeting: string; winMessage: string; loseMessage: string; turnMessage: string };

  /** هوية بصرية مميزة — نمط وخامة خلفية */
  visual: {
    /** نمط SVG أو CSS pattern للخلفية */
    pattern: string;
    /** لون الأنماط الزخرفية */
    patternColor: string;
    patternOpacity: number;
    /** gradient الرئيسي للـ hero */
    heroGradient: string;
    /** لون الـ glow خلف البطاقات */
    cardGlow: string;
    /** لون حدود البطاقة */
    cardBorder: string;
    /** اسم الزخرفة (مثلاً "نقوش إسلامية" أو "ورق بردى") */
    ornamentName: string;
    /** emoji أو رمز ثقافي */
    culturalEmoji: string;
    /** gradient للـ badge الدولة */
    badgeGradient: string;
  };
}

/* ══════════════════════════════════════════════════════════════ */

// Shared Islamic geometric SVG pattern — يتغير لونه حسب الدولة
const islamicPattern = (color: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Cpath d='M28 0l7 7-7 7-7-7zM0 28l7-7 7 7-7 7zM56 28l-7-7-7 7 7 7zM28 56l-7-7 7-7 7 7z' fill='${encodeURIComponent(color)}' fill-opacity='1'/%3E%3Cpath d='M14 14l7 7-7 7-7-7zM42 14l7 7-7 7-7-7zM14 42l7 7-7 7-7-7zM42 42l7 7-7 7-7-7z' fill='${encodeURIComponent(color)}' fill-opacity='0.5'/%3E%3C/svg%3E")`;

const moroccanPattern = (color: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpolygon points='20,2 38,11 38,29 20,38 2,29 2,11' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1'/%3E%3Cpolygon points='20,8 32,14 32,26 20,32 8,26 8,14' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='0.5'/%3E%3C/svg%3E")`;

const pharaonicPattern = (color: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect x='0' y='0' width='48' height='2' fill='${encodeURIComponent(color)}'/%3E%3Crect x='0' y='12' width='48' height='1' fill='${encodeURIComponent(color)}'/%3E%3Crect x='0' y='24' width='48' height='2' fill='${encodeURIComponent(color)}'/%3E%3Crect x='0' y='36' width='48' height='1' fill='${encodeURIComponent(color)}'/%3E%3Ccircle cx='8' cy='8' r='2' fill='${encodeURIComponent(color)}'/%3E%3Ccircle cx='24' cy='8' r='2' fill='${encodeURIComponent(color)}'/%3E%3Ccircle cx='40' cy='8' r='2' fill='${encodeURIComponent(color)}'/%3E%3Ccircle cx='16' cy='18' r='1.5' fill='${encodeURIComponent(color)}'/%3E%3Ccircle cx='32' cy='18' r='1.5' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E")`;

const tribalPattern = (color: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cpath d='M0 16 L8 0 L16 16 L8 32Z' fill='${encodeURIComponent(color)}' fill-opacity='0.6'/%3E%3Cpath d='M16 16 L24 0 L32 16 L24 32Z' fill='${encodeURIComponent(color)}' fill-opacity='0.3'/%3E%3C/svg%3E")`;

const wavePattern = (color: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='20'%3E%3Cpath d='M0 10 Q15 0 30 10 Q45 20 60 10' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1.5'/%3E%3C/svg%3E")`;

/* ══════════════════════════════════════════════════════════════ */

export const CULTURAL_THEMES: Record<CulturalMood, CulturalTheme> = {

  /* ── السعودية ──────────────────────────────────────────────── */
  saudi: {
    id: "saudi", nameAr: "السلطان", nameEn: "Sultan", flag: "🇸🇦", country: "SA",
    colors: {
      primary:     "#04110b",
      secondary:   "#081d12",
      gold:        "#d4a843",
      felt:        "#0a3d25",
      feltLight:   "#1a6040",
      text:        "#f0f4e8",
      border:      "rgba(212,168,67,0.3)",
      accent:      "#d4a843",
      accentSoft:  "rgba(212,168,67,0.12)",
      glow:        "rgba(212,168,67,0.25)",
    },
    table: {
      background:       "/domino/tables/sultan.png",
      frameColor:       "rgba(180,120,40,0.5)",
      frameShadow:      "inset 0 0 0 5px rgba(26,70,40,0.9)",
      watermarkOpacity: 0.18,
    },
    tiles: { defaultSkin: "default_domino", pipColor: "#1a0d00", baseColor: "#fffef8" },
    fonts: { primary: "Cairo", secondary: "Scheherazade New" },
    ui: {
      greeting:    "أهلاً وسهلاً",
      winMessage:  "انتصار مبين! 🏆",
      loseMessage: "المرة الجاية إن شاء الله",
      turnMessage: "دورك",
    },
    visual: {
      pattern:        islamicPattern("#1a5c38"),
      patternColor:   "#1a5c38",
      patternOpacity: 0.45,
      heroGradient:   "linear-gradient(135deg, #04110b 0%, #081d12 40%, #0a2e1a 70%, #04110b 100%)",
      cardGlow:       "rgba(212,168,67,0.35)",
      cardBorder:     "rgba(212,168,67,0.4)",
      ornamentName:   "نقوش إسلامية",
      culturalEmoji:  "🕌",
      badgeGradient:  "linear-gradient(135deg, #006233 0%, #004d28 100%)",
    },
  },

  /* ── مصر ───────────────────────────────────────────────────── */
  egyptian: {
    id: "egyptian", nameAr: "النيل", nameEn: "Nile", flag: "🇪🇬", country: "EG",
    colors: {
      primary:     "#050c18",
      secondary:   "#0a1828",
      gold:        "#c9a227",
      felt:        "#0d3348",
      feltLight:   "#1a5070",
      text:        "#e8f4ff",
      border:      "rgba(201,162,39,0.3)",
      accent:      "#c9a227",
      accentSoft:  "rgba(201,162,39,0.1)",
      glow:        "rgba(201,162,39,0.2)",
    },
    table: {
      background:       "/domino/tables/egyptian.png",
      frameColor:       "rgba(100,160,210,0.4)",
      frameShadow:      "inset 0 0 0 5px rgba(5,30,55,0.9)",
      watermarkOpacity: 0.15,
    },
    tiles: { defaultSkin: "default_domino", pipColor: "#0d1e2e", baseColor: "#fffef5" },
    fonts: { primary: "Cairo", secondary: "Noto Naskh Arabic" },
    ui: {
      greeting:    "أهلاً يا صديقي",
      winMessage:  "برافو عليك يسطا! 🎉",
      loseMessage: "ماشي، جولة تانية",
      turnMessage: "دورك يلا",
    },
    visual: {
      pattern:        pharaonicPattern("#1a3a5c"),
      patternColor:   "#1a3a5c",
      patternOpacity: 0.5,
      heroGradient:   "linear-gradient(135deg, #050c18 0%, #0a1828 40%, #0d2240 70%, #050c18 100%)",
      cardGlow:       "rgba(201,162,39,0.3)",
      cardBorder:     "rgba(100,160,210,0.35)",
      ornamentName:   "زخارف فرعونية",
      culturalEmoji:  "🏛️",
      badgeGradient:  "linear-gradient(135deg, #ce1126 0%, #960c1c 50%, #c09300 100%)",
    },
  },

  /* ── اليمن ─────────────────────────────────────────────────── */
  yemeni: {
    id: "yemeni", nameAr: "عدن", nameEn: "Aden", flag: "🇾🇪", country: "YE",
    colors: {
      primary:     "#0e0805",
      secondary:   "#1a1008",
      gold:        "#d4a843",
      felt:        "#1a0e05",
      feltLight:   "#2d1a08",
      text:        "#f5ede0",
      border:      "rgba(180,80,40,0.35)",
      accent:      "#c0392b",
      accentSoft:  "rgba(192,57,43,0.12)",
      glow:        "rgba(212,168,67,0.25)",
    },
    table: {
      background:       "/domino/tables/desert.png",
      frameColor:       "rgba(160,80,30,0.5)",
      frameShadow:      "inset 0 0 0 5px rgba(26,14,5,0.9)",
      watermarkOpacity: 0.15,
    },
    tiles: { defaultSkin: "default_domino", pipColor: "#1a0e05", baseColor: "#fef9f0" },
    fonts: { primary: "Cairo", secondary: "Amiri" },
    ui: {
      greeting:    "مرحبا بك",
      winMessage:  "الله يبارك فيك! 🏆",
      loseMessage: "القادم أحسن إن شاء الله",
      turnMessage: "جاء دورك",
    },
    visual: {
      pattern:        tribalPattern("#4a1a05"),
      patternColor:   "#4a1a05",
      patternOpacity: 0.5,
      heroGradient:   "linear-gradient(135deg, #0e0805 0%, #1a1008 40%, #241408 70%, #0e0805 100%)",
      cardGlow:       "rgba(212,100,30,0.35)",
      cardBorder:     "rgba(180,80,40,0.4)",
      ornamentName:   "زخارف قبلية",
      culturalEmoji:  "🏔️",
      badgeGradient:  "linear-gradient(135deg, #ce1126 0%, #007a3d 50%, #000000 100%)",
    },
  },

  /* ── الإمارات ──────────────────────────────────────────────── */
  emirati: {
    id: "emirati", nameAr: "برج الذهب", nameEn: "Gold Tower", flag: "🇦🇪", country: "AE",
    colors: {
      primary:     "#08080f",
      secondary:   "#10101c",
      gold:        "#ffd700",
      felt:        "#0d0d1a",
      feltLight:   "#1a1a30",
      text:        "#f0f0ff",
      border:      "rgba(255,215,0,0.35)",
      accent:      "#ffd700",
      accentSoft:  "rgba(255,215,0,0.1)",
      glow:        "rgba(255,215,0,0.3)",
    },
    table: {
      background:       "/domino/tables/sultan.png",
      frameColor:       "rgba(255,215,0,0.4)",
      frameShadow:      "inset 0 0 0 5px rgba(8,8,15,0.95)",
      watermarkOpacity: 0.12,
    },
    tiles: { defaultSkin: "default_domino", pipColor: "#08080f", baseColor: "#ffffff" },
    fonts: { primary: "Cairo", secondary: "Cairo" },
    ui: {
      greeting:    "أهلاً وسهلاً",
      winMessage:  "رائع جداً! 🏆",
      loseMessage: "الكرة تدور",
      turnMessage: "دورك",
    },
    visual: {
      pattern:        moroccanPattern("#ffd70022"),
      patternColor:   "#ffd700",
      patternOpacity: 0.15,
      heroGradient:   "linear-gradient(135deg, #08080f 0%, #10101c 40%, #141420 70%, #08080f 100%)",
      cardGlow:       "rgba(255,215,0,0.4)",
      cardBorder:     "rgba(255,215,0,0.45)",
      ornamentName:   "ذهب خالص",
      culturalEmoji:  "🌆",
      badgeGradient:  "linear-gradient(135deg, #009e60 0%, #ffffff 50%, #ff0000 100%)",
    },
  },

  /* ── الكويت ────────────────────────────────────────────────── */
  kuwaiti: {
    id: "kuwaiti", nameAr: "الخليج", nameEn: "Gulf", flag: "🇰🇼", country: "KW",
    colors: {
      primary:     "#050e0a",
      secondary:   "#0a1a12",
      gold:        "#e8b84b",
      felt:        "#0a2418",
      feltLight:   "#163d28",
      text:        "#f0f5ef",
      border:      "rgba(232,184,75,0.3)",
      accent:      "#e8b84b",
      accentSoft:  "rgba(232,184,75,0.1)",
      glow:        "rgba(232,184,75,0.2)",
    },
    table: {
      background:       "/domino/tables/sultan.png",
      frameColor:       "rgba(232,184,75,0.4)",
      frameShadow:      "inset 0 0 0 5px rgba(5,14,10,0.95)",
      watermarkOpacity: 0.15,
    },
    tiles: { defaultSkin: "default_domino", pipColor: "#050e0a", baseColor: "#fefef8" },
    fonts: { primary: "Cairo", secondary: "Scheherazade New" },
    ui: {
      greeting:    "أهلاً بيك",
      winMessage:  "ما شاء الله! 🏆",
      loseMessage: "المرة الجاية تكسب",
      turnMessage: "الدور عليك",
    },
    visual: {
      pattern:        wavePattern("#1a4028"),
      patternColor:   "#1a4028",
      patternOpacity: 0.6,
      heroGradient:   "linear-gradient(135deg, #050e0a 0%, #0a1a12 40%, #0d2018 70%, #050e0a 100%)",
      cardGlow:       "rgba(232,184,75,0.3)",
      cardBorder:     "rgba(232,184,75,0.35)",
      ornamentName:   "أمواج الخليج",
      culturalEmoji:  "⛵",
      badgeGradient:  "linear-gradient(135deg, #007a3d 0%, #ffffff 33%, #ce1126 66%, #000000 100%)",
    },
  },

  /* ── كلاسيك ────────────────────────────────────────────────── */
  classic: {
    id: "classic", nameAr: "الكلاسيك", nameEn: "Classic", flag: "🎮", country: "OTHER",
    colors: {
      primary:     "#07090f",
      secondary:   "#0d1120",
      gold:        "#f5a623",
      felt:        "#0a3d25",
      feltLight:   "#1a6040",
      text:        "#f0f4ff",
      border:      "rgba(180,120,40,0.28)",
      accent:      "#f5a623",
      accentSoft:  "rgba(245,166,35,0.1)",
      glow:        "rgba(245,166,35,0.2)",
    },
    table: {
      background:       "/domino/tables/classic.png",
      frameColor:       "rgba(180,120,40,0.28)",
      frameShadow:      "inset 0 0 0 4px rgba(26,70,40,0.9)",
      watermarkOpacity: 0.18,
    },
    tiles: { defaultSkin: "default_domino", pipColor: "#1a0d00", baseColor: "#ffffff" },
    fonts: { primary: "Cairo", secondary: "Cairo" },
    ui: {
      greeting:    "أهلاً",
      winMessage:  "انتصار! 🏆",
      loseMessage: "المرة القادمة",
      turnMessage: "دورك!",
    },
    visual: {
      pattern:        islamicPattern("#1a2a40"),
      patternColor:   "#1a2a40",
      patternOpacity: 0.3,
      heroGradient:   "linear-gradient(135deg, #07090f 0%, #0d1120 40%, #101525 70%, #07090f 100%)",
      cardGlow:       "rgba(245,166,35,0.3)",
      cardBorder:     "rgba(245,166,35,0.35)",
      ornamentName:   "كلاسيك",
      culturalEmoji:  "🎮",
      badgeGradient:  "linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%)",
    },
  },
};

export const DEFAULT_MOOD: CulturalMood = "saudi";

export function getMoodByCountry(country: CountryCode): CulturalMood {
  const map: Record<CountryCode, CulturalMood> = {
    EG: "egyptian", SA: "saudi", YE: "yemeni",
    AE: "emirati", KW: "kuwaiti", OTHER: "classic",
  };
  return map[country] ?? "classic";
}

export function getTheme(mood: CulturalMood): CulturalTheme {
  return CULTURAL_THEMES[mood] ?? CULTURAL_THEMES.classic;
}

export const ALL_MOODS = Object.values(CULTURAL_THEMES);
