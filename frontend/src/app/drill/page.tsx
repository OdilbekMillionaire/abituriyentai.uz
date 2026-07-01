"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, CheckCircle, XCircle, RotateCcw, Zap, BookOpen, BarChart2, ChevronDown } from "lucide-react";
import { isAuthenticated } from "@/lib/api";
import { useDrillDue, useDrillStats, useDrillAnswer } from "@/lib/queries";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";
import type { DrillQuestion, DrillAnswerResult } from "@/types";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

function DrillCard({
  question,
  onAnswer,
  tr,
}: {
  question: DrillQuestion;
  onAnswer: (result: DrillAnswerResult) => void;
  tr: (key: string, fallback?: string) => string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<DrillAnswerResult | null>(null);
  const [showStats, setShowStats] = useState(false);
  const answerMutation = useDrillAnswer();

  const optionTexts: Record<string, string> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  };

  async function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    const r = await answerMutation.mutateAsync({
      cardId: question.card_id,
      selectedOption: option,
    });
    setResult(r);
  }

  const isRevealed = result !== null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <SubjectBadge subject={question.subject} />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {question.repetitions > 0 && (
              <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                {question.repetitions}× {tr("drill_checked")}
              </span>
            )}
            {question.total_answers > 0 && (
              <span className={`px-2 py-0.5 rounded-full ${
                question.correct_answers / question.total_answers >= 0.7
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}>
                {Math.round((question.correct_answers / question.total_answers) * 100)}% {tr("drill_accuracy")}
              </span>
            )}
          </div>
        </div>
        <p className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed">
          {question.question_text}
        </p>
      </div>

      {/* Options */}
      <div className="px-6 pb-4 space-y-2">
        {OPTION_LABELS.map((label) => {
          const isCorrect = isRevealed && label === result!.correct_option;
          const isWrong = isRevealed && label === selected && !result!.is_correct;
          const isUnselected = isRevealed && label !== selected && label !== result!.correct_option;

          return (
            <button
              key={label}
              onClick={() => handleSelect(label)}
              disabled={!!selected}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all",
                !isRevealed && !selected && "border-slate-200 hover:border-blue-300 hover:bg-blue-50",
                !isRevealed && selected === label && "border-blue-400 bg-blue-50",
                isCorrect && "border-green-400 bg-green-50 text-green-900",
                isWrong && "border-red-400 bg-red-50 text-red-900",
                isUnselected && "border-slate-100 bg-slate-50 opacity-50",
                "disabled:cursor-default"
              )}
            >
              <span className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                !isRevealed && "bg-slate-100 text-slate-500",
                isCorrect && "bg-green-500 text-white",
                isWrong && "bg-red-500 text-white",
                isUnselected && "bg-slate-200 text-slate-400",
              )}>
                {label}
              </span>
              <span className="flex-1">{optionTexts[label]}</span>
              {isCorrect && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
              {isWrong && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Explanation panel */}
      {isRevealed && (
        <div className={`mx-6 mb-4 p-4 rounded-xl border ${
          result!.is_correct
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result!.is_correct
              ? <CheckCircle className="w-4 h-4 text-green-600" />
              : <XCircle className="w-4 h-4 text-red-600" />}
            <span className={`text-sm font-semibold ${result!.is_correct ? "text-green-700" : "text-red-700"}`}>
              {result!.is_correct
                ? `${tr("drill_correct")}! +${result!.xp_earned} ${tr("xp")}`
                : `${tr("drill_wrong")} · ${tr("correct_answer")}: ${result!.correct_option}`}
            </span>
            <span className="ml-auto text-xs text-slate-400">
              {tr("drill_next_review")}: {result!.next_review_in_days} {tr("days")}
            </span>
          </div>
          {result!.explanation && (
            <p className="text-sm text-slate-700 leading-relaxed">{result!.explanation}</p>
          )}
        </div>
      )}

      {/* SM-2 stats panel */}
      <div className="px-6 pb-2">
        <button
          onClick={() => setShowStats((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          Karta statistikasi
          <ChevronDown className={cn("w-3 h-3 transition-transform", showStats && "rotate-180")} />
        </button>
        {showStats && (
          <div className="mt-2 bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 w-20">Qiyinlik:</span>
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${((question.ease_factor - 1.3) / (3.0 - 1.3)) * 100}%` }}
                />
              </div>
              <span className="font-mono">{question.ease_factor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Interval:</span>
              <span className="font-medium">{question.interval} kun</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Takrorlar:</span>
              <span className="font-medium">{question.repetitions}</span>
            </div>
            {result && (
              <div className="flex justify-between">
                <span className="text-slate-400">Keyingi takror:</span>
                <span className="font-medium">{result.next_review_in_days} kun ichida</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Continue button */}
      {isRevealed && (
        <div className="px-6 pb-6">
          <button
            onClick={() => onAnswer(result!)}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            {tr("continue")} →
          </button>
        </div>
      )}
    </div>
  );
}

export default function DrillPage() {
  const router = useRouter();
  const { tr } = useLang();
  const [subject, setSubject] = useState<string | undefined>(undefined);
  const [queue, setQueue] = useState<DrillQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  const { data: dueCards, isLoading, refetch } = useDrillDue(subject, 10);
  const { data: stats } = useDrillStats();

  // Load queue when data arrives
  useEffect(() => {
    if (dueCards && dueCards.length > 0 && queue.length === 0) {
      setQueue(dueCards);
      setCurrentIdx(0);
      setDone(false);
    }
  }, [dueCards, queue.length]);

  function handleAnswer(result: DrillAnswerResult) {
    setSessionTotal((t) => t + 1);
    if (result.is_correct) setSessionCorrect((c) => c + 1);

    if (currentIdx + 1 >= queue.length) {
      setDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }

  function restart() {
    setQueue([]);
    setCurrentIdx(0);
    setSessionCorrect(0);
    setSessionTotal(0);
    setDone(false);
    refetch();
  }

  const currentQuestion = queue[currentIdx];

  const SUBJECT_FILTERS: { value: string | undefined; trKey: string }[] = [
    { value: undefined,       trKey: "drill_all" },
    { value: "mother_tongue", trKey: "subject_mother_short" },
    { value: "mathematics",   trKey: "subject_math_short" },
    { value: "history",       trKey: "subject_history_short" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-slate-900">{tr("drill_title")}</span>
            </div>
          </div>
          {sessionTotal > 0 && !done && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-green-600 font-medium">{sessionCorrect}</span>
              <span>/</span>
              <span>{sessionTotal}</span>
              <span className="text-slate-400">{tr("drill_this_session")}</span>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.due_today}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{tr("drill_due_today")}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.mastered}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{tr("drill_mastered")}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.accuracy_pct}%</div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{tr("drill_accuracy")}</div>
            </div>
          </div>
        )}

        {/* Subject filter */}
        <div className="flex gap-2 flex-wrap">
          {SUBJECT_FILTERS.map((f) => (
            <button
              key={f.value ?? "all"}
              onClick={() => {
                setSubject(f.value);
                setQueue([]);
                setCurrentIdx(0);
                setDone(false);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                subject === f.value
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-purple-300"
              }`}
            >
              {tr(f.trKey)}
            </button>
          ))}
        </div>

        {/* Main area */}
        {done ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{tr("drill_done")}</h2>
            <p className="text-slate-500 mb-2">
              {sessionCorrect}/{sessionTotal} {tr("drill_correct")} ({sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0}%)
            </p>
            <p className="text-sm text-slate-400 mb-6">
              {tr("drill_schedule_updated")}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={restart}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700"
              >
                <RotateCcw className="w-4 h-4" />
                {tr("drill_study_more")}
              </button>
              <Link
                href="/learn"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <BookOpen className="w-4 h-4" />
                {tr("nav_lessons")}
              </Link>
            </div>
          </div>
        ) : isLoading || queue.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            {isLoading ? (
              <div className="animate-pulse text-slate-400">{tr("drill_loading")}</div>
            ) : (
              <>
                <Brain className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">{tr("drill_no_cards")}</p>
                <p className="text-sm text-slate-400 mb-6">
                  {tr("drill_add_more")}
                </p>
                <Link
                  href="/exam"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  {tr("take_exam")}
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${(currentIdx / queue.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-12 text-right">
                {currentIdx + 1}/{queue.length}
              </span>
            </div>

            {currentQuestion && (
              <DrillCard
                key={currentQuestion.card_id}
                question={currentQuestion}
                onAnswer={handleAnswer}
                tr={tr}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
