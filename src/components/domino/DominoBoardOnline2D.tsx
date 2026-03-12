"use client";
import React from "react";
import { DominoGame, type Domino } from "@/lib/domino/game";
import { CAMPAIGN_MAPS } from "@/lib/domino/campaign";
import { motion, AnimatePresence } from "framer-motion";
import { usePlatformStore } from "@/lib/platform/store";
import { Trophy, RefreshCw } from "lucide-react";

const DOMINO_SKIN_PATHS: Record<string, string> = {
  "default_domino": "garrifin",
  "skin_dragon": "dragon",
  "skin_phoenix": "phoenix",
  "skin_unicorn": "unicorn",
  "garrifin": "garrifin",
  "dragon": "dragon",
  "phoenix": "phoenix",
  "unicorn": "unicorn",
};
const DOMINO_BACKFACES: Record<string, string> = {
  "garrifin": "grrifinbackface.png",
  "dragon": "dragonbackface.png",
  "phoenix": "phonexbackface.png",
  "unicorn": "unicornbackface.png",
};
function getSkinPath(s?: string) {
  if (!s) return "/skins/domino/garrifin";
  if (s.startsWith("/skins/")) return s;
  return `/skins/domino/${DOMINO_SKIN_PATHS[s] || "garrifin"}`;
}
function getBackface(s?: string) {
  if (!s) return "/skins/domino/garrifin/grrifinbackface.png";
  const folder = DOMINO_SKIN_PATHS[s] || "garrifin";
  return `/skins/domino/${folder}/${DOMINO_BACKFACES[folder] || "grrifinbackface.png"}`;
}

function normalizeChain(chain: Domino[]): { a: number; b: number; isDouble: boolean; flipH: boolean }[] {
  if (!chain.length) return [];
  if (chain.length === 1) { const t = chain[0]; return [{ a: t.a, b: t.b, isDouble: t.a === t.b, flipH: false }]; }
  const result: { a: number; b: number; isDouble: boolean; flipH: boolean }[] = [];
  const t0 = chain[0], t1 = chain[1];
  let connector = (t0.a === t1.a || t0.a === t1.b) ? t0.a : t0.b;
  let exposed = (t0.a === connector) ? t0.b : t0.a;
  for (const tile of chain) {
    const isDouble = tile.a === tile.b;
    const lv = exposed, rv = (tile.a === lv) ? tile.b : tile.a;
    exposed = rv;
    const [sm, bg] = lv <= rv ? [lv, rv] : [rv, lv];
    result.push({ a: sm, b: bg, isDouble, flipH: !isDouble && lv > rv });
  }
  return result;
}

