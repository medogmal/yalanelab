"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Edit2, Shield, UserX, Loader2, X, Check } from "lucide-react";

type User = { id:string; name:string; email:string; role:string; tier:string; coins:number; createdAt:number; };

const ROLE_STYLE: Record<string,{label:string;color:string;bg:string}> = {
  super_admin:          {label:"سوبر أدمن",     color:"#a78bfa",bg:"rgba(167,139,250,.1)"},
  admin:                {label:"أدمن",           color:"#f59e0b",bg:"rgba(245,158,11,.1)"},
  tournament_organizer: {label:"منظم بطولات",   color:"#38bdf8",bg:"rgba(56,189,248,.1)"},
  player_monitor:       {label:"مراقب",          color:"#34d399",bg:"rgba(52,211,153,.1)"},
  user:                 {label:"مستخدم",         color:"rgba(255,255,255,.3)",bg:"rgba(255,255,255,.05)"},
};

const ROLES_LIST = [
  {id:"user",              label:"مستخدم عادي",         desc:"لا توجد صلاحيات إدارية"},
  {id:"tournament_organizer",label:"منظم بطولات",        desc:"إنشاء وإدارة البطولات فقط"},
  {id:"player_monitor",    label:"مراقب لاعبين",         desc:"مراقبة وحظر اللاعبين المخالفين"},
  {id:"admin",             label:"مسؤول (Admin)",        desc:"صلاحيات كاملة عدا الإعدادات الحساسة"},
  {id:"super_admin",       label:"سوبر أدمن",            desc:"كل الصلاحيات"},
];

export default function UsersManager() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [filtered,setFiltered]= useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [editing, setEditing] = useState<User|null>(null);

  useEffect(()=>{ fetchUsers(); },[]);
  useEffect(()=>{
    setFiltered(!search?users:users.filter(u=>
      u.name.toLowerCase().includes(search.toLowerCase())||
      u.email.toLowerCase().includes(search.toLowerCase())));
  },[search,users]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const d   = await res.json();
      setUsers(d); setFiltered(d);
    } catch(e){ console.error(e); }
    finally{ setLoading(false); }
  }

  async function handleUpdateRole(newRole:string) {
    if (!editing) return;
    try {
      await fetch("/api/admin/users",{method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:editing.id,role:newRole})});
      setEditing(null); fetchUsers();
    } catch(e){ console.error(e); }
  }

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users size={24} style={{color:"#38bdf8"}}/>إدارة المستخدمين
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">التحكم في الحسابات والصلاحيات</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"/>
          <input type="text" placeholder="بحث بالاسم أو البريد..." value={search}
            onChange={e=>setSearch(e.target.value)}
            className="input pr-9 py-2.5 text-sm"/>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl overflow-hidden border" style={{background:"rgba(255,255,255,.02)",borderColor:"rgba(255,255,255,.06)"}}>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead style={{background:"rgba(255,255,255,.03)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
              <tr className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                {["المستخدم","الدور","العضوية","الرصيد","تاريخ الانضمام",""].map((h,i)=>(
                  <th key={i} className="px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading?(
                <tr><td colSpan={6} className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={22} className="animate-spin" style={{color:"#38bdf8"}}/>
                    <span className="text-slate-600 text-xs">جاري التحميل...</span>
                  </div>
                </td></tr>
              ):filtered.length===0?(
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-600 text-sm">لا يوجد نتائج.</td></tr>
              ):filtered.map((u,i)=>{
                const rs = ROLE_STYLE[u.role]||ROLE_STYLE.user;
                return (
                  <motion.tr key={u.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.04}}
                    className="group border-b hover:bg-white/[0.025] transition-colors"
                    style={{borderColor:"rgba(255,255,255,.04)"}}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-black flex-shrink-0"
                          style={{background:"linear-gradient(135deg,#f0a500,#f5be3a)"}}>
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-white text-sm">{u.name}</div>
                          <div className="text-[11px] text-slate-600 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-xs font-black"
                        style={{color:rs.color,background:rs.bg}}>
                        {u.role==="super_admin"&&<Shield size={11}/>}{rs.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-black uppercase px-2 py-0.5 rounded-lg"
                        style={{color:"rgba(255,255,255,.4)",background:"rgba(255,255,255,.05)"}}>{u.tier}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-black" style={{color:"#f59e0b"}}>{u.coins.toLocaleString()} 🪙</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                      {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>setEditing(u)}
                          className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors" title="تعديل">
                          <Edit2 size={14} style={{color:"#38bdf8"}}/>
                        </button>
                        <button className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" title="حظر">
                          <UserX size={14} style={{color:"#ff5252"}}/>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading&&filtered.length>0&&(
          <div className="px-5 py-3 flex justify-between items-center text-xs text-slate-600"
            style={{borderTop:"1px solid rgba(255,255,255,.05)"}}>
            <span>عرض {filtered.length} من {users.length} مستخدم</span>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 rounded-lg disabled:opacity-30 btn-ghost text-xs">السابق</button>
              <button disabled className="px-3 py-1 rounded-lg disabled:opacity-30 btn-ghost text-xs">التالي</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}}
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{background:"#07090f",border:"1px solid rgba(255,255,255,.1)"}}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg text-white">تعديل صلاحيات</h3>
              <button onClick={()=>setEditing(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500">
                <X size={18}/>
              </button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl mb-5"
              style={{background:"rgba(255,255,255,.04)"}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black"
                style={{background:"linear-gradient(135deg,#f0a500,#f5be3a)"}}>
                {editing.name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-black text-white text-sm">{editing.name}</div>
                <div className="text-xs text-slate-600">{editing.email}</div>
              </div>
            </div>
            <div className="space-y-2">
              {ROLES_LIST.map(r=>{
                const active=editing.role===r.id;
                return (
                  <button key={r.id} onClick={()=>handleUpdateRole(r.id)}
                    className="w-full text-right p-3 rounded-xl border transition-all flex items-center gap-3"
                    style={active?{background:"rgba(240,165,0,.08)",borderColor:"rgba(240,165,0,.3)",color:"#f0a500"}
                                 :{background:"rgba(255,255,255,.02)",borderColor:"rgba(255,255,255,.06)",color:"rgba(255,255,255,.5)"}}>
                    <div className="flex-1">
                      <div className="font-black text-sm">{r.label}</div>
                      <div className="text-[10px] opacity-50 mt-0.5">{r.desc}</div>
                    </div>
                    {active&&<Check size={16} style={{color:"#f0a500"}}/>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
