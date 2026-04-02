"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DominoGame, type Tile, type Side, type PlayerId } from "@/lib/domino/game";
import { CAMPAIGN_MAPS, checkWinCondition, calcStars, type GameSnapshot } from "@/lib/domino/campaign";
import { usePlatformStore } from "@/lib/platform/store";
import { useSocket } from "@/lib/platform/socket";
import StoryBubble from "@/components/story/StoryBubble";
import { getDominoStory } from "@/lib/story/domino-stories";
import DominoSnakeGrid from "@/components/domino/DominoSnakeGrid";
import { getBotThinkDelay } from "@/lib/platform/difficulty";
import { getRandomTaunt, type TauntTrigger } from "@/lib/domino/domino-taunts";

const SKIN_MAP: Record<string, string> = {
  default_domino:"garrifin", garrifin:"garrifin",
  skin_dragon:"dragon",     dragon:"dragon",
  skin_phoenix:"phoenix",   phoenix:"phoenix",
  skin_unicorn:"unicorn",   unicorn:"unicorn",
};
const BACKFACE_MAP: Record<string,string> = {
  garrifin:"grrifinbackface.png", dragon:"dragonbackface.png",
  phoenix:"phonexbackface.png",   unicorn:"unicornbackface.png",
};
function getSkinFolder(raw?: string) { return SKIN_MAP[raw ?? "default_domino"] ?? "garrifin"; }
function getTileSrc(folder: string, a: number, b: number) {
  const [mn,mx] = a<=b?[a,b]:[b,a];
  return `/skins/domino/${folder}/${mn}-${mx}.png`;
}
function getBackfaceSrc(folder: string) {
  return `/skins/domino/${folder}/${BACKFACE_MAP[folder] ?? "grrifinbackface.png"}`;
}