function Tile({ a, b, vertical = true, selected = false, disabled = false, playable = false,
  faceDown = false, flipH = false, onClick, className = "", skin, backface, w: wProp, h: hProp }:
  { a: number; b: number; vertical?: boolean; selected?: boolean; disabled?: boolean; playable?: boolean;
    faceDown?: boolean; flipH?: boolean; onClick?: () => void; className?: string;
    skin?: string; backface?: string; w?: number; h?: number }) {
  const [mn, mx] = a <= b ? [a, b] : [b, a];
  const skinPath = skin || "/skins/domino/garrifin";
  const backfacePath = backface || "/skins/domino/garrifin/grrifinbackface.png";
  const src = faceDown ? backfacePath : `${skinPath}/${mn}-${mx}.png`;
  const W = wProp || (vertical ? 44 : 88), H = hProp || (vertical ? 88 : 44);
  const imgStyle: React.CSSProperties = !vertical
    ? { transform: flipH ? "rotate(270deg)" : "rotate(90deg)", transformOrigin: "center",
        width: H, height: W, position: "absolute", top: "50%", left: "50%", marginTop: -W / 2, marginLeft: -H / 2 }
    : { width: "100%", height: "100%" };
  return (
    <motion.div onClick={disabled ? undefined : onClick}
      className={`relative flex-shrink-0 select-none rounded-lg overflow-hidden ${className} ${disabled ? "cursor-not-allowed" : onClick ? "cursor-pointer" : ""}`}
      style={{ width: W, height: H }}
      whileHover={!disabled && playable && !selected ? { y: -10, scale: 1.07, filter: "brightness(1.12) drop-shadow(0 6px 16px rgba(245,166,35,0.5))" } : {}}
      whileTap={!disabled && onClick ? { scale: 0.95 } : {}}
      animate={selected
        ? { y: -14, scale: 1.1, filter: "drop-shadow(0 0 16px rgba(245,166,35,0.85)) brightness(1.1)" }
        : disabled && !faceDown
          ? { opacity: 0.42, scale: 1, filter: "grayscale(0.4)" }
          : { y: 0, scale: 1, filter: "none", opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}>
      {selected && <div className="absolute inset-0 z-20 rounded-lg pointer-events-none"
        style={{ boxShadow: "inset 0 0 0 2.5px #f5a623,0 0 20px 4px rgba(245,166,35,0.55)" }} />}
      {!selected && playable && <motion.div className="absolute inset-0 z-20 rounded-lg pointer-events-none"
        animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 2, repeat: Infinity }}
        style={{ boxShadow: "inset 0 0 0 1.5px #34d399" }} />}
      <div className="relative w-full h-full overflow-hidden">
        <img src={src} alt={faceDown ? "?" : `${a}-${b}`} draggable={false}
          style={imgStyle} className={vertical ? "object-fill" : ""} />
      </div>
    </motion.div>
  );
}

function OpponentBadge({ id, count, isTurn, pos }: { id: string; count: number; isTurn: boolean; pos: "top" | "left" | "right" }) {
  const isBot = id.includes("bot") || id.includes("ai");
  const isVert = pos === "left" || pos === "right";
  return (
    <motion.div
      animate={isTurn ? { scale: 1.05 } : { scale: 1, opacity: 0.75 }}
      transition={{ type: "spring", stiffness: 280 }}
      className={`absolute z-20 flex flex-col items-center gap-1
        ${pos === "top" ? "top-[4.5rem] sm:top-20 left-1/2 -translate-x-1/2" : ""}
        ${pos === "left" ? "left-2 sm:left-4 top-1/2 -translate-y-1/2" : ""}
        ${pos === "right" ? "right-2 sm:right-4 top-1/2 -translate-y-1/2" : ""}`}>
      <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl
        border-2 transition-all duration-300
        ${isTurn ? "border-amber-400 bg-amber-400/10 shadow-[0_0_18px_rgba(245,166,35,0.4)]"
          : "border-white/[0.07] bg-white/[0.04]"}`}
        style={{ backdropFilter: "blur(16px)" }}>
        <span className="text-lg">{isBot ? "🤖" : "👤"}</span>
        {isTurn && <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#080e1a] animate-pulse z-10" />}
      </div>
      <div className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black whitespace-nowrap transition-all duration-300
        ${isTurn ? "bg-amber-400 text-black shadow-md" : "bg-black/50 text-white/60 border border-white/[0.08]"}`}
        style={{ backdropFilter: "blur(8px)" }}>
        {isBot ? "Bot" : id.slice(0, 6)} · {count}
      </div>
      <div className={`flex ${isVert ? "flex-col -space-y-4" : "flex-row -space-x-3"} mt-0.5`}>
        {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
          <div key={i} className="flex-shrink-0 rounded bg-white/[0.07] border border-white/[0.06]"
            style={{ width: isVert ? 14 : 12, height: isVert ? 12 : 22, zIndex: i,
              transform: isVert ? "rotate(90deg)" : `rotate(${(i - 1.5) * 3}deg)`,
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }} />
        ))}
        {count > 4 && <span className="text-[8px] text-white/30 font-bold self-end ml-0.5">+{count - 4}</span>}
      </div>
    </motion.div>
  );
}

