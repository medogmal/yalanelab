"use client";
// ═══════════════════════════════════════════════════════════════
//  YALA EDITOR v2 — Unity-inspired Game Editor
// ═══════════════════════════════════════════════════════════════
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Settings, Play, Square, Save, Undo2, Redo2, Pause,
  Plus, Trash2, Copy, Lock, ChevronRight,
  ChevronDown, MousePointer2, Move, Zap, BookOpen, X, Loader2,
  AlertCircle, Gamepad2, LayoutDashboard, Sparkles, Grid3X3,
  ZoomIn, ZoomOut, Box, Circle, Code2, Cpu,
  Volume2, RefreshCw, Terminal, Package, Layers3, SlidersHorizontal,
  Search, Star, Activity,
  Maximize2, Crosshair,
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
  TransformComponent, ScriptComponent,
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

const inputSty: React.CSSProperties = {
  width: "100%", background: "#0a0f1e", border: `1px solid ${T.border}`,
  borderRadius: 5, color: T.text100, padding: "4px 8px", fontSize: 11,
  outline: "none", boxSizing: "border-box", fontFamily: "var(--font-cairo)",
};
const labelSty: React.CSSProperties = {
  display: "block", fontSize: 10, color: T.text400, marginBottom: 3,
  fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const,
};
function iBtn(active = false, color = T.accent): React.CSSProperties {
  return {
    background: active ? "rgba(124,58,237,0.15)" : "transparent",
    border: `1px solid ${active ? T.accent : "transparent"}`,
    borderRadius: 5, color: active ? color : T.text400,
    width: 26, height: 26, display: "flex", alignItems: "center",
    justifyContent: "center", cursor: "pointer", flexShrink: 0,
  };
}

// ════════════════════════════════════════════════════════════
//  COMPONENT CATALOG
// ════════════════════════════════════════════════════════════
const COMP_CATALOG: { type: ComponentType; icon: React.ReactNode; label: string; color: string; factory: () => GameComponent }[] = [
  { type: "Transform",        icon: <Crosshair size={12}/>,    label: "Transform",          color: "#f59e0b", factory: makeTransform },
  { type: "SpriteRenderer",   icon: <Box size={12}/>,           label: "Sprite Renderer",    color: "#3b82f6", factory: () => makeSpriteRenderer() },
  { type: "Rigidbody2D",      icon: <Activity size={12}/>,      label: "Rigidbody 2D",       color: "#ef4444", factory: makeRigidbody },
  { type: "BoxCollider2D",    icon: <Square size={12}/>,        label: "Box Collider 2D",    color: "#22c55e", factory: () => makeBoxCollider() },
  { type: "CircleCollider2D", icon: <Circle size={12}/>,        label: "Circle Collider 2D", color: "#22c55e", factory: () => ({ type: "CircleCollider2D" as const, enabled: true, isTrigger: false, offset:{x:0,y:0}, radius:0.5, material:{friction:0.4,bounciness:0} }) },
  { type: "PlayerController", icon: <Gamepad2 size={12}/>,      label: "Player Controller",  color: "#7c3aed", factory: makePlayerController },
  { type: "EnemyAI",          icon: <Cpu size={12}/>,           label: "Enemy AI",           color: "#ef4444", factory: makeEnemyAI },
  { type: "HealthSystem",     icon: <Activity size={12}/>,      label: "Health System",      color: "#ef4444", factory: () => makeHealthSystem(100) },
  { type: "Animator",         icon: <RefreshCw size={12}/>,     label: "Animator",           color: "#14b8a6", factory: () => ({ type: "Animator" as const, enabled: true, currentState: "idle", clips: [], parameters: {}, transitions: [] }) },
  { type: "AudioSource",      icon: <Volume2 size={12}/>,       label: "Audio Source",       color: "#f59e0b", factory: () => ({ type: "AudioSource" as const, enabled: true, clip:"", volume:1, pitch:1, loop:false, playOnAwake:false, spatialBlend:0 }) },
  { type: "Script",           icon: <Code2 size={12}/>,         label: "Script",             color: "#7c3aed", factory: () => ({ type: "Script" as const, enabled: true, scriptName:"NewScript", code:"// كتب الكود هنا\nfunction OnStart(){}\nfunction OnUpdate(){}", variables:{} }) },
  { type: "ParticleSystem",   icon: <Star size={12}/>,          label: "Particle System",    color: "#f59e0b", factory: () => ({ type: "ParticleSystem" as const, enabled: true, duration:5, loop:true, startLifetime:1, startSpeed:3, startSize:0.1, startColor:{r:255,g:200,b:50,a:1}, emissionRate:20, maxParticles:200, shape:"cone" as const, gravity:0 }) },
  { type: "PlatformMovement", icon: <Move size={12}/>,          label: "Platform Movement",  color: "#14b8a6", factory: () => ({ type: "PlatformMovement" as const, enabled: true, movementType:"horizontal" as const, speed:2, distance:3, waitTime:1 }) },
  { type: "Light",            icon: <Star size={12}/>,          label: "Light",              color: "#fcd34d", factory: () => ({ type: "Light" as const, enabled: true, lightType:"point" as const, color:{r:255,g:240,b:200,a:1}, intensity:1, range:5, castShadows:false }) },
];

