"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ══════════════════════════════════════════════════════════
   YalaWorld — World Hub Page
   صفحة استكشاف العوالم المنشورة
   world.yalanelab.com أو /world
══════════════════════════════════════════════════════════ */

interface World {
  id:           string;
  name:         string;
  description:  string;
  creatorId:    string;
  thumbnailUrl: string | null;
  category:     string;
  isVerified:   boolean;
  isFeatured:   boolean;
  playCount:    number;
  likeCount:    number;
  playersOnline?: number;
}

const CATEGORIES = [
  { id: "all",       label: "الكل",      icon: "🌍" },
  { id: "social",    label: "اجتماعي",   icon: "👥" },
  { id: "action",    label: "أكشن",      icon: "⚔️" },
  { id: "puzzle",    label: "ألغاز",     icon: "🧩" },
  { id: "building",  label: "بناء",      icon: "🏗️" },
  { id: "adventure", label: "مغامرة",    icon: "🗺️" },
];

function WorldCard({ world }: { world: World }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        borderRadius: 20, overflow: "hidden",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer", position: "relative",
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: "100%", aspectRatio: "16/9", background: "linear-gradient(135deg,#1a1030,#0d0a1e)", position: "relative", overflow: "hidden" }}>
        {world.thumbnailUrl ? (
          <img src={world.thumbnailUrl} alt={world.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🌍</div>
        )}
        {/* Online badge */}
        {(world.playersOnline ?? 0) > 0 && (
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(34,197,94,0.9)", borderRadius: 99, padding: "3px 8px", fontSize: 11, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse-dot 1s infinite" }}/>
            {world.playersOnline} الآن
          </div>
        )}
        {/* Featured badge */}
        {world.isFeatured && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(245,166,35,0.9)", borderRadius: 99, padding: "3px 8px", fontSize: 10, fontWeight: 900, color: "#000" }}>⭐ مميز</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: "#fff" }}>{world.name}</h3>
          {world.isVerified && <span style={{ fontSize: 16 }}>✅</span>}
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 12px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
          {world.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>🎮 {world.playCount.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>❤️ {world.likeCount}</span>
          </div>
          <Link href={`/world/${world.id}`} style={{
            padding: "6px 14px", borderRadius: 10, fontSize: 11, fontWeight: 900,
            background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", textDecoration: "none",
          }}>
            ▶ العب
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function WorldHubPage() {
  const [worlds,   setWorlds]   = useState<World[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("all");
  const [search,   setSearch]   = useState("");
  const [sort,     setSort]     = useState<"popular"|"new"|"online">("popular");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ category, sort });
    if (search) params.set("q", search);
    fetch(`/api/worlds?${params}`)
      .then(r => r.json())
      .then(d => setWorlds(d.worlds || []))
      .catch(() => setWorlds([]))
      .finally(() => setLoading(false));
  }, [category, sort, search]);

  const featured = worlds.filter(w => w.isFeatured);
  const rest      = worlds.filter(w => !w.isFeatured);

  return (
    <div style={{ minHeight: "100dvh", background: "#07090f", color: "#fff", fontFamily: "var(--font-cairo),sans-serif", direction: "rtl" }}>
      <style>{`@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}.hide-scrollbar{scrollbar-width:none}.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>

      {/* Header */}
      <header style={{ background: "rgba(7,9,15,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(124,58,237,0.2)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px clamp(16px,4vw,32px)", display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ fontSize: 22, textDecoration: "none" }}>🌍</Link>
          <div style={{ fontWeight: 900, fontSize: 18, background: "linear-gradient(135deg,#7c3aed,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            عالم يالا
          </div>
          {/* Search */}
          <div style={{ flex: 1, maxWidth: 400, position: "relative", marginRight: "auto" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 ابحث عن عالم..."
              style={{ width: "100%", padding: "9px 16px", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <Link href="/world/create" style={{ padding: "9px 18px", borderRadius: 12, fontSize: 12, fontWeight: 900, background: "linear-gradient(135deg,#f5a623,#ffd060)", color: "#000", textDecoration: "none" }}>+ إنشاء عالم</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px clamp(16px,4vw,32px)" }}>
        {/* Categories */}
        <div className="hide-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 24, paddingBottom: 4 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              style={{ padding: "8px 18px", borderRadius: 99, fontSize: 12, fontWeight: 900, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
                background: category === c.id ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${category === c.id ? "rgba(124,58,237,0.7)" : "rgba(255,255,255,0.1)"}`,
                color: category === c.id ? "#a78bfa" : "rgba(255,255,255,0.5)" }}>
              {c.icon} {c.label}
            </button>
          ))}
          <div style={{ marginRight: "auto", display: "flex", gap: 6 }}>
            {(["popular","new","online"] as const).map(s => (
              <button key={s} onClick={() => setSort(s)}
                style={{ padding: "7px 14px", borderRadius: 99, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                  background: sort === s ? "rgba(245,166,35,0.15)" : "transparent",
                  border: `1px solid ${sort === s ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.1)"}`,
                  color: sort === s ? "#f5a623" : "rgba(255,255,255,0.4)" }}>
                {s === "popular" ? "🔥 الأكثر" : s === "new" ? "✨ الأحدث" : "🟢 أونلاين"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: "100%", aspectRatio: "16/9", background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }}/>
                <div style={{ padding: 16 }}>
                  <div style={{ height: 18, background: "rgba(255,255,255,0.06)", borderRadius: 6, marginBottom: 10 }}/>
                  <div style={{ height: 12, background: "rgba(255,255,255,0.04)", borderRadius: 6 }}/>
                </div>
              </div>
            ))}
          </div>
        ) : worlds.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌍</div>
            <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>مفيش عوالم لسه!</div>
            <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>كن أول من ينشئ عالماً في يالا</p>
            <Link href="/world/create" style={{ padding: "12px 28px", borderRadius: 14, fontWeight: 900, fontSize: 14, background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", textDecoration: "none" }}>
              🚀 إنشاء عالم
            </Link>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>⭐ العوالم المميزة</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20 }}>
                  {featured.map(w => <WorldCard key={w.id} world={w}/>)}
                </div>
              </section>
            )}
            {/* All */}
            <section>
              {featured.length > 0 && <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>🌐 كل العوالم</h2>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
                {rest.map(w => <WorldCard key={w.id} world={w}/>)}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
