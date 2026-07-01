"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, History, Trophy, BookOpen, Gamepad2,
  ChevronRight, Clock, TrendingUp, FileText, BarChart2,
} from "lucide-react";
import { isAuthenticated } from "@/lib/api";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { useExamHistory, useUserStats } from "@/lib/queries";
import { useLang } from "@/lib/lang";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

function ScoreBadge({ pct }: { pct: number }) {
  return (
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0",
      pct >= 85 ? "bg-emerald-100 text-emerald-700" :
      pct >= 65 ? "bg-blue-100 text-blue-700" :
      pct >= 45 ? "bg-amber-100 text-amber-700" :
      "bg-red-100 text-red-700"
    )}>
      {pct}%
    </div>
  );
}

function EmptyState({ icon, title, desc, href, cta }: {
  icon: React.ReactNode; title: string; desc: string; href: string; cta: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
        {icon}
      </div>
      <p className="font-semibold text-slate-700 mb-1">{title}</p>
      <p className="text-sm text-slate-400 mb-5">{desc}</p>
      <Link href={href}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
        {cta}
      </Link>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const { tr } = useLang();
  const { data: examHistory, isLoading: examsLoading } = useExamHistory();
  const { data: stats } = useUserStats();

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  const exams = examHistory ?? [];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <History className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-900">Faoliyat tarixi</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Summary stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Trophy className="w-4 h-4 text-amber-500" />, value: stats.exams_taken, label: "Imtihonlar", bg: "bg-amber-50 border-amber-100" },
              { icon: <BookOpen className="w-4 h-4 text-blue-500" />, value: stats.lessons_completed, label: "Darslar", bg: "bg-blue-50 border-blue-100" },
              { icon: <BarChart2 className="w-4 h-4 text-emerald-500" />, value: `${Math.round(stats.average_score)}%`, label: "O'rtacha", bg: "bg-emerald-50 border-emerald-100" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} border rounded-2xl p-4 text-center`}>
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-xl font-black text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Exam history */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-amber-500" />
              Imtihon tarixi
            </h2>
            <Link href="/exam"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              <FileText className="w-3 h-3" /> Yangi imtihon
            </Link>
          </div>

          {examsLoading ? (
            <div className="divide-y divide-slate-100 p-2">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : exams.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-7 h-7" />}
              title="Hali imtihon topshirmagansiz"
              desc="Birinchi imtihon topshirib ball to'plang"
              href="/exam"
              cta={tr("take_exam")}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {exams.map((exam) => (
                <Link
                  key={exam.session_id}
                  href={`/exam/results/${exam.session_id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <ScoreBadge pct={exam.percentage} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Imtihon #{exam.session_id}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(exam.started_at)}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {exam.total_score?.toFixed(2) ?? "—"} ball
                      </span>
                    </div>
                    {/* Mini score bar */}
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden w-full max-w-[160px]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          exam.percentage >= 85 ? "bg-emerald-500" :
                          exam.percentage >= 65 ? "bg-blue-500" :
                          exam.percentage >= 45 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${exam.percentage}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick nav to other activity */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Boshqa faoliyat
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { href: "/progress",    icon: <TrendingUp className="w-4 h-4 text-orange-500" />,  label: "Natijalar grafigi",    desc: "Vaqt o'tishi bilan dinamika",    bg: "bg-orange-50" },
              { href: "/learn",       icon: <BookOpen className="w-4 h-4 text-blue-500" />,       label: "O'tilgan darslar",     desc: "Barcha fanlardagi darslar",      bg: "bg-blue-50"   },
              { href: "/games",       icon: <Gamepad2 className="w-4 h-4 text-violet-500" />,     label: "O'yinlar",             desc: "O'yinlar orqali o'rganish",      bg: "bg-violet-50" },
              { href: "/bookmarks",   icon: <FileText className="w-4 h-4 text-amber-500" />,      label: "Saqlangan savollar",   desc: "Belgilangan savollar",           bg: "bg-amber-50"  },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