function Confetti() {
  const C = ["#f5c842", "#34d399", "#60a5fa", "#f87171", "#c084fc", "#fb923c"];
  const ps = React.useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 1.4, dur: 2.4 + Math.random() * 2.2,
    color: C[i % C.length], w: 7 + Math.random() * 9, rot: Math.random() * 360,
  })), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {ps.map(p => (
        <motion.div key={p.id} className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: -16, width: p.w, height: p.w * 0.5, background: p.color }}
          animate={{ y: ["0vh", "112vh"], rotate: [p.rot, p.rot + 520], opacity: [1, 1, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }} />
      ))}
    </div>
  );
}

function EndDialog({ winner, coins, xp, onReplay, onHome }:
  { winner: string; coins: number; xp: number; onReplay: () => void; onHome: () => void }) {
  const win = winner === "player";

  // تسجيل النتيجة في الـ DB
  React.useEffect(() => {
    fetch("/api/domino/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: win ? "win" : "loss", coins, xp }),
    }).catch(() => {});
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)" }}>
      {win && <Confetti />}
      <motion.div initial={{ scale: 0.72, y: 55, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 230, damping: 22, delay: 0.08 }}
        className="relative w-full max-w-[340px] rounded-3xl overflow-hidden z-20"
        style={{
          background: win
            ? "linear-gradient(155deg,#1c1500 0%,#2b1f00 45%,#0e0e0e 100%)"
            : "linear-gradient(155deg,#0e0e0e 0%,#1c0505 100%)",
          border: `1.5px solid ${win ? "rgba(245,196,66,0.42)" : "rgba(255,60,60,0.28)"}`,
          boxShadow: win
            ? "0 0 55px rgba(245,196,66,0.16),0 30px 55px rgba(0,0,0,0.65)"
            : "0 0 35px rgba(255,60,60,0.1),0 30px 55px rgba(0,0,0,0.65)",
        }}>
        <div className="h-[2px]" style={{
          background: win
            ? "linear-gradient(90deg,transparent,#f5c842,#fffacd,#f5c842,transparent)"
            : "linear-gradient(90deg,transparent,#ef4444,transparent)"
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-52 h-36 rounded-full opacity-[0.18] blur-3xl pointer-events-none"
          style={{ background: win ? "#f5c842" : "#ef4444" }} />
        <div className="relative p-8 text-center">
          <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.28 }}
            className="text-6xl mb-5 inline-block">
            {win ? "🏆" : "💀"}
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
            className="text-[2rem] font-black mb-2 tracking-wide"
            style={{ color: win ? "#f5c842" : "#ff6060", textShadow: win ? "0 0 28px rgba(245,196,66,0.55)" : "0 0 18px rgba(255,50,50,0.45)" }}>
            {win ? "انتصار!" : "خسارة"}
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.52 }}
            className="text-sm mb-7" style={{ color: win ? "rgba(245,196,66,0.65)" : "rgba(255,255,255,0.38)" }}>
            {win ? "أداء رائع، استمر على هذا المستوى!" : "المرة القادمة ستكون مختلفة"}
          </motion.p>
          {win && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
              className="flex justify-center gap-3 mb-7">
              {[{ lbl: "كوينز", val: `+${coins}`, clr: "#f5c842" }, { lbl: "XP", val: `+${xp}`, clr: "#a78bfa" }].map(r => (
                <div key={r.lbl} className="px-4 py-2.5 rounded-2xl text-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="text-xl font-black" style={{ color: r.clr }}>{r.val}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>{r.lbl}</div>
                </div>
              ))}
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.66 }} className="flex gap-3">
            <button onClick={onHome}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.58)" }}>
              الرئيسية
            </button>
            <button onClick={onReplay}
              className="flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-115 active:scale-95"
              style={{
                background: win ? "linear-gradient(135deg,#f5c842,#e0960a)" : "linear-gradient(135deg,#ef4444,#b91c1c)",
                color: win ? "#1a0d00" : "#fff",
                boxShadow: win ? "0 4px 18px rgba(245,196,66,0.38)" : "0 4px 18px rgba(239,68,68,0.28)"
              }}>
              <RefreshCw size={14} /> مجدداً
            </button>
          </motion.div>
        </div>
        <div className="h-[1px]" style={{
          background: win
            ? "linear-gradient(90deg,transparent,rgba(245,196,66,0.28),transparent)"
            : "linear-gradient(90deg,transparent,rgba(255,60,60,0.18),transparent)"
        }} />
      </motion.div>
    </motion.div>
  );
}

