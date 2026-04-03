"use client";
// ═══════════════════════════════════════════════════════════════
//  YALA EDITOR v2 — Unity-inspired Game Editor
//  Hierarchy | 3D Canvas | Inspector (Components) | Visual Scripting
// ═══════════════════════════════════════════════════════════════
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Settings, Play, Square, Save, Undo2, Redo2, Pause,
  Plus, Trash2, Copy, Eye, EyeOff, Lock, Unlock, ChevronRight,
  ChevronDown, MousePointer2, Move, Zap, BookOpen, X, Loader2,
  AlertCircle, Gamepad2, LayoutDashboard, Sparkles, Grid3X3,
  ZoomIn, ZoomOut, Box, Circle, Triangle, Code2, Cpu,
  Volume2, RefreshCw, Terminal, Package, Layers3, SlidersHorizontal,
  MoreVertical, Search, Filter, Star, Link2, Unlink2, Activity,
  Maximize2, Minimize2, FlipHorizontal, RotateCcw, Crosshair,
  GitBranch, Workflow, Variable, Repeat, Clock, Radio,
} from "lucide-react";
import dynamic from "next/dynamic";
import { ALL_CHARACTERS, CHARACTER_CATEGORIES, getCharactersByCategory } from "@/data/characters";
import { ASSET_LIBRARY, ASSET_CATEGORIES, getAssetsByCategory } from "@/data/assets3d";
import { useEditorStore, createGameObject } from "@/store/editorStore";
import type {
  EditorTool, EditorPanel, GameObject, GameComponent,
  ComponentType, VSGraph, VSNode, VSConnection, VSNodeType,
  PlayerControllerComponent, EnemyAIComponent, HealthSystemComponent,
  Rigidbody2DComponent, BoxCollider2DComponent, SpriteRendererComponent,
  TransformComponent, AudioSourceComponent, ParticleSystemComponent,
  PlatformMovementComponent, ScriptComponent, AnimatorComponent,
} from "@/types/editor";
import {
  makeTransform, makeRigidbody, makeBoxCollider, makePlayerController,
  makeEnemyAI, makeHealthSystem, makeSpriteRenderer,
} from "@/types/editor";

const Canvas3D = dynamic(() => import("@/components/editor/Canvas3D"), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#05070f" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Loader2 size={28} style={{ color: "#7c3aed", animation: "spin 1s linear infinite" }} />
        <span style={{ color: "#7c3aed", fontSize: 13, fontFamily: "var(--font-cairo)" }}>⏳ جاري تحميل العالم 3D...</span>
      </div>
    </div>
  ),
});

// ════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ════════════════════════════════════════════════════════════
const T = {
  bgBase:    "#07090f",
  bgPanel:   "#0d1117",
  bgCard:    "#111827",
  bgHover:   "#1a2235",
  bgActive:  "#1e2d4a",
  border:    "#1e2535",
  borderMd:  "#243048",
  accent:    "#7c3aed",
  accentSoft:"rgba(124,58,237,0.12)",
  accentGlow:"rgba(124,58,237,0.4)",
  text100:   "#f0f4ff",
  text200:   "#c8d2e8",
  text400:   "#6b7a9a",
  text600:   "#3a4460",
  green:     "#22c55e",
  red:       "#ef4444",
  yellow:    "#f59e0b",
  blue:      "#3b82f6",
  teal:      "#14b8a6",
};

// ── Shared Styles ─────────────────────────────────────────────
const inputSty: React.CSSProperties = {
  width: "100%", background: "#0a0f1e", border: `1px solid ${T.border}`,
  borderRadius: 5, color: T.text100, padding: "4px 8px", fontSize: 11,
  outline: "none", boxSizing: "border-box", fontFamily: "var(--font-cairo)",
  transition: "border-color .15s",
};
const labelSty: React.CSSProperties = {
  display: "block", fontSize: 10, color: T.text400, marginBottom: 3, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const,
};
function iBtn(active = false, color = T.accent): React.CSSProperties {
  return {
    background: active ? `rgba(124,58,237,0.15)` : "transparent",
    border: `1px solid ${active ? T.accent : "transparent"}`,
    borderRadius: 5, color: active ? color : T.text400,
    width: 26, height: 26, display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer", flexShrink: 0,
    transition: "all .1s",
  };
}

// ════════════════════════════════════════════════════════════
//  COMPONENT CATALOG (للـ Inspector)
// ════════════════════════════════════════════════════════════
const COMP_CATALOG: { type: ComponentType; icon: React.ReactNode; label: string; color: string; factory: () => GameComponent }[] = [
  { type: "Transform",         icon: <Crosshair size={12}/>,      label: "Transform",          color: "#f59e0b", factory: makeTransform },
  { type: "SpriteRenderer",    icon: <Box size={12}/>,             label: "Sprite Renderer",    color: "#3b82f6", factory: () => makeSpriteRenderer() },
  { type: "Rigidbody2D",       icon: <Activity size={12}/>,        label: "Rigidbody 2D",       color: "#ef4444", factory: makeRigidbody },
  { type: "BoxCollider2D",     icon: <Square size={12}/>,          label: "Box Collider 2D",    color: "#22c55e", factory: () => makeBoxCollider() },
  { type: "CircleCollider2D",  icon: <Circle size={12}/>,          label: "Circle Collider 2D", color: "#22c55e", factory: () => ({ type: "CircleCollider2D" as const, enabled: true, isTrigger: false, offset: {x:0,y:0}, radius: 0.5, material: { friction: 0.4, bounciness: 0 } }) },
  { type: "PlayerController",  icon: <Gamepad2 size={12}/>,        label: "Player Controller",  color: "#7c3aed", factory: makePlayerController },
  { type: "EnemyAI",           icon: <Cpu size={12}/>,             label: "Enemy AI",           color: "#ef4444", factory: makeEnemyAI },
  { type: "HealthSystem",      icon: <Activity size={12}/>,        label: "Health System",      color: "#ef4444", factory: () => makeHealthSystem(100) },
  { type: "Animator",          icon: <RefreshCw size={12}/>,       label: "Animator",           color: "#14b8a6", factory: () => ({ type: "Animator" as const, enabled: true, currentState: "idle", clips: [], parameters: {}, transitions: [] }) },
  { type: "AudioSource",       icon: <Volume2 size={12}/>,         label: "Audio Source",       color: "#f59e0b", factory: () => ({ type: "AudioSource" as const, enabled: true, clip: "", volume: 1, pitch: 1, loop: false, playOnAwake: false, spatialBlend: 0 }) },
  { type: "Script",            icon: <Code2 size={12}/>,           label: "Script",             color: "#7c3aed", factory: () => ({ type: "Script" as const, enabled: true, scriptName: "NewScript", code: "// كتب الكود هنا\nfunction OnStart() {}\nfunction OnUpdate() {}", variables: {} }) },
  { type: "ParticleSystem",    icon: <Star size={12}/>,            label: "Particle System",    color: "#f59e0b", factory: () => ({ type: "ParticleSystem" as const, enabled: true, duration: 5, loop: true, startLifetime: 1, startSpeed: 3, startSize: 0.1, startColor: {r:255,g:200,b:50,a:1}, emissionRate: 20, maxParticles: 200, shape: "cone" as const, gravity: 0 }) },
  { type: "PlatformMovement",  icon: <Move size={12}/>,            label: "Platform Movement",  color: "#14b8a6", factory: () => ({ type: "PlatformMovement" as const, enabled: true, movementType: "horizontal" as const, speed: 2, distance: 3, waitTime: 1 }) },
  { type: "Light",             icon: <Star size={12}/>,            label: "Light",              color: "#fcd34d", factory: () => ({ type: "Light" as const, enabled: true, lightType: "point" as const, color: {r:255,g:240,b:200,a:1}, intensity: 1, range: 5, castShadows: false }) },
];

