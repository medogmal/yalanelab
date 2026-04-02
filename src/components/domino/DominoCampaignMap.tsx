"use client";
import React, { useState, useEffect } from "react";
import { CAMPAIGN_MAPS, type CampaignMap, type LevelConfig } from "@/lib/domino/campaign";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import StoryBubble from "@/components/story/StoryBubble";
import { getDominoStory } from "@/lib/story/domino-stories";

/* ══════════════════════════════════════════════════════════════
   PROGRESS HELPERS — localStorage persistence
══════════════════════════════════════════════════════════════ */
type LevelProgress = { passed: boolean; completedAt: number; stars: number };
type MapProgress   = Record<string, LevelProgress>;

function loadMapProgress(mapId: string): MapProgress {
  try {
    const raw = localStorage.getItem(`campaign_progress_${mapId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function getStars(progress: MapProgress, levelId: string): number {
  if (!progress[levelId]?.passed) return 0;
  return progress[levelId]?.stars ?? 3;
}

function countCompleted(progress: MapProgress, levels: LevelConfig[]): number {
  return levels.filter(l => progress[l.id]?.passed).length;
}

// D-3.6: فتح الخريطة التالية بعد 7/10 مستويات (مش 10/10)
const UNLOCK_THRESHOLD = 7;

function isMapUnlocked(mapIndex: number, allMaps: CampaignMap[]): boolean {
  if (mapIndex === 0) return true;
  const prevMap = allMaps[mapIndex - 1];
  const prevProgress = loadMapProgress(prevMap.id);
  const completed = countCompleted(prevProgress, prevMap.levels);
  return completed >= UNLOCK_THRESHOLD;
}

/* ══════════════════════════════════════════════════════════════
   THEME CONFIG
══════════════════════════════════════════════════════════════ */
const MAP_THEME: Record<string, { color: string; glow: string; icon: string }> = {
  classic:  { color: "#34d399", glow: "rgba(52,211,153,0.35)",  icon: "🎲" },
  desert:   { color: "#f5a623", glow: "rgba(245,166,35,0.35)",  icon: "🏜️" },
  egyptian: { color: "#fbbf24", glow: "rgba(251,191,36,0.35)",  icon: "🏛️" },
  sultan:   { color: "#a78bfa", glow: "rgba(167,139,250,0.35)", icon: "👑" },
  turkish:  { color: "#f87171", glow: "rgba(248,113,113,0.35)", icon: "🌙" },
};

/* ══════════════════════════════════════════════════════════════
   STAR RATING
══════════════════════════════════════════════════════════════ */
function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: 12, opacity: i < count ? 1 : 0.2 }}>⭐</span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LEVEL DOT
══════════════════════════════════════════════════════════════ */
function LevelDot({ level, mapTheme, isUnlocked, stars, onClick }: {
  level: LevelConfig;
  mapTheme: typeof MAP_THEME[string];
  isUnlocked: boolean;
  stars: number;
  onClick: () => void;
}) {
  const done = stars > 0;
  return (
    <motion.button
      onClick={isUnlocked ? onClick : undefined}
      whileHover={isUnlocked ? { scale: 1.12 } : {}}
      whileTap={isUnlocked ? { scale: 0.95 } : {}}
      style={{
        position: "relative", width: 52, height: 52, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 900,
        cursor: isUnlocked ? "pointer" : "not-allowed",
        background: done
          ? `linear-gradient(135deg,${mapTheme.color},${mapTheme.color}88)`
          : isUnlocked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        border: `2px solid ${done ? mapTheme.color : isUnlocked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: done ? `0 0 20px ${mapTheme.glow}` : isUnlocked ? "0 4px 16px rgba(0,0,0,0.4)" : "none",
        color: done ? "#000" : isUnlocked ? "#fff" : "rgba(255,255,255,0.25)",
        flexShrink: 0, fontFamily: "inherit", transition: "all .2s",
      }}
    >
      {!isUnlocked ? "🔒" : done ? "✓" : level.levelNumber}
      {done && (
        <div style={{
          position: "absolute", top: -8, right: -8, fontSize: 10, fontWeight: 900,
          background: "#f5a623", color: "#000", borderRadius: 99,
          padding: "1px 5px", border: "1.5px solid #07090f",
        }}>{stars}⭐</div>
      )}
      {isUnlocked && !done && (
        <motion.div
          style={{ position: "absolute", inset: -4, borderRadius: "50%",
            border: `2px solid ${mapTheme.color}`, pointerEvents: "none" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════════
   LEVEL DETAIL PANEL
══════════════════════════════════════════════════════════════ */
function LevelPanel({ level, mapId, mapTheme, onClose }: {
  level: LevelConfig; mapId: string;
  mapTheme: typeof MAP_THEME[string]; onClose: () => void;
}) {
  const DIFF_LABEL: Record<string, string> = {
    easy: "سهل 🟢", medium: "متوسط 🟡", hard: "صعب 🔴", expert: "خبير 💀",
  };
  const COND_LABEL: Record<string, string> = {
    win_match: "فز بالمباراة", points: "اجمع النقاط المطلوبة",
    max_turns: "فز في أدوار محدودة", no_draws: "فز بدون سحب قطع",
  };
  const href = `/games/domino/training?campaign=true&map=${mapId}&level=${level.id}`;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        style={{
          width: "100%", maxWidth: 480,
          borderRadius: "24px 24px 0 0",
          background: "rgba(7,9,15,0.98)",
          border: `1px solid ${mapTheme.color}30`, borderBottom: "none",
          overflow: "hidden", paddingBottom: "env(safe-area-inset-bottom)",
          fontFamily: "var(--font-cairo), sans-serif",
        }}
      >
        <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${mapTheme.color},transparent)` }}/>
        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#fff" }}>{level.title}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: `${mapTheme.color}99`, marginTop: 2 }}>{level.description}</div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16, fontFamily: "inherit",
            }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "الصعوبة",    value: DIFF_LABEL[level.opponentDifficulty] },
              { label: "الشرط",      value: COND_LABEL[level.winCondition.type] ?? level.winCondition.type },
              { label: "🪙 الجائزة", value: `${level.rewards.coins.toLocaleString()} كوين` },
              { label: "⭐ XP",      value: `${level.rewards.xp} نقطة` },
            ].map(info => (
              <div key={info.label} style={{
                padding: "12px 14px", borderRadius: 14,
                background: `${mapTheme.color}08`, border: `1px solid ${mapTheme.color}18`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: `${mapTheme.color}80`, marginBottom: 4 }}>{info.label}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{info.value}</div>
              </div>
            ))}
          </div>
          {"count" in level.winCondition && (
            <div style={{
              padding: "10px 14px", borderRadius: 12, marginBottom: 16,
              background: "rgba(255,45,85,0.08)", border: "1px solid rgba(255,45,85,0.2)",
              fontSize: 12, fontWeight: 700, color: "#f87171",
            }}>⚠️ يجب الفوز في أقل من {(level.winCondition as any).count} دور</div>
          )}
          {"target" in level.winCondition && (
            <div style={{
              padding: "10px 14px", borderRadius: 12, marginBottom: 16,
              background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)",
              fontSize: 12, fontWeight: 700, color: "#f5a623",
            }}>🎯 اجمع {(level.winCondition as any).target} نقطة أو أكثر</div>
          )}
          <Link href={href} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "15px", borderRadius: 16, fontWeight: 900, fontSize: 16,
            textDecoration: "none", color: "#000",
            background: `linear-gradient(135deg,${mapTheme.color},${mapTheme.color}cc)`,
            boxShadow: `0 8px 28px ${mapTheme.glow}`,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polygon points="2,1 13,7 2,13" fill="currentColor"/></svg>
            ابدأ التحدي
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAP VIEW — levels grid  (مع progress حقيقي من localStorage)
══════════════════════════════════════════════════════════════ */
function MapView({ map, onBack }: { map: CampaignMap; onBack: () => void }) {
  const theme = MAP_THEME[map.id] ?? MAP_THEME.classic;
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig | null>(null);
  const [progress, setProgress] = useState<MapProgress>({});
  const [storyTrigger, setStoryTrigger] = useState<"map_enter" | "win" | "lose" | "map_complete" | null>("map_enter");
  const story = getDominoStory(map.id);

  // تحميل الـ progress من localStorage
  useEffect(() => {
    setProgress(loadMapProgress(map.id));
  }, [map.id]);

  // إعادة التحميل لما اللاعب يرجع من اللعبة
  useEffect(() => {
    const handler = () => setProgress(loadMapProgress(map.id));
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [map.id]);

  const completedCount = countCompleted(progress, map.levels);

  return (
    <div style={{
      minHeight: "100dvh", background: "#07090f",
      fontFamily: "var(--font-cairo), sans-serif", color: "#fff",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 80% 50% at 50% 20%,${theme.glow.replace("0.35","0.08")},transparent 65%)`,
      }}/>

      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px clamp(14px,4vw,28px)",
        background: "rgba(7,9,15,0.88)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${theme.color}20`,
      }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 12,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
        }}>← رجوع</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, marginBottom: 2 }}>{theme.icon}</div>
          <div style={{ fontWeight: 900, fontSize: 15, color: theme.color }}>{map.name}</div>
        </div>
        <div style={{
          padding: "6px 12px", borderRadius: 10,
          background: `${theme.color}12`, border: `1px solid ${theme.color}28`,
          fontSize: 11, fontWeight: 900, color: theme.color,
        }}>{completedCount}/{map.levels.length}</div>
      </header>

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / map.levels.length) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ height: "100%", background: theme.color, boxShadow: `0 0 8px ${theme.glow}` }}
        />
      </div>

      <div style={{
        padding: "16px clamp(14px,4vw,28px)",
        fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)",
        textAlign: "center", maxWidth: 480, margin: "0 auto",
      }}>{map.description}</div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "8px clamp(14px,4vw,28px) 80px" }}>
        {map.levels.map((level, i) => {
          const stars     = getStars(progress, level.id);
          const isUnlocked = i === 0 || (i > 0 && getStars(progress, map.levels[i - 1].id) > 0);
          const isRight    = i % 4 < 2;

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: "flex", flexDirection: isRight ? "row" : "row-reverse",
                alignItems: "center", gap: 14, marginBottom: 12,
              }}
            >
              <LevelDot
                level={level} mapTheme={theme}
                isUnlocked={isUnlocked} stars={stars}
                onClick={() => setSelectedLevel(level)}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 800, fontSize: 13,
                  color: isUnlocked ? "#fff" : "rgba(255,255,255,0.25)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{level.title}</div>
                <div style={{
                  fontSize: 10, fontWeight: 600,
                  color: isUnlocked ? `${theme.color}80` : "rgba(255,255,255,0.1)",
                  marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{level.description}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <Stars count={stars} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: `${theme.color}60` }}>
                    🪙 {level.rewards.coins.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedLevel && (
          <LevelPanel
            level={selectedLevel} mapId={map.id}
            mapTheme={theme} onClose={() => setSelectedLevel(null)}
          />
        )}
      </AnimatePresence>

      {/* ══ STORY BUBBLE ══ */}
      {story && storyTrigger && (
        <StoryBubble
          story={story}
          trigger={storyTrigger}
          autoHide={5000}
          onDismiss={() => setStoryTrigger(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAP SELECTOR — main screen  (مع progress حقيقي)
══════════════════════════════════════════════════════════════ */
export default function DominoCampaignMap() {
  const [selectedMap, setSelectedMap] = useState<CampaignMap | null>(null);
  // حفظ progress لكل الخرائط
  const [allProgress, setAllProgress] = useState<Record<string, MapProgress>>({});
  const [unlockToast, setUnlockToast] = useState<string | null>(null);

  useEffect(() => {
    const p: Record<string, MapProgress> = {};
    CAMPAIGN_MAPS.forEach(m => { p[m.id] = loadMapProgress(m.id); });
    setAllProgress(p);
  }, []);

  if (selectedMap) return (
    <MapView map={selectedMap} onBack={() => {
      setSelectedMap(null);
      // إعادة تحميل progress لاكتشاف unlocks جديدة
      const p: Record<string, MapProgress> = {};
      CAMPAIGN_MAPS.forEach(m => { p[m.id] = loadMapProgress(m.id); });
      setAllProgress(p);
      // تحقق هل خريطة جديدة اتفتحت
      CAMPAIGN_MAPS.forEach((m, i) => {
        if (i === 0) return;
        const wasLocked = !isMapUnlocked(i, CAMPAIGN_MAPS);
        if (!wasLocked) return; // كانت مفتوحة
        const nowUnlocked = isMapUnlocked(i, CAMPAIGN_MAPS);
        if (nowUnlocked) {
          setUnlockToast(`🗺️ خريطة جديدة مفتوحة: ${m.name}!`);
          setTimeout(() => setUnlockToast(null), 4000);
        }
      });
    }} />
  );

  return (
    <div style={{
      minHeight: "100dvh", background: "#07090f",
      fontFamily: "var(--font-cairo), sans-serif", color: "#fff", padding: "0 0 40px",
    }} dir="rtl">

      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px clamp(14px,4vw,28px)",
        background: "rgba(7,9,15,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Link href="/games/domino/online" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 12,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 800, textDecoration: "none",
        }}>← رجوع للوبي</Link>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#f5a623" }}>🗺️ رحلة الأساطير</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>5 عوالم · 50 مستوى</div>
        </div>
        <div style={{ width: 80 }}/>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px clamp(14px,4vw,28px)", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {/* D-3.6: Unlock Toast */}
        <AnimatePresence>
          {unlockToast && (
            <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              style={{ position:"fixed", top:80, left:"50%", transform:"translateX(-50%)", zIndex:100,
                padding:"12px 24px", borderRadius:16, background:"rgba(7,9,15,0.95)",
                border:"1.5px solid rgba(245,166,35,0.5)", color:"#f5a623",
                fontWeight:900, fontSize:14, boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
                fontFamily:"Cairo,sans-serif", direction:"rtl", whiteSpace:"nowrap" }}>
              {unlockToast}
            </motion.div>
          )}
        </AnimatePresence>
        {CAMPAIGN_MAPS.map((map, i) => {
          const theme    = MAP_THEME[map.id] ?? MAP_THEME.classic;
          const prog     = allProgress[map.id] ?? {};
          const done     = countCompleted(prog, map.levels);
          // D-3.6: تُفتح بعد 7/10 من الخريطة السابقة (مش 10/10)
          const locked = !isMapUnlocked(i, CAMPAIGN_MAPS);
          const pct      = map.levels.length > 0 ? Math.round((done / map.levels.length) * 100) : 0;

          return (
            <motion.div
              key={map.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => !locked && setSelectedMap(map)}
              style={{
                position: "relative", borderRadius: 20, overflow: "hidden",
                cursor: locked ? "not-allowed" : "pointer",
                border: `2px solid ${locked ? "rgba(255,255,255,0.06)" : theme.color + "40"}`,
                boxShadow: locked ? "none" : `0 0 30px ${theme.glow}`,
                filter: locked ? "grayscale(0.7) brightness(0.6)" : "none",
                transition: "all .3s", aspectRatio: "16/9",
              }}
            >
              <div style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(ellipse at 30% 40%, ${theme.color}20, #07090f 70%)`,
              }}/>
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 64, opacity: 0.25,
              }}>{theme.icon}</div>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(7,9,15,0.92) 0%, rgba(7,9,15,0.3) 60%, transparent 100%)",
              }}/>

              {/* Progress mini bar */}
              {!locked && pct > 0 && (
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: theme.color, opacity: 0.8 }}/>
                </div>
              )}

              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px" }}>
                {locked && (
                  <div style={{ position: "absolute", top: -36, left: "50%", transform: "translateX(-50%)", fontSize: 24 }}>🔒</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{theme.icon}</span>
                  <span style={{ fontWeight: 900, fontSize: 16, color: theme.color }}>{map.name}</span>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 8,
                  overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                }}>{map.description}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: `${theme.color}80` }}>
                    {done}/{map.levels.length} مستوى
                  </span>
                  {!locked && (
                    <div style={{
                      padding: "4px 12px", borderRadius: 99,
                      background: `${theme.color}18`, border: `1px solid ${theme.color}40`,
                      fontSize: 10, fontWeight: 900, color: theme.color,
                    }}>العب الآن ←</div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
