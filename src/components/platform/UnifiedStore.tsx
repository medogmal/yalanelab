"use client";
import React, { useState } from "react";
import { usePlatformStore, InventoryItem } from "@/lib/platform/store";
import { TRANSLATIONS } from "@/lib/platform/translations";
import { Coins, ShoppingBag, Check, Shield, Palette, User, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UnifiedStore() {
  const { user, inventory, equipped, buyItem, equipItem, language, catalog, fetchCatalog } = usePlatformStore();
  const [activeCategory, setActiveCategory] = useState<InventoryItem["type"] | "all">("all");
  const t = TRANSLATIONS[language];

  // Fetch dynamic catalog on mount
  React.useEffect(() => {
    fetchCatalog();
  }, []);

  // Filter items based on category
  const filteredItems = activeCategory === "all" 
    ? catalog 
    : catalog.filter(item => item.type === activeCategory);

  const isOwned = (id: string) => inventory.some((i) => i.id === id); // Check both for compatibility
  const isEquipped = (type: InventoryItem["type"], id: string) => {
    // Access equipped object safely
    const eq = equipped as Record<string, string>;
    return eq[type] === id || (type.includes("skin") && eq[type.replace("_skin", "") + "_skin"] === id);
  };

  const handleBuy = async (item: InventoryItem, price: number) => {
    if (!user) return;
    const success = await buyItem({ ...item, price });
    if (!success) {
      alert(language === 'ar' ? "لا يوجد رصيد كافٍ أو حدث خطأ!" : "Not enough coins or error occurred!");
    }
  };

  const handleEquip = (item: InventoryItem) => {
    equipItem(item.type, item.id);
  };

  const categories = [
    { id: "all", label: language === 'ar' ? "الكل" : "All", icon: <ShoppingBag size={16} /> },
    { id: "avatar", label: language === 'ar' ? "أفاتار" : "Avatars", icon: <User size={16} /> },
    { id: "ludo_skin", label: language === 'ar' ? "لودو" : "Ludo", icon: <Palette size={16} /> },
    { id: "chess_skin", label: language === 'ar' ? "شطرنج" : "Chess", icon: <Crown size={16} /> },
    { id: "baloot_skin", label: language === 'ar' ? "بلوت" : "Baloot", icon: <Shield size={16} /> },
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl text-white p-6 rounded-3xl h-full flex flex-col border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            <ShoppingBag className="text-pink-500" size={32} /> {t.store}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {language === 'ar' ? "طور مظهرك وتميز عن الآخرين" : "Upgrade your style and stand out"}
          </p>
        </div>
        
        <div className="bg-slate-800/80 px-5 py-3 rounded-2xl flex items-center gap-3 border border-slate-700 shadow-inner">
          <div className="bg-yellow-500/20 p-2 rounded-lg">
            <Coins className="text-yellow-400 w-6 h-6" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 font-bold uppercase">{t.coins}</span>
            <span suppressHydrationWarning className="font-mono font-black text-xl text-yellow-400">{user?.coins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as InventoryItem["type"] | "all")}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300
              ${activeCategory === cat.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-105" 
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}
            `}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 overflow-y-auto pr-2 pb-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const owned = isOwned(item.id);
            const equippedItem = isEquipped(item.type, item.id);
            const price = item.price || 500; // Use item price or default

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={item.id}
                className={`
                  relative bg-slate-800 rounded-2xl p-4 border transition-all duration-300 group
                  ${equippedItem ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]" : "border-slate-700 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1"}
                `}
              >
                {/* VIP Badge */}
                {item.vip_required && (
                    <div className="absolute top-2 left-2 z-20 bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                        <Crown size={10} fill="currentColor" /> VIP
                    </div>
                )}

                {/* Item Preview */}
                <div className={`
                  w-full aspect-square rounded-xl mb-4 flex items-center justify-center text-5xl shadow-inner relative overflow-hidden
                  ${equippedItem ? "bg-green-500/10" : "bg-slate-900"}
                `}>
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {item.type === "avatar" ? (
                    <span className="drop-shadow-2xl scale-125 transition-transform group-hover:scale-150">{item.asset}</span>
                  ) : (
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                        {/* Try to show image if asset is a path */}
                        {item.asset.startsWith('/') || item.asset.startsWith('http') ? (
                            <img src={item.asset} alt={item.name} className="max-w-[80%] max-h-[80%] object-contain drop-shadow-2xl transition-transform group-hover:scale-110" />
                        ) : (
                            <div className="text-center">
                                <span className="text-4xl drop-shadow-lg">{item.type.includes('skin') ? '🎨' : '📦'}</span>
                                <div className="text-[10px] mt-2 px-2 py-1 bg-black/50 rounded-full backdrop-blur font-mono text-slate-300">
                                    {item.asset}
                                </div>
                            </div>
                        )}
                    </div>
                  )}

                  {equippedItem && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg truncate">{item.name}</h3>
                  <p className="text-xs text-slate-400 capitalize flex items-center gap-1">
                    {item.type.replace("_", " ")}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-auto">
                  {owned ? (
                    <button
                      onClick={() => handleEquip(item)}
                      disabled={equippedItem}
                      className={`
                        w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all
                        ${equippedItem 
                          ? "bg-green-500/20 text-green-400 cursor-default" 
                          : "bg-slate-700 text-white hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/20"}
                      `}
                    >
                      {equippedItem ? (
                        <>{language === 'ar' ? "مستخدم" : "EQUIPPED"}</>
                      ) : (
                        <>{language === 'ar' ? "استخدام" : "EQUIP"}</>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item, price)}
                      className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                    >
                      <Coins size={14} className="fill-current" />
                      {price}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
