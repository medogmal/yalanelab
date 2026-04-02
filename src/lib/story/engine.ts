/* ═══════════════════════════════════════════════════════════════
   STORY ENGINE — يالا نلعب
   نظام القصة التفاعلي لخرائط الـ Campaign
═══════════════════════════════════════════════════════════════ */

export type StoryTrigger =
  | "map_enter"
  | "level_start"
  | "win"
  | "lose"
  | "draw_tile"
  | "midpoint"
  | "boss"
  | "map_complete";

export type StoryEmotion = "happy" | "serious" | "mysterious" | "proud" | "warning" | "sad";

export interface StoryLine {
  trigger:   StoryTrigger;
  levelHint?: number;        // لو موجود، بيطبّق على مستوى معين بس
  narrator:  string;
  text:      string;
  emotion?:  StoryEmotion;
}

export interface MapStory {
  mapId:           string;
  narrator:        string;
  narratorAvatar:  string;   // emoji
  narratorTitle:   string;   // "شيخ المحلة"
  lines:           StoryLine[];
}

export interface StoryProgress {
  shownTriggers: string[];   // `${mapId}_${trigger}_${levelHint ?? "all"}`
  lastSeenAt:    number;
}

/* ─── persistence ─── */
function storageKey(mapId: string) { return `story_progress_${mapId}`; }

export function loadStoryProgress(mapId: string): StoryProgress {
  if (typeof window === "undefined") return { shownTriggers: [], lastSeenAt: 0 };
  try {
    const raw = localStorage.getItem(storageKey(mapId));
    return raw ? JSON.parse(raw) : { shownTriggers: [], lastSeenAt: 0 };
  } catch { return { shownTriggers: [], lastSeenAt: 0 }; }
}

export function markStoryShown(mapId: string, key: string) {
  if (typeof window === "undefined") return;
  try {
    const p = loadStoryProgress(mapId);
    if (!p.shownTriggers.includes(key)) p.shownTriggers.push(key);
    p.lastSeenAt = Date.now();
    localStorage.setItem(storageKey(mapId), JSON.stringify(p));
  } catch { /* ignore */ }
}

export function resetStoryProgress(mapId: string) {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(storageKey(mapId)); } catch { /* ignore */ }
}

/* ─── get next line ─── */
export function getStoryLine(
  story: MapStory,
  trigger: StoryTrigger,
  levelNumber?: number,
  forceRepeat = false,
): StoryLine | null {
  const progress = loadStoryProgress(story.mapId);
  const candidates = story.lines.filter(l => {
    if (l.trigger !== trigger) return false;
    if (l.levelHint !== undefined && l.levelHint !== levelNumber) return false;
    return true;
  });
  if (!candidates.length) return null;

  for (const line of candidates) {
    const key = `${story.mapId}_${trigger}_${line.levelHint ?? "all"}`;
    if (forceRepeat || !progress.shownTriggers.includes(key)) {
      markStoryShown(story.mapId, key);
      return line;
    }
  }
  // لو كلهم اتعرضوا، ارجع آخر واحد
  return candidates[candidates.length - 1];
}
