"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LudoGame } from "@/lib/ludo/game";
import type { Color, PlayerId } from "@/lib/ludo/game";

/* ═══════════════════════════════════════════════════════════════
   LUDO BOARD — نسخة محلية كاملة مع AI
═══════════════════════════════════════════════════════════════ */

const COLOR_STYLES: Record<Color, { bg: string; light: string; text: string; border: string }> = {
  red:    { bg: "#dc2626", light: "#fca5a5", text: "#fff", border: "#991b1b" },
  yellow: { bg: "#d97706", light: "#fcd34d", text: "#000", border: "#92400e" },
  green:  { bg: "#16a34a", light: "#86efac", text: "#fff", border: "#166534" },
  blue:   { bg: "#2563eb", light: "#93c5fd", text: "#fff", border: "#1e40af" },
};

const PLAYER_LABELS: Record<string, string> = {
  player: "أنت 🧑",
  ai1:    "Bot 1 🤖",
  ai2:    "Bot 2 🤖",
  ai3:    "Bot 3 🤖",
};

const PLAYER_COLORS: Record<string, Color> = {
  player: "red",
  ai1:    "yellow",
  ai2:    "green",
  ai3:    "blue",
};

// مواقع المربعات (15×15 grid، 0-indexed) — col, row
const TRACK: [number, number][] = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0],
];

