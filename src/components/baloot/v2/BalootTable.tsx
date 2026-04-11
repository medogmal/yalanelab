"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BalootGame, type Card, type Suit, type PlayerId, type Mode } from "@/lib/baloot/game";
import { getBestBid, getBestCard } from "@/lib/baloot/ai";

// ── ثوابت ─────────────────────────────────────────────────────────────────────
const ME: PlayerId = "S";
const ALL: PlayerId[] = ["N","E","S","W"];

const SUIT_SYM:  Record<Suit,string> = { S:"♠", H:"♥", D:"♦", C:"♣" };
const SUIT_CLR:  Record<Suit,string> = { S:"#1e293b", H:"#dc2626", D:"#dc2626", C:"#1e293b" };
const SUIT_NAME: Record<Suit,string> = { S:"بستوني", H:"قلوب", D:"ديناري", C:"سباتي" };
const POS_LABEL: Record<PlayerId,string> = { N:"الشريك", E:"خصم", S:"أنت", W:"خصم" };

function cKey(c:Card){ return c.rank+c.suit; }

// ── كرت ───────────────────────────────────────────────────────────────────────
function CardView({ card, selected, playable, facedown, small, onClick }: {
  card:Card; selected?:boolean; playable?:boolean;
  facedown?:boolean; small?:boolean; onClick?:()=>void;
}) {
  const w=small?32:50, h=small?48:74;
  if(facedown) return (
    <div style={{ width:w,height:h,borderRadius:6,flexShrink:0,
      background:"linear-gradient(135deg,#312e6b,#1e1b4b)",
      border:"1px solid rgba(255,255,255,.15)" }}/>
  );
  const sc=SUIT_CLR[card.suit], sym=SUIT_SYM[card.suit];
  return (
    <motion.button onClick={onClick}
      whileHover={playable?{y:-10,scale:1.07}:{}}
      whileTap={playable?{scale:.93}:{}}
      style={{ width:w,height:h,borderRadius:6,border:"none",padding:0,flexShrink:0,
        background:selected?"#fffbeb":"#fff",
        boxShadow:selected?"0 0 0 2.5px #f59e0b,0 8px 20px rgba(245,158,11,.4)"
          :playable?"0 0 0 2px #22c55e,0 4px 12px rgba(34,197,94,.25)"
          :"0 2px 8px rgba(0,0,0,.3)",
        cursor:onClick?"pointer":"default",
        display:"flex",flexDirection:"column",justifyContent:"space-between",
        padding:small?"3px 4px":"5px 6px",position:"relative",overflow:"hidden",
      }}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",lineHeight:1}}>
        <span style={{fontSize:small?9:12,fontWeight:800,color:sc,fontFamily:"monospace"}}>{card.rank}</span>
        <span style={{fontSize:small?10:13,color:sc}}>{sym}</span>
      </div>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:small?14:22,color:sc,opacity:.15}}>{sym}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",lineHeight:1,transform:"rotate(180deg)"}}>
        <span style={{fontSize:small?9:12,fontWeight:800,color:sc,fontFamily:"monospace"}}>{card.rank}</span>
        <span style={{fontSize:small?10:13,color:sc}}>{sym}</span>
      </div>
    </motion.button>
  );
}

