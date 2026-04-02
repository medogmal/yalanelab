// ═══════════════════════════════════════════════════════════════
//  YALA EDITOR — Main Editor Page
//  3-Panel Layout: Left Sidebar | Canvas | Right Properties
//  المرحلة الأولى: CSS بحتة بدون Pixi.js
// ═══════════════════════════════════════════════════════════════
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Settings, Play, Square, Save, Undo2, Redo2,
  Plus, Trash2, Copy, Eye, EyeOff, Lock, Unlock,
  Grid3X3, ZoomIn, ZoomOut, Sparkles, ChevronRight,
  ChevronDown, MousePointer2, Move, Zap, BookOpen,
  X, Loader2, AlertCircle, Gamepad2, LayoutDashboard, Users, ExternalLink,
} from "lucide-react";
import { ALL_CHARACTERS, CHARACTER_CATEGORIES, getCharactersByCategory } from "@/data/characters";
import dynamic from "next/dynamic";
const Canvas3D = dynamic(() => import("@/components/editor/Canvas3D"), { ssr: false, loading: () => (
  <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#0a0f1e" }}>
    <div style={{ color:"#7c3aed", fontSize:14, fontFamily:"var(--font-cairo)" }}>⏳ جاري تحميل العالم 3D...</div>
  </div>
)});
import { useEditorStore } from "@/store/editorStore";
import type {
  EditorTool, EditorPanel, ObjectType, GameObject, GameColor,
} from "@/types/editor";

// ── Color helpers ────────────────────────────────────────────
function colorToCss(c: GameColor) {
  return `rgba(${c.r},${c.g},${c.b},${c.a})`;
}
function hexToGameColor(hex: string): GameColor {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b, a: 1 };
}
function gameColorToHex(c: GameColor): string {
  return "#" + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// ── Object type config ───────────────────────────────────────
const OBJ_CFG: Record<ObjectType, { label: string; color: string; icon: string }> = {
  player:      { label: "لاعب",        color: "#7c3aed", icon: "👤" },
  enemy:       { label: "عدو",         color: "#dc2626", icon: "👾" },
  platform:    { label: "منصة",        color: "#2563eb", icon: "▬"  },
  wall:        { label: "جدار",        color: "#64748b", icon: "█"  },
  trigger:     { label: "منطقة حدث",  color: "#f59e0b", icon: "⚡" },
  collectible: { label: "جائزة",       color: "#10b981", icon: "⭐" },
  npc:         { label: "شخصية",       color: "#06b6d4", icon: "🧑" },
  spawn:       { label: "نقطة بداية", color: "#84cc16", icon: "🚩" },
  goal:        { label: "هدف",         color: "#f97316", icon: "🏆" },
  decoration:  { label: "زخرفة",       color: "#a78bfa", icon: "🌸" },
  text:        { label: "نص",          color: "#e2e8f0", icon: "T"  },
};
const ADD_TYPES: ObjectType[] = [
  "player","platform","wall","enemy","collectible",
  "trigger","npc","spawn","goal","decoration","text",
];

// ── Shared styles ────────────────────────────────────────────
const inputSty: React.CSSProperties = {
  width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-sm)",
  borderRadius: 6, color: "var(--text-100)", padding: "5px 8px", fontSize: 12,
  outline: "none", boxSizing: "border-box", fontFamily: "var(--font-cairo)",
};
const labelSty: React.CSSProperties = {
  display: "block", fontSize: 11, color: "var(--text-400)", marginBottom: 4,
};
function iconBtn(disabled = false, active = false): React.CSSProperties {
  return {
    background: active ? "var(--accent-soft)" : "transparent", border: "none",
    borderRadius: 6, color: disabled ? "var(--text-600)" : active ? "var(--accent)" : "var(--text-200)",
    width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, flexShrink: 0,
  };
}
function toggleBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1, background: active ? "var(--accent-soft)" : "var(--bg-overlay)",
    border: `1px solid ${active ? "var(--accent)" : "var(--border-sm)"}`,
    borderRadius: 6, color: active ? "var(--accent)" : "var(--text-400)",
    padding: "5px 0", fontSize: 11, display: "flex", alignItems: "center",
    justifyContent: "center", gap: 4, cursor: "pointer", fontFamily: "var(--font-cairo)",
  };
}

