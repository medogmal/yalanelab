"use client";
import React from "react";
import { FileText, Plus, Eye, Edit2, Trash2 } from "lucide-react";

export default function PagesManager() {
  const pages = [
    { id: 1, title: "سياسة الخصوصية", slug: "/privacy", status: "published", views: 12450 },
    { id: 2, title: "شروط الخدمة", slug: "/terms", status: "published", views: 8900 },
    { id: 3, title: "من نحن", slug: "/about", status: "draft", views: 0 },
    { id: 4, title: "الأسئلة الشائعة", slug: "/faq", status: "published", views: 23000 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <FileText className="text-pink-500" size={32} />
            إدارة المحتوى
          </h2>
          <p className="text-zinc-400 mt-1">الصفحات الثابتة والمقالات</p>
        </div>
        <button className="px-6 py-2 bg-pink-600 text-white rounded-xl hover:bg-pink-500 transition-colors font-bold flex items-center gap-2">
          <Plus size={18} />
          صفحة جديدة
        </button>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">العنوان</th>
              <th className="px-6 py-4">الرابط</th>
              <th className="px-6 py-4">الحالة</th>
              <th className="px-6 py-4">المشاهدات</th>
              <th className="px-6 py-4 text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm">
            {pages.map((page) => (
              <tr key={page.id} className="hover:bg-zinc-800/30 transition-colors group">
                <td className="px-6 py-4 font-bold text-white">{page.title}</td>
                <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{page.slug}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${page.status === "published" ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-700 text-zinc-400"}`}>
                    {page.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-300 font-mono">{page.views.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
