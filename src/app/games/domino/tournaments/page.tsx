"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

/* ─── types ─────────────────────────────────────────── */
type TourneyStatus = "upcoming" | "open" | "in_progress" | "finished";

type Tournament = {
  id:         string;
  name:        string;
  kind:        "daily" | "weekly" | "special";
  status:      TourneyStatus;
  startAt:     number;
  endAt?:      number;
  registered:  number;
  maxPlayers:  number;
  prizeCoins:  number;
  prizeGems?:  number;
  entryFee:    number;
  description: string;
  registered_me?: boolean;
};

type MyResult = {
  tournamentId: string;
  place:        number;
  prize?:       number;
};

/* ─── constants ──────────────────────────────────────── */
const gold   = "#f5a623";
const blue   = "#00d4ff";
const violet = "#9b5fe0";
const green  = "#00ff88";
const red    = "#ff2d55";

const KIND_META = {
  daily:   { label: "يومية",   color: blue,   icon: "☀️" },
  weekly:  { label: "أسبوعية", color: gold,   icon: "🏆" },
  special: { label: "خاصة",   color: violet, icon: "⭐" },
};

const STATUS_META: Record<TourneyStatus, { label: string; color: string }> = {
  upcoming:    { label: "قريباً",        color: "rgba(255,255,255,0.4)" },
  open:        { label: "مفتوح للتسجيل", color: green },
  in_progress: { label: "جارية الآن",    color: gold },
  finished:    { label: "انتهت",         color: "rgba(255,255,255,0.25)" },
};

