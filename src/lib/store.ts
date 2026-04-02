type Tournament = {
  id: string;
  name: string;
  startAt: string;
  capacity: number;
};

type Registration = {
  id: string;
  tournamentId: string;
  name: string;
  email: string;
};

type ChatMessage = {
  id: string;
  room: string;
  user: string;
  text: string;
  at: number;
};

type StreamConfig = {
  url: string | null;
  prerollSeconds: number;
  adUrl: string | null;
};

type AdSlot = {
  id: string;
  title: string;
  content: string;
};

type Skin = {
  id: string;
  type: "avatar" | "ludo_skin" | "chess_skin" | "domino_skin" | "baloot_skin" | "baloot_frame" | "character" | "chat_bubble" | "card_skin" | "game_skin";
  name: string;
  asset: string;      // path, emoji, or color key
  emoji?: string;     // visual preview emoji/symbol
  price?: number;
  currency?: "coins" | "gems";
  vip_required?: boolean;
  tag?: string;       // e.g. "فرعوني" "نيون" etc.
  glowColor?: string; // optional glow CSS color
};

type PageContent = {
  id: string;
  slug: string;
  title: string;
  content: string; // HTML or Markdown
  published: boolean;
};

type GameConfig = {
  ludo: { turnTime: number; maxPlayers: number };
  chess: { turnTime: number; modes: string[] };
  domino: { turnTime: number; scoreLimit: number };
  baloot: { turnTime: number; showHelpers: boolean };
};

const db = {
  tournaments: [] as Tournament[],
  chat: [] as ChatMessage[],
  stream: { url: null, prerollSeconds: 5, adUrl: null } as StreamConfig,
  ads: [] as AdSlot[],
  registrations: [] as Registration[],
  announcement: "إعلانات المنصة تظهر هنا.",
  skins: [
    // Avatars
    { id: "avatar_king", type: "avatar", name: "Lion King", asset: "🦁", price: 500 },
    { id: "avatar_robot", type: "avatar", name: "Mecha Bot", asset: "🤖", price: 500 },
    { id: "avatar_queen", type: "avatar", name: "Desert Queen", asset: "👸", price: 500 },
    { id: "avatar_falcon", type: "avatar", name: "Golden Falcon", asset: "🦅", price: 500 },
    // Ludo Skins
    { id: "skin_default", type: "ludo_skin", name: "Classic", asset: "classic", price: 0 },
    { id: "skin_neon", type: "ludo_skin", name: "Neon Lights", asset: "neon", price: 1000 },
    { id: "skin_cyber", type: "ludo_skin", name: "Cyberpunk", asset: "cyber", price: 1500, vip_required: true },
    { id: "skin_royal", type: "ludo_skin", name: "Royal Gold", asset: "royal", price: 2000, vip_required: true },
    // Chess Skins
    { id: "skin_wood", type: "chess_skin", name: "Classic Wood", asset: "wood", price: 0 },
    { id: "skin_glass", type: "chess_skin", name: "Modern Glass", asset: "glass", price: 1000 },
    { id: "skin_8bit", type: "chess_skin", name: "Pixel Art", asset: "8bit", price: 1500 },
    // Baloot Skins
    { id: "skin_classic", type: "baloot_skin", name: "Traditional", asset: "classic", price: 0 },
    { id: "skin_luxury", type: "baloot_skin", name: "Luxury Gold", asset: "luxury", price: 2000, vip_required: true },
    // Domino Skins
    { id: "default_domino",  type: "domino_skin", name: "غريفين كلاسيك",  asset: "/skins/domino/garrifin", emoji: "🁣", price: 0 },
    { id: "skin_dragon",     type: "domino_skin", name: "تنين الأسطورة",  asset: "/skins/domino/dragon",   emoji: "🐉", price: 5000, vip_required: true, glowColor: "#ef4444" },
    { id: "skin_phoenix",    type: "domino_skin", name: "فينيكس ناري",    asset: "/skins/domino/phoenix",  emoji: "🦅", price: 3000, glowColor: "#f59e0b" },
    { id: "skin_unicorn",    type: "domino_skin", name: "يونيكورن سحري",  asset: "/skins/domino/unicorn",  emoji: "🦄", price: 2000, glowColor: "#a78bfa" },

    // ── Card Skins (تطبّق على بطاقات البالوت) ──
    { id: "card_classic",    type: "card_skin", name: "كلاسيك",         asset: "classic",  emoji: "🂡",  price: 0 },
    { id: "card_gold",       type: "card_skin", name: "ذهبي",           asset: "gold",     emoji: "✨",  price: 800,  currency: "coins", glowColor: "#d4af37" },
    { id: "card_neon",       type: "card_skin", name: "نيون",           asset: "neon",     emoji: "💡",  price: 60,   currency: "gems",  glowColor: "#00ff88", tag: "نيون" },
    { id: "card_royal",      type: "card_skin", name: "ملكي",           asset: "royal",    emoji: "♛",  price: 100,  currency: "gems",  glowColor: "#a78bfa", tag: "VIP", vip_required: true },

    // ── Pharaonic Game Skins ──
    { id: "pharaoh_horus",    type: "game_skin", name: "حورس",            asset: "pharaoh_horus",    emoji: "𓅃",  price: 120, currency: "gems", glowColor: "#c9a227", tag: "فرعوني" },
    { id: "pharaoh_eye",      type: "game_skin", name: "العين الزرقاء",   asset: "pharaoh_eye",      emoji: "𓂀",  price: 100, currency: "gems", glowColor: "#38bdf8", tag: "فرعوني" },
    { id: "pharaoh_serpent",  type: "game_skin", name: "الأفعى المقدسة",  asset: "pharaoh_serpent",  emoji: "𓆙",  price: 90,  currency: "gems", glowColor: "#22c55e", tag: "فرعوني" },
    { id: "pharaoh_anubis",   type: "game_skin", name: "أنوبيس",          asset: "pharaoh_anubis",   emoji: "𓁢",  price: 130, currency: "gems", glowColor: "#a78bfa", tag: "فرعوني" },
    { id: "pharaoh_ra",       type: "game_skin", name: "رع — إله الشمس",  asset: "pharaoh_ra",       emoji: "𓇳",  price: 150, currency: "gems", glowColor: "#fbbf24", tag: "فرعوني", vip_required: true },
    { id: "pharaoh_isis",     type: "game_skin", name: "إيزيس",           asset: "pharaoh_isis",     emoji: "𓁐",  price: 110, currency: "gems", glowColor: "#818cf8", tag: "فرعوني" },
    { id: "pharaoh_scarab",   type: "game_skin", name: "الجعران المقدس",   asset: "pharaoh_scarab",   emoji: "𓆣",  price: 80,  currency: "gems", glowColor: "#34d399", tag: "فرعوني" },
    { id: "pharaoh_pyramid",  type: "game_skin", name: "الهرم الأبدي",    asset: "pharaoh_pyramid",  emoji: "𓇋",  price: 200, currency: "gems", glowColor: "#d4af37", tag: "فرعوني", vip_required: true },
  ] as Skin[],
  pages: [] as PageContent[],
  gameConfig: {
    ludo: { turnTime: 30, maxPlayers: 4 },
    chess: { turnTime: 600, modes: ["blitz", "rapid"] },
    domino: { turnTime: 30, scoreLimit: 100 },
    baloot: { turnTime: 30, showHelpers: true },
  } as GameConfig,
};

