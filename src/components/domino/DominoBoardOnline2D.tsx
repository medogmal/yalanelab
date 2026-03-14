"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DominoGame, type Tile, type Side, type PlayerId } from "@/lib/domino/game";
import { CAMPAIGN_MAPS, checkWinCondition, type GameSnapshot } from "@/lib/domino/campaign";
import { usePlatformStore } from "@/lib/platform/store";

/* ══════════════════════════════════════════════════════════════
   SKIN SYSTEM
══════════════════════════════════════════════════════════════ */
const SKIN_MAP: Record<string, string> = {
  default_domino: "Garrifin",
  garrifin:       "Garrifin",
  skin_dragon:    "skinDragon",
  dragon:         "skinDragon",
  skin_phoenix:   "skinPhonix",
  phoenix:        "skinPhonix",
  skin_unicorn:   "skinUnicorn",
  unicorn:        "skinUnicorn",
};
const BACKFACE_MAP: Record<string, string> = {
  Garrifin:   "grrifinbackface.png",
  skinDragon: "dragonbackface.png",
  skinPhonix: "phonexbackface.png",
  skinUnicorn:"unicornbackface.png",
};

function getSkinFolder(raw?: string) {
  return SKIN_MAP[raw ?? "default_domino"] ?? "Garrifin";
}
function getTileSrc(folder: string, a: number, b: number): string {
  const [mn, mx] = a <= b ? [a, b] : [b, a];
  // Garrifin uses + , others use -
  const sep = folder === "Garrifin" ? "+" : "-";
  return `/img/domino/${folder}/${mn}${sep}${mx}.png`;
}
function getBackfaceSrc(folder: string): string {
  return `/img/domino/${folder}/${BACKFACE_MAP[folder] ?? "grrifinbackface.png"}`;
}

/* ══════════════════════════════════════════════════════════════
   TILE COMPONENT
══════════════════════════════════════════════════════════════ */
interface TileProps {
  a: number;
  b: number;
  vertical?: boolean;       // true = العمودي (double)
  selected?: boolean;
  playable?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  skinFolder: string;
  w?: number;
  h?: number;
}

function DominoTile({
  a, b, vertical = false,
  selected = false, playable = false, disabled = false, faceDown = false,
  onClick, skinFolder,
  w: wProp, h: hProp,
}: TileProps) {
  const W = wProp ?? (vertical ? 42 : 84);
  const H = hProp ?? (vertical ? 84 : 42);
  const src = faceDown ? getBackfaceSrc(skinFolder) : getTileSrc(skinFolder, a, b);

  /* اللي بيتحرك عند hover */
  const lift = !disabled && playable && !selected;

  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      style={{ width: W, height: H, position: "relative", flexShrink: 0, cursor: disabled ? "not-allowed" : onClick ? "pointer" : "default" }}
      whileHover={lift ? { y: -10, scale: 1.07, filter: "brightness(1.15) drop-shadow(0 8px 18px rgba(245,166,35,0.55))" } : {}}
      whileTap={!disabled && onClick ? { scale: 0.94 } : {}}
      animate={
        selected
          ? { y: -14, scale: 1.1, filter: "drop-shadow(0 0 18px rgba(245,166,35,0.9)) brightness(1.1)" }
          : disabled && !faceDown
          ? { opacity: 0.42, filter: "grayscale(0.4)" }
          : { y: 0, scale: 1, filter: "none", opacity: 1 }
      }
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      {/* selected ring */}
      {selected && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 5, borderRadius: 8, pointerEvents: "none",
          boxShadow: "inset 0 0 0 2.5px #f5a623, 0 0 22px 4px rgba(245,166,35,0.55)",
        }}/>
      )}
      {/* playable pulse ring */}
      {playable && !selected && (
        <motion.div
          style={{ position: "absolute", inset: 0, zIndex: 5, borderRadius: 8, pointerEvents: "none" }}
          animate={{ opacity: [0, 0.65, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          initial={{ opacity: 0 }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: 8, boxShadow: "inset 0 0 0 1.5px #34d399" }}/>
        </motion.div>
      )}

      {/* الصورة */}
      {!vertical ? (
        // أفقي — الصورة تتدور 90°
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 8 }}>
          <img
            src={src}
            alt={faceDown ? "?" : `${a}-${b}`}
            draggable={false}
            style={{
              width: H, height: W,
              position: "absolute",
              top: "50%", left: "50%",
              marginTop: -W / 2, marginLeft: -H / 2,
              transform: "rotate(90deg)",
              objectFit: "fill",
            }}
          />
        </div>
      ) : (
        <img
          src={src}
          alt={faceDown ? "?" : `${a}-${b}`}
          draggable={false}
          style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "fill", display: "block" }}
        />
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CHAIN NORMALIZER
   يحوّل السلسلة لقيم display صح
