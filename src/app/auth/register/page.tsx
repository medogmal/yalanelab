"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { usePlatformStore } from "@/lib/platform/store";
import { getMoodByCountry, type CountryCode } from "@/lib/platform/cultural-themes";

type Step = 1 | 2 | 3;

const COUNTRIES = [
  { code:"EG"    as CountryCode, flag:"🇪🇬", name:"مصر",      color:"#ce1126", players:"٨,٢٤٠",  pts:721 },
  { code:"SA"    as CountryCode, flag:"🇸🇦", name:"السعودية", color:"#00a550", players:"١٢,٤٠٠", pts:847 },
  { code:"YE"    as CountryCode, flag:"🇾🇪", name:"اليمن",    color:"#c8102e", players:"٣,٨٠٠",  pts:389 },
  { code:"AE"    as CountryCode, flag:"🇦🇪", name:"الإمارات", color:"#009e60", players:"٦,١٠٠",  pts:310 },
  { code:"KW"    as CountryCode, flag:"🇰🇼", name:"الكويت",   color:"#007a3d", players:"٢,٩٠٠",  pts:198 },
  { code:"OTHER" as CountryCode, flag:"🌍", name:"أخرى",      color:"#475569", players:"??",      pts:0   },
];
const AVATARS = ["🧑","👩","🧔","👨‍💼","👩‍💼","🥷","👸","🤴","🦸","🧙"];
const MAX_PTS = 847;

const INPUT = {
  width:"100%",padding:"11px 13px 11px 36px",borderRadius:10,
  background:"#1a1a20",
  border:"1px solid rgba(255,255,255,0.08)",
  color:"#f4f4f8",fontSize:14,fontWeight:500,
  fontFamily:"inherit",outline:"none",
} as React.CSSProperties;