export function listTournaments() {
  return db.tournaments.sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function createTournament(input: { name: string; startAt: string; capacity: number }) {
  const t: Tournament = {
    id: Math.random().toString(36).slice(2),
    name: input.name,
    startAt: input.startAt,
    capacity: input.capacity,
  };
  db.tournaments.push(t);
  return t;
}

export function registerTournament(tournamentId: string, name: string, email: string) {
  const t = db.tournaments.find((x) => x.id === tournamentId);
  if (!t) throw new Error("not_found");
  const count = db.registrations.filter((r) => r.tournamentId === tournamentId).length;
  if (count >= t.capacity) throw new Error("full");
  const r: Registration = {
    id: Math.random().toString(36).slice(2),
    tournamentId,
    name,
    email,
  };
  db.registrations.push(r);
  return r;
}

export function listRegistrations(tournamentId: string) {
  return db.registrations.filter((r) => r.tournamentId === tournamentId);
}

export function listMessages(room: string) {
  return db.chat.filter((m) => m.room === room).sort((a, b) => a.at - b.at);
}

export function addMessage(room: string, user: string, text: string) {
  const m: ChatMessage = {
    id: Math.random().toString(36).slice(2),
    room,
    user,
    text,
    at: Date.now(),
  };
  db.chat.push(m);
  return m;
}

export function getStream() {
  return db.stream;
}

export function setStream(cfg: Partial<StreamConfig>) {
  db.stream = { ...db.stream, ...cfg };
  return db.stream;
}

// --- Skins Management ---
export function listSkins() {
  return db.skins;
}

export function addSkin(skin: Skin) {
  if (db.skins.find(s => s.id === skin.id)) throw new Error("duplicate_id");
  db.skins.push(skin);
  return skin;
}

export function removeSkin(id: string) {
  db.skins = db.skins.filter(s => s.id !== id);
}

// --- Pages Management ---
export function listPages() {
  return db.pages;
}

export function savePage(page: PageContent) {
  const idx = db.pages.findIndex(p => p.id === page.id);
  if (idx >= 0) {
    db.pages[idx] = page;
  } else {
    db.pages.push(page);
  }
  return page;
}

export function deletePage(id: string) {
  db.pages = db.pages.filter(p => p.id !== id);
}

// --- Game Config ---
export function getGameConfig() {
  return db.gameConfig;
}

export function updateGameConfig(cfg: Partial<GameConfig>) {
  db.gameConfig = { ...db.gameConfig, ...cfg };
  return db.gameConfig;
}

export function listAds() {
  return db.ads;
}

export function addAd(ad: { title: string; content: string }) {
  const a: AdSlot = { id: Math.random().toString(36).slice(2), title: ad.title, content: ad.content };
  db.ads.push(a);
  return a;
}

export function getAnnouncement() {
  return db.announcement;
}

export function setAnnouncement(text: string) {
  db.announcement = text;
  return db.announcement;
}