// ════════════════════════════════════════════════════════════
// TOOLBAR
// ════════════════════════════════════════════════════════════
function Toolbar() {
  const store = useEditorStore();
  const { project, ui } = store;
  const router = useRouter();

  const tools: { id: EditorTool; icon: React.ReactNode; tip: string }[] = [
    { id: "select", icon: <MousePointer2 size={15} />, tip: "تحديد (V)" },
    { id: "move",   icon: <Move size={15} />,           tip: "تحريك (G)" },
    { id: "add",    icon: <Plus size={15} />,           tip: "إضافة (A)" },
    { id: "erase",  icon: <Trash2 size={15} />,         tip: "حذف (D)"   },
  ];

  return (
    <div style={{
      height: 48, background: "var(--bg-raised)", borderBottom: "1px solid var(--border-sm)",
      display: "flex", alignItems: "center", gap: 4, padding: "0 12px", flexShrink: 0,
    }}>
      {/* Brand */}
      <Gamepad2 size={18} style={{ color: "var(--accent)" }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-100)", marginLeft: 6, marginRight: 10 }}>
        يالا Editor
      </span>
      <div style={{ width: 1, height: 24, background: "var(--border-sm)", marginRight: 8 }} />

      {/* Title */}
      <input
        value={project?.title || ""}
        onChange={(e) => store.setProjectTitle(e.target.value)}
        style={{ background: "transparent", border: "none", outline: "none", color: "var(--text-100)", fontSize: 13, fontWeight: 600, width: 160, fontFamily: "var(--font-cairo)" }}
        placeholder="اسم المشروع..."
      />
      {ui.isDirty && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cta)", flexShrink: 0 }} />}

      <div style={{ flex: 1 }} />

      {/* Tools */}
      <div style={{ display: "flex", gap: 2, background: "var(--bg-base)", borderRadius: 8, padding: 3 }}>
        {tools.map((t) => (
          <button key={t.id} title={t.tip} onClick={() => store.setTool(t.id)}
            style={{ ...iconBtn(false, ui.activeTool === t.id), width: 30, height: 30, border: "none" }}>
            {t.icon}
          </button>
        ))}
      </div>
      <div style={{ width: 1, height: 24, background: "var(--border-sm)", margin: "0 6px" }} />

      {/* Undo / Redo */}
      <button title="تراجع (Ctrl+Z)" onClick={store.undo} disabled={!store.canUndo()} style={iconBtn(!store.canUndo())}><Undo2 size={15} /></button>
      <button title="إعادة (Ctrl+Y)" onClick={store.redo} disabled={!store.canRedo()} style={iconBtn(!store.canRedo())}><Redo2 size={15} /></button>
      <div style={{ width: 1, height: 24, background: "var(--border-sm)", margin: "0 6px" }} />

      {/* Grid + Zoom */}
      <button title="شبكة" onClick={store.toggleGrid} style={iconBtn(false, ui.showGrid)}><Grid3X3 size={15} /></button>
      <button onClick={() => store.setZoom(ui.zoom - 0.25)} disabled={ui.zoom <= 0.25} style={iconBtn(ui.zoom <= 0.25)}><ZoomOut size={15} /></button>
      <span style={{ fontSize: 11, color: "var(--text-400)", minWidth: 38, textAlign: "center" }}>{Math.round(ui.zoom * 100)}%</span>
      <button onClick={() => store.setZoom(ui.zoom + 0.25)} disabled={ui.zoom >= 3} style={iconBtn(ui.zoom >= 3)}><ZoomIn size={15} /></button>
      <div style={{ width: 1, height: 24, background: "var(--border-sm)", margin: "0 6px" }} />

      {/* Save */}
      <button
        onClick={store.saveProject}
        disabled={ui.isSaving || !ui.isDirty}
        style={{
          background: ui.isDirty ? "var(--accent-soft)" : "transparent",
          border: `1px solid ${ui.isDirty ? "var(--accent)" : "var(--border-sm)"}`,
          borderRadius: 8, color: ui.isDirty ? "var(--accent)" : "var(--text-400)",
          padding: "0 12px", height: 30, fontSize: 12, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6,
          cursor: ui.isDirty ? "pointer" : "default", fontFamily: "var(--font-cairo)",
        }}
      >
        {ui.isSaving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
        {ui.isSaving ? "جاري الحفظ..." : "حفظ"}
      </button>

      {/* Play / Stop */}
      <button
        onClick={() => store.setPlaying(!ui.isPlaying)}
        style={{
          background: ui.isPlaying ? "rgba(220,38,38,0.15)" : "rgba(34,197,94,0.15)",
          border: `1px solid ${ui.isPlaying ? "#dc2626" : "#22c55e"}`,
          borderRadius: 8, color: ui.isPlaying ? "#dc2626" : "#22c55e",
          padding: "0 12px", height: 30, fontSize: 12, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "var(--font-cairo)",
        }}
      >
        {ui.isPlaying ? <Square size={14} /> : <Play size={14} />}
        {ui.isPlaying ? "إيقاف" : "تشغيل"}
      </button>

      {/* Unity button */}
      <button
        onClick={() => window.open("unityhub://", "_blank")}
        title="فتح Unity Hub"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid #555",
          borderRadius: 8, color: "#ccc",
          padding: "0 10px", height: 30, fontSize: 11,
          display: "flex", alignItems: "center", gap: 5,
          cursor: "pointer", fontFamily: "var(--font-cairo)",
        }}
      >
        <span style={{ fontSize: 14 }}>🎮</span> Unity
      </button>

      {/* Dashboard button */}
      <button
        onClick={() => router.push("/admin")}
        title="لوحة التحكم"
        style={{
          background: "transparent",
          border: "1px solid var(--border-sm)",
          borderRadius: 8, color: "var(--text-400)",
          padding: "0 10px", height: 30, fontSize: 12,
          display: "flex", alignItems: "center", gap: 6,
          cursor: "pointer", fontFamily: "var(--font-cairo)",
        }}
      >
        <LayoutDashboard size={14} /> لوحة التحكم
      </button>

      {/* AI Chat toggle */}
      <button
        onClick={store.toggleAiChat}
        style={{
          background: ui.aiChatOpen ? "rgba(124,58,237,0.2)" : "transparent",
          border: `1px solid ${ui.aiChatOpen ? "var(--accent)" : "var(--border-sm)"}`,
          borderRadius: 8, color: ui.aiChatOpen ? "var(--accent)" : "var(--text-400)",
          padding: "0 10px", height: 30, fontSize: 12,
          display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "var(--font-cairo)",
        }}
      >
        <Sparkles size={14} /> AI
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// LEFT SIDEBAR — Scene tree + panels
// ════════════════════════════════════════════════════════════
function LeftSidebar() {
  const store = useEditorStore();
  const { project, ui } = store;
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["scene_1"]));
  const [showAddMenu, setShowAddMenu] = useState(false);
  const activeScene = store.getActiveScene();

  function toggle(id: string) {
    setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function addObj(type: ObjectType) {
    if (!activeScene) return;
    const cfg = OBJ_CFG[type];
    store.addObject({
      id: `obj_${Date.now()}`,
      name: `${cfg.label} ${activeScene.objects.length + 1}`,
      type, x: 80 + Math.random() * 160, y: 80 + Math.random() * 120,
      width:  type === "platform" || type === "wall" ? 160 : type === "text" ? 200 : 48,
      height: type === "platform" ? 20 : type === "wall" ? 160 : type === "text" ? 40 : 48,
      rotation: 0, visible: true, locked: false,
      color: hexToGameColor(cfg.color), layer: activeScene.objects.length, tags: [],
    } as GameObject);
    setShowAddMenu(false);
  }

  const panels: { id: EditorPanel; icon: React.ReactNode; tip: string }[] = [
    { id: "objects",    icon: <Layers size={14} />,  tip: "عناصر" },
    { id: "characters", icon: <Users size={14} />,   tip: "شخصيات" },
    { id: "events",     icon: <Zap size={14} />,     tip: "أحداث" },
    { id: "story",      icon: <BookOpen size={14} />, tip: "قصة" },
    { id: "settings",   icon: <Settings size={14} />, tip: "إعدادات" },
  ];
  const [charCat, setCharCat] = useState("hero");

  return (
    <div style={{
      width: 240, background: "var(--bg-raised)", borderLeft: "1px solid var(--border-sm)",
      display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden",
    }}>
      {/* Panel tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-sm)", flexShrink: 0 }}>
        {panels.map((p) => (
          <button key={p.id} onClick={() => store.setPanel(p.id)}
            style={{
              flex: 1, height: 36, background: ui.activePanel === p.id ? "var(--bg-overlay)" : "transparent",
              border: "none", borderBottom: ui.activePanel === p.id ? "2px solid var(--accent)" : "2px solid transparent",
              color: ui.activePanel === p.id ? "var(--accent)" : "var(--text-400)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
            {p.icon}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "6px 0" }}>

        {/* Objects panel */}
        {ui.activePanel === "objects" && project?.engineData.scenes.map((sc) => (
          <div key={sc.id}>
            {/* Scene row */}
            <div
              onClick={() => { store.setActiveScene(sc.id); toggle(sc.id); }}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", cursor: "pointer",
                background: ui.selectedSceneId === sc.id ? "var(--accent-soft)" : "transparent",
                borderRight: ui.selectedSceneId === sc.id ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              {expanded.has(sc.id)
                ? <ChevronDown size={12} style={{ color: "var(--text-400)", flexShrink: 0 }} />
                : <ChevronRight size={12} style={{ color: "var(--text-400)", flexShrink: 0 }} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-100)", flex: 1 }}>{sc.name}</span>
              <span style={{ fontSize: 10, color: "var(--text-400)" }}>{sc.objects.length}</span>
              {project.engineData.scenes.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); store.removeScene(sc.id); }}
                  style={{ background: "none", border: "none", color: "var(--text-600)", cursor: "pointer", padding: 2 }}>
                  <Trash2 size={10} />
                </button>
              )}
            </div>

            {/* Object rows */}
            {expanded.has(sc.id) && sc.objects.map((obj) => {
              const cfg = OBJ_CFG[obj.type as ObjectType] || OBJ_CFG.decoration;
              const sel = ui.selectedObjectId === obj.id;
              return (
                <div key={obj.id}
                  onClick={() => { store.setActiveScene(sc.id); store.selectObject(obj.id); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 26px",
                    cursor: "pointer",
                    background: sel ? "rgba(124,58,237,0.1)" : "transparent",
                    borderRight: sel ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                >
                  <span style={{ fontSize: 12 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 11, color: sel ? "var(--text-100)" : "var(--text-200)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {obj.name}
                  </span>
                  {sel && (
                    <div style={{ display: "flex", gap: 2 }}>
                      <button onClick={(e) => { e.stopPropagation(); store.duplicateObject(obj.id); }}
                        style={{ background: "none", border: "none", color: "var(--text-400)", cursor: "pointer", padding: 2 }}>
                        <Copy size={10} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); store.removeObject(obj.id); }}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: 2 }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Characters panel */}
        {ui.activePanel === "characters" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Category tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 8px 4px" }}>
              {CHARACTER_CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setCharCat(cat.id)}
                  style={{
                    background: charCat === cat.id ? "var(--accent-soft)" : "var(--bg-overlay)",
                    border: `1px solid ${charCat === cat.id ? "var(--accent)" : "var(--border-sm)"}`,
                    borderRadius: 6, color: charCat === cat.id ? "var(--accent)" : "var(--text-400)",
                    padding: "3px 7px", fontSize: 10, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 3,
                    fontFamily: "var(--font-cairo)",
                  }}>
                  <span>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>
            {/* Characters grid */}
            <div style={{ flex: 1, overflow: "auto", padding: "4px 8px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {getCharactersByCategory(charCat).map((char) => (
                <div key={char.id}
                  title={`اضغط لإضافة ${char.name}`}
                  onClick={() => {
                    const scene = store.getActiveScene();
                    if (!scene) return;
                    const groundY = Math.round(scene.height * 0.82) - char.height;
                    store.addObject({
                      id: `obj_${Date.now()}`,
                      name: char.name,
                      type: char.category === "hero" ? "player" : char.category === "boss" || char.category === "enemy" ? "enemy" : "npc",
                      x: Math.round(scene.width * 0.3 + Math.random() * scene.width * 0.4),
                      y: groundY,
                      width: char.width,
                      height: char.height,
                      rotation: 0, visible: true, locked: false,
                      color: { r: 124, g: 58, b: 237, a: 1 },
                      layer: scene.objects.length, tags: [char.id],
                      spriteKey: char.id,
                    } as any);
                  }}
                  style={{
                    background: "var(--bg-overlay)",
                    border: "1px solid var(--border-sm)",
                    borderRadius: 10, padding: "10px 6px 6px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.background = "var(--accent-soft)";
                    e.currentTarget.style.transform = "scale(1.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-sm)";
                    e.currentTarget.style.background = "var(--bg-overlay)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {/* SVG Preview - بحجم كبير وواضح */}
                  <div
                    style={{
                      width: 64, height: 64,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: char.svg.replace(
                        /viewBox="([^"]+)"/,
                        `viewBox="$1" width="64" height="64"`
                      )
                    }}
                  />
                  <span style={{
                    fontSize: 11, color: "var(--text-100)", fontFamily: "var(--font-cairo)",
                    textAlign: "center", fontWeight: 600,
                  }}>
                    {char.name}
                  </span>
                  <span style={{ fontSize: 9, color: "var(--text-400)", fontFamily: "var(--font-cairo)" }}>
                    {char.width}×{char.height}px
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events panel */}
        {ui.activePanel === "events" && (
          <div style={{ padding: "16px 12px", textAlign: "center" }}>
            <Zap size={28} style={{ color: "var(--accent)", opacity: 0.4, marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: "var(--text-400)" }}>الأحداث البصرية<br />قريباً في المرحلة الثانية</p>
          </div>
        )}

        {/* Story panel */}
        {ui.activePanel === "story" && (
          <div style={{ padding: "10px 12px" }}>
            <label style={labelSty}>عنوان القصة</label>
            <input
              value={project?.engineData.story.title || ""}
              onChange={(e) => {
                const s = useEditorStore.getState();
                if (!s.project) return;
                s.patchEngineData({ story: { ...s.project.engineData.story, title: e.target.value } });
              }}
              style={inputSty} placeholder="عنوان القصة..."
            />
            <label style={{ ...labelSty, marginTop: 12 }}>الملخص</label>
            <textarea
              value={project?.engineData.story.synopsis || ""}
              onChange={(e) => {
                const s = useEditorStore.getState();
                if (!s.project) return;
                s.patchEngineData({ story: { ...s.project.engineData.story, synopsis: e.target.value } });
              }}
              rows={5}
              style={{ ...inputSty, resize: "vertical" as const, height: "auto" }}
              placeholder="اكتب قصة لعبتك..."
            />
            <label style={{ ...labelSty, marginTop: 12 }}>شرط الفوز</label>
            <input
              value={project?.engineData.story.winCondition || ""}
              onChange={(e) => {
                const s = useEditorStore.getState();
                if (!s.project) return;
                s.patchEngineData({ story: { ...s.project.engineData.story, winCondition: e.target.value } });
              }}
              style={inputSty} placeholder="متى يفوز اللاعب؟"
            />
          </div>
        )}

        {/* Settings panel */}
        {ui.activePanel === "settings" && (
          <div style={{ padding: "10px 12px" }}>
            <label style={labelSty}>حجم الشاشة (عرض × ارتفاع)</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input type="number"
                value={project?.engineData.settings.screenWidth || 800}
                onChange={(e) => { const s = useEditorStore.getState(); if (!s.project) return; s.patchEngineData({ settings: { ...s.project.engineData.settings, screenWidth: +e.target.value } }); }}
                style={{ ...inputSty, width: "50%" }}
              />
              <input type="number"
                value={project?.engineData.settings.screenHeight || 600}
                onChange={(e) => { const s = useEditorStore.getState(); if (!s.project) return; s.patchEngineData({ settings: { ...s.project.engineData.settings, screenHeight: +e.target.value } }); }}
                style={{ ...inputSty, width: "50%" }}
              />
            </div>
            <label style={labelSty}>الفيزياء</label>
            <select
              value={project?.engineData.settings.physics || "arcade"}
              onChange={(e) => { const s = useEditorStore.getState(); if (!s.project) return; s.patchEngineData({ settings: { ...s.project.engineData.settings, physics: e.target.value as "arcade" | "none" } }); }}
              style={{ ...inputSty }}
            >
              <option value="arcade">Arcade (بسيط)</option>
              <option value="none">بدون فيزياء</option>
            </select>
          </div>
        )}
      </div>

      {/* Bottom: add object / add scene */}
      {ui.activePanel === "objects" && (
        <div style={{ borderTop: "1px solid var(--border-sm)", padding: "8px 10px", display: "flex", gap: 8, flexShrink: 0 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              style={{
                width: "100%", background: "var(--accent-soft)", border: "1px solid var(--accent)",
                borderRadius: 8, color: "var(--accent)", padding: "6px 0", fontSize: 12, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "var(--font-cairo)",
              }}
            >
              <Plus size={13} /> إضافة عنصر
            </button>
            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  style={{
                    position: "absolute", bottom: "100%", right: 0, left: 0, marginBottom: 4,
                    background: "var(--bg-overlay)", border: "1px solid var(--border-md)",
                    borderRadius: 10, overflow: "hidden", zIndex: 100,
                  }}
                >
                  {ADD_TYPES.map((type) => {
                    const cfg = OBJ_CFG[type];
                    return (
                      <button key={type} onClick={() => addObj(type)}
                        style={{
                          width: "100%", background: "transparent", border: "none", color: "var(--text-100)",
                          padding: "7px 12px", fontSize: 12, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-cairo)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-raised)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={store.addScene} title="مشهد جديد"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-sm)", borderRadius: 8, color: "var(--text-200)", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <Layers size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CANVAS
// ════════════════════════════════════════════════════════════
function Canvas() {
  const store = useEditorStore();
  const { ui } = store;
  const scene = store.getActiveScene();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  // Ctrl+Wheel zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        store.setZoom(ui.zoom + (e.deltaY > 0 ? -0.1 : 0.1));
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [ui.zoom]);

  function onObjDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (ui.activeTool === "erase") { store.removeObject(id); return; }
    store.selectObject(id);
    if (ui.activeTool === "select" || ui.activeTool === "move") {
      const obj = scene?.objects.find((o) => o.id === id);
      if (obj) setDrag({ id, sx: e.clientX, sy: e.clientY, ox: obj.x, oy: obj.y });
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / ui.zoom;
    const dy = (e.clientY - drag.sy) / ui.zoom;
    store.updateObject(drag.id, { x: drag.ox + dx, y: drag.oy + dy });
  }

  if (!scene) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <p style={{ color: "var(--text-400)", fontSize: 13 }}>لا يوجد مشهد محدد</p>
    </div>
  );

  return (
    <div
      ref={canvasRef}
      style={{ flex: 1, overflow: "hidden", background: "#0a0a0f", position: "relative", cursor: ui.activeTool === "add" ? "crosshair" : ui.activeTool === "erase" ? "not-allowed" : "default" }}
      onMouseMove={onMouseMove}
      onMouseUp={() => setDrag(null)}
      onClick={() => store.selectObject(null)}
    >
      {/* checker bg */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.25,
        backgroundImage: "linear-gradient(45deg,#1a1a2e 25%,transparent 25%),linear-gradient(-45deg,#1a1a2e 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1a1a2e 75%),linear-gradient(-45deg,transparent 75%,#1a1a2e 75%)",
        backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
      }} />

      {/* Scene viewport */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: `translate(-50%,-50%) translate(${ui.panOffset.x}px,${ui.panOffset.y}px) scale(${ui.zoom})`,
        transformOrigin: "center",
        width: scene.width, height: scene.height,
        boxShadow: "0 0 0 2px rgba(124,58,237,0.4), 0 8px 32px rgba(0,0,0,0.5)",
        overflow: "hidden",
        background: "transparent",
      }}>
        {/* ── Sky gradient ── */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, #0f172a 0%, #1e3a5f 35%, #2d6a8f 60%, #87ceeb 85%, #b8e4f7 100%)",
        }} />

        {/* ── Clouds ── */}
        {[
          { left: "5%",  top: "8%",  scale: 1.2 },
          { left: "30%", top: "5%",  scale: 0.9 },
          { left: "60%", top: "10%", scale: 1.5 },
          { left: "80%", top: "6%",  scale: 1.0 },
        ].map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.left, top: c.top, transform: `scale(${c.scale})`, opacity: 0.7, pointerEvents: "none" }}>
            <div style={{ position: "relative", width: 80, height: 30 }}>
              <div style={{ position: "absolute", width: 60, height: 24, background: "rgba(255,255,255,0.85)", borderRadius: 12, top: 6, left: 10 }} />
              <div style={{ position: "absolute", width: 40, height: 30, background: "rgba(255,255,255,0.85)", borderRadius: "50%", top: 0, left: 20 }} />
              <div style={{ position: "absolute", width: 30, height: 22, background: "rgba(255,255,255,0.8)", borderRadius: "50%", top: 4, left: 8 }} />
              <div style={{ position: "absolute", width: 25, height: 20, background: "rgba(255,255,255,0.8)", borderRadius: "50%", top: 5, left: 48 }} />
            </div>
          </div>
        ))}

        {/* ── Mountains (background) ── */}
        <svg style={{ position: "absolute", bottom: "28%", left: 0, width: "100%", pointerEvents: "none" }} viewBox={`0 0 ${scene.width} 200`} preserveAspectRatio="none">
          <polygon points={`0,200 0,120 80,60 160,100 240,40 320,90 400,30 480,80 560,50 640,90 720,45 800,85 ${scene.width},60 ${scene.width},200`}
            fill="#1a3a5c" opacity="0.6" />
          <polygon points={`0,200 0,140 100,90 200,130 300,70 400,110 500,80 600,120 700,75 800,115 ${scene.width},90 ${scene.width},200`}
            fill="#243f63" opacity="0.7" />
        </svg>

        {/* ── Midground hills ── */}
        <svg style={{ position: "absolute", bottom: "18%", left: 0, width: "100%", pointerEvents: "none" }} viewBox={`0 0 ${scene.width} 160`} preserveAspectRatio="none">
          <path d={`M0,160 Q${scene.width*0.1},80 ${scene.width*0.25},110 Q${scene.width*0.4},50 ${scene.width*0.55},90 Q${scene.width*0.7},30 ${scene.width*0.85},70 Q${scene.width*0.95},50 ${scene.width},60 L${scene.width},160 Z`}
            fill="#2d5a27" />
          <path d={`M0,160 Q${scene.width*0.15},95 ${scene.width*0.3},120 Q${scene.width*0.45},70 ${scene.width*0.6},100 Q${scene.width*0.75},60 ${scene.width*0.9},85 L${scene.width},80 L${scene.width},160 Z`}
            fill="#3a7a32" opacity="0.8" />
        </svg>

        {/* ── Trees (decorative) ── */}
        {[0.08, 0.18, 0.75, 0.88].map((xp, i) => (
          <div key={`tree-${i}`} style={{ position: "absolute", left: `${xp * 100}%`, bottom: "17%", pointerEvents: "none" }}>
            <div style={{ width: 6, height: 30, background: "#5c3d1e", margin: "0 auto" }} />
            <div style={{ width: 0, height: 0, borderLeft: "18px solid transparent", borderRight: "18px solid transparent", borderBottom: "30px solid #2d6b26", position: "absolute", bottom: 28, left: -15 }} />
            <div style={{ width: 0, height: 0, borderLeft: "14px solid transparent", borderRight: "14px solid transparent", borderBottom: "25px solid #3a8530", position: "absolute", bottom: 44, left: -11 }} />
            <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: "20px solid #4aad3f", position: "absolute", bottom: 57, left: -7 }} />
          </div>
        ))}

        {/* ── Ground layers ── */}
        {/* Dirt layer */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "18%",
          background: "linear-gradient(180deg, #5c8a3c 0%, #4a7a2e 20%, #8B5E3C 35%, #6b4423 100%)",
        }} />
        {/* Grass top strip */}
        <div style={{
          position: "absolute", left: 0, right: 0,
          bottom: "17.5%", height: 14,
          background: "linear-gradient(180deg, #6abf4b 0%, #4a9e2e 100%)",
          borderRadius: "2px 2px 0 0",
        }} />
        {/* Grass detail bumps */}
        <svg style={{ position: "absolute", left: 0, right: 0, bottom: "17.5%", width: "100%", height: 20, pointerEvents: "none" }} viewBox={`0 0 ${scene.width} 20`} preserveAspectRatio="none">
          {Array.from({ length: Math.floor(scene.width / 30) }).map((_, i) => (
            <ellipse key={i} cx={i * 30 + 15} cy={14} rx={10} ry={7} fill="#7ad455" opacity="0.6" />
          ))}
        </svg>
        {/* Ground line glow */}
        <div style={{
          position: "absolute", left: 0, right: 0,
          bottom: "17.5%", height: 3,
          background: "rgba(100,255,100,0.3)",
          filter: "blur(2px)",
        }} />

        {/* Grid overlay */}
        {ui.showGrid && (
          <svg style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.08, zIndex: 5 }} width={scene.width} height={scene.height}>
            <defs>
              <pattern id="grid" width={ui.gridSize} height={ui.gridSize} patternUnits="userSpaceOnUse">
                <path d={`M ${ui.gridSize} 0 L 0 0 0 ${ui.gridSize}`} fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        )}

        {/* Objects — زي 10 عليها */}
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
        {scene.objects.map((obj) => {
          const cfg = OBJ_CFG[obj.type as ObjectType] || OBJ_CFG.decoration;
          const sel = ui.selectedObjectId === obj.id;
          const hasSprite = !!(obj as any).spriteKey;
          const ch = hasSprite ? ALL_CHARACTERS.find(c => c.id === (obj as any).spriteKey) : null;
          const isRound = !hasSprite && (obj.type === "player" || obj.type === "enemy" || obj.type === "npc");
          return (
            <div key={obj.id} onMouseDown={(e) => onObjDown(e, obj.id)}
              style={{
                position: "absolute",
                left: obj.x, top: obj.y,
                width: obj.width, height: obj.height,
                background: hasSprite ? "transparent" : colorToCss(obj.color),
                border: sel ? "2px solid #fff" : hasSprite ? "none" : `1px solid ${cfg.color}88`,
                borderRadius: isRound ? "50%" : 4,
                cursor: "move",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: Math.min(obj.width, obj.height) * 0.38,
                userSelect: "none",
                transform: `rotate(${obj.rotation}deg)`,
                visibility: obj.visible ? "visible" : "hidden",
                boxShadow: sel ? `0 0 0 2px #fff, 0 0 16px rgba(124,58,237,0.6)` : "none",
                zIndex: obj.layer + (sel ? 500 : 0),
                overflow: "visible",
                filter: sel ? "drop-shadow(0 0 8px rgba(124,58,237,0.8))" : "none",
              }}
            >
              {ch
                ? <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  dangerouslySetInnerHTML={{ __html: ch.svg }}
                />
                : <span style={{ fontSize: Math.min(obj.width, obj.height) * 0.5 }}>{cfg.icon}</span>
              }
              {/* Selection handles */}
              {sel && ["tl","tr","bl","br"].map((c) => (
                <div key={c} style={{
                  position: "absolute", width: 8, height: 8, background: "#fff",
                  border: "1px solid var(--accent)", borderRadius: 2,
                  ...(c === "tl" ? { top: -4, left: -4 } : c === "tr" ? { top: -4, right: -4 } : c === "bl" ? { bottom: -4, left: -4 } : { bottom: -4, right: -4 }),
                }} />
              ))}
            </div>
          );
        })}
        </div>
      </div>

      {/* Play overlay */}
      <AnimatePresence>
        {ui.isPlaying && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
            <div style={{ background: "var(--bg-raised)", border: "1px solid var(--border-md)", borderRadius: 16, padding: "32px 48px", textAlign: "center" }}>
              <Gamepad2 size={40} style={{ color: "var(--accent)", marginBottom: 12 }} />
              <p style={{ color: "var(--text-100)", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>وضع التشغيل</p>
              <p style={{ color: "var(--text-400)", fontSize: 12, marginBottom: 20 }}>محرك اللعبة قيد التطوير — المرحلة الرابعة!</p>
              <button onClick={() => store.setPlaying(false)}
                style={{ background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-cairo)" }}>
                العودة للـ Editor
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status bar */}
      <div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", gap: 8, pointerEvents: "none" }}>
        {[`${scene.name} · ${scene.objects.length} عنصر`, `${scene.width}×${scene.height}`].map((t) => (
          <span key={t} style={{ background: "rgba(0,0,0,0.6)", borderRadius: 5, padding: "3px 8px", fontSize: 11, color: "var(--text-400)" }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// RIGHT PANEL — Properties Inspector
// ════════════════════════════════════════════════════════════
function PropertiesPanel() {
  const store = useEditorStore();
  const obj = store.getSelectedObject();
  const scene = store.getActiveScene();

  // Scene properties (nothing selected)
  if (!obj) {
    if (!scene) return null;
    return (
      <div style={{ width: 220, background: "var(--bg-raised)", borderRight: "1px solid var(--border-sm)", flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-sm)", fontSize: 12, fontWeight: 700, color: "var(--text-200)" }}>خصائص المشهد</div>
        <div style={{ padding: 12, overflow: "auto", flex: 1 }}>
          <label style={labelSty}>اسم المشهد</label>
          <input value={scene.name} onChange={(e) => store.updateScene(scene.id, { name: e.target.value })} style={inputSty} />
          <label style={{ ...labelSty, marginTop: 12 }}>الجاذبية</label>
          <input type="range" min={0} max={20} step={0.1} value={scene.gravity}
            onChange={(e) => store.updateScene(scene.id, { gravity: +e.target.value })} style={{ width: "100%" }} />
          <span style={{ fontSize: 11, color: "var(--text-400)" }}>{scene.gravity.toFixed(1)}</span>
          <label style={{ ...labelSty, marginTop: 12 }}>لون الخلفية</label>
          <input type="color" value={gameColorToHex(scene.backgroundColor)}
            onChange={(e) => store.updateScene(scene.id, { backgroundColor: hexToGameColor(e.target.value) })}
            style={{ width: "100%", height: 36, borderRadius: 8, border: "none", cursor: "pointer" }} />
        </div>
      </div>
    );
  }

  const cfg = OBJ_CFG[obj.type as ObjectType] || OBJ_CFG.decoration;

  return (
    <div style={{ width: 220, background: "var(--bg-raised)", borderRight: "1px solid var(--border-sm)", flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-sm)", fontSize: 12, fontWeight: 700, color: "var(--text-200)", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 16 }}>{cfg.icon}</span>{cfg.label}
      </div>
      <div style={{ padding: 12, overflow: "auto", flex: 1 }}>
        <label style={labelSty}>الاسم</label>
        <input value={obj.name} onChange={(e) => store.updateObject(obj.id, { name: e.target.value })} style={inputSty} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          {[["X", "x"], ["Y", "y"], ["العرض", "width"], ["الارتفاع", "height"]].map(([lbl, key]) => (
            <div key={key}>
              <label style={labelSty}>{lbl}</label>
              <input type="number" value={Math.round((obj as Record<string, number>)[key])}
                onChange={(e) => store.updateObject(obj.id, { [key]: Math.max(key === "width" || key === "height" ? 4 : -9999, +e.target.value) })}
                style={inputSty} />
            </div>
          ))}
        </div>

        <label style={{ ...labelSty, marginTop: 12 }}>الدوران (°)</label>
        <input type="range" min={0} max={360} step={1} value={obj.rotation}
          onChange={(e) => store.updateObject(obj.id, { rotation: +e.target.value })} style={{ width: "100%" }} />
        <span style={{ fontSize: 11, color: "var(--text-400)" }}>{obj.rotation}°</span>

        <label style={{ ...labelSty, marginTop: 12 }}>اللون</label>
        <input type="color" value={gameColorToHex(obj.color)}
          onChange={(e) => store.updateObject(obj.id, { color: hexToGameColor(e.target.value) })}
          style={{ width: "100%", height: 36, borderRadius: 8, border: "none", cursor: "pointer" }} />

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => store.updateObject(obj.id, { visible: !obj.visible })} style={toggleBtn(obj.visible)}>
            {obj.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            {obj.visible ? "مرئي" : "مخفي"}
          </button>
          <button onClick={() => store.updateObject(obj.id, { locked: !obj.locked })} style={toggleBtn(!obj.locked)}>
            {obj.locked ? <Lock size={12} /> : <Unlock size={12} />}
            {obj.locked ? "مقفل" : "حر"}
          </button>
        </div>

        <label style={{ ...labelSty, marginTop: 12 }}>الطبقة (Layer)</label>
        <input type="number" min={0} max={100} value={obj.layer}
          onChange={(e) => store.updateObject(obj.id, { layer: +e.target.value })} style={inputSty} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// AI CHAT SIDEBAR
// ════════════════════════════════════════════════════════════
function AiChat() {
  const store = useEditorStore();
  const { ui, aiMessages, project } = store;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  async function send() {
    if (!input.trim() || loading || !project) return;
    const msg = { id: `m${Date.now()}`, role: "user" as const, content: input.trim(), timestamp: Date.now() };
    store.addAiMessage(msg);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/editor/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg.content, engineData: project.engineData, history: aiMessages.slice(-6) }),
      });
      const data = await res.json();
      store.addAiMessage({ id: `m${Date.now() + 1}`, role: "assistant", content: data.message || "تم", timestamp: Date.now(), patch: data.patch });
      if (data.patch) store.applyAiPatch(data.patch);
    } catch {
      store.addAiMessage({ id: `merr${Date.now()}`, role: "assistant", content: "حدث خطأ، حاول مرة أخرى.", timestamp: Date.now() });
    } finally { setLoading(false); }
  }

  const suggestions = ["ضيف منصات للقفز عليها", "اعمل قصة مغامرات", "غير خلفية المشهد لأزرق داكن"];

  return (
    <AnimatePresence>
      {ui.aiChatOpen && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
          style={{ background: "var(--bg-raised)", borderRight: "1px solid var(--border-sm)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border-sm)", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-100)", flex: 1 }}>مساعد AI</span>
            <button onClick={store.toggleAiChat} style={{ background: "none", border: "none", color: "var(--text-400)", cursor: "pointer" }}><X size={14} /></button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {aiMessages.length === 0 && (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Sparkles size={28} style={{ color: "var(--accent)", opacity: 0.4, marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: "var(--text-400)", marginBottom: 12 }}>قول لي عايز تعمل إيه</p>
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setInput(s)}
                    style={{ display: "block", width: "100%", marginBottom: 6, background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 8, color: "var(--accent)", padding: "7px 10px", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-cairo)", textAlign: "right" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {aiMessages.map((m) => (
              <div key={m.id} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%",
                background: m.role === "user" ? "var(--accent)" : "var(--bg-overlay)",
                borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                padding: "8px 10px", fontSize: 12, color: m.role === "user" ? "#fff" : "var(--text-100)", lineHeight: 1.5,
              }}>
                {m.content}
                {m.patch && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 4, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 4 }}>✓ تم تطبيق التعديل</div>}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", background: "var(--bg-overlay)", borderRadius: "12px 12px 12px 4px", padding: "8px 12px" }}>
                <Loader2 size={14} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: 10, borderTop: "1px solid var(--border-sm)", display: "flex", gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="اكتب طلبك..." disabled={loading} style={{ ...inputSty, flex: 1 }} />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{ background: "var(--accent)", border: "none", borderRadius: 6, color: "#fff", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: loading || !input.trim() ? 0.5 : 1 }}>
              <Sparkles size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════
// NEW PROJECT MODAL
// ════════════════════════════════════════════════════════════
function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<"platformer" | "topdown" | "puzzle" | "rpg">("platformer");
  const cats = [
    { id: "platformer", label: "منصات",   icon: "🏃", desc: "ماريو ستايل" },
    { id: "topdown",    label: "فوق-تحت", icon: "🗺️", desc: "Zelda ستايل" },
    { id: "puzzle",     label: "ألغاز",   icon: "🧩", desc: "حل المشاكل"  },
    { id: "rpg",        label: "أدوار",   icon: "⚔️", desc: "قصة ومغامرة" },
  ] as const;

  function create() {
    if (!title.trim()) return;
    useEditorStore.getState().createNewProject(title.trim(), cat);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-md)", borderRadius: 16, padding: 32, width: 400, maxWidth: "90vw" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-100)", marginBottom: 20 }}>مشروع جديد</h2>
        <label style={labelSty}>اسم اللعبة</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="اسم لعبتك..." autoFocus
          style={{ ...inputSty, marginBottom: 20, fontSize: 14, padding: "8px 12px" }} />
        <label style={labelSty}>نوع اللعبة</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
          {cats.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              style={{ background: cat === c.id ? "var(--accent-soft)" : "var(--bg-overlay)", border: `1px solid ${cat === c.id ? "var(--accent)" : "var(--border-sm)"}`, borderRadius: 10, padding: "12px 8px", cursor: "pointer", textAlign: "center" as const }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-100)", fontFamily: "var(--font-cairo)" }}>{c.label}</div>
              <div style={{ fontSize: 10, color: "var(--text-400)", fontFamily: "var(--font-cairo)" }}>{c.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "var(--bg-overlay)", border: "1px solid var(--border-sm)", borderRadius: 10, color: "var(--text-200)", padding: "10px 0", cursor: "pointer", fontFamily: "var(--font-cairo)", fontSize: 14 }}>
            إلغاء
          </button>
          <button onClick={create} disabled={!title.trim()}
            style={{ flex: 2, background: title.trim() ? "var(--accent)" : "var(--bg-overlay)", border: "none", borderRadius: 10, color: "#fff", padding: "10px 0", cursor: title.trim() ? "pointer" : "not-allowed", fontFamily: "var(--font-cairo)", fontSize: 14, fontWeight: 700, opacity: title.trim() ? 1 : 0.5 }}>
            إنشاء المشروع
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useEditorStore();
  const { project, isLoaded } = store;
  const [showNew, setShowNew] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [authStatus, setAuthStatus] = useState<"loading" | "ok" | "unauth">("loading");
  const projectId = searchParams.get("id");

  // Check auth via custom session
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setAuthStatus(d.user ? "ok" : "unauth"))
      .catch(() => setAuthStatus("unauth"));
  }, []);

  useEffect(() => {
    if (authStatus === "unauth") router.push("/auth/login");
  }, [authStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = useEditorStore.getState();
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) { e.preventDefault(); s.undo(); }
        if (e.key === "z" &&  e.shiftKey) { e.preventDefault(); s.redo(); }
        if (e.key === "y")                { e.preventDefault(); s.redo(); }
        if (e.key === "s")                { e.preventDefault(); s.saveProject(); }
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "v") s.setTool("select");
      if (e.key === "g") s.setTool("move");
      if (e.key === "a") s.setTool("add");
      if (e.key === "d") s.setTool("erase");
      if ((e.key === "Delete" || e.key === "Backspace") && s.ui.selectedObjectId) s.removeObject(s.ui.selectedObjectId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Load from URL ?id=
  useEffect(() => {
    if (!projectId || isLoaded) return;
    setLoadingProject(true);
    fetch(`/api/editor/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); store.loadProject(d); })
      .catch((e) => setLoadErr(e.message))
      .finally(() => setLoadingProject(false));
  }, [projectId, isLoaded]);

  useEffect(() => {
    if (authStatus === "unauth") router.push("/auth/login");
  }, [authStatus]);
  if (authStatus === "unauth") return null;

  if (authStatus === "loading" || loadingProject) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <Loader2 size={32} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (loadErr) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", gap: 12 }}>
        <AlertCircle size={32} style={{ color: "#dc2626" }} />
        <p style={{ color: "var(--text-100)" }}>{loadErr}</p>
        <button onClick={() => router.push("/editor")}
          style={{ background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", padding: "8px 20px", cursor: "pointer", fontFamily: "var(--font-cairo)" }}>
          العودة
        </button>
      </div>
    );
  }

  // Welcome screen
  if (!isLoaded || !project) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
          <Gamepad2 size={52} style={{ color: "var(--accent)", marginBottom: 16 }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-100)", marginBottom: 8, fontFamily: "var(--font-cairo)" }}>يالا Editor</h1>
          <p style={{ color: "var(--text-400)", fontSize: 14, marginBottom: 32, fontFamily: "var(--font-cairo)" }}>اصنع لعبتك من الصفر</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => setShowNew(true)}
              style={{ background: "var(--accent)", border: "none", borderRadius: 12, color: "#fff", padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-cairo)" }}>
              <Plus size={18} /> مشروع جديد
            </button>
            <button onClick={() => router.push("/world")}
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border-md)", borderRadius: 12, color: "var(--text-200)", padding: "14px 32px", fontSize: 15, cursor: "pointer", fontFamily: "var(--font-cairo)" }}>
              استعراض الألعاب
            </button>
          </div>
        </motion.div>
        {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
      </div>
    );
  }

  // ── Main Editor ──────────────────────────────────────────
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg-base)", overflow: "hidden", fontFamily: "var(--font-cairo)" }}>
      <Toolbar />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <LeftSidebar />
        <Canvas3D />
        <PropertiesPanel />
        <AiChat />
      </div>
    </div>
  );
}