/* ═══════════════════════════════════════════════════════
   TILE COMPONENT
═══════════════════════════════════════════════════════ */
interface TileProps {
  a:number; b:number; vertical?:boolean;
  selected?:boolean; playable?:boolean; disabled?:boolean; faceDown?:boolean;
  onClick?:()=>void; skinFolder:string; w?:number; h?:number;
}
function DominoTile({a,b,vertical=false,selected=false,playable=false,disabled=false,faceDown=false,onClick,skinFolder,w:wProp,h:hProp,flip}:TileProps&{flip?:boolean}){
  const W = wProp ?? (vertical?42:84);
  const H = hProp ?? (vertical?84:42);
  const src = faceDown ? getBackfaceSrc(skinFolder) : getTileSrc(skinFolder,a,b);
  const lift = !disabled && playable && !selected;
  return (
    <motion.div
      onClick={disabled?undefined:onClick}
      style={{width:W,height:H,position:"relative",flexShrink:0,cursor:disabled?"default":onClick?"pointer":"default"}}
      whileHover={lift?{y:-10,scale:1.07,filter:"brightness(1.15) drop-shadow(0 8px 18px rgba(245,166,35,0.55))"}:{}}
      whileTap={!disabled&&onClick?{scale:0.94}:{}}
      animate={selected?{y:-14,scale:1.1,filter:"drop-shadow(0 0 18px rgba(245,166,35,0.9)) brightness(1.1)"}:{y:0,scale:1,filter:"none",opacity:1}}
      transition={{type:"spring",stiffness:380,damping:28}}
    >
      {selected&&<div style={{position:"absolute",inset:0,zIndex:5,borderRadius:8,pointerEvents:"none",boxShadow:"inset 0 0 0 2.5px #f5a623, 0 0 22px 4px rgba(245,166,35,0.55)"}}/>}
      {playable&&!selected&&(
        <motion.div style={{position:"absolute",inset:0,zIndex:5,borderRadius:8,pointerEvents:"none"}}
          animate={{opacity:[0,0.65,0]}} transition={{duration:1.8,repeat:Infinity}} initial={{opacity:0}}>
          <div style={{position:"absolute",inset:0,borderRadius:8,boxShadow:"inset 0 0 0 1.5px #34d399"}}/>
        </motion.div>
      )}
      {/* ═══ الصورة — rotate(-90deg) عشان a يكون على اليسار وb على اليمين ═══ */}
      {!vertical?(
        <div style={{position:"absolute",inset:0,overflow:"hidden",borderRadius:8}}>
          <img src={src} alt={faceDown?"?":`${a}-${b}`} draggable={false}
            onError={e=>{(e.currentTarget as HTMLImageElement).style.opacity="0.3";}}
            style={{
              width:H, height:W,
              position:"absolute", top:"50%", left:"50%",
              marginTop:-W/2, marginLeft:-H/2,
              transform:`rotate(${flip?"-90deg":"90deg"})`,  /* flip=true → a يسار, b يمين */
              objectFit:"fill",
            }}/>
        </div>
      ):(
        <img src={src} alt={faceDown?"?":`${a}-${b}`} draggable={false}
          onError={e=>{(e.currentTarget as HTMLImageElement).style.opacity="0.3";}}
          style={{width:"100%",height:"100%",borderRadius:8,objectFit:"fill",display:"block"}}/>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   CHAIN NORMALIZER — يحسب الـ flip لكل قطعة
   في direction:ltr: chain[i].a = متصل باليسار، chain[i].b = متصل باليمين
   الصورة بدون flip: a على اليمين (rotate 90deg) ← غلط
   الصورة مع flip:   a على اليسار (rotate -90deg) ← صح
   إذن: كل قطعة في السلسلة محتاجة flip=true عشان a يكون على اليسار
   إلا لو a > b (يعني الصورة mn-mx وmn=b) → في الحالة دي rotate 90 هو الصح
═══════════════════════════════════════════════════════ */
function normalizeChain(chain: Tile[]): {a:number;b:number;isDouble:boolean;flip:boolean}[] {
  return chain.map(t => {
    const isDouble = t.a === t.b;
    // الصورة اسمها min-max.png وفيها min فوق وmax تحت
    // بعد rotate(90deg): min على اليمين، max على اليسار
    // بعد rotate(-90deg): min على اليسار، max على اليمين
    // عايزين: a على اليسار
    // لو a = min → عايزين a على اليسار → rotate(-90deg) → flip=true
    // لو a = max → بعد rotate(90deg) max على اليسار = a على اليسار → flip=false
    const mn = Math.min(t.a,t.b);
    const flip = (t.a === mn); // لو a هو الأصغر → flip
    return { a:t.a, b:t.b, isDouble, flip };
  });
}

/* ═══════════════════════════════════════════════════════
   OPPONENT BADGE — عداد الوقت على وشه
═══════════════════════════════════════════════════════ */
function OpponentBadge({id,count,isTurn,skinFolder,position,timer}:
  {id:PlayerId;count:number;isTurn:boolean;skinFolder:string;position:"top"|"left"|"right";timer?:number}) {
  const posStyle:React.CSSProperties =
    position==="top"  ? {top:"4.5rem",left:"50%",transform:"translateX(-50%)"} :
    position==="left" ? {left:8,top:"50%",transform:"translateY(-50%)"} :
                        {right:8,top:"50%",transform:"translateY(-50%)"};
  const isVert = position !== "top";
  const miniCount = Math.min(count,5);
  const timerColor = timer!==undefined?(timer<=5?"#ef4444":timer<=10?"#f59e0b":"#34d399"):"#34d399";
  return (
    <motion.div animate={isTurn?{scale:1.06}:{scale:1,opacity:0.72}} transition={{type:"spring",stiffness:260}}
      style={{position:"absolute",zIndex:20,display:"flex",flexDirection:"column",alignItems:"center",gap:4,...posStyle}}>
      {timer!==undefined&&(
        <div style={{fontSize:12,fontWeight:900,fontVariantNumeric:"tabular-nums",
          color:isTurn?timerColor:"rgba(255,255,255,0.25)",
          background:isTurn?"rgba(0,0,0,0.7)":"rgba(0,0,0,0.3)",
          padding:"2px 8px",borderRadius:8,border:isTurn?`1px solid ${timerColor}50`:"none",
          minWidth:40,textAlign:"center"}}>
          {isTurn?`⏱ ${timer}s`:`${timer}s`}
        </div>
      )}
      <div style={{width:44,height:44,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,
        background:isTurn?"rgba(245,166,35,0.12)":"rgba(255,255,255,0.05)",
        border:`2px solid ${isTurn?"#f5a623":"rgba(255,255,255,0.08)"}`,
        boxShadow:isTurn?"0 0 18px rgba(245,166,35,0.4)":"none",
        transition:"all .3s",backdropFilter:"blur(16px)",position:"relative"}}>
        🤖
        {isTurn&&<span style={{position:"absolute",top:-5,right:-5,width:12,height:12,borderRadius:"50%",background:"#22c55e",border:"2px solid #070915",boxShadow:"0 0 6px #22c55e",animation:"pulse-dot 1.2s ease-in-out infinite"}}/>}
      </div>
      <div style={{padding:"2px 8px",borderRadius:99,fontSize:9,fontWeight:900,background:isTurn?"#f5a623":"rgba(0,0,0,0.5)",color:isTurn?"#000":"rgba(255,255,255,0.5)",border:isTurn?"none":"1px solid rgba(255,255,255,0.07)",backdropFilter:"blur(8px)",whiteSpace:"nowrap"}}>
        Bot · {count} 🁣
      </div>
      <div style={{display:"flex",flexDirection:isVert?"column":"row",gap:2}}>
        {Array.from({length:miniCount}).map((_,i)=>(
          <div key={i} style={{width:isVert?12:10,height:isVert?10:20,borderRadius:3,flexShrink:0,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.06)",transform:isVert?"none":`rotate(${(i-2)*2.5}deg)`,boxShadow:"0 2px 6px rgba(0,0,0,0.5)"}}/>
        ))}
        {count>5&&<span style={{fontSize:8,color:"rgba(255,255,255,0.25)",fontWeight:700}}>+{count-5}</span>}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════ CONFETTI ═ */
function VictoryConfetti(){
  const colors=["#f5a623","#34d399","#60a5fa","#f87171","#c084fc","#fb923c"];
  const pts=React.useMemo(()=>Array.from({length:70},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*1.5,dur:2.5+Math.random()*2,color:colors[i%colors.length],w:7+Math.random()*10,rot:Math.random()*360})),[]);
  return(<div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:10}}>
    {pts.map(p=><motion.div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:-16,width:p.w,height:p.w*0.5,background:p.color,borderRadius:2}} animate={{y:["0vh","115vh"],rotate:[p.rot,p.rot+540],opacity:[1,1,0]}} transition={{duration:p.dur,delay:p.delay,ease:"easeIn"}}/>)}
  </div>);
}

/* ═══════════════════════════════════════════════════════ END DIALOG ═ */
function EndDialog({winner,myId,onReplay,onHome}:{winner:PlayerId|null;myId:PlayerId;scores:Record<PlayerId,number>;pipCounts:Record<PlayerId,number>;onReplay:()=>void;onHome:()=>void}){
  const won=winner===myId; const isDraw=!winner;
  useEffect(()=>{ if(won) fetch("/api/domino/match",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({result:"win",coins:100,xp:50})}).catch(()=>{}); },[]);
  return(
    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{position:"absolute",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(12px)"}}>
      {won&&<VictoryConfetti/>}
      <motion.div initial={{scale:0.72,y:50,opacity:0}} animate={{scale:1,y:0,opacity:1}} transition={{type:"spring",stiffness:220,damping:22,delay:0.08}}
        style={{width:"100%",maxWidth:340,borderRadius:24,overflow:"hidden",position:"relative",zIndex:20,
          background:won?"linear-gradient(160deg,#1c1500,#2b1f00,#0e0e0e)":isDraw?"linear-gradient(160deg,#0a0a0a,#141414)":"linear-gradient(160deg,#0e0e0e,#1c0505)",
          border:`1.5px solid ${won?"rgba(245,196,66,0.4)":isDraw?"rgba(255,255,255,0.1)":"rgba(255,60,60,0.25)"}`,
          boxShadow:won?"0 0 60px rgba(245,196,66,0.15),0 30px 60px rgba(0,0,0,0.7)":"0 30px 60px rgba(0,0,0,0.7)"}}>
        <div style={{height:2,background:won?"linear-gradient(90deg,transparent,#f5c842,#fffacd,#f5c842,transparent)":isDraw?"linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)":"linear-gradient(90deg,transparent,#ef4444,transparent)"}}/>
        <div style={{padding:"28px 24px",textAlign:"center"}}>
          <motion.div initial={{scale:0,rotate:-15}} animate={{scale:1,rotate:0}} transition={{type:"spring",stiffness:230,damping:16,delay:0.28}} style={{fontSize:56,marginBottom:16,display:"inline-block"}}>{won?"🏆":isDraw?"🤝":"💀"}</motion.div>
          <motion.h2 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.38}} style={{fontSize:"clamp(24px,6vw,32px)",fontWeight:900,marginBottom:8,color:won?"#f5c842":isDraw?"#fff":"#ff6060",textShadow:won?"0 0 30px rgba(245,196,66,0.6)":"none"}}>{won?"انتصار! 🎉":isDraw?"تعادل":"خسارة"}</motion.h2>
          <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.48}} style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:20}}>{won?"أداء رائع! استمر على هذا المستوى 💪":isDraw?"المباراة انتهت بالتعادل":"المرة القادمة ستكون مختلفة! 🔥"}</motion.p>
          {won&&<motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:0.55}} style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20}}>
            {[{label:"كوينز",value:"+100",color:"#f5c842"},{label:"XP",value:"+50",color:"#a78bfa"}].map(r=>(
              <div key={r.label} style={{padding:"10px 18px",borderRadius:16,textAlign:"center",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{fontSize:20,fontWeight:900,color:r.color}}>{r.value}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2}}>{r.label}</div>
              </div>))}
          </motion.div>}
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.62}} style={{display:"flex",gap:10}}>
            <button onClick={onHome} style={{flex:1,padding:"12px",borderRadius:14,fontWeight:700,fontSize:13,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",fontFamily:"inherit"}}>الرئيسية</button>
            <button onClick={onReplay} style={{flex:1,padding:"12px",borderRadius:14,fontWeight:900,fontSize:14,background:won?"linear-gradient(135deg,#f5c842,#e0960a)":"linear-gradient(135deg,#ef4444,#b91c1c)",color:won?"#1a0d00":"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",boxShadow:won?"0 4px 20px rgba(245,196,66,0.4)":"0 4px 20px rgba(239,68,68,0.3)"}}>🔄 مجدداً</button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════ SOUND ═ */
function useDominoSound(){
  const ctxRef=useRef<AudioContext|null>(null);
  const getCtx=()=>{ if(!ctxRef.current&&typeof window!=="undefined") ctxRef.current=new (window.AudioContext||(window as any).webkitAudioContext)(); return ctxRef.current; };
  const play=useCallback((type:"place"|"draw"|"win"|"lose"|"turn")=>{
    try{
      const ctx=getCtx(); if(!ctx) return;
      const g=ctx.createGain(); g.connect(ctx.destination);
      const o=ctx.createOscillator(); o.connect(g);
      if(type==="place"){o.type="sine";o.frequency.setValueAtTime(880,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+0.12);g.gain.setValueAtTime(0.18,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.14);o.start();o.stop(ctx.currentTime+0.14);}
      else if(type==="draw"){o.type="sine";o.frequency.setValueAtTime(330,ctx.currentTime);g.gain.setValueAtTime(0.12,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.18);o.start();o.stop(ctx.currentTime+0.18);}
      else if(type==="win"){[523,659,784,1047].forEach((freq,i)=>{const o2=ctx.createOscillator();const g2=ctx.createGain();o2.connect(g2);g2.connect(ctx.destination);o2.type="sine";o2.frequency.value=freq;g2.gain.setValueAtTime(0,ctx.currentTime+i*0.12);g2.gain.linearRampToValueAtTime(0.2,ctx.currentTime+i*0.12+0.06);g2.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.12+0.4);o2.start(ctx.currentTime+i*0.12);o2.stop(ctx.currentTime+i*0.12+0.4);});return;}
      else if(type==="lose"){o.type="sawtooth";o.frequency.setValueAtTime(220,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(80,ctx.currentTime+0.4);g.gain.setValueAtTime(0.15,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);o.start();o.stop(ctx.currentTime+0.4);}
      else if(type==="turn"){o.type="sine";o.frequency.setValueAtTime(660,ctx.currentTime);g.gain.setValueAtTime(0.1,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.1);o.start();o.stop(ctx.currentTime+0.1);}
    }catch{/*ignore*/}
  },[]);
  return {play};
}

function saveCampaignProgress(mapId:string,levelId:string,passed:boolean,stars=0,score=0){
  try{
    const key=`campaign_progress_${mapId}`;
    const prev=JSON.parse(localStorage.getItem(key)||"{}");
    const ex=prev[levelId]||{};
    prev[levelId]={passed:passed||ex.passed,completedAt:passed?Date.now():(ex.completedAt||Date.now()),stars:Math.max(stars,ex.stars||0),bestScore:Math.max(score,ex.bestScore||0)};
    localStorage.setItem(key,JSON.stringify(prev));
  }catch{/*ignore*/}
}

/* ═══════════════════════════════════════════════════════ ONLINE HOOK ═ */
interface OnlineState{chain:Tile[];myHand:Tile[];oppCount:number;boneyard:number;turn:"a"|"b";phase:"playing"|"ended"|"lobby";winner:"a"|"b"|null;timeA:number;timeB:number;}
function useOnlineGame(matchId:string,playerId:string,mySide:"a"|"b",enabled=true){
  const {socket} = useSocket();
  const [state,setState]=useState<OnlineState|null>(null);
  const [sending,setSending]=useState(false);
  const seqRef=useRef(0); const activeRef=useRef(true);
  const fetchState=useCallback(async()=>{
    if(!enabled||!matchId) return;
    try{const res=await fetch(`/api/domino/match/${matchId}?playerId=${playerId}&action=state`,{cache:"no-store"});if(!res.ok)return;const data=await res.json();setState({chain:data.chain??[],myHand:data.myHand??[],oppCount:data.oppCount??0,boneyard:data.boneyard??0,turn:data.turn??"a",phase:data.phase??"playing",winner:data.winner??null,timeA:data.timeA??180_000,timeB:data.timeB??180_000});}catch{/*ignore*/}
  },[matchId,playerId,enabled]);
  const pollEvents=useCallback(async()=>{
    if(!activeRef.current||!enabled||!matchId) return;
    try{const res=await fetch(`/api/domino/match/${matchId}?playerId=${playerId}&action=events&since=${seqRef.current}`,{cache:"no-store"});const data=await res.json();if(data.events?.length){seqRef.current=data.seq;await fetchState();}}catch{/*ignore*/}
    if(activeRef.current) setTimeout(pollEvents,1200);
  },[matchId,playerId,fetchState,enabled]);
  // D-4.3: Socket.IO listener — fallback to polling لو مفيش socket
  useEffect(()=>{
    if (!socket || !enabled || !matchId) return;
    const room = `domino:${matchId}:${playerId}`;
    socket.emit("domino:join", { matchId, playerId });
    const onState = (data: any) => { if (data && !data.error) setState({chain:data.chain??[],myHand:data.myHand??[],oppCount:data.oppCount??0,boneyard:data.boneyard??0,turn:data.turn??"a",phase:data.phase??"playing",winner:data.winner??null,timeA:data.timeA??180_000,timeB:data.timeB??180_000}); };
    socket.on("domino:state", onState);
    return () => { socket.off("domino:state", onState); socket.emit("domino:leave", { matchId, playerId }); };
  }, [socket, matchId, playerId, enabled]);
  // Polling كـ fallback لو مفيش socket
  useEffect(()=>{activeRef.current=true;fetchState();const t=setTimeout(pollEvents,800);return()=>{activeRef.current=false;clearTimeout(t);};},[fetchState,pollEvents]);
  const playMove=useCallback(async(tile:Tile,side:Side):Promise<boolean>=>{
    if(sending)return false;setSending(true);
    try{const res=await fetch(`/api/domino/match/${matchId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({playerId,action:"move",tile,side})});const data=await res.json();if(data.ok){await fetchState();return true;}}catch{/*ignore*/}finally{setSending(false);}
    return false;
  },[matchId,playerId,sending,fetchState]);
  const drawTile=useCallback(async():Promise<boolean>=>{
    if(sending)return false;setSending(true);
    try{await fetch(`/api/domino/match/${matchId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({playerId,action:"draw"})});await fetchState();return true;}catch{return false;}finally{setSending(false);}
  },[matchId,playerId,sending,fetchState]);
  const resign=useCallback(async()=>{await fetch(`/api/domino/match/${matchId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({playerId,action:"resign"})});await fetchState();},[matchId,playerId,fetchState]);
  return{state,isMyTurn:state?.turn===mySide&&state?.phase==="playing",sending,playMove,drawTile,resign,refetch:fetchState};
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export interface DominoBoardProps {
  matchId?:string; playerId:PlayerId; initialSide?:"a"|"b";
  mode?:"online"|"training"; onLeave?:()=>void; numPlayers?:2|4;
  campaignMapId?:string; campaignLevelId?:string;
  gameType?:"classic"|"block"|"all_fives"; difficulty?:"easy"|"medium"|"hard"|"expert";
}

/* بيحمل كل صور السكين قبل ما اللعبة تفتح */
function preloadDominoSkin(folder: string) {
  if (typeof window === "undefined") return;
  const pairs: [number,number][] = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) pairs.push([a,b]);
  pairs.forEach(([a,b]) => {
    const img = new window.Image();
    img.src = `/skins/domino/${folder}/${a}-${b}.png`;
  });
  const back = new window.Image();
  back.src = getBackfaceSrc(folder);
}

/* hook يرجع عرض الشاشة الفعلي */
function useWindowWidth() {
  const [w, setW] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 390
  );
  React.useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

export default function DominoBoard({
  matchId, playerId="player", initialSide="a", mode="training",
  onLeave, numPlayers=2, campaignMapId, campaignLevelId, gameType="classic", difficulty="medium",
}:DominoBoardProps){
  const {equipped}=usePlatformStore();
  const skinFolder=getSkinFolder(equipped?.domino_skin??"default_domino");
  const sound=useDominoSound();
  const screenW = useWindowWidth();
  const isMobile = screenW < 640;

  // حجم قطع اليد — ثابت نسبياً
  const TILE_W = isMobile ? 32 : 42;
  const TILE_H = isMobile ? 64 : 84;

  // preload صور السكين فور ما يتحدد الفولدر
  React.useEffect(() => { preloadDominoSkin(skinFolder); }, [skinFolder]);

  const onlineGame=useOnlineGame(matchId??"",playerId,initialSide,mode==="online"&&!!matchId);
  const gameRef=useRef<DominoGame|null>(null);

  const [chain,      setChain]      =useState<Tile[]>([]);
  const [myHand,     setMyHand]     =useState<Tile[]>([]);
  const [oppCounts,  setOppCounts]  =useState<Record<PlayerId,number>>({});
  const [boneyard,   setBoneyard]   =useState(0);
  const [turn,       setTurn]       =useState<PlayerId>("player");
  const [selected,   setSelected]   =useState<Tile|null>(null);
  const [endInfo,    setEndInfo]    =useState<{winner:PlayerId|null;scores:Record<string,number>;pipCounts:Record<string,number>}|null>(null);
  const [botThinking,setBotThinking]=useState(false);
  const [turnTimer,  setTurnTimer]  =useState(30);
  const [botTimers,  setBotTimers]  =useState<Record<PlayerId,number>>({});
  const botTimerIntervalsRef=useRef<Record<PlayerId,ReturnType<typeof setInterval>>>({});
  const [missionModal,  setMissionModal]  =useState(false);
  const botsRunningRef  =useRef(false);
  const turnTimerRef    =useRef<ReturnType<typeof setInterval>|null>(null);
  const timerActionRef  =useRef<(()=>void)|null>(null);
  const startedRef      =useRef(false);
  const [drawFeedback,  setDrawFeedback]  =useState<string|null>(null);
  const [tauntMsg,      setTauntMsg]      =useState<string|null>(null);
  const tauntTimeoutRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  function showTaunt(trigger: TauntTrigger) {
    const msg = getRandomTaunt(trigger);
    if (!msg) return;
    if (tauntTimeoutRef.current) clearTimeout(tauntTimeoutRef.current);
    setTauntMsg(msg);
    tauntTimeoutRef.current = setTimeout(() => setTauntMsg(null), 3500);
  }
  const [campaignResult,setCampaignResult]=useState<{passed:boolean;reason:string}|null>(null);
  const [storyTrigger, setStoryTrigger]   =useState<"level_start"|"win"|"lose"|"midpoint"|"boss"|null>(null);
  const storyDef = campaignMapId ? getDominoStory(campaignMapId) : null;
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardW, setBoardW] = useState(360);
  const [boardH, setBoardH] = useState(300);
  const [showDebugGrid, setShowDebugGrid] = useState(false);
  const didDrawRef=useRef(false);
  const prevTurnRef=useRef<PlayerId|null>(null);
  const [showChat,setShowChat]=useState(false);
  const [chatMsg, setChatMsg] =useState<string|null>(null);

  const QUICK_MSGS=["👍 حركة جميلة!","😂 حظ سعيد!","🙅 مستحيل!","🔥 أنا في إيدي!","🤔 فكر جيد...","🎉 مبروك!"];
  const sendQuickMsg=(msg:string)=>{setChatMsg(msg);setShowChat(false);setTimeout(()=>setChatMsg(null),2800);};

  const campaignMap  =campaignMapId  ?CAMPAIGN_MAPS.find(m=>m.id===campaignMapId):undefined;
  const campaignLevel=campaignLevelId&&campaignMap?campaignMap.levels.find(l=>l.id===campaignLevelId):undefined;
  // قياس حجم الـ board عند التحميل وعند تغيير الحجم
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setBoardW(width);
      setBoardH(height);
    });
    ro.observe(el);
    setBoardW(el.clientWidth);
    setBoardH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(()=>{if(campaignLevel)setMissionModal(true);},[campaignLevel]);

  /* bot timer helpers */
  function startBotTimer(botId:PlayerId){
    if(botTimerIntervalsRef.current[botId]) clearInterval(botTimerIntervalsRef.current[botId]);
    setBotTimers(p=>({...p,[botId]:30}));
    let t=30;
    botTimerIntervalsRef.current[botId]=setInterval(()=>{
      t--;
      setBotTimers(p=>({...p,[botId]:t}));
      if(t<=0){clearInterval(botTimerIntervalsRef.current[botId]);delete botTimerIntervalsRef.current[botId];}
    },1000);
  }
  function stopAllBotTimers(){Object.values(botTimerIntervalsRef.current).forEach(clearInterval);botTimerIntervalsRef.current={};}

  /* sync */
  const sync=useCallback(()=>{
    const g=gameRef.current; if(!g) return;
    setChain([...g.chain]);
    setMyHand([...(g.hands[playerId]??[])]);
    setBoneyard(g.boneyard.length);
    setTurn(g.turn);
    if(g.turn===playerId&&prevTurnRef.current!==playerId&&g.phase==="playing") sound.play("turn");
    prevTurnRef.current=g.turn;
    const counts:Record<PlayerId,number>={};
    for(const p of g.players){if(p!==playerId)counts[p]=g.hands[p]?.length??0;}
    setOppCounts(counts);
    if(g.phase==="ended"){
      const st=g.status();
      setEndInfo({winner:g.winner,scores:st.scores,pipCounts:st.pipCounts});
      stopAllBotTimers();
      setTimeout(()=>sound.play(g.winner===playerId?"win":"lose"),300);
      // story trigger عند انتهاء الدور
      if (storyDef) setTimeout(()=>setStoryTrigger(g.winner===playerId?"win":"lose"),500);
      // taunt عند نهاية اللعبة
      setTimeout(()=>showTaunt(g.winner===playerId?"about_to_win":"about_to_lose"),600);
      if(campaignLevel&&campaignMapId){
        const oppIds=g.players.filter(p=>p!==playerId);
        const oppPips=oppIds.reduce((s,p)=>s+(st.pipCounts[p]??0),0);
        const snap:GameSnapshot={winner:g.winner,totalTurns:g.totalTurns,playerPips:st.pipCounts[playerId]??0,oppPips:st.pipCounts[g.players.find(p=>p!==playerId)??""]??0,didDraw:didDrawRef.current,playerScore:g.winner===playerId?oppPips:0};
        const result=checkWinCondition(campaignLevel.winCondition,snap);
        const stars=calcStars(campaignLevel.winCondition,snap);
        setCampaignResult(result);
        saveCampaignProgress(campaignMapId,campaignLevel.id,result.passed,stars,snap.playerScore);
        if(result.passed) fetch("/api/domino/match",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({result:"win",coins:campaignLevel.rewards.coins,xp:campaignLevel.rewards.xp})}).catch(()=>{});
      }
    }
  },[playerId,campaignLevel,campaignMapId,sound]);

  /* run bots fast */
  const runBots=useCallback(async()=>{
    if(botsRunningRef.current) return;
    const g=gameRef.current; if(!g||g.phase!=="playing") return;
    botsRunningRef.current=true; setBotThinking(true);
    let safety=0;
    try{
      while(g.phase==="playing"&&g.isBot(g.turn)){
        if(safety++>40){g.nextTurn();break;}
        const bot=g.turn; startBotTimer(bot);
        await new Promise(r=>setTimeout(r, getBotThinkDelay(difficulty)));
        if(!gameRef.current||gameRef.current.phase!=="playing") break;
        const prev=g.turn; g.playAI();
        if(g.phase==="playing"&&g.turn===prev) g.nextTurn();
        sync();
      }
    }finally{botsRunningRef.current=false;setBotThinking(false);}
  },[sync]);

  timerActionRef.current=()=>{
    const g=gameRef.current; if(!g||g.phase!=="playing"||g.turn!==playerId) return;
    if(g.boneyard.length>0&&gameType!=="block") g.draw(playerId);
    else if(!g.pass(playerId)) g.nextTurn();
    sync();
    if(g.phase==="playing"&&g.isBot(g.turn)) setTimeout(()=>runBots(),80);
  };

  /* player turn timer */
  useEffect(()=>{
    if(endInfo||turn!==playerId){if(turnTimerRef.current){clearInterval(turnTimerRef.current);turnTimerRef.current=null;}setTurnTimer(30);return;}
    const g=gameRef.current; if(!g||g.phase!=="playing"){setTurnTimer(30);return;}
    if(turnTimerRef.current) clearInterval(turnTimerRef.current);
    let counter=30; setTurnTimer(30);
    turnTimerRef.current=setInterval(()=>{
      counter--; setTurnTimer(counter);
      if(counter<=0){if(turnTimerRef.current){clearInterval(turnTimerRef.current);turnTimerRef.current=null;}setTurnTimer(30);timerActionRef.current?.();}
    },1000);
    return()=>{if(turnTimerRef.current){clearInterval(turnTimerRef.current);turnTimerRef.current=null;}};
  },[turn,playerId,endInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  /* startGame — instant sync */
  const startGame=useCallback(()=>{
    const diff=campaignLevel?.opponentDifficulty??difficulty;
    const g=new DominoGame(numPlayers,diff,gameType); g.deal(7);
    gameRef.current=g;
    setSelected(null); setEndInfo(null); setCampaignResult(null); didDrawRef.current=false;
    if (storyDef) setTimeout(()=>setStoryTrigger("level_start"), 800);
    stopAllBotTimers();
    const initTimers:Record<PlayerId,number>={};
    g.players.filter(p=>p!==playerId).forEach(p=>{initTimers[p]=30;});
    setBotTimers(initTimers);
    /* instant state — no waiting for async setState */
    setMyHand([...(g.hands[playerId]??[])]);
    setChain([...g.chain]);
    setBoneyard(g.boneyard.length);
    setTurn(g.turn);
    const counts:Record<PlayerId,number>={};
    g.players.filter(p=>p!==playerId).forEach(p=>{counts[p]=g.hands[p]?.length??0;});
    setOppCounts(counts);
    if(g.isBot(g.turn)) setTimeout(()=>runBots(),400);
  },[numPlayers,difficulty,gameType,campaignLevel,playerId,runBots]);

  useEffect(()=>{
    if(mode==="training"&&!missionModal&&!startedRef.current){startedRef.current=true;startGame();}
    return () => {
      // D-4.5: cleanup جميع الـ timers عند unmount
      stopAllBotTimers();
      if (turnTimerRef.current) { clearInterval(turnTimerRef.current); turnTimerRef.current = null; }
    };
  },[mode,missionModal]); // eslint-disable-line react-hooks/exhaustive-deps

  /* display sources */
  const displayChain  =mode==="online"?(onlineGame?.state?.chain  ??chain)  :chain;
  const displayMyHand =mode==="online"?(onlineGame?.state?.myHand ??myHand) :myHand;
  const displayBoneyard=mode==="online"?(onlineGame?.state?.boneyard??boneyard):boneyard;
  const isMyTurnOnline=mode==="online"?(onlineGame?.isMyTurn??false):false;

  /* valid moves */
  const validMoves=React.useMemo(()=>{
    if(mode==="online"){
      if(!onlineGame?.isMyTurn||!displayMyHand.length) return [];
      const tmp=new DominoGame(); tmp.chain=[...displayChain]; tmp.players=[playerId]; tmp.hands={[playerId]:[...displayMyHand]}; tmp.phase="playing";
      return tmp.getValidMoves(playerId);
    }
    if(!gameRef.current||turn!==playerId) return [];
    return gameRef.current.getValidMoves(playerId);
  },[mode,onlineGame?.isMyTurn,turn,playerId,displayChain,displayMyHand,chain]);

  const isPlayable=(t:Tile)=>validMoves.some(m=>m.tile.a===t.a&&m.tile.b===t.b);
  const canGoLeft =(t:Tile)=>validMoves.some(m=>m.tile.a===t.a&&m.tile.b===t.b&&m.side==="left");
  const canGoRight=(t:Tile)=>validMoves.some(m=>m.tile.a===t.a&&m.tile.b===t.b&&m.side==="right");

  async function placeTile(t:Tile,side:Side){
    if(mode==="online"){const ok=await onlineGame?.playMove(t,side);if(ok){setSelected(null);sound.play("place");}return;}
    const g=gameRef.current; if(!g||turn!==playerId) return;
    const ok=g.play(playerId,t,side);
    if(ok){setSelected(null);sound.play("place");sync();if(g.phase==="playing"&&g.isBot(g.turn))setTimeout(()=>runBots(),80);}
  }

  function clickTile(t:Tile){
    const myTurn=mode==="online"?isMyTurnOnline:(turn===playerId);
    if(!myTurn||!isPlayable(t)) return;
    const isSame=selected&&selected.a===t.a&&selected.b===t.b;
    if(isSame){
      const l=canGoLeft(t); const r=canGoRight(t);
      if(l&&!r){placeTile(t,"left");return;}
      if(!l&&r){placeTile(t,"right");return;}
      setSelected(null);
    } else {setSelected({...t});}
  }

  async function handleDraw(){
    if(mode==="online"){await onlineGame?.drawTile();sound.play("draw");return;}
    const g=gameRef.current; if(!g||turn!==playerId||gameType==="block") return;
    if(!g.boneyard.length) return;
    g.draw(playerId); sound.play("draw"); didDrawRef.current=true; sync();
    showTaunt("player_stuck");
    setDrawFeedback(g.hasValidMove(playerId)?"✓ قطعة جديدة في يدك!":"مازالت مفيش حركة — اسحب مجدداً أو مرّر");
    setTimeout(()=>setDrawFeedback(null),2500);
  }

  function handlePass(){
    const g=gameRef.current; if(!g||turn!==playerId) return;
    const ok=g.pass(playerId); if(ok){sync();setTimeout(()=>runBots(),80);}
  }

  useEffect(()=>{
    if(mode!=="online") return;
    const phase=onlineGame?.state?.phase; const winner=onlineGame?.state?.winner;
    if(phase==="ended"&&winner!==undefined&&!endInfo){
      setEndInfo({winner:(winner===initialSide?playerId:"opponent") as PlayerId,scores:{},pipCounts:{}});
    }
  },[mode,onlineGame?.state?.phase,onlineGame?.state?.winner,endInfo,initialSide,playerId]);

  /* computed */
  const _g      =gameRef.current;
  const isMyTurn=mode==="online"?isMyTurnOnline:(_g?.turn===playerId&&_g?.phase==="playing");
  const hasMove =isMyTurn&&validMoves.length>0;
  const canDraw =isMyTurn&&!hasMove&&displayBoneyard>0&&gameType!=="block";
  const canPass =isMyTurn&&!hasMove&&displayBoneyard===0;
  /* ═══ NORMALIZE — تمرير flip لكل قطعة في السلسلة ═══ */
  const norm    =normalizeChain(displayChain);
  const opponents=mode==="online"?["opponent"]:(_g?.players.filter(p=>p!==playerId)??[]);
  function getOppPos(p:PlayerId,opps:PlayerId[]):"top"|"left"|"right"{if(opps.length===1)return"top";const idx=opps.indexOf(p);return idx===0?"right":idx===1?"top":"left";}

  return (
    <div style={{position:"fixed",inset:0,display:"flex",flexDirection:"column",overflow:"hidden",userSelect:"none",fontFamily:"var(--font-cairo),sans-serif",touchAction:"manipulation"}}>
      <style>{`
        @keyframes pulse-dot{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.6);}50%{box-shadow:0 0 0 5px rgba(34,197,94,0);}}
        @keyframes bot-think{0%,100%{opacity:.3;}50%{opacity:1;}}
        .hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none;}
        .hide-scrollbar::-webkit-scrollbar{display:none;}
      `}</style>

      {/* ── TABLE BG ── */}
      <div style={{position:"absolute",inset:0,zIndex:0}}>
        <div style={{position:"absolute",inset:0,background:"#07090f"}}/>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 90% 70% at 50% 48%,#1a1030 0%,#0e0b1a 45%,#07090f 100%)"}}/>
        <div style={{position:"absolute",inset:"6px 6px",borderRadius:20,background:"radial-gradient(ellipse 120% 100% at 50% 50%,#1e1535 0%,#140f28 40%,#0d0a1e 100%)",border:"1.5px solid rgba(124,58,237,0.18)"}}/>
        <div style={{position:"absolute",inset:"0 0 auto 0",height:100,background:"linear-gradient(to bottom,rgba(0,0,0,0.9),transparent)",zIndex:5}}/>
        <div style={{position:"absolute",inset:"auto 0 0 0",height:280,background:"linear-gradient(to top,rgba(4,4,10,0.99) 0%,rgba(6,8,15,0.88) 40%,transparent 100%)",zIndex:5}}/>
      </div>

      {/* ── TOP BAR ── */}
      <header style={{position:"relative",zIndex:30,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px clamp(6px,2vw,16px) 4px",gap:6}}>
        <a href={campaignMap?"/games/domino/campaign":"/games/domino/online"} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:10,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.6)",fontSize:11,fontWeight:800,textDecoration:"none",backdropFilter:"blur(16px)"}}>←</a>
        <div style={{padding:"4px 10px",borderRadius:10,fontSize:10,fontWeight:900,background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.25)",color:"#34d399"}}>
          {gameType==="classic"?"⚡":gameType==="block"?"🔒":"⭐"}
        </div>
        {isMyTurn&&!endInfo&&(
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:14,
            background:turnTimer<=10?"rgba(239,68,68,0.15)":turnTimer<=20?"rgba(245,158,11,0.1)":"rgba(52,211,153,0.08)",
            border:`1px solid ${turnTimer<=10?"rgba(239,68,68,0.4)":turnTimer<=20?"rgba(245,158,11,0.3)":"rgba(52,211,153,0.2)"}`}}>
            <span style={{fontSize:11}}>⏱</span>
            <div style={{fontWeight:900,fontSize:13,lineHeight:1,fontVariantNumeric:"tabular-nums",color:turnTimer<=10?"#ef4444":turnTimer<=20?"#f59e0b":"#34d399"}}>{turnTimer}s</div>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <span style={{fontSize:11,opacity:0.6}}>🁣</span>
          <div style={{fontWeight:900,fontSize:12,color:"#f5a623",lineHeight:1}}>{displayBoneyard}</div>
        </div>
      </header>

      {/* ── OPPONENTS ── */}
      {opponents.map(p=>(
        <OpponentBadge key={p} id={p}
          count={mode==="online"?(onlineGame?.state?.oppCount??0):(oppCounts[p]??0)}
          isTurn={mode==="online"?!isMyTurnOnline:(_g?.turn===p)}
          skinFolder={skinFolder}
          position={getOppPos(p,opponents)}
          timer={mode==="training"?(botTimers[p]??30):undefined}
        />
      ))}

      {/* bot thinking */}
      {botThinking&&(
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:25,pointerEvents:"none",display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:12,background:"rgba(2,3,16,0.8)",border:"1px solid rgba(0,212,255,0.15)",backdropFilter:"blur(16px)"}}>
          {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#00d4ff",animation:`bot-think 1s ease-in-out ${i*0.2}s infinite`}}/>)}
          <span style={{fontSize:12,fontWeight:700,color:"rgba(0,212,255,0.7)"}}>يفكر...</span>
        </div>
      )}

      {/* ── CHAIN BOARD ── */}
      <div ref={boardRef} style={{position:"absolute",zIndex:10,inset:0,top:40,bottom:isMobile?"clamp(90px,17vh,120px)":"clamp(110px,19vh,150px)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",pointerEvents:"none"}}>
        <AnimatePresence>
          {selected&&chain.length>0&&(
            <>
              {canGoLeft(selected)&&(
                <motion.button key="left" initial={{opacity:0,scale:0.6}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.6}}
                  onClick={()=>placeTile(selected,"left")}
                  style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",zIndex:30,width:48,height:48,minWidth:48,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,background:"rgba(52,211,153,0.15)",border:"2px solid #34d399",color:"#34d399",boxShadow:"0 0 24px rgba(52,211,153,0.4)",cursor:"pointer",flexShrink:0,pointerEvents:"all"}}>←</motion.button>
              )}
              {canGoRight(selected)&&(
                <motion.button key="right" initial={{opacity:0,scale:0.6}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.6}}
                  onClick={()=>placeTile(selected,"right")}
                  style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",zIndex:30,width:48,height:48,minWidth:48,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,background:"rgba(52,211,153,0.15)",border:"2px solid #34d399",color:"#34d399",boxShadow:"0 0 24px rgba(52,211,153,0.4)",cursor:"pointer",flexShrink:0,pointerEvents:"all"}}>→</motion.button>
              )}
            </>
          )}
        </AnimatePresence>

        {!displayChain.length&&(
          <motion.p animate={{opacity:[0.3,0.7,0.3]}} transition={{duration:2.5,repeat:Infinity}}
            style={{fontSize:13,fontWeight:800,color:"rgba(245,166,35,0.5)",letterSpacing:"0.05em"}}>
            {isMyTurn?"✦ ابدأ بوضع أول قطعة ✦":"✦ انتظر دور خصمك ✦"}
          </motion.p>
        )}

        {/* ═══ SNAKE GRID ═══ */}
        {displayChain.length > 0 && (
          <div style={{position:"absolute",inset:0,overflowY:"auto",overflowX:"hidden",pointerEvents:"all"}}
            className="hide-scrollbar">
            <DominoSnakeGrid
              tiles={displayChain}
              skinFolder={skinFolder}
              showGrid={showDebugGrid}
              boardWidth={boardW}
              boardHeight={boardH}
            />
          </div>
        )}
      </div>

      {/* ── PLAYER HAND ── */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:30,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {/* controls */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 clamp(8px,2vw,14px) 6px",gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <motion.div animate={isMyTurn?{boxShadow:"0 0 12px rgba(52,211,153,0.6)"}:{boxShadow:"none"}}
              style={{width:30,height:30,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,background:isMyTurn?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.05)",border:`1.5px solid ${isMyTurn?"#34d399":"rgba(255,255,255,0.1)"}`,transition:"all .3s"}}>🧑</motion.div>
            <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.3)"}}>{displayMyHand.length}🁣</div>
          </div>
          <AnimatePresence mode="wait">
            {isMyTurn?(
              <motion.div key="myturn" initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.8,opacity:0}}
                style={{padding:"4px 12px",borderRadius:10,fontSize:11,fontWeight:900,background:"linear-gradient(135deg,#34d399,#059669)",color:"#fff",display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#fff",animation:"pulse-dot .8s ease-in-out infinite"}}/>دورك!
              </motion.div>
            ):(
              <motion.div key="wait" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{padding:"4px 10px",borderRadius:10,fontSize:10,fontWeight:700,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.3)"}}>⏳</motion.div>
            )}
          </AnimatePresence>
          <div style={{display:"flex",gap:8}}>
            <motion.button onClick={()=>setShowChat(v=>!v)} whileTap={{scale:0.9}}
              style={{padding:"7px 10px",borderRadius:12,fontSize:16,background:showChat?"rgba(96,165,250,0.25)":"rgba(255,255,255,0.06)",border:`1px solid ${showChat?"rgba(96,165,250,0.5)":"rgba(255,255,255,0.1)"}`,cursor:"pointer"}}>💬</motion.button>
            {canDraw&&(
              <motion.button onClick={handleDraw} whileTap={{scale:0.92}}
                style={{padding:"5px 10px",borderRadius:10,fontSize:10,fontWeight:900,background:"rgba(245,166,35,0.18)",border:"1px solid rgba(245,166,35,0.4)",color:"#f5c842",cursor:"pointer",fontFamily:"inherit"}}>سحب {displayBoneyard}</motion.button>
            )}
            {canPass&&(
              <motion.button onClick={handlePass} whileTap={{scale:0.92}}
                style={{padding:"5px 10px",borderRadius:10,fontSize:10,fontWeight:900,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.35)",color:"#f87171",cursor:"pointer",fontFamily:"inherit"}}>تمرير</motion.button>
            )}
          </div>
        </div>

        {/* quick chat */}
        <AnimatePresence>
          {showChat&&(
            <motion.div initial={{opacity:0,y:8,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:8,scale:0.95}}
              style={{position:"absolute",bottom:"100%",left:0,right:0,marginBottom:8,padding:"8px 12px",background:"rgba(7,9,15,0.95)",border:"1px solid rgba(96,165,250,0.3)",borderRadius:16,zIndex:50,display:"flex",flexWrap:"wrap" as const,gap:6,backdropFilter:"blur(16px)"}}>
              {QUICK_MSGS.map(msg=>(
                <button key={msg} onClick={()=>sendQuickMsg(msg)}
                  style={{padding:"6px 12px",borderRadius:20,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" as const}}>{msg}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {/* chat bubble */}
        <AnimatePresence>
          {chatMsg&&(
            <motion.div initial={{opacity:0,y:-20,scale:0.85}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-10}}
              style={{position:"absolute",bottom:"calc(100% + 56px)",left:"50%",transform:"translateX(-50%)",padding:"10px 18px",borderRadius:20,background:"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",fontSize:14,fontWeight:800,boxShadow:"0 8px 24px rgba(59,130,246,0.4)",zIndex:45,whiteSpace:"nowrap" as const}}>
              {chatMsg}
              <div style={{position:"absolute",bottom:-8,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:"8px solid #3b82f6"}}/>
            </motion.div>
          )}
        </AnimatePresence>
        {/* draw feedback */}
        <AnimatePresence>
          {drawFeedback&&(
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              style={{textAlign:"center",fontSize:11,fontWeight:800,color:"#34d399",marginBottom:6}}>{drawFeedback}</motion.div>
          )}
        </AnimatePresence>

        {/* ═══ HAND TILES ═══ */}
        <div className="hide-scrollbar" style={{display:"flex",alignItems:"flex-end",justifyContent:"safe center",gap:isMobile?"2px":"clamp(2px,1vw,5px)",padding:isMobile?"2px 4px 8px":"4px clamp(4px,2vw,10px) clamp(8px,2vh,16px)",overflowX:"auto",overflowY:"visible",minHeight:isMobile?"70px":"clamp(80px,12vh,100px)",direction:"ltr",WebkitOverflowScrolling:"touch" as any}}>
          <AnimatePresence>
            {displayMyHand.map((t,i)=>{
              const play=isPlayable(t);
              const isSel=!!(selected&&selected.a===t.a&&selected.b===t.b);
              return(
                <motion.div key={`h${i}-${t.a}-${t.b}`} initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-40,opacity:0,scale:0.6}} transition={{type:"spring",stiffness:300,damping:28,delay:i*0.02}} style={{flexShrink:0}}>
                  <DominoTile a={t.a} b={t.b} vertical selected={isSel} playable={isMyTurn&&play&&!isSel} disabled={!isMyTurn||!play} onClick={()=>clickTile(t)} skinFolder={skinFolder} w={TILE_W} h={TILE_H}/>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {displayMyHand.length===0&&!endInfo&&<div style={{padding:24,fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.15)"}}>⌛</div>}
        </div>
        {/* hint */}
        <div style={{textAlign:"center",height:18,marginBottom:4}}>
          {isMyTurn&&!selected&&hasMove&&<p style={{fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.22)"}}>✔ اضغط على قطعة لاختيارها</p>}
          {selected&&<motion.p animate={{opacity:[0.5,1,0.5]}} transition={{duration:1.3,repeat:Infinity}} style={{fontSize:10,fontWeight:800,color:"#34d399"}}>{canGoLeft(selected)&&canGoRight(selected)?"↔ اختر الجانب (←) أو (→)":"▶ اضغط مجدداً للوضع"}</motion.p>}
          {isMyTurn&&!hasMove&&!canDraw&&!canPass&&<p style={{fontSize:10,fontWeight:800,color:"rgba(245,166,35,0.6)"}}>مفيش حركة متاحة</p>}
        </div>
      </div>

      {/* ── STORY BUBBLE ── */}
      {storyDef && storyTrigger && (
        <StoryBubble
          story={storyDef}
          trigger={storyTrigger}
          autoHide={4500}
          onDismiss={() => setStoryTrigger(null)}
        />
      )}

      {/* ── TAUNT MESSAGE ── */}
      <AnimatePresence>
        {tauntMsg && (
          <motion.div
            initial={{opacity:0,y:-20,scale:0.9}} animate={{opacity:1,y:0,scale:1}}
            exit={{opacity:0,y:-10,scale:0.9}} transition={{type:"spring",stiffness:300,damping:24}}
            onClick={()=>setTauntMsg(null)}
            style={{
              position:"fixed",top:"clamp(60px,12vh,90px)",left:"50%",transform:"translateX(-50%)",
              zIndex:55,maxWidth:"min(90vw,340px)",width:"100%",
              padding:"12px 18px",borderRadius:18,cursor:"pointer",
              background:"rgba(7,9,15,0.95)",border:"1.5px solid rgba(245,166,35,0.4)",
              boxShadow:"0 8px 28px rgba(0,0,0,0.6),0 0 0 1px rgba(245,166,35,0.1)",
              textAlign:"center",fontFamily:"Cairo,sans-serif",direction:"rtl",
            }}
          >
            <div style={{fontSize:15,fontWeight:900,color:"#f5a623",lineHeight:1.5}}>
              {tauntMsg}
            </div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.2)",marginTop:4}}>اضغط للإغلاق</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* campaign modal */}
      <AnimatePresence>
        {campaignLevel&&missionModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"absolute",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(14px)"}}>
            <motion.div initial={{scale:0.85,y:28}} animate={{scale:1,y:0}}
              style={{width:"100%",maxWidth:360,borderRadius:24,padding:"32px 24px",textAlign:"center",background:"#111",border:"1.5px solid rgba(245,196,66,0.3)",boxShadow:"0 0 60px rgba(245,196,66,0.1)"}}>
              <div style={{fontSize:52,marginBottom:16}}>🏆</div>
              <h2 style={{fontWeight:900,fontSize:22,color:"#fff",marginBottom:8}}>{campaignLevel.title}</h2>
              <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:24}}>{campaignLevel.description}</p>
              <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:24}}>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:"#f5a623"}}>🪙 {campaignLevel.rewards.coins}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontWeight:700}}>كوينز</div></div>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:18,color:"#a78bfa"}}>⭐ {campaignLevel.rewards.xp}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)",fontWeight:700}}>XP</div></div>
              </div>
              <button onClick={()=>{setMissionModal(false);startGame();}} style={{width:"100%",padding:"14px",borderRadius:16,fontWeight:900,fontSize:15,background:"linear-gradient(135deg,#f5c842,#e0960a)",color:"#1a0d00",border:"none",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 28px rgba(245,196,66,0.4)"}}>ابدأ التحدي ⚡</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* end dialog */}
      <AnimatePresence>
        {endInfo&&(
          <EndDialog winner={endInfo.winner} myId={playerId} scores={endInfo.scores} pipCounts={endInfo.pipCounts}
            onReplay={()=>{setEndInfo(null);setChain([]);setMyHand([]);setSelected(null);startedRef.current=false;botsRunningRef.current=false;if(campaignLevel)setMissionModal(true);else{startedRef.current=true;startGame();}}}
            onHome={()=>{window.location.href=campaignMap?"/games/domino/campaign":"/games/domino/online";}}/>
        )}
      </AnimatePresence>
    </div>
  );
}
