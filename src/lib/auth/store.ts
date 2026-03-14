import fs from "fs";
import path from "path";
import { randomBytes, pbkdf2Sync } from "crypto";

export type Ratings = { chess: number; domino: number; ludo: number; baloot: number };
export type Tier = "free" | "pro" | "elite";
export type Cosmetics = { pieceSet: "lichess" | "staunton" | "gold" | "neon"; boardTheme: "classic" | "wood" | "carbon" | "ocean" };
export type User = {
  id: string;
  name: string;
  email: string;
  passHash: string;
  salt: string;
  createdAt: number;
  ratings: Ratings;
  tier: Tier;
  cosmetics: Cosmetics;
  unlockedPieceSets: Cosmetics["pieceSet"][];
  unlockedBoardThemes: Cosmetics["boardTheme"][];
  xp?: number;
  level?: number;
  streakDays?: number;
  lastDailyRewardAt?: number;
  coins?: number;
  gems?: number;
  chests?: { wooden: number; silver: number; golden: number; legendary: number };
  dailyCycleDay?: number;
  dailyCycleCount?: number;
  seasonStartDay?: number;
  lastSeasonRewardClaimDay?: number;
  activeChest?: { kind: "wooden" | "silver" | "golden" | "legendary"; unlockAt: number } | null;
  dailyMissions?: Array<{ id: string; title: string; target: number; progress: number; reward: { coins?: number; xp?: number; chest?: "wooden" | "silver" | "golden" | "legendary" }; claimed?: boolean }>;
  weeklyMissions?: Array<{ id: string; title: string; target: number; progress: number; reward: { coins?: number; xp?: number; chest?: "wooden" | "silver" | "golden" | "legendary" }; claimed?: boolean }>;
  dailyMissionsStartDay?: number;
  weeklyMissionsStartDay?: number;
  passXP?: number;
  passLevel?: number;
  passPremium?: boolean;
  matchesDomino?: number;
  winsDomino?: number;
  lossesDomino?: number;
  drawsDomino?: number;
  longestWinStreakDomino?: number;
  currentWinStreakDomino?: number;
  totalDurationDomino?: number;
  role?: "user" | "admin" | "super_admin";
  country?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]", "utf-8");
}

