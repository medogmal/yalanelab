"use client";
import React from "react";
import { Gamepad2, Settings, Save, Power } from "lucide-react";

export default function GamesSettings() {
  const games = [
    { id: "baloot", name: "بلوت (Baloot)", status: "active", players: 120 },
    { id: "chess", name: "شطرنج (Chess)", status: "active", players: 45 },
    { id: "domino", name: "دومينو (Domino)", status: "maintenance", players: 0 },
    { id: "ludo", name: "لودو (Ludo)", status: "active", players: 210 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-2">
          <Gamepad2 className="text-purple-500" size={32} />
          إعدادات الألعاب
        </h2>
        <p className="text-zinc-400 mt-1">التحكم في حالة وقوانين الألعاب</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {games.map((game) => (
          <div key={game.id} className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <Gamepad2 className="text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{game.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${game.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <span className="text-xs text-zinc-500 capitalize">{game.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                  <Settings size={18} />
                </button>
                <button className={`p-2 rounded-lg transition-colors ${game.status === "active" ? "text-emerald-500 hover:bg-emerald-500/10" : "text-amber-500 hover:bg-amber-500/10"}`}>
                  <Power size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <span className="text-sm text-zinc-400">اللاعبين النشطين</span>
                <span className="text-white font-mono font-bold">{game.players}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                  <div className="text-xs text-zinc-500 mb-1">وقت الجولة</div>
                  <div className="text-white font-mono text-sm">30s</div>
                </div>
                <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                  <div className="text-xs text-zinc-500 mb-1">الحد الأدنى</div>
                  <div className="text-white font-mono text-sm">100 Coins</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
