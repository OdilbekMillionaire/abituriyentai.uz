"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, BookOpen, ChevronRight, Brain } from "lucide-react";
import { isAuthenticated } from "@/lib/api";
import { useStartExam } from "@/lib/queries";
import { useLang } from "@/lib/lang";
import type { Subject } from "@/types";

type ExamMode = "all" | "mother_tongue" | "mathematics" | "history";

const colorClasses = {
  blue:   { border: "border-blue-200",   bg: "bg-blue-50",   hover: "hover:border-blue-400",   text: "text-blue-600",   btn: "bg-blue-600 hover:bg-blue-700",   slider: "accent-blue-600"   },
  green:  { border: "border-green-200",  bg: "bg-green-50",  hover: "hover:border-green-400",  text: "text-green-600",  btn: "bg-green-600 hover:bg-green-700",  slider: "accent-green-600"  },
  orange: { border: "border-orange-200", bg: "bg-orange-50", hover: "hover:border-orange-400", text: "text-orange-600", btn: "bg-orange-600 hover:bg-orange-700", slider: "accent-orange-600" },
};

// Quick-pick time presets shown as chips
const TIME_PRESETS = [10, 15, 20, 30, 45, 60];

function ExamModeSelectorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tr } = useLang();
  const [selectedMode, setSelectedMode] = useState<ExamMode>("all");
  const [customTime, setCustomTime] = useState<number>(30); // minutes, 10–60
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startExam = useStartExam();

  const EXAM_MODES: {
    id: ExamMode;
    labelKey: string;
    descKey: string;
    subject?: Subject;
    questionCount: number;
    color: string;
    icon: string;
  }[] = [
    { id: "all",          labelKey: "exam_full",           descKey: "exam_full_desc",    questionCount: 30, color: "blue",   icon: "🎯" },
    { id: "mother_tongue",labelKey: "subject_mother_tongue",descKey: "subject_desc_mt",  questionCount: 10, color: "blue",   icon: "📝", subject: "MOTHER_TONGUE" },
    { id: "mathematics",  labelKey: "subject_mathematics",  descKey: "subject_desc_math", questionCount: 10, color: "green",  icon: "📐", subject: "MATHEMATICS" },
    { id: "history",      labelKey: "subject_history",      descKey: "subject_desc_hist", questionCount: 10, color: "orange", icon: "🏛️", subject: "HISTORY" },
  ];

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
    const subject = searchParams.get("subject");
    if (subject && ["mother_tongue", "mathematics", "history"].includes(subject)) {
      setSelectedMode(subject as ExamMode);
    }
  }, [router, searchParams]);

  // Reset custom time to a sensible default when mode changes
  useEffect(() => {
    setCustomTime(selectedMode === "all" ? 30 : 20);
  }, [selectedMode]);

  async function handleStart() {
    setIsStarting(true);
    setError(null);
    try {
      const session = await startExam.mutateAsync({ subject: selectedMode, timeLimitMinutes: customTime });
      sessionStorage.setItem("exam_session", JSON.stringify(session));
      router.push("/exam/session");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || tr("try_again"));
      setIsStarting(false);
    }
  }

  const selected = EXAM_MODES.find((m) => m.id === selectedMode)!;
  const colors = colorClasses[selected.color as keyof typeof colorClasses];

  function formatTime(min: number) {
    if (min < 60) return `${min} ${tr("minutes")}`;
    return `1 ${tr("hour") ?? "soat"}`;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900">{tr("exam_title")}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 mb-3">{tr("exam_select")}</h1>
          <p className="text-slate-500">{tr("exam_select_sub")}</p>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {EXAM_MODES.map((mode) => {
            const mc = colorClasses[mode.color as keyof typeof colorClasses];
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`text-left p-4 sm:p-6 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `${mc.border} ${mc.bg} shadow-md`
                    : `border-slate-200 bg-white hover:border-slate-300`
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl sm:text-3xl">{mode.icon}</div>
                  {isSelected && (
                    <div className={`w-6 h-6 rounded-full ${mc.btn} flex items-center justify-center`}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className={`font-bold text-lg mb-1 ${isSelected ? mc.text : "text-slate-900"}`}>
                  {tr(mode.labelKey)}
                </h3>
                <p className="text-slate-500 text-sm mb-3">{tr(mode.descKey)}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-slate-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    {mode.questionCount} {tr("exam_questions")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Time picker ── */}
        <div className={`rounded-xl border-2 ${colors.border} bg-white p-5 mb-5`}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className={`w-4 h-4 ${colors.text}`} />
            <span className="font-semibold text-slate-800 text-sm">Vaqt limiti</span>
            <span className={`ml-auto text-xl font-bold ${colors.text}`}>{formatTime(customTime)}</span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={customTime}
            onChange={(e) => setCustomTime(Number(e.target.value))}
            className={`w-full h-2 rounded-full cursor-pointer mb-4 ${colors.slider}`}
          />

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-2">
            {TIME_PRESETS.map((t) => (
              <button
                key={t}
                onClick={() => setCustomTime(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  customTime === t
                    ? `${colors.btn} text-white border-transparent`
                    : "border-slate-200 text-slate-600 hover:border-slate-300 bg-slate-50"
                }`}
              >
                {t === 60 ? "1 soat" : `${t} min`}
              </button>
            ))}
          </div>
        </div>

        {/* Selected summary + Start */}
        <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">{tr("exam_selected")}</p>
              <h3 className={`text-xl font-bold ${colors.text}`}>{tr(selected.labelKey)}</h3>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${colors.text}`}>{selected.questionCount}</div>
              <div className="text-xs text-slate-400">{tr("exam_questions")}</div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-slate-500 mb-6">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(customTime)}
            </span>
            <span>•</span>
            <span>{tr("exam_max")} {(selected.questionCount * 1.1).toFixed(1)}</span>
            <span>•</span>
            <span>{tr("exam_no_penalty")}</span>
          </div>

          <button
            onClick={handleStart}
            disabled={isStarting}
            className={`w-full flex items-center justify-center gap-2 text-white py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-60 ${colors.btn}`}
          >
            {isStarting ? (
              <>
                <Brain className="w-5 h-5 animate-pulse" />
                {tr("exam_loading")}
              </>
            ) : (
              <>
                {tr("exam_start")}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-slate-100 rounded-xl p-4 text-sm text-slate-500">
          <p className="font-medium text-slate-700 mb-2">{tr("exam_tips")}</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>{tr("exam_tip1")}</li>
            <li>{tr("exam_tip2")}</li>
            <li>{tr("exam_tip3")}</li>
            <li>{tr("exam_tip4")}</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense>
      <ExamModeSelectorPage />
    </Suspense>
  );
}