// ════════════════════════════════════════════════════════════
//  VISUAL SCRIPTING NODE CATALOG
// ════════════════════════════════════════════════════════════
const VS_CATALOG: { type: VSNodeType; category: string; label: string; icon: React.ReactNode; color: string; defaultInputs: Array<{id:string;name:string;type:string}>; defaultOutputs: Array<{id:string;name:string;type:string}> }[] = [
  // Events
  { type: "OnGameStart",       category: "event",     label: "عند البداية",         icon: <Play size={10}/>,       color: "#22c55e", defaultInputs: [], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "OnUpdate",          category: "event",     label: "كل Frame",            icon: <RefreshCw size={10}/>,  color: "#22c55e", defaultInputs: [], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "OnCollisionEnter",  category: "event",     label: "عند التصادم",         icon: <Radio size={10}/>,      color: "#22c55e", defaultInputs: [], defaultOutputs: [{id:"out",name:"",type:"exec"},{id:"other",name:"الكائن",type:"object"}] },
  { type: "OnTriggerEnter",    category: "event",     label: "عند الدخول",          icon: <Zap size={10}/>,        color: "#22c55e", defaultInputs: [], defaultOutputs: [{id:"out",name:"",type:"exec"},{id:"other",name:"الكائن",type:"object"}] },
  { type: "OnKeyDown",         category: "event",     label: "عند ضغط مفتاح",      icon: <Variable size={10}/>,   color: "#22c55e", defaultInputs: [], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "OnHealthZero",      category: "event",     label: "عند موت",             icon: <Activity size={10}/>,   color: "#ef4444", defaultInputs: [], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  // Conditions
  { type: "If",                category: "condition", label: "إذا",                 icon: <GitBranch size={10}/>,  color: "#f59e0b", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"cond",name:"شرط",type:"bool"}], defaultOutputs: [{id:"true",name:"صح",type:"exec"},{id:"false",name:"غلط",type:"exec"}] },
  { type: "Compare",           category: "condition", label: "مقارنة",              icon: <SlidersHorizontal size={10}/>, color: "#f59e0b", defaultInputs: [{id:"a",name:"A",type:"float"},{id:"b",name:"B",type:"float"}], defaultOutputs: [{id:"result",name:"نتيجة",type:"bool"}] },
  // Actions
  { type: "MoveObject",        category: "action",    label: "تحريك كائن",          icon: <Move size={10}/>,       color: "#3b82f6", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"target",name:"الهدف",type:"object"},{id:"dir",name:"الاتجاه",type:"vector2"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "DestroyObject",     category: "action",    label: "حذف كائن",            icon: <Trash2 size={10}/>,     color: "#ef4444", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"target",name:"الهدف",type:"object"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "SpawnObject",       category: "action",    label: "إنشاء كائن",          icon: <Plus size={10}/>,       color: "#3b82f6", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"pos",name:"الموقع",type:"vector2"}], defaultOutputs: [{id:"out",name:"",type:"exec"},{id:"spawned",name:"الكائن",type:"object"}] },
  { type: "PlaySound",         category: "action",    label: "تشغيل صوت",           icon: <Volume2 size={10}/>,    color: "#3b82f6", defaultInputs: [{id:"in",name:"",type:"exec"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "AddScore",          category: "action",    label: "إضافة نقاط",          icon: <Star size={10}/>,       color: "#f59e0b", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"val",name:"القيمة",type:"float"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "ShowMessage",       category: "action",    label: "إظهار رسالة",         icon: <BookOpen size={10}/>,   color: "#7c3aed", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"msg",name:"الرسالة",type:"string"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "LoadScene",         category: "action",    label: "تغيير مشهد",          icon: <Layers size={10}/>,     color: "#7c3aed", defaultInputs: [{id:"in",name:"",type:"exec"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "EndGame",           category: "action",    label: "إنهاء اللعبة",        icon: <Square size={10}/>,     color: "#ef4444", defaultInputs: [{id:"in",name:"",type:"exec"}], defaultOutputs: [] },
  { type: "ApplyForce",        category: "action",    label: "تطبيق قوة",           icon: <Activity size={10}/>,   color: "#3b82f6", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"force",name:"القوة",type:"vector2"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "ShakeCamera",       category: "action",    label: "هز الكاميرا",         icon: <Maximize2 size={10}/>,  color: "#7c3aed", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"intensity",name:"الشدة",type:"float"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "SetAnimation",      category: "action",    label: "تغيير أنيميشن",       icon: <RefreshCw size={10}/>,  color: "#14b8a6", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"state",name:"الحالة",type:"string"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  // Flow
  { type: "Wait",              category: "flow",      label: "انتظر",               icon: <Clock size={10}/>,      color: "#6366f1", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"time",name:"الوقت (ث)",type:"float"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "Repeat",            category: "flow",      label: "كرر",                 icon: <Repeat size={10}/>,     color: "#6366f1", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"count",name:"عدد المرات",type:"float"}], defaultOutputs: [{id:"body",name:"نفذ",type:"exec"},{id:"done",name:"انتهى",type:"exec"}] },
  // Variables
  { type: "GetVariable",       category: "variable",  label: "احصل على متغير",      icon: <Variable size={10}/>,   color: "#14b8a6", defaultInputs: [], defaultOutputs: [{id:"val",name:"القيمة",type:"float"}] },
  { type: "SetVariable",       category: "variable",  label: "عيّن متغير",           icon: <Variable size={10}/>,   color: "#14b8a6", defaultInputs: [{id:"in",name:"",type:"exec"},{id:"val",name:"القيمة",type:"float"}], defaultOutputs: [{id:"out",name:"",type:"exec"}] },
  { type: "MathOp",            category: "variable",  label: "عملية حسابية",        icon: <Code2 size={10}/>,      color: "#14b8a6", defaultInputs: [{id:"a",name:"A",type:"float"},{id:"b",name:"B",type:"float"}], defaultOutputs: [{id:"res",name:"النتيجة",type:"float"}] },
];

const VS_CATEGORY_COLORS: Record<string, string> = {
  event: "#22c55e", condition: "#f59e0b", action: "#3b82f6",
  flow: "#6366f1", variable: "#14b8a6", ai: "#ef4444",
};
const VS_PORT_COLORS: Record<string, string> = {
  exec: "#ffffff", bool: "#f59e0b", float: "#3b82f6",
  string: "#22c55e", object: "#7c3aed", vector2: "#14b8a6",
};

// ════════════════════════════════════════════════════════════
//  COMPONENT INSPECTOR FIELDS
// ════════════════════════════════════════════════════════════

function CompField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={labelSty}>{label}</label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, step = 1, min, max }: { value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <input
      type="number" value={isNaN(value) ? 0 : +value.toFixed(3)}
      onChange={e => onChange(+e.target.value)}
      step={step} min={min} max={max}
      style={{ ...inputSty }}
    />
  );
}

function Vec2Field({ label, value, onChange }: { label: string; value: { x: number; y: number }; onChange: (v: { x: number; y: number }) => void }) {
  return (
    <CompField label={label}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: "#ef4444", fontWeight: 700 }}>X</span>
          <input type="number" value={+value.x.toFixed(3)} onChange={e => onChange({ ...value, x: +e.target.value })} style={{ ...inputSty, paddingLeft: 18 }} />
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: "#22c55e", fontWeight: 700 }}>Y</span>
          <input type="number" value={+value.y.toFixed(3)} onChange={e => onChange({ ...value, y: +e.target.value })} style={{ ...inputSty, paddingLeft: 18 }} />
        </div>
      </div>
    </CompField>
  );
}

function Vec3Field({ label, value, onChange }: { label: string; value: { x: number; y: number; z: number }; onChange: (v: { x: number; y: number; z: number }) => void }) {
  return (
    <CompField label={label}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
        {(["x","y","z"] as const).map((k, i) => (
          <div key={k} style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 5, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 700, color: ["#ef4444","#22c55e","#3b82f6"][i] }}>{k.toUpperCase()}</span>
            <input type="number" value={+value[k].toFixed(3)} onChange={e => onChange({ ...value, [k]: +e.target.value })} style={{ ...inputSty, paddingLeft: 16 }} />
          </div>
        ))}
      </div>
    </CompField>
  );
}

function BoolToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: T.text200 }}>{label}</span>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 32, height: 16, borderRadius: 8, cursor: "pointer",
          background: value ? T.accent : T.text600,
          position: "relative", transition: "background .15s", flexShrink: 0,
        }}
      >
        <div style={{ position: "absolute", width: 12, height: 12, borderRadius: "50%", background: "#fff", top: 2, left: value ? 18 : 2, transition: "left .15s" }} />
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: {v:string;l:string}[]; onChange: (v: string) => void }) {
  return (
    <CompField label={label}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputSty }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </CompField>
  );
}

// ── Per-component editors ──────────────────────────────────
function TransformEditor({ comp, onChange }: { comp: TransformComponent; onChange: (p: Partial<TransformComponent>) => void }) {
  return (
    <>
      <Vec3Field label="الموقع" value={comp.position} onChange={position => onChange({ position })} />
      <Vec3Field label="الدوران" value={comp.rotation} onChange={rotation => onChange({ rotation })} />
      <Vec3Field label="الحجم"   value={comp.scale}    onChange={scale => onChange({ scale })} />
    </>
  );
}

function SpriteRendererEditor({ comp, onChange }: { comp: SpriteRendererComponent; onChange: (p: Partial<SpriteRendererComponent>) => void }) {
  return (
    <>
      <CompField label="Sprite Key">
        <input value={comp.spriteKey} onChange={e => onChange({ spriteKey: e.target.value })} style={inputSty} placeholder="hero_warrior, platform..." />
      </CompField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <BoolToggle label="Flip X" value={comp.flipX} onChange={v => onChange({ flipX: v })} />
        <BoolToggle label="Flip Y" value={comp.flipY} onChange={v => onChange({ flipY: v })} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <CompField label="Sorting Layer"><NumInput value={comp.sortingLayer} onChange={v => onChange({ sortingLayer: v })} step={1} /></CompField>
        <CompField label="Order In Layer"><NumInput value={comp.orderInLayer} onChange={v => onChange({ orderInLayer: v })} step={1} /></CompField>
      </div>
    </>
  );
}