══════════════════════════════════════════════════════════════ */
function normalizeChain(chain: Tile[]): { a: number; b: number; isDouble: boolean }[] {
  if (!chain.length) return [];

  const result: { a: number; b: number; isDouble: boolean }[] = [];
  let exposedLeft = -1; // القيمة المكشوفة في اليسار

  for (let i = 0; i < chain.length; i++) {
    const t = chain[i];
    const isDouble = t.a === t.b;

    if (i === 0) {
      result.push({ a: t.a, b: t.b, isDouble });
      exposedLeft = t.a; // اليسار بيكشف t.a
    } else {
      // القيمة اللي بتتصل بيها من السلسلة هي t.a (لأن play() بتوجّه الـ tile صح)
      result.push({ a: t.a, b: t.b, isDouble });
    }
  }
  return result;
}

/* ══════════════════════════════════════════════════════════════
   OPPONENT BADGE
══════════════════════════════════════════════════════════════ */
function OpponentBadge({
  id, count, isTurn, skinFolder,
  position,
}: {
  id: PlayerId;
  count: number;
  isTurn: boolean;
  skinFolder: string;
  position: "top" | "left" | "right";
}) {
  const posStyle: React.CSSProperties =
    position === "top"
      ? { top: "4.5rem", left: "50%", transform: "translateX(-50%)" }
      : position === "left"
      ? { left: 8, top: "50%", transform: "translateY(-50%)" }
      : { right: 8, top: "50%", transform: "translateY(-50%)" };

  const isVert = position !== "top";
  const miniCount = Math.min(count, 5);

  return (
    <motion.div
      animate={isTurn ? { scale: 1.06 } : { scale: 1, opacity: 0.72 }}
      transition={{ type: "spring", stiffness: 260 }}
      style={{
        position: "absolute",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        ...posStyle,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
        background: isTurn ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.05)",
        border: `2px solid ${isTurn ? "#f5a623" : "rgba(255,255,255,0.08)"}`,
        boxShadow: isTurn ? "0 0 18px rgba(245,166,35,0.4)" : "none",
        transition: "all .3s",
        backdropFilter: "blur(16px)",
        position: "relative",
      }}>
        🤖
        {isTurn && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            width: 12, height: 12, borderRadius: "50%",
            background: "#22c55e",
            border: "2px solid #070915",
            boxShadow: "0 0 6px #22c55e",
            animation: "pulse-dot 1.2s ease-in-out infinite",
          }}/>
        )}
      </div>

      {/* Label */}
      <div style={{
        padding: "2px 8px", borderRadius: 99,
        fontSize: 9, fontWeight: 900,
        background: isTurn ? "#f5a623" : "rgba(0,0,0,0.5)",
        color: isTurn ? "#000" : "rgba(255,255,255,0.5)",
        border: isTurn ? "none" : "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(8px)",
        whiteSpace: "nowrap",
      }}>
        Bot · {count} 🁣
      </div>

      {/* Mini tiles face-down */}
      <div style={{
        display: "flex",
        flexDirection: isVert ? "column" : "row",
        gap: 2,
      }}>
        {Array.from({ length: miniCount }).map((_, i) => (
          <div key={i} style={{
            width: isVert ? 12 : 10, height: isVert ? 10 : 20,
            borderRadius: 3, flexShrink: 0,
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.06)",
            transform: isVert ? "none" : `rotate(${(i - 2) * 2.5}deg)`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
          }}/>
        ))}
        {count > 5 && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>+{count - 5}</span>}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VICTORY EFFECT
