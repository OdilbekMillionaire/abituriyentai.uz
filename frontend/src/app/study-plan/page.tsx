"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CalendarDays, AlertTriangle, CheckCircle2, Clock,
  Sparkles, BookOpen, Zap, Target, TrendingUp, ChevronDown, ChevronUp,
  Brain, BarChart3, Lightbulb, RefreshCw, Star, Flame, Trophy,
  Play, Circle, Timer, ListChecks, GraduationCap,
} from "lucide-react";
import { isAuthenticated, studyPlanApi } from "@/lib/api";
import { useStudyPlan, useUserProfile, useWeakAreas } from "@/lib/queries";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";
import type { PlanDay } from "@/types";

// ── Color maps ────────────────────────────────────────────────────────────────
const SUBJECT_COLORS: Record<string, string> = {
  MOTHER_TONGUE: "bg-blue-100 text-blue-700 border-blue-200",
  MATHEMATICS:   "bg-green-100 text-green-700 border-green-200",
  HISTORY:       "bg-orange-100 text-orange-700 border-orange-200",
};
const ACTION_COLORS: Record<string, string> = {
  lesson:    "bg-indigo-50 border-indigo-200",
  drill:     "bg-purple-50 border-purple-200",
  mini_exam: "bg-red-50 border-red-200",
  review:    "bg-teal-50 border-teal-200",
};
const SUBJECT_BAR_COLOR: Record<string, string> = {
  MOTHER_TONGUE: "bg-blue-500",
  MATHEMATICS:   "bg-green-500",
  HISTORY:       "bg-orange-500",
};
const SUBJECT_RING: Record<string, string> = {
  MOTHER_TONGUE: "#3b82f6",
  MATHEMATICS:   "#22c55e",
  HISTORY:       "#f97316",
};