function Rigidbody2DEditor({ comp, onChange }: { comp: Rigidbody2DComponent; onChange: (p: Partial<Rigidbody2DComponent>) => void }) {
  return (
    <>
      <SelectField label="Body Type" value={comp.bodyType} options={[{v:"Dynamic",l:"Dynamic"},{v:"Kinematic",l:"Kinematic"},{v:"Static",l:"Static"}]} onChange={v => onChange({ bodyType: v as typeof comp.bodyType })} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <CompField label="Mass"><NumInput value={comp.mass} onChange={v => onChange({ mass: v })} step={0.1} min={0.01} /></CompField>
        <CompField label="Gravity Scale"><NumInput value={comp.gravityScale} onChange={v => onChange({ gravityScale: v })} step={0.1} /></CompField>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <CompField label="Drag"><NumInput value={comp.drag} onChange={v => onChange({ drag: v })} step={0.01} min={0} /></CompField>
        <CompField label="Angular Drag"><NumInput value={comp.angularDrag} onChange={v => onChange({ angularDrag: v })} step={0.01} min={0} /></CompField>
      </div>
      <BoolToggle label="Freeze Rotation" value={comp.freezeRotation} onChange={v => onChange({ freezeRotation: v })} />
    </>
  );
}

function BoxCollider2DEditor({ comp, onChange }: { comp: BoxCollider2DComponent; onChange: (p: Partial<BoxCollider2DComponent>) => void }) {
  return (
    <>
      <BoolToggle label="Is Trigger" value={comp.isTrigger} onChange={v => onChange({ isTrigger: v })} />
      <Vec2Field label="Offset" value={comp.offset} onChange={offset => onChange({ offset })} />
      <Vec2Field label="Size" value={comp.size} onChange={size => onChange({ size })} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <CompField label="Friction"><NumInput value={comp.material.friction} onChange={v => onChange({ material: { ...comp.material, friction: v } })} step={0.1} min={0} max={1} /></CompField>
        <CompField label="Bounciness"><NumInput value={comp.material.bounciness} onChange={v => onChange({ material: { ...comp.material, bounciness: v } })} step={0.1} min={0} max={1} /></CompField>
      </div>
    </>
  );
}

function PlayerControllerEditor({ comp, onChange }: { comp: PlayerControllerComponent; onChange: (p: Partial<PlayerControllerComponent>) => void }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <CompField label="Move Speed"><NumInput value={comp.moveSpeed} onChange={v => onChange({ moveSpeed: v })} step={0.5} min={0} /></CompField>
        <CompField label="Jump Force"><NumInput value={comp.jumpForce} onChange={v => onChange({ jumpForce: v })} step={1} min={0} /></CompField>
        <CompField label="Max Jumps"><NumInput value={comp.maxJumps} onChange={v => onChange({ maxJumps: v })} step={1} min={1} max={5} /></CompField>
        <CompField label="Dash Speed"><NumInput value={comp.dashSpeed} onChange={v => onChange({ dashSpeed: v })} step={1} min={0} /></CompField>
      </div>
      <BoolToggle label="Can Dash" value={comp.canDash} onChange={v => onChange({ canDash: v })} />
      <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 8 }}>
        <span style={{ ...labelSty, marginBottom: 6 }}>Input Map</span>
        {(["left","right","jump","dash","attack"] as const).map(k => (
          <div key={k} style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 6, marginBottom: 4, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: T.text400 }}>{k}</span>
            <input value={comp.inputMap[k]} onChange={e => onChange({ inputMap: { ...comp.inputMap, [k]: e.target.value } })} style={{ ...inputSty }} />
          </div>
        ))}
      </div>
    </>
  );
}

function EnemyAIEditor({ comp, onChange }: { comp: EnemyAIComponent; onChange: (p: Partial<EnemyAIComponent>) => void }) {
  return (
    <>
      <SelectField label="AI Pattern" value={comp.aiPattern} options={[{v:"patrol",l:"دورية"},{v:"chase",l:"مطاردة"},{v:"guard",l:"حراسة"},{v:"wander",l:"تجوال"},{v:"sniper",l:"قناص"}]} onChange={v => onChange({ aiPattern: v as typeof comp.aiPattern })} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <CompField label="Detection Radius"><NumInput value={comp.detectionRadius} onChange={v => onChange({ detectionRadius: v })} step={0.5} min={0} /></CompField>
        <CompField label="Attack Radius"><NumInput value={comp.attackRadius} onChange={v => onChange({ attackRadius: v })} step={0.5} min={0} /></CompField>
        <CompField label="Move Speed"><NumInput value={comp.moveSpeed} onChange={v => onChange({ moveSpeed: v })} step={0.5} min={0} /></CompField>
        <CompField label="Damage"><NumInput value={comp.attackDamage} onChange={v => onChange({ attackDamage: v })} step={5} min={0} /></CompField>
        <CompField label="Attack Cooldown"><NumInput value={comp.attackCooldown} onChange={v => onChange({ attackCooldown: v })} step={0.5} min={0} /></CompField>
      </div>
      <CompField label="Chase Target Tag">
        <input value={comp.chaseTarget} onChange={e => onChange({ chaseTarget: e.target.value })} style={inputSty} placeholder="Player" />
      </CompField>
    </>
  );
}

