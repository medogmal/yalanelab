"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════════════════
   سوبر أدمن — لوحة التحكم الكاملة
   صلاحيات: إضافة ألعاب، سكينات، إدارة المنصة كاملة
══════════════════════════════════════════════════════ */

const TABS = [
  { id: "overview",  label: "نظرة عامة",    icon: "⊞" },
  { id: "skins",     label: "السكينات",      icon: "🛒" },
  { id: "games",     label: "الألعاب",       icon: "🎮" },
  { id: "platform",  label: "المنصة",        icon: "⚙" },
  { id: "danger",    label: "منطقة الخطر",   icon: "⚠" },
];

const SKIN_TYPES = [
  { id: "avatar",      label: "أفاتار",        icon: "👤", color: "#60a5fa" },
  { id: "domino_skin", label: "دومينو",         icon: "🁣", color: "#34d399" },
  { id: "card_skin",   label: "كروت بالوت",    icon: "🃏", color: "#f59e0b" },
  { id: "chess_skin",  label: "شطرنج",          icon: "♟", color: "#a78bfa" },
  { id: "ludo_skin",   label: "لودو",           icon: "🎲", color: "#f87171" },
  { id: "baloot_skin", label: "بالوت طاولة",   icon: "🎯", color: "#22d3ee" },
  { id: "game_skin",   label: "سكين عام",       icon: "✨", color: "#c9a227" },
  { id: "baloot_frame",label: "إطار بالوت",    icon: "🖼", color: "#d4af37" },
];

type Skin = {
  id: string; type: string; name: string; asset: string;
  emoji?: string; price?: number; currency?: string;
  glowColor?: string; tag?: string; vip_required?: boolean;
};

