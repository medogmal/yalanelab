
"use client";
import React, { useState, useEffect } from "react";
import { ShoppingBag, X, Check, Lock, Loader2 } from "lucide-react";
import DominoTile from "./DominoTile";

type StoreItem = {
  id: string;
  name: string;
  type: "domino_skin" | "frame";
  asset: string;
  price: number;
  owned: boolean;
  equipped: boolean;
};

export default function DominoStore({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"skins" | "frames">("skins");
  const [balance, setBalance] = useState({ coins: 0, gems: 0 });

  useEffect(() => {
    // Fetch items and user data
    Promise.all([
        fetch("/api/admin/skins").then(r => r.json()),
        fetch("/api/auth/me").then(r => r.json())
    ]).then(([skinsData, userData]) => {
        const user = userData.user;
        setBalance({ coins: user?.coins || 0, gems: user?.gems || 0 });

        const formattedItems = skinsData
            .filter((s: any) => s.type === "domino_skin" || s.type === "frame")
            .map((s: any) => ({
                id: s.id,
                name: s.name,
                type: s.type,
                asset: s.asset,
                price: s.price || 1000, // Default price if not set
                owned: true, // For now, assume all owned or check against user.cosmetics
                equipped: s.asset === localStorage.getItem("domino_skin_pref")
            }));
        setItems(formattedItems);
    }).finally(() => setLoading(false));
  }, []);

  const handleEquip = (item: StoreItem) => {
      if (item.type === "domino_skin") {
          localStorage.setItem("domino_skin_pref", item.asset);
          // Update local state
          setItems(items.map(i => i.type === "domino_skin" ? { ...i, equipped: i.id === item.id } : i));
      }
  };

  const filteredItems = items.filter(i => i.type === (activeTab === "skins" ? "domino_skin" : "frame"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-zinc-900 w-full max-w-4xl rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
            <div className="flex items-center gap-3">
                <ShoppingBag className="text-amber-500" size={24} />
                <h2 className="text-2xl font-black text-white">متجر الدومينو</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-amber-400 font-bold text-sm">{balance.coins.toLocaleString()}</span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
            <button 
                onClick={() => setActiveTab("skins")}
                className={`flex-1 py-4 text-center font-bold transition-colors relative ${activeTab === "skins" ? "text-white bg-zinc-800/50" : "text-zinc-500 hover:text-zinc-300"}`}
            >
                أشكال القطع
                {activeTab === "skins" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
            </button>
            <button 
                onClick={() => setActiveTab("frames")}
                className={`flex-1 py-4 text-center font-bold transition-colors relative ${activeTab === "frames" ? "text-white bg-zinc-800/50" : "text-zinc-500 hover:text-zinc-300"}`}
            >
                الإطارات
                {activeTab === "frames" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="animate-spin text-amber-500" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                        <div key={item.id} className={`group relative bg-zinc-900 border rounded-2xl overflow-hidden transition-all hover:-translate-y-1 ${item.equipped ? "border-emerald-500 ring-1 ring-emerald-500/50" : "border-zinc-800 hover:border-amber-500/50"}`}>
                            {/* Preview */}
                            <div className="aspect-square bg-zinc-950 flex items-center justify-center p-4 relative">
                                {item.type === "domino_skin" ? (
                                    <div className="transform rotate-45 scale-125 drop-shadow-2xl">
                                        <DominoTile a={5} b={6} skinUrl={item.asset} className="w-12 h-24" />
                                    </div>
                                ) : (
                                    <div className="relative w-24 h-24">
                                        <img src={item.asset} className="absolute inset-0 w-full h-full object-contain z-10" />
                                        <div className="absolute inset-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <img src="/default-avatar.png" className="w-full h-full object-cover opacity-50" />
                                        </div>
                                    </div>
                                )}
                                {item.equipped && (
                                    <div className="absolute top-2 right-2 bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                        <Check size={12} />
                                        مستخدم
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-bold text-white mb-1 truncate">{item.name}</h3>
                                <div className="flex items-center justify-between mt-3">
                                    {item.owned ? (
                                        <button 
                                            onClick={() => handleEquip(item)}
                                            disabled={item.equipped}
                                            className={`w-full py-2 rounded-xl font-bold text-sm transition-colors ${item.equipped ? "bg-zinc-800 text-zinc-500 cursor-default" : "bg-white text-black hover:bg-zinc-200"}`}
                                        >
                                            {item.equipped ? "مستخدم حالياً" : "استخدام"}
                                        </button>
                                    ) : (
                                        <button className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-sm flex items-center justify-center gap-1">
                                            {item.price.toLocaleString()}
                                            <span className="w-2 h-2 rounded-full bg-black/20" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
