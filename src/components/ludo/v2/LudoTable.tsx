"use client";
import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { LudoGame } from "@/lib/ludo/game";
import type { Color, PlayerId } from "@/lib/ludo/game";

// ── ألوان ────────────────────────────────────────────────────────────────────
const C: Record<Color, { main: string; light: string; dark: string }> = {
  red:    { main:"#ef4444", light:"#fca5a5", dark:"#991b1b" },
  yellow: { main:"#eab308", light:"#fde68a", dark:"#854d0e" },
  green:  { main:"#22c55e", light:"#86efac", dark:"#166534" },
  blue:   { main:"#3b82f6", light:"#93c5fd", dark:"#1e40af" },
};
const PCOLORS: Record<string, Color> = { player:"red", ai1:"yellow", ai2:"green", ai3:"blue" };
const PLABELS: Record<string, string> = { player:"أنت", ai1:"Bot 1", ai2:"Bot 2", ai3:"Bot 3" };
const PLAYERS = ["player","ai1","ai2","ai3"] as const;

// ── خريطة البورد 15×15 ───────────────────────────────────────────────────────
const TRACK: [number,number][] = [
  [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
  [7,0],[8,0],
  [8,1],[8,2],[8,3],[8,4],[8,5],
  [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
  [14,7],[14,8],
  [13,8],[12,8],[11,8],[10,8],[9,8],
  [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
  [7,14],[6,14],
  [6,13],[6,12],[6,11],[6,10],[6,9],
  [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
  [0,7],[0,6],
  [1,6],[2,6],[3,6],[4,6],[5,6],
];
const HOME_TRACK: Record<Color,[number,number][]> = {
  red:   [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  yellow:[[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
  blue:  [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  green: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
};
const YARD_POS: Record<Color,[number,number][]> = {
  red:   [[1.5,1.5],[3.5,1.5],[1.5,3.5],[3.5,3.5]],
  yellow:[[11.5,1.5],[13.5,1.5],[11.5,3.5],[13.5,3.5]],
  green: [[1.5,11.5],[3.5,11.5],[1.5,13.5],[3.5,13.5]],
  blue:  [[11.5,11.5],[13.5,11.5],[11.5,13.5],[13.5,13.5]],
};
const SAFE = new Set([0,8,13,21,26,34,39,47]);

// ── الخلايا الملونة في ممرات البيت (home corridors) ─────────────────────────
// red corridor:    col 6, rows 1-5  (يطلع فوق)
// yellow corridor: col 8, rows 1-5  (يطلع فوق)
// green corridor:  row 6, cols 1-5  (يمشي يسار)
// blue corridor:   row 8, cols 9-13 (يمشي يمين)
// وكمان:
// red corridor bottom:    col 6, rows 9-13
// yellow corridor bottom: col 8, rows 9-13
// green corridor top:     row 6, cols 1-5  (نفس فوق)
// blue corridor top:      row 8, cols 1-5  (يسار)
const HOME_CORRIDORS: { col?: number; row?: number; cells: number[]; color: Color }[] = [
  { col: 6, cells: [1,2,3,4,5], color: "red" },        // red goes up col 6
  { col: 8, cells: [1,2,3,4,5], color: "yellow" },     // yellow goes up col 8
  { row: 6, cells: [1,2,3,4,5], color: "green" },      // green goes left row 6
  { row: 8, cells: [9,10,11,12,13], color: "blue" },   // blue goes right row 8
  { col: 6, cells: [9,10,11,12,13], color: "red" },    // red goes down col 6
  { col: 8, cells: [9,10,11,12,13], color: "yellow" }, // yellow goes down col 8
  { row: 6, cells: [9,10,11,12,13], color: "blue" },   // blue goes right row 6
  { row: 8, cells: [1,2,3,4,5], color: "green" },      // green goes left row 8
];

// ── موضع مركز البيدق ─────────────────────────────────────────────────────────
function getCenter(g: LudoGame, pid: string, ti: number): [number,number]|null {
  const color = PCOLORS[pid];
  const tok = (g.tokens as any)[pid]?.[ti];
  if (!tok) return null;
  if (tok.pos.kind==="yard")  {
    const p = YARD_POS[color][ti];
    return p ?? null;
  }
  if (tok.pos.kind==="track") {
    const cell = TRACK[tok.pos.index % 52];
    return cell ? [cell[0]+.5, cell[1]+.5] : null;
  }
  if (tok.pos.kind==="home") {
    const cell = HOME_TRACK[color][Math.min(5, tok.pos.count-1)];
    return cell ? [cell[0]+.5, cell[1]+.5] : null;
  }
  return null;
}
function isFinished(g: LudoGame, pid: string, ti: number) {
  const tok = (g.tokens as any)[pid]?.[ti];
  return tok?.pos?.kind==="home" && tok.pos.count>=6;
}

function getTargetCenter(g: LudoGame, pid: string, ti: number): [number,number]|null {
  const legal = g.legalMoves(pid as any);
  const mv = legal.find(m => m.idx === ti);
  if (!mv) return null;
  const color = PCOLORS[pid];
  const to = mv.to;
  if (to.kind==="track") {
    const cell = TRACK[to.index % 52];
    return cell ? [cell[0]+.5, cell[1]+.5] : null;
  }
  if (to.kind==="home") {
    const cell = HOME_TRACK[color][Math.min(5, to.count-1)];
    return cell ? [cell[0]+.5, cell[1]+.5] : null;
  }
  return null;
}

// ── نرد ──────────────────────────────────────────────────────────────────────
const DOTS: Record<number,[number,number][]> = {
  1:[[.5,.5]],
  2:[[.28,.28],[.72,.72]],
  3:[[.28,.28],[.5,.5],[.72,.72]],
  4:[[.28,.28],[.72,.28],[.28,.72],[.72,.72]],
  5:[[.28,.28],[.72,.28],[.5,.5],[.28,.72],[.72,.72]],
  6:[[.28,.2],[.72,.2],[.28,.5],[.72,.5],[.28,.8],[.72,.8]],
};
function Dice({ val, canRoll, rolling, onClick }: {
  val:number|null; canRoll:boolean; rolling:boolean; onClick:()=>void;
}) {
  return (
    <motion.button onClick={canRoll?onClick:undefined}
      whileTap={canRoll?{scale:.88}:{}}
      animate={rolling?{rotate:[0,15,-15,10,-10,0]}:{}}
      transition={{duration:.35}}
      style={{width:60,height:60,borderRadius:14,border:"none",flexShrink:0,
        background:canRoll?"#ffffff":"rgba(255,255,255,.07)",
        boxShadow:canRoll?"0 6px 22px rgba(0,0,0,.55)":"none",
        cursor:canRoll?"pointer":"default",
        display:"flex",alignItems:"center",justifyContent:"center"}}>
      {val?(
        <svg width="40" height="40" viewBox="0 0 1 1">
          {(DOTS[val]||[]).map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r=".1" fill="#1e1b2e"/>
          ))}
        </svg>
      ):(
        <span style={{fontSize:26,opacity:canRoll?.9:.22}}>🎲</span>
      )}
    </motion.button>
  );
}

// ── بيدق SVG ─────────────────────────────────────────────────────────────────
function Pawn({ cx, cy, color, glowing, onClick, onMouseEnter, onMouseLeave, small=false }: {
  cx:number; cy:number; color:Color; glowing:boolean;
  onClick?:()=>void; onMouseEnter?:()=>void; onMouseLeave?:()=>void; small?:boolean;
}) {
  const r = small ? .22 : .32;
  const cs = C[color];
  return (
    <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{cursor:onClick?"pointer":"default"}}>
      {glowing && (
        <circle cx={cx} cy={cy} r={r*2.0} fill={cs.main} opacity={.18}>
          <animate attributeName="r" values={`${r*1.6};${r*2.2};${r*1.6}`} dur=".8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values=".1;.3;.1" dur=".8s" repeatCount="indefinite"/>
        </circle>
      )}
      <ellipse cx={cx} cy={cy+r*.35} rx={r*.75} ry={r*.22} fill={cs.dark} opacity={.35}/>
      <circle cx={cx} cy={cy} r={r} fill={cs.main}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={cs.dark} strokeWidth={r*.14}/>
      <circle cx={cx-r*.27} cy={cy-r*.28} r={r*.27} fill="rgba(255,255,255,.45)"/>
    </g>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export interface LudoTableProps { onLeave?:()=>void; botThinkMs?:number; }

export default function LudoTable({ onLeave, botThinkMs=1100 }: LudoTableProps) {
  const gameRef = useRef<LudoGame>(new LudoGame());
  const [tick, setTick]             = useState(0);
  const [phase, setPhase]           = useState<"splash"|"game"|"ended">("splash");
  const [diceVal, setDiceVal]       = useState<number|null>(null);
  const [rolling, setRolling]       = useState(false);
  const [validToks, setValidToks]   = useState<number[]>([]);
  const [previewPos, setPreviewPos] = useState<[number,number]|null>(null);
  const [winner, setWinner]         = useState<string|null>(null);
  const [msg, setMsg]               = useState("");
  const [aiOn, setAiOn]             = useState(false);
  const aiRef = useRef(false);
  const g = gameRef.current;
  const sync = useCallback(() => setTick(t=>t+1), []);

  function flash(t:string){ setMsg(t); setTimeout(()=>setMsg(""),2200); }
  function countYard(pid:PlayerId){ return g.tokens[pid].filter(t=>t.pos.kind==="yard").length; }

  function startGame(){
    gameRef.current = new LudoGame();
    setDiceVal(null); setValidToks([]); setWinner(null); setPreviewPos(null);
    aiRef.current=false; setAiOn(false); setPhase("game"); sync();
  }

  async function runAI(){
    if(aiRef.current) return;
    aiRef.current=true;
    let safety=0;
    while(gameRef.current.turn!=="player" && safety<20){
      safety++;
      const gc=gameRef.current;
      setAiOn(true);
      await new Promise(r=>setTimeout(r, botThinkMs+Math.random()*200));
      const d=gc.roll(); setDiceVal(d);
      await new Promise(r=>setTimeout(r,320));
      const yb=countYard("player");
      gc.aiPlay();
      if(countYard("player")>yb) flash("💥 بيدقك اتأكل!");
      const st=gc.status();
      if(st.ended){
        setWinner(st.winner??"ai1"); setPhase("ended");
        aiRef.current=false; setAiOn(false); setDiceVal(null); setTick(t=>t+1); return;
      }
      setDiceVal(null); setTick(t=>t+1);
      await new Promise(r=>setTimeout(r,200));
    }
    aiRef.current=false; setAiOn(false);
  }

  async function roll(){
    if(rolling||aiOn||g.turn!=="player"||diceVal!==null) return;
    setRolling(true);
    let n=0;
    const iv=setInterval(()=>{
      setDiceVal(Math.floor(Math.random()*6)+1); n++;
      if(n>=8){
        clearInterval(iv);
        const f=g.roll(); setDiceVal(f); setRolling(false);
        const legal=g.legalMoves("player");
        const idxs=Array.from(new Set(legal.map(m=>m.idx)));
        setValidToks(idxs);
        if(idxs.length===0){
          flash(`🎲 ${f} — مفيش حركة!`);
          setTimeout(()=>{ g.passTurn(); setDiceVal(null); setValidToks([]); sync(); runAI(); },900);
        } else if(idxs.length===1){
          setTimeout(()=>moveTok(idxs[0]),350);
        }
      }
    },60);
  }

  function moveTok(ti:number){
    const d=g.dice; if(!d) return;
    const prev=g.turn;
    if(!g.move("player",ti)) return;
    setDiceVal(null); setValidToks([]); setPreviewPos(null);
    const st=g.status();
    if(st.ended){ setWinner(st.winner??"player"); setPhase("ended"); sync(); return; }
    if(d===6 && g.turn===prev){ flash("🎲 6! العب تاني!"); sync(); return; }
    sync();
    if(g.turn!=="player") runAI();
  }

  const cur = g.turn as string;
  const isMyTurn = cur==="player";
  const canRoll = isMyTurn && diceVal===null && !rolling && !aiOn && phase==="game";

  // ── SPLASH ─────────────────────────────────────────────────────────────────
  if(phase==="splash") return (
    <div style={{position:"fixed",inset:0,background:"linear-gradient(160deg,#0d0d1a,#111827)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      fontFamily:"var(--font-cairo,sans-serif)",color:"#f4f4f8",padding:24,gap:20}}>
      <div style={{display:"flex",gap:14,marginBottom:4}}>
        {(["red","yellow","green","blue"] as Color[]).map((c,i)=>(
          <motion.div key={c} initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:i*.1,type:"spring"}}>
            <svg width="50" height="50" viewBox="-1 -1 2 2.4">
              <ellipse cx={0} cy={.52} rx={.78} ry={.25} fill={C[c].dark} opacity={.4}/>
              <circle cx={0} cy={0} r={.82} fill={C[c].main}/>
              <circle cx={0} cy={0} r={.82} fill="none" stroke={C[c].dark} strokeWidth={.12}/>
              <circle cx={-.26} cy={-.3} r={.26} fill="rgba(255,255,255,.45)"/>
            </svg>
          </motion.div>
        ))}
      </div>
      <motion.h1 initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}}
        style={{fontSize:"clamp(36px,8vw,56px)",fontWeight:900,margin:0}}>لودو</motion.h1>
      <p style={{color:"rgba(255,255,255,.4)",fontSize:14,margin:0}}>العب ضد 3 بوتات ذكاء اصطناعي</p>
      <motion.button onClick={startGame} whileHover={{scale:1.05}} whileTap={{scale:.95}}
        style={{marginTop:8,padding:"14px 52px",borderRadius:16,border:"none",
          background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",
          fontWeight:800,fontSize:18,cursor:"pointer",fontFamily:"inherit",
          boxShadow:"0 8px 28px rgba(99,102,241,.45)"}}>
        ابدأ اللعبة ▶
      </motion.button>
      {onLeave&&<button onClick={onLeave} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← رجوع</button>}
    </div>
  );

  // ── ENDED ──────────────────────────────────────────────────────────────────
  if(phase==="ended"){
    const wc=winner?PCOLORS[winner]:"red";
    const won=winner==="player";
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",backdropFilter:"blur(10px)",
        display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-cairo,sans-serif)"}}>
        <motion.div initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}}
          style={{background:"#111",borderRadius:24,padding:"36px 28px",textAlign:"center",
            border:`2px solid ${C[wc].main}40`,maxWidth:320,width:"90%"}}>
          <div style={{fontSize:64,marginBottom:12}}>{won?"🏆":"😔"}</div>
          <h2 style={{fontWeight:900,fontSize:26,color:C[wc].main,margin:"0 0 8px"}}>
            {won?"انتصرت! 🎉":`فاز ${PLABELS[winner??""]} 🤖`}
          </h2>
          <p style={{color:"rgba(255,255,255,.4)",fontSize:13,marginBottom:28}}>
            {won?"أداء رائع!":"حظ أوفر المرة الجاية 💪"}
          </p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setPhase("splash")} style={{flex:1,padding:12,borderRadius:12,
              background:"rgba(255,255,255,.06)",color:"rgba(255,255,255,.5)",
              border:"1px solid rgba(255,255,255,.1)",cursor:"pointer",fontFamily:"inherit",fontSize:14}}>
              الرئيسية
            </button>
            <button onClick={startGame} style={{flex:1,padding:12,borderRadius:12,border:"none",
              background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",
              fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>
              مجدداً 🔄
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── GAME ───────────────────────────────────────────────────────────────────
  return (
    <div style={{position:"fixed",inset:0,background:"#080c14",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",fontFamily:"var(--font-cairo,sans-serif)",
      userSelect:"none",padding:8,gap:8}}>

      {/* Header */}
      <div style={{width:"100%",maxWidth:540,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>setPhase("splash")} style={{padding:"6px 14px",borderRadius:10,
          background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",
          color:"rgba(255,255,255,.5)",fontSize:12,fontWeight:700,cursor:"pointer"}}>← رجوع</button>
        <motion.div animate={{scale:[1,1.05,1]}} transition={{duration:1.4,repeat:Infinity}}
          style={{display:"flex",alignItems:"center",gap:8,padding:"6px 16px",borderRadius:10,
            background:`${C[PCOLORS[cur]].main}18`,border:`1px solid ${C[PCOLORS[cur]].main}40`}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:C[PCOLORS[cur]].main}}/>
          <span style={{fontWeight:800,fontSize:12,color:"#f4f4f8"}}>{aiOn?"يفكر…":PLABELS[cur]}</span>
        </motion.div>
        <div style={{display:"flex",gap:4}}>
          {PLAYERS.map(pid=>{
            const active=cur===pid;
            return (
              <div key={pid} style={{width:28,height:28,borderRadius:8,
                background:active?C[PCOLORS[pid]].main:`${C[PCOLORS[pid]].main}28`,
                border:`2px solid ${active?C[PCOLORS[pid]].dark:"transparent"}`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,
                boxShadow:active?`0 0 10px ${C[PCOLORS[pid]].main}60`:"none",transition:"all .2s"}}>
                {pid==="player"?"🧑":"🤖"}
              </div>
            );
          })}
        </div>
      </div>

      {/* Board */}
      <div style={{width:"clamp(300px,min(96vw,calc(100dvh - 175px)),520px)",aspectRatio:"1",
        flexShrink:0,borderRadius:14,overflow:"hidden",
        border:"2px solid rgba(255,255,255,.08)",boxShadow:"0 0 40px rgba(0,0,0,.6)"}}>
        <svg viewBox="0 0 15 15" width="100%" height="100%" style={{display:"block"}}>

          {/* ── 1) أرضية الأركان الأربعة ─── */}
          <rect x="0" y="0" width="6" height="6" fill={C.red.light}/>
          <rect x="9" y="0" width="6" height="6" fill={C.yellow.light}/>
          <rect x="0" y="9" width="6" height="6" fill={C.green.light}/>
          <rect x="9" y="9" width="6" height="6" fill={C.blue.light}/>

          {/* ── 2) ممرات المسار (أبيض) ─── */}
          <rect x="6" y="0" width="3" height="6" fill="#f1f5f9"/>
          <rect x="0" y="6" width="6" height="3" fill="#f1f5f9"/>
          <rect x="6" y="9" width="3" height="6" fill="#f1f5f9"/>
          <rect x="9" y="6" width="6" height="3" fill="#f1f5f9"/>

          {/* ── 3) ممرات البيت الملونة (home corridors) - فوق الأبيض ─── */}
          {/* red:   col 7, rows 1-5 (العمود الأوسط للممر الشمالي) */}
          {[1,2,3,4,5].map(r=>(
            <rect key={`hc-red-${r}`} x={7} y={r} width={1} height={1} fill={C.red.light} stroke={C.red.dark} strokeWidth=".03"/>
          ))}
          {/* yellow: col 7, rows 9-13 (العمود الأوسط للممر الجنوبي) */}
          {[9,10,11,12,13].map(r=>(
            <rect key={`hc-yel-${r}`} x={7} y={r} width={1} height={1} fill={C.yellow.light} stroke={C.yellow.dark} strokeWidth=".03"/>
          ))}
          {/* green: row 7, cols 1-5 (الصف الأوسط للممر الغربي) */}
          {[1,2,3,4,5].map(c=>(
            <rect key={`hc-grn-${c}`} x={c} y={7} width={1} height={1} fill={C.green.light} stroke={C.green.dark} strokeWidth=".03"/>
          ))}
          {/* blue: row 7, cols 9-13 (الصف الأوسط للممر الشرقي) */}
          {[9,10,11,12,13].map(c=>(
            <rect key={`hc-blu-${c}`} x={c} y={7} width={1} height={1} fill={C.blue.light} stroke={C.blue.dark} strokeWidth=".03"/>
          ))}

          {/* ── 4) وسط البورد (مثلثات) ─── */}
          <rect x="6" y="6" width="3" height="3" fill="#1e293b"/>
          <polygon points="6,6 9,6 7.5,7.5" fill={C.red.main}/>
          <polygon points="6,6 6,9 7.5,7.5" fill={C.green.main}/>
          <polygon points="9,9 6,9 7.5,7.5" fill={C.yellow.main}/>
          <polygon points="9,9 9,6 7.5,7.5" fill={C.blue.main}/>

          {/* ── 5) مربعات المسار الخارجي ─── */}
          {TRACK.map(([col,row],i)=>{
            const startColors:Record<number,string>={0:C.red.main,13:C.yellow.main,26:C.blue.main,39:C.green.main};
            const bg = startColors[i] ?? (SAFE.has(i)?"#cbd5e1":"#f8fafc");
            return <rect key={i} x={col} y={row} width={1} height={1} fill={bg} stroke="#c0c9d8" strokeWidth=".025"/>;
          })}

          {/* ── 6) نجوم المربعات الآمنة ─── */}
          {TRACK.map(([col,row],i)=>
            (SAFE.has(i) && ![0,13,26,39].includes(i))
              ? <text key={`s${i}`} x={col+.5} y={row+.72} textAnchor="middle" fontSize=".55" fill="#64748b">★</text>
              : null
          )}

          {/* ── 7) أسهم مربعات البداية ─── */}
          <text x="6.5" y="5.72" textAnchor="middle" fontSize=".55" fill={C.red.dark}>▲</text>
          <text x="9.5" y="6.72" textAnchor="middle" fontSize=".55" fill={C.yellow.dark}>▶</text>
          <text x="8.5" y="9.72" textAnchor="middle" fontSize=".55" fill={C.blue.dark}>▼</text>
          <text x="5.5" y="8.72" textAnchor="middle" fontSize=".55" fill={C.green.dark}>◀</text>

          {/* ── 8) مسارات البيت الداخلية (HOME_TRACK) ─── */}
          {(["red","yellow","green","blue"] as Color[]).map(c=>
            HOME_TRACK[c].map(([col,row],i)=>(
              <rect key={`ht-${c}-${i}`} x={col} y={row} width={1} height={1}
                fill={i<5?C[c].light:C[c].main} stroke={C[c].dark} strokeWidth=".04" opacity=".9"/>
            ))
          )}

          {/* ── 9) صناديق الـ yard (دوائر بيضاء) ─── */}
          {(["red","yellow","green","blue"] as Color[]).map(c=>
            YARD_POS[c].map(([cx,cy],i)=>(
              <circle key={`yd-${c}-${i}`} cx={cx} cy={cy} r={.42}
                fill="white" stroke={C[c].dark} strokeWidth=".1" opacity=".7"/>
            ))
          )}

          {/* ── 10) preview هدف الحركة ─── */}
          {previewPos && (
            <g>
              <circle cx={previewPos[0]} cy={previewPos[1]} r={.4}
                fill={C.red.main} opacity={.35} stroke={C.red.main} strokeWidth={.08}>
                <animate attributeName="r" values=".32;.44;.32" dur=".6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values=".2;.55;.2" dur=".6s" repeatCount="indefinite"/>
              </circle>
              <text x={previewPos[0]} y={previewPos[1]+.2} textAnchor="middle" fontSize=".4" fill="white" opacity=".9">●</text>
            </g>
          )}

          {/* ── 11) البيادق ─── */}
          {PLAYERS.map(pid=>
            [0,1,2,3].map(ti=>{
              const pos = getCenter(g, pid, ti);
              if(!pos) return null;
              const [cx,cy] = pos;
              const valid = pid==="player" && validToks.includes(ti);
              const done  = isFinished(g, pid, ti);
              return (
                <Pawn key={`${pid}-${ti}`}
                  cx={cx} cy={cy}
                  color={PCOLORS[pid]}
                  glowing={valid}
                  small={done}
                  onClick={valid?()=>{ setPreviewPos(null); moveTok(ti); }:undefined}
                  onMouseEnter={valid?()=>{ const p=getTargetCenter(g,pid,ti); setPreviewPos(p); }:undefined}
                  onMouseLeave={valid?()=>setPreviewPos(null):undefined}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Controls */}
      <div style={{width:"100%",maxWidth:540,display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
        <Dice val={diceVal} canRoll={canRoll} rolling={rolling} onClick={roll}/>
        <div style={{flex:1,textAlign:"center"}}>
          {msg?(
            <motion.div key={msg} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}}
              style={{fontSize:14,fontWeight:700,color:"#f4f4f8"}}>{msg}</motion.div>
          ):(
            <div style={{fontSize:12,color:"rgba(255,255,255,.35)",fontWeight:600}}>
              {canRoll?"🎲 اضغط النرد":aiOn?"⏳ AI يفكر…":isMyTurn&&diceVal?"🎯 اختر بيدق":"⏳ انتظر دورك"}
            </div>
          )}
        </div>
        {/* progress */}
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {PLAYERS.map(pid=>{
            const done=[0,1,2,3].filter(ti=>isFinished(g,pid,ti)).length;
            return (
              <div key={pid} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:C[PCOLORS[pid]].main}}/>
                <div style={{display:"flex",gap:2}}>
                  {[0,1,2,3].map(i=>(
                    <div key={i} style={{width:6,height:6,borderRadius:"50%",
                      background:i<done?C[PCOLORS[pid]].main:"rgba(255,255,255,.1)",
                      transition:"background .3s"}}/>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
