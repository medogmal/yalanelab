"use client";
import React, { useState } from "react";
import { usePlatformStore, InventoryItem } from "@/lib/platform/store";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Crown, Coins, Gem } from "lucide-react";

const GOLD = "#d4af37";

/* ─── فئات المتجر ─────────────────────────────────────── */
const CATEGORIES = [
  { id: "all",         label: "الكل",          icon: "🛒" },
  { id: "avatar",      label: "أفاتارات",       icon: "👤" },
  { id: "domino_skin", label: "دومينو",         icon: "🁣" },
  { id: "card_skin",   label: "كروت البالوت",   icon: "🃏" },
  { id: "chess_skin",  label: "شطرنج",          icon: "♟" },
  { id: "ludo_skin",   label: "لودو",           icon: "🎲" },
  { id: "baloot_skin", label: "بالوت طاولة",    icon: "🎯" },
  { id: "game_skin",   label: "فرعوني ✨",       icon: "𓂀" },
];

/* ─── TAG badge colors ─────────────────────────────────── */
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  "فرعوني": { bg: "#c9a22722", text: "#c9a227" },
  "نيون":   { bg: "#00ff8822", text: "#00ff88" },
  "VIP":    { bg: "#d4af3722", text: "#d4af37" },
};

/* ─── Item Preview ─────────────────────────────────────── */
function ItemPreview({ item }: { item: InventoryItem }) {
  const glow = item.glowColor ?? GOLD;

  if (item.type === "avatar") {
    return (
      <span className="text-5xl select-none drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
        {item.asset}
      </span>
    );
  }

  if (item.type === "domino_skin") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-4xl" style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
          {item.emoji ?? "🁣"}
        </span>
        <div className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: glow + "22", color: glow }}>
          domino
        </div>
      </div>
    );
  }

  if (item.type === "card_skin") {
    return (
      <div className="flex items-center justify-center gap-1">
        {["♠","♥","♦","♣"].map((s, i) => (
          <span key={i} className="text-lg font-black transition-transform duration-300 group-hover:scale-125"
            style={{ color: i % 2 ? "#ef4444" : "#fff", filter: `drop-shadow(0 0 4px ${glow})`, animationDelay: `${i*0.1}s` }}>
            {s}
          </span>
        ))}
      </div>
    );
  }

  if (item.type === "game_skin") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-5xl transition-transform duration-300 group-hover:scale-110"
          style={{ color: glow, filter: `drop-shadow(0 0 12px ${glow})` }}>
          {item.emoji ?? "𓂀"}
        </span>
      </div>
    );
  }

  /* chess / ludo / baloot */
  if (item.asset?.startsWith("/") || item.asset?.startsWith("http")) {
    return <img src={item.asset} alt={item.name} className="w-3/4 h-3/4 object-contain transition-transform duration-300 group-hover:scale-110" />;
  }
  return (
    <div className="text-center">
      <span className="text-3xl">🎨</span>
      <div className="text-[9px] mt-1 px-2 py-0.5 rounded font-mono" style={{ background: "rgba(0,0,0,.4)", color: "#666" }}>
        {item.asset}
      </div>
    </div>
  );
}

