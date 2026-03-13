"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePlatformStore } from "@/lib/platform/store";

/* ─── GAME DATA ─────────────────────────────────────────────── */
const GAMES = [
  {
    id: "domino", label: "دومينو", labelEn: "Domino",
    desc: "الكلاسيك العربي الأصيل",
    icon: "🁣", color: "#f59e0b", border: "rgba(245,158,11,0.22)",
    href: "/games/domino/online", trainHref: "/games/domino/training",
    players: "١٢,٤٠٠", tag: "الأكثر لعباً",
    imgBg: "linear-gradient(160deg, #78350f, #451a03, #0c0c0e)",
    features: ["٤ لاعبين", "دوري أسبوعي", "بطولات"],
  },
  {
    id: "baloot", label: "بلوت", labelEn: "Baloot",
    desc: "بطولة البلوت السعودي",
    icon: "🃏", color: "#ec4899", border: "rgba(236,72,153,0.22)",
    href: "/games/baloot/online", trainHref: "/games/baloot/online",
    players: "٨,٢٠٠", tag: "HOT",
    imgBg: "linear-gradient(160deg, #9d174d, #500724, #0c0c0e)",
    features: ["فريقين ٢×٢", "تصنيف elo", "مواسم"],
  },
  {
    id: "chess", label: "شطرنج", labelEn: "Chess",
    desc: "تحدّى أذكى اللاعبين",
    icon: "♟", color: "#8b5cf6", border: "rgba(139,92,246,0.22)",
    href: "/games/chess/online", trainHref: "/games/chess/play",
    players: "٤,١٠٠", tag: "استراتيجي",
    imgBg: "linear-gradient(160deg, #5b21b6, #2e1065, #0c0c0e)",
    features: ["تصنيف Elo", "Stockfish AI", "تحليل"],
  },
  {
    id: "ludo", label: "لودو", labelEn: "Ludo",
    desc: "العب مع العيلة",
    icon: "🎲", color: "#06b6d4", border: "rgba(6,182,212,0.22)",
    href: "/games/ludo/online", trainHref: "/games/ludo/online",
    players: "٣,٧٠٠", tag: "عائلي",
    imgBg: "linear-gradient(160deg, #0e7490, #083344, #0c0c0e)",
    features: ["٤ لاعبين", "غرف خاصة", "دردشة"],
  },
] as const;

type Tab = "home" | "war" | "store" | "profile";

/* ══════════════════════════════════════════════════════════════
   SHOOTING STARS CANVAS
══════════════════════════════════════════════════════════════ */
function ShootingStarsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width  = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    /* ── static stars ── */
    const STAR_COUNT = 120;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.008,
    }));

    /* ── floating orbs ── */
    const orbs = [
      { x: W * 0.15, y: H * 0.3,  r: 80, color: "rgba(124,58,237,0.18)", vx: 0.08, vy: 0.05 },
      { x: W * 0.75, y: H * 0.6,  r: 60, color: "rgba(249,115,22,0.12)", vx: -0.06, vy: 0.08 },
      { x: W * 0.5,  y: H * 0.15, r: 50, color: "rgba(139,92,246,0.14)", vx: 0.04, vy: -0.06 },
    ];

    /* ── shooting stars pool ── */
    type Meteor = { x: number; y: number; vx: number; vy: number; len: number; life: number; maxLife: number; color: string };
    const meteors: Meteor[] = [];
    const COLORS = ["#a78bfa","#7c3aed","#f59e0b","#06b6d4","#ffffff"];

    function spawnMeteor() {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5; // roughly 45°
      const speed = 4 + Math.random() * 6;
      const x = Math.random() * W;
      const y = -20;
      const len = 60 + Math.random() * 100;
      const life = 0;
      const maxLife = len / speed * 1.5;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      meteors.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, len, life, maxLife, color });
    }

    let frame = 0;
    let nextMeteor = 40 + Math.random() * 80;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      /* orbs */
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r || o.x > W + o.r) o.vx *= -1;
        if (o.y < -o.r || o.y > H + o.r) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, o.color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      });

      /* static stars */
      stars.forEach(s => {
        s.a = Math.max(0.05, Math.min(1, s.a + s.da));
        if (s.a <= 0.05 || s.a >= 1) s.da *= -1;
        ctx.globalAlpha = s.a * 0.7;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      /* meteors */
      frame++;
      if (frame >= nextMeteor) {
        spawnMeteor();
        nextMeteor = frame + 50 + Math.random() * 120;
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x  += m.vx; m.y  += m.vy; m.life++;
        const progress = m.life / m.maxLife;
        const alpha    = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
        if (alpha <= 0 || progress >= 1) { meteors.splice(i, 1); continue; }

        const tailX = m.x - m.vx * (m.len / Math.hypot(m.vx, m.vy));
        const tailY = m.y - m.vy * (m.len / Math.hypot(m.vx, m.vy));
        const grad  = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.7, `${m.color}44`);
        grad.addColorStop(1, m.color);

        ctx.globalAlpha = alpha * 0.9;
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 1.5;
        ctx.lineCap     = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        /* head glow */
        ctx.globalAlpha = alpha;
        const hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 4);
        hg.addColorStop(0, "#fff");
        hg.addColorStop(0.4, m.color);
        hg.addColorStop(1, "transparent");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    });
    ro.observe(canvas);

    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════
   LIVE STREAM BANNER