export function loadUsers(): User[] {
  ensureDataDir();
  try {
    const txt = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(txt) as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export function hashPassword(password: string, salt?: string) {
  const s = salt || randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, s, 100_000, 64, "sha512").toString("hex");
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const { hash: h } = hashPassword(password, salt);
  return h === hash;
}

export function getUserByEmail(email: string) {
  const users = loadUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getUserById(id: string) {
  const users = loadUsers();
  return users.find((u) => u.id === id) || null;
}

export function createUser(id: string, name: string, email: string, password: string) {
  const users = loadUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return null;
  const { hash, salt } = hashPassword(password);
  const user: User = {
    id,
    name,
    email,
    passHash: hash,
    salt,
    createdAt: Date.now(),
    ratings: { chess: 1200, domino: 1200, ludo: 1200, baloot: 1200 },
    tier: "free",
    cosmetics: { pieceSet: "lichess", boardTheme: "classic" },
    unlockedPieceSets: ["lichess", "staunton"],
    unlockedBoardThemes: ["classic"],
    xp: 0,
    level: 1,
    streakDays: 0,
    lastDailyRewardAt: 0,
    coins: 0,
    gems: 0,
    chests: { wooden: 0, silver: 0, golden: 0, legendary: 0 },
    dailyCycleDay: 1,
    dailyCycleCount: 0,
    seasonStartDay: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
    lastSeasonRewardClaimDay: 0,
    activeChest: null,
    dailyMissions: [],
    weeklyMissions: [],
    dailyMissionsStartDay: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
    weeklyMissionsStartDay: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
    passXP: 0,
    passLevel: 1,
    passPremium: false,
    matchesDomino: 0,
    winsDomino: 0,
    lossesDomino: 0,
    drawsDomino: 0,
    longestWinStreakDomino: 0,
    currentWinStreakDomino: 0,
    totalDurationDomino: 0,
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export function updateUser(user: User) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
    saveUsers(users);
    return true;
  }
  return false;
}

export function applyEloResult(winnerId: string | undefined, loserId: string | undefined, draw: boolean) {
  if (!winnerId && !loserId) return;
  const K = 32;
  const users = loadUsers();
  const wUser = winnerId ? users.find((u) => u.id === winnerId) : undefined;
  const lUser = loserId ? users.find((u) => u.id === loserId) : undefined;
  if (draw) {
    if (wUser && lUser) {
      const Ew = 1 / (1 + Math.pow(10, (lUser.ratings.chess - wUser.ratings.chess) / 400));
      const El = 1 / (1 + Math.pow(10, (wUser.ratings.chess - lUser.ratings.chess) / 400));
      wUser.ratings.chess = Math.round(wUser.ratings.chess + K * (0.5 - Ew));
      lUser.ratings.chess = Math.round(lUser.ratings.chess + K * (0.5 - El));
      saveUsers(users);
    }
    return;
  }
  if (wUser && lUser) {
    const Ew = 1 / (1 + Math.pow(10, (lUser.ratings.chess - wUser.ratings.chess) / 400));
    const El = 1 / (1 + Math.pow(10, (wUser.ratings.chess - lUser.ratings.chess) / 400));
    wUser.ratings.chess = Math.round(wUser.ratings.chess + K * (1 - Ew));
    lUser.ratings.chess = Math.round(lUser.ratings.chess + K * (0 - El));
    saveUsers(users);
  }
}

export function applyDominoEloResult(winnerId: string | undefined, loserId: string | undefined, draw: boolean) {
  if (!winnerId && !loserId) return;
  const users = loadUsers();
  const wUser = winnerId ? users.find((u) => u.id === winnerId) : undefined;
  const lUser = loserId ? users.find((u) => u.id === loserId) : undefined;
  if (draw) {
    if (wUser && lUser) {
      saveUsers(users);
    }
    return;
  }
  if (wUser && lUser) {
    const w = wUser.ratings.domino;
    const l = lUser.ratings.domino;
    const winnerVsHigher = l > w;
    const loserVsLower = w > l;
    const winGain = winnerVsHigher ? 35 : 25;
    const lossDrop = loserVsLower ? 30 : 20;
    wUser.ratings.domino = Math.max(0, w + winGain);
    lUser.ratings.domino = Math.max(0, l - lossDrop);
    // placement protection: first 3 matches per season reduce loss
    const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const placementWindow = 3;
    const lMatches = (lUser.matchesDomino || 0) - (lUser.winsDomino || 0) - (lUser.drawsDomino || 0);
    if ((lUser.seasonStartDay || day) === day && lMatches < placementWindow) {
      lUser.ratings.domino = Math.max(0, l - Math.round(lossDrop * 0.5));
    }
    saveUsers(users);
  }
}

export function grantXp(userId: string, amount: number) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  const prevXp = u.xp || 0;
  const prevLevel = u.level || 1;
  const newXp = prevXp + Math.max(0, amount);
  let level = prevLevel;
  function req(level: number) { return 100 + (level - 1) * 50; }
  let threshold = req(level);
  let xp = newXp;
  while (xp >= threshold) {
    xp -= threshold;
    level += 1;
    threshold = req(level);
  }
  u.xp = xp;
  u.level = level;
  u.passXP = (u.passXP || 0) + Math.max(0, amount);
  while ((u.passXP || 0) >= 100) {
    u.passXP = (u.passXP || 0) - 100;
    u.passLevel = (u.passLevel || 1) + 1;
  }
  saveUsers(users);
  return true;
}

export function grantCoins(userId: string, amount: number) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  u.coins = Math.max(0, (u.coins || 0) + Math.max(0, amount));
  saveUsers(users);
  return true;
}