const TABLE_FRAMES: Record<string, string> = {
  sultan:   "/domino/tables/sultan.png",
  egyptian: "/domino/tables/egyptian.png",
  classic:  "/domino/tables/classic.png",
  yemeni:   "/domino/tables/turkish.png",
};
const TABLE_NAMES: Record<string, string> = {
  sultan:   "🇸🇦 السلطاني",
  egyptian: "🇪🇬 المصري",
  classic:  "🎲 الكلاسيك",
  yemeni:   "🇾🇪 اليمني",
};

export default function DominoBoard({
  matchId, playerId, initialSide = "a", mode = "online", onLeave,
  numPlayers = 2, campaignMapId, campaignLevelId,
  gameType = "classic", difficulty = "medium",
}: {
  matchId?: string; playerId: string; initialSide?: "a" | "b";
  mode?: "online" | "training"; onLeave?: () => void;
  numPlayers?: number; campaignMapId?: string; campaignLevelId?: string;
  gameType?: "classic" | "block" | "all_fives";
  difficulty?: "easy" | "medium" | "hard" | "expert";
}) {
  const localGameRef = React.useRef<DominoGame | null>(null);
  const [chain, setChain] = React.useState<Domino[]>([]);
  const [myHand, setMyHand] = React.useState<Domino[]>([]);
  const [oppCounts, setOppCounts] = React.useState<Record<string, number>>({});
  const [playersList, setPlayersList] = React.useState<string[]>([]);
  const [boneyard, setBoneyard] = React.useState(0);
  const [turn, setTurn] = React.useState("");
  const [endInfo, setEndInfo] = React.useState<{ winner: string; coins: number; xp: number } | null>(null);
  const [sel, setSel] = React.useState<Domino | null>(null);
  const [missionStarted, setMissionStarted] = React.useState(true);
  const [selectedTable, setSelectedTable] = React.useState<"classic" | "sultan" | "egyptian" | "yemeni">("sultan");
  const [showTableSelect, setShowTableSelect] = React.useState(false);

  const { equipped } = usePlatformStore();
  const rawSkin = equipped?.domino_skin || "default_domino";
  const activeSkin = getSkinPath(rawSkin === "default_domino" || !rawSkin ? "default_domino" : rawSkin);
  const activeBackface = getBackface(rawSkin === "default_domino" || !rawSkin ? "default_domino" : rawSkin);

  const campaignMap = campaignMapId ? CAMPAIGN_MAPS.find(m => m.id === campaignMapId) : undefined;
  const campaignLevel = campaignLevelId && campaignMap ? campaignMap.levels.find(l => l.id === campaignLevelId) : undefined;
  React.useEffect(() => { if (campaignLevel) setMissionStarted(false); }, [campaignLevel]);

  function sync() {
    const g = localGameRef.current; if (!g) return;
    setChain([...g.chain]); setMyHand([...g.hands.player]);
    const c: Record<string, number> = {};
    g.players.forEach(p => { if (p !== "player") c[p] = g.hands[p]?.length ?? 0; });
    setOppCounts(c); setPlayersList(g.players);
    setBoneyard(g.boneyard.length); setTurn(g.turn);
    if (g.winner) setEndInfo({ winner: g.winner, coins: g.winner === "player" ? 100 : 0, xp: g.winner === "player" ? 50 : 10 });
  }

  async function runBots() {
    const g = localGameRef.current; if (!g) return;
    while (g.turn !== "player" && g.phase === "playing") {
      await new Promise(r => setTimeout(r, 850 + Math.random() * 350));
      g.playAI(); sync();
    }
  }

  function startGame() {
    const game = new DominoGame(numPlayers, campaignLevel?.opponentDifficulty || difficulty, gameType);
    game.deal(7); localGameRef.current = game; sync();
    setTimeout(() => { if (game.turn !== "player") runBots(); }, 400);
  }

  React.useEffect(() => {
    if (mode === "training" && missionStarted) startGame();
  }, [mode, numPlayers, difficulty, gameType, missionStarted]);

  function canL(t: Domino) { if (!chain.length) return true; return t.a === chain[0].a || t.b === chain[0].a; }
  function canR(t: Domino) { if (!chain.length) return true; const r = chain[chain.length - 1].b; return t.a === r || t.b === r; }
  function playable(t: Domino) { return canL(t) || canR(t); }

  async function place(t: Domino, side: "left" | "right") {
    const g = localGameRef.current; if (!g || turn !== "player") return;
    if (g.play("player", t, side)) { setSel(null); sync(); setTimeout(runBots, 80); }
  }
  function clickTile(t: Domino) {
    if (turn !== "player" || !playable(t)) return;
    if (sel?.a === t.a && sel?.b === t.b) {
      const l = canL(t), r = canR(t);
      if (l && !r) place(t, "left"); else if (!l && r) place(t, "right");
    } else { setSel(t); }
  }
  async function draw() {
    const g = localGameRef.current; if (!g || turn !== "player" || !boneyard) return;
    g.draw("player"); sync();
  }
  function pass() {
    const g = localGameRef.current; if (!g) return;
    const bots = playersList.filter(p => p !== "player");
    g.turn = bots[0] || "bot1"; sync(); setTimeout(runBots, 80);
  }
  function ppos(pId: string): "bottom" | "top" | "left" | "right" {
    if (pId === "player") return "bottom"; if (numPlayers === 2) return "top";
    const d = (playersList.indexOf(pId) - playersList.indexOf("player") + numPlayers) % numPlayers;
    return d === 1 ? "right" : d === 2 ? "top" : "left";
  }

  const isMe = turn === "player";
  const canDraw = isMe && boneyard > 0 && gameType !== "block";
  const hasMove = myHand.some(playable);
  const canPass = isMe && !hasMove && boneyard === 0;
  const norm = normalizeChain(chain);
  const opps = playersList.filter(p => p !== "player");

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden select-none"
      onClick={() => showTableSelect && setShowTableSelect(false)}
      style={{ fontFamily: "'Cairo','Segoe UI',sans-serif", touchAction: "manipulation" }}>

      {/* ═══ TABLE BACKGROUND ═══ */}
      <div className="absolute inset-0 z-0">
        {/* Outer walnut wood */}
        <div className="absolute inset-0" style={{ background: "#1a0f06" }} />
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 140% 100% at 50% 50%, #2d1a08 0%, #1e1005 45%, #120a02 100%)"
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: "repeating-linear-gradient(170deg, rgba(180,100,20,0.06) 0px, rgba(180,100,20,0.06) 1px, transparent 1px, transparent 12px)"
        }} />

        {/* Green felt inner */}
        <div className="absolute inset-[14px] sm:inset-[20px] rounded-[1.6rem] sm:rounded-[2rem]" style={{
          background: "radial-gradient(ellipse 110% 90% at 50% 44%, #2a6b3a 0%, #1e5430 40%, #133823 75%, #0d2819 100%)"
        }} />
        <div className="absolute inset-[14px] sm:inset-[20px] rounded-[1.6rem] sm:rounded-[2rem] opacity-[0.09]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "3px 3px"
        }} />
        <div className="absolute inset-[14px] sm:inset-[20px] rounded-[1.6rem] sm:rounded-[2rem]" style={{
          backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.008) 0px, rgba(255,255,255,0.008) 1px, transparent 1px, transparent 6px)"
        }} />
        <div className="absolute inset-[14px] sm:inset-[20px] rounded-[1.6rem] sm:rounded-[2rem]" style={{
          background: "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(100,200,120,0.07) 0%, transparent 70%)"
        }} />
        <div className="absolute inset-[14px] sm:inset-[20px] rounded-[1.6rem] sm:rounded-[2rem] pointer-events-none" style={{
          boxShadow: "inset 0 0 40px rgba(0,0,0,0.55), inset 0 0 80px rgba(0,0,0,0.25)"
        }} />
        {/* Felt gold border */}
        <div className="absolute inset-[14px] sm:inset-[20px] rounded-[1.6rem] sm:rounded-[2rem] pointer-events-none z-[1]" style={{
          border: "2px solid rgba(180,120,40,0.28)",
          boxShadow: "inset 0 0 0 4px rgba(26,70,40,0.9), inset 0 0 0 5px rgba(100,200,120,0.10), 0 0 0 1px rgba(0,0,0,0.8)"
        }} />

        {/* TABLE FRAME IMAGE */}
        {TABLE_FRAMES[selectedTable] && (
          <img src={TABLE_FRAMES[selectedTable]} alt="table frame"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ objectFit: "fill", zIndex: 3, opacity: selectedTable === "classic" ? 0.55 : 0.88, mixBlendMode: "multiply" }} />
        )}
        {selectedTable !== "classic" && (
          <div className="absolute inset-0 pointer-events-none" style={{
            zIndex: 4, background: "radial-gradient(ellipse 60% 40% at 50% 50%, transparent 50%, rgba(0,0,0,0.18) 100%)"
          }} />
        )}

        {/* Vignettes */}
        <div className="absolute inset-x-0 top-0 h-28 pointer-events-none" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)"
        }} />
        <div className="absolute inset-x-0 bottom-0 h-72 pointer-events-none" style={{
          background: "linear-gradient(to top, rgba(5,15,8,0.97) 0%, rgba(8,20,12,0.8) 45%, transparent 100%)"
        }} />
      </div>

      {/* ═══ TOP BAR ═══ */}
      <div className="relative z-30 flex items-center justify-between gap-2 px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
        <a href={campaignMap ? "/games/domino/campaign" : "/games/domino/online"}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold text-white/60 hover:text-white transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          <span className="hidden sm:inline">رجوع</span>
        </a>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-2xl text-[11px] font-black tracking-wider"
            style={{ background: "rgba(42,107,58,0.3)", border: "1px solid rgba(80,180,100,0.25)", color: "#86efac" }}>
            {gameType === "classic" ? "⚡ كلاسيك" : gameType === "block" ? "🔒 بلوك" : "⭐ الأخماس"}
          </div>
          {campaignMap && (
            <div className="hidden sm:block px-2.5 py-1 rounded-xl text-[10px] font-bold"
              style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", color: "#f5a623" }}>
              {campaignMap.name}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowTableSelect(v => !v)}
            className="px-2.5 py-2 rounded-2xl text-sm font-bold transition-all hover:brightness-110 active:scale-95"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)", color: "rgba(255,255,255,0.7)" }}
            title="غيّر الطاولة">
            🎲
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
            <span className="text-base opacity-50">🁣</span>
            <div>
              <div className="text-[9px] text-white/30 font-bold leading-none mb-0.5">مستودع</div>
              <div className="font-black text-sm leading-none" style={{ color: "#f5a623" }}>{boneyard}</div>
            </div>
          </div>
        </div>

        {/* Table selector dropdown */}
        <AnimatePresence>
          {showTableSelect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute top-[4rem] right-3 z-[60] rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,15,25,0.97)", border: "1px solid rgba(245,166,35,0.3)", backdropFilter: "blur(24px)", boxShadow: "0 8px 40px rgba(0,0,0,0.7)" }}>
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-black tracking-widest" style={{ color: "rgba(245,166,35,0.7)" }}>اختار طاولتك</p>
              </div>
              {(["sultan", "egyptian", "yemeni", "classic"] as const).map(t => (
                <button key={t} onClick={() => { setSelectedTable(t); setShowTableSelect(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-all hover:bg-white/[0.06] text-right"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-10 h-6 rounded-lg overflow-hidden flex-shrink-0 border border-white/[0.12]">
                    <img src={TABLE_FRAMES[t]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-bold" style={{ color: selectedTable === t ? "#f5a623" : "rgba(255,255,255,0.75)" }}>
                    {TABLE_NAMES[t]}
                  </span>
                  {selectedTable === t && <span className="mr-auto text-amber-400 text-xs">✓</span>}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OPPONENTS */}
      {opps.map(p => {
        const pp = ppos(p); if (pp === "bottom") return null;
        return <OpponentBadge key={p} id={p} count={oppCounts[p] ?? 0} isTurn={turn === p} pos={pp as "top" | "left" | "right"} />;
      })}

      {/* CHAIN BOARD */}
      <div className="absolute inset-0 flex items-center justify-center z-10" style={{ top: "60px", bottom: "160px" }}>
        <div className="relative flex items-center justify-center w-full h-full">
          <AnimatePresence>
            {sel && chain.length > 0 && (
              <>
                {canL(sel) && (
                  <motion.button key="dl"
                    initial={{ opacity: 0, scale: 0.65, x: 18 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.65 }}
                    onClick={() => place(sel, "left")}
                    className="absolute flex items-center justify-center font-black text-xl rounded-full z-30"
                    style={{ left: 8, width: 52, height: 52, background: "rgba(52,211,153,0.14)", border: "2px solid #34d399", color: "#34d399", boxShadow: "0 0 22px rgba(52,211,153,0.38)" }}>
                    ←
                  </motion.button>
                )}
                {canR(sel) && (
                  <motion.button key="dr"
                    initial={{ opacity: 0, scale: 0.65, x: -18 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.65 }}
                    onClick={() => place(sel, "right")}
                    className="absolute flex items-center justify-center font-black text-xl rounded-full z-30"
                    style={{ right: 8, width: 52, height: 52, background: "rgba(52,211,153,0.14)", border: "2px solid #34d399", color: "#34d399", boxShadow: "0 0 22px rgba(52,211,153,0.38)" }}>
                    →
                  </motion.button>
                )}
              </>
            )}
          </AnimatePresence>
          {!chain.length && (
            <motion.p animate={{ opacity: [0.28, 0.65, 0.28] }} transition={{ duration: 2.6, repeat: Infinity }}
              className="text-sm font-bold tracking-widest" style={{ color: "rgba(245,166,35,0.5)" }}>
              {isMe ? "✦ ابدأ بوضع أول قطعة ✦" : "✦ انتظر دور خصمك ✦"}
            </motion.p>
          )}
          <div className="flex flex-row items-center overflow-x-auto px-16 py-2 hide-scrollbar"
            style={{ direction: "ltr", gap: 2, maxWidth: "100%", flexWrap: "nowrap" }}>
            {norm.map((t, i) => (
              <motion.div key={`${i}-${t.a}-${t.b}`}
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 360, damping: 26 }}
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: t.isDouble ? 38 : 76, height: t.isDouble ? 76 : 38 }}>
                <Tile a={t.a} b={t.b} vertical={t.isDouble} flipH={t.flipH}
                  w={t.isDouble ? 38 : 76} h={t.isDouble ? 76 : 38}
                  skin={activeSkin} backface={activeBackface} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM HAND */}
      <div className="absolute bottom-0 left-0 right-0 z-30" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "linear-gradient(to top, rgba(4,12,6,0.98) 0%, rgba(6,18,9,0.88) 50%, transparent 100%)"
        }} />
        <div className="relative px-3 sm:px-4 pb-3 sm:pb-4 pt-8 sm:pt-12">
          <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
            <div className="flex items-center gap-2">
              <motion.div
                animate={isMe ? { boxShadow: "0 0 16px rgba(52,211,153,0.6)" } : { boxShadow: "none" }}
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-base border-2 transition-all"
                style={{ borderColor: isMe ? "#34d399" : "rgba(255,255,255,0.1)", background: isMe ? "rgba(52,211,153,0.1)" : "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}>
                🧑
              </motion.div>
              <div>
                <div className="font-black text-xs text-white/90">أنت</div>
                <div className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.38)" }}>{myHand.length} قطعة</div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isMe ? (
                <motion.div key="my"
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                  className="px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #34d399, #059669)", color: "#fff", boxShadow: "0 4px 20px rgba(52,211,153,0.4)" }}>
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> دورك!
                </motion.div>
              ) : (
                <motion.div key="wt"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-4 py-2 rounded-2xl text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
                  ⏳ انتظر...
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-1.5">
              {canDraw && (
                <motion.button onClick={draw} whileTap={{ scale: 0.94 }}
                  className="px-3 py-2 rounded-2xl text-[11px] font-black"
                  style={{ background: "linear-gradient(135deg,rgba(245,166,35,0.2),rgba(245,166,35,0.08))", border: "1px solid rgba(245,166,35,0.4)", color: "#f5c842" }}>
                  سحب ({boneyard})
                </motion.button>
              )}
              {canPass && (
                <motion.button onClick={pass} whileTap={{ scale: 0.94 }}
                  className="px-3 py-2 rounded-2xl text-[11px] font-black"
                  style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.2),rgba(239,68,68,0.08))", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>
                  تمرير
                </motion.button>
              )}
            </div>
          </div>

          <div className="flex justify-center items-end gap-1 sm:gap-1.5 min-h-[88px] sm:min-h-[100px] overflow-x-auto px-1 pb-1"
            style={{ direction: "ltr", scrollbarWidth: "none" }}>
            <AnimatePresence>
              {myHand.map((t, i) => {
                const isPlay = playable(t);
                const isSel = sel?.a === t.a && sel?.b === t.b;
                return (
                  <motion.div key={`${i}-${t.a}-${t.b}`}
                    initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28, delay: i * 0.025 }}
                    className="flex-shrink-0">
                    <Tile a={t.a} b={t.b} vertical={true} selected={isSel}
                      disabled={!isMe || !isPlay} playable={isMe && isPlay && !isSel}
                      onClick={() => clickTile(t)}
                      skin={activeSkin} backface={activeBackface} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {myHand.length === 0 && <div className="py-8 text-sm font-bold" style={{ color: "rgba(255,255,255,0.15)" }}>—</div>}
          </div>

          <div className="text-center h-4 mt-1">
            {isMe && !sel && hasMove && (
              <p className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.22)" }}>✔ اضغط على قطعة لاختيارها</p>
            )}
            {sel && (
              <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity }}
                className="text-[10px] font-bold" style={{ color: "#34d399" }}>
                {canL(sel) && canR(sel) ? "↔ اختر الجانب أو اضغط مجدداً للإلغاء" : "▶ اضغط مجدداً للوضع"}
              </motion.p>
            )}
          </div>
        </div>
      </div>

      {/* CAMPAIGN MISSION MODAL */}
      <AnimatePresence>
        {campaignLevel && !missionStarted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
            <motion.div initial={{ scale: 0.85, y: 28 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm rounded-3xl p-8 text-center"
              style={{ background: "#111", border: "1.5px solid rgba(245,196,66,0.3)", boxShadow: "0 0 50px rgba(245,196,66,0.1)" }}>
              <Trophy size={52} className="mx-auto mb-4" style={{ color: "#f5a623" }} />
              <h2 className="text-2xl font-black text-white mb-2">{campaignLevel.title}</h2>
              <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.48)" }}>{campaignLevel.description}</p>
              <button onClick={() => setMissionStarted(true)}
                className="w-full py-3 rounded-xl font-black text-base transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#f5c842,#e0960a)", color: "#1a0d00" }}>
                ابدأ التحدي ⚡
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* END GAME */}
      <AnimatePresence>
        {endInfo && <EndDialog winner={endInfo.winner} coins={endInfo.coins} xp={endInfo.xp}
          onReplay={() => { setEndInfo(null); setChain([]); setMyHand([]); setSel(null); startGame(); }}
          onHome={() => { window.location.href = campaignMap ? "/games/domino/campaign" : "/games/domino/online"; }} />}
      </AnimatePresence>
    </div>
  );
}