/* ─── Tab: Overview ─────────────────────────────── */
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(users => {
      setStats({
        totalUsers: users.length,
        admins: users.filter((u: any) => u.role === "admin" || u.role === "super_admin").length,
        vipUsers: users.filter((u: any) => u.tier === "vip" || u.tier === "plus").length,
      });
    }).catch(() => setStats({ totalUsers: "—", admins: "—", vipUsers: "—" }));
  }, []);

  const cards = [
    { label: "إجمالي المستخدمين", value: stats?.totalUsers ?? "…", color: "#60a5fa", icon: "👥" },
    { label: "المسؤولون",          value: stats?.admins ?? "…",     color: "#f59e0b", icon: "🛡" },
    { label: "مستخدمو VIP",       value: stats?.vipUsers ?? "…",   color: "#c9a227", icon: "👑" },
    { label: "إصدار المنصة",      value: "v2.0",                    color: "#34d399", icon: "🚀" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ padding: 18, borderRadius: 18, background: `${c.color}0a`, border: `1px solid ${c.color}22` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>{c.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ padding: 20, borderRadius: 18, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
        <div style={{ fontWeight: 900, color: "#fff", marginBottom: 14, fontSize: 14 }}>إجراءات سريعة</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { label: "مسح الكاش", icon: "🔄", action: () => alert("تم مسح الكاش"), color: "#60a5fa" },
            { label: "تحديث الكاتالوج", icon: "📦", action: () => fetch("/api/admin/skins").then(() => alert("تم")), color: "#34d399" },
            { label: "إرسال إشعار عام", icon: "📢", action: () => alert("قريباً"), color: "#f59e0b" },
            { label: "تصدير بيانات", icon: "💾", action: () => alert("قريباً"), color: "#a78bfa" },
          ].map(a => (
            <button key={a.label} onClick={a.action}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 12, background: `${a.color}15`, border: `1px solid ${a.color}30`, color: a.color, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Skins Manager ─────────────────────────── */
function SkinsTab() {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState<Partial<Skin>>({ type: "domino_skin", price: 500, currency: "coins" });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/skins");
    setSkins(await r.json());
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id || !form.name) return;
    setSubmitting(true);
    let asset = form.asset ?? "";

    if (file) {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", "skins");
      const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const ud = await up.json();
      if (ud.success) asset = ud.path;
      else { setMsg({ ok: false, text: "فشل رفع الصورة: " + ud.error }); setSubmitting(false); return; }
    }

    const payload = { ...form, asset, emoji: form.emoji || "", glowColor: form.glowColor || "", tag: form.tag || "" };
    const r = await fetch("/api/admin/skins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (r.ok) {
      setMsg({ ok: true, text: "✓ تم إضافة السكين بنجاح" });
      setForm({ type: "domino_skin", price: 500, currency: "coins" });
      setFile(null);
      load();
    } else {
      setMsg({ ok: false, text: "خطأ — ربما المعرف مكرر" });
    }
    setSubmitting(false);
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleDelete(id: string) {
    if (!confirm(`حذف "${id}"؟`)) return;
    await fetch(`/api/admin/skins?id=${id}`, { method: "DELETE" });
    load();
  }

  const visible = filterType === "all" ? skins : skins.filter(s => s.type === filterType);

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div style={{ padding: 24, borderRadius: 20, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}>
        <div style={{ fontWeight: 900, color: "#fff", marginBottom: 16, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <span>➕</span> إضافة سكين جديد
        </div>
        <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12 }}>
          {/* Type */}
          <div>
            <div style={labelSt}>النوع</div>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputSt}>
              {SKIN_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          {/* ID */}
          <div>
            <div style={labelSt}>المعرف (id)</div>
            <input placeholder="skin_gold_2" value={form.id ?? ""} onChange={e => setForm({ ...form, id: e.target.value })} style={inputSt} required />
          </div>
          {/* Name */}
          <div>
            <div style={labelSt}>الاسم الظاهر</div>
            <input placeholder="ذهبي فاخر" value={form.name ?? ""} onChange={e => setForm({ ...form, name: e.target.value })} style={inputSt} required />
          </div>
          {/* Emoji */}
          <div>
            <div style={labelSt}>إيموجي / رمز</div>
            <input placeholder="✨ أو 𓂀" value={form.emoji ?? ""} onChange={e => setForm({ ...form, emoji: e.target.value })} style={inputSt} />
          </div>
          {/* Price */}
          <div>
            <div style={labelSt}>السعر</div>
            <input type="number" placeholder="500" value={form.price ?? 0} onChange={e => setForm({ ...form, price: Number(e.target.value) })} style={inputSt} />
          </div>
          {/* Currency */}
          <div>
            <div style={labelSt}>العملة</div>
            <select value={form.currency ?? "coins"} onChange={e => setForm({ ...form, currency: e.target.value })} style={inputSt}>
              <option value="coins">🪙 كوينز</option>
              <option value="gems">💎 جمز</option>
            </select>
          </div>
          {/* Glow */}
          <div>
            <div style={labelSt}>لون الـ Glow</div>
            <input type="color" value={form.glowColor ?? "#d4af37"} onChange={e => setForm({ ...form, glowColor: e.target.value })} style={{ ...inputSt, padding: "6px 8px", height: 42 }} />
          </div>
          {/* Tag */}
          <div>
            <div style={labelSt}>تاج (tag)</div>
            <input placeholder="فرعوني / نيون / VIP" value={form.tag ?? ""} onChange={e => setForm({ ...form, tag: e.target.value })} style={inputSt} />
          </div>
          {/* Asset path or upload */}
          <div style={{ gridColumn: "span 2" }}>
            <div style={labelSt}>مسار الأصل أو رفع صورة</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="/skins/domino/garrifin أو emoji" value={form.asset ?? ""} onChange={e => setForm({ ...form, asset: e.target.value })} style={{ ...inputSt, flex: 1 }} />
              <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", borderRadius: 12, background: file ? "rgba(52,211,153,.15)" : "rgba(255,255,255,.06)", border: `1px solid ${file ? "rgba(52,211,153,.4)" : "rgba(255,255,255,.1)"}`, color: file ? "#34d399" : "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>
                📁 {file ? file.name.slice(0, 12) + "…" : "رفع"}
                <input type="file" accept="image/*,.png,.jpg,.jpeg,.gif" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          </div>
          {/* VIP */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={!!form.vip_required} onChange={e => setForm({ ...form, vip_required: e.target.checked })} style={{ width: 16, height: 16, accentColor: "#f59e0b" }} />
            <label style={{ color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 700 }}>حصري VIP</label>
          </div>
          {/* Submit */}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" disabled={submitting} style={{ width: "100%", padding: "10px", borderRadius: 14, fontWeight: 900, fontSize: 13, background: "linear-gradient(135deg,#d4af37,#ea580c)", color: "#000", border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? .6 : 1 }}>
              {submitting ? "…" : "إضافة سكين"}
            </button>
          </div>
        </form>
        {msg && (
          <div style={{ marginTop: 10, padding: "8px 14px", borderRadius: 10, background: msg.ok ? "rgba(52,211,153,.1)" : "rgba(239,68,68,.1)", border: `1px solid ${msg.ok ? "rgba(52,211,153,.3)" : "rgba(239,68,68,.3)"}`, color: msg.ok ? "#34d399" : "#f87171", fontSize: 12, fontWeight: 800 }}>
            {msg.text}
          </div>
        )}
      </div>

      {/* Filter + Grid */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setFilterType("all")} style={filterBtn(filterType === "all")}>الكل ({skins.length})</button>
        {SKIN_TYPES.map(t => {
          const count = skins.filter(s => s.type === t.id).length;
          if (!count) return null;
          return <button key={t.id} onClick={() => setFilterType(t.id)} style={filterBtn(filterType === t.id)}>{t.icon} {t.label} ({count})</button>;
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.3)" }}>جاري التحميل…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 14 }}>
          {visible.map(s => {
            const tc = SKIN_TYPES.find(t => t.id === s.type);
            return (
              <div key={s.id} style={{ borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column" }}>
                {/* preview */}
                <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: s.glowColor ? `${s.glowColor}0a` : "rgba(255,255,255,.02)", fontSize: 36, position: "relative" }}>
                  {s.asset?.startsWith("/") || s.asset?.startsWith("http")
                    ? <img src={s.asset} alt={s.name} style={{ maxWidth: "80%", maxHeight: 70, objectFit: "contain" }} />
                    : <span style={{ filter: s.glowColor ? `drop-shadow(0 0 6px ${s.glowColor})` : undefined }}>{s.emoji || s.asset || "🎨"}</span>}
                  <span style={{ position: "absolute", top: 4, right: 4, fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 99, background: tc?.color + "22", color: tc?.color }}>{s.type}</span>
                </div>
                {/* info */}
                <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontWeight: 900, fontSize: 12, color: "#fff" }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontFamily: "monospace" }}>{s.id}</div>
                  <div style={{ fontSize: 11, color: "#d4af37", fontWeight: 700 }}>
                    {s.price === 0 ? "مجاني" : `${s.price} ${s.currency === "gems" ? "💎" : "🪙"}`}
                    {s.vip_required && <span style={{ marginRight: 4, color: "#f59e0b" }}>VIP</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(s.id)} style={{ padding: "6px", background: "rgba(239,68,68,.06)", border: "none", borderTop: "1px solid rgba(239,68,68,.15)", color: "#f87171", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                  🗑 حذف
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Tab: Games ─────────────────────────────────── */
function GamesTab() {
  const games = [
    { id: "baloot",  name: "بالوت",   icon: "🃏", status: true,  players: 120, desc: "لعبة ورق سعودية ٤ لاعبين" },
    { id: "domino",  name: "دومينو",  icon: "🁣", status: true,  players: 85,  desc: "كلاسيك + بلوك + الأخماس" },
    { id: "chess",   name: "شطرنج",   icon: "♟",  status: true,  players: 45,  desc: "شطرنج كلاسيكي مع AI" },
    { id: "ludo",    name: "لودو",    icon: "🎲", status: true,  players: 210, desc: "لودو ٢-٤ لاعبين" },
  ];
  const [statuses, setStatuses] = useState<Record<string, boolean>>(
    Object.fromEntries(games.map(g => [g.id, g.status]))
  );
  return (
    <div className="space-y-4">
      <div style={{ padding: "12px 16px", borderRadius: 14, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>
        ⚠ تعطيل لعبة سيمنع اللاعبين من الدخول إليها فوراً
      </div>
      {games.map(g => (
        <div key={g.id} style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 32 }}>{g.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 15 }}>{g.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{g.desc}</div>
            <div style={{ fontSize: 11, color: "#34d399", marginTop: 4 }}>{g.players} لاعب نشط</div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 11, color: statuses[g.id] ? "#34d399" : "#ef4444", fontWeight: 800 }}>
              {statuses[g.id] ? "مفعّل" : "معطّل"}
            </span>
            <div onClick={() => setStatuses(s => ({ ...s, [g.id]: !s[g.id] }))}
              style={{ width: 44, height: 24, borderRadius: 99, background: statuses[g.id] ? "#34d399" : "rgba(255,255,255,.1)", position: "relative", transition: "background .2s", cursor: "pointer" }}>
              <div style={{ position: "absolute", top: 3, left: statuses[g.id] ? "calc(100% - 21px)" : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
            </div>
          </label>
        </div>
      ))}
    </div>
  );
}

/* ─── Tab: Platform ──────────────────────────────── */
function PlatformTab() {
  const [cfg, setCfg] = useState({ siteName: "يالا نلعب", maintenanceMode: false, maxUsersPerGame: 4, defaultCoins: 1000 });
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch("/api/admin/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 14 }}>
        {[
          { label: "اسم المنصة", key: "siteName", type: "text" },
          { label: "رصيد ابتدائي للمستخدم الجديد", key: "defaultCoins", type: "number" },
          { label: "أقصى عدد لاعبين في غرفة", key: "maxUsersPerGame", type: "number" },
        ].map(f => (
          <div key={f.key}>
            <div style={labelSt}>{f.label}</div>
            <input type={f.type} value={(cfg as any)[f.key]} onChange={e => setCfg(c => ({ ...c, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))} style={inputSt} />
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" checked={cfg.maintenanceMode} onChange={e => setCfg(c => ({ ...c, maintenanceMode: e.target.checked }))} style={{ width: 18, height: 18, accentColor: "#ef4444" }} />
          <label style={{ color: "#ef4444", fontWeight: 800, fontSize: 13 }}>⚠ وضع الصيانة</label>
        </div>
      </div>
      <button onClick={save} style={{ padding: "10px 28px", borderRadius: 14, fontWeight: 900, fontSize: 13, background: saved ? "rgba(52,211,153,.15)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", color: saved ? "#34d399" : "#fff", border: saved ? "1px solid rgba(52,211,153,.3)" : "none", cursor: "pointer" }}>
        {saved ? "✓ تم الحفظ" : "حفظ الإعدادات"}
      </button>
    </div>
  );
}

/* ─── Tab: Danger Zone ───────────────────────────── */
function DangerTab() {
  const [confirm, setConfirm] = useState("");

  const actions = [
    { label: "مسح جميع الكاش", desc: "إعادة تحميل كل البيانات المخزنة مؤقتاً", color: "#f59e0b", action: () => alert("تم مسح الكاش") },
    { label: "إعادة تشغيل الخادم", desc: "سيُعيد الخادم تشغيله في 5 ثواني", color: "#ef4444", action: () => alert("قريباً — متطلب صلاحيات VPS") },
    { label: "تصفير إحصائيات اليوم", desc: "حذف إحصائيات المباريات اليومية فقط", color: "#a78bfa", action: () => alert("تم") },
  ];

  return (
    <div className="space-y-4">
      <div style={{ padding: "12px 16px", borderRadius: 14, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
        🔴 هذه المنطقة للعمليات الخطرة. تأكد جيداً قبل التنفيذ.
      </div>
      {actions.map(a => (
        <div key={a.label} style={{ padding: 18, borderRadius: 16, background: `${a.color}08`, border: `1px solid ${a.color}20`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 14 }}>{a.label}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 3 }}>{a.desc}</div>
          </div>
          <button onClick={a.action} style={{ padding: "8px 18px", borderRadius: 12, fontWeight: 900, fontSize: 12, background: `${a.color}15`, border: `1px solid ${a.color}30`, color: a.color, cursor: "pointer" }}>
            تنفيذ
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Shared styles ──────────────────────────────── */
const inputSt: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 12, background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.1)", color: "#fff", fontSize: 13, fontFamily: "inherit",
  outline: "none",
};
const labelSt: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.4)", marginBottom: 6
};
const filterBtn = (active: boolean): React.CSSProperties => ({
  padding: "6px 14px", borderRadius: 99, fontSize: 11, fontWeight: 800, cursor: "pointer",
  background: active ? "rgba(212,175,55,.15)" : "rgba(255,255,255,.04)",
  border: `1px solid ${active ? "rgba(212,175,55,.4)" : "rgba(255,255,255,.08)"}`,
  color: active ? "#d4af37" : "rgba(255,255,255,.4)",
});

/* ─── Main Page ──────────────────────────────────── */
export default function SuperAdminPage() {
  const [tab, setTab] = useState("overview");

  const TAB_CONTENT: Record<string, React.ReactNode> = {
    overview: <OverviewTab />,
    skins:    <SkinsTab />,
    games:    <GamesTab />,
    platform: <PlatformTab />,
    danger:   <DangerTab />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#f59e0b,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⭐</div>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 22, color: "#fff" }}>سوبر أدمن</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", fontWeight: 700 }}>صلاحيات كاملة على المنصة</p>
        </div>
        <div style={{ marginRight: "auto", padding: "4px 14px", borderRadius: 99, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.3)", color: "#f59e0b", fontSize: 11, fontWeight: 900 }}>
          🔐 وصول حصري
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid rgba(255,255,255,.06)", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "9px 16px", background: "transparent", border: "none",
              borderBottom: tab === t.id ? "2px solid #d4af37" : "2px solid transparent",
              color: tab === t.id ? "#d4af37" : "rgba(255,255,255,.4)",
              fontWeight: 900, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "color .15s",
              ...(t.id === "danger" ? { color: tab === t.id ? "#ef4444" : "rgba(239,68,68,.5)", borderBottomColor: tab === t.id ? "#ef4444" : "transparent" } : {}),
            }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .15 }}>
          {TAB_CONTENT[tab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