// ── Bidding UI ────────────────────────────────────────────────────────────────
function BiddingOverlay({ game, onBid, onPass }:{
  game:BalootGame; onBid:(m:Mode,t?:Suit)=>void; onPass:()=>void;
}) {
  const [mode,setMode]=useState<Mode|null>(null);
  const suits:Suit[]=["S","H","D","C"];
  const canPass = game.currentBid!==null;
  return (
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.78)",backdropFilter:"blur(6px)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,borderRadius:16}}>
      <motion.div initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}}
        style={{background:"#1a1a2e",borderRadius:20,padding:"22px 18px",width:"min(88%,320px)",
          border:"1px solid rgba(255,255,255,.1)",textAlign:"center"}}>
        <div style={{color:"rgba(255,255,255,.45)",fontSize:11,marginBottom:10}}>
          {game.currentBid
            ?`الحالي: ${game.currentBid.mode==="sun"?"سان":"حكم"} ${game.currentBid.trump?SUIT_SYM[game.currentBid.trump]:""}`
            :"لا يوجد مزايدة بعد"}
        </div>
        <h3 style={{color:"#f4f4f8",fontWeight:800,fontSize:15,margin:"0 0 14px"}}>دورك في المزايدة</h3>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {(["hokom","sun"] as Mode[]).map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{
              flex:1,padding:"9px 0",borderRadius:10,border:"none",
              background:mode===m?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,.07)",
              color:mode===m?"#fff":"rgba(255,255,255,.55)",fontWeight:700,fontSize:13,cursor:"pointer",
            }}>{m==="hokom"?"حكم 👑":"سان ☀️"}</button>
          ))}
        </div>
        {mode==="hokom" && (
          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:14}}>
            {suits.map(s=>{
              const blocked = game.currentBid?.mode==="hokom" && game.currentBid.trump===s;
              return (
                <button key={s} onClick={()=>{ if(!blocked) onBid("hokom",s); }}
                  disabled={blocked}
                  style={{
                    opacity: blocked ? 0.3 : 1,
                    width:48,height:48,borderRadius:10,border:"2px solid rgba(255,255,255,.15)",
                    background:"rgba(255,255,255,.95)",cursor:blocked?"not-allowed":"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,
                  }}>
                  <span style={{fontSize:18,color:SUIT_CLR[s]}}>{SUIT_SYM[s]}</span>
                  <span style={{fontSize:8,color:SUIT_CLR[s],fontWeight:700}}>{SUIT_NAME[s]}</span>
                </button>
              );
            })}
          </div>
        )}
        {mode==="sun" && (
          <button onClick={()=>onBid("sun")} style={{width:"100%",padding:"11px 0",borderRadius:10,border:"none",
            background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",fontWeight:800,fontSize:14,
            cursor:"pointer",marginBottom:12}}>تأكيد السان ☀️</button>
        )}
        {canPass && (
          <button onClick={onPass} style={{width:"100%",padding:"9px 0",borderRadius:10,border:"none",
            background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.4)",fontWeight:600,fontSize:12,cursor:"pointer"}}>
            تمرير
          </button>
        )}
      </motion.div>
    </div>
  );
}

