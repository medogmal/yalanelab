"use client";
// ═══════════════════════════════════════════════════════════════
//  صفحة مشاريع الـ Editor — عرض وإدارة كل مشاريع اللعبة
// ═══════════════════════════════════════════════════════════════
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit3, Play, Gamepad2, Loader2, Clock, BarChart2, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  isPublished: boolean;
  playCount: number;
  likeCount: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const CAT_ICONS: Record<string, string> = {
  platformer: "🏃", topdown: "🗺️", puzzle: "🧩", rpg: "⚔️",
  racing: "🏎️", shooter: "🔫", custom: "🎮",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "#f59e0b", published: "#22c55e", archived: "#64748b",
};

export default function EditorProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<"loading"|"ok"|"unauth">("loading");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setAuthStatus(d.user ? "ok" : "unauth");
      if (!d.user) router.push("/auth/login");
    }).catch(() => setAuthStatus("unauth"));
  }, []);

  useEffect(() => {
    if (authStatus !== "ok") return;
    fetch("/api/editor/projects")
      .then(r => r.json())
      .then(d => setProjects(d.projects || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authStatus]);

  async function deleteProject(id: string) {
    if (!confirm("هتحذف المشروع ده؟")) return;
    setDeleting(id);
    await fetch(`/api/editor/projects/${id}`, { method: "DELETE" });
    setProjects(p => p.filter(x => x.id !== id));
    setDeleting(null);
  }

  if (loading || authStatus === "loading") {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#07090f" }}>
        <Loader2 size={28} style={{ color: "#7c3aed", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#07090f", fontFamily: "var(--font-cairo)", padding: "24px 32px", color: "#f0f4ff" }} dir="rtl">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <Gamepad2 size={28} style={{ color: "#7c3aed" }} />
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>يالا Editor</h1>
          <p style={{ fontSize: 12, color: "#6b7a9a", margin: 0 }}>مشاريعك ({projects.length})</p>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push("/editor")}
          style={{ background: "#7c3aed", border: "none", borderRadius: 10, color: "#fff", padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
          <Plus size={15} /> مشروع جديد
        </button>
        <button onClick={() => router.push("/")}
          style={{ background: "transparent", border: "1px solid #1e2535", borderRadius: 10, color: "#6b7a9a", padding: "10px 16px", fontSize: 13, cursor: "pointer" }}>
          الرئيسية
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginTop: 80 }}>
          <Gamepad2 size={48} style={{ color: "#7c3aed", opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: "#6b7a9a", marginBottom: 24 }}>ما عندكش مشاريع لسه</p>
          <button onClick={() => router.push("/editor")}
            style={{ background: "#7c3aed", border: "none", borderRadius: 10, color: "#fff", padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, margin: "0 auto" }}>
            <Plus size={16} /> ابدأ مشروع جديد
          </button>
        </motion.div>
      )}

      {/* Projects Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {projects.map((p, i) => (
          <motion.div key={p.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ background: "#0d1117", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "border-color .15s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#7c3aed")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e2535")}
            onClick={() => router.push(`/editor?id=${p.id}`)}
          >
            {/* Thumbnail */}
            <div style={{ height: 130, background: p.thumbnailUrl ? `url(${p.thumbnailUrl}) center/cover` : "linear-gradient(135deg, #1a1a3e, #0d1117)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!p.thumbnailUrl && <span style={{ fontSize: 40 }}>{CAT_ICONS[p.category] || "🎮"}</span>}
            </div>

            {/* Content */}
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, marginBottom: 3 }}>{p.title}</h3>
                  {p.description && <p style={{ fontSize: 11, color: "#6b7a9a", margin: 0 }}>{p.description.slice(0, 60)}{p.description.length > 60 ? "..." : ""}</p>}
                </div>
                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: STATUS_COLORS[p.status] + "22", color: STATUS_COLORS[p.status], fontWeight: 600, flexShrink: 0 }}>
                  {p.status === "draft" ? "مسودة" : p.status === "published" ? "منشور" : "مؤرشف"}
                </span>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: "#6b7a9a", display: "flex", alignItems: "center", gap: 3 }}>
                  <BarChart2 size={10} /> {p.playCount} لعبة
                </span>
                <span style={{ fontSize: 10, color: "#6b7a9a", display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={10} /> {new Date(p.updatedAt).toLocaleDateString("ar-EG")}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => router.push(`/editor?id=${p.id}`)}
                  style={{ flex: 1, background: "rgba(124,58,237,0.12)", border: "1px solid #7c3aed", borderRadius: 7, color: "#7c3aed", padding: "6px 0", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Edit3 size={11} /> تعديل
                </button>
                <button onClick={() => deleteProject(p.id)} disabled={deleting === p.id}
                  style={{ width: 30, height: 30, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {deleting === p.id ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={11} />}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
