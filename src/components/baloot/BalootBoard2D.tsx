"use client";
import React from "react";
import Image from "next/image";
import GameWrapper from "@/components/platform/GameWrapper";
import { AnimatePresence, motion } from "framer-motion";
import { BalootGame, Card, Mode, PlayerId, Suit, Rank, Bid } from "@/lib/baloot/game";
import { getBestBid, getBestCard } from "@/lib/baloot/ai";
import ProfessionalCard from "./ProfessionalCard";
import { usePlatformStore } from "@/lib/platform/store";
import { TRANSLATIONS } from "@/lib/platform/translations";
import { getTheme } from "@/lib/platform/cultural-themes";

import { useSocket } from "@/lib/platform/socket";

// --- Local Assets ---
// Updated imports to use organized folders

// Icons
import archerIcon from "@/img/balootimg/icons/archerchampicon.png";
import moharebIcon from "@/img/balootimg/icons/moharebchamp.png";
import girlIcon from "@/img/balootimg/icons/girlchamp.png";
import sheikhIcon from "@/img/balootimg/icons/elshekchampicon.png"; 
import deceiverIcon from "@/img/balootimg/icons/elmkhadechamp.png";
import ladyIcon from "@/img/balootimg/icons/ladychamp.png";
import poetIcon from "@/img/balootimg/icons/ellshaerchamp.png";
import adventurerIcon from "@/img/balootimg/charachters/elmogamerchamp.png"; // Note: charachters folder
import hunterIcon from "@/img/balootimg/icons/elsyadechamp.png";
import travelerIcon from "@/img/balootimg/icons/rhalachamp.png";
import falconIcon from "@/img/balootimg/icons/saqrchamp.png";
import dalelaIcon from "@/img/balootimg/icons/dalelachamp.png";
import rezIcon from "@/img/balootimg/icons/rezchamp.png";
import elmoharebaIcon from "@/img/balootimg/icons/elmohareba.png";
import elmojamerIcon from "@/img/balootimg/icons/elmojamerchamp.png";
import sultanIcon from "@/img/balootimg/icons/sultanchamp.png";
import warriorIcon from "@/img/balootimg/icons/superwarrior.png";

// Frames
import frameImg from "@/img/balootimg/frame/frame.png";
import platFrameImg from "@/img/balootimg/frame/platframe.png";
import royalFrameImg from "@/img/balootimg/frame/royalframe.png";
import grandFrameImg from "@/img/balootimg/frame/grandmasterframe.png";
import rampageFrameImg from "@/img/balootimg/frame/rampageframe.png";

// Carpets
import carpetMasterImg from "@/img/balootimg/carpet/carpettmaster.png";
import carpetSkinImg from "@/img/balootimg/carpet/carpetskin.png";
import carpetClassicImg from "@/img/balootimg/carpet/carpet.png";

// --- Types ---
type CharacterType = "sheikh" | "deceiver" | "warrior" | "madman" | "girl" | "lady" | "poet" | "adventurer" | "hunter" | "traveler" | "falcon" | "sultan" | "dalela" | "rez" | "mohareb" | "elmohareba" | "elmkhade" | "elmojamer";
type AbilityStatus = "ready" | "active" | "cooldown" | "used";
type ItemRarity = "common" | "rare" | "epic" | "legendary";

interface CharacterData {
    id: CharacterType;
    name: string;
    avatar: any;
    desc: string;
    color: string;
    rarity: ItemRarity;
    price: number;
    currency: "coins" | "gems";
    isVip?: boolean;
    isFree?: boolean;
}

const CHARACTERS: CharacterData[] = [
  // Free Characters (3)
  { id: "deceiver", name: "الرامي", avatar: archerIcon, desc: "دقة في اللعب", color: "text-green-400", rarity: "common", price: 0, currency: "coins", isFree: true }, // Reusing archer as 'deceiver' ID from before or just renaming? Let's keep ID mapping if possible or update usage. 'archer' was ID before.
  // Wait, ID 'archer' was used before. I should keep IDs consistent or update all usages.
  // Previous IDs: archer, mohareb, girl, sheikh, deceiver, lady, poet, adventurer, hunter, traveler, falcon, dalela, rez, elmohareba, elmkhade, elmojamer, sultan, warrior
  // Let's reuse 'archer' ID for archerIcon.
  { id: "archer" as any, name: "الرامي", avatar: archerIcon, desc: "دقة في اللعب", color: "text-green-400", rarity: "common", price: 0, currency: "coins", isFree: true },
  { id: "mohareb", name: "المحارب", avatar: moharebIcon, desc: "قوة وهيبة", color: "text-red-400", rarity: "common", price: 0, currency: "coins", isFree: true },
  { id: "girl", name: "الأميرة", avatar: girlIcon, desc: "حماية من العقوبات", color: "text-pink-400", rarity: "common", price: 0, currency: "coins", isFree: true },

  // Purchasable
  { id: "sheikh", name: "الشيخ", avatar: sheikhIcon, desc: "كشف كرت مخفي من الخصم", color: "text-blue-400", rarity: "rare", price: 1000, currency: "coins" },
  { id: "elmkhade", name: "المخادع", avatar: deceiverIcon, desc: "تبديل كرت مع الخصم", color: "text-purple-400", rarity: "rare", price: 1500, currency: "coins" },
  { id: "lady", name: "الملكة", avatar: ladyIcon, desc: "زيادة نقاط المشروع", color: "text-emerald-400", rarity: "epic", price: 50, currency: "gems" },
  { id: "poet", name: "الشاعر", avatar: poetIcon, desc: "تغيير الحكم", color: "text-indigo-400", rarity: "epic", price: 60, currency: "gems" },
  { id: "adventurer", name: "المغامر", avatar: adventurerIcon, desc: "رؤية كروت الأرض", color: "text-orange-400", rarity: "rare", price: 2000, currency: "coins" },
  { id: "hunter", name: "الصياد", avatar: hunterIcon, desc: "قنص الأكة", color: "text-green-400", rarity: "rare", price: 2500, currency: "coins" },
  { id: "traveler", name: "الرحالة", avatar: travelerIcon, desc: "تبديل أماكن الجلوس", color: "text-teal-400", rarity: "rare", price: 1800, currency: "coins" },
  { id: "falcon", name: "الصقر", avatar: falconIcon, desc: "كشف اللعب", color: "text-slate-400", rarity: "epic", price: 80, currency: "gems" },
  { id: "dalela", name: "الدليلة", avatar: dalelaIcon, desc: "كشف المشاريع", color: "text-rose-400", rarity: "epic", price: 75, currency: "gems" },
  { id: "rez", name: "الرزين", avatar: rezIcon, desc: "حكمة وهدوء", color: "text-cyan-400", rarity: "rare", price: 2200, currency: "coins" },
  { id: "elmohareba", name: "المحاربة", avatar: elmoharebaIcon, desc: "شجاعة لا مثيل لها", color: "text-red-500", rarity: "epic", price: 90, currency: "gems" },
  { id: "elmojamer", name: "المقامر", avatar: elmojamerIcon, desc: "المخاطرة العالية", color: "text-yellow-600", rarity: "epic", price: 100, currency: "gems" },

  // VIP Only
  { id: "sultan", name: "السلطان", avatar: sultanIcon, desc: "فرض الحكم", color: "text-amber-500", rarity: "legendary", price: 0, currency: "gems", isVip: true },
  { id: "warrior", name: "المحارب الخارق", avatar: warriorIcon, desc: "مضاعفة نقاط الجولة", color: "text-red-600", rarity: "legendary", price: 0, currency: "gems", isVip: true },
];

// --- Helper Components ---

