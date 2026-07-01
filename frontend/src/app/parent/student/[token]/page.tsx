"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, BookOpen, Flame, TrendingUp, Star, BarChart2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StudentProfile {
  username: string;
  level: number;
  streak_days: number;
  xp: number;
  coins: number;
  oxforder_tanga: number;
  exams_taken: number;
  lessons_completed: number;
  average_score: number;
  best_score: number;
  created_at: string;
  recent_activity: { date: string; score: number; percentage: number }[];
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-black text-slate-800">{value}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function StudentProgressPage() {
  const params = useParams();
  const token = decodeURIComponent(params.token as string);

  const [data, setData] = useState<StudentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/parent/student/${token}`)
      .then((res) => setData(res.data))
      .catch(() => setError("Token noto'g'ri yoki foydalanuvchi topilmadi."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/parent" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Logo size={26} showName light={false} />
          <span className="text-slate-300 text-lg">·</span>
          <span className="text-sm font-semibold text-violet-700">O'quvchi taraqqiyoti</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Ma'lumotlar yuklanmoqda...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-semibold mb-1">Xatolik</p>
            <p className="text-red-500 text-sm">{error}</p>
            <Link href="/parent" className="mt-4 inline-block text-sm text-violet-600 hover:underline">
              ← Orqaga
            </Link>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Profile header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black">
                  {data.username[0].toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-black">{data.username}</h1>
                  <div className="flex items-center gap-3 mt-1 text-violet-200 text-xs">
                    <span>Daraja {data.level}</span>
                    <span>·</span>
                    <span>{data.streak_days} kunlik streak 🔥</span>
                    <span>·</span>
                    <span>A'zo: {data.created_at}</span>
                  </div>
                </div>
              </div>

              {/* XP bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-violet-200 mb-1">
                  <span>{data.xp % 500} / 500 Chaqa</span>
                  <span>→ Daraja {data.level + 1}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${((data.xp % 500) / 500) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={Trophy}    label="Imtihonlar"     value={data.exams_taken}        color="bg-amber-50 text-amber-600" />
              <StatCard icon={BookOpen}  label="Tugatilgan darslar" value={data.lessons_completed} color="bg-blue-50 text-blue-600" />
              <StatCard icon={BarChart2} label="O'rtacha ball"  value={`${data.average_score}%`} color="bg-emerald-50 text-emerald-600" />
              <StatCard icon={Star}      label="Eng yaxshi ball" value={`${data.best_score}%`}  color="bg-violet-50 text-violet-600" />
            </div>

            {/* Chaqa summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl">🪙</div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-sm">Gamifikatsiya</p>
                <p className="text-xs text-slate-500">Ballar va tangalar</p>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-800">{data.coins} <span className="text-xs font-normal text-slate-500">Chaqa</span></p>
                {data.oxforder_tanga > 0 && (
                  <p className="font-bold text-amber-600 text-sm">{data.oxforder_tanga} <span className="text-xs font-normal text-amber-400">Tanga</span></p>
                )}
              </div>
            </div>

            {/* Recent exams */}
            {data.recent_activity.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-slate-800 text-sm">So'nggi imtihonlar</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {data.recent_activity.map((a, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0",
                        a.percentage >= 85 ? "bg-emerald-100 text-emerald-700" :
                        a.percentage >= 65 ? "bg-blue-100 text-blue-700" :
                        a.percentage >= 45 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {a.percentage}%
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{a.score} ball</p>
                        <p className="text-xs text-slate-400">{a.date}</p>
                      </div>
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full",
                          a.percentage >= 85 ? "bg-emerald-400" :
                          a.percentage >= 65 ? "bg-blue-400" :
                          a.percentage >= 45 ? "bg-amber-400" : "bg-red-400"
                        )} style={{ width: `${a.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance evaluation */}
            <div className={cn(
              "rounded-2xl p-5 border",
              data.average_score >= 70 ? "bg-emerald-50 border-emerald-200" :
              data.average_score >= 50 ? "bg-amber-50 border-amber-200" :
              "bg-red-50 border-red-200"
            )}>
              <p className={cn("font-bold text-sm mb-1",
                data.average_score >= 70 ? "text-emerald-700" :
                data.average_score >= 50 ? "text-amber-700" : "text-red-700"
              )}>
                {data.average_score >= 70 ? "🏆 Ajoyib natija!" :
                 data.average_score >= 50 ? "👍 Yaxshi ko'rsatkich" : "📚 Ko'proq mashq kerak"}
              </p>
              <p className={cn("text-xs leading-relaxed",
                data.average_score >= 70 ? "text-emerald-600" :
                data.average_score >= 50 ? "text-amber-600" : "text-red-600"
              )}>
                {data.username} o'rtacha {data.average_score}% ko'rsatmoqda.{" "}
                {data.average_score >= 70
                  ? "Juda yaxshi tayyorgarlik ko'rmoqda, davom ettiring!"
                  : data.average_score >= 50
                  ? "Natijalarni yaxshilash uchun kunlik mashqlarni ko'paytiring."
                  : "Darslarni ko'proq o'qib, sprint va imtihon mashqlarini bajarish kerak."}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