export default function RegisterPage() {
  const router = useRouter();
  const { setCulturalMood } = usePlatformStore();
  const [step,     setStep]     = useState<Step>(1);
  const [country,  setCountry]  = useState<CountryCode | null>(null);
  const [avatar,   setAvatar]   = useState("🧑");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState<string | null>(null);

  const sel = COUNTRIES.find(c => c.code === country);

  async function submit() {
    if (!name.trim() || !email.trim() || !password) { setMsg("أكمل كل الحقول"); return; }
    setLoading(true); setMsg(null);
    try {
      const res  = await fetch("/api/auth/register", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name, email, password, country, avatar }),
      });
      const data = await res.json();
      if (res.ok) {
        if (country) setCulturalMood(getMoodByCountry(country));
        router.push("/games/domino/online");
      } else {
        setMsg(data.error ?? "فشل إنشاء الحساب");
      }
    } catch { setMsg("حدث خطأ، حاول مجدداً"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight:"100dvh",
      display:"flex",alignItems:"center",justifyContent:"center",
      background:"#0c0c0e",fontFamily:"var(--font-cairo),sans-serif",
      padding:"24px 16px",
    }} dir="rtl">
      {/* Dynamic country glow */}
      {sel && (
        <div style={{
          position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
          background:`radial-gradient(ellipse 70% 50% at 50% 20%,${sel.color}08,transparent 60%)`,
          transition:"background .5s",
        }}/>
      )}

      <motion.div
        initial={{opacity:0,scale:0.93,y:20}}
        animate={{opacity:1,scale:1,y:0}}
        transition={{duration:0.4}}
        style={{
          position:"relative",zIndex:10,
          width:"100%",maxWidth:400,
          background:"#131317",
          border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:22,
          overflow:"hidden",padding:"28px 22px",
          maxHeight:"90dvh",overflowY:"auto",
        }}
      >
        {/* Top accent */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed)"}}/>

        {/* Logo row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20}}>
          <div style={{
            width:38,height:38,borderRadius:10,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:900,fontSize:18,
            background:"#7c3aed",
            color:"#fff",
          }}>ي</div>
          <span style={{fontWeight:900,fontSize:18,color:"#f4f4f8"}}>يالا نلعب</span>
        </div>

        {/* Step indicator */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:24}}>
          {["🌍","🎭","📝"].map((ico,i) => {
            const s = (i+1) as Step;
            const done   = step > s;
            const active = step === s;
            return (
              <React.Fragment key={i}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{
                    width:26,height:26,borderRadius:"50%",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:11,fontWeight:900,
                    background: done ? "#22c55e" : active ? "#f5a623" : "rgba(255,255,255,0.06)",
                    color: done || active ? "#000" : "rgba(255,255,255,0.2)",
                    transition:"all .3s",
                  }}>
                    {done ? "✓" : s}
                  </div>
                  <span style={{
                    fontSize:11,fontWeight:800,
                    color: active ? "#f5a623" : "rgba(255,255,255,0.2)",
                  }}>{ico}</span>
                </div>
                {i < 2 && <div style={{width:24,height:1,background: step > s ? "#22c55e" : "rgba(255,255,255,0.08)",transition:"background .3s"}}/>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">

          {/* ── STEP 1: Country ── */}
          {step === 1 && (
            <motion.div key="s1"
              initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
            >
              <h2 style={{fontWeight:900,fontSize:18,color:"#fff",marginBottom:4}}>
                من أين أنت؟ 🌍
              </h2>
              <p style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.35)",marginBottom:16}}>
                اختر بلدك — ستمثله في كل مباراة
              </p>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {COUNTRIES.map(c => (
                  <button key={c.code} onClick={() => setCountry(c.code)} style={{
                    padding:"12px 10px",borderRadius:16,textAlign:"right",cursor:"pointer",
                    background: country === c.code ? `${c.color}18` : "rgba(255,255,255,0.03)",
                    border:`1.5px solid ${country === c.code ? c.color+"60" : "rgba(255,255,255,0.06)"}`,
                    boxShadow: country === c.code ? `0 0 20px ${c.color}28` : "none",
                    transition:"all .2s",
                  }}>
                    <div style={{fontSize:22,marginBottom:4}}>{c.flag}</div>
                    <div style={{fontWeight:900,fontSize:13,color:"#fff",marginBottom:2}}>{c.name}</div>
                    <div style={{fontSize:10,fontWeight:700,color:c.color}}>
                      {c.code !== "OTHER" ? `${c.players} لاعب` : "متنوع"}
                    </div>
                    {c.code !== "OTHER" && (
                      <div style={{marginTop:6,height:2,borderRadius:99,background:"rgba(255,255,255,0.06)"}}>
                        <div style={{height:"100%",borderRadius:99,background:c.color,width:`${(c.pts/MAX_PTS)*100}%`}}/>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {sel && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}}
                  style={{
                    textAlign:"center",fontSize:12,fontWeight:900,
                    padding:"8px 12px",borderRadius:12,marginBottom:14,
                    background:`${sel.color}10`,color:sel.color,
                    border:`1px solid ${sel.color}28`,
                  }}>
                  {sel.flag} انضم لـ {sel.players} لاعب من {sel.name}
                </motion.div>
              )}

              <button onClick={() => country && setStep(2)} style={{
                width:"100%",padding:"14px",borderRadius:14,
                fontWeight:900,fontSize:14,border:"none",
                fontFamily:"inherit",cursor: country ? "pointer" : "not-allowed",
                background: country ? "linear-gradient(135deg,#f5a623,#ffd060)" : "rgba(255,255,255,0.05)",
                color: country ? "#000" : "rgba(255,255,255,0.2)",
                boxShadow: country ? "0 8px 24px rgba(245,166,35,0.35)" : "none",
                transition:"all .2s",
              }}>
                التالي ← اختر شخصيتك
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: Avatar ── */}
          {step === 2 && (
            <motion.div key="s2"
              initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
            >
              <h2 style={{fontWeight:900,fontSize:18,color:"#fff",marginBottom:4}}>
                اختر شخصيتك 🎭
              </h2>
              <p style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.35)",marginBottom:16}}>
                هذا وجهك أمام باقي اللاعبين
              </p>

              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setAvatar(a)} style={{
                    aspectRatio:"1",borderRadius:12,fontSize:24,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    background: avatar === a ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.04)",
                    border:`1.5px solid ${avatar === a ? "#f5a623" : "rgba(255,255,255,0.06)"}`,
                    boxShadow: avatar === a ? "0 0 16px rgba(245,166,35,0.28)" : "none",
                    transition:"all .2s",
                  }}>{a}</button>
                ))}
              </div>

              <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
                <div style={{
                  width:72,height:72,borderRadius:20,fontSize:40,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  boxShadow:"0 0 32px rgba(245,166,35,0.12)",
                }}>
                  {avatar}<span style={{fontSize:20}}>{sel?.flag}</span>
                </div>
              </div>

              <div style={{display:"flex",gap:10}}>
                <button onClick={() => setStep(1)} style={{
                  padding:"12px 18px",borderRadius:14,fontWeight:900,fontSize:14,
                  background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  color:"rgba(255,255,255,0.5)",cursor:"pointer",fontFamily:"inherit",
                }}>←</button>
                <button onClick={() => setStep(3)} style={{
                  flex:1,padding:"12px",borderRadius:14,fontWeight:900,fontSize:14,
                  background:"linear-gradient(135deg,#f5a623,#ffd060)",
                  color:"#000",border:"none",cursor:"pointer",fontFamily:"inherit",
                  boxShadow:"0 6px 20px rgba(245,166,35,0.35)",
                }}>التالي ← البيانات</button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Form ── */}
          {step === 3 && (
            <motion.div key="s3"
              initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
            >
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                <span style={{fontSize:36}}>{avatar}</span>
                <div>
                  <h2 style={{fontWeight:900,fontSize:18,color:"#fff",lineHeight:1,marginBottom:4}}>
                    آخر خطوة! 🚀
                  </h2>
                  <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.35)"}}>
                    {sel?.flag} {sel?.name} · {sel?.players} ينتظرونك
                  </p>
                </div>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
                {[
                  { ph:"اسمك في اللعبة", val:name,     set:setName,     type:"text",     ico:"👤" },
                  { ph:"البريد الإلكتروني", val:email,  set:setEmail,    type:"email",    ico:"📧" },
                  { ph:"كلمة المرور",    val:password,  set:setPassword, type:"password", ico:"🔒" },
                ].map((f, i) => (
                  <div key={i} style={{position:"relative"}}>
                    <span style={{
                      position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                      fontSize:15,pointerEvents:"none",
                    }}>{f.ico}</span>
                    <input
                      type={f.type} placeholder={f.ph} value={f.val}
                      onChange={e => f.set(e.target.value)}
                      style={{...INPUT,paddingRight:38}}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor="rgba(0,212,255,0.45)"}
                      onBlur={e  => (e.target as HTMLInputElement).style.borderColor="rgba(0,212,255,0.18)"}
                    />
                  </div>
                ))}
              </div>

              {msg && (
                <div style={{
                  padding:"10px 14px",borderRadius:12,marginBottom:12,
                  background:"rgba(255,45,85,0.1)",
                  border:"1px solid rgba(255,45,85,0.25)",
                  color:"#ff2d55",fontSize:13,fontWeight:700,
                }}>⚠ {msg}</div>
              )}

              <div style={{display:"flex",gap:10}}>
                <button onClick={() => setStep(2)} style={{
                  padding:"12px 18px",borderRadius:14,fontWeight:900,fontSize:14,
                  background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  color:"rgba(255,255,255,0.5)",cursor:"pointer",fontFamily:"inherit",
                }}>←</button>
                <button onClick={submit} disabled={loading} style={{
                  flex:1,padding:"12px",borderRadius:14,fontWeight:900,fontSize:14,
                  background: loading ? "rgba(245,166,35,0.5)" : "linear-gradient(135deg,#f5a623,#ffd060)",
                  color:"#000",border:"none",cursor: loading?"not-allowed":"pointer",
                  fontFamily:"inherit",boxShadow:"0 6px 20px rgba(245,166,35,0.35)",
                }}>
                  {loading ? "جاري الإنشاء..." : "⚡ ابدأ اللعب الآن"}
                </button>
              </div>

              <p style={{textAlign:"center",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.28)",marginTop:14}}>
                لديك حساب؟{" "}
                <Link href="/auth/login" style={{color:"#00d4ff",textDecoration:"none",fontWeight:900}}>
                  سجّل الدخول
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
