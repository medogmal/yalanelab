"use client";
import React, { useEffect, useState } from "react";
import { usePlatformStore } from "@/lib/platform/store";
import { Camera, Edit2, Trophy, Gamepad2, Star, Save, X, Zap, Shield, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

type FullProfile = {
  id: string; name: string; email: string;
  level: number; xp: number; coins: number; gems: number;
  tier: string; ratings: { chess: number; domino: number };
  stats: { matchesDomino: number; winsDomino: number; lossesDomino: number; longestWinStreak: number };
  passLevel: number; passPremium: boolean;
};

export default function ProfileView() {
  const { user, updateUser } = usePlatformStore();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/me", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setProfile(d.user);
          setName(d.user.name || "");
          // sync to global store
          updateUser({
            id: d.user.id,
            name: d.user.name,
            level: d.user.level,
            xp: d.user.xp,
            max_xp: 1000,
            coins: d.user.coins,
            gems: d.user.gems,
            vip: d.user.tier === "pro" || d.user.tier === "elite",
          });
        }
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/user/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setProfile(p => p ? { ...p, name } : p);
    updateUser({ name });
    setIsEditing(false);
    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const fd = new FormData();
    fd.append("file", e.target.files[0]);
    const res = await fetch("/api/user/avatar", { method: "POST", body: fd });
    if (res.ok) {
      const d = await res.json();
      updateUser({ avatar: d.url });
    }
  }

  const p = profile;
  const winRate = p && (p.stats.matchesDomino > 0)
    ? Math.round((p.stats.winsDomino / p.stats.matchesDomino) * 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5 text-white">

      {/* Header Card */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.08]"
        style={{ background: "linear-gradient(135deg, #0d1f14 0%, #111 100%)" }}>
        {/* Gold shimmer top line */}
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg,transparent,#f5c842,transparent)" }} />
        <div className="p-6 flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl border-2 border-amber-400/40 overflow-hidden bg-zinc-800 shadow-lg shadow-amber-400/10">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-4xl">🎮</div>}
            </div>
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-md hover:bg-amber-400 transition-colors">
              <Camera size={14} className="text-black" />
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              {isEditing ? (
                <input value={name} onChange={e => setName(e.target.value)}
                  className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1 text-xl font-black outline-none focus:border-amber-400 w-full"
                />
              ) : (
                <div>
                  <h2 className="text-2xl font-black flex items-center gap-2">
                    {p?.name || user?.name || "ضيف"}
                    {(p?.tier === "pro" || p?.tier === "elite") && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full"
                        style={{ background: "linear-gradient(90deg,#f5c842,#e8a800)", color: "#1a0d00" }}>
                        {p.tier.toUpperCase()}
                      </span>
                    )}
                  </h2>
                  <p className="text-zinc-500 text-sm font-bold mt-0.5">مستوى {p?.level || 1}</p>
                </div>
              )}
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 flex-shrink-0">
                  <Edit2 size={16} />
                </button>
              ) : (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={handleSave} disabled={saving}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors text-white">
                    <Save size={16} />
                  </button>
                  <button onClick={() => setIsEditing(false)}
                    className="p-2 rounded-xl bg-red-600/60 hover:bg-red-600 transition-colors text-white">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Currency */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(245,196,66,0.12)", border: "1px solid rgba(245,196,66,0.25)", color: "#f5c842" }}>
                🪙 {(p?.coins || user?.coins || 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa" }}>
                💎 {(p?.gems || user?.gems || 0).toLocaleString()}
              </div>
            </div>

            {/* XP bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-zinc-500 font-bold mb-1">
                <span>XP</span>
                <span>{p?.xp || 0} / 1000</span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((p?.xp || 0) % 1000) / 10)}%` }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #f5c842, #f59e0b)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "دومينو ELO", value: p?.ratings.domino || 1200, icon: "🁫", color: "#34d399" },
          { label: "شطرنج ELO", value: p?.ratings.chess || 1200, icon: "♟️", color: "#a78bfa" },
        ].map(r => (
          <div key={r.label} className="rounded-2xl p-4 text-center border border-white/[0.06]"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-2xl mb-1">{r.icon}</div>
            <div className="text-2xl font-black" style={{ color: r.color }}>{r.value}</div>
            <div className="text-[11px] text-zinc-500 font-bold mt-0.5">{r.label}</div>
          </div>
        ))}
      </div>

      {/* Domino stats */}
      <div className="rounded-3xl border border-white/[0.06] p-5"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <h3 className="font-black text-sm text-zinc-400 mb-4 flex items-center gap-2">
          <Trophy size={15} className="text-amber-400" /> إحصائيات الدومينو
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "إجمالي المباريات", value: p?.stats.matchesDomino || 0, color: "text-white" },
            { label: "نسبة الفوز",       value: `${winRate}%`,               color: "text-emerald-400" },
            { label: "انتصارات",          value: p?.stats.winsDomino || 0,    color: "text-green-400" },
            { label: "هزائم",             value: p?.stats.lossesDomino || 0,  color: "text-red-400" },
            { label: "أطول سلسلة فوز",   value: p?.stats.longestWinStreak || 0, color: "text-amber-400" },
            { label: "الرتبة العالمية",   value: "—",                         color: "text-zinc-400" },
          ].map(s => (
            <div key={s.label} className="bg-black/20 rounded-xl p-3 text-center">
              <div className={`font-black text-xl ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-zinc-600 font-bold mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Royal Pass */}
      <div className="rounded-3xl border p-5"
        style={{
          background: p?.passPremium ? "linear-gradient(135deg,#1c1500,#2b1f00)" : "rgba(255,255,255,0.02)",
          borderColor: p?.passPremium ? "rgba(245,196,66,0.4)" : "rgba(255,255,255,0.06)",
        }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-amber-400" />
            <span className="font-black text-sm text-amber-400">Royal Pass</span>
            {p?.passPremium && <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-400 text-black">PREMIUM</span>}
          </div>
          <span className="text-sm font-black text-zinc-400">المستوى {p?.passLevel || 1}</span>
        </div>
        {!p?.passPremium && (
          <p className="text-[12px] text-zinc-500 text-center py-2">
            فعّل Premium للحصول على مكافآت حصرية
          </p>
        )}
      </div>
    </div>
  );
}
