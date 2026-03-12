
"use client";
import { useEffect, useState } from "react";
import { Trophy, Calendar, Users, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";

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
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/tournaments")
      .then((r) => r.json())
      .then(setTournaments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 mb-4">
              البطولات المباشرة
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl">
              شارك في أقوى البطولات واربح جوائز قيمة. تنافس مع أفضل اللاعبين في البلوت، اللودو، والدومينو.
            </p>
          </div>
          <div className="hidden md:block">
            <Trophy size={120} className="text-amber-500/20 rotate-12" />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-zinc-900 rounded-2xl border border-zinc-800" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-zinc-800 border-dashed">
            <Trophy size={64} className="mx-auto text-zinc-600 mb-4" />
            <h3 className="text-xl font-bold text-zinc-400">لا توجد بطولات نشطة حالياً</h3>
            <p className="text-zinc-500 mt-2">تابعنا قريباً للمزيد من المنافسات!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.map((t) => (
              <div key={t.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10">
                {/* Status Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    t.status === 'upcoming' ? 'bg-blue-500 text-white' :
                    t.status === 'ongoing' ? 'bg-green-500 text-white animate-pulse' :
                    'bg-zinc-700 text-zinc-300'
                  }`}>
                    {t.status === 'upcoming' ? 'تسجيل مفتوح' : 
                     t.status === 'ongoing' ? 'جارية الآن' : 
                     t.status === 'completed' ? 'منتهية' : 'ملغاة'}
                  </span>
                </div>

                {/* Card Header (Game Image Placeholder) */}
                <div className={`h-40 w-full flex items-center justify-center ${
                  t.gameType === 'baloot' ? 'bg-gradient-to-br from-emerald-900 to-emerald-950' :
                  t.gameType === 'ludo' ? 'bg-gradient-to-br from-red-900 to-red-950' :
                  'bg-gradient-to-br from-indigo-900 to-indigo-950'
                }`}>
                  <h3 className="text-3xl font-black text-white/10 uppercase tracking-widest">{t.gameType}</h3>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">{t.title}</h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">{t.description || "لا يوجد وصف إضافي"}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar size={16} className="text-amber-500" />
                        <span>{new Date(t.startDate).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Users size={16} className="text-blue-500" />
                        <span>{t.currentParticipants}/{t.maxParticipants}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400 font-bold bg-amber-400/10 p-3 rounded-xl justify-center border border-amber-400/20">
                      <DollarSign size={18} />
                      <span>مجموع الجوائز: {t.prizePool}</span>
                    </div>
                  </div>

                  <button 
                    disabled={t.status !== 'upcoming'}
                    className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {t.status === 'upcoming' ? 'سجل الآن' : 'عرض التفاصيل'}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
