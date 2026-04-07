// ═══════════════════════════════════════════════════════════════
//  YALA EDITOR — HTML5 Game Exporter
//  بيولّد ملف HTML واحد يشغّل اللعبة في أي browser
// ═══════════════════════════════════════════════════════════════

import type { GameEngineData } from "@/types/editor";

export function exportToHTML5(engineData: GameEngineData, projectTitle: string): string {
  const data = JSON.stringify(engineData);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(projectTitle)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#07090f;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;font-family:system-ui,sans-serif;overflow:hidden}
#game-canvas{display:block;max-width:100%;max-height:100dvh;image-rendering:pixelated}
#hud{position:fixed;top:10px;left:0;right:0;display:flex;justify-content:space-between;padding:0 16px;pointer-events:none;z-index:10}
#score{background:rgba(0,0,0,.7);color:#fbbf24;padding:6px 16px;border-radius:20px;font-weight:700;font-size:18px;border:1px solid #f59e0b44}
#health-bar{display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.7);padding:6px 12px;border-radius:20px;border:1px solid #ef444444}
#hp-fill{height:10px;background:linear-gradient(90deg,#ef4444,#f97316);border-radius:5px;transition:width .2s;width:100%}
#hp-bg{width:120px;height:10px;background:#1a1a2e;border-radius:5px;overflow:hidden}
#message{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.9);color:#fff;padding:20px 40px;border-radius:16px;font-size:20px;font-weight:700;display:none;text-align:center;border:1px solid #7c3aed;z-index:20;max-width:80%}
#end-screen{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:30;gap:20px}
#end-title{font-size:48px;font-weight:900}
#end-score{font-size:24px;color:#fbbf24}
#restart-btn{background:#7c3aed;border:none;border-radius:12px;color:#fff;padding:14px 36px;font-size:18px;font-weight:700;cursor:pointer}
#controls{position:fixed;bottom:10px;left:0;right:0;text-align:center;color:rgba(255,255,255,.4);font-size:12px;pointer-events:none}
</style>
</head>
<body>
<div id="hud">
  <div id="score">نقاط: 0</div>
  <div id="health-bar">
    <span style="color:#ef4444;font-size:13px">❤</span>
    <div id="hp-bg"><div id="hp-fill"></div></div>
    <span id="hp-text" style="color:#fff;font-size:13px;min-width:36px">100%</span>
  </div>
</div>
<canvas id="game-canvas"></canvas>
<div id="message"></div>
<div id="end-screen">
  <div id="end-title"></div>
  <div id="end-score"></div>
  <button id="restart-btn" onclick="startGame()">العب مجدداً ▶</button>
</div>
<div id="controls">WASD أو ← → للحركة | Space للقفز</div>

<script>
const ENGINE_DATA = ${data};

// ── CANVAS SETUP ──────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
const scene  = ENGINE_DATA.scenes[0];
const SW = scene.width  || 1920;
const SH = scene.height || 1080;
canvas.width  = SW;
canvas.height = SH;

// Scale canvas to fit screen
function scaleCanvas() {
  const scale = Math.min(window.innerWidth/SW, window.innerHeight/SH);
  canvas.style.width  = (SW * scale) + 'px';
  canvas.style.height = (SH * scale) + 'px';
}
scaleCanvas(); window.addEventListener('resize', scaleCanvas);

// ── SPRITE COLORS ──────────────────────────────────────────
const OBJ_COLORS = {
  player:'#7c3aed',enemy:'#dc2626',platform:'#2563eb',wall:'#64748b',
  trigger:'#f59e0b44',collectible:'#fbbf24',npc:'#06b6d4',
  spawn:'#84cc16',goal:'#f97316',decoration:'#a78bfa',text:'#e2e8f0',
  emptyObject:'#64748b',camera:'#6366f1',light:'#fde68a',
};
const CHAR_COLORS = {
  hero_warrior:{body:'#7c3aed',head:'#f5c99a',accent:'#f59e0b'},
  hero_mage:{body:'#1d4ed8',head:'#f5c99a',accent:'#c4b5fd'},
  hero_archer:{body:'#15803d',head:'#f5c99a',accent:'#92400e'},
  hero_ninja:{body:'#1c1917',head:'#292524',accent:'#ef4444'},
  enemy_slime:{body:'#4ade80',head:'#4ade80',accent:'#166534'},
  enemy_skeleton:{body:'#e5e7eb',head:'#f3f4f6',accent:'#1f2937'},
  npc_merchant:{body:'#d97706',head:'#f5c99a',accent:'#f59e0b'},
};

// ── GAME STATE ──────────────────────────────────────────────
let objects = [];
let variables = {...(ENGINE_DATA.variables||{})};
let score = 0;
let keysDown = new Set();
let running = false;
let animId;
let collisionPairs = new Set();
let vsGraphs = scene.vsGraphs || [];
let onStartDone = false;
let frameCount = 0;
let msgTimeout;

// ── INIT OBJECTS ────────────────────────────────────────────
function initObjects() {
  objects = scene.objects.filter(o=>o.active!==false).map(o=>{
    const rb  = (o.components||[]).find(c=>c.type==='Rigidbody2D');
    const col = (o.components||[]).find(c=>c.type==='BoxCollider2D');
    const hs  = (o.components||[]).find(c=>c.type==='HealthSystem');
    const comps={};(o.components||[]).forEach(c=>comps[c.type]=c);
    return {
      id:o.id, name:o.name, type:o.type, tag:o.tag||'Untagged',
      active:true, x:o.x, y:o.y, vx:0, vy:0,
      width:o.width||64, height:o.height||64, rotation:o.rotation||0,
      color:o.color, spriteKey:o.spriteKey||'',
      health:hs?.currentHealth??100, maxHealth:hs?.maxHealth??100,
      hasBody:!!rb,
      isStatic:rb?.bodyType==='Static'||o.isStatic||false,
      isTrigger:col?.isTrigger||false,
      gravityScale:rb?.gravityScale??1,
      mass:rb?.mass??1,
      friction:col?.material?.friction??0.3,
      restitution:col?.material?.bounciness??0,
      onGround:false,
      comps,
      userData:{},
    };
  });
}

// ── PHYSICS ──────────────────────────────────────────────────
const GRAVITY = (scene.gravity||9.8) * 80;

function updatePhysics(dt) {
  for(const obj of objects){
    if(!obj.active||!obj.hasBody||obj.isStatic) continue;
    obj.vy += GRAVITY * obj.gravityScale * dt;

    const pc = obj.comps['PlayerController'];
    if(pc){
      const spd=(pc.moveSpeed||5)*80;
      let mx=0;
      const L=pc.inputMap?.left||'ArrowLeft', R=pc.inputMap?.right||'ArrowRight';
      const J=pc.inputMap?.jump||'Space';
      if(keysDown.has(L)||keysDown.has('KeyA')) mx-=spd;
      if(keysDown.has(R)||keysDown.has('KeyD')) mx+=spd;
      obj.vx=mx;
      if((keysDown.has(J)||keysDown.has('KeyW'))&&obj.onGround){
        obj.vy=-(pc.jumpForce||10)*80*0.55; obj.onGround=false;
      }
    }
    const ai=obj.comps['EnemyAI'];
    if(ai){
      if(ai.aiPattern==='patrol'){
        if(!obj.userData.pDir){obj.userData.pDir=1;obj.userData.pStart=obj.x;}
        if(Math.abs(obj.x-obj.userData.pStart)>150) obj.userData.pDir*=-1;
        obj.vx=obj.userData.pDir*(ai.moveSpeed||2)*32;
      } else if(ai.aiPattern==='chase'){
        const p=objects.find(o=>o.tag==='Player'&&o.active);
        if(p){const dx=p.x-obj.x;const s=(ai.moveSpeed||2)*32;obj.vx=dx>0?s:dx<0?-s:0;}
      }
    }

    obj.x+=obj.vx*dt; obj.y+=obj.vy*dt;
    if(obj.x<0){obj.x=0;obj.vx=0;}
    if(obj.x+obj.width>SW){obj.x=SW-obj.width;obj.vx=0;}
    if(obj.y+obj.height>=SH-20){
      obj.y=SH-20-obj.height;
      obj.vy=obj.vy>0?-(obj.vy*obj.restitution):0;
      obj.onGround=true; obj.vx*=(1-obj.friction*dt*10);
    } else obj.onGround=false;
  }
}

// ── COLLISIONS ───────────────────────────────────────────────
function detectCollisions(){
  const active=objects.filter(o=>o.active&&o.hasBody);
  for(let i=0;i<active.length;i++){
    for(let j=i+1;j<active.length;j++){
      const a=active[i],b=active[j];
      if(!overlap(a,b)) continue;
      const key=a.id+':'+b.id;
      if(!collisionPairs.has(key)){
        collisionPairs.add(key);
        fireEvent(a.isTrigger||b.isTrigger?'OnTriggerEnter':'OnCollisionEnter',a.id,b.id);
        if(a.type==='collectible'&&b.tag==='Player'){destroyObj(a.id);addScore(10);}
        else if(b.type==='collectible'&&a.tag==='Player'){destroyObj(b.id);addScore(10);}
        if(a.tag==='Enemy'&&b.tag==='Player') damageObj(b.id,5);
        else if(b.tag==='Enemy'&&a.tag==='Player') damageObj(a.id,5);
        if((a.type==='goal'&&b.tag==='Player')||(b.type==='goal'&&a.tag==='Player')){endGame(true);}
      }
      if(!a.isTrigger&&!b.isTrigger) resolveCol(a,b);
    }
  }
  for(const k of collisionPairs){
    const [ai,bi]=k.split(':');
    const a=objects.find(o=>o.id===ai),b=objects.find(o=>o.id===bi);
    if(!a||!b||!a.active||!b.active||!overlap(a,b)) collisionPairs.delete(k);
  }
}
function overlap(a,b){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}
function resolveCol(a,b){
  if(a.isStatic&&b.isStatic) return;
  const ox=Math.min(a.x+a.width-b.x,b.x+b.width-a.x);
  const oy=Math.min(a.y+a.height-b.y,b.y+b.height-a.y);
  if(ox<oy){
    const d=a.x<b.x?-1:1;
    if(!a.isStatic){a.x+=d*ox/2;a.vx=0;}
    if(!b.isStatic){b.x-=d*ox/2;b.vx=0;}
  } else {
    if(a.y<b.y){if(!a.isStatic){a.y=b.y-a.height;a.vy=0;a.onGround=true;}}
    else{if(!b.isStatic){b.y=a.y-b.height;b.vy=0;b.onGround=true;}}
  }
}

// ── VISUAL SCRIPTING ─────────────────────────────────────────
const eventQueue=[];
function fireEvent(type,sourceId,targetId){eventQueue.push({type,sourceId,targetId});}

function processVS(){
  if(!onStartDone){
    onStartDone=true;
    for(const g of vsGraphs){const n=g.nodes.find(x=>x.type==='OnGameStart');if(n)execNode(g,n,{});}
  }
  for(const g of vsGraphs){const n=g.nodes.find(x=>x.type==='OnUpdate');if(n)execNode(g,n,{});}
  const evs=[...eventQueue]; eventQueue.length=0;
  for(const ev of evs){
    for(const g of vsGraphs){
      for(const n of g.nodes){
        if(n.type!==ev.type) continue;
        if(n.data.targetId&&n.data.targetId!==ev.sourceId) continue;
        execNode(g,n,{sourceId:ev.sourceId,targetId:ev.targetId});
      }
    }
  }
  for(const k of keysDown){
    for(const g of vsGraphs){
      for(const n of g.nodes){
        if(n.type==='OnKeyDown'&&(!n.data.key||n.data.key===k)) execNode(g,n,{key:k});
      }
    }
  }
}

function execNode(g,n,ctx){
  const d=n.data;
  switch(n.type){
    case 'OnGameStart':case 'OnUpdate':case 'OnCollisionEnter':
    case 'OnTriggerEnter':case 'OnKeyDown':case 'OnHealthZero':
      return chainOut(g,n,'out',ctx);
    case 'If':{const c=Boolean(resolveIn(g,n,'cond',ctx)??d.condition??false);return chainOut(g,n,c?'true':'false',ctx);}
    case 'Compare':{const a=+resolveIn(g,n,'a',ctx)??+d.a??0,b=+resolveIn(g,n,'b',ctx)??+d.b??0,op=d.operator||'==';
      return {'>':a>b,'<':a<b,'>=':a>=b,'<=':a<=b,'==':a===b,'!=':a!==b}[op]??false;}
    case 'AddScore': addScore(+(resolveIn(g,n,'val',ctx)??d.val??10)); return chainOut(g,n,'out',ctx);
    case 'ShowMessage': showMessage(String(resolveIn(g,n,'msg',ctx)??d.message??'')); return chainOut(g,n,'out',ctx);
    case 'EndGame': endGame(Boolean(d.win??false)); return;
    case 'DestroyObject': destroyObj(String(resolveIn(g,n,'target',ctx)??d.targetId??ctx.sourceId??'')); return chainOut(g,n,'out',ctx);
    case 'Teleport':{const o=objects.find(x=>x.id===d.targetId);if(o){o.x=+d.x??0;o.y=+d.y??0;}return chainOut(g,n,'out',ctx);}
    case 'LoadScene': break;
    case 'GetVariable': return variables[d.variableName]??0;
    case 'SetVariable': variables[d.variableName??'']=resolveIn(g,n,'val',ctx)??d.value??0; return chainOut(g,n,'out',ctx);
    case 'MathOp':{const a=+(resolveIn(g,n,'a',ctx)??d.a??0),b=+(resolveIn(g,n,'b',ctx)??d.b??0);
      return {'+':a+b,'-':a-b,'*':a*b,'/':b?a/b:0,'%':a%b}[d.op??'+']??a;}
    case 'Repeat':{for(let i=0;i<(+d.count||3);i++)chainOut(g,n,'body',{...ctx,i});return chainOut(g,n,'done',ctx);}
    default: return chainOut(g,n,'out',ctx);
  }
}
function chainOut(g,n,portId,ctx){let r;for(const c of g.connections.filter(x=>x.fromNodeId===n.id&&x.fromPortId===portId)){const nx=g.nodes.find(x=>x.id===c.toNodeId);if(nx)r=execNode(g,nx,ctx);}return r;}
function resolveIn(g,n,portId,ctx){const c=g.connections.find(x=>x.toNodeId===n.id&&x.toPortId===portId);if(!c)return undefined;const s=g.nodes.find(x=>x.id===c.fromNodeId);return s?execNode(g,s,ctx):undefined;}

// ── HELPERS ──────────────────────────────────────────────────
function addScore(v){score+=v;document.getElementById('score').textContent='نقاط: '+score;}
function destroyObj(id){const i=objects.findIndex(o=>o.id===id);if(i>=0)objects.splice(i,1);}
function damageObj(id,dmg){
  const o=objects.find(x=>x.id===id);if(!o)return;
  o.health=Math.max(0,o.health-dmg);
  const pct=(o.health/o.maxHealth*100).toFixed(0)+'%';
  document.getElementById('hp-fill').style.width=pct;
  document.getElementById('hp-text').textContent=pct;
  if(o.health<=0) fireEvent('OnHealthZero',o.id);
}
function showMessage(text){
  const el=document.getElementById('message');
  el.textContent=text;el.style.display='block';
  clearTimeout(msgTimeout);msgTimeout=setTimeout(()=>el.style.display='none',3000);
}
function endGame(win){
  running=false;cancelAnimationFrame(animId);
  const es=document.getElementById('end-screen');
  document.getElementById('end-title').textContent=win?'🏆 فزت!':'💀 خسرت';
  document.getElementById('end-title').style.color=win?'#22c55e':'#ef4444';
  document.getElementById('end-score').textContent='نقاطك: '+score;
  es.style.display='flex';
}

// ── RENDER ───────────────────────────────────────────────────
const bgC=scene.backgroundColor||{r:12,g:15,b:30};
const bgColor=\`rgb(\${bgC.r},\${bgC.g},\${bgC.b})\`;

function render(){
  ctx.fillStyle=bgColor; ctx.fillRect(0,0,SW,SH);

  // Background gradient
  const grad=ctx.createLinearGradient(0,0,0,SH);
  grad.addColorStop(0,\`rgba(\${bgC.r},\${bgC.g},\${bgC.b},1)\`);
  grad.addColorStop(0.7,'rgba(30,60,90,0.8)');
  grad.addColorStop(1,'rgba(60,100,60,1)');
  ctx.fillStyle=grad; ctx.fillRect(0,0,SW,SH);

  // Ground
  ctx.fillStyle='#5cb85c'; ctx.fillRect(0,SH-20,SW,8);
  ctx.fillStyle='#8B5E3C'; ctx.fillRect(0,SH-12,SW,12);

  for(const obj of objects){
    if(!obj.active) continue;
    ctx.save();
    const cx=obj.x+obj.width/2, cy=obj.y+obj.height/2;
    ctx.translate(cx,cy); ctx.rotate((obj.rotation||0)*Math.PI/180); ctx.translate(-obj.width/2,-obj.height/2);

    const sk=obj.spriteKey;
    if(sk&&CHAR_COLORS[sk]){
      drawCharacter(ctx,obj,CHAR_COLORS[sk]);
    } else if(obj.type==='collectible'){
      drawStar(ctx,obj);
    } else if(obj.type==='platform'||obj.type==='wall'){
      const c=obj.color;
      ctx.fillStyle=c?\`rgba(\${c.r},\${c.g},\${c.b},\${c.a})\`:OBJ_COLORS[obj.type]||'#2563eb';
      ctx.fillRect(0,0,obj.width,obj.height);
      ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(0,0,obj.width,4);
    } else if(obj.type==='spawn'){
      drawFlag(ctx,obj,'#84cc16');
    } else if(obj.type==='goal'){
      drawFlag(ctx,obj,'#f97316');
    } else if(obj.type==='trigger'){
      ctx.fillStyle='rgba(245,158,11,0.15)';
      ctx.strokeStyle='#f59e0b'; ctx.lineWidth=2; ctx.setLineDash([8,4]);
      ctx.fillRect(0,0,obj.width,obj.height); ctx.strokeRect(0,0,obj.width,obj.height);
      ctx.setLineDash([]);
    } else {
      const c=obj.color;
      ctx.fillStyle=c?\`rgba(\${c.r},\${c.g},\${c.b},\${c.a})\`:OBJ_COLORS[obj.type]||'#7c3aed';
      const r=Math.min(8,obj.width/4,obj.height/4);
      roundRect(ctx,0,0,obj.width,obj.height,r); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.2)'; roundRect(ctx,0,0,obj.width,4,r); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='bold 11px system-ui';
      ctx.textAlign='center'; ctx.fillText(obj.name.slice(0,12),obj.width/2,obj.height/2+4);
    }
    ctx.restore();
  }
}

function drawCharacter(ctx,obj,colors){
  const w=obj.width,h=obj.height;
  // Body
  ctx.fillStyle=colors.body; roundRect(ctx,w*0.2,h*0.3,w*0.6,h*0.45,4); ctx.fill();
  // Head
  ctx.fillStyle=colors.head; roundRect(ctx,w*0.25,h*0.04,w*0.5,h*0.3,6); ctx.fill();
  // Legs
  ctx.fillStyle=colors.accent;
  ctx.fillRect(w*0.25,h*0.72,w*0.22,h*0.25);
  ctx.fillRect(w*0.53,h*0.72,w*0.22,h*0.25);
  // Eyes
  ctx.fillStyle='#111827';
  ctx.beginPath(); ctx.arc(w*0.38,h*0.16,w*0.05,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(w*0.62,h*0.16,w*0.05,0,Math.PI*2); ctx.fill();
}
function drawStar(ctx,obj){
  const cx=obj.width/2,cy=obj.height/2,r=Math.min(obj.width,obj.height)*0.38;
  ctx.fillStyle='#fbbf24';
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5-Math.PI/2;
    const ia=(i+0.5)*Math.PI*2/5-Math.PI/2;
    if(i===0)ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
    else ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
    ctx.lineTo(cx+r*0.4*Math.cos(ia),cy+r*0.4*Math.sin(ia));
  }
  ctx.closePath(); ctx.fill();
}
function drawFlag(ctx,obj,color){
  ctx.fillStyle='#9ca3af'; ctx.fillRect(obj.width/2-2,0,4,obj.height);
  ctx.fillStyle=color; ctx.beginPath();
  ctx.moveTo(obj.width/2+2,2); ctx.lineTo(obj.width*0.9,obj.height*0.25);
  ctx.lineTo(obj.width/2+2,obj.height*0.5); ctx.closePath(); ctx.fill();
}
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();
}

// ── GAME LOOP ─────────────────────────────────────────────────
let lastTime=0;
function loop(now){
  if(!running){animId=requestAnimationFrame(loop);return;}
  const dt=Math.min((now-lastTime)/1000,0.05); lastTime=now; frameCount++;
  processVS(); updatePhysics(dt); detectCollisions(); render();
  animId=requestAnimationFrame(loop);
}

// ── KEYBOARD ──────────────────────────────────────────────────
window.addEventListener('keydown',e=>{keysDown.add(e.code);e.preventDefault();});
window.addEventListener('keyup',e=>keysDown.delete(e.code));

// ── TOUCH CONTROLS (mobile) ───────────────────────────────────
const touchBtns={};
function addTouchBtn(id,key,label,style){
  const btn=document.createElement('button');
  btn.textContent=label;btn.id='tb_'+id;
  btn.style.cssText='position:fixed;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);border-radius:50%;color:#fff;font-size:20px;font-weight:bold;cursor:pointer;user-select:none;z-index:100;width:60px;height:60px;'+style;
  btn.addEventListener('touchstart',e=>{e.preventDefault();keysDown.add(key);},{passive:false});
  btn.addEventListener('touchend',e=>{e.preventDefault();keysDown.delete(key);},{passive:false});
  document.body.appendChild(btn);touchBtns[id]=btn;
}
if('ontouchstart' in window){
  addTouchBtn('left','ArrowLeft','◀','bottom:80px;left:20px');
  addTouchBtn('right','ArrowRight','▶','bottom:80px;left:100px');
  addTouchBtn('jump','Space','▲','bottom:80px;right:20px');
}

// ── START ─────────────────────────────────────────────────────
function startGame(){
  score=0;onStartDone=false;collisionPairs.clear();
  document.getElementById('score').textContent='نقاط: 0';
  document.getElementById('hp-fill').style.width='100%';
  document.getElementById('hp-text').textContent='100%';
  document.getElementById('end-screen').style.display='none';
  document.getElementById('message').style.display='none';
  initObjects();running=true;lastTime=performance.now();
}
startGame();
requestAnimationFrame(loop);
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

export function downloadHTML5(engineData: GameEngineData, title: string) {
  const html = exportToHTML5(engineData, title);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${title.replace(/\s+/g,"-")}.html`;
  a.click(); URL.revokeObjectURL(url);
}
