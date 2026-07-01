"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, Loader2, Download, RefreshCw,
  BookOpen, ChevronDown, AlertCircle, Clock, User, Maximize2, X
} from "lucide-react";
import { canvasApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CanvasFact   { label: string; value: string; }
interface CanvasEvent  { year: string; event: string; }

interface CanvasResult {
  title: string;
  description: string;
  facts: CanvasFact[];
  timeline: CanvasEvent[];
  key_figures: string[];
  image_url: string;
  imagen_prompt: string;
  subject: string;
  topic: string;
}

// ── Topic lists ────────────────────────────────────────────────────────────────

const TOPICS: Record<string, string[]> = {
  MOTHER_TONGUE: [
    "Fonetika: Unli va undosh tovushlar",
    "Imlo qoidalari: Qo'shib va ajratib yozish",
    "So'z turkumlari: Ot, sifat, fe'l, ravish",
    "Kelishiklar va ularning qo'llanishi",
    "Gap bo'laklari: Ega, kesim, to'ldiruvchi",
    "Alisher Navoiy: Hayoti va Xamsa",
    "Abdulla Qodiriy: O'tkan kunlar",
    "G'azal: Tuzilishi va namunalar",
    "Jadidchilik adabiyoti",
    "Hozirgi o'zbek adabiyoti",
  ],
  MATHEMATICS: [
    "Kvadrat tenglamalar va Viyeta teoremasi",
    "Logarifm va ko'rsatkichli funksiyalar",
    "Trigonometrik funksiyalar va identiklar",
    "Arifmetik progressiya",
    "Geometrik progressiya",
    "Kombinatorika: Permutatsiya va kombinatsiya",
    "Ehtimollik nazariyasi",
    "Pifagor teoremasi",
    "Koordinatalar: to'g'ri chiziq tenglamasi",
    "Foiz va nisbat masalalari",
  ],
  HISTORY: [
    "Amir Temur: Hayoti va davlati",
    "Buyuk Ipak yo'li va savdo",
    "Arab fathi va islomning tarqalishi",
    "Mo'g'ul istilosi va oqibatlari",
    "Temuriylar: Ulug'bek va Navoiy davri",
    "Jadidchilik harakati",
    "Mustaqillik: 1991 yil",
    "Yangi O'zbekiston: Mirziyoyev davri islohotlari",
    "Somoniylar davlati va ilm-fan",
    "Al-Xorazmiy va algebra",
  ],
};

const SUBJECT_LIST = [
  { value: "MOTHER_TONGUE", trKey: "subject_mother_short", icon: "📝", color: "bg-blue-600" },
  { value: "MATHEMATICS",   trKey: "subject_math_short",   icon: "📐", color: "bg-green-600" },
  { value: "HISTORY",       trKey: "subject_history_short", icon: "🏛️", color: "bg-orange-600" },
];

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CanvasPage() {
  const router = useRouter();
  const { lang, tr } = useLang();

  const [subject, setSubject] = useState("HISTORY");
  const [topic, setTopic]     = useState(TOPICS.HISTORY[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [language, setLanguage] = useState(lang);

  const [result, setResult]       = useState<CanvasResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageUrl, setImageUrl]   = useState<string>("");
  const [error, setError]         = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!isAuthenticated()) router.push("/login"); }, [router]);
  useEffect(() => { setLanguage(lang); }, [lang]);
  useEffect(() => {
    setTopic(TOPICS[subject]?.[0] || "");
    setCustomTopic("");
  }, [subject]);

  const activeTopic = customTopic.trim() || topic;

  async function handleGenerate() {
    if (!activeTopic) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setImageUrl("");
    try {
      const res = await canvasApi.generate({ subject, topic: activeTopic, language });
      const data = res.data as CanvasResult;
      setResult(data);
      setIsGenerating(false);

      // Generate image separately via Vercel API route
      if (data.imagen_prompt) {
        setIsLoadingImage(true);
        try {
          const imgRes = await fetch("/api/canvas-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: data.imagen_prompt }),
          });
          const imgData = await imgRes.json();
          if (imgData.image_url) setImageUrl(imgData.image_url);
        } catch {
          // image failed silently — canvas still shows without image
        } finally {
          setIsLoadingImage(false);
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof msg === "string" ? msg : tr("error"));
      setIsGenerating(false);
    }
  }

  function handleDownload() {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `canvas-${result?.topic.slice(0, 30).replace(/\s+/g, "-") ?? "image"}.jpg`;
    link.click();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Navbar */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">{tr("canvas_title")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="w-2 h-2 bg-pink-400 rounded-full inline-block animate-pulse" />
            Imagen 4 · AbituriyentAI
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Controls ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Subject */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-purple-400" /> {tr("ai_select_subject")}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {SUBJECT_LIST.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSubject(s.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl border text-[10px] sm:text-xs font-medium transition-all",
                    subject === s.value
                      ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/20"
                      : "border-white/10 text-white/60 hover:border-purple-400 hover:text-white"
                  )}
                >
                  <span className="text-lg">{s.icon}</span>
                  {tr(s.trKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
            <h3 className="font-bold text-white mb-3 text-sm">{tr("canvas_select_topic")}</h3>
            <div className="relative mb-3">
              <select
                value={topic}
                onChange={e => { setTopic(e.target.value); setCustomTopic(""); }}
                className="w-full text-sm border border-white/10 rounded-xl px-3 py-2.5 bg-white/5 text-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {(TOPICS[subject] || []).map(t => (
                  <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
            <p className="text-xs text-white/40 mb-1.5">{tr("canvas_custom_topic")}</p>
            <input
              type="text"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder={tr("canvas_select_topic") + "..."}
              className="w-full text-sm border border-white/10 rounded-xl px-3 py-2.5 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Language */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
            <p className="text-xs font-medium text-white/50 mb-2">{tr("ai_language")}</p>
            <div className="flex gap-2">
              {(["uz", "ru", "en", "qq"] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    language === l
                      ? "bg-purple-600 text-white border-purple-500"
                      : "border-white/10 text-white/50 hover:bg-white/5"
                  )}
                >
                  {l === "uz" ? "🇺🇿 UZ" : l === "ru" ? "🇷🇺 RU" : l === "en" ? "🇬🇧 EN" : "QQ"}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !activeTopic}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {tr("canvas_generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {tr("canvas_generate")}
              </>
            )}
          </button>

          <p className="text-xs text-white/30 text-center">
            Imagen 4 · ~20–40s · 70 canvas/day
          </p>
        </div>

        {/* ── RIGHT: Canvas Output ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-300 text-sm">{tr("error")}</p>
                <p className="text-red-400 text-sm mt-1">{error}</p>
                <button onClick={handleGenerate} disabled={isGenerating} className="mt-2 text-xs text-red-300 hover:text-red-200 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> {tr("canvas_regenerate")}
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {isGenerating && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{tr("canvas_generating")}</h3>
              <p className="text-white/40 text-sm mb-1">"{activeTopic}"</p>
              <p className="text-white/30 text-xs mb-6">Gemini · Imagen 4 Fast</p>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isGenerating && !result && !error && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-16 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-12 h-12 text-purple-300" />
              </div>
              <h3 className="font-bold text-white text-xl mb-3">{tr("canvas_title")}</h3>
              <p className="text-white/40 text-sm max-w-sm mx-auto">{tr("canvas_empty")}</p>
            </div>
          )}

          {/* Canvas Result */}
          {result && !isGenerating && (
            <div ref={canvasRef} className="space-y-4">
              {/* Image */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={result.title}
                    className="w-full object-cover min-h-[220px] max-h-[220px] sm:max-h-[300px] lg:max-h-[380px]"
                  />
                ) : (
                  <div className="w-full h-[220px] sm:h-[300px] lg:h-[380px] bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex items-center justify-center">
                    {isLoadingImage ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                        <span className="text-white/40 text-xs">Rasm yaratilmoqda...</span>
                      </div>
                    ) : (
                      <Sparkles className="w-16 h-16 text-purple-400/40" />
                    )}
                  </div>
                )}
                {/* Overlay gradient with title */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                  <SubjectBadge subject={result.subject as Subject} size="sm" />
                  <h2 className="text-2xl font-bold text-white mt-2 drop-shadow-lg">{result.title}</h2>
                  <p className="text-white/70 text-sm mt-1 line-clamp-2">{result.description}</p>
                </div>
                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {imageUrl && (
                    <button
                      onClick={() => setFullscreen(true)}
                      className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1.5 rounded-full text-xs font-medium hover:bg-black/80 transition-colors border border-white/20"
                      title="Katta ko'rish"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {imageUrl && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1.5 rounded-full text-xs font-medium hover:bg-black/80 transition-colors border border-white/20"
                      title={tr("canvas_download")}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tr("canvas_download")}</span>
                    </button>
                  )}
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-1 bg-purple-600/70 backdrop-blur-sm text-white px-2 py-1.5 rounded-full text-xs font-medium hover:bg-purple-600 transition-colors border border-purple-400/30"
                    title={tr("canvas_regenerate")}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tr("canvas_regenerate")}</span>
                  </button>
                </div>
              </div>

              {/* Facts + Timeline + Figures */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Key Facts */}
                {result.facts.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-400">★</span>
                      {tr("canvas_facts")}
                    </h3>
                    <div className="space-y-2.5">
                      {result.facts.map((f, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                          <span className="text-white/50 text-xs">{f.label}</span>
                          <span className="text-white text-xs font-semibold text-right max-w-[60%]">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {result.timeline.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-400" />
                      {tr("canvas_timeline")}
                    </h3>
                    <div className="space-y-3 relative">
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
                      {result.timeline.map((ev, i) => (
                        <div key={i} className="flex gap-3 pl-5 relative">
                          <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-slate-900 flex-shrink-0" />
                          <div>
                            <span className="text-purple-300 text-xs font-bold block">{ev.year}</span>
                            <span className="text-white/70 text-xs">{ev.event}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Key Figures */}
              {result.key_figures.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-pink-400" />
                    {tr("canvas_figures")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.key_figures.map((fig, i) => (
                      <span key={i} className="bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/10">
                        {fig}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Fullscreen image overlay ──────────────────────────────────────── */}
      {fullscreen && result && imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center gap-4"
            onClick={e => e.stopPropagation()}>
            <img
              src={imageUrl}
              alt={result.title}
              className="rounded-2xl object-contain max-h-[75vh] w-full shadow-2xl border border-white/10"
            />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">{result.title}</h2>
              <p className="text-white/60 text-sm max-w-2xl">{result.description}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors border border-white/20"
              >
                <Download className="w-4 h-4" /> {tr("canvas_download")}
              </button>
              <button
                onClick={() => setFullscreen(false)}
                className="flex items-center gap-2 bg-purple-600/50 hover:bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors border border-purple-400/30"
              >
                <X className="w-4 h-4" /> Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
