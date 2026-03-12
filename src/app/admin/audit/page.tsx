"use client";
import React from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function AuditLogs() {
  const logs = [
    { id: 1, type: "warning", message: "محاولة دخول فاشلة من IP غير معروف", user: "Admin", date: "2026-03-08 10:30 AM" },
    { id: 2, type: "success", message: "تحديث إعدادات لعبة البلوت", user: "Super Admin", date: "2026-03-08 09:15 AM" },
    { id: 3, type: "info", message: "تسجيل دخول مستخدم جديد", user: "System", date: "2026-03-08 08:45 AM" },
    { id: 4, type: "error", message: "خطأ في الاتصال بقاعدة البيانات", user: "System", date: "2026-03-07 11:20 PM" },
  ];

  function getIcon(type: string) {
    switch (type) {
      case "warning": return <AlertTriangle className="text-amber-500" size={20} />;
      case "success": return <CheckCircle className="text-emerald-500" size={20} />;
      case "error": return <ShieldAlert className="text-red-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-2">
          <ShieldAlert className="text-red-500" size={32} />
          سجلات النظام
        </h2>
        <p className="text-zinc-400 mt-1">مراقبة الأمان والنشاطات</p>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-zinc-800">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-zinc-800/30 transition-colors flex items-start gap-4">
              <div className={`p-2 rounded-lg bg-zinc-950 border border-zinc-800`}>
                {getIcon(log.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-white text-sm">{log.message}</h4>
                  <span className="text-[10px] text-zinc-500 font-mono">{log.date}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-400">بواسطة: <span className="text-amber-500">{log.user}</span></span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-zinc-400`}>
                    {log.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