const AvatarFrame = ({ 
    avatar, 
    frame = frameImg, 
    size = "md", 
    className = "",
    showShine = false
  }: { 
    avatar: any, 
    frame?: any, 
    size?: "sm" | "md" | "lg" | "xl" | "2xl",
    className?: string,
    showShine?: boolean
  }) => {
    const sizeClass = {
      sm: "w-12 h-12",
      md: "w-20 h-20",
      lg: "w-32 h-32",
      xl: "w-40 h-40",
      "2xl": "w-56 h-56"
    }[size];
  
    return (
      <div className={`relative flex items-center justify-center ${sizeClass} ${className}`}>
        {/* Avatar (Middle) */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
           <div className="relative w-[68%] h-[68%] rounded-full overflow-hidden bg-black/50">
               <Image src={avatar} alt="Avatar" fill className="object-cover" unoptimized />
           </div>
        </div>
        
        {/* Frame (Top) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
           <Image src={frame} alt="Frame" fill className="object-contain scale-110" unoptimized />
        </div>

        {/* Shine Effect */}
        {showShine && (
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-full">
                <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
            </div>
        )}
      </div>
    );
  };

// --- Assets ---
  // THEME_ASSETS removed - styles are applied directly or via helper functions

// --- Helpers ---

function suitColor(s: Suit) {
  if (s === "H" || s === "D") return "#ef4444";
  return "#1f2937";
}

function suitIcon(s: Suit, w: number, h: number) {
  const c = suitColor(s);
  if (s === "H") return <svg viewBox="0 0 24 24" width={w} height={h} fill={c}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
  if (s === "D") return <svg viewBox="0 0 24 24" width={w} height={h} fill={c}><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>;
  if (s === "S") return <svg viewBox="0 0 24 24" width={w} height={h} fill={c}><path d="M12 2C9 2 7 4 7 6c0 1.5 1 2.5 2 3 .5.25.5.5.5.5s-.5.5-.5.5c-2.5 1-4.5 3-4.5 5.5 0 2.5 2 4.5 4.5 4.5h6c2.5 0 4.5-2 4.5-4.5 0-2.5-2-4.5-4.5-5.5 0 0-.5-.5-.5-.5s0-.25.5-.5c1-.5 2-1.5 2-3 0-2-2-4-5-4z M12 20v3"/></svg>;
  return <svg viewBox="0 0 24 24" width={w} height={h} fill={c}><path d="M12 2c-1.5 0-3 1-3 2.5 0 .5.2 1 .5 1.5-.5 0-1 .2-1.5.5-1.5 1-2.5 2.5-2.5 4 0 2.5 2 4.5 4.5 4.5h4c2.5 0 4.5-2 4.5-4.5 0-1.5-1-3-2.5-4-.5-.3-1-.5-1.5-.5.3-.5.5-1 .5-1.5C15 3 13.5 2 12 2z M12 15v5"/></svg>;
}

export default function BalootBoard2D({ botThinkMs = 2000, autoStartAi = false }: { botThinkMs?: number; autoStartAi?: boolean }) {
  const { user, equipped, unlockItem, language, inventory, culturalMood } = usePlatformStore();
  const { socket } = useSocket();
  const t = TRANSLATIONS[language];
  const [game] = React.useState(() => new BalootGame());
  
  // Game State
  const [matchId, setMatchId] = React.useState<string | null>(null);
  const [mySide, setMySide] = React.useState<PlayerId | null>(null);

  const [mode, setMode] = React.useState<Mode>("hokom");
  const [gameMode, setGameMode] = React.useState<"classic" | "ranked">("classic");
  const [trump, setTrump] = React.useState<Suit>("H");
  const [started, setStarted] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  const cTheme = getTheme(culturalMood);
  const [ns, setNs] = React.useState(0);
  const [ew, setEw] = React.useState(0);
  const [turn, setTurn] = React.useState<PlayerId>("N");
  const [lead, setLead] = React.useState<Suit | null>(null);
  
  // UI State
  const [chat, setChat] = React.useState<{ by: PlayerId; text: string; emoji?: string } | null>(null);
  const [activePlayerMenu, setActivePlayerMenu] = React.useState<PlayerId | null>(null);
  const [fly, setFly] = React.useState<{ card: Card; x: number; y: number; toX: number; toY: number; rotate: number } | null>(null);
  const [uiPhase, setUiPhase] = React.useState<"splash" | "lobby" | "mode_select" | "character_select" | "table_select" | "matchmaking" | "deal" | "bidding" | "playing" | "ended">("splash");
  const [found, setFound] = React.useState<number>(0);
  const [visibleCount, setVisibleCount] = React.useState<number>(0);
  const [mushteri, setMushteri] = React.useState<Card | null>(null);
  const [flip, setFlip] = React.useState<boolean>(false);
  const [frozenTrick, setFrozenTrick] = React.useState<Record<string, Card> | null>(null);
  const [lightning, setLightning] = React.useState<PlayerId | null>(null);
  const [abilityUsed, setAbilityUsed] = React.useState<PlayerId | null>(null);
  const [tableRotation, setTableRotation] = React.useState(0);
  const [isAiGame, setIsAiGame] = React.useState(false);
  // تاريخ التريكات — كل تريك كامل يتحفظ هنا كطبقة فوق التانية
  const [trickHistory, setTrickHistory] = React.useState<Array<{ id: number; cards: Record<string, Card>; winner?: string }>>([]);
  const trickCounterRef = React.useRef(0);

  // Character System State
  const [myCharacter, setMyCharacter] = React.useState<CharacterType | null>(null);
  const [botCharacters, setBotCharacters] = React.useState<Record<PlayerId, CharacterType | null>>({ N: null, E: null, W: null, S: null });
  const [abilityStatus, setAbilityStatus] = React.useState<AbilityStatus>("ready");
  const [revealedCard, setRevealedCard] = React.useState<Card | null>(null);
  const [isDoubleScore, setIsDoubleScore] = React.useState(false);
  const [abilityTarget, setAbilityTarget] = React.useState<PlayerId | null>(null);

  // Overlays
  const [showStore, setShowStore] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);

  // Refs
  const handAreaRef = React.useRef<HTMLDivElement | null>(null);
  const centerAreaRef = React.useRef<HTMLDivElement | null>(null);

  // Helper for Relative Positioning
  function getRelativePos(target: PlayerId, me: PlayerId) {
      const indices = { N: 0, E: 1, S: 2, W: 3 };
      const targetIdx = indices[target];
      const meIdx = indices[me];
      return (targetIdx - meIdx + 4) % 4;
  }

  // دالة لحفظ التريك الحالي في التاريخ لما يكتمل
  const captureTrick = React.useCallback(() => {
    const currentCards = { ...game.trick.cards };
    if (Object.keys(currentCards).length === 0) return;
    trickCounterRef.current += 1;
    setTrickHistory(prev => [
      ...prev,
      { id: trickCounterRef.current, cards: currentCards }
    ]);
  }, [game]);

  const onPlayed = React.useCallback(({ side, card }: { side: PlayerId, card: Card }) => {
        // Animation
        const startPos = getRelativePos(side, mySide || "S"); 
        
        let startX = 0, startY = 0;
        
        // Approximate positions for animation origin
        if (typeof window !== 'undefined') {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            if (startPos === 0) { startX = cx; startY = window.innerHeight - 100; }
            else if (startPos === 1) { startX = 100; startY = cy; }
            else if (startPos === 2) { startX = cx; startY = 100; }
            else if (startPos === 3) { startX = window.innerWidth - 100; startY = cy; }
        }

        const endX = centerAreaRef.current?.getBoundingClientRect().left || 0;
        const endY = centerAreaRef.current?.getBoundingClientRect().top || 0; // Approx

        setFly({ card, x: startX, y: startY, toX: endX + 100, toY: endY + 100, rotate: Math.random() * 20 - 10 });
        
        setTimeout(() => setFly(null), 500);

        // لو بعد لعب الكرت ده التريك اتكمل (4 كروت)، احفظه في التاريخ
        setTimeout(() => {
          if (Object.keys(game.trick.cards).length === 4) {
            captureTrick();
          }
        }, 50);
  }, [mySide, game, captureTrick]);

  // --- AI Bidding Loop (منفصل ومستقل) ---
  React.useEffect(() => {
    if (!isAiGame || !started) return;
    if (game.phase !== "bidding") return;
    const currentBidder = game.players[game.bidderIndex];
    if (currentBidder === "S") return; // دور اللاعب

    const delay = botThinkMs + Math.random() * 400;
    const timeout = setTimeout(() => {
      if (game.phase !== "bidding") return;
      const bidder = game.players[game.bidderIndex];
      if (bidder === "S") return;

      const bid = getBestBid(game, bidder);
      if (bid === "pass") game.passBid(bidder);
      else game.proposeBid(bidder, bid);

      if (game.phase === "playing") {
        setMode(game.mode!);
        setTrump(game.trump ?? "H");
        setTurn(game.next);
        setUiPhase("playing");
      } else {
        setTurn(game.players[game.bidderIndex]);
      }
      setVisibleCount(v => v + 1);
    }, delay);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAiGame, started, visibleCount]);

  // --- AI Playing Loop ---
  React.useEffect(() => {
    if (!isAiGame || ended || !started) return;
    if (game.phase !== "playing") return;
    if (turn === "S") return; // دوري

    const botId = turn as PlayerId;
    const delay = 700 + Math.random() * 500;

    const timeout = setTimeout(() => {
      if (!isAiGame || ended || game.phase !== "playing") return;
      if (game.next !== botId) return;

      if (game.phase === "bidding") {
        const bid = getBestBid(game, botId);
        if (bid === "pass") game.passBid(botId);
        else game.proposeBid(botId, bid);
      } else if (game.phase === "playing") {
        const card = getBestCard(game, botId);
        if (card) {
          game.play(botId, card);
          onPlayed({ side: botId, card });
        }
      }

      const nextTurn = game.next;
      setTurn(nextTurn);
      setNs(game.scoreTotal?.NS ?? game.scoreRound.NS);
      setEw(game.scoreTotal?.EW ?? game.scoreRound.EW);

      // مهم: لو الـ phase اتغير لـ playing بعد الـ bidding، غير الـ uiPhase
      if (game.ended) {
        setEnded(true);
        setUiPhase("ended");
      } else if (game.phase === "playing" && uiPhase !== "playing") {
        setUiPhase("playing");
      } else if (game.phase === "bidding" && uiPhase !== "bidding") {
        setUiPhase("bidding");
      }

      setVisibleCount(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isAiGame, turn, ended, started, game, mySide, uiPhase, onPlayed]);

  React.useEffect(() => {
    if (!socket) return;

    function onMatchFound({ matchId, side }: { matchId: string; side: PlayerId }) {
        setMatchId(matchId);
        setMySide(side);
        setUiPhase("deal"); // Or 'bidding' directly if server sends state immediately
        setStarted(true);
        setEnded(false);
        setFound(4);
    }

    function onState(state: any) {
        // Sync game instance
        game.phase = state.phase;
        game.next = state.turn;
        game.trump = state.trump;
        game.mode = state.mode;
        game.scoreRound = state.score;
        game.trick = state.trick;

        // Sync hands (counts for others)
        (["N", "E", "S", "W"] as PlayerId[]).forEach(pid => {
            if (pid === mySide) return; // Skip my hand, updated via 'baloot:hand'
            const count = state.hands[pid];
            game.hands[pid] = Array(count).fill({ suit: "S", rank: "7" });
        });

        setTurn(state.turn);
        setTrump(state.trump);
        setMode(state.mode);
        setNs(state.score.NS);
        setEw(state.score.EW);
        setLead(state.trick.lead ? state.trick.cards[state.trick.lead]?.suit || null : null);

        if (state.phase === "bidding") setUiPhase("bidding");
        else if (state.phase === "playing") setUiPhase("playing");
        else if (state.phase === "ended") {
            setUiPhase("ended");
            setEnded(true);
        }

        // Trigger Render
        setVisibleCount(prev => prev + 1);
    }

    function onHand(hand: Card[]) {
        if (mySide) {
            game.hands[mySide] = hand;
            setVisibleCount(prev => prev + 1);
        }
    }

    socket.on("baloot:match_found", onMatchFound);
    socket.on("baloot:state", onState);
    socket.on("baloot:hand", onHand);
    socket.on("baloot:played", onPlayed);

    return () => {
        socket.off("baloot:match_found", onMatchFound);
        socket.off("baloot:state", onState);
        socket.off("baloot:hand", onHand);
        socket.off("baloot:played", onPlayed);
    };
  }, [socket, mySide, game, onPlayed]);

  // --- Logic Helpers ---

  function enterLobby() {
    setUiPhase("lobby");
  }

  // لو جاي من StageSelector → ابدأ مباشرة بدون splash/lobby
  React.useEffect(() => {
    if (autoStartAi) {
      startAiGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectMode(m: "classic" | "ranked", ai: boolean = false) {
      setGameMode(m);
      setIsAiGame(ai);
      
      if (m === "classic") {
          setMyCharacter(null);
          setBotCharacters({ N: null, E: null, W: null, S: null });
          setUiPhase("table_select");
      } else {
          // Ranked
          setUiPhase("character_select");
      }
  }

  function startAiGame() {
      // إعادة تهيئة كاملة
      game.players = ["N", "E", "S", "W"];
      game.dealer = "N";
      game.startRound();
      setTrickHistory([]);
      trickCounterRef.current = 0;

      setIsAiGame(true);
      setMySide("S");
      setTurn(game.players[game.bidderIndex]);
      setStarted(true);
      setEnded(false);
      setNs(0);
      setEw(0);
      
      // Assign random characters to bots if ranked
      if (gameMode === "ranked") {
          const chars = CHARACTERS.filter(c => !c.isFree).map(c => c.id);
          setBotCharacters({
              N: chars[Math.floor(Math.random() * chars.length)],
              E: chars[Math.floor(Math.random() * chars.length)],
              W: chars[Math.floor(Math.random() * chars.length)],
              S: null
          });
      }
      
      // مباشرة للـ bidding
      setUiPhase("bidding");
  }

  function selectCharacter(charId: CharacterType) {
      setMyCharacter(charId);
      setUiPhase("table_select");
  }

  function selectTable() {
    setUiPhase("table_select");
  }

  function beginMatchmaking(level: string) {
    // دايماً العب ضد AI (مفيش online server)
    startAiGame();
  }

  // Removed startDeal, revealMushteri, simulateBots

  function handleBid(m: Mode | "pass", t?: Suit) {
      // تحديد الـ side الفعلي
      const mySideActual = isAiGame ? "S" : (mySide ?? "S");
      const expected = game.players[game.bidderIndex];
      if (expected !== mySideActual) return;

      let success = false;
      if (m === "pass") {
          success = game.passBid(mySideActual);
      } else {
          success = game.proposeBid(mySideActual, { mode: m, trump: t ?? trump });
      }

      if (success) {
          if (!isAiGame && matchId && socket) {
              socket.emit("baloot:bid", { matchId, mode: m, trump: t ?? trump });
          }
          setTurn(game.next);
          if (game.phase === "playing" && uiPhase !== "playing") {
              setUiPhase("playing");
          } else if (game.phase === "bidding") {
              setUiPhase("bidding");
          } else if (game.phase === "ended") {
              setEnded(true);
              setUiPhase("ended");
          }
          setVisibleCount(prev => prev + 1);
      }
  }



  function legal(card: Card) {
    const leg = game.legalCards(mySide || "S");
    return leg.some((c) => c.suit === card.suit && c.rank === card.rank);
  }

  function play(card: Card) {
    if (!started || ended) return;
    if (turn !== (mySide || "S")) return;
    if (!legal(card)) return;

    if (isAiGame) {
        const trickSizeBefore = Object.keys(game.trick.cards).length;
        const success = game.play("S", card);
        if (success) {
            onPlayed({ side: "S", card });
            
            // لو التريك كان 3 كروت وبعد اللعبة اتمسح → احفظ التريك في التاريخ
            if (trickSizeBefore === 3 && Object.keys(game.trick.cards).length === 0) {
                captureTrick();
            }
            
            setTurn(game.next);
            if (game.phase === "playing" && uiPhase !== "playing") setUiPhase("playing");
            checkEnd();
            setVisibleCount(prev => prev + 1);
        }
        return;
    }

    if (matchId && socket) {
        socket.emit("baloot:play", { matchId, card });
    }
  }

  function checkEnd() {
    if (game.ended) {
        setEnded(true);
        let nsScore = game.scoreRound.NS;
        let ewScore = game.scoreRound.EW;
        
        if (isDoubleScore) {
            nsScore *= 2;
            ewScore *= 2;
        }

        setNs(nsScore);
        setEw(ewScore);
        setUiPhase("ended");
        // أضف نقطة لبلد اللاعب لو فريق N/S فاز (اللاعب في مكان S)
        const playerWon = nsScore > ewScore;
        if (playerWon && user?.country) {
          fetch("/api/country-war", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: user.country, delta: 1 }),
          }).catch(() => {});
        }
    } else {
        setNs(game.scoreRound.NS);
        setEw(game.scoreRound.EW);
    }
  }

  function activateAbility() {
      if (abilityStatus !== "ready" || !myCharacter) return;
      
      setAbilityStatus("active");
      setAbilityUsed("S"); // Trigger visual badge effect

      if (myCharacter === "sheikh") {
          // Select random opponent
          // const opponents: PlayerId[] = ["E", "W", "N"];
          // Let's assume E and W are opponents.
          const target = Math.random() > 0.5 ? "E" : "W";
          setAbilityTarget(target);
          
          // Reveal card logic
          const hand = game.hands[target];
          if (hand.length > 0) {
             const card = hand[Math.floor(Math.random() * hand.length)];
             setRevealedCard(card);
             setTimeout(() => setRevealedCard(null), 3000);
          }
          setAbilityStatus("used");
      } else if (myCharacter === "deceiver") {
          // Swap random card with random opponent (Simplified for bot mode)
          const target = Math.random() > 0.5 ? "E" : "W";
          setAbilityTarget(target);
          
          const myHand = game.hands.S;
          const opHand = game.hands[target];
          
          if (myHand.length > 0 && opHand.length > 0) {
              const myIdx = Math.floor(Math.random() * myHand.length);
              const opIdx = Math.floor(Math.random() * opHand.length);
              
              const temp = myHand[myIdx];
              myHand[myIdx] = opHand[opIdx];
              opHand[opIdx] = temp;
              
              // Trigger re-render or state update if needed, but game object mutation should reflect on next render
          }
          setAbilityStatus("used");
      } else if (myCharacter === "warrior") {
          setIsDoubleScore(true);
          setAbilityStatus("used");
      } else if (myCharacter === "madman") {
          // Random Chaos: Swap E and W hands!
          const temp = game.hands.E;
          game.hands.E = game.hands.W;
          game.hands.W = temp;
          setAbilityStatus("used");
          // Visual shake effect handled by UI
      }
  }

  function PlayerBadge({ id, name, pos }: { id: PlayerId; name: string; pos: "top" | "right" | "bottom" | "left" }) {
    const active = turn === id;
    const isMe = id === "S";
    
    // Position Logic with Tailwind Classes - Optimized for Square (Mobile) & Landscape (Desktop)
    let posClasses = "";
    if (pos === "top") posClasses = "top-[1%] left-1/2 -translate-x-1/2 scale-75 md:scale-90 origin-top";
    else if (pos === "bottom") posClasses = "bottom-[20%] left-[5%] md:bottom-[10%] md:left-[15%] scale-75 md:scale-90 origin-bottom-left"; // Moved "Me" to left to avoid hand overlap
    else if (pos === "left") posClasses = "left-[1%] top-1/2 -translate-y-1/2 scale-75 md:scale-90 origin-left";
    else if (pos === "right") posClasses = "right-[1%] top-1/2 -translate-y-1/2 scale-75 md:scale-90 origin-right";
      
    // Determine Avatar & Character Figure
    let avatarSrc = frameImg; 
    let CharacterFigure = null;
    let charId: CharacterType | null | undefined = null;

    if (gameMode === "ranked") {
        charId = isMe ? myCharacter : botCharacters[id];
        if (charId) {
            const char = CHARACTERS.find(c => c.id === charId);
            if (char) {
                avatarSrc = char.avatar;
                
                let figureClass = "";
                // Adjusted Figure Positions
                if (pos === "top") figureClass = "right-[90%] -bottom-4 h-32 w-32 md:h-48 md:w-48"; // Left of frame
                else if (pos === "bottom") figureClass = "left-[100%] bottom-0 h-40 w-40 md:h-56 md:w-56"; // Right of frame (since badge is on left)
                else if (pos === "right") figureClass = "top-[85%] right-0 h-28 w-28 md:h-40 md:w-40"; // Below frame
                else if (pos === "left") figureClass = "top-[85%] left-0 h-28 w-28 md:h-40 md:w-40"; // Below frame

                CharacterFigure = (
                    <motion.div 
                        className={`absolute pointer-events-none z-0 ${figureClass}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1,
                            y: [0, -5, 0] // Breathing animation
                        }}
                        transition={{ 
                            y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                            opacity: { duration: 0.5 }
                        }}
                    >
                         <Image 
                            src={char.avatar} 
                            alt={char.name} 
                            fill 
                            className="object-contain drop-shadow-2xl"
                            unoptimized
                         />
                    </motion.div>
                );
            }
        }
    } else {
        // Classic Mode
    }

    return (
      <div className={`absolute z-30 flex flex-col items-center ${posClasses}`}>
        {/* Character Figure (Rendered behind the badge but part of the group) */}
        {CharacterFigure}

        <motion.div 
            className="relative cursor-pointer group z-10"
            onClick={() => setActivePlayerMenu(activePlayerMenu === id ? null : id)}
            whileHover={{ scale: 1.05 }}
            animate={active ? { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 1.5 } } : {}}
        >
            {/* Timer / Active Glow Ring */}
            {active && (
                <div className="absolute -inset-4 rounded-full border-4 border-amber-400/50 animate-ping" />
            )}

            {/* Custom Local Asset Frame - Refactored to use AvatarFrame */}
            <div className={`relative ${id === "S" && turn === "S" ? "scale-110" : ""} transition-transform duration-300`}>
                <AvatarFrame 
                    avatar={
                        (gameMode === "ranked" && (isMe ? myCharacter : botCharacters[id])) 
                        ? (CHARACTERS.find(c => c.id === (isMe ? myCharacter : botCharacters[id]))?.avatar || frameImg)
                        : (isMe && user?.avatar ? user.avatar : frameImg) // Fallback for classic
                    }
                    frame={id === "N" ? platFrameImg : frameImg}
                    size={id === "S" ? "lg" : "md"}
                    showShine={active}
                />
                
                {/* Crown / Dealer Icon */}
                {id === "N" && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl drop-shadow-md filter animate-bounce z-30">
                        👑
                    </div>
                )}
                
                {/* Level Badge */}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-900 rounded-full border border-[#d4af37] flex items-center justify-center text-[10px] font-bold text-white shadow-lg z-30">
                    {Math.floor(Math.random() * 50) + 1}
                </div>
            </div>
            
            {/* Name Plate */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-28 z-30">
                <div className="relative bg-[#3e2723] border border-[#d4af37] rounded-lg px-2 py-0.5 shadow-lg text-center">
                    <div className="text-white font-bold text-xs truncate dir-rtl leading-tight">{name}</div>
                    <div className="text-[8px] text-amber-400 font-mono leading-none">{gameMode === "ranked" ? "RANKED" : "CLASSIC"}</div>
                    
                    {/* Decorative ends */}
                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-[#d4af37] rotate-45 -translate-y-1/2" />
                    <div className="absolute top-1/2 -right-1 w-2 h-2 bg-[#d4af37] rotate-45 -translate-y-1/2" />
                </div>
            </div>

            {/* Ability Effect Overlay */}
            <AnimatePresence>
                {abilityUsed === id && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 text-purple-400 font-black text-sm whitespace-nowrap z-40 bg-black/80 px-4 py-2 rounded-lg border border-purple-500 shadow-[0_0_20px_purple]"
                    >
                        {isMe && myCharacter ? CHARACTERS.find(c => c.id === myCharacter)?.name : "ABILITY"} ACTIVATED!
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Sheikh Reveal */}
            <AnimatePresence>
                {revealedCard && abilityTarget === id && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-400 backdrop-blur-sm">
                            <ProfessionalCard suit={revealedCard.suit} rank={revealedCard.rank} width={60} height={90} skin="classic" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lightning Effect on Badge */}
            <AnimatePresence>
                {lightning === id && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 1.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 pointer-events-none"
                    >
                         <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_cyan]">
                             <path d="M50 0 L60 40 L90 40 L40 100 L50 60 L20 60 Z" fill="cyan" stroke="white" strokeWidth="2" />
                         </svg>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Emoji Chat Bubble */}
            <AnimatePresence>
                {chat && chat.by === id && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.5 }}
                        animate={{ opacity: 1, y: -80, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-2xl rounded-bl-none shadow-xl border-2 border-zinc-200 min-w-[100px] text-center z-50"
                    >
                        <span className="text-2xl">{chat.emoji || "💬"}</span>
                        <p className="text-sm font-bold">{chat.text}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>

        {/* Player Menu (Profile/Gifts) */}
        <AnimatePresence>
            {activePlayerMenu === id && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-28 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-2xl p-4 w-48 shadow-2xl z-50 flex flex-col gap-2"
                >
                    <div className="text-center border-b border-zinc-800 pb-2 mb-2">
                        <div className="font-bold text-white">{name}</div>
                        <div className="text-xs text-zinc-400">Level 50 • Baloot Master</div>
                    </div>
                        <div className="grid grid-cols-4 gap-2"></div>
                    {isMe && (
                        <div className="grid grid-cols-2 gap-1 border-t border-zinc-800 pt-2 mt-1">
                            {[1,2,3,4].map(i => (
                                <button key={i} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 rounded px-2 py-1 text-white" onClick={() => {
                                    setChat({ by: id, text: t[`baloot_phrase_${i}` as keyof typeof t] });
                                    setActivePlayerMenu(null);
                                    setTimeout(() => setChat(null), 3000);
                                }}>{t[`baloot_phrase_${i}` as keyof typeof t]}</button>
                            ))}
                        </div>
                    )}
                    {myCharacter && abilityStatus === "ready" && id !== "S" && (
                        <button 
                            onClick={activateAbility}
                            className={`mt-2 w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 ${CHARACTERS.find(c => c.id === myCharacter)?.color} bg-zinc-800 hover:bg-zinc-700`}
                        >
                            <span>⚡</span> استخدم القدرة
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    );
  }

  // --- Theme Styles ---
  const getTableStyle = () => {
      const skin = equipped.baloot_skin || "classic";
      if (skin === "neon") return "bg-black border-purple-500 border-[3px] sm:border-[4px] rounded-[1.5rem]";
      return "bg-[#3e1f14] border-[#d4af37] border-[4px] sm:border-[6px] md:border-[10px] ring-1 sm:ring-2 md:ring-4 ring-[#2c150f] rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem]"; 
  };

  const getTableTexture = () => {
      const skin = equipped.baloot_skin || "classic";
      if (skin === "neon") return "bg-[linear-gradient(45deg,rgba(168,85,247,0.1)_25%,transparent_25%,transparent_50%,rgba(168,85,247,0.1)_50%,rgba(168,85,247,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px]";
      return "opacity-80 bg-blend-soft-light"; // Increased opacity for better visibility as requested
  };

  // --- Main Render ---
  const activeTrick = frozenTrick || game.trick.cards;
  const skinName = (equipped.baloot_skin.replace("skin_", "") || "classic") as any;

  return (
    <div className={`min-h-screen min-h-dvh font-sans ${equipped.baloot_skin === "neon" ? "bg-black text-white" : "bg-zinc-950 text-white"}`} style={{ fontFamily: "var(--font-cairo),sans-serif" }}>
      <div className="w-full h-full min-h-screen relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <style>{`
          @keyframes bot-bid-think { 0%,100%{ opacity:.3; transform:scale(0.8); } 50%{ opacity:1; transform:scale(1.2); } }
        `}</style>
        {equipped.baloot_skin === "neon" ? (
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1b4b_0%,#000000_100%)]" />
        ) : equipped.baloot_skin === "royal" ? (
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] bg-cover bg-center opacity-20" />
        ) : (
             // Default Professional Majlis Theme
             <div className="absolute inset-0 bg-[#2b1d16]">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80" />
             </div>
        )}
      </div>

      <div className="relative z-10 w-full h-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen overflow-hidden">
        
        {/* Header / Scoreboard */}
        {started && uiPhase !== "splash" && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-black/60 backdrop-blur-md px-10 py-3 rounded-2xl border-2 border-[#d4af37] shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 scale-75 md:scale-100 origin-top">
                {/* Team Us */}
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold">{t.score_us}</span>
                    <span className="text-3xl font-black text-white drop-shadow-md">{ns}</span>
                </div>
                
                {/* Divider */}
                <div className="h-10 w-[2px] bg-gradient-to-b from-transparent via-[#d4af37] to-transparent opacity-50" />
                
                {/* Team Them */}
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[#d4af37] uppercase tracking-widest font-bold">{t.score_them}</span>
                    <span className="text-3xl font-black text-white drop-shadow-md">{ew}</span>
                </div>

                {/* Trump Indicator */}
                {mode === "hokom" && (
                     <div className="absolute -right-14 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg border-2 border-[#d4af37]" title={`Trump: ${trump}`}>
                        <div className="drop-shadow-md">{suitIcon(trump, 24, 24)}</div>
                     </div>
                )}
            </div>
        )}

        {/* Game Area */}
        {started && (
             <motion.div 
                animate={{ rotate: tableRotation }}
                transition={{ ease: "linear", duration: 0.1 }}
                className="relative w-full flex items-center justify-center px-1"
                style={{ height: "clamp(220px, min(80vw, 48vh), 580px)", maxHeight: "calc(100dvh - 200px)" }}
             >
                {/* ━━━ خيمة بلوت العربية ━━━ */}
                <div className="absolute inset-x-2 inset-y-1 md:inset-x-4 md:inset-y-2 overflow-hidden" style={{ borderRadius: "2rem" }}>
                  <svg
                    viewBox="0 0 800 480"
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0 w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      {/* تدرجات الألوان */}
                      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0a0514"/>
                        <stop offset="100%" stopColor="#1a0a2e"/>
                      </linearGradient>
                      <linearGradient id="tentBodyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B1a1a"/>
                        <stop offset="40%" stopColor="#6b1010"/>
                        <stop offset="100%" stopColor="#3d0808"/>
                      </linearGradient>
                      <linearGradient id="tentStripeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37"/>
                        <stop offset="100%" stopColor="#a07820"/>
                      </linearGradient>
                      <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2a1800"/>
                        <stop offset="100%" stopColor="#1a0e00"/>
                      </linearGradient>
                      <linearGradient id="carpetGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#1a0a2e"/>
                        <stop offset="50%" stopColor="#2d1060"/>
                        <stop offset="100%" stopColor="#1a0a2e"/>
                      </linearGradient>
                      <linearGradient id="lampGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37"/>
                        <stop offset="100%" stopColor="#7a5a00"/>
                      </linearGradient>
                      <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#fffbe0" stopOpacity="0.9"/>
                        <stop offset="100%" stopColor="#d4af37" stopOpacity="0"/>
                      </radialGradient>
                      <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity="0.08"/>
                        <stop offset="100%" stopColor="#d4af37" stopOpacity="0"/>
                      </radialGradient>
                      <filter id="softGlow">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
                        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                      </filter>
                      <pattern id="arabPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#d4af37" strokeWidth="0.4" opacity="0.25"/>
                        <circle cx="20" cy="20" r="3" fill="none" stroke="#d4af37" strokeWidth="0.4" opacity="0.2"/>
                        <path d="M0 0 L10 10 M30 10 L40 0 M0 40 L10 30 M30 30 L40 40" stroke="#d4af37" strokeWidth="0.3" opacity="0.15"/>
                      </pattern>
                      <pattern id="carpetPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <rect width="60" height="60" fill="none"/>
                        <path d="M30 5 L55 30 L30 55 L5 30 Z" fill="none" stroke="#d4af37" strokeWidth="0.8" opacity="0.3"/>
                        <path d="M30 15 L45 30 L30 45 L15 30 Z" fill="none" stroke="#c084fc" strokeWidth="0.5" opacity="0.2"/>
                        <circle cx="30" cy="30" r="4" fill="none" stroke="#d4af37" strokeWidth="0.6" opacity="0.25"/>
                        <path d="M30 0 L30 10 M60 30 L50 30 M30 60 L30 50 M0 30 L10 30" stroke="#d4af37" strokeWidth="0.4" opacity="0.2"/>
                      </pattern>
                    </defs>

                    {/* ── خلفية السماء الليلية ── */}
                    <rect width="800" height="480" fill="url(#skyGrad)"/>

                    {/* نجوم صغيرة */}
                    {[
                      [60,30],[120,15],[200,45],[320,20],[480,35],[600,18],[700,42],[750,25],
                      [90,80],[180,65],[350,75],[520,60],[660,85],[40,120],[780,100]
                    ].map(([x,y],i)=>(
                      <circle key={i} cx={x} cy={y} r={i%3===0?1.5:1} fill="white" opacity={0.4+i%3*0.2}/>
                    ))}

                    {/* ── جسم الخيمة الرئيسي ── */}
                    {/* الظل الخلفي للخيمة */}
                    <path d="M -20 480 L 80 160 L 400 80 L 720 160 L 820 480 Z"
                      fill="#1a0505" opacity="0.6"/>

                    {/* جسم الخيمة */}
                    <path d="M 0 480 L 90 170 L 400 90 L 710 170 L 800 480 Z"
                      fill="url(#tentBodyGrad)"/>

                    {/* خطوط الشرائط الذهبية على الخيمة */}
                    {[0.22, 0.38, 0.62, 0.78].map((t, i) => {
                      const x = 400;
                      const topY = 90;
                      // نقاط على حافتي الخيمة
                      const lx = 90 + (400-90)*t*0 | 0;
                      const rx = 710 - (710-400)*t*0 | 0;
                      return (
                        <line key={i}
                          x1={90 + (400-90)*t}
                          y1={170 + (90-170)*t + 480*t*0.5}
                          x2={90 + (400-90)*t}
                          y2={480}
                          stroke="#d4af37" strokeWidth="1.5" opacity="0.35"
                        />
                      );
                    })}

                    {/* شرائط ذهبية أفقية على الخيمة */}
                    <path d="M 105 260 Q 400 220 695 260" fill="none" stroke="#d4af37" strokeWidth="2" opacity="0.4"/>
                    <path d="M 135 340 Q 400 305 665 340" fill="none" stroke="#d4af37" strokeWidth="1.5" opacity="0.3"/>
                    <path d="M 55 180 Q 400 145 745 180" fill="none" stroke="#d4af37" strokeWidth="2.5" opacity="0.5"/>

                    {/* زخرفة عريبية على رأس الخيمة */}
                    <path d="M 400 90 L 390 110 L 400 105 L 410 110 Z" fill="#d4af37" opacity="0.9"/>
                    <circle cx="400" cy="85" r="6" fill="#d4af37" opacity="0.9"/>
                    <circle cx="400" cy="78" r="3" fill="#fff" opacity="0.7"/>
                    {/* خطوط من القمة */}
                    {[-40,-20,0,20,40].map((dx,i)=>(
                      <line key={i} x1={400} y1={90} x2={400+dx*5} y2={140}
                        stroke="#d4af37" strokeWidth="1" opacity="0.3"/>
                    ))}

                    {/* ── الزخرفة على حواف الخيمة ── */}
                    {/* فرينج / شراريب على الحافة السفلية للسقف */}
                    {Array.from({length:25}).map((_,i)=>{
                      const progress = i/24;
                      const x = 90 + progress*(710-90);
                      const baseY = 170 + (progress < 0.5 ? (0.5-progress)*2*(90-170) : (progress-0.5)*2*(90-170));
                      // خط بسيط من الحافة للأسفل
                      return (
                        <line key={i}
                          x1={x} y1={baseY+2}
                          x2={x + (i%2===0?0:3)} y2={baseY+14}
                          stroke="#d4af37" strokeWidth="1.2" opacity="0.6"
                        />
                      );
                    })}

                    {/* ── نمط عربي على الأرضية ── */}
                    <rect x="0" y="300" width="800" height="180" fill="url(#groundGrad)"/>

                    {/* سجادة المجلس */}
                    <rect x="60" y="310" width="680" height="155" rx="8"
                      fill="url(#carpetGrad)"/>
                    <rect x="60" y="310" width="680" height="155" rx="8"
                      fill="url(#carpetPattern)" opacity="0.9"/>
                    {/* إطار السجادة */}
                    <rect x="60" y="310" width="680" height="155" rx="8"
                      fill="none" stroke="#d4af37" strokeWidth="2.5" opacity="0.6"/>
                    <rect x="70" y="318" width="660" height="139" rx="6"
                      fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.3"/>

                    {/* نمط عربي عام كـ overlay */}
                    <rect x="0" y="0" width="800" height="480"
                      fill="url(#arabPattern)" opacity="0.5"/>

                    {/* ── فانوس معلق في المنتصف ── */}
                    {/* الخيط */}
                    <line x1="400" y1="90" x2="400" y2="145" stroke="#d4af37" strokeWidth="1.5" opacity="0.8"/>

                    {/* ضوء الفانوس */}
                    <ellipse cx="400" cy="175" rx="55" ry="55"
                      fill="url(#lampGlow)" opacity="0.5"/>

                    {/* جسم الفانوس */}
                    <g transform="translate(400, 165)" filter="url(#softGlow)">
                      {/* القاعدة العلوية */}
                      <path d="M -10 -22 L 10 -22 L 14 -14 L -14 -14 Z" fill="url(#lampGrad)"/>
                      {/* الجسم الرئيسي */}
                      <path d="M -14 -14 L -18 8 L -12 20 L 12 20 L 18 8 L 14 -14 Z"
                        fill="url(#lampGrad)" stroke="#a07820" strokeWidth="0.5"/>
                      {/* زجاج متوهج */}
                      <path d="M -13 -13 L -16 8 L -11 18 L 11 18 L 16 8 L 13 -13 Z"
                        fill="#fffbe0" opacity="0.15"/>
                      {/* خطوط الفانوس */}
                      {[-8,0,8].map((dx,i)=>(
                        <line key={i} x1={dx} y1={-14} x2={dx} y2={20}
                          stroke="#a07820" strokeWidth="0.8" opacity="0.7"/>
                      ))}
                      {/* القاعدة السفلية */}
                      <path d="M -12 20 L -8 28 L 8 28 L 12 20 Z" fill="url(#lampGrad)"/>
                      <ellipse cx="0" cy="28" rx="5" ry="2" fill="#d4af37" opacity="0.8"/>
                    </g>

                    {/* ── فوانيس صغيرة جانبية ── */}
                    {[{x:160,y:155},{x:640,y:155}].map((pos,i)=>(
                      <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                        <line x1="0" y1="-60" x2="0" y2="-18" stroke="#d4af37" strokeWidth="1" opacity="0.6"/>
                        <ellipse cx="0" cy="0" rx="30" ry="30" fill="url(#lampGlow)" opacity="0.3"/>
                        <path d="M -7 -18 L 7 -18 L 9 -12 L -9 -12 Z" fill="url(#lampGrad)" opacity="0.9"/>
                        <path d="M -9 -12 L -11 4 L -7 12 L 7 12 L 11 4 L 9 -12 Z"
                          fill="url(#lampGrad)" stroke="#a07820" strokeWidth="0.4" opacity="0.9"/>
                        <path d="M -7 12 L -5 18 L 5 18 L 7 12 Z" fill="url(#lampGrad)" opacity="0.9"/>
                      </g>
                    ))}

                    {/* ── توهج المنتصف (جوه الخيمة) ── */}
                    <ellipse cx="400" cy="320" rx="300" ry="120"
                      fill="url(#centerGlow)" opacity="0.6"/>

                    {/* ── ديكورات إضافية ── */}
                    {/* وسادات / مقاعد */}
                    {[{x:130,w:100},{x:340,w:120},{x:580,w:100}].map((p,i)=>(
                      <g key={i}>
                        <ellipse cx={p.x+p.w/2} cy={420} rx={p.w/2} ry={14}
                          fill="#4a1060" stroke="#d4af37" strokeWidth="1" opacity="0.7"/>
                        <ellipse cx={p.x+p.w/2} cy={414} rx={p.w/2-4} ry={10}
                          fill="#6b1090" opacity="0.6"/>
                        <line x1={p.x+20} y1={414} x2={p.x+p.w-20} y2={414}
                          stroke="#d4af37" strokeWidth="0.8" opacity="0.4"/>
                      </g>
                    ))}

                    {/* إبريق قهوة */}
                    <g transform="translate(695, 370)" opacity="0.8">
                      <ellipse cx="0" cy="22" rx="18" ry="6" fill="#1a0e00" opacity="0.5"/>
                      <path d="M -10 20 Q -12 0 -5 -15 Q 0 -22 5 -15 Q 12 0 10 20 Z"
                        fill="#8B4513" stroke="#d4af37" strokeWidth="0.8"/>
                      <path d="M 10 5 Q 20 5 20 12 Q 20 18 10 15" fill="none" stroke="#8B4513" strokeWidth="3"/>
                      <ellipse cx="0" cy="-16" rx="6" ry="3" fill="#6B3410"/>
                      <path d="M 0 -19 Q 0 -28 3 -32" fill="none" stroke="#8B4513" strokeWidth="1.5"/>
                    </g>

                    {/* فنجان */}
                    <g transform="translate(650, 388)" opacity="0.8">
                      <path d="M -8 12 Q -10 0 -6 -8 L 6 -8 Q 10 0 8 12 Z"
                        fill="#fff8e1" stroke="#d4af37" strokeWidth="0.6"/>
                      <ellipse cx="0" cy="12" rx="8" ry="3" fill="#e0c84a" opacity="0.8"/>
                      <path d="M 8 0 Q 14 0 14 5 Q 14 10 8 8" fill="none" stroke="#d4af37" strokeWidth="1.2"/>
                    </g>

                    {/* مسبحة */}
                    <g transform="translate(108, 375)" opacity="0.75">
                      <path d="M 0 0 Q 15 -20 5 -40 Q -5 -55 0 -70" fill="none" stroke="#4a2060" strokeWidth="1.5"/>
                      {[0,10,20,30,40,50,58,65].map((t,i)=>{
                        const y = -t;
                        const x = t < 35 ? t*0.2 : (t-35)*(-0.3)+7;
                        return <circle key={i} cx={x} cy={y} r="3" fill="#7b2d8b" stroke="#9b4dab" strokeWidth="0.5"/>;
                      })}
                    </g>
                  </svg>
                </div>

                {/* Dealing Animation (Flying Cards) */}
                <AnimatePresence>
                    {uiPhase === "deal" && (
                        <>
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                                    animate={{ 
                                        opacity: 0, 
                                        x: [0, (Math.random() - 0.5) * 600], 
                                        y: [0, (Math.random() - 0.5) * 600],
                                        rotate: Math.random() * 360
                                    }}
                                    transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                                    className="absolute left-1/2 top-1/2 z-20 w-16 h-24 bg-blue-800 rounded-lg border-2 border-white shadow-xl"
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Players */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                     {(["N", "E", "S", "W"] as PlayerId[]).map(pid => {
                         const relPos = getRelativePos(pid, mySide || "S");
                         // 0: Bottom, 1: Left, 2: Top, 3: Right
                         const posName = ["bottom", "left", "top", "right"][relPos] as "bottom" | "left" | "top" | "right";
                         const pName = pid === mySide ? (user?.name || "أنت") : `Player ${pid}`;
                         return (
                             <div key={pid} className="pointer-events-auto">
                                 <PlayerBadge id={pid} name={pName} pos={posName} />
                             </div>
                         );
                     })}
                </div>

                {/* Center Trick Area */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" ref={centerAreaRef}>
                <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full border border-white/5 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">

                {/* ━━━ طبقات التريكات السابقة (تظهر كطبقات فوق بعض) ━━━ */}
                {trickHistory.map((trick, histIdx) => (
                <div key={trick.id} className="absolute inset-0 pointer-events-none">
                {Object.entries(trick.cards).map(([pid, card], cardIdx) => {
                if (!card) return null;
                // كل تريك بياخد offset بسيط عشان يبان الطبقات
                const stackOffset = (histIdx % 6) * 2;
                const angle = (histIdx * 17 + cardIdx * 7) % 30 - 15;
                const relPos = getRelativePos(pid as PlayerId, mySide || "S");
                const xOffset = relPos === 0 ? 0 : relPos === 1 ? -28 : relPos === 2 ? 0 : 28;
                const yOffset = relPos === 0 ? 26 : relPos === 1 ? 0 : relPos === 2 ? -26 : 0;
                return (
                <div
                  key={`${trick.id}-${pid}`}
                  className="absolute"
                style={{
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${xOffset + stackOffset}px), calc(-50% + ${yOffset + stackOffset}px)) rotate(${angle}deg)`,
                opacity: Math.max(0.15, 0.6 - (trickHistory.length - 1 - histIdx) * 0.12),
                zIndex: histIdx,
                }}
                >
                <ProfessionalCard
                suit={card.suit}
                rank={card.rank}
                width={70}
                height={105}
                skin={skinName}
                />
                </div>
                );
                })}
                </div>
                ))}

                {/* ━━━ الكروت الحالية في التريك ━━━ */}
                <AnimatePresence>
                {Object.entries(activeTrick).map(([pid, card]) => {
                        if (!card) return null;
                                 
                                 const relPos = getRelativePos(pid as PlayerId, mySide || "S");
                                 // 0: Bottom, 1: Left, 2: Top, 3: Right
                                 
                                 // Rotation: Bottom(0)->0, Left(1)->90, Top(2)->180, Right(3)->-90
                                 const rotation = relPos === 0 ? 0 : relPos === 1 ? 90 : relPos === 2 ? 180 : -90;
                                 
                                 // Offsets
                                 const xOffset = relPos === 0 ? 0 : relPos === 1 ? -30 : relPos === 2 ? 0 : 30;
                                 const yOffset = relPos === 0 ? 30 : relPos === 1 ? 0 : relPos === 2 ? -30 : 0;
                                 
                                 return (
                                     <motion.div
                                         key={pid}
                                         initial={{ opacity: 0, scale: 1.5, y: relPos === 0 ? 200 : relPos === 2 ? -200 : 0, x: relPos === 1 ? -200 : relPos === 3 ? 200 : 0 }}
                                         animate={{ 
                                             opacity: 1, 
                                             scale: 0.9, 
                                             x: xOffset + (Math.random() * 6 - 3), 
                                             y: yOffset + (Math.random() * 6 - 3), 
                                             rotate: rotation + (Math.random() * 6 - 3) 
                                         }}
                                         exit={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
                                         transition={{ type: "spring", damping: 15, stiffness: 200 }}
                                         className="absolute z-30"
                                     >
                                         <ProfessionalCard 
                                            suit={card.suit} 
                                            rank={card.rank} 
                                            width={80} 
                                            height={120} 
                                            skin={skinName} 
                                         />
                                     </motion.div>
                                 );
                             })}
                         </AnimatePresence>
                         
                         {/* Mushteri/Bidding Card */}
                         <AnimatePresence>
                             {uiPhase === "bidding" && mushteri && (
                                <motion.div 
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                                    initial={{ rotateY: 180, scale: 0.5, opacity: 0 }} 
                                    animate={{ rotateY: flip ? 0 : 180, scale: 1.2, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.6, type: "spring" }}
                                >
                                    <ProfessionalCard 
                                        suit={mushteri.suit} 
                                        rank={mushteri.rank} 
                                        width={110} 
                                        height={160} 
                                        skin={skinName}
                                    />
                                </motion.div>
                             )}
                         </AnimatePresence>

                        {/* Lead Suit Indicator */}
                        {lead && uiPhase === "playing" && (
                            <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 flex items-center gap-2 z-20 shadow-lg" 
                                title="Lead Suit"
                            >
                                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Lead</span>
                                <span className="text-xl drop-shadow-md filter">{suitIcon(lead, 20, 20)}</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* مؤشر انتظار لما البوت بيـ bid */}
                <AnimatePresence>
                    {uiPhase === "bidding" && turn !== "S" && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-48 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black/70 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10"
                        >
                            <div className="flex gap-1">
                                {[0,1,2].map(i => (
                                    <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#f5a623", animation:`bot-bid-think 1s ease-in-out ${i*0.2}s infinite` }}/>
                                ))}
                            </div>
                            <span className="text-sm font-bold text-white/70">
                                {game.players[game.bidderIndex]} يفكر في العطاء...
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bidding Controls — تظهر فقط لما دور اللاعب في الـ bidding */}
                <AnimatePresence>
                    {uiPhase === "bidding" && turn === "S" && (
                        <motion.div 
                            initial={{ y: 50, opacity: 0, scale: 0.9 }}
                            animate={{ y: -50, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.9 }}
                            className="absolute bottom-48 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/80 backdrop-blur-xl border-2 border-[#d4af37] p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 ring-1 ring-white/20"
                        >
                             <div className="flex flex-col gap-3">
                                <div className="text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">{t.bidding}</div>
                                <div className="flex gap-4">
                                    <button onClick={() => handleBid("sun")} className="group relative w-20 h-20 rounded-xl bg-gradient-to-br from-[#3e2723] to-black border-2 border-[#d4af37] p-1 shadow-lg hover:scale-105 transition-all active:scale-95">
                                        <div className="w-full h-full bg-black/50 rounded-lg flex flex-col items-center justify-center">
                                            <span className="text-3xl drop-shadow-md text-[#d4af37]">☀️</span>
                                            <span className="text-xs font-black text-[#d4af37] mt-1 drop-shadow-sm">{t.sun}</span>
                                        </div>
                                    </button>
                                    <button onClick={() => handleBid("hokom", trump)} className="group relative w-20 h-20 rounded-xl bg-gradient-to-br from-[#1a4d2e] to-black border-2 border-[#d4af37] p-1 shadow-lg hover:scale-105 transition-all active:scale-95">
                                        <div className="w-full h-full bg-black/50 rounded-lg flex flex-col items-center justify-center">
                                            <span className="text-3xl drop-shadow-md text-[#d4af37]">👑</span>
                                            <span className="text-xs font-black text-[#d4af37] mt-1 drop-shadow-sm">{t.hokom} ({trump})</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-[#d4af37] to-transparent" />
                            
                            <div className="flex flex-col gap-3">
                                <div className="text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">تحديد الحكم</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["H", "S", "D", "C"] as Suit[]).map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => setTrump(s)} 
                                            className={`
                                                w-9 h-9 rounded-lg flex items-center justify-center border transition-all shadow-md
                                                ${trump === s 
                                                    ? "bg-[#d4af37] border-white text-black scale-110 shadow-amber-500/20" 
                                                    : "bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-400"}
                                            `}
                                        >
                                            {suitIcon(s, 20, 20)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-[#d4af37] to-transparent" />
                            
                            <button onClick={() => handleBid("pass")} className="w-16 h-16 rounded-full bg-red-900/20 border-2 border-red-500/50 text-red-500 font-bold hover:bg-red-900/80 hover:text-white hover:border-red-500 transition-all flex flex-col items-center justify-center gap-1 shadow-inner active:scale-95">
                                <span className="text-xl">✕</span>
                                <span className="text-[8px]">{t.pass}</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hand Area (Fan Layout) */}
                <div className="absolute bottom-[-5%] md:bottom-[-2%] left-1/2 -translate-x-1/2 z-40 w-full flex justify-center" ref={handAreaRef}>
                     <div className="relative w-full max-w-[600px] h-[120px] md:h-[180px] flex justify-center items-end">
                         <AnimatePresence>
                         {game.hands[mySide || "S"].map((card, i) => {
                             if (!card) return null;
                             const total = game.hands[mySide || "S"].length;
                             
                             // Calculate arc position
                             const angle = (i - (total - 1) / 2) * 5; 
                             const yOffset = Math.abs(i - (total - 1) / 2) * 8; 
                             const can = legal(card);
                             
                             const spacing = typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 25;

                             return (
                                 <motion.div
                                     key={`${card.suit}-${card.rank}-${i}`}
                                     initial={{ y: 200, opacity: 0 }}
                                     animate={{ 
                                         y: yOffset, 
                                         rotate: angle,
                                         x: (i - (total - 1) / 2) * spacing, 
                                         opacity: 1,
                                         scale: 1
                                     }}
                                     whileHover={{ y: -40 + yOffset, scale: 1.1, zIndex: 100 }}
                                     transition={{ type: "spring", stiffness: 180, damping: 22 }}
                                     className="absolute bottom-2 md:bottom-6 origin-bottom cursor-pointer"
                                     style={{ 
                                         zIndex: i,
                                         transformOrigin: "center 200%"
                                     }}
                                     onClick={() => can && play(card)}
                                 >
                                     <div style={{ width: "clamp(52px,8vw,110px)", height: "clamp(78px,12vw,165px)" }}>
                                         <ProfessionalCard 
                                            suit={card.suit} 
                                            rank={card.rank} 
                                            width="100%" 
                                            height="100%" 
                                            skin={skinName} 
                                            className="hover:brightness-110"
                                         />
                                     </div>
                                 </motion.div>
                             );
                         })}
                         </AnimatePresence>
                     </div>
                </div>
             </motion.div>
        )}

        {/* Flying Card Animation Layer */}
        {fly && (
            <div className="fixed inset-0 pointer-events-none z-[100]">
                <motion.div
                    initial={{ x: fly.x, y: fly.y, rotate: 0, scale: 1 }}
                    animate={{ x: fly.toX, y: fly.toY, rotate: fly.rotate, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="absolute"
                >
                    <ProfessionalCard 
                        suit={fly.card.suit} 
                        rank={fly.card.rank} 
                        width={110} 
                        height={160} 
                        skin={equipped.baloot_skin as "classic"}
                    />
                </motion.div>
            </div>
        )}
        
        {/* Overlays (Splash, Lobby, etc.) */}
        <AnimatePresence mode="wait">
            {uiPhase === "splash" && (
                <motion.div key="splash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-8xl mb-6">♠</motion.div>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 mb-8 font-serif">BALOOT VIP</h1>
                    <button onClick={enterLobby} className="px-12 py-4 bg-white text-black font-bold rounded-full text-xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        {t.play}
                    </button>
                </motion.div>
            )}
            
            {/* LOBBY PHASE - محسّن */}
            {uiPhase === "lobby" && (
                <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex flex-col text-white overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #0d0a0e 0%, #1a0f0a 40%, #0a0d14 100%)" }}
                >
                    {/* خلفية زخرفية */}
                    <div className="absolute inset-0 pointer-events-none opacity-5"
                        style={{ backgroundImage: "repeating-linear-gradient(45deg, #d4af37 0px, #d4af37 1px, transparent 1px, transparent 40px), repeating-linear-gradient(-45deg, #d4af37 0px, #d4af37 1px, transparent 1px, transparent 40px)" }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

                    {/* Header */}
                    <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/5" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(20px)" }}>
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfile(true)}>
                            <div className="relative">
                                <AvatarFrame avatar={user?.avatar || frameImg} size="sm" frame={frameImg} />
                                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[9px] font-black border border-black text-black">50</div>
                            </div>
                            <div>
                                <div className="font-black text-sm text-white leading-tight">{user?.name || "ضيف"}</div>
                                <div className="text-[10px] text-amber-400 font-bold tracking-widest">VIP</div>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black tracking-widest" style={{ color: "#d4af37", textShadow: "0 0 20px rgba(212,175,55,0.5)" }}>♠ بلوت VIP ♠</div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37" }}>
                                🪙 {(user?.coins ?? 0).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#c084fc" }}>
                                💎 {(user?.gems ?? 0).toLocaleString()}
                            </div>
                        </div>
                    </header>

                    {/* Main */}
                    <div className="relative z-10 flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
                        {/* بطاقة اللعب الرئيسية */}
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setUiPhase("mode_select")}
                            className="relative rounded-3xl overflow-hidden cursor-pointer flex-shrink-0"
                            style={{ height: 180, background: "linear-gradient(135deg, #1a0a05, #3e1f0a, #1a0a05)", border: "2px solid rgba(212,175,55,0.4)", boxShadow: "0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.2)" }}
                        >
                            {/* بطاقات ديكور */}
                            {["♠","♥","♦","♣"].map((s, i) => (
                                <div key={i} className="absolute text-5xl font-black select-none pointer-events-none" style={{ opacity: 0.06, top: i < 2 ? "10%" : "50%", right: `${10 + i * 20}%`, transform: `rotate(${i * 15 - 20}deg)`, color: i % 2 ? "#ef4444" : "#fff" }}>{s}</div>
                            ))}
                            <div className="absolute inset-0 flex flex-col justify-center px-8">
                                <div className="inline-flex items-center gap-2 mb-3">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest" style={{ background: "#d4af37", color: "#000" }}>الموسم 5</span>
                                </div>
                                <h1 className="text-4xl font-black leading-none mb-2" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
                                    <span className="text-white">العب </span>
                                    <span style={{ color: "#d4af37" }}>بلوت</span>
                                </h1>
                                <p className="text-sm text-white/50 mb-4">تحدى أقوى اللاعبين وثبت أنك الأفضل</p>
                                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm w-fit" style={{ background: "#d4af37", color: "#000" }}>
                                    العب الآن ←
                                </div>
                            </div>
                        </motion.div>

                        {/* شبكة الخيارات */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: "🎭", label: "الشخصيات", color: "#a78bfa", border: "rgba(167,139,250,0.3)", action: () => setUiPhase("character_select") },
                                { icon: "🛒", label: "المتجر",    color: "#34d399", border: "rgba(52,211,153,0.3)",  action: () => setShowStore(true) },
                                { icon: "🏆", label: "المتصدرون", color: "#f59e0b", border: "rgba(245,158,11,0.3)",  action: () => {} },
                            ].map(item => (
                                <motion.div key={item.label} whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={item.action}
                                    className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl cursor-pointer"
                                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${item.border}`, backdropFilter: "blur(10px)" }}
                                >
                                    <div className="text-3xl">{item.icon}</div>
                                    <div className="text-xs font-bold" style={{ color: item.color }}>{item.label}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* أزرار اللعب السريع */}
                        <div className="grid grid-cols-2 gap-3">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => selectMode("classic", true)}
                                className="flex items-center gap-3 px-4 py-4 rounded-2xl cursor-pointer"
                                style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.08))", border: "1px solid rgba(52,211,153,0.3)" }}
                            >
                                <div className="text-3xl">🤖</div>
                                <div>
                                    <div className="font-black text-sm text-white">تدريب AI</div>
                                    <div className="text-[11px] text-emerald-400">كلاسيك مجاني</div>
                                </div>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => selectMode("ranked", true)}
                                className="flex items-center gap-3 px-4 py-4 rounded-2xl cursor-pointer"
                                style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(180,140,30,0.08))", border: "1px solid rgba(212,175,55,0.3)" }}
                            >
                                <div className="text-3xl">👑</div>
                                <div>
                                    <div className="font-black text-sm text-white">رانكد AI</div>
                                    <div className="text-[11px]" style={{ color: "#d4af37" }}>مع شخصيات</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* آخر نتائج */}
                        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">المتصدرون</div>
                            {[["#1 سلطان البلوت", "2,840 نقطة", "#d4af37"], ["#2 أبو الملوك", "2,610 نقطة", "#9ca3af"], ["#3 الأسطورة", "2,390 نقطة", "#b45309"]].map(([name, score, color], i) => (
                                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>{i+1}</div>
                                        <span className="text-sm font-bold text-white/80">{name}</span>
                                    </div>
                                    <span className="text-xs font-mono" style={{ color }}>{score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
            {/* MODE SELECTION PHASE */}
            {uiPhase === "mode_select" && (
                 <motion.div key="mode_select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#0f0505]">
                     <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-30 z-0 pointer-events-none" />
                     <div className="fixed inset-0 bg-gradient-to-b from-[#2c0b0e] to-[#0f0505] z-[-1] pointer-events-none" />
                     
                     <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-8 p-4">
                         <div className="text-center">
                             <h2 className="text-4xl md:text-5xl font-black text-amber-500 mb-2 drop-shadow-lg">اختر نمط اللعب</h2>
                             <p className="text-zinc-400">كيف تود أن تخوض التحدي اليوم؟</p>
                         </div>

                         <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center items-stretch">
                             {/* Classic Mode Card */}
                             <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-3xl p-8 transition-all group relative overflow-hidden flex flex-col"
                             >
                                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                     <div className="text-9xl">🃏</div>
                                 </div>
                                 <h3 className="text-3xl font-bold text-white mb-2">النظام الكلاسيكي</h3>
                                 <p className="text-zinc-400 text-sm mb-6">لعب بلوت تقليدي بدون قدرات خاصة. المهارة هي الحكم.</p>
                                 <ul className="text-sm text-zinc-500 space-y-2 mb-8 flex-1">
                                     <li>✓ قوانين أصلية</li>
                                     <li>✓ بدون شخصيات</li>
                                     <li>✓ تصنيف مهارة نقي</li>
                                 </ul>
                                 <div className="mt-auto grid grid-cols-2 gap-3">
                                     <button 
                                        onClick={() => selectMode("classic", false)}
                                        className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                                     >
                                        لعب أونلاين
                                     </button>
                                     <button 
                                        onClick={() => selectMode("classic", true)}
                                        className="py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold transition-colors"
                                     >
                                        تدريب (AI)
                                     </button>
                                 </div>
                             </motion.div>

                             {/* Ranked Mode Card */}
                             <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="flex-1 bg-gradient-to-br from-zinc-900 to-[#2c0b0e] border border-amber-600/50 rounded-3xl p-8 transition-all group relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.1)] flex flex-col"
                             >
                                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                     <div className="text-9xl">👑</div>
                                 </div>
                                 <div className="absolute top-4 left-4 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded">VIP</div>
                                 
                                 <h3 className="text-3xl font-bold text-white mb-2">نظام الشخصيات</h3>
                                 <p className="text-amber-500/80 text-sm mb-6">تحدي الملوك! استخدم قدرات الشخصيات للفوز.</p>
                                 <ul className="text-sm text-zinc-500 space-y-2 mb-8 flex-1">
                                     <li>✓ قدرات خاصة (كشف، تبديل...)</li>
                                     <li>✓ شخصيات متنوعة</li>
                                     <li>✓ تصنيف أسطوري</li>
                                 </ul>
                                 <div className="mt-auto grid grid-cols-2 gap-3">
                                     <button 
                                        onClick={() => selectMode("ranked", false)}
                                        className="py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
                                     >
                                        لعب أونلاين
                                     </button>
                                     <button 
                                        onClick={() => selectMode("ranked", true)}
                                        className="py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold transition-colors"
                                     >
                                        تدريب (AI)
                                     </button>
                                 </div>
                             </motion.div>
                         </div>
                     </div>
                 </motion.div>
            )}

            {/* CHARACTER SELECTION PHASE */}
            {uiPhase === "character_select" && (
                 <motion.div key="char_select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#0f0505]">
                     <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-30 z-0 pointer-events-none" />
                     <div className="fixed inset-0 bg-gradient-to-b from-[#2c0b0e] to-[#0f0505] z-[-1] pointer-events-none" />
                     
                     <div className="relative z-10 w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col items-center min-h-full gap-8">
                         {/* Header */}
                         <div className="w-full flex justify-between items-center">
                             <button onClick={() => setUiPhase("mode_select")} className="text-zinc-400 hover:text-white flex items-center gap-2">
                                 <span className="text-2xl">←</span> عودة
                             </button>
                             <div className="text-center">
                                 <h2 className="text-3xl md:text-4xl font-black text-amber-500">اختر بطلك</h2>
                                 <p className="text-zinc-400 text-sm">لكل شخصية قدرة فريدة تغير مجرى اللعب</p>
                             </div>
                             <div className="w-20" /> {/* Spacer */}
                         </div>
                         
                         {/* Character Grid */}
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full pb-20">
                            {CHARACTERS.map(char => {
                                const isOwned = char.isFree || (inventory?.some(i => i.id === char.id)) || false; // Mock logic
                                return (
                                <motion.div 
                                    key={char.id}
                                    onClick={() => {
                                        if (isOwned) selectCharacter(char.id);
                                        else setShowStore(true);
                                    }}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    className={`relative bg-zinc-900 border-2 rounded-3xl p-4 cursor-pointer transition-all flex flex-col items-center gap-4 group ${myCharacter === char.id ? "border-amber-500 bg-zinc-800" : "border-zinc-700 hover:border-zinc-500"} ${!isOwned ? "opacity-80 grayscale-[0.5]" : ""}`}
                                >
                                    {/* Badges */}
                                    {char.isVip && (
                                        <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-[10px] font-black px-2 py-1 rounded shadow-lg z-20">
                                            VIP
                                        </div>
                                    )}
                                    {!isOwned && (
                                        <div className="absolute top-3 right-3 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded border border-zinc-600 z-20 flex items-center gap-1">
                                            <span>🔒</span> {char.price > 0 ? `${char.price} ${char.currency === "gems" ? "💎" : "🪙"}` : "Locked"}
                                        </div>
                                    )}

                                    <div className="relative">
                                        <AvatarFrame 
                                            avatar={char.avatar} 
                                            size="lg"
                                            showShine={myCharacter === char.id}
                                            className={`transition-all duration-300 ${myCharacter === char.id ? "scale-110" : "group-hover:scale-105"}`}
                                        />
                                    </div>

                                    <div className="text-center w-full">
                                        <h3 className={`text-lg font-black mb-1 ${char.color}`}>{char.name}</h3>
                                        <div className="bg-black/30 rounded-lg p-2 min-h-[60px] flex items-center justify-center">
                                            <p className="text-xs text-zinc-300 font-medium leading-tight">{char.desc}</p>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        className={`w-full py-2 rounded-xl font-bold text-xs transition-colors mt-auto ${isOwned ? "bg-zinc-800 group-hover:bg-amber-600 group-hover:text-white" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}
                                    >
                                        {isOwned ? (myCharacter === char.id ? "تم الاختيار" : "اختيار") : "شراء الآن"}
                                    </button>
                                </motion.div>
                            )})}
                         </div>
                     </div>
                 </motion.div>
            )}

            {uiPhase === "table_select" && (
                <motion.div key="table_select" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-8">
                    <button onClick={enterLobby} className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2">
                        ← {t.back}
                    </button>
                    <h2 className="text-4xl font-black text-white mb-12">اختر الطاولة</h2>
                    
                    <div className="flex gap-6 w-full max-w-5xl justify-center">
                        {/* Beginner */}
                        <div className="w-80 bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden hover:border-zinc-500 transition-all hover:-translate-y-2 cursor-pointer group" onClick={() => beginMatchmaking("beginner")}>
                            <div className="h-40 bg-zinc-800 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">😌</div>
                            <div className="p-6 text-center">
                                <h3 className="text-2xl font-bold text-white mb-2">مبتدئ</h3>
                                <p className="text-zinc-400 text-sm mb-4">لعب هادئ للتعلم والاستمتاع</p>
                                <div className="inline-block px-4 py-2 bg-zinc-800 rounded-full text-emerald-400 font-mono font-bold">FREE</div>
                            </div>
                        </div>

                        {/* Pro */}
                        <div className="w-80 bg-zinc-900 rounded-3xl border-2 border-amber-600/50 overflow-hidden hover:border-amber-500 transition-all hover:-translate-y-2 cursor-pointer group relative" onClick={() => beginMatchmaking("pro")}>
                            <div className="absolute top-4 right-4 text-amber-500">★</div>
                            <div className="h-40 bg-gradient-to-br from-amber-900/20 to-black flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">😎</div>
                            <div className="p-6 text-center">
                                <h3 className="text-2xl font-bold text-white mb-2">محترف</h3>
                                <p className="text-zinc-400 text-sm mb-4">تحدي قوي للاعبين الجادين</p>
                                <div className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/50 rounded-full text-amber-400 font-mono font-bold">1,000 🪙</div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="w-80 bg-zinc-900 rounded-3xl border-2 border-purple-600/50 overflow-hidden hover:border-purple-500 transition-all hover:-translate-y-2 cursor-pointer group relative shadow-[0_0_30px_rgba(147,51,234,0.1)] hover:shadow-[0_0_50px_rgba(147,51,234,0.3)]" onClick={() => beginMatchmaking("legend")}>
                            <div className="absolute top-4 right-4 text-purple-500 animate-pulse">♛</div>
                            <div className="h-40 bg-gradient-to-br from-purple-900/20 to-black flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">🔥</div>
                            <div className="p-6 text-center">
                                <h3 className="text-2xl font-bold text-white mb-2">أسطورة</h3>
                                <p className="text-zinc-400 text-sm mb-4">للأقوياء فقط! حماس لا يتوقف</p>
                                <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/50 rounded-full text-purple-400 font-mono font-bold">10,000 🪙</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {uiPhase === "matchmaking" && (
                 <motion.div key="match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center">
                     <div className="relative">
                        <div className="w-24 h-24 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-8"/>
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">♠</div>
                     </div>
                     <h2 className="text-2xl font-bold mb-2">جاري البحث عن خصوم...</h2>
                     <div className="text-zinc-500 font-mono">({found}/4) Players Found</div>
                     
                     <div className="mt-8 flex gap-4">
                        {[0,1,2,3].map(i => (
                            <div key={i} className={`w-12 h-12 rounded-full border-2 ${i < found ? "border-emerald-500 bg-emerald-500/20" : "border-zinc-800 bg-zinc-900"} flex items-center justify-center transition-all`}>
                                {i < found && <span className="text-emerald-500">✓</span>}
                            </div>
                        ))}
                     </div>
                 </motion.div>
            )}
            
            {uiPhase === "ended" && (
                 <motion.div key="ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center overflow-hidden">
                     {/* Confetti / Explosion if Win */}
                     {ns > ew && (
                         <div className="absolute inset-0 pointer-events-none">
                             {[...Array(20)].map((_, i) => (
                                 <motion.div 
                                    key={i}
                                    initial={{ y: -100, x: Math.random() * 1000 - 500, rotate: 0 }}
                                    animate={{ y: 1000, rotate: 360 }}
                                    transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: "linear" }}
                                    className="absolute top-0 left-1/2 w-4 h-4 bg-yellow-500 rounded-sm"
                                    style={{ backgroundColor: ['#fbbf24', '#ef4444', '#3b82f6'][Math.floor(Math.random()*3)] }}
                                 />
                             ))}
                         </div>
                     )}

                     <div className="relative bg-zinc-900 p-12 rounded-[3rem] border border-zinc-700 text-center max-w-2xl w-full shadow-2xl">
                         <div className="text-8xl mb-6">{ns > ew ? "🏆" : "💔"}</div>
                         <h2 className="text-5xl font-black mb-2 text-white">{ns > ew ? `انتصار ساحق!` : `هاردلك...`}</h2>
                         <p className="text-zinc-400 mb-8 text-xl">{ns > ew ? "أداء أسطوري يا بطل!" : "الجايات أكثر، لا تيأس"}</p>
                         
                         <div className="flex justify-center items-center gap-12 mb-12">
                             <div className="text-center">
                                 <div className="text-sm text-zinc-500 font-bold mb-2">فريقنا</div>
                                 <div className="text-6xl font-mono font-black text-emerald-400">{ns}</div>
                             </div>
                             <div className="text-4xl text-zinc-700 font-black">VS</div>
                             <div className="text-center">
                                 <div className="text-sm text-zinc-500 font-bold mb-2">الخصوم</div>
                                 <div className="text-6xl font-mono font-black text-rose-400">{ew}</div>
                             </div>
                         </div>

                         <div className="flex gap-4 justify-center">
                             <button onClick={() => setUiPhase("lobby")} className="px-8 py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-colors w-40">
                                 {t.back}
                             </button>
                             <button onClick={() => beginMatchmaking("classic")} className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-2xl hover:scale-105 transition-transform w-60 shadow-lg flex items-center justify-center gap-2">
                                 <span>⚔️</span> انتقام (Revenge)
                             </button>
                         </div>
                     </div>
                 </motion.div>
            )}

            {/* In-Game Top Controls */}
            {started && !ended && (
                <div className="absolute top-4 right-4 flex gap-2 z-50">
                    <button className="w-10 h-10 bg-black/40 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white/20" title="Chat">
                        💬
                    </button>
                    <button className="w-10 h-10 bg-black/40 backdrop-blur rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white/20" title="Settings">
                        ⚙️
                    </button>
                </div>
            )}
        </AnimatePresence>
        
        {/* Profile & Store Overlays */}
        <AnimatePresence>
             {showStore && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
                     <div className="bg-zinc-900 w-full max-w-4xl h-[85vh] rounded-[2.5rem] border border-zinc-800 flex flex-col overflow-hidden shadow-2xl relative">
                         {/* Store Header */}
                         <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-black/40">
                             <div>
                                <h2 className="text-3xl font-black text-white flex items-center gap-2"><span className="text-emerald-500">🛒</span> {t.store}</h2>
                                <p className="text-zinc-400 text-sm">Upgrade your style and power</p>
                             </div>
                             <div className="flex gap-4">
                                <div className="bg-zinc-800 px-4 py-2 rounded-full border border-yellow-500/30 flex items-center gap-2 font-mono font-bold text-yellow-400">
                                    <span>🪙</span> {user?.coins?.toLocaleString() || 0}
                                </div>
                                <div className="bg-zinc-800 px-4 py-2 rounded-full border border-purple-500/30 flex items-center gap-2 font-mono font-bold text-purple-400">
                                    <span>💎</span> {user?.gems?.toLocaleString() || 0}
                                </div>
                                <button onClick={() => setShowStore(false)} className="w-10 h-10 bg-zinc-800 rounded-full hover:bg-red-500 hover:text-white transition-colors">✕</button>
                             </div>
                         </div>

                         {/* Store Content — يستخدم المتجر الموحد للمنصة */}
                         <div className="flex-1 overflow-y-auto p-6">
                             <div className="text-center py-8">
                                 <div className="text-5xl mb-4">🛒</div>
                                 <div className="font-black text-xl text-white mb-2">المتجر الموحد</div>
                                 <p className="text-zinc-400 text-sm mb-6">اذهب للمتجر الرئيسي للمنصة للحصول على سكينات تطبّق على جميع الألعاب</p>
                                 <a href="/games/domino/online" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-black"
                                     style={{ background: "linear-gradient(135deg,#d4af37,#ea580c)" }}>
                                     افتح المتجر الرئيسي →
                                 </a>
                             </div>
                         </div>
                     </div>
                 </motion.div>
             )}

             {showProfile && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 w-full max-w-md rounded-[2rem] border border-zinc-800 overflow-hidden relative shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-900/50 to-transparent" />
                        <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors">✕</button>
                        
                        <div className="relative z-10 p-8 flex flex-col items-center">
                            <AvatarFrame 
                                avatar={user?.avatar || frameImg} 
                                size="xl" 
                                frame={equipped.baloot_frame ? {src: `/assets/${equipped.baloot_frame}.png`} : frameImg}
                                showShine
                                className="mb-4 drop-shadow-2xl"
                            />
                            <h2 className="text-3xl font-black text-white mb-1">{user?.name || "Guest"}</h2>
                            <div className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/50 mb-6">VIP MEMBER</div>

                            <div className="w-full grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800 text-center">
                                    <div className="text-zinc-400 text-xs uppercase font-bold mb-1">Level</div>
                                    <div className="text-2xl font-mono font-bold text-white">50</div>
                                </div>
                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800 text-center">
                                    <div className="text-zinc-400 text-xs uppercase font-bold mb-1">Win Rate</div>
                                    <div className="text-2xl font-mono font-bold text-emerald-400">68%</div>
                                </div>
                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800 text-center">
                                    <div className="text-zinc-400 text-xs uppercase font-bold mb-1">Games</div>
                                    <div className="text-2xl font-mono font-bold text-blue-400">1,240</div>
                                </div>
                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800 text-center">
                                    <div className="text-zinc-400 text-xs uppercase font-bold mb-1">Rank</div>
                                    <div className="text-2xl font-mono font-bold text-purple-400">#42</div>
                                </div>
                            </div>
                            
                            <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold text-zinc-300 transition-colors">Edit Profile</button>
                        </div>
                    </div>
                </motion.div>
             )}
        </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
