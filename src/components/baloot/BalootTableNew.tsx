"use client";
/* ═══════════════════════════════════════════════════════════════
   BalootTableNew.tsx — طاولة البلوت الجديدة
   تصميم نظيف احترافي مريح للعين
   4 لاعبين: S (أنت أسفل) | N (شريكك فوق) | E يسار | W يمين
═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BalootGame, type Card, type PlayerId, type Suit } from "@/lib/baloot/game";
import { getBestBid, getBestCard } from "@/lib/baloot/ai";
import { usePlatformStore } from "@/lib/platform/store";
import StageSelector from "@/components/platform/StageSelector";
import { BALOOT_STAGES, DIFFICULTY_CONFIG, type DiffLevel } from "@/lib/platform/difficulty";

/* ── ثوابت ── */
const SUIT_COLOR: Record<Suit, string> = {
  H: "#ef4444", D: "#f97316", S: "#1e293b", C: "#166534",
};
const SUIT_SYM: Record<Suit, string> = {
  H: "♥", D: "♦", S: "♠", C: "♣",
};
const PLAYER_LABEL: Record<PlayerId, string> = {
  S: "أنت", N: "شريكك", E: "خصم", W: "خصم",
};

/* ══════════════════════════════════════════════════════════════
   بطاقة لعب واحدة
══════════════════════════════════════════════════════════════ */
function Card2D({
  card, selected, playable, faceDown, small, onClick,
}: {
  card?: Card; selected?: boolean; playable?: boolean;
  faceDown?: boolean; small?: boolean; onClick?: () => void;
}) {
  const w = small ? 38 : 54;
  const h = small ? 56 : 80;

  if (faceDown || !card) {
    return (
      <div style={{
        width: w, height: h, borderRadius: 8, flexShrink: 0,
        background: "linear-gradient(135deg,#1e3a8a,#0f2040)",
        border: "1.5px solid rgba(255,255,255,0.18)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
      }} />
    );
  }

  const sc = SUIT_COLOR[card.suit];
  const ss = SUIT_SYM[card.suit];

  return (
    <motion.div
      onClick={playable ? onClick : undefined}
      animate={{ y: selected ? -14 : 0 }}
      whileHover={playable ? { y: selected ? -14 : -8, scale: 1.06 } : {}}
      whileTap={playable ? { scale: 0.94 } : {}}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      style={{
        width: w, height: h, borderRadius: 8, flexShrink: 0,
        background: "#fff", cursor: playable ? "pointer" : "default",
        border: selected ? `2.5px solid #f5a623`
               : playable ? `1.5px solid rgba(245,166,35,0.6)`
               : `1px solid #ddd`,
        boxShadow: selected
          ? "0 0 0 2px rgba(245,166,35,0.4), 0 8px 20px rgba(0,0,0,0.4)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        display: "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: small ? "2px 3px" : "4px 5px",
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: small ? 10 : 12, fontWeight: 900, color: sc, lineHeight: 1.1 }}>
        {card.rank}{ss}
      </div>
      <div style={{ textAlign: "center", fontSize: small ? 18 : 26, color: sc, lineHeight: 1 }}>
        {ss}
      </div>
      <div style={{
        fontSize: small ? 10 : 12, fontWeight: 900, color: sc,
        transform: "rotate(180deg)", lineHeight: 1.1,
      }}>
        {card.rank}{ss}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   لاعب جانبي (يسار/يمين) — بطاقات مكدّسة عمودياً
══════════════════════════════════════════════════════════════ */
function SidePlayer({
  id, count, isTurn, trickCard, side,
}: {
  id: PlayerId; count: number; isTurn: boolean;
  trickCard?: Card; side: "left" | "right";
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    }}>
      {/* اسم اللاعب */}
      <div style={{
        fontSize: 11, fontWeight: 900,
        color: isTurn ? "#f5a623" : "rgba(255,255,255,0.45)",
        padding: "3px 10px", borderRadius: 8,
        background: isTurn ? "rgba(245,166,35,0.15)" : "transparent",
        border: isTurn ? "1px solid rgba(245,166,35,0.4)" : "1px solid transparent",
        transition: "all .3s",
      }}>
        {PLAYER_LABEL[id]}
        {isTurn && <span style={{ marginRight: 4 }}>●</span>}
      </div>
      {/* بطاقات مكدّسة */}
      <div style={{ position: "relative", width: 44, height: Math.min(count * 6 + 56, 120) }}>
        {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
          <div key={i} style={{
            position: "absolute", top: i * 5,
            left: side === "left" ? i * 1 : 0,
          }}>
            <Card2D faceDown small />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
        {count} ورقة
      </div>
      {/* بطاقة اللاعب في المنتصف */}
      {trickCard && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ marginTop: 4 }}>
          <Card2D card={trickCard} small />
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   لاعب علوي (شريك) — بطاقات أفقية مقلوبة
══════════════════════════════════════════════════════════════ */
function TopPlayer({
  id, count, isTurn, trickCard,
}: {
  id: PlayerId; count: number; isTurn: boolean; trickCard?: Card;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        fontSize: 11, fontWeight: 900,
        color: isTurn ? "#34d399" : "rgba(255,255,255,0.45)",
        padding: "3px 10px", borderRadius: 8,
        background: isTurn ? "rgba(52,211,153,0.15)" : "transparent",
        border: isTurn ? "1px solid rgba(52,211,153,0.4)" : "1px solid transparent",
      }}>
        {isTurn && <span style={{ marginLeft: 4 }}>●</span>}
        {PLAYER_LABEL[id]}
      </div>
      <div style={{ display: "flex", gap: -8 }}>
        {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
          <div key={i} style={{ marginLeft: i > 0 ? -10 : 0 }}>
            <Card2D faceDown small />
          </div>
        ))}
      </div>
      {trickCard && (
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card2D card={trickCard} small />
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   منطقة المنتصف — الأوراق المرمية
══════════════════════════════════════════════════════════════ */
function TrickCenter({
  trick, trump, ns, ew,
}: {
  trick: Partial<Record<PlayerId, Card>>;
  trump: Suit; ns: number; ew: number;
}) {
  const positions: Record<PlayerId, React.CSSProperties> = {
    S: { bottom: 0,  left: "50%", transform: "translateX(-50%)" },
    N: { top: 0,     left: "50%", transform: "translateX(-50%)" },
    E: { left: 0,    top:  "50%", transform: "translateY(-50%)" },
    W: { right: 0,   top:  "50%", transform: "translateY(-50%)" },
  };

  return (
    <div style={{
      position: "relative", width: 200, height: 200, flexShrink: 0,
      background: "rgba(15,23,42,0.7)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* النقاط */}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>النقاط</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#34d399" }}>{ns}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>ش/أ</div>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#f87171" }}>{ew}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>خصوم</div>
          </div>
        </div>
        <div style={{
          marginTop: 6, fontSize: 11, fontWeight: 900,
          color: SUIT_COLOR[trump],
          padding: "2px 8px", borderRadius: 6,
          background: `${SUIT_COLOR[trump]}20`,
          border: `1px solid ${SUIT_COLOR[trump]}40`,
        }}>
          حكم {SUIT_SYM[trump]}
        </div>
      </div>

      {/* الأوراق المرمية */}
      {(["S","N","E","W"] as PlayerId[]).map(pid => trick[pid] && (
        <motion.div key={pid}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ position: "absolute", ...positions[pid], zIndex: 2 }}>
          <Card2D card={trick[pid]} small />
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   شاشة المزايدة
══════════════════════════════════════════════════════════════ */
function BiddingScreen({
  myHand, trump, onBid, onPass,
}: {
  myHand: Card[]; trump: Suit;
  onBid: (suit: Suit) => void;
  onPass: () => void;
}) {
  const suits: Suit[] = ["S", "H", "D", "C"];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
      }}>
      <div style={{
        width: "min(92vw,380px)", padding: "28px 24px", borderRadius: 24,
        background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        fontFamily: "Cairo,sans-serif", direction: "rtl",
      }}>
        <h2 style={{ fontWeight: 900, fontSize: 20, color: "#f4f4f8",
          textAlign: "center", marginBottom: 20 }}>
          🃏 اختر الحكم
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {suits.map(s => (
            <button key={s} onClick={() => onBid(s)} style={{
              padding: "14px", borderRadius: 14, cursor: "pointer",
              fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: 18,
              background: trump === s ? `${SUIT_COLOR[s]}25` : "rgba(255,255,255,0.05)",
              border: trump === s ? `2px solid ${SUIT_COLOR[s]}` : "1px solid rgba(255,255,255,0.1)",
              color: SUIT_COLOR[s],
              transition: "all .2s",
            }}>
              {SUIT_SYM[s]} {s === "S" ? "بستوني" : s === "H" ? "قلوب" : s === "D" ? "ديناري" : "سباتي"}
            </button>
          ))}
        </div>
        <button onClick={onPass} style={{
          width: "100%", padding: "12px", borderRadius: 12, cursor: "pointer",
          fontFamily: "Cairo,sans-serif", fontWeight: 900, fontSize: 14,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#f87171",
        }}>
          تمرير
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   الـ Component الرئيسي
══════════════════════════════════════════════════════════════ */
export default function BalootTableNew() {
  const { user } = usePlatformStore();

  /* ── مراحل الصعوبة ── */
  const [ready,     setReady]     = useState(false);
  const [thinkMs,   setThinkMs]   = useState(2000);

  /* ── حالة اللعبة ── */
  const [game]     = useState(() => new BalootGame());
  const [phase,     setPhase]     = useState<"lobby"|"bidding"|"playing"|"ended">("lobby");
  const [myHand,    setMyHand]    = useState<Card[]>([]);
  const [trick,     setTrick]     = useState<Partial<Record<PlayerId,Card>>>({});
  const [trump,     setTrump]     = useState<Suit>("S");
  const [turn,      setTurn]      = useState<PlayerId>("S");
  const [ns,        setNs]        = useState(0);
  const [ew,        setEw]        = useState(0);
  const [selected,  setSelected]  = useState<Card|null>(null);
  const [handCounts,setHandCounts]= useState<Record<PlayerId,number>>({S:8,N:8,E:8,W:8});
  const [msg,       setMsg]       = useState<string|null>(null);
  const botRunning = useRef(false);

  function sync() {
    setMyHand([...(game.hands["S"] ?? [])]);
    setTrick({ ...game.trick.cards });
    setTurn(game.next as PlayerId);
    const nsScore = (game.scores?.["N"] ?? 0) + (game.scores?.["S"] ?? 0);
    const ewScore = (game.scores?.["E"] ?? 0) + (game.scores?.["W"] ?? 0);
    setNs(nsScore);
    setEw(ewScore);
    const counts: Record<PlayerId,number> = { S:0,N:0,E:0,W:0 };
    for (const p of game.players) counts[p as PlayerId] = game.hands[p]?.length ?? 0;
    setHandCounts(counts);
  }

  function showMsg(text: string, ms = 2500) {
    setMsg(text);
    setTimeout(() => setMsg(null), ms);
  }

  /* ── تشغيل البوت ── */
  async function runBots() {
    if (botRunning.current) return;
    botRunning.current = true;
    try {
      while (game.phase === "playing" && game.next !== "S") {
        await new Promise(r => setTimeout(r, thinkMs + Math.random() * 300));
        const card = getBestCard(game, game.next as PlayerId);
        if (card) { game.play(game.next as PlayerId, card); sync(); }
        else break;
      }
      if (game.phase === "ended") {
        setPhase("ended");
        const won = (game.scores?.["S"] ?? 0) + (game.scores?.["N"] ?? 0) >
                    (game.scores?.["E"] ?? 0) + (game.scores?.["W"] ?? 0);
        showMsg(won ? "🏆 أنت وشريكك فزتم!" : "😔 الخصوم فازوا");
      }
    } finally { botRunning.current = false; }
  }

  /* ── مزايدة البوت ── */
  async function runBotBids() {
    for (const p of ["N","E","W"] as PlayerId[]) {
      await new Promise(r => setTimeout(r, thinkMs));
      const bid = getBestBid(game, p);
      if (bid) game.placeBid(p, bid.suit, bid.value);
      else game.passBid(p);
    }
    if (game.phase === "playing") { setPhase("playing"); sync(); setTimeout(runBots, 400); }
  }

  function startGame() {
    game.deal();
    setPhase("bidding");
    sync();
  }

  function handleBid(suit: Suit) {
    game.placeBid("S", suit, 80);
    setTrump(suit);
    runBotBids();
  }
  function handlePass() {
    game.passBid("S");
    runBotBids();
  }

  function playCard(card: Card) {
    if (game.next !== "S" || game.phase !== "playing") return;
    const ok = game.play("S", card);
    if (!ok) return;
    setSelected(null);
    sync();
    if (game.phase === "playing") setTimeout(runBots, 200);
    else if (game.phase === "ended") {
      setPhase("ended");
      const won = (game.scores?.["S"] ?? 0) + (game.scores?.["N"] ?? 0) >
                  (game.scores?.["E"] ?? 0) + (game.scores?.["W"] ?? 0);
      showMsg(won ? "🏆 أنت وشريكك فزتم!" : "😔 الخصوم فازوا", 4000);
    }
  }

  /* ── StageSelector ── */
  if (!ready) {
    return (
      <StageSelector
        stages={BALOOT_STAGES}
        storageKey="baloot_stage_progress"
        gameName="البلوت 🃏"
        onBack={() => { window.location.href = "/games/baloot/online"; }}
        onSelect={(diff: DiffLevel) => { setThinkMs(DIFFICULTY_CONFIG[diff].thinkMs); setReady(true); }}
      />
    );
  }

  /* ── اللوبي ── */
  if (phase === "lobby") {
    return (
      <div style={{
        minHeight: "100dvh", background: "linear-gradient(160deg,#0f172a,#1e1040,#0a0a14)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "Cairo,sans-serif", color: "#fff", direction: "rtl", padding: 20,
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>♠</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: "#f4f4f8" }}>
          بلوت VIP
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 32, fontSize: 14 }}>
          أنت وشريكك ضد لاعبين من الذكاء الاصطناعي
        </p>
        <button onClick={startGame} style={{
          padding: "16px 48px", borderRadius: 16, fontWeight: 900, fontSize: 18,
          background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff",
          border: "none", cursor: "pointer", fontFamily: "Cairo,sans-serif",
          boxShadow: "0 8px 24px rgba(124,58,237,0.5)",
        }}>
          🃏 ابدأ اللعبة
        </button>
      </div>
    );
  }

  /* ── نهاية اللعبة ── */
  if (phase === "ended") {
    const won = game.winner === "NS";
    return (
      <div style={{
        minHeight: "100dvh", background: won
          ? "linear-gradient(160deg,#064e3b,#0f172a)"
          : "linear-gradient(160deg,#450a0a,#0f172a)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", fontFamily: "Cairo,sans-serif", color: "#fff",
        direction: "rtl", gap: 16,
      }}>
        <div style={{ fontSize: 64 }}>{won ? "🏆" : "😔"}</div>
        <h2 style={{ fontSize: 28, fontWeight: 900 }}>
          {won ? "فزتم!" : "الخصوم فازوا"}
        </h2>
        <div style={{ display: "flex", gap: 24, fontSize: 20, fontWeight: 900 }}>
          <span style={{ color: "#34d399" }}>أنت وشريكك: {ns}</span>
          <span style={{ color: "#f87171" }}>الخصوم: {ew}</span>
        </div>
        <button onClick={() => { setPhase("lobby"); setNs(0); setEw(0); }} style={{
          marginTop: 16, padding: "14px 40px", borderRadius: 14, fontWeight: 900,
          fontSize: 16, background: "#7c3aed", color: "#fff", border: "none",
          cursor: "pointer", fontFamily: "Cairo,sans-serif",
        }}>
          🔄 العب مجدداً
        </button>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     الطاولة الرئيسية
  ══════════════════════════════════════════════════════════════ */
  const validMoves = game.next === "S" && game.phase === "playing"
    ? game.getValidCards("S") : [];
  const isPlayable = (c: Card) => validMoves.some(v => v.suit === c.suit && v.rank === c.rank);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(160deg,#0f172a 0%,#1a0f2e 50%,#0a0f1e 100%)",
      fontFamily: "Cairo,sans-serif", direction: "rtl", userSelect: "none",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", zIndex: 20,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <a href="/games/baloot/online" style={{
          padding: "6px 14px", borderRadius: 10, textDecoration: "none",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 800,
        }}>← رجوع</a>
        <div style={{ fontWeight: 900, fontSize: 15, color: "#d4af37" }}>♠ بلوت VIP ♠</div>
        <div style={{
          padding: "5px 12px", borderRadius: 10, fontSize: 11, fontWeight: 900,
          background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)",
          color: "#d4af37",
        }}>🪙 {user?.coins ?? 0}</div>
      </header>

      {/* ── منطقة اللعب ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        padding: "12px 8px",
      }}>
        {/* اللاعب الشريك (فوق) */}
        <TopPlayer id="N" count={handCounts["N"]} isTurn={turn==="N"} trickCard={trick["N"]} />

        {/* الصف الأوسط: يسار + منتصف + يمين */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <SidePlayer id="E" count={handCounts["E"]} isTurn={turn==="E"}
              trickCard={trick["E"]} side="left" />
          </div>
          <TrickCenter trick={trick} trump={trump} ns={ns} ew={ew} />
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <SidePlayer id="W" count={handCounts["W"]} isTurn={turn==="W"}
              trickCard={trick["W"]} side="right" />
          </div>
        </div>

        {/* ورقة اللاعب في المنتصف */}
        {trick["S"] && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            style={{ marginBottom: 4 }}>
            <Card2D card={trick["S"]} />
          </motion.div>
        )}
      </div>

      {/* ── يد اللاعب (أسفل) ── */}
      <div style={{
        padding: "8px 8px 16px",
        background: "rgba(0,0,0,0.5)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          display: "flex", justifyContent: "center",
          alignItems: "flex-end", gap: 4,
          overflowX: "auto", paddingBottom: 4,
        }}>
          <AnimatePresence>
            {myHand.map((card, i) => {
              const play = isPlayable(card);
              const sel  = selected?.suit === card.suit && selected?.rank === card.rank;
              return (
                <motion.div key={`${card.suit}${card.rank}${i}`}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ delay: i * 0.03 }}>
                  <Card2D
                    card={card} selected={sel} playable={play}
                    onClick={() => {
                      if (!play) return;
                      if (sel) { playCard(card); }
                      else { setSelected(card); }
                    }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {turn === "S" && game.phase === "playing" && (
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 11,
            color: selected ? "#34d399" : "rgba(255,255,255,0.3)", fontWeight: 700 }}>
            {selected ? "✅ اضغط مرة تانية للعب" : "اختار ورقة"}
          </div>
        )}
      </div>

      {/* ── رسائل ── */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{
              position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",
              zIndex:60,padding:"10px 24px",borderRadius:14,
              background:"rgba(7,9,15,0.95)",border:"1px solid rgba(245,166,35,0.4)",
              color:"#f5a623",fontWeight:900,fontSize:14,
              boxShadow:"0 8px 24px rgba(0,0,0,0.5)",
            }}>
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── المزايدة ── */}
      {phase === "bidding" && (
        <BiddingScreen myHand={myHand} trump={trump}
          onBid={handleBid} onPass={handlePass} />
      )}
    </div>
  );
}
