"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type Tournament = {
  id: string; title: string; gameType: "baloot" | "ludo" | "domino";
  startDate: string; status: "upcoming" | "ongoing" | "completed" | "cancelled";
  maxParticipants: number; currentParticipants: number; prizePool: string; description?: string;
};

const GAME_META: Record<string, { icon: string; color: string; bg: string }> = {
  domino: { icon: "🁣", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  baloot: { icon: "🃏", color: "#ec4899", bg: "rgba(236,72,153,0.08)" },
  ludo:   { icon: "🎲", color: "#06b6d4", bg: "rgba(6,182,212,0.08)"  },
  chess:  { icon: "♟",  color: "#8b5cf6", bg: "rgba(139,92,246,0.08)" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  upcoming:  { label: "تسجيل مفتوح", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  ongoing:   { label: "جارية الآن",  color: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
  completed: { label: "منتهية",       color: "#7a7a8a", bg: "rgba(255,255,255,0.05)" },
  cancelled: { label: "ملغاة",        color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/tournaments")
      .then(r => r.json()).then(setTournaments)
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? tournaments : tournaments.filter(t => t.status === filter);

  return (
    <div style={{ minHeight: "100dvh", background: "#0c0c0e", color: "#f4f4f8", fontFamily: "var(--font-cairo),sans-serif" }} dir="rtl">
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(32px,5vw,56px) clamp(16px,4vw,28px) 48px" }}>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, fontSize: 12, color: "#7a7a8a", textDecoration: "none", fontWeight: 700 }}>
          ← الرئيسية
        </Link>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: "clamp(24px,5vw,36px)", color: "#f4f4f8", marginBottom: 6 }}>🎯 البطولات</h1>
            <p style={{ fontSize: 13, color: "#7a7a8a" }}>تنافس واربح جوائز قيمة</p>
          </div>
          <div style={{ fontSize: 52, opacity: 0.15, lineHeight: 1 }}>🏆</div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 7, marginBottom: 24, overflowX: "auto", paddingBottom: 2 }}>
          {[
            { id: "all",      label: "الكل" },
            { id: "upcoming", label: "مفتوحة" },
            { id: "ongoing",  label: "جارية" },
            { id: "completed",label: "منتهية" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: filter === f.id ? "#7c3aed" : "#131317",
              border: `1px solid ${filter === f.id ? "transparent" : "rgba(255,255,255,0.06)"}`,
              color: filter === f.id ? "#fff" : "#7a7a8a",
              fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", transition: "all .15s",
            }}>{f.label}</button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 14 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 240, borderRadius: 18, background: "#131317" }}/>)}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#131317", borderRadius: 20, border: "1px dashed rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#f4f4f8", marginBottom: 6 }}>لا توجد بطولات نشطة حالياً</div>
            <div style={{ fontSize: 13, color: "#7a7a8a" }}>تابعنا قريباً للمزيد من المنافسات!</div>
          </div>
        )}

        {/* Cards grid */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: 14 }}>
            {filtered.map((t, i) => {
              const gm = GAME_META[t.gameType] ?? GAME_META.domino;
              const sm = STATUS_META[t.status] ?? STATUS_META.upcoming;
              const fillPct = t.maxParticipants > 0 ? (t.currentParticipants / t.maxParticipants) * 100 : 0;

              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ background: "#131317", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>

                  {/* Cover */}
                  <div style={{ height: 110, background: gm.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 52, filter: `drop-shadow(0 0 20px ${gm.color}60)` }}>{gm.icon}</div>
                    <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 9px", borderRadius: 99, background: sm.bg, border: `1px solid ${sm.color}25`, fontSize: 10, fontWeight: 800, color: sm.color }}>
                      {sm.label}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: "14px 14px 16px" }}>
                    <div style={{ fontWeight: 900, fontSize: 15, color: "#f4f4f8", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "#7a7a8a", marginBottom: 14, lineHeight: 1.5 }}>{t.description || "بطولة تنافسية"}</div>

                    {/* Participants bar */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 10, fontWeight: 700 }}>
                        <span style={{ color: "#7a7a8a" }}>المشاركون</span>
                        <span style={{ color: "#f4f4f8" }}>{t.currentParticipants}/{t.maxParticipants}</span>
                      </div>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${fillPct}%`, background: gm.color, borderRadius: 99, transition: "width .6s" }}/>
                      </div>
                    </div>

                    {/* Prize */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: "#7a7a8a", fontWeight: 700 }}>مجموع الجوائز</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: "#f59e0b" }}>{t.prizePool}</span>
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: 11, color: "#7a7a8a", marginBottom: 12 }}>
                      📅 {new Date(t.startDate).toLocaleDateString("ar-EG")}
                    </div>

                    {/* CTA */}
                    <button
                      disabled={t.status !== "upcoming"}
                      style={{
                        width: "100%", padding: "10px", borderRadius: 11, border: "none", cursor: t.status === "upcoming" ? "pointer" : "not-allowed",
                        background: t.status === "upcoming" ? "#7c3aed" : "#1e1e25",
                        color: t.status === "upcoming" ? "#fff" : "#404050",
                        fontWeight: 800, fontSize: 13, fontFamily: "inherit", transition: "all .15s",
                      }}
                    >
                      {t.status === "upcoming" ? "سجّل الآن" : t.status === "ongoing" ? "جارية الآن" : "عرض التفاصيل"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
