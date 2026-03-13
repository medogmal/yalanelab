"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const ALLOWED_ROLES = ["admin","super_admin","tournament_organizer","player_monitor"];

const NAV_LINKS = [
  { href:"/admin",             label:"الرئيسية",   icon:"⊞", roles:ALLOWED_ROLES },
  { href:"/admin/users",       label:"المستخدمون", icon:"◉", roles:["admin","super_admin","player_monitor"] },
  { href:"/admin/tournaments", label:"البطولات",   icon:"🎯", roles:["admin","super_admin","tournament_organizer"] },
  { href:"/admin/games",       label:"الألعاب",    icon:"🎮", roles:["admin","super_admin"] },
  { href:"/admin/skins",       label:"السكنات",    icon:"◇", roles:["admin","super_admin"] },
  { href:"/admin/pages",       label:"الصفحات",    icon:"≡", roles:["admin","super_admin"] },
  { href:"/admin/audit",       label:"السجل",      icon:"⊙", roles:["admin","super_admin"] },
  { href:"/admin/settings",    label:"الإعدادات",  icon:"⚙", roles:["admin","super_admin"] },
];

const ROLE_LABEL: Record<string,string> = {
  super_admin:"سوبر أدمن", admin:"أدمن",
  tournament_organizer:"منظم بطولات", player_monitor:"مراقب",
};
const ROLE_COLOR: Record<string,string> = {
  super_admin:"#f59e0b", admin:"#7c3aed", tournament_organizer:"#8b5cf6", player_monitor:"#22c55e",
};

function Sidebar({ user, path, onClose }: { user:any; path:string; onClose?:()=>void }) {
  const roleC = user ? (ROLE_COLOR[user.role] ?? "#7c3aed") : "#7c3aed";
  const links = NAV_LINKS.filter(l => user && l.roles.includes(user.role));

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", padding:"20px 14px" }}>
      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:24 }}>
        <div style={{ width:32, height:32, borderRadius:9, background:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:15, color:"#fff" }}>ي</div>
        <div>
          <div style={{ fontWeight:900, fontSize:13, color:"#f4f4f8" }}>يالا نلعب</div>
          <div style={{ fontSize:8, fontWeight:800, color:"#404050", letterSpacing:"0.1em" }}>ADMIN</div>
        </div>
      </div>

      {/* User card */}
      {user && (
        <div style={{ padding:"12px", borderRadius:12, marginBottom:20, background:"#1e1e25", border:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:`${roleC}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>👤</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:12, color:"#f4f4f8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
              <span style={{ fontSize:9, fontWeight:800, padding:"1px 7px", borderRadius:99, background:`${roleC}15`, color:roleC, marginTop:2, display:"inline-block" }}>
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
        {links.map(l => {
          const on = path === l.href || (l.href !== "/admin" && path.startsWith(l.href));
          return (
            <Link key={l.href} href={l.href} onClick={onClose} style={{
              display:"flex", alignItems:"center", gap:9, padding:"9px 10px", borderRadius:10,
              textDecoration:"none",
              background: on ? "rgba(124,58,237,0.12)" : "transparent",
              border: `1px solid ${on ? "rgba(124,58,237,0.2)" : "transparent"}`,
              color: on ? "#a78bfa" : "#7a7a8a",
              fontWeight:800, fontSize:12, transition:"all .15s",
            }}>
              <span style={{ fontSize:14, width:18, textAlign:"center" }}>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:12 }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 10px", borderRadius:9, textDecoration:"none", color:"#404050", fontSize:11, fontWeight:700 }}>
          ← العودة للعبة
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children:React.ReactNode }) {
  const path   = usePathname();
  const router = useRouter();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mOpen,   setMOpen]   = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user || !ALLOWED_ROLES.includes(d.user.role)) router.push("/");
      else setUser(d.user);
    }).catch(() => router.push("/")).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#0c0c0e" }}>
      <div style={{ width:36, height:36, border:"3px solid #7c3aed", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const activeLabel = NAV_LINKS.find(l => path === l.href || (l.href !== "/admin" && path.startsWith(l.href)))?.label ?? "الرئيسية";

  return (
    <div style={{ display:"flex", minHeight:"100dvh", background:"#0c0c0e", color:"#f4f4f8", fontFamily:"var(--font-cairo),sans-serif" }} dir="rtl">

      {/* Desktop sidebar */}
      <aside style={{ width:210, flexShrink:0, background:"#0e0e12", borderLeft:"1px solid rgba(255,255,255,0.06)", position:"sticky", top:0, height:"100dvh", zIndex:40 }} className="adm-desk">
        <Sidebar user={user} path={path}/>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setMOpen(false)}
              style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)" }}/>
            <motion.aside initial={{x:220}} animate={{x:0}} exit={{x:220}} transition={{type:"spring",damping:28,stiffness:300}}
              style={{ position:"fixed", top:0, right:0, bottom:0, width:220, zIndex:60, background:"#0e0e12", borderLeft:"1px solid rgba(255,255,255,0.08)" }}>
              <Sidebar user={user} path={path} onClose={() => setMOpen(false)}/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Topbar */}
        <header style={{ position:"sticky", top:0, zIndex:30, height:52, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 clamp(12px,3vw,24px)", background:"rgba(12,12,14,0.95)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderBottom:"1px solid rgba(255,255,255,0.05)", gap:10 }}>
          <button onClick={() => setMOpen(true)} className="adm-mob" style={{ width:34, height:34, borderRadius:9, border:"1px solid rgba(255,255,255,0.08)", background:"#131317", color:"#c0c0cc", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontFamily:"inherit" }}>☰</button>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:11, color:"#404050", fontWeight:700 }}>Admin / </span>
            <span style={{ fontSize:13, fontWeight:900, color:"#f4f4f8" }}>{activeLabel}</span>
          </div>
          {user && (
            <span style={{ fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:99, background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.18)", color:"#a78bfa" }}>
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          )}
        </header>

        <main style={{ flex:1, overflow:"auto", padding:"clamp(16px,3vw,28px)" }}>
          {children}
        </main>
      </div>

      <style>{`
        .adm-desk{display:flex!important;flex-direction:column;}
        .adm-mob{display:none!important;}
        @media(max-width:767px){.adm-desk{display:none!important;}.adm-mob{display:flex!important;}}
      `}</style>
    </div>
  );
}