const HOME_TRACK: Record<Color, [number, number][]> = {
  red:    [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  yellow: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  green:  [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
};

// مواقع قاعدة كل لون (4 مواقع للبيدق)
const YARD_POS: Record<Color, [number, number][]> = {
  red:    [[2,2],[3,2],[2,3],[3,3]],
  yellow: [[11,2],[12,2],[11,3],[12,3]],
  green:  [[2,11],[3,11],[2,12],[3,12]],
  blue:   [[11,11],[12,11],[11,12],[12,12]],
};

// مجموعة مربعات المسار كـ Set للبحث السريع
const TRACK_SET = new Set(TRACK.map(([c, r]) => `${c},${r}`));
const HOME_TRACK_SET = new Set(
  (Object.values(HOME_TRACK) as [number,number][][]).flat().map(([c,r]) => `${c},${r}`)
);

export default function LudoBoardOnline2D({ initialMatchId, botThinkMs = 2000 }: { initialMatchId?: string; botThinkMs?: number }) {
  const gameRef = useRef<LudoGame>(new LudoGame());
  const [tick, setTick] = useState(0);
  const [phase, setPhase] = useState<"home" | "game" | "ended">("home");
  const [diceVal, setDiceVal] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [validTokens, setValidTokens] = useState<number[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [aiThinking, setAiThinking] = useState(false);
  const [animatingToken, setAnimatingToken] = useState<{pid:string;ti:number;path:[number,number][]}|null>(null);
  const aiRunningRef = useRef(false);
  const animatingRef = useRef(false);

  const g = gameRef.current;

  const sync = useCallback(() => setTick(t => t + 1), []);

  function showMsg(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 2000);
  }

  function countYard(pid: PlayerId) {
    return gameRef.current.tokens[pid].filter(t => t.pos.kind === "yard").length;
  }

  function calcValidMoves(_: number): number[] {
    const legal = g.legalMoves("player");
    return Array.from(new Set(legal.map(m => m.idx)));
  }

  async function roll() {
    if (rolling || aiThinking) return;
    if (g.turn !== "player") return;
    if (diceVal !== null) return;
    setRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      setDiceVal(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        const final = g.roll();
        setDiceVal(final);
        setRolling(false);

        const moves = calcValidMoves(final);
        setValidTokens(moves);

        if (moves.length === 0) {
          showMsg(`🎲 ${final} — مفيش حركة!`);
          setTimeout(() => {
            g.passTurn();
            setDiceVal(null);
            setValidTokens([]);
            sync();
            runAI();
          }, 1000);
        } else if (moves.length === 1) {
          setTimeout(() => moveToken(moves[0]), 400);
        }
      }
    }, 60);
  }

  function nextPlayer(current: string): string {
    const order = ["player", "ai1", "ai2", "ai3"];
    const idx = order.indexOf(current);
    return order[(idx + 1) % 4];
  }

  function eatOpponents(pid: string, trackIdx: number) {
    const SAFE = [0,8,13,21,26,34,39,47];
    if (SAFE.includes(trackIdx)) return;
    (["player","ai1","ai2","ai3"] as string[]).forEach(opp => {
      if (opp === pid) return;
      const oppTokens = (g.tokens as any)[opp] as any[];
      oppTokens.forEach((tk: any) => {
        if (tk.pos.kind === "track" && tk.pos.index === trackIdx) {
          tk.pos = { kind: "yard" };
          showMsg(`🍽️ ${PLAYER_LABELS[pid]} أكل بيدق ${PLAYER_LABELS[opp]}!`);
        }
      });
    });
  }

  function buildPath(startIdx: number, steps: number, color: Color): [number,number][] {
    const path: [number,number][] = [];
    for (let s = 1; s <= steps; s++) {
      const nextIdx = startIdx + s;
      if (nextIdx >= 52) {
        const homeSteps = nextIdx - 51;
        const ht = HOME_TRACK[color];
        if (homeSteps - 1 < ht.length) path.push(ht[homeSteps - 1]);
      } else {
        path.push(TRACK[nextIdx]);
      }
    }
    return path.filter(Boolean);
  }

  async function animateMoveToken(pid: string, ti: number, d: number): Promise<void> {
    const gCur = gameRef.current;
    const token = (gCur.tokens as any)[pid][ti] as any;
    const color = PLAYER_COLORS[pid] as Color;

    // حركة من الـ yard للمسار عند 6
    if (token.pos.kind === "yard" && d === 6) {
      const startPos = ({ player:0, ai1:13, ai2:26, ai3:39 } as any)[pid] ?? 0;
      token.pos = { kind: "track", index: startPos };
      eatOpponents(pid, startPos);
      sync();
      await new Promise(r => setTimeout(r, 80));
      return;
    }

    // حركة على المسار — block by block
    if (token.pos.kind === "track") {
      const startIdx = token.pos.index;
      const ENTRY_MAP: Record<string, number> = { player: 51, ai1: 12, ai2: 25, ai3: 38 };
      const entryIdx = ENTRY_MAP[pid] ?? 51;
      const distToEntry = (entryIdx - startIdx + 52) % 52;

      for (let step = 1; step <= d; step++) {
        if (step <= distToEntry) {
          // ما زلنا على المسار الرئيسي
          const nextIdx = (startIdx + step) % 52;
          token.pos = { kind: "track", index: nextIdx };
        } else {
          // دخلنا مسار البيت
          const homeStep = step - distToEntry;
          token.pos = { kind: "home", count: homeStep };
        }
        sync();
        await new Promise(r => setTimeout(r, 130));
      }

      if (token.pos.kind === "track") {
        eatOpponents(pid, token.pos.index);
      }
      setAnimatingToken(null);
      return;
    }

    // حركة داخل مسار البيت — block by block
    if (token.pos.kind === "home") {
      const startCount = token.pos.count;
      for (let step = 1; step <= d; step++) {
        const newCount = startCount + step;
        if (newCount > 6) break;
        token.pos = { kind: "home", count: newCount };
        sync();
        await new Promise(r => setTimeout(r, 130));
      }
    }
  }

  function moveToken(tokenIdx: number) {
    if (animatingRef.current) return;
    const gCur = gameRef.current;
    const d = gCur.dice;
    if (!d) return;

    const beforePlayerTurn = gCur.turn;
    const beforeYard = {
      ai1: countYard("ai1"),
      ai2: countYard("ai2"),
      ai3: countYard("ai3"),
    };

    // حفظ state البيدق قبل الحركة عشان الأنيميشن يبدأ منه
    const tokenBefore = JSON.parse(JSON.stringify((gCur.tokens as any)["player"][tokenIdx]));

    // تنفيذ الحركة في المنطق (يحرك البيدق فوراً في الـ game state)
    const moved = gCur.move("player", tokenIdx);
    if (!moved) return;

    const afterTurn = gCur.turn;
    const ate = countYard("ai1") > beforeYard.ai1 || countYard("ai2") > beforeYard.ai2 || countYard("ai3") > beforeYard.ai3;
    const ended = gCur.status().ended;
    const bonusTurn = d === 6 && afterTurn === beforePlayerTurn;

    setDiceVal(null);
    setValidTokens([]);

    // استرجاع state البيدق للأنيميشن (نرجعه لمكانه الأصلي ونعمل الأنيميشن)
    const tokenForAnim = (gCur.tokens as any)["player"][tokenIdx];
    const finalPos = { ...tokenForAnim.pos };
    tokenForAnim.pos = tokenBefore.pos; // نرجعه مؤقتاً
    sync();

    animatingRef.current = true;
    animateMoveToken("player", tokenIdx, d).then(() => {
      // تأكد إن البيدق وصل للمكان الصح
      tokenForAnim.pos = finalPos;
      animatingRef.current = false;
      sync();

      if (ate) showMsg("🍽️ أكلت بيدق خصم!");

      if (ended) {
        setWinner(gCur.status().winner ?? "player");
        setPhase("ended");
        return;
      }
      if (bonusTurn) {
        showMsg("🎲 6! ارمي مرة تانية!");
        return;
      }
      if (gCur.turn !== "player") runAI();
    });
  }

  const runAI = useCallback(async () => {
    if (aiRunningRef.current) return;
    aiRunningRef.current = true;

    let safety = 0;
    while (gameRef.current.turn !== "player" && safety < 20) {
      safety++;
      const gCur = gameRef.current;
      const player = gCur.turn as string;
      setAiThinking(true);

      await new Promise(r => setTimeout(r, botThinkMs + Math.random() * 400));

      const d = gCur.roll();
      setDiceVal(d);

      await new Promise(r => setTimeout(r, 300));
      const playerYardBefore = countYard("player");
      gCur.aiPlay();

      if (countYard("player") > playerYardBefore) {
        showMsg(`💥 ${PLAYER_LABELS[player]} أكل بيدقك!`);
      }

      const st = gCur.status();
      if (st.ended) {
        setWinner(st.winner ?? player);
        setPhase("ended");
        aiRunningRef.current = false;
        setAiThinking(false);
        setDiceVal(null);
        setTick(t => t + 1);
        return;
      }

      setDiceVal(null);
      setTick(t => t + 1);
      await new Promise(r => setTimeout(r, 200));
    }

    aiRunningRef.current = false;
    setAiThinking(false);
  }, []);

  function startGame() {
    gameRef.current = new LudoGame();
    setDiceVal(null);
    setValidTokens([]);
    setWinner(null);
    setPhase("game");
    aiRunningRef.current = false;
    sync();
  }

  function getTokenPos(pid: string, tokenIdx: number): [number, number] | null {
    const g = gameRef.current;
    const color = PLAYER_COLORS[pid] ?? "red";
    const token = (g.tokens as any)[pid]?.[tokenIdx];
    if (!token) return null;

    if (token.pos.kind === "yard") {
      return YARD_POS[color][tokenIdx] ?? null;
    } else if (token.pos.kind === "track") {
      const idx = (token.pos.index) % 52;
      return TRACK[idx] ?? null;
    } else if (token.pos.kind === "home") {
      const hTrack = HOME_TRACK[color];
      const cnt = Math.min(5, token.pos.count);
      return hTrack[cnt] ?? null;
    }
    return null;
  }

  if (phase === "home") {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "linear-gradient(160deg,#0a0a1a,#0f172a)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-cairo),sans-serif", color: "#f4f4f8", padding: 20,
      }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎲</div>
        <h1 style={{ fontWeight: 900, fontSize: "clamp(28px,6vw,42px)", marginBottom: 8, textAlign: "center" }}>
          لودو ماستر
        </h1>
        <p style={{ color: "#7a7a8a", fontSize: 14, marginBottom: 32, textAlign: "center" }}>
          العب ضد 3 بوتات بالذكاء الاصطناعي
        </p>

        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          {(["red", "yellow", "green", "blue"] as Color[]).map(c => (
            <div key={c} style={{
              width: 44, height: 44, borderRadius: 12,
              background: COLOR_STYLES[c].bg,
              border: `3px solid ${COLOR_STYLES[c].border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>
              {c === "red" ? "🐉" : c === "yellow" ? "🦅" : c === "green" ? "🦄" : "🦁"}
            </div>
          ))}
        </div>

        <button onClick={startGame} style={{
          padding: "14px 40px", borderRadius: 16, border: "none",
          background: "linear-gradient(135deg,#06b6d4,#0891b2)",
          color: "#fff", fontWeight: 900, fontSize: 18,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 8px 30px rgba(6,182,212,0.4)",
        }}>
          ابدأ اللعبة ▶
        </button>
      </div>
    );
  }

  if (phase === "ended") {
    const wColor = winner ? PLAYER_COLORS[winner] : "red";
    const isPlayerWin = winner === "player";
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-cairo),sans-serif",
      }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{
            background: "#111", borderRadius: 24, padding: "32px 28px", textAlign: "center",
            border: `2px solid ${COLOR_STYLES[wColor].bg}50`,
            maxWidth: 320, width: "90%",
          }}
        >
          <div style={{ fontSize: 60, marginBottom: 12 }}>{isPlayerWin ? "🏆" : "💀"}</div>
          <h2 style={{ fontWeight: 900, fontSize: 24, color: COLOR_STYLES[wColor].bg, marginBottom: 8 }}>
            {isPlayerWin ? "فزت!" : `فاز ${PLAYER_LABELS[winner ?? "ai1"]}`}
          </h2>
          <p style={{ color: "#7a7a8a", fontSize: 13, marginBottom: 24 }}>
            {isPlayerWin ? "أداء رائع! 🎉" : "حاول مرة أخرى 💪"}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setPhase("home")} style={{
              flex: 1, padding: 12, borderRadius: 12,
              background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontFamily: "inherit",
            }}>الرئيسية</button>
            <button onClick={startGame} style={{
              flex: 1, padding: 12, borderRadius: 12, border: "none",
              background: "linear-gradient(135deg,#06b6d4,#0891b2)",
              color: "#fff", fontWeight: 900, cursor: "pointer", fontFamily: "inherit",
            }}>مجدداً 🔄</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── GAME ──
  const currentTurn = g.turn as string;
  const isMyTurn = currentTurn === "player";
  const canRoll = isMyTurn && diceVal === null && !rolling && !aiThinking;

  // ─── حساب ألوان خلايا المسار لتحديد نقاط البداية ───
  const TRACK_COLORS: Record<number, string> = {
    0:  "#dc2626", // red start
    13: "#d97706", // yellow start
    26: "#2563eb", // blue start
    39: "#16a34a", // green start
  };
  const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#0a0a14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-cairo),sans-serif", userSelect: "none",
      padding: "clamp(8px,2vw,16px)",
      gap: "clamp(8px,2vh,16px)",
    }}>
      {/* Top bar */}
      <div style={{
        width: "100%", maxWidth: 520,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8,
      }}>
        <a href="/" style={{
          padding: "6px 14px", borderRadius: 10,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700,
          textDecoration: "none",
        }}>← رجوع</a>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 10,
          background: `${COLOR_STYLES[PLAYER_COLORS[currentTurn] ?? "red"].bg}20`,
          border: `1px solid ${COLOR_STYLES[PLAYER_COLORS[currentTurn] ?? "red"].bg}40`,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: COLOR_STYLES[PLAYER_COLORS[currentTurn] ?? "red"].bg,
            animation: "pulse .8s ease-in-out infinite",
          }}/>
          <span style={{ fontWeight: 800, fontSize: 12, color: "#f4f4f8" }}>
            {aiThinking ? "🤔 يفكر..." : `${PLAYER_LABELS[currentTurn] ?? currentTurn}`}
          </span>
        </div>

        <button onClick={() => setPhase("home")} style={{
          padding: "6px 12px", borderRadius: 10,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>إنهاء</button>
      </div>

      {/* البورد */}
      <div style={{
        width: `clamp(300px, min(96vw, calc(100dvh - 160px)), 540px)`,
        aspectRatio: "1",
        position: "relative",
        borderRadius: 12,
        border: "3px solid #e2d5ca",
        overflow: "hidden",
        flexShrink: 0,
        background: "#fff",
      }}>
        <svg
          viewBox="0 0 15 15"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0.05" dy="0.1" stdDeviation="0.06" floodOpacity="0.4"/>
            </filter>
            {/* Clip paths للـ yards — يضمن إن الـ yard ما يطلعش على الـ track cells */}
            <clipPath id="clip-red-yard">
              <rect x="0" y="0" width="6" height="6"/>
            </clipPath>
            <clipPath id="clip-yellow-yard">
              <rect x="9" y="0" width="6" height="6"/>
            </clipPath>
            <clipPath id="clip-green-yard">
              <rect x="0" y="9" width="6" height="6"/>
            </clipPath>
            <clipPath id="clip-blue-yard">
              <rect x="9" y="9" width="6" height="6"/>
            </clipPath>
          </defs>

          {/* ١. خلفية بيضاء كاملة */}
          <rect x="0" y="0" width="15" height="15" fill="#ffffff"/>

          {/* ٢. خلفيات الـ yards (داخل clip paths عشان ما تطغاش على المسار) */}
          <g clipPath="url(#clip-red-yard)">
            <rect x="0" y="0" width="6" height="6" fill="#fecaca"/>
          </g>
          <g clipPath="url(#clip-yellow-yard)">
            <rect x="9" y="0" width="6" height="6" fill="#fef08a"/>
          </g>
          <g clipPath="url(#clip-green-yard)">
            <rect x="0" y="9" width="6" height="6" fill="#bbf7d0"/>
          </g>
          <g clipPath="url(#clip-blue-yard)">
            <rect x="9" y="9" width="6" height="6" fill="#bfdbfe"/>
          </g>

          {/* ٣. منطقة المنتصف (center) */}
          <polygon points="7.5,7.5 6,6 9,6" fill="#fca5a5"/>
          <polygon points="7.5,7.5 6,6 6,9" fill="#fef08a"/>
          <polygon points="7.5,7.5 9,9 6,9" fill="#86efac"/>
          <polygon points="7.5,7.5 9,9 9,6" fill="#93c5fd"/>

          {/* ٤. مربعات المسار الرئيسي — ترسم فوق كل حاجة عشان تطغى على الـ yards */}
          {TRACK.map(([col, row], i) => {
            let fill = "#ffffff";
            // نقاط البداية بألوانها
            if (i === 0)  fill = "#dc2626"; // red start
            if (i === 13) fill = "#d97706"; // yellow start
            if (i === 26) fill = "#2563eb"; // blue start
            if (i === 39) fill = "#16a34a"; // green start
            // المربعات الآمنة بلون فاتح
            if (SAFE_INDICES.has(i) && i !== 0 && i !== 13 && i !== 26 && i !== 39) {
              fill = "#e5e7eb";
            }
            return (
              <rect
                key={i}
                x={col} y={row}
                width="1" height="1"
                fill={fill}
                stroke="#d1d5db"
                strokeWidth="0.03"
              />
            );
          })}

          {/* ٥. مسارات البيت (home tracks) */}
          {(["red","yellow","green","blue"] as Color[]).map(c =>
            HOME_TRACK[c].map(([col, row], i) => (
              <rect
                key={`h-${c}-${i}`}
                x={col} y={row}
                width="1" height="1"
                fill={i < 5 ? COLOR_STYLES[c].light : COLOR_STYLES[c].bg}
                stroke="#d1d5db"
                strokeWidth="0.03"
                opacity={i < 5 ? 0.8 : 1}
              />
            ))
          )}

          {/* ٦. مربعات داخل الـ yards (الدوائر الصغيرة) */}
          {(["red","yellow","green","blue"] as Color[]).map(c =>
            YARD_POS[c].map(([col, row], i) => (
              <rect
                key={`y-${c}-${i}`}
                x={col + 0.12} y={row + 0.12}
                width="0.76" height="0.76"
                fill={COLOR_STYLES[c].light}
                stroke={COLOR_STYLES[c].border}
                strokeWidth="0.08"
                rx="0.18"
              />
            ))
          )}

          {/* ٧. حدود خارجية للـ yards */}
          <rect x="0.06" y="0.06" width="5.88" height="5.88" fill="none" stroke="#fca5a5" strokeWidth="0.12" rx="0.3"/>
          <rect x="9.06" y="0.06" width="5.88" height="5.88" fill="none" stroke="#fcd34d" strokeWidth="0.12" rx="0.3"/>
          <rect x="0.06" y="9.06" width="5.88" height="5.88" fill="none" stroke="#86efac" strokeWidth="0.12" rx="0.3"/>
          <rect x="9.06" y="9.06" width="5.88" height="5.88" fill="none" stroke="#93c5fd" strokeWidth="0.12" rx="0.3"/>

          {/* ٨. البيادق */}
          {(["player", "ai1", "ai2", "ai3"] as string[]).map(pid =>
            [0,1,2,3].map(ti => {
              const pos = getTokenPos(pid, ti);
              if (!pos) return null;
              const [col, row] = pos;
              const color = PLAYER_COLORS[pid] ?? "red";
              const cs = COLOR_STYLES[color];
              const isValid = pid === "player" && validTokens.includes(ti);
              return (
                <g key={`${pid}-${ti}`}
                  onClick={isValid ? () => moveToken(ti) : undefined}
                  style={{ cursor: isValid ? "pointer" : "default" }}
                >
                  {isValid && (
                    <circle cx={col + 0.5} cy={row + 0.5} r="0.48"
                      fill="rgba(34,197,94,0.3)" stroke="#22c55e" strokeWidth="0.06">
                      <animate attributeName="r" values="0.38;0.48;0.38" dur="0.8s" repeatCount="indefinite"/>
                    </circle>
                  )}
                  <circle cx={col + 0.5} cy={row + 0.5} r="0.35"
                    fill={cs.bg} stroke={cs.border} strokeWidth="0.08"
                    filter="url(#shadow)"/>
                  <circle cx={col + 0.35} cy={row + 0.35} r="0.1"
                    fill="rgba(255,255,255,0.5)"/>
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Bottom controls */}
      <div style={{
        width: "100%", maxWidth: 520,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
      }}>
        <div
          onClick={canRoll ? roll : undefined}
          style={{
            width: "clamp(56px,12vw,72px)", height: "clamp(56px,12vw,72px)",
            borderRadius: 14,
            background: canRoll
              ? "linear-gradient(135deg,#fff,#f3f4f6)"
              : "rgba(255,255,255,0.1)",
            border: canRoll ? "3px solid rgba(0,0,0,0.15)" : "2px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: canRoll ? "pointer" : "not-allowed",
            boxShadow: canRoll ? "0 8px 20px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(0,0,0,0.1)" : "none",
            transition: "all .2s",
            position: "relative",
            flexShrink: 0,
          }}
        >
          {diceVal ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: "clamp(20px,4vw,26px)", lineHeight: 1 }}>
                {["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][diceVal]}
              </span>
              <span style={{
                fontSize: "clamp(10px,2vw,13px)",
                fontWeight: 900,
                color: rolling ? "#94a3b8" : "#0f172a",
                lineHeight: 1,
                letterSpacing: "0.05em",
              }}>
                {diceVal}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: "clamp(18px,4vw,24px)", opacity: canRoll ? 0.8 : 0.3 }}>🎲</span>
          )}
        </div>

        <div style={{ flex: 1, textAlign: "center" }}>
          {msg ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 13, fontWeight: 700, color: "#f4f4f8" }}
            >{msg}</motion.div>
          ) : (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
              {canRoll ? "🎲 اضغط على النرد" :
               aiThinking ? "⏳ AI يفكر..." :
               isMyTurn && diceVal ? "🎯 اختر بيدق" :
               "⏳ انتظر دورك"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {(["player","ai1","ai2","ai3"] as string[]).map(pid => {
            const color = PLAYER_COLORS[pid];
            const cs = COLOR_STYLES[color];
            const isActive = currentTurn === pid;
            return (
              <div key={pid} style={{
                width: 28, height: 28, borderRadius: 8,
                background: isActive ? cs.bg : `${cs.bg}30`,
                border: `2px solid ${isActive ? cs.border : "transparent"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
                boxShadow: isActive ? `0 0 12px ${cs.bg}60` : "none",
                transition: "all .3s",
              }}>
                {pid === "player" ? "🧑" : "🤖"}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
