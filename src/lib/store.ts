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
  type: "avatar" | "ludo_skin" | "chess_skin" | "domino_skin" | "baloot_skin" | "baloot_frame" | "character" | "chat_bubble";
  name: string;
  asset: string;
  price?: number;
  vip_required?: boolean;
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
    { id: "default_domino", type: "domino_skin", name: "Garrifin Classic", asset: "/skins/domino/garrifin", price: 0 },
    { id: "skin_dragon", type: "domino_skin", name: "Dragon Legend", asset: "/skins/domino/dragon", price: 5000, vip_required: true },
    { id: "skin_phoenix", type: "domino_skin", name: "Phoenix Fire", asset: "/skins/domino/phoenix", price: 3000 },
    { id: "skin_unicorn", type: "domino_skin", name: "Unicorn Magic", asset: "/skins/domino/unicorn", price: 2000 },
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