export function grantGems(userId: string, amount: number) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  u.gems = Math.max(0, (u.gems || 0) + Math.max(0, amount));
  saveUsers(users);
  return true;
}

export function spendGems(userId: string, amount: number) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  const have = u.gems || 0;
  if (have < amount) return false;
  u.gems = have - amount;
  saveUsers(users);
  return true;
}

export function spendCoins(userId: string, amount: number) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  const have = u.coins || 0;
  if (have < amount) return false;
  u.coins = have - amount;
  saveUsers(users);
  return true;
}

export function getDailyStatus(userId: string) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return { ok: false, reason: "no_user" as const };
  const nowDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const lastDay = u.lastDailyRewardAt || 0;
  const claimable = lastDay !== nowDay;
  const missed = lastDay < nowDay - 1 && lastDay !== 0;
  const dayIdx = u.dailyCycleDay || 1;
  return { ok: true, claimable, missed, day: dayIdx, streak: u.streakDays || 0, coins: u.coins || 0, gems: u.gems || 0 };
}

export function claimDailyReward(userId: string, opts?: { preserveWithGems?: boolean }) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return { ok: false, reason: "no_user" as const };
  const nowDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const lastDay = u.lastDailyRewardAt || 0;
  if (lastDay === nowDay) return { ok: false, reason: "already_claimed" as const };
  const missed = lastDay < nowDay - 1 && lastDay !== 0;
  if (missed) {
    const preserve = opts?.preserveWithGems && spendGems(u.id, 20);
    if (!preserve) {
      u.streakDays = 0;
      u.dailyCycleDay = 1;
    }
  }
  // advance streak and cycle day
  if (lastDay === nowDay - 1 || missed) {
    u.streakDays = (u.streakDays || 0) + 1;
  } else {
    u.streakDays = 1;
  }
  u.dailyCycleDay = Math.min(7, (u.dailyCycleDay || 1));
  // reward schedule
  const cycleMultiplier = 1 + ((u.dailyCycleCount || 0) * 0.2);
  let coinsReward = 0;
  let chest: "wooden" | "silver" | "golden" | "legendary" | null = null;
  let tempSkin: string | null = null;
  switch (u.dailyCycleDay) {
    case 1: coinsReward = Math.round(500 * cycleMultiplier); break;
    case 2: coinsReward = Math.round(800 * cycleMultiplier); break;
    case 3: chest = "silver"; break;
    case 4: coinsReward = Math.round(1000 * cycleMultiplier); break;
    case 5: tempSkin = "royal-temp"; break;
    case 6: coinsReward = Math.round(1500 * cycleMultiplier); break;
    case 7: chest = "legendary"; break;
    default: coinsReward = Math.round(300 * cycleMultiplier);
  }
  if (coinsReward > 0) grantCoins(u.id, coinsReward);
  if (chest) {
    u.chests = u.chests || { wooden: 0, silver: 0, golden: 0, legendary: 0 };
    u.chests[chest] = (u.chests[chest] || 0) + 1;
  }
  if (tempSkin) {
    (u as unknown as { tempDominoSkin?: { id: string; expiresAt: number } }).tempDominoSkin = { id: tempSkin, expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000 };
  }
  // cycle handling
  let bonusNote: string | null = null;
  if (u.dailyCycleDay === 7) {
    // bonus: double the chest reward
    if (chest === "legendary") {
      u.chests = u.chests || { wooden: 0, silver: 0, golden: 0, legendary: 0 };
      u.chests.legendary = (u.chests.legendary || 0) + 1;
    }
    u.dailyCycleDay = 1;
    u.dailyCycleCount = (u.dailyCycleCount || 0) + 1;
    bonusNote = "cycle_bonus";
  } else {
    u.dailyCycleDay = (u.dailyCycleDay || 1) + 1;
  }
  u.lastDailyRewardAt = nowDay;
  saveUsers(users);
  return { ok: true, coins: coinsReward, chest, day: u.dailyCycleDay, streak: u.streakDays, bonus: bonusNote, gems: u.gems || 0 };
}

