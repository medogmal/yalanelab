"use client";
import React, { useEffect, useState } from "react";
import { 
  Store, 
  UploadCloud, 
  Trash2, 
  Plus, 
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Loader2,
  Info
} from "lucide-react";
import DominoGridReference from "@/components/domino/DominoGridReference";

type Skin = {
  id: string;
  type: string;
  name: string;
  asset: string;
  price?: number;
  vip_required?: boolean;
};

export default function SkinsManager() {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Partial<Skin>>({ type: "avatar", price: 500, vip_required: false });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSkins();
  }, []);

  async function fetchSkins() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/skins");
      const data = await res.json();
      setSkins(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id || !form.name) return;

    let assetPath = form.asset;

    if (file) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "skins"); // Upload to /public/skins

      try {
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          assetPath = uploadData.path; // e.g., /skins/123_image.png
        } else {
          alert("فشل رفع الملف: " + uploadData.error);
          setUploading(false);
          return;
        }
      } catch (err) {
        console.error("Upload error", err);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (!assetPath) {
      alert("يرجى رفع صورة أو إدخال رابط");
      return;
    }

    const payload = { ...form, asset: assetPath };

    const res = await fetch("/api/admin/skins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      fetchSkins();
      setForm({ type: "avatar", id: "", name: "", asset: "", price: 500, vip_required: false });
      setFile(null);
    } else {
      alert("خطأ أثناء الإضافة. تأكد من عدم تكرار المعرف.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    await fetch(`/api/admin/skins?id=${id}`, { method: "DELETE" });
    fetchSkins();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <Store className="text-amber-500" size={32} />
            إدارة المتجر
          </h2>
          <p className="text-zinc-400 mt-1">إضافة وحذف وتعديل الاسكنات والعناصر</p>
        </div>
      </div>

      {/* Add Form */}
      <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl border border-zinc-800">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Plus size={20} className="text-emerald-500" />
          إضافة عنصر جديد
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400">النوع</label>
            <select
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-3 outline-none focus:border-amber-500 transition-colors"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="avatar">Avatar</option>
              <option value="ludo_skin">Ludo Skin</option>
              <option value="chess_skin">Chess Skin</option>
              <option value="baloot_skin">Baloot Skin</option>
              <option value="baloot_frame">Baloot Frame</option>
              <option value="character">Character</option>
              <option value="domino_skin">Domino Skin</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400">المعرف (ID)</label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-3 outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
              placeholder="e.g. skin_gold"
              value={form.id || ""}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400">الاسم الظاهر</label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-3 outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
              placeholder="e.g. Royal Gold"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400">السعر (عملة)</label>
            <input
              type="number"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-3 outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600"
              placeholder="500"
              value={form.price || 0}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2 flex items-center h-full pb-3">
             <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-white transition-colors">
                <input 
                    type="checkbox"
                    checked={form.vip_required || false}
                    onChange={(e) => setForm({ ...form, vip_required: e.target.checked })}
                    className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900"
                />
                <span className="text-sm font-bold">حصري لـ VIP/Plus</span>
             </label>
          </div>
          
          {/* File Upload */}
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold text-zinc-400">الصورة / الملف</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className={`flex items-center justify-center gap-2 w-full bg-zinc-800 border border-zinc-700 border-dashed rounded-xl px-3 py-3 cursor-pointer hover:bg-zinc-700/50 transition-colors ${file ? "text-emerald-400 border-emerald-500/50" : "text-zinc-400"}`}
              >
                {file ? (
                  <>
                    <CheckCircle size={18} />
                    <span className="truncate max-w-[150px] text-xs">{file.name}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} />
                    <span className="text-xs">
                        {form.type === 'domino_skin' ? 'Sprite Sheet (7x4)' : 'رفع صورة (PNG/JPG)'}
                    </span>
                  </>
                )}
              </label>
            </div>
            {form.type === 'domino_skin' && (
                <div className="text-[10px] text-amber-500/80 leading-tight">
                    * للدومينو: ارفع صورة واحدة (Sprite Sheet) تحتوي على جميع القطع الـ 28 مرتبة في 7 أعمدة و 4 صفوف.
                </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <button 
              type="submit" 
              disabled={uploading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 className="animate-spin" size={20} /> : "إضافة"}
            </button>
          </div>
        </form>

        {form.type === 'domino_skin' && (
          <div className="mt-6 border-t border-zinc-800 pt-6">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Info size={16} />
              <span className="text-sm font-bold">دليل ترتيب قطع الدومينو</span>
            </div>
            <div className="text-xs text-zinc-400 mb-4">
              لضمان ظهور القطع بشكل صحيح داخل اللعبة، يرجى التأكد من أن الصورة المرفوعة (Sprite Sheet) تتبع الترتيب التالي (من اليسار لليمين، صفاً بصف):
            </div>
            <div className="overflow-x-auto">
               <DominoGridReference />
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-48 bg-zinc-900/50 rounded-2xl animate-pulse" />)
        ) : (
          skins.map((skin) => (
            <div key={skin.id} className="group relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4 hover:border-amber-500/50 transition-all hover:-translate-y-1">
              <div className="aspect-square bg-zinc-950/50 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center border border-zinc-800/50">
                {skin.asset ? (
                  <img src={skin.asset} alt={skin.name} className="object-contain max-w-full max-h-full" />
                ) : (
                  <ImageIcon className="text-zinc-700" size={48} />
                )}
                <div className="absolute top-2 right-2 bg-zinc-900/80 text-white text-[10px] px-2 py-1 rounded-full border border-zinc-700 backdrop-blur-md">
                  {skin.type}
                </div>
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white">{skin.name}</h4>
                  <p className="text-xs text-zinc-500 font-mono mt-1">{skin.id}</p>
                </div>
                <button 
                  onClick={() => handleDelete(skin.id)}
                  className="text-zinc-600 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
