"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, Star, Clock, BookOpen,
  ChevronRight, Hash, List, Brain, Loader2, Trophy,
} from "lucide-react";
import { useLesson, useCompleteLesson } from "@/lib/queries";
import { isAuthenticated, lessonsApi } from "@/lib/api";
import { MarkdownContent, estimateReadingTime, extractHeadings } from "@/components/learn/MarkdownContent";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

// ── Quiz types ─────────────────────────────────────────────────────────────────
interface QuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
}

type QuizState = "idle" | "loading" | "active" | "done";

// ── Subject hero gradients ────────────────────────────────────────────────────
const SUBJECT_HERO: Record<Subject, { gradient: string; icon: string; accent: "blue" | "green" | "orange" }> = {
  MOTHER_TONGUE: {
    gradient: "from-blue-600 to-blue-800",
    icon: "📚",
    accent: "blue",
  },
  MATHEMATICS: {
    gradient: "from-emerald-500 to-green-700",
    icon: "📐",
    accent: "green",
  },
  HISTORY: {
    gradient: "from-orange-500 to-amber-700",
    icon: "🏛️",
    accent: "orange",
  },
};

export default function LessonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = Number(params.id);
  const { tr } = useLang();
  const [readProgress, setReadProgress] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  // ── Scroll-based reading progress ──────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const scrolled = Math.max(0, windowH - top);
      const pct = Math.min(100, (scrolled / (height + windowH)) * 100);
      setReadProgress(pct);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: lesson, isLoading, error } = useLesson(lessonId);
  const completeLesson = useCompleteLesson();

  // ── Quiz state ────────────────────────────────────────────────────────────
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const quizRef = useRef<HTMLDivElement>(null);

  async function startQuiz() {
    if (!lesson) return;
    setQuizState("loading");
    try {
      const res = await lessonsApi.getQuiz(lesson.id);
      setQuizQuestions(res.data.questions ?? []);
      setQuizIndex(0);
      setQuizAnswers({});
      setQuizRevealed(false);
      setQuizState("active");
      setTimeout(() => quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setQuizState("idle");
    }
  }

  function selectAnswer(option: string) {
    if (quizAnswers[quizIndex] !== undefined) return;
    setQuizAnswers((prev) => ({ ...prev, [quizIndex]: option }));
    setQuizRevealed(true);
  }

  function nextQuestion() {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((i) => i + 1);
      setQuizRevealed(false);
    } else {
      // All answered → compute score
      const correct = quizQuestions.filter((q, i) => quizAnswers[i] === q.correct).length;
      const score = correct / quizQuestions.length;
      setQuizScore(score);
      setQuizState("done");
    }
  }

  async function handleComplete(passedScore?: number) {
    if (!lesson || lesson.is_completed) return;
    const score = passedScore ?? quizScore;
    try {
      await completeLesson.mutateAsync({ lessonId, quizScore: score });
    } catch (err) {
      console.error("Lesson complete error:", err);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="h-1 bg-slate-200" />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-8 bg-slate-200 rounded animate-pulse w-2/3" />
          <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{tr("lesson_not_found")}</p>
          <Link href="/learn" className="text-blue-600 hover:underline">
            {tr("lesson_back")}
          </Link>
        </div>
      </div>
    );
  }

  const hero = SUBJECT_HERO[lesson.subject as Subject] ?? SUBJECT_HERO.MOTHER_TONGUE;
  const readTime = estimateReadingTime(lesson.content_markdown);
  const headings = extractHeadings(lesson.content_markdown).filter((h) => h.level === 2);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200">
        <div
          className={`h-full bg-gradient-to-r ${hero.gradient} transition-all duration-150`}
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 mt-1">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/learn" className="text-slate-500 hover:text-slate-700 p-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <SubjectBadge subject={lesson.subject as Subject} />
          </div>
          <div className="flex items-center gap-3">
            {headings.length > 0 && (
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="text-slate-500 hover:text-slate-700 p-1"
                title={tr("lesson_toc")}
              >
                <List className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              <Star className="w-3.5 h-3.5" />
              <span>{lesson.xp_reward} {tr("xp")}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* TOC dropdown */}
      {tocOpen && headings.length > 0 && (
        <div className="fixed top-[57px] right-4 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 max-h-72 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{tr("lesson_toc")}</p>
          <nav className="space-y-1">
            {headings.map((h, i) => (
              <button
                key={i}
                onClick={() => setTocOpen(false)}
                className="w-full text-left flex items-start gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors"
              >
                <Hash className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-50" />
                <span className="line-clamp-1">{h.text}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 py-6" ref={contentRef}>
        {/* ── Hero banner ─────────────────────────────────────────────── */}
        <div className={`bg-gradient-to-br ${hero.gradient} rounded-2xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 -bottom-12 w-56 h-56 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
                {hero.icon}
              </div>
              <div className="flex-1 min-w-0">
                {lesson.era_tag && (
                  <span className="inline-block text-xs font-medium px-2.5 py-0.5 bg-white/20 text-white rounded-full mb-2">
                    {lesson.era_tag.replace("_", " ")}
                  </span>
                )}
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-2">
                  {lesson.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-white/70 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {readTime} {tr("lesson_read_min")}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {tr("lesson_number")}{lesson.order_index}
                  </span>
                  {lesson.is_completed && (
                    <span className="flex items-center gap-1 text-green-300">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {tr("lesson_completed_label")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section count mini-infographic */}
            {headings.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {headings.slice(0, 5).map((h, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs bg-white/15 text-white/90 rounded-full px-3 py-1"
                  >
                    <span className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span className="truncate max-w-[120px]">{h.text}</span>
                  </span>
                ))}
                {headings.length > 5 && (
                  <span className="text-xs text-white/60 px-3 py-1">
                    +{headings.length - 5} {tr("lesson_sections_more")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Key stats row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: "📖", labelKey: "lesson_sections", value: `${headings.length}` },
            { icon: "⏱️", labelKey: "lesson_read_time", value: `~${readTime}` },
            { icon: "🏆", labelKey: "lesson_reward_xp", value: `${lesson.xp_reward} ${tr("xp")}` },
          ].map((stat) => (
            <div key={stat.labelKey} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-sm font-bold text-slate-800">{stat.value}</div>
              <div className="text-xs text-slate-400">{tr(stat.labelKey)}</div>
            </div>
          ))}
        </div>

        {/* ── Lesson content ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 mb-6">
          <MarkdownContent
            content={lesson.content_markdown}
            accentColor={hero.accent}
          />
        </div>

        {/* ── AI Tutor CTA ─────────────────────────────────────────────── */}
        <div className={`bg-gradient-to-r ${hero.gradient} rounded-xl p-4 mb-6 flex items-center gap-3`}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">{tr("ask_ai_question")}</p>
            <p className="text-white/70 text-xs">{tr("ask_ai")}</p>
          </div>
          <Link
            href={`/ai-tutor?subject=${lesson.subject}&lesson=${encodeURIComponent(lesson.title)}`}
            className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
          >
            {tr("ask_ai_btn")} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Quiz + Complete section ──────────────────────────────────── */}
        <div ref={quizRef} className="mb-6 space-y-4">

          {lesson.is_completed ? (
            /* Already completed */
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">✅</div>
              <p className="font-semibold text-emerald-700">{tr("lesson_already_done")}</p>
              <p className="text-sm text-slate-500 mt-1">{tr("lesson_next")}</p>
            </div>

          ) : quizState === "idle" ? (
            /* Start quiz CTA */
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-fuchsia-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-fuchsia-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Bilimni tekshirish</p>
                  <p className="text-sm text-slate-500">3 ta savol — Chaqa miqdori natijangizga bog'liq</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Savollar</p>
                  <p className="font-black text-slate-800">3 ta</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Maksimal Chaqa</p>
                  <p className="font-black text-amber-700">{lesson.xp_reward} C</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={startQuiz}
                  className="flex-1 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  <Brain className="w-4 h-4" /> Test boshlash
                </button>
                <button onClick={() => handleComplete(0.2)}
                  disabled={completeLesson.isPending}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  {completeLesson.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Testsiz yakunlash"}
                </button>
              </div>
            </div>

          ) : quizState === "loading" ? (
            /* Loading */
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">AI savollar tayyorlamoqda...</p>
            </div>

          ) : quizState === "active" && quizQuestions.length > 0 ? (
            /* Quiz questions */
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="bg-fuchsia-600 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-fuchsia-100" />
                  <p className="text-white font-bold text-sm">Test</p>
                </div>
                <p className="text-fuchsia-100 text-xs">{quizIndex + 1} / {quizQuestions.length}</p>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-fuchsia-100">
                <div className="h-full bg-fuchsia-500 transition-all"
                  style={{ width: `${((quizIndex + (quizAnswers[quizIndex] ? 1 : 0)) / quizQuestions.length) * 100}%` }} />
              </div>

              <div className="p-5 sm:p-6">
                {/* Question */}
                <p className="font-semibold text-slate-800 text-base leading-snug mb-5">
                  {quizQuestions[quizIndex]?.question}
                </p>

                {/* Options */}
                <div className="space-y-2.5">
                  {Object.entries(quizQuestions[quizIndex]?.options ?? {}).map(([key, text]) => {
                    const selected  = quizAnswers[quizIndex] === key;
                    const isCorrect = quizQuestions[quizIndex]?.correct === key;
                    const revealed  = quizRevealed;

                    return (
                      <button key={key} onClick={() => selectAnswer(key)}
                        disabled={quizRevealed}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all text-sm font-medium",
                          !revealed && "border-slate-200 bg-slate-50 hover:border-fuchsia-300 hover:bg-fuchsia-50",
                          revealed && isCorrect  && "border-emerald-400 bg-emerald-50 text-emerald-700",
                          revealed && selected && !isCorrect && "border-red-400 bg-red-50 text-red-700",
                          revealed && !selected && !isCorrect && "border-slate-200 bg-slate-50 text-slate-400",
                        )}>
                        <span className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0",
                          !revealed && "bg-slate-200 text-slate-600",
                          revealed && isCorrect  && "bg-emerald-400 text-white",
                          revealed && selected && !isCorrect && "bg-red-400 text-white",
                          revealed && !selected && !isCorrect && "bg-slate-200 text-slate-400",
                        )}>
                          {key}
                        </span>
                        {text as string}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation + next */}
                {quizRevealed && (
                  <div className="mt-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                      <p className="text-xs font-bold text-blue-600 mb-1">Izoh</p>
                      <p className="text-sm text-blue-800 leading-relaxed">{quizQuestions[quizIndex]?.explanation}</p>
                    </div>
                    <button onClick={nextQuestion}
                      className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl transition-colors">
                      {quizIndex < quizQuestions.length - 1 ? "Keyingi savol →" : "Natijani ko'rish"}
                    </button>
                  </div>
                )}
              </div>
            </div>

          ) : quizState === "done" ? (
            /* Quiz results + complete */
            <div className="space-y-3">
              {/* Score card */}
              <div className={cn(
                "rounded-2xl p-6 text-center border",
                quizScore >= 0.8 ? "bg-emerald-50 border-emerald-200" :
                quizScore >= 0.6 ? "bg-blue-50 border-blue-200" :
                "bg-amber-50 border-amber-200"
              )}>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-3xl
                  bg-white border-4 border-current"
                  style={{ color: quizScore >= 0.8 ? "#10b981" : quizScore >= 0.6 ? "#3b82f6" : "#f59e0b" }}>
                  {quizScore >= 0.8 ? "🏆" : quizScore >= 0.6 ? "⭐" : "📚"}
                </div>
                <p className={cn("text-2xl font-black mb-1",
                  quizScore >= 0.8 ? "text-emerald-700" : quizScore >= 0.6 ? "text-blue-700" : "text-amber-700"
                )}>
                  {Math.round(quizScore * quizQuestions.length)} / {quizQuestions.length} to'g'ri
                </p>
                <p className="text-sm text-slate-500 mb-1">
                  {quizScore >= 0.8 ? "Ajoyib natija! 🔥" : quizScore >= 0.6 ? "Yaxshi ishlading! 👍" : "Davom eting! 💪"}
                </p>
                <p className="text-xs font-bold text-slate-600">
                  Siz +<span className="text-amber-600">{Math.round(lesson.xp_reward * Math.max(0.2, quizScore))}</span> Chaqa olasiz
                </p>
              </div>

              {/* Complete button */}
              <button onClick={() => handleComplete()}
                disabled={completeLesson.isPending}
                className="w-full py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                {completeLesson.isPending
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Saqlanmoqda...</>
                  : <><CheckCircle className="w-5 h-5" /> {tr("lesson_complete_btn")}</>}
              </button>
            </div>
          ) : null}

        </div>

        {/* ── Bottom navigation ────────────────────────────────────────── */}
        <div className="flex justify-between items-center">
          <Link
            href="/learn"
            className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            {tr("lesson_back_list")}
          </Link>
          <Link
            href="/exam"
            className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-1 transition-colors"
          >
            {tr("exam_title")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