export function recordDominoMatch(userId: string, result: "win" | "loss" | "draw", durationSec?: number) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  u.matchesDomino = (u.matchesDomino || 0) + 1;
  if (result === "win") {
    u.winsDomino = (u.winsDomino || 0) + 1;
    u.currentWinStreakDomino = (u.currentWinStreakDomino || 0) + 1;
    if ((u.currentWinStreakDomino || 0) > (u.longestWinStreakDomino || 0)) {
      u.longestWinStreakDomino = u.currentWinStreakDomino;
    }
    if ((u.currentWinStreakDomino || 0) >= 5) {
      grantCoins(u.id, 500);
    }
  } else if (result === "loss") {
    u.lossesDomino = (u.lossesDomino || 0) + 1;
    u.currentWinStreakDomino = 0;
  } else {
    u.drawsDomino = (u.drawsDomino || 0) + 1;
  }
  if (durationSec && durationSec > 0) {
    u.totalDurationDomino = (u.totalDurationDomino || 0) + Math.floor(durationSec);
  }
  if (!u.dailyMissions || !u.weeklyMissions) {
    const nowDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    u.dailyMissionsStartDay = nowDay;
    u.weeklyMissionsStartDay = nowDay - (nowDay % 7);
    u.dailyMissions = [
      { id: "daily_win3", title: "اكسب 3 مباريات", target: 3, progress: 0, reward: { coins: 800 } },
      { id: "daily_play5", title: "العب 5 مباريات أونلاين", target: 5, progress: 0, reward: { xp: 50 } },
      { id: "daily_score50", title: "سجّل 50 نقطة إجمالية", target: 50, progress: 0, reward: { chest: "wooden" } },
    ];
    u.weeklyMissions = [
      { id: "weekly_win5", title: "اكسب 5 مباريات", target: 5, progress: 0, reward: { coins: 3000 } },
      { id: "weekly_play10", title: "العب 10 مباريات أونلاين", target: 10, progress: 0, reward: { xp: 150 } },
      { id: "weekly_score200", title: "سجّل 200 نقطة إجمالية", target: 200, progress: 0, reward: { chest: "silver" } },
    ];
  }
  (u.dailyMissions || []).forEach((m) => {
    if (m.id === "daily_play5") m.progress = Math.min(m.target, (m.progress || 0) + 1);
    if (m.id === "daily_win3" && result === "win") m.progress = Math.min(m.target, (m.progress || 0) + 1);
  });
  (u.weeklyMissions || []).forEach((m) => {
    if (m.id === "weekly_play10") m.progress = Math.min(m.target, (m.progress || 0) + 1);
    if (m.id === "weekly_win5" && result === "win") m.progress = Math.min(m.target, (m.progress || 0) + 1);
  });
  saveUsers(users);
  return true;
}

export function setTier(userId: string, tier: Tier) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  u.tier = tier;
  saveUsers(users);
  return true;
}

export function getMissions(userId: string) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return { ok: false, reason: "no_user" as const };
  const nowDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const weekStart = nowDay - (nowDay % 7);
  if ((u.dailyMissionsStartDay || 0) !== nowDay) {
    u.dailyMissionsStartDay = nowDay;
    u.dailyMissions = [
      { id: "daily_win3", title: "اكسب 3 مباريات", target: 3, progress: 0, reward: { coins: 800 } },
      { id: "daily_play5", title: "العب 5 مباريات أونلاين", target: 5, progress: 0, reward: { xp: 50 } },
      { id: "daily_score50", title: "سجّل 50 نقطة إجمالية", target: 50, progress: 0, reward: { chest: "wooden" } },
    ];
  }
  if ((u.weeklyMissionsStartDay || 0) !== weekStart) {
    u.weeklyMissionsStartDay = weekStart;
    u.weeklyMissions = [
      { id: "weekly_win5", title: "اكسب 5 مباريات", target: 5, progress: 0, reward: { coins: 3000 } },
      { id: "weekly_play10", title: "العب 10 مباريات أونلاين", target: 10, progress: 0, reward: { xp: 150 } },
      { id: "weekly_score200", title: "سجّل 200 نقطة إجمالية", target: 200, progress: 0, reward: { chest: "silver" } },
    ];
  }
  saveUsers(users);
  return { ok: true, daily: u.dailyMissions, weekly: u.weeklyMissions };
}