══════════════════════════════════════════════════════════════ */
function LiveBanner() {
  const [stream, setStream] = useState<{ url: string | null; title?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stream")
      .then(r => r.json())
      .then(d => setStream({ url: d.url, title: d.title }))
      .catch(() => setStream({ url: null }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const isLive = !!stream?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      style={{
        margin: "0 clamp(14px,4vw,28px) 18px",
        borderRadius: 16,
        overflow: "hidden",
        border: isLive
          ? "1px solid rgba(239,68,68,0.35)"
          : "1px solid rgba(255,255,255,0.06)",
        background: isLive
          ? "linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(12,12,14,1) 70%)"
          : "#131317",
      }}
    >
      <Link
        href="/live"
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", textDecoration: "none" }}
      >
        {/* Thumbnail / icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: isLive
            ? "linear-gradient(135deg, #ef4444 0%, #7c3aed 100%)"
            : "#1e1e25",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, position: "relative", overflow: "hidden",
        }}>
          📺
          {isLive && (
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.15), transparent 70%)",
            }}/>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            {isLive ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "2px 8px", borderRadius: 99,
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                fontSize: 9, fontWeight: 900, color: "#ef4444", letterSpacing: "0.08em",
              }}>
                <span style={{ width: 5, height: 5, background: "#ef4444", borderRadius: "50%", display: "inline-block", animation: "livePulse 1.2s ease-in-out infinite" }}/>
                LIVE
              </span>
            ) : (
              <span style={{ fontSize: 9, fontWeight: 800, color: "#404050", letterSpacing: "0.08em" }}>
                OFF AIR
              </span>
            )}
            <span style={{ fontSize: 12, fontWeight: 800, color: isLive ? "#f4f4f8" : "#7a7a8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isLive ? (stream?.title || "البث المباشر — يالا نلعب") : "لا يوجد بث الآن"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#404050", fontWeight: 600 }}>
            {isLive ? "شاهد وشارك مع المجتمع" : "تابعنا للبث القادم"}
          </div>
        </div>

        {/* Arrow */}
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: isLive ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${isLive ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isLive ? "#ef4444" : "#404050", fontSize: 14,
        }}>
          ▶
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── HEADER ────────────────────────────────────────────────── */
function Header({ user, onlineCount }: { user: any; onlineCount: number | null }) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 clamp(16px,4vw,28px)",
      background: "rgba(12,12,14,0.94)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: "#7c3aed",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 14, color: "#fff",
        }}>ي</div>
        <span style={{ fontWeight: 900, fontSize: 14, color: "#f4f4f8" }}>يالا نلعب</span>
      </div>

      {onlineCount !== null && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 9px", borderRadius: 99,
          background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.14)",
          fontSize: 10, fontWeight: 800, color: "#22c55e",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "blink 1.8s ease-in-out infinite" }}/>
          {onlineCount.toLocaleString()} أونلاين
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {user && !user.id?.startsWith("guest") ? (
          <>
            <span style={{ padding: "3px 9px", borderRadius: 7, background: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.16)", fontSize: 11, fontWeight: 800, color: "#f59e0b" }}>
              🪙 {(user.coins ?? 0).toLocaleString()}
            </span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>
              {user.name?.[0] ?? "؟"}
            </div>
          </>
        ) : (
          <Link href="/auth/login" style={{ padding: "6px 14px", borderRadius: 8, background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
            دخول
          </Link>
        )}
      </div>
    </header>
  );
}

/* ─── GAME CARD ─────────────────────────────────────────────── */
function GameCard({ game, index }: { game: typeof GAMES[number]; index: number }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 20, overflow: "hidden",
        border: `1px solid ${hov ? game.border : "rgba(255,255,255,0.07)"}`,
        background: "#131317", cursor: "pointer",
        transition: "all .22s",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? `0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px ${game.border}` : "none",
      }}
    >
      <div style={{ height: 160, background: game.imgBg, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 30% 50%, ${game.color}22 0%, transparent 60%), radial-gradient(circle at 80% 20%, ${game.color}15 0%, transparent 50%)` }}/>
        <div style={{ fontSize: 72, lineHeight: 1, filter: `drop-shadow(0 0 32px ${game.color}80)`, transition: "transform .3s", transform: hov ? "scale(1.15) rotate(-5deg)" : "scale(1) rotate(0deg)", zIndex: 1, userSelect: "none" }}>
          {game.icon}
        </div>
        <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 9px", borderRadius: 99, background: `${game.color}22`, border: `1px solid ${game.border}`, fontSize: 10, fontWeight: 800, color: game.color }}>
          {game.tag}
        </div>
        <div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontWeight: 700, color: "#22c55e" }}>
          <span style={{ width: 5, height: 5, background: "#22c55e", borderRadius: "50%", display: "inline-block" }}/>
          {game.players} الآن
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top, #131317, transparent)" }}/>
      </div>

      <div style={{ padding: "16px" }}>
        <div style={{ fontWeight: 900, fontSize: 17, color: "#f4f4f8", marginBottom: 3 }}>{game.label}</div>
        <div style={{ fontSize: 11, color: "#7a7a8a", marginBottom: 12, lineHeight: 1.5 }}>{game.desc}</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
          {game.features.map(f => (
            <span key={f} style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#7a7a8a" }}>{f}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <Link href={game.href} onClick={e => e.stopPropagation()} style={{ flex: 1, padding: "9px 0", borderRadius: 10, background: game.color, color: "#fff", fontWeight: 800, fontSize: 12, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "filter .15s", filter: hov ? "brightness(1.1)" : "brightness(1)" }}>
            ▶ العب الآن
          </Link>
          <Link href={game.trainHref} onClick={e => e.stopPropagation()} style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#7a7a8a", fontWeight: 700, fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            🤖
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── HOME SCREEN ──────────────────────────────────────────── */
function HomeScreen({ user }: { user: any }) {
  return (
    <div style={{ padding: "70px 0 90px" }}>

      {/* ══ HERO BANNER with Shooting Stars ══ */}
      <div style={{
        margin: "0 clamp(14px,4vw,28px) 18px",
        padding: "clamp(28px,4vw,44px) clamp(20px,4vw,40px)",
        borderRadius: 22,
        background: "linear-gradient(135deg, #12062e 0%, #0d0820 40%, #0c0c0e 100%)",
        border: "1px solid rgba(124,58,237,0.2)",
        position: "relative", overflow: "hidden",
        minHeight: 200,
      }}>
        {/* Canvas shooting stars */}
        <ShootingStarsCanvas />

        {/* Content above canvas */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ position: "relative", zIndex: 2 }}
        >
          <div style={{ fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 18, height: 1.5, background: "linear-gradient(90deg, #7c3aed, transparent)", display: "inline-block", borderRadius: 99 }}/>
            منصة الألعاب العربية
          </div>

          <h1 style={{
            fontSize: "clamp(28px,6vw,48px)", fontWeight: 900, lineHeight: 1.1,
            color: "#f4f4f8", marginBottom: 10,
            textShadow: "0 0 40px rgba(124,58,237,0.3)",
          }}>
            العب. تنافس. اربح.
          </h1>

          <p style={{ fontSize: "clamp(12px,1.5vw,14px)", color: "#7a7a8a", maxWidth: 360, lineHeight: 1.75, marginBottom: 24 }}>
            دومينو، بلوت، شطرنج، لودو وألعاب أكثر. العب أونلاين مع لاعبين من كل الدول العربية.
          </p>

          {(!user || user.id?.startsWith("guest")) && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/auth/register" style={{
                padding: "11px 24px", borderRadius: 11,
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                color: "#fff", fontWeight: 800, fontSize: 13, textDecoration: "none",
                boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
              }}>
                ابدأ مجاناً →
              </Link>
              <Link href="/auth/login" style={{ padding: "11px 20px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#c0c0cc", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                تسجيل دخول
              </Link>
            </div>
          )}
          {user && !user.id?.startsWith("guest") && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, color: "#a78bfa", fontWeight: 700 }}>مرحباً يا {user.name?.split(" ")[0]} 👋</span>
              <Link href="/games/domino/online" style={{ padding: "9px 20px", borderRadius: 10, background: "#7c3aed", color: "#fff", fontWeight: 800, fontSize: 12, textDecoration: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
                العب الآن →
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* ══ LIVE STREAM BANNER ══ */}
      <LiveBanner />

      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 clamp(14px,4vw,28px) 14px" }}>
        <h2 style={{ fontWeight: 800, fontSize: 14, color: "#c0c0cc" }}>الألعاب المتاحة</h2>
        <span style={{ fontSize: 10, color: "#404050", fontWeight: 700 }}>٤ ألعاب</span>
      </div>

      {/* Games grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
        gap: 14, padding: "0 clamp(14px,4vw,28px) 28px",
      }}>
        {GAMES.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
      </div>

      {/* Stats row */}
      <div style={{ padding: "0 clamp(14px,4vw,28px)", marginBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
          {[
            { icon: "👥", value: "+٢٨,٠٠٠", label: "لاعب نشط" },
            { icon: "🏆", value: "+٥,٠٠٠",  label: "مباراة اليوم" },
            { icon: "🌍", value: "٢٢",       label: "دولة مشاركة" },
            { icon: "⚡", value: "< ١٠ث",   label: "انتظار متوسط" },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              style={{ padding: "14px 12px", background: "#131317", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 5 }}>{s.icon}</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#f4f4f8", marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#7a7a8a", fontWeight: 600 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── WAR SCREEN ────────────────────────────────────────────── */
function WarScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/country-war").then(r => r.json()).then(d => { if (d.countries) setData(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "70px clamp(14px,4vw,28px) 90px", maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 900, fontSize: 22, color: "#f4f4f8", marginBottom: 4 }}>⚔️ معركة الدول</h2>
        <p style={{ fontSize: 12, color: "#7a7a8a" }}>العب وأضف نقطة لبلدك كل أسبوع</p>
      </div>
      {loading && Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ height: 56, borderRadius: 12, marginBottom: 8, background: "#131317" }}/>
      ))}
      {!loading && data?.countries.map((c: any, i: number) => {
        const pct = data.total > 0 ? (c.score / data.total) * 100 : 0;
        return (
          <motion.div key={c.code} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            style={{ padding: "12px 14px", background: i === 0 ? "rgba(245,158,11,0.05)" : "#131317", border: `1px solid ${i === 0 ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.05)"}`, borderRadius: 14, marginBottom: 7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 12, color: ["#fbbf24","#c0c0c0","#cd7f32"][i] ?? "#404050", fontWeight: 900, width: 20 }}>
                {["🥇","🥈","🥉"][i] ?? (i + 1)}
              </span>
              <span style={{ fontSize: 22 }}>{c.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#f4f4f8" }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "#7a7a8a" }}>{c.wins} فوز</div>
              </div>
              <span style={{ fontWeight: 900, fontSize: 13, color: i === 0 ? "#f59e0b" : "#404050" }}>{c.score.toLocaleString()}</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.04 }}
                style={{ height: "100%", borderRadius: 99, background: i === 0 ? "#f59e0b" : "#7c3aed" }}/>
            </div>
          </motion.div>
        );
      })}
      <Link href="/games/domino/online" style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 14, padding: "13px", borderRadius: 14, background: "#7c3aed", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
        العب وأضف نقطة لبلدك →
      </Link>
    </div>
  );
}