// ── خصم / شريك ────────────────────────────────────────────────────────────────
function HandPile({ pid, game }:{ pid:PlayerId; game:BalootGame }) {
  const count = game.hands[pid]?.length ?? 0;
  const isTurn = game.next===pid && game.phase==="playing";
  const label = POS_LABEL[pid];
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <div style={{fontSize:9,color:isTurn?"#a78bfa":"rgba(255,255,255,.3)",fontWeight:700}}>
        {isTurn?"🎯 ":""}{label}
      </div>
      <div style={{display:"flex",gap:2}}>
        {Array.from({length:count}).map((_,i)=>(
          <div key={i} style={{width:14,height:22,borderRadius:3,
            background:"linear-gradient(135deg,#312e6b,#1e1b4b)",
            border:"1px solid rgba(255,255,255,.12)"}}/>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export interface BalootTableProps { onLeave?:()=>void }

export default function BalootTable({ onLeave }:BalootTableProps) {
  const gameRef = useRef<BalootGame>(new BalootGame());
  const [tick,  setTick]  = useState(0);
  const [phase, setPhase] = useState<"splash"|"game"|"ended">("splash");
  const [msg,   setMsg]   = useState("");
  const [aiOn,  setAiOn]  = useState(false);
  const aiRef = useRef(false);
  const sync  = useCallback(()=>setTick(t=>t+1),[]);
  const g     = gameRef.current;

  function flash(t:string){ setMsg(t); setTimeout(()=>setMsg(""),2500); }

  function startGame(){
    const ng=new BalootGame(); ng.startRound();
    gameRef.current=ng; setMsg(""); aiRef.current=false; setAiOn(false);
    setPhase("game"); setTick(0);
  }

  // ── تشغيل الـ AI ─────────────────────────────────────────────────────────
  const runAI = useCallback(async()=>{
    if(aiRef.current) return;
    aiRef.current=true; setAiOn(true);
    const gc=gameRef.current;

    // bidding loop
    while(gc.phase==="bidding" && gc.players[gc.bidderIndex]!==ME){
      await new Promise(r=>setTimeout(r,650));
      const pid=gc.players[gc.bidderIndex];
      const bid=getBestBid(gc,pid);
      if(bid==="pass") gc.passBid(pid);
      else             gc.proposeBid(pid,bid);
      setTick(t=>t+1);
    }

    // playing loop
    while(gc.phase==="playing" && gc.next!==ME){
      await new Promise(r=>setTimeout(r,750));
      const pid=gc.next;
      const card=getBestCard(gc,pid);
      gc.play(pid,card);
      setTick(t=>t+1);
      if(gc.ended){ setPhase("ended"); aiRef.current=false; setAiOn(false); return; }
      // انتظر لو الـ trick اتعمل clear
      if(Object.keys(gc.trick.cards).length===0) await new Promise(r=>setTimeout(r,400));
    }

    aiRef.current=false; setAiOn(false); setTick(t=>t+1);
  },[]);

  useEffect(()=>{
    if(phase!=="game") return;
    const gc=gameRef.current;
    const needAI=
      (gc.phase==="bidding" && gc.players[gc.bidderIndex]!==ME)||
      (gc.phase==="playing" && gc.next!==ME);
    if(needAI && !aiRef.current) runAI();
  },[tick,phase,runAI]);

  function handleBid(mode:Mode,trump?:Suit){
    if(!g.proposeBid(ME,{mode,trump})) return;
    sync();
    if(g.phase==="playing"||g.players[g.bidderIndex]!==ME) setTimeout(()=>runAI(),300);
  }
  function handlePass(){
    g.passBid(ME); sync();
    setTimeout(()=>runAI(),300);
  }
  function handlePlay(card:Card){
    if(g.next!==ME||g.phase!=="playing") return;
    if(!g.legalCards(ME).some(c=>cKey(c)===cKey(card))){ flash("هذه الورقة غير مسموحة!"); return; }
    g.play(ME,card); sync();
    if(g.ended){ setPhase("ended"); return; }
    setTimeout(()=>runAI(),300);
  }

  // ── SPLASH ─────────────────────────────────────────────────────────────────
  if(phase==="splash") return (
    <div style={{position:"fixed",inset:0,background:"linear-gradient(160deg,#0d0d1a,#111827)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-cairo,sans-serif)",color:"#f4f4f8",padding:24,gap:20}}>
      <motion.div initial={{scale:.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring"}}>
        <div style={{display:"flex",gap:8}}>
          {(["S","H","D","C"] as Suit[]).map(s=>(
            <div key={s} style={{width:52,height:76,borderRadius:10,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 24px rgba(0,0,0,.4)"}}>
              <span style={{fontSize:28,color:SUIT_CLR[s]}}>{SUIT_SYM[s]}</span>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.h1 initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:.15}}
        style={{fontSize:"clamp(34px,8vw,54px)",fontWeight:900,margin:0}}>بالوت</motion.h1>
      <p style={{color:"rgba(255,255,255,.4)",fontSize:14,margin:0}}>أنت + شريك ضد فريق الخصوم</p>
      <motion.button onClick={startGame} whileHover={{scale:1.05}} whileTap={{scale:.95}}
        initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:.25}}
        style={{marginTop:8,padding:"14px 52px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#dc2626,#9f1239)",color:"#fff",fontWeight:800,fontSize:18,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 28px rgba(220,38,38,.4)"}}>
        ابدأ اللعبة ♠
      </motion.button>
      {onLeave&&<button onClick={onLeave} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← رجوع</button>}
    </div>
  );

  // ── ENDED ──────────────────────────────────────────────────────────────────
  if(phase==="ended"){
    const ns=g.scoreTotal.NS, ew=g.scoreTotal.EW, won=ns>=ew;
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-cairo,sans-serif)"}}>
        <motion.div initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}}
          style={{background:"#111",borderRadius:24,padding:"36px 28px",textAlign:"center",maxWidth:320,width:"90%",border:`2px solid ${won?"#22c55e40":"#ef444440"}`}}>
          <div style={{fontSize:64,marginBottom:12}}>{won?"🏆":"😔"}</div>
          <h2 style={{fontWeight:900,fontSize:26,color:won?"#22c55e":"#ef4444",margin:"0 0 8px"}}>{won?"فريقك فاز! 🎉":"الخصوم فازوا 😔"}</h2>
          <div style={{display:"flex",gap:16,justifyContent:"center",margin:"16px 0 24px"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:28,fontWeight:900,color:"#a78bfa"}}>{ns}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>فريقك (NS)</div>
            </div>
            <div style={{fontSize:22,color:"rgba(255,255,255,.25)",alignSelf:"center"}}>vs</div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:28,fontWeight:900,color:"#f87171"}}>{ew}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>الخصوم (EW)</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setPhase("splash")} style={{flex:1,padding:12,borderRadius:12,background:"rgba(255,255,255,.06)",color:"rgba(255,255,255,.5)",border:"1px solid rgba(255,255,255,.1)",cursor:"pointer",fontFamily:"inherit",fontSize:14}}>الرئيسية</button>
            <button onClick={startGame} style={{flex:1,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#dc2626,#9f1239)",color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>جولة جديدة ♠</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── GAME ───────────────────────────────────────────────────────────────────
  const myHand    = g.hands[ME]??[];
  const legal     = (g.phase==="playing"&&g.next===ME)?g.legalCards(ME):[];
  const legalSet  = new Set(legal.map(cKey));
  const isMyTurn  = g.phase==="playing"&&g.next===ME;
  const isBidMe   = g.phase==="bidding"&&g.players[g.bidderIndex]===ME;
  const gameInfo  = g.mode
    ?`${g.mode==="hokom"?"حكم":"سان"}${g.trump?` ${SUIT_SYM[g.trump]}`:""}`
    :"مزايدة…";

  return (
    <div style={{position:"fixed",inset:0,background:"#0a0f1a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",fontFamily:"var(--font-cairo,sans-serif)",userSelect:"none",padding:8,gap:6}}>

      {/* Header */}
      <div style={{width:"100%",maxWidth:480,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <button onClick={()=>setPhase("splash")} style={{padding:"5px 12px",borderRadius:8,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.45)",fontSize:11,fontWeight:700,cursor:"pointer"}}>← رجوع</button>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>فريقك</div>
            <div style={{fontSize:18,fontWeight:900,color:"#a78bfa"}}>{g.scoreTotal.NS}</div>
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.3)",padding:"3px 10px",borderRadius:8,background:"rgba(255,255,255,.05)"}}>{gameInfo}</div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,.3)"}}>خصومك</div>
            <div style={{fontSize:18,fontWeight:900,color:"#f87171"}}>{g.scoreTotal.EW}</div>
          </div>
        </div>
        <div style={{fontSize:10,color:aiOn?"#fbbf24":"transparent",fontWeight:700}}>🤔 يفكر…</div>
      </div>

      {/* الطاولة */}
      <div style={{width:"100%",maxWidth:480,flex:1,display:"flex",flexDirection:"column",justifyContent:"space-between",gap:6,minHeight:0}}>

        {/* شريك شمال */}
        <div style={{display:"flex",justifyContent:"center"}}>
          <HandPile pid="N" game={g}/>
        </div>

        {/* وسط */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
          <HandPile pid="W" game={g}/>

          {/* الطقة */}
          <div style={{flex:1,minHeight:100,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:"min(200px,100%)",minHeight:90,borderRadius:16,
              background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",
              display:"flex",alignItems:"center",justifyContent:"center",gap:5,
              flexWrap:"wrap",padding:8,position:"relative"}}>
              {ALL.map(pid=>{
                const c=g.trick.cards[pid];
                if(!c) return null;
                return <CardView key={pid} card={c} small/>;
              })}
              {Object.keys(g.trick.cards).length===0&&(
                <span style={{color:"rgba(255,255,255,.12)",fontSize:11}}>الطقة</span>
              )}
              {isBidMe&&<BiddingOverlay game={g} onBid={handleBid} onPass={handlePass}/>}
            </div>
          </div>

          <HandPile pid="E" game={g}/>
        </div>

        {/* رسالة */}
        <div style={{textAlign:"center",minHeight:20}}>
          {msg ? (
            <motion.div key={msg} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>{msg}</motion.div>
          ) : (
            <div style={{fontSize:11,color:"rgba(255,255,255,.28)"}}>
              {isBidMe?"🃏 دورك في المزايدة"
               :isMyTurn?"🎯 اختر ورقة"
               :g.phase==="bidding"?"⏳ المزايدة جارية"
               :"⏳ انتظر دورك"}
            </div>
          )}
        </div>
      </div>

      {/* يد اللاعب */}
      <div style={{width:"100%",maxWidth:480,flexShrink:0,overflowX:"auto",padding:"6px 4px 4px"}}>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:4,flexWrap:"nowrap",minWidth:"max-content",margin:"0 auto"}}>
          {myHand.map((card,i)=>{
            const pl=isMyTurn&&legalSet.has(cKey(card));
            return (
              <motion.div key={cKey(card)+i}
                initial={{y:40,opacity:0}} animate={{y:0,opacity:1}}
                transition={{delay:i*.04,type:"spring",stiffness:300,damping:24}}>
                <CardView card={card} playable={pl} onClick={pl?()=>handlePlay(card):undefined}/>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
