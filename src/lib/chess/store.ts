import fs from "fs";
import path from "path";

export type FinishedMatch = {
  id: string;
  wName: string;
  bName: string;
  wUserId?: string;
  bUserId?: string;
  result: "1-0" | "0-1" | "1/2-1/2";
  reason: string;
  pgn: string;
  createdAt: number;
  finishedAt: number;
  time: { baseMin: number; incSec: number };
};

const DATA_DIR = path.join(process.cwd(), "data");
const MATCHES_FILE = path.join(DATA_DIR, "matches.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(MATCHES_FILE)) fs.writeFileSync(MATCHES_FILE, "[]", "utf-8");
}

export function loadFinished(): FinishedMatch[] {
  ensureDataDir();
  try {
    const txt = fs.readFileSync(MATCHES_FILE, "utf-8");
    return JSON.parse(txt) as FinishedMatch[];
  } catch {
    return [];
  }
}

export function saveFinished(list: FinishedMatch[]) {
  ensureDataDir();
  fs.writeFileSync(MATCHES_FILE, JSON.stringify(list, null, 2), "utf-8");
}

export function appendFinished(item: FinishedMatch) {
  const all = loadFinished();
  all.push(item);
  saveFinished(all);
}