// ── Sub-components ────────────────────────────────────────────────────────────
function DayCard({ day, tr }: { day: PlanDay; tr: (k: string, fb?: string) => string }) {
  const subjectColor = SUBJECT_COLORS[day.subject] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const actionBg = ACTION_COLORS[day.action_type] ?? "bg-slate-50 border-slate-200";
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all",
      day.is_today && "ring-2 ring-blue-500 shadow-md bg-blue-50",
      day.is_past && "opacity-40 grayscale",
      !day.is_today && !day.is_past && actionBg,
    )}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {day.date_str.slice(5).replace("-", "/")}
            </span>
            {day.is_today && (
              <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">Bugun</span>
            )}
            {day.is_past && <span className="text-xs text-slate-400">✓</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-lg">{day.action_icon}</span>
            <span className="text-sm font-semibold text-slate-800">{day.topic_label}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${subjectColor}`}>
            {day.subject_label}
          </span>
          {day.is_weak && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="w-3 h-3" /> {tr("plan_weak_label")}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-slate-500">{day.action_label}</span>
        {day.accuracy !== null && (
          <span className={`text-xs font-medium ${day.accuracy >= 0.6 ? "text-green-600" : "text-red-600"}`}>
            {Math.round(day.accuracy * 100)}% {tr("plan_accuracy")}
          </span>
        )}
      </div>
      {day.is_today && (
        <Link
          href={day.action_href}
          className="mt-3 block text-center py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {tr("plan_start_now")} →
        </Link>
      )}
    </div>
  );
}

function ReadinessBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-700">{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CircularProgress({ pct, size = 80, color }: { pct: number; size?: number; color: string }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
    </svg>
  );
}

function defaultExamDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 2);
  return d.toISOString().slice(0, 10);
}

function useCountdown(examDate: string) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(examDate + "T00:00:00");
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, total_ms: diff };
}

interface AiAdvice {
  daily_focus: string;
  weekly_plan: string[];
  motivational_message: string;
  priority_topics: string[];
  study_technique: string;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudyPlanPage() {
  const router = useRouter();
  const { tr, lang } = useLang();
  const [examDate, setExamDate] = useState(defaultExamDate);
  const [submittedDate, setSubmittedDate] = useState(defaultExamDate);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");
  const [aiAdvice, setAiAdvice] = useState<AiAdvice | null>(null);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [checkedToday, setCheckedToday] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
    const saved = localStorage.getItem("dtm_exam_date") || localStorage.getItem("bmba_exam_date");
    if (saved) { setExamDate(saved); setSubmittedDate(saved); }
    const checked = JSON.parse(localStorage.getItem("plan_checked_today") || "[]");
    setCheckedToday(checked);
  }, [router]);

  const { data, isLoading } = useStudyPlan(submittedDate);
  const { data: profile } = useUserProfile();
  const { data: weakAreas } = useWeakAreas();
  const countdown = useCountdown(submittedDate);

  function handleDateChange(d: string) {
    setExamDate(d);
    setSubmittedDate(d);
    localStorage.setItem("dtm_exam_date", d);
    setAiAdvice(null);
  }

  function toggleCheck(key: string) {
    setCheckedToday((prev) => {
      const next = prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
      localStorage.setItem("plan_checked_today", JSON.stringify(next));
      return next;
    });
  }

  async function handleGetAdvice() {
    setIsGeneratingAdvice(true);
    setAdviceError(null);
    try {
      const res = await studyPlanApi.getAiAdvice(submittedDate, lang);
      setAiAdvice(res.data);
    } catch {
      setAdviceError("AI maslahat yaratishda xatolik. Qayta urinib ko'ring.");
    } finally {
      setIsGeneratingAdvice(false);
    }
  }

  // Compute stats
  const todayTask = data?.plan.find((d) => d.is_today);
  const upcoming = data?.plan.filter((d) => !d.is_past) ?? [];
  const doneCount = data?.plan.filter((d) => d.is_past).length ?? 0;
  const totalPlan = data?.plan.length ?? 0;
  const progressPct = totalPlan > 0 ? Math.round((doneCount / totalPlan) * 100) : 0;

  const weeklyChunks: PlanDay[][] = [];
  for (let i = 0; i < Math.min(upcoming.length, 28); i += 7) {
    weeklyChunks.push(upcoming.slice(i, i + 7));
  }

  const subjectStats = useMemo(() => {
    const s: Record<string, { done: number; total: number }> = {
      MOTHER_TONGUE: { done: 0, total: 0 },
      MATHEMATICS:   { done: 0, total: 0 },
      HISTORY:       { done: 0, total: 0 },
    };
    data?.plan.forEach((d) => {
      if (s[d.subject]) { s[d.subject].total++; if (d.is_past) s[d.subject].done++; }
    });
    return s;
  }, [data]);

  // Today's mini checklist: up to 3 tasks
  const todayChecklist = useMemo(() => {
    if (!todayTask) return [];
    return [
      { key: "today_main",   label: todayTask.topic_label, icon: todayTask.action_icon, href: todayTask.action_href },
      { key: "today_review", label: "Kecha o'tilganlarni takrorlash", icon: "🔁", href: "/drill" },
      { key: "today_quiz",   label: "5 ta tezkor savol yech", icon: "✍️", href: "/exam" },
    ];
  }, [todayTask]);

  const urgencyColor = countdown.days <= 7  ? "from-red-600 to-rose-700"
                     : countdown.days <= 30 ? "from-orange-500 to-amber-600"
                     : "from-blue-600 to-indigo-700";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <CalendarDays className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-900">{tr("plan_title")}</span>
          {profile && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <Flame className="w-3 h-3" /> {profile.streak_days} kun
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3" /> {profile.coins} Chaqa
              </span>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── HERO: Countdown + date picker ── */}
        <div className={`bg-gradient-to-br ${urgencyColor} rounded-2xl p-6 text-white shadow-lg`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Countdown */}
            <div className="flex-1">
              <p className="text-sm text-white/70 mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> BMBA imtihonigacha
              </p>
              <div className="flex items-end gap-3">
                {[
                  { v: countdown.days,  l: "kun" },
                  { v: countdown.hours, l: "soat" },
                  { v: countdown.mins,  l: "min" },
                  { v: countdown.secs,  l: "son" },
                ].map(({ v, l }) => (
                  <div key={l} className="text-center">
                    <div className="text-3xl sm:text-4xl font-black tabular-nums">
                      {String(v).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-white/60">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Date picker */}
            <div className="bg-white/15 rounded-xl p-4 flex-shrink-0">
              <label className="block text-xs text-white/70 mb-2 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> {tr("plan_date_label")}
              </label>
              <input
                type="date"
                value={examDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-white/20 border border-white/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 w-full"
              />
              {data?.message && (
                <p className="mt-2 text-xs text-white/80 flex items-center gap-1">
                  {data.total_weak_topics > 0
                    ? <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    : <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                  {data.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* ── Plan progress bar ── */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Reja bajarilishi</span>
                <span className="text-sm text-slate-500">{doneCount}/{totalPlan} kun</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{progressPct}% bajarildi</p>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <CalendarDays className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-blue-600">{data.days_remaining}</div>
                <div className="text-xs text-slate-500">{tr("plan_days_left")}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${data.total_weak_topics > 0 ? "text-red-500" : "text-green-500"}`} />
                <div className={`text-xl font-bold ${data.total_weak_topics > 0 ? "text-red-500" : "text-green-600"}`}>
                  {data.total_weak_topics}
                </div>
                <div className="text-xs text-slate-500">{tr("plan_weak")}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <BookOpen className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-slate-700">{data.total_topics}</div>
                <div className="text-xs text-slate-500">{tr("plan_total")}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <TrendingUp className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-teal-600">{progressPct}%</div>
                <div className="text-xs text-slate-500">Bajarildi</div>
              </div>
            </div>

            {/* ── Today's task + checklist ── */}
            {todayTask && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Today hero */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Timer className="w-4 h-4" />
                    <span className="font-bold text-sm">{tr("plan_today_task")}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{todayTask.action_icon}</span>
                    <div>
                      <div className="font-bold text-lg leading-tight">{todayTask.topic_label}</div>
                      <div className="text-blue-200 text-xs">{todayTask.subject_label} · {todayTask.action_label}</div>
                      {todayTask.accuracy !== null && (
                        <div className={`text-xs mt-1 font-medium ${todayTask.accuracy < 0.6 ? "text-red-300" : "text-green-300"}`}>
                          Oxirgi natija: {Math.round(todayTask.accuracy * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    href={todayTask.action_href}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors text-sm"
                  >
                    <Play className="w-4 h-4" /> {tr("plan_start")} →
                  </Link>
                </div>

                {/* Today checklist */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-blue-500" />
                    Bugungi vazifalar
                  </h3>
                  <div className="space-y-2">
                    {todayChecklist.map(({ key, label, icon, href }) => {
                      const done = checkedToday.includes(key);
                      return (
                        <div key={key} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${done ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                          <button onClick={() => toggleCheck(key)} className="flex-shrink-0">
                            {done
                              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                              : <Circle className="w-5 h-5 text-slate-300" />}
                          </button>
                          <span className="text-sm flex-1">{icon} <span className={done ? "line-through text-slate-400" : "text-slate-700"}>{label}</span></span>
                          {!done && (
                            <Link href={href} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                              Bosh →
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-xs text-slate-400 text-right">
                    {checkedToday.length}/{todayChecklist.length} bajarildi
                  </div>
                </div>
              </div>
            )}

            {/* ── AI Advice Card ── */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{tr("plan_ai_title")}</h3>
                    <p className="text-xs text-purple-200">Zaif mavzularingizga asoslangan shaxsiy reja</p>
                  </div>
                </div>
                <button
                  onClick={handleGetAdvice}
                  disabled={isGeneratingAdvice}
                  className="flex items-center gap-1.5 bg-white text-purple-700 text-xs font-bold px-4 py-2 rounded-xl hover:bg-purple-50 disabled:opacity-60 transition-colors"
                >
                  {isGeneratingAdvice
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Tahlil qilinmoqda...</>
                    : <><Brain className="w-3.5 h-3.5" /> {aiAdvice ? tr("plan_ai_refresh") : tr("plan_ai_generate")}</>}
                </button>
              </div>

              {adviceError && (
                <div className="bg-red-500/20 border border-red-300/30 rounded-xl p-3 mb-4 text-sm text-red-100">
                  {adviceError}
                </div>
              )}

              {aiAdvice ? (
                <div className="space-y-4">
                  {/* Daily Focus */}
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs font-bold text-purple-200 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> {tr("plan_ai_daily_focus")}
                    </p>
                    <p className="text-sm leading-relaxed">{aiAdvice.daily_focus}</p>
                  </div>

                  {/* Priority Topics */}
                  <div>
                    <p className="text-xs font-bold text-purple-200 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" /> {tr("plan_ai_priorities")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {aiAdvice.priority_topics.map((t, i) => (
                        <span key={i} className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-medium">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Plan */}
                  <div>
                    <p className="text-xs font-bold text-purple-200 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> {tr("plan_ai_weekly")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {aiAdvice.weekly_plan.map((item, i) => (
                        <div key={i} className="bg-white/10 rounded-lg px-3 py-2 text-xs leading-snug">{item}</div>
                      ))}
                    </div>
                  </div>

                  {/* Study Technique */}
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-xs font-bold text-purple-200 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> {tr("plan_ai_technique")}
                    </p>
                    <p className="text-sm leading-relaxed">{aiAdvice.study_technique}</p>
                  </div>

                  {/* Motivation */}
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-sm text-purple-100 italic leading-relaxed">💬 {aiAdvice.motivational_message}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-purple-200 mb-4">
                    Gemini AI zaif mavzularingizni tahlil qilib, shaxsiy haftalik reja tuzadi
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link href="/ai-lesson" className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                      <Brain className="w-3.5 h-3.5" /> AI Dars
                    </Link>
                    <Link href="/drill" className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                      <Zap className="w-3.5 h-3.5" /> Sprint
                    </Link>
                    <Link href="/simulyatsiya" className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                      <BarChart3 className="w-3.5 h-3.5" /> Simulyatsiya
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Subject readiness with circular rings ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                {tr("plan_subject_breakdown")}
              </h3>

              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { key: "MOTHER_TONGUE", label: "Ona tili",   labelKey: "subject_mother_tongue" },
                  { key: "MATHEMATICS",   label: "Matematika", labelKey: "subject_mathematics" },
                  { key: "HISTORY",       label: "Tarix",      labelKey: "subject_history" },
                ].map(({ key, labelKey }) => {
                  const s = subjectStats[key];
                  const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                  return (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <CircularProgress pct={pct} size={72} color={SUBJECT_RING[key]} />
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
                          {pct}%
                        </span>
                      </div>
                      <span className="text-xs text-center text-slate-600 font-medium">{tr(labelKey)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                {[
                  { key: "MOTHER_TONGUE", labelKey: "subject_mother_tongue" },
                  { key: "MATHEMATICS",   labelKey: "subject_mathematics" },
                  { key: "HISTORY",       labelKey: "subject_history" },
                ].map(({ key, labelKey }) => {
                  const s = subjectStats[key];
                  const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                  return <ReadinessBar key={key} label={tr(labelKey)} pct={pct} color={SUBJECT_BAR_COLOR[key]} />;
                })}
              </div>

              {weakAreas?.topics && weakAreas.topics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Zaif mavzular ({weakAreas.topics.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {weakAreas.topics.slice(0, 6).map((area) => (
                      <span key={area.tag} className="text-xs bg-red-50 text-red-700 border border-red-100 px-2 py-1 rounded-full">
                        {area.tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Quick subject actions ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { subject: "MOTHER_TONGUE", icon: "📝", label: "Ona tili", color: "border-blue-200 hover:bg-blue-50",  textColor: "text-blue-700" },
                { subject: "MATHEMATICS",   icon: "📐", label: "Matematika", color: "border-green-200 hover:bg-green-50", textColor: "text-green-700" },
                { subject: "HISTORY",       icon: "🏛️", label: "Tarix",    color: "border-orange-200 hover:bg-orange-50", textColor: "text-orange-700" },
              ].map(({ subject, icon, label, color, textColor }) => (
                <div key={subject} className={`bg-white rounded-xl border-2 ${color} p-4 transition-colors`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{icon}</span>
                    <span className={`font-bold text-sm ${textColor}`}>{label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/learn?subject=${subject.toLowerCase()}`} className="text-center text-xs py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">
                      📖 Dars
                    </Link>
                    <Link href={`/drill?subject=${subject.toLowerCase()}`} className="text-center text-xs py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">
                      ⚡ Drill
                    </Link>
                    <Link href={`/exam?subject=${subject.toLowerCase()}`} className="col-span-2 text-center text-xs py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">
                      ✍️ Mini test
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* ── View toggle ── */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 w-fit">
              <button
                onClick={() => setViewMode("weekly")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === "weekly" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
              >
                {tr("plan_weekly_view")}
              </button>
              <button
                onClick={() => setViewMode("daily")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === "daily" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
              >
                {tr("plan_daily_view")}
              </button>
            </div>

            {/* ── Legend ── */}
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              {[
                { icon: "📖", labelKey: "plan_lesson" },
                { icon: "⚡", labelKey: "plan_drill" },
                { icon: "✍️", labelKey: "plan_mini_exam" },
                { icon: "🔁", labelKey: "plan_review" },
              ].map(({ icon, labelKey }) => (
                <div key={labelKey} className="flex items-center gap-1.5">
                  <span>{icon}</span><span>{tr(labelKey)}</span>
                </div>
              ))}
            </div>

            {/* ── Weekly / Daily view ── */}
            {viewMode === "weekly" ? (
              <div className="space-y-4">
                {weeklyChunks.map((week, wi) => (
                  <div key={wi}>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">
                      {wi === 0 ? "Bu hafta" : `${wi + 1}. hafta`}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {week.map((day) => <DayCard key={day.day_number} day={day} tr={tr} />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <h2 className="font-bold text-slate-900 mb-4">{tr("plan_next14")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {upcoming.slice(0, 14).map((day) => <DayCard key={day.day_number} day={day} tr={tr} />)}
                </div>
              </div>
            )}

            {/* ── Full plan toggle ── */}
            {data.plan.length > 14 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setShowFullPlan(!showFullPlan)}
                  className="w-full px-6 py-4 flex items-center justify-between font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>{tr("plan_view_all")} ({data.plan.length} {tr("plan_days_plan")})</span>
                  {showFullPlan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showFullPlan && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4 pb-4">
                    {data.plan.map((day) => <DayCard key={day.day_number} day={day} tr={tr} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── Tips ── */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                {tr("plan_tips_title")}
              </h3>
              <div className="space-y-2">
                {[
                  { icon: "⏰", key: "plan_tip1" },
                  { icon: "🎯", key: "plan_tip2" },
                  { icon: "📊", key: "plan_tip3" },
                ].map(({ icon, key }) => (
                  <div key={key} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="text-base flex-shrink-0">{icon}</span>
                    <span>{tr(key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <CalendarDays className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">{tr("plan_date_label")}</p>
          </div>
        )}
      </main>
    </div>
  );
}
