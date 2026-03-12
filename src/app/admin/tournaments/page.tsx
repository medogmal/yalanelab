
"use client";
import React, { useState, useEffect } from "react";
import { Trophy, Plus, Trash2, Edit, Calendar, User, DollarSign, Loader2 } from "lucide-react";

type Tournament = {
  id: string;
  title: string;
  gameType: "baloot" | "ludo" | "domino";
  startDate: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  maxParticipants: number;
  currentParticipants: number;
  prizePool: string;
  description?: string;
  winnerId?: string;
};

export default function TournamentsManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newGameType, setNewGameType] = useState("baloot");
  const [newStartDate, setNewStartDate] = useState("");
  const [newMaxParticipants, setNewMaxParticipants] = useState(16);
  const [newPrizePool, setNewPrizePool] = useState("1000");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    try {
      const res = await fetch("/api/admin/tournaments");
      const data = await res.json();
      setTournaments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newStartDate) return;

    try {
      const res = await fetch("/api/admin/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          gameType: newGameType,
          startDate: newStartDate,
          maxParticipants: newMaxParticipants,
          prizePool: newPrizePool,
          description: newDescription,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        fetchTournaments();
        // Reset form
        setNewTitle("");
        setNewGameType("baloot");
        setNewStartDate("");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه البطولة؟")) return;
    try {
      await fetch(`/api/admin/tournaments?id=${id}`, { method: "DELETE" });
      fetchTournaments();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await fetch("/api/admin/tournaments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchTournaments();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <Trophy className="text-amber-500" size={32} />
            إدارة البطولات
          </h2>
          <p className="text-zinc-400 mt-1">إنشاء وتنظيم البطولات والتحكم في حالتها</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          إنشاء بطولة جديدة
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl animate-in slide-in-from-top-4">
          <h3 className="text-xl font-bold text-white mb-4">بيانات البطولة الجديدة</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-zinc-400 text-sm mb-1">اسم البطولة</label>
              <input 
                type="text" 
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2 outline-none focus:border-amber-500"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: بطولة رمضان للبلوت"
                required
              />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-zinc-400 text-sm mb-1">اللعبة</label>
              <select 
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2 outline-none focus:border-amber-500"
                value={newGameType}
                onChange={(e) => setNewGameType(e.target.value)}
              >
                <option value="baloot">بلوت</option>
                <option value="ludo">لودو</option>
                <option value="domino">دومينو</option>
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-zinc-400 text-sm mb-1">تاريخ البدء</label>
              <input 
                type="datetime-local" 
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2 outline-none focus:border-amber-500"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                required
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-zinc-400 text-sm mb-1">عدد المشاركين</label>
              <input 
                type="number" 
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2 outline-none focus:border-amber-500"
                value={newMaxParticipants}
                onChange={(e) => setNewMaxParticipants(Number(e.target.value))}
                min="2"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-zinc-400 text-sm mb-1">مجموع الجوائز (عملة)</label>
              <input 
                type="text" 
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2 outline-none focus:border-amber-500"
                value={newPrizePool}
                onChange={(e) => setNewPrizePool(e.target.value)}
              />
            </div>

             <div className="col-span-2">
              <label className="block text-zinc-400 text-sm mb-1">وصف إضافي</label>
              <textarea 
                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2 outline-none focus:border-amber-500"
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-600 transition-colors"
              >
                حفظ البطولة
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-zinc-500">
          <Loader2 className="animate-spin mx-auto mb-2" size={32} />
          جاري تحميل البطولات...
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-500">
          لا توجد بطولات حالياً. قم بإنشاء أول بطولة!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-amber-500/50 transition-colors">
              <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{t.title}</h3>
                  <span className="text-xs font-mono text-zinc-500 uppercase bg-zinc-900 px-2 py-1 rounded">
                    {t.gameType}
                  </span>
                </div>
                <div className={`px-2 py-1 text-xs font-bold rounded capitalize 
                  ${t.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400' : 
                    t.status === 'ongoing' ? 'bg-green-500/10 text-green-400' : 
                    'bg-zinc-800 text-zinc-400'}`}>
                  {t.status}
                </div>
              </div>
              
              <div className="p-4 space-y-3 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-zinc-600" />
                  <span>{new Date(t.startDate).toLocaleString('ar-EG')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-zinc-600" />
                  <span>{t.currentParticipants} / {t.maxParticipants} مشترك</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-500" />
                  <span className="text-amber-500 font-bold">{t.prizePool}</span>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex gap-2 justify-end">
                {t.status === 'upcoming' && (
                  <button 
                    onClick={() => handleStatusChange(t.id, 'ongoing')}
                    className="text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    بدء البطولة
                  </button>
                )}
                {t.status === 'ongoing' && (
                  <button 
                    onClick={() => handleStatusChange(t.id, 'completed')}
                    className="text-xs bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    إنهاء البطولة
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="text-zinc-500 hover:text-red-400 transition-colors p-1.5"
                  title="حذف"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
