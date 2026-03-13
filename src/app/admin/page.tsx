"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CHART_DATA = [
  { day:"س",  users:400, rev:2400 },
  { day:"ح",  users:300, rev:1398 },
  { day:"ن",  users:200, rev:9800 },
  { day:"ث",  users:278, rev:3908 },
  { day:"ر",  users:189, rev:4800 },
  { day:"خ",  users:239, rev:3800 },
  { day:"ج",  users:349, rev:4300 },
];

const STATS = [
  { label:"المستخدمون النشطون", value:"12.5K", change:"+12%", icon:"◉", color:"#22c55e" },
  { label:"المباريات اليومية",  value:"٨٥٤",  change:"+5%",  icon:"🎮", color:"#00d4ff" },
  { label:"مبيعات المتجر",      value:"3.2K",  change:"+20%", icon:"◇", color:"#f5a623" },
  { label:"إجمالي الأرباح",     value:"$45K",  change:"+8%",  icon:"⚡", color:"#9b5fe0" },
];

const ALERTS = [
  { msg:"لاعب جديد سجّل من مصر", time:"منذ 2 دقيقة",  icon:"✅", color:"#22c55e" },
  { msg:"بطولة جديدة بدأت",      time:"منذ 10 دقائق", icon:"⚡", color:"#f5a623" },
  { msg:"خطأ في دفع المتجر",     time:"منذ 1 ساعة",   icon:"⚠",  color:"#ff2d55"  },
];

export default function AdminDashboard() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:24,maxWidth:1100}}>
      {/* Title */}
      <div>
        <h1 style={{fontWeight:900,fontSize:"clamp(20px,3vw,28px)",color:"#fff",marginBottom:4}}>
          لوحة الإدارة ◈
        </h1>
        <p style={{fontSize:13,fontWeight:700,color:"rgba(0,212,255,0.5)"}}>
          مرحباً — هذه نظرة عامة على المنصة
        </p>
      </div>

      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
        {STATS.map((s, i) => (
          <motion.div key={s.label}
            initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
            transition={{delay:i*0.08}}
            style={{
              padding:"18px 16px",borderRadius:18,
              background:`${s.color}08`,
              border:`1px solid ${s.color}22`,
              position:"relative",overflow:"hidden",
            }}
          >
            <div style={{position:"absolute",top:0,left:"10%",right:"10%",height:1,background:`linear-gradient(90deg,transparent,${s.color}40,transparent)`}}/>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",marginBottom:6}}>
                  {s.label}
                </div>
                <div style={{fontWeight:900,fontSize:"clamp(22px,3vw,28px)",color:"#fff"}}>
                  {s.value}
                </div>
              </div>
              <div style={{
                width:40,height:40,borderRadius:12,flexShrink:0,
                background:`${s.color}15`,border:`1px solid ${s.color}28`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
              }}>{s.icon}</div>
            </div>
            <div style={{
              display:"inline-flex",alignItems:"center",gap:4,
              marginTop:10,padding:"2px 8px",borderRadius:99,
              background:`${s.color}12`,color:s.color,
              fontSize:11,fontWeight:900,
            }}>
              ↑ {s.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Alerts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr min(320px,100%)",gap:16,alignItems:"start"}}>

        {/* Chart */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}}
          style={{
            padding:"20px 16px",borderRadius:20,
            background:"rgba(5,8,24,0.7)",
            border:"1px solid rgba(0,212,255,0.1)",
            backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
          }}
        >
          <div style={{fontWeight:900,fontSize:15,color:"#fff",marginBottom:4}}>
            نشاط الأسبوع
          </div>
          <div style={{fontSize:12,fontWeight:700,color:"rgba(0,212,255,0.4)",marginBottom:16}}>
            المستخدمون والإيرادات
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={CHART_DATA} margin={{top:5,right:5,bottom:5,left:-10}}>
              <defs>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f5a623" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f5a623" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.3)",fontSize:11,fontFamily:"inherit"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"rgba(255,255,255,0.3)",fontSize:10,fontFamily:"inherit"}} axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{background:"rgba(5,8,24,0.95)",border:"1px solid rgba(0,212,255,0.2)",borderRadius:12,fontFamily:"inherit"}}
                labelStyle={{color:"#fff",fontWeight:800}}
                itemStyle={{fontWeight:700}}
              />
              <Area type="monotone" dataKey="users" stroke="#00d4ff" strokeWidth={2} fill="url(#gUsers)" name="مستخدمون"/>
              <Area type="monotone" dataKey="rev"   stroke="#f5a623" strokeWidth={2} fill="url(#gRev)"   name="إيرادات"/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Alerts */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.42}}
          style={{
            padding:"18px 16px",borderRadius:20,
            background:"rgba(5,8,24,0.7)",
            border:"1px solid rgba(0,212,255,0.1)",
            backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
          }}
        >
          <div style={{fontWeight:900,fontSize:15,color:"#fff",marginBottom:14}}>
            تنبيهات حديثة
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {ALERTS.map((a, i) => (
              <div key={i} style={{
                display:"flex",gap:10,alignItems:"flex-start",
                padding:"10px 12px",borderRadius:12,
                background:`${a.color}06`,
                border:`1px solid ${a.color}18`,
              }}>
                <span style={{fontSize:16,flexShrink:0}}>{a.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>{a.msg}</div>
                  <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.3)",marginTop:2}}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