/* ─── countdown ──────────────────────────────────────── */
function useCountdown(target: number) {
  const [diff, setDiff] = useState(Math.max(0, target - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setDiff(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { diff, d, h, m, s, pad };
}

/* ─── countdown display ──────────────────────────────── */
function Countdown({ target, color }: { target: number; color: string }) {
  const { diff, d, h, m, s, pad } = useCountdown(target);
  if (diff <= 0) return <span style={{ color: green, fontWeight: 900, fontSize: 12 }}>يبدأ الآن!</span>;
  return (
    <div className="flex items-center gap-1" dir="ltr">
      {d > 0 && <><span className="font-black text-xs px-1.5 py-0.5 rounded-lg" style={{ background: `${color}15`, color }}>{d}ي</span><span className="opacity-30 text-xs">:</span></>}
      {[pad(h), pad(m), pad(s)].map((v, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="opacity-30 text-xs">:</span>}
          <span className="font-black text-xs px-1.5 py-0.5 rounded-lg tabular-nums" style={{ background: `${color}15`, color }}>{v}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── tournament card ────────────────────────────────── */
function TournamentCard({
  t, onRegister, myResults,
}: {
  t: Tournament;
  onRegister: (id: string) => Promise<void>;
  myResults: MyResult[];
}) {
  const kind    = KIND_META[t.kind];
  const status  = STATUS_META[t.status];
  const myResult = myResults.find(r => r.tournamentId === t.id);
  const fillPct  = t.maxPlayers > 0 ? Math.min(100, (t.registered / t.maxPlayers) * 100) : 0;
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (busy || t.registered_me || t.status === "finished") return;
    setBusy(true);
    await onRegister(t.id);
    setBusy(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(160deg,${kind.color}06,rgba(2,3,8,0.95))`,
        border: `1px solid ${kind.color}20`,
        boxShadow: t.status === "open" || t.status === "in_progress" ? `0 0 24px ${kind.color}10` : "none",
      }}
    >
      {/* Top neon line */}
      {(t.status === "open" || t.status === "in_progress") && (
        <div className="h-px" style={{ background: `linear-gradient(90deg,transparent,${kind.color}60,transparent)` }} />
      )}

      {/* Corner glow */}
      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{ background: `radial-gradient(circle at 100% 0%,${kind.color}15,transparent 70%)` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-lg leading-none">{kind.icon}</span>
              <h3 className="font-black text-sm text-white truncate">{t.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black"
                style={{ background: `${kind.color}18`, color: kind.color, border: `1px solid ${kind.color}28` }}>
                {kind.label}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-500">{t.description}</p>
          </div>
          {/* Status */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black"
            style={{ background: `${status.color}14`, color: status.color, border: `1px solid ${status.color}25` }}>
            {t.status === "in_progress" && (
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: gold }} />
            )}
            {status.label}
          </div>
        </div>

        {/* Prize + entry row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black"
            style={{ background: `${gold}10`, border: `1px solid ${gold}20`, color: gold }}>
            🏆 {t.prizeCoins.toLocaleString()} كوين
          </div>
          {t.prizeGems && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black"
              style={{ background: `${violet}10`, border: `1px solid ${violet}20`, color: violet }}>
              💎 {t.prizeGems} جوهرة
            </div>
          )}
          {t.entryFee > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black"
              style={{ background: "rgba(255,45,85,.08)", border: "1px solid rgba(255,45,85,.2)", color: red }}>
              رسوم: {t.entryFee.toLocaleString()} 🪙
            </div>
          ) : (
            <div className="px-2.5 py-1.5 rounded-xl text-xs font-black"
              style={{ background: `${green}08`, border: `1px solid ${green}20`, color: green }}>
              مجاني ✓
            </div>
          )}
        </div>

        {/* Countdown */}
        {(t.status === "upcoming" || t.status === "open") && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-600 font-bold">يبدأ خلال</span>
            <Countdown target={t.startAt} color={kind.color} />
          </div>
        )}
        {t.status === "in_progress" && t.endAt && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-600 font-bold">ينتهي خلال</span>
            <Countdown target={t.endAt} color={gold} />
          </div>
        )}

        {/* Player fill bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-slate-600 font-bold mb-1">
            <span>المتسجلون</span>
            <span>{t.registered} / {t.maxPlayers}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.05)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg,${kind.color}80,${kind.color})`, boxShadow: `0 0 6px ${kind.color}60` }}
            />
          </div>
        </div>

        {/* My result */}
        {myResult && (
          <div className="flex items-center justify-between p-2.5 rounded-xl mb-3"
            style={{ background: `${gold}08`, border: `1px solid ${gold}20` }}>
            <span className="text-[11px] font-black" style={{ color: gold }}>
              {myResult.place === 1 ? "🥇" : myResult.place === 2 ? "🥈" : myResult.place === 3 ? "🥉" : `#${myResult.place}`}
              {" "}مركزك
            </span>
            {myResult.prize && (
              <span className="text-[11px] font-black" style={{ color: gold }}>+{myResult.prize.toLocaleString()} 🪙</span>
            )}
          </div>
        )}

        {/* CTA button */}
        {t.status === "open" && !t.registered_me && (
          <button
            onClick={handle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-black transition-all active:scale-95 hover:brightness-110 disabled:opacity-60"
            style={{
              background: `linear-gradient(135deg,${kind.color},${kind.color}cc)`,
              boxShadow: `0 6px 20px ${kind.color}35`,
            }}
          >
            {busy ? "جاري التسجيل..." : `سجّل الآن${t.entryFee > 0 ? ` — ${t.entryFee.toLocaleString()} 🪙` : " — مجاني"}`}
          </button>
        )}
        {t.status === "open" && t.registered_me && (
          <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm"
            style={{ background: `${green}10`, border: `1px solid ${green}25`, color: green }}>
            ✓ مسجّل بالفعل
          </div>
        )}
        {t.status === "in_progress" && t.registered_me && (
          <Link href="/games/domino/ranked?auto=1"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-black transition-all active:scale-95 hover:brightness-110"
            style={{ background: `linear-gradient(135deg,${gold},#ffd060)`, boxShadow: `0 6px 20px ${gold}35` }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polygon points="2,1 13,7 2,13" fill="currentColor"/></svg>
            انضم للمباراة
          </Link>
        )}
        {t.status === "upcoming" && (
          <div className="w-full flex items-center justify-center py-3 rounded-xl font-black text-sm"
            style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.3)" }}>
            ⏳ قريباً
          </div>
        )}
        {t.status === "finished" && (
          <div className="w-full flex items-center justify-center py-3 rounded-xl font-black text-sm"
            style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.2)" }}>
            انتهت البطولة
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── empty state ────────────────────────────────────── */
function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4" style={{ filter: `drop-shadow(0 0 20px ${gold}60)` }}>🏆</div>
      <h3 className="font-black text-lg text-white mb-2">لا توجد بطولات متاحة حالياً</h3>
      <p className="text-sm font-bold text-slate-600 max-w-xs">
        البطولات اليومية تبدأ كل يوم الساعة ١٢ ظهراً، والأسبوعية كل جمعة
      </p>
    </motion.div>
  );
}

/* ─── MOCK data (fallback لو الـ API مش شغال) ─────────── */
function getMockTournaments(): Tournament[] {
  const now = Date.now();
  return [
    {
      id: "t1",
      name: "بطولة الفجر اليومية",
      kind: "daily",
      status: "open",
      startAt: now + 1000 * 60 * 45,
      endAt: now + 1000 * 60 * 105,
      registered: 14,
      maxPlayers: 32,
      prizeCoins: 5000,
      entryFee: 0,
      description: "بطولة يومية مفتوحة للجميع — 32 لاعب",
    },
    {
      id: "t2",
      name: "كأس الأسبوع الذهبي",
      kind: "weekly",
      status: "open",
      startAt: now + 1000 * 60 * 60 * 3,
      endAt: now + 1000 * 60 * 60 * 5,
      registered: 28,
      maxPlayers: 64,
      prizeCoins: 50000,
      prizeGems: 100,
      entryFee: 500,
      description: "البطولة الأسبوعية الكبرى — جوائز ضخمة",
    },
    {
      id: "t3",
      name: "دوري المحترفين",
      kind: "special",
      status: "in_progress",
      startAt: now - 1000 * 60 * 30,
      endAt: now + 1000 * 60 * 30,
      registered: 16,
      maxPlayers: 16,
      prizeCoins: 20000,
      prizeGems: 50,
      entryFee: 1000,
      description: "للمحترفين فقط — ELO +1400",
      registered_me: false,
    },
    {
      id: "t4",
      name: "بطولة الأمس",
      kind: "daily",
      status: "finished",
      startAt: now - 1000 * 60 * 60 * 25,
      registered: 32,
      maxPlayers: 32,
      prizeCoins: 5000,
      entryFee: 0,
      description: "انتهت بطولة أمس",
    },
  ];
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function DominoTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myResults,   setMyResults]   = useState<MyResult[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<"all" | "open" | "upcoming" | "finished">("all");
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/domino/tournament/schedule", { cache: "no-store" });
      const data = await res.json();
      if (data.schedule?.length) {
        setTournaments(data.schedule);
      } else {
        setTournaments(getMockTournaments());
      }
    } catch {
      setTournaments(getMockTournaments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh every 30s
  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const register = async (id: string) => {
    try {
      const res  = await fetch("/api/domino/tournament/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: id }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast("تم التسجيل بنجاح! 🎉", true);
        setTournaments(prev =>
          prev.map(t => t.id === id ? { ...t, registered_me: true, registered: t.registered + 1 } : t)
        );
      } else {
        showToast(data.error === "insufficient_coins" ? "رصيد غير كافٍ 🪙" : "تعذّر التسجيل", false);
      }
    } catch {
      showToast("حدث خطأ، حاول مجدداً", false);
    }
  };

  const filtered = filter === "all"
    ? tournaments
    : tournaments.filter(t =>
        filter === "open"     ? (t.status === "open" || t.status === "in_progress")
        : filter === "upcoming" ? t.status === "upcoming"
        : t.status === "finished"
      );

  const active   = tournaments.filter(t => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="min-h-dvh text-white" style={{ background: "#020308", fontFamily: "var(--font-cairo),sans-serif" }} dir="rtl">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-20 left-1/3 w-96 h-72 rounded-full"
          style={{ background: `radial-gradient(ellipse,${gold}06,transparent 70%)`, filter: "blur(60px)" }} />
        <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full"
          style={{ background: `radial-gradient(circle,${violet}06,transparent 70%)`, filter: "blur(50px)" }} />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6"
        style={{ height: 54, background: "rgba(2,3,8,.9)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div className="h-px absolute bottom-0 left-0 right-0"
          style={{ background: `linear-gradient(90deg,transparent,${gold}40,transparent)` }} />
        <Link href="/games/domino/online"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95"
          style={{ background: "rgba(0,212,255,.06)", border: "1px solid rgba(0,212,255,.14)", color: "rgba(0,212,255,.8)" }}>
          ← الدومينو
        </Link>
        <div>
          <div className="font-black text-sm text-white text-center">🏆 البطولات</div>
          {active > 0 && (
            <div className="text-[10px] font-black text-center" style={{ color: gold }}>{active} بطولة مفتوحة الآن</div>
          )}
        </div>
        <div className="w-16" />
      </header>

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-5 pb-12">

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {([
            { id: "all",      label: "الكل" },
            { id: "open",     label: "مفتوحة الآن" },
            { id: "upcoming", label: "قادمة" },
            { id: "finished", label: "منتهية" },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-4 py-2 rounded-xl font-black text-xs whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
              style={{
                background: filter === f.id ? `${gold}18` : "rgba(255,255,255,.04)",
                border: `1px solid ${filter === f.id ? gold + "35" : "rgba(255,255,255,.07)"}`,
                color: filter === f.id ? gold : "rgba(255,255,255,.4)",
                boxShadow: filter === f.id ? `0 0 12px ${gold}20` : "none",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,.03)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <TournamentCard t={t} onRegister={register} myResults={myResults} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Info box */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-2xl" style={{ background: "rgba(0,212,255,.03)", border: "1px solid rgba(0,212,255,.08)" }}>
          <h4 className="font-black text-sm text-white mb-2">📋 كيف تعمل البطولات؟</h4>
          <ul className="text-[11px] font-bold text-slate-500 flex flex-col gap-1.5">
            <li>• سجّل في البطولة قبل وقت البداية</li>
            <li>• كل مباراة فيها لاعبين حقيقيين — الفائز يكمل، الخاسر يخرج</li>
            <li>• المراكز الأولى تحصل على الجوائز المعلنة</li>
            <li>• البطولات اليومية مجانية، الأسبوعية برسوم دخول</li>
          </ul>
        </motion.div>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm"
            style={{
              transform: "translateX(-50%)",
              background: toast.ok ? `${green}18` : "rgba(255,45,85,.18)",
              border: `1px solid ${toast.ok ? green : red}35`,
              color: toast.ok ? green : red,
              boxShadow: `0 8px 32px ${toast.ok ? green : red}25`,
              backdropFilter: "blur(16px)",
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
