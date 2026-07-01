"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Coins } from "lucide-react";
import { gamesApi } from "@/lib/api";
import { useLang } from "@/lib/lang";
import { playSound } from "@/lib/sound";

const SUBJECTS = [
  { value: "MATHEMATICS",   label: "📐 Matematika" },
  { value: "MOTHER_TONGUE", label: "📝 Ona tili" },
  { value: "HISTORY",       label: "🏛️ Tarix" },
];

interface Card {
  id: number; question: string; answer: string;
  all_options: string[]; correct_index: number;
  explanation: string | null; difficulty: string; tags: string[];
}

export default function FlashcardsPage() {
  const { tr } = useLang();
  const [subject, setSubject] = useState("MATHEMATICS");
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  async function load() {
    setLoading(true); setDone(false); setIdx(0); setFlipped(false);
    setKnown(new Set()); setUnknown(new Set()); setCoinsEarned(0);
    try {
      const res = await gamesApi.flashcards(subject);
      setCards(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [subject]);

  function flip() { setFlipped(!flipped); playSound("flip"); }

  function markKnown() {
    setKnown((prev) => new Set([...prev, idx]));
    setCoinsEarned((c) => c + 2);
    playSound("correct");
    next();
  }

  function markUnknown() {
    setUnknown((prev) => new Set([...prev, idx]));
    playSound("wrong");
    next();
  }

  function next() {
    setFlipped(false);
    if (idx + 1 >= cards.length) { setDone(true); playSound("win"); return; }
    setTimeout(() => setIdx(idx + 1), 150);
  }

  function prev() {
    if (idx === 0) return;
    setFlipped(false);
    setTimeout(() => setIdx(idx - 1), 100);
  }

  const card = cards[idx];
  const progress = cards.length > 0 ? ((idx) / cards.length) * 100 : 0;

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-4xl mb-3 animate-bounce">🃏</div>
        <p className="text-slate-400">{tr("game_loading")}</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center border border-slate-700">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-white mb-2">{tr("game_finish")}</h2>
        <div className="flex justify-center gap-6 my-6">
          <div className="text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-400">{known.size}</div>
            <div className="text-xs text-slate-400">Bildim</div>
          </div>
          <div className="text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-400">{unknown.size}</div>
            <div className="text-xs text-slate-400">Bilmadim</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="font-bold text-yellow-300">+{coinsEarned} Chaqa</span>
        </div>
        <button onClick={load} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
          {tr("game_restart")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800/80 border-b border-slate-700 px-4 h-14 flex items-center gap-3">
        <Link href="/games" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
        <span className="font-bold text-white flex-1">🃏 {tr("game_flashcards")}</span>
        <span className="text-xs text-slate-400">{idx + 1}/{cards.length}</span>
      </nav>

      {/* Subject selector */}
      <div className="max-w-lg mx-auto px-4 pt-4 flex gap-2 justify-center">
        {SUBJECTS.map((s) => (
          <button key={s.value} onClick={() => setSubject(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${subject === s.value ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="max-w-lg mx-auto px-4 mt-3">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="max-w-lg mx-auto px-4 mt-6">
        <div
          onClick={flip}
          className="relative cursor-pointer"
          style={{ perspective: "1200px", minHeight: "300px" }}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              minHeight: "300px",
            }}
          >
            {/* Front */}
            <div className="absolute inset-0 bg-slate-800 border border-slate-600 rounded-2xl p-6 flex flex-col justify-between"
              style={{ backfaceVisibility: "hidden" }}>
              <div className="flex justify-between items-start">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  card?.difficulty === "EASY" ? "bg-green-500/20 text-green-300" :
                  card?.difficulty === "MEDIUM" ? "bg-yellow-500/20 text-yellow-300" :
                  "bg-red-500/20 text-red-300"}`}>
                  {card?.difficulty}
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {card?.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
              <p className="text-white text-lg font-semibold text-center leading-relaxed my-4">
                {card?.question}
              </p>
              <p className="text-center text-slate-500 text-sm">Javobni ko'rish uchun bosing 👆</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-indigo-900 border border-blue-600 rounded-2xl p-6 flex flex-col justify-between"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
              <div className="text-center">
                <p className="text-blue-200 text-xs mb-2 font-semibold uppercase tracking-wide">To'g'ri javob</p>
                <p className="text-white text-xl font-bold">{card?.answer}</p>
              </div>
              {card?.explanation && (
                <div className="bg-white/10 rounded-xl p-3 text-sm text-blue-100">
                  💡 {card.explanation}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {card?.all_options.map((opt, i) => (
                  <div key={i} className={`text-xs px-3 py-2 rounded-lg ${i === card.correct_index ? "bg-green-500/30 text-green-200 border border-green-500/30" : "bg-white/5 text-slate-400"}`}>
                    {["A","B","C","D"][i]}. {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button onClick={prev} disabled={idx === 0}
            className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={markUnknown}
            className="flex-1 py-3 bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 text-red-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
            <XCircle className="w-5 h-5" /> Bilmadim
          </button>
          <button onClick={markKnown}
            className="flex-1 py-3 bg-green-600/30 hover:bg-green-600/50 border border-green-500/30 text-green-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
            <CheckCircle2 className="w-5 h-5" /> Bildim
          </button>
          <button onClick={load}
            className="p-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-3">
          ✅ Bildim: {known.size} &nbsp;|&nbsp; ❌ Bilmadim: {unknown.size} &nbsp;|&nbsp;
          <span className="text-yellow-400">🪙 +{coinsEarned} Chaqa</span>
        </p>
      </div>
    </div>
  );
}