export function claimMission(userId: string, missionId: string) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return { ok: false, reason: "no_user" as const };
  const m = (u.dailyMissions || []).concat(u.weeklyMissions || []).find((mm) => mm.id === missionId);
  if (!m) return { ok: false, reason: "not_found" as const };
  if (m.claimed || m.progress < m.target) return { ok: false, reason: "not_ready" as const };
  m.claimed = true;
  if (m.reward.coins) grantCoins(u.id, m.reward.coins);
  if (m.reward.xp) grantXp(u.id, m.reward.xp);
  if (m.reward.chest) {
    u.chests = u.chests || { wooden: 0, silver: 0, golden: 0, legendary: 0 };
    u.chests[m.reward.chest] = (u.chests[m.reward.chest] || 0) + 1;
  }
  saveUsers(users);
  return { ok: true };
}

export function startChestUnlock(userId: string, kind: "wooden" | "silver" | "golden" | "legendary") {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return { ok: false, reason: "no_user" as const };
  if (u.activeChest) return { ok: false, reason: "already_active" as const };
  const have = u.chests?.[kind] || 0;
  if (have <= 0) return { ok: false, reason: "none" as const };
  const delays: Record<typeof kind, number> = { wooden: 2 * 60 * 60 * 1000, silver: 6 * 60 * 60 * 1000, golden: 24 * 60 * 60 * 1000, legendary: 48 * 60 * 60 * 1000 };
  const unlockAt = Date.now() + delays[kind];
  u.chests![kind] = have - 1;
  u.activeChest = { kind, unlockAt };
  saveUsers(users);
  return { ok: true, unlockAt };
}

export function openChest(userId: string, instantWithGems?: boolean) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return { ok: false, reason: "no_user" as const };
  const active = u.activeChest;
  if (!active) return { ok: false, reason: "no_active" as const };
  if (Date.now() < active.unlockAt) {
    if (!instantWithGems || !spendGems(u.id, 20)) {
      return { ok: false, reason: "locked" as const };
    }
  }
  const kind = active.kind;
  u.activeChest = null;
  const coinsReward = kind === "wooden" ? 600 : kind === "silver" ? 1500 : kind === "golden" ? 4000 : 8000;
  grantCoins(u.id, coinsReward);
  saveUsers(users);
  return { ok: true, coins: coinsReward };
}

export function getChestStatus(userId: string) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return { ok: false, reason: "no_user" as const };
  return { ok: true, active: u.activeChest, chests: u.chests || { wooden: 0, silver: 0, golden: 0, legendary: 0 } };
}

export function getRoyalPass(userId: string) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return { ok: false, reason: "no_user" as const };
  return { ok: true, level: u.passLevel || 1, xp: u.passXP || 0, premium: !!u.passPremium };
}

export function upgradeRoyalPass(userId: string) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return { ok: false, reason: "no_user" as const };
  const ok = spendGems(u.id, 120);
  if (!ok) return { ok: false, reason: "no_gems" as const };
  u.passPremium = true;
  saveUsers(users);
  return { ok: true };
}

export function claimSeasonReward(userId: string) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return { ok: false, reason: "no_user" as const };
  const today = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const start = u.seasonStartDay || today;
  const claimedDay = u.lastSeasonRewardClaimDay || 0;
  const seasonLen = 30;
  if (today - start < seasonLen) return { ok: false, reason: "not_ended" as const };
  if (claimedDay === start) return { ok: false, reason: "already" as const };
  const r = u.ratings.domino;
  let rewardCoins = 2000;
  if (r >= 1400) rewardCoins = 5000;
  if (r >= 1600) rewardCoins = 8000;
  if (r >= 1800) rewardCoins = 12000;
  if (r >= 2000) rewardCoins = 16000;
  if (r >= 2200) rewardCoins = 22000;
  if (r >= 2400) rewardCoins = 30000;
  grantCoins(u.id, rewardCoins);
  u.lastSeasonRewardClaimDay = start;
  u.seasonStartDay = today;
  saveUsers(users);
  return { ok: true, coins: rewardCoins };
}

