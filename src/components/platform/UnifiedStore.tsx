"use client";
import React, { useState } from "react";
import { usePlatformStore, InventoryItem } from "@/lib/platform/store";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, Crown, User, Palette, Shield, Coins } from "lucide-react";

const gold = "#f0a500";

const CATEGORIES = [
  { id:"all",        label:"الكل",    icon:<ShoppingBag size={14}/> },
  { id:"avatar",     label:"أفاتار",  icon:<User size={14}/> },
  { id:"domino_skin",label:"دومينو",  icon:<Palette size={14}/> },
  { id:"chess_skin", label:"شطرنج",   icon:<Crown size={14}/> },
  { id:"ludo_skin",  label:"لودو",    icon:<Palette size={14}/> },
  { id:"baloot_skin",label:"بلوت",    icon:<Shield size={14}/> },
];

/* ─────────────────────────────────────────────────────────
   ITEM CARD
───────────────────────────────────────────────────────── */
function ItemCard({ item, owned, equipped, onBuy, onEquip, price }: {
  item:InventoryItem; owned:boolean; equipped:boolean;
  onBuy:()=>void; onEquip:()=>void; price:number;
}) {
  return (
    <motion.div
      layout
      initial={{opacity:0,scale:.92}}
      animate={{opacity:1,scale:1}}
      exit={{opacity:0,scale:.92}}
      transition={{duration:.25}}
      className="relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300"
      style={{
        background: equipped ? `${gold}0a` : "rgba(255,255,255,.028)",
        border:`1px solid ${equipped?gold+"40":"rgba(255,255,255,.08)"}`,
        boxShadow: equipped ? `0 0 24px ${gold}15` : "none",
      }}
    >
      {/* VIP badge */}
      {item.vip_required&&(
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black"
          style={{background:`linear-gradient(135deg,${gold},#ea580c)`,color:"#000"}}>
          <Crown size={8} fill="currentColor"/> VIP
        </div>
      )}

      {/* Equipped check */}
      {equipped&&(
        <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center"
          style={{background:gold,boxShadow:`0 2px 8px ${gold}60`}}>
          <Check size={11} className="text-black" strokeWidth={3}/>
        </div>
      )}

      {/* Preview */}
      <div className="relative aspect-square flex items-center justify-center overflow-hidden"
        style={{background:equipped?`${gold}08`:"rgba(255,255,255,.02)"}}>
        {/* hover glow */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{background:`radial-gradient(circle at 50% 50%, ${gold}18, transparent 70%)`}}/>
        {item.type==="avatar"?(
          <span className="text-5xl select-none transition-transform duration-500 hover:scale-125 drop-shadow-lg">{item.asset}</span>
        ):(
          item.asset?.startsWith("/") || item.asset?.startsWith("http")
            ?<img src={item.asset} alt={item.name} className="w-3/4 h-3/4 object-contain transition-transform duration-500 hover:scale-110"/>
            :<div className="text-center px-2">
              <span className="text-3xl">🎨</span>
              <div className="text-[9px] mt-1 px-2 py-0.5 rounded-full font-mono text-slate-500" style={{background:"rgba(0,0,0,.3)"}}>{item.asset}</div>
            </div>
        )}
      </div>

      {/* Info + action */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <div className="font-black text-sm text-white truncate">{item.name}</div>
          <div className="text-[10px] text-slate-600 font-bold capitalize">{item.type.replace("_"," ")}</div>
        </div>
        {owned?(
          <button onClick={onEquip} disabled={equipped}
            className={`w-full py-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 ${equipped?"cursor-default opacity-60":"hover:brightness-110"}`}
            style={{background:equipped?`${gold}18`:"rgba(255,255,255,.07)",color:equipped?gold:"rgba(255,255,255,.7)",border:`1px solid ${equipped?gold+"30":"rgba(255,255,255,.1)"}`}}>
            {equipped?<><Check size={11}/> مفعّل</>:"استخدم"}
          </button>
        ):(
          <button onClick={onBuy}
            className="w-full py-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:brightness-110"
            style={{background:`linear-gradient(135deg,${gold},#ea580c)`,color:"#000",boxShadow:`0 4px 12px ${gold}35`}}>
            <Coins size={11}/> {price.toLocaleString()}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   UNIFIED STORE
───────────────────────────────────────────────────────── */
export default function UnifiedStore() {
  const { user, inventory, equipped, buyItem, equipItem, catalog, fetchCatalog } = usePlatformStore();
  const [category, setCategory] = useState<InventoryItem["type"]|"all">("all");

  React.useEffect(()=>{ fetchCatalog(); },[]);

  const items = category==="all" ? catalog : catalog.filter(i=>i.type===category);
  const isOwned = (id:string) => inventory.some(i=>i.id===id);
  const isEquipped = (type:InventoryItem["type"], id:string) => {
    const eq = equipped as Record<string,string>;
    return eq[type]===id;
  };

  async function handleBuy(item:InventoryItem) {
    if(!user) return;
    const ok = await buyItem({...item, price:item.price||500});
    if(!ok) alert("لا يوجد رصيد كافٍ!");
  }

  return (
    <div className="flex flex-col gap-5" dir="rtl">

      {/* Balance bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl" style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)"}}>
        <div className="text-sm text-slate-500 font-bold">رصيدك</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black text-sm" style={{color:gold}}>
            <span>🪙</span><span>{(user?.coins||0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 font-black text-sm text-purple-400">
            <span>💎</span><span>{user?.gems||0}</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:"none"}}>
        {CATEGORIES.map(c=>{
          const active=category===c.id;
          return (
            <button key={c.id} onClick={()=>setCategory(c.id as any)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
              style={{
                background:active?`${gold}18`:"rgba(255,255,255,.04)",
                border:`1px solid ${active?gold+"40":"rgba(255,255,255,.08)"}`,
                color:active?gold:"rgba(255,255,255,.4)",
                boxShadow:active?`0 4px 16px ${gold}20`:"none",
              }}>
              {c.icon}{c.label}
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      {items.length===0?(
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="text-4xl">🎁</div>
          <div className="font-black text-sm text-white">لا توجد عناصر في هذه الفئة</div>
          <div className="text-[11px] text-slate-600 font-bold">تحقق مرة أخرى قريباً</div>
        </div>
      ):(
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {items.map(item=>(
              <ItemCard
                key={item.id}
                item={item}
                owned={isOwned(item.id)}
                equipped={isEquipped(item.type,item.id)}
                price={item.price||500}
                onBuy={()=>handleBuy(item)}
                onEquip={()=>equipItem(item.type,item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
