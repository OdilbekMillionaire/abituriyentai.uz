"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, Brain, Trophy, TrendingUp, LogOut, Zap,
  CalendarDays, Bookmark, User, Settings, Sparkles,
  Gamepad2, ArrowRight, Flame, ChevronRight, FileText,
  Target, BarChart2, Clock, Bot, Medal, RefreshCw, X, History,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/ui/Logo";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { DailyGoalsWidget } from "@/components/gamification/DailyGoalsWidget";
import { WeakAreasCard } from "@/components/analytics/WeakAreasCard";
import { useUserProfile, useExamHistory, useLeaderboard } from "@/lib/queries";
import { maybeShowStreakNotification, registerServiceWorker } from "@/lib/notifications";
import { NotificationToggle } from "@/components/notifications/NotificationToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import { LangToggle } from "@/components/ui/LangToggle";
import { useLang } from "@/lib/lang";
import { removeToken, isAuthenticated, userApi } from "@/lib/api";
import { formatScore, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ── Silver coin icon ──────────────────────────────────────────────────────────

function ChaqaCoin({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="10" r="9.5" fill="#94a3b8" stroke="#64748b" strokeWidth="1"/>
      <circle cx="10" cy="10" r="7" fill="#e2e8f0"/>
      <text x="10" y="14" textAnchor="middle" fontSize="8" fontWeight="800" fill="#475569" fontFamily="system-ui, sans-serif">C</text>
    </svg>
  );
}

// ── Feature tiles ─────────────────────────────────────────────────────────────

const FEATURES = [
  { href: "/learn",        icon: BookOpen,      gradient: "from-blue-500 to-cyan-400",      labelKey: "nav_lessons",      badge: null   },
  { href: "/exam",         icon: FileText,      gradient: "from-emerald-500 to-teal-400",   labelKey: "nav_exam",         badge: "BMBA" },
  { href: "/simulyatsiya", icon: Trophy,        gradient: "from-amber-500 to-orange-400",   labelKey: "nav_simulyatsiya", badge: null   },
  { href: "/drill",        icon: Zap,           gradient: "from-violet-500 to-purple-400",  labelKey: "nav_drill",        badge: null   },
  { href: "/ai-tutor",     icon: Bot,           gradient: "from-fuchsia-500 to-pink-500",   labelKey: "nav_ai_tutor",     badge: "AI"   },
  { href: "/ai-lesson",    icon: Brain,         gradient: "from-pink-500 to-rose-400",      labelKey: "nav_ai_lesson",    badge: "AI"   },
  { href: "/canvas",       icon: Sparkles,      gradient: "from-indigo-500 to-violet-400",  labelKey: "nav_canvas",       badge: "AI"   },
  { href: "/games",        icon: Gamepad2,      gradient: "from-rose-500 to-pink-400",      labelKey: "nav_games",        badge: null   },
  { href: "/study-plan",   icon: CalendarDays,  gradient: "from-teal-500 to-cyan-400",      labelKey: "nav_study_plan",   badge: null   },
  { href: "/leaderboard",  icon: Medal,         gradient: "from-orange-500 to-amber-400",   labelKey: "nav_leaderboard",  badge: null   },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useUserProfile();
  const { data: examHistory } = useExamHistory();
  const { data: leaderboard } = useLeaderboard();
  const { tr } = useLang();
  const [exchangeOpen, setExchangeOpen] = useState(false);

  const exchangeMutation = useMutation({
    mutationFn: () => userApi.exchangeChaqa(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setExchangeOpen(false);
    },
  });

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
    registerServiceWorker();
  }, [router]);

  useEffect(() => {
    if (profile) maybeShowStreakNotification(profile.streak_days, profile.last_active_date ?? null);
  }, [profile]);

  function handleLogout() {
    removeToken();
    router.push("/");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Logo size={32} light={false} />
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  const recentExams = examHistory?.slice(0, 5) ?? [];
  const lastScore = recentExams[0]?.percentage ?? null;
  const avgScore = recentExams.length
    ? Math.round(recentExams.reduce((s, e) => s + e.percentage, 0) / recentExams.length)
    : null;
  const xpPct = profile
    ? Math.min(100, Math.round(((profile.xp_in_current_level ?? 0) / 500) * 100))
    : 0;

  // Find current user's rank in leaderboard
  const myRank = leaderboard?.findIndex((e) => e.username === profile?.username);
  const myRankDisplay = myRank !== undefined && myRank >= 0 ? myRank + 1 : null;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Exchange modal ───────────────────────────────────────────────────── */}
      {exchangeOpen && profile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Chaqa → Tanga</h3>
              <button onClick={() => setExchangeOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5">
                  <ChaqaCoin className="w-5 h-5" />
                  <span className="font-black text-xl text-slate-800">{profile.coins}</span>
                </div>
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🪙</span>
                  <span className="font-black text-xl text-amber-600">{Math.floor(profile.coins / 1000)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">1000 Chaqa = 1 Tanga · {profile.coins % 1000} Chaqa qoladi</p>
            </div>
            {exchangeMutation.isError && (
              <p className="text-xs text-red-500 text-center mb-3">Xatolik yuz berdi. Qaytadan urinib ko'ring.</p>
            )}
            <button
              onClick={() => exchangeMutation.mutate()}
              disabled={exchangeMutation.isPending || profile.coins < 1000}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {exchangeMutation.isPending
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Almashtirilmoqda...</>
                : <><RefreshCw className="w-4 h-4" /> Almashtirish</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Top Nav ──────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size={32} showName light={false} />

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Chaqa balance */}
            {profile && (
              <button
                onClick={() => profile.coins >= 1000 && setExchangeOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors",
                  profile.coins >= 1000
                    ? "bg-slate-100 border border-amber-300 hover:border-amber-400 cursor-pointer"
                    : "bg-slate-100 border border-slate-200 cursor-default"
                )}
                title={profile.coins >= 1000 ? "1000 Chaqa → 1 Tanga almashtirish" : undefined}
              >
                <ChaqaCoin className="w-4 h-4" />
                <span className="text-xs font-bold text-slate-700">{profile.coins}</span>
                <span className="text-xs text-slate-500 hidden sm:inline">Chaqa</span>
                {profile.coins >= 1000 && <RefreshCw className="w-3 h-3 text-amber-500 hidden sm:inline" />}
              </button>
            )}
            {/* Tanga — always visible */}
            {profile && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                <span className="text-sm">🪙</span>
                <span className="text-xs font-bold text-amber-700">{profile.oxforder_tanga ?? 0}</span>
                <span className="text-xs text-amber-500 hidden sm:inline">Tanga</span>
              </div>
            )}
            {/* Upgrade to Pro */}
            <Link href="/upgrade"
              className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full px-2.5 py-1.5 hover:opacity-90 transition-opacity"
              title="Pro">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-bold hidden sm:inline">Pro</span>
            </Link>
            {/* Leaderboard shortcut */}
            <Link href="/leaderboard"
              className="hidden sm:flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 hover:bg-orange-100 transition-colors">
              <Medal className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold text-orange-700">{myRankDisplay ? `#${myRankDisplay}` : tr("nav_leaderboard")}</span>
            </Link>
            <LangToggle />
            <NotificationCenter profile={profile} />
            <NotificationToggle />
            <Link href="/profile" className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/settings" className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
            <button onClick={handleLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Hero strip ───────────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #4338ca 50%, #7c3aed 100%)" }}>
          {/* SVG dot-grid texture */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
          {/* Glowing orbs */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-violet-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-40 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />

          <div className="relative px-5 sm:px-7 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-0 sm:justify-between">
              {/* User info */}
              <div>
                <p className="text-blue-200 text-xs font-semibold tracking-wide uppercase mb-1">{tr("hello")} 👋</p>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">{profile?.username ?? "..."}</h1>

                {/* Level progress */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-bold bg-white/20 border border-white/20 px-3 py-1.5 rounded-full text-white tracking-wide">
                    ⚡ {tr("level")} {profile?.level ?? 1}
                  </span>
                  <div className="flex-1 max-w-[180px]">
                    <div className="h-2 bg-white/15 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${xpPct}%`, background: "linear-gradient(90deg, #a5f3fc, #fff)" }} />
                    </div>
                    <p className="text-[11px] text-blue-200/80 mt-1">
                      {profile?.xp_in_current_level ?? 0} / 500 Chaqa → {tr("level")} {(profile?.level ?? 1) + 1}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stat chips */}
              <div className="grid grid-cols-2 gap-2 sm:w-60">
                {[
                  { icon: <Flame className="w-4 h-4 text-orange-300" />, val: profile?.streak_days ?? 0, label: tr("streak_day"), bg: "from-orange-500/20 to-orange-600/10" },
                  { icon: <ChaqaCoin className="w-4 h-4" />,              val: profile?.xp_in_current_level ?? 0, label: "Chaqa",  bg: "from-slate-400/20 to-slate-500/10" },
                  ...(lastScore !== null ? [{ icon: <Target className="w-4 h-4 text-emerald-300" />, val: `${lastScore}%`, label: "So'nggi ball", bg: "from-emerald-500/20 to-emerald-600/10" }] : []),
                  ...(avgScore  !== null ? [{ icon: <BarChart2 className="w-4 h-4 text-cyan-300" />,  val: `${avgScore}%`,  label: "O'rtacha",     bg: "from-cyan-500/20 to-cyan-600/10"     }] : []),
                ].map((chip, i) => (
                  <div key={i} className={`bg-gradient-to-br ${chip.bg} border border-white/10 backdrop-blur-sm rounded-2xl px-3 py-3 flex items-center gap-2.5`}>
                    <div className="flex-shrink-0">{chip.icon}</div>
                    <div>
                      <p className="text-lg font-black leading-none text-white">{chip.val}</p>
                      <p className="text-[10px] text-blue-200/80 leading-none mt-0.5">{chip.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature grid ────────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Asosiy bo'limlar</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Link key={f.href} href={f.href}
                  className="group bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 hover:border-slate-300 hover:shadow-md transition-all text-center flex flex-col items-center gap-2 relative"
                >
                  {f.badge && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-1.5 py-0.5 rounded-md">
                      {f.badge}
                    </span>
                  )}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm leading-tight">{tr(f.labelKey)}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Activity + Sidebar ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left: recent exams + progress cards */}
          <div className="lg:col-span-2 space-y-4">

            {/* Recent exams */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  {tr("recent_exams")}
                </h3>
                <Link href="/exam" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                  {tr("new_exam")} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {recentExams.length === 0 ? (
                <div className="text-center py-10 px-5">
                  <div className="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{tr("no_exams")}</p>
                  <Link href="/exam"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                    {tr("take_exam")}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentExams.map((exam) => (
                    <Link key={exam.session_id} href={`/exam/results/${exam.session_id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black",
                          exam.percentage >= 85 ? "bg-emerald-100 text-emerald-700" :
                          exam.percentage >= 65 ? "bg-blue-100 text-blue-700" :
                          exam.percentage >= 45 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {exam.percentage}%
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{formatScore(exam.total_score)}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatDateTime(exam.started_at)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Progress quick cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: "/progress",    icon: TrendingUp, label: "Dinamika",   value: `${recentExams.length} imtihon`,                                                         color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
                { href: "/history",     icon: History,    label: "Tarix",      value: "Barcha faoliyat",                                                                        color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100"   },
                { href: "/leaderboard", icon: Medal,      label: "Reyting",    value: myRankDisplay ? `#${myRankDisplay} o'rin` : `${tr("level")} ${profile?.level ?? 1}`,     color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100"  },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <Link key={card.href} href={card.href}
                    className={`bg-white border ${card.border} rounded-2xl p-4 hover:shadow-sm transition-all group`}>
                    <Icon className={`w-5 h-5 ${card.color} mb-2`} />
                    <p className="text-xs font-bold text-slate-800">{card.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{card.value}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: leaderboard preview + quick links */}
          <div className="space-y-2.5">

            {/* Daily Goals */}
            <DailyGoalsWidget />

            {/* Top rankers preview */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Medal className="w-4 h-4 text-amber-500" /> {tr("nav_leaderboard")}
                </h3>
                <Link href="/leaderboard" className="text-xs text-blue-600 hover:underline">Hammasi →</Link>
              </div>
              <div className="divide-y divide-slate-50">
                {(leaderboard ?? []).slice(0, 5).map((entry, idx) => (
                  <div key={entry.username}
                    className={cn("flex items-center gap-3 px-4 py-2.5",
                      entry.username === profile?.username && "bg-blue-50"
                    )}>
                    <span className={cn("text-sm font-black w-5 text-center flex-shrink-0",
                      idx === 0 ? "text-yellow-500" : idx === 1 ? "text-slate-500" : idx === 2 ? "text-orange-400" : "text-slate-400"
                    )}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                    </span>
                    <p className={cn("text-xs font-semibold flex-1 truncate",
                      entry.username === profile?.username ? "text-blue-700" : "text-slate-700"
                    )}>
                      {entry.username}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400">Lv.{entry.level}</span>
                  </div>
                ))}
                {(!leaderboard || leaderboard.length === 0) && (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">Hali reyting yo'q</div>
                )}
              </div>
            </div>

            {/* Weak areas bar chart */}
            <WeakAreasCard />

            {/* Quick links */}
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Tezkor havolalar</h2>
            {[
              { href: "/ai-tutor",   icon: Bot,          label: tr("nav_ai_tutor"),   desc: "AI o'qituvchi",         color: "text-fuchsia-600", bg: "bg-fuchsia-50" },
              { href: "/study-plan", icon: CalendarDays, label: tr("nav_study_plan"), desc: "Kun rejasi",             color: "text-teal-600",    bg: "bg-teal-50"    },
              { href: "/bookmarks",  icon: Bookmark,     label: tr("nav_bookmarks"),  desc: "Saqlangan savollar",     color: "text-amber-600",   bg: "bg-amber-50"   },
              { href: "/games",      icon: Gamepad2,     label: tr("nav_games"),      desc: "O'yin orqali o'rgan",    color: "text-violet-600",  bg: "bg-violet-50"  },
              { href: "/profile",    icon: User,         label: tr("profile_title"),  desc: "Profil va sozlamalar",   color: "text-blue-600",    bg: "bg-blue-50"    },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 hover:shadow-sm transition-all group">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