══════════════════════════════════════════════════════════════ */
function VictoryConfetti() {
  const colors = ["#f5a623", "#34d399", "#60a5fa", "#f87171", "#c084fc", "#fb923c"];
  const particles = React.useMemo(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      dur: 2.5 + Math.random() * 2,
      color: colors[i % colors.length],
      w: 7 + Math.random() * 10,
      rot: Math.random() * 360,
    })), []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 10 }}>
      {particles.map(p => (
        <motion.div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`, top: -16,
          width: p.w, height: p.w * 0.5,
          background: p.color, borderRadius: 2,
        }}
          animate={{ y: ["0vh", "115vh"], rotate: [p.rot, p.rot + 540], opacity: [1, 1, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   END DIALOG
══════════════════════════════════════════════════════════════ */
function EndDialog({
  winner, myId, scores, pipCounts,
  onReplay, onHome,
}: {
  winner: PlayerId | null;
  myId: PlayerId;
  scores: Record<PlayerId, number>;
  pipCounts: Record<PlayerId, number>;
  onReplay: () => void;
  onHome: () => void;
}) {
  const won = winner === myId;
  const isDraw = !winner;

  // تسجيل النتيجة في الـ API
  useEffect(() => {
    if (won) {
      fetch("/api/domino/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: "win", coins: 100, xp: 50 }),
      }).catch(() => {});
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: "absolute", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
      }}
    >
      {won && <VictoryConfetti />}

      <motion.div
        initial={{ scale: 0.72, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.08 }}
        style={{
          width: "100%", maxWidth: 340, borderRadius: 24, overflow: "hidden",
          position: "relative", zIndex: 20,
          background: won
            ? "linear-gradient(160deg,#1c1500,#2b1f00,#0e0e0e)"
            : isDraw
            ? "linear-gradient(160deg,#0a0a0a,#141414)"
            : "linear-gradient(160deg,#0e0e0e,#1c0505)",
          border: `1.5px solid ${won ? "rgba(245,196,66,0.4)" : isDraw ? "rgba(255,255,255,0.1)" : "rgba(255,60,60,0.25)"}`,
          boxShadow: won
            ? "0 0 60px rgba(245,196,66,0.15), 0 30px 60px rgba(0,0,0,0.7)"
            : "0 30px 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* Top glow line */}
        <div style={{
          height: 2,
          background: won
            ? "linear-gradient(90deg,transparent,#f5c842,#fffacd,#f5c842,transparent)"
            : isDraw
            ? "linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)"
            : "linear-gradient(90deg,transparent,#ef4444,transparent)",
        }}/>

        <div style={{ padding: "28px 24px", textAlign: "center" }}>
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 230, damping: 16, delay: 0.28 }}
            style={{ fontSize: 56, marginBottom: 16, display: "inline-block" }}
          >
            {won ? "🏆" : isDraw ? "🤝" : "💀"}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            style={{
              fontSize: "clamp(24px,6vw,32px)", fontWeight: 900, marginBottom: 8,
              color: won ? "#f5c842" : isDraw ? "#fff" : "#ff6060",
              textShadow: won ? "0 0 30px rgba(245,196,66,0.6)" : "none",
            }}
          >
            {won ? "انتصار! 🎉" : isDraw ? "تعادل" : "خسارة"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
            style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}
          >
            {won
              ? "أداء رائع! استمر على هذا المستوى 💪"
              : isDraw
              ? "المباراة انتهت بالتعادل"
              : "المرة القادمة ستكون مختلفة! 🔥"
            }
          </motion.p>

          {/* Rewards (win only) */}
          {won && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}
            >
              {[
                { label: "كوينز", value: "+100", color: "#f5c842" },
                { label: "XP",    value: "+50",  color: "#a78bfa" },
              ].map(r => (
                <div key={r.label} style={{
                  padding: "10px 18px", borderRadius: 16, textAlign: "center",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: r.color }}>{r.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{r.label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}
            style={{ display: "flex", gap: 10 }}
          >
            <button onClick={onHome} style={{
              flex: 1, padding: "12px", borderRadius: 14, fontWeight: 700, fontSize: 13,
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontFamily: "inherit",
            }}>
              الرئيسية
            </button>
            <button onClick={onReplay} style={{
              flex: 1, padding: "12px", borderRadius: 14, fontWeight: 900, fontSize: 14,
              background: won
                ? "linear-gradient(135deg,#f5c842,#e0960a)"
                : "linear-gradient(135deg,#ef4444,#b91c1c)",
              color: won ? "#1a0d00" : "#fff",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              boxShadow: won ? "0 4px 20px rgba(245,196,66,0.4)" : "0 4px 20px rgba(239,68,68,0.3)",
            }}>
              🔄 مجدداً
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ONLINE GAME HOOK — يتعامل مع الـ server بـ polling
══════════════════════════════════════════════════════════════ */
interface OnlineState {
  chain:    Tile[];
  myHand:   Tile[];
  oppCount: number;
  boneyard: number;
  turn:     "a" | "b";
  phase:    "playing" | "ended" | "lobby";
  winner:   "a" | "b" | null;
  timeA:    number;
  timeB:    number;
}

function useOnlineGame(matchId: string, playerId: string, mySide: "a" | "b") {
  const [state,   setState]   = useState<OnlineState | null>(null);
  const [sending, setSending] = useState(false);
  const seqRef  = useRef(0);
  const activeRef = useRef(true);

  // Fetch full state
  const fetchState = useCallback(async () => {
    try {
      const res  = await fetch(`/api/domino/match/${matchId}/state?playerId=${playerId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setState({
        chain:    data.chain    ?? [],
        myHand:   data.myHand   ?? [],
        oppCount: data.oppCount ?? 0,
        boneyard: data.boneyard ?? 0,
        turn:     data.turn     ?? "a",
        phase:    data.phase    ?? "playing",
        winner:   data.winner   ?? null,
        timeA:    data.timeA    ?? 180_000,
        timeB:    data.timeB    ?? 180_000,
      });
    } catch {/* ignore */}
  }, [matchId, playerId]);

  // Poll events
  const pollEvents = useCallback(async () => {
    if (!activeRef.current) return;
    try {
      const res  = await fetch(`/api/domino/match/${matchId}/events?since=${seqRef.current}`, { cache: "no-store" });
      const data = await res.json();
      if (data.events?.length) {
        seqRef.current = data.seq;
        await fetchState(); // حدّث الـ state بعد كل event جديد
      }
    } catch {/* ignore */}
    if (activeRef.current) setTimeout(pollEvents, 1200);
  }, [matchId, fetchState]);

  useEffect(() => {
    activeRef.current = true;
    fetchState();
    const t = setTimeout(pollEvents, 800);
    return () => { activeRef.current = false; clearTimeout(t); };
  }, [fetchState, pollEvents]);

  // Play move
  const playMove = useCallback(async (tile: Tile, side: Side): Promise<boolean> => {
    if (sending) return false;
    setSending(true);
    try {
      const res = await fetch(`/api/domino/match/${matchId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, tile, side }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchState();
        return true;
      }
    } catch {/* ignore */}
    finally { setSending(false); }
    return false;
  }, [matchId, playerId, sending, fetchState]);

  // Draw
  const drawTile = useCallback(async (): Promise<boolean> => {
    if (sending) return false;
    setSending(true);
    try {
      const res = await fetch(`/api/domino/match/${matchId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action: "draw" }),
      });
      await fetchState();
      return true;
    } catch { return false; }
    finally { setSending(false); }
  }, [matchId, playerId, sending, fetchState]);

  // Resign
  const resign = useCallback(async () => {
    await fetch(`/api/domino/match/${matchId}/resign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    await fetchState();
  }, [matchId, playerId, fetchState]);

  const isMyTurn = state?.turn === mySide && state?.phase === "playing";

  return { state, isMyTurn, sending, playMove, drawTile, resign, refetch: fetchState };
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT — DominoBoard
══════════════════════════════════════════════════════════════ */
export interface DominoBoardProps {
  matchId?:         string;
  playerId:         PlayerId;
  initialSide?:     "a" | "b";
  mode?:            "online" | "training";
  onLeave?:         () => void;
  numPlayers?:      2 | 4;
  campaignMapId?:   string;
  campaignLevelId?: string;
  gameType?:        "classic" | "block" | "all_fives";
  difficulty?:      "easy" | "medium" | "hard" | "expert";
}

export default function DominoBoard({
  matchId,
  playerId       = "player",
  initialSide    = "a",
  mode           = "training",
  onLeave,
  numPlayers     = 2,
  campaignMapId,
  campaignLevelId,
  gameType       = "classic",
  difficulty     = "medium",
}: DominoBoardProps) {
  const { equipped } = usePlatformStore();
  const skinFolder = getSkinFolder(equipped?.domino_skin ?? "default_domino");

  /* ── Online mode hook ── */
  const onlineGame = mode === "online" && matchId
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useOnlineGame(matchId, playerId, initialSide)
    : null;

  /* ── Game instance (training only) ── */
  const gameRef = useRef<DominoGame | null>(null);

  /* ── UI State ── */
  const [chain,      setChain]      = useState<Tile[]>([]);
  const [myHand,     setMyHand]     = useState<Tile[]>([]);
  const [oppCounts,  setOppCounts]  = useState<Record<PlayerId, number>>({});
  const [boneyard,   setBoneyard]   = useState(0);
  const [turn,       setTurn]       = useState<PlayerId>("player");
  const [selected,   setSelected]   = useState<Tile | null>(null);
  const [endInfo,    setEndInfo]     = useState<{ winner: PlayerId | null; scores: Record<string,number>; pipCounts: Record<string,number> } | null>(null);
  const [botThinking,setBotThinking] = useState(false);
  const [missionModal,  setMissionModal]   = useState(false);
  const [drawFeedback,   setDrawFeedback]   = useState<string | null>(null);
  const [campaignResult, setCampaignResult] = useState<{ passed: boolean; reason: string } | null>(null);
  const didDrawRef = useRef(false); // tracking لو اللاعب سحب في المباراة

  /* ── Campaign ── */
  const campaignMap   = campaignMapId   ? CAMPAIGN_MAPS.find(m => m.id === campaignMapId) : undefined;
  const campaignLevel = campaignLevelId && campaignMap ? campaignMap.levels.find(l => l.id === campaignLevelId) : undefined;

  useEffect(() => {
    if (campaignLevel) setMissionModal(true);
  }, [campaignLevel]);

  /* ── Sync state from game ── */
  const sync = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;

    setChain([...g.chain]);
    setMyHand([...g.hands[playerId] ?? []]);
    setBoneyard(g.boneyard.length);
    setTurn(g.turn);

    const counts: Record<PlayerId, number> = {};
    for (const p of g.players) {
      if (p !== playerId) counts[p] = g.hands[p]?.length ?? 0;
    }
    setOppCounts(counts);

    if (g.phase === "ended") {
      const st = g.status();
      setEndInfo({ winner: g.winner, scores: st.scores, pipCounts: st.pipCounts });

      // Campaign win condition check
      if (campaignLevel) {
        const snap: GameSnapshot = {
          winner:     g.winner,
          totalTurns: g.totalTurns,
          playerPips: st.pipCounts[playerId] ?? 0,
          didDraw:    didDrawRef.current,
        };
        const result = checkWinCondition(campaignLevel.winCondition, snap);
        setCampaignResult(result);

        // لو فاز — أعطه المكافآت
        if (result.passed) {
          fetch("/api/domino/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              result:  "win",
              coins:   campaignLevel.rewards.coins,
              xp:      campaignLevel.rewards.xp,
            }),
          }).catch(() => {});
        }
      }
    }
  }, [playerId]);

  /* ── Run all bots until it's player's turn ── */
  const runBots = useCallback(async () => {
    const g = gameRef.current;
    if (!g || g.phase !== "playing") return;

    while (g.phase === "playing" && g.isBot(g.turn)) {
      setBotThinking(true);
      await new Promise(r => setTimeout(r, 650 + Math.random() * 400));
      g.playAI();
      sync();
    }
    setBotThinking(false);
  }, [sync]);

  /* ── Start / Restart game ── */
  const startGame = useCallback(() => {
    const np = numPlayers;
    const diff = campaignLevel?.opponentDifficulty ?? difficulty;
    const gt   = gameType;

    const g = new DominoGame(np, diff, gt);
    g.deal(7);
    gameRef.current = g;
    setSelected(null);
    setEndInfo(null);
    setCampaignResult(null);
    didDrawRef.current = false;
    sync();

    // لو البداية مش للـ player — شغّل bots
    if (g.isBot(g.turn)) {
      setTimeout(() => runBots(), 400);
    }
  }, [numPlayers, difficulty, gameType, campaignLevel, sync, runBots]);

  useEffect(() => {
    if (mode === "training" && !missionModal) {
      startGame();
    }
  }, [mode, missionModal, startGame]);

  /* ── Online vs Training sources ── */
  // لو online — كل حاجة بتيجي من الـ server
  // لو training — بتيجي من الـ local game
  const displayChain    = mode === "online" ? (onlineGame?.state?.chain   ?? chain)    : chain;
  const displayMyHand   = mode === "online" ? (onlineGame?.state?.myHand  ?? myHand)   : myHand;
  const displayOppCounts= mode === "online"
    ? { opp: onlineGame?.state?.oppCount ?? 0 }
    : oppCounts;
  const displayBoneyard = mode === "online" ? (onlineGame?.state?.boneyard ?? boneyard) : boneyard;
  const onlinePhase     = onlineGame?.state?.phase;
  const onlineWinner    = onlineGame?.state?.winner;

  // دوري: online حسب الـ side / training حسب playerId
  const isMyTurnOnline  = mode === "online" ? (onlineGame?.isMyTurn ?? false) : false;

  /* ── Valid moves for player ── */
  const validMoves = React.useMemo(() => {
    if (mode === "online") {
      // للـ online — نحسب من الـ hand الحالي والـ chain
      if (!onlineGame?.isMyTurn || !displayMyHand.length) return [];
      const tmpGame = new DominoGame();
      tmpGame.chain   = [...displayChain];
      tmpGame.players = [playerId];
      tmpGame.hands   = { [playerId]: [...displayMyHand] };
      tmpGame.phase   = "playing";
      return tmpGame.getValidMoves(playerId);
    }
    if (!gameRef.current || turn !== playerId) return [];
    return gameRef.current.getValidMoves(playerId);
  }, [mode, onlineGame?.isMyTurn, turn, playerId, displayChain, displayMyHand, chain]);

  function isPlayable(t: Tile): boolean {
    return validMoves.some(m => m.tile.a === t.a && m.tile.b === t.b);
  }

  function canGoLeft(t: Tile): boolean {
    return validMoves.some(m => m.tile.a === t.a && m.tile.b === t.b && m.side === "left");
  }
  function canGoRight(t: Tile): boolean {
    return validMoves.some(m => m.tile.a === t.a && m.tile.b === t.b && m.side === "right");
  }

  /* ── Place tile ── */
  async function placeTile(t: Tile, side: Side) {
    if (mode === "online") {
      const ok = await onlineGame?.playMove(t, side);
      if (ok) setSelected(null);
      return;
    }
    const g = gameRef.current;
    if (!g || turn !== playerId) return;
    const ok = g.play(playerId, t, side);
    if (ok) {
      setSelected(null);
      sync();
      if (g.phase === "playing" && g.isBot(g.turn)) {
        setTimeout(() => runBots(), 80);
      }
    }
  }

  /* ── Click tile in hand ── */
  function clickTile(t: Tile) {
    const myTurn = mode === "online" ? isMyTurnOnline : (turn === playerId);
    if (!myTurn || !isPlayable(t)) return;

    const isSame = selected && selected.a === t.a && selected.b === t.b;

    if (isSame) {
      const l = canGoLeft(t);
      const r = canGoRight(t);
      if (l && !r) { placeTile(t, "left");  return; }
      if (!l && r) { placeTile(t, "right"); return; }
      setSelected(null);
    } else {
      setSelected({ ...t });
    }
  }

  /* ── Draw ── */
  async function handleDraw() {
    if (mode === "online") {
      await onlineGame?.drawTile();
      return;
    }
    const g = gameRef.current;
    if (!g || turn !== playerId || gameType === "block") return;
    if (!g.boneyard.length) return;
    g.draw(playerId);
    didDrawRef.current = true; // track draw for campaign
    sync();
    if (!g.hasValidMove(playerId)) {
      setDrawFeedback("مازالت مفيش حركة — اسحب مجدداً أو مرّر");
    } else {
      setDrawFeedback("✓ قطعة جديدة في يدك!");
    }
    setTimeout(() => setDrawFeedback(null), 2500);
  }

  /* ── Pass ── */
  function handlePass() {
    const g = gameRef.current;
    if (!g || turn !== playerId) return;
    const ok = g.pass(playerId);
    if (ok) {
      sync();
      setTimeout(() => runBots(), 80);
    }
  }

  /* ── Online end detection ── */
  useEffect(() => {
    if (mode !== "online") return;
    if (onlinePhase === "ended" && onlineWinner !== undefined && !endInfo) {
      const scores: Record<string, number> = {};
      const pipCounts: Record<string, number> = {};
      const winnerPlayerId = onlineWinner === initialSide ? playerId : "opponent";
      setEndInfo({ winner: winnerPlayerId as PlayerId, scores, pipCounts });
    }
  }, [mode, onlinePhase, onlineWinner, endInfo, initialSide, playerId]);

  /* ── Computed ── */
  const isMyTurn  = mode === "online" ? isMyTurnOnline : (turn === playerId && gameRef.current?.phase === "playing");
  const hasMove   = isMyTurn && validMoves.length > 0;
  const canDraw   = isMyTurn && !hasMove && displayBoneyard > 0 && gameType !== "block";
  const canPass   = isMyTurn && !hasMove && displayBoneyard === 0;
  const norm      = normalizeChain(displayChain);
  const opponents = mode === "online"
    ? ["opponent"]
    : (gameRef.current?.players.filter(p => p !== playerId) ?? []);

  function getOppPosition(p: PlayerId, opps: PlayerId[]): "top" | "left" | "right" {
    if (opps.length === 1) return "top";
    const idx = opps.indexOf(p);
    return idx === 0 ? "right" : idx === 1 ? "top" : "left";
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column",
      overflow: "hidden", userSelect: "none",
      fontFamily: "var(--font-cairo), sans-serif",
      touchAction: "manipulation",
    }}>
      <style>{`
        @keyframes pulse-dot {
          0%,100%{ box-shadow:0 0 0 0 rgba(34,197,94,.6); }
          50%    { box-shadow:0 0 0 5px rgba(34,197,94,0); }
        }
        @keyframes bot-think {
          0%,100%{ opacity:.3; } 50%{ opacity:1; }
        }
      `}</style>

      {/* ── TABLE BACKGROUND ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        {/* قاعدة داكنة */}
        <div style={{ position: "absolute", inset: 0, background: "#07090f" }}/>
        {/* توهج مركزي */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 90% 70% at 50% 48%, #1a1030 0%, #0e0b1a 45%, #07090f 100%)" }}/>
        {/* شبكة hex خفيفة */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49'%3E%3Cpath d='M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z' fill='none' stroke='%23a78bfa' stroke-width='0.8'/%3E%3C/svg%3E")`,
          backgroundSize: "28px 49px",
        }}/>
        {/* سطح الطاولة الداخلي */}
        <div style={{
          position: "absolute", inset: "12px 12px",
          borderRadius: 28,
          background: "radial-gradient(ellipse 120% 100% at 50% 50%, #1e1535 0%, #140f28 40%, #0d0a1e 100%)",
          border: "1.5px solid rgba(124,58,237,0.18)",
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.1)",
        }}/>
        {/* Vignettes */}
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: 100, background: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)", zIndex: 5 }}/>
        <div style={{ position: "absolute", inset: "auto 0 0 0", height: 280, background: "linear-gradient(to top, rgba(4,4,10,0.99) 0%, rgba(6,8,15,0.88) 40%, transparent 100%)", zIndex: 5 }}/>
      </div>

      {/* ── TOP BAR ── */}
      <header style={{
        position: "relative", zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px clamp(12px,3vw,20px) 8px",
        gap: 10,
      }}>
        {/* Back */}
        <a
          href={campaignMap ? "/games/domino/campaign" : "/games/domino/online"}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 14,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 800,
            textDecoration: "none", backdropFilter: "blur(16px)",
          }}
        >
          ← رجوع
        </a>

        {/* Game type badge */}
        <div style={{
          padding: "5px 14px", borderRadius: 14,
          fontSize: 11, fontWeight: 900,
          background: "rgba(52,211,153,0.12)",
          border: "1px solid rgba(52,211,153,0.25)",
          color: "#34d399",
        }}>
          {gameType === "classic" ? "⚡ كلاسيك" : gameType === "block" ? "🔒 بلوك" : "⭐ الأخماس"}
        </div>

        {/* Boneyard count */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 14px", borderRadius: 14,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(16px)",
        }}>
          <span style={{ fontSize: 14, opacity: 0.6 }}>🁣</span>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>مستودع</div>
            <div style={{ fontWeight: 900, fontSize: 14, color: "#f5a623", lineHeight: 1 }}>{displayBoneyard}</div>
          </div>
        </div>
      </header>

      {/* ── OPPONENTS ── */}
      {opponents.map(p => (
        <OpponentBadge
          key={p}
          id={p}
          count={mode === "online"
            ? (onlineGame?.state?.oppCount ?? 0)
            : (oppCounts[p] ?? 0)
          }
          isTurn={mode === "online" ? !isMyTurnOnline : turn === p}
          skinFolder={skinFolder}
          position={getOppPosition(p, opponents)}
        />
      ))}

      {/* Bot thinking indicator */}
      {botThinking && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 25, pointerEvents: "none",
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 12,
          background: "rgba(2,3,16,0.8)",
          border: "1px solid rgba(0,212,255,0.15)",
          backdropFilter: "blur(16px)",
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#00d4ff",
              animation: `bot-think 1s ease-in-out ${i * 0.2}s infinite`,
            }}/>
          ))}
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(0,212,255,0.7)" }}>
            يفكر...
          </span>
        </div>
      )}

      {/* ── CHAIN BOARD ── */}
      <div style={{
        position: "absolute", zIndex: 10,
        inset: 0,
        top: 60, bottom: 160,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Side placement buttons */}
        <AnimatePresence>
          {selected && chain.length > 0 && (
            <>
              {canGoLeft(selected) && (
                <motion.button
                  key="btn-left"
                  initial={{ opacity: 0, scale: 0.6, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  onClick={() => placeTile(selected, "left")}
                  style={{
                    position: "absolute", right: 10, zIndex: 30,
                    width: 52, height: 52, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900,
                    background: "rgba(52,211,153,0.15)",
                    border: "2px solid #34d399",
                    color: "#34d399",
                    boxShadow: "0 0 24px rgba(52,211,153,0.4)",
                    cursor: "pointer",
                  }}
                >←</motion.button>
              )}
              {canGoRight(selected) && (
                <motion.button
                  key="btn-right"
                  initial={{ opacity: 0, scale: 0.6, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  onClick={() => placeTile(selected, "right")}
                  style={{
                    position: "absolute", left: 10, zIndex: 30,
                    width: 52, height: 52, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900,
                    background: "rgba(52,211,153,0.15)",
                    border: "2px solid #34d399",
                    color: "#34d399",
                    boxShadow: "0 0 24px rgba(52,211,153,0.4)",
                    cursor: "pointer",
                  }}
                >→</motion.button>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Empty chain hint */}
        {!chain.length && (
          <motion.p
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ fontSize: 13, fontWeight: 800, color: "rgba(245,166,35,0.5)", letterSpacing: "0.05em" }}
          >
            {isMyTurn ? "✦ ابدأ بوضع أول قطعة ✦" : "✦ انتظر دور خصمك ✦"}
          </motion.p>
        )}

        {/* Chain tiles */}
        <div
          className="hide-scrollbar"
          style={{
            display: "flex", flexDirection: "row", alignItems: "center",
            overflowX: "auto", padding: "8px 60px",
            gap: 3, maxWidth: "100%", direction: "ltr",
          }}
        >
          <AnimatePresence mode="popLayout">
            {norm.map((t, i) => (
              <motion.div
                key={`chain-${i}-${t.a}-${t.b}`}
                initial={{ scale: 0, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width:  t.isDouble ? 42 : 84,
                  height: t.isDouble ? 84 : 42,
                }}
              >
                <DominoTile
                  a={t.a} b={t.b}
                  vertical={t.isDouble}
                  w={t.isDouble ? 42 : 84}
                  h={t.isDouble ? 84 : 42}
                  skinFolder={skinFolder}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── PLAYER HAND (bottom) ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {/* Controls row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 clamp(12px,3vw,20px) 10px",
          gap: 10,
        }}>
          {/* Player badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.div
              animate={isMyTurn ? { boxShadow: "0 0 16px rgba(52,211,153,0.6)" } : { boxShadow: "none" }}
              style={{
                width: 38, height: 38, borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                background: isMyTurn ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)",
                border: `2px solid ${isMyTurn ? "#34d399" : "rgba(255,255,255,0.1)"}`,
                transition: "all .3s",
              }}
            >🧑</motion.div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 12, color: isMyTurn ? "#fff" : "rgba(255,255,255,0.55)" }}>أنت</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>{displayMyHand.length} قطعة</div>
            </div>
          </div>

          {/* Turn indicator */}
          <AnimatePresence mode="wait">
            {isMyTurn ? (
              <motion.div key="my-turn"
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                style={{
                  padding: "6px 16px", borderRadius: 12, fontSize: 12, fontWeight: 900,
                  background: "linear-gradient(135deg,#34d399,#059669)",
                  color: "#fff", boxShadow: "0 4px 20px rgba(52,211,153,0.4)",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", animation: "pulse-dot .8s ease-in-out infinite" }}/>
                دورك!
              </motion.div>
            ) : (
              <motion.div key="waiting"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  padding: "6px 16px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.3)",
                }}
              >⏳ انتظر...</motion.div>
            )}
          </AnimatePresence>

          {/* Draw / Pass buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {canDraw && (
              <motion.button
                onClick={handleDraw}
                whileTap={{ scale: 0.92 }}
                style={{
                  padding: "7px 14px", borderRadius: 12, fontSize: 11, fontWeight: 900,
                  background: "rgba(245,166,35,0.18)",
                  border: "1px solid rgba(245,166,35,0.4)",
                  color: "#f5c842", cursor: "pointer", fontFamily: "inherit",
                }}
              >سحب ({boneyard})</motion.button>
            )}
            {canPass && (
              <motion.button
                onClick={handlePass}
                whileTap={{ scale: 0.92 }}
                style={{
                  padding: "7px 14px", borderRadius: 12, fontSize: 11, fontWeight: 900,
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  color: "#f87171", cursor: "pointer", fontFamily: "inherit",
                }}
              >تمرير ⏭</motion.button>
            )}
          </div>
        </div>

        {/* Draw feedback */}
        <AnimatePresence>
          {drawFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                textAlign: "center", fontSize: 11, fontWeight: 800,
                color: "#34d399", marginBottom: 6,
              }}
            >{drawFeedback}</motion.div>
          )}
        </AnimatePresence>

        {/* Hand tiles */}
        <div
          className="hide-scrollbar"
          style={{
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            gap: "clamp(4px,1.5vw,8px)",
            padding: "4px clamp(8px,2vw,16px) clamp(12px,2vh,20px)",
            overflowX: "auto", minHeight: 100,
            direction: "ltr",
          }}
        >
          <AnimatePresence>
            {displayMyHand.map((t, i) => {
              const play   = isPlayable(t);
              const isSel  = !!(selected && selected.a === t.a && selected.b === t.b);
              return (
                <motion.div
                  key={`hand-${i}-${t.a}-${t.b}`}
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28, delay: i * 0.02 }}
                  style={{ flexShrink: 0 }}
                >
                  <DominoTile
                    a={t.a} b={t.b}
                    vertical
                    selected={isSel}
                    playable={isMyTurn && play && !isSel}
                    disabled={!isMyTurn || !play}
                    onClick={() => clickTile(t)}
                    skinFolder={skinFolder}
                    w={42} h={84}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {myHand.length === 0 && (
            <div style={{ padding: 24, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.15)" }}>—</div>
          )}
        </div>

        {/* Hint text */}
        <div style={{ textAlign: "center", height: 18, marginBottom: 4 }}>
          {isMyTurn && !selected && hasMove && (
            <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.22)" }}>
              ✔ اضغط على قطعة لاختيارها
            </p>
          )}
          {selected && (
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.3, repeat: Infinity }}
              style={{ fontSize: 10, fontWeight: 800, color: "#34d399" }}
            >
              {canGoLeft(selected) && canGoRight(selected)
                ? "↔ اختر الجانب (←) أو (→) أو اضغط مجدداً للإلغاء"
                : "▶ اضغط مجدداً للوضع"
              }
            </motion.p>
          )}
          {isMyTurn && !hasMove && !canDraw && !canPass && (
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(245,166,35,0.6)" }}>
              مفيش حركة متاحة
            </p>
          )}
        </div>
      </div>

      {/* ── CAMPAIGN MISSION MODAL ── */}
      <AnimatePresence>
        {campaignLevel && missionModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0, zIndex: 50,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16,
              background: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 28 }} animate={{ scale: 1, y: 0 }}
              style={{
                width: "100%", maxWidth: 360, borderRadius: 24, padding: "32px 24px", textAlign: "center",
                background: "#111",
                border: "1.5px solid rgba(245,196,66,0.3)",
                boxShadow: "0 0 60px rgba(245,196,66,0.1)",
              }}
            >
              <div style={{ fontSize: 52, marginBottom: 16 }}>🏆</div>
              <h2 style={{ fontWeight: 900, fontSize: 22, color: "#fff", marginBottom: 8 }}>
                {campaignLevel.title}
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>
                {campaignLevel.description}
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: "#f5a623" }}>🪙 {campaignLevel.rewards.coins}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>كوينز</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: "#a78bfa" }}>⭐ {campaignLevel.rewards.xp}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>XP</div>
                </div>
              </div>
              <button
                onClick={() => { setMissionModal(false); startGame(); }}
                style={{
                  width: "100%", padding: "14px", borderRadius: 16, fontWeight: 900, fontSize: 15,
                  background: "linear-gradient(135deg,#f5c842,#e0960a)",
                  color: "#1a0d00", border: "none", cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 8px 28px rgba(245,196,66,0.4)",
                }}
              >ابدأ التحدي ⚡</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── END GAME DIALOG ── */}
      <AnimatePresence>
        {endInfo && (
          <EndDialog
            winner={endInfo.winner}
            myId={playerId}
            scores={endInfo.scores}
            pipCounts={endInfo.pipCounts}
            onReplay={() => {
              setEndInfo(null);
              setChain([]);
              setMyHand([]);
              setSelected(null);
              if (campaignLevel) setMissionModal(true);
              else startGame();
            }}
            onHome={() => {
              window.location.href = campaignMap
                ? "/games/domino/campaign"
                : "/games/domino/online";
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