/* ─── Item Card ────────────────────────────────────────── */
function ItemCard({ item, owned, equipped, onBuy, onEquip }: {
  item: InventoryItem; owned: boolean; equipped: boolean;
  onBuy: () => void; onEquip: () => void;
}) {
  const glow = item.glowColor ?? GOLD;
  const price = item.price ?? 0;
  const isGems = item.currency === "gems";

  return (
    <motion.div layout initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: .9 }} transition={{ duration: .2 }}
      className="group relative rounded-2xl flex flex-col overflow-hidden transition-all duration-300 cursor-pointer"
      style={{
        background: equipped ? `${glow}0c` : "rgba(255,255,255,.03)",
        border: `1px solid ${equipped ? glow + "50" : "rgba(255,255,255,.07)"}`,
        boxShadow: equipped ? `0 0 20px ${glow}20` : "none",
      }}
    >
      {/* VIP badge */}
      {item.vip_required && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black"
          style={{ background: `linear-gradient(135deg,${GOLD},#ea580c)`, color: "#000" }}>
          <Crown size={7} fill="currentColor" /> VIP
        </div>
      )}
      {/* Tag badge */}
      {item.tag && !item.vip_required && (
        <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-full text-[8px] font-black"
          style={{ background: TAG_COLORS[item.tag]?.bg ?? "#ffffff11", color: TAG_COLORS[item.tag]?.text ?? "#fff" }}>
          {item.tag}
        </div>
      )}
      {/* Equipped check */}
      {equipped && (
        <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: glow, boxShadow: `0 2px 8px ${glow}60` }}>
          <Check size={11} className="text-black" strokeWidth={3} />
        </div>
      )}
      {/* Preview */}
      <div className="relative aspect-square flex items-center justify-center overflow-hidden"
        style={{ background: equipped ? `${glow}08` : "rgba(255,255,255,.02)" }}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${glow}20, transparent 70%)` }} />
        <ItemPreview item={item} />
      </div>
      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="font-black text-sm text-white truncate">{item.name}</div>
        {owned ? (
          <button onClick={onEquip} disabled={equipped}
            className="w-full py-1.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95"
            style={{
              background: equipped ? `${glow}18` : "rgba(255,255,255,.07)",
              color: equipped ? glow : "rgba(255,255,255,.7)",
              border: `1px solid ${equipped ? glow + "30" : "rgba(255,255,255,.1)"}`,
              cursor: equipped ? "default" : "pointer",
            }}>
            {equipped ? <><Check size={11} /> مفعّل</> : "تفعيل"}
          </button>
        ) : price === 0 ? (
          <button onClick={onBuy}
            className="w-full py-1.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95"
            style={{ background: "rgba(52,211,153,.15)", color: "#34d399", border: "1px solid rgba(52,211,153,.3)" }}>
            مجاني — احصل عليه
          </button>
        ) : (
          <button onClick={onBuy}
            className="w-full py-1.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:brightness-110"
            style={{ background: `linear-gradient(135deg,${isGems?"#a78bfa":"#d4af37"},${isGems?"#7c3aed":"#ea580c"})`, color: "#000", boxShadow: `0 4px 12px ${glow}30` }}>
            {isGems ? <Gem size={10} /> : <Coins size={10} />}
            {price.toLocaleString()} {isGems ? "💎" : "🪙"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main UnifiedStore ────────────────────────────────── */
export default function UnifiedStore() {
  const { user, inventory, equipped, buyItem, equipItem, catalog, fetchCatalog } = usePlatformStore();
  const [category, setCategory] = useState<InventoryItem["type"] | "all">("all");

  React.useEffect(() => { fetchCatalog(); }, []);

  const items = category === "all" ? catalog : catalog.filter(i => i.type === category);
  const isOwned = (id: string) => inventory.some(i => i.id === id) || (catalog.find(i => i.id === id)?.price === 0);
  const isEquipped = (type: InventoryItem["type"], id: string) => {
    const eq = equipped as Record<string, string>;
    return eq[type] === id;
  };

  async function handleBuy(item: InventoryItem) {
    if (!user) return;
    if (item.price === 0) {
      // free — just unlock
      await buyItem({ ...item, price: 0 });
      return;
    }
    const ok = await buyItem({ ...item, price: item.price ?? 500 });
    if (!ok) alert("لا يوجد رصيد كافٍ!");
  }

  /* group by tag for game_skin category */
  const pharaonicItems = items.filter(i => i.tag === "فرعوني");
  const otherItems     = items.filter(i => i.tag !== "فرعوني");
  const showPharaonic  = category === "game_skin" || category === "all";

  return (
    <div className="flex flex-col gap-5" dir="rtl">

      {/* Balance bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
        style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
        <div className="text-xs text-slate-500 font-bold">رصيدك</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black text-sm" style={{ color: GOLD }}>
            🪙 {(user?.coins ?? 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 font-black text-sm text-purple-400">
            💎 {user?.gems ?? 0}
          </div>
        </div>
      </div>

      {/* Categories scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(c => {
          const active = category === c.id;
          return (
            <button key={c.id} onClick={() => setCategory(c.id as any)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
              style={{
                background: active ? `${GOLD}18` : "rgba(255,255,255,.04)",
                border: `1px solid ${active ? GOLD + "40" : "rgba(255,255,255,.08)"}`,
                color: active ? GOLD : "rgba(255,255,255,.4)",
                boxShadow: active ? `0 4px 16px ${GOLD}20` : "none",
              }}>
              <span>{c.icon}</span>{c.label}
            </button>
          );
        })}
      </div>

      {/* Pharaonic section header (when visible) */}
      {showPharaonic && pharaonicItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl" style={{ color: "#c9a227", filter: "drop-shadow(0 0 6px #c9a227)" }}>𓂀</span>
            <span className="font-black text-sm" style={{ color: "#c9a227" }}>سكينات فرعونية</span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #c9a22740, transparent)" }} />
            <span className="text-[10px] font-bold text-slate-600">تطبّق على جميع الألعاب</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {pharaonicItems.map(item => (
                <ItemCard key={item.id} item={item}
                  owned={isOwned(item.id)} equipped={isEquipped(item.type, item.id)}
                  onBuy={() => handleBuy(item)} onEquip={() => equipItem(item.type, item.id)} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Main grid */}
      {otherItems.length === 0 && pharaonicItems.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="text-4xl">🎁</div>
          <div className="font-black text-sm text-white">لا توجد عناصر في هذه الفئة</div>
          <div className="text-[11px] text-slate-600 font-bold">تحقق مرة أخرى قريباً</div>
        </div>
      ) : otherItems.length > 0 ? (
        <div>
          {showPharaonic && pharaonicItems.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="font-black text-sm text-white/60">باقي العناصر</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {otherItems.map(item => (
                <ItemCard key={item.id} item={item}
                  owned={isOwned(item.id)} equipped={isEquipped(item.type, item.id)}
                  onBuy={() => handleBuy(item)} onEquip={() => equipItem(item.type, item.id)} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : null}

    </div>
  );
}