// ════════════════════════════════════════════════════════════
//  VS NODE CATALOG
// ════════════════════════════════════════════════════════════
const VS_CATALOG: {
  type: VSNodeType; category: string; label: string;
  icon: React.ReactNode; color: string;
  defaultInputs: Array<{id:string;name:string;type:string}>;
  defaultOutputs: Array<{id:string;name:string;type:string}>;
}[] = [
  { type:"OnGameStart",      category:"event",     label:"عند البداية",        icon:<Play size={10}/>,          color:"#22c55e", defaultInputs:[], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"OnUpdate",         category:"event",     label:"كل Frame",           icon:<RefreshCw size={10}/>,     color:"#22c55e", defaultInputs:[], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"OnCollisionEnter", category:"event",     label:"عند التصادم",        icon:<Radio size={10}/>,         color:"#22c55e", defaultInputs:[], defaultOutputs:[{id:"out",name:"",type:"exec"},{id:"other",name:"الكائن",type:"object"}] },
  { type:"OnTriggerEnter",   category:"event",     label:"عند الدخول",         icon:<Zap size={10}/>,           color:"#22c55e", defaultInputs:[], defaultOutputs:[{id:"out",name:"",type:"exec"},{id:"other",name:"الكائن",type:"object"}] },
  { type:"OnKeyDown",        category:"event",     label:"عند ضغط مفتاح",     icon:<Variable size={10}/>,      color:"#22c55e", defaultInputs:[], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"OnHealthZero",     category:"event",     label:"عند موت",            icon:<Activity size={10}/>,      color:"#ef4444", defaultInputs:[], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"If",               category:"condition", label:"إذا",                icon:<GitBranch size={10}/>,     color:"#f59e0b", defaultInputs:[{id:"in",name:"",type:"exec"},{id:"cond",name:"شرط",type:"bool"}], defaultOutputs:[{id:"true",name:"صح",type:"exec"},{id:"false",name:"غلط",type:"exec"}] },
  { type:"Compare",          category:"condition", label:"مقارنة",             icon:<SlidersHorizontal size={10}/>, color:"#f59e0b", defaultInputs:[{id:"a",name:"A",type:"float"},{id:"b",name:"B",type:"float"}], defaultOutputs:[{id:"result",name:"نتيجة",type:"bool"}] },
  { type:"MoveObject",       category:"action",    label:"تحريك كائن",         icon:<Move size={10}/>,          color:"#3b82f6", defaultInputs:[{id:"in",name:"",type:"exec"},{id:"target",name:"الهدف",type:"object"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"DestroyObject",    category:"action",    label:"حذف كائن",           icon:<Trash2 size={10}/>,        color:"#ef4444", defaultInputs:[{id:"in",name:"",type:"exec"},{id:"target",name:"الهدف",type:"object"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"SpawnObject",      category:"action",    label:"إنشاء كائن",         icon:<Plus size={10}/>,          color:"#3b82f6", defaultInputs:[{id:"in",name:"",type:"exec"}], defaultOutputs:[{id:"out",name:"",type:"exec"},{id:"spawned",name:"الكائن",type:"object"}] },
  { type:"PlaySound",        category:"action",    label:"تشغيل صوت",          icon:<Volume2 size={10}/>,       color:"#3b82f6", defaultInputs:[{id:"in",name:"",type:"exec"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"AddScore",         category:"action",    label:"إضافة نقاط",         icon:<Star size={10}/>,          color:"#f59e0b", defaultInputs:[{id:"in",name:"",type:"exec"},{id:"val",name:"القيمة",type:"float"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"ShowMessage",      category:"action",    label:"إظهار رسالة",        icon:<BookOpen size={10}/>,      color:"#7c3aed", defaultInputs:[{id:"in",name:"",type:"exec"},{id:"msg",name:"الرسالة",type:"string"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"LoadScene",        category:"action",    label:"تغيير مشهد",         icon:<Layers size={10}/>,        color:"#7c3aed", defaultInputs:[{id:"in",name:"",type:"exec"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"EndGame",          category:"action",    label:"إنهاء اللعبة",       icon:<Square size={10}/>,        color:"#ef4444", defaultInputs:[{id:"in",name:"",type:"exec"}], defaultOutputs:[] },
  { type:"ApplyForce",       category:"action",    label:"تطبيق قوة",          icon:<Activity size={10}/>,      color:"#3b82f6", defaultInputs:[{id:"in",name:"",type:"exec"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"ShakeCamera",      category:"action",    label:"هز الكاميرا",        icon:<Maximize2 size={10}/>,     color:"#7c3aed", defaultInputs:[{id:"in",name:"",type:"exec"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"SetAnimation",     category:"action",    label:"تغيير أنيميشن",      icon:<RefreshCw size={10}/>,     color:"#14b8a6", defaultInputs:[{id:"in",name:"",type:"exec"},{id:"state",name:"الحالة",type:"string"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"Wait",             category:"flow",      label:"انتظر",              icon:<Clock size={10}/>,         color:"#6366f1", defaultInputs:[{id:"in",name:"",type:"exec"},{id:"time",name:"الوقت (ث)",type:"float"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"Repeat",           category:"flow",      label:"كرر",                icon:<Repeat size={10}/>,        color:"#6366f1", defaultInputs:[{id:"in",name:"",type:"exec"},{id:"count",name:"عدد المرات",type:"float"}], defaultOutputs:[{id:"body",name:"نفذ",type:"exec"},{id:"done",name:"انتهى",type:"exec"}] },
  { type:"GetVariable",      category:"variable",  label:"احصل على متغير",     icon:<Variable size={10}/>,      color:"#14b8a6", defaultInputs:[], defaultOutputs:[{id:"val",name:"القيمة",type:"float"}] },
  { type:"SetVariable",      category:"variable",  label:"عيّن متغير",          icon:<Variable size={10}/>,      color:"#14b8a6", defaultInputs:[{id:"in",name:"",type:"exec"},{id:"val",name:"القيمة",type:"float"}], defaultOutputs:[{id:"out",name:"",type:"exec"}] },
  { type:"MathOp",           category:"variable",  label:"عملية حسابية",       icon:<Code2 size={10}/>,         color:"#14b8a6", defaultInputs:[{id:"a",name:"A",type:"float"},{id:"b",name:"B",type:"float"}], defaultOutputs:[{id:"res",name:"النتيجة",type:"float"}] },
];

const VS_CAT_COLORS: Record<string, string> = {
  event:"#22c55e", condition:"#f59e0b", action:"#3b82f6",
  flow:"#6366f1",  variable:"#14b8a6",  ai:"#ef4444",
};
const VS_PORT_COLORS: Record<string, string> = {
  exec:"#ffffff", bool:"#f59e0b", float:"#3b82f6",
  string:"#22c55e", object:"#7c3aed", vector2:"#14b8a6",
};

// ════════════════════════════════════════════════════════════
//  SHARED FORM COMPONENTS
// ════════════════════════════════════════════════════════════
function CompField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={labelSty}>{label}</label>
      {children}
    </div>
  );
}
function NumInput({ value, onChange, step=1, min, max }: { value:number; onChange:(v:number)=>void; step?:number; min?:number; max?:number }) {
  return <input type="number" value={isNaN(value)?0:+value.toFixed(3)} onChange={e=>onChange(+e.target.value)} step={step} min={min} max={max} style={inputSty}/>;
}
function Vec2Field({ label, value, onChange }: { label:string; value:{x:number;y:number}; onChange:(v:{x:number;y:number})=>void }) {
  return (
    <CompField label={label}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:5, top:"50%", transform:"translateY(-50%)", fontSize:9, color:"#ef4444", fontWeight:700 }}>X</span>
          <input type="number" value={+value.x.toFixed(3)} onChange={e=>onChange({...value,x:+e.target.value})} style={{...inputSty,paddingLeft:16}}/>
        </div>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:5, top:"50%", transform:"translateY(-50%)", fontSize:9, color:"#22c55e", fontWeight:700 }}>Y</span>
          <input type="number" value={+value.y.toFixed(3)} onChange={e=>onChange({...value,y:+e.target.value})} style={{...inputSty,paddingLeft:16}}/>
        </div>
      </div>
    </CompField>
  );
}
function Vec3Field({ label, value, onChange }: { label:string; value:{x:number;y:number;z:number}; onChange:(v:{x:number;y:number;z:number})=>void }) {
  return (
    <CompField label={label}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:3 }}>
        {(["x","y","z"] as const).map((k,i)=>(
          <div key={k} style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:4, top:"50%", transform:"translateY(-50%)", fontSize:9, fontWeight:700, color:["#ef4444","#22c55e","#3b82f6"][i] }}>{k.toUpperCase()}</span>
            <input type="number" value={+value[k].toFixed(3)} onChange={e=>onChange({...value,[k]:+e.target.value})} style={{...inputSty,paddingLeft:14}}/>
          </div>
        ))}
      </div>
    </CompField>
  );
}
function BoolToggle({ label, value, onChange }: { label:string; value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
      <span style={{ fontSize:11, color:T.text200 }}>{label}</span>
      <div onClick={()=>onChange(!value)} style={{ width:32, height:16, borderRadius:8, cursor:"pointer", background:value?T.accent:T.text600, position:"relative", transition:"background .15s", flexShrink:0 }}>
        <div style={{ position:"absolute", width:12, height:12, borderRadius:"50%", background:"#fff", top:2, left:value?18:2, transition:"left .15s" }}/>
      </div>
    </div>
  );
}
function SelectField({ label, value, options, onChange }: { label:string; value:string; options:{v:string;l:string}[]; onChange:(v:string)=>void }) {
  return (
    <CompField label={label}>
      <select value={value} onChange={e=>onChange(e.target.value)} style={inputSty}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </CompField>
  );
}

// ════════════════════════════════════════════════════════════
//  COMPONENT EDITORS
// ════════════════════════════════════════════════════════════
function TransformEditor({ comp, onChange }: { comp:TransformComponent; onChange:(p:Partial<TransformComponent>)=>void }) {
  return (
    <>
      <Vec3Field label="الموقع"  value={comp.position} onChange={position=>onChange({position})}/>
      <Vec3Field label="الدوران" value={comp.rotation} onChange={rotation=>onChange({rotation})}/>
      <Vec3Field label="الحجم"   value={comp.scale}    onChange={scale=>onChange({scale})}/>
    </>
  );
}
function SpriteRendererEditor({ comp, onChange }: { comp:SpriteRendererComponent; onChange:(p:Partial<SpriteRendererComponent>)=>void }) {
  return (
    <>
      <CompField label="Sprite Key">
        <input value={comp.spriteKey} onChange={e=>onChange({spriteKey:e.target.value})} style={inputSty} placeholder="hero_warrior..."/>
      </CompField>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        <BoolToggle label="Flip X" value={comp.flipX} onChange={v=>onChange({flipX:v})}/>
        <BoolToggle label="Flip Y" value={comp.flipY} onChange={v=>onChange({flipY:v})}/>
      </div>
    </>
  );
}
function Rigidbody2DEditor({ comp, onChange }: { comp:Rigidbody2DComponent; onChange:(p:Partial<Rigidbody2DComponent>)=>void }) {
  return (
    <>
      <SelectField label="Body Type" value={comp.bodyType} options={[{v:"Dynamic",l:"Dynamic"},{v:"Kinematic",l:"Kinematic"},{v:"Static",l:"Static"}]} onChange={v=>onChange({bodyType:v as "Dynamic"|"Kinematic"|"Static"})}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        <CompField label="Mass"><NumInput value={comp.mass} onChange={v=>onChange({mass:v})} step={0.1} min={0.01}/></CompField>
        <CompField label="Gravity"><NumInput value={comp.gravityScale} onChange={v=>onChange({gravityScale:v})} step={0.1}/></CompField>
      </div>
      <BoolToggle label="Freeze Rotation" value={comp.freezeRotation} onChange={v=>onChange({freezeRotation:v})}/>
    </>
  );
}
function BoxCollider2DEditor({ comp, onChange }: { comp:BoxCollider2DComponent; onChange:(p:Partial<BoxCollider2DComponent>)=>void }) {
  return (
    <>
      <BoolToggle label="Is Trigger" value={comp.isTrigger} onChange={v=>onChange({isTrigger:v})}/>
      <Vec2Field label="Offset" value={comp.offset} onChange={offset=>onChange({offset})}/>
      <Vec2Field label="Size"   value={comp.size}   onChange={size=>onChange({size})}/>
    </>
  );
}
function PlayerControllerEditor({ comp, onChange }: { comp:PlayerControllerComponent; onChange:(p:Partial<PlayerControllerComponent>)=>void }) {
  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        <CompField label="Speed"><NumInput value={comp.moveSpeed} onChange={v=>onChange({moveSpeed:v})} step={0.5} min={0}/></CompField>
        <CompField label="Jump"><NumInput value={comp.jumpForce} onChange={v=>onChange({jumpForce:v})} step={1} min={0}/></CompField>
        <CompField label="Max Jumps"><NumInput value={comp.maxJumps} onChange={v=>onChange({maxJumps:v})} step={1} min={1} max={5}/></CompField>
        <CompField label="Dash Speed"><NumInput value={comp.dashSpeed} onChange={v=>onChange({dashSpeed:v})} step={1} min={0}/></CompField>
      </div>
      <BoolToggle label="Can Dash" value={comp.canDash} onChange={v=>onChange({canDash:v})}/>
    </>
  );
}
function EnemyAIEditor({ comp, onChange }: { comp:EnemyAIComponent; onChange:(p:Partial<EnemyAIComponent>)=>void }) {
  return (
    <>
      <SelectField label="AI Pattern" value={comp.aiPattern} options={[{v:"patrol",l:"دورية"},{v:"chase",l:"مطاردة"},{v:"guard",l:"حراسة"},{v:"wander",l:"تجوال"},{v:"sniper",l:"قناص"}]} onChange={v=>onChange({aiPattern:v as EnemyAIComponent["aiPattern"]})}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        <CompField label="Detection R"><NumInput value={comp.detectionRadius} onChange={v=>onChange({detectionRadius:v})} step={0.5} min={0}/></CompField>
        <CompField label="Attack R"><NumInput value={comp.attackRadius} onChange={v=>onChange({attackRadius:v})} step={0.5} min={0}/></CompField>
        <CompField label="Speed"><NumInput value={comp.moveSpeed} onChange={v=>onChange({moveSpeed:v})} step={0.5} min={0}/></CompField>
        <CompField label="Damage"><NumInput value={comp.attackDamage} onChange={v=>onChange({attackDamage:v})} step={5} min={0}/></CompField>
      </div>
    </>
  );
}
function HealthSystemEditor({ comp, onChange }: { comp:HealthSystemComponent; onChange:(p:Partial<HealthSystemComponent>)=>void }) {
  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        <CompField label="Max HP"><NumInput value={comp.maxHealth} onChange={v=>onChange({maxHealth:v})} step={10} min={1}/></CompField>
        <CompField label="HP"><NumInput value={comp.currentHealth} onChange={v=>onChange({currentHealth:v})} step={1} min={0} max={comp.maxHealth}/></CompField>
      </div>
      <div style={{ background:T.bgBase, borderRadius:4, height:6, marginBottom:8, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${(comp.currentHealth/comp.maxHealth)*100}%`, background:comp.currentHealth>comp.maxHealth*0.5?T.green:comp.currentHealth>comp.maxHealth*0.25?T.yellow:T.red }}/>
      </div>
      <SelectField label="On Death" value={comp.deathAction} options={[{v:"destroy",l:"حذف"},{v:"respawn",l:"إعادة إحياء"},{v:"gameOver",l:"Game Over"},{v:"none",l:"لا شيء"}]} onChange={v=>onChange({deathAction:v as HealthSystemComponent["deathAction"]})}/>
    </>
  );
}
function ScriptEditor({ comp, onChange }: { comp:ScriptComponent; onChange:(p:Partial<ScriptComponent>)=>void }) {
  return (
    <>
      <CompField label="Script Name">
        <input value={comp.scriptName} onChange={e=>onChange({scriptName:e.target.value})} style={inputSty}/>
      </CompField>
      <CompField label="Code">
        <textarea value={comp.code} onChange={e=>onChange({code:e.target.value})} rows={7} style={{...inputSty,resize:"vertical",fontFamily:"monospace",lineHeight:1.5}}/>
      </CompField>
    </>
  );
}
function GenericEditor({ comp }: { comp:GameComponent }) {
  const entries = Object.entries(comp).filter(([k])=>k!=="type"&&k!=="enabled");
  if (!entries.length) return <p style={{fontSize:11,color:T.text400}}>لا توجد خصائص</p>;
  return (
    <div>
      {entries.map(([k,v])=>(
        <div key={k} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, marginBottom:4 }}>
          <span style={{fontSize:10,color:T.text400}}>{k}</span>
          <span style={{fontSize:10,color:T.text200,overflow:"hidden",textOverflow:"ellipsis"}}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  COMPONENT CARD
// ════════════════════════════════════════════════════════════
function ComponentCard({ comp, objectId, onRemove }: { comp:GameComponent; objectId:string; onRemove:()=>void }) {
  const store = useEditorStore();
  const [collapsed, setCollapsed] = useState(false);
  const cat = COMP_CATALOG.find(c=>c.type===comp.type);
  const canRemove = comp.type !== "Transform";
  function handleChange(patch: Partial<GameComponent>) { store.updateComponent(objectId, comp.type, patch); }
  function renderEditor() {
    switch(comp.type) {
      case "Transform":        return <TransformEditor        comp={comp as TransformComponent}        onChange={handleChange}/>;
      case "SpriteRenderer":   return <SpriteRendererEditor   comp={comp as SpriteRendererComponent}   onChange={handleChange}/>;
      case "Rigidbody2D":      return <Rigidbody2DEditor      comp={comp as Rigidbody2DComponent}      onChange={handleChange}/>;
      case "BoxCollider2D":    return <BoxCollider2DEditor     comp={comp as BoxCollider2DComponent}    onChange={handleChange}/>;
      case "PlayerController": return <PlayerControllerEditor  comp={comp as PlayerControllerComponent} onChange={handleChange}/>;
      case "EnemyAI":          return <EnemyAIEditor           comp={comp as EnemyAIComponent}          onChange={handleChange}/>;
      case "HealthSystem":     return <HealthSystemEditor      comp={comp as HealthSystemComponent}     onChange={handleChange}/>;
      case "Script":           return <ScriptEditor            comp={comp as ScriptComponent}           onChange={handleChange}/>;
      default:                 return <GenericEditor comp={comp}/>;
    }
  }
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:6, marginBottom:4, background:T.bgCard }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 8px", cursor:"pointer", borderBottom:collapsed?"none":`1px solid ${T.border}` }} onClick={()=>setCollapsed(v=>!v)}>
        <span style={{color:cat?.color||T.accent}}>{cat?.icon||<Box size={12}/>}</span>
        <span style={{fontSize:11,fontWeight:700,color:T.text200,flex:1}}>{cat?.label||comp.type}</span>
        <BoolToggle label="" value={comp.enabled??true} onChange={v=>handleChange({enabled:v} as Partial<GameComponent>)}/>
        {canRemove&&<button onClick={e=>{e.stopPropagation();onRemove();}} style={{background:"none",border:"none",color:T.text600,cursor:"pointer",display:"flex"}}><X size={11}/></button>}
        {collapsed?<ChevronRight size={11} color={T.text400}/>:<ChevronDown size={11} color={T.text400}/>}
      </div>
      {!collapsed&&<div style={{padding:"8px 10px"}}>{renderEditor()}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  INSPECTOR PANEL
// ════════════════════════════════════════════════════════════
function InspectorPanel() {
  const store = useEditorStore();
  const obj   = store.getSelectedObject();
  const scene = store.getActiveScene();
  const [showAddComp, setShowAddComp] = useState(false);
  const [compSearch,  setCompSearch]  = useState("");

  if (!obj && !scene) return (
    <div style={{width:260,background:T.bgPanel,borderLeft:`1px solid ${T.border}`,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
      <Settings size={24} style={{color:T.text600,opacity:0.3}}/>
      <span style={{fontSize:11,color:T.text600}}>حدد كائناً لتعديله</span>
    </div>
  );

  if (!obj && scene) return (
    <div style={{width:260,background:T.bgPanel,borderLeft:`1px solid ${T.border}`,flexShrink:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"8px 12px",borderBottom:`1px solid ${T.border}`,fontSize:11,fontWeight:700,color:T.text200,display:"flex",alignItems:"center",gap:6}}>
        <Layers3 size={13} style={{color:T.accent}}/> خصائص المشهد
      </div>
      <div style={{padding:10,overflow:"auto",flex:1}}>
        <CompField label="اسم المشهد">
          <input value={scene.name} onChange={e=>store.updateScene(scene.id,{name:e.target.value})} style={inputSty}/>
        </CompField>
        <CompField label="الجاذبية">
          <NumInput value={scene.gravity} onChange={v=>store.updateScene(scene.id,{gravity:v})} step={0.1} min={0}/>
        </CompField>
        <CompField label="الأبعاد">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            <NumInput value={scene.width}  onChange={v=>store.updateScene(scene.id,{width:v})}  step={32}/>
            <NumInput value={scene.height} onChange={v=>store.updateScene(scene.id,{height:v})} step={32}/>
          </div>
        </CompField>
        <CompField label="لون الخلفية">
          <input type="color"
            value={`#${[scene.backgroundColor.r,scene.backgroundColor.g,scene.backgroundColor.b].map(v=>v.toString(16).padStart(2,"0")).join("")}`}
            onChange={e=>{const h=e.target.value;store.updateScene(scene.id,{backgroundColor:{r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16),a:1}});}}
            style={{width:"100%",height:30,borderRadius:5,border:"none",cursor:"pointer"}}/>
        </CompField>
      </div>
    </div>
  );

  const filteredCatalog = COMP_CATALOG.filter(c=>
    c.label.toLowerCase().includes(compSearch.toLowerCase()) &&
    !obj!.components?.some(ex=>ex.type===c.type)
  );

  return (
    <div style={{width:260,background:T.bgPanel,borderLeft:`1px solid ${T.border}`,flexShrink:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,background:T.bgCard}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
          <BoolToggle label="" value={obj!.active} onChange={v=>store.updateObject(obj!.id,{active:v})}/>
          <input value={obj!.name} onChange={e=>store.updateObject(obj!.id,{name:e.target.value})} style={{...inputSty,fontWeight:700,fontSize:12,flex:1}}/>
          <button style={iBtn(obj!.isStatic)} title="Static" onClick={()=>store.updateObject(obj!.id,{isStatic:!obj!.isStatic})}><Lock size={10}/></button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          <CompField label="Tag">
            <input value={obj!.tag} onChange={e=>store.updateObject(obj!.id,{tag:e.target.value})} style={inputSty}/>
          </CompField>
          <CompField label="Layer">
            <NumInput value={obj!.layer} onChange={v=>store.updateObject(obj!.id,{layer:v})} step={1} min={0}/>
          </CompField>
        </div>
      </div>
      <div style={{flex:1,overflow:"auto",padding:"8px 8px 0"}}>
        {(obj!.components||[]).map((comp,i)=>(
          <ComponentCard key={`${comp.type}_${i}`} comp={comp} objectId={obj!.id} onRemove={()=>store.removeComponent(obj!.id,comp.type)}/>
        ))}
        <div style={{position:"relative",margin:"8px 0 80px"}}>
          <button onClick={()=>setShowAddComp(v=>!v)} style={{width:"100%",background:T.bgCard,border:`1px dashed ${T.borderMd}`,borderRadius:6,color:T.text400,padding:"6px 0",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontFamily:"var(--font-cairo)"}}>
            <Plus size={12}/> إضافة Component
          </button>
          <AnimatePresence>
            {showAddComp&&(
              <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:6}}
                style={{position:"absolute",top:"100%",left:0,right:0,marginTop:4,background:T.bgCard,border:`1px solid ${T.borderMd}`,borderRadius:8,zIndex:100,maxHeight:260,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                <div style={{padding:"5px 7px",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{position:"relative"}}>
                    <Search size={10} style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",color:T.text600}}/>
                    <input value={compSearch} onChange={e=>setCompSearch(e.target.value)} placeholder="بحث..." style={{...inputSty,paddingLeft:20}} autoFocus/>
                  </div>
                </div>
                <div style={{overflow:"auto",flex:1}}>
                  {filteredCatalog.map(c=>(
                    <button key={c.type} onClick={()=>{store.addComponent(obj!.id,c.factory());setShowAddComp(false);setCompSearch("");}}
                      style={{width:"100%",background:"transparent",border:"none",color:T.text200,padding:"6px 10px",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"var(--font-cairo)"}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bgHover}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{color:c.color}}>{c.icon}</span><span>{c.label}</span>
                    </button>
                  ))}
                  {!filteredCatalog.length&&<p style={{fontSize:11,color:T.text600,padding:"8px",textAlign:"center"}}>لا نتائج</p>}
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
//  VISUAL SCRIPTING NODE CARD
// ════════════════════════════════════════════════════════════
function VSNodeCard({ node, selected, onSelect, onMove, onDelete }: {
  node:VSNode; selected:boolean;
  onSelect:()=>void; onMove:(dx:number,dy:number)=>void; onDelete:()=>void;
}) {
  const dragRef = useRef<{sx:number;sy:number}|null>(null);
  const catColor = VS_CAT_COLORS[node.category]||T.accent;
  function onMouseDown(e: React.MouseEvent) {
    e.stopPropagation(); onSelect();
    dragRef.current = {sx:e.clientX,sy:e.clientY};
    function mv(ev:MouseEvent){if(!dragRef.current)return;onMove(ev.clientX-dragRef.current.sx,ev.clientY-dragRef.current.sy);dragRef.current={sx:ev.clientX,sy:ev.clientY};}
    function up(){dragRef.current=null;window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);}
    window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up);
  }
  const catDef = VS_CATALOG.find(c=>c.type===node.type);
  return (
    <div onMouseDown={onMouseDown} style={{position:"absolute",left:node.x,top:node.y,width:node.width||180,background:T.bgCard,border:`1.5px solid ${selected?catColor:T.border}`,borderRadius:8,cursor:"grab",userSelect:"none",zIndex:selected?10:1}}>
      <div style={{background:catColor+"22",borderBottom:`1px solid ${catColor}44`,padding:"5px 8px",display:"flex",alignItems:"center",gap:6,borderRadius:"6px 6px 0 0"}}>
        <span style={{color:catColor}}>{catDef?.icon||<Zap size={10}/>}</span>
        <span style={{fontSize:11,fontWeight:700,color:catColor,flex:1}}>{node.label}</span>
        <button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:"none",border:"none",color:T.text600,cursor:"pointer",display:"flex"}}><X size={10}/></button>
      </div>
      <div style={{padding:"5px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <div>
            {node.inputs.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 8px"}}>
                <div style={{width:7,height:7,borderRadius:p.type==="exec"?2:"50%",background:VS_PORT_COLORS[p.type]||"#fff",flexShrink:0,marginLeft:-12}}/>
                <span style={{fontSize:9,color:T.text400}}>{p.name}</span>
              </div>
            ))}
          </div>
          <div>
            {node.outputs.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4,padding:"2px 8px"}}>
                <span style={{fontSize:9,color:T.text400}}>{p.name}</span>
                <div style={{width:7,height:7,borderRadius:p.type==="exec"?2:"50%",background:VS_PORT_COLORS[p.type]||"#fff",flexShrink:0,marginRight:-12}}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  VISUAL SCRIPTING EDITOR
// ════════════════════════════════════════════════════════════
function VisualScriptingEditor({ graph, onClose }: { graph:VSGraph; onClose:()=>void }) {
  const store = useEditorStore();
  const [zoom, setZoom] = useState(1);
  const [pan] = useState({x:40,y:40});
  const [showMenu, setShowMenu] = useState<{x:number;y:number}|null>(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const {selectedVSNodeId} = store.ui;

  const filtered = VS_CATALOG.filter(n=>(cat==="all"||n.category===cat)&&n.label.includes(search));

  function addNode(def: typeof VS_CATALOG[0]) {
    if (!showMenu) return;
    const node: VSNode = {
      id:`node_${Date.now()}`, type:def.type,
      category:def.category as VSNode["category"], label:def.label,
      x:(showMenu.x-pan.x)/zoom, y:(showMenu.y-pan.y)/zoom,
      width:180,
      inputs:def.defaultInputs.map(p=>({...p,connected:false})),
      outputs:def.defaultOutputs.map(p=>({...p,connected:false})),
      data:{},
    };
    store.addVSNode(graph.id, node);
    setShowMenu(null);
  }

  return (
    <div style={{position:"absolute",inset:0,background:T.bgBase,zIndex:50,display:"flex",flexDirection:"column"}}>
      <div style={{height:40,background:T.bgPanel,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8,padding:"0 12px",flexShrink:0}}>
        <Workflow size={14} style={{color:T.accent}}/>
        <span style={{fontSize:12,fontWeight:700,color:T.text100,flex:1}}>{graph.name}</span>
        <span style={{fontSize:10,color:T.text400}}>{graph.nodes.length} nodes</span>
        <button onClick={onClose} style={{...iBtn(),marginLeft:8}}><X size={13}/></button>
      </div>
      <div style={{flex:1,position:"relative",overflow:"hidden",cursor:"crosshair"}}
        onContextMenu={e=>{e.preventDefault();setShowMenu({x:e.clientX,y:e.clientY});}}
        onWheel={e=>setZoom(z=>Math.max(0.3,Math.min(2,z-e.deltaY*0.001)))}>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
          <defs><pattern id="vsgrid" width={32*zoom} height={32*zoom} patternUnits="userSpaceOnUse" x={pan.x%(32*zoom)} y={pan.y%(32*zoom)}>
            <path d={`M ${32*zoom} 0 L 0 0 0 ${32*zoom}`} fill="none" stroke={T.border} strokeWidth="0.5" opacity="0.4"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#vsgrid)"/>
        </svg>
        <div style={{position:"absolute",transformOrigin:"0 0",transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>
          {graph.nodes.map(node=>(
            <VSNodeCard key={node.id} node={node} selected={selectedVSNodeId===node.id}
              onSelect={()=>store.selectVSNode(node.id)}
              onMove={(dx,dy)=>store.updateVSNode(graph.id,node.id,{x:node.x+dx/zoom,y:node.y+dy/zoom})}
              onDelete={()=>store.removeVSNode(graph.id,node.id)}/>
          ))}
        </div>
        {!graph.nodes.length&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
            <Workflow size={36} style={{color:T.accent,opacity:0.2,marginBottom:10}}/>
            <p style={{fontSize:12,color:T.text600}}>كليك يمين لإضافة node</p>
          </div>
        )}
        <AnimatePresence>
          {showMenu&&(
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              style={{position:"absolute",left:showMenu.x,top:showMenu.y,background:T.bgCard,border:`1px solid ${T.borderMd}`,borderRadius:10,zIndex:200,width:240,maxHeight:340,overflow:"hidden",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"6px 8px",borderBottom:`1px solid ${T.border}`}}>
                <div style={{position:"relative"}}>
                  <Search size={10} style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",color:T.text600}}/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث..." style={{...inputSty,paddingLeft:20}} autoFocus/>
                </div>
              </div>
              <div style={{display:"flex",gap:2,padding:"4px 6px",flexWrap:"wrap",borderBottom:`1px solid ${T.border}`}}>
                {["all","event","condition","action","flow","variable"].map(c=>(
                  <button key={c} onClick={()=>setCat(c)} style={{background:cat===c?T.accentSoft:"transparent",border:`1px solid ${cat===c?T.accent:T.border}`,borderRadius:4,color:cat===c?T.accent:T.text400,padding:"2px 5px",fontSize:9,cursor:"pointer"}}>
                    {c==="all"?"الكل":c}
                  </button>
                ))}
              </div>
              <div style={{overflow:"auto",flex:1}}>
                {filtered.map(n=>(
                  <button key={n.type} onClick={()=>addNode(n)}
                    style={{width:"100%",background:"transparent",border:"none",color:T.text200,padding:"6px 10px",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"var(--font-cairo)"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.bgHover}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{color:VS_CAT_COLORS[n.category]||T.accent}}>{n.icon}</span>
                    <div>
                      <div style={{fontSize:11,color:T.text200}}>{n.label}</div>
                      <div style={{fontSize:9,color:T.text600}}>{n.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {showMenu&&<div style={{position:"fixed",inset:0,zIndex:199}} onClick={()=>setShowMenu(null)}/>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  HIERARCHY PANEL
// ════════════════════════════════════════════════════════════
const OBJ_ICONS: Record<string,string> = {
  player:"👤",enemy:"👾",platform:"▬",wall:"█",trigger:"⚡",
  collectible:"⭐",npc:"🧑",spawn:"🚩",goal:"🏆",decoration:"🌸",
  text:"T",camera:"🎥",light:"💡",emptyObject:"○",
};
const ADD_TYPES: Array<{type:GameObject["type"];icon:string;label:string}> = [
  {type:"player",icon:"👤",label:"لاعب"},
  {type:"platform",icon:"▬",label:"منصة"},
  {type:"wall",icon:"█",label:"جدار"},
  {type:"enemy",icon:"👾",label:"عدو"},
  {type:"collectible",icon:"⭐",label:"جائزة"},
  {type:"trigger",icon:"⚡",label:"منطقة حدث"},
  {type:"npc",icon:"🧑",label:"شخصية"},
  {type:"spawn",icon:"🚩",label:"نقطة بداية"},
  {type:"goal",icon:"🏆",label:"هدف"},
  {type:"decoration",icon:"🌸",label:"زخرفة"},
  {type:"text",icon:"T",label:"نص"},
  {type:"emptyObject",icon:"○",label:"كائن فارغ"},
];

function HierarchyPanel() {
  const store = useEditorStore();
  const {project,ui} = store;
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch]   = useState("");
  const [charCat, setCharCat] = useState("hero");
  const [assetCat, setAssetCat] = useState("houses");
  const activeScene = store.getActiveScene();
  const objects = (activeScene?.objects||[]).filter(o=>o.name.toLowerCase().includes(search.toLowerCase()));

  const TABS: {id:EditorPanel;icon:React.ReactNode;tip:string}[] = [
    {id:"hierarchy",    icon:<Layers size={12}/>,    tip:"Hierarchy"},
    {id:"characters",   icon:<span style={{fontSize:11}}>👥</span>, tip:"شخصيات"},
    {id:"assets",       icon:<Package size={12}/>,   tip:"أصول 3D"},
    {id:"visualScript", icon:<Workflow size={12}/>,  tip:"Scripts"},
    {id:"settings",     icon:<Settings size={12}/>,  tip:"إعدادات"},
    {id:"console",      icon:<Terminal size={12}/>,  tip:"Console"},
  ];

  return (
    <div style={{width:230,background:T.bgPanel,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:T.bgBase}}>
        {TABS.map(p=>(
          <button key={p.id} onClick={()=>store.setPanel(p.id)} title={p.tip}
            style={{flex:1,height:36,background:"transparent",border:"none",
              borderBottom:ui.activePanel===p.id?`2px solid ${T.accent}`:"2px solid transparent",
              color:ui.activePanel===p.id?T.accent:T.text600,
              display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
              transition:"color .15s",
            }}>
            {p.icon}
          </button>
        ))}
      </div>

      {/* Hierarchy */}
      {ui.activePanel==="hierarchy"&&(
        <>
          <div style={{display:"flex",gap:2,padding:"4px 6px",borderBottom:`1px solid ${T.border}`,flexWrap:"wrap",flexShrink:0}}>
            {project?.engineData.scenes.map(sc=>(
              <button key={sc.id} onClick={()=>store.setActiveScene(sc.id)}
                style={{background:ui.selectedSceneId===sc.id?T.accentSoft:"transparent",border:`1px solid ${ui.selectedSceneId===sc.id?T.accent:T.border}`,borderRadius:4,color:ui.selectedSceneId===sc.id?T.accent:T.text400,padding:"2px 7px",fontSize:10,cursor:"pointer"}}>
                {sc.name}
              </button>
            ))}
            <button onClick={store.addScene} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:4,color:T.text600,padding:"2px 6px",fontSize:10,cursor:"pointer"}}>+</button>
          </div>
          <div style={{padding:"5px 6px 0",flexShrink:0}}>
            <div style={{position:"relative"}}>
              <Search size={10} style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",color:T.text600}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث في الكائنات..." style={{...inputSty,paddingLeft:20}}/>
            </div>
          </div>
          <div style={{flex:1,overflow:"auto",padding:"4px 0"}}>
            {!objects.length&&(
              <div style={{padding:"24px 12px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                <div style={{width:44,height:44,borderRadius:12,background:T.accentSoft,border:`1px dashed ${T.accent}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Layers size={20} style={{color:T.accent,opacity:0.5}}/>
                </div>
                <p style={{fontSize:11,color:T.text600,lineHeight:1.6,margin:0}}>المشهد فارغ<br/><span style={{fontSize:10,color:T.text600}}>اضغط ➕ أو اسحب شخصية</span></p>
              </div>
            )}
            {objects.map(obj=>{
              const sel=ui.selectedObjectId===obj.id;
              return (
                <div key={obj.id}
                  onClick={e=>{ if(e.ctrlKey||e.metaKey)store.toggleSelectObject(obj.id); else store.selectObject(obj.id); }}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",cursor:"pointer",
                    background:sel?"linear-gradient(90deg,rgba(124,58,237,0.15),rgba(124,58,237,0.05))":"transparent",
                    borderLeft:`2px solid ${sel?T.accent:"transparent"}`,
                    borderRadius:"0 4px 4px 0",
                    transition:"background .1s",
                  }}
                  onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background=T.bgHover; }}
                  onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background="transparent"; }}>
                  <span style={{fontSize:11,opacity:obj.active?1:0.4}}>{OBJ_ICONS[obj.type]||"○"}</span>
                  <span style={{fontSize:11,color:sel?T.text100:T.text200,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:sel?600:400}}>{obj.name}</span>
                  {sel&&(
                    <div style={{display:"flex",gap:1}}>
                      <button onClick={e=>{e.stopPropagation();store.duplicateObject(obj.id);}} style={{background:"none",border:"none",color:T.text400,cursor:"pointer",display:"flex",padding:2}} title="نسخ"><Copy size={9}/></button>
                      <button onClick={e=>{e.stopPropagation();store.removeObject(obj.id);}} style={{background:"none",border:"none",color:T.red,cursor:"pointer",display:"flex",padding:2}} title="حذف"><Trash2 size={9}/></button>
                    </div>
                  )}
                  <span style={{fontSize:9,color:T.text600,fontVariantNumeric:"tabular-nums"}}>{obj.components?.length||0}c</span>
                </div>
              );
            })}
          </div>
          <div style={{borderTop:`1px solid ${T.border}`,padding:"6px",flexShrink:0,position:"relative"}}>
            <button onClick={()=>setShowAdd(v=>!v)} style={{width:"100%",background:T.accentSoft,border:`1px solid ${T.accent}`,borderRadius:6,color:T.accent,padding:"5px 0",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontFamily:"var(--font-cairo)"}}>
              <Plus size={11}/> إضافة كائن
            </button>
            <AnimatePresence>
              {showAdd&&(
                <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:6}}
                  style={{position:"absolute",bottom:"100%",left:6,right:6,marginBottom:4,background:T.bgCard,border:`1px solid ${T.borderMd}`,borderRadius:10,overflow:"hidden",zIndex:100}}>
                  {ADD_TYPES.map(t=>(
                    <button key={t.type} onClick={()=>{store.addObjectOfType(t.type);setShowAdd(false);}}
                      style={{width:"100%",background:"transparent",border:"none",color:T.text200,padding:"6px 10px",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"var(--font-cairo)"}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bgHover}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:13}}>{t.icon}</span><span>{t.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Characters */}
      {ui.activePanel==="characters"&&(
        <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:3,padding:"6px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            {CHARACTER_CATEGORIES.map(cat=>(
              <button key={cat.id} onClick={()=>setCharCat(cat.id)}
                style={{background:charCat===cat.id?T.accentSoft:"transparent",border:`1px solid ${charCat===cat.id?T.accent:T.border}`,borderRadius:5,color:charCat===cat.id?T.accent:T.text400,padding:"2px 6px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-cairo)"}}>
                {cat.icon}{cat.label}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflow:"auto",padding:"5px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {getCharactersByCategory(charCat).map(char=>{
              const objType = char.category==="hero"?"player":char.category==="boss"||char.category==="enemy"?"enemy":"npc";
              const tag = char.category==="hero"?"Player":char.category==="enemy"||char.category==="boss"?"Enemy":"Untagged";
              return (
              <div key={char.id}
                draggable
                onDragStart={e=>{
                  e.dataTransfer.effectAllowed="copy";
                  e.dataTransfer.setData("application/x-editor-object", JSON.stringify({
                    type:objType, name:char.name, tag,
                    spriteKey:char.id, width:char.width, height:char.height,
                  }));
                }}
                onClick={()=>{
                  const sc=store.getActiveScene(); if(!sc) return;
                  store.addObject({
                    id:`obj_${Date.now()}`,name:char.name,tag,
                    layer:0,active:true,isStatic:false,parentId:null,childIds:[],
                    type:objType,
                    x:Math.round(sc.width*0.3+Math.random()*sc.width*0.4),
                    y:Math.round(sc.height*0.82)-char.height,
                    width:char.width,height:char.height,rotation:0,visible:true,locked:false,
                    color:{r:124,g:58,b:237,a:1},tags:[],components:[],spriteKey:char.id,
                  } as any);
                }}
                style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 4px",cursor:"grab",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.background=T.accentSoft;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.bgCard;}}>
                <div style={{width:50,height:50}} dangerouslySetInnerHTML={{__html:char.svg.replace(/viewBox="([^"]+)"/,`viewBox="$1" width="50" height="50"`)}}/>
                <span style={{fontSize:9,color:T.text200,fontFamily:"var(--font-cairo)",textAlign:"center",fontWeight:600}}>{char.name}</span>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assets 3D */}
      {ui.activePanel==="assets"&&(
        <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:3,padding:"6px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            {ASSET_CATEGORIES.map(cat=>(
              <button key={cat.id} onClick={()=>setAssetCat(cat.id)}
                style={{background:assetCat===cat.id?T.accentSoft:"transparent",border:`1px solid ${assetCat===cat.id?T.accent:T.border}`,borderRadius:5,color:assetCat===cat.id?T.accent:T.text400,padding:"2px 6px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-cairo)"}}>
                {cat.icon}{cat.label}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflow:"auto",padding:"5px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {getAssetsByCategory(assetCat).map(asset=>(
              <div key={asset.id}
                draggable
                onDragStart={e=>{
                  e.dataTransfer.effectAllowed="copy";
                  e.dataTransfer.setData("application/x-editor-object", JSON.stringify({
                    type:"decoration", name:asset.name, tag:"Untagged",
                    spriteKey:asset.id, width:80, height:80,
                  }));
                }}
                onClick={()=>{
                  const sc=store.getActiveScene(); if(!sc) return;
                  store.addObject({
                    id:`obj_${Date.now()}`,name:asset.name,tag:"Untagged",layer:0,active:true,isStatic:true,parentId:null,childIds:[],
                    type:"decoration",x:Math.round(sc.width*0.3+Math.random()*sc.width*0.4),y:Math.round(sc.height*0.5),
                    width:80,height:80,rotation:0,visible:true,locked:false,color:{r:100,g:150,b:200,a:1},tags:[],components:[],
                    spriteKey:asset.id,assetScale:asset.scale??1,
                  } as any);
                }}
                style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 4px",cursor:"grab",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.background=T.accentSoft;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.bgCard;}}>
                <span style={{fontSize:26}}>{asset.icon}</span>
                <span style={{fontSize:9,color:T.text200,fontFamily:"var(--font-cairo)",textAlign:"center",fontWeight:600,lineHeight:1.3}}>{asset.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Scripts */}
      {ui.activePanel==="visualScript"&&(
        <div style={{flex:1,overflow:"auto",padding:8}}>
          <button onClick={()=>{
            const sc=store.getActiveScene(); if(!sc) return;
            store.addVSGraph({id:`g_${Date.now()}`,name:`Script ${(sc.vsGraphs?.length||0)+1}`,objectId:ui.selectedObjectId||"",nodes:[],connections:[],variables:{}});
          }} style={{width:"100%",background:T.accentSoft,border:`1px solid ${T.accent}`,borderRadius:6,color:T.accent,padding:"5px 0",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontFamily:"var(--font-cairo)",marginBottom:8}}>
            <Plus size={11}/> Script جديد
          </button>
          {(store.getActiveScene()?.vsGraphs||[]).map(g=>(
            <div key={g.id} onClick={()=>store.selectVSGraph(g.id)}
              style={{padding:"8px 10px",borderRadius:6,background:ui.selectedVSGraphId===g.id?T.bgActive:T.bgCard,border:`1px solid ${ui.selectedVSGraphId===g.id?T.accent:T.border}`,marginBottom:4,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <Workflow size={12} style={{color:T.accent,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontSize:11,color:T.text200}}>{g.name}</div><div style={{fontSize:9,color:T.text600}}>{g.nodes.length} nodes</div></div>
              <button onClick={e=>{e.stopPropagation();store.removeVSGraph(g.id);}} style={{background:"none",border:"none",color:T.text600,cursor:"pointer",display:"flex"}}><X size={10}/></button>
            </div>
          ))}
          {!store.getActiveScene()?.vsGraphs?.length&&<p style={{fontSize:11,color:T.text600,textAlign:"center",marginTop:20}}>لا يوجد scripts</p>}
        </div>
      )}

      {/* Console */}
      {ui.activePanel==="console"&&(
        <div style={{flex:1,overflow:"auto",fontFamily:"monospace"}}>
          <div style={{padding:"4px 8px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:T.text400,fontSize:10}}>Console ({ui.consoleMessages.length})</span>
            <button onClick={store.clearConsole} style={{background:"none",border:"none",color:T.text600,cursor:"pointer",fontSize:9}}>مسح</button>
          </div>
          {!ui.consoleMessages.length&&<p style={{color:T.text600,padding:"12px 8px",fontSize:10}}>لا رسائل</p>}
          {[...ui.consoleMessages].reverse().map(msg=>(
            <div key={msg.id} style={{padding:"3px 8px",borderBottom:`1px solid ${T.border}22`,color:msg.level==="error"?T.red:msg.level==="warn"?T.yellow:T.text400,fontSize:10}}>
              [{msg.level.toUpperCase()}] {msg.message}
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      {ui.activePanel==="settings"&&(
        <div style={{flex:1,overflow:"auto",padding:10}}>
          <CompField label="عرض اللعبة"><NumInput value={project?.engineData.settings.screenWidth||1920} onChange={v=>store.patchEngineData({settings:{...store.project!.engineData.settings,screenWidth:v}})} step={32}/></CompField>
          <CompField label="ارتفاع اللعبة"><NumInput value={project?.engineData.settings.screenHeight||1080} onChange={v=>store.patchEngineData({settings:{...store.project!.engineData.settings,screenHeight:v}})} step={32}/></CompField>
          <CompField label="الجاذبية"><NumInput value={project?.engineData.settings.gravity||9.8} onChange={v=>store.patchEngineData({settings:{...store.project!.engineData.settings,gravity:v}})} step={0.1}/></CompField>
          <CompField label="FPS"><NumInput value={project?.engineData.settings.targetFPS||60} onChange={v=>store.patchEngineData({settings:{...store.project!.engineData.settings,targetFPS:v}})} step={1} min={1} max={120}/></CompField>
          <SelectField label="الفيزياء" value={project?.engineData.settings.physics||"arcade"} options={[{v:"arcade",l:"Arcade"},{v:"box2d",l:"Box2D"},{v:"none",l:"بدون"}]} onChange={v=>store.patchEngineData({settings:{...store.project!.engineData.settings,physics:v as "arcade"|"box2d"|"none"}})}/>
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
  const {project,ui} = store;
  const router = useRouter();
  const tools: {id:EditorTool;icon:React.ReactNode;tip:string;key:string}[] = [
    {id:"select",icon:<MousePointer2 size={13}/>,tip:"تحديد",key:"V"},
    {id:"move",  icon:<Move size={13}/>,         tip:"تحريك",key:"G"},
    {id:"add",   icon:<Plus size={13}/>,          tip:"إضافة",key:"A"},
    {id:"erase", icon:<Trash2 size={13}/>,        tip:"حذف",  key:"D"},
    {id:"pan",   icon:<Maximize2 size={13}/>,     tip:"تحريك العرض",key:"H"},
  ];
  const div = (m="0 3px") => <div style={{width:1,height:20,background:T.border,margin:m,flexShrink:0}}/>;
  return (
    <div style={{height:46,background:T.bgPanel,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:2,padding:"0 8px",flexShrink:0,boxShadow:"0 1px 0 rgba(0,0,0,0.3)"}}>
      {/* Logo */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginRight:4}}>
        <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Gamepad2 size={15} color="#fff"/>
        </div>
        <span style={{fontSize:12,fontWeight:800,color:T.text100,letterSpacing:"-0.3px"}}>يالا<span style={{color:T.accent}}>Editor</span></span>
      </div>
      {div()}
      {/* Project name */}
      <input value={project?.title||""} onChange={e=>store.setProjectTitle(e.target.value)}
        style={{background:"transparent",border:"none",outline:"none",color:T.text200,fontSize:12,fontWeight:600,width:140,fontFamily:"var(--font-cairo)",borderBottom:`1px solid transparent`}}
        placeholder="اسم المشروع..."
        onFocus={e=>e.currentTarget.style.borderBottomColor=T.accent}
        onBlur={e=>e.currentTarget.style.borderBottomColor="transparent"}/>
      {ui.isDirty&&<div style={{width:5,height:5,borderRadius:"50%",background:T.yellow,flexShrink:0,marginLeft:2}}/>}
      <div style={{flex:1}}/>
      {/* Tool group */}
      <div style={{display:"flex",gap:1,background:T.bgBase,borderRadius:8,padding:"2px",border:`1px solid ${T.border}`}}>
        {tools.map(t=>(
          <button key={t.id} title={`${t.tip} (${t.key})`} onClick={()=>store.setTool(t.id)}
            style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"none",
              borderRadius:6,background:ui.activeTool===t.id?"linear-gradient(135deg,rgba(124,58,237,0.3),rgba(37,99,235,0.2))":"transparent",
              color:ui.activeTool===t.id?T.accent:T.text400,flexShrink:0,position:"relative"}}>
            {t.icon}
            {ui.activeTool===t.id&&(
              <span style={{position:"absolute",bottom:1,right:2,fontSize:6,color:T.accent,fontFamily:"monospace",lineHeight:1}}>{t.key}</span>
            )}
          </button>
        ))}
      </div>
      {div()}
      {/* Undo/Redo */}
      <button onClick={store.undo} disabled={!store.canUndo()} title="Undo (Ctrl+Z)" style={iBtn(false)}><Undo2 size={13}/></button>
      <button onClick={store.redo} disabled={!store.canRedo()} title="Redo (Ctrl+Y)" style={iBtn(false)}><Redo2 size={13}/></button>
      {div()}
      {/* Grid & Snap */}
      <button title="شبكة (G)" onClick={store.toggleGrid} style={iBtn(ui.showGrid,T.teal)}><Grid3X3 size={13}/></button>
      <button title="Snap to Grid" onClick={store.toggleSnapToGrid} style={iBtn(ui.snapToGrid,T.teal)}><Crosshair size={13}/></button>
      {div()}
      {/* Zoom */}
      <button onClick={()=>store.setZoom(ui.zoom-0.25)} style={iBtn(false)}><ZoomOut size={13}/></button>
      <span style={{fontSize:10,color:T.text400,minWidth:34,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{Math.round(ui.zoom*100)}%</span>
      <button onClick={()=>store.setZoom(ui.zoom+0.25)} style={iBtn(false)}><ZoomIn size={13}/></button>
      {div()}
      {/* Save */}
      <button onClick={store.saveProject} disabled={ui.isSaving||!ui.isDirty}
        style={{background:ui.isDirty?"linear-gradient(135deg,rgba(124,58,237,0.25),rgba(37,99,235,0.15))":"transparent",
          border:`1px solid ${ui.isDirty?T.accent:T.border}`,borderRadius:7,
          color:ui.isDirty?T.accent:T.text600,padding:"0 10px",height:28,fontSize:11,fontWeight:600,
          display:"flex",alignItems:"center",gap:5,cursor:ui.isDirty?"pointer":"default",fontFamily:"var(--font-cairo)",flexShrink:0}}>
        {ui.isSaving?<Loader2 size={12} style={{animation:"spin 1s linear infinite"}}/>:<Save size={12}/>}
        {ui.isSaving?"جاري الحفظ...":"حفظ"}
      </button>
      {div()}
      {/* Play controls */}
      <div style={{display:"flex",gap:2,background:T.bgBase,borderRadius:8,padding:"2px",border:`1px solid ${T.border}`}}>
        <button onClick={()=>store.setPlaying(!ui.isPlaying)}
          style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"none",
            borderRadius:6,background:ui.isPlaying?"rgba(239,68,68,0.2)":"rgba(34,197,94,0.15)",
            color:ui.isPlaying?T.red:T.green,flexShrink:0}}>
          {ui.isPlaying?<Square size={13}/>:<Play size={13}/>}
        </button>
        {ui.isPlaying&&(
          <button onClick={()=>store.setPaused(!ui.isPaused)}
            style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"none",
              borderRadius:6,background:ui.isPaused?"rgba(245,158,11,0.2)":"transparent",
              color:ui.isPaused?T.yellow:T.text400,flexShrink:0}}>
            <Pause size={13}/>
          </button>
        )}
      </div>
      {div()}
      {/* AI + Dashboard */}
      <button onClick={store.toggleAiChat}
        style={{background:ui.aiChatOpen?"linear-gradient(135deg,rgba(124,58,237,0.25),rgba(37,99,235,0.15))":"transparent",
          border:`1px solid ${ui.aiChatOpen?T.accent:T.border}`,borderRadius:7,
          color:ui.aiChatOpen?T.accent:T.text400,padding:"0 10px",height:28,fontSize:11,
          display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontFamily:"var(--font-cairo)",flexShrink:0}}>
        <Sparkles size={12}/> AI
      </button>
      <button onClick={()=>router.push("/admin")}
        style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:7,
          color:T.text600,padding:"0 8px",height:28,
          display:"flex",alignItems:"center",cursor:"pointer",flexShrink:0}}
        title="Dashboard">
        <LayoutDashboard size={13}/>
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  AI CHAT
// ════════════════════════════════════════════════════════════
function AiChat() {
  const store = useEditorStore();
  const {ui,aiMessages,project} = store;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[aiMessages]);

  async function send() {
    if(!input.trim()||loading||!project) return;
    const msg={id:`m${Date.now()}`,role:"user" as const,content:input.trim(),timestamp:Date.now()};
    store.addAiMessage(msg); setInput(""); setLoading(true);
    try {
      const res=await fetch("/api/editor/ai/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg.content,engineData:project.engineData,history:aiMessages.slice(-6)})});
      const data=await res.json();
      store.addAiMessage({id:`m${Date.now()+1}`,role:"assistant",content:data.message||"تم",timestamp:Date.now(),patch:data.patch});
      if(data.patch) store.applyAiPatch(data.patch);
    } catch { store.addAiMessage({id:`merr${Date.now()}`,role:"assistant",content:"حدث خطأ.",timestamp:Date.now()}); }
    finally { setLoading(false); }
  }

  return (
    <AnimatePresence>
      {ui.aiChatOpen&&(
        <motion.div initial={{width:0,opacity:0}} animate={{width:270,opacity:1}} exit={{width:0,opacity:0}}
          style={{background:T.bgPanel,borderLeft:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
          <div style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:6}}>
            <Sparkles size={13} style={{color:T.accent}}/>
            <span style={{fontSize:12,fontWeight:700,color:T.text100,flex:1}}>AI Assistant</span>
            <button onClick={store.toggleAiChat} style={{background:"none",border:"none",color:T.text400,cursor:"pointer",display:"flex"}}><X size={13}/></button>
          </div>
          <div style={{flex:1,overflow:"auto",padding:10,display:"flex",flexDirection:"column",gap:7}}>
            {!aiMessages.length&&(
              <div style={{textAlign:"center",marginTop:16}}>
                <Sparkles size={22} style={{color:T.accent,opacity:0.3,marginBottom:8}}/>
                <p style={{fontSize:11,color:T.text600,marginBottom:10}}>قول لي عايز تعمل إيه</p>
                {["ضيف لاعب مع جاذبية","اصنع مشهد platformer","اعمل منصات متحركة"].map(s=>(
                  <button key={s} onClick={()=>setInput(s)} style={{display:"block",width:"100%",marginBottom:5,background:T.accentSoft,border:`1px solid ${T.accent}`,borderRadius:6,color:T.accent,padding:"6px 8px",fontSize:10,cursor:"pointer",fontFamily:"var(--font-cairo)",textAlign:"right"}}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {aiMessages.map(m=>(
              <div key={m.id} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"88%",background:m.role==="user"?T.accent:T.bgCard,borderRadius:m.role==="user"?"10px 10px 3px 10px":"10px 10px 10px 3px",padding:"7px 10px",fontSize:11,color:m.role==="user"?"#fff":T.text200,lineHeight:1.5,border:m.role==="assistant"?`1px solid ${T.border}`:"none"}}>
                {m.content}
                {m.patch&&<div style={{fontSize:9,color:"rgba(255,255,255,0.5)",marginTop:3,borderTop:"1px solid rgba(255,255,255,0.15)",paddingTop:3}}>✓ تم التطبيق</div>}
              </div>
            ))}
            {loading&&<div style={{alignSelf:"flex-start",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:"10px 10px 10px 3px",padding:"8px 12px"}}><Loader2 size={13} style={{color:T.accent,animation:"spin 1s linear infinite"}}/></div>}
            <div ref={bottomRef}/>
          </div>
          <div style={{padding:8,borderTop:`1px solid ${T.border}`,display:"flex",gap:6}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="اكتب طلبك..." disabled={loading} style={{...inputSty,flex:1}}/>
            <button onClick={send} disabled={loading||!input.trim()} style={{background:T.accent,border:"none",borderRadius:5,color:"#fff",width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",opacity:loading||!input.trim()?0.5:1}}>
              <Sparkles size={12}/>
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
function NewProjectModal({ onClose }: { onClose:()=>void }) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<"platformer"|"topdown"|"puzzle"|"rpg">("platformer");
  const cats = [
    {id:"platformer" as const,label:"منصات",icon:"🏃",desc:"ماريو ستايل"},
    {id:"topdown"    as const,label:"فوق-تحت",icon:"🗺️",desc:"Zelda ستايل"},
    {id:"puzzle"     as const,label:"ألغاز",icon:"🧩",desc:"حل المشاكل"},
    {id:"rpg"        as const,label:"أدوار",icon:"⚔️",desc:"قصة ومغامرة"},
  ];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}
        style={{background:T.bgCard,border:`1px solid ${T.borderMd}`,borderRadius:14,padding:28,width:370,maxWidth:"90vw"}}>
        <h2 style={{fontSize:16,fontWeight:800,color:T.text100,marginBottom:18}}>مشروع جديد</h2>
        <label style={labelSty}>اسم اللعبة</label>
        <input value={title} onChange={e=>setTitle(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&title.trim()&&(useEditorStore.getState().createNewProject(title.trim(),cat),onClose())}
          placeholder="اسم لعبتك..." autoFocus style={{...inputSty,marginBottom:16,fontSize:13,padding:"7px 10px"}}/>
        <label style={labelSty}>نوع اللعبة</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:20}}>
          {cats.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)}
              style={{background:cat===c.id?T.accentSoft:T.bgPanel,border:`1.5px solid ${cat===c.id?T.accent:T.border}`,borderRadius:9,padding:"10px 6px",cursor:"pointer",textAlign:"center" as const}}>
              <div style={{fontSize:20,marginBottom:3}}>{c.icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:T.text100,fontFamily:"var(--font-cairo)"}}>{c.label}</div>
              <div style={{fontSize:9,color:T.text400,fontFamily:"var(--font-cairo)"}}>{c.desc}</div>
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,background:T.bgPanel,border:`1px solid ${T.border}`,borderRadius:9,color:T.text400,padding:"9px 0",cursor:"pointer",fontFamily:"var(--font-cairo)",fontSize:13}}>إلغاء</button>
          <button onClick={()=>{if(!title.trim())return;useEditorStore.getState().createNewProject(title.trim(),cat);onClose();}} disabled={!title.trim()}
            style={{flex:2,background:title.trim()?T.accent:T.bgPanel,border:"none",borderRadius:9,color:"#fff",padding:"9px 0",cursor:title.trim()?"pointer":"not-allowed",fontFamily:"var(--font-cairo)",fontSize:13,fontWeight:700,opacity:title.trim()?1:0.5}}>
            ✨ إنشاء
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  STATUS BAR
// ════════════════════════════════════════════════════════════
function StatusBar() {
  const store = useEditorStore();
  const { ui } = store;
  const scene   = store.getActiveScene();
  const selObj  = store.getSelectedObject();
  const objCount = scene?.objects?.length ?? 0;

  return (
    <div style={{
      height: 22, flexShrink: 0,
      background: T.bgBase, borderTop: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", gap: 0,
      padding: "0 10px", fontSize: 10, color: T.text600,
      fontFamily: "monospace", userSelect: "none",
    }}>
      {/* Tool */}
      <span style={{ color: T.accent, marginRight: 10 }}>
        {ui.activeTool === "select" ? "▣ تحديد"
         : ui.activeTool === "move"  ? "✥ تحريك"
         : ui.activeTool === "add"   ? "✚ إضافة"
         : ui.activeTool === "erase" ? "✖ حذف"
         : ui.activeTool === "pan"   ? "✋ تحريك عرض"
         : ui.activeTool}
      </span>
      <span style={{ width: 1, height: 12, background: T.border, margin: "0 8px" }}/>
      {/* Objects count */}
      <span>{objCount} كائن</span>
      <span style={{ width: 1, height: 12, background: T.border, margin: "0 8px" }}/>
      {/* Selected object */}
      {selObj ? (
        <span style={{ color: T.text400 }}>
          ◈ {selObj.name}
          <span style={{ color: T.text600, marginLeft: 6 }}>
            ({Math.round(selObj.x)}, {Math.round(selObj.y)})
          </span>
          <span style={{ color: T.text600, marginLeft: 6 }}>
            {selObj.width}×{selObj.height}
          </span>
        </span>
      ) : (
        <span>لا يوجد تحديد</span>
      )}
      <div style={{ flex: 1 }}/>
      {/* Zoom */}
      <span style={{ color: T.text400 }}>zoom {Math.round(ui.zoom * 100)}%</span>
      <span style={{ width: 1, height: 12, background: T.border, margin: "0 8px" }}/>
      {/* Grid indicators */}
      {ui.showGrid && <span style={{ color: T.teal }}>⊞ grid</span>}
      {ui.snapToGrid && <span style={{ color: T.teal, marginLeft: 6 }}>⌖ snap</span>}
      <span style={{ width: 1, height: 12, background: T.border, margin: "0 8px" }}/>
      {/* Scene */}
      <span style={{ color: T.text600 }}>{scene?.name ?? "—"}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN EDITOR
// ════════════════════════════════════════════════════════════
function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useEditorStore();
  const {project,isLoaded} = store;
  const [showNew, setShowNew] = useState(false);
  const [loadErr, setLoadErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<"loading"|"ok"|"unauth">("loading");
  const projectId = searchParams.get("id");
  const activeVSGraph = store.ui.selectedVSGraphId ? store.getVSGraph(store.ui.selectedVSGraphId) : null;

  // Auth
  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>setAuthStatus(d.user?"ok":"unauth")).catch(()=>setAuthStatus("unauth"));
  },[]);
  useEffect(()=>{ if(authStatus==="unauth") router.push("/auth/login"); },[authStatus]);

  // Keyboard
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      const s=useEditorStore.getState();
      if(e.ctrlKey||e.metaKey){
        if(e.key==="z"&&!e.shiftKey){e.preventDefault();s.undo();}
        if(e.key==="z"&&e.shiftKey){e.preventDefault();s.redo();}
        if(e.key==="y"){e.preventDefault();s.redo();}
        if(e.key==="s"){e.preventDefault();s.saveProject();}
        if(e.key==="d"&&s.ui.selectedObjectId){e.preventDefault();s.duplicateObject(s.ui.selectedObjectId);}
      }
      const tag=(e.target as HTMLElement).tagName;
      if(tag==="INPUT"||tag==="TEXTAREA") return;
      if(e.key==="v") s.setTool("select");
      if(e.key==="g") s.setTool("move");
      if(e.key==="a") s.setTool("add");
      if(e.key==="d") s.setTool("erase");
      if(e.key==="h") s.setTool("pan");
      if(e.key==="Escape") s.clearSelection();
      if((e.key==="Delete"||e.key==="Backspace")&&s.ui.selectedObjectIds.length>0){
        if(s.ui.selectedObjectIds.length>1) s.removeObjects(s.ui.selectedObjectIds);
        else if(s.ui.selectedObjectId) s.removeObject(s.ui.selectedObjectId);
      }
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[]);

  // Load from URL
  useEffect(()=>{
    if(!projectId||isLoaded) return;
    setLoading(true);
    fetch(`/api/editor/projects/${projectId}`).then(r=>r.json())
      .then(d=>{ if(d.error) throw new Error(d.error); store.loadProject(d); })
      .catch(e=>setLoadErr(e.message)).finally(()=>setLoading(false));
  },[projectId,isLoaded]);

  if(authStatus==="loading"||loading) return (
    <div style={{minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bgBase}}>
      <Loader2 size={28} style={{color:T.accent,animation:"spin 1s linear infinite"}}/>
    </div>
  );

  if(loadErr) return (
    <div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.bgBase,gap:12}}>
      <AlertCircle size={28} style={{color:T.red}}/>
      <p style={{color:T.text100}}>{loadErr}</p>
      <button onClick={()=>router.push("/editor")} style={{background:T.accent,border:"none",borderRadius:8,color:"#fff",padding:"8px 20px",cursor:"pointer",fontFamily:"var(--font-cairo)"}}>العودة</button>
    </div>
  );

  if(!isLoaded||!project) return (
    <div style={{minHeight:"100dvh",background:T.bgBase,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} style={{textAlign:"center",maxWidth:480,padding:"0 24px"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:24}}>
          <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 32px rgba(124,58,237,0.4)"}}>
            <Gamepad2 size={26} color="#fff"/>
          </div>
          <div style={{textAlign:"right"}}>
            <h1 style={{fontSize:24,fontWeight:900,color:T.text100,margin:0,fontFamily:"var(--font-cairo)"}}>يالا Editor</h1>
            <p style={{color:T.text400,fontSize:12,margin:0,fontFamily:"var(--font-cairo)"}}>محرك ألعاب عربي بالـ AI</p>
          </div>
        </div>
        {/* Feature chips */}
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:28}}>
          {["🎮 Component System","🔮 Visual Scripting","🌍 3D Canvas","🤖 AI Assistant"].map(f=>(
            <span key={f} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 10px",fontSize:10,color:T.text400,fontFamily:"var(--font-cairo)"}}>{f}</span>
          ))}
        </div>
        <button onClick={()=>setShowNew(true)} style={{background:"linear-gradient(135deg,#7c3aed,#2563eb)",border:"none",borderRadius:12,color:"#fff",padding:"13px 32px",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"var(--font-cairo)",margin:"0 auto",boxShadow:"0 8px 28px rgba(124,58,237,0.35)"}}>
          <Plus size={18}/> مشروع جديد
        </button>
        <p style={{color:T.text600,fontSize:11,marginTop:16,fontFamily:"var(--font-cairo)"}}>أو افتح مشروعاً موجوداً من الـ Dashboard</p>
      </motion.div>
      {showNew&&<NewProjectModal onClose={()=>setShowNew(false)}/>}
    </div>
  );

  return (
    <div style={{height:"100dvh",display:"flex",flexDirection:"column",background:T.bgBase,overflow:"hidden",fontFamily:"var(--font-cairo)"}}>
      <Toolbar/>
      <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>
        <HierarchyPanel/>
        <div style={{flex:1,position:"relative",overflow:"hidden",minHeight:0,display:"flex",flexDirection:"column"}}>
          <Canvas3D/>
          {activeVSGraph&&<VisualScriptingEditor graph={activeVSGraph} onClose={()=>store.selectVSGraph(null)}/>}
          <AnimatePresence>
            {store.ui.isPlaying&&(
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",background:"rgba(34,197,94,0.15)",border:`1px solid ${T.green}`,borderRadius:20,padding:"4px 14px",display:"flex",alignItems:"center",gap:6,zIndex:30}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:T.green,animation:"pulse 1s infinite"}}/>
                <span style={{fontSize:11,color:T.green,fontFamily:"var(--font-cairo)"}}>{store.ui.isPaused?"⏸ متوقف":"▶ تشغيل"}</span>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Status Bar */}
          <StatusBar/>
        </div>
        <InspectorPanel/>
        <AiChat/>
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        input[type=number]::-webkit-inner-spin-button{opacity:0.4}
        input:focus{border-color:${T.accent}!important;outline:none}
        select{color-scheme:dark}
        button{transition:opacity .12s,background .12s,color .12s,border-color .12s,box-shadow .12s}
        button:disabled{opacity:0.35!important;cursor:not-allowed!important}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        ::-webkit-scrollbar-thumb:hover{background:${T.borderMd}}
        *{box-sizing:border-box}
        ::selection{background:rgba(124,58,237,0.35);color:#fff}
      `}</style>
    </div>
  );
}

export default function EditorPage() {
  return (
    <React.Suspense fallback={<div style={{height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"#07090f"}}><Loader2 size={32} style={{color:"#7c3aed",animation:"spin 1s linear infinite"}}/></div>}>
      <EditorContent/>
    </React.Suspense>
  );
}
