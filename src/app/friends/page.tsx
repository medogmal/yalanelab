"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Friend = { id: string; name: string; level: number; ratingDomino: number; ratingChess: number };
type Tab = "friends" | "search";

export default function FriendsPage() {
  const [tab, setTab]       = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch]  = useState("");
  const [results, setResults] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [toast, setToast]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/user/friends")
      .then(r => r.json())
      .then(d => setFriends(d.friends ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function doSearch() {
    if (!search.trim()) return;
    setSearching(true);
    const res = await fetch(`/api/leaderboard/domino?limit=20&q=${encodeURIComponent(search)}`);
    const d = await res.json();
    setResults((d.items || []).filter((x: any) => x.id !== "me"));
    setSearching(false);
  }

  async function addFriend(targetId: string, targetName: string) {
    const res = await fetch("/api/user/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, action: "add" }),
    });
    if (res.ok) {
      showToast(`✅ تمت إضافة ${targetName}`);
      const d = await res.json();
      const all = await fetch("/api/user/friends").then(r => r.json());
      setFriends(all.friends ?? []);
    }
  }

  async function removeFriend(targetId: string) {
    const res = await fetch("/api/user/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, action: "remove" }),
    });
    if (res.ok) {
      setFriends(f => f.filter(x => x.id !== targetId));
      showToast("تم الإزالة");
    }
  }

  async function challenge(friendId: string, game = "domino") {
    const res = await fetch("/api/user/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: friendId, game }),
    });
    const d = await res.json();
    if (d.url) {
      await navigator.clipboard.writeText(`${window.location.origin}${d.url}`).catch(() => {});
      showToast("📋 تم نسخ رابط التحدي!");
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const isFriend = (id: string) => friends.some(f => f.id === id);

  return (
    <div style={{ minHeight: "100dvh", background: "#0c0c0e", color: "#f4f4f8", fontFamily: "var(--font-cairo),sans-serif" }} dir="rtl">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100, padding: "10px 20px", borderRadius: 12, background: "#1e1e25", border: "1px solid rgba(124,58,237,0.3)", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(28px,5vw,48px) clamp(16px,4vw,24px) 48px" }}>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 20, fontSize: 12, color: "#7a7a8a", textDecoration: "none", fontWeight: 700 }}>
          ← الرئيسية
        </Link>

        <h1 style={{ fontWeight: 900, fontSize: "clamp(22px,4vw,30px)", marginBottom: 6 }}>👥 الأصدقاء</h1>
        <p style={{ fontSize: 13, color: "#7a7a8a", marginBottom: 24 }}>أضف أصدقاءك وتحداهم في الألعاب</p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[{ id: "friends", label: `أصدقائي (${friends.length})` }, { id: "search", label: "البحث عن لاعب" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)} style={{
              padding: "8px 16px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${tab === t.id ? "transparent" : "rgba(255,255,255,0.06)"}`,
              background: tab === t.id ? "#7c3aed" : "rgba(255,255,255,0.03)",
              color: tab === t.id ? "#fff" : "#7a7a8a",
              fontWeight: 800, fontSize: 13, transition: "all .15s",
            }}>{t.label}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Friends List */}
          {tab === "friends" && (
            <motion.div key="friends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ width: 32, height: 32, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }}/>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : friends.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", background: "#131317", borderRadius: 18, border: "1px dashed rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>لا يوجد أصدقاء بعد</div>
                  <div style={{ fontSize: 12, color: "#7a7a8a", marginBottom: 16 }}>ابحث عن لاعبين وأضفهم!</div>
                  <button onClick={() => setTab("search")} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    ابحث الآن
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {friends.map((f, i) => (
                    <motion.div key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#131317", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14 }}>
                      {/* Avatar */}
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: "#fff", flexShrink: 0 }}>
                        {f.name[0]?.toUpperCase()}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#f4f4f8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: "#7a7a8a", marginTop: 2 }}>
                          <span style={{ color: "#f59e0b" }}>🁣 {f.ratingDomino}</span>
                          <span style={{ color: "#404050", margin: "0 5px" }}>·</span>
                          <span style={{ color: "#8b5cf6" }}>♟ {f.ratingChess}</span>
                          <span style={{ color: "#404050", margin: "0 5px" }}>·</span>
                          <span>Lv.{f.level}</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => challenge(f.id)} style={{ padding: "6px 11px", borderRadius: 9, border: "none", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa", fontWeight: 800, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                          ⚔️ تحدي
                        </button>
                        <button onClick={() => removeFriend(f.id)} style={{ padding: "6px 9px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.15)", background: "transparent", color: "#ef4444", fontWeight: 800, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Search */}
          {tab === "search" && (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Search input */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder="ابحث بالاسم..."
                  style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.06)", color: "#f4f4f8", fontFamily: "inherit", fontSize: 14, fontWeight: 600, outline: "none" }}
                />
                <button onClick={doSearch} disabled={searching} style={{ padding: "11px 18px", borderRadius: 12, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: searching ? 0.6 : 1 }}>
                  {searching ? "..." : "بحث"}
                </button>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#131317", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: "#1e1e25", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, flexShrink: 0 }}>
                        {r.name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#f4f4f8" }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: "#7a7a8a" }}>🁣 {r.ratingDomino}</div>
                      </div>
                      {isFriend(r.id) ? (
                        <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 800 }}>✓ صديق</span>
                      ) : (
                        <button onClick={() => addFriend(r.id, r.name)} style={{ padding: "6px 14px", borderRadius: 9, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 800, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                          + أضف
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {!searching && search && results.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#7a7a8a", fontSize: 13, fontWeight: 700 }}>
                  لا نتائج — جرب اسم مختلف
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
