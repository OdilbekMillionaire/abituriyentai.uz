"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain, Sparkles, ArrowLeft, BookOpen, BarChart3,
  Volume2, VolumeX, ChevronDown, Loader2, CheckCircle,
  Star, RefreshCw, Trophy, AlertCircle
} from "lucide-react";
import { aiLessonsApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { MarkdownContent } from "@/components/learn/MarkdownContent";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { SkeletonLine, SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type FormatType = "text" | "visual" | "audio";
type Difficulty = "easy" | "medium" | "hard";
type LangType = "uz" | "ru" | "en" | "qq";
type LengthType = "short" | "medium" | "deep";

interface VisualBlock {
  type: string;
  heading?: string;
  body?: string;
  term?: string;
  definition?: string;
  emoji?: string;
  columns?: string[];
  rows?: string[][];
  formula?: string;
  explanation?: string;
  points?: string[];
  problem?: string;
  solution?: string;
}

interface GeneratedLesson {
  title: string;
  content_markdown: string;
  visual_blocks: VisualBlock[];
  reading_time_minutes: number;
  tanga_reward: number;
  format: string;
  subject: string;
  topic: string;
}

interface QuizQuestion {
  question: string;
  options: Record<string, string>;
  correct: string;
  explanation: string;
}

// ── Topic lists (mirrored from backend) ───────────────────────────────────────

const TOPICS: Record<string, string[]> = {
  MOTHER_TONGUE: [
    "Fonetika: Unli va undosh tovushlar",
    "Imlo qoidalari: Qo'shib va ajratib yozish",
    "So'z turkumlari: Ot, sifat, fe'l, ravish",
    "Kelishiklar va ularning qo'llanishi",
    "Gap bo'laklari: Ega, kesim, to'ldiruvchi, aniqlovchi, hol",
    "Uyushiq bo'laklar va murojaat",
    "Qo'shma gaplar: Bog'lovchili va bog'lovchisiz",
    "Ko'chma ma'no va badiiy san'atlar",
    "Sinonimlar, antonimlar va omonimlar",
    "Frazeologizmlar va maqollar",
    "Alisher Navoiy: Hayoti va Xamsa",
    "Abdulla Qodiriy: O'tkan kunlar",
    "Cho'lpon: She'riyati va Kecha va kunduz",
    "Hamza Hakimzoda Niyoziy",
    "Abdulla Oripov: She'riyati",
    "G'azal: Tuzilishi va namunalar",
    "Ruboiy va qasida",
    "Aruz va barmoq vazni",
    "Jadidchilik adabiyoti",
    "Hozirgi o'zbek adabiyoti",
  ],
  MATHEMATICS: [
    "Kvadrat tenglamalar va Viyeta teoremasi",
    "Tengsizliklar: chiziqli va kvadratik",
    "Modulli va kasr tengsizliklar",
    "Logarifm va ko'rsatkichli funksiyalar",
    "Trigonometrik funksiyalar va identiklar",
    "Trigonometrik tenglamalar",
    "Arifmetik progressiya",
    "Geometrik progressiya",
    "Kombinatorika: Permutatsiya va kombinatsiya",
    "Ehtimollik nazariyasi",
    "Funksiyalar: aniqlik sohasi va qiymatlar to'plami",
    "Pifagor teoremasi va to'g'ri burchakli uchburchak",
    "Uchburchak: yuzasi, perimetri, turlar",
    "To'g'ri to'rtburchak va parallelogramm",
    "Aylana va doira: yuz va uzunlik",
    "Ko'pburchaklar va ularning xossalari",
    "Koordinatalar: to'g'ri chiziq tenglamasi",
    "Harakat masalalari",
    "Ish va unumdorlik masalalari",
    "Foiz va nisbat masalalari",
  ],
  HISTORY: [
    "Qadimgi O'zbekiston: Ilk davlatlar (Baqtriya, Sug'diyona, Xorazm)",
    "Buyuk Ipak yo'li va savdo",
    "Kushon davlati va buddizm",
    "Arab fathi va islomning tarqalishi",
    "Somoniylar davlati va ilm-fan",
    "Al-Xorazmiy va algebra",
    "Abu Ali ibn Sino va tibbiyot",
    "Abu Rayhon Beruniy",
    "Qoraxoniylar va G'aznaviylar",
    "Mo'g'ul istilosi va oqibatlari",
    "Amir Temur: Hayoti va davlati",
    "Temuriylar: Ulug'bek va Navoiy davri",
    "Shayboniylar va O'zbek xonliklari",
    "Buxoro, Xiva va Qo'qon xonliklari",
    "Rossiya bosqini va mustamlaka davr",
    "Jadidchilik harakati",
    "1916 yil qo'zg'oloni",
    "Sovet davri: 1924 yil chegaralash va O'zSSR",
    "Mustaqillik: 1991 yil",
    "Yangi O'zbekiston: Mirziyoyev davri islohotlari",
  ],
};

// ── Visual Block Renderer ──────────────────────────────────────────────────────

function VisualBlockCard({ block }: { block: VisualBlock }) {
  switch (block.type) {
    case "intro":
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-bold text-blue-900 mb-2">{block.heading}</h3>
          <p className="text-blue-800 text-sm leading-relaxed">{block.body}</p>
        </div>
      );

    case "definition":
      return (
        <div className="bg-white border-l-4 border-purple-500 rounded-r-xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{block.emoji || "📚"}</span>
            <div>
              <h3 className="font-bold text-purple-900 mb-1">{block.heading}</h3>
              <div className="inline-block bg-purple-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full mb-2">
                {block.term}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">{block.definition}</p>
            </div>
          </div>
        </div>
      );

    case "table":
      return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {block.heading && (
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{block.heading}</h3>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {(block.columns || []).map((col, i) => (
                    <th key={i} className="px-4 py-3 text-left font-semibold text-slate-700">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(block.rows || []).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3 text-slate-700">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "formula":
      return (
        <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-xl p-5">
          <h3 className="font-bold text-green-900 mb-3">{block.heading}</h3>
          <div className="bg-white rounded-lg px-6 py-4 text-center mb-3 border border-green-100">
            <code className="text-xl font-mono font-bold text-green-700">{block.formula}</code>
          </div>
          {block.explanation && (
            <p className="text-green-800 text-sm">{block.explanation}</p>
          )}
        </div>
      );

    case "key_points":
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-600" />
            {block.heading}
          </h3>
          <ul className="space-y-2">
            {(block.points || []).map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-yellow-800">
                <span className="font-bold text-yellow-600 mt-0.5">{i + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "example":
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">{block.heading}</h3>
          <div className="bg-slate-50 rounded-lg p-4 mb-3">
            <p className="text-slate-700 text-sm font-medium">{block.problem}</p>
          </div>
          {block.solution && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <p className="text-green-800 text-sm">
                <span className="font-bold">= </span>{block.solution}
              </p>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          {block.heading && <h3 className="font-bold text-slate-800 mb-2">{block.heading}</h3>}
          {block.body && <p className="text-slate-700 text-sm">{block.body}</p>}
          {block.points && (
            <ul className="space-y-1 mt-2">
              {block.points.map((p, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>{p}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
  }
}

// ── Post-lesson Quiz ───────────────────────────────────────────────────────────

function PostLessonQuiz({
  questions,
  onClose,
  tr,
}: {
  questions: QuizQuestion[];
  onClose: () => void;
  tr: (key: string, fallback?: string) => string;
}) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const q = questions[current];
  const score = Object.entries(selected).filter(
    ([idx, ans]) => questions[parseInt(idx)].correct === ans
  ).length;

  if (showResults) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          {score}/{questions.length} {tr("drill_correct")}
        </h3>
        <p className="text-slate-500 mb-6">
          {score === questions.length ? tr("ai_perfect") :
           score >= questions.length * 0.6 ? tr("ai_good") :
           tr("ai_review_again")}
        </p>
        <div className="space-y-3 text-left mb-6">
          {questions.map((q, i) => (
            <div key={i} className={cn(
              "p-3 rounded-lg border text-sm",
              selected[i] === q.correct
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            )}>
              <p className="font-medium text-slate-800 mb-1">{i + 1}. {q.question}</p>
              <p className="text-xs text-slate-600">
                ✅ {tr("ai_correct")} {q.correct}) {q.options[q.correct]}
              </p>
              <p className="text-xs text-slate-500 mt-1 italic">{q.explanation}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          {tr("close")}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">
          {tr("ai_question_of")} {current + 1}/{questions.length}
        </h3>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full",
                i === current ? "bg-blue-600" :
                selected[i] !== undefined ? "bg-green-500" : "bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      <p className="text-slate-800 font-medium mb-4">{q.question}</p>

      <div className="space-y-2 mb-6">
        {Object.entries(q.options).map(([key, val]) => {
          const isSelected = selected[current] === key;
          return (
            <button
              key={key}
              onClick={() => setSelected(prev => ({ ...prev, [current]: key }))}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                isSelected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
              )}
            >
              <span className="font-bold mr-2">{key})</span>{val}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        {current > 0 && (
          <button
            onClick={() => setCurrent(c => c - 1)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
          >
            {tr("ai_prev")}
          </button>
        )}
        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            disabled={selected[current] === undefined}
            className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {tr("ai_next")}
          </button>
        ) : (
          <button
            onClick={() => setShowResults(true)}
            disabled={selected[current] === undefined}
            className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {tr("ai_show_results")}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Lang → backend language string ────────────────────────────────────────────

function toLessonLang(lang: string): string {
  if (lang === "en") return "english";
  if (lang === "qq") return "karakalpak (Qaraqalpaq tili)";
  if (lang === "ru") return "russian";
  return "uzbek";
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AiLessonPage() {
  const router = useRouter();
  const { lang: globalLang, tr } = useLang();

  // Config state
  const [subject, setSubject] = useState<string>("MOTHER_TONGUE");
  const [topic, setTopic] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [formatType, setFormatType] = useState<FormatType>("text");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [language, setLanguage] = useState<LangType>(globalLang as LangType);
  const [length, setLength] = useState<LengthType>("medium");

  // Lesson state
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-lesson state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);

  // Audio (TTS)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login");
  }, [router]);

  // Sync language picker with global lang
  useEffect(() => {
    setLanguage(globalLang as LangType);
  }, [globalLang]);

  // Auto-select first topic when subject changes
  useEffect(() => {
    const topics = TOPICS[subject] || [];
    setTopic(topics[0] || "");
    setCustomTopic("");
  }, [subject]);

  const activeTopic = customTopic.trim() || topic;

  async function handleGenerate() {
    if (!activeTopic) return;
    setIsGenerating(true);
    setError(null);
    setLesson(null);
    setQuizQuestions(null);
    setShowQuiz(false);
    setLessonCompleted(false);

    try {
      const res = await aiLessonsApi.generate({
        subject,
        topic: activeTopic,
        format_type: formatType,
        difficulty,
        language: toLessonLang(language),
        length,
      });
      setLesson(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(typeof msg === "string" ? msg : tr("error"));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateQuiz() {
    if (!lesson) return;
    setIsGeneratingQuiz(true);
    try {
      const res = await aiLessonsApi.generateQuiz({
        lesson_content: lesson.content_markdown,
        topic: lesson.topic,
        subject: lesson.subject,
        language: toLessonLang(language),
        num_questions: 5,
      });
      setQuizQuestions(res.data.questions);
      setShowQuiz(true);
    } catch {
      setError(tr("error"));
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  function handleSpeak() {
    if (!lesson) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = lesson.content_markdown.replace(/[#*`|_~]/g, " ").replace(/\s+/g, " ");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ";
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  const SUBJECT_LIST: { value: string; trKey: string; icon: string }[] = [
    { value: "MOTHER_TONGUE", trKey: "subject_mother_short", icon: "📝" },
    { value: "MATHEMATICS",   trKey: "subject_math_short",   icon: "📐" },
    { value: "HISTORY",       trKey: "subject_history_short", icon: "🏛️" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">{tr("ai_generator")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
            AbituriyentAI
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Configuration Panel ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Subject */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> {tr("ai_select_subject")}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {SUBJECT_LIST.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSubject(s.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all",
                    subject === s.value
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                  )}
                >
                  <span className="text-lg">{s.icon}</span>
                  {tr(s.trKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-3">{tr("ai_select_topic")}</h3>
            <div className="relative mb-3">
              <select
                value={topic}
                onChange={e => { setTopic(e.target.value); setCustomTopic(""); }}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {(TOPICS[subject] || []).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">{tr("ai_custom_topic")}</p>
              <input
                type="text"
                value={customTopic}
                onChange={e => setCustomTopic(e.target.value)}
                placeholder={tr("ai_custom_placeholder")}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Format */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" /> {tr("ai_format")}
            </h3>
            {[
              { value: "text",   labelKey: "ai_format_text",   descKey: "ai_format_text_desc",   icon: "📄" },
              { value: "visual", labelKey: "ai_format_visual",  descKey: "ai_format_visual_desc", icon: "🎨" },
              { value: "audio",  labelKey: "ai_format_audio",   descKey: "ai_format_audio_desc",  icon: "🔊" },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFormatType(f.value as FormatType)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border mb-2 text-left transition-all",
                  formatType === f.value
                    ? "bg-purple-50 border-purple-300 text-purple-900"
                    : "border-slate-200 hover:border-purple-200 hover:bg-purple-50/50"
                )}
              >
                <span className="text-sm font-medium">{f.icon} {tr(f.labelKey)}</span>
                <span className="text-xs text-slate-400">{tr(f.descKey)}</span>
              </button>
            ))}
          </div>

          {/* Customisation */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              ⚙️ {tr("ai_settings")}
            </h3>

            {/* Difficulty */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">{tr("ai_difficulty")}</p>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      difficulty === d
                        ? d === "easy" ? "bg-green-500 text-white border-green-500"
                          : d === "medium" ? "bg-yellow-500 text-white border-yellow-500"
                          : "bg-red-500 text-white border-red-500"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {d === "easy" ? tr("ai_easy") : d === "medium" ? tr("ai_medium") : tr("ai_hard")}
                  </button>
                ))}
              </div>
            </div>

            {/* Language for AI output */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">{tr("ai_language")}</p>
              <div className="flex gap-2 flex-wrap">
                {(["uz", "ru", "en", "qq"] as LangType[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all min-w-[40px]",
                      language === l
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {l === "uz" ? "🇺🇿 UZ" : l === "ru" ? "🇷🇺 RU" : l === "en" ? "🇬🇧 EN" : "QQ"}
                  </button>
                ))}
              </div>
            </div>

            {/* Length */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">{tr("ai_length")}</p>
              <div className="flex gap-2">
                {[
                  { value: "short",  label: "5 min" },
                  { value: "medium", label: "10 min" },
                  { value: "deep",   label: "20 min" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setLength(value as LengthType)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      length === value
                        ? "bg-slate-800 text-white border-slate-800"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !activeTopic}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-60 shadow-md"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {tr("ai_generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {tr("ai_generate")}
              </>
            )}
          </button>

          {/* Tanga preview */}
          {!lesson && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">🪙</span>
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  {length === "short" ? "25–30" : length === "medium" ? "40–50" : "70–80"} {tr("coins")}
                </p>
                <p className="text-xs text-yellow-600">{tr("ai_coins_on_finish")}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Lesson Content ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 text-sm">{tr("error")}</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {tr("ai_refresh")}
                </button>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isGenerating && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <SkeletonLine h="7" w="3/4" />
              <div className="flex gap-2">
                <SkeletonLine h="5" w="24" />
                <SkeletonLine h="5" w="20" />
              </div>
              <SkeletonCard lines={4} />
              <SkeletonCard lines={3} />
              <SkeletonCard lines={5} />
              <SkeletonCard lines={3} />
            </div>
          )}

          {/* Empty state */}
          {!isGenerating && !lesson && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="font-bold text-slate-700 text-lg mb-2">{tr("ai_generator")}</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                {tr("ai_subtitle")}
              </p>
              <div className="grid grid-cols-3 gap-4 text-xs text-slate-500">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-2xl mb-1">📄</div>
                  <div className="font-medium">{tr("ai_format_text")}</div>
                  <div className="text-slate-400">{tr("ai_format_text_desc")}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-2xl mb-1">🎨</div>
                  <div className="font-medium">{tr("ai_format_visual")}</div>
                  <div className="text-slate-400">{tr("ai_format_visual_desc")}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-2xl mb-1">🔊</div>
                  <div className="font-medium">{tr("ai_format_audio")}</div>
                  <div className="text-slate-400">{tr("ai_format_audio_desc")}</div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Lesson */}
          {lesson && !isGenerating && (
            <>
              {/* AI Disclaimer */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                <span className="text-base shrink-0">⚠️</span>
                <span>Ushbu dars sun&apos;iy intellekt tomonidan yaratilgan. Rasmiy BMBA manba emas.</span>
              </div>

              {/* Lesson header */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <SubjectBadge subject={lesson.subject as Subject} size="sm" />
                      <span className="text-xs text-slate-400">
                        ⏱ {lesson.reading_time_minutes} {tr("minutes")}
                      </span>
                      <span className="text-xs text-slate-400">
                        🪙 +{lesson.tanga_reward} {tr("coins")}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{lesson.title}</h1>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {/* Audio button */}
                    {(lesson.format === "text" || lesson.format === "audio") && (
                      <button
                        onClick={handleSpeak}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                          isSpeaking
                            ? "bg-orange-100 text-orange-700 border-orange-300"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        {isSpeaking ? tr("ai_stop") : tr("ai_listen")}
                      </button>
                    )}
                    {/* Regenerate */}
                    <button
                      onClick={handleGenerate}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {tr("ai_refresh")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lesson content */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                {lesson.format === "visual" && lesson.visual_blocks.length > 0 ? (
                  <div className="space-y-4">
                    {lesson.visual_blocks.map((block, i) => (
                      <VisualBlockCard key={i} block={block} />
                    ))}
                  </div>
                ) : (
                  <MarkdownContent content={lesson.content_markdown} />
                )}
              </div>

              {/* Post-lesson actions */}
              {!lessonCompleted ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                  <h3 className="font-bold text-slate-800 mb-2">{tr("ai_finish_done")}</h3>
                  <p className="text-slate-500 text-sm mb-4">
                    {tr("ai_test_earn")}{" "}
                    <span className="font-bold text-yellow-600">🪙 {lesson.tanga_reward} {tr("coins")}</span>
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={isGeneratingQuiz}
                      className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                    >
                      {isGeneratingQuiz ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {tr("ai_quiz_generating")}</>
                      ) : (
                        <><CheckCircle className="w-4 h-4" /> {tr("ai_check_knowledge")}</>
                      )}
                    </button>
                    <button
                      onClick={() => setLessonCompleted(true)}
                      className="flex items-center gap-2 border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                      {tr("ai_done_btn")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-bold text-green-800 mb-1">{tr("ai_lesson_done")}</h3>
                  <p className="text-green-600 text-sm mb-4">
                    🪙 +{lesson.tanga_reward} {tr("ai_coins_added")}
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm"
                  >
                    {tr("ai_back_dashboard")}
                  </Link>
                </div>
              )}

              {/* Quiz */}
              {showQuiz && quizQuestions && (
                <PostLessonQuiz
                  questions={quizQuestions}
                  tr={tr}
                  onClose={() => {
                    setShowQuiz(false);
                    setLessonCompleted(true);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
