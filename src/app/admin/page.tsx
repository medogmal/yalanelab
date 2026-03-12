"use client";
import React from "react";
import { 
  Users, 
  Gamepad2, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

// Mock Data
const CHART_DATA = [
  { name: 'Sat', users: 400, revenue: 2400 },
  { name: 'Sun', users: 300, revenue: 1398 },
  { name: 'Mon', users: 200, revenue: 9800 },
  { name: 'Tue', users: 278, revenue: 3908 },
  { name: 'Wed', users: 189, revenue: 4800 },
  { name: 'Thu', users: 239, revenue: 3800 },
  { name: 'Fri', users: 349, revenue: 4300 },
];

const STATS = [
  { label: "المستخدمين النشطين", value: "12.5K", change: "+12%", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "المباريات اليومية", value: "854", change: "+5%", icon: Gamepad2, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "مبيعات المتجر", value: "3.2K", change: "+20%", icon: ShoppingBag, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "إجمالي الأرباح", value: "$45.2K", change: "+8%", icon: DollarSign, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export default function AdminOverview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">نظرة عامة</h2>
          <p className="text-zinc-400 mt-1">متابعة حية لأداء المنصة والإحصائيات</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-colors text-sm font-bold border border-zinc-700">
            تصدير التقرير
          </button>
          <button className="px-6 py-2 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-colors text-sm font-bold shadow-lg shadow-amber-500/20">
            تحديث البيانات ↻
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-full">
                  <TrendingUp size={12} />
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-black text-white mb-1 group-hover:scale-105 transition-transform origin-right">{stat.value}</div>
              <div className="text-sm text-zinc-500 font-medium">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="md:col-span-2 bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl border border-zinc-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-amber-500" />
              نشاط المنصة
            </h3>
            <select className="bg-zinc-800 border-zinc-700 text-zinc-300 text-xs rounded-lg p-2 outline-none">
              <option>آخر 7 أيام</option>
              <option>آخر 30 يوم</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Alerts / Activity */}
        <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl border border-zinc-800 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            آخر التنبيهات
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-start p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors border border-zinc-800/50">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-1">محاولة دخول مشبوهة</div>
                  <div className="text-xs text-zinc-500 leading-relaxed">تم رصد محاولة دخول من IP غير معروف للمستخدم Admin</div>
                  <div className="text-[10px] text-zinc-600 mt-2 font-mono">منذ 10 دقائق</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2">
            عرض كل السجلات
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