/* ─── STORE SCREEN ──────────────────────────────────────────── */
const STORE_ITEMS = [
  { id: "coins_500",   type: "coins",  name: "٥٠٠ كوين",    desc: "عملات للمتجر والرهانات",          icon: "🪙", price: 0,   gems: 50,  color: "#f59e0b", tag: "شائع" },
  { id: "coins_1200",  type: "coins",  name: "١٢٠٠ كوين",   desc: "قيمة أفضل +٢٠٪",                 icon: "🪙", price: 0,   gems: 100, color: "#f59e0b", tag: "قيمة" },
  { id: "skin_dragon", type: "skin",   name: "سكن التنين",   desc: "قطع دومينو بتصميم التنين",        icon: "🐉", price: 800, gems: 0,   color: "#ef4444", tag: "حصري" },
  { id: "skin_phoenix",type: "skin",   name: "سكن الفينيكس", desc: "قطع دومينو بتصميم الفينيكس",      icon: "🔥", price: 800, gems: 0,   color: "#f97316", tag: "حصري" },
  { id: "skin_unicorn",type: "skin",   name: "سكن اليونيكورن",desc: "قطع دومينو يونيكورن",            icon: "🦄", price: 600, gems: 0,   color: "#a78bfa", tag: "جديد" },
  { id: "skin_griffin",type: "skin",   name: "سكن الغريفين", desc: "قطع دومينو بتصميم الغريفين",      icon: "🦅", price: 700, gems: 0,   color: "#06b6d4", tag: "جديد" },
  { id: "frame_royal", type: "frame",  name: "إطار الملكي",  desc: "إطار مميز لبروفايلك",             icon: "👑", price: 400, gems: 0,   color: "#f59e0b", tag: "" },
  { id: "avatar_knight",type:"avatar", name: "شخصية الفارس", desc: "أفاتار الفارس المدرّع",           icon: "🤺", price: 300, gems: 0,   color: "#8b5cf6", tag: "" },
];