function HealthSystemEditor({ comp, onChange }: { comp: HealthSystemComponent; onChange: (p: Partial<HealthSystemComponent>) => void }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <CompField label="Max Health"><NumInput value={comp.maxHealth} onChange={v => onChange({ maxHealth: v })} step={10} min={1} /></CompField>
        <CompField label="Current Health"><NumInput value={comp.currentHealth} onChange={v => onChange({ currentHealth: v })} step={1} min={0} max={comp.maxHealth} /></CompField>
      </div>
      <div style={{ background: T.bgBase, borderRadius: 4, height: 8, marginBottom: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(comp.currentHealth / comp.maxHealth) * 100}%`, background: comp.currentHealth > comp.maxHealth * 0.5 ? T.green : comp.currentHealth > comp.maxHealth * 0.25 ? T.yellow : T.red, transition: "width .3s" }} />
      </div>
      <SelectField label="On Death" value={comp.deathAction} options={[{v:"destroy",l:"حذف"},{v:"respawn",l:"إعادة إحياء"},{v:"gameOver",l:"Game Over"},{v:"none",l:"لا شيء"}]} onChange={v => onChange({ deathAction: v as typeof comp.deathAction })} />
      <CompField label="Invincible Duration"><NumInput value={comp.invincibleDuration} onChange={v => onChange({ invincibleDuration: v })} step={0.1} min={0} /></CompField>
    </>
  );
}

function ScriptEditor({ comp, onChange }: { comp: ScriptComponent; onChange: (p: Partial<ScriptComponent>) => void }) {
  return (
    <>
      <CompField label="Script Name">
        <input value={comp.scriptName} onChange={e => onChange({ scriptName: e.target.value })} style={inputSty} />
      </CompField>
      <CompField label="Code">
        <textarea
          value={comp.code}
          onChange={e => onChange({ code: e.target.value })}
          rows={8}
          style={{ ...inputSty, resize: "vertical", height: "auto", fontFamily: "monospace", fontSize: 11, lineHeight: 1.5 }}
        />
      </CompField>
    </>
  );
}

function GenericComponentEditor({ comp }: { comp: GameComponent }) {
  const entries = Object.entries(comp).filter(([k]) => k !== "type" && k !== "enabled");
  if (entries.length === 0) return <p style={{ fontSize: 11, color: T.text400 }}>لا توجد خصائص</p>;
  return (
    <div style={{ fontSize: 11, color: T.text400 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 4 }}>
          <span style={{ color: T.text400 }}>{k}</span>
          <span style={{ color: T.text200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  COMPONENT CARD (Inspector)
// ════════════════════════════════════════════════════════════
function ComponentCard({ comp, objectId, onRemove }: { comp: GameComponent; objectId: string; onRemove: () => void }) {
  const store = useEditorStore();
  const [collapsed, setCollapsed] = useState(false);
  const catalog = COMP_CATALOG.find(c => c.type === comp.type);
  const canRemove = comp.type !== "Transform";

  function handleChange(patch: Partial<GameComponent>) {
    store.updateComponent(objectId, comp.type, patch);
  }

  function renderEditor() {
    switch (comp.type) {
      case "Transform":        return <TransformEditor comp={comp as TransformComponent} onChange={handleChange} />;
      case "SpriteRenderer":   return <SpriteRendererEditor comp={comp as SpriteRendererComponent} onChange={handleChange} />;
      case "Rigidbody2D":      return <Rigidbody2DEditor comp={comp as Rigidbody2DComponent} onChange={handleChange} />;
      case "BoxCollider2D":    return <BoxCollider2DEditor comp={comp as BoxCollider2DComponent} onChange={handleChange} />;
      case "PlayerController": return <PlayerControllerEditor comp={comp as PlayerControllerComponent} onChange={handleChange} />;
      case "EnemyAI":          return <EnemyAIEditor comp={comp as EnemyAIComponent} onChange={handleChange} />;
      case "HealthSystem":     return <HealthSystemEditor comp={comp as HealthSystemComponent} onChange={handleChange} />;
      case "Script":           return <ScriptEditor comp={comp as ScriptComponent} onChange={handleChange} />;
      default:                 return <GenericComponentEditor comp={comp} />;
    }
  }

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 4, overflow: "hidden", background: T.bgCard }}>
      {/* Header */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", cursor: "pointer", borderBottom: collapsed ? "none" : `1px solid ${T.border}`, background: T.bgCard }}
        onClick={() => setCollapsed(v => !v)}
      >
        <div style={{ color: catalog?.color || T.accent, flexShrink: 0 }}>{catalog?.icon || <Box size={12} />}</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.text200, flex: 1 }}>{catalog?.label || comp.type}</span>
        <BoolToggle label="" value={comp.enabled ?? true} onChange={v => handleChange({ enabled: v } as Partial<GameComponent>)} />
        {canRemove && (
          <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ background: "none", border: "none", color: T.text600, cursor: "pointer", padding: 2, display: "flex" }}>
            <X size={11} />
          </button>
        )}
        <div style={{ color: T.text400 }}>{collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}</div>
      </div>
      {/* Body */}
      {!collapsed && (
        <div style={{ padding: "8px 10px" }}>
          {renderEditor()}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  INSPECTOR PANEL (Right Side)
// ════════════════════════════════════════════════════════════
function InspectorPanel() {
  const store = useEditorStore();
  const obj = store.getSelectedObject();
  const scene = store.getActiveScene();
  const [showAddComp, setShowAddComp] = useState(false);
  const [compSearch, setCompSearch] = useState("");

  if (!obj && !scene) return (
    <div style={{ width: 260, background: T.bgPanel, borderLeft: `1px solid ${T.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 11, color: T.text600 }}>لا يوجد تحديد</span>
    </div>
  );

  // Scene inspector
  if (!obj && scene) return (
    <div style={{ width: 260, background: T.bgPanel, borderLeft: `1px solid ${T.border}`, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.text200, display: "flex", alignItems: "center", gap: 6 }}>
        <Layers3 size={13} style={{ color: T.accent }} /> خصائص المشهد
      </div>
      <div style={{ padding: 10, overflow: "auto", flex: 1 }}>
        <CompField label="اسم المشهد">
          <input value={scene.name} onChange={e => store.updateScene(scene.id, { name: e.target.value })} style={inputSty} />
        </CompField>
        <CompField label="الجاذبية">
          <NumInput value={scene.gravity} onChange={v => store.updateScene(scene.id, { gravity: v })} step={0.1} min={0} />
        </CompField>
        <CompField label="الأبعاد">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            <NumInput value={scene.width} onChange={v => store.updateScene(scene.id, { width: v })} step={32} />
            <NumInput value={scene.height} onChange={v => store.updateScene(scene.id, { height: v })} step={32} />
          </div>
        </CompField>
        <CompField label="لون الخلفية">
          <input type="color"
            value={`#${[scene.backgroundColor.r, scene.backgroundColor.g, scene.backgroundColor.b].map(v => v.toString(16).padStart(2,"0")).join("")}`}
            onChange={e => { const hex = e.target.value; store.updateScene(scene.id, { backgroundColor: { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16), a: 1 } }); }}
            style={{ width: "100%", height: 30, borderRadius: 5, border: "none", cursor: "pointer" }}
          />
        </CompField>
        <CompField label="اللون البيئي">
          <NumInput value={scene.ambientIntensity ?? 0.6} onChange={v => store.updateScene(scene.id, { ambientIntensity: v })} step={0.05} min={0} max={2} />
        </CompField>
      </div>
    </div>
  );

  // GameObject inspector
  const filteredCatalog = COMP_CATALOG.filter(c =>
    c.label.toLowerCase().includes(compSearch.toLowerCase()) &&
    !obj!.components?.some(ex => ex.type === c.type)
  );

  return (
    <div style={{ width: 260, background: T.bgPanel, borderLeft: `1px solid ${T.border}`, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Object Header */}
      <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, background: T.bgCard }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <BoolToggle label="" value={obj!.active} onChange={v => store.updateObject(obj!.id, { active: v })} />
          <input
            value={obj!.name}
            onChange={e => store.updateObject(obj!.id, { name: e.target.value })}
            style={{ ...inputSty, fontWeight: 700, fontSize: 12, flex: 1 }}
          />
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <button style={iBtn(obj!.isStatic)} title="Static" onClick={() => store.updateObject(obj!.id, { isStatic: !obj!.isStatic })}>
              <Lock size={10} />
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          <CompField label="Tag">
            <input value={obj!.tag} onChange={e => store.updateObject(obj!.id, { tag: e.target.value })} style={inputSty} />
          </CompField>
          <CompField label="Layer">
            <NumInput value={obj!.layer} onChange={v => store.updateObject(obj!.id, { layer: v })} step={1} min={0} />
          </CompField>
        </div>
      </div>

      {/* Components */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 8px 0" }}>
        {(obj!.components || []).map((comp, i) => (
          <ComponentCard
            key={`${comp.type}_${i}`}
            comp={comp}
            objectId={obj!.id}
            onRemove={() => store.removeComponent(obj!.id, comp.type)}
          />
        ))}

        {/* Add Component Button */}
        <div style={{ position: "relative", margin: "8px 0 80px" }}>
          <button
            onClick={() => setShowAddComp(v => !v)}
            style={{
              width: "100%", background: T.bgCard, border: `1px dashed ${T.borderMd}`,
              borderRadius: 6, color: T.text400, padding: "6px 0", fontSize: 11,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              fontFamily: "var(--font-cairo)",
            }}
          >
            <Plus size={12} /> إضافة Component
          </button>

          <AnimatePresence>
            {showAddComp && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                style={{
                  position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4,
                  background: T.bgCard, border: `1px solid ${T.borderMd}`, borderRadius: 8,
                  zIndex: 100, maxHeight: 280, overflow: "hidden", display: "flex", flexDirection: "column",
                }}
              >
                <div style={{ padding: "6px 8px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ position: "relative" }}>
                    <Search size={10} style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", color: T.text600 }} />
                    <input value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="بحث..." style={{ ...inputSty, paddingLeft: 22 }} autoFocus />
                  </div>
                </div>
                <div style={{ overflow: "auto", flex: 1 }}>
                  {filteredCatalog.map(c => (
                    <button key={c.type}
                      onClick={() => { store.addComponent(obj!.id, c.factory()); setShowAddComp(false); setCompSearch(""); }}
                      style={{ width: "100%", background: "transparent", border: "none", color: T.text200, padding: "6px 10px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-cairo)", textAlign: "right" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bgHover}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ color: c.color }}>{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                  {filteredCatalog.length === 0 && <p style={{ fontSize: 11, color: T.text600, padding: "8px 10px", textAlign: "center" }}>لا نتائج</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  VISUAL SCRIPTING PANEL
// ════════════════════════════════════════════════════════════
function VSNodeCard({ node, selected, onSelect, onMove, onDelete }: {
  node: VSNode; selected: boolean;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
  onDelete: () => void;
}) {
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const catColor = VS_CATEGORY_COLORS[node.category] || T.accent;

  function onMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    onSelect();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y };
    function onMove2(ev: MouseEvent) {
      if (!dragRef.current) return;
      onMove(ev.clientX - dragRef.current.sx, ev.clientY - dragRef.current.sy);
    }
    function onUp() {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove2);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove2);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute", left: node.x, top: node.y, width: node.width || 180,
        background: T.bgCard, border: `1.5px solid ${selected ? catColor : T.border}`,
        borderRadius: 8, overflow: "visible", cursor: "grab", userSelect: "none",
        boxShadow: selected ? `0 0 12px ${catColor}44` : `0 2px 8px rgba(0,0,0,0.4)`,
        zIndex: selected ? 10 : 1,
      }}
    >
      {/* Title bar */}
      <div style={{ background: catColor + "22", borderBottom: `1px solid ${catColor}44`, padding: "5px 8px", display: "flex", alignItems: "center", gap: 6, borderRadius: "6px 6px 0 0" }}>
        <span style={{ color: catColor, flexShrink: 0 }}>
          {VS_CATALOG.find(c => c.type === node.type)?.icon || <Zap size={10} />}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: catColor, flex: 1 }}>{node.label}</span>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", color: T.text600, cursor: "pointer", padding: 0, display: "flex" }}><X size={10} /></button>
      </div>

      {/* Ports */}
      <div style={{ padding: "6px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {/* Inputs */}
          <div style={{ flex: 1 }}>
            {node.inputs.map(port => (
              <div key={port.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px" }}>
                <div style={{ width: 8, height: 8, borderRadius: port.type === "exec" ? 2 : "50%", background: VS_PORT_COLORS[port.type] || "#fff", border: "1.5px solid rgba(255,255,255,0.3)", flexShrink: 0, marginLeft: -12 }} />
                <span style={{ fontSize: 9, color: T.text400 }}>{port.name}</span>
              </div>
            ))}
          </div>
          {/* Outputs */}
          <div style={{ textAlign: "right" }}>
            {node.outputs.map(port => (
              <div key={port.id} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, padding: "3px 8px" }}>
                <span style={{ fontSize: 9, color: T.text400 }}>{port.name}</span>
                <div style={{ width: 8, height: 8, borderRadius: port.type === "exec" ? 2 : "50%", background: VS_PORT_COLORS[port.type] || "#fff", border: "1.5px solid rgba(255,255,255,0.3)", flexShrink: 0, marginRight: -12 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Data fields */}
        {Object.entries(node.data || {}).map(([k, v]) => (
          <div key={k} style={{ padding: "2px 10px", display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: T.text400, minWidth: 50 }}>{k}</span>
            <input
              value={String(v)}
              onClick={e => e.stopPropagation()}
              onChange={() => {}}
              style={{ ...inputSty, fontSize: 9, padding: "2px 5px", flex: 1 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualScriptingEditor({ graph, onClose }: { graph: VSGraph; onClose: () => void }) {
  const store = useEditorStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [showNodeMenu, setShowNodeMenu] = useState<{ x: number; y: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const { selectedVSNodeId } = store.ui;

  const filteredNodes = VS_CATALOG.filter(n =>
    (selectedCat === "all" || n.category === selectedCat) &&
    n.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const categories = ["all", "event", "condition", "action", "flow", "variable", "ai"];

  function addNode(type: typeof VS_CATALOG[0]) {
    if (!showNodeMenu) return;
    const node: VSNode = {
      id: `node_${Date.now()}`,
      type: type.type,
      category: type.category as VSNode["category"],
      label: type.label,
      x: (showNodeMenu.x - pan.x) / zoom,
      y: (showNodeMenu.y - pan.y) / zoom,
      width: 180,
      inputs: type.defaultInputs.map(p => ({ ...p, connected: false })),
      outputs: type.defaultOutputs.map(p => ({ ...p, connected: false })),
      data: {},
    };
    store.addVSNode(graph.id, node);
    setShowNodeMenu(null);
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: T.bgBase, zIndex: 50, display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div style={{ height: 40, background: T.bgPanel, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", flexShrink: 0 }}>
        <Workflow size={14} style={{ color: T.accent }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text100, flex: 1 }}>{graph.name}</span>
        <span style={{ fontSize: 10, color: T.text400 }}>{graph.nodes.length} nodes · {graph.connections.length} connections</span>
        <button onClick={onClose} style={{ ...iBtn(), marginLeft: 8 }}><X size={13} /></button>
      </div>

      {/* Canvas */}
      <div
        style={{ flex: 1, position: "relative", overflow: "hidden", cursor: "crosshair" }}
        onContextMenu={e => { e.preventDefault(); setShowNodeMenu({ x: e.clientX, y: e.clientY }); }}
        onWheel={e => setZoom(z => Math.max(0.3, Math.min(2, z - e.deltaY * 0.001)))}
      >
        {/* Grid */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            <pattern id="vsgrid" width={32 * zoom} height={32 * zoom} patternUnits="userSpaceOnUse" x={pan.x % (32 * zoom)} y={pan.y % (32 * zoom)}>
              <path d={`M ${32 * zoom} 0 L 0 0 0 ${32 * zoom}`} fill="none" stroke={T.border} strokeWidth="0.5" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#vsgrid)" />
        </svg>

        {/* Nodes container */}
        <div style={{ position: "absolute", transformOrigin: "0 0", transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          {graph.nodes.map(node => (
            <VSNodeCard
              key={node.id}
              node={node}
              selected={selectedVSNodeId === node.id}
              onSelect={() => store.selectVSNode(node.id)}
              onMove={(dx, dy) => store.updateVSNode(graph.id, node.id, { x: node.x + dx / zoom, y: node.y + dy / zoom })}
              onDelete={() => store.removeVSNode(graph.id, node.id)}
            />
          ))}
        </div>

        {/* Empty state */}
        {graph.nodes.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <Workflow size={40} style={{ color: T.accent, opacity: 0.2, marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: T.text600 }}>كليك يمين لإضافة node</p>
          </div>
        )}

        {/* Context menu */}
        <AnimatePresence>
          {showNodeMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: "absolute", left: showNodeMenu.x, top: showNodeMenu.y, background: T.bgCard, border: `1px solid ${T.borderMd}`, borderRadius: 10, zIndex: 200, width: 240, maxHeight: 360, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
            >
              <div style={{ padding: "6px 8px", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ position: "relative" }}>
                  <Search size={10} style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", color: T.text600 }} />
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ابحث عن node..." style={{ ...inputSty, paddingLeft: 22 }} autoFocus />
                </div>
              </div>
              <div style={{ display: "flex", gap: 3, padding: "5px 6px", flexWrap: "wrap", borderBottom: `1px solid ${T.border}` }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCat(cat)}
                    style={{ background: selectedCat === cat ? T.accentSoft : "transparent", border: `1px solid ${selectedCat === cat ? T.accent : T.border}`, borderRadius: 4, color: selectedCat === cat ? T.accent : T.text400, padding: "2px 6px", fontSize: 9, cursor: "pointer" }}>
                    {cat === "all" ? "الكل" : cat}
                  </button>
                ))}
              </div>
              <div style={{ overflow: "auto", flex: 1 }}>
                {filteredNodes.map(n => (
                  <button key={n.type} onClick={() => addNode(n)}
                    style={{ width: "100%", background: "transparent", border: "none", color: T.text200, padding: "6px 10px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-cairo)", textAlign: "right" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bgHover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ color: VS_CATEGORY_COLORS[n.category] || T.accent }}>{n.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: T.text200 }}>{n.label}</div>
                      <div style={{ fontSize: 9, color: T.text600 }}>{n.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showNodeMenu && <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowNodeMenu(null)} />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  LEFT SIDEBAR — Hierarchy
// ════════════════════════════════════════════════════════════

const OBJ_TYPE_ICONS: Record<string, string> = {
  player: "👤", enemy: "👾", platform: "▬", wall: "█",
  trigger: "⚡", collectible: "⭐", npc: "🧑", spawn: "🚩",
  goal: "🏆", decoration: "🌸", text: "T", camera: "🎥",
  light: "💡", emptyObject: "○",
};
const OBJ_TYPE_COLORS: Record<string, string> = {
  player: "#7c3aed", enemy: "#dc2626", platform: "#2563eb",
  wall: "#64748b", trigger: "#f59e0b", collectible: "#10b981",
  npc: "#06b6d4", spawn: "#84cc16", goal: "#f97316",
  decoration: "#a78bfa", text: "#e2e8f0",
};
const ADD_TYPES: Array<{ type: GameObject["type"]; icon: string; label: string }> = [
  { type: "player",     icon: "👤", label: "لاعب" },
  { type: "platform",   icon: "▬",  label: "منصة" },
  { type: "wall",       icon: "█",  label: "جدار" },
  { type: "enemy",      icon: "👾", label: "عدو" },
  { type: "collectible",icon: "⭐", label: "جائزة" },
  { type: "trigger",    icon: "⚡", label: "منطقة حدث" },
  { type: "npc",        icon: "🧑", label: "شخصية" },
  { type: "spawn",      icon: "🚩", label: "نقطة بداية" },
  { type: "goal",       icon: "🏆", label: "هدف" },
  { type: "decoration", icon: "🌸", label: "زخرفة" },
  { type: "text",       icon: "T",  label: "نص" },
  { type: "emptyObject",icon: "○",  label: "كائن فارغ" },
];

function HierarchyPanel() {
  const store = useEditorStore();
  const { project, ui } = store;
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const activeScene = store.getActiveScene();

  const objects = (activeScene?.objects || []).filter(o =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PANELS: { id: EditorPanel; icon: React.ReactNode; tip: string }[] = [
    { id: "hierarchy",    icon: <Layers size={12} />,   tip: "Hierarchy" },
    { id: "characters",   icon: <span style={{fontSize:11}}>👥</span>, tip: "شخصيات" },
    { id: "assets",       icon: <Package size={12} />,  tip: "أصول 3D" },
    { id: "visualScript", icon: <Workflow size={12} />, tip: "Visual Script" },
    { id: "settings",     icon: <Settings size={12} />, tip: "إعدادات" },
    { id: "console",      icon: <Terminal size={12} />, tip: "Console" },
  ];
  const [charCat, setCharCat] = useState("hero");
  const [assetCat, setAssetCat] = useState("houses");

  return (
    <div style={{ width: 230, background: T.bgPanel, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
      {/* Panel Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        {PANELS.map(p => (
          <button key={p.id} onClick={() => store.setPanel(p.id)} title={p.tip}
            style={{ flex: 1, height: 34, background: "transparent", border: "none", borderBottom: ui.activePanel === p.id ? `2px solid ${T.accent}` : "2px solid transparent", color: ui.activePanel === p.id ? T.accent : T.text600, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {p.icon}
          </button>
        ))}
      </div>

      {/* Hierarchy */}
      {ui.activePanel === "hierarchy" && (
        <>
          {/* Scene tabs */}
          <div style={{ display: "flex", gap: 2, padding: "4px 6px", borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", flexShrink: 0 }}>
            {project?.engineData.scenes.map(sc => (
              <button key={sc.id} onClick={() => store.setActiveScene(sc.id)}
                style={{ background: ui.selectedSceneId === sc.id ? T.accentSoft : "transparent", border: `1px solid ${ui.selectedSceneId === sc.id ? T.accent : T.border}`, borderRadius: 4, color: ui.selectedSceneId === sc.id ? T.accent : T.text400, padding: "2px 7px", fontSize: 10, cursor: "pointer" }}>
                {sc.name}
              </button>
            ))}
            <button onClick={store.addScene} title="مشهد جديد" style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, color: T.text600, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}>+</button>
          </div>

          {/* Search */}
          <div style={{ padding: "6px 6px 0", flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <Search size={10} style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", color: T.text600 }} />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="بحث في الكائنات..." style={{ ...inputSty, paddingLeft: 22 }} />
            </div>
          </div>

          {/* Objects list */}
          <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
            {objects.length === 0 && (
              <div style={{ padding: "20px 12px", textAlign: "center" }}>
                <p style={{ fontSize: 11, color: T.text600 }}>لا يوجد كائنات في المشهد</p>
              </div>
            )}
            {objects.map(obj => {
              const sel = ui.selectedObjectId === obj.id;
              const multiSel = ui.selectedObjectIds.includes(obj.id);
              const compCount = obj.components?.length || 0;
              return (
                <div key={obj.id}
                  onClick={e => {
                    if (e.ctrlKey || e.metaKey) store.toggleSelectObject(obj.id);
                    else store.selectObject(obj.id);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
                    cursor: "pointer",
                    background: sel ? T.bgActive : multiSel ? T.accentSoft : "transparent",
                    borderLeft: `2px solid ${sel ? T.accent : "transparent"}`,
                  }}
                >
                  <span style={{ fontSize: 11, flexShrink: 0 }}>{OBJ_TYPE_ICONS[obj.type] || "○"}</span>
                  <span style={{ fontSize: 11, color: obj.active ? (sel ? T.text100 : T.text200) : T.text600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {obj.name}
                  </span>
                  {sel && (
                    <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); store.duplicateObject(obj.id); }}
                        style={{ background: "none", border: "none", color: T.text400, cursor: "pointer", padding: 2, display: "flex" }}><Copy size={9} /></button>
                      <button onClick={e => { e.stopPropagation(); store.removeObject(obj.id); }}
                        style={{ background: "none", border: "none", color: T.red, cursor: "pointer", padding: 2, display: "flex" }}><Trash2 size={9} /></button>
                    </div>
                  )}
                  <span style={{ fontSize: 9, color: T.text600, flexShrink: 0 }}>{compCount}c</span>
                </div>
              );
            })}
          </div>

          {/* Add Object */}
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "6px", flexShrink: 0, position: "relative" }}>
            <button onClick={() => setShowAddMenu(v => !v)}
              style={{ width: "100%", background: T.accentSoft, border: `1px solid ${T.accent}`, borderRadius: 6, color: T.accent, padding: "5px 0", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "var(--font-cairo)" }}>
              <Plus size={11} /> إضافة كائن
            </button>
            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  style={{ position: "absolute", bottom: "100%", left: 6, right: 6, marginBottom: 4, background: T.bgCard, border: `1px solid ${T.borderMd}`, borderRadius: 10, overflow: "hidden", zIndex: 100, boxShadow: "0 -8px 24px rgba(0,0,0,0.4)" }}
                >
                  {ADD_TYPES.map(t => (
                    <button key={t.type} onClick={() => { store.addObjectOfType(t.type); setShowAddMenu(false); }}
                      style={{ width: "100%", background: "transparent", border: "none", color: T.text200, padding: "6px 10px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-cairo)", textAlign: "right" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bgHover}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontSize: 13 }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: 11 }}>{t.label}</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Characters Panel */}
      {ui.activePanel === "characters" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* Category tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, padding: "6px 6px 3px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            {CHARACTER_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCharCat(cat.id)}
                style={{ background: charCat === cat.id ? T.accentSoft : "transparent", border: `1px solid ${charCat === cat.id ? T.accent : T.border}`, borderRadius: 5, color: charCat === cat.id ? T.accent : T.text400, padding: "2px 6px", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 2, fontFamily: "var(--font-cairo)" }}>
                <span>{cat.icon}</span>{cat.label}
              </button>
            ))}
          </div>
          {/* Grid */}
          <div style={{ flex: 1, overflow: "auto", padding: "6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {getCharactersByCategory(charCat).map(char => (
              <div key={char.id}
                title={`إضافة ${char.name}`}
                onClick={() => {
                  const sc = store.getActiveScene();
                  if (!sc) return;
                  const groundY = Math.round(sc.height * 0.82) - char.height;
                  store.addObject({
                    id: `obj_${Date.now()}`,
                    name: char.name,
                    tag: char.category === "hero" ? "Player" : char.category === "enemy" || char.category === "boss" ? "Enemy" : "Untagged",
                    layer: 0, active: true, isStatic: false, parentId: null, childIds: [],
                    type: char.category === "hero" ? "player" : char.category === "boss" || char.category === "enemy" ? "enemy" : "npc",
                    x: Math.round(sc.width * 0.3 + Math.random() * sc.width * 0.4),
                    y: groundY, width: char.width, height: char.height,
                    rotation: 0, visible: true, locked: false,
                    color: { r: 124, g: 58, b: 237, a: 1 }, tags: [], components: [],
                    spriteKey: char.id,
                  } as any);
                }}
                style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentSoft; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bgCard; }}
              >
                <div style={{ width: 52, height: 52 }} dangerouslySetInnerHTML={{ __html: char.svg.replace(/viewBox="([^"]+)"/, `viewBox="$1" width="52" height="52"`) }} />
                <span style={{ fontSize: 9, color: T.text200, fontFamily: "var(--font-cairo)", textAlign: "center", fontWeight: 600 }}>{char.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assets 3D Panel */}
      {ui.activePanel === "assets" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, padding: "6px 6px 3px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            {ASSET_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setAssetCat(cat.id)}
                style={{ background: assetCat === cat.id ? T.accentSoft : "transparent", border: `1px solid ${assetCat === cat.id ? T.accent : T.border}`, borderRadius: 5, color: assetCat === cat.id ? T.accent : T.text400, padding: "2px 6px", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 2, fontFamily: "var(--font-cairo)" }}>
                <span>{cat.icon}</span>{cat.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "6px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {getAssetsByCategory(assetCat).map(asset => (
              <div key={asset.id}
                title={`إضافة ${asset.name}`}
                onClick={() => {
                  const sc = store.getActiveScene();
                  if (!sc) return;
                  store.addObject({
                    id: `obj_${Date.now()}`,
                    name: asset.name, tag: "Untagged", layer: 0, active: true,
                    isStatic: true, parentId: null, childIds: [],
                    type: "decoration",
                    x: Math.round(sc.width * 0.3 + Math.random() * sc.width * 0.4),
                    y: Math.round(sc.height * 0.5),
                    width: 80, height: 80, rotation: 0, visible: true, locked: false,
                    color: { r: 100, g: 150, b: 200, a: 1 }, tags: [], components: [],
                    spriteKey: asset.id, assetScale: asset.scale ?? 1,
                  } as any);
                }}
                style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentSoft; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bgCard; }}
              >
                <span style={{ fontSize: 26 }}>{asset.icon}</span>
                <span style={{ fontSize: 9, color: T.text200, fontFamily: "var(--font-cairo)", textAlign: "center", fontWeight: 600, lineHeight: 1.3 }}>{asset.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Script tab */}
      {ui.activePanel === "visualScript" && (
        <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <button
              onClick={() => {
                const scene = store.getActiveScene();
                if (!scene) return;
                const graph: VSGraph = {
                  id: `graph_${Date.now()}`,
                  name: `Script ${(scene.vsGraphs?.length || 0) + 1}`,
                  objectId: ui.selectedObjectId || "",
                  nodes: [],
                  connections: [],
                  variables: {},
                };
                store.addVSGraph(graph);
              }}
              style={{ width: "100%", background: T.accentSoft, border: `1px solid ${T.accent}`, borderRadius: 6, color: T.accent, padding: "5px 0", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "var(--font-cairo)" }}>
              <Plus size={11} /> Script جديد
            </button>
          </div>
          {(store.getActiveScene()?.vsGraphs || []).map(graph => (
            <div key={graph.id}
              onClick={() => store.selectVSGraph(graph.id)}
              style={{ padding: "8px 10px", borderRadius: 6, background: ui.selectedVSGraphId === graph.id ? T.bgActive : T.bgCard, border: `1px solid ${ui.selectedVSGraphId === graph.id ? T.accent : T.border}`, marginBottom: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Workflow size={12} style={{ color: T.accent, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.text200 }}>{graph.name}</div>
                <div style={{ fontSize: 9, color: T.text600 }}>{graph.nodes.length} nodes</div>
              </div>
              <button onClick={e => { e.stopPropagation(); store.removeVSGraph(graph.id); }}
                style={{ background: "none", border: "none", color: T.text600, cursor: "pointer", padding: 0, display: "flex" }}><X size={10} /></button>
            </div>
          ))}
          {!(store.getActiveScene()?.vsGraphs?.length) && (
            <p style={{ fontSize: 11, color: T.text600, textAlign: "center", marginTop: 20 }}>لا يوجد scripts</p>
          )}
        </div>
      )}

      {/* Console */}
      {ui.activePanel === "console" && (
        <div style={{ flex: 1, overflow: "auto", fontFamily: "monospace", fontSize: 10 }}>
          <div style={{ padding: "4px 8px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: T.text400, fontSize: 10 }}>Console ({ui.consoleMessages.length})</span>
            <button onClick={store.clearConsole} style={{ background: "none", border: "none", color: T.text600, cursor: "pointer", fontSize: 9 }}>مسح</button>
          </div>
          {ui.consoleMessages.length === 0 && <p style={{ color: T.text600, padding: "12px 8px", fontSize: 11 }}>لا رسائل</p>}
          {[...ui.consoleMessages].reverse().map(msg => (
            <div key={msg.id} style={{ padding: "3px 8px", borderBottom: `1px solid ${T.border}22`, color: msg.level === "error" ? T.red : msg.level === "warn" ? T.yellow : T.text400, fontSize: 10 }}>
              [{msg.level.toUpperCase()}] {msg.message}
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      {ui.activePanel === "settings" && (
        <div style={{ flex: 1, overflow: "auto", padding: 10 }}>
          <CompField label="عرض اللعبة">
            <NumInput value={project?.engineData.settings.screenWidth || 1920} onChange={v => store.patchEngineData({ settings: { ...store.project!.engineData.settings, screenWidth: v } })} step={32} />
          </CompField>
          <CompField label="ارتفاع اللعبة">
            <NumInput value={project?.engineData.settings.screenHeight || 1080} onChange={v => store.patchEngineData({ settings: { ...store.project!.engineData.settings, screenHeight: v } })} step={32} />
          </CompField>
          <CompField label="الفيزياء">
            <SelectField label="" value={project?.engineData.settings.physics || "arcade"} options={[{v:"arcade",l:"Arcade"},{v:"box2d",l:"Box2D"},{v:"none",l:"بدون"}]} onChange={v => store.patchEngineData({ settings: { ...store.project!.engineData.settings, physics: v as "arcade"|"box2d"|"none" } })} />
          </CompField>
          <CompField label="الجاذبية">
            <NumInput value={project?.engineData.settings.gravity || 9.8} onChange={v => store.patchEngineData({ settings: { ...store.project!.engineData.settings, gravity: v } })} step={0.1} />
          </CompField>
          <CompField label="FPS">
            <NumInput value={project?.engineData.settings.targetFPS || 60} onChange={v => store.patchEngineData({ settings: { ...store.project!.engineData.settings, targetFPS: v } })} step={1} min={1} max={120} />
          </CompField>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TOOLBAR
// ════════════════════════════════════════════════════════════
function Toolbar() {
  const store = useEditorStore();
  const { project, ui } = store;
  const router = useRouter();

  const tools: { id: EditorTool; icon: React.ReactNode; tip: string }[] = [
    { id: "select", icon: <MousePointer2 size={13}/>, tip: "تحديد (V)" },
    { id: "move",   icon: <Move size={13}/>,          tip: "تحريك (G)" },
    { id: "add",    icon: <Plus size={13}/>,           tip: "إضافة (A)" },
    { id: "erase",  icon: <Trash2 size={13}/>,         tip: "حذف (D)"   },
    { id: "pan",    icon: <Maximize2 size={13}/>,      tip: "تحريك عرض (H)" },
  ];

  return (
    <div style={{
      height: 44, background: T.bgPanel, borderBottom: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", gap: 4, padding: "0 10px", flexShrink: 0,
    }}>
      {/* Brand */}
      <Gamepad2 size={16} style={{ color: T.accent }} />
      <span style={{ fontSize: 12, fontWeight: 800, color: T.text100, marginLeft: 4, marginRight: 8, letterSpacing: "-0.5px" }}>
        يالا Editor
      </span>
      <div style={{ width: 1, height: 20, background: T.border, marginRight: 6 }} />

      {/* Title */}
      <input
        value={project?.title || ""}
        onChange={e => store.setProjectTitle(e.target.value)}
        style={{ background: "transparent", border: "none", outline: "none", color: T.text100, fontSize: 12, fontWeight: 600, width: 150, fontFamily: "var(--font-cairo)" }}
        placeholder="اسم المشروع..."
      />
      {ui.isDirty && <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.yellow, flexShrink: 0 }} title="تغييرات غير محفوظة" />}

      <div style={{ flex: 1 }} />

      {/* Tools */}
      <div style={{ display: "flex", gap: 1, background: T.bgBase, borderRadius: 7, padding: 3, border: `1px solid ${T.border}` }}>
        {tools.map(t => (
          <button key={t.id} title={t.tip} onClick={() => store.setTool(t.id)}
            style={{ ...iBtn(ui.activeTool === t.id), width: 28, height: 28 }}>
            {t.icon}
          </button>
        ))}
      </div>
      <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />

      {/* Undo / Redo */}
      <button title="تراجع" onClick={store.undo} disabled={!store.canUndo()} style={iBtn(false)}><Undo2 size={13} /></button>
      <button title="إعادة" onClick={store.redo} disabled={!store.canRedo()} style={iBtn(false)}><Redo2 size={13} /></button>
      <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />

      {/* View toggles */}
      <button title="شبكة" onClick={store.toggleGrid} style={iBtn(ui.showGrid)}><Grid3X3 size={13} /></button>
      <button title="Snap" onClick={store.toggleSnapToGrid} style={iBtn(ui.snapToGrid)}><Crosshair size={13} /></button>
      <button title="Colliders" onClick={store.toggleShowColliders} style={iBtn(ui.showColliders)}><Circle size={13} /></button>
      <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />

      {/* Zoom */}
      <button onClick={() => store.setZoom(ui.zoom - 0.25)} style={iBtn(false)}><ZoomOut size={13} /></button>
      <span style={{ fontSize: 10, color: T.text400, minWidth: 36, textAlign: "center" }}>{Math.round(ui.zoom * 100)}%</span>
      <button onClick={() => store.setZoom(ui.zoom + 0.25)} style={iBtn(false)}><ZoomIn size={13} /></button>
      <div style={{ width: 1, height: 20, background: T.border, margin: "0 4px" }} />

      {/* Save */}
      <button onClick={store.saveProject} disabled={ui.isSaving || !ui.isDirty}
        style={{ background: ui.isDirty ? T.accentSoft : "transparent", border: `1px solid ${ui.isDirty ? T.accent : T.border}`, borderRadius: 7, color: ui.isDirty ? T.accent : T.text400, padding: "0 10px", height: 28, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, cursor: ui.isDirty ? "pointer" : "default", fontFamily: "var(--font-cairo)" }}>
        {ui.isSaving ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={12} />}
        {ui.isSaving ? "حفظ..." : "حفظ"}
      </button>

      {/* Play / Pause / Stop */}
      <div style={{ display: "flex", gap: 2, background: T.bgBase, borderRadius: 7, padding: 3, border: `1px solid ${T.border}` }}>
        <button onClick={() => store.setPlaying(!ui.isPlaying)}
          style={{ ...iBtn(ui.isPlaying, ui.isPlaying ? T.red : T.green), width: 28, height: 28 }}>
          {ui.isPlaying ? <Square size={13} /> : <Play size={13} />}
        </button>
        {ui.isPlaying && (
          <button onClick={() => store.setPaused(!ui.isPaused)} style={{ ...iBtn(ui.isPaused, T.yellow), width: 28, height: 28 }}>
            <Pause size={13} />
          </button>
        )}
      </div>

      {/* AI */}
      <button onClick={store.toggleAiChat}
        style={{ background: ui.aiChatOpen ? "rgba(124,58,237,0.2)" : "transparent", border: `1px solid ${ui.aiChatOpen ? T.accent : T.border}`, borderRadius: 7, color: ui.aiChatOpen ? T.accent : T.text400, padding: "0 8px", height: 28, fontSize: 11, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontFamily: "var(--font-cairo)" }}>
        <Sparkles size={12} /> AI
      </button>

      {/* Projects & Back */}
      <button onClick={() => router.push("/editor/projects")}
        title="مشاريعي"
        style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 7, color: T.text400, padding: "0 8px", height: 28, fontSize: 11, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontFamily: "var(--font-cairo)" }}>
        📂
      </button>
      <button onClick={() => router.push("/admin")}
        style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 7, color: T.text400, padding: "0 8px", height: 28, fontSize: 11, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontFamily: "var(--font-cairo)" }}>
        <LayoutDashboard size={12} />
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  AI CHAT
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
      store.addAiMessage({ id: `m${Date.now()+1}`, role: "assistant", content: data.message || "تم", timestamp: Date.now(), patch: data.patch });
      if (data.patch) store.applyAiPatch(data.patch);
    } catch {
      store.addAiMessage({ id: `merr${Date.now()}`, role: "assistant", content: "حدث خطأ، حاول مرة أخرى.", timestamp: Date.now() });
    } finally { setLoading(false); }
  }

  const suggestions = [
    "ضيف لاعب مع جاذبية وقدرة قفز",
    "اصنع مشهد platformer كامل",
    "ضيف نظام صحة وموت للعدو",
    "اعمل منصات متحركة",
  ];

  return (
    <AnimatePresence>
      {ui.aiChatOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }} animate={{ width: 270, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
          style={{ background: T.bgPanel, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}
        >
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={13} style={{ color: T.accent }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text100, flex: 1 }}>AI Assistant</span>
            <button onClick={store.toggleAiChat} style={{ background: "none", border: "none", color: T.text400, cursor: "pointer", display: "flex" }}><X size={13} /></button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 7 }}>
            {aiMessages.length === 0 && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <Sparkles size={24} style={{ color: T.accent, opacity: 0.3, marginBottom: 8 }} />
                <p style={{ fontSize: 11, color: T.text600, marginBottom: 10 }}>قول لي عايز تعمل إيه</p>
                {suggestions.map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    style={{ display: "block", width: "100%", marginBottom: 5, background: T.accentSoft, border: `1px solid ${T.accent}`, borderRadius: 6, color: T.accent, padding: "6px 8px", fontSize: 10, cursor: "pointer", fontFamily: "var(--font-cairo)", textAlign: "right" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {aiMessages.map(m => (
              <div key={m.id} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", background: m.role === "user" ? T.accent : T.bgCard, borderRadius: m.role === "user" ? "10px 10px 3px 10px" : "10px 10px 10px 3px", padding: "7px 10px", fontSize: 11, color: m.role === "user" ? "#fff" : T.text200, lineHeight: 1.5, border: m.role === "assistant" ? `1px solid ${T.border}` : "none" }}>
                {m.content}
                {m.patch && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 3, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 3 }}>✓ تم التطبيق</div>}
              </div>
            ))}
            {loading && <div style={{ alignSelf: "flex-start", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "10px 10px 10px 3px", padding: "8px 12px" }}><Loader2 size={13} style={{ color: T.accent, animation: "spin 1s linear infinite" }} /></div>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: 8, borderTop: `1px solid ${T.border}`, display: "flex", gap: 6 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="اكتب طلبك..." disabled={loading} style={{ ...inputSty, flex: 1 }} />
            <button onClick={send} disabled={loading || !input.trim()} style={{ background: T.accent, border: "none", borderRadius: 5, color: "#fff", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: loading || !input.trim() ? 0.5 : 1 }}>
              <Sparkles size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════
//  NEW PROJECT MODAL
// ════════════════════════════════════════════════════════════
function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<"platformer"|"topdown"|"puzzle"|"rpg">("platformer");
  const cats = [
    { id: "platformer" as const, label: "منصات",   icon: "🏃", desc: "ماريو ستايل" },
    { id: "topdown"    as const, label: "فوق-تحت", icon: "🗺️", desc: "Zelda ستايل"  },
    { id: "puzzle"     as const, label: "ألغاز",   icon: "🧩", desc: "حل المشاكل"  },
    { id: "rpg"        as const, label: "أدوار",   icon: "⚔️", desc: "قصة ومغامرة" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: T.bgCard, border: `1px solid ${T.borderMd}`, borderRadius: 14, padding: 28, width: 380, maxWidth: "90vw" }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text100, marginBottom: 18 }}>مشروع جديد</h2>
        <label style={labelSty}>اسم اللعبة</label>
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && title.trim() && (useEditorStore.getState().createNewProject(title.trim(), cat), onClose())}
          placeholder="اسم لعبتك..." autoFocus style={{ ...inputSty, marginBottom: 16, fontSize: 13, padding: "7px 10px" }} />
        <label style={labelSty}>نوع اللعبة</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 20 }}>
          {cats.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              style={{ background: cat === c.id ? T.accentSoft : T.bgPanel, border: `1.5px solid ${cat === c.id ? T.accent : T.border}`, borderRadius: 9, padding: "10px 6px", cursor: "pointer", textAlign: "center" as const }}>
              <div style={{ fontSize: 20, marginBottom: 3 }}>{c.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text100, fontFamily: "var(--font-cairo)" }}>{c.label}</div>
              <div style={{ fontSize: 9, color: T.text400, fontFamily: "var(--font-cairo)" }}>{c.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: T.bgPanel, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text400, padding: "9px 0", cursor: "pointer", fontFamily: "var(--font-cairo)", fontSize: 13 }}>إلغاء</button>
          <button onClick={() => { if (!title.trim()) return; useEditorStore.getState().createNewProject(title.trim(), cat); onClose(); }} disabled={!title.trim()}
            style={{ flex: 2, background: title.trim() ? T.accent : T.bgPanel, border: "none", borderRadius: 9, color: "#fff", padding: "9px 0", cursor: title.trim() ? "pointer" : "not-allowed", fontFamily: "var(--font-cairo)", fontSize: 13, fontWeight: 700, opacity: title.trim() ? 1 : 0.5 }}>
            ✨ إنشاء
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useEditorStore();
  const { project, isLoaded } = store;
  const [showNew, setShowNew] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [authStatus, setAuthStatus] = useState<"loading"|"ok"|"unauth">("loading");
  const projectId = searchParams.get("id");
  const activeVSGraph = store.ui.selectedVSGraphId ? store.getVSGraph(store.ui.selectedVSGraphId) : null;

  // Auth check
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setAuthStatus(d.user ? "ok" : "unauth")).catch(() => setAuthStatus("unauth"));
  }, []);
  useEffect(() => { if (authStatus === "unauth") router.push("/auth/login"); }, [authStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const s = useEditorStore.getState();
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) { e.preventDefault(); s.undo(); }
        if (e.key === "z" &&  e.shiftKey) { e.preventDefault(); s.redo(); }
        if (e.key === "y")                { e.preventDefault(); s.redo(); }
        if (e.key === "s")                { e.preventDefault(); s.saveProject(); }
        if (e.key === "d" && s.ui.selectedObjectId) { e.preventDefault(); s.duplicateObject(s.ui.selectedObjectId); }
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "v") s.setTool("select");
      if (e.key === "g") s.setTool("move");
      if (e.key === "a") s.setTool("add");
      if (e.key === "d") s.setTool("erase");
      if (e.key === "h") s.setTool("pan");
      if (e.key === "Escape") { s.clearSelection(); }
      if ((e.key === "Delete" || e.key === "Backspace") && s.ui.selectedObjectIds.length > 0) {
        if (s.ui.selectedObjectIds.length > 1) s.removeObjects(s.ui.selectedObjectIds);
        else if (s.ui.selectedObjectId) s.removeObject(s.ui.selectedObjectId);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Load project from URL
  useEffect(() => {
    if (!projectId || isLoaded) return;
    setLoadingProject(true);
    fetch(`/api/editor/projects/${projectId}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); store.loadProject(d); })
      .catch(e => setLoadErr(e.message))
      .finally(() => setLoadingProject(false));
  }, [projectId, isLoaded]);

  if (authStatus === "loading" || loadingProject) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bgBase }}>
        <Loader2 size={28} style={{ color: T.accent, animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (loadErr) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bgBase, gap: 12 }}>
        <AlertCircle size={28} style={{ color: T.red }} />
        <p style={{ color: T.text100 }}>{loadErr}</p>
        <button onClick={() => router.push("/editor")} style={{ background: T.accent, border: "none", borderRadius: 8, color: "#fff", padding: "8px 20px", cursor: "pointer", fontFamily: "var(--font-cairo)" }}>العودة</button>
      </div>
    );
  }

  // Welcome screen
  if (!isLoaded || !project) {
    return (
      <div style={{ minHeight: "100dvh", background: T.bgBase, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
          <Gamepad2 size={48} style={{ color: T.accent, marginBottom: 14 }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text100, marginBottom: 6, fontFamily: "var(--font-cairo)" }}>يالا Editor</h1>
          <p style={{ color: T.text400, fontSize: 13, marginBottom: 6, fontFamily: "var(--font-cairo)" }}>محرك ألعاب عربي مدعوم بالـ AI</p>
          <p style={{ color: T.text600, fontSize: 11, marginBottom: 28, fontFamily: "var(--font-cairo)" }}>Component System · Visual Scripting · 3D Canvas</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => setShowNew(true)}
              style={{ background: T.accent, border: "none", borderRadius: 10, color: "#fff", padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-cairo)" }}>
              <Plus size={16} /> مشروع جديد
            </button>
            <button onClick={() => router.push("/editor/projects")}
              style={{ background: T.bgCard, border: `1px solid ${T.borderMd}`, borderRadius: 10, color: T.text200, padding: "12px 24px", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-cairo)", display: "flex", alignItems: "center", gap: 7 }}>
              📂 مشاريعي
            </button>
          </div>
        </motion.div>
        {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
      </div>
    );
  }

  // ── Main Editor Layout ──────────────────────────────────
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: T.bgBase, overflow: "hidden", fontFamily: "var(--font-cairo)" }}>
      <Toolbar />
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <HierarchyPanel />

        {/* Canvas Area */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <Canvas3D />

          {/* VS Graph Overlay */}
          {activeVSGraph && (
            <VisualScriptingEditor
              graph={activeVSGraph}
              onClose={() => store.selectVSGraph(null)}
            />
          )}

          {/* Play Mode Overlay */}
          <AnimatePresence>
            {store.ui.isPlaying && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(34,197,94,0.15)", border: "1px solid #22c55e", borderRadius: 20, padding: "4px 14px", display: "flex", alignItems: "center", gap: 6, zIndex: 30 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: 11, color: T.green, fontFamily: "var(--font-cairo)" }}>
                  {store.ui.isPaused ? "⏸ متوقف" : "▶ تشغيل"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <InspectorPanel />
        <AiChat />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        input:focus { border-color: ${T.accent} !important; }
        select { color-scheme: dark; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.borderMd}; }
      `}</style>
    </div>
  );
}