export function addScoreProgress(userId: string, score: number) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  const add = Math.max(0, Math.floor(score));
  (u.dailyMissions || []).forEach((m) => {
    if (m.id === "daily_score50") m.progress = Math.min(m.target, (m.progress || 0) + add);
  });
  (u.weeklyMissions || []).forEach((m) => {
    if (m.id === "weekly_score200") m.progress = Math.min(m.target, (m.progress || 0) + add);
  });
  saveUsers(users);
  return true;
}
// Sync a Prisma/NextAuth user into the JSON store (creates if missing)
export function syncUserFromPrisma(prismaUser: { id: string; name?: string | null; email?: string | null }): User | null {
  if (!prismaUser.email) return null;
  const existing = getUserByEmail(prismaUser.email);
  if (existing) return existing;
  return createUser(prismaUser.id, prismaUser.name || "لاعب", prismaUser.email, "");
}

export function applyLudoEloResult(winnerId: string | undefined, loserId: string | undefined) {
  if (!winnerId && !loserId) return;
  const K = 28;
  const users = loadUsers();
  const wUser = winnerId ? users.find((u) => u.id === winnerId) : undefined;
  const lUser = loserId  ? users.find((u) => u.id === loserId)  : undefined;
  if (wUser && lUser) {
    const Ew = 1 / (1 + Math.pow(10, (lUser.ratings.ludo - wUser.ratings.ludo) / 400));
    const El = 1 / (1 + Math.pow(10, (wUser.ratings.ludo - lUser.ratings.ludo) / 400));
    wUser.ratings.ludo = Math.round(wUser.ratings.ludo + K * (1 - Ew));
    lUser.ratings.ludo = Math.round(lUser.ratings.ludo + K * (0 - El));
    saveUsers(users);
  }
}

export function applyBalootEloResult(winnerId: string | undefined, loserId: string | undefined) {
  if (!winnerId && !loserId) return;
  const K = 28;
  const users = loadUsers();
  const wUser = winnerId ? users.find((u) => u.id === winnerId) : undefined;
  const lUser = loserId  ? users.find((u) => u.id === loserId)  : undefined;
  if (wUser && lUser) {
    const Ew = 1 / (1 + Math.pow(10, (lUser.ratings.baloot - wUser.ratings.baloot) / 400));
    const El = 1 / (1 + Math.pow(10, (wUser.ratings.baloot - lUser.ratings.baloot) / 400));
    wUser.ratings.baloot = Math.round(wUser.ratings.baloot + K * (1 - Ew));
    lUser.ratings.baloot = Math.round(lUser.ratings.baloot + K * (0 - El));
    saveUsers(users);
  }
}

export function setCosmetics(userId: string, c: Partial<Cosmetics>) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  u.cosmetics = { ...u.cosmetics, ...c };
  saveUsers(users);
  return true;
}

export function unlockPieceSet(userId: string, id: Cosmetics["pieceSet"]) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  if (!u.unlockedPieceSets.includes(id)) u.unlockedPieceSets.push(id);
  u.cosmetics.pieceSet = id;
  saveUsers(users);
  return true;
}

export function unlockBoardTheme(userId: string, id: Cosmetics["boardTheme"]) {
  const users = loadUsers();
  const u = users.find((x) => x.id === userId);
  if (!u) return false;
  if (!u.unlockedBoardThemes.includes(id)) u.unlockedBoardThemes.push(id);
  u.cosmetics.boardTheme = id;
  saveUsers(users);
  return true;
}