type StoreFilter = "all" | "coins" | "skin" | "frame" | "avatar";

function StoreScreen() {
  const { user } = usePlatformStore();
  const [filter, setFilter] = useState<StoreFilter>("all");
  const [buying, setBuying] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const filtered = filter === "all" ? STORE_ITEMS : STORE_ITEMS.filter(i => i.type === filter);

  async function buy(item: typeof STORE_ITEMS[number]) {
    if (!user || user.id?.startsWith("guest")) { setMsg({ text: "سجّل دخولك أولاً", ok: false }); setTimeout(() => setMsg(null), 2500); return; }
    setBuying(item.id);
    try {
      const res = await fetch("/api/store/buy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: item.id, price: item.price, type: item.type }) });
      const data = await res.json();
      setMsg(res.ok ? { text: "تم الشراء بنجاح! ✅", ok: true } : { text: data.error ?? "فشل الشراء", ok: false });
    } catch { setMsg({ text: "خطأ في الاتصال", ok: false }); }
    finally { setBuying(null); setTimeout(() => setMsg(null), 2500); }
  }

  const FILTERS = [
    { id: "all" as StoreFilter, label: "الكل" }, { id: "coins" as StoreFilter, label: "عملات" },
    { id: "skin" as StoreFilter, label: "سكنات" }, { id: "frame" as StoreFilter, label: "إطارات" },
    { id: "avatar" as StoreFilter, label: "شخصيات" },
  ];

  return (
    <div style={{ padding: "70px clamp(14px,4vw,28px) 90px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 900, fontSize: 22, color: "#f4f4f8", marginBottom: 4 }}>المتجر</h2>
        <p style={{ fontSize: 12, color: "#7a7a8a" }}>سكنات حصرية، أفاتارات، عملات</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[{ icon:"🪙", val:(user?.coins ?? 0).toLocaleString(), color:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.15)" }, { icon:"💎", val:(user?.gems ?? 0).toString(), color:"#a78bfa", bg:"rgba(139,92,246,0.08)", border:"rgba(139,92,246,0.15)" }].map(b => (
          <div key={b.icon} style={{ flex: 1, padding: "10px 14px", borderRadius: 12, background: b.bg, border: `1px solid ${b.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{b.icon}</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: b.color }}>{b.val}</span>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ padding:"10px 14px", borderRadius:12, marginBottom:14, background: msg.ok?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", border:`1px solid ${msg.ok?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}`, color: msg.ok?"#22c55e":"#ef4444", fontWeight:700, fontSize:13, textAlign:"center" }}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ display:"flex", gap:7, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding:"6px 14px", borderRadius:99, border:"none", cursor:"pointer", fontFamily:"inherit", background: filter===f.id?"#7c3aed":"#1e1e25", color: filter===f.id?"#fff":"#7a7a8a", fontWeight:700, fontSize:12, whiteSpace:"nowrap", transition:"all .15s" }}>{f.label}</button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(min(100%, 180px), 1fr))", gap:12 }}>
        {filtered.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
            style={{ background:"#131317", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ height:90, background:`radial-gradient(circle at 50% 40%, ${item.color}22, #0c0c0e 70%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:42 }}>{item.icon}</div>
            <div style={{ padding:"12px 12px 14px" }}>
              {item.tag && <span style={{ fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:99, background:`${item.color}15`, border:`1px solid ${item.color}25`, color:item.color, display:"inline-block", marginBottom:6 }}>{item.tag}</span>}
              <div style={{ fontWeight:800, fontSize:13, color:"#f4f4f8", marginBottom:3 }}>{item.name}</div>
              <div style={{ fontSize:10, color:"#7a7a8a", marginBottom:12, lineHeight:1.4 }}>{item.desc}</div>
              <button onClick={() => buy(item)} disabled={buying===item.id} style={{ width:"100%", padding:"8px 0", borderRadius:9, border:"none", background: buying===item.id?"rgba(124,58,237,0.4)":item.price===0?"#7c3aed":"#f59e0b", color:item.price===0?"#fff":"#000", fontWeight:800, fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"all .15s", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                {buying===item.id ? "..." : item.price===0 ? <span>💎 {item.gems}</span> : <span>🪙 {item.price.toLocaleString()}</span>}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── PROFILE SCREEN ────────────────────────────────────────── */
function ProfileScreen() {
  const { user } = usePlatformStore();
  const xp = user?.xp ?? 0; const maxXp = user?.max_xp ?? 1000;
  const pct = Math.min(100, (xp / maxXp) * 100);

  return (
    <div style={{ padding:"70px clamp(14px,4vw,28px) 90px", maxWidth:440, margin:"0 auto" }}>
      <h2 style={{ fontWeight:900, fontSize:22, color:"#f4f4f8", marginBottom:20 }}>حسابي</h2>
      <div style={{ padding:"18px 16px", background:"#131317", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, position:"relative" }}>
            {user?.avatar?.startsWith("http") ? <img src={user.avatar} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }} alt=""/> : "🎮"}
            <div style={{ position:"absolute", bottom:-6, right:-6, width:20, height:20, borderRadius:7, background:"#f59e0b", color:"#000", fontSize:9, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center" }}>{user?.level ?? 1}</div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:900, fontSize:16, color:"#f4f4f8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name ?? "Guest"}</div>
            <div style={{ display:"flex", gap:5, marginTop:4, flexWrap:"wrap" }}>
              <span style={{ fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:99, background:"rgba(245,158,11,0.1)", color:"#f59e0b" }}>🪙 {(user?.coins ?? 0).toLocaleString()}</span>
              <span style={{ fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:99, background:"rgba(139,92,246,0.1)", color:"#a78bfa" }}>💎 {user?.gems ?? 0}</span>
            </div>
            <div style={{ marginTop:8 }}>
              <div style={{ height:3, background:"rgba(255,255,255,0.05)", borderRadius:99, overflow:"hidden" }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.8 }} style={{ height:"100%", borderRadius:99, background:"#7c3aed" }}/>
              </div>
              <div style={{ fontSize:9, color:"#404050", marginTop:2, fontWeight:600 }}>{xp} / {maxXp} XP</div>
            </div>
          </div>
        </div>
      </div>
      {(!user || user.id === "guest_001") && (
        <Link href="/auth/login" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px", borderRadius:12, marginBottom:10, background:"#7c3aed", color:"#fff", fontWeight:800, fontSize:14, textDecoration:"none" }}>
          🚀 سجل دخول لحفظ تقدمك
        </Link>
      )}
      {[{ label:"🏆 لوائح الشرف", href:"/leaderboards" }, { label:"🎯 البطولات", href:"/tournaments" }, { label:"👤 الملف الكامل", href:"/profile" }].map(item => (
        <Link key={item.href} href={item.href} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 14px", borderRadius:12, marginBottom:7, background:"#131317", border:"1px solid rgba(255,255,255,0.05)", color:"#c0c0cc", fontWeight:700, fontSize:13, textDecoration:"none" }}>
          {item.label} <span style={{ color:"#404050" }}>‹</span>
        </Link>
      ))}
    </div>
  );
}

/* ─── BOTTOM NAV ────────────────────────────────────────────── */
const TABS_NAV = [
  { id:"home"    as Tab, label:"الرئيسية", icon:"⊞" },
  { id:"war"     as Tab, label:"معركة",    icon:"⚔" },
  { id:"store"   as Tab, label:"متجر",     icon:"◇" },
  { id:"profile" as Tab, label:"حسابي",    icon:"◉" },
];

function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, background:"rgba(12,12,14,0.96)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderTop:"1px solid rgba(255,255,255,0.06)", paddingBottom:"env(safe-area-inset-bottom)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-around", padding:"7px 0" }}>
        {TABS_NAV.map(t => {
          const on = t.id === active;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"5px 16px", borderRadius:11, background: on?"rgba(124,58,237,0.12)":"transparent", border:"none", cursor:"pointer", color: on?"#a78bfa":"#404050", fontFamily:"inherit", transition:"all .15s", minWidth:60 }}>
              <span style={{ fontSize:17, lineHeight:1 }}>{t.icon}</span>
              <span style={{ fontSize:9, fontWeight:800 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ─── ROOT ──────────────────────────────────────────────────── */
export default function PlatformHub() {
  const { user, fetchProfile } = usePlatformStore();
  const [tab, setTab] = useState<Tab>("home");
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => { fetchProfile?.(); }, []);
  useEffect(() => {
    const load = () => fetch("/api/online-count").then(r => r.json()).then(d => setOnlineCount(d.count ?? null)).catch(() => {});
    load(); const t = setInterval(load, 30_000); return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight:"100dvh", background:"#0c0c0e", color:"#f4f4f8", fontFamily:"var(--font-cairo), sans-serif" }}>
      <style>{`
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes livePulse{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        * { -webkit-tap-highlight-color: transparent }
      `}</style>
      <Header user={user} onlineCount={onlineCount} />
      <AnimatePresence mode="wait">
        {tab==="home"    && <motion.div key="home"    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.18}}><HomeScreen user={user}/></motion.div>}
        {tab==="war"     && <motion.div key="war"     initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.18}}><WarScreen/></motion.div>}
        {tab==="store"   && <motion.div key="store"   initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.18}}><StoreScreen/></motion.div>}
        {tab==="profile" && <motion.div key="profile" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.18}}><ProfileScreen/></motion.div>}
      </AnimatePresence>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
